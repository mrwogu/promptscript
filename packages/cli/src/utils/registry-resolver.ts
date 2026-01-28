/**
 * Registry resolver utility for CLI commands.
 *
 * Handles resolving registry configuration to a local path that the compiler can use.
 * For git registries, this ensures the repository is cloned/updated in the cache.
 */

import { homedir } from 'os';
import { join } from 'path';
import type { PromptScriptConfig } from '@promptscript/core';
import {
  createGitRegistry,
  GitCacheManager,
  normalizeGitUrl,
  getCacheKey,
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

/**
 * Resolve the registry configuration to a local path.
 *
 * For git registries, this ensures the repository is cloned to the cache
 * and returns the cache path. For local registries, returns the configured path.
 *
 * @param config - The PromptScript configuration
 * @returns Resolved registry information with local path
 */
export async function resolveRegistryPath(config: PromptScriptConfig): Promise<ResolvedRegistry> {
  // Priority 1: Git registry
  if (config.registry?.git) {
    const gitConfig = config.registry.git;
    const ref = gitConfig.ref ?? 'main';

    // First check if we already have a valid cache
    const cacheManager = new GitCacheManager({
      ttl: config.registry.cache?.ttl,
    });

    const normalizedUrl = normalizeGitUrl(gitConfig.url);
    const cachePath = cacheManager.getCachePath(normalizedUrl, ref);

    // Check if cache exists and is valid
    const isValid = await cacheManager.isValid(normalizedUrl, ref);

    if (isValid) {
      // Use existing cache
      const subPath = gitConfig.path ?? '';
      return {
        path: subPath ? join(cachePath, subPath) : cachePath,
        isRemote: true,
        source: 'git',
      };
    }

    // Need to clone/update - use GitRegistry
    // Note: GitRegistry creates its own cache manager internally, so the cache
    // will be written by ensureCloned() when we call fetch().
    const registry = createGitRegistry({
      url: gitConfig.url,
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
            `Please check your network connection and registry configuration.`
        );
      }
      // Manifest not found is OK - just means registry doesn't have one
    }

    // Return the cache path
    const subPath = gitConfig.path ?? '';
    return {
      path: subPath ? join(cachePath, subPath) : cachePath,
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
