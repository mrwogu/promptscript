import { describe, it, expect, vi, beforeEach } from 'vitest';

const {
  mockSucceed,
  mockFail,
  mockSpinner,
  mockExistsSync,
  mockReadFile,
  mockWriteFile,
  mockMkdir,
  mockReaddir,
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
  const mockExistsSync = vi.fn();
  const mockReadFile = vi.fn();
  const mockWriteFile = vi.fn().mockResolvedValue(undefined);
  const mockMkdir = vi.fn().mockResolvedValue(undefined);
  const mockReaddir = vi.fn().mockResolvedValue([]);
  return {
    mockSucceed,
    mockFail,
    mockWarn,
    mockSpinner,
    mockExistsSync,
    mockReadFile,
    mockWriteFile,
    mockMkdir,
    mockReaddir,
  };
});

vi.mock('../../output/console.js', () => ({
  createSpinner: vi.fn(() => mockSpinner),
  ConsoleOutput: {
    success: vi.fn(),
    error: vi.fn(),
    muted: vi.fn(),
    newline: vi.fn(),
    warn: vi.fn(),
  },
}));

vi.mock('../lock.js', () => ({ LOCKFILE_PATH: 'promptscript.lock' }));

vi.mock('fs', () => ({ existsSync: mockExistsSync }));

vi.mock('fs/promises', () => ({
  readFile: mockReadFile,
  writeFile: mockWriteFile,
  mkdir: mockMkdir,
  readdir: mockReaddir,
}));

vi.mock('yaml', () => ({
  parse: (s: string) => JSON.parse(s),
}));

import { vendorSyncCommand, vendorCheckCommand } from '../vendor.js';

const VALID_LOCKFILE = JSON.stringify({
  version: 1,
  dependencies: {
    'github.com/company/base': { version: 'v1.0.0', commit: 'abc', integrity: 'sha256-x' },
  },
});

describe('vendorSyncCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.exitCode = undefined;
  });

  it('should fail when no lockfile exists', async () => {
    mockExistsSync.mockReturnValue(false);

    await vendorSyncCommand({});

    expect(mockFail).toHaveBeenCalledWith('No lockfile found');
    expect(process.exitCode).toBe(1);
  });

  it('should warn when cache is missing for dependency', async () => {
    mockExistsSync.mockImplementation((p: string) => {
      if (p === 'promptscript.lock') return true;
      return false; // cache dir missing
    });
    mockReadFile.mockResolvedValue(VALID_LOCKFILE);

    await vendorSyncCommand({});

    expect(mockSucceed).toHaveBeenCalled();
  });

  it('should not copy files in dry-run mode', async () => {
    mockExistsSync.mockImplementation((p: string) => {
      if (p === 'promptscript.lock') return true;
      return true; // cache exists
    });
    mockReadFile.mockResolvedValue(VALID_LOCKFILE);
    mockReaddir.mockResolvedValue([]);

    await vendorSyncCommand({ dryRun: true });

    expect(mockWriteFile).not.toHaveBeenCalled();
    expect(mockSucceed).toHaveBeenCalledWith('Dry run — vendor directory not modified');
  });

  it('should report missing status when cache directory is absent', async () => {
    mockExistsSync.mockImplementation((p: string) => {
      if (p === 'promptscript.lock') return true;
      return false; // cache dir missing
    });
    mockReadFile.mockResolvedValue(VALID_LOCKFILE);

    await vendorSyncCommand({ dryRun: false });

    expect(mockSucceed).toHaveBeenCalledWith(expect.stringContaining('0 copied, 1 missing'));
  });

  it('should copy files when dryRun is false and cache exists', async () => {
    mockExistsSync.mockImplementation((p: string) => {
      if (p === 'promptscript.lock') return true;
      return true; // cache exists
    });
    mockReadFile.mockResolvedValue(VALID_LOCKFILE);
    mockReaddir.mockResolvedValue([
      { name: 'file.prs', isDirectory: () => false },
      { name: 'subdir', isDirectory: () => true },
    ]);
    // Second readdir call for the subdirectory returns empty
    mockReaddir
      .mockResolvedValueOnce([
        { name: 'file.prs', isDirectory: () => false },
        { name: 'subdir', isDirectory: () => true },
      ])
      .mockResolvedValueOnce([]);
    mockReadFile
      .mockResolvedValueOnce(VALID_LOCKFILE)
      .mockResolvedValueOnce(Buffer.from('content'));

    await vendorSyncCommand({ dryRun: false });

    expect(mockMkdir).toHaveBeenCalled();
    expect(mockSucceed).toHaveBeenCalledWith(expect.stringContaining('1 copied'));
  });

  it('should handle exception in vendor sync', async () => {
    mockExistsSync.mockImplementation((p: string) => {
      if (p === 'promptscript.lock') return true;
      // Throw on cache dir check to trigger outer catch
      throw new Error('disk failure');
    });
    mockReadFile.mockResolvedValue(VALID_LOCKFILE);

    await vendorSyncCommand({});

    expect(mockFail).toHaveBeenCalledWith('Vendor sync failed');
    expect(process.exitCode).toBe(1);
  });
});

describe('vendorCheckCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.exitCode = undefined;
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
      if (p.includes('.promptscript/vendor')) return p === '.promptscript/vendor';
      return false;
    });
    mockReadFile.mockResolvedValue(VALID_LOCKFILE);

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

  it('should warn when lockfile has no dependencies', async () => {
    const emptyLockfile = JSON.stringify({ version: 1, dependencies: {} });
    mockExistsSync.mockReturnValue(true);
    mockReadFile.mockResolvedValue(emptyLockfile);

    await vendorCheckCommand({});

    expect(mockSpinner.warn).toHaveBeenCalledWith('No dependencies in lockfile');
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

  it('should warn when lockfile has no dependencies', async () => {
    const emptyLockfile = JSON.stringify({ version: 1, dependencies: {} });
    mockExistsSync.mockReturnValue(true);
    mockReadFile.mockResolvedValue(emptyLockfile);

    await vendorSyncCommand({});

    expect(mockSpinner.warn).toHaveBeenCalledWith('No dependencies in lockfile');
  });

  it('should return null for invalid lockfile content', async () => {
    mockExistsSync.mockReturnValue(true);
    mockReadFile.mockResolvedValue(JSON.stringify({ invalid: true }));

    await vendorSyncCommand({});

    // isValidLockfile returns false → loadLockfile returns null → "No lockfile found"
    expect(mockFail).toHaveBeenCalledWith('No lockfile found');
  });

  it('should return null when lockfile read throws', async () => {
    mockExistsSync.mockReturnValue(true);
    mockReadFile.mockRejectedValue(new Error('read error'));

    await vendorSyncCommand({});

    expect(mockFail).toHaveBeenCalledWith('No lockfile found');
  });
});
