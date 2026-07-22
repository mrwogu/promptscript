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
      const value = String(path);
      return value.includes('project.prs') || value.endsWith('promptscript.yaml');
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

  it('fails closed when an existing lockfile is malformed', async () => {
    mockExistsSync.mockImplementation(
      (path: string) =>
        String(path).includes('project.prs') || String(path).endsWith('promptscript.lock')
    );
    mockReadFile.mockImplementation(async (path: string) => {
      if (String(path).endsWith('promptscript.lock')) {
        return 'invalid: true';
      }
      throw Object.assign(new Error('ENOENT'), { code: 'ENOENT' });
    });

    await compileCommand({}, mockServices);

    expect(mockSpinner.fail).toHaveBeenCalledWith('Error');
    expect(mockCompile).not.toHaveBeenCalled();
    expect(process.exitCode).toBe(1);
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
    mockExistsSync.mockImplementation((path: string) => {
      const value = String(path);
      return value.endsWith('logstrip.prs') || value.endsWith('promptscript.yaml');
    });
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
    mockExistsSync.mockImplementation((path: string) => {
      const value = String(path);
      return value.endsWith('logstrip.prs') || value.endsWith('promptscript.yaml');
    });
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

  it('should add the configured header without breaking generated markers or frontmatter', async () => {
    mockLoadConfig.mockResolvedValue({
      targets: ['claude'],
      output: { header: 'Managed by the platform team.' },
    });
    mockCompile.mockResolvedValue({
      success: true,
      outputs: new Map([
        [
          'CLAUDE.md',
          {
            path: 'CLAUDE.md',
            content:
              '# CLAUDE.md\n\n<!-- PromptScript 2026-01-01T00:00:00.000Z | source: project.prs | target: claude - do not edit -->\n\nBody\n',
          },
        ],
        [
          'SKILL.md',
          {
            path: 'SKILL.md',
            content:
              '---\n# promptscript-generated: 2026-01-01T00:00:00.000Z | source: project.prs | target: claude\nname: test\n---\n\nBody\n',
          },
        ],
      ]),
      stats: { totalTime: 10, resolveTime: 5, validateTime: 3, formatTime: 2 },
      warnings: [],
      errors: [],
    });

    await compileCommand({ cwd: '/mock/project' }, mockServices);

    expect(mockWriteFile).toHaveBeenCalledWith(
      '/mock/project/CLAUDE.md',
      expect.stringContaining(
        'target: claude - do not edit -->\n\nManaged by the platform team.\n\nBody'
      ),
      'utf-8'
    );
    expect(mockWriteFile).toHaveBeenCalledWith(
      '/mock/project/SKILL.md',
      expect.stringContaining('name: test\n---\n\nManaged by the platform team.\n\nBody'),
      'utf-8'
    );
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
      return (
        value.includes('project.prs') ||
        value.endsWith('report.sh') ||
        value.endsWith('promptscript.yaml')
      );
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

  it('should reject conflicting target aliases', async () => {
    await compileCommand({ target: 'claude', format: 'github' }, mockServices);

    expect(mockCompile).not.toHaveBeenCalled();
    expect(mockError).toHaveBeenCalledWith(
      'Cannot use --target and --format with different values'
    );
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
    mockExistsSync.mockImplementation((path: string) => {
      const value = String(path);
      return value.endsWith('.prs') || value.endsWith('promptscript.yaml');
    });
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

  it('should resolve a relative config path from --cwd', async () => {
    await compileCommand({ cwd: '/repo/promptscript', config: 'config/custom.yaml' }, mockServices);

    expect(mockLoadConfig).toHaveBeenCalledWith('/repo/promptscript/config/custom.yaml');
  });

  it('should resolve PROMPTSCRIPT_CONFIG from --cwd', async () => {
    const previousConfig = process.env['PROMPTSCRIPT_CONFIG'];
    process.env['PROMPTSCRIPT_CONFIG'] = 'config/environment.yaml';
    try {
      await compileCommand({ cwd: '/repo/promptscript' }, mockServices);
    } finally {
      if (previousConfig === undefined) {
        delete process.env['PROMPTSCRIPT_CONFIG'];
      } else {
        process.env['PROMPTSCRIPT_CONFIG'] = previousConfig;
      }
    }

    expect(mockLoadConfig).toHaveBeenCalledWith('/repo/promptscript/config/environment.yaml');
  });

  it('should fail closed when --cwd has no configuration', async () => {
    mockExistsSync.mockReturnValue(false);
    const previousConfig = process.env['PROMPTSCRIPT_CONFIG'];
    delete process.env['PROMPTSCRIPT_CONFIG'];

    try {
      await compileCommand({ cwd: '/repo/missing' }, mockServices);
    } finally {
      if (previousConfig !== undefined) {
        process.env['PROMPTSCRIPT_CONFIG'] = previousConfig;
      }
    }

    expect(mockLoadConfig).not.toHaveBeenCalled();
    expect(mockError).toHaveBeenCalledWith(
      'No PromptScript configuration found in /repo/missing. Run: prs init'
    );
  });

  it('should resolve a relative registry override from --cwd', async () => {
    await compileCommand({ cwd: '/repo/promptscript', registry: 'registry' }, mockServices);

    expect(capturedCompilerOptions?.['resolver']).toEqual(
      expect.objectContaining({ registryPath: '/repo/promptscript/registry' })
    );
  });

  it('should report all-build configuration errors without a stack trace', async () => {
    mockLoadConfig.mockRejectedValue(new Error('Invalid build configuration'));

    await compileCommand({ allBuilds: true, config: '/repo/invalid.yaml' }, mockServices);

    expect(mockError).toHaveBeenCalledWith('Invalid build configuration');
    expect(process.exitCode).toBe(1);
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
