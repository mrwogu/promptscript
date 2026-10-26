import { afterEach, describe, expect, it } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { resolveWindowsGit, runGit, stripControlCharacters } from './git.js';

const originalTimeout = process.env['PROMPTSCRIPT_GIT_TIMEOUT'];
const directories: string[] = [];

afterEach(async () => {
  if (originalTimeout === undefined) {
    delete process.env['PROMPTSCRIPT_GIT_TIMEOUT'];
  } else {
    process.env['PROMPTSCRIPT_GIT_TIMEOUT'] = originalTimeout;
  }
  for (const directory of directories.splice(0)) {
    await rm(directory, { recursive: true, force: true });
  }
});

describe('stripControlCharacters', () => {
  it('removes terminal escapes and other control characters', () => {
    expect(stripControlCharacters('fix\u001b[2J\u0007 it\u009b')).toBe('fix[2J it');
  });

  it('removes bidi controls that reorder text', () => {
    expect(stripControlCharacters('a\u202eb\u2066c\u2069d\u202ae')).toBe('abcde');
  });
});

describe('resolveWindowsGit', () => {
  const files = new Set(['C:\\Git\\cmd\\git.exe', 'D:\\tools\\git.com']);
  const exists = (path: string): boolean => files.has(path);

  it('takes the first absolute PATH entry that holds git', () => {
    const path = ['.', 'bin', '"C:\\Git\\cmd"', 'D:\\tools'].join(';');

    expect(resolveWindowsGit(path, exists)).toBe('C:\\Git\\cmd\\git.exe');
  });

  it('never looks in a relative entry, so the checkout cannot supply git', () => {
    expect(resolveWindowsGit('.;cmd;D:\\tools', exists)).toBe('D:\\tools\\git.com');
    expect(resolveWindowsGit('.;cmd', () => true)).toBeUndefined();
    expect(resolveWindowsGit(undefined, exists)).toBeUndefined();
  });
});

describe('runGit', () => {
  it('returns a non-zero status instead of throwing', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'promptscript-release-git-'));
    directories.push(directory);
    process.env['PROMPTSCRIPT_GIT_TIMEOUT'] = 'not-a-number';

    const result = await runGit(['log', '--max-count=1', '--', 'x.json'], directory);

    expect(result.status).not.toBe(0);
    expect(result.stderr).not.toBe('');
  });

  it('rejects with PS5006 when Git cannot start', async () => {
    const missing = join(tmpdir(), 'promptscript-release-git-missing', 'nowhere');

    await expect(runGit(['status'], missing)).rejects.toMatchObject({ code: 'PS5006' });
  });

  it('rejects with PS5006 when Git runs past PROMPTSCRIPT_GIT_TIMEOUT', async () => {
    process.env['PROMPTSCRIPT_GIT_TIMEOUT'] = '1';

    await expect(runGit(['hash-object', '--stdin'], tmpdir())).rejects.toMatchObject({
      code: 'PS5006',
    });
  });
});
