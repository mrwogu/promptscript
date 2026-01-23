import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { existsSync, promises as fs } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { FileNotFoundError } from '@promptscript/core';
import {
  GitRegistry,
  GitCloneError,
  GitAuthError,
  GitRefNotFoundError,
  createGitRegistry,
} from '../git-registry.js';

// Define mock object at module level
const mockGit = {
  clone: vi.fn().mockResolvedValue(undefined),
  fetch: vi.fn().mockResolvedValue(undefined),
  checkout: vi.fn().mockResolvedValue(undefined),
  reset: vi.fn().mockResolvedValue(undefined),
  revparse: vi.fn().mockResolvedValue('abc123def456'),
  env: vi.fn().mockReturnThis(),
};

// Mock simple-git
vi.mock('simple-git', () => {
  return {
    simpleGit: vi.fn(() => mockGit),
  };
});

describe('GitRegistry', () => {
  let testCacheDir: string;
  let testRepoDir: string;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Reset mock implementations
    mockGit.clone.mockResolvedValue(undefined);
    mockGit.fetch.mockResolvedValue(undefined);
    mockGit.checkout.mockResolvedValue(undefined);
    mockGit.reset.mockResolvedValue(undefined);
    mockGit.revparse.mockResolvedValue('abc123def456');
    mockGit.env.mockReturnThis();

    // Create unique temp directories for each test
    const testId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    testCacheDir = join(tmpdir(), `prs-git-cache-test-${testId}`);
    testRepoDir = join(tmpdir(), `prs-git-repo-test-${testId}`);

    await fs.mkdir(testCacheDir, { recursive: true });
    await fs.mkdir(testRepoDir, { recursive: true });

    // Mock clone to create directory structure
    // Note: Registry directories are named with @ prefix (e.g., @company, @core)
    mockGit.clone.mockImplementation(async (_url: string, targetPath: string) => {
      await fs.mkdir(targetPath, { recursive: true });
      // Create a mock .git directory
      await fs.mkdir(join(targetPath, '.git'), { recursive: true });
      // Create some mock files with @ prefix matching real registry structure
      await fs.mkdir(join(targetPath, '@company'), { recursive: true });
      await fs.writeFile(join(targetPath, '@company', 'base.prs'), '@meta\nname = "base"');
      await fs.writeFile(join(targetPath, '@company', 'security.prs'), '@meta\nname = "security"');
    });
  });

  afterEach(async () => {
    // Clean up test directories
    for (const dir of [testCacheDir, testRepoDir]) {
      if (existsSync(dir)) {
        await fs.rm(dir, { recursive: true, force: true });
      }
    }
  });

  describe('constructor', () => {
    it('should create registry with default options', () => {
      const registry = new GitRegistry({
        url: 'https://github.com/org/repo.git',
        cacheDir: testCacheDir,
      });
      expect(registry).toBeInstanceOf(GitRegistry);
    });

    it('should normalize Git URLs', () => {
      const registry = new GitRegistry({
        url: 'git@github.com:org/repo.git',
        cacheDir: testCacheDir,
      });
      expect(registry).toBeInstanceOf(GitRegistry);
    });
  });

  describe('fetch', () => {
    it('should fetch a file from the registry', async () => {
      const registry = new GitRegistry({
        url: 'https://github.com/org/repo.git',
        cacheDir: testCacheDir,
      });

      const content = await registry.fetch('@company/base');
      expect(content).toContain('name = "base"');
    });

    it('should fetch a file with explicit .prs extension', async () => {
      const registry = new GitRegistry({
        url: 'https://github.com/org/repo.git',
        cacheDir: testCacheDir,
      });

      const content = await registry.fetch('@company/base.prs');
      expect(content).toContain('name = "base"');
    });

    it('should fetch a file with version tag', async () => {
      const registry = new GitRegistry({
        url: 'https://github.com/org/repo.git',
        cacheDir: testCacheDir,
      });

      // The mock will clone with the version as the ref
      const content = await registry.fetch('@company/base@v1.0.0');
      expect(content).toContain('name = "base"');
      expect(mockGit.clone).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.arrayContaining(['--branch=v1.0.0'])
      );
    });

    it('should throw FileNotFoundError for non-existent file', async () => {
      const registry = new GitRegistry({
        url: 'https://github.com/org/repo.git',
        cacheDir: testCacheDir,
      });

      await expect(registry.fetch('@company/nonexistent')).rejects.toThrow(FileNotFoundError);
    });

    it('should use subPath if configured', async () => {
      // Mock clone to create directory structure with subPath
      mockGit.clone.mockImplementation(async (_url: string, targetPath: string) => {
        await fs.mkdir(targetPath, { recursive: true });
        await fs.mkdir(join(targetPath, '.git'), { recursive: true });
        await fs.mkdir(join(targetPath, 'registry', '@company'), { recursive: true });
        await fs.writeFile(
          join(targetPath, 'registry', '@company', 'base.prs'),
          '@meta\nname = "base-in-subpath"'
        );
      });

      const registry = new GitRegistry({
        url: 'https://github.com/org/repo.git',
        path: 'registry',
        cacheDir: testCacheDir,
      });

      const content = await registry.fetch('@company/base');
      expect(content).toContain('name = "base-in-subpath"');
    });

    it('should use cached repository on second fetch', async () => {
      const registry = new GitRegistry({
        url: 'https://github.com/org/repo.git',
        cacheDir: testCacheDir,
        cache: { enabled: true, ttl: 3600000 },
      });

      // First fetch - should clone
      await registry.fetch('@company/base');
      expect(mockGit.clone).toHaveBeenCalledTimes(1);

      // Second fetch - should use cache
      await registry.fetch('@company/security');
      expect(mockGit.clone).toHaveBeenCalledTimes(1); // Still 1
    });
  });

  describe('exists', () => {
    it('should return true for existing file', async () => {
      const registry = new GitRegistry({
        url: 'https://github.com/org/repo.git',
        cacheDir: testCacheDir,
      });

      const exists = await registry.exists('@company/base');
      expect(exists).toBe(true);
    });

    it('should return false for non-existent file', async () => {
      const registry = new GitRegistry({
        url: 'https://github.com/org/repo.git',
        cacheDir: testCacheDir,
      });

      const exists = await registry.exists('@company/nonexistent');
      expect(exists).toBe(false);
    });

    it('should return false on clone error', async () => {
      mockGit.clone.mockRejectedValueOnce(new Error('Network error'));

      const registry = new GitRegistry({
        url: 'https://github.com/org/repo.git',
        cacheDir: testCacheDir,
      });

      const exists = await registry.exists('@company/base');
      expect(exists).toBe(false);
    });
  });

  describe('list', () => {
    it('should list files in a directory', async () => {
      const registry = new GitRegistry({
        url: 'https://github.com/org/repo.git',
        cacheDir: testCacheDir,
      });

      const files = await registry.list('@company');
      expect(files).toContain('base.prs');
      expect(files).toContain('security.prs');
    });

    it('should return empty array for non-existent directory', async () => {
      const registry = new GitRegistry({
        url: 'https://github.com/org/repo.git',
        cacheDir: testCacheDir,
      });

      const files = await registry.list('@nonexistent');
      expect(files).toEqual([]);
    });

    it('should return empty array on error', async () => {
      mockGit.clone.mockRejectedValueOnce(new Error('Network error'));

      const registry = new GitRegistry({
        url: 'https://github.com/org/repo.git',
        cacheDir: testCacheDir,
      });

      const files = await registry.list('@company');
      expect(files).toEqual([]);
    });
  });

  describe('refresh', () => {
    it('should force re-clone on refresh', async () => {
      const registry = new GitRegistry({
        url: 'https://github.com/org/repo.git',
        cacheDir: testCacheDir,
      });

      // First fetch
      await registry.fetch('@company/base');
      expect(mockGit.clone).toHaveBeenCalledTimes(1);

      // Refresh
      await registry.refresh();
      expect(mockGit.clone).toHaveBeenCalledTimes(2);
    });
  });

  describe('getCommitHash', () => {
    it('should return current commit hash', async () => {
      const registry = new GitRegistry({
        url: 'https://github.com/org/repo.git',
        cacheDir: testCacheDir,
      });

      const hash = await registry.getCommitHash();
      expect(hash).toBe('abc123def456');
    });
  });

  describe('authentication', () => {
    it('should use token authentication', async () => {
      const registry = new GitRegistry({
        url: 'https://github.com/org/repo.git',
        cacheDir: testCacheDir,
        auth: {
          type: 'token',
          token: 'ghp_test_token',
        },
      });

      await registry.fetch('@company/base');

      expect(mockGit.clone).toHaveBeenCalledWith(
        'https://ghp_test_token@github.com/org/repo.git',
        expect.any(String),
        expect.any(Array)
      );
    });

    it('should use token from environment variable', async () => {
      process.env['TEST_GIT_TOKEN'] = 'env_token_value';

      const registry = new GitRegistry({
        url: 'https://github.com/org/repo.git',
        cacheDir: testCacheDir,
        auth: {
          type: 'token',
          tokenEnvVar: 'TEST_GIT_TOKEN',
        },
      });

      await registry.fetch('@company/base');

      expect(mockGit.clone).toHaveBeenCalledWith(
        'https://env_token_value@github.com/org/repo.git',
        expect.any(String),
        expect.any(Array)
      );

      delete process.env['TEST_GIT_TOKEN'];
    });

    it('should configure SSH key for SSH auth', async () => {
      const registry = new GitRegistry({
        url: 'git@github.com:org/repo.git',
        cacheDir: testCacheDir,
        auth: {
          type: 'ssh',
          sshKeyPath: '/path/to/key',
        },
      });

      await registry.fetch('@company/base');

      expect(mockGit.env).toHaveBeenCalledWith(
        'GIT_SSH_COMMAND',
        expect.stringContaining('/path/to/key')
      );
    });
  });

  describe('error handling', () => {
    it('should throw GitAuthError on authentication failure', async () => {
      mockGit.clone.mockRejectedValueOnce(new Error('Authentication failed'));

      const registry = new GitRegistry({
        url: 'https://github.com/org/repo.git',
        cacheDir: testCacheDir,
      });

      await expect(registry.fetch('@company/base')).rejects.toThrow(GitAuthError);
    });

    it('should throw GitRefNotFoundError when branch does not exist', async () => {
      mockGit.clone.mockRejectedValueOnce(new Error('Could not find remote branch nonexistent'));
      // Also fail the retry
      mockGit.fetch.mockRejectedValueOnce(new Error('Could not find remote branch nonexistent'));

      const registry = new GitRegistry({
        url: 'https://github.com/org/repo.git',
        ref: 'nonexistent',
        cacheDir: testCacheDir,
      });

      await expect(registry.fetch('@company/base')).rejects.toThrow(GitRefNotFoundError);
    });

    it('should throw GitCloneError on general clone failure', async () => {
      mockGit.clone.mockRejectedValueOnce(new Error('Network timeout'));

      const registry = new GitRegistry({
        url: 'https://github.com/org/repo.git',
        cacheDir: testCacheDir,
      });

      await expect(registry.fetch('@company/base')).rejects.toThrow(GitCloneError);
    });

    it('should retry clone without branch when branch not found and succeed', async () => {
      // First clone with branch fails
      mockGit.clone
        .mockRejectedValueOnce(new Error('Could not find remote branch feature'))
        .mockImplementationOnce(async (_url: string, targetPath: string) => {
          await fs.mkdir(targetPath, { recursive: true });
          await fs.mkdir(join(targetPath, '.git'), { recursive: true });
          await fs.mkdir(join(targetPath, '@company'), { recursive: true });
          await fs.writeFile(join(targetPath, '@company', 'base.prs'), '@meta\nname = "base"');
        });

      const registry = new GitRegistry({
        url: 'https://github.com/org/repo.git',
        ref: 'feature',
        cacheDir: testCacheDir,
      });

      const content = await registry.fetch('@company/base');
      expect(content).toContain('name = "base"');
      expect(mockGit.clone).toHaveBeenCalledTimes(2);
      expect(mockGit.fetch).toHaveBeenCalled();
      expect(mockGit.checkout).toHaveBeenCalledWith('feature');
    });

    it('should throw GitCloneError when retry clone fails with non-ref error', async () => {
      // First clone with branch fails with ref error
      mockGit.clone
        .mockRejectedValueOnce(new Error('Could not find remote branch feature'))
        .mockImplementationOnce(async (_url: string, targetPath: string) => {
          await fs.mkdir(targetPath, { recursive: true });
        });
      // Fetch fails with network error
      mockGit.fetch.mockRejectedValueOnce(new Error('Network timeout'));

      const registry = new GitRegistry({
        url: 'https://github.com/org/repo.git',
        ref: 'feature',
        cacheDir: testCacheDir,
      });

      await expect(registry.fetch('@company/base')).rejects.toThrow(GitCloneError);
    });

    it('should detect permission denied as auth error', async () => {
      mockGit.clone.mockRejectedValueOnce(new Error('Permission denied (publickey)'));

      const registry = new GitRegistry({
        url: 'https://github.com/org/repo.git',
        cacheDir: testCacheDir,
      });

      await expect(registry.fetch('@company/base')).rejects.toThrow(GitAuthError);
    });

    it('should detect 403 as auth error', async () => {
      mockGit.clone.mockRejectedValueOnce(new Error('HTTP 403 Forbidden'));

      const registry = new GitRegistry({
        url: 'https://github.com/org/repo.git',
        cacheDir: testCacheDir,
      });

      await expect(registry.fetch('@company/base')).rejects.toThrow(GitAuthError);
    });

    it('should detect pathspec error as ref error', async () => {
      mockGit.clone.mockRejectedValueOnce(new Error("pathspec 'nonexistent' did not match any"));
      mockGit.fetch.mockRejectedValueOnce(new Error("pathspec 'nonexistent' did not match any"));

      const registry = new GitRegistry({
        url: 'https://github.com/org/repo.git',
        ref: 'nonexistent',
        cacheDir: testCacheDir,
      });

      await expect(registry.fetch('@company/base')).rejects.toThrow(GitRefNotFoundError);
    });
  });

  describe('stale cache handling', () => {
    it('should update stale cache by fetching updates', async () => {
      const registry = new GitRegistry({
        url: 'https://github.com/org/repo.git',
        cacheDir: testCacheDir,
        cache: { enabled: true, ttl: 1 }, // Very short TTL
      });

      // First fetch - creates cache
      await registry.fetch('@company/base');
      expect(mockGit.clone).toHaveBeenCalledTimes(1);

      // Wait for cache to become stale
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Mock fetch to succeed (simulating update)
      mockGit.fetch.mockResolvedValue(undefined);
      mockGit.checkout.mockResolvedValue(undefined);
      mockGit.reset.mockResolvedValue(undefined);

      // Second fetch - should try to update stale cache
      await registry.fetch('@company/security');
      // Should not clone again, just update
      expect(mockGit.clone).toHaveBeenCalledTimes(1);
    });

    it('should re-clone when fetch update fails', async () => {
      const registry = new GitRegistry({
        url: 'https://github.com/org/repo.git',
        cacheDir: testCacheDir,
        cache: { enabled: true, ttl: 1 }, // Very short TTL
      });

      // First fetch - creates cache
      await registry.fetch('@company/base');
      expect(mockGit.clone).toHaveBeenCalledTimes(1);

      // Wait for cache to become stale
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Mock fetch to fail
      mockGit.fetch.mockRejectedValueOnce(new Error('Network error'));

      // Second fetch - should re-clone after update fails
      await registry.fetch('@company/security');
      expect(mockGit.clone).toHaveBeenCalledTimes(2);
    });

    it('should try tag fetch when update with branch fails', async () => {
      const registry = new GitRegistry({
        url: 'https://github.com/org/repo.git',
        cacheDir: testCacheDir,
        cache: { enabled: true, ttl: 1 },
      });

      // First fetch
      await registry.fetch('@company/base');

      await new Promise((resolve) => setTimeout(resolve, 10));

      // Branch fetch fails with ref error, tag fetch succeeds
      mockGit.fetch
        .mockRejectedValueOnce(new Error('Could not find remote branch'))
        .mockResolvedValueOnce(undefined);
      mockGit.checkout.mockResolvedValue(undefined);

      await registry.fetch('@company/security');
      expect(mockGit.fetch).toHaveBeenCalledWith(['origin', '--tags', '--depth=1']);
    });
  });

  describe('createGitRegistry', () => {
    it('should create a GitRegistry instance', () => {
      const registry = createGitRegistry({
        url: 'https://github.com/org/repo.git',
        cacheDir: testCacheDir,
      });
      expect(registry).toBeInstanceOf(GitRegistry);
    });
  });
});
