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
import {
  createGitRegistry,
  isSemverRange,
  normalizeGitUrl,
  validateRemoteAccess,
  versionSatisfiesRange,
  type GitAuthOptions,
} from '@promptscript/resolver';
import { generateLockfileReferences } from './lock-references.js';
import { resolveRegistryPath } from '../utils/registry-resolver.js';

/** Path to the lockfile relative to cwd. */
export const LOCKFILE_PATH = 'promptscript.lock';
const UNRESOLVED_COMMIT = '0000000000000000000000000000000000000000';
const UNRESOLVED_INTEGRITY = 'sha256-pending';

interface RequestedDependency {
  versions: Set<string>;
  fallbackUrl?: string;
  auth?: GitAuthOptions;
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
  const isUpdateCommand = options.command === 'update';
  const spinner = createSpinner(
    isUpdateCommand ? 'Updating lockfile...' : 'Generating lockfile...'
  ).start();

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
    const defaultGitRegistry = config.registry?.git;

    // Load existing lockfile to preserve already-resolved entries
    let existing: Lockfile = { version: LOCKFILE_VERSION, dependencies: {} };
    if (existsSync(LOCKFILE_PATH)) {
      try {
        const raw = await readFile(LOCKFILE_PATH, 'utf-8');
        const parsed: unknown = parseYaml(raw, { maxAliasCount: 100 });
        if (!isValidLockfile(parsed)) {
          throw new Error('Invalid lockfile structure');
        }
        existing = parsed;
      } catch (error) {
        throw new Error(`Cannot read ${LOCKFILE_PATH}. Fix or remove the malformed lockfile.`, {
          cause: error,
        });
      }
    }

    // Scan .prs files for remote @use imports
    const projectRoot = process.cwd();
    const localPath = resolve(projectRoot, '.promptscript');
    const entryPath = config.input?.entry
      ? resolve(projectRoot, config.input.entry)
      : resolve(localPath, 'project.prs');
    const registry = await resolveRegistryPath(config, {
      ...(!options.update && Object.keys(existing.dependencies).length > 0
        ? { lockfile: existing }
        : {}),
    });
    const scannedImports = await collectRemoteImports(entryPath, {
      localPath,
      registryPath: resolve(registry.path),
      registries: config.registries,
      strict: true,
    });

    if (aliasEntries.length === 0 && scannedImports.length === 0 && !defaultGitRegistry) {
      spinner.warn('No remote dependencies found');
      ConsoleOutput.muted('Add registries to promptscript.yaml or use @use github.com/... imports');
      return;
    }

    const requestedDependencies = new Map<string, RequestedDependency>();

    if (defaultGitRegistry) {
      requestedDependencies.set(defaultGitRegistry.url, {
        versions: new Set([defaultGitRegistry.ref ?? 'main']),
        ...(defaultGitRegistry.fallbackUrl ? { fallbackUrl: defaultGitRegistry.fallbackUrl } : {}),
        ...(defaultGitRegistry.auth ? { auth: defaultGitRegistry.auth } : {}),
      });
    }

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

    const updatePackage = options.updatePackage;
    const matchingRepos = updatePackage
      ? [...requestedDependencies.keys()].filter((repoUrl) => repoUrl.includes(updatePackage))
      : [...requestedDependencies.keys()];
    if (updatePackage && matchingRepos.length === 0) {
      throw new Error(`No dependency matched: ${updatePackage}`);
    }

    const dependencies: Record<string, LockfileDependency> = {};
    for (const [repoUrl, requested] of requestedDependencies) {
      const previous = existing.dependencies[repoUrl];
      const resolved = await resolveRemoteDependency(
        repoUrl,
        [...requested.versions],
        previous,
        options.update === true && matchingRepos.includes(repoUrl),
        requested.fallbackUrl,
        requested.auth
      );
      if (previous?.skills?.length && previous.commit !== resolved.commit) {
        throw new Error(
          `${repoUrl} contains managed skills. Run "prs skills update" to refresh it atomically.`
        );
      }
      dependencies[repoUrl] = resolved;
    }

    // Preserve .md-sourced entries from previous lock (managed by `prs skills add`)
    if (existing.dependencies) {
      for (const [key, dep] of Object.entries(existing.dependencies)) {
        if (dep.source === 'md') {
          const resolved = dependencies[key];
          dependencies[key] = resolved
            ? {
                ...resolved,
                source: 'md',
                ...(dep.skills ? { skills: dep.skills } : {}),
                ...(dep.gitUrl ? { gitUrl: dep.gitUrl } : {}),
              }
            : dep;
        }
      }
    }

    const references = await generateLockfileReferences(
      config,
      entryPath,
      localPath,
      {
        version: LOCKFILE_VERSION,
        dependencies,
        ...(existing.references ? { references: existing.references } : {}),
      },
      scannedImports
    );

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

    spinner.succeed(isUpdateCommand ? 'Lockfile updated' : 'Lockfile generated');
    ConsoleOutput.success(LOCKFILE_PATH);
    ConsoleOutput.newline();
    ConsoleOutput.muted(`${Object.keys(dependencies).length} dependenc(y/ies) locked`);
    if (!isUpdateCommand) {
      ConsoleOutput.muted('Run "prs update" to re-resolve versions against the remote');
    }
  } catch (error) {
    spinner.fail(isUpdateCommand ? 'Failed to update lockfile' : 'Failed to generate lockfile');
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

export async function resolveRemoteDependency(
  repoUrl: string,
  requestedVersions: string[],
  existing: LockfileDependency | undefined,
  forceUpdate: boolean,
  fallbackUrl?: string,
  auth?: GitAuthOptions
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
    return fallbackUrl ? { ...existing, gitUrl: fallbackUrl } : existing;
  }

  const remoteUrls = [repoUrl, fallbackUrl].filter(
    (candidate): candidate is string => candidate !== undefined
  );
  let lastError: Error | undefined;

  for (const candidate of remoteUrls) {
    try {
      const remoteUrl = toRemoteUrl(candidate);
      const candidateAuth = candidate === repoUrl ? auth : undefined;
      const resolvedVersion = await resolveRequestedVersion(
        repoUrl,
        remoteUrl,
        requestedVersions,
        candidateAuth
      );
      const resolvedRef = resolvedVersion === 'latest' ? undefined : resolvedVersion;
      const validation = candidateAuth
        ? {
            accessible: true,
            headCommit: await createGitRegistry({
              url: remoteUrl,
              auth: candidateAuth,
            }).getCommitHash(resolvedRef),
          }
        : await validateRemoteAccess(remoteUrl, resolvedRef);
      if (!validation.accessible || !validation.headCommit) {
        throw new Error(validation.error ?? `Could not resolve a commit for ${repoUrl}`);
      }

      return {
        version: resolvedVersion,
        commit: validation.headCommit,
        integrity:
          existing?.commit === validation.headCommit ? existing.integrity : UNRESOLVED_INTEGRITY,
        ...(existing?.source ? { source: existing.source } : {}),
        ...(existing?.skills ? { skills: existing.skills } : {}),
        ...(fallbackUrl ? { gitUrl: fallbackUrl } : {}),
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
  requestedVersions: string[],
  auth?: GitAuthOptions
): Promise<string> {
  const explicitVersions = [
    ...new Set(requestedVersions.filter((version) => version !== 'latest')),
  ];
  if (explicitVersions.length === 0) {
    return 'latest';
  }

  if (explicitVersions.every(isSemverRange)) {
    const registry = createGitRegistry({ url: remoteUrl, auth });
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
