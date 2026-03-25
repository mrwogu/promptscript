import { describe, it, expect, vi, beforeEach } from 'vitest';

const {
  mockExtractFilePath,
  mockDetectMarker,
  mockAcquireLock,
  mockReleaseLock,
  mockCompileCommand,
} = vi.hoisted(() => {
  return {
    mockExtractFilePath: vi.fn(),
    mockDetectMarker: vi.fn(),
    mockAcquireLock: vi.fn(),
    mockReleaseLock: vi.fn(),
    mockCompileCommand: vi.fn(),
  };
});

vi.mock('../../hooks/extract-file-path.js', () => ({
  extractFilePath: mockExtractFilePath,
}));

vi.mock('../../hooks/detect-marker.js', () => ({
  detectMarker: mockDetectMarker,
}));

vi.mock('../../hooks/debounce-lock.js', () => ({
  acquireLock: mockAcquireLock,
  releaseLock: mockReleaseLock,
}));

vi.mock('../compile.js', () => ({
  compileCommand: mockCompileCommand,
}));

import { hookCommand, type HookInternalOptions } from '../hook.js';

/**
 * Helper: call hookCommand with a JSON string as mock stdin.
 */
function callHook(action: string, json: string): Promise<void> {
  const opts: HookInternalOptions = { stdin: json };
  return hookCommand(action, opts);
}

describe('hookCommand', () => {
  let stderrSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.resetAllMocks();
    process.exitCode = undefined;
    stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
  });

  describe('pre-edit', () => {
    it('exits 0 when stdin is empty', async () => {
      await callHook('pre-edit', '');
      expect(process.exitCode).toBeUndefined();
    });

    it('exits 1 with warning on malformed JSON', async () => {
      await callHook('pre-edit', '{not json');
      expect(process.exitCode).toBe(1);
      expect(stderrSpy).toHaveBeenCalledWith(expect.stringContaining('malformed'));
    });

    it('exits 0 when no file path is extracted', async () => {
      mockExtractFilePath.mockReturnValue(null);
      await callHook('pre-edit', '{}');
      expect(process.exitCode).toBeUndefined();
    });

    it('exits 0 when file is not generated', async () => {
      mockExtractFilePath.mockReturnValue('/some/file.md');
      mockDetectMarker.mockResolvedValue({ isGenerated: false, source: null, target: null });
      await callHook('pre-edit', '{"tool_input":{"file_path":"/some/file.md"}}');
      expect(process.exitCode).toBeUndefined();
    });

    it('exits 2 with source path when file is generated with source', async () => {
      mockExtractFilePath.mockReturnValue('/out/CLAUDE.md');
      mockDetectMarker.mockResolvedValue({
        isGenerated: true,
        source: '.promptscript/project.prs',
        target: 'claude',
      });
      await callHook('pre-edit', '{"tool_input":{"file_path":"/out/CLAUDE.md"}}');
      expect(process.exitCode).toBe(2);
      expect(stderrSpy).toHaveBeenCalledWith(expect.stringContaining('.promptscript/project.prs'));
    });

    it('exits 2 with generic message when file has legacy marker (no source)', async () => {
      mockExtractFilePath.mockReturnValue('/out/CLAUDE.md');
      mockDetectMarker.mockResolvedValue({
        isGenerated: true,
        source: null,
        target: null,
      });
      await callHook('pre-edit', '{"tool_input":{"file_path":"/out/CLAUDE.md"}}');
      expect(process.exitCode).toBe(2);
      expect(stderrSpy).toHaveBeenCalledWith(expect.stringContaining('prs compile'));
    });
  });

  describe('post-edit', () => {
    it('exits 0 when stdin is empty', async () => {
      await callHook('post-edit', '');
      expect(process.exitCode).toBeUndefined();
    });

    it('exits 0 when no file path is extracted', async () => {
      mockExtractFilePath.mockReturnValue(null);
      await callHook('post-edit', '{}');
      expect(process.exitCode).toBeUndefined();
    });

    it('exits 0 when file is not a .prs file', async () => {
      mockExtractFilePath.mockReturnValue('/some/file.md');
      await callHook('post-edit', '{"tool_input":{"file_path":"/some/file.md"}}');
      expect(process.exitCode).toBeUndefined();
      expect(mockAcquireLock).not.toHaveBeenCalled();
    });

    it('compiles and releases lock for .prs file', async () => {
      mockExtractFilePath.mockReturnValue('/project/.promptscript/project.prs');
      mockAcquireLock.mockReturnValue(true);
      mockCompileCommand.mockResolvedValue(undefined);

      await callHook(
        'post-edit',
        '{"tool_input":{"file_path":"/project/.promptscript/project.prs"},"cwd":"/project"}'
      );

      expect(process.exitCode).toBeUndefined();
      expect(mockAcquireLock).toHaveBeenCalledWith('/project');
      expect(mockCompileCommand).toHaveBeenCalledWith({ cwd: '/project' });
      expect(mockReleaseLock).toHaveBeenCalledWith('/project');
    });

    it('skips compile when lock is held and exits 0', async () => {
      mockExtractFilePath.mockReturnValue('/project/.promptscript/project.prs');
      mockAcquireLock.mockReturnValue(false);

      await callHook(
        'post-edit',
        '{"tool_input":{"file_path":"/project/.promptscript/project.prs"},"cwd":"/project"}'
      );

      expect(process.exitCode).toBeUndefined();
      expect(mockCompileCommand).not.toHaveBeenCalled();
      expect(mockReleaseLock).not.toHaveBeenCalled();
    });

    it('exits 0 and reports error on stderr when compile fails, and releases lock', async () => {
      mockExtractFilePath.mockReturnValue('/project/.promptscript/project.prs');
      mockAcquireLock.mockReturnValue(true);
      mockCompileCommand.mockRejectedValue(new Error('compile boom'));

      await callHook(
        'post-edit',
        '{"tool_input":{"file_path":"/project/.promptscript/project.prs"},"cwd":"/project"}'
      );

      expect(process.exitCode).toBeUndefined();
      expect(stderrSpy).toHaveBeenCalledWith(expect.stringContaining('compile boom'));
      expect(mockReleaseLock).toHaveBeenCalledWith('/project');
    });

    it('uses process.cwd() when no cwd in payload', async () => {
      const originalCwd = process.cwd();
      mockExtractFilePath.mockReturnValue('/somewhere/test.prs');
      mockAcquireLock.mockReturnValue(true);
      mockCompileCommand.mockResolvedValue(undefined);

      await callHook('post-edit', '{"tool_input":{"file_path":"/somewhere/test.prs"}}');

      expect(mockAcquireLock).toHaveBeenCalledWith(originalCwd);
      expect(mockCompileCommand).toHaveBeenCalledWith({ cwd: originalCwd });
      expect(mockReleaseLock).toHaveBeenCalledWith(originalCwd);
    });
  });

  describe('unknown action', () => {
    it('exits 1 for unknown action', async () => {
      await hookCommand('invalid-action', { stdin: '{"tool_input":{"file_path":"/test.ts"}}' });
      expect(process.exitCode).toBe(1);
      expect(stderrSpy).toHaveBeenCalledWith(expect.stringContaining('unknown action'));
    });
  });

  describe('TTY detection', () => {
    it('exits 1 with usage message when stdin is a TTY and no internal stdin provided', async () => {
      const originalIsTTY = process.stdin.isTTY;
      try {
        Object.defineProperty(process.stdin, 'isTTY', { value: true, configurable: true });

        await hookCommand('pre-edit');

        expect(process.exitCode).toBe(1);
        expect(stderrSpy).toHaveBeenCalledWith(
          expect.stringContaining('no input received on stdin')
        );
      } finally {
        Object.defineProperty(process.stdin, 'isTTY', {
          value: originalIsTTY,
          configurable: true,
        });
      }
    });
  });
});
