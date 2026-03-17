import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { resolve } from 'path';

// Mock ora
vi.mock('ora', () => ({
  default: vi.fn(() => ({
    start: vi.fn().mockReturnThis(),
    succeed: vi.fn().mockReturnThis(),
    fail: vi.fn().mockReturnThis(),
    warn: vi.fn().mockReturnThis(),
    stop: vi.fn().mockReturnThis(),
    text: '',
  })),
}));

// Mock chalk
vi.mock('chalk', () => ({
  default: {
    green: (s: string) => s,
    red: (s: string) => s,
    yellow: (s: string) => s,
    blue: (s: string) => s,
    gray: (s: string) => s,
    cyan: (s: string) => s,
    bold: (s: string) => s,
  },
}));

// Mock console
vi.spyOn(console, 'log').mockImplementation(() => {});
vi.spyOn(console, 'error').mockImplementation(() => {});

// Mock fs for write operations
const mockWriteFileSync = vi.fn();
const mockMkdirSync = vi.fn();
const mockExistsSync = vi.fn().mockReturnValue(false);

vi.mock('fs', async () => {
  const actual = await vi.importActual<typeof import('fs')>('fs');
  return {
    ...actual,
    writeFileSync: (...args: unknown[]) => mockWriteFileSync(...args),
    mkdirSync: (...args: unknown[]) => mockMkdirSync(...args),
    existsSync: (path: string) => {
      // Allow the importer to read real fixture files
      if (path.includes('fixtures') || path.includes('sample-')) {
        return actual.existsSync(path);
      }
      return mockExistsSync(path);
    },
  };
});

import { importCommand } from '../commands/import.js';

// Fixture path (from importer package)
const fixturesDir = resolve(__dirname, '../../../importer/src/__tests__/fixtures');

describe('importCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.exitCode = undefined;
  });

  afterEach(() => {
    process.exitCode = undefined;
  });

  it('imports a CLAUDE.md file and writes output', async () => {
    await importCommand(resolve(fixturesDir, 'sample-claude.md'), {});

    expect(mockMkdirSync).toHaveBeenCalled();
    expect(mockWriteFileSync).toHaveBeenCalledWith(
      expect.stringContaining('imported.prs'),
      expect.stringContaining('@meta'),
      'utf-8'
    );
  });

  it('dry-run mode does not write files', async () => {
    await importCommand(resolve(fixturesDir, 'sample-claude.md'), { dryRun: true });

    expect(mockWriteFileSync).not.toHaveBeenCalled();
  });

  it('sets exitCode on error for nonexistent file', async () => {
    await importCommand('/nonexistent/file.md', {});

    expect(process.exitCode).toBe(1);
  });

  it('respects custom output directory', async () => {
    await importCommand(resolve(fixturesDir, 'sample-claude.md'), {
      output: '/tmp/prs-test-output',
    });

    expect(mockWriteFileSync).toHaveBeenCalledWith(
      expect.stringContaining('/tmp/prs-test-output'),
      expect.any(String),
      'utf-8'
    );
  });
});
