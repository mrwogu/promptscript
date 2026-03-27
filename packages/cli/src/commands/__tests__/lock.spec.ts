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
  mockCollectRemoteImports,
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
  const mockCollectRemoteImports = vi.fn().mockResolvedValue([]);
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
    mockCollectRemoteImports,
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

vi.mock('../lock-scanner.js', () => ({
  collectRemoteImports: mockCollectRemoteImports,
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

  it('should warn when no registries configured and no scanned imports', async () => {
    mockFindConfigFile.mockReturnValue('promptscript.yaml');
    mockLoadConfig.mockResolvedValue({ targets: [] });
    mockCollectRemoteImports.mockResolvedValue([]);

    await lockCommand({});

    expect(mockWarn).toHaveBeenCalledWith('No remote dependencies found');
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

  it('should preserve md-sourced entries from previous lockfile', async () => {
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
            version: 'v1.0.0',
            commit: 'abc123',
            integrity: 'sha256-xyz',
          },
          'github.com/org/skills/SKILL.md': {
            version: 'latest',
            commit: '0000000000000000000000000000000000000000',
            integrity: 'sha256-pending',
            source: 'md',
          },
        },
      })
    );

    await lockCommand({});

    expect(mockSucceed).toHaveBeenCalledWith('Lockfile generated');

    const written = (mockWriteFile.mock.calls[0] as unknown[])[1] as string;
    const parsed = JSON.parse(written) as {
      dependencies: Record<string, { version: string; source?: string }>;
    };
    // Registry entry should be preserved
    expect(parsed.dependencies['github.com/company/base']!.version).toBe('v1.0.0');
    // md-sourced entry should also be preserved
    expect(parsed.dependencies['github.com/org/skills/SKILL.md']).toBeDefined();
    expect(parsed.dependencies['github.com/org/skills/SKILL.md']!.source).toBe('md');
  });

  it('should discover and lock @use github.com imports from .prs files', async () => {
    mockFindConfigFile.mockReturnValue('promptscript.yaml');
    mockLoadConfig.mockResolvedValue({
      targets: [],
      registries: { '@company': 'github.com/company/base' },
    });
    mockExistsSync.mockReturnValue(false);
    mockCollectRemoteImports.mockResolvedValue([
      {
        repoUrl: 'https://github.com/org/repo',
        path: 'guards/safety.prs',
        version: 'v2.0.0',
      },
    ]);

    await lockCommand({});

    expect(mockWriteFile).toHaveBeenCalled();
    const written = (mockWriteFile.mock.calls[0] as unknown[])[1] as string;
    const parsed = JSON.parse(written) as {
      dependencies: Record<string, { version: string }>;
    };
    // Registry alias dependency
    expect(parsed.dependencies['github.com/company/base']).toBeDefined();
    // Scanned @use import dependency
    expect(parsed.dependencies['https://github.com/org/repo']).toBeDefined();
    expect(parsed.dependencies['https://github.com/org/repo']!.version).toBe('v2.0.0');
  });

  it('should generate lockfile even without registries when @use imports exist', async () => {
    mockFindConfigFile.mockReturnValue('promptscript.yaml');
    mockLoadConfig.mockResolvedValue({ targets: [] });
    mockExistsSync.mockReturnValue(false);
    mockCollectRemoteImports.mockResolvedValue([
      {
        repoUrl: 'https://github.com/org/repo',
        path: 'guards/safety.prs',
        version: 'v1.0.0',
      },
    ]);

    await lockCommand({});

    expect(mockWarn).not.toHaveBeenCalled();
    expect(mockWriteFile).toHaveBeenCalled();
    expect(mockSucceed).toHaveBeenCalledWith('Lockfile generated');
    const written = (mockWriteFile.mock.calls[0] as unknown[])[1] as string;
    const parsed = JSON.parse(written) as {
      dependencies: Record<string, { version: string }>;
    };
    expect(parsed.dependencies['https://github.com/org/repo']).toBeDefined();
  });

  it('should deduplicate repos from @use imports with same repoUrl', async () => {
    mockFindConfigFile.mockReturnValue('promptscript.yaml');
    mockLoadConfig.mockResolvedValue({ targets: [] });
    mockExistsSync.mockReturnValue(false);
    mockCollectRemoteImports.mockResolvedValue([
      {
        repoUrl: 'https://github.com/org/repo',
        path: 'guards/safety.prs',
        version: 'v1.0.0',
      },
      {
        repoUrl: 'https://github.com/org/repo',
        path: 'prompts/base.prs',
        version: 'v1.0.0',
      },
    ]);

    await lockCommand({});

    expect(mockWriteFile).toHaveBeenCalled();
    const written = (mockWriteFile.mock.calls[0] as unknown[])[1] as string;
    const parsed = JSON.parse(written) as {
      dependencies: Record<string, { version: string }>;
    };
    // Should have only one entry for the repo, not two
    const repoKeys = Object.keys(parsed.dependencies).filter(
      (k) => k === 'https://github.com/org/repo'
    );
    expect(repoKeys).toHaveLength(1);
  });

  it('should fail gracefully when scanner throws', async () => {
    mockFindConfigFile.mockReturnValue('promptscript.yaml');
    mockLoadConfig.mockResolvedValue({ targets: [], registries: { '@co': 'github.com/co/base' } });
    mockCollectRemoteImports.mockRejectedValue(new Error('scanner failure'));

    await lockCommand({});

    expect(mockFail).toHaveBeenCalledWith('Failed to generate lockfile');
    expect(process.exitCode).toBe(1);
  });
});
