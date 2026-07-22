import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { CliServices } from '../services.js';

// Hoisted mocks
const {
  mockCompile,
  mockCompilerConstructor,
  mockWriteFile,
  mockMkdir,
  mockReadFile,
  mockExistsSync,
  mockLoadConfig,
  mockLoadEffectiveConfig,
  mockChokidarWatch,
} = vi.hoisted(() => {
  const mockCompile = vi.fn();
  const mockCompilerConstructor = vi.fn();
  const mockWriteFile = vi.fn();
  const mockMkdir = vi.fn();
  const mockReadFile = vi.fn();
  const mockExistsSync = vi.fn();
  const mockLoadConfig = vi.fn();
  const mockLoadEffectiveConfig = vi.fn();
  const mockChokidarWatch = vi.fn().mockReturnValue({
    on: vi.fn().mockReturnThis(),
  });
  return {
    mockCompile,
    mockCompilerConstructor,
    mockWriteFile,
    mockMkdir,
    mockReadFile,
    mockExistsSync,
    mockLoadConfig,
    mockLoadEffectiveConfig,
    mockChokidarWatch,
  };
});

vi.mock('@promptscript/compiler', () => ({
  Compiler: class {
    constructor(options: unknown) {
      mockCompilerConstructor(options);
    }
    compile = mockCompile;
  },
}));

// Mock the config loader - include BOTH loadConfig and loadEffectiveConfig
vi.mock('../config/loader.js', () => ({
  loadConfig: (...args: unknown[]) => mockLoadConfig(...args),
  loadEffectiveConfig: (...args: unknown[]) => mockLoadEffectiveConfig(...args),
  CONFIG_FILES: [
    'promptscript.yaml',
    'promptscript.yml',
    '.promptscriptrc.yaml',
    '.promptscriptrc.yml',
  ],
}));

vi.mock('fs/promises', () => ({
  writeFile: (...args: unknown[]) => mockWriteFile(...args),
  mkdir: (...args: unknown[]) => mockMkdir(...args),
  readFile: (...args: unknown[]) => mockReadFile(...args),
  readdir: vi.fn().mockResolvedValue([]),
}));

vi.mock('fs', () => ({
  existsSync: (...args: unknown[]) => mockExistsSync(...args),
  readFileSync: vi.fn().mockReturnValue(''),
}));

vi.mock('../prettier/loader.js', () => ({
  resolvePrettierOptions: vi.fn().mockResolvedValue({}),
}));

vi.mock('../prettier/post-format.js', () => ({
  postFormatWithPrettier: vi.fn().mockResolvedValue(undefined),
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

vi.mock('../output/console.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../output/console.js')>();
  return {
    ...actual,
    isVerbose: () => false,
    isDebug: () => false,
  };
});

vi.mock('chalk', () => ({
  default: {
    green: (s: string) => s,
    red: (s: string) => s,
    yellow: (s: string) => s,
    blue: (s: string) => s,
    gray: (s: string) => s,
    dim: (s: string) => s,
    cyan: (s: string) => s,
    magenta: (s: string) => s,
    bold: (s: string) => s,
  },
}));

vi.mock('../output/pager.js', () => ({
  isTTY: () => false,
}));

vi.mock('../utils/registry-resolver.js', () => ({
  resolveRegistryPath: vi.fn().mockResolvedValue({ path: '/fake/registry', isRemote: false }),
}));

vi.mock('../utils/conflict-detector.js', () => ({
  detectOutputConflicts: vi.fn().mockReturnValue(new Map()),
}));

vi.mock('../utils/markers.js', () => ({
  stripMarkers: (s: string) => s,
}));

vi.mock('@promptscript/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@promptscript/core')>();
  return {
    ...actual,
    isValidLockfile: vi.fn().mockReturnValue(false),
  };
});

vi.mock('chokidar', () => ({
  default: {
    watch: mockChokidarWatch,
  },
}));

describe('compile config/target - Issues 2 and 3', () => {
  let mockServices: CliServices;

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mocks
    mockExistsSync.mockImplementation((path: string) => !path.endsWith('promptscript.lock'));
    mockReadFile.mockResolvedValue('');
    mockWriteFile.mockResolvedValue(undefined);
    mockMkdir.mockResolvedValue(undefined);
    mockCompile.mockResolvedValue({
      success: true,
      outputs: new Map(),
      errors: [],
      warnings: [],
      stats: { totalTime: 0, resolveTime: 0, validateTime: 0, formatTime: 0 },
    });

    // Default config with target options
    const config = {
      id: 'test',
      syntax: '1.0.0',
      targets: [
        'github',
        { claude: { convention: 'xml', version: '1.0' } },
        { cursor: { skillBaseDir: '.cursor/rules' } },
        { factory: { version: 'multifile', rulesMode: 'split' } },
      ],
      registries: {},
    };
    mockLoadConfig.mockResolvedValue(config);
    mockLoadEffectiveConfig.mockResolvedValue(config);

    mockServices = {
      fs: {
        writeFile: mockWriteFile,
        mkdir: mockMkdir,
        readFile: mockReadFile,
        readdir: vi.fn().mockResolvedValue([]),
        existsSync: mockExistsSync,
        readFileSync: vi.fn(),
      } as unknown as CliServices['fs'],
      prompts: {} as CliServices['prompts'],
      cwd: '/test',
    };
  });

  describe('Issue 2: use loadEffectiveConfig instead of loadConfig', () => {
    it('should call loadEffectiveConfig, not loadConfig', async () => {
      const { compileCommand } = await import('../commands/compile.js');

      await compileCommand({ all: true, dryRun: true } as never, mockServices);

      expect(mockLoadEffectiveConfig).toHaveBeenCalled();
    });
  });

  describe('Issue 3: preserve target options when --target is specified', () => {
    it('should preserve configured target options (convention, version) for --target claude', async () => {
      const { compileCommand } = await import('../commands/compile.js');

      await compileCommand({ target: 'claude', dryRun: true } as never, mockServices);

      // The Compiler constructor should receive the target with its full config
      expect(mockCompilerConstructor).toHaveBeenCalledWith(
        expect.objectContaining({
          formatters: [
            expect.objectContaining({
              name: 'claude',
              config: expect.objectContaining({
                convention: 'xml',
                version: '1.0',
              }),
            }),
          ],
        })
      );
    });

    it('should preserve Factory split rules config for --target factory', async () => {
      const { compileCommand } = await import('../commands/compile.js');

      await compileCommand({ target: 'factory', dryRun: true } as never, mockServices);

      expect(mockCompilerConstructor).toHaveBeenCalledWith(
        expect.objectContaining({
          formatters: [
            {
              name: 'factory',
              config: {
                version: 'multifile',
                rulesMode: 'split',
              },
            },
          ],
        })
      );
    });

    it('should preserve skillBaseDir for --target cursor', async () => {
      const { compileCommand } = await import('../commands/compile.js');

      await compileCommand({ target: 'cursor', dryRun: true } as never, mockServices);

      expect(mockCompilerConstructor).toHaveBeenCalledWith(
        expect.objectContaining({
          formatters: [
            expect.objectContaining({
              name: 'cursor',
              config: expect.objectContaining({
                skillBaseDir: '.cursor/rules',
              }),
            }),
          ],
        })
      );
    });

    it('should fall back to { name } when target is not in config', async () => {
      const { compileCommand } = await import('../commands/compile.js');

      await compileCommand({ target: 'unknown-target', dryRun: true } as never, mockServices);

      expect(mockCompilerConstructor).toHaveBeenCalledWith(
        expect.objectContaining({
          formatters: [{ name: 'unknown-target' }],
        })
      );
    });

    it('should use all configured targets (with their options) when no --target is specified', async () => {
      const { compileCommand } = await import('../commands/compile.js');

      await compileCommand({ all: true, dryRun: true } as never, mockServices);

      const callArgs = mockCompilerConstructor.mock.calls[0] as [unknown];
      const formatters = (callArgs[0] as { formatters: { name: string; config?: unknown }[] })
        .formatters;

      expect(formatters).toHaveLength(4);
      expect(formatters[0]).toEqual({ name: 'github' });
      expect(formatters[1]).toEqual({
        name: 'claude',
        config: { convention: 'xml', version: '1.0' },
      });
      expect(formatters[2]).toEqual({
        name: 'cursor',
        config: { skillBaseDir: '.cursor/rules' },
      });
      expect(formatters[3]).toEqual({
        name: 'factory',
        config: { version: 'multifile', rulesMode: 'split' },
      });
    });
  });
});
