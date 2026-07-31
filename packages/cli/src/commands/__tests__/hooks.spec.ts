import { describe, it, expect, vi, beforeEach } from 'vitest';

/* ------------------------------------------------------------------ */
/* Hoisted mocks                                                      */
/* ------------------------------------------------------------------ */

const {
  mockExistsSync,
  mockReadFile,
  mockWriteFile,
  mockMkdir,
  mockChmod,
  mockUnlink,
  mockLstat,
  mockOpen,
} = vi.hoisted(() => ({
  mockExistsSync: vi.fn(),
  mockReadFile: vi.fn(),
  mockWriteFile: vi.fn(),
  mockMkdir: vi.fn(),
  mockChmod: vi.fn(),
  mockUnlink: vi.fn(),
  mockLstat: vi.fn(),
  mockOpen: vi.fn(),
}));

vi.mock('node:fs', () => ({
  existsSync: mockExistsSync,
  constants: { O_WRONLY: 1, O_CREAT: 2, O_TRUNC: 4, O_NOFOLLOW: 8 },
}));

vi.mock('node:fs/promises', () => ({
  readFile: mockReadFile,
  writeFile: mockWriteFile,
  mkdir: mockMkdir,
  chmod: mockChmod,
  unlink: mockUnlink,
  lstat: mockLstat,
  open: mockOpen,
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
  const enoentError = new Error('ENOENT') as NodeJS.ErrnoException;
  enoentError.code = 'ENOENT';
  mockReadFile.mockRejectedValue(enoentError);
  mockWriteFile.mockResolvedValue(undefined);
  mockMkdir.mockResolvedValue(undefined);
  mockChmod.mockResolvedValue(undefined);
  mockUnlink.mockResolvedValue(undefined);
  mockLstat.mockResolvedValue({ isSymbolicLink: () => false });
  mockOpen.mockResolvedValue({
    writeFile: vi.fn().mockResolvedValue(undefined),
    chmod: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
  });
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
      const enoentError = new Error('ENOENT') as NodeJS.ErrnoException;
      enoentError.code = 'ENOENT';
      mockReadFile.mockRejectedValue(enoentError);

      await hooksCommand('install', 'claude', {});

      expect(mockMkdir).toHaveBeenCalled();
      expect(mockWriteFile).toHaveBeenCalledWith(
        expect.stringContaining('.claude/settings.json'),
        expect.any(String),
        'utf-8'
      );
    });

    it('reports malformed settings without overwriting them', async () => {
      mockReadFile.mockResolvedValue('[]');

      await hooksCommand('install', 'claude', {});

      expect(mockWriteFile).not.toHaveBeenCalled();
      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to install hooks')
      );
      expect(process.exitCode).toBe(1);
    });

    it('reports non-Error settings parse failures', async () => {
      mockReadFile.mockResolvedValue('{}');
      const parseSpy = vi.spyOn(JSON, 'parse').mockImplementationOnce(() => {
        throw 'parse failed';
      });

      await hooksCommand('install', 'claude', {});

      expect(mockWriteFile).not.toHaveBeenCalled();
      expect(mockConsole.error).toHaveBeenCalledWith(expect.stringContaining('parse failed'));
      expect(process.exitCode).toBe(1);
      parseSpy.mockRestore();
    });

    it('reports non-Error install failures', async () => {
      mockWriteFile.mockRejectedValue('write failed');

      await hooksCommand('install', 'claude', {});

      expect(mockConsole.error).toHaveBeenCalledWith(expect.stringContaining('write failed'));
      expect(process.exitCode).toBe(1);
    });

    it('refuses to write through a settings symlink', async () => {
      mockLstat.mockResolvedValue({ isSymbolicLink: () => true });

      await hooksCommand('install', 'claude', {});

      expect(mockWriteFile).not.toHaveBeenCalled();
      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining('Refusing to write through symlink')
      );
      expect(process.exitCode).toBe(1);
    });

    it('migrates legacy Factory hooks before installing canonical hooks', async () => {
      const files = new Map<string, string>();
      const legacyPath = `${process.cwd()}/.factory/settings.json`;
      files.set(
        legacyPath,
        JSON.stringify({
          permissions: { allow: ['Bash'] },
          hooks: {
            preToolUse: [
              {
                matcher: 'Execute',
                hooks: [{ type: 'command', command: 'audit' }],
              },
            ],
          },
        })
      );
      const enoentError = new Error('ENOENT') as NodeJS.ErrnoException;
      enoentError.code = 'ENOENT';
      mockExistsSync.mockImplementation((p: string) => files.has(p));
      mockReadFile.mockImplementation(async (p: string) => {
        const content = files.get(p);
        if (content === undefined) throw enoentError;
        return content;
      });
      mockWriteFile.mockImplementation(async (p: string, content: string) => {
        files.set(p, content);
      });

      await hooksCommand('install', 'factory', {});

      const canonical = JSON.parse(files.get(`${process.cwd()}/.factory/hooks.json`)!) as {
        hooks: Record<string, unknown[]>;
      };
      expect(canonical.hooks['PreToolUse']).toHaveLength(2);
      expect(JSON.parse(files.get(legacyPath)!)).toEqual({
        permissions: { allow: ['Bash'] },
      });
    });

    it('ignores legacy Factory settings without a hooks section', async () => {
      const legacyPath = `${process.cwd()}/.factory/settings.json`;
      mockExistsSync.mockImplementation((p: string) => p === legacyPath);
      mockReadFile.mockResolvedValue(JSON.stringify({ permissions: { allow: ['Bash'] } }));

      await hooksCommand('install', 'factory', {});

      expect(mockConsole.error).not.toHaveBeenCalled();
      expect(mockWriteFile).toHaveBeenCalledWith(
        expect.stringContaining('.factory/hooks.json'),
        expect.any(String),
        'utf-8'
      );
    });

    it('refuses ambiguous legacy Factory hooks during installation', async () => {
      const legacyPath = `${process.cwd()}/.factory/settings.json`;
      mockExistsSync.mockImplementation((p: string) => p === legacyPath);
      mockReadFile.mockResolvedValue(
        JSON.stringify({
          hooks: {
            unknownEvent: [{ hooks: [{ type: 'command', command: 'custom' }] }],
          },
        })
      );

      await hooksCommand('install', 'factory', {});

      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining('Cannot migrate legacy Factory hooks safely')
      );
      expect(process.exitCode).toBe(1);
    });

    it('migrates legacy Factory hooks before uninstalling them', async () => {
      const files = new Map<string, string>();
      const legacyPath = `${process.cwd()}/.factory/settings.json`;
      files.set(
        legacyPath,
        JSON.stringify({
          hooks: {
            PreToolUse: [
              {
                matcher: 'Execute',
                hooks: [{ type: 'command', command: 'prs hook pre-edit' }],
              },
            ],
          },
        })
      );
      const enoentError = new Error('ENOENT') as NodeJS.ErrnoException;
      enoentError.code = 'ENOENT';
      mockExistsSync.mockImplementation((p: string) => files.has(p));
      mockReadFile.mockImplementation(async (p: string) => {
        const content = files.get(p);
        if (content === undefined) throw enoentError;
        return content;
      });
      mockWriteFile.mockImplementation(async (p: string, content: string) => {
        files.set(p, content);
      });

      await hooksCommand('uninstall', 'factory', {});

      expect(JSON.parse(files.get(legacyPath)!)).toEqual({});
      expect(files.has(`${process.cwd()}/.factory/hooks.json`)).toBe(true);
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

      expect(mockOpen).toHaveBeenCalledTimes(2);
      expect(mockOpen).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining('prs-pre-edit.sh'),
        expect.any(Number),
        0o755
      );
      expect(mockOpen).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('prs-post-edit.sh'),
        expect.any(Number),
        0o755
      );
      expect(mockConsole.success).toHaveBeenCalledWith(expect.stringContaining('cline'));
    });

    it('refuses to overwrite unowned Cline scripts during installation', async () => {
      mockLstat.mockResolvedValue({ isSymbolicLink: () => false });
      mockReadFile.mockResolvedValue('#!/bin/bash\necho custom');

      await hooksCommand('install', 'cline', {});

      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining('Refusing to overwrite unowned Cline hook script')
      );
      expect(process.exitCode).toBe(1);
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
      const enoentError = new Error('ENOENT') as NodeJS.ErrnoException;
      enoentError.code = 'ENOENT';
      mockReadFile.mockRejectedValue(enoentError);

      await hooksCommand('uninstall', 'claude', {});

      expect(mockConsole.info).toHaveBeenCalledWith(expect.stringContaining('not installed'));
    });

    it('reports unreadable settings instead of treating hooks as absent', async () => {
      const permissionError = new Error('permission denied') as NodeJS.ErrnoException;
      permissionError.code = 'EACCES';
      mockReadFile.mockRejectedValue(permissionError);

      await hooksCommand('uninstall', 'claude', {});

      expect(mockWriteFile).not.toHaveBeenCalled();
      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to uninstall hooks')
      );
      expect(process.exitCode).toBe(1);
    });

    it('reports non-Error settings read failures', async () => {
      mockReadFile.mockRejectedValue('read failed');

      await hooksCommand('uninstall', 'claude', {});

      expect(mockWriteFile).not.toHaveBeenCalled();
      expect(mockConsole.error).toHaveBeenCalledWith(expect.stringContaining('read failed'));
      expect(process.exitCode).toBe(1);
    });

    it.each(['[]', 'null', '42'])('reports malformed uninstall settings %s', async (content) => {
      mockReadFile.mockResolvedValue(content);

      await hooksCommand('uninstall', 'claude', {});

      expect(mockWriteFile).not.toHaveBeenCalled();
      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to uninstall hooks')
      );
      expect(process.exitCode).toBe(1);
    });

    it('treats primitive and null settings values as non-hooks', async () => {
      mockReadFile.mockResolvedValue(
        JSON.stringify({
          hooks: {
            enabled: true,
            retries: 3,
            fallback: null,
            nested: [false, 0, null],
          },
        })
      );

      await hooksCommand('uninstall', 'claude', {});

      expect(mockWriteFile).not.toHaveBeenCalled();
      expect(mockConsole.info).toHaveBeenCalledWith(expect.stringContaining('not installed'));
    });

    it('does not rewrite settings when PromptScript hooks are absent', async () => {
      mockReadFile.mockResolvedValue(
        JSON.stringify({
          note: 'Run prs hook manually when debugging',
          hooks: {
            PreToolUse: [
              {
                matcher: 'OtherTool',
                hooks: [{ type: 'command', command: 'echo other' }],
              },
            ],
          },
        })
      );

      await hooksCommand('uninstall', 'claude', {});

      expect(mockWriteFile).not.toHaveBeenCalled();
      expect(mockConsole.info).toHaveBeenCalledWith(expect.stringContaining('not installed'));
    });

    it('handles Cline by deleting script files', async () => {
      mockLstat.mockResolvedValue({ isSymbolicLink: () => false });
      mockReadFile.mockImplementation(async (p: string) =>
        p.includes('prs-pre-edit')
          ? '#!/bin/bash\nprs hook pre-edit'
          : '#!/bin/bash\nprs hook post-edit'
      );

      await hooksCommand('uninstall', 'cline', {});

      expect(mockUnlink).toHaveBeenCalledWith(expect.stringContaining('prs-pre-edit.sh'));
      expect(mockUnlink).toHaveBeenCalledWith(expect.stringContaining('prs-post-edit.sh'));
      expect(mockConsole.success).toHaveBeenCalledWith(expect.stringContaining('cline'));
    });

    it('preserves unowned Cline scripts during uninstall', async () => {
      mockLstat.mockResolvedValue({ isSymbolicLink: () => false });
      mockReadFile.mockResolvedValue('#!/bin/bash\necho custom');

      await hooksCommand('uninstall', 'cline', {});

      expect(mockUnlink).not.toHaveBeenCalled();
      expect(mockConsole.warning).toHaveBeenCalledWith(
        expect.stringContaining('preserving unowned')
      );
    });

    it('rejects symlinked Cline scripts during uninstall', async () => {
      mockLstat.mockResolvedValue({ isSymbolicLink: () => true });

      await hooksCommand('uninstall', 'cline', {});

      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining('Refusing to access symlink')
      );
      expect(process.exitCode).toBe(1);
    });

    it('reports unreadable Cline scripts during uninstall', async () => {
      const permissionError = new Error('permission denied') as NodeJS.ErrnoException;
      permissionError.code = 'EACCES';
      mockLstat.mockResolvedValue({ isSymbolicLink: () => false });
      mockReadFile.mockRejectedValue(permissionError);

      await hooksCommand('uninstall', 'cline', {});

      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to uninstall hooks')
      );
      expect(process.exitCode).toBe(1);
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
