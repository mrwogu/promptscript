import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { parse as parseYaml } from 'yaml';
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
    readFileSync: ReturnType<typeof vi.fn>;
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
    delete process.env['PROMPTSCRIPT_CONFIG'];
    consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    // Default: no Prettier config found
    mockFindPrettierConfig.mockReturnValue(null);
    // Default: no user config
    mockLoadUserConfig.mockResolvedValue({
      version: '1',
      defaults: { targets: ['github'] },
    });
    // Default: manifest fetch fails
    mockLoadManifestFromUrl.mockRejectedValue(new Error('not available'));

    mockFs = {
      existsSync: vi.fn().mockReturnValue(false),
      writeFile: vi.fn().mockResolvedValue(undefined),
      mkdir: vi.fn().mockResolvedValue(undefined),
      readFile: vi.fn().mockResolvedValue('{}'),
      readdir: vi.fn().mockResolvedValue([]),
      readFileSync: vi.fn().mockReturnValue(''),
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
    delete process.env['PROMPTSCRIPT_CONFIG'];
  });

  describe('initCommand', () => {
    it('should set exit code 2 when already initialized', async () => {
      mockFs.existsSync.mockImplementation((path: string) => path === 'promptscript.yaml');

      await initCommand({}, mockServices);

      expect(mockFs.existsSync).toHaveBeenCalledWith('promptscript.yaml');
      expect(mockFs.writeFile).not.toHaveBeenCalled();
      expect(process.exitCode).toBe(2);
    });

    it('should recognize alternate configuration file names', async () => {
      mockFs.existsSync.mockImplementation((path: string) => path === '.promptscriptrc.yml');

      await initCommand({}, mockServices);

      expect(mockFs.writeFile).not.toHaveBeenCalled();
      expect(process.exitCode).toBe(2);
    });

    it('should recognize PROMPTSCRIPT_CONFIG', async () => {
      process.env['PROMPTSCRIPT_CONFIG'] = 'custom-config.yaml';
      mockFs.existsSync.mockImplementation((path: string) => path === 'custom-config.yaml');

      await initCommand({}, mockServices);

      expect(mockFs.writeFile).not.toHaveBeenCalled();
      expect(process.exitCode).toBe(2);
    });

    it('should reinitialize when --force is used', async () => {
      mockFs.existsSync.mockImplementation((path: string) => path === 'promptscript.yaml');

      await initCommand({ yes: true, force: true }, mockServices);

      expect(mockFs.mkdir).toHaveBeenCalledWith('.promptscript', { recursive: true });
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

    it('should preserve the existing configuration file name when forced', async () => {
      mockFs.existsSync.mockImplementation((path: string) => path === '.promptscriptrc.yml');

      await initCommand({ yes: true, force: true }, mockServices);

      expect(mockFs.writeFile).toHaveBeenCalledWith(
        '.promptscriptrc.yml',
        expect.stringContaining('syntax:'),
        'utf-8'
      );
      expect(mockFs.writeFile).not.toHaveBeenCalledWith(
        'promptscript.yaml',
        expect.anything(),
        'utf-8'
      );
    });

    it('should back up an existing configuration before reinitializing', async () => {
      mockFs.existsSync.mockImplementation((path: string) => path === 'promptscript.yaml');
      mockFs.readFile.mockResolvedValue('id: existing\nsyntax: "1.4.0"\ntargets:\n  - github\n');
      mockFs.readFileSync.mockReturnValue('id: existing\nsyntax: "1.4.0"\ntargets:\n  - github\n');

      await initCommand({ yes: true, backup: true }, mockServices);

      expect(mockFs.writeFile).toHaveBeenCalledWith(
        expect.stringMatching(/\.prs-backup\/.+\/promptscript\.yaml$/),
        expect.stringContaining('id: existing'),
        'utf-8'
      );
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        'promptscript.yaml',
        expect.stringContaining('syntax:'),
        'utf-8'
      );
    });

    it('should create config and project files with --yes flag', async () => {
      await initCommand({ yes: true }, mockServices);

      expect(mockFs.mkdir).toHaveBeenCalledWith('.promptscript', { recursive: true });
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

    it('should require explicit targets in --yes mode when none are detected or configured', async () => {
      mockLoadUserConfig.mockResolvedValue({ version: '1' });

      await initCommand({ yes: true }, mockServices);

      expect(process.exitCode).toBe(1);
      expect(mockFs.writeFile).not.toHaveBeenCalled();
    });

    it('should reject --interactive combined with --yes', async () => {
      await initCommand({ interactive: true, yes: true }, mockServices);

      expect(process.exitCode).toBe(1);
      expect(mockFs.writeFile).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Cannot use --interactive with --yes')
      );
    });

    it('should preview all files without writing in dry-run mode', async () => {
      await initCommand({ yes: true, dryRun: true }, mockServices);

      expect(process.exitCode).toBeUndefined();
      expect(mockFs.writeFile).not.toHaveBeenCalled();
    });

    it('should not create backups during dry-run', async () => {
      mockFs.existsSync.mockImplementation((path: string) => path === 'promptscript.yaml');
      mockFs.readFile.mockResolvedValue('id: existing\nsyntax: "1.4.0"\ntargets:\n  - github\n');

      await initCommand({ yes: true, backup: true, dryRun: true }, mockServices);

      expect(process.exitCode).toBeUndefined();
      expect(mockFs.writeFile).not.toHaveBeenCalled();
      expect(mockFs.mkdir).not.toHaveBeenCalled();
    });

    it('should serialize special project names as valid YAML and PromptScript strings', async () => {
      const projectName = 'api: "quoted" # service';

      await initCommand({ yes: true, name: projectName }, mockServices);

      const yamlCall = mockFs.writeFile.mock.calls.find(
        (call: unknown[]) => call[0] === 'promptscript.yaml'
      );
      const prsCall = mockFs.writeFile.mock.calls.find(
        (call: unknown[]) => call[0] === '.promptscript/project.prs'
      );
      expect(parseYaml(yamlCall?.[1] as string)).toMatchObject({ id: projectName });
      expect(prsCall?.[1]).toContain(JSON.stringify(projectName));
    });

    it('should reject empty and multiline project metadata before writing', async () => {
      await initCommand({ yes: true, name: '   ' }, mockServices);

      expect(process.exitCode).toBe(1);
      expect(mockFs.writeFile).not.toHaveBeenCalled();

      process.exitCode = undefined;
      await initCommand({ yes: true, name: 'valid', team: 'team\nother' }, mockServices);

      expect(process.exitCode).toBe(1);
      expect(mockFs.writeFile).not.toHaveBeenCalled();
    });

    it('should reject multiline PromptScript directives before writing', async () => {
      await initCommand({ yes: true, inherit: '@company/base\n@use @malicious' }, mockServices);

      expect(process.exitCode).toBe(1);
      expect(mockFs.writeFile).not.toHaveBeenCalled();
    });

    it('should generate promptscript.yaml without comments or placeholder sections', async () => {
      await initCommand({ yes: true }, mockServices);

      const yamlCall = mockFs.writeFile.mock.calls.find(
        (call: unknown[]) => call[0] === 'promptscript.yaml'
      );
      expect(yamlCall?.[1]).not.toContain('#');
      expect(yamlCall?.[1]).not.toContain('inherit:');
      expect(yamlCall?.[1]).not.toContain('registry:');
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

      const yamlCall = mockFs.writeFile.mock.calls.find(
        (call: unknown[]) => call[0] === 'promptscript.yaml'
      );
      expect(parseYaml(yamlCall?.[1] as string)).toMatchObject({
        inherit: '@company/team',
      });
    });

    it('should exit with error when write fails', async () => {
      mockFs.mkdir.mockRejectedValue(new Error('Permission denied'));

      await initCommand({ yes: true }, mockServices);
      expect(process.exitCode).toBe(1);
    });

    it('should include the team namespace in project metadata', async () => {
      await initCommand({ yes: true, team: 'myteam' }, mockServices);

      const projectCall = mockFs.writeFile.mock.calls.find(
        (call: unknown[]) => call[0] === '.promptscript/project.prs'
      );
      expect(projectCall?.[1]).toContain('team: "myteam"');
    });

    it('should use the configured team default with --yes', async () => {
      mockLoadUserConfig.mockResolvedValue({
        version: '1',
        defaults: { targets: ['github'], team: 'platform' },
      });

      await initCommand({ yes: true }, mockServices);

      const projectCall = mockFs.writeFile.mock.calls.find(
        (call: unknown[]) => call[0] === '.promptscript/project.prs'
      );
      expect(projectCall?.[1]).toContain('team: "platform"');
    });

    it('should include registry when provided', async () => {
      await initCommand({ yes: true, registry: './custom-registry' }, mockServices);

      const yamlCall = mockFs.writeFile.mock.calls.find(
        (call: unknown[]) => call[0] === 'promptscript.yaml'
      );
      expect(parseYaml(yamlCall?.[1] as string)).toMatchObject({
        registry: { path: './custom-registry' },
      });
    });

    it('should omit registry when --yes flag has no registry option', async () => {
      await initCommand({ yes: true }, mockServices);

      const yamlCall = mockFs.writeFile.mock.calls.find(
        (call: unknown[]) => call[0] === 'promptscript.yaml'
      );
      expect(yamlCall?.[1]).not.toContain('registry:');
    });

    it('should use local registry when --yes flag with --registry option', async () => {
      await initCommand({ yes: true, registry: './my-registry' }, mockServices);

      // Local registry when --registry is specified
      const yamlCall = mockFs.writeFile.mock.calls.find(
        (call: unknown[]) => call[0] === 'promptscript.yaml'
      );
      expect(parseYaml(yamlCall?.[1] as string)).toMatchObject({
        registry: { path: './my-registry' },
      });
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

    it('should include suggested skills as @use directives in project.prs', async () => {
      const originalEnv = process.env['PROMPTSCRIPT_REGISTRY_GIT_URL'];
      process.env['PROMPTSCRIPT_REGISTRY_GIT_URL'] = 'https://github.com/my-org/my-registry.git';

      mockLoadManifestFromUrl.mockResolvedValue({
        manifest: {
          version: '1',
          meta: { name: 'Test', description: 'Test', lastUpdated: '2026-01-01' },
          namespaces: { '@core': { description: 'Core', priority: 100 } },
          catalog: [],
          suggestionRules: [
            {
              condition: { always: true },
              suggest: { skills: ['@skills/code-review', '@skills/deploy'] },
            },
          ],
        },
      });

      try {
        await initCommand({ yes: true }, mockServices);

        const prsCall = mockFs.writeFile.mock.calls.find(
          (call: unknown[]) =>
            typeof call[0] === 'string' && (call[0] as string).includes('project.prs')
        );
        expect(prsCall).toBeDefined();
        const prsContent = prsCall![1] as string;
        expect(prsContent).toContain('@use @skills/code-review');
        expect(prsContent).toContain('@use @skills/deploy');
      } finally {
        if (originalEnv === undefined) {
          delete process.env['PROMPTSCRIPT_REGISTRY_GIT_URL'];
        } else {
          process.env['PROMPTSCRIPT_REGISTRY_GIT_URL'] = originalEnv;
        }
      }
    });

    it('should omit inheritance in --yes mode without local manifest', async () => {
      await initCommand({ yes: true }, mockServices);

      const yamlCall = mockFs.writeFile.mock.calls.find(
        (call: unknown[]) => call[0] === 'promptscript.yaml'
      );
      expect(yamlCall).toBeDefined();
      expect(yamlCall![1]).not.toContain('inherit:');
    });
  });

  describe('interactive mode', () => {
    it('should preselect explicit targets', async () => {
      await initCommand({ targets: ['claude'] }, mockServices);

      const targetPrompt = mockPrompts.checkbox.mock.calls
        .map((call: unknown[]) => call[0] as { message?: string; choices?: unknown[] })
        .find((config) => config.message?.startsWith('Select target AI tools'));
      expect(targetPrompt?.choices).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            value: 'claude',
            checked: true,
            name: expect.stringContaining('(configured)'),
          }),
        ])
      );
    });

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

      const yamlCall = mockFs.writeFile.mock.calls.find(
        (call: unknown[]) => call[0] === 'promptscript.yaml'
      );
      expect(parseYaml(yamlCall?.[1] as string)).toMatchObject({
        inherit: '@company/team',
      });
    });

    it('should ask for registry path when user wants local registry', async () => {
      mockPrompts.input
        .mockResolvedValueOnce('my-project') // project name
        .mockResolvedValueOnce('./my-registry'); // registry path
      mockPrompts.select.mockResolvedValue('local'); // local registry
      mockPrompts.confirm.mockResolvedValue(false); // no inherit
      mockPrompts.checkbox.mockResolvedValue(['cursor']);

      await initCommand({}, mockServices);

      const yamlCall = mockFs.writeFile.mock.calls.find(
        (call: unknown[]) => call[0] === 'promptscript.yaml'
      );
      expect(parseYaml(yamlCall?.[1] as string)).toMatchObject({
        registry: { path: './my-registry' },
      });
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

    it('should omit registry when user skips', async () => {
      mockPrompts.input.mockResolvedValueOnce('my-project');
      mockPrompts.select.mockResolvedValue('skip'); // skip registry
      mockPrompts.confirm.mockResolvedValue(false); // no inherit
      mockPrompts.checkbox.mockResolvedValue(['github']);

      await initCommand({}, mockServices);

      const yamlCall = mockFs.writeFile.mock.calls.find(
        (call: unknown[]) => call[0] === 'promptscript.yaml'
      );
      expect(yamlCall?.[1]).not.toContain('registry:');
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

    it('should omit languages when none detected', async () => {
      await initCommand({ yes: true }, mockServices);

      const prsCall = mockFs.writeFile.mock.calls.find(
        (call: unknown[]) => call[0] === '.promptscript/project.prs'
      );
      expect(prsCall?.[1]).not.toContain('languages:');
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

    it('should omit frameworks when none detected', async () => {
      await initCommand({ yes: true }, mockServices);

      const prsCall = mockFs.writeFile.mock.calls.find(
        (call: unknown[]) => call[0] === '.promptscript/project.prs'
      );
      expect(prsCall?.[1]).not.toContain('frameworks:');
    });
  });

  describe('skill installation', () => {
    it('should always install skill to .promptscript/skills', async () => {
      await initCommand({ yes: true, targets: ['claude'] }, mockServices);

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
        },
        mockServices
      );

      // Skill always installed to .promptscript/skills/
      expect(mockFs.mkdir).toHaveBeenCalledWith('.promptscript/skills/promptscript', {
        recursive: true,
      });
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        '.promptscript/skills/promptscript/SKILL.md',
        expect.stringContaining('promptscript'),
        'utf-8'
      );
    });

    it('should show skill path in output', async () => {
      await initCommand({ yes: true, targets: ['claude'] }, mockServices);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('.promptscript/skills/promptscript/SKILL.md')
      );
    });

    it('should use YAML marker inside frontmatter for skill files with frontmatter', async () => {
      await initCommand({ yes: true, targets: ['claude'] }, mockServices);

      const writeCall = mockFs.writeFile.mock.calls.find(
        (call: unknown[]) =>
          typeof call[0] === 'string' && call[0].includes('.promptscript/skills/promptscript')
      );
      expect(writeCall).toBeDefined();
      const writtenContent = writeCall?.[1] as string;
      // Should use YAML marker inside frontmatter, not HTML comment
      expect(writtenContent).toContain('# promptscript-generated:');
      expect(writtenContent).not.toContain('<!-- PromptScript');
      // Frontmatter should still be valid
      expect(writtenContent).toMatch(/^---\n/);
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

    it('should generate comment-free YAML when Prettier config is found', async () => {
      mockFindPrettierConfig.mockReturnValue('/mock/project/.prettierrc.json');

      await initCommand({ yes: true }, mockServices);

      const yamlCall = mockFs.writeFile.mock.calls.find(
        (call: unknown[]) => call[0] === 'promptscript.yaml'
      );
      expect(yamlCall?.[1]).not.toContain('#');
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
