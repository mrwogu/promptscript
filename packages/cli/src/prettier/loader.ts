import { existsSync } from 'fs';
import { readFile } from 'fs/promises';
import { join, dirname, resolve } from 'path';
import { parse as parseYaml } from 'yaml';
import type { PrettierMarkdownOptions, PromptScriptConfig } from '@promptscript/core';
import { DEFAULT_PRETTIER_OPTIONS } from '@promptscript/core';

/**
 * List of Prettier config file names to search for, in priority order.
 */
export const PRETTIER_CONFIG_FILES = [
  '.prettierrc',
  '.prettierrc.json',
  '.prettierrc.yaml',
  '.prettierrc.yml',
];

/**
 * Find a Prettier config file starting from the given directory.
 * Searches upward through parent directories until found.
 *
 * @param startDir - Directory to start searching from
 * @returns Path to the config file, or null if not found
 */
export function findPrettierConfig(startDir: string = process.cwd()): string | null {
  let currentDir = resolve(startDir);
  const root = dirname(currentDir);

  // Stop at filesystem root
  while (currentDir !== root) {
    for (const configFile of PRETTIER_CONFIG_FILES) {
      const configPath = join(currentDir, configFile);
      if (existsSync(configPath)) {
        return configPath;
      }
    }
    currentDir = dirname(currentDir);
  }

  // Check root directory too
  for (const configFile of PRETTIER_CONFIG_FILES) {
    const configPath = join(currentDir, configFile);
    if (existsSync(configPath)) {
      return configPath;
    }
  }

  return null;
}

/**
 * Load and parse a Prettier config file.
 * Supports JSON and YAML formats.
 *
 * @param configPath - Path to the Prettier config file
 * @returns Parsed config object with markdown-relevant options
 */
export async function loadPrettierConfig(
  configPath: string
): Promise<PrettierMarkdownOptions | null> {
  try {
    const content = await readFile(configPath, 'utf-8');
    const isYaml = configPath.endsWith('.yaml') || configPath.endsWith('.yml');

    // Try to parse as YAML first for .prettierrc (can be JSON or YAML)
    // YAML parser can handle JSON too
    let parsed: unknown;
    if (isYaml || configPath.endsWith('.prettierrc')) {
      try {
        parsed = parseYaml(content);
      } catch {
        // If YAML parsing fails for .prettierrc, try JSON
        parsed = JSON.parse(content);
      }
    } else {
      parsed = JSON.parse(content);
    }

    if (!parsed || typeof parsed !== 'object') {
      return null;
    }

    // Extract markdown-relevant options
    const config = parsed as Record<string, unknown>;
    const result: PrettierMarkdownOptions = {};

    if (typeof config['proseWrap'] === 'string') {
      const proseWrap = config['proseWrap'];
      if (proseWrap === 'always' || proseWrap === 'never' || proseWrap === 'preserve') {
        result.proseWrap = proseWrap;
      }
    }

    if (typeof config['tabWidth'] === 'number') {
      result.tabWidth = config['tabWidth'];
    }

    if (typeof config['printWidth'] === 'number') {
      result.printWidth = config['printWidth'];
    }

    return result;
  } catch {
    // If we can't read or parse the file, return null
    return null;
  }
}

/**
 * Resolve Prettier options from PromptScript config.
 *
 * Resolution order:
 * 1. Explicit options in formatting config (proseWrap, tabWidth, printWidth)
 * 2. Options from prettier field if it's an object
 * 3. Options from .prettierrc if prettier is true or a path
 * 4. Default options
 *
 * @param config - PromptScript config (optional)
 * @param basePath - Base directory for resolving paths
 * @returns Resolved Prettier options
 */
export async function resolvePrettierOptions(
  config?: PromptScriptConfig,
  basePath: string = process.cwd()
): Promise<PrettierMarkdownOptions> {
  const formatting = config?.formatting;

  // If no formatting config, return defaults
  if (!formatting) {
    return { ...DEFAULT_PRETTIER_OPTIONS };
  }

  // Start with defaults
  const result: PrettierMarkdownOptions = { ...DEFAULT_PRETTIER_OPTIONS };

  // Handle prettier field
  const prettier = formatting.prettier;

  if (prettier === true) {
    // Auto-detect .prettierrc
    const configPath = findPrettierConfig(basePath);
    if (configPath) {
      const loadedOptions = await loadPrettierConfig(configPath);
      if (loadedOptions) {
        Object.assign(result, loadedOptions);
      }
    }
  } else if (typeof prettier === 'string') {
    // Explicit path to .prettierrc
    const configPath = resolve(basePath, prettier);
    if (existsSync(configPath)) {
      const loadedOptions = await loadPrettierConfig(configPath);
      if (loadedOptions) {
        Object.assign(result, loadedOptions);
      }
    }
  } else if (prettier && typeof prettier === 'object') {
    // Explicit options in prettier field
    Object.assign(result, prettier);
  }

  // Override with explicit shorthand options
  if (formatting.proseWrap !== undefined) {
    result.proseWrap = formatting.proseWrap;
  }
  if (formatting.tabWidth !== undefined) {
    result.tabWidth = formatting.tabWidth;
  }
  if (formatting.printWidth !== undefined) {
    result.printWidth = formatting.printWidth;
  }

  return result;
}
