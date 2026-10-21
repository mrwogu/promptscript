import { describe, it, expect, afterEach } from 'vitest';
import {
  chmodSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { writeFileAtomic } from './write-file-atomic.js';

describe('writeFileAtomic', () => {
  const dirs: string[] = [];
  const tempDir = (): string => {
    const dir = mkdtempSync(join(tmpdir(), 'prs-atomic-'));
    dirs.push(dir);
    return dir;
  };

  afterEach(() => {
    for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
  });

  it('replaces the content, keeps the mode and leaves no temporary file', () => {
    const dir = tempDir();
    const file = join(dir, 'a.prs');
    writeFileSync(file, 'old');
    chmodSync(file, 0o640);

    writeFileAtomic(file, 'new', 0o640);

    expect(readFileSync(file, 'utf-8')).toBe('new');
    expect(statSync(file).mode & 0o7777).toBe(0o640);
    expect(readdirSync(dir)).toEqual(['a.prs']);
  });

  it('cleans up and rethrows when the target cannot be replaced', () => {
    const dir = tempDir();

    expect(() => writeFileAtomic(join(dir, 'missing', 'a.prs'), 'x', 0o644)).toThrow();
    expect(readdirSync(dir)).toEqual([]);
  });

  it('removes the temporary file when the rename fails', () => {
    const dir = tempDir();
    const target = join(dir, 'target');
    mkdirSync(target);
    writeFileSync(join(target, 'keep'), 'x');

    expect(() => writeFileAtomic(target, 'new', 0o644)).toThrow();
    expect(readdirSync(dir)).toEqual(['target']);
  });
});
