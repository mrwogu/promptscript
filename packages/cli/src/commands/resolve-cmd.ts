import { existsSync, readFileSync, statSync } from 'fs';
import { join, resolve } from 'path';
import { homedir } from 'os';
import { parse as parseYaml } from 'yaml';
import type { Lockfile, LockfileDependency, PathReference } from '@promptscript/core';
import { isValidLockfile } from '@promptscript/core';
import { parse } from '@promptscript/parser';
import type { ResolveCommandOptions } from '../types.js';
import { loadConfig, findConfigFile } from '../config/loader.js';
import { loadUserConfig } from '../config/user-config.js';
import { ConsoleOutput } from '../output/console.js';
import {
  FileLoader,
  RegistryCache,
  isInsideCachePath,
  isRealPathInside,
  loadVendorManifest,
  parseRegistryMarker,
  resolveVendoredRepository,
  validateAlias,
  verifyGitRepositoryCheckout,
} from '@promptscript/resolver';

/** Base directory for the PromptScript cache. */
const CACHE_BASE = join(homedir(), '.promptscript', 'cache');
const LOCKFILE_PATH = 'promptscript.lock';
const VENDOR_DIR = '.promptscript/vendor';

interface ResolutionInfo {
  import: string;
  kind: 'local' | 'registry';
  alias?: string;
  repoUrl?: string;
  path: string;
  requestedVersion?: string;
  lockedVersion?: string;
  commit?: string;
  source?: 'vendor' | 'cache' | 'stale cache' | 'missing';
  location: string;
  exists: boolean;
  type: string;
}

function loadLockfile(): Lockfile | undefined {
  if (!existsSync(LOCKFILE_PATH)) {
    return undefined;
  }
  const parsed: unknown = parseYaml(readFileSync(LOCKFILE_PATH, 'utf-8'), { maxAliasCount: 100 });
  if (!isValidLockfile(parsed)) {
    throw new Error(`Invalid lockfile: ${resolve(LOCKFILE_PATH)}`);
  }
  return parsed;
}

function normalizeLockKey(value: string): string {
  return value
    .replace(/^(?:https?:\/\/|git:\/\/)/i, '')
    .replace(/^git@([^:]+):/, '$1/')
    .replace(/\.git(?=\/|$)/, '');
}

function findLockEntry(
  lockfile: Lockfile | undefined,
  repoUrl: string,
  path: string
): [string, LockfileDependency] | undefined {
  const normalizedRepoUrl = normalizeLockKey(repoUrl);
  const entries = Object.entries(lockfile?.dependencies ?? {});
  const repositoryEntry = entries.find(([key]) => normalizeLockKey(key) === normalizedRepoUrl);
  return (
    repositoryEntry ??
    entries.find(([key, dependency]) => {
      const normalizedKey = normalizeLockKey(key);
      return dependency.source === 'md' && normalizedKey === `${normalizedRepoUrl}/${path}`;
    })
  );
}

function parseImportReference(importPath: string): PathReference {
  const isDirectUrl =
    !importPath.startsWith('@') &&
    importPath.split('/')[0]?.includes('.') === true &&
    importPath.split('/').length >= 3;
  const parsedPath = isDirectUrl ? 'example.com/owner/repository' : importPath;
  const result = parse(`@use ${parsedPath}`, { filename: '<resolve-command>' });
  const reference = result.ast?.uses[0]?.path;
  if (!reference || result.errors.length > 0) {
    throw new Error(result.errors[0]?.message ?? `Invalid import path: ${importPath}`);
  }
  if (isDirectUrl) {
    const lastAt = importPath.lastIndexOf('@');
    const version =
      lastAt > 0 && importPath[lastAt - 1] !== '/' ? importPath.slice(lastAt + 1) : undefined;
    const correctedReference: PathReference = {
      ...reference,
      raw: importPath,
      segments: (version ? importPath.slice(0, lastAt) : importPath).split('/'),
    };
    if (version) correctedReference.version = version;
    else delete correctedReference.version;
    return correctedReference;
  }
  return reference;
}

function printResolution(info: ResolutionInfo, format: string): void {
  if (format === 'json') {
    console.log(JSON.stringify({ success: true, ...info }, null, 2));
    return;
  }

  ConsoleOutput.newline();
  console.log(`  Import:   ${info.import}`);
  console.log(`  Type:     ${info.kind === 'registry' ? info.type : 'local file'}`);
  if (info.alias) console.log(`  Alias:    ${info.alias}`);
  if (info.repoUrl) console.log(`  Repo:     ${info.repoUrl}`);
  if (info.kind === 'registry') {
    console.log(`  Path:     ${info.path || '(root)'}`);
    console.log(
      `  Version:  ${info.lockedVersion ?? info.requestedVersion ?? 'latest (unlocked)'}`
    );
    console.log(`  Commit:   ${info.commit ?? '(not locked)'}`);
    console.log(`  Source:   ${info.source}`);
  }
  console.log(`  Location: ${info.location}`);
  console.log(`  Exists:   ${info.exists ? 'yes' : 'no'}`);
  ConsoleOutput.newline();
}

function reportError(error: unknown, format: string): void {
  const message = error instanceof Error ? error.message : String(error);
  if (format === 'json') {
    console.log(JSON.stringify({ success: false, error: message }, null, 2));
  } else {
    ConsoleOutput.error(`Resolution failed: ${message}`);
  }
  process.exitCode = 1;
}

/**
 * Debug command: show the full resolution chain for an import path.
 *
 * Prints alias expansion, repo URL, version from lockfile, cache location,
 * and resolved file type without performing any network operations.
 */
export async function resolveCommand(
  importPath: string,
  options: ResolveCommandOptions
): Promise<void> {
  const format = options.format ?? 'text';
  try {
    if (format !== 'text' && format !== 'json') {
      throw new Error(`Invalid output format: ${format}. Expected text or json.`);
    }
    const configFile = findConfigFile();
    if (!configFile) {
      throw new Error('No project config found. Run: prs init');
    }

    const config = await loadConfig();
    const userConfig = await loadUserConfig();
    const registries = {
      ...(userConfig.registries ?? {}),
      ...(config.registries ?? {}),
    };
    const alias = importPath.startsWith('@') ? (importPath.split('/')[0] ?? '') : undefined;
    if (alias) {
      if (!validateAlias(alias)) {
        throw new Error(`Invalid alias format: "${alias}". Must match @[a-z0-9][a-z0-9-]*`);
      }
      if (Object.keys(registries).length === 0) {
        throw new Error('No registries configured.');
      }
      if (!(alias in registries)) {
        throw new Error(
          `Unknown alias: ${alias}. Known aliases: ${Object.keys(registries).join(', ') || '(none)'}`
        );
      }
    }

    const reference = parseImportReference(importPath);
    const loader = new FileLoader({
      registryPath: resolve(config.registry?.path ?? './registry'),
      localPath: resolve('./.promptscript'),
      registries,
    });
    const resolvedReference = loader.resolveRef(reference, resolve('.promptscript/project.prs'));
    const marker = parseRegistryMarker(resolvedReference);
    if (!marker) {
      const localPath = resolve(resolvedReference);
      printResolution(
        {
          import: importPath,
          kind: 'local',
          path: localPath,
          location: localPath,
          exists: existsSync(localPath),
          type: 'local file',
        },
        format
      );
      return;
    }

    const lockfile = loadLockfile();
    const locked = findLockEntry(lockfile, marker.repoUrl, marker.path);
    const lockKey = locked?.[0];
    const dependency = locked?.[1];
    const cacheVersion = marker.version || 'latest';
    const registryCache = new RegistryCache(CACHE_BASE);
    const cachePath = registryCache.getCachePath(marker.repoUrl, cacheVersion);
    const vendorDir = resolve(VENDOR_DIR);
    const manifest = await loadVendorManifest(vendorDir);
    let repositoryPath = cachePath;
    let source: ResolutionInfo['source'] = (await registryCache.has(marker.repoUrl, cacheVersion))
      ? 'cache'
      : 'missing';

    if (existsSync(vendorDir) && !manifest) {
      throw new Error(`Vendor manifest is missing: ${vendorDir}`);
    }

    if (manifest) {
      if (!lockKey || !dependency) {
        throw new Error(`Vendored dependency is not pinned by the lockfile: ${marker.repoUrl}`);
      }
      const vendoredPath = await resolveVendoredRepository(
        vendorDir,
        lockKey,
        dependency.version,
        dependency.commit
      );
      if (!vendoredPath) {
        throw new Error(`Vendored dependency is missing: ${marker.repoUrl}`);
      }
      repositoryPath = vendoredPath;
      source = 'vendor';
    } else if (source === 'cache' && dependency) {
      try {
        await verifyGitRepositoryCheckout(
          cachePath,
          '.git',
          dependency.commit,
          new Set(['.prs-registry-meta.json'])
        );
      } catch {
        source = 'stale cache';
      }
    }

    const explicitPath = marker.path ? join(repositoryPath, marker.path) : repositoryPath;
    if (marker.path && !isInsideCachePath(explicitPath, repositoryPath)) {
      throw new Error(`Resolved path escapes its repository: ${marker.path}`);
    }
    const explicitPathExists = existsSync(explicitPath);
    if (
      marker.path &&
      explicitPathExists &&
      !(await isRealPathInside(explicitPath, repositoryPath))
    ) {
      throw new Error(`Resolved path escapes its repository: ${marker.path}`);
    }
    const isDirectory =
      marker.path !== '' && explicitPathExists && statSync(explicitPath).isDirectory();
    const relativeFilePath = isDirectory
      ? marker.path
      : marker.path === '' || marker.path.endsWith('.prs') || marker.path.endsWith('.md')
        ? marker.path
        : `${marker.path}.prs`;
    const resolvedPath = relativeFilePath ? join(repositoryPath, relativeFilePath) : repositoryPath;
    const pathExists = existsSync(resolvedPath);
    if (
      relativeFilePath &&
      (!isInsideCachePath(resolvedPath, repositoryPath) ||
        (pathExists && !(await isRealPathInside(resolvedPath, repositoryPath))))
    ) {
      throw new Error(`Resolved path escapes its repository: ${marker.path}`);
    }
    const type = !pathExists
      ? source === 'missing'
        ? 'not cached'
        : 'not found'
      : marker.path.endsWith('.md')
        ? 'markdown'
        : marker.path === ''
          ? 'repository root'
          : isDirectory
            ? 'directory'
            : 'native .prs';

    printResolution(
      {
        import: importPath,
        kind: 'registry',
        ...(alias ? { alias } : {}),
        repoUrl: marker.repoUrl,
        path: marker.path,
        ...(marker.version ? { requestedVersion: marker.version } : {}),
        ...(dependency ? { lockedVersion: dependency.version, commit: dependency.commit } : {}),
        source,
        location: resolvedPath,
        exists: pathExists,
        type,
      },
      format
    );
  } catch (error) {
    reportError(error, format);
  }
}
