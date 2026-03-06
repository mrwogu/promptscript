import type { PromptScriptConfig } from '@promptscript/core';

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

  const gitUrl = process.env['PROMPTSCRIPT_REGISTRY_GIT_URL'];
  const gitRef = process.env['PROMPTSCRIPT_REGISTRY_GIT_REF'];
  const registryUrl = process.env['PROMPTSCRIPT_REGISTRY_URL'];
  const cacheTtl = process.env['PROMPTSCRIPT_CACHE_TTL'];
  const cacheEnabled = process.env['PROMPTSCRIPT_CACHE_ENABLED'];

  const hasCache = cacheTtl || cacheEnabled;
  const hasRegistry = gitUrl || gitRef || registryUrl || hasCache;

  if (!hasRegistry) {
    return overrides;
  }

  const registry: NonNullable<PromptScriptConfig['registry']> = {};

  if (gitUrl) {
    registry.git = {
      url: gitUrl,
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
