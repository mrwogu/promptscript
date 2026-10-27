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
 * arrays and scalars from the extending file replace the base ones. The
 * exceptions are `policies`: base policies are kept and the extending file's
 * policies are appended, see {@link mergePolicies}; and the owner lists of
 * `governance`, which are joined, see {@link mergeGovernance}.
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
  if (own['governance'] !== undefined) {
    merged['governance'] = mergeGovernance(
      base['governance'],
      own['governance'],
      baseFile,
      absolutePath
    );
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
 * Merge the `governance` of an extended config pair. Base admins, role owners and
 * `codeowners.protect` paths are a floor like base policies: the extending file can add
 * to `admins`, add roles, add owners to a role and add protected paths, but cannot
 * remove any. Other governance keys merge like the rest of the config. A bare key
 * (parsed as null) is accepted only when the base has nothing under it.
 * @throws PSError when a value would drop base entries or a map has a `__proto__` key.
 */
function mergeGovernance(
  base: unknown,
  own: unknown,
  baseFile: string,
  configFile: string
): unknown {
  const baseGovernance = isPlainObject(base) ? base : {};
  const baseRoles = isPlainObject(baseGovernance['roles']) ? baseGovernance['roles'] : {};
  const baseCodeowners = isPlainObject(baseGovernance['codeowners'])
    ? baseGovernance['codeowners']
    : {};
  const hasFloor =
    hasEntries(baseGovernance['admins']) ||
    Object.keys(baseRoles).length > 0 ||
    hasEntries(baseCodeowners['protect']);
  if (own === null && !hasFloor) {
    return null;
  }
  const ownGovernance = ownMap(own, 'governance', baseFile, configFile);
  // Maps first: they refuse a "__proto__" key before deepMerge would assign it
  const roles =
    ownGovernance['roles'] === undefined
      ? undefined
      : mergeRoles(baseRoles, ownGovernance['roles'], baseFile, configFile);
  const codeowners =
    ownGovernance['codeowners'] === undefined
      ? undefined
      : mergeCodeowners(baseCodeowners, ownGovernance['codeowners'], baseFile, configFile);
  const merged = deepMerge(baseGovernance, ownGovernance, { arrayStrategy: 'replace' });
  const admins = unionEntries(
    'governance.admins',
    baseGovernance['admins'],
    ownGovernance['admins'],
    baseFile,
    configFile
  );
  if (admins !== undefined) merged['admins'] = admins;
  if (roles !== undefined) merged['roles'] = roles;
  if (codeowners !== undefined) merged['codeowners'] = codeowners;
  return merged;
}

function hasEntries(value: unknown): boolean {
  return Array.isArray(value) && value.length > 0;
}

function mergeCodeowners(
  baseCodeowners: Record<string, unknown>,
  own: unknown,
  baseFile: string,
  configFile: string
): unknown {
  if (own === null && !hasEntries(baseCodeowners['protect'])) {
    return null;
  }
  const ownCodeowners = ownMap(own, 'governance.codeowners', baseFile, configFile);
  const merged: Record<string, unknown> = { ...baseCodeowners, ...ownCodeowners };
  const protect = unionEntries(
    'governance.codeowners.protect',
    baseCodeowners['protect'],
    ownCodeowners['protect'],
    baseFile,
    configFile
  );
  if (protect !== undefined) merged['protect'] = protect;
  return merged;
}

function mergeRoles(
  baseRoles: Record<string, unknown>,
  own: unknown,
  baseFile: string,
  configFile: string
): unknown {
  if (own === null && Object.keys(baseRoles).length === 0) {
    return null;
  }
  const ownRoles = ownMap(own, 'governance.roles', baseFile, configFile);
  const merged: Record<string, unknown> = { ...baseRoles };
  for (const role of Object.keys(ownRoles)) {
    const baseOwners = Object.hasOwn(baseRoles, role) ? baseRoles[role] : undefined;
    merged[role] = unionEntries(
      `governance.roles.${role}`,
      baseOwners,
      ownRoles[role],
      baseFile,
      configFile
    );
  }
  return merged;
}

/** Base entries first, then the extending file's new ones. */
function unionEntries(
  key: string,
  base: unknown,
  own: unknown,
  baseFile: string,
  configFile: string
): unknown {
  if (own === undefined) {
    return base;
  }
  const baseOwners = Array.isArray(base) ? base : [];
  if (own === null && baseOwners.length === 0) {
    return null;
  }
  if (!Array.isArray(own)) {
    throw droppedEntries(key, own, baseFile, configFile);
  }
  return [...new Set([...baseOwners, ...own])];
}

function ownMap(
  value: unknown,
  key: string,
  baseFile: string,
  configFile: string
): Record<string, unknown> {
  if (!isPlainObject(value)) {
    throw droppedEntries(key, value, baseFile, configFile);
  }
  if (Object.hasOwn(value, '__proto__')) {
    throw new PSError(
      `"${key}" in ${configFile} has a "__proto__" key. Remove it: the name is reserved.`,
      ErrorCode.INVALID_VALUE,
      { location: { file: configFile, line: 1, column: 1 } }
    );
  }
  return value;
}

function droppedEntries(
  key: string,
  value: unknown,
  baseFile: string,
  configFile: string
): PSError {
  return new PSError(
    `"${key}" in ${configFile} is ${describeValue(value)}, which would drop entries set in ${baseFile} or a config it extends. ` +
      'Base admins, role owners and protected paths cannot be removed: delete the key to keep them or list the entries to add.',
    ErrorCode.INVALID_VALUE,
    { location: { file: configFile, line: 1, column: 1 } }
  );
}

function describeValue(value: unknown): string {
  if (value === null) return 'null';
  return Array.isArray(value) ? 'a list' : `a ${typeof value}`;
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
