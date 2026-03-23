import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockLoadConfig, mockFindConfigFile, mockLoadUserConfig, mockExistsSync, mockExpandAlias } =
  vi.hoisted(() => {
    const mockLoadConfig = vi.fn();
    const mockFindConfigFile = vi.fn();
    const mockLoadUserConfig = vi.fn();
    const mockExistsSync = vi.fn().mockReturnValue(false);
    const mockExpandAlias = vi.fn();
    return { mockLoadConfig, mockFindConfigFile, mockLoadUserConfig, mockExistsSync, mockExpandAlias };
  });

vi.mock('../../output/console.js', () => ({
  ConsoleOutput: { error: vi.fn(), muted: vi.fn(), newline: vi.fn() },
}));

vi.mock('../../config/loader.js', () => ({
  loadConfig: mockLoadConfig,
  findConfigFile: mockFindConfigFile,
}));

vi.mock('../../config/user-config.js', () => ({
  loadUserConfig: mockLoadUserConfig,
}));

vi.mock('@promptscript/resolver', () => ({
  expandAlias: mockExpandAlias,
  validateAlias: (alias: string) => /^@[a-z0-9][a-z0-9-]*$/.test(alias),
}));

vi.mock('fs', () => ({ existsSync: mockExistsSync }));

import { resolveCommand } from '../resolve-cmd.js';
import { ConsoleOutput } from '../../output/console.js';

describe('resolveCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.exitCode = undefined;
  });

  it('should fail when no project config found', async () => {
    mockFindConfigFile.mockReturnValue(null);

    await resolveCommand('@company/base', {});

    expect(ConsoleOutput.error).toHaveBeenCalledWith(
      expect.stringContaining('No project config')
    );
    expect(process.exitCode).toBe(1);
  });

  it('should print resolution info for a known alias', async () => {
    mockFindConfigFile.mockReturnValue('promptscript.yaml');
    mockLoadConfig.mockResolvedValue({
      targets: [],
      registries: { '@company': 'github.com/company/base' },
    });
    mockLoadUserConfig.mockResolvedValue({ version: '1' });
    mockExpandAlias.mockReturnValue({
      repoUrl: 'github.com/company/base',
      path: 'security',
      version: 'v1.3.0',
    });
    mockExistsSync.mockReturnValue(false);

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    await resolveCommand('@company/security@v1.3.0', {});

    const output = consoleSpy.mock.calls.map((c) => c[0] as string).join('\n');
    expect(output).toContain('github.com/company/base');
    expect(output).toContain('security');

    consoleSpy.mockRestore();
  });

  it('should report error for unknown alias', async () => {
    mockFindConfigFile.mockReturnValue('promptscript.yaml');
    mockLoadConfig.mockResolvedValue({
      targets: [],
      registries: { '@company': 'github.com/company/base' },
    });
    mockLoadUserConfig.mockResolvedValue({ version: '1' });
    mockExpandAlias.mockImplementation(() => {
      throw new Error('Unknown alias: @unknown');
    });

    await resolveCommand('@unknown/path', {});

    expect(ConsoleOutput.error).toHaveBeenCalledWith(expect.stringContaining('Unknown alias'));
    expect(process.exitCode).toBe(1);
  });

  it('should handle local file imports', async () => {
    mockFindConfigFile.mockReturnValue('promptscript.yaml');
    mockLoadConfig.mockResolvedValue({ targets: [] });
    mockLoadUserConfig.mockResolvedValue({ version: '1' });
    mockExistsSync.mockReturnValue(true);

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    await resolveCommand('./local-file', {});

    const output = consoleSpy.mock.calls.map((c) => c[0] as string).join('\n');
    expect(output).toContain('local file');
    expect(output).toContain('yes');

    consoleSpy.mockRestore();
  });
});
