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

vi.mock('../lock.js', () => ({ LOCKFILE_PATH: 'promptscript.lock' }));

vi.mock('fs', () => ({ existsSync: mockExistsSync }));

vi.mock('fs/promises', () => ({
  writeFile: mockWriteFile,
  readFile: mockReadFile,
}));

vi.mock('yaml', () => ({
  parse: (s: string) => JSON.parse(s),
  stringify: (o: unknown) => JSON.stringify(o),
}));

import { updateCommand } from '../update.js';

describe('updateCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.exitCode = undefined;
  });

  it('should fail when no project config found', async () => {
    mockFindConfigFile.mockReturnValue(null);

    await updateCommand(undefined, {});

    expect(mockFail).toHaveBeenCalledWith('No project config found');
    expect(process.exitCode).toBe(1);
  });

  it('should warn when no registries configured', async () => {
    mockFindConfigFile.mockReturnValue('promptscript.yaml');
    mockLoadConfig.mockResolvedValue({ targets: [] });

    await updateCommand(undefined, {});

    expect(mockWarn).toHaveBeenCalledWith('No registry aliases configured');
  });

  it('should update all dependencies when no package arg given', async () => {
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
          'github.com/company/base': { version: 'v1.0.0', commit: 'abc', integrity: 'sha256-x' },
        },
      })
    );

    await updateCommand(undefined, {});

    expect(mockWriteFile).toHaveBeenCalled();
    expect(mockSucceed).toHaveBeenCalledWith('Lockfile updated');
  });

  it('should fail when package arg matches nothing', async () => {
    mockFindConfigFile.mockReturnValue('promptscript.yaml');
    mockLoadConfig.mockResolvedValue({
      targets: [],
      registries: { '@company': 'github.com/company/base' },
    });
    mockExistsSync.mockReturnValue(false);

    await updateCommand('nonexistent', {});

    expect(mockFail).toHaveBeenCalledWith(expect.stringContaining('nonexistent'));
    expect(process.exitCode).toBe(1);
  });

  it('should not write in dry-run mode', async () => {
    mockFindConfigFile.mockReturnValue('promptscript.yaml');
    mockLoadConfig.mockResolvedValue({
      targets: [],
      registries: { '@company': 'github.com/company/base' },
    });
    mockExistsSync.mockReturnValue(false);

    await updateCommand(undefined, { dryRun: true });

    expect(mockWriteFile).not.toHaveBeenCalled();
    expect(mockSucceed).toHaveBeenCalledWith('Dry run — lockfile not written');
  });

  it('should handle exception when loadConfig throws', async () => {
    mockFindConfigFile.mockReturnValue('promptscript.yaml');
    mockLoadConfig.mockRejectedValue(new Error('config read error'));

    await updateCommand(undefined, {});

    expect(mockFail).toHaveBeenCalledWith('Failed to update lockfile');
    expect(process.exitCode).toBe(1);
  });

  it('should fail when packageArg does not match any registry', async () => {
    mockFindConfigFile.mockReturnValue('promptscript.yaml');
    mockLoadConfig.mockResolvedValue({
      targets: [],
      registries: {
        '@alpha': 'github.com/alpha/repo',
        '@beta': 'github.com/beta/repo',
      },
    });
    mockExistsSync.mockReturnValue(false);

    await updateCommand('nonexistent-pkg', {});

    expect(mockFail).toHaveBeenCalledWith(expect.stringContaining('nonexistent-pkg'));
    expect(process.exitCode).toBe(1);
  });
});
