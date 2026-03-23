import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockReadFile, mockWriteFile, mockMkdir, mockExistsSync, mockFindConfigFile } = vi.hoisted(
  () => {
    const mockReadFile = vi.fn();
    const mockWriteFile = vi.fn().mockResolvedValue(undefined);
    const mockMkdir = vi.fn().mockResolvedValue(undefined);
    const mockExistsSync = vi.fn();
    const mockFindConfigFile = vi.fn();
    return { mockReadFile, mockWriteFile, mockMkdir, mockExistsSync, mockFindConfigFile };
  }
);

vi.mock('../../output/console.js', () => ({
  ConsoleOutput: {
    success: vi.fn(),
    error: vi.fn(),
    muted: vi.fn(),
    newline: vi.fn(),
  },
}));

vi.mock('../../config/loader.js', () => ({
  findConfigFile: mockFindConfigFile,
}));

vi.mock('../../config/user-config.js', () => ({
  USER_CONFIG_PATH: '/home/user/.promptscript/config.yaml',
}));

vi.mock('@promptscript/resolver', () => ({
  validateAlias: (alias: string) => /^@[a-z0-9][a-z0-9-]*$/.test(alias),
}));

vi.mock('fs', () => ({
  existsSync: mockExistsSync,
}));

vi.mock('fs/promises', () => ({
  readFile: mockReadFile,
  writeFile: mockWriteFile,
  mkdir: mockMkdir,
}));

vi.mock('yaml', () => ({
  parse: (content: string) => JSON.parse(content),
  stringify: (obj: unknown) => JSON.stringify(obj),
}));

import { registryAddCommand } from '../registry/add.js';
import { ConsoleOutput } from '../../output/console.js';

describe('registryAddCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.exitCode = undefined;
  });

  it('should reject invalid alias names', async () => {
    await registryAddCommand('BadAlias', 'https://example.com', {});

    expect(ConsoleOutput.error).toHaveBeenCalledWith(expect.stringContaining('Invalid alias'));
    expect(process.exitCode).toBe(1);
  });

  it('should reject empty URL', async () => {
    await registryAddCommand('@company', '  ', {});

    expect(ConsoleOutput.error).toHaveBeenCalledWith(
      expect.stringContaining('URL must not be empty')
    );
    expect(process.exitCode).toBe(1);
  });

  it('should add alias to project config', async () => {
    mockFindConfigFile.mockReturnValue('promptscript.yaml');
    mockReadFile.mockResolvedValue(
      JSON.stringify({ id: 'my-project', targets: [], registries: {} })
    );

    await registryAddCommand('@company', 'github.com/company/base', {});

    expect(mockWriteFile).toHaveBeenCalledWith('promptscript.yaml', expect.any(String), 'utf-8');
    expect(ConsoleOutput.success).toHaveBeenCalledWith(expect.stringContaining('@company'));
  });

  it('should error when no project config exists and not --global', async () => {
    mockFindConfigFile.mockReturnValue(null);

    await registryAddCommand('@company', 'github.com/company/base', {});

    expect(ConsoleOutput.error).toHaveBeenCalledWith(expect.stringContaining('No project config'));
    expect(process.exitCode).toBe(1);
  });

  it('should add alias to global config with --global flag', async () => {
    // Config directory doesn't exist yet
    mockExistsSync.mockImplementation((p: string) => {
      if (p === '/home/user/.promptscript') return false;
      if (p === '/home/user/.promptscript/config.yaml') return false;
      return false;
    });

    await registryAddCommand('@company', 'github.com/company/base', { global: true });

    expect(mockMkdir).toHaveBeenCalledWith(
      expect.stringContaining('.promptscript'),
      expect.any(Object)
    );
    expect(mockWriteFile).toHaveBeenCalledWith(
      '/home/user/.promptscript/config.yaml',
      expect.any(String),
      'utf-8'
    );
    expect(ConsoleOutput.success).toHaveBeenCalledWith(expect.stringContaining('@company'));
  });

  it('should merge into existing global config', async () => {
    mockExistsSync.mockReturnValue(true);
    mockReadFile.mockResolvedValue(
      JSON.stringify({ version: '1', registries: { '@existing': 'https://old.example.com' } })
    );

    await registryAddCommand('@new', 'github.com/new/repo', { global: true });

    const written = (mockWriteFile.mock.calls[0] as unknown[])[1] as string;
    const parsed = JSON.parse(written) as Record<string, unknown>;
    const regs = parsed['registries'] as Record<string, string>;
    expect(regs['@existing']).toBe('https://old.example.com');
    expect(regs['@new']).toBe('github.com/new/repo');
  });

  it('should reject alias with invalid format characters', async () => {
    await registryAddCommand('@BAD_ALIAS!', 'github.com/company/base', {});

    expect(ConsoleOutput.error).toHaveBeenCalledWith(expect.stringContaining('Invalid alias'));
    expect(process.exitCode).toBe(1);
  });

  it('should error when configFile is null and not global', async () => {
    mockFindConfigFile.mockReturnValue(null);

    await registryAddCommand('@valid', 'github.com/valid/repo', {});

    expect(ConsoleOutput.error).toHaveBeenCalledWith(expect.stringContaining('No project config'));
    expect(process.exitCode).toBe(1);
  });

  it('should handle exception during add', async () => {
    mockFindConfigFile.mockReturnValue('promptscript.yaml');
    mockReadFile.mockRejectedValue(new Error('permission denied'));

    await registryAddCommand('@company', 'github.com/company/base', {});

    expect(ConsoleOutput.error).toHaveBeenCalledWith(
      expect.stringContaining('Failed to add registry')
    );
    expect(process.exitCode).toBe(1);
  });
});
