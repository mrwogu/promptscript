import { writeFile, readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { resolve } from 'path';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';
import type { LockOptions } from '../types.js';
import { loadConfig, findConfigFile } from '../config/loader.js';
import { createSpinner, ConsoleOutput } from '../output/console.js';
import type { Lockfile, LockfileDependency, LockfileReference } from '@promptscript/core';
import { LOCKFILE_VERSION, isValidLockfile } from '@promptscript/core';
import { collectRemoteImports } from './lock-scanner.js';
import {
  createGitRegistry,
  isSemverRange,
  normalizeGitUrl,
  validateRemoteAccess,
  versionSatisfiesRange,
} from '@promptscript/resolver';

/** Path to the lockfile relative to cwd. */
export const LOCKFILE_PATH = 'promptscript.lock';
const UNRESOLVED_COMMIT = '0000000000000000000000000000000000000000';
const UNRESOLVED_INTEGRITY = 'sha256-pending';

interface RequestedDependency {
  versions: Set<string>;
  fallbackUrl?: string;
}

/**
 * Generate or update promptscript.lock by resolving all remote imports.
 *
 * This command collects all registry aliases configured in the project and
 * global config, then writes a lockfile that pins each dependency to a
 * resolved version and commit hash for reproducible builds.
 *
 * Existing pins are preserved unless --update is used.
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

    const requestedDependencies = new Map<string, RequestedDependency>();

    for (const [, entry] of aliasEntries) {
      const repoUrl = typeof entry === 'string' ? entry : entry.url;
      const requested = requestedDependencies.get(repoUrl) ?? {
        versions: new Set<string>(),
      };
      requested.versions.add('latest');
      if (typeof entry !== 'string' && entry.fallbackUrl) {
        requested.fallbackUrl = entry.fallbackUrl;
      }
      requestedDependencies.set(repoUrl, requested);
    }

    for (const imp of scannedImports) {
      const requestedVersion = imp.version || 'latest';
      const requested = requestedDependencies.get(imp.repoUrl) ?? {
        versions: new Set<string>(),
      };
      requested.versions.add(requestedVersion);
      requestedDependencies.set(imp.repoUrl, requested);
    }

    const dependencies: Record<string, LockfileDependency> = {};
    for (const [repoUrl, requested] of requestedDependencies) {
      dependencies[repoUrl] = await resolveDependency(
        repoUrl,
        [...requested.versions],
        existing.dependencies[repoUrl],
        options.update === true,
        requested.fallbackUrl
      );
    }

    // Preserve .md-sourced entries from previous lock (managed by `prs skills add`)
    if (existing.dependencies) {
      for (const [key, dep] of Object.entries(existing.dependencies)) {
        if (dep.source === 'md') {
          dependencies[key] = dep;
        }
      }
    }

    const references: Record<string, LockfileReference> = {};

    const lockfile: Lockfile = {
      version: LOCKFILE_VERSION,
      dependencies,
      ...(Object.keys(references).length > 0 ? { references } : {}),
    };

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

function hasResolvedPin(dependency: LockfileDependency | undefined): boolean {
  return (
    dependency !== undefined &&
    dependency.commit !== UNRESOLVED_COMMIT &&
    /^[0-9a-f]{40}$/i.test(dependency.commit)
  );
}

function toRemoteUrl(repoUrl: string): string {
  if (repoUrl.startsWith('git@') || /^ssh:\/\//i.test(repoUrl) || /^file:\/\//i.test(repoUrl)) {
    return repoUrl;
  }
  const withProtocol = /^[a-z][a-z\d+.-]*:\/\//i.test(repoUrl) ? repoUrl : `https://${repoUrl}`;
  return normalizeGitUrl(withProtocol);
}

async function resolveDependency(
  repoUrl: string,
  requestedVersions: string[],
  existing: LockfileDependency | undefined,
  forceUpdate: boolean,
  fallbackUrl?: string
): Promise<LockfileDependency> {
  const canReuse =
    !forceUpdate &&
    hasResolvedPin(existing) &&
    requestedVersions.every(
      (version) =>
        version === 'latest' ||
        existing?.version === version ||
        (existing !== undefined &&
          isSemverRange(version) &&
          versionSatisfiesRange(existing.version, version))
    );
  if (canReuse && existing) {
    return existing;
  }

  const remoteUrls = [repoUrl, fallbackUrl].filter(
    (candidate): candidate is string => candidate !== undefined
  );
  let lastError: Error | undefined;

  for (const candidate of remoteUrls) {
    try {
      const remoteUrl = toRemoteUrl(candidate);
      const resolvedVersion = await resolveRequestedVersion(repoUrl, remoteUrl, requestedVersions);
      const validation = await validateRemoteAccess(
        remoteUrl,
        resolvedVersion === 'latest' ? undefined : resolvedVersion
      );
      if (!validation.accessible || !validation.headCommit) {
        throw new Error(validation.error ?? `Could not resolve a commit for ${repoUrl}`);
      }

      return {
        version: resolvedVersion,
        commit: validation.headCommit,
        integrity:
          existing?.commit === validation.headCommit ? existing.integrity : UNRESOLVED_INTEGRITY,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
    }
  }

  throw lastError ?? new Error(`Could not resolve ${repoUrl}`);
}

async function resolveRequestedVersion(
  repoUrl: string,
  remoteUrl: string,
  requestedVersions: string[]
): Promise<string> {
  const explicitVersions = [
    ...new Set(requestedVersions.filter((version) => version !== 'latest')),
  ];
  if (explicitVersions.length === 0) {
    return 'latest';
  }

  if (explicitVersions.every(isSemverRange)) {
    const registry = createGitRegistry({ url: remoteUrl });
    const matchedVersion = await registry.resolveVersion(remoteUrl, explicitVersions);
    if (!matchedVersion) {
      throw new Error(`No remote version of ${repoUrl} matches ${explicitVersions.join(', ')}`);
    }
    return matchedVersion;
  } else if (explicitVersions.length === 1) {
    return explicitVersions[0]!;
  }

  throw new Error(`Conflicting versions requested for ${repoUrl}: ${explicitVersions.join(', ')}`);
}
