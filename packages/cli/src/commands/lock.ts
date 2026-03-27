import { writeFile, readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { resolve } from 'path';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';
import type { LockOptions } from '../types.js';
import { loadConfig, findConfigFile } from '../config/loader.js';
import { createSpinner, ConsoleOutput } from '../output/console.js';
import type { Lockfile, LockfileDependency } from '@promptscript/core';
import { LOCKFILE_VERSION, isValidLockfile } from '@promptscript/core';
import { collectRemoteImports } from './lock-scanner.js';

/** Path to the lockfile relative to cwd. */
export const LOCKFILE_PATH = 'promptscript.lock';

/**
 * Generate or update promptscript.lock by resolving all remote imports.
 *
 * This command collects all registry aliases configured in the project and
 * global config, then writes a lockfile that pins each dependency to a
 * resolved version and commit hash for reproducible builds.
 *
 * NOTE: Full remote resolution (actual git fetching) requires the registry
 * resolver pipeline. This implementation records the configured aliases as
 * pending dependencies and preserves any previously-resolved entries.
 */
export async function lockCommand(options: LockOptions): Promise<void> {
  const spinner = createSpinner('Generating lockfile...').start();

  try {
    const configFile = findConfigFile();
    if (!configFile) {
      spinner.fail('No project config found');
      ConsoleOutput.muted('Run: prs init');
      process.exitCode = 1;
      return;
    }

    const config = await loadConfig();

    // Collect registry aliases from config
    const aliases = config.registries ?? {};
    const aliasEntries = Object.entries(aliases);

    // Scan .prs files for remote @use imports
    const projectRoot = process.cwd();
    const localPath = resolve(projectRoot, '.promptscript');
    const entryPath = config.input?.entry
      ? resolve(projectRoot, config.input.entry)
      : resolve(localPath, 'project.prs');
    const scannedImports = await collectRemoteImports(entryPath, {
      localPath,
      registries: config.registries,
    });

    if (aliasEntries.length === 0 && scannedImports.length === 0) {
      spinner.warn('No remote dependencies found');
      ConsoleOutput.muted('Add registries to promptscript.yaml or use @use github.com/... imports');
      return;
    }

    // Load existing lockfile to preserve already-resolved entries
    let existing: Lockfile = { version: LOCKFILE_VERSION, dependencies: {} };
    if (existsSync(LOCKFILE_PATH)) {
      try {
        const raw = await readFile(LOCKFILE_PATH, 'utf-8');
        const parsed: unknown = parseYaml(raw, { maxAliasCount: 100 });
        if (isValidLockfile(parsed)) {
          existing = parsed;
        }
      } catch {
        // Ignore malformed lockfile — start fresh
      }
    }

    // Build dependencies map
    const dependencies: Record<string, LockfileDependency> = {};

    for (const [, entry] of aliasEntries) {
      const repoUrl = typeof entry === 'string' ? entry : entry.url;

      // Preserve existing pin if present; otherwise record a placeholder
      // (a real implementation would resolve the latest commit here)
      if (repoUrl in existing.dependencies) {
        dependencies[repoUrl] = existing.dependencies[repoUrl]!;
      } else {
        dependencies[repoUrl] = {
          version: 'latest',
          commit: '0000000000000000000000000000000000000000',
          integrity: 'sha256-pending',
        };
      }
    }

    // Add scanned @use imports (deduplicated by repoUrl — lockfile pins at
    // repo granularity since all paths within a repo share the same commit)
    for (const imp of scannedImports) {
      if (imp.repoUrl in dependencies) continue;
      if (imp.repoUrl in existing.dependencies) {
        dependencies[imp.repoUrl] = existing.dependencies[imp.repoUrl]!;
      } else {
        dependencies[imp.repoUrl] = {
          version: imp.version || 'latest',
          commit: '0000000000000000000000000000000000000000',
          integrity: 'sha256-pending',
        };
      }
    }

    // Preserve .md-sourced entries from previous lock (managed by `prs skills add`)
    if (existing.dependencies) {
      for (const [key, dep] of Object.entries(existing.dependencies)) {
        if (dep.source === 'md') {
          dependencies[key] = dep;
        }
      }
    }

    const lockfile: Lockfile = { version: LOCKFILE_VERSION, dependencies };

    if (options.dryRun) {
      spinner.succeed('Dry run — lockfile not written');
      ConsoleOutput.newline();
      console.log(stringifyYaml(lockfile));
      return;
    }

    await writeFile(LOCKFILE_PATH, stringifyYaml(lockfile), 'utf-8');

    spinner.succeed('Lockfile generated');
    ConsoleOutput.success(LOCKFILE_PATH);
    ConsoleOutput.newline();
    ConsoleOutput.muted(`${Object.keys(dependencies).length} dependenc(y/ies) locked`);
    ConsoleOutput.muted('Run "prs update" to re-resolve versions against the remote');
  } catch (error) {
    spinner.fail('Failed to generate lockfile');
    ConsoleOutput.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
