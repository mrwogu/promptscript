import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { parse as parseYaml } from 'yaml';
import type { UserConfig } from '@promptscript/core';

/**
 * Path to the user-level PromptScript config file.
 */
export const USER_CONFIG_PATH = join(homedir(), '.promptscript', 'config.yaml');

/**
 * Path to the system-level PromptScript config file, provisioned by IT.
 * The platform and ProgramData are parameters so both branches can be tested.
 */
export function resolveSystemConfigPath(
  platform: NodeJS.Platform = process.platform,
  programData: string | undefined = process.env['ProgramData']
): string {
  return platform === 'win32'
    ? join(programData ?? String.raw`C:\ProgramData`, 'promptscript', 'config.yaml')
    : '/etc/promptscript/config.yaml';
}

export const SYSTEM_CONFIG_PATH = resolveSystemConfigPath();

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

/**
 * Merge the system config under the user config. User values win. Sections
 * merge one level deep, so a user `registry.git` replaces the system one.
 * A system telemetry opt-out cannot be turned back on by the user.
 */
export function mergeUserConfigs(system: UserConfig, user: UserConfig): UserConfig {
  const merged: UserConfig = { ...system, ...user };
  if (system.registry && user.registry) {
    merged.registry = { ...system.registry, ...user.registry };
    // Git is picked before url, so a user url registry drops the system git
    if (user.registry.url !== undefined && !user.registry.git) {
      delete merged.registry.git;
    }
  }
  if (system.registries && user.registries) {
    merged.registries = { ...system.registries, ...user.registries };
  }
  if (system.defaults && user.defaults) {
    merged.defaults = { ...system.defaults, ...user.defaults };
  }
  if (system.telemetry === false) {
    merged.telemetry = false;
  }
  return merged;
}

/**
 * Load the user config with the system config merged under it.
 */
export async function loadUserAndSystemConfig(): Promise<UserConfig> {
  const [system, user] = await Promise.all([
    loadUserConfig(SYSTEM_CONFIG_PATH),
    loadUserConfig(USER_CONFIG_PATH),
  ]);
  return mergeUserConfigs(system, user);
}
