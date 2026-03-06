import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { registryInitCommand } from '../commands/registry/init.js';
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

const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => {
  throw new Error('process.exit called');
});

describe('commands/registry/init', () => {
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
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    mockFs = {
      existsSync: vi.fn().mockReturnValue(false),
      writeFile: vi.fn().mockResolvedValue(undefined),
      mkdir: vi.fn().mockResolvedValue(undefined),
      readFile: vi.fn().mockResolvedValue(''),
      readdir: vi.fn().mockResolvedValue([]),
    };

    mockPrompts = {
      input: vi.fn(),
      confirm: vi.fn(),
      checkbox: vi.fn(),
      select: vi.fn(),
    };

    mockServices = {
      fs: mockFs as unknown as CliServices['fs'],
      prompts: mockPrompts as unknown as CliServices['prompts'],
      cwd: '/test',
    };
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('should create registry with --yes flag and defaults', async () => {
    await registryInitCommand('test-registry', { yes: true }, mockServices);

    expect(mockFs.mkdir).toHaveBeenCalledWith(expect.stringContaining('test-registry'), {
      recursive: true,
    });
    expect(mockFs.writeFile).toHaveBeenCalledWith(
      expect.stringContaining('registry-manifest.yaml'),
      expect.stringContaining("version: '1'"),
      'utf-8'
    );
  });

  it('should seed with starter configs by default in --yes mode', async () => {
    await registryInitCommand('test-registry', { yes: true }, mockServices);

    expect(mockFs.writeFile).toHaveBeenCalledWith(
      expect.stringContaining('base.prs'),
      expect.stringContaining('@meta'),
      'utf-8'
    );
    expect(mockFs.writeFile).toHaveBeenCalledWith(
      expect.stringContaining('quality.prs'),
      expect.stringContaining('@meta'),
      'utf-8'
    );
    expect(mockFs.writeFile).toHaveBeenCalledWith(
      expect.stringContaining('security.prs'),
      expect.stringContaining('@meta'),
      'utf-8'
    );
  });

  it('should skip seed when --no-seed is used', async () => {
    await registryInitCommand('test-registry', { yes: true, seed: false }, mockServices);

    // Should create .gitkeep instead of seed files
    expect(mockFs.writeFile).toHaveBeenCalledWith(expect.stringContaining('.gitkeep'), '', 'utf-8');
    expect(mockFs.writeFile).not.toHaveBeenCalledWith(
      expect.stringContaining('base.prs'),
      expect.any(String),
      'utf-8'
    );
  });

  it('should use custom name and namespaces', async () => {
    await registryInitCommand(
      'test-registry',
      {
        yes: true,
        name: 'Custom Registry',
        namespaces: ['@roles', '@skills'],
      },
      mockServices
    );

    expect(mockFs.writeFile).toHaveBeenCalledWith(
      expect.stringContaining('registry-manifest.yaml'),
      expect.stringContaining("name: 'Custom Registry'"),
      'utf-8'
    );
    expect(mockFs.mkdir).toHaveBeenCalledWith(expect.stringContaining('@roles'), {
      recursive: true,
    });
    expect(mockFs.mkdir).toHaveBeenCalledWith(expect.stringContaining('@skills'), {
      recursive: true,
    });
  });

  it('should run interactive prompts when --yes is not set', async () => {
    mockPrompts.input
      .mockResolvedValueOnce('Interactive Registry') // name
      .mockResolvedValueOnce('An interactive registry'); // description
    mockPrompts.checkbox.mockResolvedValueOnce(['@core', '@stacks']);
    mockPrompts.confirm.mockResolvedValueOnce(true); // seed

    await registryInitCommand('test-registry', {}, mockServices);

    expect(mockPrompts.input).toHaveBeenCalledTimes(2);
    expect(mockPrompts.checkbox).toHaveBeenCalled();
    expect(mockFs.writeFile).toHaveBeenCalledWith(
      expect.stringContaining('registry-manifest.yaml'),
      expect.stringContaining("name: 'Interactive Registry'"),
      'utf-8'
    );
  });

  it('should fall back to default namespaces when none selected', async () => {
    mockPrompts.input
      .mockResolvedValueOnce('My Registry') // name
      .mockResolvedValueOnce('A registry'); // description
    mockPrompts.checkbox.mockResolvedValueOnce([]); // empty selection
    mockPrompts.confirm.mockResolvedValueOnce(false); // no seed

    await registryInitCommand('test-registry', {}, mockServices);

    // Should use default namespaces (@core, @stacks, @fragments)
    expect(mockFs.mkdir).toHaveBeenCalledWith(expect.stringContaining('@core'), {
      recursive: true,
    });
    expect(mockFs.mkdir).toHaveBeenCalledWith(expect.stringContaining('@stacks'), {
      recursive: true,
    });
    expect(mockFs.mkdir).toHaveBeenCalledWith(expect.stringContaining('@fragments'), {
      recursive: true,
    });
  });

  it('should handle user cancellation gracefully', async () => {
    const exitError = new Error('User cancelled');
    exitError.name = 'ExitPromptError';
    mockPrompts.input.mockRejectedValue(exitError);

    await registryInitCommand('test-registry', {}, mockServices);

    expect(mockFs.writeFile).not.toHaveBeenCalled();
    expect(mockExit).not.toHaveBeenCalled();
  });

  it('should exit with code 1 when scaffolding fails', async () => {
    mockFs.mkdir.mockRejectedValue(new Error('Permission denied'));

    await expect(registryInitCommand('test-registry', { yes: true }, mockServices)).rejects.toThrow(
      'process.exit called'
    );

    expect(mockExit).toHaveBeenCalledWith(1);
  });
});
