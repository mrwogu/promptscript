import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Logger, OutputPlan } from '@promptscript/core';
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
  mockLstatSync,
  mockReadFile,
  mockWarn,
  mockWarning,
  mockError,
  mockMuted,
  mockDryRun,
  mockCleanupManagedOutputs,
  mockRewriteHookOutputIfUnchanged,
  mockRemoveHookOutputIfUnchanged,
  mockIsTTY,
  mockSpinner,
  mockSpinnerStart,
  mockWatch,
  mockWatcherOn,
} = vi.hoisted(() => {
  const mockCompile = vi.fn();
  const mockLoadConfig = vi.fn();
  const mockExistsSync = vi.fn();
  const mockWriteFile = vi.fn();
  const mockChmod = vi.fn();
  const mockMkdir = vi.fn();
  const mockLstatSync = vi.fn();
  const mockReadFile = vi.fn();
  const mockWarn = vi.fn();
  const mockWarning = vi.fn();
  const mockError = vi.fn();
  const mockMuted = vi.fn();
  const mockDryRun = vi.fn();
  const mockCleanupManagedOutputs = vi.fn();
  const mockRewriteHookOutputIfUnchanged = vi.fn();
  const mockRemoveHookOutputIfUnchanged = vi.fn();
  const mockIsTTY = vi.fn();
  const mockSpinnerStart = vi.fn();
  const mockWatch = vi.fn();
  const mockWatcherOn = vi.fn();
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
    mockLstatSync,
    mockReadFile,
    mockWarn,
    mockWarning,
    mockError,
    mockMuted,
    mockDryRun,
    mockCleanupManagedOutputs,
    mockRewriteHookOutputIfUnchanged,
    mockRemoveHookOutputIfUnchanged,
    mockIsTTY,
    mockSpinner,
    mockSpinnerStart,
    mockWatch,
    mockWatcherOn,
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
    unchanged: vi.fn(),
    error: mockError,
    muted: mockMuted,
    newline: vi.fn(),
    info: vi.fn(),
    warning: mockWarning,
    verbose: vi.fn(),
    debug: vi.fn(),
    stats: vi.fn(),
    dryRun: mockDryRun,
    warn: mockWarn,
    skipped: vi.fn(),
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

vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('fs')>();
  return {
    ...actual,
    existsSync: (...args: unknown[]) => mockExistsSync(...args),
    lstatSync: (...args: unknown[]) => mockLstatSync(...args),
    readFileSync: vi.fn().mockReturnValue(''),
  };
});

vi.mock('../../output/pager.js', () => ({
  isTTY: (...args: unknown[]) => mockIsTTY(...args),
}));

vi.mock('chokidar', () => ({
  default: { watch: (...args: unknown[]) => mockWatch(...args) },
}));

vi.mock('../../utils/registry-resolver.js', () => ({
  resolveRegistryPath: vi.fn().mockResolvedValue({ path: '/mock/registry', isRemote: false }),
}));

vi.mock('../../utils/managed-output-cleanup.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../utils/managed-output-cleanup.js')>();
  return {
    ...actual,
    cleanupManagedOutputs: (...args: unknown[]) => mockCleanupManagedOutputs(...args),
    isHookOutputPath: vi.fn().mockReturnValue(false),
    isPromptScriptOwnedHookOutput: vi.fn().mockReturnValue(false),
    mergePromptScriptCodexConfig: vi.fn().mockReturnValue(undefined),
    mergePromptScriptHookOutput: vi.fn().mockReturnValue(undefined),
    removePromptScriptOwnedCodexHooks: vi.fn().mockReturnValue(undefined),
    rewriteHookOutputIfUnchanged: async (...args: unknown[]) => {
      const rewritten = await mockRewriteHookOutputIfUnchanged(...args);
      const mode = args[4];
      if (rewritten && typeof mode === 'number') {
        await mockChmod(String(args[0]), mode);
      }
      return rewritten;
    },
    removeHookOutputIfUnchanged: (...args: unknown[]) => mockRemoveHookOutputIfUnchanged(...args),
    createHookOutputSafely: vi.fn(
      async (path: string, _root: string, content: string, mode?: number) => {
        await mockWriteFile(path, content, 'utf-8');
        if (mode !== undefined) await mockChmod(path, mode);
        return true;
      }
    ),
  };
});

import { compileCommand } from '../compile.js';

function createTestOutputPlan(path: string): OutputPlan {
  const file = {
    path,
    originalPath: path,
    content: 'content',
    owner: 'test',
    role: 'primary' as const,
  };
  return {
    files: [file],
    outputs: new Map([[path, file]]),
    owners: new Map([[path, 'test']]),
    collisions: [],
    managedPaths: { directories: [], files: [] },
    resources: [],
    injected: [],
    managedOutputDirectories: [],
    managedOutputFiles: [],
  };
}

describe('compile command - createCliLogger warn path', () => {
  let mockServices: CliServices;

  beforeEach(() => {
    vi.clearAllMocks();
    capturedLogger = undefined;
    capturedCompilerOptions = undefined;
    process.exitCode = undefined;
    mockSpinnerStart.mockReset();
    mockSpinnerStart.mockReturnValue(mockSpinner);
    mockSpinner.text = '';
    const watcher = { on: mockWatcherOn };
    mockWatcherOn.mockReturnValue(watcher);
    mockWatch.mockReturnValue(watcher);

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
    mockLstatSync.mockImplementation((path: string) => {
      if (path === '/') return { isSymbolicLink: () => false };
      throw Object.assign(new Error('ENOENT'), { code: 'ENOENT' });
    });
    mockReadFile.mockRejectedValue(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));
    mockCleanupManagedOutputs.mockResolvedValue({ removed: [], removedDirectories: [] });
    mockRewriteHookOutputIfUnchanged.mockResolvedValue(true);
    mockRemoveHookOutputIfUnchanged.mockResolvedValue(true);
    mockIsTTY.mockReturnValue(false);

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

  it('loads a valid lockfile into the compiler resolver', async () => {
    mockExistsSync.mockImplementation(
      (path: string) =>
        String(path).includes('project.prs') || String(path).endsWith('promptscript.lock')
    );
    mockReadFile.mockImplementation(async (path: string) => {
      if (String(path).endsWith('promptscript.lock')) {
        return JSON.stringify({ version: 1, dependencies: {} });
      }
      throw Object.assign(new Error('ENOENT'), { code: 'ENOENT' });
    });

    await compileCommand({}, mockServices);

    expect(capturedCompilerOptions?.['resolver']).toEqual(
      expect.objectContaining({
        lockfile: { version: 1, dependencies: {} },
      })
    );
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

  it('should derive writes and cleanup from the shared output plan', async () => {
    const outputPlan = {
      files: [
        {
          path: 'planned.md',
          originalPath: './planned.md',
          content: 'planned content',
          mode: 0o755,
          merge: { format: 'json' as const, owner: 'planned', operations: [] },
          managedOutputDirectories: ['.planned'],
          managedOutputFiles: ['.planned/settings.json'],
          owner: 'planned',
          role: 'primary' as const,
        },
        {
          path: 'fallback.json',
          originalPath: 'fallback.json',
          content: '{}',
          mode: 0o640,
          merge: { format: 'json' as const, owner: 'fallback', operations: [] },
          managedOutputDirectories: ['.fallback'],
          managedOutputFiles: ['.fallback/settings.json'],
          owner: 'fallback',
          role: 'resource' as const,
          resourceOf: 'planned.md',
        },
      ],
      outputs: new Map(),
      owners: new Map(),
      collisions: [],
      managedPaths: {
        directories: ['.planned', '.fallback'],
        files: ['.planned/settings.json', '.fallback/settings.json'],
      },
      resources: [],
      injected: [],
      managedOutputDirectories: ['.planned', '.fallback'],
      managedOutputFiles: ['.planned/settings.json', '.fallback/settings.json'],
    } satisfies OutputPlan;

    mockCompile.mockResolvedValue({
      success: true,
      outputs: new Map([
        [
          'planned.md',
          {
            path: 'planned.md',
            content: 'current planned content',
            mode: 0o700,
            merge: { format: 'json' as const, owner: 'current', operations: [] },
            managedOutputDirectories: ['.current'],
            managedOutputFiles: ['.current/settings.json'],
          },
        ],
        ['legacy.md', { path: 'legacy.md', content: 'legacy content' }],
      ]),
      outputPlan,
      stats: { totalTime: 10, resolveTime: 5, validateTime: 3, formatTime: 2 },
      warnings: [],
      errors: [],
    });

    await compileCommand({}, mockServices);

    expect(mockWriteFile).toHaveBeenCalledWith(
      expect.stringContaining('/planned.md'),
      expect.stringContaining('current planned content'),
      'utf-8'
    );
    expect(mockWriteFile).toHaveBeenCalledWith(
      expect.stringContaining('/fallback.json'),
      '{}',
      'utf-8'
    );
    expect(mockWriteFile).not.toHaveBeenCalledWith(
      expect.stringContaining('/legacy.md'),
      expect.anything(),
      'utf-8'
    );
    expect(mockCleanupManagedOutputs).toHaveBeenCalledWith(
      expect.any(Map),
      expect.objectContaining({ outputRoot: process.cwd() })
    );
    const cleanupOutputs = mockCleanupManagedOutputs.mock.calls[0]?.[0] as Map<
      string,
      { path: string }
    >;
    expect(cleanupOutputs.get('planned.md')?.path).toBe('planned.md');
    expect(cleanupOutputs.get('fallback.json')?.path).toBe('fallback.json');
    expect(cleanupOutputs.has('legacy.md')).toBe(false);
  });

  it('should reject planned outputs that traverse symlinks', async () => {
    mockExistsSync.mockImplementation((path: string) => {
      const value = String(path);
      return value.includes('project.prs') || value.endsWith('promptscript.yaml');
    });
    mockLstatSync.mockReturnValue({ isSymbolicLink: () => true });
    mockCompile.mockResolvedValue({
      success: true,
      outputs: new Map(),
      outputPlan: createTestOutputPlan('nested/output.md'),
      stats: { totalTime: 10, resolveTime: 5, validateTime: 3, formatTime: 2 },
      warnings: [],
      errors: [],
    });

    await compileCommand({}, mockServices);

    expect(mockWriteFile).not.toHaveBeenCalled();
    expect(mockError).toHaveBeenCalledWith(expect.stringContaining('symbolic link'));
  });

  it('should fail when planned output symlinks cannot be checked', async () => {
    mockExistsSync.mockImplementation((path: string) => {
      const value = String(path);
      return value.includes('project.prs') || value.endsWith('promptscript.yaml');
    });
    mockLstatSync.mockImplementation(() => {
      throw new Error('permission denied');
    });
    mockCompile.mockResolvedValue({
      success: true,
      outputs: new Map(),
      outputPlan: createTestOutputPlan('nested/output.md'),
      stats: { totalTime: 10, resolveTime: 5, validateTime: 3, formatTime: 2 },
      warnings: [],
      errors: [],
    });

    await compileCommand({}, mockServices);

    expect(mockWriteFile).not.toHaveBeenCalled();
    expect(mockError).toHaveBeenCalledWith(expect.stringContaining('cannot be checked'));
  });

  it('should report obsolete generated files removed after compilation', async () => {
    const obsoleteFile = '/mock/project/.factory/rules/obsolete.md';
    mockCleanupManagedOutputs.mockResolvedValue({
      removed: [obsoleteFile],
      removedDirectories: [],
    });

    await compileCommand({ cwd: '/mock/project' }, mockServices);

    expect(mockCleanupManagedOutputs).toHaveBeenCalledWith(expect.any(Map), {
      outputRoot: '/mock/project',
      dryRun: undefined,
    });
    expect(mockMuted).toHaveBeenCalledWith(`Removed obsolete generated file: ${obsoleteFile}`);
  });

  it('should preview obsolete generated file removal in dry-run mode', async () => {
    const obsoleteFile = '/mock/project/.factory/rules/obsolete.md';
    mockCleanupManagedOutputs.mockResolvedValue({
      removed: [obsoleteFile],
      removedDirectories: [],
    });

    await compileCommand({ cwd: '/mock/project', dryRun: true }, mockServices);

    expect(mockCleanupManagedOutputs).toHaveBeenCalledWith(expect.any(Map), {
      outputRoot: '/mock/project',
      dryRun: true,
    });
    expect(mockDryRun).toHaveBeenCalledWith(
      `Would remove obsolete generated file: ${obsoleteFile}`
    );
  });

  it('should report managed directories pruned after compilation', async () => {
    const prunedDirectory = '/mock/project/.github/hooks';
    mockCleanupManagedOutputs.mockResolvedValue({
      removed: [],
      removedDirectories: [prunedDirectory],
    });

    await compileCommand({ cwd: '/mock/project' }, mockServices);

    expect(mockMuted).toHaveBeenCalledWith(`Removed empty managed directory: ${prunedDirectory}`);
  });

  it('should preview managed directories pruned in dry-run mode', async () => {
    const prunedDirectory = '/mock/project/.github/hooks';
    mockCleanupManagedOutputs.mockResolvedValue({
      removed: [],
      removedDirectories: [prunedDirectory],
    });

    await compileCommand({ cwd: '/mock/project', dryRun: true }, mockServices);

    expect(mockDryRun).toHaveBeenCalledWith(
      `Would remove empty managed directory: ${prunedDirectory}`
    );
  });

  it('should migrate legacy Factory hooks into generated canonical output', async () => {
    mockLoadConfig.mockResolvedValue({
      targets: ['factory'],
      registry: { path: './registry' },
    });
    const legacyContent = JSON.stringify({
      permissions: { allow: ['Read'] },
      hooks: {
        PreToolUse: [
          {
            matcher: 'Execute',
            hooks: [{ type: 'command', command: 'audit' }],
          },
        ],
      },
    });
    mockReadFile.mockImplementation(async (path: string) => {
      if (String(path).endsWith('.factory/settings.json')) return legacyContent;
      throw Object.assign(new Error('ENOENT'), { code: 'ENOENT' });
    });
    mockCompile.mockResolvedValue({
      success: true,
      outputs: new Map([
        [
          '.factory/hooks.json',
          {
            path: '.factory/hooks.json',
            content: JSON.stringify({
              hooks: {
                PreToolUse: [
                  {
                    hooks: [
                      {
                        type: 'command',
                        command: 'node check.mjs # promptscript-generated:check',
                      },
                    ],
                  },
                ],
              },
            }),
          },
        ],
      ]),
      stats: { totalTime: 10, resolveTime: 5, validateTime: 3, formatTime: 2 },
      warnings: [],
      errors: [],
    });

    await compileCommand({ cwd: '/mock/project' }, mockServices);

    const canonicalWrite = mockWriteFile.mock.calls.find(([path]) =>
      String(path).endsWith('.factory/hooks.json')
    );
    const canonical = JSON.parse(String(canonicalWrite?.[1])) as {
      hooks: { PreToolUse: unknown[] };
    };
    expect(canonical.hooks.PreToolUse).toHaveLength(2);
    expect(mockRewriteHookOutputIfUnchanged).toHaveBeenCalledWith(
      '/mock/project/.factory/settings.json',
      '/mock/project',
      legacyContent,
      JSON.stringify({ permissions: { allow: ['Read'] } }, null, 2) + '\n'
    );
    expect(mockWarning).not.toHaveBeenCalledWith(expect.stringContaining('PS4002'));
    expect(mockRemoveHookOutputIfUnchanged).not.toHaveBeenCalledWith(
      '/mock/project/.factory/settings.json',
      expect.anything(),
      expect.anything()
    );
  });

  it('should remove legacy Factory settings that only held hooks', async () => {
    mockLoadConfig.mockResolvedValue({
      targets: ['factory'],
      registry: { path: './registry' },
    });
    const legacyContent = JSON.stringify({
      hooks: {
        PreToolUse: [
          {
            matcher: 'Execute',
            hooks: [{ type: 'command', command: 'audit' }],
          },
        ],
      },
    });
    mockReadFile.mockImplementation(async (path: string) => {
      if (String(path).endsWith('.factory/settings.json')) return legacyContent;
      throw Object.assign(new Error('ENOENT'), { code: 'ENOENT' });
    });
    mockCompile.mockResolvedValue({
      success: true,
      outputs: new Map([
        [
          '.factory/hooks.json',
          {
            path: '.factory/hooks.json',
            content: JSON.stringify({
              hooks: {
                PreToolUse: [
                  {
                    hooks: [
                      {
                        type: 'command',
                        command: 'node check.mjs # promptscript-generated:check',
                      },
                    ],
                  },
                ],
              },
            }),
          },
        ],
      ]),
      stats: { totalTime: 10, resolveTime: 5, validateTime: 3, formatTime: 2 },
      warnings: [],
      errors: [],
    });

    await compileCommand({ cwd: '/mock/project' }, mockServices);

    expect(mockRemoveHookOutputIfUnchanged).toHaveBeenCalledWith(
      '/mock/project/.factory/settings.json',
      '/mock/project',
      '{}\n'
    );
  });

  it('should warn when the emptied legacy Factory settings cannot be removed', async () => {
    mockLoadConfig.mockResolvedValue({
      targets: ['factory'],
      registry: { path: './registry' },
    });
    const legacyContent = JSON.stringify({
      hooks: {
        PreToolUse: [
          {
            matcher: 'Execute',
            hooks: [{ type: 'command', command: 'audit' }],
          },
        ],
      },
    });
    mockReadFile.mockImplementation(async (path: string) => {
      if (String(path).endsWith('.factory/settings.json')) return legacyContent;
      throw Object.assign(new Error('ENOENT'), { code: 'ENOENT' });
    });
    mockRemoveHookOutputIfUnchanged.mockImplementation(
      async (path: string) => !String(path).endsWith('.factory/settings.json')
    );
    mockCompile.mockResolvedValue({
      success: true,
      outputs: new Map([
        [
          '.factory/hooks.json',
          {
            path: '.factory/hooks.json',
            content: JSON.stringify({
              hooks: {
                PreToolUse: [
                  {
                    hooks: [
                      {
                        type: 'command',
                        command: 'node check.mjs # promptscript-generated:check',
                      },
                    ],
                  },
                ],
              },
            }),
          },
        ],
      ]),
      stats: { totalTime: 10, resolveTime: 5, validateTime: 3, formatTime: 2 },
      warnings: [],
      errors: [],
    });

    await compileCommand({ cwd: '/mock/project' }, mockServices);

    expect(mockWarning).toHaveBeenCalledWith(
      expect.stringContaining('Left an empty /mock/project/.factory/settings.json behind')
    );
  });

  it('should roll back canonical hooks when legacy settings change before commit', async () => {
    mockLoadConfig.mockResolvedValue({
      targets: ['factory'],
      registry: { path: './registry' },
    });
    mockReadFile.mockImplementation(async (path: string) => {
      if (String(path).endsWith('.factory/settings.json')) {
        return JSON.stringify({
          hooks: {
            PreToolUse: [
              {
                hooks: [{ type: 'command', command: 'audit' }],
              },
            ],
          },
        });
      }
      throw Object.assign(new Error('ENOENT'), { code: 'ENOENT' });
    });
    mockRewriteHookOutputIfUnchanged.mockResolvedValue(false);

    await compileCommand({ cwd: '/mock/project' }, mockServices);

    expect(mockRemoveHookOutputIfUnchanged).toHaveBeenCalledWith(
      '/mock/project/.factory/hooks.json',
      '/mock/project',
      expect.stringContaining('"command": "audit"')
    );
    expect(mockCleanupManagedOutputs).not.toHaveBeenCalled();
    expect(mockError).toHaveBeenCalledWith(expect.stringContaining('was rolled back'));
    expect(process.exitCode).toBe(1);
  });

  it('should not delete a canonical file created concurrently', async () => {
    mockLoadConfig.mockResolvedValue({
      targets: ['factory'],
      registry: { path: './registry' },
    });
    const entry = {
      hooks: [{ type: 'command', command: 'audit' }],
    };
    const canonicalContent = JSON.stringify({ hooks: { PreToolUse: [entry] } }, null, 2) + '\n';
    let hooksReads = 0;
    mockReadFile.mockImplementation(async (path: string) => {
      if (String(path).endsWith('.factory/hooks.json')) {
        hooksReads++;
        if (hooksReads === 1) {
          throw Object.assign(new Error('ENOENT'), { code: 'ENOENT' });
        }
        return canonicalContent;
      }
      if (String(path).endsWith('.factory/settings.json')) {
        return JSON.stringify({ hooks: { PreToolUse: [entry] } });
      }
      throw Object.assign(new Error('ENOENT'), { code: 'ENOENT' });
    });
    mockExistsSync.mockImplementation((path: string) => {
      const value = String(path);
      return (
        value.includes('project.prs') ||
        value.endsWith('promptscript.yaml') ||
        value.endsWith('.factory/hooks.json')
      );
    });
    mockRewriteHookOutputIfUnchanged.mockResolvedValue(false);

    await compileCommand({ cwd: '/mock/project' }, mockServices);

    expect(mockRemoveHookOutputIfUnchanged).not.toHaveBeenCalled();
    expect(mockError).toHaveBeenCalledWith(expect.stringContaining('partial migration'));
    expect(process.exitCode).toBe(1);
  });

  it('should cancel migration when a concurrent canonical file is skipped', async () => {
    mockLoadConfig.mockResolvedValue({
      targets: ['factory'],
      registry: { path: './registry' },
    });
    const legacyContent = JSON.stringify({
      hooks: {
        PreToolUse: [
          {
            hooks: [{ type: 'command', command: 'audit' }],
          },
        ],
      },
    });
    let hooksReads = 0;
    mockReadFile.mockImplementation(async (path: string) => {
      if (String(path).endsWith('.factory/hooks.json')) {
        hooksReads++;
        if (hooksReads === 1) {
          throw Object.assign(new Error('ENOENT'), { code: 'ENOENT' });
        }
        return '{"hooks":{}}';
      }
      if (String(path).endsWith('.factory/settings.json')) return legacyContent;
      throw Object.assign(new Error('ENOENT'), { code: 'ENOENT' });
    });
    mockExistsSync.mockImplementation((path: string) => {
      const value = String(path);
      return (
        value.includes('project.prs') ||
        value.endsWith('promptscript.yaml') ||
        value.endsWith('.factory/hooks.json')
      );
    });
    mockIsTTY.mockReturnValue(true);
    vi.mocked(mockServices.prompts.select).mockResolvedValue('no');

    await compileCommand({ cwd: '/mock/project' }, mockServices);

    expect(mockRewriteHookOutputIfUnchanged).not.toHaveBeenCalled();
    expect(mockCleanupManagedOutputs).not.toHaveBeenCalled();
    expect(mockError).toHaveBeenCalledWith(
      expect.stringContaining('migration was cancelled before')
    );
    expect(process.exitCode).toBe(1);
  });

  it('should restore legacy settings when canonical hooks change during commit', async () => {
    mockLoadConfig.mockResolvedValue({
      targets: ['factory'],
      registry: { path: './registry' },
    });
    const legacyContent = JSON.stringify({
      hooks: {
        PreToolUse: [
          {
            hooks: [{ type: 'command', command: 'audit' }],
          },
        ],
      },
    });
    mockReadFile.mockImplementation(async (path: string) => {
      if (String(path).endsWith('.factory/settings.json')) return legacyContent;
      throw Object.assign(new Error('ENOENT'), { code: 'ENOENT' });
    });
    mockRewriteHookOutputIfUnchanged
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(true);

    await compileCommand({ cwd: '/mock/project' }, mockServices);

    expect(mockRewriteHookOutputIfUnchanged).toHaveBeenNthCalledWith(
      3,
      '/mock/project/.factory/settings.json',
      '/mock/project',
      '{}\n',
      legacyContent
    );
    expect(mockCleanupManagedOutputs).not.toHaveBeenCalled();
    expect(mockError).toHaveBeenCalledWith(
      expect.stringContaining('legacy settings were restored')
    );
    expect(process.exitCode).toBe(1);
  });

  it('should preview legacy Factory migration without writing', async () => {
    mockLoadConfig.mockResolvedValue({
      targets: ['factory'],
      registry: { path: './registry' },
    });
    mockReadFile.mockImplementation(async (path: string) => {
      if (String(path).endsWith('.factory/settings.json')) {
        return JSON.stringify({
          hooks: {
            PreToolUse: [
              {
                hooks: [{ type: 'command', command: 'audit' }],
              },
            ],
          },
        });
      }
      throw Object.assign(new Error('ENOENT'), { code: 'ENOENT' });
    });

    await compileCommand({ cwd: '/mock/project', dryRun: true }, mockServices);

    expect(mockDryRun).toHaveBeenCalledWith(
      expect.stringContaining('Would migrate 1 legacy Factory hook(s)')
    );
    expect(mockWriteFile).not.toHaveBeenCalled();
    expect(mockRewriteHookOutputIfUnchanged).not.toHaveBeenCalled();
  });

  it('should abort before writing when legacy Factory hooks are ambiguous', async () => {
    mockLoadConfig.mockResolvedValue({
      targets: ['factory'],
      registry: { path: './registry' },
    });
    mockReadFile.mockImplementation(async (path: string) => {
      if (String(path).endsWith('.factory/settings.json')) {
        return JSON.stringify({
          hooks: {
            unknownEvent: [{ hooks: [{ type: 'command', command: 'audit' }] }],
          },
        });
      }
      throw Object.assign(new Error('ENOENT'), { code: 'ENOENT' });
    });

    await compileCommand({ cwd: '/mock/project' }, mockServices);

    expect(mockWriteFile).not.toHaveBeenCalled();
    expect(mockCleanupManagedOutputs).not.toHaveBeenCalled();
    expect(mockError).toHaveBeenCalledWith(
      expect.stringContaining('Cannot migrate legacy Factory hooks safely')
    );
    expect(process.exitCode).toBe(1);
  });

  it('should abort before writing when legacy Factory settings are malformed', async () => {
    mockLoadConfig.mockResolvedValue({
      targets: ['factory'],
      registry: { path: './registry' },
    });
    mockReadFile.mockImplementation(async (path: string) => {
      if (String(path).endsWith('.factory/settings.json')) return '{';
      throw Object.assign(new Error('ENOENT'), { code: 'ENOENT' });
    });

    await compileCommand({ cwd: '/mock/project' }, mockServices);

    expect(mockWriteFile).not.toHaveBeenCalled();
    expect(mockCleanupManagedOutputs).not.toHaveBeenCalled();
    expect(mockError).toHaveBeenCalledWith(
      expect.stringContaining('Failed to parse Factory hooks file')
    );
    expect(process.exitCode).toBe(1);
  });

  it('should warn about installed legacy hooks when compile migration is disabled', async () => {
    // Arrange
    mockLoadConfig.mockResolvedValue({
      targets: ['factory'],
      registry: { path: './registry' },
    });
    mockReadFile.mockImplementation(async (path: string) => {
      if (String(path).endsWith('.factory/settings.json')) {
        return '{"hooks":{"PreToolUse":[{"hooks":[{"type":"command","command":"prs hook pre-edit"}]}]}}';
      }
      throw Object.assign(new Error('ENOENT'), { code: 'ENOENT' });
    });

    // Act
    await compileCommand({ cwd: '/mock/project', migrateFactoryHooks: false }, mockServices);

    // Assert
    expect(mockWarning).toHaveBeenCalledWith(expect.stringContaining('PS4002'));
    expect(mockWarning).toHaveBeenCalledWith(expect.stringContaining('legacy "hooks"'));
  });

  it('should not warn about legacy settings hooks when .factory/hooks.json exists', async () => {
    // Arrange
    mockLoadConfig.mockResolvedValue({
      targets: ['factory'],
      registry: { path: './registry' },
    });
    mockReadFile.mockImplementation(async (path: string) => {
      if (String(path).endsWith('.factory/settings.json')) {
        return '{"hooks":{"PreToolUse":[{"hooks":[{"type":"command","command":"old-cmd"}]}]}}';
      }
      if (String(path).endsWith('.factory/hooks.json')) {
        return '{"hooks":{}}';
      }
      throw Object.assign(new Error('ENOENT'), { code: 'ENOENT' });
    });

    // Act
    await compileCommand({ cwd: '/mock/project' }, mockServices);

    // Assert
    expect(mockWarning).not.toHaveBeenCalledWith(expect.stringContaining('PS4002'));
  });

  it('should not warn when .factory/settings.json has no hooks key', async () => {
    // Arrange
    mockLoadConfig.mockResolvedValue({
      targets: ['factory'],
      registry: { path: './registry' },
    });
    mockReadFile.mockImplementation(async (path: string) => {
      if (String(path).endsWith('.factory/settings.json')) {
        return '{"$schema":"https://docs.factory.ai/schema.json"}';
      }
      throw Object.assign(new Error('ENOENT'), { code: 'ENOENT' });
    });

    // Act
    await compileCommand({ cwd: '/mock/project' }, mockServices);

    // Assert
    expect(mockWarning).not.toHaveBeenCalledWith(expect.stringContaining('PS4002'));
  });

  it('should not warn when legacy settings hooks are fully PromptScript-owned', async () => {
    // Arrange
    mockLoadConfig.mockResolvedValue({
      targets: ['factory'],
      registry: { path: './registry' },
    });
    mockReadFile.mockImplementation(async (path: string) => {
      if (String(path).endsWith('.factory/settings.json')) {
        return '{"hooks":{"PreToolUse":[{"hooks":[{"type":"command","command":"echo ok # promptscript-generated:legacy"}]}]}}';
      }
      throw Object.assign(new Error('ENOENT'), { code: 'ENOENT' });
    });

    // Act
    await compileCommand({ cwd: '/mock/project' }, mockServices);

    // Assert
    expect(mockWarning).not.toHaveBeenCalledWith(expect.stringContaining('PS4002'));
  });

  it('should not check for legacy settings hooks without a factory target', async () => {
    // Arrange
    mockLoadConfig.mockResolvedValue({
      targets: ['claude'],
      registry: { path: './registry' },
    });
    mockReadFile.mockImplementation(async (path: string) => {
      if (String(path).endsWith('.factory/settings.json')) {
        return '{"hooks":{"PreToolUse":[{"hooks":[{"type":"command","command":"old-cmd"}]}]}}';
      }
      throw Object.assign(new Error('ENOENT'), { code: 'ENOENT' });
    });

    // Act
    await compileCommand({ cwd: '/mock/project' }, mockServices);

    // Assert
    expect(mockWarning).not.toHaveBeenCalledWith(expect.stringContaining('PS4002'));
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
    expect(mockWarning).toHaveBeenCalledWith(
      expect.stringContaining('is outside the project root')
    );
  });

  it('should not warn when output directory is the project root', async () => {
    mockLoadConfig.mockResolvedValue({
      targets: ['claude'],
      registry: { path: './registry' },
      output: { baseDir: '.' },
    });
    mockCompile.mockResolvedValue({
      success: true,
      outputs: new Map([['CLAUDE.md', { path: 'CLAUDE.md', content: '# Claude\n' }]]),
      stats: { totalTime: 10, resolveTime: 5, validateTime: 3, formatTime: 2 },
      warnings: [],
      errors: [],
    });

    await compileCommand({ cwd: '/repo/promptscript' }, mockServices);

    expect(mockWarning).not.toHaveBeenCalledWith(
      expect.stringContaining('is outside the project root')
    );
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
        ['README.md', { path: 'README.md', content: '# Unmanaged\n' }],
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
    expect(mockWriteFile).toHaveBeenCalledWith('/mock/project/README.md', '# Unmanaged\n', 'utf-8');
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

  it('should warn for non-strict target output conflicts', async () => {
    mockLoadConfig.mockResolvedValue({
      targets: [{ claude: { output: 'shared.md' } }, { github: { output: 'shared.md' } }],
    });

    await compileCommand({}, mockServices);

    expect(mockWarning).toHaveBeenCalledWith(
      'Output path conflict: shared.md <- claude, github. Last target processed wins.'
    );
  });

  it('should reject strict target output conflicts', async () => {
    mockLoadConfig.mockResolvedValue({
      targets: [{ claude: { output: 'shared.md' } }, { github: { output: 'shared.md' } }],
    });

    await compileCommand({ strict: true }, mockServices);

    expect(mockCompile).not.toHaveBeenCalled();
    expect(mockError).toHaveBeenCalledWith(
      expect.stringContaining('Output path conflict detected')
    );
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

  it('should start one watcher for all build profiles', async () => {
    vi.useFakeTimers();
    mockLoadConfig.mockResolvedValue({
      targets: ['claude'],
      builds: {
        alpha: { targets: ['claude'] },
      },
      watch: { debounce: 1 },
    });

    try {
      await compileCommand(
        { allBuilds: true, watch: true, cwd: '/repo/promptscript' },
        mockServices
      );

      expect(mockWatch).toHaveBeenCalledWith(
        '/repo/promptscript',
        expect.objectContaining({
          persistent: true,
          ignoreInitial: true,
          followSymlinks: false,
        })
      );
      expect(mockWatch).toHaveBeenCalledTimes(1);

      const changeHandler = mockWatcherOn.mock.calls.find(([event]) => event === 'change')?.[1] as
        ((path: string) => void) | undefined;
      changeHandler?.('/repo/promptscript/.promptscript/project.prs');
      await vi.runAllTimersAsync();

      expect(mockCompile).toHaveBeenCalledTimes(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it('should apply watch filters and report rebuild failures', async () => {
    vi.useFakeTimers();
    mockLoadConfig.mockResolvedValue({
      targets: ['claude'],
      watch: {
        include: ['src/**/*.prs'],
        exclude: ['**/ignored/**'],
        debounce: 1,
        clearScreen: false,
      },
    });

    try {
      await compileCommand({ watch: true, cwd: '/repo/promptscript' }, mockServices);

      const watchOptions = [...mockWatch.mock.calls]
        .reverse()
        .find((call) => call.length > 1)?.[1] as {
        ignored: (
          path: string,
          stats?: { isDirectory: () => boolean; isFile: () => boolean }
        ) => boolean;
      };
      expect(mockWatch).toHaveBeenCalled();
      expect(watchOptions).toBeDefined();
      expect(
        watchOptions.ignored('/repo/promptscript/src/ignored/', {
          isDirectory: () => true,
          isFile: () => false,
        })
      ).toBe(true);
      expect(
        watchOptions.ignored('/repo/promptscript/src/readme.md', {
          isDirectory: () => false,
          isFile: () => true,
        })
      ).toBe(true);
      expect(
        watchOptions.ignored('/repo/promptscript/src/project.prs', {
          isDirectory: () => false,
          isFile: () => true,
        })
      ).toBe(false);

      const changeHandler = mockWatcherOn.mock.calls.find(([event]) => event === 'change')?.[1] as
        ((path: string) => void) | undefined;
      expect(changeHandler).toBeDefined();
      mockSpinnerStart.mockImplementationOnce(() => {
        throw 'watch rebuild failed';
      });
      changeHandler?.('/repo/promptscript/src/project.prs');
      await vi.runAllTimersAsync();

      expect(mockError).toHaveBeenCalledWith('Watch compilation failed: watch rebuild failed');
      expect(process.exitCode).toBe(1);
    } finally {
      vi.useRealTimers();
    }
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
