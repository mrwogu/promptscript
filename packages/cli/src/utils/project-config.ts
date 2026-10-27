import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { isAbsolute, resolve } from 'node:path';
import { isValidLockfile, type Lockfile } from '@promptscript/core';
import { parse as parseYaml } from 'yaml';
import { CONFIG_FILES } from '../config/loader.js';

/**
 * Resolve universalDir config to NativeSkillOptions.
 * Default (undefined/true) is '.agents', false disables it, a string is a custom path.
 */
export function resolveUniversalDir(
  universalDir: string | boolean | undefined
): { universalDir: string } | undefined {
  if (universalDir === false) return undefined;
  if (typeof universalDir === 'string') return { universalDir };
  return { universalDir: '.agents' };
}

/** Reference roots of a Git registry checkout, keyed by its repository URL. */
export function registryReferenceRoots(registry: {
  repositoryUrl?: string;
  repositoryPath?: string;
}): Record<string, string[]> | undefined {
  const { repositoryUrl, repositoryPath } = registry;
  return repositoryUrl && repositoryPath ? { [repositoryUrl]: [repositoryPath] } : undefined;
}

/** The project lockfile, or undefined when the project has none. */
export async function loadProjectLockfile(projectRoot: string): Promise<Lockfile | undefined> {
  const lockfilePath = resolve(projectRoot, 'promptscript.lock');
  if (!existsSync(lockfilePath)) {
    return undefined;
  }
  const parsed: unknown = parseYaml(await readFile(lockfilePath, 'utf-8'), { maxAliasCount: 100 });
  if (!isValidLockfile(parsed)) {
    throw new Error(`Invalid lockfile: ${lockfilePath}`);
  }
  return parsed;
}

/** The `--cwd` and `-c, --config` options a project command accepts. */
export interface ProjectPathOptions {
  /** Path to a custom config file */
  config?: string;
  /** Working directory (project root) */
  cwd?: string;
}

/** The project root: `--cwd` when given, else the current working directory. */
export function resolveProjectRoot(options: Pick<ProjectPathOptions, 'cwd'>): string {
  return options.cwd ? resolve(options.cwd) : process.cwd();
}

/** An absolute path, resolving a relative one against the project root. */
export function resolveProjectPath(projectRoot: string, path: string): string {
  return isAbsolute(path) ? path : resolve(projectRoot, path);
}

/**
 * Find a config file in the given directory by checking all known config file names.
 */
export function findConfigInDir(dir: string): string | undefined {
  for (const file of CONFIG_FILES) {
    const fullPath = resolve(dir, file);
    if (existsSync(fullPath)) {
      return fullPath;
    }
  }
  return undefined;
}

/**
 * The config file a project command loads.
 *
 * `--config` wins. Under `--cwd`, `PROMPTSCRIPT_CONFIG` is honored relative to the
 * project root and a project without a config file is an error. Without `--cwd` the
 * result is undefined and the loader searches the current directory itself.
 */
export function resolveProjectConfigPath(
  projectRoot: string,
  options: ProjectPathOptions
): string | undefined {
  if (options.config) {
    return resolveProjectPath(projectRoot, options.config);
  }

  const environmentConfig = process.env['PROMPTSCRIPT_CONFIG'];
  if (options.cwd && environmentConfig) {
    return resolveProjectPath(projectRoot, environmentConfig);
  }

  const configPath = options.cwd ? findConfigInDir(projectRoot) : undefined;
  if (options.cwd && !configPath) {
    throw new Error(`No PromptScript configuration found in ${projectRoot}. Run: prs init`);
  }
  return configPath;
}
