import { describe, it, expect, vi, beforeEach } from 'vitest';

const {
  mockLoadConfig,
  mockFindConfigFile,
  mockLoadUserConfig,
  mockExistsSync,
  mockReadFileSync,
  mockStatSync,
  mockLockfileExists,
  mockExpandAlias,
  mockValidateAlias,
  mockLoadVendorManifest,
  mockResolveVendoredRepository,
  mockCacheHas,
  mockVerifyGitRepository,
  mockIsInsideCachePath,
  mockIsRealPathInside,
} = vi.hoisted(() => {
  const mockLoadConfig = vi.fn();
  const mockFindConfigFile = vi.fn();
  const mockLoadUserConfig = vi.fn();
  const mockExistsSync = vi.fn().mockReturnValue(false);
  const mockReadFileSync = vi.fn();
  const mockStatSync = vi.fn().mockReturnValue({ isDirectory: () => false });
  const mockLockfileExists = vi.fn().mockReturnValue(false);
  const mockExpandAlias = vi.fn();
  const mockValidateAlias = vi.fn((alias: string) => /^@[a-z0-9][a-z0-9-]*$/.test(alias));
  const mockLoadVendorManifest = vi.fn().mockResolvedValue(null);
  const mockResolveVendoredRepository = vi.fn();
  const mockCacheHas = vi.fn().mockResolvedValue(false);
  const mockVerifyGitRepository = vi.fn().mockResolvedValue(undefined);
  const mockIsInsideCachePath = vi.fn().mockReturnValue(true);
  const mockIsRealPathInside = vi.fn().mockResolvedValue(true);
  return {
    mockLoadConfig,
    mockFindConfigFile,
    mockLoadUserConfig,
    mockExistsSync,
    mockReadFileSync,
    mockStatSync,
    mockLockfileExists,
    mockExpandAlias,
    mockValidateAlias,
    mockLoadVendorManifest,
    mockResolveVendoredRepository,
    mockCacheHas,
    mockVerifyGitRepository,
    mockIsInsideCachePath,
    mockIsRealPathInside,
  };
});

vi.mock('../../output/console.js', () => ({
  ConsoleOutput: { error: vi.fn(), muted: vi.fn(), newline: vi.fn() },
}));

vi.mock('../../config/loader.js', () => ({
  loadConfig: mockLoadConfig,
  findConfigFile: mockFindConfigFile,
}));

vi.mock('../../config/user-config.js', () => ({
  loadUserConfig: mockLoadUserConfig,
}));

vi.mock('@promptscript/resolver', () => ({
  FileLoader: class {
    resolveRef(reference: { raw: string; version?: string }): string {
      if (reference.raw.startsWith('@')) {
        return `__test_registry__${JSON.stringify(mockExpandAlias(reference.raw))}`;
      }
      if (reference.raw.split('/')[0]?.includes('.') && reference.raw.split('/').length >= 3) {
        const rawPath =
          reference.version && reference.raw.endsWith(`@${reference.version}`)
            ? reference.raw.slice(0, -reference.version.length - 1)
            : reference.raw;
        const segments = rawPath.split('/');
        return `__test_registry__${JSON.stringify({
          repoUrl: `https://${segments.slice(0, 3).join('/')}`,
          path: segments.slice(3).join('/'),
          version: reference.version ?? '',
        })}`;
      }
      return reference.raw;
    }
  },
  RegistryCache: class {
    getCachePath(repoUrl: string, version: string): string {
      return `/cache/${repoUrl}/${version}`;
    }
    has = mockCacheHas;
  },
  isInsideCachePath: mockIsInsideCachePath,
  isRealPathInside: mockIsRealPathInside,
  parseRegistryMarker: (value: string) =>
    value.startsWith('__test_registry__')
      ? JSON.parse(value.slice('__test_registry__'.length))
      : null,
  loadVendorManifest: mockLoadVendorManifest,
  resolveVendoredRepository: mockResolveVendoredRepository,
  verifyGitRepositoryCheckout: mockVerifyGitRepository,
  validateAlias: mockValidateAlias,
}));

vi.mock('fs', () => ({
  existsSync: (path: string) =>
    path.endsWith('promptscript.lock') ? mockLockfileExists() : mockExistsSync(path),
  readFileSync: mockReadFileSync,
  statSync: mockStatSync,
}));

import { resolveCommand } from '../resolve-cmd.js';
import { ConsoleOutput } from '../../output/console.js';

describe('resolveCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLoadVendorManifest.mockResolvedValue(null);
    mockExistsSync.mockReturnValue(false);
    mockStatSync.mockReturnValue({ isDirectory: () => false });
    mockLockfileExists.mockReturnValue(false);
    mockCacheHas.mockResolvedValue(false);
    mockVerifyGitRepository.mockResolvedValue(undefined);
    mockIsInsideCachePath.mockReturnValue(true);
    mockIsRealPathInside.mockResolvedValue(true);
    process.exitCode = undefined;
  });

  it('should fail when no project config found', async () => {
    mockFindConfigFile.mockReturnValue(null);

    await resolveCommand('@company/base', {});

    expect(ConsoleOutput.error).toHaveBeenCalledWith(expect.stringContaining('No project config'));
    expect(process.exitCode).toBe(1);
  });

  it('should print resolution info for a known alias', async () => {
    mockFindConfigFile.mockReturnValue('promptscript.yaml');
    mockLoadConfig.mockResolvedValue({
      targets: [],
      registries: { '@company': 'github.com/company/base' },
    });
    mockLoadUserConfig.mockResolvedValue({ version: '1' });
    mockExpandAlias.mockReturnValue({
      repoUrl: 'github.com/company/base',
      path: 'security',
      version: 'v1.3.0',
    });
    mockExistsSync.mockReturnValue(false);

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    await resolveCommand('@company/security@v1.3.0', {});

    const output = consoleSpy.mock.calls.map((c) => c[0] as string).join('\n');
    expect(output).toContain('github.com/company/base');
    expect(output).toContain('security');

    consoleSpy.mockRestore();
  });

  it('should report error for unknown alias', async () => {
    mockFindConfigFile.mockReturnValue('promptscript.yaml');
    mockLoadConfig.mockResolvedValue({
      targets: [],
      registries: { '@company': 'github.com/company/base' },
    });
    mockLoadUserConfig.mockResolvedValue({ version: '1' });
    mockExpandAlias.mockImplementation(() => {
      throw new Error('Unknown alias: @unknown');
    });

    await resolveCommand('@unknown/path', {});

    expect(ConsoleOutput.error).toHaveBeenCalledWith(expect.stringContaining('Unknown alias'));
    expect(process.exitCode).toBe(1);
  });

  it('should handle local file imports', async () => {
    mockFindConfigFile.mockReturnValue('promptscript.yaml');
    mockLoadConfig.mockResolvedValue({ targets: [] });
    mockLoadUserConfig.mockResolvedValue({ version: '1' });
    mockExistsSync.mockImplementation((path: string) => !path.endsWith('.promptscript/vendor'));

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    await resolveCommand('./local-file', {});

    const output = consoleSpy.mock.calls.map((c) => c[0] as string).join('\n');
    expect(output).toContain('local file');
    expect(output).toContain('yes');

    consoleSpy.mockRestore();
  });

  it('should error on invalid alias format', async () => {
    mockFindConfigFile.mockReturnValue('promptscript.yaml');
    mockLoadConfig.mockResolvedValue({
      targets: [],
      registries: { '@company': 'github.com/company/base' },
    });
    mockLoadUserConfig.mockResolvedValue({ version: '1' });

    await resolveCommand('@INVALID/path', {});

    expect(ConsoleOutput.error).toHaveBeenCalledWith(
      expect.stringContaining('Invalid alias format')
    );
    expect(process.exitCode).toBe(1);
  });

  it('should show cache not found info when cache does not exist', async () => {
    mockFindConfigFile.mockReturnValue('promptscript.yaml');
    mockLoadConfig.mockResolvedValue({
      targets: [],
      registries: { '@company': 'github.com/company/base' },
    });
    mockLoadUserConfig.mockResolvedValue({ version: '1' });
    mockExpandAlias.mockReturnValue({
      repoUrl: 'github.com/company/base',
      path: 'security',
      version: undefined,
    });
    mockExistsSync.mockReturnValue(false);

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    await resolveCommand('@company/security', {});

    const output = consoleSpy.mock.calls.map((c) => c[0] as string).join('\n');
    expect(output).toContain('not cached');

    consoleSpy.mockRestore();
  });

  it('should handle exception in resolution', async () => {
    mockFindConfigFile.mockReturnValue('promptscript.yaml');
    mockLoadConfig.mockRejectedValue(new Error('config parse error'));

    await resolveCommand('@company/path', {});

    expect(ConsoleOutput.error).toHaveBeenCalledWith(expect.stringContaining('Resolution failed'));
    expect(process.exitCode).toBe(1);
  });

  it('should handle resolution exceptions in JSON format', async () => {
    mockFindConfigFile.mockReturnValue('promptscript.yaml');
    mockLoadConfig.mockRejectedValue(new Error('config parse error'));
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    await resolveCommand('@company/path', { format: 'json' });

    const output = JSON.parse(consoleSpy.mock.calls[0]?.[0] as string) as Record<string, unknown>;
    expect(output).toMatchObject({ success: false, error: 'config parse error' });
    expect(process.exitCode).toBe(1);
    consoleSpy.mockRestore();
  });

  it('should error when no registries are configured for alias import', async () => {
    mockFindConfigFile.mockReturnValue('promptscript.yaml');
    mockLoadConfig.mockResolvedValue({ targets: [] });
    mockLoadUserConfig.mockResolvedValue({ version: '1' });

    await resolveCommand('@company/security', {});

    expect(ConsoleOutput.error).toHaveBeenCalledWith(
      expect.stringContaining('No registries configured.')
    );
    expect(process.exitCode).toBe(1);
  });

  it('should show cache exists with file found info', async () => {
    mockFindConfigFile.mockReturnValue('promptscript.yaml');
    mockLoadConfig.mockResolvedValue({
      targets: [],
      registries: { '@company': 'github.com/company/base' },
    });
    mockLoadUserConfig.mockResolvedValue({ version: '1' });
    mockExpandAlias.mockReturnValue({
      repoUrl: 'github.com/company/base',
      path: 'security',
      version: 'v1.3.0',
    });
    mockExistsSync.mockImplementation((path: string) => !path.endsWith('.promptscript/vendor'));
    mockCacheHas.mockResolvedValue(true);

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    await resolveCommand('@company/security@v1.3.0', {});

    const output = consoleSpy.mock.calls.map((c) => c[0] as string).join('\n');
    expect(output).toContain('native .prs');

    consoleSpy.mockRestore();
  });

  it('should show cache exists but file not found info', async () => {
    mockFindConfigFile.mockReturnValue('promptscript.yaml');
    mockLoadConfig.mockResolvedValue({
      targets: [],
      registries: { '@company': 'github.com/company/base' },
    });
    mockLoadUserConfig.mockResolvedValue({ version: '1' });
    mockExpandAlias.mockReturnValue({
      repoUrl: 'github.com/company/base',
      path: 'security',
      version: 'v1.3.0',
    });
    mockExistsSync.mockReturnValue(false);
    mockCacheHas.mockResolvedValue(true);

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    await resolveCommand('@company/security@v1.3.0', {});

    const output = consoleSpy.mock.calls.map((c) => c[0] as string).join('\n');
    expect(output).toContain('not found');

    consoleSpy.mockRestore();
  });

  it('should resolve direct URL imports and emit JSON', async () => {
    mockFindConfigFile.mockReturnValue('promptscript.yaml');
    mockLoadConfig.mockResolvedValue({ targets: [] });
    mockLoadUserConfig.mockResolvedValue({ version: '1' });
    mockExistsSync.mockReturnValue(false);
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    await resolveCommand('github.com/company/base/security', { format: 'json' });

    const output = JSON.parse(consoleSpy.mock.calls[0]?.[0] as string) as Record<string, unknown>;
    expect(output).toMatchObject({
      success: true,
      kind: 'registry',
      repoUrl: 'https://github.com/company/base',
      path: 'security',
      source: 'missing',
    });
    consoleSpy.mockRestore();
  });

  it('should preserve scoped paths in direct URL imports', async () => {
    mockFindConfigFile.mockReturnValue('promptscript.yaml');
    mockLoadConfig.mockResolvedValue({ targets: [] });
    mockLoadUserConfig.mockResolvedValue({ version: '1' });
    mockExistsSync.mockReturnValue(false);
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    await resolveCommand('github.com/company/base/@org/security', { format: 'json' });

    const output = JSON.parse(consoleSpy.mock.calls[0]?.[0] as string) as Record<string, unknown>;
    expect(output).toMatchObject({
      repoUrl: 'https://github.com/company/base',
      path: '@org/security',
    });
    expect(output).not.toHaveProperty('requestedVersion');
    consoleSpy.mockRestore();
  });

  it('should parse versions after scoped direct URL paths', async () => {
    mockFindConfigFile.mockReturnValue('promptscript.yaml');
    mockLoadConfig.mockResolvedValue({ targets: [] });
    mockLoadUserConfig.mockResolvedValue({ version: '1' });
    mockExistsSync.mockReturnValue(false);
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    await resolveCommand('github.com/company/base/@org/security@1.2.0', { format: 'json' });

    const output = JSON.parse(consoleSpy.mock.calls[0]?.[0] as string) as Record<string, unknown>;
    expect(output).toMatchObject({
      path: '@org/security',
      requestedVersion: '1.2.0',
    });
    consoleSpy.mockRestore();
  });

  it('should parse Git refs containing slashes', async () => {
    mockFindConfigFile.mockReturnValue('promptscript.yaml');
    mockLoadConfig.mockResolvedValue({ targets: [] });
    mockLoadUserConfig.mockResolvedValue({ version: '1' });
    mockExistsSync.mockReturnValue(false);
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    await resolveCommand('github.com/company/base/security@feature/branch', { format: 'json' });

    const output = JSON.parse(consoleSpy.mock.calls[0]?.[0] as string) as Record<string, unknown>;
    expect(output).toMatchObject({
      path: 'security',
      requestedVersion: 'feature/branch',
    });
    consoleSpy.mockRestore();
  });

  it('should report the exact lockfile version and commit', async () => {
    mockFindConfigFile.mockReturnValue('promptscript.yaml');
    mockLoadConfig.mockResolvedValue({
      targets: [],
      registries: { '@company': 'github.com/company/base' },
    });
    mockLoadUserConfig.mockResolvedValue({ version: '1' });
    mockExpandAlias.mockReturnValue({
      repoUrl: 'github.com/company/base',
      path: 'security',
      version: undefined,
    });
    mockLockfileExists.mockReturnValue(true);
    mockReadFileSync.mockReturnValue(
      JSON.stringify({
        version: 1,
        dependencies: {
          'github.com/company/base': {
            version: 'v2.0.0',
            commit: 'a'.repeat(40),
            integrity: 'sha256-test',
          },
        },
      })
    );
    mockExistsSync.mockReturnValue(false);
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    await resolveCommand('@company/security', { format: 'json' });

    const output = JSON.parse(consoleSpy.mock.calls[0]?.[0] as string) as Record<string, unknown>;
    expect(output).toMatchObject({
      lockedVersion: 'v2.0.0',
      commit: 'a'.repeat(40),
      source: 'missing',
    });
    consoleSpy.mockRestore();
  });

  it('should report vendored resolution without network access', async () => {
    mockFindConfigFile.mockReturnValue('promptscript.yaml');
    mockLoadConfig.mockResolvedValue({
      targets: [],
      registries: { '@company': 'github.com/company/base' },
    });
    mockLoadUserConfig.mockResolvedValue({ version: '1' });
    mockExpandAlias.mockReturnValue({
      repoUrl: 'github.com/company/base',
      path: 'security',
      version: undefined,
    });
    mockLockfileExists.mockReturnValue(true);
    mockReadFileSync.mockReturnValue(
      JSON.stringify({
        version: 1,
        dependencies: {
          'github.com/company/base': {
            version: 'v1.0.0',
            commit: 'a'.repeat(40),
            integrity: 'sha256-test',
          },
        },
      })
    );
    mockLoadVendorManifest.mockResolvedValue({ version: 1, dependencies: {} });
    mockResolveVendoredRepository.mockResolvedValue('/project/.promptscript/vendor/repository');
    mockExistsSync.mockImplementation((path: string) => !path.endsWith('.promptscript/vendor'));
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    await resolveCommand('@company/security', { format: 'json' });

    const output = JSON.parse(consoleSpy.mock.calls[0]?.[0] as string) as Record<string, unknown>;
    expect(output).toMatchObject({
      source: 'vendor',
      location: '/project/.promptscript/vendor/repository/security.prs',
      exists: true,
    });
    expect(mockResolveVendoredRepository).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('should reject an invalid lockfile', async () => {
    mockFindConfigFile.mockReturnValue('promptscript.yaml');
    mockLoadConfig.mockResolvedValue({ targets: [] });
    mockLoadUserConfig.mockResolvedValue({ version: '1' });
    mockLockfileExists.mockReturnValue(true);
    mockReadFileSync.mockReturnValue(JSON.stringify({ invalid: true }));

    await resolveCommand('github.com/company/base/security', {});

    expect(ConsoleOutput.error).toHaveBeenCalledWith(expect.stringContaining('Invalid lockfile'));
    expect(process.exitCode).toBe(1);
  });

  it('should match markdown child lock entries', async () => {
    mockFindConfigFile.mockReturnValue('promptscript.yaml');
    mockLoadConfig.mockResolvedValue({ targets: [] });
    mockLoadUserConfig.mockResolvedValue({ version: '1' });
    mockLockfileExists.mockReturnValue(true);
    mockReadFileSync.mockReturnValue(
      JSON.stringify({
        version: 1,
        dependencies: {
          'github.com/company/base/security': {
            version: 'v3.0.0',
            commit: 'a'.repeat(40),
            integrity: 'sha256-test',
            source: 'md',
          },
        },
      })
    );
    mockExistsSync.mockReturnValue(false);
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    await resolveCommand('github.com/company/base/security', { format: 'json' });

    const output = JSON.parse(consoleSpy.mock.calls[0]?.[0] as string) as Record<string, unknown>;
    expect(output).toMatchObject({
      lockedVersion: 'v3.0.0',
      commit: 'a'.repeat(40),
    });
    consoleSpy.mockRestore();
  });

  it('should reject an empty import path', async () => {
    mockFindConfigFile.mockReturnValue('promptscript.yaml');
    mockLoadConfig.mockResolvedValue({ targets: [] });
    mockLoadUserConfig.mockResolvedValue({ version: '1' });

    await resolveCommand('', {});

    expect(ConsoleOutput.error).toHaveBeenCalledWith(expect.stringContaining('Resolution failed'));
    expect(process.exitCode).toBe(1);
  });

  it('should reject an existing vendor directory without a manifest', async () => {
    mockFindConfigFile.mockReturnValue('promptscript.yaml');
    mockLoadConfig.mockResolvedValue({ targets: [] });
    mockLoadUserConfig.mockResolvedValue({ version: '1' });
    mockExistsSync.mockImplementation((path: string) => path.endsWith('.promptscript/vendor'));

    await resolveCommand('github.com/company/base/security', {});

    expect(ConsoleOutput.error).toHaveBeenCalledWith(
      expect.stringContaining('Vendor manifest is missing')
    );
    expect(process.exitCode).toBe(1);
  });

  it('should reject an unpinned vendored dependency', async () => {
    mockFindConfigFile.mockReturnValue('promptscript.yaml');
    mockLoadConfig.mockResolvedValue({ targets: [] });
    mockLoadUserConfig.mockResolvedValue({ version: '1' });
    mockLoadVendorManifest.mockResolvedValue({ version: 1, dependencies: {} });
    mockExistsSync.mockImplementation((path: string) => !path.endsWith('.promptscript/vendor'));

    await resolveCommand('github.com/company/base/security', {});

    expect(ConsoleOutput.error).toHaveBeenCalledWith(
      expect.stringContaining('not pinned by the lockfile')
    );
    expect(process.exitCode).toBe(1);
  });

  it('should reject a missing vendored dependency', async () => {
    mockFindConfigFile.mockReturnValue('promptscript.yaml');
    mockLoadConfig.mockResolvedValue({ targets: [] });
    mockLoadUserConfig.mockResolvedValue({ version: '1' });
    mockLockfileExists.mockReturnValue(true);
    mockReadFileSync.mockReturnValue(
      JSON.stringify({
        version: 1,
        dependencies: {
          'github.com/company/base': {
            version: 'v1.0.0',
            commit: 'a'.repeat(40),
            integrity: 'sha256-test',
          },
        },
      })
    );
    mockLoadVendorManifest.mockResolvedValue({ version: 1, dependencies: {} });
    mockResolveVendoredRepository.mockResolvedValue(null);
    mockExistsSync.mockImplementation((path: string) => !path.endsWith('.promptscript/vendor'));

    await resolveCommand('github.com/company/base/security', {});

    expect(ConsoleOutput.error).toHaveBeenCalledWith(
      expect.stringContaining('Vendored dependency is missing')
    );
    expect(process.exitCode).toBe(1);
  });

  it('should report stale cache when locked checkout verification fails', async () => {
    mockFindConfigFile.mockReturnValue('promptscript.yaml');
    mockLoadConfig.mockResolvedValue({ targets: [] });
    mockLoadUserConfig.mockResolvedValue({ version: '1' });
    mockLockfileExists.mockReturnValue(true);
    mockReadFileSync.mockReturnValue(
      JSON.stringify({
        version: 1,
        dependencies: {
          'github.com/company/base': {
            version: 'v1.0.0',
            commit: 'a'.repeat(40),
            integrity: 'sha256-test',
          },
        },
      })
    );
    mockCacheHas.mockResolvedValue(true);
    mockVerifyGitRepository.mockRejectedValue(new Error('tampered cache'));
    mockExistsSync.mockReturnValue(false);
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    await resolveCommand('github.com/company/base/security', { format: 'json' });

    const output = JSON.parse(consoleSpy.mock.calls[0]?.[0] as string) as Record<string, unknown>;
    expect(output).toMatchObject({ source: 'stale cache', type: 'not found' });
    consoleSpy.mockRestore();
  });

  it('should reject lexical and real-path repository escapes', async () => {
    mockFindConfigFile.mockReturnValue('promptscript.yaml');
    mockLoadConfig.mockResolvedValue({
      targets: [],
      registries: { '@company': 'github.com/company/base' },
    });
    mockLoadUserConfig.mockResolvedValue({ version: '1' });
    mockExpandAlias.mockReturnValue({
      repoUrl: 'github.com/company/base',
      path: '../outside',
      version: '',
    });
    mockIsInsideCachePath.mockReturnValue(false);

    await resolveCommand('@company/outside', {});

    expect(ConsoleOutput.error).toHaveBeenCalledWith(
      expect.stringContaining('Resolved path escapes its repository')
    );
    expect(process.exitCode).toBe(1);

    vi.clearAllMocks();
    process.exitCode = undefined;
    mockFindConfigFile.mockReturnValue('promptscript.yaml');
    mockLoadConfig.mockResolvedValue({
      targets: [],
      registries: { '@company': 'github.com/company/base' },
    });
    mockLoadUserConfig.mockResolvedValue({ version: '1' });
    mockExpandAlias.mockReturnValue({
      repoUrl: 'github.com/company/base',
      path: 'security',
      version: '',
    });
    mockIsInsideCachePath.mockReturnValue(true);
    mockIsRealPathInside.mockResolvedValue(false);
    mockExistsSync.mockImplementation((path: string) => !path.endsWith('.promptscript/vendor'));

    await resolveCommand('@company/security', {});

    expect(ConsoleOutput.error).toHaveBeenCalledWith(
      expect.stringContaining('Resolved path escapes its repository')
    );
    expect(process.exitCode).toBe(1);
  });

  it.each([
    ['github.com/company/base', 'repository root', true],
    ['github.com/company/base/readme.md', 'markdown', false],
    ['github.com/company/base/security', 'directory', true],
  ])('should classify %s as %s', async (importPath, expectedType, directory) => {
    mockFindConfigFile.mockReturnValue('promptscript.yaml');
    mockLoadConfig.mockResolvedValue({ targets: [] });
    mockLoadUserConfig.mockResolvedValue({ version: '1' });
    mockExistsSync.mockImplementation((path: string) => !path.endsWith('.promptscript/vendor'));
    mockStatSync.mockReturnValue({ isDirectory: () => directory });
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    await resolveCommand(importPath, { format: 'json' });

    const output = JSON.parse(consoleSpy.mock.calls[0]?.[0] as string) as Record<string, unknown>;
    expect(output).toMatchObject({ type: expectedType, exists: true });
    consoleSpy.mockRestore();
  });

  it('should reject a resolved file whose real path escapes after extension resolution', async () => {
    mockFindConfigFile.mockReturnValue('promptscript.yaml');
    mockLoadConfig.mockResolvedValue({ targets: [] });
    mockLoadUserConfig.mockResolvedValue({ version: '1' });
    mockExistsSync.mockImplementation((path: string) => !path.endsWith('.promptscript/vendor'));
    mockStatSync.mockReturnValue({ isDirectory: () => false });
    mockIsRealPathInside.mockResolvedValueOnce(true).mockResolvedValueOnce(false);

    await resolveCommand('github.com/company/base/security', {});

    expect(ConsoleOutput.error).toHaveBeenCalledWith(
      expect.stringContaining('Resolved path escapes its repository')
    );
    expect(process.exitCode).toBe(1);
  });

  it('should reject unsupported output formats', async () => {
    await resolveCommand('@company/security', { format: 'xml' });

    expect(ConsoleOutput.error).toHaveBeenCalledWith(
      expect.stringContaining('Invalid output format')
    );
    expect(process.exitCode).toBe(1);
  });
});
