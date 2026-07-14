import { mkdir, stat, writeFile, readFile, lstat } from 'fs/promises';
import { join, resolve, relative } from 'path';

interface CacheMeta {
  commit: string;
  cachedAt: number;
}

/**
 * Validate that a path component does not contain traversal segments
 * that could escape the cache root.
 */
function validatePathComponent(component: string, label: string): void {
  if (component.includes('..')) {
    throw new Error(`Invalid ${label}: contains parent directory traversal (..)`);
  }
  if (component.startsWith('/')) {
    throw new Error(`Invalid ${label}: absolute paths are not allowed`);
  }
}

/**
 * Hierarchical cache for registry imports.
 * Layout: <baseDir>/registries/<host>/<owner>/<repo>/<version>/
 * Separate from the existing GitCacheManager flat hash cache.
 */
export class RegistryCache {
  constructor(private readonly baseDir: string) {}

  getCachePath(repoUrl: string, version: string): string {
    const normalized = repoUrl.replace(/^(https?:\/\/|git@|git:\/\/)/, '').replace(':', '/');
    validatePathComponent(version, 'version');
    const result = join(this.baseDir, 'registries', normalized, version);
    // Verify the resolved path stays within baseDir
    const rel = relative(resolve(this.baseDir), resolve(result));
    if (rel.startsWith('..')) {
      throw new Error(`Path traversal detected: version "${version}" escapes cache root`);
    }
    return result;
  }

  async has(repoUrl: string, version: string): Promise<boolean> {
    try {
      const metaPath = join(this.getCachePath(repoUrl, version), '.prs-registry-meta.json');
      await stat(metaPath);
      return true;
    } catch {
      return false;
    }
  }

  async set(repoUrl: string, version: string, commit: string): Promise<string> {
    const cachePath = this.getCachePath(repoUrl, version);
    await mkdir(cachePath, { recursive: true });
    const metaPath = join(cachePath, '.prs-registry-meta.json');

    // Reject symlinks: a cloned repo could contain .prs-registry-meta.json as a
    // symlink to an arbitrary host path, causing this write to overwrite that target.
    try {
      const statResult = await lstat(metaPath);
      if (statResult.isSymbolicLink()) {
        throw new Error(
          `Refusing to write metadata: ${metaPath} is a symlink (possible supply-chain attack)`
        );
      }
    } catch (err) {
      // ENOENT is expected when no meta file exists yet
      if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
    }

    const meta: CacheMeta = { commit, cachedAt: Date.now() };
    await writeFile(metaPath, JSON.stringify(meta, null, 2));
    return cachePath;
  }

  async isStale(repoUrl: string, version: string, ttlMs: number): Promise<boolean> {
    // Tagged semver versions are never stale
    if (/^v?\d+\.\d+\.\d+/.test(version)) {
      return false;
    }
    try {
      const metaPath = join(this.getCachePath(repoUrl, version), '.prs-registry-meta.json');
      const raw = await readFile(metaPath, 'utf-8');
      const parsed: unknown = JSON.parse(raw);
      const meta = parsed as CacheMeta;
      return Date.now() - meta.cachedAt >= ttlMs;
    } catch {
      return true;
    }
  }

  async getMeta(repoUrl: string, version: string): Promise<CacheMeta | null> {
    try {
      const metaPath = join(this.getCachePath(repoUrl, version), '.prs-registry-meta.json');
      const raw = await readFile(metaPath, 'utf-8');
      const parsed: unknown = JSON.parse(raw);
      return parsed as CacheMeta;
    } catch {
      return null;
    }
  }

  /** Get cached tag list for a repo (for semver range resolution) */
  async getTagsMeta(repoUrl: string): Promise<{ tags: string[]; fetchedAt: number } | null> {
    try {
      const normalized = repoUrl.replace(/^(https?:\/\/|git@|git:\/\/)/, '').replace(':', '/');
      const metaPath = join(this.baseDir, 'meta', `${normalized.replace(/\//g, '-')}.json`);
      const raw = await readFile(metaPath, 'utf-8');
      const parsed: unknown = JSON.parse(raw);
      return parsed as { tags: string[]; fetchedAt: number };
    } catch {
      return null;
    }
  }

  /** Cache tag list for a repo */
  async setTagsMeta(repoUrl: string, tags: string[]): Promise<void> {
    const normalized = repoUrl.replace(/^(https?:\/\/|git@|git:\/\/)/, '').replace(':', '/');
    const metaDir = join(this.baseDir, 'meta');
    await mkdir(metaDir, { recursive: true });
    const metaPath = join(metaDir, `${normalized.replace(/\//g, '-')}.json`);
    await writeFile(metaPath, JSON.stringify({ tags, fetchedAt: Date.now() }, null, 2));
  }
}
