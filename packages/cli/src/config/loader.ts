import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { parse as parseYaml } from 'yaml';
import type { PromptScriptConfig } from '@promptscript/core';

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
 * Find the config file in the current directory.
 * @returns The path to the config file, or null if not found.
 */
export function findConfigFile(): string | null {
  for (const file of CONFIG_FILES) {
    if (existsSync(file)) {
      return file;
    }
  }
  return null;
}

/**
 * Load the PromptScript configuration from the current directory.
 * @returns The parsed configuration.
 * @throws Error if no config file is found or parsing fails.
 */
export async function loadConfig(): Promise<PromptScriptConfig> {
  const configFile = findConfigFile();

  if (!configFile) {
    throw new Error('No PromptScript configuration found. Run: prs init');
  }

  const content = await readFile(configFile, 'utf-8');

  try {
    return parseYaml(content) as PromptScriptConfig;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown parse error';
    throw new Error(`Failed to parse ${configFile}: ${message}`);
  }
}
