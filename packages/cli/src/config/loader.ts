import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { parse as parseYaml } from 'yaml';
import type { PromptScriptConfig } from '@promptscript/core';
import { loadUserConfig } from './user-config.js';
import { loadEnvOverrides } from './env-config.js';
import { mergeConfigs } from './merge-config.js';

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
function interpolateEnvVars(text: string): string {
  // Match ${VAR} or ${VAR:-default}
  // VAR must start with letter or underscore, followed by word characters
  const envVarPattern = /\$\{([A-Za-z_]\w*)(?::-([^}]*))?\}/g;

  return text.replace(envVarPattern, (_match, varName: string, defaultValue?: string) => {
    const envValue = process.env[varName];

    if (envValue !== undefined) {
      return envValue;
    }

    if (defaultValue !== undefined) {
      return defaultValue;
    }

    // Warn and return empty string (like Linux behavior)
    console.warn(`Warning: Environment variable '${varName}' is not set, using empty string`);
    return '';
  });
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

  let content = await readFile(configFile, 'utf-8');

  // Interpolate environment variables in the YAML content
  content = interpolateEnvVars(content);

  try {
    return parseYaml(content) as PromptScriptConfig;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown parse error';
    throw new Error(`Failed to parse ${configFile}: ${message}`);
  }
}

/**
 * Load the effective configuration by merging all config sources.
 * Priority (highest to lowest): CLI flags > env vars > project config > user config.
 *
 * @param customPath - Optional custom project config file path.
 * @param cliFlags - Optional CLI flag overrides.
 * @returns The merged configuration.
 */
export async function loadEffectiveConfig(
  customPath?: string,
  cliFlags?: Partial<PromptScriptConfig>
): Promise<PromptScriptConfig> {
  const userConfig = await loadUserConfig();
  const projectConfig = await loadConfig(customPath);
  const envOverrides = loadEnvOverrides();

  return mergeConfigs(userConfig, projectConfig, envOverrides, cliFlags);
}
