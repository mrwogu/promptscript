/**
 * Tests for the extended GitRegistry methods:
 *   cloneAtTag, listTags, resolveVersion, cloneSparse
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { existsSync, promises as fs } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { GitRegistry, GitRefNotFoundError, GitCloneError } from '../git-registry.js';
import { RegistryCache } from '../registry-cache.js';

// ---------------------------------------------------------------------------
// Mock simple-git
// ---------------------------------------------------------------------------

const mockGit = {
  clone: vi.fn().mockResolvedValue(undefined),
  fetch: vi.fn().mockResolvedValue(undefined),
  checkout: vi.fn().mockResolvedValue(undefined),
  reset: vi.fn().mockResolvedValue(undefined),
  revparse: vi.fn().mockResolvedValue('abc123def456'),
  listRemote: vi.fn().mockResolvedValue(''),
  raw: vi.fn().mockResolvedValue(''),
  env: vi.fn().mockReturnThis(),
};

vi.mock('simple-git', () => ({
  simpleGit: vi.fn(() => mockGit),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRegistry(testCacheDir: string): GitRegistry {
  return new GitRegistry({
    url: 'https://github.com/org/repo.git',
    cacheDir: testCacheDir,
  });
}

/** Build a fake ls-remote --tags output */
function buildLsRemoteOutput(tags: string[]): string {
  return tags
    .map((tag) => `abc123\trefs/tags/${tag}`)
    .join('\n');
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('GitRegistry — extended methods', () => {
  let testCacheDir: string;
  let registry: GitRegistry;

  beforeEach(async () => {
    vi.clearAllMocks();

    mockGit.clone.mockResolvedValue(undefined);
    mockGit.fetch.mockResolvedValue(undefined);
    mockGit.checkout.mockResolvedValue(undefined);
    mockGit.reset.mockResolvedValue(undefined);
    mockGit.revparse.mockResolvedValue('abc123def456');
    mockGit.listRemote.mockResolvedValue('');
    mockGit.raw.mockResolvedValue('');
    mockGit.env.mockReturnThis();

    const testId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    testCacheDir = join(tmpdir(), `prs-git-ext-test-${testId}`);
    await fs.mkdir(testCacheDir, { recursive: true });

    registry = makeRegistry(testCacheDir);
  });

  afterEach(async () => {
    if (existsSync(testCacheDir)) {
      await fs.rm(testCacheDir, { recursive: true, force: true });
    }
  });

  // -------------------------------------------------------------------------
  // cloneAtTag
  // -------------------------------------------------------------------------

  describe('cloneAtTag()', () => {
    it('clones with --depth=1 --branch=<tag> --single-branch flags', async () => {
      // Arrange
      const targetDir = join(testCacheDir, 'clone-target');

      // Act
      await registry.cloneAtTag('https://github.com/org/repo.git', 'v1.2.3', targetDir);

      // Assert
      expect(mockGit.clone).toHaveBeenCalledWith(
        'https://github.com/org/repo.git',
        targetDir,
        ['--depth=1', '--branch=v1.2.3', '--single-branch']
      );
    });

    it('removes an existing target directory before cloning', async () => {
      // Arrange
      const targetDir = join(testCacheDir, 'existing-dir');
      await fs.mkdir(targetDir, { recursive: true });
      await fs.writeFile(join(targetDir, 'old-file.txt'), 'stale');

      // Act
      await registry.cloneAtTag('https://github.com/org/repo.git', 'v1.0.0', targetDir);

      // Assert — clone was called (old dir wiped and recreated)
      expect(mockGit.clone).toHaveBeenCalledTimes(1);
    });

    it('throws GitRefNotFoundError when tag does not exist', async () => {
      // Arrange
      mockGit.clone.mockRejectedValueOnce(new Error('Could not find remote branch v9.9.9'));

      // Act / Assert
      await expect(
        registry.cloneAtTag('https://github.com/org/repo.git', 'v9.9.9', join(testCacheDir, 't'))
      ).rejects.toThrow(GitRefNotFoundError);
    });

    it('throws GitCloneError on generic clone failure', async () => {
      // Arrange
      mockGit.clone.mockRejectedValueOnce(new Error('Network timeout'));

      // Act / Assert
      await expect(
        registry.cloneAtTag('https://github.com/org/repo.git', 'v1.0.0', join(testCacheDir, 't'))
      ).rejects.toThrow(GitCloneError);
    });
  });

  // -------------------------------------------------------------------------
  // listTags
  // -------------------------------------------------------------------------

  describe('listTags()', () => {
    it('returns parsed semver tags from ls-remote output', async () => {
      // Arrange
      mockGit.listRemote.mockResolvedValueOnce(
        buildLsRemoteOutput(['v1.0.0', 'v1.1.0', 'v2.0.0'])
      );

      // Act
      const tags = await registry.listTags('https://github.com/org/repo.git');

      // Assert
      expect(tags).toContain('v1.0.0');
      expect(tags).toContain('v1.1.0');
      expect(tags).toContain('v2.0.0');
    });

    it('filters out non-semver tags', async () => {
      // Arrange
      mockGit.listRemote.mockResolvedValueOnce(
        buildLsRemoteOutput(['v1.0.0', 'latest', 'release-2024', 'v2.0.0-beta.1'])
      );

      // Act
      const tags = await registry.listTags('https://github.com/org/repo.git');

      // Assert
      expect(tags).toContain('v1.0.0');
      expect(tags).toContain('v2.0.0-beta.1');
      expect(tags).not.toContain('latest');
      expect(tags).not.toContain('release-2024');
    });

    it('deduplicates tags (strips ^{} peeled refs)', async () => {
      // Arrange — peeled annotated tag refs appear twice
      const lsRemoteOutput = [
        'abc123\trefs/tags/v1.0.0',
        'def456\trefs/tags/v1.0.0^{}',
      ].join('\n');
      mockGit.listRemote.mockResolvedValueOnce(lsRemoteOutput);

      // Act
      const tags = await registry.listTags('https://github.com/org/repo.git');

      // Assert
      expect(tags.filter((t) => t === 'v1.0.0')).toHaveLength(1);
    });

    it('returns cached tags when cache is fresh', async () => {
      // Arrange
      const cacheBaseDir = join(testCacheDir, 'tag-cache');
      const cache = new RegistryCache(cacheBaseDir);
      const repoUrl = 'https://github.com/org/repo.git';
      await cache.setTagsMeta(repoUrl, ['v1.0.0', 'v2.0.0']);

      // Act
      const tags = await registry.listTags(repoUrl, cache);

      // Assert — listRemote was NOT called because cache is fresh
      expect(mockGit.listRemote).not.toHaveBeenCalled();
      expect(tags).toEqual(['v1.0.0', 'v2.0.0']);
    });

    it('calls ls-remote and writes to cache on cache miss', async () => {
      // Arrange
      const cacheBaseDir = join(testCacheDir, 'tag-cache2');
      const cache = new RegistryCache(cacheBaseDir);
      const repoUrl = 'https://github.com/org/repo.git';
      mockGit.listRemote.mockResolvedValueOnce(buildLsRemoteOutput(['v3.0.0']));

      // Act
      const tags = await registry.listTags(repoUrl, cache);

      // Assert
      expect(mockGit.listRemote).toHaveBeenCalledTimes(1);
      expect(tags).toContain('v3.0.0');

      // Verify cache was populated
      const cached = await cache.getTagsMeta(repoUrl);
      expect(cached?.tags).toContain('v3.0.0');
    });
  });

  // -------------------------------------------------------------------------
  // resolveVersion
  // -------------------------------------------------------------------------

  describe('resolveVersion()', () => {
    beforeEach(() => {
      mockGit.listRemote.mockResolvedValue(
        buildLsRemoteOutput(['v1.0.0', 'v1.1.0', 'v1.2.0', 'v2.0.0', 'v2.1.0'])
      );
    });

    it('resolves caret range to highest compatible version', async () => {
      // Act
      const resolved = await registry.resolveVersion('https://github.com/org/repo.git', '^1.0.0');

      // Assert
      expect(resolved).toBe('v1.2.0');
    });

    it('resolves tilde range to highest patch version', async () => {
      // Act
      const resolved = await registry.resolveVersion('https://github.com/org/repo.git', '~1.1.0');

      // Assert
      expect(resolved).toBe('v1.1.0');
    });

    it('resolves exact version', async () => {
      // Act
      const resolved = await registry.resolveVersion('https://github.com/org/repo.git', '2.0.0');

      // Assert
      expect(resolved).toBe('v2.0.0');
    });

    it('resolves compound comparator range', async () => {
      // Act
      const resolved = await registry.resolveVersion(
        'https://github.com/org/repo.git',
        '>=2.0.0 <2.1.0'
      );

      // Assert
      expect(resolved).toBe('v2.0.0');
    });

    it('returns null when no tag satisfies the range', async () => {
      // Act
      const resolved = await registry.resolveVersion('https://github.com/org/repo.git', '^9.0.0');

      // Assert
      expect(resolved).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // cloneSparse
  // -------------------------------------------------------------------------

  describe('cloneSparse()', () => {
    it('clones with sparse checkout flags and sets sparse path', async () => {
      // Arrange
      const targetDir = join(testCacheDir, 'sparse-target');

      // Act
      await registry.cloneSparse(
        'https://github.com/org/repo.git',
        'v1.0.0',
        targetDir,
        'registry/'
      );

      // Assert — initial clone with sparse flags
      expect(mockGit.clone).toHaveBeenCalledWith(
        'https://github.com/org/repo.git',
        targetDir,
        ['--depth=1', '--branch=v1.0.0', '--single-branch', '--filter=blob:none', '--sparse']
      );

      // Assert — sparse-checkout set called with path
      expect(mockGit.raw).toHaveBeenCalledWith(['sparse-checkout', 'set', 'registry/']);
    });

    it('removes an existing target directory before cloning', async () => {
      // Arrange
      const targetDir = join(testCacheDir, 'sparse-existing');
      await fs.mkdir(targetDir, { recursive: true });
      await fs.writeFile(join(targetDir, 'stale.txt'), 'old content');

      // Act
      await registry.cloneSparse('https://github.com/org/repo.git', 'main', targetDir, 'src/');

      // Assert
      expect(mockGit.clone).toHaveBeenCalledTimes(1);
    });

    it('throws GitRefNotFoundError when ref does not exist', async () => {
      // Arrange
      mockGit.clone.mockRejectedValueOnce(new Error("couldn't find remote ref v9.9.9"));

      // Act / Assert
      await expect(
        registry.cloneSparse(
          'https://github.com/org/repo.git',
          'v9.9.9',
          join(testCacheDir, 'sparse-t'),
          'src/'
        )
      ).rejects.toThrow(GitRefNotFoundError);
    });

    it('throws GitCloneError on generic failure', async () => {
      // Arrange
      mockGit.clone.mockRejectedValueOnce(new Error('Connection refused'));

      // Act / Assert
      await expect(
        registry.cloneSparse(
          'https://github.com/org/repo.git',
          'main',
          join(testCacheDir, 'sparse-t2'),
          'src/'
        )
      ).rejects.toThrow(GitCloneError);
    });
  });
});
