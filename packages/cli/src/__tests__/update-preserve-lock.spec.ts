import { describe, it, expect, vi, beforeEach } from 'vitest';
import { parse as parseYaml } from 'yaml';

// Hoisted mocks
const {
  mockExistsSync,
  mockReadFile,
  mockWriteFile,
  mockLoadConfig,
  mockFindConfigFile,
  mockValidateRemoteAccess,
} = vi.hoisted(() => {
  const mockExistsSync = vi.fn();
  const mockReadFile = vi.fn();
  const mockWriteFile = vi.fn();
  const mockLoadConfig = vi.fn();
  const mockFindConfigFile = vi.fn();
  const mockValidateRemoteAccess = vi.fn();
  return {
    mockExistsSync,
    mockReadFile,
    mockWriteFile,
    mockLoadConfig,
    mockFindConfigFile,
    mockValidateRemoteAccess,
  };
});

vi.mock('fs/promises', () => ({
  writeFile: (...args: unknown[]) => mockWriteFile(...args),
  readFile: (...args: unknown[]) => mockReadFile(...args),
}));

vi.mock('fs', () => ({
  existsSync: (...args: unknown[]) => mockExistsSync(...args),
}));

vi.mock('../config/loader.js', () => ({
  loadConfig: (...args: unknown[]) => mockLoadConfig(...args),
  findConfigFile: (...args: unknown[]) => mockFindConfigFile(...args),
}));

vi.mock('@promptscript/resolver', () => ({
  validateRemoteAccess: (...args: unknown[]) => mockValidateRemoteAccess(...args),
}));

vi.mock('ora', () => ({
  default: vi.fn().mockReturnValue({
    start: vi.fn().mockReturnThis(),
    succeed: vi.fn().mockReturnThis(),
    fail: vi.fn().mockReturnThis(),
    stop: vi.fn().mockReturnThis(),
    warn: vi.fn().mockReturnThis(),
    text: '',
  }),
}));

vi.mock('../output/console.js', () => ({
  ConsoleOutput: {
    error: vi.fn(),
    muted: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    newline: vi.fn(),
  },
  createSpinner: vi.fn((text: string) => ({
    start: vi.fn().mockReturnThis(),
    succeed: vi.fn().mockReturnThis(),
    fail: vi.fn().mockReturnThis(),
    stop: vi.fn().mockReturnThis(),
    warn: vi.fn().mockReturnThis(),
    text,
  })),
}));

vi.mock('@promptscript/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@promptscript/core')>();
  return {
    ...actual,
    isValidLockfile: (data: unknown) => {
      if (
        typeof data === 'object' &&
        data !== null &&
        'version' in data &&
        'dependencies' in data
      ) {
        return true;
      }
      return false;
    },
  };
});

describe('update command - Issue 4: preserve lock info', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockFindConfigFile.mockReturnValue('/test/promptscript.yaml');
    mockLoadConfig.mockResolvedValue({
      registries: {
        '@company': 'https://github.com/company/registry.git',
      },
    });
    mockExistsSync.mockReturnValue(false);
    mockValidateRemoteAccess.mockResolvedValue({
      accessible: false,
      error: 'Network error',
    });
  });

  it('should preserve existing commit and integrity when remote is not accessible', async () => {
    // Existing lockfile with real commit and integrity (YAML format)
    const existingLock = `version: 1
dependencies:
  https://github.com/company/registry.git:
    version: v1.2.3
    commit: abc123def456789012345678901234567890abcd
    integrity: sha256-realhashvalue
`;

    mockExistsSync.mockReturnValue(true); // lockfile exists
    mockReadFile.mockResolvedValue(existingLock);
    mockValidateRemoteAccess.mockResolvedValue({
      accessible: false,
      error: 'Network error',
    });

    const { updateCommand } = await import('../commands/update.js');

    await updateCommand(undefined, { dryRun: false });

    // Check what was written
    expect(mockWriteFile).toHaveBeenCalled();
    const writtenContent = mockWriteFile.mock.calls[0]![1] as string;
    const written = parseYaml(writtenContent) as {
      dependencies: Record<string, { version: string; commit: string; integrity: string }>;
    };

    const dep = written.dependencies['https://github.com/company/registry.git'];
    expect(dep).toBeDefined();
    // Version should be updated to 'latest'
    expect(dep!.version).toBe('latest');
    // Commit and integrity should be preserved from existing lock
    expect(dep!.commit).toBe('abc123def456789012345678901234567890abcd');
    expect(dep!.integrity).toBe('sha256-realhashvalue');
  });

  it('should use real head commit from validateRemoteAccess when accessible', async () => {
    const existingLock = `version: 1
dependencies:
  https://github.com/company/registry.git:
    version: v1.0.0
    commit: oldcommit123456789012345678901234567890abcd
    integrity: sha256-oldhash
`;

    mockExistsSync.mockReturnValue(true);
    mockReadFile.mockResolvedValue(existingLock);
    mockValidateRemoteAccess.mockResolvedValue({
      accessible: true,
      headCommit: 'newheadcommit00000000000000000000000000000ff',
    });

    const { updateCommand } = await import('../commands/update.js');

    await updateCommand(undefined, { dryRun: false });

    const writtenContent = mockWriteFile.mock.calls[0]![1] as string;
    const written = parseYaml(writtenContent) as {
      dependencies: Record<string, { version: string; commit: string; integrity: string }>;
    };

    const dep = written.dependencies['https://github.com/company/registry.git'];
    expect(dep!.version).toBe('latest');
    expect(dep!.commit).toBe('newheadcommit00000000000000000000000000000ff');
    // Integrity should still be preserved (can't recompute without cloning)
    expect(dep!.integrity).toBe('sha256-oldhash');
  });

  it('should NOT write placeholder all-zeros commit when existing lock has real commit', async () => {
    const existingLock = `version: 1
dependencies:
  https://github.com/company/registry.git:
    version: v1.2.3
    commit: realcommit456789012345678901234567890abcd
    integrity: sha256-realintegrity
`;

    mockExistsSync.mockReturnValue(true);
    mockReadFile.mockResolvedValue(existingLock);
    mockValidateRemoteAccess.mockResolvedValue({
      accessible: false,
      error: 'No network',
    });

    const { updateCommand } = await import('../commands/update.js');

    await updateCommand(undefined, { dryRun: false });

    const writtenContent = mockWriteFile.mock.calls[0]![1] as string;
    const written = parseYaml(writtenContent) as {
      dependencies: Record<string, { version: string; commit: string; integrity: string }>;
    };

    const dep = written.dependencies['https://github.com/company/registry.git'];
    // Must NOT be the all-zeros placeholder
    expect(dep!.commit).not.toBe('0000000000000000000000000000000000000000');
    expect(dep!.integrity).not.toBe('sha256-pending');
  });
});
