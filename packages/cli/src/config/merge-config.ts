import type { PromptScriptConfig, UserConfig } from '@promptscript/core';

/**
 * Deep merge two registry config objects.
 * Source values override target values.
 */
function deepMergeRegistry(
  target: PromptScriptConfig['registry'],
  source: PromptScriptConfig['registry']
): PromptScriptConfig['registry'] {
  if (!source) return target;
  if (!target) return source;

  const merged = { ...target };

  if (source.path !== undefined) merged.path = source.path;
  if (source.url !== undefined) merged.url = source.url;

  if (source.git) {
    const mergedAuth = source.git.auth ?? merged.git?.auth;
    merged.git = {
      ...merged.git,
      ...source.git,
      ...(mergedAuth ? { auth: mergedAuth } : {}),
    };
  }

  if (source.cache) {
    merged.cache = { ...merged.cache, ...source.cache };
  }

  if (source.auth) {
    merged.auth = { ...merged.auth, ...source.auth };
  }

  return merged;
}

/**
 * Convert UserConfig registry settings to PromptScriptConfig registry format.
 */
function userConfigToProjectRegistry(
  userRegistry: NonNullable<UserConfig['registry']>
): PromptScriptConfig['registry'] {
  const registry: PromptScriptConfig['registry'] = {};

  if (userRegistry.git) {
    registry.git = {
      url: userRegistry.git.url,
      ...(userRegistry.git.ref ? { ref: userRegistry.git.ref } : {}),
      ...(userRegistry.git.path ? { path: userRegistry.git.path } : {}),
      ...(userRegistry.git.auth ? { auth: userRegistry.git.auth } : {}),
    };
  }

  if (userRegistry.url) {
    registry.url = userRegistry.url;
  }

  if (userRegistry.cache) {
    registry.cache = { ...userRegistry.cache };
  }

  return registry;
}

/**
 * Merge configuration from multiple sources.
 * Priority (highest to lowest): CLI flags > env vars > project config > user config.
 */
export function mergeConfigs(
  userConfig: UserConfig,
  projectConfig: PromptScriptConfig,
  envOverrides: Partial<PromptScriptConfig>,
  cliFlags?: Partial<PromptScriptConfig>
): PromptScriptConfig {
  // Start with project config as the base
  const merged: PromptScriptConfig = { ...projectConfig };

  // Apply user config registry as base (lowest priority for registry)
  if (userConfig.registry) {
    const userRegistry = userConfigToProjectRegistry(userConfig.registry);
    merged.registry = deepMergeRegistry(userRegistry, merged.registry);
  }

  // Apply env overrides (higher priority than project config)
  if (envOverrides.registry) {
    merged.registry = deepMergeRegistry(merged.registry, envOverrides.registry);
  }

  // Apply CLI flags (highest priority)
  if (cliFlags?.registry) {
    merged.registry = deepMergeRegistry(merged.registry, cliFlags.registry);
  }

  // Merge targets from CLI flags if provided
  if (cliFlags?.targets) {
    merged.targets = cliFlags.targets;
  }

  return merged;
}
