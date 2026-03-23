import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { fileURLToPath } from 'url';
import { RegistryCache } from '../registry-cache.js';

const __filename = fileURLToPath(import.meta.url);
void __filename; // referenced to satisfy ESM pattern requirement

describe('RegistryCache', () => {
  let testBaseDir: string;
  let cache: RegistryCache;

  beforeEach(async () => {
    testBaseDir = join(
      tmpdir(),
      `prs-registry-cache-test-${Date.now()}-${Math.random().toString(36).slice(2)}`
    );
    await fs.mkdir(testBaseDir, { recursive: true });
    cache = new RegistryCache(testBaseDir);
  });

  afterEach(async () => {
    try {
      await fs.rm(testBaseDir, { recursive: true, force: true });
    } catch {
      // ignore cleanup errors
    }
  });

  describe('getCachePath', () => {
    it('returns correct hierarchical path for https URL', () => {
      const result = cache.getCachePath('https://github.com/org/repo', 'v1.0.0');
      expect(result).toBe(join(testBaseDir, 'registries', 'github.com', 'org', 'repo', 'v1.0.0'));
    });

    it('returns correct hierarchical path for git@ URL', () => {
      const result = cache.getCachePath('git@github.com:org/repo', 'main');
      expect(result).toBe(join(testBaseDir, 'registries', 'github.com', 'org', 'repo', 'main'));
    });

    it('returns correct hierarchical path for http URL', () => {
      const result = cache.getCachePath('http://example.com/org/repo', 'develop');
      expect(result).toBe(join(testBaseDir, 'registries', 'example.com', 'org', 'repo', 'develop'));
    });
  });

  describe('has()', () => {
    it('returns false for empty cache', async () => {
      // Arrange
      const repoUrl = 'https://github.com/org/repo';
      const version = 'v1.0.0';

      // Act
      const result = await cache.has(repoUrl, version);

      // Assert
      expect(result).toBe(false);
    });

    it('returns true after set()', async () => {
      // Arrange
      const repoUrl = 'https://github.com/org/repo';
      const version = 'v1.0.0';
      await cache.set(repoUrl, version, 'abc123');

      // Act
      const result = await cache.has(repoUrl, version);

      // Assert
      expect(result).toBe(true);
    });
  });

  describe('isStale()', () => {
    it('returns true for branch refs with TTL 0', async () => {
      // Arrange
      const repoUrl = 'https://github.com/org/repo';
      const version = 'main';
      await cache.set(repoUrl, version, 'abc123');

      // Act
      const result = await cache.isStale(repoUrl, version, 0);

      // Assert
      expect(result).toBe(true);
    });

    it('returns false for tagged semver versions (never stale)', async () => {
      // Arrange
      const repoUrl = 'https://github.com/org/repo';

      // Act & Assert: semver with v prefix
      expect(await cache.isStale(repoUrl, 'v1.0.0', 0)).toBe(false);
      // Act & Assert: semver without v prefix
      expect(await cache.isStale(repoUrl, '2.3.4', 0)).toBe(false);
      // Act & Assert: semver with pre-release suffix
      expect(await cache.isStale(repoUrl, 'v1.2.3-beta.1', 0)).toBe(false);
    });

    it('returns false for branch ref within TTL', async () => {
      // Arrange
      const repoUrl = 'https://github.com/org/repo';
      const version = 'main';
      await cache.set(repoUrl, version, 'abc123');

      // Act — large TTL so it cannot be stale
      const result = await cache.isStale(repoUrl, version, 60_000);

      // Assert
      expect(result).toBe(false);
    });

    it('returns true for missing cache entry', async () => {
      // Arrange / Act / Assert
      expect(await cache.isStale('https://github.com/org/missing', 'main', 60_000)).toBe(true);
    });
  });

  describe('getMeta()', () => {
    it('returns null for missing entries', async () => {
      // Arrange / Act
      const result = await cache.getMeta('https://github.com/org/missing', 'v1.0.0');

      // Assert
      expect(result).toBeNull();
    });

    it('returns correct data after set()', async () => {
      // Arrange
      const repoUrl = 'https://github.com/org/repo';
      const version = 'v1.0.0';
      const commit = 'deadbeef';
      const before = Date.now();
      await cache.set(repoUrl, version, commit);
      const after = Date.now();

      // Act
      const meta = await cache.getMeta(repoUrl, version);

      // Assert
      expect(meta).not.toBeNull();
      expect(meta?.commit).toBe(commit);
      expect(meta?.cachedAt).toBeGreaterThanOrEqual(before);
      expect(meta?.cachedAt).toBeLessThanOrEqual(after);
    });
  });

  describe('getTagsMeta()', () => {
    it('returns null for uncached repo', async () => {
      // Arrange / Act
      const result = await cache.getTagsMeta('https://github.com/org/repo');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('setTagsMeta() + getTagsMeta()', () => {
    it('roundtrip works correctly', async () => {
      // Arrange
      const repoUrl = 'https://github.com/org/repo';
      const tags = ['v1.0.0', 'v1.1.0', 'v2.0.0'];
      const before = Date.now();

      // Act
      await cache.setTagsMeta(repoUrl, tags);
      const result = await cache.getTagsMeta(repoUrl);
      const after = Date.now();

      // Assert
      expect(result).not.toBeNull();
      expect(result?.tags).toEqual(tags);
      expect(result?.fetchedAt).toBeGreaterThanOrEqual(before);
      expect(result?.fetchedAt).toBeLessThanOrEqual(after);
    });

    it('overwrites existing tag meta on second call', async () => {
      // Arrange
      const repoUrl = 'https://github.com/org/repo';
      await cache.setTagsMeta(repoUrl, ['v1.0.0']);

      // Act
      await cache.setTagsMeta(repoUrl, ['v1.0.0', 'v2.0.0']);
      const result = await cache.getTagsMeta(repoUrl);

      // Assert
      expect(result?.tags).toEqual(['v1.0.0', 'v2.0.0']);
    });
  });
});
