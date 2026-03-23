import { describe, it, expect, vi, beforeEach } from 'vitest';

const {
  mockSucceed,
  mockFail,
  mockWarn,
  mockSpinner,
  mockLoadConfig,
  mockFindConfigFile,
  mockExistsSync,
  mockWriteFile,
  mockReadFile,
} = vi.hoisted(() => {
  const mockStart = vi.fn().mockReturnThis();
  const mockSucceed = vi.fn().mockReturnThis();
  const mockFail = vi.fn().mockReturnThis();
  const mockWarn = vi.fn().mockReturnThis();
  const mockSpinner = {
    start: mockStart,
    succeed: mockSucceed,
    fail: mockFail,
    warn: mockWarn,
    text: '',
  };
  const mockLoadConfig = vi.fn();
  const mockFindConfigFile = vi.fn();
  const mockExistsSync = vi.fn().mockReturnValue(false);
  const mockWriteFile = vi.fn().mockResolvedValue(undefined);
  const mockReadFile = vi.fn();
  return {
    mockSucceed,
    mockFail,
    mockWarn,
    mockSpinner,
    mockLoadConfig,
    mockFindConfigFile,
    mockExistsSync,
    mockWriteFile,
    mockReadFile,
  };
});

vi.mock('../../output/console.js', () => ({
  createSpinner: vi.fn(() => mockSpinner),
  ConsoleOutput: { success: vi.fn(), error: vi.fn(), muted: vi.fn(), newline: vi.fn() },
}));

vi.mock('../../config/loader.js', () => ({
  loadConfig: mockLoadConfig,
  findConfigFile: mockFindConfigFile,
}));

vi.mock('fs', () => ({ existsSync: mockExistsSync }));

vi.mock('fs/promises', () => ({
  writeFile: mockWriteFile,
  readFile: mockReadFile,
}));

vi.mock('yaml', () => ({
  parse: (s: string) => JSON.parse(s),
  stringify: (o: unknown) => JSON.stringify(o),
}));

import { lockCommand } from '../lock.js';

describe('lockCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.exitCode = undefined;
  });

  it('should fail when no project config found', async () => {
    mockFindConfigFile.mockReturnValue(null);

    await lockCommand({});

    expect(mockFail).toHaveBeenCalledWith('No project config found');
    expect(process.exitCode).toBe(1);
  });

  it('should warn when no registries configured', async () => {
    mockFindConfigFile.mockReturnValue('promptscript.yaml');
    mockLoadConfig.mockResolvedValue({ targets: [] });

    await lockCommand({});

    expect(mockWarn).toHaveBeenCalledWith('No registry aliases configured');
  });

  it('should write lockfile when registries are configured', async () => {
    mockFindConfigFile.mockReturnValue('promptscript.yaml');
    mockLoadConfig.mockResolvedValue({
      targets: [],
      registries: { '@company': 'github.com/company/base' },
    });
    mockExistsSync.mockReturnValue(false);

    await lockCommand({});

    expect(mockWriteFile).toHaveBeenCalledWith('promptscript.lock', expect.any(String), 'utf-8');
    expect(mockSucceed).toHaveBeenCalledWith('Lockfile generated');
  });

  it('should preserve existing pins', async () => {
    mockFindConfigFile.mockReturnValue('promptscript.yaml');
    mockLoadConfig.mockResolvedValue({
      targets: [],
      registries: { '@company': 'github.com/company/base' },
    });
    mockExistsSync.mockReturnValue(true);
    mockReadFile.mockResolvedValue(
      JSON.stringify({
        version: 1,
        dependencies: {
          'github.com/company/base': {
            version: 'v1.2.0',
            commit: 'abc123',
            integrity: 'sha256-xyz',
          },
        },
      })
    );

    await lockCommand({});

    const written = (mockWriteFile.mock.calls[0] as unknown[])[1] as string;
    const parsed = JSON.parse(written) as { dependencies: Record<string, { version: string }> };
    expect(parsed.dependencies['github.com/company/base']!.version).toBe('v1.2.0');
  });

  it('should not write file in dry-run mode', async () => {
    mockFindConfigFile.mockReturnValue('promptscript.yaml');
    mockLoadConfig.mockResolvedValue({
      targets: [],
      registries: { '@company': 'github.com/company/base' },
    });
    mockExistsSync.mockReturnValue(false);

    await lockCommand({ dryRun: true });

    expect(mockWriteFile).not.toHaveBeenCalled();
    expect(mockSucceed).toHaveBeenCalledWith('Dry run — lockfile not written');
  });

  it('should handle exception during lock generation', async () => {
    mockFindConfigFile.mockReturnValue('promptscript.yaml');
    mockLoadConfig.mockRejectedValue(new Error('config load failure'));

    await lockCommand({});

    expect(mockFail).toHaveBeenCalledWith('Failed to generate lockfile');
    expect(process.exitCode).toBe(1);
  });

  it('should handle malformed existing lockfile gracefully', async () => {
    mockFindConfigFile.mockReturnValue('promptscript.yaml');
    mockLoadConfig.mockResolvedValue({
      targets: [],
      registries: { '@company': 'github.com/company/base' },
    });
    mockExistsSync.mockReturnValue(true);
    // Return content that will throw during parse (invalid JSON for our mock)
    mockReadFile.mockRejectedValue(new Error('read failure'));

    await lockCommand({});

    // Should still succeed — malformed lockfile is ignored and starts fresh
    expect(mockWriteFile).toHaveBeenCalled();
    expect(mockSucceed).toHaveBeenCalledWith('Lockfile generated');
  });

  it('should handle object-form registry entry', async () => {
    mockFindConfigFile.mockReturnValue('promptscript.yaml');
    mockLoadConfig.mockResolvedValue({
      targets: [],
      registries: { '@company': { url: 'github.com/company/base', root: 'packages/prs' } },
    });
    mockExistsSync.mockReturnValue(false);

    await lockCommand({});

    const written = (mockWriteFile.mock.calls[0] as unknown[])[1] as string;
    const parsed = JSON.parse(written) as {
      dependencies: Record<string, { version: string }>;
    };
    expect(parsed.dependencies['github.com/company/base']).toBeDefined();
  });
});
