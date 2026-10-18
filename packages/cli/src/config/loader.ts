import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { parse as parseYaml } from 'yaml';
import {
  deepMerge,
  interpolateEnvVars as interpolateEnvironmentVariables,
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
 * arrays and scalars from the extending file replace the base ones.
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
  return merged;
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
