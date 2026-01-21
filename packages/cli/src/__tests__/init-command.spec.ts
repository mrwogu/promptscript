import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { initCommand } from '../commands/init.js';
import { type CliServices } from '../services.js';

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

// Mock process.exit
const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => {
  throw new Error('process.exit called');
});

// Mock process.cwd
vi.spyOn(process, 'cwd').mockReturnValue('/mock/project');

describe('commands/init', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;
  let mockServices: CliServices;
  let mockFs: {
    existsSync: any;
    writeFile: any;
    mkdir: any;
    readFile: any;
    readdir: any;
  };
  let mockPrompts: {
    input: any;
    confirm: any;
    checkbox: any;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    mockFs = {
      existsSync: vi.fn().mockReturnValue(false),
      writeFile: vi.fn().mockResolvedValue(undefined),
      mkdir: vi.fn().mockResolvedValue(undefined),
      readFile: vi.fn().mockResolvedValue('{}'),
      readdir: vi.fn().mockResolvedValue([]),
    };

    mockPrompts = {
      input: vi.fn().mockResolvedValue('test-project'),
      confirm: vi.fn().mockResolvedValue(false),
      checkbox: vi.fn().mockResolvedValue(['github', 'claude', 'cursor']),
    };

    mockServices = {
      fs: mockFs as any,
      prompts: mockPrompts as any,
      cwd: '/mock/project',
    };
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe('initCommand', () => {
    it('should warn when already initialized', async () => {
      mockFs.existsSync.mockImplementation((path: string) => path === 'promptscript.yaml');

      await initCommand({}, mockServices);

      expect(mockFs.existsSync).toHaveBeenCalledWith('promptscript.yaml');
      expect(mockFs.writeFile).not.toHaveBeenCalled();
    });

    it('should reinitialize when --force is used', async () => {
      mockFs.existsSync.mockImplementation((path: string) => path === 'promptscript.yaml');

      await initCommand({ yes: true, force: true }, mockServices);

      expect(mockFs.mkdir).toHaveBeenCalledWith('.promptscript', { recursive: true });
      expect(mockFs.writeFile).toHaveBeenCalledTimes(2);
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        'promptscript.yaml',
        expect.stringContaining("version: '1'"),
        'utf-8'
      );
    });

    it('should create config and project files with --yes flag', async () => {
      await initCommand({ yes: true }, mockServices);

      expect(mockFs.mkdir).toHaveBeenCalledWith('.promptscript', { recursive: true });
      expect(mockFs.writeFile).toHaveBeenCalledTimes(2);
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        'promptscript.yaml',
        expect.stringContaining("version: '1'"),
        'utf-8'
      );
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        '.promptscript/project.prs',
        expect.stringContaining('@meta'),
        'utf-8'
      );
    });

    it('should use custom name when provided with --yes flag', async () => {
      await initCommand({ yes: true, name: 'custom-project' }, mockServices);

      expect(mockFs.writeFile).toHaveBeenCalledWith(
        'promptscript.yaml',
        expect.stringContaining("id: 'custom-project'"),
        'utf-8'
      );
    });

    it('should include targets from options', async () => {
      await initCommand({ yes: true, targets: ['github', 'claude'] }, mockServices);

      expect(mockFs.writeFile).toHaveBeenCalledWith(
        'promptscript.yaml',
        expect.stringContaining('- github'),
        'utf-8'
      );
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        'promptscript.yaml',
        expect.stringContaining('- claude'),
        'utf-8'
      );
    });

    it('should include inherit when provided', async () => {
      await initCommand({ yes: true, inherit: '@company/team' }, mockServices);

      expect(mockFs.writeFile).toHaveBeenCalledWith(
        'promptscript.yaml',
        expect.stringContaining("inherit: '@company/team'"),
        'utf-8'
      );
    });

    it('should exit with error when write fails', async () => {
      mockFs.mkdir.mockRejectedValue(new Error('Permission denied'));

      await expect(initCommand({ yes: true }, mockServices)).rejects.toThrow('process.exit called');
      expect(mockExit).toHaveBeenCalledWith(1);
    });

    it('should include team when provided', async () => {
      await initCommand({ yes: true, team: 'myteam' }, mockServices);

      expect(mockFs.writeFile).toHaveBeenCalledWith(
        'promptscript.yaml',
        expect.stringContaining("team: 'myteam'"),
        'utf-8'
      );
    });

    it('should include registry when provided', async () => {
      await initCommand({ yes: true, registry: './custom-registry' }, mockServices);

      expect(mockFs.writeFile).toHaveBeenCalledWith(
        'promptscript.yaml',
        expect.stringContaining("path: './custom-registry'"),
        'utf-8'
      );
    });

    it('should use default registry when --yes flag without registry option', async () => {
      await initCommand({ yes: true }, mockServices);

      // The default registry path is ./registry when using --yes
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        'promptscript.yaml',
        expect.stringContaining("path: './registry'"),
        'utf-8'
      );
    });

    it('should use non-interactive mode with provided name and targets', async () => {
      await initCommand(
        {
          interactive: false,
          name: 'my-project',
          targets: ['github', 'cursor'],
          team: 'frontend',
        },
        mockServices
      );

      expect(mockFs.writeFile).toHaveBeenCalledWith(
        'promptscript.yaml',
        expect.stringContaining("id: 'my-project'"),
        'utf-8'
      );
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        'promptscript.yaml',
        expect.stringContaining("team: 'frontend'"),
        'utf-8'
      );
      // Should not call inquirer prompts in non-interactive mode
      expect(mockPrompts.input).not.toHaveBeenCalled();
    });

    it('should handle ExitPromptError gracefully (user cancellation)', async () => {
      const exitPromptError = new Error('User cancelled');
      exitPromptError.name = 'ExitPromptError';
      mockPrompts.input.mockRejectedValueOnce(exitPromptError);

      // Should not throw, just return
      await initCommand({ interactive: true }, mockServices);

      expect(mockFs.writeFile).not.toHaveBeenCalled();
      expect(mockExit).not.toHaveBeenCalled();
    });

    it('should comment out inherit when not provided', async () => {
      await initCommand({ yes: true }, mockServices);

      expect(mockFs.writeFile).toHaveBeenCalledWith(
        'promptscript.yaml',
        expect.stringContaining("# inherit: '@company/team'"),
        'utf-8'
      );
    });
  });

  describe('interactive mode', () => {
    it('should run interactive prompts when no --yes flag', async () => {
      mockPrompts.input.mockResolvedValue('interactive-project');
      mockPrompts.confirm.mockResolvedValue(false);
      mockPrompts.checkbox.mockResolvedValue(['github']);

      await initCommand({}, mockServices);

      expect(mockPrompts.input).toHaveBeenCalled();
      expect(mockPrompts.confirm).toHaveBeenCalled();
      expect(mockPrompts.checkbox).toHaveBeenCalled();
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        'promptscript.yaml',
        expect.stringContaining("id: 'interactive-project'"),
        'utf-8'
      );
    });

    it('should ask for inheritance path when user wants to inherit', async () => {
      mockPrompts.input
        .mockResolvedValueOnce('my-project') // project name
        .mockResolvedValueOnce('@company/team'); // inheritance path
      mockPrompts.confirm
        .mockResolvedValueOnce(true) // wants inherit
        .mockResolvedValueOnce(false); // no registry
      mockPrompts.checkbox.mockResolvedValue(['github']);

      await initCommand({}, mockServices);

      // Verify inheritance path was included
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        'promptscript.yaml',
        expect.stringContaining("inherit: '@company/team'"),
        'utf-8'
      );
      // Team should be extracted from inherit path
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        'promptscript.yaml',
        expect.stringContaining("team: 'company'"),
        'utf-8'
      );
    });

    it('should ask for registry path when user wants registry', async () => {
      mockPrompts.input
        .mockResolvedValueOnce('my-project') // project name
        .mockResolvedValueOnce('./my-registry'); // registry path
      mockPrompts.confirm
        .mockResolvedValueOnce(false) // no inherit
        .mockResolvedValueOnce(true); // wants registry
      mockPrompts.checkbox.mockResolvedValue(['cursor']);

      await initCommand({}, mockServices);

      expect(mockFs.writeFile).toHaveBeenCalledWith(
        'promptscript.yaml',
        expect.stringContaining("path: './my-registry'"),
        'utf-8'
      );
    });

    it('should not include registry when user declines', async () => {
      mockPrompts.input.mockResolvedValueOnce('my-project');
      mockPrompts.confirm
        .mockResolvedValueOnce(false) // no inherit
        .mockResolvedValueOnce(false); // no registry
      mockPrompts.checkbox.mockResolvedValue(['github']);

      await initCommand({}, mockServices);

      // Should have commented out registry
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        'promptscript.yaml',
        expect.stringContaining('# registry:'),
        'utf-8'
      );
    });

    it('should use provided options as defaults in interactive prompts', async () => {
      mockPrompts.input
        .mockResolvedValueOnce('from-prompt') // project name (overrides default)
        .mockResolvedValueOnce('@other/path'); // inheritance path
      mockPrompts.confirm
        .mockResolvedValueOnce(true) // wants inherit
        .mockResolvedValueOnce(false); // no registry
      mockPrompts.checkbox.mockResolvedValue(['claude']);

      await initCommand(
        {
          name: 'default-name',
          inherit: '@company/default',
        },
        mockServices
      );

      // The input mock should be called (interactive mode)
      expect(mockPrompts.input).toHaveBeenCalled();
    });
  });

  describe('generateProjectPs edge cases', () => {
    it('should include detected languages in project.prs', async () => {
      mockFs.existsSync.mockImplementation((path: string) => {
        // Simulate package.json exists with TypeScript
        return path === 'package.json' || path === 'tsconfig.json';
      });
      mockFs.readFile.mockImplementation(async (path: string) => {
        if (path === 'package.json') {
          return JSON.stringify({
            name: 'detected-project',
            devDependencies: { typescript: '^5.0.0' },
          });
        }
        return '{}';
      });

      await initCommand({ yes: true }, mockServices);

      expect(mockFs.writeFile).toHaveBeenCalledWith(
        '.promptscript/project.prs',
        expect.stringContaining('languages:'),
        'utf-8'
      );
    });

    it('should comment out languages when none detected', async () => {
      await initCommand({ yes: true }, mockServices);

      expect(mockFs.writeFile).toHaveBeenCalledWith(
        '.promptscript/project.prs',
        expect.stringContaining('# languages:'),
        'utf-8'
      );
    });

    it('should include detected frameworks in project.prs', async () => {
      mockFs.existsSync.mockImplementation((path: string) => {
        return path === 'package.json' || path === 'tsconfig.json';
      });
      mockFs.readFile.mockImplementation(async (path: string) => {
        if (path === 'package.json') {
          return JSON.stringify({
            name: 'react-project',
            dependencies: { react: '^18.0.0' },
            devDependencies: { typescript: '^5.0.0' },
          });
        }
        return '{}';
      });

      await initCommand({ yes: true }, mockServices);

      expect(mockFs.writeFile).toHaveBeenCalledWith(
        '.promptscript/project.prs',
        expect.stringContaining('frameworks:'),
        'utf-8'
      );
    });

    it('should comment out frameworks when none detected', async () => {
      await initCommand({ yes: true }, mockServices);

      expect(mockFs.writeFile).toHaveBeenCalledWith(
        '.promptscript/project.prs',
        expect.stringContaining('# frameworks:'),
        'utf-8'
      );
    });
  });
});
