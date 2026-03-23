import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { dirname } from 'path';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';
import type { RegistryAddOptions } from '../../types.js';
import { ConsoleOutput } from '../../output/console.js';
import { validateAlias } from '@promptscript/resolver';
import { findConfigFile } from '../../config/loader.js';
import { USER_CONFIG_PATH } from '../../config/user-config.js';

/**
 * Add a registry alias to the project or global config.
 */
export async function registryAddCommand(
  alias: string,
  url: string,
  options: RegistryAddOptions
): Promise<void> {
  try {
    // Validate alias format
    if (!validateAlias(alias)) {
      ConsoleOutput.error(
        `Invalid alias "${alias}": must match @[a-z0-9][a-z0-9-]* (e.g. @company, @my-org)`
      );
      process.exitCode = 1;
      return;
    }

    if (!url || url.trim().length === 0) {
      ConsoleOutput.error('URL must not be empty');
      process.exitCode = 1;
      return;
    }

    if (options.global) {
      await addToGlobalConfig(alias, url.trim());
    } else {
      await addToProjectConfig(alias, url.trim());
    }
  } catch (error) {
    ConsoleOutput.error(
      `Failed to add registry: ${error instanceof Error ? error.message : String(error)}`
    );
    process.exitCode = 1;
  }
}

/**
 * Add alias to ~/.promptscript/config.yaml.
 */
async function addToGlobalConfig(alias: string, url: string): Promise<void> {
  const configDir = dirname(USER_CONFIG_PATH);

  // Ensure directory exists
  if (!existsSync(configDir)) {
    await mkdir(configDir, { recursive: true });
  }

  let config: Record<string, unknown> = { version: '1' };

  if (existsSync(USER_CONFIG_PATH)) {
    const content = await readFile(USER_CONFIG_PATH, 'utf-8');
    const parsed = parseYaml(content) as Record<string, unknown> | null;
    if (parsed && typeof parsed === 'object') {
      config = parsed;
    }
  }

  // Ensure registries key exists
  if (!config['registries'] || typeof config['registries'] !== 'object') {
    config['registries'] = {};
  }

  const registries = config['registries'] as Record<string, string>;
  registries[alias] = url;

  await writeFile(USER_CONFIG_PATH, stringifyYaml(config), 'utf-8');

  ConsoleOutput.success(`Added ${alias} → ${url}`);
  ConsoleOutput.muted(`Saved to: ${USER_CONFIG_PATH}`);
}

/**
 * Add alias to project promptscript.yaml.
 */
async function addToProjectConfig(alias: string, url: string): Promise<void> {
  const configFile = findConfigFile();

  if (!configFile) {
    ConsoleOutput.error('No project config found. Run: prs init');
    ConsoleOutput.muted('Or use --global to add to your global config');
    process.exitCode = 1;
    return;
  }

  const content = await readFile(configFile, 'utf-8');
  let config = parseYaml(content) as Record<string, unknown>;

  if (!config || typeof config !== 'object') {
    config = {};
  }

  // Ensure registries key exists
  if (!config['registries'] || typeof config['registries'] !== 'object') {
    config['registries'] = {};
  }

  const registries = config['registries'] as Record<string, string>;
  registries[alias] = url;

  await writeFile(configFile, stringifyYaml(config), 'utf-8');

  ConsoleOutput.success(`Added ${alias} → ${url}`);
  ConsoleOutput.muted(`Saved to: ${configFile}`);
}
