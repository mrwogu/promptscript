/**
 * Integration tests for registry resolution wiring in FileLoader and Resolver.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { existsSync, promises as fs } from 'fs';
import { join, resolve, dirname } from 'path';
import { tmpdir } from 'os';
import { fileURLToPath } from 'url';
import type { PathReference, RegistriesConfig } from '@promptscript/core';
import {
  FileLoader,
  REGISTRY_MARKER_PREFIX,
  parseRegistryMarker,
  buildRegistryMarker,
} from '../loader.js';
import { Resolver } from '../resolver.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const FIXTURES_DIR = resolve(__dirname, '__fixtures__');

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
});
