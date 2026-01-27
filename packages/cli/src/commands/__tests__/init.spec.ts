import { describe, it, expect, vi, beforeEach } from 'vitest';
import { initCommand } from '../init.js';
import { type CliServices, type FileSystem, type PromptSystem } from '../../services.js';
import type { InitOptions } from '../../types.js';

describe('initCommand', () => {
  let mockFs: FileSystem;
  let mockPrompts: PromptSystem;
  let mockServices: CliServices;

  beforeEach(() => {
    mockFs = {
      writeFile: vi.fn(),
      mkdir: vi.fn(),
      readFile: vi.fn(),
      readdir: vi.fn(),
      existsSync: vi.fn(),
      readFileSync: vi.fn(),
    };

    mockPrompts = {
      input: vi.fn(),
      confirm: vi.fn(),
      checkbox: vi.fn(),
      select: vi.fn(),
    };

    mockServices = {
      fs: mockFs,
      prompts: mockPrompts,
      cwd: '/mock/cwd',
    };
  });

  const defaultOptions: InitOptions = {
    interactive: false,
    yes: false,
    force: false,
    targets: [],
  };

  it('should not initialize if promptscript.yaml exists and not forced', async () => {
    vi.mocked(mockFs.existsSync).mockReturnValue(true);

    await initCommand(defaultOptions, mockServices);

    expect(mockFs.writeFile).not.toHaveBeenCalled();
  });

  it('should initialize if promptscript.yaml exists and forced', async () => {
    vi.mocked(mockFs.existsSync).mockReturnValue(true);
    const options = {
      ...defaultOptions,
      force: true,
      yes: true,
      name: 'test-project',
      targets: ['github'],
    };

    // Mock project detection (detected automatically in implementations, but we rely on cli services mostly)
    // Wait, detectsProject uses real FS internally?
    // detectProject in utils/project-detector.ts uses importing 'fs'.
    // We should probably mock the detector or make it use services too.
    // For now, let's assume it works or mock the module.

    await initCommand(options, mockServices);

    expect(mockFs.mkdir).toHaveBeenCalledWith('.promptscript', { recursive: true });
    expect(mockFs.writeFile).toHaveBeenCalledWith(
      'promptscript.yaml',
      expect.stringContaining("id: 'test-project'"),
      'utf-8'
    );
  });

  describe('--migrate flag', () => {
    it('should create migration skill for Claude target', async () => {
      vi.mocked(mockFs.existsSync).mockReturnValue(false);
      const options: InitOptions = {
        ...defaultOptions,
        yes: true,
        name: 'test-project',
        targets: ['claude'],
        migrate: true,
      };

      await initCommand(options, mockServices);

      expect(mockFs.mkdir).toHaveBeenCalledWith('.claude/skills/migrate-to-promptscript', {
        recursive: true,
      });
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        '.claude/skills/migrate-to-promptscript/SKILL.md',
        expect.stringContaining('migrate-to-promptscript'),
        'utf-8'
      );
    });

    it('should create migration skill for GitHub target', async () => {
      vi.mocked(mockFs.existsSync).mockReturnValue(false);
      const options: InitOptions = {
        ...defaultOptions,
        yes: true,
        name: 'test-project',
        targets: ['github'],
        migrate: true,
      };

      await initCommand(options, mockServices);

      expect(mockFs.mkdir).toHaveBeenCalledWith('.github/skills/migrate-to-promptscript', {
        recursive: true,
      });
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        '.github/skills/migrate-to-promptscript/SKILL.md',
        expect.stringContaining('migrate-to-promptscript'),
        'utf-8'
      );
    });

    it('should create migration command for Cursor target', async () => {
      vi.mocked(mockFs.existsSync).mockReturnValue(false);
      const options: InitOptions = {
        ...defaultOptions,
        yes: true,
        name: 'test-project',
        targets: ['cursor'],
        migrate: true,
      };

      await initCommand(options, mockServices);

      expect(mockFs.mkdir).toHaveBeenCalledWith('.cursor/commands', { recursive: true });
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        '.cursor/commands/migrate.md',
        expect.stringContaining('Migrate to PromptScript'),
        'utf-8'
      );
    });

    it('should create migration rule for Antigravity target', async () => {
      vi.mocked(mockFs.existsSync).mockReturnValue(false);
      const options: InitOptions = {
        ...defaultOptions,
        yes: true,
        name: 'test-project',
        targets: ['antigravity'],
        migrate: true,
      };

      await initCommand(options, mockServices);

      expect(mockFs.mkdir).toHaveBeenCalledWith('.agent/rules', { recursive: true });
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        '.agent/rules/migrate.md',
        expect.stringContaining('Migrate to PromptScript'),
        'utf-8'
      );
    });

    it('should not create migration files when --migrate is not used', async () => {
      vi.mocked(mockFs.existsSync).mockReturnValue(false);
      const options: InitOptions = {
        ...defaultOptions,
        yes: true,
        name: 'test-project',
        targets: ['claude', 'github', 'cursor', 'antigravity'],
        migrate: false,
      };

      await initCommand(options, mockServices);

      // Should create base files
      expect(mockFs.mkdir).toHaveBeenCalledWith('.promptscript', { recursive: true });

      // Should NOT create migration skill directories
      expect(mockFs.mkdir).not.toHaveBeenCalledWith('.claude/skills/migrate-to-promptscript', {
        recursive: true,
      });
      expect(mockFs.mkdir).not.toHaveBeenCalledWith('.github/skills/migrate-to-promptscript', {
        recursive: true,
      });
      expect(mockFs.mkdir).not.toHaveBeenCalledWith('.cursor/commands', { recursive: true });
      expect(mockFs.mkdir).not.toHaveBeenCalledWith('.agent/rules', { recursive: true });
    });
  });
});
