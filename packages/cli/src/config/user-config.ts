import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { parse as parseYaml } from 'yaml';
import type { UserConfig } from '@promptscript/core';

/**
 * Path to the user-level PromptScript config file.
 */
export const USER_CONFIG_PATH = join(homedir(), '.promptscript', 'config.yaml');

/**
 * Default user config returned when no config file exists.
 */
const DEFAULT_USER_CONFIG: UserConfig = {
  version: '1',
};

/**
 * Load user-level configuration from ~/.promptscript/config.yaml.
 * Returns default empty config if the file does not exist.
 */
export async function loadUserConfig(configPath: string = USER_CONFIG_PATH): Promise<UserConfig> {
  if (!existsSync(configPath)) {
    return { ...DEFAULT_USER_CONFIG };
  }

  try {
    const content = await readFile(configPath, 'utf-8');
    const parsed = parseYaml(content) as UserConfig;

    if (!parsed || typeof parsed !== 'object') {
      return { ...DEFAULT_USER_CONFIG };
    }

    return {
      ...DEFAULT_USER_CONFIG,
      ...parsed,
    };
  } catch {
    return { ...DEFAULT_USER_CONFIG };
  }
}
