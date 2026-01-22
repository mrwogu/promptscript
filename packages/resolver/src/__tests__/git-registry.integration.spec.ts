/**
 * Integration tests for GitRegistry.
 *
 * These tests verify actual Git operations against real repositories.
 * They are skipped by default and can be enabled by setting:
 *   TEST_GIT_REGISTRY_INTEGRATION=true
 *
 * For private repo testing, also set:
 *   TEST_GIT_REGISTRY_TOKEN=<your-github-token>
 *
 * @packageDocumentation
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { existsSync, promises as fs } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { GitRegistry, GitRefNotFoundError } from '../git-registry.js';

const INTEGRATION_ENABLED = process.env['TEST_GIT_REGISTRY_INTEGRATION'] === 'true';
const GITHUB_TOKEN = process.env['TEST_GIT_REGISTRY_TOKEN'];

// Public repo for testing - uses a well-known, stable public repo
const PUBLIC_REPO_URL = 'https://github.com/octocat/Hello-World.git';
const PUBLIC_REPO_BRANCH = 'master';

describe.skipIf(!INTEGRATION_ENABLED)('GitRegistry Integration', () => {
  let testCacheDir: string;

  beforeAll(async () => {
    testCacheDir = join(
      tmpdir(),
      `prs-git-integration-${Date.now()}-${Math.random().toString(36).slice(2)}`
    );
    await fs.mkdir(testCacheDir, { recursive: true });
  });

  afterAll(async () => {
    if (existsSync(testCacheDir)) {
      await fs.rm(testCacheDir, { recursive: true, force: true });
    }
  });

  describe('public repository', () => {
    it('should clone and fetch a file from public repo', async () => {
      const registry = new GitRegistry({
        url: PUBLIC_REPO_URL,
        ref: PUBLIC_REPO_BRANCH,
        cacheDir: testCacheDir,
      });

      // README exists in Hello-World repo
      const exists = await registry.exists('README');
      expect(exists).toBe(true);
    });

    it('should list files in repository root', async () => {
      const registry = new GitRegistry({
        url: PUBLIC_REPO_URL,
        ref: PUBLIC_REPO_BRANCH,
        cacheDir: testCacheDir,
      });

      const files = await registry.list('');
      expect(files.length).toBeGreaterThan(0);
      expect(files.some((f) => f === 'README' || f === 'README.md')).toBe(true);
    });

    it('should get commit hash', async () => {
      const registry = new GitRegistry({
        url: PUBLIC_REPO_URL,
        ref: PUBLIC_REPO_BRANCH,
        cacheDir: testCacheDir,
      });

      const hash = await registry.getCommitHash();
      expect(hash).toMatch(/^[a-f0-9]{40}$/);
    });

    it('should throw GitRefNotFoundError for non-existent branch', async () => {
      const registry = new GitRegistry({
        url: PUBLIC_REPO_URL,
        ref: 'this-branch-does-not-exist-12345',
        cacheDir: join(testCacheDir, 'nonexistent-branch'),
      });

      await expect(registry.exists('README')).rejects.toThrow(GitRefNotFoundError);
    });

    it('should use cache on second access', async () => {
      const cachePath = join(testCacheDir, 'cache-test');
      const registry = new GitRegistry({
        url: PUBLIC_REPO_URL,
        ref: PUBLIC_REPO_BRANCH,
        cacheDir: cachePath,
        cache: { enabled: true, ttl: 3600000 },
      });

      // First access - should clone
      const startTime = Date.now();
      await registry.exists('README');
      const firstAccessTime = Date.now() - startTime;

      // Second access - should use cache (much faster)
      const startTime2 = Date.now();
      await registry.exists('README');
      const secondAccessTime = Date.now() - startTime2;

      // Cache access should be significantly faster
      expect(secondAccessTime).toBeLessThan(firstAccessTime);
    });

    it('should refresh cache when requested', async () => {
      const cachePath = join(testCacheDir, 'refresh-test');
      const registry = new GitRegistry({
        url: PUBLIC_REPO_URL,
        ref: PUBLIC_REPO_BRANCH,
        cacheDir: cachePath,
      });

      // First access
      await registry.exists('README');

      // Refresh should re-clone
      await registry.refresh();

      // Should still work after refresh
      const exists = await registry.exists('README');
      expect(exists).toBe(true);
    });
  });

  describe.skipIf(!GITHUB_TOKEN)('private repository with token', () => {
    // These tests require a GitHub token with repo access
    // Set TEST_GIT_REGISTRY_TOKEN to your personal access token

    it('should authenticate with token', async () => {
      // Using a public repo but with auth to verify token handling
      const registry = new GitRegistry({
        url: PUBLIC_REPO_URL,
        ref: PUBLIC_REPO_BRANCH,
        cacheDir: join(testCacheDir, 'auth-test'),
        auth: {
          type: 'token',
          token: GITHUB_TOKEN,
        },
      });

      const exists = await registry.exists('README');
      expect(exists).toBe(true);
    });
  });
});

/**
 * These tests can be run manually to verify Git registry functionality.
 * They provide a quick way to test against any Git repository.
 *
 * Usage:
 *   TEST_GIT_REGISTRY_INTEGRATION=true \
 *   TEST_GIT_REGISTRY_URL=https://github.com/your-org/your-repo.git \
 *   pnpm nx test resolver --testNamePattern="manual"
 */
describe.skipIf(!process.env['TEST_GIT_REGISTRY_URL'])('GitRegistry Manual Test', () => {
  const customUrl = process.env['TEST_GIT_REGISTRY_URL']!;
  const customRef = process.env['TEST_GIT_REGISTRY_REF'] ?? 'main';
  const customPath = process.env['TEST_GIT_REGISTRY_PATH'];

  let testCacheDir: string;

  beforeAll(async () => {
    testCacheDir = join(tmpdir(), `prs-git-manual-${Date.now()}`);
    await fs.mkdir(testCacheDir, { recursive: true });
  });

  afterAll(async () => {
    if (existsSync(testCacheDir)) {
      await fs.rm(testCacheDir, { recursive: true, force: true });
    }
  });

  it('should connect to custom repository', async () => {
    const registry = new GitRegistry({
      url: customUrl,
      ref: customRef,
      path: customPath,
      cacheDir: testCacheDir,
      auth: GITHUB_TOKEN
        ? {
            type: 'token',
            token: GITHUB_TOKEN,
          }
        : undefined,
    });

    const files = await registry.list('');
    console.log('Files in repository root:', files);
    expect(files.length).toBeGreaterThanOrEqual(0);
  });

  it('should fetch file if path specified', async () => {
    const filePath = process.env['TEST_GIT_REGISTRY_FILE'];
    if (!filePath) {
      console.log('Skipping: TEST_GIT_REGISTRY_FILE not set');
      return;
    }

    const registry = new GitRegistry({
      url: customUrl,
      ref: customRef,
      path: customPath,
      cacheDir: testCacheDir,
      auth: GITHUB_TOKEN
        ? {
            type: 'token',
            token: GITHUB_TOKEN,
          }
        : undefined,
    });

    const content = await registry.fetch(filePath);
    console.log('File content length:', content.length);
    expect(content.length).toBeGreaterThan(0);
  });
});

/**
 * Official PromptScript Registry integration tests.
 *
 * These tests verify that the official registry is accessible and
 * contains expected configurations.
 *
 * Enable with: TEST_GIT_REGISTRY_INTEGRATION=true
 */
describe.skipIf(!INTEGRATION_ENABLED)('Official PromptScript Registry', () => {
  const OFFICIAL_REGISTRY = 'https://github.com/mrwogu/promptscript-registry.git';
  let testCacheDir: string;

  beforeAll(async () => {
    testCacheDir = join(
      tmpdir(),
      `prs-official-registry-${Date.now()}-${Math.random().toString(36).slice(2)}`
    );
    await fs.mkdir(testCacheDir, { recursive: true });
  });

  afterAll(async () => {
    if (existsSync(testCacheDir)) {
      await fs.rm(testCacheDir, { recursive: true, force: true });
    }
  });

  it('should fetch @core/base.prs', async () => {
    const registry = new GitRegistry({
      url: OFFICIAL_REGISTRY,
      ref: 'main',
      cacheDir: testCacheDir,
    });

    const content = await registry.fetch('@core/base.prs');
    expect(content).toContain('@meta');
    expect(content).toContain('id: "@core/base"');
  });

  it('should list @roles/developer files', async () => {
    const registry = new GitRegistry({
      url: OFFICIAL_REGISTRY,
      ref: 'main',
      cacheDir: testCacheDir,
    });

    const files = await registry.list('@roles/developer');
    expect(files).toContain('fullstack.prs');
    expect(files).toContain('frontend.prs');
    expect(files).toContain('backend.prs');
  });

  it('should verify @roles/developer/fullstack inherits from @core/base', async () => {
    const registry = new GitRegistry({
      url: OFFICIAL_REGISTRY,
      ref: 'main',
      cacheDir: testCacheDir,
    });

    const content = await registry.fetch('@roles/developer/fullstack.prs');
    expect(content).toContain('@inherit @core/base');
  });

  it('should list @stacks files', async () => {
    const registry = new GitRegistry({
      url: OFFICIAL_REGISTRY,
      ref: 'main',
      cacheDir: testCacheDir,
    });

    const files = await registry.list('@stacks');
    expect(files).toContain('react.prs');
    expect(files).toContain('node.prs');
    expect(files).toContain('python.prs');
  });

  it('should list @fragments files', async () => {
    const registry = new GitRegistry({
      url: OFFICIAL_REGISTRY,
      ref: 'main',
      cacheDir: testCacheDir,
    });

    const files = await registry.list('@fragments');
    expect(files).toContain('testing.prs');
    expect(files).toContain('code-review.prs');
  });
});
