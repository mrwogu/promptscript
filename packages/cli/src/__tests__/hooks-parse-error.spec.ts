import { describe, it, expect, vi, beforeEach } from 'vitest';

// Hoisted mocks
const { mockReadFile } = vi.hoisted(() => ({
  mockReadFile: vi.fn(),
}));

vi.mock('node:fs', () => ({
  existsSync: vi.fn().mockReturnValue(false),
}));

vi.mock('node:fs/promises', () => ({
  readFile: (...args: unknown[]) => mockReadFile(...args),
  writeFile: vi.fn().mockResolvedValue(undefined),
  mkdir: vi.fn().mockResolvedValue(undefined),
  chmod: vi.fn().mockResolvedValue(undefined),
  unlink: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../output/console.js', () => ({
  ConsoleOutput: {
    error: vi.fn(),
    muted: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    newline: vi.fn(),
  },
}));

describe('hooks readSettingsFile - Issue 5', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return empty object for missing file (ENOENT)', async () => {
    const { readSettingsFile } = await import('../commands/hooks.js');

    const enoentError = new Error('ENOENT') as NodeJS.ErrnoException;
    enoentError.code = 'ENOENT';
    mockReadFile.mockRejectedValue(enoentError);

    const result = await readSettingsFile('/fake/.claude/settings.json');
    expect(result).toEqual({});
  });

  it('should throw on parse error instead of returning empty object', async () => {
    const { readSettingsFile } = await import('../commands/hooks.js');

    // File exists but contains invalid JSON
    mockReadFile.mockResolvedValue('{ invalid json !!!');

    await expect(readSettingsFile('/fake/.claude/settings.json')).rejects.toThrow(
      /Failed to parse settings file/
    );
  });

  it('should parse valid JSON correctly', async () => {
    const { readSettingsFile } = await import('../commands/hooks.js');

    mockReadFile.mockResolvedValue('{"hooks":{"preEdit":"prs hook pre-edit"}}');

    const result = await readSettingsFile('/fake/.claude/settings.json');
    expect(result).toEqual({ hooks: { preEdit: 'prs hook pre-edit' } });
  });

  it('should NOT swallow non-ENOENT filesystem errors', async () => {
    const { readSettingsFile } = await import('../commands/hooks.js');

    const permError = new Error('Permission denied') as NodeJS.ErrnoException;
    permError.code = 'EACCES';
    mockReadFile.mockRejectedValue(permError);

    await expect(readSettingsFile('/fake/.claude/settings.json')).rejects.toThrow(
      'Permission denied'
    );
  });
});
