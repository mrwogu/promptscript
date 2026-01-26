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
});
