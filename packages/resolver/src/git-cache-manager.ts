/**
 * Git cache manager for cloned repositories.
 *
 * Manages a local cache of cloned Git repositories with:
 * - Deterministic cache directories based on URL hash
 * - TTL-based staleness checks
 * - Metadata tracking (commit hash, last fetched)
 * - Automatic cleanup of stale caches
 *
 * @packageDocumentation
 */

import { existsSync, promises as fs } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { getCacheKey } from './git-url-utils.js';

/**
 * Cache metadata stored alongside cloned repositories.
 */
export interface CacheMetadata {
  /** Original Git URL */
  url: string;
  /** Git ref (branch/tag/commit) that was checked out */
  ref: string;
  /** Current commit hash */
  commitHash: string;
  /** Timestamp when the cache was last updated */
  lastUpdated: number;
  /** Timestamp when the cache was created */
  createdAt: number;
  /** Version of the cache format */
  version: 1;
}

/**
 * Cache entry with metadata and path information.
 */
export interface CacheEntry {
  /** Path to the cached repository */
  path: string;
  /** Cache metadata */
  metadata: CacheMetadata;
  /** Whether the cache is stale (beyond TTL) */
  isStale: boolean;
}

/**
 * Options for GitCacheManager.
 */
export interface GitCacheManagerOptions {
  /**
   * Base directory for cache storage.
   * Defaults to ~/.promptscript/.cache/git
   */
  cacheDir?: string;

  /**
   * Time-to-live in milliseconds for cached entries.
   * After this time, the cache is considered stale.
   * @default 3600000 (1 hour)
   */
  ttl?: number;
}

/**
 * Default cache directory path.
 */
const DEFAULT_CACHE_DIR = join(homedir(), '.promptscript', '.cache', 'git');

/**
 * Default TTL (1 hour in milliseconds).
 */
const DEFAULT_TTL = 3600000;

/**
 * Metadata file name within cache directories.
 */
const METADATA_FILE = '.prs-cache-meta.json';

/**
 * Manager for Git repository cache.
 */
export class GitCacheManager {
  private readonly cacheDir: string;
  private readonly ttl: number;

  constructor(options: GitCacheManagerOptions = {}) {
    this.cacheDir = options.cacheDir ?? DEFAULT_CACHE_DIR;
    this.ttl = options.ttl ?? DEFAULT_TTL;
  }

  /**
   * Get the cache directory for a given URL and ref.
   *
   * @param url - Git repository URL
   * @param ref - Git ref (branch/tag/commit)
   * @returns Path to the cache directory
   */
  getCachePath(url: string, ref: string): string {
    const cacheKey = getCacheKey(url, ref);
    return join(this.cacheDir, cacheKey);
  }

  /**
   * Check if a cache entry exists and is not stale.
   *
   * @param url - Git repository URL
   * @param ref - Git ref (branch/tag/commit)
   * @returns True if cache is valid (exists and not stale)
   */
  async isValid(url: string, ref: string): Promise<boolean> {
    const entry = await this.get(url, ref);
    return entry !== null && !entry.isStale;
  }

  /**
   * Get a cache entry if it exists.
   *
   * @param url - Git repository URL
   * @param ref - Git ref (branch/tag/commit)
   * @returns Cache entry or null if not found
   */
  async get(url: string, ref: string): Promise<CacheEntry | null> {
    const cachePath = this.getCachePath(url, ref);

    if (!existsSync(cachePath)) {
      return null;
    }

    const metadata = await this.readMetadata(cachePath);
    if (!metadata) {
      return null;
    }

    const isStale = Date.now() - metadata.lastUpdated > this.ttl;

    return {
      path: cachePath,
      metadata,
      isStale,
    };
  }

  /**
   * Create or update a cache entry.
   *
   * @param url - Git repository URL
   * @param ref - Git ref (branch/tag/commit)
   * @param commitHash - Current commit hash
   * @returns Path to the cache directory
   */
  async set(url: string, ref: string, commitHash: string): Promise<string> {
    const cachePath = this.getCachePath(url, ref);

    // Ensure cache directory exists
    await fs.mkdir(cachePath, { recursive: true });

    // Read existing metadata or create new
    const existingMetadata = await this.readMetadata(cachePath);
    const now = Date.now();

    const metadata: CacheMetadata = {
      url,
      ref,
      commitHash,
      lastUpdated: now,
      createdAt: existingMetadata?.createdAt ?? now,
      version: 1,
    };

    await this.writeMetadata(cachePath, metadata);

    return cachePath;
  }

  /**
   * Update the lastUpdated timestamp for an existing cache entry.
   *
   * @param url - Git repository URL
   * @param ref - Git ref (branch/tag/commit)
   * @param commitHash - Optional new commit hash (if fetch resulted in update)
   */
  async touch(url: string, ref: string, commitHash?: string): Promise<void> {
    const cachePath = this.getCachePath(url, ref);
    const metadata = await this.readMetadata(cachePath);

    if (!metadata) {
      throw new Error(`Cache entry not found: ${cachePath}`);
    }

    metadata.lastUpdated = Date.now();
    if (commitHash) {
      metadata.commitHash = commitHash;
    }

    await this.writeMetadata(cachePath, metadata);
  }

  /**
   * Remove a cache entry.
   *
   * @param url - Git repository URL
   * @param ref - Git ref (branch/tag/commit)
   */
  async remove(url: string, ref: string): Promise<void> {
    const cachePath = this.getCachePath(url, ref);

    if (existsSync(cachePath)) {
      await fs.rm(cachePath, { recursive: true, force: true });
    }
  }

  /**
   * List all cache entries.
   *
   * @returns Array of cache entries
   */
  async list(): Promise<CacheEntry[]> {
    if (!existsSync(this.cacheDir)) {
      return [];
    }

    const entries: CacheEntry[] = [];
    const dirs = await fs.readdir(this.cacheDir, { withFileTypes: true });

    for (const dir of dirs) {
      if (!dir.isDirectory()) {
        continue;
      }

      const cachePath = join(this.cacheDir, dir.name);
      const metadata = await this.readMetadata(cachePath);

      if (metadata) {
        const isStale = Date.now() - metadata.lastUpdated > this.ttl;
        entries.push({ path: cachePath, metadata, isStale });
      }
    }

    return entries;
  }

  /**
   * Remove all stale cache entries.
   *
   * @returns Number of entries removed
   */
  async cleanupStale(): Promise<number> {
    const entries = await this.list();
    const staleEntries = entries.filter((e) => e.isStale);

    for (const entry of staleEntries) {
      await fs.rm(entry.path, { recursive: true, force: true });
    }

    return staleEntries.length;
  }

  /**
   * Remove all cache entries.
   */
  async clear(): Promise<void> {
    if (existsSync(this.cacheDir)) {
      await fs.rm(this.cacheDir, { recursive: true, force: true });
    }
  }

  /**
   * Get the total size of the cache in bytes.
   *
   * @returns Total cache size in bytes
   */
  async getSize(): Promise<number> {
    if (!existsSync(this.cacheDir)) {
      return 0;
    }

    return this.calculateDirSize(this.cacheDir);
  }

  /**
   * Calculate the size of a directory recursively.
   */
  private async calculateDirSize(dirPath: string): Promise<number> {
    let size = 0;
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dirPath, entry.name);

      if (entry.isDirectory()) {
        size += await this.calculateDirSize(fullPath);
      } else {
        const stat = await fs.stat(fullPath);
        size += stat.size;
      }
    }

    return size;
  }

  /**
   * Read metadata from a cache directory.
   */
  private async readMetadata(cachePath: string): Promise<CacheMetadata | null> {
    const metadataPath = join(cachePath, METADATA_FILE);

    if (!existsSync(metadataPath)) {
      return null;
    }

    try {
      const content = await fs.readFile(metadataPath, 'utf-8');
      return JSON.parse(content) as CacheMetadata;
    } catch {
      return null;
    }
  }

  /**
   * Write metadata to a cache directory.
   */
  private async writeMetadata(cachePath: string, metadata: CacheMetadata): Promise<void> {
    const metadataPath = join(cachePath, METADATA_FILE);
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf-8');
  }
}

/**
 * Create a new GitCacheManager instance.
 *
 * @param options - Cache manager options
 * @returns GitCacheManager instance
 *
 * @example
 * ```typescript
 * const cache = createGitCacheManager({
 *   cacheDir: '/custom/cache/path',
 *   ttl: 1800000, // 30 minutes
 * });
 *
 * // Check if cache is valid
 * const isValid = await cache.isValid('https://github.com/org/repo.git', 'main');
 *
 * // Get or create cache
 * const entry = await cache.get('https://github.com/org/repo.git', 'main');
 * ```
 */
export function createGitCacheManager(options: GitCacheManagerOptions = {}): GitCacheManager {
  return new GitCacheManager(options);
}
