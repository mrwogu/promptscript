import type { PromptScriptConfig } from '@promptscript/core';

/**
 * Environment variable mappings for PromptScript configuration.
 */
const ENV_MAPPINGS = {
  PROMPTSCRIPT_REGISTRY_GIT_URL: 'registry.git.url',
  PROMPTSCRIPT_REGISTRY_GIT_REF: 'registry.git.ref',
  PROMPTSCRIPT_REGISTRY_URL: 'registry.url',
  PROMPTSCRIPT_CACHE_TTL: 'registry.cache.ttl',
  PROMPTSCRIPT_CACHE_ENABLED: 'registry.cache.enabled',
} as const;

/**
 * Load configuration overrides from environment variables.
 *
 * Supported env vars:
 * - PROMPTSCRIPT_REGISTRY_GIT_URL → registry.git.url
 * - PROMPTSCRIPT_REGISTRY_GIT_REF → registry.git.ref
 * - PROMPTSCRIPT_REGISTRY_URL → registry.url
 * - PROMPTSCRIPT_CACHE_TTL → registry.cache.ttl (parsed as number)
 * - PROMPTSCRIPT_CACHE_ENABLED → registry.cache.enabled (parsed as boolean)
 */
export function loadEnvOverrides(): Partial<PromptScriptConfig> {
  const overrides: Partial<PromptScriptConfig> = {};

  const gitUrl =
    process.env[ENV_MAPPINGS.PROMPTSCRIPT_REGISTRY_GIT_URL] ??
    process.env['PROMPTSCRIPT_REGISTRY_GIT_URL'];
  const gitRef = process.env['PROMPTSCRIPT_REGISTRY_GIT_REF'];
  const registryUrl = process.env['PROMPTSCRIPT_REGISTRY_URL'];
  const cacheTtl = process.env['PROMPTSCRIPT_CACHE_TTL'];
  const cacheEnabled = process.env['PROMPTSCRIPT_CACHE_ENABLED'];

  const hasGit = gitUrl || gitRef;
  const hasCache = cacheTtl || cacheEnabled;
  const hasRegistry = hasGit || registryUrl || hasCache;

  if (!hasRegistry) {
    return overrides;
  }

  const registry: NonNullable<PromptScriptConfig['registry']> = {};

  if (hasGit) {
    registry.git = {
      url: gitUrl ?? '',
      ...(gitRef ? { ref: gitRef } : {}),
    };
  }

  if (registryUrl) {
    registry.url = registryUrl;
  }

  if (hasCache) {
    registry.cache = {};
    if (cacheTtl) {
      const parsed = parseInt(cacheTtl, 10);
      if (!isNaN(parsed)) {
        registry.cache.ttl = parsed;
      }
    }
    if (cacheEnabled !== undefined) {
      registry.cache.enabled = cacheEnabled === 'true' || cacheEnabled === '1';
    }
  }

  overrides.registry = registry;

  return overrides;
}
