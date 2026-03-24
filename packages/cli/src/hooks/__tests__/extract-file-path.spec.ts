import { describe, it, expect } from 'vitest';
import { extractFilePath } from '../extract-file-path.js';

describe('hooks/extractFilePath', () => {
  // Claude Code PostToolUse — tool_input.file_path
  it('extracts file_path from Claude Code PostToolUse payload', () => {
    const payload = {
      tool_name: 'Edit',
      tool_input: { file_path: '/workspace/foo.ts', old_string: 'a', new_string: 'b' },
    };
    expect(extractFilePath(payload)).toBe('/workspace/foo.ts');
  });

  // Factory AI PostToolUse — tool_input.file_path
  it('extracts file_path from Factory AI PostToolUse payload', () => {
    const payload = {
      tool_name: 'write_file',
      tool_input: { file_path: '/project/bar.py', content: 'print("hi")' },
    };
    expect(extractFilePath(payload)).toBe('/project/bar.py');
  });

  // Copilot PostToolUse — tool_input.file_path
  it('extracts file_path from Copilot PostToolUse payload', () => {
    const payload = {
      event: 'PostToolUse',
      tool_input: { file_path: '/src/main.ts' },
    };
    expect(extractFilePath(payload)).toBe('/src/main.ts');
  });

  // Gemini CLI AfterTool — write_file, arguments.file_path
  it('extracts file_path from Gemini CLI write_file payload', () => {
    const payload = {
      tool_name: 'write_file',
      arguments: { file_path: '/tmp/output.txt', content: 'hello' },
    };
    expect(extractFilePath(payload)).toBe('/tmp/output.txt');
  });

  // Gemini CLI AfterTool — edit_file, arguments.file_path
  it('extracts file_path from Gemini CLI edit_file payload', () => {
    const payload = {
      tool_name: 'edit_file',
      arguments: { file_path: '/src/component.tsx' },
    };
    expect(extractFilePath(payload)).toBe('/src/component.tsx');
  });

  // Gemini CLI — non-write tool (read_file) → null
  it('returns null for Gemini CLI read_file (non-write tool)', () => {
    const payload = {
      tool_name: 'read_file',
      arguments: { file_path: '/src/component.tsx' },
    };
    expect(extractFilePath(payload)).toBeNull();
  });

  // Cursor afterFileEdit — filePath (camelCase)
  it('extracts filePath from Cursor afterFileEdit payload', () => {
    const payload = {
      event: 'afterFileEdit',
      filePath: '/Users/dev/project/index.ts',
    };
    expect(extractFilePath(payload)).toBe('/Users/dev/project/index.ts');
  });

  // Windsurf post_write_code — file_path top-level (no tool_input wrapper)
  it('extracts file_path from Windsurf post_write_code payload', () => {
    const payload = {
      hook: 'post_write_code',
      file_path: '/app/service.ts',
    };
    expect(extractFilePath(payload)).toBe('/app/service.ts');
  });

  // Cline hook — file
  it('extracts file from Cline hook payload', () => {
    const payload = {
      type: 'PostToolUse',
      file: '/home/user/repo/utils.ts',
    };
    expect(extractFilePath(payload)).toBe('/home/user/repo/utils.ts');
  });

  // Edge cases
  it('returns null for empty object', () => {
    expect(extractFilePath({})).toBeNull();
  });

  it('returns null for null', () => {
    expect(extractFilePath(null)).toBeNull();
  });

  it('returns null for a plain string', () => {
    expect(extractFilePath('/some/path.ts')).toBeNull();
  });

  it('returns null for undefined', () => {
    expect(extractFilePath(undefined)).toBeNull();
  });

  // Bash tool — has tool_input but no file_path inside
  it('returns null for Bash tool payload with no file_path', () => {
    const payload = {
      tool_name: 'Bash',
      tool_input: { command: 'ls -la' },
    };
    expect(extractFilePath(payload)).toBeNull();
  });

  // Prefers tool_input.file_path over top-level file_path
  it('prefers tool_input.file_path over top-level file_path', () => {
    const payload = {
      tool_input: { file_path: '/correct/path.ts' },
      file_path: '/wrong/path.ts',
    };
    expect(extractFilePath(payload)).toBe('/correct/path.ts');
  });
});
