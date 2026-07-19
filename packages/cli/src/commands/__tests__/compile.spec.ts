import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Logger } from '@promptscript/core';
import type { CliServices } from '../../services.js';

/**
 * Capture the Logger passed to Compiler so tests can invoke its methods.
 * This exercises the createCliLogger() function inside compile.ts, which is
 * private but whose warn path (lines 100-101) must be covered.
 */
let capturedLogger: Logger | undefined;
let capturedCompilerOptions: Record<string, unknown> | undefined;

const {
  mockCompile,
  mockLoadConfig,
  mockExistsSync,
  mockWriteFile,
  mockChmod,
  mockMkdir,
  mockReadFile,
  mockWarn,
  mockWarning,
  mockError,
  mockMuted,
  mockDryRun,
  mockCleanupManagedOutputs,
  mockSpinner,
  mockSpinnerStart,
} = vi.hoisted(() => {
  const mockCompile = vi.fn();
  const mockLoadConfig = vi.fn();
  const mockExistsSync = vi.fn();
  const mockWriteFile = vi.fn();
  const mockChmod = vi.fn();
  const mockMkdir = vi.fn();
  const mockReadFile = vi.fn();
  const mockWarn = vi.fn();
  const mockWarning = vi.fn();
  const mockError = vi.fn();
  const mockMuted = vi.fn();
  const mockDryRun = vi.fn();
  const mockCleanupManagedOutputs = vi.fn();
  const mockSpinnerStart = vi.fn();
  const mockSpinner = {
    start: mockSpinnerStart,
    succeed: vi.fn().mockReturnThis(),
    fail: vi.fn().mockReturnThis(),
    stop: vi.fn().mockReturnThis(),
    text: '',
  };
  mockSpinnerStart.mockReturnValue(mockSpinner);
  return {
    mockCompile,
    mockLoadConfig,
    mockExistsSync,
    mockWriteFile,
    mockChmod,
    mockMkdir,
    mockReadFile,
    mockWarn,
    mockWarning,
    mockError,
    mockMuted,
    mockDryRun,
    mockCleanupManagedOutputs,
    mockSpinner,
    mockSpinnerStart,
  };
});

vi.mock('@promptscript/compiler', () => ({
  Compiler: class {
    constructor(opts: { logger?: Logger } & Record<string, unknown>) {
      capturedLogger = opts.logger;
      capturedCompilerOptions = opts;
    }
    compile = mockCompile;
  },
}));

vi.mock('../../config/loader.js', () => ({
  loadConfig: (...args: unknown[]) => mockLoadConfig(...args),
  loadEffectiveConfig: (...args: unknown[]) => mockLoadConfig(...args),
  CONFIG_FILES: ['promptscript.yaml'],
}));

vi.mock('fs/promises', () => ({
  writeFile: (...args: unknown[]) => mockWriteFile(...args),
  chmod: (...args: unknown[]) => mockChmod(...args),
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
  createSpinner: vi.fn().mockReturnValue(mockSpinner),
  ConsoleOutput: {
    success: vi.fn(),
    error: mockError,
    muted: mockMuted,
    newline: vi.fn(),
    info: vi.fn(),
    warning: mockWarning,
    verbose: vi.fn(),
    debug: vi.fn(),
    dryRun: mockDryRun,
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

vi.mock('../../utils/managed-output-cleanup.js', () => ({
  cleanupManagedOutputs: (...args: unknown[]) => mockCleanupManagedOutputs(...args),
}));

import { compileCommand } from '../compile.js';

describe('compile command - createCliLogger warn path', () => {
  let mockServices: CliServices;

  beforeEach(() => {
    vi.clearAllMocks();
    capturedLogger = undefined;
    capturedCompilerOptions = undefined;
    process.exitCode = undefined;
    mockSpinnerStart.mockReturnValue(mockSpinner);
    mockSpinner.text = '';

    mockLoadConfig.mockResolvedValue({
      targets: ['claude'],
      registry: { path: './registry' },
    });

    mockExistsSync.mockImplementation((path: string) => {
      // Entry file exists; skill candidates do not
      return String(path).includes('project.prs');
    });

    mockWriteFile.mockResolvedValue(undefined);
    mockChmod.mockResolvedValue(undefined);
    mockMkdir.mockResolvedValue(undefined);
    mockReadFile.mockRejectedValue(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));
    mockCleanupManagedOutputs.mockResolvedValue({ removed: [] });

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

  it('should report obsolete generated files removed after compilation', async () => {
    const obsoleteFile = '/mock/project/.factory/rules/obsolete.md';
    mockCleanupManagedOutputs.mockResolvedValue({ removed: [obsoleteFile] });

    await compileCommand({ cwd: '/mock/project' }, mockServices);

    expect(mockCleanupManagedOutputs).toHaveBeenCalledWith(expect.any(Map), {
      outputRoot: '/mock/project',
      dryRun: undefined,
    });
    expect(mockMuted).toHaveBeenCalledWith(`Removed obsolete generated file: ${obsoleteFile}`);
  });

  it('should preview obsolete generated file removal in dry-run mode', async () => {
    const obsoleteFile = '/mock/project/.factory/rules/obsolete.md';
    mockCleanupManagedOutputs.mockResolvedValue({ removed: [obsoleteFile] });

    await compileCommand({ cwd: '/mock/project', dryRun: true }, mockServices);

    expect(mockCleanupManagedOutputs).toHaveBeenCalledWith(expect.any(Map), {
      outputRoot: '/mock/project',
      dryRun: true,
    });
    expect(mockDryRun).toHaveBeenCalledWith(
      `Would remove obsolete generated file: ${obsoleteFile}`
    );
  });

  it('should apply a named build profile entry, output, and targets', async () => {
    mockLoadConfig.mockResolvedValue({
      targets: ['claude'],
      builds: {
        logstrip: {
          entry: '.promptscript/logstrip.prs',
          output: '../logstrip',
          targets: [
            {
              factory: {
                version: 'full',
                skillBaseDir: 'plugins/logstrip/.factory/skills',
                includeSkills: ['logstrip'],
              },
            },
          ],
        },
      },
    });
    mockExistsSync.mockImplementation((path: string) => String(path).endsWith('logstrip.prs'));
    mockCompile.mockResolvedValue({
      success: true,
      outputs: new Map([['AGENTS.md', { path: 'AGENTS.md', content: '# Agents\n' }]]),
      stats: { totalTime: 10, resolveTime: 5, validateTime: 3, formatTime: 2 },
      warnings: [],
      errors: [],
    });

    await compileCommand({ build: 'logstrip', cwd: '/repo/promptscript' }, mockServices);

    expect(mockCompile).toHaveBeenCalledWith('/repo/promptscript/.promptscript/logstrip.prs');
    expect(capturedCompilerOptions?.['formatters']).toEqual([
      {
        name: 'factory',
        config: {
          version: 'full',
          skillBaseDir: 'plugins/logstrip/.factory/skills',
          includeSkills: ['logstrip'],
        },
      },
    ]);
    expect(mockWriteFile).toHaveBeenCalledWith('/repo/logstrip/AGENTS.md', '# Agents\n', 'utf-8');
  });

  it('should let --output override a build profile output', async () => {
    mockLoadConfig.mockResolvedValue({
      targets: ['claude'],
      builds: {
        logstrip: {
          entry: '.promptscript/logstrip.prs',
          output: '../logstrip',
          targets: ['factory'],
        },
      },
    });
    mockExistsSync.mockImplementation((path: string) => String(path).endsWith('logstrip.prs'));
    mockCompile.mockResolvedValue({
      success: true,
      outputs: new Map([['AGENTS.md', { path: 'AGENTS.md', content: '# Agents\n' }]]),
      stats: { totalTime: 10, resolveTime: 5, validateTime: 3, formatTime: 2 },
      warnings: [],
      errors: [],
    });

    await compileCommand(
      { build: 'logstrip', output: '/tmp/prs-build', cwd: '/repo/promptscript' },
      mockServices
    );

    expect(mockWriteFile).toHaveBeenCalledWith('/tmp/prs-build/AGENTS.md', '# Agents\n', 'utf-8');
  });

  it('should preserve executable output modes', async () => {
    mockCompile.mockResolvedValue({
      success: true,
      outputs: new Map([
        [
          '.factory/skills/review/scripts/check.sh',
          {
            path: '.factory/skills/review/scripts/check.sh',
            content: '#!/bin/sh\necho checking\n',
            mode: 0o755,
          },
        ],
      ]),
      stats: { totalTime: 10, resolveTime: 5, validateTime: 3, formatTime: 2 },
      warnings: [],
      errors: [],
    });

    await compileCommand({ cwd: '/mock/project' }, mockServices);

    expect(mockChmod).toHaveBeenCalledWith(
      '/mock/project/.factory/skills/review/scripts/check.sh',
      0o755
    );
  });

  it('should restore non-executable mode when output content is unchanged', async () => {
    const content = '#!/bin/sh\necho report\n';
    mockExistsSync.mockImplementation((path: string) => {
      const value = String(path);
      return value.includes('project.prs') || value.endsWith('report.sh');
    });
    mockReadFile.mockResolvedValue(content);
    mockCompile.mockResolvedValue({
      success: true,
      outputs: new Map([
        [
          '.factory/skills/review/scripts/report.sh',
          {
            path: '.factory/skills/review/scripts/report.sh',
            content,
            mode: 0o644,
          },
        ],
      ]),
      stats: { totalTime: 10, resolveTime: 5, validateTime: 3, formatTime: 2 },
      warnings: [],
      errors: [],
    });

    await compileCommand({ cwd: '/mock/project' }, mockServices);

    expect(mockWriteFile).not.toHaveBeenCalled();
    expect(mockChmod).toHaveBeenCalledWith(
      '/mock/project/.factory/skills/review/scripts/report.sh',
      0o644
    );
  });

  it('should fail for an unknown build profile', async () => {
    mockLoadConfig.mockResolvedValue({
      targets: ['claude'],
      builds: {
        known: { targets: ['factory'] },
      },
    });

    await compileCommand({ build: 'missing', cwd: '/repo/promptscript' }, mockServices);

    expect(process.exitCode).toBe(1);
    expect(mockCompile).not.toHaveBeenCalled();
    expect(mockError).toHaveBeenCalledWith(
      'Unknown build profile: missing. Available build profiles: known.'
    );
  });

  it('should reject --build combined with --all-builds', async () => {
    mockLoadConfig.mockResolvedValue({
      targets: { claude: {} },
      builds: { known: { targets: ['factory'] } },
    });

    await compileCommand(
      { build: 'known', allBuilds: true, cwd: '/repo/promptscript' },
      mockServices
    );

    expect(process.exitCode).toBe(1);
    expect(mockError).toHaveBeenCalledWith('Cannot use --build with --all-builds');
  });

  it('should compile all build profiles with --all-builds', async () => {
    mockLoadConfig.mockResolvedValue({
      targets: { claude: {}, factory: {} },
      builds: {
        alpha: { targets: ['claude'] },
        beta: { targets: ['factory'] },
      },
    });
    mockCompile.mockResolvedValue({
      success: true,
      outputs: new Map(),
      stats: { totalTime: 10, resolveTime: 5, validateTime: 3, formatTime: 2 },
      warnings: [],
      errors: [],
    });

    await compileCommand({ allBuilds: true, cwd: '/repo/promptscript' }, mockServices);

    expect(mockCompile).toHaveBeenCalledTimes(2);
  });

  it('should continue compiling build profiles after one compilation fails', async () => {
    mockLoadConfig.mockResolvedValue({
      targets: ['claude'],
      builds: {
        alpha: { entry: '.promptscript/alpha.prs', targets: ['claude'] },
        beta: { entry: '.promptscript/beta.prs', targets: ['claude'] },
      },
    });
    mockExistsSync.mockImplementation((path: string) => String(path).endsWith('.prs'));
    mockCompile
      .mockResolvedValueOnce({
        success: false,
        outputs: new Map(),
        stats: { totalTime: 10, resolveTime: 5, validateTime: 3, formatTime: 2 },
        warnings: [],
        errors: [{ message: 'Alpha compilation failed' }],
      })
      .mockResolvedValueOnce({
        success: true,
        outputs: new Map(),
        stats: { totalTime: 10, resolveTime: 5, validateTime: 3, formatTime: 2 },
        warnings: [],
        errors: [],
      });

    await compileCommand({ allBuilds: true, cwd: '/repo/promptscript' }, mockServices);

    expect(mockCompile).toHaveBeenNthCalledWith(1, '/repo/promptscript/.promptscript/alpha.prs');
    expect(mockCompile).toHaveBeenNthCalledWith(2, '/repo/promptscript/.promptscript/beta.prs');
    expect(mockError).toHaveBeenCalledWith('Alpha compilation failed');
    expect(process.exitCode).toBe(1);
  });

  it('should warn when no build profiles found with --all-builds', async () => {
    mockLoadConfig.mockResolvedValue({
      targets: { claude: {} },
      builds: {},
    });

    await compileCommand({ allBuilds: true, cwd: '/repo/promptscript' }, mockServices);

    expect(mockCompile).not.toHaveBeenCalled();
    expect(mockWarning).toHaveBeenCalledWith('No named build profiles found in config.builds');
  });

  it('should resolve all builds without cwd or config options', async () => {
    mockLoadConfig.mockResolvedValue({
      targets: ['claude'],
    });

    await compileCommand({ allBuilds: true }, mockServices);

    expect(mockCompile).not.toHaveBeenCalled();
    expect(mockWarning).toHaveBeenCalledWith('No named build profiles found in config.builds');
  });

  it('should resolve all builds from an explicit config path', async () => {
    mockLoadConfig.mockResolvedValue({
      targets: ['claude'],
      builds: {},
    });

    await compileCommand({ allBuilds: true, config: '/repo/custom.yaml' }, mockServices);

    expect(mockLoadConfig).toHaveBeenCalledWith('/repo/custom.yaml');
    expect(mockCompile).not.toHaveBeenCalled();
    expect(mockWarning).toHaveBeenCalledWith('No named build profiles found in config.builds');
  });

  it('should continue after build setup throws', async () => {
    mockLoadConfig.mockResolvedValue({
      targets: ['claude'],
      builds: {
        alpha: { targets: ['claude'] },
        beta: { targets: ['claude'] },
      },
    });
    mockSpinnerStart
      .mockImplementationOnce(() => {
        throw new Error('alpha setup failed');
      })
      .mockImplementationOnce(() => {
        throw { reason: 'beta setup failed' };
      });

    await compileCommand({ allBuilds: true, cwd: '/repo/promptscript' }, mockServices);

    expect(mockError).toHaveBeenCalledWith('Build profile "alpha" failed: alpha setup failed');
    expect(mockError).toHaveBeenCalledWith('Build profile "beta" failed: [object Object]');
    expect(process.exitCode).toBe(1);
  });
});
