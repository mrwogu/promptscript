import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  mkdtempSync,
  writeFileSync,
  readFileSync,
  mkdirSync,
  rmSync,
  statSync,
  utimesSync,
} from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { fmtCommand } from '../fmt.js';

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
    vi.restoreAllMocks();
    process.exitCode = undefined;
    rmSync(dir, { recursive: true, force: true });
  });

  const text = (): string => out.join('\n');

  it('formats a file in place and reports it', () => {
    const file = join(dir, 'a.prs');
    writeFileSync(file, MESSY);

    fmtCommand({ paths: [file] });

    expect(readFileSync(file, 'utf-8')).not.toBe(MESSY);
    expect(readFileSync(file, 'utf-8').endsWith('\n')).toBe(true);
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
});
