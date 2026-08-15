import { describe, it, expect, vi, beforeEach } from 'vitest';

const {
  mockSucceed,
  mockFail,
  mockSpinner,
  mockLoadConfig,
  mockResolveRegistryPath,
  mockCompile,
  mockCompilerOptions,
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
  const mockCompilerOptions = vi.fn();
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
    mockCompilerOptions,
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
  Compiler: vi.fn().mockImplementation(function (options: unknown) {
    mockCompilerOptions(options);
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
    mockExistsSync.mockImplementation((path) => !String(path).endsWith('promptscript.lock'));
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
    mockExistsSync.mockImplementation((path) => !String(path).endsWith('promptscript.lock'));
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

  it('should read a valid lockfile and configure complete repository roots', async () => {
    mockLoadConfig.mockResolvedValue({
      targets: ['github'],
      validation: {},
    });
    mockResolveRegistryPath.mockResolvedValue({
      path: './registry',
      isRemote: true,
      source: 'remote',
      repositoryUrl: 'https://github.com/company/registry',
      repositoryPath: '/cache/registry',
    });
    mockExistsSync.mockImplementation((path: string) => {
      const value = String(path);
      if (value.endsWith('promptscript.lock')) return true;
      if (value.endsWith('/.promptscript/project.prs')) return true;
      if (value.endsWith('/.github/copilot-instructions.md')) return false;
      return false;
    });
    mockReadFile.mockImplementation(async (path: string) => {
      if (String(path).endsWith('promptscript.lock')) {
        return 'version: 1\ndependencies: {}';
      }
      throw new Error(`Unexpected read: ${String(path)}`);
    });
    mockCompile.mockResolvedValue({
      success: true,
      errors: [],
      warnings: [],
      outputs: new Map([
        ['github', { path: '.github/copilot-instructions.md', content: 'new content' }],
      ]),
    });

    await diffCommand({ noPager: true });

    const lockfile = { version: 1, dependencies: {} };
    expect(mockResolveRegistryPath).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ lockfile })
    );
    expect(mockCompilerOptions).toHaveBeenCalledWith(
      expect.objectContaining({
        resolver: expect.objectContaining({
          lockfile,
          referenceRoots: {
            'https://github.com/company/registry': ['/cache/registry'],
          },
        }),
      })
    );
    expect(mockCompile).toHaveBeenCalledTimes(1);
  });

  it('should fail before registry resolution when lockfile is invalid', async () => {
    mockLoadConfig.mockResolvedValue({
      targets: ['github'],
      validation: {},
    });
    mockExistsSync.mockImplementation((path: string) => String(path).endsWith('promptscript.lock'));
    mockReadFile.mockResolvedValue('invalid: true');

    await diffCommand({ noPager: true });

    expect(mockFail).toHaveBeenCalledWith('Error');
    expect(ConsoleOutput.error).toHaveBeenCalledWith(expect.stringContaining('Invalid lockfile'));
    expect(mockResolveRegistryPath).not.toHaveBeenCalled();
    expect(mockCompile).not.toHaveBeenCalled();
    expect(process.exitCode).toBe(1);
  });

  it('should omit repository roots when repository path is missing', async () => {
    mockLoadConfig.mockResolvedValue({
      targets: ['github'],
      validation: {},
    });
    mockResolveRegistryPath.mockResolvedValue({
      path: './registry',
      isRemote: true,
      source: 'remote',
      repositoryUrl: 'https://github.com/company/registry',
    });
    mockExistsSync.mockImplementation((path: string) => {
      const value = String(path);
      if (value.endsWith('promptscript.lock')) return false;
      return value.endsWith('/.promptscript/project.prs');
    });
    mockCompile.mockResolvedValue({
      success: true,
      errors: [],
      warnings: [],
      outputs: new Map(),
    });

    await diffCommand({ noPager: true });

    expect(mockCompilerOptions).toHaveBeenCalledWith(
      expect.objectContaining({
        resolver: expect.objectContaining({ referenceRoots: undefined }),
      })
    );
    expect(mockCompile).toHaveBeenCalledTimes(1);
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
    mockExistsSync.mockImplementation((path) => !String(path).endsWith('promptscript.lock'));
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

  it('should reject an unsupported report format', async () => {
    await diffCommand({ format: 'yaml' as unknown as 'text' | 'json' });

    expect(ConsoleOutput.error).toHaveBeenCalledWith(
      'Invalid output format: yaml. Expected text or json.'
    );
    expect(process.exitCode).toBe(1);
  });

  it('should reject an empty target configuration', async () => {
    mockLoadConfig.mockResolvedValue({
      targets: [{}],
      validation: {},
      includePromptScriptSkill: false,
    });
    mockResolveRegistryPath.mockResolvedValue({
      path: './registry',
      isRemote: false,
      source: 'local',
    });
    mockExistsSync.mockReturnValue(false);

    await diffCommand({ noPager: true });

    expect(mockFail).toHaveBeenCalledWith('Error');
    expect(ConsoleOutput.error).toHaveBeenCalledWith('Empty target configuration');
    expect(process.exitCode).toBe(1);
  });

  it('should emit a JSON error when the entry file is missing', async () => {
    const consoleLog = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    mockLoadConfig.mockResolvedValue({
      targets: ['github'],
      validation: {},
      includePromptScriptSkill: false,
    });
    mockResolveRegistryPath.mockResolvedValue({
      path: './registry',
      isRemote: false,
      source: 'local',
    });
    mockExistsSync.mockReturnValue(false);

    await diffCommand({ format: 'json' });
    const json = consoleLog.mock.calls[0]?.[0] as string;
    consoleLog.mockRestore();

    const report = JSON.parse(json) as {
      success: boolean;
      errors: Array<{ code: string; message: string }>;
    };
    expect(report).toMatchObject({
      success: false,
      errors: [{ code: 'DIFF0002', message: expect.stringContaining('File not found') }],
    });
    expect(mockCompile).not.toHaveBeenCalled();
    expect(process.exitCode).toBe(1);
  });

  it('should preserve configured headers and target filtering in JSON mode', async () => {
    const consoleLog = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const markedOutput = {
      path: 'CLAUDE.md',
      content: '---\ntitle: Project\n---\n<!-- PromptScript marker -->\ncontent\n',
      target: 'github',
      source: '.promptscript/project.prs',
    };
    const plainOutput = {
      path: 'plain.md',
      content: 'plain\n',
      target: 'github',
      source: '.promptscript/project.prs',
    };
    mockLoadConfig.mockResolvedValue({
      targets: [{ github: {} }, { claude: { enabled: false } }],
      validation: {},
      includePromptScriptSkill: false,
      output: { baseDir: 'generated', header: 'Generated header' },
    });
    mockResolveRegistryPath.mockResolvedValue({
      path: './registry',
      isRemote: false,
      source: 'local',
    });
    mockExistsSync.mockImplementation((path: string) =>
      String(path).endsWith('/.promptscript/project.prs')
    );
    mockCompile.mockResolvedValue({
      success: true,
      errors: [],
      warnings: [],
      outputs: new Map([
        ['marked', markedOutput],
        ['plain', plainOutput],
      ]),
    });

    await diffCommand({ format: 'json' });
    consoleLog.mockRestore();

    expect(mockCompilerOptions).toHaveBeenCalledWith(
      expect.objectContaining({ formatters: [{ name: 'github', config: {} }] })
    );
    expect(markedOutput.content).toContain('---\n\nGenerated header\n');
    expect(plainOutput.content).toBe('plain\n');
  });

  it('should emit JSON errors for unexpected machine-readable failures', async () => {
    const consoleLog = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    mockLoadConfig.mockRejectedValue(new Error('Config load failure'));

    await diffCommand({ format: 'json' });
    const json = consoleLog.mock.calls[0]?.[0] as string;
    consoleLog.mockRestore();

    const report = JSON.parse(json) as {
      success: boolean;
      errors: Array<{ code: string; message: string }>;
    };
    expect(report).toMatchObject({
      success: false,
      errors: [{ code: 'DIFF0000', message: 'Config load failure' }],
    });
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
    mockExistsSync.mockImplementation((path) => !String(path).endsWith('promptscript.lock'));
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

  it('should emit a machine-readable report without content by default', async () => {
    const consoleLog = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    mockLoadConfig.mockResolvedValue({
      targets: ['github'],
      validation: {},
      includePromptScriptSkill: false,
    });
    mockResolveRegistryPath.mockResolvedValue({
      path: './registry',
      isRemote: false,
      source: 'local',
    });
    mockExistsSync.mockImplementation((path: string) => {
      const value = String(path);
      return value.endsWith('/.promptscript/project.prs');
    });
    mockCompile.mockResolvedValue({
      success: true,
      errors: [],
      warnings: [],
      outputs: new Map([
        [
          'github',
          {
            path: '.github/copilot-instructions.md',
            content: '<!-- PromptScript marker -->\nnew content\n',
            target: 'github',
            source: '.promptscript/project.prs',
          },
        ],
      ]),
    });

    await diffCommand({ format: 'json', noPager: true });
    const json = consoleLog.mock.calls[0]?.[0] as string;
    consoleLog.mockRestore();

    const report = JSON.parse(json) as {
      success: boolean;
      hasChanges: boolean;
      changes: Array<{ target: string; path: string; kind: string; content?: string }>;
    };
    expect(report).toMatchObject({
      success: true,
      hasChanges: true,
      changes: [
        expect.objectContaining({
          target: 'github',
          path: '.github/copilot-instructions.md',
          kind: 'added',
        }),
      ],
    });
    expect(report.changes[0]?.content).toBeUndefined();
    expect(mockSucceed).not.toHaveBeenCalled();
    expect(mockPagerFlush).not.toHaveBeenCalled();
    expect(process.exitCode).toBeUndefined();
  });

  it('should include canonical content when requested', async () => {
    const consoleLog = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    mockLoadConfig.mockResolvedValue({
      targets: ['github'],
      validation: {},
      includePromptScriptSkill: false,
    });
    mockResolveRegistryPath.mockResolvedValue({
      path: './registry',
      isRemote: false,
      source: 'local',
    });
    mockExistsSync.mockImplementation((path: string) =>
      String(path).endsWith('/.promptscript/project.prs')
    );
    mockCompile.mockResolvedValue({
      success: true,
      errors: [],
      warnings: [],
      outputs: new Map([
        [
          'github',
          {
            path: 'CLAUDE.md',
            content: '<!-- PromptScript marker -->\ncontent\n',
            target: 'github',
            source: '.promptscript/project.prs',
          },
        ],
      ]),
    });

    await diffCommand({ format: 'json', includeContent: true });
    const json = consoleLog.mock.calls[0]?.[0] as string;
    consoleLog.mockRestore();

    const report = JSON.parse(json) as {
      contentIncluded: boolean;
      changes: Array<{ content?: string }>;
    };
    expect(report.contentIncluded).toBe(true);
    expect(report.changes[0]?.content).toBe('content\n');
  });

  it('should report compilation errors as failed JSON without changes', async () => {
    const consoleLog = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    mockLoadConfig.mockResolvedValue({
      targets: ['github'],
      validation: {},
      includePromptScriptSkill: false,
    });
    mockResolveRegistryPath.mockResolvedValue({
      path: './registry',
      isRemote: false,
      source: 'local',
    });
    mockExistsSync.mockImplementation((path: string) =>
      String(path).endsWith('/.promptscript/project.prs')
    );
    mockCompile.mockResolvedValue({
      success: false,
      errors: [
        {
          name: 'ParseError',
          code: 'PS0001',
          message: 'Parse failure',
        },
      ],
      warnings: [],
      outputs: new Map(),
    });

    await diffCommand({ format: 'json' });
    const json = consoleLog.mock.calls[0]?.[0] as string;
    consoleLog.mockRestore();

    const report = JSON.parse(json) as {
      success: boolean;
      hasChanges: boolean;
      errors: Array<{ code: string; message: string }>;
    };
    expect(report).toMatchObject({
      success: false,
      hasChanges: false,
      errors: [{ code: 'PS0001', message: 'Parse failure' }],
    });
    expect(process.exitCode).toBe(1);
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

  it('writes machine-readable diagnostics to stderr', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    mockIsVerbose.mockReturnValue(true);
    mockIsDebug.mockReturnValue(true);
    const logger = createDiffLogger(true);

    logger.verbose('verbose diagnostic');
    logger.debug('debug diagnostic');
    logger.warn('warning diagnostic');

    expect(consoleError).toHaveBeenNthCalledWith(1, 'verbose diagnostic');
    expect(consoleError).toHaveBeenNthCalledWith(2, 'debug diagnostic');
    expect(consoleError).toHaveBeenNthCalledWith(3, 'warning diagnostic');
    expect(mockConsoleVerbose).not.toHaveBeenCalled();
    expect(mockConsoleDebug).not.toHaveBeenCalled();
    expect(mockConsoleWarn).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });
});
