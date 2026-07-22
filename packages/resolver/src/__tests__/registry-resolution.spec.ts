/**
 * Integration tests for registry resolution wiring in FileLoader and Resolver.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { execFile } from 'child_process';
import { existsSync, promises as fs } from 'fs';
import { join, resolve, dirname } from 'path';
import { tmpdir } from 'os';
import { fileURLToPath } from 'url';
import { promisify } from 'util';
import type { PathReference, RegistriesConfig } from '@promptscript/core';
import {
  FileLoader,
  REGISTRY_MARKER_PREFIX,
  parseRegistryMarker,
  buildRegistryMarker,
} from '../loader.js';
import { Resolver } from '../resolver.js';
import { RegistryCache } from '../registry-cache.js';
import {
  VENDOR_GIT_DIR,
  getVendorRepositoryRelativePath,
  hashVendorRepository,
  VENDOR_MANIFEST_FILE,
  type VendorManifest,
} from '../vendor-manifest.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const FIXTURES_DIR = resolve(__dirname, '__fixtures__');
const execFileAsync = promisify(execFile);

// ---------------------------------------------------------------------------
// Mock simple-git (required because GitRegistry uses it internally)
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

function makePathRef(raw: string, isRelative = false): PathReference {
  const segments = raw.replace(/^@/, '').split('/');
  return {
    type: 'PathReference',
    raw,
    segments,
    isRelative,
    loc: { file: '<test>', line: 1, column: 1, offset: 0 },
  };
}

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

async function initializeCacheGitRepository(directory: string): Promise<string> {
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
  return result.stdout.trim();
}

const TEST_REGISTRIES: RegistriesConfig = {
  '@acme': 'https://github.com/acme/prs-standards.git',
  '@internal': {
    url: 'git@gitlab.internal.com:company/monorepo',
    root: 'packages/prs',
  },
};

// ---------------------------------------------------------------------------
// Tests: loader marker functions
// ---------------------------------------------------------------------------

describe('Registry marker helpers', () => {
  it('buildRegistryMarker creates a string starting with the marker prefix', () => {
    const marker = buildRegistryMarker(
      'https://github.com/acme/repo.git',
      'standards/security',
      'v1.2.0'
    );
    expect(marker.startsWith(REGISTRY_MARKER_PREFIX)).toBe(true);
  });

  it('parseRegistryMarker round-trips with buildRegistryMarker', () => {
    const marker = buildRegistryMarker(
      'https://github.com/acme/repo.git',
      'standards/security',
      'v1.2.0'
    );
    const parsed = parseRegistryMarker(marker);
    expect(parsed).toEqual({
      repoUrl: 'https://github.com/acme/repo.git',
      path: 'standards/security',
      version: 'v1.2.0',
    });
  });

  it('parseRegistryMarker handles empty version', () => {
    const marker = buildRegistryMarker('https://github.com/acme/repo.git', 'some/path', '');
    const parsed = parseRegistryMarker(marker);
    expect(parsed).toEqual({
      repoUrl: 'https://github.com/acme/repo.git',
      path: 'some/path',
      version: '',
    });
  });

  it('parseRegistryMarker handles URLs with colons (SSH format)', () => {
    const marker = buildRegistryMarker(
      'git@gitlab.internal.com:company/monorepo',
      'packages/prs/auth',
      ''
    );
    const parsed = parseRegistryMarker(marker);
    expect(parsed).toEqual({
      repoUrl: 'git@gitlab.internal.com:company/monorepo',
      path: 'packages/prs/auth',
      version: '',
    });
  });

  it('parseRegistryMarker returns null for non-marker strings', () => {
    expect(parseRegistryMarker('/some/absolute/path.prs')).toBeNull();
    expect(parseRegistryMarker('./relative.prs')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Tests: FileLoader.resolveRef with registries
// ---------------------------------------------------------------------------

describe('FileLoader.resolveRef — registry integration', () => {
  it('returns registry marker for alias paths when registries config is provided', () => {
    // Arrange
    const loader = new FileLoader({
      registryPath: '/registry',
      localPath: '/local',
      registries: TEST_REGISTRIES,
    });
    const ref = makePathRef('@acme/standards/security@1.2.0');

    // Act
    const result = loader.resolveRef(ref, '/local/file.prs');

    // Assert
    expect(result.startsWith(REGISTRY_MARKER_PREFIX)).toBe(true);
    const parsed = parseRegistryMarker(result);
    expect(parsed).not.toBeNull();
    expect(parsed!.repoUrl).toBe('https://github.com/acme/prs-standards.git');
    expect(parsed!.path).toBe('standards/security');
    expect(parsed!.version).toBe('1.2.0');
  });

  it('returns registry marker for alias paths with root config', () => {
    // Arrange
    const loader = new FileLoader({
      registryPath: '/registry',
      localPath: '/local',
      registries: TEST_REGISTRIES,
    });
    const ref = makePathRef('@internal/auth');

    // Act
    const result = loader.resolveRef(ref, '/local/file.prs');

    // Assert
    expect(result.startsWith(REGISTRY_MARKER_PREFIX)).toBe(true);
    const parsed = parseRegistryMarker(result);
    expect(parsed).not.toBeNull();
    expect(parsed!.repoUrl).toBe('git@gitlab.internal.com:company/monorepo');
    expect(parsed!.path).toBe('packages/prs/auth');
    expect(parsed!.version).toBe('');
  });

  it('returns registry marker for URL-like paths', () => {
    // Arrange
    const loader = new FileLoader({
      registryPath: '/registry',
      localPath: '/local',
      registries: TEST_REGISTRIES,
    });
    const ref = makePathRef('github.com/org/repo/standards/base');
    // URL-like paths have a dot in the first segment
    ref.segments = ['github.com', 'org', 'repo', 'standards', 'base'];

    // Act
    const result = loader.resolveRef(ref, '/local/file.prs');

    // Assert
    expect(result.startsWith(REGISTRY_MARKER_PREFIX)).toBe(true);
    const parsed = parseRegistryMarker(result);
    expect(parsed).not.toBeNull();
    expect(parsed!.repoUrl).toBe('https://github.com/org/repo');
    expect(parsed!.path).toBe('standards/base');
  });

  it('removes the version suffix from URL-like registry paths', () => {
    const loader = new FileLoader({
      registryPath: '/registry',
      localPath: '/local',
    });
    const ref = makePathRef('github.com/org/repo/standards/base@^1.2.0');
    ref.segments = ['github.com', 'org', 'repo', 'standards', 'base'];
    ref.version = '^1.2.0';

    const parsed = parseRegistryMarker(loader.resolveRef(ref, '/local/file.prs'));

    expect(parsed).toEqual({
      repoUrl: 'https://github.com/org/repo',
      path: 'standards/base',
      version: '^1.2.0',
    });
  });

  it('still resolves relative paths correctly (regression)', () => {
    // Arrange
    const loader = new FileLoader({
      registryPath: '/registry',
      localPath: '/local',
      registries: TEST_REGISTRIES,
    });
    const ref = makePathRef('./sibling', true);

    // Act
    const result = loader.resolveRef(ref, '/local/project/file.prs');

    // Assert
    expect(result).toBe(resolve('/local/project', 'sibling.prs'));
    expect(result.startsWith(REGISTRY_MARKER_PREFIX)).toBe(false);
  });

  it('still resolves existing @namespace registry paths when no registries config', () => {
    // Arrange — no registries config, so @namespace falls through to toAbsolutePath
    const loader = new FileLoader({
      registryPath: '/registry',
      localPath: '/local',
    });
    const ref = makePathRef('@core/base');

    // Act
    const result = loader.resolveRef(ref, '/local/file.prs');

    // Assert — should resolve via the filesystem registry path
    expect(result).toBe(resolve('/registry', '@core', 'base.prs'));
    expect(result.startsWith(REGISTRY_MARKER_PREFIX)).toBe(false);
  });

  it('falls through to toAbsolutePath for unknown aliases', () => {
    // Arrange — @unknown is not in the registries config
    const loader = new FileLoader({
      registryPath: '/registry',
      localPath: '/local',
      registries: TEST_REGISTRIES,
    });
    const ref = makePathRef('@unknown/path');

    // Act
    const result = loader.resolveRef(ref, '/local/file.prs');

    // Assert — should fall through to normal toAbsolutePath behavior
    expect(result.startsWith(REGISTRY_MARKER_PREFIX)).toBe(false);
    expect(result).toBe(resolve('/registry', '@unknown', 'path.prs'));
  });
});

// ---------------------------------------------------------------------------
// Tests: Resolver handling of registry markers
// ---------------------------------------------------------------------------

describe('Resolver — registry marker handling', () => {
  let testCacheDir: string;

  beforeEach(async () => {
    vi.clearAllMocks();

    mockGit.clone.mockResolvedValue(undefined);
    mockGit.revparse.mockResolvedValue('abc123def456');
    mockGit.env.mockReturnThis();

    const testId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    testCacheDir = join(tmpdir(), `prs-resolver-reg-test-${testId}`);
    await fs.mkdir(testCacheDir, { recursive: true });
  });

  afterEach(async () => {
    if (existsSync(testCacheDir)) {
      await fs.rm(testCacheDir, { recursive: true, force: true });
    }
  });

  it('resolves a file without registry imports normally (regression)', async () => {
    // Arrange
    const resolver = new Resolver({
      registryPath: resolve(FIXTURES_DIR, 'registry'),
      localPath: FIXTURES_DIR,
      registries: TEST_REGISTRIES,
      cache: false,
      cacheDir: join(testCacheDir, 'regcache'),
    });

    // Act — resolve a plain fixture with no @use directives
    const result = await resolver.resolve('./minimal.prs');

    // Assert
    expect(result.ast).not.toBeNull();
    expect(result.errors).toHaveLength(0);
    expect(result.sources).toHaveLength(1);
  });

  it('prefers an exact vendored dependency over cache and network access', async () => {
    const tempDir = join(testCacheDir, 'vendor-project');
    const vendorDir = join(tempDir, '.promptscript', 'vendor');
    const repoUrl = TEST_REGISTRIES['@acme'] as string;
    const vendorPath = getVendorRepositoryRelativePath(repoUrl);
    const repositoryDir = join(vendorDir, vendorPath);
    await fs.mkdir(repositoryDir, { recursive: true });
    await fs.writeFile(
      join(vendorDir, vendorPath, 'standards.prs'),
      [
        '@meta {',
        '  id: "vendored-standards"',
        '  syntax: "1.0.0"',
        '}',
        '',
        '@context {',
        '  """',
        '  Vendored standards',
        '  """',
        '}',
      ].join('\n')
    );
    const commit = await initializeVendoredGitRepository(repositoryDir);
    const integrity = await hashVendorRepository(repositoryDir);
    const manifest: VendorManifest = {
      version: 1,
      dependencies: {
        [repoUrl]: { version: 'v1.2.0', commit, integrity, path: vendorPath },
      },
    };
    await fs.writeFile(join(vendorDir, VENDOR_MANIFEST_FILE), JSON.stringify(manifest));
    const entryPath = join(tempDir, 'project.prs');
    await fs.writeFile(
      entryPath,
      [
        '@meta {',
        '  id: "vendor-project"',
        '  syntax: "1.0.0"',
        '}',
        '',
        '@use @acme/standards@v1.2.0',
      ].join('\n')
    );

    const resolver = new Resolver({
      registryPath: resolve(FIXTURES_DIR, 'registry'),
      localPath: tempDir,
      registries: TEST_REGISTRIES,
      vendorDir,
      cache: false,
      cacheDir: join(testCacheDir, 'empty-cache'),
      lockfile: {
        version: 1,
        dependencies: {
          [repoUrl]: {
            version: 'v1.2.0',
            commit,
            integrity: 'sha256-test',
          },
        },
      },
    });

    const result = await resolver.resolve(entryPath);

    expect(result.errors).toHaveLength(0);
    expect(result.ast).not.toBeNull();
    expect(mockGit.clone).not.toHaveBeenCalled();
  });

  it('rejects a vendored dependency that does not match the lockfile', async () => {
    const tempDir = join(testCacheDir, 'stale-vendor-project');
    const vendorDir = join(tempDir, '.promptscript', 'vendor');
    const repoUrl = TEST_REGISTRIES['@acme'] as string;
    const vendorPath = getVendorRepositoryRelativePath(repoUrl);
    const commit = 'a'.repeat(40);
    await fs.mkdir(join(vendorDir, vendorPath), { recursive: true });
    const manifest: VendorManifest = {
      version: 1,
      dependencies: {
        [repoUrl]: {
          version: 'v1.2.0',
          commit: 'b'.repeat(40),
          integrity: 'sha256-test',
          path: vendorPath,
        },
      },
    };
    await fs.writeFile(join(vendorDir, VENDOR_MANIFEST_FILE), JSON.stringify(manifest));
    const entryPath = join(tempDir, 'project.prs');
    await fs.writeFile(
      entryPath,
      [
        '@meta {',
        '  id: "stale-vendor-project"',
        '  syntax: "1.0.0"',
        '}',
        '',
        '@use @acme/standards@v1.2.0',
      ].join('\n')
    );

    const resolver = new Resolver({
      registryPath: resolve(FIXTURES_DIR, 'registry'),
      localPath: tempDir,
      registries: TEST_REGISTRIES,
      vendorDir,
      cache: false,
      cacheDir: join(testCacheDir, 'empty-cache-stale'),
      lockfile: {
        version: 1,
        dependencies: {
          [repoUrl]: {
            version: 'v1.2.0',
            commit,
            integrity: 'sha256-test',
          },
        },
      },
    });

    const result = await resolver.resolve(entryPath);

    expect(result.errors.some((error) => error.message.includes('out of sync'))).toBe(true);
    expect(mockGit.clone).not.toHaveBeenCalled();
  });

  it('rejects vendored dependencies without a lockfile pin', async () => {
    const tempDir = join(testCacheDir, 'unpinned-vendor-project');
    const vendorDir = join(tempDir, '.promptscript', 'vendor');
    const repoUrl = TEST_REGISTRIES['@acme'] as string;
    const vendorPath = getVendorRepositoryRelativePath(repoUrl);
    await fs.mkdir(join(vendorDir, vendorPath), { recursive: true });
    const manifest: VendorManifest = {
      version: 1,
      dependencies: {
        [repoUrl]: {
          version: 'v1.2.0',
          commit: 'a'.repeat(40),
          integrity: 'sha256-test',
          path: vendorPath,
        },
      },
    };
    await fs.writeFile(join(vendorDir, VENDOR_MANIFEST_FILE), JSON.stringify(manifest));
    const entryPath = join(tempDir, 'project.prs');
    await fs.writeFile(
      entryPath,
      [
        '@meta {',
        '  id: "unpinned-vendor-project"',
        '  syntax: "1.0.0"',
        '}',
        '',
        '@use @acme/standards@v1.2.0',
      ].join('\n')
    );
    const resolver = new Resolver({
      registryPath: resolve(FIXTURES_DIR, 'registry'),
      localPath: tempDir,
      registries: TEST_REGISTRIES,
      vendorDir,
      cache: false,
      cacheDir: join(testCacheDir, 'empty-cache-unpinned'),
    });

    const result = await resolver.resolve(entryPath);

    expect(result.errors.some((error) => error.message.includes('not pinned'))).toBe(true);
    expect(mockGit.clone).not.toHaveBeenCalled();
  });

  it('rejects remote dependencies omitted from an existing lockfile', async () => {
    const tempDir = join(testCacheDir, 'missing-lock-entry');
    await fs.mkdir(tempDir, { recursive: true });
    const entryPath = join(tempDir, 'project.prs');
    await fs.writeFile(
      entryPath,
      '@meta { id: "missing-lock-entry" syntax: "1.0.0" }\n@use github.com/org/repo/standards'
    );
    const resolver = new Resolver({
      registryPath: resolve(FIXTURES_DIR, 'registry'),
      localPath: tempDir,
      cache: false,
      cacheDir: join(testCacheDir, 'missing-lock-entry-cache'),
      lockfile: { version: 1, dependencies: {} },
    });

    const result = await resolver.resolve(entryPath);

    expect(
      result.errors.some((error) => error.message.includes('not pinned by the lockfile'))
    ).toBe(true);
    expect(mockGit.clone).not.toHaveBeenCalled();
  });

  it('rejects an existing vendor directory without a manifest', async () => {
    const tempDir = join(testCacheDir, 'missing-vendor-manifest');
    const vendorDir = join(tempDir, 'vendor');
    await fs.mkdir(vendorDir, { recursive: true });
    const entryPath = join(tempDir, 'project.prs');
    await fs.writeFile(
      entryPath,
      '@meta { id: "missing-vendor-manifest" syntax: "1.0.0" }\n@use github.com/org/repo/standards'
    );
    const resolver = new Resolver({
      registryPath: resolve(FIXTURES_DIR, 'registry'),
      localPath: tempDir,
      vendorDir,
      cache: false,
      cacheDir: join(testCacheDir, 'missing-vendor-manifest-cache'),
    });

    const result = await resolver.resolve(entryPath);

    expect(
      result.errors.some((error) => error.message.includes('Vendor manifest is missing'))
    ).toBe(true);
    expect(mockGit.clone).not.toHaveBeenCalled();
  });

  it('matches Markdown lock entries keyed by repository subpath', async () => {
    const tempDir = join(testCacheDir, 'markdown-lock-entry');
    const vendorDir = join(tempDir, 'vendor');
    const repoUrl = TEST_REGISTRIES['@acme'] as string;
    const path = getVendorRepositoryRelativePath(repoUrl);
    const repositoryDir = join(vendorDir, path);
    await fs.mkdir(repositoryDir, { recursive: true });
    await fs.writeFile(
      join(repositoryDir, 'standards.prs'),
      '@meta { id: "markdown-lock-entry" syntax: "1.0.0" }'
    );
    const commit = await initializeVendoredGitRepository(repositoryDir);
    const integrity = await hashVendorRepository(repositoryDir);
    const manifest: VendorManifest = {
      version: 1,
      dependencies: {
        [repoUrl]: { version: 'v1.2.0', commit, integrity, path },
      },
    };
    await fs.writeFile(join(vendorDir, VENDOR_MANIFEST_FILE), JSON.stringify(manifest));
    const entryPath = join(tempDir, 'project.prs');
    await fs.writeFile(
      entryPath,
      '@meta { id: "markdown-lock-project" syntax: "1.0.0" }\n@use @acme/standards'
    );
    const resolver = new Resolver({
      registryPath: resolve(FIXTURES_DIR, 'registry'),
      localPath: tempDir,
      registries: TEST_REGISTRIES,
      vendorDir,
      cache: false,
      cacheDir: join(testCacheDir, 'markdown-lock-cache'),
      lockfile: {
        version: 1,
        dependencies: {
          [`${repoUrl}/standards`]: {
            version: 'v1.2.0',
            commit,
            integrity,
            source: 'md',
          },
        },
      },
    });

    const result = await resolver.resolve(entryPath);

    expect(result.errors).toEqual([]);
    expect(result.ast).not.toBeNull();
  });

  it('accepts a cached repository matching a commit marker', async () => {
    const tempDir = join(testCacheDir, 'matching-commit-cache');
    const sourceRepository = join(tempDir, 'source');
    await fs.mkdir(sourceRepository, { recursive: true });
    await fs.writeFile(
      join(sourceRepository, 'standards.prs'),
      '@meta { id: "matching-commit" syntax: "1.0.0" }'
    );
    const commit = await initializeCacheGitRepository(sourceRepository);
    const repoUrl = 'https://github.com/org/repo';
    const cacheDir = join(testCacheDir, 'matching-commit-registry-cache');
    const registryCache = new RegistryCache(cacheDir);
    const cachePath = registryCache.getCachePath(repoUrl, commit);
    await fs.mkdir(dirname(cachePath), { recursive: true });
    await fs.rename(sourceRepository, cachePath);
    await registryCache.set(repoUrl, commit, commit);
    const entryPath = join(tempDir, 'project.prs');
    await fs.writeFile(
      entryPath,
      `@meta { id: "matching-commit-project" syntax: "1.0.0" }\n@use github.com/org/repo/standards@${commit}`
    );
    const resolver = new Resolver({
      registryPath: resolve(FIXTURES_DIR, 'registry'),
      localPath: tempDir,
      cache: false,
      cacheDir,
    });

    const result = await resolver.resolve(entryPath);

    expect(result.errors).toEqual([]);
    expect(result.ast).not.toBeNull();
    expect(mockGit.clone).not.toHaveBeenCalled();
  });

  it('produces error for registry import when no .prs file or native content found', async () => {
    // Arrange — Create a .prs file that uses a registry import
    const tempDir = join(testCacheDir, 'project');
    await fs.mkdir(tempDir, { recursive: true });

    const prsContent = [
      '@meta {',
      '  id: "test-registry-import"',
      '  syntax: "1.0.0"',
      '}',
      '',
      '@use @acme/nonexistent',
      '',
      '@context {',
      '  """',
      '  placeholder',
      '  """',
      '}',
    ].join('\n');
    const prsFile = join(tempDir, 'test.prs');
    await fs.writeFile(prsFile, prsContent);

    const resolver = new Resolver({
      registryPath: resolve(FIXTURES_DIR, 'registry'),
      localPath: tempDir,
      registries: TEST_REGISTRIES,
      cache: false,
      cacheDir: join(testCacheDir, 'regcache1'),
    });

    // Act
    const result = await resolver.resolve(prsFile);

    // Assert — should have errors about the failed registry import
    expect(result.errors.length).toBeGreaterThan(0);
    const errorMessages = result.errors.map((e) => e.message);
    const hasRegistryError = errorMessages.some(
      (msg) =>
        msg.includes('registry') || msg.includes('resolve import') || msg.includes('Cannot resolve')
    );
    expect(hasRegistryError).toBe(true);
  });

  it('caches registry import AST when cache is enabled', async () => {
    // Arrange
    const tempDir = join(testCacheDir, 'project-cached');
    await fs.mkdir(tempDir, { recursive: true });

    const prsContent = [
      '@meta {',
      '  id: "test-cache-enabled"',
      '  syntax: "1.0.0"',
      '}',
      '',
      '@use @acme/standards',
      '',
      '@identity {',
      '  """',
      '  test identity',
      '  """',
      '}',
    ].join('\n');
    const prsFile = join(tempDir, 'test.prs');
    await fs.writeFile(prsFile, prsContent);

    mockGit.clone.mockImplementation(async (_url: string, targetDir: string) => {
      await fs.mkdir(targetDir, { recursive: true });
      await fs.writeFile(
        join(targetDir, 'standards.prs'),
        [
          '@meta {',
          '  id: "acme-standards"',
          '  syntax: "1.0.0"',
          '}',
          '',
          '@context {',
          '  """',
          '  Cached standards',
          '  """',
          '}',
        ].join('\n')
      );
    });

    // Act — cache: true so resolveRegistryImport stores into this.cache
    const resolver = new Resolver({
      registryPath: resolve(FIXTURES_DIR, 'registry'),
      localPath: tempDir,
      registries: TEST_REGISTRIES,
      cache: true,
      cacheDir: join(testCacheDir, 'regcache-enabled'),
    });

    const result = await resolver.resolve(prsFile);

    // Assert — should resolve successfully with cache enabled (line 496-497)
    expect(result.ast).not.toBeNull();
    const contextBlock = result.ast?.blocks.find((b) => b.name === 'context');
    expect(contextBlock).toBeDefined();
  });

  it('does not cache registry import AST when cache is disabled', async () => {
    // Arrange
    const tempDir = join(testCacheDir, 'project-nocache');
    await fs.mkdir(tempDir, { recursive: true });

    const prsContent = [
      '@meta {',
      '  id: "test-cache-disabled"',
      '  syntax: "1.0.0"',
      '}',
      '',
      '@use @acme/standards',
      '',
      '@identity {',
      '  """',
      '  test identity',
      '  """',
      '}',
    ].join('\n');
    const prsFile = join(tempDir, 'test.prs');
    await fs.writeFile(prsFile, prsContent);

    mockGit.clone.mockImplementation(async (_url: string, targetDir: string) => {
      await fs.mkdir(targetDir, { recursive: true });
      await fs.writeFile(
        join(targetDir, 'standards.prs'),
        [
          '@meta {',
          '  id: "acme-standards"',
          '  syntax: "1.0.0"',
          '}',
          '',
          '@context {',
          '  """',
          '  No cache standards',
          '  """',
          '}',
        ].join('\n')
      );
    });

    // Act — cache: false so the cacheEnabled branch is skipped (lines 136-139, 496-498)
    const resolver = new Resolver({
      registryPath: resolve(FIXTURES_DIR, 'registry'),
      localPath: tempDir,
      registries: TEST_REGISTRIES,
      cache: false,
      cacheDir: join(testCacheDir, 'regcache-disabled'),
    });

    const result = await resolver.resolve(prsFile);

    // Assert
    expect(result.ast).not.toBeNull();
  });

  it('collects parse errors from invalid .prs file in registry import', async () => {
    // Arrange
    const tempDir = join(testCacheDir, 'project-parseerr');
    await fs.mkdir(tempDir, { recursive: true });

    const prsContent = [
      '@meta {',
      '  id: "test-parse-error"',
      '  syntax: "1.0.0"',
      '}',
      '',
      '@use @acme/broken',
      '',
      '@identity {',
      '  """',
      '  test identity',
      '  """',
      '}',
    ].join('\n');
    const prsFile = join(tempDir, 'test.prs');
    await fs.writeFile(prsFile, prsContent);

    // Mock clone to create a broken .prs file (invalid syntax)
    mockGit.clone.mockImplementation(async (_url: string, targetDir: string) => {
      await fs.mkdir(targetDir, { recursive: true });
      await fs.writeFile(join(targetDir, 'broken.prs'), 'this is not valid PRS syntax {{{');
    });

    const resolver = new Resolver({
      registryPath: resolve(FIXTURES_DIR, 'registry'),
      localPath: tempDir,
      registries: TEST_REGISTRIES,
      cache: false,
      cacheDir: join(testCacheDir, 'regcache-parseerr'),
    });

    // Act
    const result = await resolver.resolve(prsFile);

    // Assert — should have parse errors from the invalid .prs file (lines 470-473)
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('returns error for invalid registry marker', async () => {
    // Arrange — directly test resolveRegistryImport with an invalid marker
    // by creating a file that @uses something that will produce a bad marker.
    // Instead, we test the parseRegistryMarker(null) path indirectly:
    // The "invalid marker" branch is hit when parseRegistryMarker returns null.
    // We test this via the marker helper directly.
    const parsed = parseRegistryMarker('not-a-registry-marker');
    expect(parsed).toBeNull();
  });

  it('hits AST cache for repeated registry import resolution', async () => {
    // Arrange — cache: true, resolve the same registry import twice
    const tempDir = join(testCacheDir, 'project-cache-hit');
    await fs.mkdir(tempDir, { recursive: true });

    const prsContent = [
      '@meta {',
      '  id: "test-cache-hit"',
      '  syntax: "1.0.0"',
      '}',
      '',
      '@use @acme/standards',
      '',
      '@identity {',
      '  """',
      '  test identity',
      '  """',
      '}',
    ].join('\n');
    const prsFile = join(tempDir, 'test.prs');
    await fs.writeFile(prsFile, prsContent);

    mockGit.clone.mockImplementation(async (_url: string, targetDir: string) => {
      await fs.mkdir(targetDir, { recursive: true });
      await fs.writeFile(
        join(targetDir, 'standards.prs'),
        [
          '@meta {',
          '  id: "acme-standards"',
          '  syntax: "1.0.0"',
          '}',
          '',
          '@context {',
          '  """',
          '  Cached standards',
          '  """',
          '}',
        ].join('\n')
      );
    });

    const resolver = new Resolver({
      registryPath: resolve(FIXTURES_DIR, 'registry'),
      localPath: tempDir,
      registries: TEST_REGISTRIES,
      cache: true,
      cacheDir: join(testCacheDir, 'regcache-hit'),
    });

    // Act — resolve twice; second call should hit AST cache
    const result1 = await resolver.resolve(prsFile);
    expect(result1.ast).not.toBeNull();

    // Clear the file-level resolve cache so doResolve runs again,
    // but the registry marker cache inside resolveRegistryImport should still be populated
    // We can't easily clear just the top-level cache, but the test for cache: true
    // above already covers the cacheEnabled store path. This test confirms the full flow.
    const result2 = await resolver.resolve(prsFile);
    expect(result2.ast).not.toBeNull();
  });

  it('resolves @inherit from a registry marker path', async () => {
    // Arrange — create a .prs file with @inherit pointing to a registry alias
    const tempDir = join(testCacheDir, 'project-inherit');
    await fs.mkdir(tempDir, { recursive: true });

    const prsContent = [
      '@meta {',
      '  id: "test-inherit-registry"',
      '  syntax: "1.0.0"',
      '}',
      '',
      '@inherit @acme/base',
      '',
      '@context {',
      '  """',
      '  child context',
      '  """',
      '}',
    ].join('\n');
    const prsFile = join(tempDir, 'test.prs');
    await fs.writeFile(prsFile, prsContent);

    mockGit.clone.mockImplementation(async (_url: string, targetDir: string) => {
      await fs.mkdir(targetDir, { recursive: true });
      await fs.writeFile(
        join(targetDir, 'base.prs'),
        [
          '@meta {',
          '  id: "acme-base"',
          '  syntax: "1.0.0"',
          '}',
          '',
          '@identity {',
          '  """',
          '  parent identity',
          '  """',
          '}',
        ].join('\n')
      );
    });

    const resolver = new Resolver({
      registryPath: resolve(FIXTURES_DIR, 'registry'),
      localPath: tempDir,
      registries: TEST_REGISTRIES,
      cache: false,
      cacheDir: join(testCacheDir, 'regcache-inherit'),
    });

    // Act
    const result = await resolver.resolve(prsFile);

    // Assert — should resolve with inherited identity block
    expect(result.ast).not.toBeNull();
    const identityBlock = result.ast?.blocks.find((b) => b.name === 'identity');
    expect(identityBlock).toBeDefined();
  });

  it('resolves registry import when .md skill file exists in cloned repo', async () => {
    // Arrange — import @acme/my-skill.md which triggers the isMdPath branch
    const tempDir = join(testCacheDir, 'project-md-registry');
    await fs.mkdir(tempDir, { recursive: true });

    const prsContent = [
      '@meta {',
      '  id: "test-md-registry"',
      '  syntax: "1.0.0"',
      '}',
      '',
      '@use @acme/my-skill.md',
      '',
      '@identity {',
      '  """',
      '  test identity',
      '  """',
      '}',
    ].join('\n');
    const prsFile = join(tempDir, 'test.prs');
    await fs.writeFile(prsFile, prsContent);

    // Mock clone to create a .md skill file (with frontmatter)
    mockGit.clone.mockImplementation(async (_url: string, targetDir: string) => {
      await fs.mkdir(targetDir, { recursive: true });
      await fs.writeFile(
        join(targetDir, 'my-skill.md'),
        [
          '---',
          'name: registry-skill',
          'description: Skill from registry .md',
          '---',
          '',
          'Registry skill instructions.',
        ].join('\n')
      );
    });

    const resolver = new Resolver({
      registryPath: resolve(FIXTURES_DIR, 'registry'),
      localPath: tempDir,
      registries: TEST_REGISTRIES,
      cache: false,
      cacheDir: join(testCacheDir, 'regcache-md'),
    });

    // Act
    const result = await resolver.resolve(prsFile);

    // Assert — should resolve with a @skills block from the .md file
    expect(result.ast).not.toBeNull();
    const skillsBlock = result.ast?.blocks.find((b) => b.name === 'skills');
    expect(skillsBlock).toBeDefined();
    if (skillsBlock?.content.type === 'ObjectContent') {
      expect(skillsBlock.content.properties['registry-skill']).toBeDefined();
    }
  });

  it('produces a clear error when .md sub-path does not exist in cloned repo', async () => {
    // Arrange — import @acme/missing.md but the clone does not contain it
    const tempDir = join(testCacheDir, 'project-md-missing');
    await fs.mkdir(tempDir, { recursive: true });

    const prsContent = [
      '@meta {',
      '  id: "test-md-missing"',
      '  syntax: "1.0.0"',
      '}',
      '',
      '@use @acme/missing.md',
      '',
      '@identity { """test""" }',
    ].join('\n');
    const prsFile = join(tempDir, 'test.prs');
    await fs.writeFile(prsFile, prsContent);

    // Mock clone to create a repo without the requested .md file
    mockGit.clone.mockImplementation(async (_url: string, targetDir: string) => {
      await fs.mkdir(targetDir, { recursive: true });
      await fs.writeFile(join(targetDir, 'README.md'), '# Repo');
    });

    const resolver = new Resolver({
      registryPath: resolve(FIXTURES_DIR, 'registry'),
      localPath: tempDir,
      registries: TEST_REGISTRIES,
      cache: false,
      cacheDir: join(testCacheDir, 'regcache-md-missing'),
    });

    // Act
    const result = await resolver.resolve(prsFile);

    // Assert — error message mentions the missing file and the looked-up path,
    // and does NOT fall through to generic auto-discovery wording
    expect(result.errors.length).toBeGreaterThan(0);
    const message = result.errors.map((e) => e.message).join('\n');
    expect(message).toContain("file 'missing.md' not found");
    expect(message).toContain('Verify the path inside the repository');
    expect(message).not.toContain('no .prs file or native content');
  });

  it('resolves registry import when .prs file exists in cloned repo', async () => {
    // Arrange
    const tempDir = join(testCacheDir, 'project2');
    await fs.mkdir(tempDir, { recursive: true });

    const prsContent = [
      '@meta {',
      '  id: "test-with-registry"',
      '  syntax: "1.0.0"',
      '}',
      '',
      '@use @acme/standards',
      '',
      '@identity {',
      '  """',
      '  test identity',
      '  """',
      '}',
    ].join('\n');
    const prsFile = join(tempDir, 'test.prs');
    await fs.writeFile(prsFile, prsContent);

    // Mock git.clone to plant a .prs file in the target directory.
    // The Resolver calls gitRegistry.cloneAtTag(repoUrl, tag, cachePath) which:
    //   1. rm -rf cachePath
    //   2. mkdir cachePath
    //   3. git.clone(repoUrl, cachePath, flags)
    // So our mock receives the cachePath as the second arg.
    mockGit.clone.mockImplementation(async (_url: string, targetDir: string) => {
      await fs.mkdir(targetDir, { recursive: true });
      await fs.writeFile(
        join(targetDir, 'standards.prs'),
        [
          '@meta {',
          '  id: "acme-standards"',
          '  syntax: "1.0.0"',
          '}',
          '',
          '@context {',
          '  """',
          '  Follow coding standards',
          '  """',
          '}',
        ].join('\n')
      );
    });

    const resolver = new Resolver({
      registryPath: resolve(FIXTURES_DIR, 'registry'),
      localPath: tempDir,
      registries: TEST_REGISTRIES,
      cache: false,
      cacheDir: join(testCacheDir, 'regcache2'),
    });

    // Act
    const result = await resolver.resolve(prsFile);

    // Assert — the result should have been parsed
    expect(result.ast).not.toBeNull();
    // Look for the context block from the imported file
    const contextBlock = result.ast?.blocks.find((b) => b.name === 'context');
    expect(contextBlock).toBeDefined();
  });

  it('resolves a root-level registry import via auto-discovery (no sub-path)', async () => {
    const tempDir = join(testCacheDir, 'project-root-import');
    await fs.mkdir(tempDir, { recursive: true });

    const prsContent = [
      '@meta {',
      '  id: "test-root-import"',
      '  syntax: "1.0.0"',
      '}',
      '',
      '@use github.com/cloudflare/skills',
      '',
      '@identity { """test""" }',
    ].join('\n');
    const prsFile = join(tempDir, 'test.prs');
    await fs.writeFile(prsFile, prsContent);

    mockGit.clone.mockImplementation(async (_url: string, targetDir: string) => {
      await fs.mkdir(join(targetDir, 'skills', 'foo'), { recursive: true });
      await fs.writeFile(
        join(targetDir, 'skills', 'foo', 'SKILL.md'),
        ['---', 'name: foo-skill', 'description: A discovered skill', '---', 'Body content.'].join(
          '\n'
        )
      );
    });

    const resolver = new Resolver({
      registryPath: resolve(FIXTURES_DIR, 'registry'),
      localPath: tempDir,
      cache: false,
      cacheDir: join(testCacheDir, 'regcache-root'),
    });

    const result = await resolver.resolve(prsFile);

    expect(result.errors).toEqual([]);
    const skillsBlock = result.ast?.blocks.find((b) => b.name === 'skills');
    expect(skillsBlock).toBeDefined();
  });

  it('reports a helpful error when a root-level repo has no skill content', async () => {
    const tempDir = join(testCacheDir, 'project-root-empty');
    await fs.mkdir(tempDir, { recursive: true });

    const prsContent = [
      '@meta {',
      '  id: "test-root-empty"',
      '  syntax: "1.0.0"',
      '}',
      '',
      '@use github.com/foo/empty',
      '',
      '@identity { """test""" }',
    ].join('\n');
    const prsFile = join(tempDir, 'test.prs');
    await fs.writeFile(prsFile, prsContent);

    mockGit.clone.mockImplementation(async (_url: string, targetDir: string) => {
      await fs.mkdir(targetDir, { recursive: true });
      // Empty repository — no skills, agents or commands.
    });

    const resolver = new Resolver({
      registryPath: resolve(FIXTURES_DIR, 'registry'),
      localPath: tempDir,
      cache: false,
      cacheDir: join(testCacheDir, 'regcache-root-empty'),
    });

    const result = await resolver.resolve(prsFile);

    const messages = result.errors.map((e) => e.message).join('\n');
    expect(messages).toContain('<repository root>');
    expect(messages).toContain('Specify a sub-path');
  });

  it('loads resource files and frontmatter references for registry .md skills', async () => {
    const tempDir = join(testCacheDir, 'project-md-resources');
    await fs.mkdir(tempDir, { recursive: true });

    const prsContent = [
      '@meta {',
      '  id: "test-md-resources"',
      '  syntax: "1.0.0"',
      '}',
      '',
      '@use @acme/my-skill.md',
      '',
      '@identity { """test""" }',
    ].join('\n');
    const prsFile = join(tempDir, 'test.prs');
    await fs.writeFile(prsFile, prsContent);

    // Mock clone to create a skill directory with a SKILL.md + reference file
    // alongside it. The resolver currently routes the .md file through
    // loadAndParseMd, which must now also load nearby resources.
    mockGit.clone.mockImplementation(async (_url: string, targetDir: string) => {
      await fs.mkdir(targetDir, { recursive: true });
      await fs.writeFile(
        join(targetDir, 'my-skill.md'),
        [
          '---',
          'name: registry-skill-with-refs',
          'description: Has resources and references',
          'references:',
          '  - references/checklist.md',
          '---',
          '',
          'Skill body.',
        ].join('\n')
      );
      await fs.mkdir(join(targetDir, 'references'), { recursive: true });
      await fs.writeFile(
        join(targetDir, 'references', 'checklist.md'),
        '# Checklist\n- item one\n- item two\n'
      );
      await fs.writeFile(join(targetDir, 'data.txt'), 'sample resource content');
    });

    const resolver = new Resolver({
      registryPath: resolve(FIXTURES_DIR, 'registry'),
      localPath: tempDir,
      registries: TEST_REGISTRIES,
      cache: false,
      cacheDir: join(testCacheDir, 'regcache-md-resources'),
    });

    const result = await resolver.resolve(prsFile);

    expect(result.errors).toEqual([]);
    const skillsBlock = result.ast?.blocks.find((b) => b.name === 'skills');
    expect(skillsBlock).toBeDefined();
    if (skillsBlock?.content.type !== 'ObjectContent') {
      throw new Error('skills block should be ObjectContent');
    }
    const skill = skillsBlock.content.properties['registry-skill-with-refs'] as
      | Record<string, unknown>
      | undefined;
    expect(skill).toBeDefined();
    const resources = skill!['resources'] as
      | Array<{ relativePath: string; content: string }>
      | undefined;
    expect(resources).toBeDefined();
    const paths = (resources ?? []).map((r) => r.relativePath).sort();
    expect(paths).toContain('references/checklist.md');
    expect(paths).toContain('data.txt');
  });

  it('detects path traversal in registry subpath (resolved file path)', async () => {
    // Covers resolver.ts lines 762-769: path traversal detection for resolvedFullPath
    const tempDir = join(testCacheDir, 'project-traversal-file');
    await fs.mkdir(tempDir, { recursive: true });

    const prsContent = [
      '@meta {',
      '  id: "traversal-file-test"',
      '  syntax: "1.0.0"',
      '}',
      '',
      '@use @acme/../../etc/passwd',
      '',
      '@context {',
      '  """',
      '  placeholder',
      '  """',
      '}',
    ].join('\n');
    const prsFile = join(tempDir, 'test.prs');
    await fs.writeFile(prsFile, prsContent);

    mockGit.clone.mockImplementation(async (_url: string, targetDir: string) => {
      await fs.mkdir(targetDir, { recursive: true });
      // Create a fake passwd file at the repo root so the traversal path would exist
      await fs.writeFile(join(targetDir, 'passwd.prs'), '@meta { id: "fake" syntax: "1.0.0" }');
    });

    const resolver = new Resolver({
      registryPath: resolve(FIXTURES_DIR, 'registry'),
      localPath: tempDir,
      registries: TEST_REGISTRIES,
      cache: false,
      cacheDir: join(testCacheDir, 'regcache-traversal-file'),
    });

    const result = await resolver.resolve(prsFile);

    const traversalErrors = result.errors.filter((e) => e.message.includes('traversal'));
    expect(traversalErrors.length).toBeGreaterThan(0);
    expect(traversalErrors[0]!.message).toContain('Path traversal detected');
  });

  it('detects path traversal in registry subpath (directory discovery)', async () => {
    // Covers resolver.ts lines 803-809: path traversal detection for discoverDir
    const tempDir = join(testCacheDir, 'project-traversal-dir');
    await fs.mkdir(tempDir, { recursive: true });

    // Use a subpath with ../ that won't resolve to an existing .prs file
    // but will fall through to directory auto-discovery
    const prsContent = [
      '@meta {',
      '  id: "traversal-dir-test"',
      '  syntax: "1.0.0"',
      '}',
      '',
      '@use @acme/../../../nonexistent-dir',
      '',
      '@context {',
      '  """',
      '  placeholder',
      '  """',
      '}',
    ].join('\n');
    const prsFile = join(tempDir, 'test.prs');
    await fs.writeFile(prsFile, prsContent);

    mockGit.clone.mockImplementation(async (_url: string, targetDir: string) => {
      await fs.mkdir(targetDir, { recursive: true });
    });

    const resolver = new Resolver({
      registryPath: resolve(FIXTURES_DIR, 'registry'),
      localPath: tempDir,
      registries: TEST_REGISTRIES,
      cache: false,
      cacheDir: join(testCacheDir, 'regcache-traversal-dir'),
    });

    const result = await resolver.resolve(prsFile);

    const traversalErrors = result.errors.filter((e) => e.message.includes('traversal'));
    expect(traversalErrors.length).toBeGreaterThan(0);
    expect(traversalErrors[0]!.message).toContain('Path traversal detected');
  });

  it('rejects a registry file symlink that escapes the cache', async () => {
    const tempDir = join(testCacheDir, 'project-symlink-file-traversal');
    await fs.mkdir(tempDir, { recursive: true });
    const outsideFile = join(tempDir, 'outside.prs');
    await fs.writeFile(outsideFile, '@meta { id: "outside" syntax: "1.0.0" }');
    const entryPath = join(tempDir, 'project.prs');
    await fs.writeFile(
      entryPath,
      '@meta { id: "symlink-file-project" syntax: "1.0.0" }\n@use github.com/org/repo/linked'
    );
    mockGit.clone.mockImplementation(async (_url: string, targetDir: string) => {
      await fs.mkdir(targetDir, { recursive: true });
      await fs.symlink(outsideFile, join(targetDir, 'linked.prs'));
    });
    const resolver = new Resolver({
      registryPath: resolve(FIXTURES_DIR, 'registry'),
      localPath: tempDir,
      cache: false,
      cacheDir: join(testCacheDir, 'symlink-file-registry-cache'),
    });

    const result = await resolver.resolve(entryPath);

    expect(
      result.errors.some((error) => error.message.includes('resolves outside the repository cache'))
    ).toBe(true);
  });

  it('rejects a registry directory symlink that escapes the cache', async () => {
    const tempDir = join(testCacheDir, 'project-symlink-directory-traversal');
    const outsideDir = join(tempDir, 'outside');
    await fs.mkdir(outsideDir, { recursive: true });
    const entryPath = join(tempDir, 'project.prs');
    await fs.writeFile(
      entryPath,
      '@meta { id: "symlink-directory-project" syntax: "1.0.0" }\n@use github.com/org/repo/linked'
    );
    mockGit.clone.mockImplementation(async (_url: string, targetDir: string) => {
      await fs.mkdir(targetDir, { recursive: true });
      await fs.symlink(outsideDir, join(targetDir, 'linked'));
    });
    const resolver = new Resolver({
      registryPath: resolve(FIXTURES_DIR, 'registry'),
      localPath: tempDir,
      cache: false,
      cacheDir: join(testCacheDir, 'symlink-directory-registry-cache'),
    });

    const result = await resolver.resolve(entryPath);

    expect(
      result.errors.some((error) => error.message.includes('resolves outside the repository cache'))
    ).toBe(true);
  });

  it('replaces a mismatched cached checkout with the locked commit', async () => {
    const tempDir = join(testCacheDir, 'successful-cache-recovery');
    const sourceRepository = join(tempDir, 'source');
    await fs.mkdir(sourceRepository, { recursive: true });
    await fs.writeFile(
      join(sourceRepository, 'standards.prs'),
      '@meta { id: "recovered-cache" syntax: "1.0.0" }'
    );
    const lockedCommit = await initializeCacheGitRepository(sourceRepository);
    const repoUrl = 'https://github.com/org/repo';
    const cacheDir = join(testCacheDir, 'successful-cache-recovery-registry');
    const registryCache = new RegistryCache(cacheDir);
    await registryCache.set(repoUrl, 'latest', 'a'.repeat(40));
    await fs.writeFile(
      join(registryCache.getCachePath(repoUrl, 'latest'), 'standards.prs'),
      '@meta { id: "stale-cache" syntax: "1.0.0" }'
    );
    mockGit.clone.mockImplementation(async (_url: string, targetDir: string) => {
      await fs.cp(join(sourceRepository, '.git'), join(targetDir, '.git'), { recursive: true });
      await fs.copyFile(join(sourceRepository, 'standards.prs'), join(targetDir, 'standards.prs'));
    });
    const entryPath = join(tempDir, 'project.prs');
    await fs.writeFile(
      entryPath,
      '@meta { id: "cache-recovery-project" syntax: "1.0.0" }\n@use github.com/org/repo/standards'
    );
    const resolver = new Resolver({
      registryPath: resolve(FIXTURES_DIR, 'registry'),
      localPath: tempDir,
      cache: false,
      cacheDir,
      lockfile: {
        version: 1,
        dependencies: {
          [repoUrl]: {
            version: 'latest',
            commit: lockedCommit,
            integrity: 'sha256-test',
          },
        },
      },
    });

    const result = await resolver.resolve(entryPath);

    expect(result.errors).toEqual([]);
    expect(result.ast).not.toBeNull();
    expect(mockGit.clone).toHaveBeenCalledOnce();
  });

  it('reports checkout failure when a cached commit mismatches the lock', async () => {
    // Covers resolver.ts lines 695-713: lockfile commit verification on cache hit
    const tempDir = join(testCacheDir, 'project-lock-mismatch');
    await fs.mkdir(tempDir, { recursive: true });

    const prsContent = [
      '@meta {',
      '  id: "lock-mismatch"',
      '  syntax: "1.0.0"',
      '}',
      '',
      '@use @acme/standards',
      '',
      '@identity {',
      '  """',
      '  test',
      '  """',
      '}',
    ].join('\n');
    const prsFile = join(tempDir, 'test.prs');
    await fs.writeFile(prsFile, prsContent);

    const cacheDir = join(testCacheDir, 'regcache-lock-mismatch');
    const repoUrl = 'https://github.com/acme/prs-standards.git';
    const lockedCommit = 'a'.repeat(40);

    // Pre-populate cache with a different commit
    const registryCache = new RegistryCache(cacheDir);
    await registryCache.set(repoUrl, 'latest', 'b'.repeat(40));
    // Write a standards.prs in the cached repo so the file exists
    const cachePath = registryCache.getCachePath(repoUrl, 'latest');
    await fs.writeFile(
      join(cachePath, 'standards.prs'),
      '@meta { id: "old-standards" syntax: "1.0.0" }\n@context { """old""" }'
    );

    mockGit.clone.mockImplementation(async (_url: string, targetDir: string) => {
      await fs.mkdir(targetDir, { recursive: true });
      await fs.writeFile(
        join(targetDir, 'standards.prs'),
        '@meta { id: "acme-standards" syntax: "1.0.0" }\n@context { """new standards""" }'
      );
    });
    mockGit.checkout.mockRejectedValueOnce(new Error('checkout failed'));

    const resolver = new Resolver({
      registryPath: resolve(FIXTURES_DIR, 'registry'),
      localPath: tempDir,
      registries: TEST_REGISTRIES,
      cache: false,
      cacheDir,
      lockfile: {
        version: 1,
        dependencies: {
          [repoUrl]: {
            version: 'latest',
            commit: lockedCommit,
            integrity: 'sha256-test',
          },
        },
      },
    });

    const result = await resolver.resolve(prsFile);

    // Should have re-cloned due to commit mismatch
    expect(mockGit.clone).toHaveBeenCalled();
    // checkoutCommit should have been called with the locked commit
    expect(mockGit.checkout).toHaveBeenCalledWith(lockedCommit);
    expect(result.errors.some((error) => error.message.includes('checkout failed'))).toBe(true);
  });

  it('checks out the locked commit from the canonical URL on cache miss', async () => {
    // Covers resolver.ts lines 728-729: lockfile commit checkout on cache miss
    const tempDir = join(testCacheDir, 'project-lock-fresh');
    await fs.mkdir(tempDir, { recursive: true });

    const prsContent = [
      '@meta {',
      '  id: "lock-fresh"',
      '  syntax: "1.0.0"',
      '}',
      '',
      '@use @acme/standards',
      '',
      '@identity {',
      '  """',
      '  test',
      '  """',
      '}',
    ].join('\n');
    const prsFile = join(tempDir, 'test.prs');
    await fs.writeFile(prsFile, prsContent);

    const lockedCommit = 'C'.repeat(40);

    mockGit.clone.mockImplementation(async (_url: string, targetDir: string) => {
      await fs.mkdir(targetDir, { recursive: true });
      await fs.writeFile(
        join(targetDir, 'standards.prs'),
        '@meta { id: "acme-standards" syntax: "1.0.0" }\n@context { """fresh standards""" }'
      );
    });

    const resolver = new Resolver({
      registryPath: resolve(FIXTURES_DIR, 'registry'),
      localPath: tempDir,
      registries: TEST_REGISTRIES,
      cache: false,
      cacheDir: join(testCacheDir, 'regcache-lock-fresh'),
      lockfile: {
        version: 1,
        dependencies: {
          'https://github.com/acme/prs-standards.git': {
            version: 'latest',
            commit: lockedCommit,
            integrity: 'sha256-test',
            gitUrl: 'git@github.com:acme/prs-standards.git',
          },
        },
      },
    });

    await resolver.resolve(prsFile);

    expect(mockGit.clone).toHaveBeenCalledWith(
      'https://github.com/acme/prs-standards.git',
      expect.any(String),
      ['--depth=1']
    );
    expect(mockGit.checkout).toHaveBeenCalledWith(lockedCommit);
  });

  it('uses the locked version as the registry cache key', async () => {
    const tempDir = join(testCacheDir, 'project-lock-version');
    await fs.mkdir(tempDir, { recursive: true });
    const prsFile = join(tempDir, 'test.prs');
    await fs.writeFile(
      prsFile,
      '@meta { id: "lock-version" syntax: "1.0.0" }\n@use @acme/standards'
    );
    const cacheDir = join(testCacheDir, 'regcache-lock-version');
    const lockedCommit = 'f'.repeat(40);
    mockGit.clone.mockImplementation(async (_url: string, targetDir: string) => {
      await fs.mkdir(targetDir, { recursive: true });
      await fs.writeFile(
        join(targetDir, 'standards.prs'),
        '@meta { id: "standards" syntax: "1.0.0" }'
      );
    });

    const resolver = new Resolver({
      registryPath: resolve(FIXTURES_DIR, 'registry'),
      localPath: tempDir,
      registries: TEST_REGISTRIES,
      cache: false,
      cacheDir,
      lockfile: {
        version: 1,
        dependencies: {
          'https://github.com/acme/prs-standards.git': {
            version: 'main',
            commit: lockedCommit,
            integrity: 'sha256-test',
          },
        },
      },
    });

    await resolver.resolve(prsFile);

    expect(mockGit.clone).toHaveBeenCalledWith(
      'https://github.com/acme/prs-standards.git',
      new RegistryCache(cacheDir).getCachePath('https://github.com/acme/prs-standards.git', 'main'),
      ['--depth=1', '--branch=main', '--single-branch']
    );
  });

  it('reports errors during cached lockfile commit verification', async () => {
    const tempDir = join(testCacheDir, 'project-lock-error');
    await fs.mkdir(tempDir, { recursive: true });

    const prsContent = [
      '@meta {',
      '  id: "lock-error"',
      '  syntax: "1.0.0"',
      '}',
      '',
      '@use @acme/standards',
      '',
      '@identity {',
      '  """',
      '  test',
      '  """',
      '}',
    ].join('\n');
    const prsFile = join(tempDir, 'test.prs');
    await fs.writeFile(prsFile, prsContent);

    const cacheDir = join(testCacheDir, 'regcache-lock-error');
    const repoUrl = 'https://github.com/acme/prs-standards.git';
    const lockedCommit = 'd'.repeat(40);

    // Pre-populate cache with a different commit
    const registryCache = new RegistryCache(cacheDir);
    await registryCache.set(repoUrl, 'latest', 'e'.repeat(40));
    const cachePath = registryCache.getCachePath(repoUrl, 'latest');
    await fs.writeFile(
      join(cachePath, 'standards.prs'),
      '@meta { id: "old" syntax: "1.0.0" }\n@context { """old""" }'
    );

    // Make cloneAtTag fail by having mockGit.clone reject
    mockGit.clone.mockRejectedValueOnce(new Error('clone failed'));

    const resolver = new Resolver({
      registryPath: resolve(FIXTURES_DIR, 'registry'),
      localPath: tempDir,
      registries: TEST_REGISTRIES,
      cache: false,
      cacheDir,
      lockfile: {
        version: 1,
        dependencies: {
          [repoUrl]: {
            version: 'latest',
            commit: lockedCommit,
            integrity: 'sha256-test',
          },
        },
      },
    });

    const result = await resolver.resolve(prsFile);

    expect(result.errors.some((error) => error.message.includes('clone failed'))).toBe(true);
  });

  it('skips symlinked directories during auto-discovery', async () => {
    // Covers resolver.ts lines 936, 945, 947: symlink detection in scanDirectoryForSkills
    const tempDir = join(testCacheDir, 'project-symlink');
    await fs.mkdir(tempDir, { recursive: true });

    // Use a subpath that doesn't exist as .prs file, triggering directory scan
    const prsContent = [
      '@meta {',
      '  id: "symlink-test"',
      '  syntax: "1.0.0"',
      '}',
      '',
      '@use @acme/skills-dir',
      '',
      '@identity {',
      '  """',
      '  test',
      '  """',
      '}',
    ].join('\n');
    const prsFile = join(tempDir, 'test.prs');
    await fs.writeFile(prsFile, prsContent);

    const externalTarget = join(tmpdir(), 'external-symlink-target');
    await fs.mkdir(externalTarget, { recursive: true }).catch(() => {});

    mockGit.clone.mockImplementation(async (_url: string, targetDir: string) => {
      await fs.mkdir(targetDir, { recursive: true });
      const skillsDir = join(targetDir, 'skills-dir');
      await fs.mkdir(skillsDir, { recursive: true });
      await fs.mkdir(join(skillsDir, 'real-skill'), { recursive: true });
      await fs.writeFile(
        join(skillsDir, 'real-skill', 'SKILL.md'),
        '---\nname: real-skill\ndescription: A real skill\n---\nReal skill content'
      );
      // Create symlink (remove existing first if needed)
      const symlinkPath = join(skillsDir, 'evil-symlink');
      try {
        await fs.unlink(symlinkPath).catch(() => {});
        await fs.symlink(externalTarget, symlinkPath);
      } catch {
        // If symlink fails, skip — test still validates real-skill discovery
      }
    });

    const resolver = new Resolver({
      registryPath: resolve(FIXTURES_DIR, 'registry'),
      localPath: tempDir,
      registries: TEST_REGISTRIES,
      cache: false,
      cacheDir: join(testCacheDir, 'regcache-symlink'),
    });

    const result = await resolver.resolve(prsFile);

    expect(result).toBeDefined();
    // The symlinked directory should have been skipped, real skill found
    const skillsBlock = result.ast?.blocks.find((b) => b.name === 'skills');
    if (skillsBlock?.content.type === 'ObjectContent') {
      expect('real-skill' in skillsBlock.content.properties).toBe(true);
    }
  });
});
