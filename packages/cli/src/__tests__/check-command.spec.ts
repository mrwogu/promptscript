import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { CheckOptions } from '../types.js';

// Mock ora
vi.mock('ora', () => ({
  default: vi.fn(() => ({
    start: vi.fn().mockReturnThis(),
    succeed: vi.fn().mockReturnThis(),
    fail: vi.fn().mockReturnThis(),
    warn: vi.fn().mockReturnThis(),
    text: '',
  })),
}));

// Mock chalk
vi.mock('chalk', () => ({
  default: {
    green: (s: string) => s,
    red: (s: string) => s,
    yellow: (s: string) => s,
    blue: (s: string) => s,
    gray: (s: string) => s,
    cyan: (s: string) => s,
    bold: (s: string) => s,
  },
}));

// Mock console methods
vi.spyOn(console, 'log').mockImplementation(() => {});
vi.spyOn(console, 'error').mockImplementation(() => {});
vi.spyOn(console, 'warn').mockImplementation(() => {});

// Mock config loader
const mockFindConfigFile = vi.fn();
const mockLoadConfig = vi.fn();
const mockCompile = vi.fn();
const mockCompilerConstructor = vi.fn();
const mockResolveRegistryPath = vi.fn();
const { mockReadFile } = vi.hoisted(() => ({
  mockReadFile: vi.fn().mockResolvedValue('version: 1\ndependencies: {}\n'),
}));

vi.mock('../config/loader', () => ({
  findConfigFile: () => mockFindConfigFile(),
  loadEffectiveConfig: (path: string) => mockLoadConfig(path),
  CONFIG_FILES: ['promptscript.yaml', 'promptscript.yml'],
}));

vi.mock('@promptscript/compiler', () => ({
  Compiler: class {
    constructor(options: unknown) {
      mockCompilerConstructor(options);
    }

    compile = mockCompile;
  },
}));

vi.mock('../utils/registry-resolver', () => ({
  resolveRegistryPath: (config: unknown, options: unknown) =>
    mockResolveRegistryPath(config, options),
}));

// Mock fs.existsSync
const mockExistsSync = vi.fn();
vi.mock('fs', () => ({
  existsSync: (path: string) => mockExistsSync(path),
}));

vi.mock('fs/promises', () => ({
  readFile: mockReadFile,
}));

describe('commands/check', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.exitCode = undefined;
    mockFindConfigFile.mockReturnValue(null);
    mockLoadConfig.mockResolvedValue({});
    mockCompile.mockResolvedValue({ errors: [], warnings: [] });
    mockResolveRegistryPath.mockResolvedValue({
      path: './registry',
      isRemote: false,
      source: 'local',
    });
    mockExistsSync.mockReturnValue(false);
  });

  afterEach(() => {
    process.exitCode = undefined;
  });

  describe('checkCommand', () => {
    it('should fail when no config file exists', async () => {
      mockFindConfigFile.mockReturnValue(null);

      const { checkCommand } = await import('../commands/check.js');
      await checkCommand({} as CheckOptions);

      expect(process.exitCode).toBe(1);
    });

    it('should pass when valid config and entry file exist', async () => {
      mockFindConfigFile.mockReturnValue('promptscript.yaml');
      mockLoadConfig.mockResolvedValue({
        id: 'test',
        syntax: '1.0.0',
        input: { entry: './project.prs' },
        targets: ['github'],
      });
      mockExistsSync.mockReturnValue(true);

      const { checkCommand } = await import('../commands/check.js');
      await checkCommand({} as CheckOptions);

      expect(process.exitCode).toBeUndefined();
    });

    it('should warn when syntax field is missing', async () => {
      mockFindConfigFile.mockReturnValue('promptscript.yaml');
      mockLoadConfig.mockResolvedValue({
        id: 'test',
        input: { entry: './project.prs' },
        targets: ['github'],
      });
      mockExistsSync.mockReturnValue(true);

      const { checkCommand } = await import('../commands/check.js');
      await checkCommand({} as CheckOptions);

      expect(process.exitCode === 0 || process.exitCode === undefined).toBe(true);
    });

    it('should fail when project identifier is missing', async () => {
      mockFindConfigFile.mockReturnValue('promptscript.yaml');
      mockLoadConfig.mockResolvedValue({
        syntax: '1.0.0',
        input: { entry: './project.prs' },
        targets: ['github'],
      });
      mockExistsSync.mockImplementation((path: string) => path.endsWith('project.prs'));

      const { checkCommand } = await import('../commands/check.js');
      await checkCommand({} as CheckOptions);

      expect(process.exitCode).toBe(1);
    });

    it('should accept a legacy project identifier', async () => {
      mockFindConfigFile.mockReturnValue('promptscript.yaml');
      mockLoadConfig.mockResolvedValue({
        project: { id: 'legacy-test' },
        syntax: '1.0.0',
        input: { entry: './project.prs' },
        targets: ['github'],
      });
      mockExistsSync.mockImplementation((path: string) => path.endsWith('project.prs'));

      const { checkCommand } = await import('../commands/check.js');
      await checkCommand({} as CheckOptions);

      expect(process.exitCode).toBeUndefined();
    });

    it.each([
      ['non-object', 'legacy'],
      ['null', null],
      ['array', []],
      ['missing id', {}],
      ['non-string id', { id: 1 }],
      ['empty id', { id: ' ' }],
    ])('should reject a %s legacy project identifier', async (_case, project) => {
      mockFindConfigFile.mockReturnValue('promptscript.yaml');
      mockLoadConfig.mockResolvedValue({
        project,
        syntax: '1.0.0',
        input: { entry: './project.prs' },
        targets: ['github'],
      });
      mockExistsSync.mockImplementation((path: string) => path.endsWith('project.prs'));

      const { checkCommand } = await import('../commands/check.js');
      await checkCommand({} as CheckOptions);

      expect(process.exitCode).toBe(1);
    });

    it('should fail when syntax version is unsupported', async () => {
      mockFindConfigFile.mockReturnValue('promptscript.yaml');
      mockLoadConfig.mockResolvedValue({
        id: 'test',
        syntax: '99.0.0',
        input: { entry: './project.prs' },
        targets: ['github'],
      });
      mockExistsSync.mockImplementation((path: string) => path.endsWith('project.prs'));

      const { checkCommand } = await import('../commands/check.js');
      await checkCommand({} as CheckOptions);

      expect(process.exitCode).toBe(1);
    });

    it('should fail when entry file does not exist', async () => {
      mockFindConfigFile.mockReturnValue('promptscript.yaml');
      mockLoadConfig.mockResolvedValue({
        id: 'test',
        syntax: '1.0.0',
        input: { entry: './missing.prs' },
        targets: ['github'],
      });
      mockExistsSync.mockReturnValue(false);

      const { checkCommand } = await import('../commands/check.js');
      await checkCommand({} as CheckOptions);

      expect(process.exitCode).toBe(1);
    });

    it('should warn when no targets are configured', async () => {
      mockFindConfigFile.mockReturnValue('promptscript.yaml');
      mockLoadConfig.mockResolvedValue({
        id: 'test',
        syntax: '1.0.0',
        input: { entry: './project.prs' },
        targets: [],
      });
      mockExistsSync.mockReturnValue(true);

      const { checkCommand } = await import('../commands/check.js');
      await checkCommand({} as CheckOptions);

      // Warnings set exitCode to 0 (not failure)
      expect(process.exitCode === 0 || process.exitCode === undefined).toBe(true);
    });

    it('should handle registry path configuration', async () => {
      mockFindConfigFile.mockReturnValue('promptscript.yaml');
      mockLoadConfig.mockResolvedValue({
        id: 'test',
        syntax: '1.0.0',
        input: { entry: './project.prs' },
        registry: { path: './registry' },
        targets: ['github'],
      });
      mockExistsSync.mockReturnValue(true);

      const { checkCommand } = await import('../commands/check.js');
      await checkCommand({} as CheckOptions);

      expect(process.exitCode).toBeUndefined();
    });

    it('should warn when registry path does not exist', async () => {
      mockFindConfigFile.mockReturnValue('promptscript.yaml');
      mockLoadConfig.mockResolvedValue({
        id: 'test',
        syntax: '1.0.0',
        input: { entry: './project.prs' },
        registry: { path: './missing-registry' },
        targets: ['github'],
      });
      // Entry exists, but registry path does not
      mockExistsSync.mockImplementation((path: string) => {
        if (typeof path !== 'string') return false;
        // Entry file exists
        if (path === './project.prs' || path.endsWith('project.prs')) return true;
        // Registry path does not exist
        if (path.includes('missing-registry')) return false;
        return false;
      });

      const { checkCommand } = await import('../commands/check.js');
      await checkCommand({} as CheckOptions);

      expect(process.exitCode).toBe(1);
    });

    it('should handle registry URL configuration', async () => {
      mockFindConfigFile.mockReturnValue('promptscript.yaml');
      mockLoadConfig.mockResolvedValue({
        id: 'test',
        syntax: '1.0.0',
        input: { entry: './project.prs' },
        registry: { url: 'https://registry.example.com' },
        targets: ['github'],
      });
      mockExistsSync.mockReturnValue(true);

      const { checkCommand } = await import('../commands/check.js');
      await checkCommand({} as CheckOptions);

      expect(process.exitCode === 0 || process.exitCode === undefined).toBe(true);
    });

    it('should give Git registry precedence over a local path', async () => {
      mockFindConfigFile.mockReturnValue('promptscript.yaml');
      mockLoadConfig.mockResolvedValue({
        id: 'test',
        syntax: '1.0.0',
        input: { entry: './project.prs' },
        registry: {
          path: './unused-registry',
          git: { url: 'https://example.com/registry.git' },
        },
        targets: ['github'],
      });
      mockExistsSync.mockImplementation((path: string) => path.endsWith('project.prs'));

      const { checkCommand } = await import('../commands/check.js');
      await checkCommand({} as CheckOptions);

      expect(process.exitCode).toBeUndefined();
    });

    it('should fail when an unknown target is configured', async () => {
      mockFindConfigFile.mockReturnValue('promptscript.yaml');
      mockLoadConfig.mockResolvedValue({
        id: 'test',
        syntax: '1.0.0',
        input: { entry: './project.prs' },
        targets: ['unknown-target'],
      });
      mockExistsSync.mockImplementation((path: string) => path.endsWith('project.prs'));

      const { checkCommand } = await import('../commands/check.js');
      await checkCommand({} as CheckOptions);

      expect(process.exitCode).toBe(1);
    });

    it.each([
      ['non-object', 42],
      ['null', null],
      ['array', []],
    ])('should fail when a target is %s', async (_case, target) => {
      mockFindConfigFile.mockReturnValue('promptscript.yaml');
      mockLoadConfig.mockResolvedValue({
        id: 'test',
        syntax: '1.0.0',
        input: { entry: './project.prs' },
        targets: [target],
      });
      mockExistsSync.mockImplementation((path: string) => path.endsWith('project.prs'));

      const { checkCommand } = await import('../commands/check.js');
      await checkCommand({} as CheckOptions);

      expect(process.exitCode).toBe(1);
    });

    it('should fail when a target entry is empty', async () => {
      mockFindConfigFile.mockReturnValue('promptscript.yaml');
      mockLoadConfig.mockResolvedValue({
        id: 'test',
        syntax: '1.0.0',
        input: { entry: './project.prs' },
        targets: [{}],
      });
      mockExistsSync.mockImplementation((path: string) => path.endsWith('project.prs'));

      const { checkCommand } = await import('../commands/check.js');
      await checkCommand({} as CheckOptions);

      expect(process.exitCode).toBe(1);
    });

    it('should handle inherit configuration', async () => {
      mockFindConfigFile.mockReturnValue('promptscript.yaml');
      mockLoadConfig.mockResolvedValue({
        id: 'test',
        syntax: '1.0.0',
        input: { entry: './project.prs' },
        inherit: './base.prs',
        targets: ['github'],
      });
      mockExistsSync.mockReturnValue(true);

      const { checkCommand } = await import('../commands/check.js');
      await checkCommand({} as CheckOptions);

      expect(process.exitCode).toBeUndefined();
    });

    it('should fail when project resolution reports errors', async () => {
      mockFindConfigFile.mockReturnValue('promptscript.yaml');
      mockLoadConfig.mockResolvedValue({
        id: 'test',
        syntax: '1.0.0',
        input: { entry: './project.prs' },
        targets: ['github'],
      });
      mockExistsSync.mockImplementation((path: string) => path.endsWith('project.prs'));
      mockCompile.mockResolvedValue({
        errors: [{ message: 'Import not found: @missing/base' }],
        warnings: [],
      });

      const { checkCommand } = await import('../commands/check.js');
      await checkCommand({} as CheckOptions);

      expect(process.exitCode).toBe(1);
    });

    it('should report project resolution warnings without failing', async () => {
      mockFindConfigFile.mockReturnValue('promptscript.yaml');
      mockLoadConfig.mockResolvedValue({
        id: 'test',
        syntax: '1.0.0',
        input: { entry: './project.prs' },
        targets: ['github'],
      });
      mockExistsSync.mockImplementation((path: string) => path.endsWith('project.prs'));
      mockCompile.mockResolvedValue({
        errors: [],
        warnings: [{ message: 'Deprecated syntax' }],
      });

      const { checkCommand } = await import('../commands/check.js');
      await checkCommand({} as CheckOptions);

      expect(process.exitCode).toBe(0);
    });

    it('should pass registry repository roots to the compiler', async () => {
      mockFindConfigFile.mockReturnValue('promptscript.yaml');
      mockLoadConfig.mockResolvedValue({
        id: 'test',
        syntax: '1.0.0',
        input: { entry: './project.prs' },
        targets: ['github'],
      });
      mockExistsSync.mockImplementation((path: string) => path.endsWith('project.prs'));
      mockResolveRegistryPath.mockResolvedValue({
        path: '/cache/registry',
        isRemote: true,
        source: 'git',
        repositoryUrl: 'https://github.com/org/registry.git',
        repositoryPath: '/cache/registry',
      });

      const { checkCommand } = await import('../commands/check.js');
      await checkCommand({} as CheckOptions);

      expect(mockCompilerConstructor).toHaveBeenCalledWith(
        expect.objectContaining({
          resolver: expect.objectContaining({
            referenceRoots: {
              'https://github.com/org/registry.git': ['/cache/registry'],
            },
          }),
        })
      );
    });

    it('should omit registry repository roots when the repository path is missing', async () => {
      mockFindConfigFile.mockReturnValue('promptscript.yaml');
      mockLoadConfig.mockResolvedValue({
        id: 'test',
        syntax: '1.0.0',
        input: { entry: './project.prs' },
        targets: ['github'],
      });
      mockExistsSync.mockImplementation((path: string) => path.endsWith('project.prs'));
      mockResolveRegistryPath.mockResolvedValue({
        path: '/cache/registry',
        isRemote: true,
        source: 'git',
        repositoryUrl: 'https://github.com/org/registry.git',
      });

      const { checkCommand } = await import('../commands/check.js');
      await checkCommand({} as CheckOptions);

      expect(mockCompilerConstructor).toHaveBeenCalledWith(
        expect.objectContaining({
          resolver: expect.objectContaining({
            referenceRoots: undefined,
          }),
        })
      );
    });

    it('should fail before resolution when the lockfile is invalid', async () => {
      mockFindConfigFile.mockReturnValue('promptscript.yaml');
      mockLoadConfig.mockResolvedValue({
        id: 'test',
        syntax: '1.0.0',
        input: { entry: './project.prs' },
        targets: ['github'],
      });
      mockExistsSync.mockReturnValue(true);
      mockReadFile.mockResolvedValueOnce('not-a-lockfile');

      const { checkCommand } = await import('../commands/check.js');
      await checkCommand({} as CheckOptions);

      expect(process.exitCode).toBe(1);
      expect(mockResolveRegistryPath).not.toHaveBeenCalled();
    });

    it('should fail when registry resolution throws', async () => {
      mockFindConfigFile.mockReturnValue('promptscript.yaml');
      mockLoadConfig.mockResolvedValue({
        id: 'test',
        syntax: '1.0.0',
        input: { entry: './project.prs' },
        targets: ['github'],
      });
      mockExistsSync.mockImplementation((path: string) => path.endsWith('project.prs'));
      mockResolveRegistryPath.mockRejectedValue(new Error('Registry unavailable'));

      const { checkCommand } = await import('../commands/check.js');
      await checkCommand({} as CheckOptions);

      expect(process.exitCode).toBe(1);
    });

    it('should handle non-error registry resolution failures', async () => {
      mockFindConfigFile.mockReturnValue('promptscript.yaml');
      mockLoadConfig.mockResolvedValue({
        id: 'test',
        syntax: '1.0.0',
        input: { entry: './project.prs' },
        targets: ['github'],
      });
      mockExistsSync.mockImplementation((path: string) => path.endsWith('project.prs'));
      mockResolveRegistryPath.mockRejectedValue('Registry unavailable');

      const { checkCommand } = await import('../commands/check.js');
      await checkCommand({} as CheckOptions);

      expect(process.exitCode).toBe(1);
    });

    it('should fail on invalid YAML config', async () => {
      mockFindConfigFile.mockReturnValue('promptscript.yaml');
      mockLoadConfig.mockRejectedValue(new Error('Invalid YAML'));

      const { checkCommand } = await import('../commands/check.js');
      await checkCommand({} as CheckOptions);

      expect(process.exitCode).toBe(1);
    });

    it('should use default entry path when not specified', async () => {
      mockFindConfigFile.mockReturnValue('promptscript.yaml');
      mockLoadConfig.mockResolvedValue({
        id: 'test',
        syntax: '1.0.0',
        targets: ['github'],
      });
      mockExistsSync.mockImplementation((path: string) => {
        return path.includes('.promptscript/project.prs');
      });

      const { checkCommand } = await import('../commands/check.js');
      await checkCommand({} as CheckOptions);

      expect(process.exitCode).toBeUndefined();
    });

    it('should handle unexpected errors gracefully', async () => {
      mockFindConfigFile.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const { checkCommand } = await import('../commands/check.js');
      await checkCommand({} as CheckOptions);

      expect(process.exitCode).toBe(1);
    });
  });
});
