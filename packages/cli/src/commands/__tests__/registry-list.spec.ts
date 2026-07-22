import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockLoadUserConfig, mockFindConfigFile, mockReadFile, mockConsoleLog } = vi.hoisted(() => {
  const mockLoadUserConfig = vi.fn();
  const mockFindConfigFile = vi.fn();
  const mockReadFile = vi.fn();
  const mockConsoleLog = vi.fn();
  return { mockLoadUserConfig, mockFindConfigFile, mockReadFile, mockConsoleLog };
});

vi.mock('../../output/console.js', () => ({
  ConsoleOutput: {
    muted: vi.fn(),
    newline: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('../../config/user-config.js', () => ({
  loadUserConfig: mockLoadUserConfig,
}));

vi.mock('../../config/loader.js', () => ({
  findConfigFile: mockFindConfigFile,
}));

vi.mock('fs/promises', () => ({
  readFile: mockReadFile,
}));

vi.mock('yaml', () => ({
  parse: vi.fn((content: string) => JSON.parse(content)),
}));

import { registryListCommand } from '../registry/list.js';
import { ConsoleOutput } from '../../output/console.js';

describe('registryListCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.exitCode = undefined;
  });

  it('should print a hint when no aliases are configured', async () => {
    mockLoadUserConfig.mockResolvedValue({ version: '1' });
    mockFindConfigFile.mockReturnValue(null);

    await registryListCommand();

    expect(ConsoleOutput.muted).toHaveBeenCalledWith('No registry aliases configured.');
    expect(ConsoleOutput.muted).toHaveBeenCalledWith(expect.stringContaining('prs registry add'));
  });

  it('should display user-level aliases as global', async () => {
    mockLoadUserConfig.mockResolvedValue({
      version: '1',
      registries: { '@company': 'github.com/company/base' },
    });
    mockFindConfigFile.mockReturnValue(null);

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(mockConsoleLog);

    await registryListCommand();

    const calls = consoleSpy.mock.calls.map((c) => c[0] as string);
    expect(calls.some((line) => line.includes('@company') && line.includes('(global)'))).toBe(true);

    consoleSpy.mockRestore();
  });

  it('should display project-level aliases as project', async () => {
    mockLoadUserConfig.mockResolvedValue({ version: '1' });
    mockFindConfigFile.mockReturnValue('promptscript.yaml');
    mockReadFile.mockResolvedValue(
      JSON.stringify({ registries: { '@team': 'github.com/company/team' } })
    );

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(mockConsoleLog);

    await registryListCommand();

    const calls = consoleSpy.mock.calls.map((c) => c[0] as string);
    expect(calls.some((line) => line.includes('@team') && line.includes('(project)'))).toBe(true);

    consoleSpy.mockRestore();
  });

  it('should show project overriding user alias for same key', async () => {
    mockLoadUserConfig.mockResolvedValue({
      version: '1',
      registries: { '@company': 'github.com/company/old' },
    });
    mockFindConfigFile.mockReturnValue('promptscript.yaml');
    mockReadFile.mockResolvedValue(
      JSON.stringify({ registries: { '@company': 'github.com/company/new' } })
    );

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(mockConsoleLog);

    await registryListCommand();

    const calls = consoleSpy.mock.calls.map((c) => c[0] as string);
    // project entry wins — only the project version should appear
    expect(
      calls.some(
        (line) => line.includes('@company') && line.includes('new') && line.includes('(project)')
      )
    ).toBe(true);
    // old entry from global should not be shown for @company
    expect(calls.some((line) => line.includes('old'))).toBe(false);

    consoleSpy.mockRestore();
  });

  it('should filter aliases by source', async () => {
    mockLoadUserConfig.mockResolvedValue({
      version: '1',
      registries: {
        '@global': 'github.com/company/global',
        '@shared': 'github.com/company/global-shared',
      },
    });
    mockFindConfigFile.mockReturnValue('promptscript.yaml');
    mockReadFile.mockResolvedValue(
      JSON.stringify({
        registries: {
          '@project': 'github.com/company/project',
          '@shared': 'github.com/company/project-shared',
        },
      })
    );
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(mockConsoleLog);

    await registryListCommand({ source: 'project' });

    const calls = consoleSpy.mock.calls.map((call) => call[0] as string);
    expect(calls.some((line) => line.includes('@project'))).toBe(true);
    expect(calls.some((line) => line.includes('@global'))).toBe(false);
    consoleSpy.mockRestore();

    const globalSpy = vi.spyOn(console, 'log').mockImplementation(mockConsoleLog);
    await registryListCommand({ source: 'global' });
    const globalCalls = globalSpy.mock.calls.map((call) => call[0] as string);
    expect(globalCalls.some((line) => line.includes('global-shared'))).toBe(true);
    globalSpy.mockRestore();
  });

  it('should output merged aliases as JSON', async () => {
    mockLoadUserConfig.mockResolvedValue({
      version: '1',
      registries: { '@company': 'github.com/company/base' },
    });
    mockFindConfigFile.mockReturnValue(null);
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(mockConsoleLog);

    await registryListCommand({ format: 'json' });

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('"source": "global"'));
    consoleSpy.mockRestore();
  });

  it('should reject unsupported list options', async () => {
    await registryListCommand({
      source: 'invalid' as 'all',
      format: 'yaml' as 'text',
    });

    expect(ConsoleOutput.error).toHaveBeenCalledWith(expect.stringContaining('Invalid source'));
    expect(mockLoadUserConfig).not.toHaveBeenCalled();
    expect(process.exitCode).toBe(1);
  });

  it('should reject unsupported output formats', async () => {
    await registryListCommand({ format: 'yaml' as 'text' });

    expect(ConsoleOutput.error).toHaveBeenCalledWith(expect.stringContaining('Invalid format'));
    expect(mockLoadUserConfig).not.toHaveBeenCalled();
    expect(process.exitCode).toBe(1);
  });

  it('should handle exception during registry listing', async () => {
    mockLoadUserConfig.mockRejectedValue(new Error('config error'));

    await registryListCommand();

    expect(ConsoleOutput.error).toHaveBeenCalledWith(
      expect.stringContaining('Failed to list registries')
    );
    expect(process.exitCode).toBe(1);
  });

  it('should handle object-form registry entries in user config', async () => {
    mockLoadUserConfig.mockResolvedValue({
      version: '1',
      registries: { '@company': { url: 'github.com/company/base', root: 'packages/prs' } },
    });
    mockFindConfigFile.mockReturnValue(null);

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(mockConsoleLog);

    await registryListCommand();

    const calls = consoleSpy.mock.calls.map((c) => c[0] as string);
    expect(
      calls.some(
        (line) =>
          line.includes('@company') &&
          line.includes('github.com/company/base') &&
          line.includes('(global)')
      )
    ).toBe(true);

    consoleSpy.mockRestore();
  });

  it('should handle object-form registry entries in project config', async () => {
    mockLoadUserConfig.mockResolvedValue({ version: '1' });
    mockFindConfigFile.mockReturnValue('promptscript.yaml');
    mockReadFile.mockResolvedValue(
      JSON.stringify({
        registries: { '@team': { url: 'github.com/company/team', root: 'src' } },
      })
    );

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(mockConsoleLog);

    await registryListCommand();

    const calls = consoleSpy.mock.calls.map((c) => c[0] as string);
    expect(
      calls.some(
        (line) =>
          line.includes('@team') &&
          line.includes('github.com/company/team') &&
          line.includes('(project)')
      )
    ).toBe(true);

    consoleSpy.mockRestore();
  });

  it('should handle project config parse errors gracefully', async () => {
    mockLoadUserConfig.mockResolvedValue({
      version: '1',
      registries: { '@company': 'github.com/company/base' },
    });
    mockFindConfigFile.mockReturnValue('promptscript.yaml');
    mockReadFile.mockRejectedValue(new Error('read error'));

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(mockConsoleLog);

    await registryListCommand();

    // Should still show user-level alias even if project config fails
    const calls = consoleSpy.mock.calls.map((c) => c[0] as string);
    expect(calls.some((line) => line.includes('@company') && line.includes('(global)'))).toBe(true);

    consoleSpy.mockRestore();
  });
});
