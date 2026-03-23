import { describe, it, expect, vi, beforeEach } from 'vitest';

const {
  mockLoadConfig,
  mockFindConfigFile,
  mockLoadUserConfig,
  mockExistsSync,
  mockExpandAlias,
  mockValidateAlias,
} = vi.hoisted(() => {
  const mockLoadConfig = vi.fn();
  const mockFindConfigFile = vi.fn();
  const mockLoadUserConfig = vi.fn();
  const mockExistsSync = vi.fn().mockReturnValue(false);
  const mockExpandAlias = vi.fn();
  const mockValidateAlias = vi.fn((alias: string) => {
    if (!/^@[a-z0-9][a-z0-9-]*$/.test(alias)) {
      throw new Error(`Invalid alias: ${alias}`);
    }
  });
  return {
    mockLoadConfig,
    mockFindConfigFile,
    mockLoadUserConfig,
    mockExistsSync,
    mockExpandAlias,
    mockValidateAlias,
  };
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
  validateAlias: mockValidateAlias,
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

    expect(ConsoleOutput.error).toHaveBeenCalledWith(expect.stringContaining('No project config'));
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

  it('should error on invalid alias format', async () => {
    mockFindConfigFile.mockReturnValue('promptscript.yaml');
    mockLoadConfig.mockResolvedValue({
      targets: [],
      registries: { '@company': 'github.com/company/base' },
    });
    mockLoadUserConfig.mockResolvedValue({ version: '1' });

    await resolveCommand('@INVALID/path', {});

    expect(ConsoleOutput.error).toHaveBeenCalledWith(
      expect.stringContaining('Invalid alias format')
    );
    expect(process.exitCode).toBe(1);
  });

  it('should show cache not found info when cache does not exist', async () => {
    mockFindConfigFile.mockReturnValue('promptscript.yaml');
    mockLoadConfig.mockResolvedValue({
      targets: [],
      registries: { '@company': 'github.com/company/base' },
    });
    mockLoadUserConfig.mockResolvedValue({ version: '1' });
    mockExpandAlias.mockReturnValue({
      repoUrl: 'github.com/company/base',
      path: 'security',
      version: undefined,
    });
    mockExistsSync.mockReturnValue(false);

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    await resolveCommand('@company/security', {});

    const output = consoleSpy.mock.calls.map((c) => c[0] as string).join('\n');
    expect(output).toContain('not cached');
    expect(output).toContain('unknown');

    consoleSpy.mockRestore();
  });

  it('should handle exception in resolution', async () => {
    mockFindConfigFile.mockReturnValue('promptscript.yaml');
    mockLoadConfig.mockRejectedValue(new Error('config parse error'));

    await resolveCommand('@company/path', {});

    expect(ConsoleOutput.error).toHaveBeenCalledWith(expect.stringContaining('Resolution failed'));
    expect(process.exitCode).toBe(1);
  });

  it('should error when no registries are configured for alias import', async () => {
    mockFindConfigFile.mockReturnValue('promptscript.yaml');
    mockLoadConfig.mockResolvedValue({ targets: [] });
    mockLoadUserConfig.mockResolvedValue({ version: '1' });

    await resolveCommand('@company/security', {});

    expect(ConsoleOutput.error).toHaveBeenCalledWith('No registries configured.');
    expect(process.exitCode).toBe(1);
  });

  it('should show cache exists with file found info', async () => {
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
    // existsSync returns true for both cacheDir and cachedFile
    mockExistsSync.mockReturnValue(true);

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    await resolveCommand('@company/security@v1.3.0', {});

    const output = consoleSpy.mock.calls.map((c) => c[0] as string).join('\n');
    expect(output).toContain('native .prs');

    consoleSpy.mockRestore();
  });

  it('should show cache exists but file not found info', async () => {
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
    // First call (cacheDir) returns true, second call (cachedFile) returns false
    let callCount = 0;
    mockExistsSync.mockImplementation(() => {
      callCount++;
      return callCount === 1; // only cacheDir exists
    });

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    await resolveCommand('@company/security@v1.3.0', {});

    const output = consoleSpy.mock.calls.map((c) => c[0] as string).join('\n');
    expect(output).toContain('not found in cache');

    consoleSpy.mockRestore();
  });
});
