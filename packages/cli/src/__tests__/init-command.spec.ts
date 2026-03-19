import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { initCommand } from '../commands/init.js';
import { type CliServices } from '../services.js';

// Mock prettier/loader
const mockFindPrettierConfig = vi.fn();
vi.mock('../prettier/loader.js', () => ({
  findPrettierConfig: () => mockFindPrettierConfig(),
}));

// Mock manifest-loader (partially)
const mockLoadManifestFromUrl = vi.fn();
vi.mock('../utils/manifest-loader.js', async (importOriginal) => {
  const original = (await importOriginal()) as Record<string, unknown>;
  return {
    ...original,
    loadManifestFromUrl: (...args: unknown[]) => mockLoadManifestFromUrl(...args),
  };
});

// Mock user-config
const mockLoadUserConfig = vi.fn();
vi.mock('../config/user-config.js', () => ({
  loadUserConfig: (...args: unknown[]) => mockLoadUserConfig(...args),
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

// Mock process.cwd
vi.spyOn(process, 'cwd').mockReturnValue('/mock/project');

describe('commands/init', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;
  let mockServices: CliServices;
  let mockFs: {
    existsSync: ReturnType<typeof vi.fn>;
    writeFile: ReturnType<typeof vi.fn>;
    mkdir: ReturnType<typeof vi.fn>;
    readFile: ReturnType<typeof vi.fn>;
    readdir: ReturnType<typeof vi.fn>;
  };
  let mockPrompts: {
    input: ReturnType<typeof vi.fn>;
    confirm: ReturnType<typeof vi.fn>;
    checkbox: ReturnType<typeof vi.fn>;
    select: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    process.exitCode = undefined;
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    // Default: no Prettier config found
    mockFindPrettierConfig.mockReturnValue(null);
    // Default: no user config
    mockLoadUserConfig.mockResolvedValue({ version: '1' });
    // Default: manifest fetch fails
    mockLoadManifestFromUrl.mockRejectedValue(new Error('not available'));

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
      select: vi.fn().mockResolvedValue('skip'), // default: skip registry
    };

    mockServices = {
      fs: mockFs as unknown as CliServices['fs'],
      prompts: mockPrompts as unknown as CliServices['prompts'],
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
        expect.stringContaining('syntax:'),
        'utf-8'
      );
    });

    it('should create config and project files with --yes flag', async () => {
      await initCommand({ yes: true }, mockServices);

      expect(mockFs.mkdir).toHaveBeenCalledWith('.promptscript', { recursive: true });
      expect(mockFs.writeFile).toHaveBeenCalledTimes(2);
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        'promptscript.yaml',
        expect.stringContaining('syntax:'),
        'utf-8'
      );
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        '.promptscript/project.prs',
        expect.stringContaining('@meta'),
        'utf-8'
      );
    });

    it('should not include top-level entry field (default path is implicit)', async () => {
      await initCommand({ yes: true }, mockServices);

      const yamlCall = mockFs.writeFile.mock.calls.find(
        (call: unknown[]) => call[0] === 'promptscript.yaml'
      );
      expect(yamlCall).toBeDefined();
      expect(yamlCall![1]).not.toContain('entry:');
    });

    it('should use custom name when provided with --yes flag', async () => {
      await initCommand({ yes: true, name: 'custom-project' }, mockServices);

      expect(mockFs.writeFile).toHaveBeenCalledWith(
        'promptscript.yaml',
        expect.stringContaining('id: custom-project'),
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

      await initCommand({ yes: true }, mockServices);
      expect(process.exitCode).toBe(1);
    });

    it('should accept team option without error', async () => {
      await initCommand({ yes: true, team: 'myteam' }, mockServices);

      // Team is used internally but not output to promptscript.yaml
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        'promptscript.yaml',
        expect.any(String),
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

    it('should skip registry when --yes flag without registry option', async () => {
      await initCommand({ yes: true }, mockServices);

      // No registry configured by default - should show commented-out placeholder
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        'promptscript.yaml',
        expect.stringContaining('# registry:'),
        'utf-8'
      );
    });

    it('should use local registry when --yes flag with --registry option', async () => {
      await initCommand({ yes: true, registry: './my-registry' }, mockServices);

      // Local registry when --registry is specified
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        'promptscript.yaml',
        expect.stringContaining("path: './my-registry'"),
        'utf-8'
      );
    });

    it('should use env var PROMPTSCRIPT_REGISTRY_GIT_URL when --yes flag', async () => {
      const originalEnv = process.env['PROMPTSCRIPT_REGISTRY_GIT_URL'];
      process.env['PROMPTSCRIPT_REGISTRY_GIT_URL'] = 'https://github.com/my-org/my-registry.git';

      try {
        await initCommand({ yes: true }, mockServices);

        expect(mockFs.writeFile).toHaveBeenCalledWith(
          'promptscript.yaml',
          expect.stringContaining('https://github.com/my-org/my-registry.git'),
          'utf-8'
        );
      } finally {
        if (originalEnv === undefined) {
          delete process.env['PROMPTSCRIPT_REGISTRY_GIT_URL'];
        } else {
          process.env['PROMPTSCRIPT_REGISTRY_GIT_URL'] = originalEnv;
        }
      }
    });

    it('should fetch and apply manifest suggestions when registry is configured', async () => {
      const originalEnv = process.env['PROMPTSCRIPT_REGISTRY_GIT_URL'];
      process.env['PROMPTSCRIPT_REGISTRY_GIT_URL'] = 'https://github.com/my-org/my-registry.git';

      mockLoadManifestFromUrl.mockResolvedValue({
        manifest: {
          version: '1',
          meta: { name: 'Test', description: 'Test', lastUpdated: '2026-01-01' },
          namespaces: {
            '@core': { description: 'Core', priority: 100 },
          },
          catalog: [
            {
              id: '@core/base',
              path: '@core/base.prs',
              name: 'Base',
              description: 'Base config',
              tags: ['core'],
              targets: ['github'],
              dependencies: [],
              detectionHints: { always: true },
            },
          ],
          suggestionRules: [],
        },
      });

      try {
        await initCommand({ yes: true }, mockServices);

        expect(mockLoadManifestFromUrl).toHaveBeenCalled();
        expect(mockFs.writeFile).toHaveBeenCalledWith(
          'promptscript.yaml',
          expect.stringContaining('https://github.com/my-org/my-registry.git'),
          'utf-8'
        );
      } finally {
        if (originalEnv === undefined) {
          delete process.env['PROMPTSCRIPT_REGISTRY_GIT_URL'];
        } else {
          process.env['PROMPTSCRIPT_REGISTRY_GIT_URL'] = originalEnv;
        }
      }
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
        expect.stringContaining('id: my-project'),
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
      expect(process.exitCode).toBeUndefined();
    });

    it('should skip registry and suggestions in --yes mode without local manifest', async () => {
      await initCommand({ yes: true }, mockServices);

      // Check that promptscript.yaml was written with commented-out inherit (no manifest available)
      const yamlCall = mockFs.writeFile.mock.calls.find(
        (call: unknown[]) => call[0] === 'promptscript.yaml'
      );
      expect(yamlCall).toBeDefined();
      expect(yamlCall![1]).toContain("# inherit: '@stacks/react'");
    });
  });

  describe('interactive mode', () => {
    it('should run interactive prompts when no --yes flag', async () => {
      mockPrompts.input.mockResolvedValue('interactive-project');
      mockPrompts.select.mockResolvedValue('skip'); // skip registry
      mockPrompts.confirm.mockResolvedValue(false); // no inherit
      mockPrompts.checkbox.mockResolvedValue(['github']);

      await initCommand({}, mockServices);

      expect(mockPrompts.input).toHaveBeenCalled();
      expect(mockPrompts.select).toHaveBeenCalled();
      expect(mockPrompts.checkbox).toHaveBeenCalled();
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        'promptscript.yaml',
        expect.stringContaining('id: interactive-project'),
        'utf-8'
      );
    });

    it('should ask for inheritance path when user wants to inherit', async () => {
      mockPrompts.input
        .mockResolvedValueOnce('my-project') // project name
        .mockResolvedValueOnce('@company/team'); // inheritance path
      mockPrompts.select.mockResolvedValue('skip'); // skip registry
      mockPrompts.confirm.mockResolvedValueOnce(true); // wants inherit
      mockPrompts.checkbox.mockResolvedValue(['github']);

      await initCommand({}, mockServices);

      // Verify inheritance path was included
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        'promptscript.yaml',
        expect.stringContaining("inherit: '@company/team'"),
        'utf-8'
      );
    });

    it('should ask for registry path when user wants local registry', async () => {
      mockPrompts.input
        .mockResolvedValueOnce('my-project') // project name
        .mockResolvedValueOnce('./my-registry'); // registry path
      mockPrompts.select.mockResolvedValue('local'); // local registry
      mockPrompts.confirm.mockResolvedValue(false); // no inherit
      mockPrompts.checkbox.mockResolvedValue(['cursor']);

      await initCommand({}, mockServices);

      expect(mockFs.writeFile).toHaveBeenCalledWith(
        'promptscript.yaml',
        expect.stringContaining("path: './my-registry'"),
        'utf-8'
      );
    });

    it('should configure git registry when user selects custom-git', async () => {
      mockPrompts.input
        .mockResolvedValueOnce('my-project') // project name
        .mockResolvedValueOnce('https://github.com/my-org/my-registry.git') // git url
        .mockResolvedValueOnce('main'); // branch
      mockPrompts.select.mockResolvedValue('custom-git'); // custom git registry
      mockPrompts.confirm.mockResolvedValue(false); // no inherit
      mockPrompts.checkbox.mockResolvedValue(['github']);

      await initCommand({}, mockServices);

      // Should have git registry configuration
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        'promptscript.yaml',
        expect.stringContaining('git:'),
        'utf-8'
      );
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        'promptscript.yaml',
        expect.stringContaining('my-org/my-registry'),
        'utf-8'
      );
    });

    it('should not include registry when user skips', async () => {
      mockPrompts.input.mockResolvedValueOnce('my-project');
      mockPrompts.select.mockResolvedValue('skip'); // skip registry
      mockPrompts.confirm.mockResolvedValue(false); // no inherit
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
      mockPrompts.select.mockResolvedValue('skip'); // skip registry
      mockPrompts.confirm.mockResolvedValueOnce(true); // wants inherit
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

  describe('--migrate flag', () => {
    it('should install migration skill to .promptscript/skills when --migrate is used', async () => {
      await initCommand({ yes: true, targets: ['claude'], migrate: true }, mockServices);

      expect(mockFs.mkdir).toHaveBeenCalledWith('.promptscript/skills/promptscript', {
        recursive: true,
      });
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        '.promptscript/skills/promptscript/SKILL.md',
        expect.stringContaining('promptscript'),
        'utf-8'
      );
    });

    it('should install same skill regardless of target', async () => {
      await initCommand(
        {
          yes: true,
          targets: ['github', 'claude', 'cursor', 'antigravity', 'factory'],
          migrate: true,
        },
        mockServices
      );

      // Only one skill installed to .promptscript/skills/ (auto-discovery handles targets)
      expect(mockFs.mkdir).toHaveBeenCalledWith('.promptscript/skills/promptscript', {
        recursive: true,
      });
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        '.promptscript/skills/promptscript/SKILL.md',
        expect.stringContaining('promptscript'),
        'utf-8'
      );
    });

    it('should not install migration skill when --migrate is not used', async () => {
      await initCommand({ yes: true, targets: ['github', 'claude'] }, mockServices);

      expect(mockFs.mkdir).not.toHaveBeenCalledWith('.promptscript/skills/promptscript', {
        recursive: true,
      });
    });

    it('should show migration skill path in output when --migrate is used', async () => {
      await initCommand({ yes: true, targets: ['claude'], migrate: true }, mockServices);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('.promptscript/skills/promptscript/SKILL.md')
      );
    });

    it('should show migration-specific next steps when --migrate is used', async () => {
      await initCommand({ yes: true, targets: ['claude'], migrate: true }, mockServices);

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('/promptscript'));
    });
  });

  describe('Prettier detection', () => {
    it('should add formatting: prettier: true when Prettier config is detected', async () => {
      mockFindPrettierConfig.mockReturnValue('/mock/project/.prettierrc');

      await initCommand({ yes: true }, mockServices);

      expect(mockFs.writeFile).toHaveBeenCalledWith(
        'promptscript.yaml',
        expect.stringContaining('formatting:'),
        'utf-8'
      );
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        'promptscript.yaml',
        expect.stringContaining('prettier: true'),
        'utf-8'
      );
    });

    it('should add default formatting options when no Prettier config found', async () => {
      mockFindPrettierConfig.mockReturnValue(null);

      await initCommand({ yes: true }, mockServices);

      expect(mockFs.writeFile).toHaveBeenCalledWith(
        'promptscript.yaml',
        expect.stringContaining('formatting:'),
        'utf-8'
      );
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        'promptscript.yaml',
        expect.stringContaining('tabWidth: 2'),
        'utf-8'
      );
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        'promptscript.yaml',
        expect.stringContaining('proseWrap: preserve'),
        'utf-8'
      );
    });

    it('should include Auto-detected comment when Prettier config found', async () => {
      mockFindPrettierConfig.mockReturnValue('/mock/project/.prettierrc.json');

      await initCommand({ yes: true }, mockServices);

      expect(mockFs.writeFile).toHaveBeenCalledWith(
        'promptscript.yaml',
        expect.stringContaining('# Auto-detected from project'),
        'utf-8'
      );
    });

    it('should show Prettier detection in interactive mode', async () => {
      mockFindPrettierConfig.mockReturnValue('/mock/project/.prettierrc');
      mockPrompts.input.mockResolvedValue('test-project');
      mockPrompts.select.mockResolvedValue('skip'); // skip registry
      mockPrompts.confirm.mockResolvedValue(false); // no inherit
      mockPrompts.checkbox.mockResolvedValue(['github']);

      await initCommand({}, mockServices);

      // Should show Prettier detection info during interactive prompts
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Prettier: /mock/project/.prettierrc')
      );
    });
  });
});
