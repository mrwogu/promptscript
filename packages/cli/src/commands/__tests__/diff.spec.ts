import { describe, it, expect, vi, beforeEach } from 'vitest';

const {
  mockSucceed,
  mockFail,
  mockSpinner,
  mockLoadConfig,
  mockResolveRegistryPath,
  mockCompile,
  mockExistsSync,
  mockReadFile,
  mockPagerWrite,
  mockPagerFlush,
} = vi.hoisted(() => {
  const mockStart = vi.fn().mockReturnThis();
  const mockSucceed = vi.fn().mockReturnThis();
  const mockFail = vi.fn().mockReturnThis();
  const mockStop = vi.fn().mockReturnThis();
  const mockSpinner = {
    start: mockStart,
    succeed: mockSucceed,
    fail: mockFail,
    stop: mockStop,
    text: '',
  };
  const mockLoadConfig = vi.fn();
  const mockResolveRegistryPath = vi.fn();
  const mockCompile = vi.fn();
  const mockExistsSync = vi.fn();
  const mockReadFile = vi.fn();
  const mockPagerWrite = vi.fn();
  const mockPagerFlush = vi.fn().mockResolvedValue(undefined);
  return {
    mockSucceed,
    mockFail,
    mockSpinner,
    mockLoadConfig,
    mockResolveRegistryPath,
    mockCompile,
    mockExistsSync,
    mockReadFile,
    mockPagerWrite,
    mockPagerFlush,
  };
});

vi.mock('../../output/console.js', () => ({
  createSpinner: vi.fn(() => mockSpinner),
  ConsoleOutput: {
    success: vi.fn(),
    error: vi.fn(),
    muted: vi.fn(),
    newline: vi.fn(),
  },
}));

vi.mock('../../config/loader.js', () => ({
  loadConfig: mockLoadConfig,
}));

vi.mock('../../utils/registry-resolver.js', () => ({
  resolveRegistryPath: mockResolveRegistryPath,
}));

vi.mock('@promptscript/compiler', () => ({
  Compiler: vi.fn().mockImplementation(function () {
    return { compile: mockCompile };
  }),
}));

vi.mock('fs', () => ({
  existsSync: mockExistsSync,
}));

vi.mock('fs/promises', () => ({
  readFile: mockReadFile,
}));

vi.mock('../../output/pager.js', () => ({
  createPager: vi.fn(() => ({
    write: mockPagerWrite,
    flush: mockPagerFlush,
  })),
}));

vi.mock('chalk', () => {
  const identity = (s: string): string => s;
  return {
    default: Object.assign(identity, {
      level: 3,
      green: identity,
      red: identity,
      yellow: identity,
      gray: identity,
      bold: identity,
    }),
  };
});

import { diffCommand } from '../diff.js';
import { ConsoleOutput } from '../../output/console.js';

describe('diffCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.exitCode = undefined;
    mockSpinner.text = '';
  });

  it('should detect changes between compiled output and existing files', async () => {
    // Arrange
    mockLoadConfig.mockResolvedValue({
      targets: ['github'],
      validation: {},
    });
    mockResolveRegistryPath.mockResolvedValue({
      path: './registry',
      isRemote: false,
      source: 'local',
    });
    mockExistsSync.mockReturnValue(true);
    mockCompile.mockResolvedValue({
      success: true,
      errors: [],
      warnings: [],
      outputs: new Map([
        ['github', { path: '.github/copilot-instructions.md', content: 'new content' }],
      ]),
    });
    mockReadFile.mockResolvedValue('old content');

    // Act
    await diffCommand({ noPager: true });

    // Assert
    expect(mockSucceed).toHaveBeenCalledWith('Diff computed');
    expect(mockPagerWrite).toHaveBeenCalledWith(
      expect.stringContaining('.github/copilot-instructions.md')
    );
    expect(mockPagerFlush).toHaveBeenCalled();
  });

  it('should report no changes when files are up to date', async () => {
    // Arrange
    const content = 'same content';
    mockLoadConfig.mockResolvedValue({
      targets: ['github'],
      validation: {},
    });
    mockResolveRegistryPath.mockResolvedValue({
      path: './registry',
      isRemote: false,
      source: 'local',
    });
    mockExistsSync.mockReturnValue(true);
    mockCompile.mockResolvedValue({
      success: true,
      errors: [],
      warnings: [],
      outputs: new Map([['github', { path: '.github/copilot-instructions.md', content }]]),
    });
    mockReadFile.mockResolvedValue(content);

    // Act
    await diffCommand({ noPager: true });

    // Assert
    expect(mockSucceed).toHaveBeenCalledWith('Diff computed');
    expect(mockPagerWrite).toHaveBeenCalledWith(
      expect.stringContaining('All files are up to date')
    );
  });

  it('should fail when entry file is not found', async () => {
    // Arrange
    mockLoadConfig.mockResolvedValue({
      targets: ['github'],
      validation: {},
    });
    mockResolveRegistryPath.mockResolvedValue({
      path: './registry',
      isRemote: false,
      source: 'local',
    });
    mockExistsSync.mockReturnValue(false);

    // Act
    await diffCommand({ noPager: true });

    // Assert
    expect(mockFail).toHaveBeenCalledWith('Entry file not found');
    expect(ConsoleOutput.error).toHaveBeenCalledWith(expect.stringContaining('File not found'));
    expect(process.exitCode).toBe(1);
  });

  it('should set exitCode when compilation fails', async () => {
    // Arrange
    mockLoadConfig.mockResolvedValue({
      targets: ['github'],
      validation: {},
    });
    mockResolveRegistryPath.mockResolvedValue({
      path: './registry',
      isRemote: false,
      source: 'local',
    });
    mockExistsSync.mockReturnValue(true);
    mockCompile.mockResolvedValue({
      success: false,
      errors: [{ message: 'Parse error in project.prs' }],
      warnings: [],
      outputs: new Map(),
    });

    // Act
    await diffCommand({ noPager: true });

    // Assert
    expect(mockFail).toHaveBeenCalledWith('Compilation failed');
    expect(ConsoleOutput.error).toHaveBeenCalledWith('Parse error in project.prs');
    expect(process.exitCode).toBe(1);
  });

  it('should set exitCode on unexpected error', async () => {
    // Arrange
    mockLoadConfig.mockRejectedValue(new Error('Config load failure'));

    // Act
    await diffCommand({ noPager: true });

    // Assert
    expect(mockFail).toHaveBeenCalledWith('Error');
    expect(ConsoleOutput.error).toHaveBeenCalledWith('Config load failure');
    expect(process.exitCode).toBe(1);
  });
});
