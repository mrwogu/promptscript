import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  mkdtempSync,
  writeFileSync,
  readFileSync,
  mkdirSync,
  rmSync,
  statSync,
  utimesSync,
  chmodSync,
  readdirSync,
  symlinkSync,
  lstatSync,
} from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { fmtCommand } from '../fmt.js';

const printOverride = vi.hoisted(() => ({
  output: undefined as string | undefined,
  error: undefined as unknown,
  parse: undefined as unknown,
}));

vi.mock('@promptscript/parser', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@promptscript/parser')>();
  return {
    ...actual,
    parseCanonical: (...args: Parameters<typeof actual.parseCanonical>) =>
      (printOverride.parse as ReturnType<typeof actual.parseCanonical> | undefined) ??
      actual.parseCanonical(...args),
    printProgram: (...args: Parameters<typeof actual.printProgram>): string => {
      if (printOverride.error !== undefined) throw printOverride.error;
      return printOverride.output ?? actual.printProgram(...args);
    },
  };
});

const hasMkfifo = process.platform !== 'win32';
const isRoot = typeof process.getuid === 'function' && process.getuid() === 0;

const MESSY = '@meta{id:"a" syntax:"1.0.0"}\n\n\n@identity{\n"""\nHi\n"""\n}';

describe('fmtCommand', () => {
  let dir: string;
  let out: string[];

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'prs-fmt-'));
    out = [];
    process.exitCode = undefined;
    const capture = (...args: unknown[]): void => {
      out.push(args.join(' '));
    };
    vi.spyOn(console, 'log').mockImplementation(capture);
    vi.spyOn(console, 'error').mockImplementation(capture);
    vi.spyOn(process.stdout, 'write').mockImplementation((chunk) => {
      out.push(String(chunk));
      return true;
    });
  });

  afterEach(() => {
    printOverride.output = undefined;
    printOverride.error = undefined;
    printOverride.parse = undefined;
    vi.restoreAllMocks();
    process.exitCode = undefined;
    rmSync(dir, { recursive: true, force: true });
  });

  const text = (): string => out.join('\n');

  it('formats a file in place and reports it', () => {
    const file = join(dir, 'a.prs');
    writeFileSync(file, MESSY);

    fmtCommand({ paths: [file] });

    expect(readFileSync(file, 'utf-8')).toBe(
      '@meta {\n  id: "a"\n  syntax: "1.0.0"\n}\n\n@identity {\n  """\n    Hi\n  """\n}\n'
    );
    expect(text()).toContain('Formatted');
    expect(text()).toContain('1 formatted, 0 unchanged, 0 failed');
    expect(process.exitCode).toBeUndefined();
  });

  it('leaves an already formatted file untouched', () => {
    const file = join(dir, 'a.prs');
    writeFileSync(file, MESSY);
    fmtCommand({ paths: [file] });
    const past = new Date(2020, 0, 1);
    utimesSync(file, past, past);

    fmtCommand({ paths: [file] });

    expect(statSync(file).mtimeMs).toBe(past.getTime());
    expect(text()).toContain('0 formatted, 1 unchanged, 0 failed');
  });

  it('is idempotent', () => {
    const file = join(dir, 'a.prs');
    writeFileSync(file, MESSY);
    fmtCommand({ paths: [file] });
    const once = readFileSync(file, 'utf-8');

    fmtCommand({ paths: [file] });

    expect(readFileSync(file, 'utf-8')).toBe(once);
  });

  it('--check names the file, writes nothing and exits 1', () => {
    const file = join(dir, 'a.prs');
    writeFileSync(file, MESSY);

    fmtCommand({ paths: [file], check: true });

    expect(readFileSync(file, 'utf-8')).toBe(MESSY);
    expect(text()).toContain('a.prs');
    expect(text()).toContain('1 would change');
    expect(process.exitCode).toBe(1);
  });

  it('--check exits 0 when everything is formatted', () => {
    const file = join(dir, 'a.prs');
    writeFileSync(file, MESSY);
    fmtCommand({ paths: [file] });

    fmtCommand({ paths: [file], check: true });

    expect(process.exitCode).toBeUndefined();
  });

  it('reports a parse error, leaves the file and still formats the others', () => {
    const bad = join(dir, 'bad.prs');
    const good = join(dir, 'good.prs');
    writeFileSync(bad, '@meta {\n  id: 1 2 3\n}\n');
    writeFileSync(good, MESSY);

    fmtCommand({ paths: [dir] });

    expect(readFileSync(bad, 'utf-8')).toBe('@meta {\n  id: 1 2 3\n}\n');
    expect(readFileSync(good, 'utf-8')).not.toBe(MESSY);
    expect(text()).toContain('bad.prs:2:9');
    expect(text()).toContain('1 formatted, 0 unchanged, 1 failed');
    expect(process.exitCode).toBe(1);
  });

  it('walks a directory but skips vendor and node_modules', () => {
    mkdirSync(join(dir, 'sub'));
    mkdirSync(join(dir, 'vendor'));
    mkdirSync(join(dir, 'node_modules'));
    writeFileSync(join(dir, 'sub', 'a.prs'), MESSY);
    writeFileSync(join(dir, 'vendor', 'v.prs'), MESSY);
    writeFileSync(join(dir, 'node_modules', 'n.prs'), MESSY);

    fmtCommand({ paths: [dir] });

    expect(readFileSync(join(dir, 'sub', 'a.prs'), 'utf-8')).not.toBe(MESSY);
    expect(readFileSync(join(dir, 'vendor', 'v.prs'), 'utf-8')).toBe(MESSY);
    expect(readFileSync(join(dir, 'node_modules', 'n.prs'), 'utf-8')).toBe(MESSY);
  });

  it('defaults to .promptscript in the working directory', () => {
    mkdirSync(join(dir, '.promptscript'));
    writeFileSync(join(dir, '.promptscript', 'p.prs'), MESSY);
    const previous = process.cwd();
    process.chdir(dir);

    try {
      fmtCommand({});
    } finally {
      process.chdir(previous);
    }

    expect(readFileSync(join(dir, '.promptscript', 'p.prs'), 'utf-8')).not.toBe(MESSY);
  });

  it('fails for a missing path', () => {
    fmtCommand({ paths: [join(dir, 'nope.prs')] });

    expect(text()).toContain('Path not found');
    expect(process.exitCode).toBe(1);
  });

  it('skips an explicit non-.prs file with a warning and does not count it', () => {
    const notes = join(dir, 'notes.md');
    writeFileSync(notes, MESSY);

    fmtCommand({ paths: [notes] });

    expect(readFileSync(notes, 'utf-8')).toBe(MESSY);
    expect(text()).toContain('not a .prs file');
    expect(text()).toContain('0 formatted, 0 unchanged, 0 failed');
    expect(process.exitCode).toBeUndefined();
  });

  it('skips .cache when walking a directory', () => {
    mkdirSync(join(dir, '.cache'));
    writeFileSync(join(dir, '.cache', 'c.prs'), MESSY);

    fmtCommand({ paths: [dir] });

    expect(readFileSync(join(dir, '.cache', 'c.prs'), 'utf-8')).toBe(MESSY);
    expect(text()).toContain('0 formatted, 0 unchanged, 0 failed');
  });

  it('formats vendored files that are named explicitly', () => {
    mkdirSync(join(dir, 'vendor'));
    const file = join(dir, 'vendor', 'v.prs');
    writeFileSync(file, MESSY);

    fmtCommand({ paths: [file] });

    expect(readFileSync(file, 'utf-8')).not.toBe(MESSY);
  });

  it('--check reports both a would-change file and a parse failure, writing nothing', () => {
    const bad = join(dir, 'bad.prs');
    const messy = join(dir, 'messy.prs');
    writeFileSync(bad, '@meta {\n  id: 1 2 3\n}\n');
    writeFileSync(messy, MESSY);

    fmtCommand({ paths: [dir], check: true });

    expect(readFileSync(messy, 'utf-8')).toBe(MESSY);
    expect(readFileSync(bad, 'utf-8')).toBe('@meta {\n  id: 1 2 3\n}\n');
    expect(text()).toContain('Would reformat');
    expect(text()).toContain('messy.prs');
    expect(text()).toContain('bad.prs:2:9');
    expect(text()).toContain('1 would change, 0 unchanged, 1 failed');
    expect(process.exitCode).toBe(1);
  });

  it('refuses to write output that does not parse', () => {
    const file = join(dir, 'a.prs');
    writeFileSync(file, MESSY);
    printOverride.output = '@meta {{{ garbage';

    fmtCommand({ paths: [file] });

    expect(readFileSync(file, 'utf-8')).toBe(MESSY);
    expect(text()).toContain('printer produced unparseable output, file left untouched');
    expect(text()).toContain('0 formatted, 0 unchanged, 1 failed');
    expect(process.exitCode).toBe(1);
  });

  it('refuses to write output that parses to a different program', () => {
    const file = join(dir, 'a.prs');
    writeFileSync(file, MESSY);
    printOverride.output = '@meta {\n  id: "a"\n  syntax: "1.0.0"\n}\n@identity {\n  x: 1\n}\n';

    fmtCommand({ paths: [file] });

    expect(readFileSync(file, 'utf-8')).toBe(MESSY);
    expect(text()).toContain(
      'formatted output does not parse to the same program, file not written'
    );
    expect(text()).toContain('0 formatted, 0 unchanged, 1 failed');
    expect(process.exitCode).toBe(1);
  });

  it.skipIf(isRoot)('records a read error, keeps going and exits 1', () => {
    const locked = join(dir, 'a-locked.prs');
    const good = join(dir, 'b-good.prs');
    writeFileSync(locked, MESSY);
    chmodSync(locked, 0o000);
    writeFileSync(good, MESSY);

    fmtCommand({ paths: [dir] });

    chmodSync(locked, 0o644);
    expect(readFileSync(good, 'utf-8')).not.toBe(MESSY);
    expect(text()).toContain('a-locked.prs');
    expect(text()).toContain('EACCES');
    expect(text()).toContain('1 formatted, 0 unchanged, 1 failed');
    expect(process.exitCode).toBe(1);
  });

  it.skipIf(isRoot)('records a write error, keeps going and leaves no temporary file', () => {
    mkdirSync(join(dir, 'ro'));
    mkdirSync(join(dir, 'rw'));
    writeFileSync(join(dir, 'ro', 'a.prs'), MESSY);
    writeFileSync(join(dir, 'rw', 'b.prs'), MESSY);
    chmodSync(join(dir, 'ro'), 0o555);

    fmtCommand({ paths: [dir] });

    chmodSync(join(dir, 'ro'), 0o755);
    expect(readFileSync(join(dir, 'ro', 'a.prs'), 'utf-8')).toBe(MESSY);
    expect(readdirSync(join(dir, 'ro'))).toEqual(['a.prs']);
    expect(readFileSync(join(dir, 'rw', 'b.prs'), 'utf-8')).not.toBe(MESSY);
    expect(text()).toContain('1 formatted, 0 unchanged, 1 failed');
    expect(process.exitCode).toBe(1);
  });

  it('skips a named symbolic link and leaves link and target alone', () => {
    const target = join(dir, 'target.prs');
    const link = join(dir, 'l.prs');
    writeFileSync(target, MESSY);
    symlinkSync(target, link);

    fmtCommand({ paths: [link] });

    expect(lstatSync(link).isSymbolicLink()).toBe(true);
    expect(readFileSync(target, 'utf-8')).toBe(MESSY);
    expect(text()).toContain('symbolic link');
    expect(text()).toContain('0 formatted, 0 unchanged, 0 failed');
    expect(process.exitCode).toBeUndefined();
  });

  it('warns about a symbolic link found while walking and writes nothing through it', () => {
    mkdirSync(join(dir, 'walk'));
    const target = join(dir, 'target.prs');
    const link = join(dir, 'walk', 'l.prs');
    writeFileSync(target, MESSY);
    symlinkSync(target, link);

    fmtCommand({ paths: [join(dir, 'walk')] });

    expect(lstatSync(link).isSymbolicLink()).toBe(true);
    expect(readFileSync(target, 'utf-8')).toBe(MESSY);
    expect(text()).toContain('Skipped');
    expect(text()).toContain('l.prs: symbolic link');
    expect(text()).toContain('0 formatted, 0 unchanged, 0 failed');
    expect(process.exitCode).toBeUndefined();
  });

  it('walks a directory in sorted order and ignores other file types', () => {
    for (const name of ['b.prs', 'c.prs', 'a.prs']) writeFileSync(join(dir, name), MESSY);
    writeFileSync(join(dir, 'notes.md'), MESSY);

    fmtCommand({ paths: [dir] });

    expect(text().indexOf('a.prs')).toBeLessThan(text().indexOf('b.prs'));
    expect(readFileSync(join(dir, 'notes.md'), 'utf-8')).toBe(MESSY);
    expect(text()).toContain('3 formatted, 0 unchanged, 0 failed');
  });

  it('formats explicit paths in sorted order', () => {
    const a = join(dir, 'a.prs');
    const b = join(dir, 'b.prs');
    writeFileSync(a, MESSY);
    writeFileSync(b, MESSY);

    fmtCommand({ paths: [b, a] });

    expect(text().indexOf('a.prs')).toBeLessThan(text().indexOf('b.prs'));
  });

  it.skipIf(!hasMkfifo)('ignores a named pipe found while walking and finishes', () => {
    execFileSync('mkfifo', [join(dir, 'pipe.prs')]);
    writeFileSync(join(dir, 'ok.prs'), MESSY);

    fmtCommand({ paths: [dir] });

    expect(text()).toContain('1 formatted, 0 unchanged, 0 failed');
    expect(process.exitCode).toBeUndefined();
  });

  it.skipIf(!hasMkfifo)('reports an explicitly named pipe as not a regular file', () => {
    const pipe = join(dir, 'pipe.prs');
    execFileSync('mkfifo', [pipe]);

    fmtCommand({ paths: [pipe] });

    expect(text()).toContain('is not a regular file');
    expect(process.exitCode).toBe(1);
  });

  it.skipIf(isRoot)('reports an unreadable subdirectory and still formats the rest', () => {
    mkdirSync(join(dir, 'locked'));
    writeFileSync(join(dir, 'locked', 'hidden.prs'), MESSY);
    writeFileSync(join(dir, 'ok.prs'), MESSY);
    chmodSync(join(dir, 'locked'), 0o000);

    fmtCommand({ paths: [dir] });

    chmodSync(join(dir, 'locked'), 0o755);
    expect(readFileSync(join(dir, 'ok.prs'), 'utf-8')).not.toBe(MESSY);
    expect(text()).toContain('locked');
    expect(text()).toContain('EACCES');
    expect(text()).toContain('1 formatted, 0 unchanged, 1 failed');
    expect(process.exitCode).toBe(1);
  });

  it('skips a symlinked directory given explicitly and writes nothing inside it', () => {
    mkdirSync(join(dir, 'real'));
    writeFileSync(join(dir, 'real', 'a.prs'), MESSY);
    symlinkSync(join(dir, 'real'), join(dir, 'linked'));

    fmtCommand({ paths: [join(dir, 'linked')] });

    expect(readFileSync(join(dir, 'real', 'a.prs'), 'utf-8')).toBe(MESSY);
    expect(text()).toContain('linked: symbolic link');
    expect(text()).toContain('0 formatted, 0 unchanged, 0 failed');
    expect(process.exitCode).toBeUndefined();
  });

  it('skips a symlinked default .promptscript directory', () => {
    mkdirSync(join(dir, 'outside'));
    writeFileSync(join(dir, 'outside', 'a.prs'), MESSY);
    mkdirSync(join(dir, 'project'));
    symlinkSync(join(dir, 'outside'), join(dir, 'project', '.promptscript'));
    const previous = process.cwd();
    process.chdir(join(dir, 'project'));

    try {
      fmtCommand({});
    } finally {
      process.chdir(previous);
    }

    expect(readFileSync(join(dir, 'outside', 'a.prs'), 'utf-8')).toBe(MESSY);
    expect(text()).toContain('.promptscript: symbolic link');
    expect(process.exitCode).toBeUndefined();
  });

  it.skipIf(isRoot)('reports a read-only file as not writable and leaves it', () => {
    const file = join(dir, 'a.prs');
    writeFileSync(file, MESSY);
    chmodSync(file, 0o444);

    fmtCommand({ paths: [file] });

    expect(readFileSync(file, 'utf-8')).toBe(MESSY);
    expect(text()).toContain('not writable');
    expect(text()).toContain('0 formatted, 0 unchanged, 1 failed');
    expect(process.exitCode).toBe(1);
  });

  it('reports a parse error without a location by file name only', () => {
    const file = join(dir, 'a.prs');
    writeFileSync(file, '@meta {');

    fmtCommand({ paths: [file] });

    expect(text()).toContain('a.prs ');
    expect(text()).not.toContain('a.prs:');
    expect(process.exitCode).toBe(1);
  });

  it('reports a failed parse that carries no error', () => {
    const file = join(dir, 'a.prs');
    writeFileSync(file, MESSY);
    printOverride.parse = { ast: undefined, errors: [], comments: [] };

    fmtCommand({ paths: [file] });

    expect(text()).toContain('Parse failed');
    expect(process.exitCode).toBe(1);
  });

  it('reports a non-Error value thrown by the printer', () => {
    const file = join(dir, 'a.prs');
    writeFileSync(file, MESSY);
    printOverride.error = 'boom';

    fmtCommand({ paths: [file] });

    expect(readFileSync(file, 'utf-8')).toBe(MESSY);
    expect(text()).toContain('a.prs boom');
    expect(process.exitCode).toBe(1);
  });
});
