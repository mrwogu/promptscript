import { afterEach, describe, expect, it, vi } from 'vitest';
import { execFileSync } from 'node:child_process';
import { chmod, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  CatFileBatchParser,
  errorMessage,
  escapeControlCharacters,
  readBlobs,
  resolveWindowsGit,
  runGit,
  stripControlCharacters,
} from './git.js';

const originalTimeout = process.env['PROMPTSCRIPT_GIT_TIMEOUT'];
const directories: string[] = [];

afterEach(async () => {
  vi.unstubAllEnvs();
  if (originalTimeout === undefined) {
    delete process.env['PROMPTSCRIPT_GIT_TIMEOUT'];
  } else {
    process.env['PROMPTSCRIPT_GIT_TIMEOUT'] = originalTimeout;
  }
  for (const directory of directories.splice(0)) {
    await rm(directory, { recursive: true, force: true });
  }
});

describe('escapeControlCharacters', () => {
  it('writes each control, bidi and zero-width character as uppercase hex', () => {
    expect(escapeControlCharacters('a\u001b\u202eb\u200bc\ufeff')).toBe(
      String.raw`a\u001B\u202Eb\u200Bc\uFEFF`
    );
    expect(escapeControlCharacters('plain text')).toBe('plain text');
  });

  it('writes tag characters, variation selectors and lone surrogates', () => {
    expect(escapeControlCharacters('a\u{e0001}b\ufe0fc\u00ad\u2063')).toBe(
      String.raw`a\uE0001b\uFE0Fc\u00AD\u2063`
    );
    expect(escapeControlCharacters('a\u180bb\u180fc\u{e0100}d\u{e01ef}')).toBe(
      String.raw`a\u180Bb\u180Fc\uE0100d\uE01EF`
    );
    expect(escapeControlCharacters('x\ud800y\udc00z')).toBe(String.raw`x\uD800y\uDC00z`);
    expect(escapeControlCharacters('ok \u{1f600} \ud83d\ude00')).toBe('ok \u{1f600} \ud83d\ude00');
  });
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

  it('rejects with PS5006 and names the limit when Git prints more than maxBuffer', async () => {
    await expect(runGit(['--version'], tmpdir(), { maxBuffer: 4 })).rejects.toMatchObject({
      code: 'PS5006',
      message: expect.stringContaining('git --version printed more than 4 bytes'),
    });
  });

  it('rejects with PS5006 when Git runs past PROMPTSCRIPT_GIT_TIMEOUT', async () => {
    process.env['PROMPTSCRIPT_GIT_TIMEOUT'] = '1';

    await expect(runGit(['hash-object', '--stdin'], tmpdir())).rejects.toMatchObject({
      code: 'PS5006',
    });
  });
});

async function repository(): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), 'promptscript-release-git-'));
  directories.push(directory);
  execFileSync('git', ['init', '-q'], { cwd: directory, stdio: 'ignore' });
  return directory;
}

/** Write each content as a blob and return the blob ids in order. */
async function blobs(directory: string, contents: (string | Buffer)[]): Promise<string[]> {
  const names = await Promise.all(
    contents.map(async (content, index) => {
      const name = `blob-${index}`;
      await writeFile(join(directory, name), content);
      return name;
    })
  );
  return execFileSync('git', ['hash-object', '-w', '--', ...names], {
    cwd: directory,
    encoding: 'utf-8',
  })
    .trim()
    .split('\n');
}

describe('readBlobs', () => {
  it('reads many blobs with one process, byte for byte, newlines and all', async () => {
    const directory = await repository();
    const contents = Array.from({ length: 300 }, (_, index) => `{\n  "n": ${index}\n}\n`);
    contents.push('', '\n\n', 'no line feed at the end');
    const binary = Buffer.from([0, 10, 255, 10, 13, 10]);
    const ids = await blobs(directory, [...contents, binary]);

    const read = await readBlobs([...ids, ids[0] ?? ''], directory, { maxBytes: 64 });

    expect(read.missing.size).toBe(0);
    expect(read.tooLarge.size).toBe(0);
    expect(read.blobs.size).toBe(ids.length);
    contents.forEach((content, index) => {
      expect(read.blobs.get(ids[index] ?? '')?.toString('utf-8')).toBe(content);
    });
    expect(read.blobs.get(ids.at(-1) ?? '')).toEqual(binary);
  });

  it('lists ids Git has no blob for as missing and keeps no content over maxBytes', async () => {
    const directory = await repository();
    const [small, large] = await blobs(directory, ['small', 'x'.repeat(100)]);
    const tree = execFileSync('git', ['write-tree'], { cwd: directory, encoding: 'utf-8' }).trim();
    const gone = '0'.repeat(40);

    const read = await readBlobs([small ?? '', large ?? '', gone, tree], directory, {
      maxBytes: 99,
    });

    expect([...read.blobs.keys()]).toEqual([small]);
    expect([...read.tooLarge]).toEqual([large]);
    expect([...read.missing].sort()).toEqual([gone, tree].sort());
  });

  it('starts no process for no ids', async () => {
    const missing = join(tmpdir(), 'promptscript-release-git-missing', 'nowhere');

    const read = await readBlobs([], missing, { maxBytes: 1 });

    expect(read.blobs.size + read.tooLarge.size + read.missing.size).toBe(0);
  });

  it('refuses an id that is no object id, so stdin holds nothing else', async () => {
    const directory = await repository();

    await expect(
      readBlobs([`${'a'.repeat(40)}\nHEAD`], directory, { maxBytes: 1 })
    ).rejects.toMatchObject({ code: 'PS5006', message: expect.stringContaining('not a Git') });
  });

  it('rejects with PS5006 when Git cannot start or is not in a repository', async () => {
    const missing = join(tmpdir(), 'promptscript-release-git-missing', 'nowhere');
    const outside = await mkdtemp(join(tmpdir(), 'promptscript-release-git-'));
    directories.push(outside);
    vi.stubEnv('GIT_CEILING_DIRECTORIES', tmpdir());

    await expect(readBlobs(['a'.repeat(40)], missing, { maxBytes: 1 })).rejects.toMatchObject({
      code: 'PS5006',
    });
    await expect(readBlobs(['a'.repeat(40)], outside, { maxBytes: 1 })).rejects.toMatchObject({
      code: 'PS5006',
      message: expect.stringContaining('git cat-file --batch failed'),
    });
  });

  describe.skipIf(process.platform === 'win32')('with a fake git on PATH', () => {
    /** A directory whose only `git` is this shell script. */
    async function fakeGit(script: string): Promise<string> {
      const directory = await mkdtemp(join(tmpdir(), 'promptscript-fake-git-'));
      directories.push(directory);
      await writeFile(join(directory, 'git'), `#!/bin/sh\n${script}\n`);
      await chmod(join(directory, 'git'), 0o755);
      vi.stubEnv('PATH', directory);
      return directory;
    }

    it.each([
      ['git itself', 'exec /bin/sleep 5'],
      ['a process git started, which holds the output open', '/bin/sleep 5; true'],
    ])('stops at PROMPTSCRIPT_GIT_TIMEOUT when %s hangs', async (_name, script) => {
      const directory = await fakeGit(script);
      vi.stubEnv('PROMPTSCRIPT_GIT_TIMEOUT', '200');
      const started = Date.now();

      const read = readBlobs(['a'.repeat(40)], directory, { maxBytes: 1 });

      await expect(read).rejects.toMatchObject({
        code: 'PS5006',
        message: expect.stringMatching(/stopped with SIGTERM.*PROMPTSCRIPT_GIT_TIMEOUT/),
      });
      expect(Date.now() - started).toBeLessThan(5000);
    });

    it('rejects with PS5006 when git is on PATH but cannot run', async () => {
      const directory = await fakeGit('exit 0');
      await chmod(join(directory, 'git'), 0o644);

      await expect(readBlobs(['a'.repeat(40)], directory, { maxBytes: 1 })).rejects.toMatchObject({
        code: 'PS5006',
        message: expect.stringContaining('git cat-file --batch failed'),
      });
    });

    it('refuses git that exits before it reads the ids, and so closes stdin', async () => {
      const directory = await fakeGit('exit 0');
      const ids = Array.from({ length: 20_000 }, (_, index) =>
        index.toString(16).padStart(40, '0')
      );

      const read = readBlobs(ids, directory, { maxBytes: 1 });

      await expect(read).rejects.toMatchObject({
        code: 'PS5006',
        message: `git cat-file --batch failed: no answer for ${ids[0]} and 19999 more.`,
      });
    });

    it('names the exit status when git fails without a word', async () => {
      const directory = await fakeGit('/bin/cat > /dev/null; exit 3');

      await expect(readBlobs(['a'.repeat(40)], directory, { maxBytes: 1 })).rejects.toMatchObject({
        code: 'PS5006',
        message: 'git cat-file --batch failed: exit status 3.',
      });
    });

    it('keeps at most about 1 MiB of what git prints to stderr', async () => {
      const directory = await fakeGit(
        "/bin/cat > /dev/null; /usr/bin/head -c 3000000 /dev/zero | /usr/bin/tr '\\0' x >&2; exit 1"
      );

      const read = readBlobs(['a'.repeat(40)], directory, { maxBytes: 1 });

      await expect(read).rejects.toMatchObject({ code: 'PS5006' });
      const message = await read.then(
        () => '',
        (error: unknown) => errorMessage(error)
      );
      expect(message.length).toBeGreaterThan(1024 * 1024);
      expect(message.length).toBeLessThan(2 * 1024 * 1024);
    });

    it('stops git at once on output it does not print, and keeps that reason', async () => {
      const directory = await fakeGit('echo garbage; exec /bin/sleep 5');
      const started = Date.now();

      const read = readBlobs(['a'.repeat(40)], directory, { maxBytes: 1 });

      await expect(read).rejects.toMatchObject({
        code: 'PS5006',
        message: expect.stringContaining('unexpected header'),
      });
      expect(Date.now() - started).toBeLessThan(4000);
    });

    it.each([
      ['no answer at all', '/bin/cat > /dev/null', 'no answer for'],
      ['a header Git does not print', '/bin/cat > /dev/null; echo garbage', 'unexpected header'],
      [
        'an answer for an id it was not asked for',
        `/bin/cat > /dev/null; echo ${'b'.repeat(40)} missing`,
        'not asked for',
      ],
    ])('refuses %s, even with exit status 0', async (_name, script, message) => {
      const directory = await fakeGit(script);

      const read = readBlobs(['a'.repeat(40)], directory, { maxBytes: 1 });

      await expect(read).rejects.toMatchObject({
        code: 'PS5006',
        message: expect.stringContaining(message),
      });
      await expect(read).rejects.not.toMatchObject({
        message: expect.stringContaining('PROMPTSCRIPT_GIT_TIMEOUT'),
      });
    });
  });
});

describe('errorMessage', () => {
  it('takes the message of an Error and the text of anything else', () => {
    expect(errorMessage(new Error('broken'))).toBe('broken');
    expect(errorMessage('plain')).toBe('plain');
  });
});

describe('CatFileBatchParser', () => {
  const id = 'a'.repeat(40);

  it('reads output split at any byte', () => {
    const output = Buffer.from(`${id} blob 3\na\nb\n${'b'.repeat(40)} missing\n`);
    const parser = new CatFileBatchParser(10);

    for (const byte of output) parser.push(Buffer.from([byte]));
    const result = parser.finish();

    expect(result.blobs.get(id)?.toString('utf-8')).toBe('a\nb');
    expect([...result.missing]).toEqual(['b'.repeat(40)]);
  });

  it.each([
    ['output cut in an object', `${id} blob 5\nab`, 'ended in the middle'],
    ['output cut in a header', `${id} blob`, 'ended in the middle'],
    ['a header Git does not print', 'fatal: not a git repository\n', 'unexpected header'],
    ['content without its line feed', `${id} blob 1\nab`, 'does not end with a line feed'],
  ])('throws on %s', (_name, output, message) => {
    const parser = new CatFileBatchParser(10);

    expect(() => {
      parser.push(Buffer.from(output));
      parser.finish();
    }).toThrow(message);
  });

  it('throws on an answer for an id that was not asked for', () => {
    const parser = new CatFileBatchParser(10, new Set([id]));

    expect(() => parser.push(Buffer.from(`${'b'.repeat(40)} blob 1\na\n`))).toThrow(
      'not asked for'
    );
  });

  it('throws on a header longer than Git prints', () => {
    const parser = new CatFileBatchParser(10);

    expect(() => parser.push(Buffer.alloc(300, 'a'))).toThrow('header is too long');
  });
});
