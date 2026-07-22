/**
 * Coverage tests for Resolver.verifyReferenceHashes and path traversal
 * detection in resolveRegistryImport.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { execFile } from 'child_process';
import { join } from 'path';
import { promises as fs, existsSync } from 'fs';
import { tmpdir } from 'os';
import { promisify } from 'util';
import { Resolver } from '../resolver.js';
import { RegistryCache } from '../registry-cache.js';
import type { Lockfile } from '@promptscript/core';
import { hashContent } from '../reference-hasher.js';
import {
  VENDOR_GIT_DIR,
  VENDOR_MANIFEST_FILE,
  getVendorRepositoryRelativePath,
  hashVendorRepository,
  type VendorManifest,
} from '../vendor-manifest.js';

const execFileAsync = promisify(execFile);

async function initializeVendoredGitRepository(directory: string): Promise<string> {
  await execFileAsync('git', ['init', directory]);
  await execFileAsync('git', ['-C', directory, 'add', '.']);
  await execFileAsync(
    'git',
    [
      '-C',
      directory,
      '-c',
      'user.name=PromptScript Tests',
      '-c',
      'user.email=tests@promptscript.dev',
      'commit',
      '-m',
      'fixture',
    ],
    { env: { ...process.env, GIT_CONFIG_GLOBAL: '/dev/null', GIT_CONFIG_NOSYSTEM: '1' } }
  );
  const result = await execFileAsync('git', ['-C', directory, 'rev-parse', 'HEAD']);
  await fs.rename(join(directory, '.git'), join(directory, VENDOR_GIT_DIR));
  return result.stdout.trim();
}

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

  it('verifies reference hashes from the vendored repository', async () => {
    const repoUrl = 'https://github.com/org/repo.git';
    const version = 'v1.0.0';
    const relativePath = '@core/skills.prs';
    const vendorDir = join(testCacheDir, 'vendor');
    const repositoryPath = join(vendorDir, getVendorRepositoryRelativePath(repoUrl));
    await fs.mkdir(join(repositoryPath, '@core'), { recursive: true });
    const content = 'vendored reference';
    await fs.writeFile(join(repositoryPath, relativePath), content);
    const commit = await initializeVendoredGitRepository(repositoryPath);
    const integrity = await hashVendorRepository(repositoryPath);
    const manifest: VendorManifest = {
      version: 1,
      dependencies: {
        [repoUrl]: {
          version,
          commit,
          integrity,
          path: getVendorRepositoryRelativePath(repoUrl),
        },
      },
    };
    await fs.writeFile(join(vendorDir, VENDOR_MANIFEST_FILE), JSON.stringify(manifest));
    const vendorResolver = new Resolver({
      registryPath: testCacheDir,
      localPath: testCacheDir,
      cacheDir: testCacheDir,
      vendorDir,
    });
    const lockfile: Lockfile = {
      version: 1,
      dependencies: {
        [repoUrl]: { version, commit, integrity: 'sha256-pending' },
      },
      references: {
        [`${repoUrl}\0${relativePath}\0${version}`]: {
          hash: hashContent(Buffer.from(content)),
          lockedAt: '2026-01-01T00:00:00Z',
        },
      },
    };

    const errors = await vendorResolver.verifyReferenceHashes(lockfile);

    expect(errors).toEqual([]);
  });
});
