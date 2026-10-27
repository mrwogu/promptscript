import { describe, it, expect, afterEach } from 'vitest';
import {
  chmodSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createFileExclusive, writeFileAtomic } from './write-file-atomic.js';

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

  it('writes bytes as they are', () => {
    const dir = tempDir();
    const file = join(dir, 'CODEOWNERS');
    const bytes = Buffer.from([0x23, 0x20, 0xe9, 0x0a]);

    writeFileAtomic(file, bytes, 0o644);

    expect(readFileSync(file)).toEqual(bytes);
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

describe('createFileExclusive', () => {
  const dirs: string[] = [];
  const tempDir = (): string => {
    const dir = mkdtempSync(join(tmpdir(), 'prs-exclusive-'));
    dirs.push(dir);
    return dir;
  };

  afterEach(() => {
    for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
  });

  it('creates the file with the mode and leaves no temporary file', () => {
    const dir = tempDir();
    const file = join(dir, 'record.json');

    createFileExclusive(file, '{}\n', 0o644);

    expect(readFileSync(file, 'utf-8')).toBe('{}\n');
    expect(statSync(file).mode & 0o7777).toBe(0o644);
    expect(readdirSync(dir)).toEqual(['record.json']);
  });

  it('refuses an existing file or link with EEXIST and keeps it', () => {
    const dir = tempDir();
    const file = join(dir, 'record.json');
    writeFileSync(file, 'old');
    const link = join(dir, 'link.json');
    symlinkSync(join(dir, 'nowhere.json'), link);

    expect(() => createFileExclusive(file, 'new', 0o644)).toThrow(
      expect.objectContaining({ code: 'EEXIST' })
    );
    expect(() => createFileExclusive(link, 'new', 0o644)).toThrow(
      expect.objectContaining({ code: 'EEXIST' })
    );
    expect(readFileSync(file, 'utf-8')).toBe('old');
    expect(readdirSync(dir).sort()).toEqual(['link.json', 'record.json']);
  });
});
