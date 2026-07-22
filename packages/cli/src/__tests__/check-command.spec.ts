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
const mockResolveRegistryPath = vi.fn();

vi.mock('../config/loader', () => ({
  findConfigFile: () => mockFindConfigFile(),
  loadEffectiveConfig: (path: string) => mockLoadConfig(path),
  CONFIG_FILES: ['promptscript.yaml', 'promptscript.yml'],
}));

vi.mock('@promptscript/compiler', () => ({
  Compiler: class {
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
  readFile: vi.fn().mockResolvedValue('version: 1\ndependencies: {}\n'),
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
