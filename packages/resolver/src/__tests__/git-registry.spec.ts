import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { existsSync, promises as fs } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { FileNotFoundError } from '@promptscript/core';
import { simpleGit } from 'simple-git';
import {
  GitRegistry,
  GitCloneError,
  GitAuthError,
  GitRefNotFoundError,
  createGitRegistry,
  isSemverRange,
  validateRemoteAccess,
  versionSatisfiesRange,
} from '../git-registry.js';

// Define mock object at module level
const mockGit = {
  init: vi.fn().mockResolvedValue(undefined),
  addRemote: vi.fn().mockResolvedValue(undefined),
  clone: vi.fn().mockResolvedValue(undefined),
  fetch: vi.fn().mockResolvedValue(undefined),
  checkout: vi.fn().mockResolvedValue(undefined),
  reset: vi.fn().mockResolvedValue(undefined),
  revparse: vi.fn().mockResolvedValue('abc123def456'),
  raw: vi.fn().mockResolvedValue(''),
  env: vi.fn().mockReturnThis(),
  listRemote: vi.fn().mockResolvedValue(''),
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
    mockGit.init.mockResolvedValue(undefined);
    mockGit.addRemote.mockResolvedValue(undefined);
    mockGit.clone.mockResolvedValue(undefined);
    mockGit.fetch.mockResolvedValue(undefined);
    mockGit.checkout.mockResolvedValue(undefined);
    mockGit.reset.mockResolvedValue(undefined);
    mockGit.revparse.mockResolvedValue('abc123def456');
    mockGit.raw.mockResolvedValue('');
    mockGit.env.mockReturnThis();
    mockGit.listRemote.mockResolvedValue('');

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

    it('should fetch a .md file without appending .prs', async () => {
      // Arrange — mock clone to create directory structure with a .md file
      mockGit.clone.mockImplementation(async (_url: string, targetPath: string) => {
        await fs.mkdir(targetPath, { recursive: true });
        await fs.mkdir(join(targetPath, '.git'), { recursive: true });
        await fs.mkdir(join(targetPath, '@company'), { recursive: true });
        await fs.writeFile(
          join(targetPath, '@company', 'SKILL.md'),
          '---\nname: my-skill\n---\nSkill body'
        );
      });

      const registry = new GitRegistry({
        url: 'https://github.com/org/repo.git',
        cacheDir: testCacheDir,
      });

      // Act — fetch with explicit .md extension
      const content = await registry.fetch('@company/SKILL.md');

      // Assert — should read the .md file directly, not look for SKILL.md.prs
      expect(content).toContain('name: my-skill');
      expect(content).toContain('Skill body');
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

    it('should rethrow typed timeout errors', async () => {
      mockGit.clone.mockRejectedValueOnce(new Error('Network timeout'));

      const registry = new GitRegistry({
        url: 'https://github.com/org/repo.git',
        cacheDir: testCacheDir,
        timeout: 25,
      });

      await expect(registry.exists('@company/base')).rejects.toMatchObject({
        name: 'GitCloneError',
        message: expect.stringContaining('timed out after 25ms'),
      });
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

    it('should rethrow typed timeout errors', async () => {
      mockGit.clone.mockRejectedValueOnce(new Error('Network timeout'));

      const registry = new GitRegistry({
        url: 'https://github.com/org/repo.git',
        cacheDir: testCacheDir,
        timeout: 25,
      });

      await expect(registry.list('@company')).rejects.toMatchObject({
        name: 'GitCloneError',
        message: expect.stringContaining('timed out after 25ms'),
      });
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

    it('should report timeout while reading the current commit', async () => {
      mockGit.revparse
        .mockResolvedValueOnce('abc123def456')
        .mockRejectedValueOnce(new Error('operation timed out'));

      const registry = new GitRegistry({
        url: 'https://github.com/org/repo.git',
        cacheDir: testCacheDir,
      });

      await expect(registry.getCommitHash()).rejects.toMatchObject({
        name: 'GitCloneError',
        message: expect.stringContaining('timed out after'),
      });
      expect(mockGit.revparse).toHaveBeenCalledTimes(2);
    });

    it('should report timeout while caching the current commit', async () => {
      mockGit.revparse.mockRejectedValueOnce(new Error('operation timed out'));

      const registry = new GitRegistry({
        url: 'https://github.com/org/repo.git',
        cacheDir: testCacheDir,
      });

      await expect(registry.getCommitHash()).rejects.toMatchObject({
        name: 'GitCloneError',
        message: expect.stringContaining('timed out after'),
      });
      expect(mockGit.revparse).toHaveBeenCalledTimes(1);
    });

    it('should rethrow a non-timeout commit lookup error', async () => {
      mockGit.revparse
        .mockResolvedValueOnce('abc123def456')
        .mockRejectedValueOnce(new Error('revparse failed'));

      const registry = new GitRegistry({
        url: 'https://github.com/org/repo.git',
        cacheDir: testCacheDir,
      });

      await expect(registry.getCommitHash()).rejects.toThrow('revparse failed');
    });

    it('should preserve non-Error commit lookup failures', async () => {
      mockGit.revparse
        .mockResolvedValueOnce('abc123def456')
        .mockRejectedValueOnce('revparse failed');

      const registry = new GitRegistry({
        url: 'https://github.com/org/repo.git',
        cacheDir: testCacheDir,
      });

      await expect(registry.getCommitHash()).rejects.toBe('revparse failed');
    });

    it('should preserve non-Error current commit read failures', async () => {
      mockGit.revparse.mockRejectedValueOnce('current commit read failed');

      const registry = new GitRegistry({
        url: 'https://github.com/org/repo.git',
        cacheDir: testCacheDir,
      });

      await expect(registry.getCommitHash()).rejects.toBe('current commit read failed');
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
        'https://github.com/org/repo.git',
        expect.any(String),
        expect.any(Array)
      );
      expect(mockGit.env).toHaveBeenCalledWith(
        'GIT_CONFIG_VALUE_0',
        'Authorization: Basic Z2hwX3Rlc3RfdG9rZW46'
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
        'https://github.com/org/repo.git',
        expect.any(String),
        expect.any(Array)
      );
      expect(mockGit.env).toHaveBeenCalledWith(
        'GIT_CONFIG_VALUE_0',
        `Authorization: Basic ${Buffer.from('env_token_value:').toString('base64')}`
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

      expect(mockGit.clone).toHaveBeenCalledWith(
        'git@github.com:org/repo.git',
        expect.any(String),
        expect.any(Array)
      );
      expect(mockGit.env).toHaveBeenCalledWith(
        'GIT_SSH_COMMAND',
        expect.stringContaining('/path/to/key')
      );
      expect(mockGit.env).not.toHaveBeenCalledWith(
        'GIT_SSH_COMMAND',
        expect.stringContaining('StrictHostKeyChecking=no')
      );
    });

    it('should disable interactive credential prompts to prevent hangs', async () => {
      const registry = new GitRegistry({
        url: 'https://github.com/org/repo.git',
        cacheDir: testCacheDir,
      });

      await registry.fetch('@company/base');

      expect(mockGit.env).toHaveBeenCalledWith('GIT_TERMINAL_PROMPT', '0');
      expect(mockGit.env).toHaveBeenCalledWith('GCM_INTERACTIVE', 'never');
    });

    it('should apply a hard timeout to every registry Git client', async () => {
      const registry = new GitRegistry({
        url: 'https://github.com/org/repo.git',
        cacheDir: testCacheDir,
        timeout: 25,
      });

      await registry.fetch('@company/base');

      expect(simpleGit).toHaveBeenCalledWith(
        expect.objectContaining({
          timeout: { block: 25, stdErr: false, stdOut: false },
        })
      );
    });
  });

  it('should use the default timeout for invalid timeout values', async () => {
    const registry = new GitRegistry({
      url: 'https://github.com/org/repo.git',
      cacheDir: testCacheDir,
      timeout: 0,
    });

    await registry.fetch('@company/base');

    expect(simpleGit).toHaveBeenCalledWith(
      expect.objectContaining({
        timeout: { block: 60_000, stdErr: false, stdOut: false },
      })
    );
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

    it('should report timeout while recovering a missing branch', async () => {
      mockGit.clone
        .mockRejectedValueOnce(new Error('Could not find remote branch feature'))
        .mockImplementationOnce(async (_url: string, targetPath: string) => {
          await fs.mkdir(targetPath, { recursive: true });
        });
      mockGit.fetch.mockRejectedValueOnce(new Error('operation timed out'));

      const registry = new GitRegistry({
        url: 'https://github.com/org/repo.git',
        ref: 'feature',
        cacheDir: testCacheDir,
      });

      await expect(registry.fetch('@company/base')).rejects.toMatchObject({
        name: 'GitCloneError',
        message: expect.stringContaining('timed out after'),
      });
    });

    it('should report timeout from a configured fallback clone', async () => {
      mockGit.clone
        .mockRejectedValueOnce(new Error('Authentication failed'))
        .mockRejectedValueOnce(new Error('operation timed out'));

      const registry = new GitRegistry({
        url: 'https://github.com/org/repo.git',
        fallbackUrl: 'git@github.com:org/repo.git',
        cacheDir: testCacheDir,
      });

      await expect(registry.fetch('@company/base')).rejects.toMatchObject({
        name: 'GitCloneError',
        message: expect.stringContaining('timed out after'),
      });
      expect(mockGit.clone).toHaveBeenCalledTimes(2);
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

    it('should retry with fallbackUrl on auth error', async () => {
      // Primary URL fails with auth error, fallback succeeds
      mockGit.clone
        .mockRejectedValueOnce(new Error('Authentication failed'))
        .mockImplementationOnce(async (_url: string, targetPath: string) => {
          await fs.mkdir(targetPath, { recursive: true });
          await fs.mkdir(join(targetPath, '@company'), { recursive: true });
          await fs.writeFile(join(targetPath, '@company', 'base.prs'), '@meta\nname = "base"');
        });

      const registry = new GitRegistry({
        url: 'https://github.com/org/repo.git',
        fallbackUrl: 'git@github.com:org/repo.git',
        cacheDir: testCacheDir,
      });

      const content = await registry.fetch('@company/base');
      expect(content).toContain('name = "base"');
      expect(mockGit.clone).toHaveBeenCalledTimes(2);
    });

    it('should throw combined auth error when both primary and fallback fail', async () => {
      mockGit.clone
        .mockRejectedValueOnce(new Error('Authentication failed'))
        .mockRejectedValueOnce(new Error('Permission denied (publickey)'));

      const registry = new GitRegistry({
        url: 'https://github.com/org/repo.git',
        fallbackUrl: 'git@github.com:org/repo.git',
        cacheDir: testCacheDir,
      });

      await expect(registry.fetch('@company/base')).rejects.toThrow(GitAuthError);
      try {
        await registry.fetch('@company/base');
      } catch (err) {
        expect(err).toBeInstanceOf(GitAuthError);
        expect((err as GitAuthError).message).toContain('both');
      }
    });

    it('should not try fallback on non-auth errors', async () => {
      mockGit.clone.mockRejectedValueOnce(new Error('Network timeout'));

      const registry = new GitRegistry({
        url: 'https://github.com/org/repo.git',
        fallbackUrl: 'git@github.com:org/repo.git',
        cacheDir: testCacheDir,
      });

      await expect(registry.fetch('@company/base')).rejects.toThrow(GitCloneError);
      expect(mockGit.clone).toHaveBeenCalledTimes(1);
    });

    it('should try fallback ref-error recovery when fallback clone hits ref error', async () => {
      // Primary: auth error → fallback: ref error → retry without branch
      mockGit.clone
        .mockRejectedValueOnce(new Error('Authentication failed'))
        .mockRejectedValueOnce(new Error('Could not find remote branch feature'))
        .mockImplementationOnce(async (_url: string, targetPath: string) => {
          await fs.mkdir(targetPath, { recursive: true });
          await fs.mkdir(join(targetPath, '@company'), { recursive: true });
          await fs.writeFile(join(targetPath, '@company', 'base.prs'), '@meta\nname = "base"');
        });

      const registry = new GitRegistry({
        url: 'https://github.com/org/repo.git',
        fallbackUrl: 'git@github.com:org/repo.git',
        ref: 'feature',
        cacheDir: testCacheDir,
      });

      const content = await registry.fetch('@company/base');
      expect(content).toContain('name = "base"');
      // 3 clone calls: primary (auth fail), fallback w/ branch (ref fail), fallback w/o branch
      expect(mockGit.clone).toHaveBeenCalledTimes(3);
    });

    it('should throw GitRefNotFoundError when fallback ref does not exist at all', async () => {
      // Primary: auth error → fallback: ref error → retry without branch → fetch also ref error
      mockGit.clone
        .mockRejectedValueOnce(new Error('Authentication failed'))
        .mockRejectedValueOnce(new Error('Could not find remote branch nonexistent'))
        .mockImplementationOnce(async (_url: string, targetPath: string) => {
          await fs.mkdir(targetPath, { recursive: true });
        });
      mockGit.fetch.mockRejectedValueOnce(new Error('Could not find remote branch nonexistent'));
      mockGit.checkout.mockRejectedValueOnce(new Error("pathspec 'nonexistent' did not match any"));

      const registry = new GitRegistry({
        url: 'https://github.com/org/repo.git',
        fallbackUrl: 'git@github.com:org/repo.git',
        ref: 'nonexistent',
        cacheDir: testCacheDir,
      });

      await expect(registry.fetch('@company/base')).rejects.toThrow(GitRefNotFoundError);
    });

    it('should throw GitCloneError when fallback ref-recovery fetch fails with non-ref error', async () => {
      // Primary: auth error → fallback: ref error → retry without branch → fetch: network error
      mockGit.clone
        .mockRejectedValueOnce(new Error('Authentication failed'))
        .mockRejectedValueOnce(new Error('Could not find remote branch feature'))
        .mockImplementationOnce(async (_url: string, targetPath: string) => {
          await fs.mkdir(targetPath, { recursive: true });
        });
      mockGit.fetch.mockRejectedValueOnce(new Error('Network timeout'));

      const registry = new GitRegistry({
        url: 'https://github.com/org/repo.git',
        fallbackUrl: 'git@github.com:org/repo.git',
        ref: 'feature',
        cacheDir: testCacheDir,
      });

      await expect(registry.fetch('@company/base')).rejects.toThrow(GitCloneError);
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

    it('should preserve timeout errors while refreshing a stale cache', async () => {
      const registry = new GitRegistry({
        url: 'https://github.com/org/repo.git',
        cacheDir: testCacheDir,
        cache: { enabled: true, ttl: 1 },
      });

      await registry.fetch('@company/base');
      await new Promise((resolve) => setTimeout(resolve, 10));
      mockGit.fetch.mockRejectedValueOnce(new Error('operation timed out'));

      await expect(registry.fetch('@company/security')).rejects.toMatchObject({
        name: 'GitCloneError',
        message: expect.stringContaining('timed out'),
      });
      expect(mockGit.clone).toHaveBeenCalledTimes(1);
    });

    it('should report timeout during tag fallback while refreshing a stale cache', async () => {
      const registry = new GitRegistry({
        url: 'https://github.com/org/repo.git',
        cacheDir: testCacheDir,
        cache: { enabled: true, ttl: 1 },
      });

      await registry.fetch('@company/base');
      await new Promise((resolve) => setTimeout(resolve, 10));
      mockGit.fetch
        .mockRejectedValueOnce(new Error('Could not find remote branch'))
        .mockRejectedValueOnce(new Error('operation timed out'));

      await expect(registry.fetch('@company/security')).rejects.toMatchObject({
        name: 'GitCloneError',
        message: expect.stringContaining('timed out'),
      });
      expect(mockGit.clone).toHaveBeenCalledTimes(1);
    });
  });

  describe('list with subPath', () => {
    it('should list files using resolveDirectoryPath with subPath', async () => {
      // Arrange — mock clone to create directory structure with subPath
      mockGit.clone.mockImplementation(async (_url: string, targetPath: string) => {
        await fs.mkdir(targetPath, { recursive: true });
        await fs.mkdir(join(targetPath, '.git'), { recursive: true });
        await fs.mkdir(join(targetPath, 'registry', '@company'), { recursive: true });
        await fs.writeFile(
          join(targetPath, 'registry', '@company', 'base.prs'),
          '@meta\nname = "base"'
        );
      });

      const registry = new GitRegistry({
        url: 'https://github.com/org/repo.git',
        path: 'registry',
        cacheDir: testCacheDir,
      });

      // Act — list with subPath configured
      const files = await registry.list('@company');

      // Assert
      expect(files).toContain('base.prs');
    });
  });

  describe('authentication edge cases', () => {
    it('should fall back to plain URL when token auth has no token or env var', async () => {
      // Arrange — auth type is 'token' but neither token nor tokenEnvVar is set
      const registry = new GitRegistry({
        url: 'https://github.com/org/repo.git',
        cacheDir: testCacheDir,
        auth: {
          type: 'token',
          // no token, no tokenEnvVar — resolveToken returns undefined
        },
      });

      // Act
      await registry.fetch('@company/base');

      // Assert — clone called with the plain URL (no token embedded)
      expect(mockGit.clone).toHaveBeenCalledWith(
        'https://github.com/org/repo.git',
        expect.any(String),
        expect.any(Array)
      );
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

describe('validateRemoteAccess', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGit.listRemote.mockResolvedValue('');
  });

  it('should return accessible: true with commit hash when ls-remote succeeds', async () => {
    // Arrange
    const lsRemoteOutput = [
      'abc123def456789012345678901234567890abcd\tHEAD',
      'abc123def456789012345678901234567890abcd\trefs/heads/main',
    ].join('\n');
    mockGit.listRemote.mockResolvedValue(lsRemoteOutput);

    // Act
    const result = await validateRemoteAccess('https://github.com/org/repo.git');

    // Assert
    expect(result.accessible).toBe(true);
    expect(result.headCommit).toBe('abc123def456789012345678901234567890abcd');
    expect(result.error).toBeUndefined();
  });

  it('should return accessible: true with main branch commit when HEAD line absent', async () => {
    // Arrange — no HEAD line, only refs/heads/main
    const lsRemoteOutput = 'deadbeef1234567890123456789012345678abcd\trefs/heads/main\n';
    mockGit.listRemote.mockResolvedValue(lsRemoteOutput);

    // Act
    const result = await validateRemoteAccess('https://github.com/org/repo.git');

    // Assert
    expect(result.accessible).toBe(true);
    expect(result.headCommit).toBe('deadbeef1234567890123456789012345678abcd');
  });

  it('should resolve a requested ref', async () => {
    mockGit.listRemote.mockResolvedValue(
      [
        'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa\trefs/tags/v2.0.0',
        'feedfacefeedfacefeedfacefeedfacefeedface\trefs/tags/v2.0.0^{}',
      ].join('\n')
    );

    const result = await validateRemoteAccess('https://github.com/org/repo.git', 'v2.0.0');

    expect(mockGit.listRemote).toHaveBeenCalledWith([
      'https://github.com/org/repo.git',
      'v2.0.0',
      'v2.0.0^{}',
    ]);
    expect(result.headCommit).toBe('feedfacefeedfacefeedfacefeedfacefeedface');
  });

  it('should verify a requested commit with a targeted fetch', async () => {
    const commit = 'feedfacefeedfacefeedfacefeedfacefeedface';
    mockGit.revparse.mockResolvedValue(commit);

    const result = await validateRemoteAccess('https://github.com/org/repo.git', commit);

    expect(mockGit.addRemote).toHaveBeenCalledWith('origin', 'https://github.com/org/repo.git');
    expect(mockGit.fetch).toHaveBeenCalledWith(['origin', commit, '--depth=1']);
    expect(result.headCommit).toBe(commit);
  });

  it('should reject a requested commit when the fetched commit differs', async () => {
    const commit = 'feedfacefeedfacefeedfacefeedfacefeedface';
    mockGit.revparse.mockResolvedValue('deadbeefdeadbeefdeadbeefdeadbeefdeadbeef');

    const result = await validateRemoteAccess('https://github.com/org/repo.git', commit);

    expect(result).toEqual({ accessible: false, headCommit: undefined });
  });

  it('should use the first result when a requested ref has no peeled tag', async () => {
    mockGit.listRemote.mockResolvedValue(
      'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa\trefs/tags/v2.0.0'
    );

    const result = await validateRemoteAccess('https://github.com/org/repo.git', 'v2.0.0');

    expect(result.headCommit).toBe('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
  });

  it('should fall back to master and then the first remote result', async () => {
    mockGit.listRemote.mockResolvedValue(
      'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb\trefs/heads/master'
    );
    await expect(validateRemoteAccess('https://github.com/org/repo.git')).resolves.toMatchObject({
      headCommit: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
    });

    mockGit.listRemote.mockResolvedValue(
      'cccccccccccccccccccccccccccccccccccccccc\trefs/heads/develop'
    );
    await expect(validateRemoteAccess('https://github.com/org/repo.git')).resolves.toMatchObject({
      headCommit: 'cccccccccccccccccccccccccccccccccccccccc',
    });
  });

  it('should return accessible: false with auth error message for authentication failures', async () => {
    // Arrange
    mockGit.listRemote.mockRejectedValue(
      new Error('Authentication failed: could not read from remote repository')
    );

    // Act
    const result = await validateRemoteAccess('https://github.com/org/private.git');

    // Assert
    expect(result.accessible).toBe(false);
    expect(result.error).toContain('Authentication failed');
    expect(result.error).toContain('https://github.com/org/private.git');
    expect(result.error).toContain('personal access token');
  });

  it('should return accessible: false with auth error message for 403 responses', async () => {
    // Arrange
    mockGit.listRemote.mockRejectedValue(new Error('remote: HTTP 403 Forbidden'));

    // Act
    const result = await validateRemoteAccess('https://github.com/org/repo.git');

    // Assert
    expect(result.accessible).toBe(false);
    expect(result.error).toContain('Authentication failed');
    expect(result.error).toContain('personal access token');
  });

  it('should return accessible: false with network error for connection failures', async () => {
    // Arrange
    mockGit.listRemote.mockRejectedValue(new Error('getaddrinfo ENOTFOUND github.com'));

    // Act
    const result = await validateRemoteAccess('https://github.com/org/repo.git');

    // Assert
    expect(result.accessible).toBe(false);
    expect(result.error).toContain('Failed to reach');
    expect(result.error).toContain('https://github.com/org/repo.git');
    expect(result.error).toContain('network');
  });

  it('should bound a stalled ls-remote and report an actionable timeout', async () => {
    mockGit.listRemote.mockRejectedValue(new Error('block timeout reached'));

    const result = await validateRemoteAccess('https://github.com/org/repo.git', undefined, {
      timeout: 25,
    });

    expect(result.accessible).toBe(false);
    expect(result.error).toContain('Timed out after 25ms');
    expect(result.error).toContain('https://github.com/org/repo.git');
    expect(simpleGit).toHaveBeenCalledWith({
      timeout: { block: 25, stdErr: false, stdOut: false },
    });
    expect(mockGit.env).toHaveBeenCalledWith('GIT_TERMINAL_PROMPT', '0');
    expect(mockGit.env).toHaveBeenCalledWith('GCM_INTERACTIVE', 'never');
  });

  it('should bound a stalled commit probe and report an actionable timeout', async () => {
    const commit = 'feedfacefeedfacefeedfacefeedfacefeedface';
    mockGit.fetch.mockRejectedValue(new Error('block timeout reached'));

    const result = await validateRemoteAccess('https://github.com/org/repo.git', commit, {
      timeout: 25,
    });

    expect(result.accessible).toBe(false);
    expect(result.error).toContain('Timed out after 25ms');
    expect(result.error).toContain('https://github.com/org/repo.git');
    expect(simpleGit).toHaveBeenCalledWith(expect.any(String), {
      timeout: { block: 25, stdErr: false, stdOut: false },
    });
  });

  it('should classify ETIMEDOUT as a timeout before authentication', async () => {
    mockGit.listRemote.mockRejectedValue(
      Object.assign(new Error('Authentication failed while contacting remote'), {
        code: 'ETIMEDOUT',
      })
    );

    const result = await validateRemoteAccess('https://github.com/org/repo.git', undefined, {
      timeout: 25,
    });

    expect(result.accessible).toBe(false);
    expect(result.error).toContain('Timed out after 25ms');
    expect(result.error).not.toContain('Authentication failed');
  });

  it('should classify timeout codes nested in an error cause', async () => {
    const cause = Object.assign(new Error('remote authentication failed'), {
      code: 'ETIMEDOUT',
    });
    mockGit.listRemote.mockRejectedValue(new Error('remote probe failed', { cause }));

    const result = await validateRemoteAccess('https://github.com/org/repo.git', undefined, {
      timeout: 25,
    });

    expect(result.accessible).toBe(false);
    expect(result.error).toContain('Timed out after 25ms');
  });

  it('should ignore non-timeout causes during network error classification', async () => {
    const cause = new Error('connection reset');
    mockGit.listRemote.mockRejectedValue(new Error('remote probe failed', { cause }));

    const result = await validateRemoteAccess('https://github.com/org/repo.git');

    expect(result.accessible).toBe(false);
    expect(result.error).toContain('Failed to reach');
  });

  it('should normalize invalid validation timeout values', async () => {
    mockGit.listRemote.mockRejectedValue(new Error('block timeout reached'));

    const result = await validateRemoteAccess('https://github.com/org/repo.git', undefined, {
      timeout: Number.NaN,
    });

    expect(result.error).toContain('Timed out after 60000ms');
    expect(simpleGit).toHaveBeenCalledWith({
      timeout: { block: 60_000, stdErr: false, stdOut: false },
    });
  });
});

describe('versionSatisfiesRange', () => {
  it('should accept equivalent prefixed versions and compatible ranges', () => {
    expect(versionSatisfiesRange('v1.2.0', '1.2.0')).toBe(true);
    expect(versionSatisfiesRange('1.2.0', '^1.0.0')).toBe(true);
    expect(versionSatisfiesRange('v2.0.0', '^1.0.0')).toBe(false);
    expect(versionSatisfiesRange('v0.9.0', '^0.1.0')).toBe(false);
  });

  it('should distinguish semver ranges from numeric refs and commit hashes', () => {
    expect(isSemverRange('1.x')).toBe(true);
    expect(isSemverRange('v1.x')).toBe(true);
    expect(versionSatisfiesRange('v1.2.0', 'v1.x')).toBe(true);
    expect(isSemverRange('^1.2.3')).toBe(true);
    expect(isSemverRange('1.x.3')).toBe(false);
    expect(isSemverRange('123-feature')).toBe(false);
    expect(isSemverRange('1234567890abcdef1234567890abcdef12345678')).toBe(false);
  });

  it('should recognize wildcard, tilde, compound, and comparator ranges', () => {
    expect(isSemverRange('')).toBe(true);
    expect(isSemverRange('*')).toBe(true);
    expect(isSemverRange('1.2.3')).toBe(true);
    expect(isSemverRange('~1.2.3')).toBe(true);
    expect(isSemverRange('>=1.0.0 <2.0.0')).toBe(true);
    expect(isSemverRange('>=invalid')).toBe(false);
  });

  it('should enforce exact zero-major caret bounds', () => {
    expect(versionSatisfiesRange('0.0.5', '^0.0.5')).toBe(true);
    expect(versionSatisfiesRange('0.0.6', '^0.0.5')).toBe(false);
  });
});
