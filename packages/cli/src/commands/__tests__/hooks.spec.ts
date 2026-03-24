import { describe, it, expect, vi, beforeEach } from 'vitest';

/* ------------------------------------------------------------------ */
/* Hoisted mocks                                                      */
/* ------------------------------------------------------------------ */

const { mockExistsSync, mockReadFile, mockWriteFile, mockMkdir, mockChmod, mockUnlink } =
  vi.hoisted(() => ({
    mockExistsSync: vi.fn(),
    mockReadFile: vi.fn(),
    mockWriteFile: vi.fn(),
    mockMkdir: vi.fn(),
    mockChmod: vi.fn(),
    mockUnlink: vi.fn(),
  }));

vi.mock('node:fs', () => ({
  existsSync: mockExistsSync,
}));

vi.mock('node:fs/promises', () => ({
  readFile: mockReadFile,
  writeFile: mockWriteFile,
  mkdir: mockMkdir,
  chmod: mockChmod,
  unlink: mockUnlink,
}));

/* Mock ConsoleOutput */
const mockConsole = vi.hoisted(() => ({
  success: vi.fn(),
  warning: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  muted: vi.fn(),
  newline: vi.fn(),
  header: vi.fn(),
  formatPath: vi.fn((p: string) => p),
}));

vi.mock('../../output/console.js', () => ({
  ConsoleOutput: mockConsole,
}));

import { hooksCommand } from '../hooks.js';

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

function setupDetectPaths(detected: string[]): void {
  mockExistsSync.mockImplementation((p: string) => {
    return detected.some((d) => p.endsWith(d));
  });
}

/**
 * By default: no files exist, readFile returns empty JSON, writeFile succeeds.
 */
function setupDefaults(): void {
  mockExistsSync.mockReturnValue(false);
  mockReadFile.mockRejectedValue(new Error('ENOENT'));
  mockWriteFile.mockResolvedValue(undefined);
  mockMkdir.mockResolvedValue(undefined);
  mockChmod.mockResolvedValue(undefined);
  mockUnlink.mockResolvedValue(undefined);
}

/* ------------------------------------------------------------------ */
/* Tests                                                              */
/* ------------------------------------------------------------------ */

describe('hooksCommand', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    setupDefaults();
    process.exitCode = undefined;
  });

  describe('install', () => {
    it('auto-detects claude from .claude/ directory existing', async () => {
      setupDetectPaths(['.claude']);

      await hooksCommand('install', undefined, {});

      // Should have written .claude/settings.json
      expect(mockWriteFile).toHaveBeenCalledWith(
        expect.stringContaining('.claude/settings.json'),
        expect.any(String),
        'utf-8'
      );
      expect(mockConsole.success).toHaveBeenCalledWith(expect.stringContaining('claude'));
    });

    it('installs for specific tool when name provided', async () => {
      // Don't need detectPaths when tool is specified explicitly
      await hooksCommand('install', 'cursor', {});

      expect(mockMkdir).toHaveBeenCalled();
      expect(mockWriteFile).toHaveBeenCalledWith(
        expect.stringContaining('.cursor/hooks.json'),
        expect.any(String),
        'utf-8'
      );
      expect(mockConsole.success).toHaveBeenCalledWith(expect.stringContaining('cursor'));
    });

    it('merges into existing settings preserving other hooks', async () => {
      const existingSettings = {
        hooks: {
          PreToolUse: [
            {
              matcher: 'OtherTool',
              hooks: [{ type: 'command', command: 'echo hi' }],
            },
          ],
        },
      };

      mockReadFile.mockResolvedValue(JSON.stringify(existingSettings));

      await hooksCommand('install', 'claude', {});

      const writtenJson = JSON.parse(mockWriteFile.mock.calls[0]![1] as string) as Record<
        string,
        unknown
      >;
      const hooks = writtenJson['hooks'] as Record<string, unknown>;
      const preToolUse = hooks['PreToolUse'] as unknown[];
      // Existing entry preserved
      expect(preToolUse).toHaveLength(2);
      expect(preToolUse[0]).toEqual(existingSettings.hooks.PreToolUse[0]);
    });

    it('skips if already installed (prints info message)', async () => {
      const existingSettings = {
        hooks: {
          PreToolUse: [
            {
              matcher: 'Edit|Write',
              hooks: [{ type: 'command', command: 'prs hook pre-edit' }],
            },
          ],
          PostToolUse: [
            {
              matcher: 'Edit|Write',
              hooks: [{ type: 'command', command: 'prs hook post-edit' }],
            },
          ],
        },
      };

      mockReadFile.mockResolvedValue(JSON.stringify(existingSettings));

      await hooksCommand('install', 'claude', {});

      // Should report already installed via info
      expect(mockConsole.info).toHaveBeenCalledWith(expect.stringContaining('already installed'));
    });

    it('creates settings file if missing', async () => {
      mockReadFile.mockRejectedValue(new Error('ENOENT'));

      await hooksCommand('install', 'claude', {});

      expect(mockMkdir).toHaveBeenCalled();
      expect(mockWriteFile).toHaveBeenCalledWith(
        expect.stringContaining('.claude/settings.json'),
        expect.any(String),
        'utf-8'
      );
    });

    it('errors when no tools detected and no tool specified', async () => {
      // No detect paths match
      mockExistsSync.mockReturnValue(false);

      await hooksCommand('install', undefined, {});

      expect(process.exitCode).toBe(1);
      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining('No AI tools detected')
      );
    });

    it('errors when no tools detected with --all flag', async () => {
      mockExistsSync.mockReturnValue(false);

      await hooksCommand('install', undefined, { all: true });

      expect(process.exitCode).toBe(1);
      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining('No AI tools detected')
      );
    });

    it('uses prs path in generated config', async () => {
      await hooksCommand('install', 'claude', {});

      const writtenJson = JSON.parse(mockWriteFile.mock.calls[0]![1] as string) as Record<
        string,
        unknown
      >;
      const hooks = writtenJson['hooks'] as Record<string, unknown>;
      const postToolUse = hooks['PostToolUse'] as Array<Record<string, unknown>>;
      const hookEntries = postToolUse[0]!['hooks'] as Array<Record<string, unknown>>;
      expect(hookEntries[0]!['command']).toContain('prs hook post-edit');
    });

    it('handles Cline by writing script files', async () => {
      await hooksCommand('install', 'cline', {});

      // Should write pre-edit and post-edit script files
      expect(mockWriteFile).toHaveBeenCalledWith(
        expect.stringContaining('prs-pre-edit.sh'),
        expect.stringContaining('prs hook pre-edit'),
        'utf-8'
      );
      expect(mockWriteFile).toHaveBeenCalledWith(
        expect.stringContaining('prs-post-edit.sh'),
        expect.stringContaining('prs hook post-edit'),
        'utf-8'
      );
      // Should chmod +x the scripts
      expect(mockChmod).toHaveBeenCalledWith(expect.stringContaining('prs-pre-edit.sh'), 0o755);
      expect(mockChmod).toHaveBeenCalledWith(expect.stringContaining('prs-post-edit.sh'), 0o755);
      expect(mockConsole.success).toHaveBeenCalledWith(expect.stringContaining('cline'));
    });

    it('errors for unknown tool name', async () => {
      await hooksCommand('install', 'unknown-tool', {});

      expect(process.exitCode).toBe(1);
      expect(mockConsole.error).toHaveBeenCalledWith(expect.stringContaining('Unknown tool'));
    });
  });

  describe('uninstall', () => {
    it('removes prs hook entries from settings', async () => {
      const existingSettings = {
        hooks: {
          PreToolUse: [
            {
              matcher: 'Edit|Write',
              hooks: [{ type: 'command', command: 'prs hook pre-edit' }],
            },
          ],
          PostToolUse: [
            {
              matcher: 'Edit|Write',
              hooks: [{ type: 'command', command: 'prs hook post-edit' }],
            },
          ],
        },
      };

      mockReadFile.mockResolvedValue(JSON.stringify(existingSettings));

      await hooksCommand('uninstall', 'claude', {});

      const writtenJson = JSON.parse(mockWriteFile.mock.calls[0]![1] as string) as Record<
        string,
        unknown
      >;
      const hooks = writtenJson['hooks'] as Record<string, unknown>;
      const preToolUse = hooks['PreToolUse'] as unknown[];
      const postToolUse = hooks['PostToolUse'] as unknown[];
      expect(preToolUse).toHaveLength(0);
      expect(postToolUse).toHaveLength(0);
      expect(mockConsole.success).toHaveBeenCalledWith(expect.stringContaining('uninstall'));
    });

    it('preserves other hooks during uninstall', async () => {
      const existingSettings = {
        hooks: {
          PreToolUse: [
            {
              matcher: 'OtherTool',
              hooks: [{ type: 'command', command: 'echo other' }],
            },
            {
              matcher: 'Edit|Write',
              hooks: [{ type: 'command', command: 'prs hook pre-edit' }],
            },
          ],
          PostToolUse: [],
        },
      };

      mockReadFile.mockResolvedValue(JSON.stringify(existingSettings));

      await hooksCommand('uninstall', 'claude', {});

      const writtenJson = JSON.parse(mockWriteFile.mock.calls[0]![1] as string) as Record<
        string,
        unknown
      >;
      const hooks = writtenJson['hooks'] as Record<string, unknown>;
      const preToolUse = hooks['PreToolUse'] as unknown[];
      expect(preToolUse).toHaveLength(1);
      expect((preToolUse[0] as Record<string, unknown>)['matcher']).toBe('OtherTool');
    });

    it('handles missing settings file gracefully', async () => {
      mockReadFile.mockRejectedValue(new Error('ENOENT'));

      await hooksCommand('uninstall', 'claude', {});

      expect(mockConsole.info).toHaveBeenCalledWith(expect.stringContaining('not installed'));
    });

    it('handles Cline by deleting script files', async () => {
      // Make scripts "exist" for cline
      mockExistsSync.mockImplementation((p: string) => {
        return typeof p === 'string' && p.includes('prs-');
      });

      await hooksCommand('uninstall', 'cline', {});

      expect(mockUnlink).toHaveBeenCalledWith(expect.stringContaining('prs-pre-edit.sh'));
      expect(mockUnlink).toHaveBeenCalledWith(expect.stringContaining('prs-post-edit.sh'));
      expect(mockConsole.success).toHaveBeenCalledWith(expect.stringContaining('cline'));
    });
  });

  describe('invalid action', () => {
    it('errors for invalid action', async () => {
      await hooksCommand('invalid', undefined, {});

      expect(process.exitCode).toBe(1);
      expect(mockConsole.error).toHaveBeenCalledWith(expect.stringContaining('Unknown action'));
    });
  });
});
