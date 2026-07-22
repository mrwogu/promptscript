import { describe, it, expect, vi, beforeEach } from 'vitest';

const {
  mockSucceed,
  mockFail,
  mockWarn,
  mockSpinner,
  mockLoadConfig,
  mockFindConfigFile,
  mockExistsSync,
  mockWriteFile,
  mockReadFile,
  mockCollectRemoteImports,
  mockResolveVersion,
  mockGetCommitHash,
  mockCreateRegistryOptions,
  mockValidateRemoteAccess,
  mockGenerateLockfileReferences,
} = vi.hoisted(() => {
  const mockStart = vi.fn().mockReturnThis();
  const mockSucceed = vi.fn().mockReturnThis();
  const mockFail = vi.fn().mockReturnThis();
  const mockWarn = vi.fn().mockReturnThis();
  const mockSpinner = {
    start: mockStart,
    succeed: mockSucceed,
    fail: mockFail,
    warn: mockWarn,
    text: '',
  };
  const mockLoadConfig = vi.fn();
  const mockFindConfigFile = vi.fn();
  const mockExistsSync = vi.fn().mockReturnValue(false);
  const mockWriteFile = vi.fn().mockResolvedValue(undefined);
  const mockReadFile = vi.fn();
  const mockCollectRemoteImports = vi.fn().mockResolvedValue([]);
  const mockResolveVersion = vi.fn();
  const mockGetCommitHash = vi.fn();
  const mockCreateRegistryOptions = vi.fn();
  const mockValidateRemoteAccess = vi.fn();
  const mockGenerateLockfileReferences = vi.fn().mockResolvedValue({});
  return {
    mockSucceed,
    mockFail,
    mockWarn,
    mockSpinner,
    mockLoadConfig,
    mockFindConfigFile,
    mockExistsSync,
    mockWriteFile,
    mockReadFile,
    mockCollectRemoteImports,
    mockResolveVersion,
    mockGetCommitHash,
    mockCreateRegistryOptions,
    mockValidateRemoteAccess,
    mockGenerateLockfileReferences,
  };
});

vi.mock('../../output/console.js', () => ({
  createSpinner: vi.fn(() => mockSpinner),
  ConsoleOutput: { success: vi.fn(), error: vi.fn(), muted: vi.fn(), newline: vi.fn() },
}));

vi.mock('../../config/loader.js', () => ({
  loadConfig: mockLoadConfig,
  findConfigFile: mockFindConfigFile,
}));

vi.mock('fs', () => ({ existsSync: mockExistsSync }));

vi.mock('fs/promises', () => ({
  writeFile: mockWriteFile,
  readFile: mockReadFile,
}));

vi.mock('../lock-scanner.js', () => ({
  collectRemoteImports: mockCollectRemoteImports,
}));

vi.mock('../lock-references.js', () => ({
  generateLockfileReferences: mockGenerateLockfileReferences,
}));

vi.mock('../../utils/registry-resolver.js', () => ({
  resolveRegistryPath: vi.fn().mockResolvedValue({
    path: '/registry',
    isRemote: false,
    source: 'local',
  }),
}));

vi.mock('@promptscript/resolver', () => ({
  createGitRegistry: vi.fn((options: unknown) => {
    mockCreateRegistryOptions(options);
    return { resolveVersion: mockResolveVersion, getCommitHash: mockGetCommitHash };
  }),
  normalizeGitUrl: vi.fn((url: string) =>
    url.endsWith('.git') || url.startsWith('file:') || url.startsWith('git@') ? url : `${url}.git`
  ),
  validateRemoteAccess: mockValidateRemoteAccess,
  isSemverRange: vi.fn((range: string) => /^(?:v?\d|\^|~|[<>=]|[*xX])/.test(range)),
  versionSatisfiesRange: vi.fn(
    (version: string, range: string) => version.replace(/^v/, '') === range.replace(/^[v^~]/, '')
  ),
}));

vi.mock('yaml', () => ({
  parse: (s: string) => JSON.parse(s),
  stringify: (o: unknown) => JSON.stringify(o),
}));

import { lockCommand, resolveRemoteDependency } from '../lock.js';

describe('lockCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResolveVersion.mockImplementation(async (_repoUrl: string, version: string | string[]) =>
      Array.isArray(version) ? version[0] : version
    );
    mockValidateRemoteAccess.mockResolvedValue({
      accessible: true,
      headCommit: '1234567890abcdef1234567890abcdef12345678',
    });
    mockGetCommitHash.mockResolvedValue('1234567890abcdef1234567890abcdef12345678');
    mockGenerateLockfileReferences.mockResolvedValue({});
    process.exitCode = undefined;
  });

  it('should fail when no project config found', async () => {
    mockFindConfigFile.mockReturnValue(null);

    await lockCommand({});

    expect(mockFail).toHaveBeenCalledWith('No project config found');
    expect(process.exitCode).toBe(1);
  });

  it('should warn when no registries configured and no scanned imports', async () => {
    mockFindConfigFile.mockReturnValue('promptscript.yaml');
    mockLoadConfig.mockResolvedValue({ targets: [] });
    mockCollectRemoteImports.mockResolvedValue([]);

    await lockCommand({});

    expect(mockWarn).toHaveBeenCalledWith('No remote dependencies found');
  });

  it('should write lockfile when registries are configured', async () => {
    mockFindConfigFile.mockReturnValue('promptscript.yaml');
    mockLoadConfig.mockResolvedValue({
      targets: [],
      registries: { '@company': 'github.com/company/base' },
    });
    mockExistsSync.mockReturnValue(false);

    await lockCommand({});

    expect(mockWriteFile).toHaveBeenCalledWith('promptscript.lock', expect.any(String), 'utf-8');
    expect(mockCollectRemoteImports).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ strict: true })
    );
    expect(mockGenerateLockfileReferences).toHaveBeenCalledWith(
      expect.any(Object),
      expect.any(String),
      expect.any(String),
      expect.objectContaining({
        dependencies: expect.objectContaining({
          'github.com/company/base': expect.any(Object),
        }),
      }),
      []
    );
    expect(mockSucceed).toHaveBeenCalledWith('Lockfile generated');
    const written = (mockWriteFile.mock.calls[0] as unknown[])[1] as string;
    const parsed = JSON.parse(written) as {
      dependencies: Record<string, { commit: string }>;
    };
    expect(parsed.dependencies['github.com/company/base']?.commit).toBe(
      '1234567890abcdef1234567890abcdef12345678'
    );
  });

  it('should include generated reference hashes', async () => {
    mockFindConfigFile.mockReturnValue('promptscript.yaml');
    mockLoadConfig.mockResolvedValue({
      targets: [],
      registries: { '@company': 'github.com/company/base' },
    });
    mockGenerateLockfileReferences.mockResolvedValue({
      'github.com/company/base\0references/guide.md\0latest': {
        hash: `sha256-${'a'.repeat(64)}`,
        lockedAt: '2026-01-01T00:00:00.000Z',
      },
    });

    await lockCommand({});

    const written = (mockWriteFile.mock.calls[0] as unknown[])[1] as string;
    const parsed = JSON.parse(written) as {
      references: Record<string, { hash: string }>;
    };
    expect(parsed.references['github.com/company/base\0references/guide.md\0latest']?.hash).toBe(
      `sha256-${'a'.repeat(64)}`
    );
  });

  it('should lock the default Git registry for vendor workflows', async () => {
    mockFindConfigFile.mockReturnValue('promptscript.yaml');
    mockLoadConfig.mockResolvedValue({
      targets: [],
      registry: {
        git: {
          url: 'https://github.com/company/registry.git',
          ref: 'v2.0.0',
        },
      },
    });
    mockExistsSync.mockReturnValue(false);

    await lockCommand({});

    const written = (mockWriteFile.mock.calls[0] as unknown[])[1] as string;
    const parsed = JSON.parse(written) as {
      dependencies: Record<string, { version: string; commit: string }>;
    };
    expect(parsed.dependencies['https://github.com/company/registry.git']).toEqual(
      expect.objectContaining({
        version: 'v2.0.0',
        commit: '1234567890abcdef1234567890abcdef12345678',
      })
    );
  });

  it('uses the default registry ref and authentication when resolving its lock', async () => {
    mockFindConfigFile.mockReturnValue('promptscript.yaml');
    mockLoadConfig.mockResolvedValue({
      targets: [],
      registry: {
        git: {
          url: 'https://github.com/company/registry.git',
          auth: { type: 'token', tokenEnvVar: 'REGISTRY_TOKEN' },
        },
      },
    });
    mockExistsSync.mockReturnValue(false);

    await lockCommand({});

    const written = (mockWriteFile.mock.calls[0] as unknown[])[1] as string;
    const parsed = JSON.parse(written) as {
      dependencies: Record<string, { version: string; commit: string }>;
    };
    expect(parsed.dependencies['https://github.com/company/registry.git']).toEqual(
      expect.objectContaining({
        version: 'main',
        commit: '1234567890abcdef1234567890abcdef12345678',
      })
    );
    expect(mockCreateRegistryOptions).toHaveBeenCalledWith({
      url: 'https://github.com/company/registry.git',
      auth: { type: 'token', tokenEnvVar: 'REGISTRY_TOKEN' },
    });
  });

  it('should preserve a malformed existing lockfile', async () => {
    mockFindConfigFile.mockReturnValue('promptscript.yaml');
    mockLoadConfig.mockResolvedValue({
      targets: [],
      registries: { '@company': 'github.com/company/base' },
    });
    mockExistsSync.mockReturnValue(true);
    mockReadFile.mockResolvedValue('{ malformed');

    await lockCommand({});

    expect(mockWriteFile).not.toHaveBeenCalled();
    expect(mockFail).toHaveBeenCalledWith('Failed to generate lockfile');
    expect(process.exitCode).toBe(1);
  });

  it('should reject an existing lockfile with an invalid structure', async () => {
    mockFindConfigFile.mockReturnValue('promptscript.yaml');
    mockLoadConfig.mockResolvedValue({
      targets: [],
      registries: { '@company': 'github.com/company/base' },
    });
    mockExistsSync.mockReturnValue(true);
    mockReadFile.mockResolvedValue('{}');

    await lockCommand({});

    expect(mockWriteFile).not.toHaveBeenCalled();
    expect(mockFail).toHaveBeenCalledWith('Failed to generate lockfile');
    expect(process.exitCode).toBe(1);
  });

  it('should preserve existing pins', async () => {
    mockFindConfigFile.mockReturnValue('promptscript.yaml');
    mockLoadConfig.mockResolvedValue({
      targets: [],
      registries: { '@company': 'github.com/company/base' },
    });
    mockExistsSync.mockReturnValue(true);
    mockReadFile.mockResolvedValue(
      JSON.stringify({
        version: 1,
        dependencies: {
          'github.com/company/base': {
            version: 'v1.2.0',
            commit: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
            integrity: 'sha256-xyz',
          },
        },
      })
    );

    await lockCommand({});

    const written = (mockWriteFile.mock.calls[0] as unknown[])[1] as string;
    const parsed = JSON.parse(written) as { dependencies: Record<string, { version: string }> };
    expect(parsed.dependencies['github.com/company/base']!.version).toBe('v1.2.0');
    expect(mockValidateRemoteAccess).not.toHaveBeenCalled();
  });

  it('should retain fallback URL when reusing an existing pin', async () => {
    const existing = {
      version: 'v1.2.0',
      commit: 'a'.repeat(40),
      integrity: 'sha256-existing',
    };

    const result = await resolveRemoteDependency(
      'github.com/company/base',
      ['v1.2.0'],
      existing,
      false,
      'git@github.com:company/base.git'
    );

    expect(result).toEqual({ ...existing, gitUrl: 'git@github.com:company/base.git' });
    expect(mockValidateRemoteAccess).not.toHaveBeenCalled();
  });

  it('should refresh existing pins with --update', async () => {
    mockFindConfigFile.mockReturnValue('promptscript.yaml');
    mockLoadConfig.mockResolvedValue({
      targets: [],
      registries: { '@company': 'github.com/company/base' },
    });
    mockExistsSync.mockReturnValue(true);
    mockReadFile.mockResolvedValue(
      JSON.stringify({
        version: 1,
        dependencies: {
          'github.com/company/base': {
            version: 'latest',
            commit: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
            integrity: 'sha256-old',
          },
        },
      })
    );

    await lockCommand({ command: 'update', update: true });

    const written = (mockWriteFile.mock.calls[0] as unknown[])[1] as string;
    const parsed = JSON.parse(written) as {
      dependencies: Record<string, { commit: string }>;
    };
    expect(parsed.dependencies['github.com/company/base']?.commit).toBe(
      '1234567890abcdef1234567890abcdef12345678'
    );
    expect(mockValidateRemoteAccess).toHaveBeenCalled();
    expect(mockSucceed).toHaveBeenCalledWith('Lockfile updated');
  });

  it('should reject owner-only refreshes for managed skills', async () => {
    mockFindConfigFile.mockReturnValue('promptscript.yaml');
    mockLoadConfig.mockResolvedValue({
      targets: [],
      registries: { '@company': 'github.com/company/base' },
    });
    mockExistsSync.mockReturnValue(true);
    mockReadFile.mockResolvedValue(
      JSON.stringify({
        version: 1,
        dependencies: {
          'github.com/company/base': {
            version: 'latest',
            commit: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
            integrity: 'sha256-old',
            source: 'md',
            skills: ['github.com/company/base/skills/foo'],
          },
          'github.com/company/base/skills/foo': {
            version: 'latest',
            commit: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
            integrity: 'sha256-skill',
            source: 'md',
          },
        },
      })
    );

    await lockCommand({ command: 'update', update: true });

    expect(mockWriteFile).not.toHaveBeenCalled();
    expect(mockFail).toHaveBeenCalledWith('Failed to update lockfile');
    expect(process.exitCode).toBe(1);
  });

  it('should refresh only the dependency matching updatePackage', async () => {
    mockFindConfigFile.mockReturnValue('promptscript.yaml');
    mockLoadConfig.mockResolvedValue({
      targets: [],
      registries: {
        '@alpha': 'github.com/alpha/base',
        '@beta': 'github.com/beta/base',
      },
    });
    mockExistsSync.mockReturnValue(true);
    mockReadFile.mockResolvedValue(
      JSON.stringify({
        version: 1,
        dependencies: {
          'github.com/alpha/base': {
            version: 'latest',
            commit: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
            integrity: 'sha256-alpha',
          },
          'github.com/beta/base': {
            version: 'latest',
            commit: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
            integrity: 'sha256-beta',
          },
        },
      })
    );

    await lockCommand({ update: true, updatePackage: 'alpha' });

    const written = (mockWriteFile.mock.calls[0] as unknown[])[1] as string;
    const parsed = JSON.parse(written) as {
      dependencies: Record<string, { commit: string }>;
    };
    expect(parsed.dependencies['github.com/alpha/base']?.commit).toBe(
      '1234567890abcdef1234567890abcdef12345678'
    );
    expect(parsed.dependencies['github.com/beta/base']?.commit).toBe(
      'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'
    );
    expect(mockValidateRemoteAccess).toHaveBeenCalledTimes(1);
  });

  it('should fail when updatePackage matches no dependency', async () => {
    mockFindConfigFile.mockReturnValue('promptscript.yaml');
    mockLoadConfig.mockResolvedValue({
      targets: [],
      registries: { '@company': 'github.com/company/base' },
    });
    mockExistsSync.mockReturnValue(false);

    await lockCommand({ update: true, updatePackage: 'missing' });

    expect(mockWriteFile).not.toHaveBeenCalled();
    expect(mockFail).toHaveBeenCalledWith('Failed to generate lockfile');
    expect(process.exitCode).toBe(1);
  });

  it('should fail when a remote dependency cannot be resolved', async () => {
    mockFindConfigFile.mockReturnValue('promptscript.yaml');
    mockLoadConfig.mockResolvedValue({
      targets: [],
      registries: { '@company': 'github.com/company/base' },
    });
    mockExistsSync.mockReturnValue(false);
    mockValidateRemoteAccess.mockResolvedValue({
      accessible: false,
      error: 'remote unavailable',
    });

    await lockCommand({});

    expect(mockWriteFile).not.toHaveBeenCalled();
    expect(mockFail).toHaveBeenCalledWith('Failed to generate lockfile');
    expect(process.exitCode).toBe(1);
  });

  it('should not write file in dry-run mode', async () => {
    mockFindConfigFile.mockReturnValue('promptscript.yaml');
    mockLoadConfig.mockResolvedValue({
      targets: [],
      registries: { '@company': 'github.com/company/base' },
    });
    mockExistsSync.mockReturnValue(false);

    await lockCommand({ dryRun: true });

    expect(mockWriteFile).not.toHaveBeenCalled();
    expect(mockSucceed).toHaveBeenCalledWith('Dry run — lockfile not written');
  });

  it('should handle exception during lock generation', async () => {
    mockFindConfigFile.mockReturnValue('promptscript.yaml');
    mockLoadConfig.mockRejectedValue(new Error('config load failure'));

    await lockCommand({});

    expect(mockFail).toHaveBeenCalledWith('Failed to generate lockfile');
    expect(process.exitCode).toBe(1);
  });

  it('should preserve an unreadable existing lockfile', async () => {
    mockFindConfigFile.mockReturnValue('promptscript.yaml');
    mockLoadConfig.mockResolvedValue({
      targets: [],
      registries: { '@company': 'github.com/company/base' },
    });
    mockExistsSync.mockReturnValue(true);
    mockReadFile.mockRejectedValue(new Error('read failure'));

    await lockCommand({});

    expect(mockWriteFile).not.toHaveBeenCalled();
    expect(mockFail).toHaveBeenCalledWith('Failed to generate lockfile');
    expect(process.exitCode).toBe(1);
  });

  it('should handle object-form registry entry', async () => {
    mockFindConfigFile.mockReturnValue('promptscript.yaml');
    mockLoadConfig.mockResolvedValue({
      targets: [],
      registries: { '@company': { url: 'github.com/company/base', root: 'packages/prs' } },
    });
    mockExistsSync.mockReturnValue(false);

    await lockCommand({});

    const written = (mockWriteFile.mock.calls[0] as unknown[])[1] as string;
    const parsed = JSON.parse(written) as {
      dependencies: Record<string, { version: string }>;
    };
    expect(parsed.dependencies['github.com/company/base']).toBeDefined();
  });

  it('should use a configured fallback URL when the primary remote fails', async () => {
    mockFindConfigFile.mockReturnValue('promptscript.yaml');
    mockLoadConfig.mockResolvedValue({
      targets: [],
      registries: {
        '@company': {
          url: 'https://github.com/company/base.git',
          fallbackUrl: 'git@github.com:company/base.git',
        },
        '@mirror': 'https://github.com/company/base.git',
      },
    });
    mockExistsSync.mockReturnValue(false);
    mockValidateRemoteAccess
      .mockResolvedValueOnce({ accessible: false, error: 'authentication failed' })
      .mockResolvedValueOnce({
        accessible: true,
        headCommit: '1234567890abcdef1234567890abcdef12345678',
      });

    await lockCommand({});

    expect(mockWriteFile).toHaveBeenCalled();
    expect(mockValidateRemoteAccess).toHaveBeenLastCalledWith(
      'git@github.com:company/base.git',
      undefined
    );
    const written = (mockWriteFile.mock.calls[0] as unknown[])[1] as string;
    const parsed = JSON.parse(written) as {
      dependencies: Record<string, { gitUrl?: string }>;
    };
    expect(parsed.dependencies['https://github.com/company/base.git']?.gitUrl).toBe(
      'git@github.com:company/base.git'
    );
  });

  it('should use a default registry fallback URL when its primary remote fails', async () => {
    mockFindConfigFile.mockReturnValue('promptscript.yaml');
    mockLoadConfig.mockResolvedValue({
      targets: [],
      registry: {
        git: {
          url: 'https://github.com/company/registry.git',
          fallbackUrl: 'git@github.com:company/registry.git',
        },
      },
    });
    mockExistsSync.mockReturnValue(false);
    mockValidateRemoteAccess
      .mockResolvedValueOnce({ accessible: false, error: 'primary unavailable' })
      .mockResolvedValueOnce({
        accessible: true,
        headCommit: '1234567890abcdef1234567890abcdef12345678',
      });

    await lockCommand({});

    const written = (mockWriteFile.mock.calls[0] as unknown[])[1] as string;
    const parsed = JSON.parse(written) as {
      dependencies: Record<string, { gitUrl?: string }>;
    };
    expect(parsed.dependencies['https://github.com/company/registry.git']?.gitUrl).toBe(
      'git@github.com:company/registry.git'
    );
  });

  it('should preserve SSH transport when resolving a dependency', async () => {
    mockFindConfigFile.mockReturnValue('promptscript.yaml');
    mockLoadConfig.mockResolvedValue({
      targets: [],
      registries: { '@company': 'git@github.com:company/base.git' },
    });
    mockExistsSync.mockReturnValue(false);

    await lockCommand({});

    expect(mockValidateRemoteAccess).toHaveBeenCalledWith(
      'git@github.com:company/base.git',
      undefined
    );
  });

  it('should preserve md-sourced entries from previous lockfile', async () => {
    mockFindConfigFile.mockReturnValue('promptscript.yaml');
    mockLoadConfig.mockResolvedValue({
      targets: [],
      registries: { '@company': 'github.com/company/base' },
    });
    mockExistsSync.mockReturnValue(true);
    mockReadFile.mockResolvedValue(
      JSON.stringify({
        version: 1,
        dependencies: {
          'github.com/company/base': {
            version: 'v1.0.0',
            commit: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
            integrity: 'sha256-xyz',
          },
          'github.com/org/skills/SKILL.md': {
            version: 'latest',
            commit: '0000000000000000000000000000000000000000',
            integrity: 'sha256-pending',
            source: 'md',
          },
          'https://github.com/org/skills': {
            version: 'latest',
            commit: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
            integrity: 'sha256-pending',
            source: 'md',
            skills: ['github.com/org/skills/SKILL.md'],
          },
        },
      })
    );

    await lockCommand({});

    expect(mockSucceed).toHaveBeenCalledWith('Lockfile generated');

    const written = (mockWriteFile.mock.calls[0] as unknown[])[1] as string;
    const parsed = JSON.parse(written) as {
      dependencies: Record<string, { version: string; source?: string }>;
    };
    // Registry entry should be preserved
    expect(parsed.dependencies['github.com/company/base']!.version).toBe('v1.0.0');
    // md-sourced entry should also be preserved
    expect(parsed.dependencies['github.com/org/skills/SKILL.md']).toBeDefined();
    expect(parsed.dependencies['github.com/org/skills/SKILL.md']!.source).toBe('md');
    expect(parsed.dependencies['https://github.com/org/skills']!.source).toBe('md');
  });

  it('should merge metadata for an md-sourced dependency that is still requested', async () => {
    mockFindConfigFile.mockReturnValue('promptscript.yaml');
    mockLoadConfig.mockResolvedValue({
      targets: [],
      registries: { '@company': 'github.com/company/base' },
    });
    mockExistsSync.mockReturnValue(true);
    mockReadFile.mockResolvedValue(
      JSON.stringify({
        version: 1,
        dependencies: {
          'github.com/company/base': {
            version: 'latest',
            commit: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
            integrity: 'sha256-existing',
            source: 'md',
            gitUrl: 'git@github.com:company/base.git',
          },
        },
      })
    );

    await lockCommand({});

    const written = (mockWriteFile.mock.calls[0] as unknown[])[1] as string;
    const parsed = JSON.parse(written) as {
      dependencies: Record<string, { source?: string; gitUrl?: string }>;
    };
    expect(parsed.dependencies['github.com/company/base']).toEqual(
      expect.objectContaining({
        source: 'md',
        gitUrl: 'git@github.com:company/base.git',
      })
    );
  });

  it('should pass existing reference locks into reference generation', async () => {
    const referenceKey = 'github.com/company/base\0references/guide.md\0latest';
    const references = {
      [referenceKey]: {
        hash: `sha256-${'a'.repeat(64)}`,
        lockedAt: '2026-01-01T00:00:00.000Z',
      },
    };
    mockFindConfigFile.mockReturnValue('promptscript.yaml');
    mockLoadConfig.mockResolvedValue({
      targets: [],
      registries: { '@company': 'github.com/company/base' },
    });
    mockExistsSync.mockReturnValue(true);
    mockReadFile.mockResolvedValue(
      JSON.stringify({
        version: 1,
        dependencies: {
          'github.com/company/base': {
            version: 'latest',
            commit: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
            integrity: 'sha256-existing',
          },
        },
        references,
      })
    );

    await lockCommand({});

    expect(mockGenerateLockfileReferences).toHaveBeenCalledWith(
      expect.any(Object),
      expect.any(String),
      expect.any(String),
      expect.objectContaining({ references }),
      []
    );
  });

  it('should discover and lock @use github.com imports from .prs files', async () => {
    mockFindConfigFile.mockReturnValue('promptscript.yaml');
    mockLoadConfig.mockResolvedValue({
      targets: [],
      registries: { '@company': 'github.com/company/base' },
    });
    mockExistsSync.mockReturnValue(false);
    mockCollectRemoteImports.mockResolvedValue([
      {
        repoUrl: 'https://github.com/org/repo',
        path: 'guards/safety.prs',
        version: 'v2.0.0',
      },
    ]);

    await lockCommand({});

    expect(mockWriteFile).toHaveBeenCalled();
    const written = (mockWriteFile.mock.calls[0] as unknown[])[1] as string;
    const parsed = JSON.parse(written) as {
      dependencies: Record<string, { version: string }>;
    };
    // Registry alias dependency
    expect(parsed.dependencies['github.com/company/base']).toBeDefined();
    // Scanned @use import dependency
    expect(parsed.dependencies['https://github.com/org/repo']).toBeDefined();
    expect(parsed.dependencies['https://github.com/org/repo']!.version).toBe('v2.0.0');
    expect(mockResolveVersion).toHaveBeenCalledWith('https://github.com/org/repo.git', ['v2.0.0']);
    expect(mockValidateRemoteAccess).toHaveBeenCalledWith(
      'https://github.com/org/repo.git',
      'v2.0.0'
    );
  });

  it('should generate lockfile even without registries when @use imports exist', async () => {
    mockFindConfigFile.mockReturnValue('promptscript.yaml');
    mockLoadConfig.mockResolvedValue({ targets: [] });
    mockExistsSync.mockReturnValue(false);
    mockCollectRemoteImports.mockResolvedValue([
      {
        repoUrl: 'https://github.com/org/repo',
        path: 'guards/safety.prs',
        version: 'v1.0.0',
      },
    ]);

    await lockCommand({});

    expect(mockWarn).not.toHaveBeenCalled();
    expect(mockWriteFile).toHaveBeenCalled();
    expect(mockSucceed).toHaveBeenCalledWith('Lockfile generated');
    const written = (mockWriteFile.mock.calls[0] as unknown[])[1] as string;
    const parsed = JSON.parse(written) as {
      dependencies: Record<string, { version: string }>;
    };
    expect(parsed.dependencies['https://github.com/org/repo']).toBeDefined();
  });

  it('should treat an unversioned remote import as latest', async () => {
    mockFindConfigFile.mockReturnValue('promptscript.yaml');
    mockLoadConfig.mockResolvedValue({ targets: [] });
    mockExistsSync.mockReturnValue(false);
    mockCollectRemoteImports.mockResolvedValue([
      {
        repoUrl: 'https://github.com/org/repo',
        path: 'guards/safety.prs',
        version: '',
      },
    ]);

    await lockCommand({});

    const written = (mockWriteFile.mock.calls[0] as unknown[])[1] as string;
    const parsed = JSON.parse(written) as {
      dependencies: Record<string, { version: string }>;
    };
    expect(parsed.dependencies['https://github.com/org/repo']?.version).toBe('latest');
    expect(mockValidateRemoteAccess).toHaveBeenCalledWith(
      'https://github.com/org/repo.git',
      undefined
    );
  });

  it('should deduplicate repos from @use imports with same repoUrl', async () => {
    mockFindConfigFile.mockReturnValue('promptscript.yaml');
    mockLoadConfig.mockResolvedValue({ targets: [] });
    mockExistsSync.mockReturnValue(false);
    mockCollectRemoteImports.mockResolvedValue([
      {
        repoUrl: 'https://github.com/org/repo',
        path: 'guards/safety.prs',
        version: 'v1.0.0',
      },
      {
        repoUrl: 'https://github.com/org/repo',
        path: 'prompts/base.prs',
        version: 'v1.0.0',
      },
    ]);

    await lockCommand({});

    expect(mockWriteFile).toHaveBeenCalled();
    const written = (mockWriteFile.mock.calls[0] as unknown[])[1] as string;
    const parsed = JSON.parse(written) as {
      dependencies: Record<string, { version: string }>;
    };
    // Should have only one entry for the repo, not two
    const repoKeys = Object.keys(parsed.dependencies).filter(
      (k) => k === 'https://github.com/org/repo'
    );
    expect(repoKeys).toHaveLength(1);
  });

  it('should reject conflicting versions for one repository', async () => {
    mockFindConfigFile.mockReturnValue('promptscript.yaml');
    mockLoadConfig.mockResolvedValue({ targets: [] });
    mockExistsSync.mockReturnValue(false);
    mockResolveVersion.mockResolvedValue(null);
    mockCollectRemoteImports.mockResolvedValue([
      {
        repoUrl: 'https://github.com/org/repo',
        path: 'guards/safety.prs',
        version: 'v1.0.0',
      },
      {
        repoUrl: 'https://github.com/org/repo',
        path: 'prompts/base.prs',
        version: 'v2.0.0',
      },
    ]);

    await lockCommand({});

    expect(mockWriteFile).not.toHaveBeenCalled();
    expect(mockFail).toHaveBeenCalledWith('Failed to generate lockfile');
    expect(process.exitCode).toBe(1);
  });

  it('should reject conflicting non-semver refs for one repository', async () => {
    mockFindConfigFile.mockReturnValue('promptscript.yaml');
    mockLoadConfig.mockResolvedValue({ targets: [] });
    mockExistsSync.mockReturnValue(false);
    mockCollectRemoteImports.mockResolvedValue([
      {
        repoUrl: 'https://github.com/org/repo',
        path: 'guards/safety.prs',
        version: 'main',
      },
      {
        repoUrl: 'https://github.com/org/repo',
        path: 'prompts/base.prs',
        version: 'develop',
      },
    ]);

    await lockCommand({});

    expect(mockWriteFile).not.toHaveBeenCalled();
    expect(mockFail).toHaveBeenCalledWith('Failed to generate lockfile');
    expect(process.exitCode).toBe(1);
  });

  it('should accept selectors that resolve to the same version', async () => {
    mockFindConfigFile.mockReturnValue('promptscript.yaml');
    mockLoadConfig.mockResolvedValue({ targets: [] });
    mockExistsSync.mockReturnValue(false);
    mockResolveVersion.mockResolvedValue('v1.2.0');
    mockCollectRemoteImports.mockResolvedValue([
      {
        repoUrl: 'https://github.com/org/repo',
        path: 'guards/safety.prs',
        version: '1.2.0',
      },
      {
        repoUrl: 'https://github.com/org/repo',
        path: 'prompts/base.prs',
        version: 'v1.2.0',
      },
    ]);

    await lockCommand({});

    expect(mockWriteFile).toHaveBeenCalled();
    expect(process.exitCode).toBeUndefined();
  });

  it('should reuse an existing pin that satisfies a requested range', async () => {
    mockFindConfigFile.mockReturnValue('promptscript.yaml');
    mockLoadConfig.mockResolvedValue({ targets: [] });
    mockExistsSync.mockReturnValue(true);
    mockReadFile.mockResolvedValue(
      JSON.stringify({
        version: 1,
        dependencies: {
          'https://github.com/org/repo': {
            version: 'v1.2.0',
            commit: 'abcdefabcdefabcdefabcdefabcdefabcdefabcd',
            integrity: 'sha256-existing',
          },
        },
      })
    );
    mockCollectRemoteImports.mockResolvedValue([
      {
        repoUrl: 'https://github.com/org/repo',
        path: 'guards/safety.prs',
        version: '1.2.0',
      },
    ]);

    await lockCommand({});

    expect(mockValidateRemoteAccess).not.toHaveBeenCalled();
    expect(mockWriteFile).toHaveBeenCalled();
  });

  it('should reuse existing lockfile entry for scanned imports', async () => {
    mockFindConfigFile.mockReturnValue('promptscript.yaml');
    mockLoadConfig.mockResolvedValue({ targets: [] });
    mockExistsSync.mockReturnValue(true);
    mockReadFile.mockResolvedValue(
      JSON.stringify({
        version: 1,
        dependencies: {
          'https://github.com/org/repo': {
            version: 'v2.0.0',
            commit: 'abcdefabcdefabcdefabcdefabcdefabcdefabcd',
            integrity: 'sha256-existing',
          },
        },
      })
    );
    mockCollectRemoteImports.mockResolvedValue([
      {
        repoUrl: 'https://github.com/org/repo',
        path: 'guards/safety.prs',
        version: 'v2.0.0',
      },
    ]);

    await lockCommand({});

    const written = (mockWriteFile.mock.calls[0] as unknown[])[1] as string;
    const parsed = JSON.parse(written) as {
      dependencies: Record<string, { version: string; commit: string; integrity: string }>;
    };
    // Should preserve the existing pinned entry, not create a fresh one
    expect(parsed.dependencies['https://github.com/org/repo']!.commit).toBe(
      'abcdefabcdefabcdefabcdefabcdefabcdefabcd'
    );
    expect(parsed.dependencies['https://github.com/org/repo']!.integrity).toBe('sha256-existing');
  });

  it('should fail gracefully when scanner throws', async () => {
    mockFindConfigFile.mockReturnValue('promptscript.yaml');
    mockLoadConfig.mockResolvedValue({ targets: [], registries: { '@co': 'github.com/co/base' } });
    mockCollectRemoteImports.mockRejectedValue(new Error('scanner failure'));

    await lockCommand({});

    expect(mockFail).toHaveBeenCalledWith('Failed to generate lockfile');
    expect(process.exitCode).toBe(1);
  });

  it('should preserve integrity when a forced refresh resolves the same commit', async () => {
    const existing = {
      version: 'latest',
      commit: '1234567890abcdef1234567890abcdef12345678',
      integrity: 'sha256-existing',
    };

    const result = await resolveRemoteDependency(
      'github.com/company/base',
      ['latest'],
      existing,
      true
    );

    expect(result.integrity).toBe('sha256-existing');
  });

  it('should provide a default error when remote validation gives no reason', async () => {
    mockValidateRemoteAccess.mockResolvedValue({ accessible: false });

    await expect(
      resolveRemoteDependency('github.com/company/base', ['latest'], undefined, false)
    ).rejects.toThrow('Could not resolve a commit for github.com/company/base');
  });

  it('should normalize non-Error remote failures', async () => {
    mockValidateRemoteAccess.mockRejectedValue('network unavailable');

    await expect(
      resolveRemoteDependency('github.com/company/base', ['latest'], undefined, false)
    ).rejects.toThrow('network unavailable');
  });

  it('should reject a missing repository URL before remote validation', async () => {
    await expect(
      resolveRemoteDependency(undefined as unknown as string, ['latest'], undefined, false)
    ).rejects.toThrow('Could not resolve undefined');

    expect(mockValidateRemoteAccess).not.toHaveBeenCalled();
  });
});
