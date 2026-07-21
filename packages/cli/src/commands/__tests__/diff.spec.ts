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
  mockIsVerbose,
  mockIsDebug,
  mockConsoleVerbose,
  mockConsoleDebug,
  mockConsoleWarn,
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
  const mockIsVerbose = vi.fn().mockReturnValue(false);
  const mockIsDebug = vi.fn().mockReturnValue(false);
  const mockConsoleVerbose = vi.fn();
  const mockConsoleDebug = vi.fn();
  const mockConsoleWarn = vi.fn();
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
    mockIsVerbose,
    mockIsDebug,
    mockConsoleVerbose,
    mockConsoleDebug,
    mockConsoleWarn,
  };
});

vi.mock('../../output/console.js', () => ({
  createSpinner: vi.fn(() => mockSpinner),
  isVerbose: mockIsVerbose,
  isDebug: mockIsDebug,
  ConsoleOutput: {
    success: vi.fn(),
    error: vi.fn(),
    muted: vi.fn(),
    newline: vi.fn(),
    verbose: mockConsoleVerbose,
    debug: mockConsoleDebug,
    warn: mockConsoleWarn,
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

const { mockPostFormatWithPrettier, mockPostFormatTransform } = vi.hoisted(() => {
  // postFormatWithPrettier mutates outputs in place. The default transform is
  // a no-op so existing tests are unaffected; tests that exercise the
  // post-format parity fix set mockPostFormatTransform.apply to true.
  const mockPostFormatTransform = { apply: false };
  const mockPostFormatWithPrettier = vi.fn(async (outputs: Map<string, { content: string }>) => {
    if (!mockPostFormatTransform.apply) return;
    for (const output of outputs.values()) {
      output.content = `prettier-normalised\n${output.content}`;
    }
  });
  return { mockPostFormatWithPrettier, mockPostFormatTransform };
});

vi.mock('../../prettier/post-format.js', () => ({
  postFormatWithPrettier: mockPostFormatWithPrettier,
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

import { diffCommand, createDiffLogger } from '../diff.js';
import { ConsoleOutput } from '../../output/console.js';

describe('diffCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.exitCode = undefined;
    mockSpinner.text = '';
    mockPostFormatTransform.apply = false;
    mockIsVerbose.mockReturnValue(false);
    mockIsDebug.mockReturnValue(false);
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

  it('should apply Prettier post-format before comparing (issue #307 drift fix)', async () => {
    // Arrange: disk content matches what compile writes AFTER prettier post-format.
    // Without the post-format call, diff would compare raw formatter output
    // (no "prettier-normalised" prefix) against the canonicalised disk file
    // and falsely report a modification.
    const prettierCanonicalised = 'prettier-normalised\nsame content';
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
        ['github', { path: '.github/copilot-instructions.md', content: 'same content' }],
      ]),
    });
    mockReadFile.mockResolvedValue(prettierCanonicalised);
    mockPostFormatTransform.apply = true;

    // Act
    await diffCommand({ noPager: true });

    // Assert: post-format ran, and the canonicalised output matches disk → no drift
    expect(mockPostFormatWithPrettier).toHaveBeenCalledTimes(1);
    expect(mockSucceed).toHaveBeenCalledWith('Diff computed');
    expect(mockPagerWrite).toHaveBeenCalledWith(
      expect.stringContaining('All files are up to date')
    );
  });
});

describe('createDiffLogger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsVerbose.mockReturnValue(false);
    mockIsDebug.mockReturnValue(false);
  });

  it('verbose forwards to ConsoleOutput.verbose when --verbose or --debug is set', () => {
    mockIsVerbose.mockReturnValue(true);
    const logger = createDiffLogger();
    logger.verbose('post-format note');
    expect(mockConsoleVerbose).toHaveBeenCalledWith('post-format note');
  });

  it('verbose forwards when --debug is set even without --verbose', () => {
    mockIsDebug.mockReturnValue(true);
    const logger = createDiffLogger();
    logger.verbose('post-format note');
    expect(mockConsoleVerbose).toHaveBeenCalledWith('post-format note');
  });

  it('verbose is silent when neither --verbose nor --debug is set', () => {
    const logger = createDiffLogger();
    logger.verbose('post-format note');
    expect(mockConsoleVerbose).not.toHaveBeenCalled();
  });

  it('debug forwards to ConsoleOutput.debug only when --debug is set', () => {
    mockIsDebug.mockReturnValue(true);
    const logger = createDiffLogger();
    logger.debug('prettier rejected X');
    expect(mockConsoleDebug).toHaveBeenCalledWith('prettier rejected X');
  });

  it('debug is silent when --debug is not set', () => {
    mockIsVerbose.mockReturnValue(true);
    const logger = createDiffLogger();
    logger.debug('prettier rejected X');
    expect(mockConsoleDebug).not.toHaveBeenCalled();
  });

  it('warn always forwards to ConsoleOutput.warn', () => {
    const logger = createDiffLogger();
    logger.warn('post-format warning');
    expect(mockConsoleWarn).toHaveBeenCalledWith('post-format warning');
  });
});
