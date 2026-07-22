import { describe, it, expect, vi, beforeEach } from 'vitest';

const {
  mockSucceed,
  mockFail,
  mockWarn,
  mockSpinner,
  mockLoadConfig,
  mockExists,
  mockFetch,
  mockRegistry,
  mockExistsSync,
  mockMkdir,
  mockWriteFile,
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
  const mockExists = vi.fn();
  const mockFetch = vi.fn();
  const mockRegistry = { exists: mockExists, fetch: mockFetch };
  const mockExistsSync = vi.fn();
  const mockMkdir = vi.fn().mockResolvedValue(undefined);
  const mockWriteFile = vi.fn().mockResolvedValue(undefined);
  return {
    mockStart,
    mockSucceed,
    mockFail,
    mockWarn,
    mockSpinner,
    mockLoadConfig,
    mockExists,
    mockFetch,
    mockRegistry,
    mockExistsSync,
    mockMkdir,
    mockWriteFile,
  };
});

vi.mock('../../output/console.js', () => ({
  createSpinner: vi.fn(() => mockSpinner),
  ConsoleOutput: {
    success: vi.fn(),
    error: vi.fn(),
    muted: vi.fn(),
    newline: vi.fn(),
    dryRun: vi.fn(),
  },
}));

vi.mock('../../config/loader.js', () => ({
  loadConfig: mockLoadConfig,
}));

vi.mock('@promptscript/resolver', () => ({
  createFileSystemRegistry: vi.fn(() => mockRegistry),
  createHttpRegistry: vi.fn(() => mockRegistry),
  createGitRegistry: vi.fn(() => mockRegistry),
  GitCloneError: class GitCloneError extends Error {},
  GitAuthError: class GitAuthError extends Error {},
  GitRefNotFoundError: class GitRefNotFoundError extends Error {},
}));

vi.mock('fs', () => ({
  existsSync: mockExistsSync,
}));

vi.mock('fs/promises', () => ({
  mkdir: mockMkdir,
  writeFile: mockWriteFile,
}));

import { pullCommand } from '../pull.js';
import { ConsoleOutput } from '../../output/console.js';
import { createGitRegistry } from '@promptscript/resolver';

describe('pullCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.exitCode = undefined;
    mockSpinner.text = '';
  });

  it('should warn when no inherit is configured', async () => {
    mockLoadConfig.mockResolvedValue({ targets: [] });

    await pullCommand({ dryRun: false });

    expect(mockWarn).toHaveBeenCalledWith('No inheritance configured');
    expect(ConsoleOutput.muted).toHaveBeenCalledWith(
      'Add "inherit" to your config to pull from registry'
    );
  });

  it('should pull file from registry successfully', async () => {
    mockLoadConfig.mockResolvedValue({
      inherit: '@team/base',
      registry: { path: './registry' },
      targets: [],
    });
    mockExistsSync.mockImplementation((path: string) => {
      if (path === './registry') return true;
      return false;
    });
    mockExists.mockResolvedValue(true);
    mockFetch.mockResolvedValue('# Base config content');

    await pullCommand({});

    expect(mockExists).toHaveBeenCalledWith('team/base.prs');
    expect(mockFetch).toHaveBeenCalledWith('team/base.prs');
    expect(mockMkdir).toHaveBeenCalled();
    expect(mockWriteFile).toHaveBeenCalledWith(
      expect.stringContaining('team/base.prs'),
      '# Base config content',
      'utf-8'
    );
    expect(mockSucceed).toHaveBeenCalledWith('Pulled from registry');
  });

  it('should show dry-run output without writing files', async () => {
    mockLoadConfig.mockResolvedValue({
      inherit: '@team/base',
      registry: { path: './registry' },
      targets: [],
    });
    mockExistsSync.mockImplementation((path: string) => {
      if (path === './registry') return true;
      return false;
    });
    mockExists.mockResolvedValue(true);
    mockFetch.mockResolvedValue('content');

    await pullCommand({ dryRun: true });

    expect(mockSucceed).toHaveBeenCalledWith('Dry run completed');
    expect(ConsoleOutput.dryRun).toHaveBeenCalledWith(expect.stringContaining('Would fetch'));
    expect(mockExists).not.toHaveBeenCalled();
    expect(mockFetch).not.toHaveBeenCalled();
    expect(mockWriteFile).not.toHaveBeenCalled();
  });

  it('should reject inheritance paths that contain traversal segments', async () => {
    mockLoadConfig.mockResolvedValue({
      inherit: '@team/../../outside',
      registry: { path: './registry' },
      targets: [],
    });
    mockExistsSync.mockReturnValue(true);

    await pullCommand({});

    expect(mockFail).toHaveBeenCalledWith('Error');
    expect(mockFetch).not.toHaveBeenCalled();
    expect(mockWriteFile).not.toHaveBeenCalled();
    expect(process.exitCode).toBe(1);
  });

  it('should reject multiple Git ref options', async () => {
    await pullCommand({ branch: 'main', tag: 'v1.0.0' });

    expect(mockFail).toHaveBeenCalledWith('Git ref options are mutually exclusive');
    expect(mockLoadConfig).not.toHaveBeenCalled();
    expect(process.exitCode).toBe(1);
  });

  it('should use the inherit version as the Git ref', async () => {
    mockLoadConfig.mockResolvedValue({
      inherit: '@team/base@v2.0.0',
      registry: { git: { url: 'https://github.com/team/registry.git', ref: 'main' } },
      targets: [],
    });

    await pullCommand({ dryRun: true });

    expect(createGitRegistry).toHaveBeenCalledWith(expect.objectContaining({ ref: 'v2.0.0' }));
  });

  it('should fail when inheritance source is not found in registry', async () => {
    mockLoadConfig.mockResolvedValue({
      inherit: '@team/missing',
      registry: { path: './registry' },
      targets: [],
    });
    mockExistsSync.mockReturnValue(true);
    mockExists.mockResolvedValue(false);

    await pullCommand({});

    expect(mockFail).toHaveBeenCalledWith('Inheritance source not found');
    expect(ConsoleOutput.error).toHaveBeenCalledWith('Not found in registry: @team/missing');
    expect(process.exitCode).toBe(1);
  });

  it('should warn when file already exists without --force', async () => {
    mockLoadConfig.mockResolvedValue({
      inherit: '@team/base',
      registry: { path: './registry' },
      targets: [],
    });
    mockExistsSync.mockReturnValue(true);
    mockExists.mockResolvedValue(true);
    mockFetch.mockResolvedValue('content');

    await pullCommand({});

    expect(mockWarn).toHaveBeenCalledWith('File already exists (use --force to overwrite)');
    expect(mockWriteFile).not.toHaveBeenCalled();
  });

  it('should overwrite existing file with --force', async () => {
    mockLoadConfig.mockResolvedValue({
      inherit: '@team/base',
      registry: { path: './registry' },
      targets: [],
    });
    mockExistsSync.mockReturnValue(true);
    mockExists.mockResolvedValue(true);
    mockFetch.mockResolvedValue('updated content');

    await pullCommand({ force: true });

    expect(mockWriteFile).toHaveBeenCalledWith(
      expect.stringContaining('team/base.prs'),
      'updated content',
      'utf-8'
    );
    expect(mockSucceed).toHaveBeenCalledWith('Pulled from registry');
  });

  it('should set exitCode on error', async () => {
    mockLoadConfig.mockRejectedValue(new Error('Config not found'));

    await pullCommand({});

    expect(mockFail).toHaveBeenCalledWith('Error');
    expect(process.exitCode).toBe(1);
  });
});
