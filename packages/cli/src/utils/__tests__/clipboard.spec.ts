import { describe, it, expect, vi, beforeEach } from 'vitest';
import { copyToClipboard } from '../clipboard.js';
import { execFileSync } from 'child_process';

vi.mock('child_process', () => ({
  execFileSync: vi.fn(),
}));

describe('copyToClipboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns true on success', () => {
    vi.mocked(execFileSync).mockReturnValue(Buffer.from(''));
    const result = copyToClipboard('hello');
    expect(result).toBe(true);
    expect(execFileSync).toHaveBeenCalled();
  });

  it('returns false when clipboard command fails', () => {
    vi.mocked(execFileSync).mockImplementation(() => {
      throw new Error('command not found');
    });
    const result = copyToClipboard('hello');
    expect(result).toBe(false);
  });

  it('passes text via stdin to the clipboard command', () => {
    vi.mocked(execFileSync).mockReturnValue(Buffer.from(''));
    copyToClipboard('test content');
    expect(execFileSync).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Array),
      expect.objectContaining({ input: 'test content' })
    );
  });
});
