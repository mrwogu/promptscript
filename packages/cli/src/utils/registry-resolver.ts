/**
 * Registry resolver utility for CLI commands.
 *
 * Handles resolving registry configuration to a local path that the compiler can use.
 * For git registries, this ensures the repository is cloned/updated in the cache.
 */

import { homedir } from 'os';
import { existsSync } from 'fs';
import { isAbsolute, join, relative, resolve, sep } from 'path';
import type { Lockfile, PromptScriptConfig } from '@promptscript/core';
import {
  createGitRegistry,
  GitCacheManager,
  loadVendorManifest,
  normalizeGitUrl,
  getCacheKey,
  isSemverRange,
  isRealPathInside,
  resolveVendoredRepository,
  verifyGitRepositoryCheckout,
  versionSatisfiesRange,
} from '@promptscript/resolver';

/**
 * Result of resolving the registry path.
 */
export interface ResolvedRegistry {
  /** Path to the registry root (for use with compiler) */
  path: string;
  /** Whether the registry was fetched from a remote source */
  isRemote: boolean;
  /** Source type of the registry */
  source: 'local' | 'git' | 'http';
}

export interface ResolveRegistryOptions {
  vendorDir?: string;
  lockfile?: Lockfile;
}

async function resolveRegistrySubPath(
  repositoryPath: string,
  subPath: string | undefined
): Promise<string> {
  if (!subPath) {
    return repositoryPath;
  }
  const result = resolve(repositoryPath, subPath);
  const relation = relative(resolve(repositoryPath), result);
  if (relation === '..' || relation.startsWith(`..${sep}`) || isAbsolute(relation)) {
    throw new Error(`Registry path escapes its repository: ${subPath}`);
  }
  if (existsSync(result) && !(await isRealPathInside(result, repositoryPath))) {
    throw new Error(`Registry path escapes its repository: ${subPath}`);
  }
  return result;
}

/**
 * Resolve the registry configuration to a local path.
 *
 * For git registries, this ensures the repository is cloned to the cache
 * and returns the cache path. For local registries, returns the configured path.
 *
 * @param config - The PromptScript configuration
 * @returns Resolved registry information with local path
 */
export async function resolveRegistryPath(
  config: PromptScriptConfig,
  options: ResolveRegistryOptions = {}
): Promise<ResolvedRegistry> {
  // Priority 1: Git registry
  if (config.registry?.git) {
    const gitConfig = config.registry.git;
    const ref = gitConfig.ref ?? 'main';
    const normalizedUrl = normalizeGitUrl(gitConfig.url);
    const lockedRepository = Object.entries(options.lockfile?.dependencies ?? {}).find(
      ([repoUrl, dependency]) =>
        normalizeGitUrl(repoUrl) === normalizedUrl ||
        (dependency.gitUrl !== undefined && normalizeGitUrl(dependency.gitUrl) === normalizedUrl)
    );
    if (
      lockedRepository &&
      lockedRepository[1].version !== ref &&
      !(isSemverRange(ref) && versionSatisfiesRange(lockedRepository[1].version, ref))
    ) {
      throw new Error(
        `Locked registry version ${lockedRepository[1].version} does not match configured ref ${ref}`
      );
    }
    const vendorManifest = options.vendorDir ? await loadVendorManifest(options.vendorDir) : null;
    if (options.vendorDir && existsSync(options.vendorDir) && !vendorManifest) {
      throw new Error(`Vendor manifest is missing: ${options.vendorDir}`);
    }
    if (options.lockfile && !lockedRepository) {
      throw new Error(`Git registry is not pinned by the lockfile: ${gitConfig.url}`);
    }
    if (options.vendorDir && vendorManifest) {
      if (!lockedRepository) {
        throw new Error(`Vendored registry is not pinned by the lockfile: ${gitConfig.url}`);
      }
      const [repoUrl, dependency] = lockedRepository;
      const repositoryPath = await resolveVendoredRepository(
        options.vendorDir,
        repoUrl,
        dependency.version,
        dependency.commit
      );
      if (!repositoryPath) {
        throw new Error(`Vendored registry is missing: ${gitConfig.url}`);
      }
      return {
        path: await resolveRegistrySubPath(repositoryPath, gitConfig.path),
        isRemote: false,
        source: 'git',
      };
    }

    // First check if we already have a valid cache
    const cacheManager = new GitCacheManager({
      ttl: config.registry.cache?.ttl,
    });

    const cachePath = cacheManager.getCachePath(normalizedUrl, ref);

    // Check if cache exists and is valid
    const isValid = await cacheManager.isValid(normalizedUrl, ref);

    if (isValid) {
      if (!lockedRepository) {
        return {
          path: await resolveRegistrySubPath(cachePath, gitConfig.path),
          isRemote: true,
          source: 'git',
        };
      }
      try {
        await verifyGitRepositoryCheckout(
          cachePath,
          '.git',
          lockedRepository[1].commit,
          new Set(['.prs-cache-meta.json'])
        );
        return {
          path: await resolveRegistrySubPath(cachePath, gitConfig.path),
          isRemote: true,
          source: 'git',
        };
      } catch {
        await cacheManager.remove(normalizedUrl, ref);
      }
    }

    // Need to clone/update - use GitRegistry
    // Note: GitRegistry creates its own cache manager internally, so the cache
    // will be written by ensureCloned() when we call fetch().
    const registry = createGitRegistry({
      url: gitConfig.url,
      fallbackUrl: gitConfig.fallbackUrl,
      ref,
      path: gitConfig.path,
      auth: gitConfig.auth,
      cache: {
        enabled: config.registry.cache?.enabled ?? true,
        ttl: config.registry.cache?.ttl,
      },
    });

    // Trigger a fetch to ensure the repo is cloned
    // We fetch registry-manifest.yaml which should always exist in a valid registry.
    // This propagates clone errors (unlike exists() which swallows them).
    try {
      await registry.fetch('registry-manifest.yaml');
    } catch (error) {
      // If manifest doesn't exist, registry might still be valid (no manifest)
      // but if it's a clone error, we should propagate it
      const message = error instanceof Error ? error.message : String(error);
      if (!message.includes('not found') && !message.includes('FileNotFoundError')) {
        throw new Error(
          `Failed to clone registry from ${gitConfig.url}: ${message}. ` +
            `Please check your network connection and registry configuration.`,
          { cause: error }
        );
      }
      // Manifest not found is OK - just means registry doesn't have one
    }
    if (lockedRepository) {
      await registry.checkoutCommit(cachePath, lockedRepository[1].commit);
      await cacheManager.touch(normalizedUrl, ref, lockedRepository[1].commit);
      await verifyGitRepositoryCheckout(
        cachePath,
        '.git',
        lockedRepository[1].commit,
        new Set(['.prs-cache-meta.json'])
      );
    }

    // Return the cache path
    return {
      path: await resolveRegistrySubPath(cachePath, gitConfig.path),
      isRemote: true,
      source: 'git',
    };
  }

  // Priority 2: HTTP registry (not fully supported for compile yet)
  if (config.registry?.url) {
    // HTTP registries would need similar caching logic
    // For now, fall back to local path
    const localPath = config.registry?.path ?? './registry';
    return {
      path: localPath,
      isRemote: true,
      source: 'http',
    };
  }

  // Priority 3: Local filesystem registry
  const registryPath = config.registry?.path ?? './registry';

  return {
    path: registryPath,
    isRemote: false,
    source: 'local',
  };
}

/**
 * Get the git cache path for a URL and ref without cloning.
 * Useful for checking if a cache exists.
 */
export function getGitCachePath(url: string, ref: string = 'main'): string {
  const normalizedUrl = normalizeGitUrl(url);
  const cacheKey = getCacheKey(normalizedUrl, ref);
  const cacheDir = join(homedir(), '.promptscript', '.cache', 'git');
  return join(cacheDir, cacheKey);
}

/**
 * Check if the registry is configured and accessible.
 * Accepts any config object with an optional registry field.
 */
export function hasRegistryConfig(config: { registry?: PromptScriptConfig['registry'] }): boolean {
  return !!(config.registry?.git || config.registry?.url || config.registry?.path);
}
