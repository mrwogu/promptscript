import { describe, it, expect, vi, beforeEach } from 'vitest';

const {
  mockSucceed,
  mockFail,
  mockConsoleError,
  mockSpinner,
  mockExistsSync,
  mockReadFile,
  mockWriteFile,
  mockMkdir,
  mockMkdtemp,
  mockReaddir,
  mockRename,
  mockRm,
  mockCloneAtTag,
  mockCheckoutCommit,
  mockLoadConfig,
  mockRegistryOptions,
  mockLoadVendorManifest,
  mockResolveVendoredRepository,
} = vi.hoisted(() => {
  const mockStart = vi.fn().mockReturnThis();
  const mockSucceed = vi.fn().mockReturnThis();
  const mockFail = vi.fn().mockReturnThis();
  const mockConsoleError = vi.fn();
  const mockWarn = vi.fn().mockReturnThis();
  const mockSpinner = {
    start: mockStart,
    succeed: mockSucceed,
    fail: mockFail,
    warn: mockWarn,
    text: '',
  };
  const mockExistsSync = vi.fn();
  const mockReadFile = vi.fn();
  const mockWriteFile = vi.fn().mockResolvedValue(undefined);
  const mockMkdir = vi.fn().mockResolvedValue(undefined);
  const mockMkdtemp = vi.fn().mockResolvedValue('/project/.promptscript/.vendor-stage-test');
  const mockReaddir = vi.fn().mockResolvedValue([]);
  const mockRename = vi.fn().mockResolvedValue(undefined);
  const mockRm = vi.fn().mockResolvedValue(undefined);
  const mockCloneAtTag = vi.fn().mockResolvedValue(undefined);
  const mockCheckoutCommit = vi.fn().mockResolvedValue(undefined);
  const mockLoadConfig = vi.fn().mockResolvedValue({});
  const mockRegistryOptions = vi.fn();
  const mockLoadVendorManifest = vi.fn().mockResolvedValue({
    version: 1,
    dependencies: {
      'github.com/company/base': {
        version: 'v1.0.0',
        commit: 'a'.repeat(40),
        integrity: 'sha256-vendor',
        path: 'github.com/company/base',
      },
    },
  });
  const mockResolveVendoredRepository = vi
    .fn()
    .mockResolvedValue('/project/.promptscript/vendor/github.com/company/base');
  return {
    mockSucceed,
    mockFail,
    mockConsoleError,
    mockWarn,
    mockSpinner,
    mockExistsSync,
    mockReadFile,
    mockWriteFile,
    mockMkdir,
    mockMkdtemp,
    mockReaddir,
    mockRename,
    mockRm,
    mockCloneAtTag,
    mockCheckoutCommit,
    mockLoadConfig,
    mockRegistryOptions,
    mockLoadVendorManifest,
    mockResolveVendoredRepository,
  };
});

vi.mock('../../output/console.js', () => ({
  createSpinner: vi.fn(() => mockSpinner),
  ConsoleOutput: {
    success: vi.fn(),
    error: mockConsoleError,
    muted: vi.fn(),
    newline: vi.fn(),
    warn: vi.fn(),
  },
}));

vi.mock('../lock.js', () => ({ LOCKFILE_PATH: 'promptscript.lock' }));

vi.mock('../../config/loader.js', () => ({ loadConfig: mockLoadConfig }));

vi.mock('fs', () => ({ existsSync: mockExistsSync }));

vi.mock('fs/promises', () => ({
  readFile: mockReadFile,
  writeFile: mockWriteFile,
  mkdir: mockMkdir,
  mkdtemp: mockMkdtemp,
  readdir: mockReaddir,
  rename: mockRename,
  rm: mockRm,
}));

vi.mock('@promptscript/resolver', () => ({
  GitRegistry: class {
    constructor(options: unknown) {
      mockRegistryOptions(options);
    }
    cloneAtTag = mockCloneAtTag;
    checkoutCommit = mockCheckoutCommit;
    removeRemote = vi.fn().mockResolvedValue(undefined);
  },
  VENDOR_GIT_DIR: '.promptscript-git',
  VENDOR_MANIFEST_FILE: '.vendor-manifest.json',
  getVendorRepositoryRelativePath: vi.fn((url: string) =>
    url
      .replace(/^https?:\/\//, '')
      .replace(/^git@([^:]+):/, '$1/')
      .replace(/\.git$/, '')
  ),
  hashVendorRepository: vi.fn().mockResolvedValue('sha256-vendor'),
  loadVendorManifest: mockLoadVendorManifest,
  normalizeGitUrl: vi.fn((url: string) => url.replace(/\.git$/, '')),
  resolveVendoredRepository: mockResolveVendoredRepository,
  verifyVendoredGitRepository: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('yaml', () => ({
  parse: (s: string) => JSON.parse(s),
}));

import { vendorSyncCommand, vendorCheckCommand } from '../vendor.js';

const VALID_LOCKFILE = JSON.stringify({
  version: 1,
  dependencies: {
    'github.com/company/base': {
      version: 'v1.0.0',
      commit: 'a'.repeat(40),
      integrity: 'sha256-x',
    },
  },
});

describe('vendorSyncCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.exitCode = undefined;
    mockCloneAtTag.mockResolvedValue(undefined);
    mockCheckoutCommit.mockResolvedValue(undefined);
    mockLoadConfig.mockResolvedValue({});
    mockReaddir.mockResolvedValue([]);
  });

  it('should fail when no lockfile exists', async () => {
    mockExistsSync.mockReturnValue(false);

    await vendorSyncCommand({});

    expect(mockFail).toHaveBeenCalledWith('No lockfile found');
    expect(process.exitCode).toBe(1);
  });

  it('should fail when a dependency cannot be cloned', async () => {
    mockExistsSync.mockReturnValue(true);
    mockReadFile.mockResolvedValue(VALID_LOCKFILE);
    mockCloneAtTag.mockRejectedValue(new Error('clone failed'));

    await vendorSyncCommand({});

    expect(mockFail).toHaveBeenCalledWith('Vendor sync failed');
    expect(mockRename).not.toHaveBeenCalled();
    expect(process.exitCode).toBe(1);
  });

  it('should not clone dependencies in dry-run mode', async () => {
    mockExistsSync.mockReturnValue(true);
    mockReadFile.mockResolvedValue(VALID_LOCKFILE);

    await vendorSyncCommand({ dryRun: true });

    expect(mockCloneAtTag).not.toHaveBeenCalled();
    expect(mockWriteFile).not.toHaveBeenCalled();
    expect(mockSucceed).toHaveBeenCalledWith('Dry run completed (1 dependencies ready)');
  });

  it('rejects vendor paths that collide on case-insensitive filesystems', async () => {
    mockExistsSync.mockReturnValue(true);
    mockReadFile.mockResolvedValue(
      JSON.stringify({
        version: 1,
        dependencies: {
          'https://github.com/company/Base': {
            version: 'v1.0.0',
            commit: 'a'.repeat(40),
            integrity: 'sha256-a',
          },
          'https://github.com/company/base': {
            version: 'v1.0.0',
            commit: 'a'.repeat(40),
            integrity: 'sha256-a',
          },
        },
      })
    );

    await vendorSyncCommand({ dryRun: true });

    expect(mockFail).toHaveBeenCalledWith('Vendor sync failed');
    expect(mockConsoleError).toHaveBeenCalledWith(
      expect.stringContaining('collide at vendor path')
    );
    expect(process.exitCode).toBe(1);
  });

  it('should check out the exact locked commit', async () => {
    mockExistsSync.mockReturnValue(true);
    mockReadFile.mockResolvedValue(VALID_LOCKFILE);

    await vendorSyncCommand({ dryRun: false });

    expect(mockCloneAtTag).toHaveBeenCalledWith(
      'https://github.com/company/base',
      'v1.0.0',
      expect.stringContaining('github.com/company/base'),
      undefined
    );
    expect(mockCheckoutCommit).toHaveBeenCalledWith(
      expect.stringContaining('github.com/company/base'),
      'a'.repeat(40)
    );
  });

  it('should write a manifest and replace the vendor directory', async () => {
    mockExistsSync.mockReturnValue(true);
    mockReadFile.mockResolvedValue(VALID_LOCKFILE);

    await vendorSyncCommand({ dryRun: false });

    expect(mockConsoleError).not.toHaveBeenCalled();
    expect(mockWriteFile).toHaveBeenCalledWith(
      expect.stringContaining('.vendor-manifest.json'),
      expect.stringContaining('"integrity": "sha256-vendor"'),
      'utf-8'
    );
    expect(mockRename).toHaveBeenCalled();
    expect(mockSucceed).toHaveBeenCalledWith('Vendor synced (1 dependencies downloaded)');
  });

  it('recovers an interrupted vendor replacement before syncing', async () => {
    mockExistsSync.mockImplementation((path: string) => path === 'promptscript.lock');
    mockReadFile.mockResolvedValue(VALID_LOCKFILE);
    mockReaddir.mockResolvedValue([
      {
        name: 'vendor.backup-123-456',
        isDirectory: () => true,
      },
    ]);

    await vendorSyncCommand({});

    expect(mockRename).toHaveBeenCalledWith(
      expect.stringContaining('vendor.backup-123-456'),
      expect.stringMatching(/\.promptscript[/\\]vendor$/)
    );
    expect(mockSucceed).toHaveBeenCalledWith('Vendor synced (1 dependencies downloaded)');
  });

  it('downloads skill repositories once and excludes child metadata entries', async () => {
    mockExistsSync.mockReturnValue(true);
    mockReadFile.mockResolvedValue(
      JSON.stringify({
        version: 1,
        dependencies: {
          'https://github.com/company/skills': {
            version: 'v1.0.0',
            commit: 'a'.repeat(40),
            integrity: 'sha256-owner',
            source: 'md',
            skills: ['github.com/company/skills/review'],
            gitUrl: 'git@github.com:company/skills.git',
          },
          'github.com/company/skills/review': {
            version: 'v1.0.0',
            commit: 'a'.repeat(40),
            integrity: 'sha256-child',
            source: 'md',
          },
        },
      })
    );

    await vendorSyncCommand({});

    expect(mockCloneAtTag).toHaveBeenCalledTimes(1);
    expect(mockCloneAtTag).toHaveBeenCalledWith(
      'https://github.com/company/skills',
      'v1.0.0',
      expect.any(String),
      'git@github.com:company/skills.git'
    );
    const manifestCall = mockWriteFile.mock.calls.find(([path]) =>
      String(path).endsWith('.vendor-manifest.json')
    );
    expect(manifestCall?.[1]).not.toContain('github.com/company/skills/review');
  });

  it('uses configured authentication for the default Git registry', async () => {
    mockExistsSync.mockReturnValue(true);
    mockReadFile.mockResolvedValue(VALID_LOCKFILE);
    mockLoadConfig.mockResolvedValue({
      registry: {
        git: {
          url: 'github.com/company/base',
          auth: { type: 'token', tokenEnvVar: 'REGISTRY_TOKEN' },
        },
      },
    });

    await vendorSyncCommand({});

    expect(mockRegistryOptions).toHaveBeenCalledWith({
      url: 'https://github.com/company/base',
      auth: { type: 'token', tokenEnvVar: 'REGISTRY_TOKEN' },
    });
  });

  it('preserves configured primary and fallback transports while syncing', async () => {
    mockExistsSync.mockReturnValue(true);
    mockReadFile.mockResolvedValue(VALID_LOCKFILE);
    mockLoadConfig.mockResolvedValue({
      registries: {
        '@company': {
          url: 'https://github.com/company/base',
          fallbackUrl: 'git@github.com:company/base.git',
        },
      },
    });

    await vendorSyncCommand({});

    expect(mockCloneAtTag).toHaveBeenCalledWith(
      'https://github.com/company/base',
      'v1.0.0',
      expect.any(String),
      'git@github.com:company/base.git'
    );
  });

  it('should handle exception in vendor sync', async () => {
    mockExistsSync.mockReturnValue(true);
    mockReadFile.mockResolvedValue(VALID_LOCKFILE);
    mockCheckoutCommit.mockRejectedValue(new Error('checkout failure'));

    await vendorSyncCommand({});

    expect(mockFail).toHaveBeenCalledWith('Vendor sync failed');
    expect(process.exitCode).toBe(1);
  });
});

describe('vendorCheckCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.exitCode = undefined;
    mockLoadVendorManifest.mockResolvedValue({
      version: 1,
      dependencies: {
        'github.com/company/base': {
          version: 'v1.0.0',
          commit: 'a'.repeat(40),
          integrity: 'sha256-vendor',
          path: 'github.com/company/base',
        },
      },
    });
    mockResolveVendoredRepository.mockResolvedValue(
      '/project/.promptscript/vendor/github.com/company/base'
    );
  });

  it('should fail when no lockfile exists', async () => {
    mockExistsSync.mockReturnValue(false);

    await vendorCheckCommand({});

    expect(mockFail).toHaveBeenCalledWith('No lockfile found');
    expect(process.exitCode).toBe(1);
  });

  it('should fail when vendor directory does not exist', async () => {
    mockExistsSync.mockImplementation((p: string) => {
      if (p === 'promptscript.lock') return true;
      return false;
    });
    mockReadFile.mockResolvedValue(VALID_LOCKFILE);

    await vendorCheckCommand({});

    expect(mockFail).toHaveBeenCalledWith('Vendor directory does not exist');
    expect(process.exitCode).toBe(1);
  });

  it('should fail when vendor entries are missing', async () => {
    mockExistsSync.mockImplementation((p: string) => {
      if (p === 'promptscript.lock') return true;
      if (p.includes('.promptscript/vendor')) return p.endsWith('.promptscript/vendor');
      return false;
    });
    mockReadFile.mockResolvedValue(VALID_LOCKFILE);
    mockLoadVendorManifest.mockResolvedValue({ version: 1, dependencies: {} });

    await vendorCheckCommand({});

    expect(mockFail).toHaveBeenCalledWith(expect.stringContaining('out of sync'));
    expect(process.exitCode).toBe(1);
  });

  it('should succeed when vendor matches lockfile', async () => {
    mockExistsSync.mockReturnValue(true);
    mockReadFile.mockResolvedValue(VALID_LOCKFILE);

    await vendorCheckCommand({});

    expect(mockSucceed).toHaveBeenCalledWith('Vendor directory matches lockfile');
  });

  it('should reject modified vendor contents', async () => {
    mockExistsSync.mockReturnValue(true);
    mockReadFile.mockResolvedValue(VALID_LOCKFILE);
    mockResolveVendoredRepository.mockRejectedValue(
      new Error('Vendored dependency contents do not match the manifest')
    );

    await vendorCheckCommand({});

    expect(mockFail).toHaveBeenCalledWith(expect.stringContaining('out of sync'));
    expect(process.exitCode).toBe(1);
  });

  it('should reject extra manifest entries', async () => {
    mockExistsSync.mockReturnValue(true);
    mockReadFile.mockResolvedValue(VALID_LOCKFILE);
    mockLoadVendorManifest.mockResolvedValue({
      version: 1,
      dependencies: {
        'github.com/company/base': {
          version: 'v1.0.0',
          commit: 'a'.repeat(40),
          integrity: 'sha256-vendor',
          path: 'github.com/company/base',
        },
        'github.com/company/extra': {
          version: 'v1.0.0',
          commit: 'def',
          integrity: 'sha256-extra',
          path: 'github.com/company/extra',
        },
      },
    });

    await vendorCheckCommand({});

    expect(mockFail).toHaveBeenCalledWith(expect.stringContaining('out of sync'));
    expect(process.exitCode).toBe(1);
  });

  it('should accept an empty manifest when the lockfile has no dependencies', async () => {
    const emptyLockfile = JSON.stringify({ version: 1, dependencies: {} });
    mockExistsSync.mockReturnValue(true);
    mockReadFile.mockResolvedValue(emptyLockfile);
    mockLoadVendorManifest.mockResolvedValue({ version: 1, dependencies: {} });

    await vendorCheckCommand({});

    expect(mockSucceed).toHaveBeenCalledWith('Vendor directory matches lockfile');
  });

  it('should handle exception in vendor check', async () => {
    mockExistsSync.mockImplementation((p: string) => {
      if (p === 'promptscript.lock') return true;
      // Throw after lockfile check to trigger outer catch
      throw new Error('unexpected error');
    });
    mockReadFile.mockResolvedValue(VALID_LOCKFILE);

    await vendorCheckCommand({});

    expect(mockFail).toHaveBeenCalledWith('Vendor check failed');
    expect(process.exitCode).toBe(1);
  });
});

describe('vendorSyncCommand — empty dependencies', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.exitCode = undefined;
  });

  it('should replace stale vendor contents with an empty manifest', async () => {
    const emptyLockfile = JSON.stringify({ version: 1, dependencies: {} });
    mockExistsSync.mockReturnValue(true);
    mockReadFile.mockResolvedValue(emptyLockfile);

    await vendorSyncCommand({});

    expect(mockWriteFile).toHaveBeenCalledWith(
      expect.stringContaining('.vendor-manifest.json'),
      expect.stringContaining('"dependencies": {}'),
      'utf-8'
    );
    expect(mockSucceed).toHaveBeenCalledWith('Vendor synced (0 dependencies downloaded)');
  });

  it('should reject invalid lockfile content', async () => {
    mockExistsSync.mockReturnValue(true);
    mockReadFile.mockResolvedValue(JSON.stringify({ invalid: true }));

    await vendorSyncCommand({});

    expect(mockFail).toHaveBeenCalledWith('Vendor sync failed');
    expect(process.exitCode).toBe(1);
  });

  it('should reject lockfile read failures', async () => {
    mockExistsSync.mockReturnValue(true);
    mockReadFile.mockRejectedValue(new Error('read error'));

    await vendorSyncCommand({});

    expect(mockFail).toHaveBeenCalledWith('Vendor sync failed');
    expect(process.exitCode).toBe(1);
  });
});
