import { existsSync } from 'node:fs';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import { parseDocument } from 'yaml';
import { resolveTelemetryConfig, type ResolvedTelemetryConfig } from '@promptscript/telemetry';
import { CONFIG_FILES, loadConfig } from '../config/loader.js';
import { USER_CONFIG_PATH } from '../config/user-config.js';

export interface CliTelemetryConfigOptions {
  cwd?: string;
  config?: string;
  cacheDirectory?: string;
  userConfigPath?: string;
}

function resolveFrom(baseDirectory: string, value: string): string {
  return isAbsolute(value) ? value : resolve(baseDirectory, value);
}

function findProjectConfig(cwd: string, customPath: string | undefined): string | null {
  if (customPath !== undefined) {
    const path = resolveFrom(cwd, customPath);
    return existsSync(path) ? path : null;
  }
  const environmentPath = process.env['PROMPTSCRIPT_CONFIG'];
  if (environmentPath !== undefined && environmentPath !== '') {
    const path = resolveFrom(cwd, environmentPath);
    return existsSync(path) ? path : null;
  }
  for (const file of CONFIG_FILES) {
    const path = join(cwd, file);
    if (existsSync(path)) {
      return path;
    }
  }
  return null;
}

function isNodeError(error: unknown, code: string): boolean {
  return error instanceof Error && 'code' in error && error.code === code;
}

async function readUserTelemetrySetting(
  configPath: string
): Promise<{ enabled?: boolean; valid: boolean }> {
  let source: string;
  try {
    source = await readFile(configPath, 'utf8');
  } catch (error) {
    return isNodeError(error, 'ENOENT') ? { valid: true } : { valid: false };
  }

  try {
    const document = parseDocument(source);
    if (document.errors.length > 0) {
      return { valid: false };
    }
    const value: unknown = document.get('telemetry');
    if (value === undefined) {
      return { valid: true };
    }
    return typeof value === 'boolean' ? { enabled: value, valid: true } : { valid: false };
  } catch {
    return { valid: false };
  }
}

export async function resolveCliTelemetryConfig(
  options: CliTelemetryConfigOptions = {}
): Promise<ResolvedTelemetryConfig> {
  const cwd = options.cwd === undefined ? process.cwd() : resolve(process.cwd(), options.cwd);
  const userSetting = await readUserTelemetrySetting(options.userConfigPath ?? USER_CONFIG_PATH);
  const projectPath = findProjectConfig(cwd, options.config);
  const environmentConfig = process.env['PROMPTSCRIPT_CONFIG'];
  const projectConfigRequested =
    options.config !== undefined || (environmentConfig !== undefined && environmentConfig !== '');
  let projectEnabled: boolean | undefined;
  let configurationValid = userSetting.valid;

  if (projectConfigRequested && projectPath === null) {
    configurationValid = false;
  } else if (projectPath !== null) {
    try {
      const value = (await loadConfig(projectPath)).telemetry;
      if (value === undefined || typeof value === 'boolean') {
        projectEnabled = value;
      } else {
        configurationValid = false;
      }
    } catch {
      configurationValid = false;
    }
  }

  return resolveTelemetryConfig({
    environment: process.env,
    userEnabled: userSetting.enabled,
    projectEnabled,
    configurationValid,
    ...(options.cacheDirectory === undefined ? {} : { cacheDirectory: options.cacheDirectory }),
  });
}

export async function setUserTelemetryEnabled(
  enabled: boolean,
  configPath: string = USER_CONFIG_PATH
): Promise<void> {
  let source = "version: '1'\n";
  try {
    source = await readFile(configPath, 'utf8');
  } catch (error) {
    if (!isNodeError(error, 'ENOENT')) {
      throw error;
    }
  }
  const document = parseDocument(source);
  if (document.errors.length > 0) {
    throw new Error(`Cannot update invalid YAML user config: ${configPath}`);
  }
  document.set('telemetry', enabled);
  await mkdir(dirname(configPath), { recursive: true });
  const temporaryPath = `${configPath}.${process.pid}.tmp`;
  await writeFile(temporaryPath, document.toString(), { encoding: 'utf8', mode: 0o600 });
  await rename(temporaryPath, configPath);
}
