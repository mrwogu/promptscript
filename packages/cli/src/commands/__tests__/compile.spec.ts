import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Logger } from '@promptscript/core';
import type { CliServices } from '../../services.js';

/**
 * Capture the Logger passed to Compiler so tests can invoke its methods.
 * This exercises the createCliLogger() function inside compile.ts, which is
 * private but whose warn path (lines 100-101) must be covered.
 */
let capturedLogger: Logger | undefined;

const {
  mockCompile,
  mockLoadConfig,
  mockExistsSync,
  mockWriteFile,
  mockMkdir,
  mockReadFile,
  mockWarn,
} = vi.hoisted(() => {
  const mockCompile = vi.fn();
  const mockLoadConfig = vi.fn();
  const mockExistsSync = vi.fn();
  const mockWriteFile = vi.fn();
  const mockMkdir = vi.fn();
  const mockReadFile = vi.fn();
  const mockWarn = vi.fn();
  return {
    mockCompile,
    mockLoadConfig,
    mockExistsSync,
    mockWriteFile,
    mockMkdir,
    mockReadFile,
    mockWarn,
  };
});

vi.mock('@promptscript/compiler', () => ({
  Compiler: class {
    constructor(opts: { logger?: Logger }) {
      capturedLogger = opts.logger;
    }
    compile = mockCompile;
  },
}));

vi.mock('../../config/loader.js', () => ({
  loadConfig: () => mockLoadConfig(),
  CONFIG_FILES: ['promptscript.yaml'],
}));

vi.mock('fs/promises', () => ({
  writeFile: (...args: unknown[]) => mockWriteFile(...args),
  mkdir: (...args: unknown[]) => mockMkdir(...args),
  readFile: (...args: unknown[]) => mockReadFile(...args),
  readdir: vi.fn().mockResolvedValue([]),
}));

vi.mock('../../prettier/loader.js', () => ({
  resolvePrettierOptions: vi.fn().mockResolvedValue({}),
}));

vi.mock('ora', () => ({
  default: vi.fn().mockReturnValue({
    start: vi.fn().mockReturnThis(),
    succeed: vi.fn().mockReturnThis(),
    fail: vi.fn().mockReturnThis(),
    stop: vi.fn().mockReturnThis(),
    text: '',
  }),
}));

vi.mock('../../output/console.js', () => ({
  createSpinner: vi.fn().mockReturnValue({
    start: vi.fn().mockReturnThis(),
    succeed: vi.fn().mockReturnThis(),
    fail: vi.fn().mockReturnThis(),
    stop: vi.fn().mockReturnThis(),
    text: '',
  }),
  ConsoleOutput: {
    success: vi.fn(),
    error: vi.fn(),
    muted: vi.fn(),
    newline: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
    verbose: vi.fn(),
    debug: vi.fn(),
    dryRun: vi.fn(),
    warn: mockWarn,
  },
  isVerbose: vi.fn().mockReturnValue(false),
  isDebug: vi.fn().mockReturnValue(false),
}));

vi.mock('chalk', () => ({
  default: {
    green: (s: string) => s,
    red: (s: string) => s,
    yellow: (s: string) => s,
    blue: (s: string) => s,
    gray: (s: string) => s,
  },
}));

vi.mock('fs', () => ({
  existsSync: (...args: unknown[]) => mockExistsSync(...args),
  readFileSync: vi.fn().mockReturnValue(''),
}));

vi.mock('../../output/pager.js', () => ({
  isTTY: vi.fn().mockReturnValue(false),
}));

vi.mock('chokidar', () => ({
  default: { watch: vi.fn().mockReturnValue({ on: vi.fn().mockReturnThis() }) },
}));

vi.mock('../../utils/registry-resolver.js', () => ({
  resolveRegistryPath: vi.fn().mockResolvedValue({ path: '/mock/registry', isRemote: false }),
}));

import { compileCommand } from '../compile.js';

describe('compile command - createCliLogger warn path', () => {
  let mockServices: CliServices;

  beforeEach(() => {
    vi.clearAllMocks();
    capturedLogger = undefined;
    process.exitCode = undefined;

    mockLoadConfig.mockResolvedValue({
      targets: ['claude'],
      registry: { path: './registry' },
    });

    mockExistsSync.mockImplementation((path: string) => {
      // Entry file exists; skill candidates do not
      return String(path).includes('project.prs');
    });

    mockWriteFile.mockResolvedValue(undefined);
    mockMkdir.mockResolvedValue(undefined);
    mockReadFile.mockRejectedValue(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));

    mockCompile.mockResolvedValue({
      success: true,
      outputs: new Map(),
      stats: { totalTime: 10, resolveTime: 5, validateTime: 3, formatTime: 2 },
      warnings: [],
      errors: [],
    });

    mockServices = {
      fs: {
        existsSync: vi.fn().mockReturnValue(false),
        writeFile: vi.fn().mockResolvedValue(undefined),
        mkdir: vi.fn().mockResolvedValue(undefined),
        readFile: vi.fn().mockRejectedValue(new Error('ENOENT')),
        readdir: vi.fn().mockResolvedValue([]),
        readFileSync: vi.fn().mockReturnValue(''),
      } as unknown as CliServices['fs'],
      prompts: {
        input: vi.fn(),
        confirm: vi.fn(),
        checkbox: vi.fn(),
        select: vi.fn(),
      } as unknown as CliServices['prompts'],
      cwd: '/mock/project',
    };
  });

  it('should route logger.warn() through ConsoleOutput.warn', async () => {
    // Arrange: run compileCommand to capture the logger created internally
    await compileCommand({}, mockServices);

    // The Compiler constructor captured the logger; invoke its warn method
    expect(capturedLogger).toBeDefined();
    capturedLogger!.warn('test warning message');

    // Assert: ConsoleOutput.warn was called with the message
    expect(mockWarn).toHaveBeenCalledWith('test warning message');
  });
});
