import { writeFile, readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';
import type { UpdateOptions } from '../types.js';
import { loadConfig, findConfigFile } from '../config/loader.js';
import { createSpinner, ConsoleOutput } from '../output/console.js';
import type { Lockfile, LockfileDependency } from '@promptscript/core';
import { LOCKFILE_VERSION, isValidLockfile } from '@promptscript/core';
import { LOCKFILE_PATH } from './lock.js';

/**
 * Re-resolve versions (ignoring current lockfile pins) and update promptscript.lock.
 *
 * When a package argument is provided, only that dependency is updated.
 * Otherwise all dependencies are re-resolved.
 *
 * NOTE: Full remote resolution requires the registry resolver pipeline.
 * This implementation updates the lockfile structure and shows before/after
 * version info from the existing lockfile.
 */
export async function updateCommand(
  packageArg: string | undefined,
  options: UpdateOptions
): Promise<void> {
  const spinner = createSpinner('Updating lockfile...').start();

  try {
    const configFile = findConfigFile();
    if (!configFile) {
      spinner.fail('No project config found');
      ConsoleOutput.muted('Run: prs init');
      process.exitCode = 1;
      return;
    }

    const config = await loadConfig();
    const aliases = config.registries ?? {};
    const aliasEntries = Object.entries(aliases);

    if (aliasEntries.length === 0) {
      spinner.warn('No registry aliases configured');
      ConsoleOutput.muted('Add registries to promptscript.yaml first');
      return;
    }

    // Load existing lockfile
    let existing: Lockfile = { version: LOCKFILE_VERSION, dependencies: {} };
    if (existsSync(LOCKFILE_PATH)) {
      try {
        const raw = await readFile(LOCKFILE_PATH, 'utf-8');
        const parsed: unknown = parseYaml(raw);
        if (isValidLockfile(parsed)) {
          existing = parsed;
        }
      } catch {
        // Start fresh
      }
    }

    // Determine which repos to update
    const allRepoUrls = aliasEntries.map(([, entry]) =>
      typeof entry === 'string' ? entry : entry.url
    );

    const toUpdate = packageArg
      ? allRepoUrls.filter((url) => url.includes(packageArg))
      : allRepoUrls;

    if (packageArg && toUpdate.length === 0) {
      spinner.fail(`No dependency matched: ${packageArg}`);
      ConsoleOutput.muted('Available: ' + allRepoUrls.join(', '));
      process.exitCode = 1;
      return;
    }

    // Build updated dependencies, showing before/after
    const updates: Array<{ repoUrl: string; before: string; after: string }> = [];
    const dependencies: Record<string, LockfileDependency> = { ...existing.dependencies };

    for (const repoUrl of toUpdate) {
      const before = existing.dependencies[repoUrl]?.version ?? '(none)';
      // In a full implementation this would fetch the latest commit/tag remotely.
      // For now we reset pins to "latest" to signal re-resolution is needed.
      const updated: LockfileDependency = {
        version: 'latest',
        commit: '0000000000000000000000000000000000000000',
        integrity: 'sha256-pending',
      };
      dependencies[repoUrl] = updated;
      updates.push({ repoUrl, before, after: updated.version });
    }

    // Preserve deps not in the update set
    for (const repoUrl of allRepoUrls) {
      if (!toUpdate.includes(repoUrl) && repoUrl in existing.dependencies) {
        dependencies[repoUrl] = existing.dependencies[repoUrl]!;
      }
    }

    const lockfile: Lockfile = { version: LOCKFILE_VERSION, dependencies };

    if (options.dryRun) {
      spinner.succeed('Dry run — lockfile not written');
      ConsoleOutput.newline();
      for (const { repoUrl, before, after } of updates) {
        console.log(`  ${repoUrl}`);
        console.log(`    ${before} → ${after}`);
      }
      return;
    }

    await writeFile(LOCKFILE_PATH, stringifyYaml(lockfile), 'utf-8');

    spinner.succeed('Lockfile updated');
    ConsoleOutput.newline();

    for (const { repoUrl, before, after } of updates) {
      ConsoleOutput.success(`${repoUrl}  ${before} → ${after}`);
    }
  } catch (error) {
    spinner.fail('Failed to update lockfile');
    ConsoleOutput.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
