import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, promises as fs } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { GitCacheManager, createGitCacheManager } from '../git-cache-manager.js';

describe('GitCacheManager', () => {
  let testCacheDir: string;
  let cacheManager: GitCacheManager;

  beforeEach(async () => {
    // Create a unique temp directory for each test
    testCacheDir = join(
      tmpdir(),
      `prs-cache-test-${Date.now()}-${Math.random().toString(36).slice(2)}`
    );
    await fs.mkdir(testCacheDir, { recursive: true });
    cacheManager = new GitCacheManager({ cacheDir: testCacheDir, ttl: 1000 });
  });

  afterEach(async () => {
    // Clean up test directory
    if (existsSync(testCacheDir)) {
      await fs.rm(testCacheDir, { recursive: true, force: true });
    }
  });

  describe('getCachePath', () => {
    it('should return a deterministic path for URL and ref', () => {
      const path1 = cacheManager.getCachePath('https://github.com/org/repo.git', 'main');
      const path2 = cacheManager.getCachePath('https://github.com/org/repo.git', 'main');
      expect(path1).toBe(path2);
    });

    it('should return different paths for different refs', () => {
      const path1 = cacheManager.getCachePath('https://github.com/org/repo.git', 'main');
      const path2 = cacheManager.getCachePath('https://github.com/org/repo.git', 'develop');
      expect(path1).not.toBe(path2);
    });

    it('should return different paths for different URLs', () => {
      const path1 = cacheManager.getCachePath('https://github.com/org/repo1.git', 'main');
      const path2 = cacheManager.getCachePath('https://github.com/org/repo2.git', 'main');
      expect(path1).not.toBe(path2);
    });
  });

  describe('set and get', () => {
    it('should create a cache entry', async () => {
      const url = 'https://github.com/org/repo.git';
      const ref = 'main';
      const commitHash = 'abc123';

      const cachePath = await cacheManager.set(url, ref, commitHash);
      expect(existsSync(cachePath)).toBe(true);

      const entry = await cacheManager.get(url, ref);
      expect(entry).not.toBeNull();
      expect(entry?.metadata.url).toBe(url);
      expect(entry?.metadata.ref).toBe(ref);
      expect(entry?.metadata.commitHash).toBe(commitHash);
      expect(entry?.isStale).toBe(false);
    });

    it('should return null for non-existent cache', async () => {
      const entry = await cacheManager.get('https://github.com/org/nonexistent.git', 'main');
      expect(entry).toBeNull();
    });

    it('should update existing cache entry', async () => {
      const url = 'https://github.com/org/repo.git';
      const ref = 'main';

      await cacheManager.set(url, ref, 'commit1');
      const entry1 = await cacheManager.get(url, ref);
      expect(entry1?.metadata.commitHash).toBe('commit1');

      await cacheManager.set(url, ref, 'commit2');
      const entry2 = await cacheManager.get(url, ref);
      expect(entry2?.metadata.commitHash).toBe('commit2');
      // createdAt should be preserved
      expect(entry2?.metadata.createdAt).toBe(entry1?.metadata.createdAt);
    });
  });

  describe('isValid', () => {
    it('should return true for valid non-stale cache', async () => {
      await cacheManager.set('https://github.com/org/repo.git', 'main', 'abc123');
      const isValid = await cacheManager.isValid('https://github.com/org/repo.git', 'main');
      expect(isValid).toBe(true);
    });

    it('should return false for non-existent cache', async () => {
      const isValid = await cacheManager.isValid('https://github.com/org/nonexistent.git', 'main');
      expect(isValid).toBe(false);
    });

    it('should return false for stale cache', async () => {
      // Create manager with very short TTL
      const shortTtlManager = new GitCacheManager({ cacheDir: testCacheDir, ttl: 1 });
      await shortTtlManager.set('https://github.com/org/repo.git', 'main', 'abc123');

      // Wait for TTL to expire
      await new Promise((resolve) => setTimeout(resolve, 10));

      const isValid = await shortTtlManager.isValid('https://github.com/org/repo.git', 'main');
      expect(isValid).toBe(false);
    });
  });

  describe('touch', () => {
    it('should update lastUpdated timestamp', async () => {
      const url = 'https://github.com/org/repo.git';
      const ref = 'main';

      await cacheManager.set(url, ref, 'abc123');
      const entry1 = await cacheManager.get(url, ref);

      // Wait a bit
      await new Promise((resolve) => setTimeout(resolve, 10));

      await cacheManager.touch(url, ref);
      const entry2 = await cacheManager.get(url, ref);

      expect(entry2?.metadata.lastUpdated).toBeGreaterThan(entry1?.metadata.lastUpdated ?? 0);
    });

    it('should update commitHash if provided', async () => {
      const url = 'https://github.com/org/repo.git';
      const ref = 'main';

      await cacheManager.set(url, ref, 'commit1');
      await cacheManager.touch(url, ref, 'commit2');

      const entry = await cacheManager.get(url, ref);
      expect(entry?.metadata.commitHash).toBe('commit2');
    });

    it('should throw for non-existent cache', async () => {
      await expect(
        cacheManager.touch('https://github.com/org/nonexistent.git', 'main')
      ).rejects.toThrow('Cache entry not found');
    });
  });

  describe('remove', () => {
    it('should remove cache entry', async () => {
      const url = 'https://github.com/org/repo.git';
      const ref = 'main';

      await cacheManager.set(url, ref, 'abc123');
      expect(await cacheManager.get(url, ref)).not.toBeNull();

      await cacheManager.remove(url, ref);
      expect(await cacheManager.get(url, ref)).toBeNull();
    });

    it('should not throw for non-existent cache', async () => {
      await expect(
        cacheManager.remove('https://github.com/org/nonexistent.git', 'main')
      ).resolves.not.toThrow();
    });
  });

  describe('list', () => {
    it('should return empty array for empty cache', async () => {
      const entries = await cacheManager.list();
      expect(entries).toEqual([]);
    });

    it('should list all cache entries', async () => {
      await cacheManager.set('https://github.com/org/repo1.git', 'main', 'commit1');
      await cacheManager.set('https://github.com/org/repo2.git', 'main', 'commit2');
      await cacheManager.set('https://github.com/org/repo1.git', 'develop', 'commit3');

      const entries = await cacheManager.list();
      expect(entries).toHaveLength(3);
    });
  });

  describe('cleanupStale', () => {
    it('should remove stale entries', async () => {
      // Create manager with moderate TTL (100ms)
      const shortTtlManager = new GitCacheManager({ cacheDir: testCacheDir, ttl: 100 });

      await shortTtlManager.set('https://github.com/org/repo1.git', 'main', 'commit1');
      await shortTtlManager.set('https://github.com/org/repo2.git', 'main', 'commit2');

      // Wait for TTL to expire
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Add a fresh entry using a manager with longer TTL to ensure it's not stale
      const freshManager = new GitCacheManager({ cacheDir: testCacheDir, ttl: 60000 });
      await freshManager.set('https://github.com/org/repo3.git', 'main', 'commit3');

      const removed = await shortTtlManager.cleanupStale();
      expect(removed).toBe(2);

      const entries = await shortTtlManager.list();
      expect(entries).toHaveLength(1);
      expect(entries[0]?.metadata.url).toBe('https://github.com/org/repo3.git');
    });
  });

  describe('clear', () => {
    it('should remove all cache entries', async () => {
      await cacheManager.set('https://github.com/org/repo1.git', 'main', 'commit1');
      await cacheManager.set('https://github.com/org/repo2.git', 'main', 'commit2');

      await cacheManager.clear();

      expect(existsSync(testCacheDir)).toBe(false);
      const entries = await cacheManager.list();
      expect(entries).toEqual([]);
    });
  });

  describe('getSize', () => {
    it('should return 0 for empty cache', async () => {
      const size = await cacheManager.getSize();
      expect(size).toBe(0);
    });

    it('should return total cache size', async () => {
      await cacheManager.set('https://github.com/org/repo.git', 'main', 'abc123');

      const size = await cacheManager.getSize();
      expect(size).toBeGreaterThan(0);
    });
  });

  describe('createGitCacheManager', () => {
    it('should create a GitCacheManager instance', () => {
      const manager = createGitCacheManager({ cacheDir: testCacheDir });
      expect(manager).toBeInstanceOf(GitCacheManager);
    });
  });
});
