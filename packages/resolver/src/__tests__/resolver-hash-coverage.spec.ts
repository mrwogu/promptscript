/**
 * Coverage tests for Resolver.verifyReferenceHashes and path traversal
 * detection in resolveRegistryImport.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { join } from 'path';
import { promises as fs, existsSync } from 'fs';
import { tmpdir } from 'os';
import { Resolver } from '../resolver.js';
import { RegistryCache } from '../registry-cache.js';
import type { Lockfile } from '@promptscript/core';
import { hashContent } from '../reference-hasher.js';

// ── Tests for verifyReferenceHashes ────────────────────────────────

describe('Resolver.verifyReferenceHashes', () => {
  let testCacheDir: string;
  let resolver: Resolver;

  beforeEach(async () => {
    vi.clearAllMocks();
    const testId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    testCacheDir = join(tmpdir(), `prs-hash-test-${testId}`);
    await fs.mkdir(testCacheDir, { recursive: true });

    resolver = new Resolver({
      registryPath: testCacheDir,
      localPath: testCacheDir,
      cacheDir: testCacheDir,
    });
  });

  afterEach(async () => {
    if (existsSync(testCacheDir)) {
      await fs.rm(testCacheDir, { recursive: true, force: true });
    }
  });

  it('returns empty array when lockfile has no references', async () => {
    const lockfile: Lockfile = { version: 1, dependencies: {}, references: {} };
    const errors = await resolver.verifyReferenceHashes(lockfile);
    expect(errors).toEqual([]);
  });

  it('returns empty array when lockfile references is undefined', async () => {
    const lockfile: Lockfile = { version: 1, dependencies: {} };
    const errors = await resolver.verifyReferenceHashes(lockfile);
    expect(errors).toEqual([]);
  });

  it('returns empty array for malformed reference keys (not 3 parts)', async () => {
    const lockfile: Lockfile = {
      version: 1,
      dependencies: {},
      references: {
        'only-two-parts\0something': {
          hash: 'abc',
          lockedAt: '2026-01-01T00:00:00Z',
        },
      },
    };
    const errors = await resolver.verifyReferenceHashes(lockfile);
    expect(errors).toEqual([]);
  });

  it('returns empty array when referenced file does not exist in cache', async () => {
    const lockfile: Lockfile = {
      version: 1,
      dependencies: {},
      references: {
        'https://github.com/org/repo.git\0@core/skills.prs\0v1.0.0': {
          hash: 'abc',
          lockedAt: '2026-01-01T00:00:00Z',
        },
      },
    };
    const errors = await resolver.verifyReferenceHashes(lockfile);
    expect(errors).toEqual([]);
  });

  it('reports error when hash does not match', async () => {
    const repoUrl = 'https://github.com/org/repo.git';
    const version = 'v1.0.0';
    const relativePath = '@core/skills.prs';

    const cache = new RegistryCache(testCacheDir);
    const cachePath = cache.getCachePath(repoUrl, version);
    await fs.mkdir(join(cachePath, '@core'), { recursive: true });
    const fileContent = 'content has changed';
    await fs.writeFile(join(cachePath, relativePath), fileContent);

    const lockfile: Lockfile = {
      version: 1,
      dependencies: {},
      references: {
        [`${repoUrl}\0${relativePath}\0${version}`]: {
          hash: 'different-hash-value',
          lockedAt: '2026-01-01T00:00:00Z',
        },
      },
    };

    const errors = await resolver.verifyReferenceHashes(lockfile);
    expect(errors).toHaveLength(1);
    expect(errors[0]!.message).toContain('hash mismatch');
    expect(errors[0]!.message).toContain(relativePath);
  });

  it('returns no errors when hash matches', async () => {
    const repoUrl = 'https://github.com/org/repo.git';
    const version = 'v1.0.0';
    const relativePath = '@core/skills.prs';

    const cache = new RegistryCache(testCacheDir);
    const cachePath = cache.getCachePath(repoUrl, version);
    await fs.mkdir(join(cachePath, '@core'), { recursive: true });
    const fileContent = 'matching content';
    await fs.writeFile(join(cachePath, relativePath), fileContent);

    const actualHash = hashContent(Buffer.from(fileContent, 'utf-8'));

    const lockfile: Lockfile = {
      version: 1,
      dependencies: {},
      references: {
        [`${repoUrl}\0${relativePath}\0${version}`]: {
          hash: actualHash,
          lockedAt: '2026-01-01T00:00:00Z',
        },
      },
    };

    const errors = await resolver.verifyReferenceHashes(lockfile);
    expect(errors).toEqual([]);
  });

  it('skips entries that throw during file read', async () => {
    const lockfile: Lockfile = {
      version: 1,
      dependencies: {},
      references: {
        'https://github.com/org/repo.git\0@core/skills.prs\0v1.0.0': {
          hash: 'abc',
          lockedAt: '2026-01-01T00:00:00Z',
        },
      },
    };
    // File doesn't exist, so it will throw — should be caught and skipped
    const errors = await resolver.verifyReferenceHashes(lockfile);
    expect(errors).toEqual([]);
  });
});
