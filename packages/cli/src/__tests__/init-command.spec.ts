import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { existsSync } from 'fs';
import { writeFile, mkdir, readFile, readdir } from 'fs/promises';
import { input, confirm, checkbox } from '@inquirer/prompts';
import { initCommand } from '../commands/init';

// Mock fs modules
vi.mock('fs', () => ({
  existsSync: vi.fn(),
}));

vi.mock('fs/promises', () => ({
  writeFile: vi.fn().mockResolvedValue(undefined),
  mkdir: vi.fn().mockResolvedValue(undefined),
  readFile: vi.fn().mockResolvedValue('{}'),
  readdir: vi.fn().mockResolvedValue([]),
}));

// Mock ora
vi.mock('ora', () => ({
  default: vi.fn().mockReturnValue({
    start: vi.fn().mockReturnThis(),
    succeed: vi.fn().mockReturnThis(),
    fail: vi.fn().mockReturnThis(),
    warn: vi.fn().mockReturnThis(),
    text: '',
  }),
}));

// Mock chalk
vi.mock('chalk', () => ({
  default: {
    green: (s: string) => s,
    red: (s: string) => s,
    yellow: (s: string) => s,
    blue: (s: string) => s,
    gray: (s: string) => s,
  },
}));

// Mock inquirer prompts
vi.mock('@inquirer/prompts', () => ({
  input: vi.fn().mockResolvedValue('test-project'),
  confirm: vi.fn().mockResolvedValue(false),
  checkbox: vi.fn().mockResolvedValue(['github', 'claude', 'cursor']),
}));

// Mock process.exit
const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => {
  throw new Error('process.exit called');
});

// Mock process.cwd
vi.spyOn(process, 'cwd').mockReturnValue('/mock/project');

describe('commands/init', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    // Setup default mocks for all tests
    vi.mocked(existsSync).mockReturnValue(false);
    vi.mocked(readFile).mockResolvedValue('{}');
    vi.mocked(readdir).mockResolvedValue([]);
    vi.mocked(mkdir).mockResolvedValue(undefined);
    vi.mocked(writeFile).mockResolvedValue(undefined);

    // Reset inquirer mocks to defaults
    vi.mocked(input).mockResolvedValue('test-project');
    vi.mocked(confirm).mockResolvedValue(false);
    vi.mocked(checkbox).mockResolvedValue(['github', 'claude', 'cursor']);
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe('initCommand', () => {
    it('should warn when already initialized', async () => {
      vi.mocked(existsSync).mockImplementation((path) => path === 'promptscript.yaml');

      await initCommand({});

      expect(existsSync).toHaveBeenCalledWith('promptscript.yaml');
      expect(writeFile).not.toHaveBeenCalled();
    });

    it('should reinitialize when --force is used', async () => {
      vi.mocked(existsSync).mockImplementation((path) => path === 'promptscript.yaml');

      await initCommand({ yes: true, force: true });

      expect(mkdir).toHaveBeenCalledWith('.promptscript', { recursive: true });
      expect(writeFile).toHaveBeenCalledTimes(2);
      expect(writeFile).toHaveBeenCalledWith(
        'promptscript.yaml',
        expect.stringContaining("version: '1'"),
        'utf-8'
      );
    });

    it('should create config and project files with --yes flag', async () => {
      await initCommand({ yes: true });

      expect(mkdir).toHaveBeenCalledWith('.promptscript', { recursive: true });
      expect(writeFile).toHaveBeenCalledTimes(2);
      expect(writeFile).toHaveBeenCalledWith(
        'promptscript.yaml',
        expect.stringContaining("version: '1'"),
        'utf-8'
      );
      expect(writeFile).toHaveBeenCalledWith(
        '.promptscript/project.prs',
        expect.stringContaining('@meta'),
        'utf-8'
      );
    });

    it('should use custom name when provided with --yes flag', async () => {
      await initCommand({ yes: true, name: 'custom-project' });

      expect(writeFile).toHaveBeenCalledWith(
        'promptscript.yaml',
        expect.stringContaining("id: 'custom-project'"),
        'utf-8'
      );
    });

    it('should include targets from options', async () => {
      await initCommand({ yes: true, targets: ['github', 'claude'] });

      expect(writeFile).toHaveBeenCalledWith(
        'promptscript.yaml',
        expect.stringContaining('- github'),
        'utf-8'
      );
      expect(writeFile).toHaveBeenCalledWith(
        'promptscript.yaml',
        expect.stringContaining('- claude'),
        'utf-8'
      );
    });

    it('should include inherit when provided', async () => {
      await initCommand({ yes: true, inherit: '@company/team' });

      expect(writeFile).toHaveBeenCalledWith(
        'promptscript.yaml',
        expect.stringContaining("inherit: '@company/team'"),
        'utf-8'
      );
    });

    it('should exit with error when write fails', async () => {
      vi.mocked(mkdir).mockRejectedValue(new Error('Permission denied'));

      await expect(initCommand({ yes: true })).rejects.toThrow('process.exit called');
      expect(mockExit).toHaveBeenCalledWith(1);
    });

    it('should include team when provided', async () => {
      await initCommand({ yes: true, team: 'myteam' });

      expect(writeFile).toHaveBeenCalledWith(
        'promptscript.yaml',
        expect.stringContaining("team: 'myteam'"),
        'utf-8'
      );
    });

    it('should include registry when provided', async () => {
      await initCommand({ yes: true, registry: './custom-registry' });

      expect(writeFile).toHaveBeenCalledWith(
        'promptscript.yaml',
        expect.stringContaining("path: './custom-registry'"),
        'utf-8'
      );
    });

    it('should use default registry when --yes flag without registry option', async () => {
      await initCommand({ yes: true });

      // The default registry path is ./registry when using --yes
      expect(writeFile).toHaveBeenCalledWith(
        'promptscript.yaml',
        expect.stringContaining("path: './registry'"),
        'utf-8'
      );
    });

    it('should use non-interactive mode with provided name and targets', async () => {
      await initCommand({
        interactive: false,
        name: 'my-project',
        targets: ['github', 'cursor'],
        team: 'frontend',
      });

      expect(writeFile).toHaveBeenCalledWith(
        'promptscript.yaml',
        expect.stringContaining("id: 'my-project'"),
        'utf-8'
      );
      expect(writeFile).toHaveBeenCalledWith(
        'promptscript.yaml',
        expect.stringContaining("team: 'frontend'"),
        'utf-8'
      );
      // Should not call inquirer prompts in non-interactive mode
      expect(input).not.toHaveBeenCalled();
    });

    it('should handle ExitPromptError gracefully (user cancellation)', async () => {
      const exitPromptError = new Error('User cancelled');
      exitPromptError.name = 'ExitPromptError';
      vi.mocked(input).mockRejectedValueOnce(exitPromptError);

      // Should not throw, just return
      await initCommand({ interactive: true });

      expect(writeFile).not.toHaveBeenCalled();
      expect(mockExit).not.toHaveBeenCalled();
    });

    it('should comment out inherit when not provided', async () => {
      await initCommand({ yes: true });

      expect(writeFile).toHaveBeenCalledWith(
        'promptscript.yaml',
        expect.stringContaining("# inherit: '@company/team'"),
        'utf-8'
      );
    });
  });

  describe('interactive mode', () => {
    it('should run interactive prompts when no --yes flag', async () => {
      vi.mocked(input).mockResolvedValue('interactive-project');
      vi.mocked(confirm).mockResolvedValue(false);
      vi.mocked(checkbox).mockResolvedValue(['github']);

      await initCommand({});

      expect(input).toHaveBeenCalled();
      expect(confirm).toHaveBeenCalled();
      expect(checkbox).toHaveBeenCalled();
      expect(writeFile).toHaveBeenCalledWith(
        'promptscript.yaml',
        expect.stringContaining("id: 'interactive-project'"),
        'utf-8'
      );
    });

    it('should ask for inheritance path when user wants to inherit', async () => {
      vi.mocked(input)
        .mockResolvedValueOnce('my-project') // project name
        .mockResolvedValueOnce('@company/team'); // inheritance path
      vi.mocked(confirm)
        .mockResolvedValueOnce(true) // wants inherit
        .mockResolvedValueOnce(false); // no registry
      vi.mocked(checkbox).mockResolvedValue(['github']);

      await initCommand({});

      // Verify inheritance path was included
      expect(writeFile).toHaveBeenCalledWith(
        'promptscript.yaml',
        expect.stringContaining("inherit: '@company/team'"),
        'utf-8'
      );
      // Team should be extracted from inherit path
      expect(writeFile).toHaveBeenCalledWith(
        'promptscript.yaml',
        expect.stringContaining("team: 'company'"),
        'utf-8'
      );
    });

    it('should ask for registry path when user wants registry', async () => {
      vi.mocked(input)
        .mockResolvedValueOnce('my-project') // project name
        .mockResolvedValueOnce('./my-registry'); // registry path
      vi.mocked(confirm)
        .mockResolvedValueOnce(false) // no inherit
        .mockResolvedValueOnce(true); // wants registry
      vi.mocked(checkbox).mockResolvedValue(['cursor']);

      await initCommand({});

      expect(writeFile).toHaveBeenCalledWith(
        'promptscript.yaml',
        expect.stringContaining("path: './my-registry'"),
        'utf-8'
      );
    });

    it('should not include registry when user declines', async () => {
      vi.mocked(input).mockResolvedValueOnce('my-project');
      vi.mocked(confirm)
        .mockResolvedValueOnce(false) // no inherit
        .mockResolvedValueOnce(false); // no registry
      vi.mocked(checkbox).mockResolvedValue(['github']);

      await initCommand({});

      // Should have commented out registry
      expect(writeFile).toHaveBeenCalledWith(
        'promptscript.yaml',
        expect.stringContaining('# registry:'),
        'utf-8'
      );
    });

    it('should use provided options as defaults in interactive prompts', async () => {
      vi.mocked(input)
        .mockResolvedValueOnce('from-prompt') // project name (overrides default)
        .mockResolvedValueOnce('@other/path'); // inheritance path
      vi.mocked(confirm)
        .mockResolvedValueOnce(true) // wants inherit
        .mockResolvedValueOnce(false); // no registry
      vi.mocked(checkbox).mockResolvedValue(['claude']);

      await initCommand({
        name: 'default-name',
        inherit: '@company/default',
      });

      // The input mock should be called (interactive mode)
      expect(input).toHaveBeenCalled();
    });
  });

  describe('generateProjectPs edge cases', () => {
    it('should include detected languages in project.prs', async () => {
      vi.mocked(existsSync).mockImplementation((path) => {
        // Simulate package.json exists with TypeScript
        return path === 'package.json' || path === 'tsconfig.json';
      });
      vi.mocked(readFile).mockImplementation(async (path) => {
        if (path === 'package.json') {
          return JSON.stringify({
            name: 'detected-project',
            devDependencies: { typescript: '^5.0.0' },
          });
        }
        return '{}';
      });

      await initCommand({ yes: true });

      expect(writeFile).toHaveBeenCalledWith(
        '.promptscript/project.prs',
        expect.stringContaining('languages:'),
        'utf-8'
      );
    });

    it('should comment out languages when none detected', async () => {
      await initCommand({ yes: true });

      expect(writeFile).toHaveBeenCalledWith(
        '.promptscript/project.prs',
        expect.stringContaining('# languages:'),
        'utf-8'
      );
    });

    it('should include detected frameworks in project.prs', async () => {
      vi.mocked(existsSync).mockImplementation((path) => {
        return path === 'package.json' || path === 'tsconfig.json';
      });
      vi.mocked(readFile).mockImplementation(async (path) => {
        if (path === 'package.json') {
          return JSON.stringify({
            name: 'react-project',
            dependencies: { react: '^18.0.0' },
            devDependencies: { typescript: '^5.0.0' },
          });
        }
        return '{}';
      });

      await initCommand({ yes: true });

      expect(writeFile).toHaveBeenCalledWith(
        '.promptscript/project.prs',
        expect.stringContaining('frameworks:'),
        'utf-8'
      );
    });

    it('should comment out frameworks when none detected', async () => {
      await initCommand({ yes: true });

      expect(writeFile).toHaveBeenCalledWith(
        '.promptscript/project.prs',
        expect.stringContaining('# frameworks:'),
        'utf-8'
      );
    });
  });
});
