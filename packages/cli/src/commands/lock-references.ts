import { homedir } from 'os';
import { resolve, join } from 'path';
import type { Lockfile, PromptScriptConfig } from '@promptscript/core';
import { RegistryCache, Resolver } from '@promptscript/resolver';
import { resolveRegistryPath } from '../utils/registry-resolver.js';
import type { RemoteImport } from './lock-scanner.js';
import { collectRegistryReferences, type RegistryReferenceRoot } from './lock-reference-scanner.js';

function normalizeRepository(value: string): string {
  return value
    .replace(/^(?:https?:\/\/|git:\/\/)/i, '')
    .replace(/^git@([^:]+):/, '$1/')
    .replace(/\.git(?=\/|$)/, '');
}

export async function generateLockfileReferences(
  config: PromptScriptConfig,
  entryPath: string,
  localPath: string,
  lockfile: Lockfile,
  imports: RemoteImport[]
): Promise<NonNullable<Lockfile['references']>> {
  const registry = await resolveRegistryPath(config, { lockfile });
  const cacheDir = join(homedir(), '.promptscript', 'cache');
  const resolver = new Resolver({
    registryPath: resolve(registry.path),
    localPath,
    lockfile,
    registries: config.registries,
    cacheDir,
    referenceRoots:
      registry.repositoryUrl && registry.repositoryPath
        ? { [registry.repositoryUrl]: [registry.repositoryPath] }
        : undefined,
  });
  const resolved = await resolver.resolve(entryPath);
  if (!resolved.ast || resolved.errors.length > 0) {
    const details = resolved.errors.map((error) => error.message).join('; ');
    throw new Error(`Cannot resolve project references${details ? `: ${details}` : ''}`);
  }

  const registryCache = new RegistryCache(cacheDir);
  const rootsByKey = new Map<string, RegistryReferenceRoot>();
  for (const [repoUrl, dependency] of Object.entries(lockfile.dependencies)) {
    if (dependency.source === 'md') {
      continue;
    }
    rootsByKey.set(`${repoUrl}\0${dependency.version}`, {
      repoUrl,
      version: dependency.version,
      cachePath: registryCache.getCachePath(repoUrl, dependency.version),
    });
  }
  if (registry.repositoryUrl && registry.repositoryPath) {
    const repositoryUrl = registry.repositoryUrl;
    const dependency = Object.entries(lockfile.dependencies).find(
      ([repoUrl]) => normalizeRepository(repoUrl) === normalizeRepository(repositoryUrl)
    );
    if (!dependency) {
      throw new Error(`Cannot lock references for unpinned repository: ${repositoryUrl}`);
    }
    rootsByKey.set(`${dependency[0]}\0${dependency[1].version}`, {
      repoUrl: dependency[0],
      version: dependency[1].version,
      cachePath: registry.repositoryPath,
    });
  }
  for (const remoteImport of imports) {
    const normalizedRepoUrl = normalizeRepository(remoteImport.repoUrl);
    const dependency = Object.entries(lockfile.dependencies).find(([repoUrl, entry]) => {
      const normalizedKey = normalizeRepository(repoUrl);
      return (
        normalizedKey === normalizedRepoUrl ||
        (entry.source === 'md' && normalizedKey === `${normalizedRepoUrl}/${remoteImport.path}`)
      );
    });
    if (!dependency) {
      throw new Error(`Cannot lock references for unpinned repository: ${remoteImport.repoUrl}`);
    }
    const version = dependency[1].version;
    const key = `${dependency[0]}\0${version}`;
    rootsByKey.set(key, {
      repoUrl: dependency[0],
      version,
      cachePath: registryCache.getCachePath(remoteImport.repoUrl, version),
    });
  }

  return collectRegistryReferences(resolved.ast, [...rootsByKey.values()], lockfile.references);
}
