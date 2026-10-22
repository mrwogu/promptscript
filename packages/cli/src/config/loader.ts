import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { parse as parseYaml } from 'yaml';
import {
  deepMerge,
  ErrorCode,
  interpolateEnvVars as interpolateEnvironmentVariables,
  isPlainObject,
  PSError,
} from '@promptscript/core';
import type { PromptScriptConfig } from '@promptscript/core';
import { loadUserAndSystemConfig } from './user-config.js';
import { loadEnvOverrides } from './env-config.js';
import { deepMergeRegistry, mergeConfigs } from './merge-config.js';

/**
 * List of config file names to search for.
 */
export const CONFIG_FILES = [
  'promptscript.yaml',
  'promptscript.yml',
  '.promptscriptrc.yaml',
  '.promptscriptrc.yml',
];

/**
 * Interpolate environment variables in a string.
 * Supports ${VAR} and ${VAR:-default} syntax.
 * For missing variables without default: warns and returns empty string.
 */
export function interpolateEnvVars(text: string): string {
  return interpolateEnvironmentVariables(text, (name) => process.env[name]);
}

/**
 * Find the config file in the current directory.
 * @param customPath - Optional custom config file path.
 * @returns The path to the config file, or null if not found.
 */
export function findConfigFile(customPath?: string): string | null {
  // If a custom path is provided, use it directly
  if (customPath) {
    return existsSync(customPath) ? customPath : null;
  }

  // Check environment variable
  const envConfig = process.env['PROMPTSCRIPT_CONFIG'];
  if (envConfig && existsSync(envConfig)) {
    return envConfig;
  }

  // Search for default config files
  for (const file of CONFIG_FILES) {
    if (existsSync(file)) {
      return file;
    }
  }
  return null;
}

/**
 * Load the PromptScript configuration.
 * Follows `extends` chains, see {@link loadConfigFile}.
 * @param customPath - Optional custom config file path.
 * @returns The parsed configuration.
 * @throws Error if no config file is found or parsing fails.
 */
export async function loadConfig(customPath?: string): Promise<PromptScriptConfig> {
  const configFile = findConfigFile(customPath);

  if (!configFile) {
    if (customPath) {
      throw new Error(`Configuration file not found: ${customPath}`);
    }
    throw new Error('No PromptScript configuration found. Run: prs init');
  }

  const config: unknown = await loadConfigFile(configFile, []);
  return config as PromptScriptConfig;
}

/**
 * Parse one config file and merge it over the file named in its `extends`.
 * The base path is relative to the file that extends it. Objects merge deeply,
 * arrays and scalars from the extending file replace the base ones. The one
 * exception is `policies`: base policies are kept and the extending file's
 * policies are appended, see {@link mergePolicies}.
 */
async function loadConfigFile(
  configFile: string,
  chain: string[]
): Promise<Record<string, unknown>> {
  const absolutePath = resolve(configFile);
  if (chain.includes(absolutePath)) {
    throw new Error(`Circular config extends: ${[...chain, absolutePath].join(' -> ')}`);
  }

  let content = await readFile(configFile, 'utf-8');

  // Interpolate environment variables in the YAML content
  content = interpolateEnvVars(content);

  let config: Record<string, unknown>;
  try {
    config = parseYaml(content);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown parse error';
    throw new Error(`Failed to parse ${configFile}: ${message}`, { cause: error });
  }

  const basePath = config?.['extends'];
  if (typeof basePath !== 'string') {
    return config;
  }

  const own = { ...config };
  delete own['extends'];
  const baseFile = resolve(dirname(absolutePath), basePath);
  if (!existsSync(baseFile)) {
    throw new Error(`Extended config not found: ${baseFile} (from ${configFile})`);
  }
  const base = await loadConfigFile(baseFile, [...chain, absolutePath]);
  const merged = deepMerge(base, own, { arrayStrategy: 'replace' });
  // Registry backends follow the same rules as the other config levels
  if (base['registry'] !== undefined && own['registry'] !== undefined) {
    merged['registry'] = deepMergeRegistry(
      base['registry'] as PromptScriptConfig['registry'],
      own['registry'] as PromptScriptConfig['registry']
    );
  }
  if (own['policies'] !== undefined) {
    merged['policies'] = mergePolicies(base['policies'], own['policies'], baseFile, absolutePath);
  }
  return merged;
}

/**
 * Merge the `policies` of an extended config pair. Base policies are a floor:
 * the extending file appends its own and can neither drop nor redefine one.
 * A bare `policies:` key (parsed as null) is accepted only when the base has no policies.
 * @throws PSError when the extending file's `policies` is not a list or reuses a base policy name.
 */
function mergePolicies(base: unknown, own: unknown, baseFile: string, configFile: string): unknown {
  const basePolicies = Array.isArray(base) ? base : [];
  if (own === null && basePolicies.length === 0) {
    return null;
  }
  const location = { file: configFile, line: 1, column: 1 };
  if (!Array.isArray(own)) {
    const value = own === null ? 'null' : `a ${typeof own}`;
    throw new PSError(
      `"policies" in ${configFile} is ${value}, which would drop the policies of ${baseFile}. ` +
        'Base policies cannot be removed: delete the key to keep them or list the policies to add.',
      ErrorCode.INVALID_VALUE,
      { location }
    );
  }
  const baseNames = new Set(basePolicies.map(policyName));
  for (const policy of own) {
    const name = policyName(policy);
    if (name !== undefined && baseNames.has(name)) {
      throw new PSError(
        `Policy "${name}" in ${configFile} is already defined in ${baseFile} or a config it extends. ` +
          'Base policies cannot be redefined: rename it or change it where the base defines it.',
        ErrorCode.INVALID_VALUE,
        { location }
      );
    }
  }
  return [...basePolicies, ...own];
}

function policyName(policy: unknown): string | undefined {
  return isPlainObject(policy) && typeof policy['name'] === 'string' ? policy['name'] : undefined;
}

/**
 * Load the effective configuration by merging all config sources.
 * Priority (highest to lowest): CLI flags > env vars > project config > user config > system config.
 *
 * @param customPath - Optional custom project config file path.
 * @param cliFlags - Optional CLI flag overrides.
 * @returns The merged configuration.
 */
export async function loadEffectiveConfig(
  customPath?: string,
  cliFlags?: Partial<PromptScriptConfig>
): Promise<PromptScriptConfig> {
  const userConfig = await loadUserAndSystemConfig();
  const projectConfig = await loadConfig(customPath);
  const envOverrides = loadEnvOverrides();

  return mergeConfigs(userConfig, projectConfig, envOverrides, cliFlags);
}
