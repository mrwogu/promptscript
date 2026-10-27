import { mkdirSync, mkdtempSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { projectRelative, resolveProjectPath } from './paths.js';

describe('resolveProjectPath', () => {
  let base: string;
  let root: string;
  let outside: string;

  beforeEach(() => {
    base = realpathSync(mkdtempSync(join(tmpdir(), 'eval-paths-')));
    root = join(base, 'project');
    outside = join(base, 'outside');
    mkdirSync(join(root, '.promptscript', 'evals', 'datasets'), { recursive: true });
    mkdirSync(outside);
    writeFileSync(join(root, '.promptscript', 'evals', 'datasets', 'a.jsonl'), '{}\n');
    writeFileSync(join(outside, 'secret.jsonl'), '{}\n');
  });

  afterEach(() => {
    rmSync(base, { recursive: true, force: true });
  });

  const evals = (): string => join(root, '.promptscript', 'evals');

  it('returns the real path of a relative path inside the project', () => {
    const result = resolveProjectPath(root, evals(), 'datasets/a.jsonl');

    expect(result).toBe(join(evals(), 'datasets', 'a.jsonl'));
  });

  it('accepts .. that stays inside the project', () => {
    const result = resolveProjectPath(root, evals(), '../evals/datasets/a.jsonl');

    expect(result).toBe(join(evals(), 'datasets', 'a.jsonl'));
  });

  it('accepts a path that does not exist yet', () => {
    const result = resolveProjectPath(root, root, '.promptscript/eval-cache/ab/cd.json');

    expect(result).toBe(join(root, '.promptscript', 'eval-cache', 'ab', 'cd.json'));
  });

  it.each([
    ['an empty value', ''],
    ['.. that leaves the project', '../../../outside/secret.jsonl'],
    ['an absolute POSIX path', '/etc/passwd'],
    ['a drive letter', String.raw`C:\data\rows.jsonl`],
    ['a drive-relative path', 'C:rows.jsonl'],
    ['a UNC prefix', String.raw`\\server\share\rows.jsonl`],
    ['a NUL byte', 'datasets/a.jsonl\u0000.txt'],
    ['a path through a regular file', 'datasets/a.jsonl/rows.jsonl'],
  ])('refuses %s', (_name, value) => {
    expect(resolveProjectPath(root, evals(), value)).toBeUndefined();
  });

  it('refuses a symlinked file that points outside the project', () => {
    symlinkSync(join(outside, 'secret.jsonl'), join(evals(), 'datasets', 'link.jsonl'));

    expect(resolveProjectPath(root, evals(), 'datasets/link.jsonl')).toBeUndefined();
  });

  it('refuses a path under a symlinked directory that points outside the project', () => {
    symlinkSync(outside, join(evals(), 'linked'));

    expect(resolveProjectPath(root, evals(), 'linked/secret.jsonl')).toBeUndefined();
  });

  it('refuses a dangling symlink, whose target could appear later', () => {
    symlinkSync(join(outside, 'later.jsonl'), join(evals(), 'datasets', 'dangling.jsonl'));

    expect(resolveProjectPath(root, evals(), 'datasets/dangling.jsonl')).toBeUndefined();
  });

  it('refuses a link loop instead of throwing', () => {
    symlinkSync(join(evals(), 'datasets', 'b.jsonl'), join(evals(), 'datasets', 'a-loop.jsonl'));
    symlinkSync(join(evals(), 'datasets', 'a-loop.jsonl'), join(evals(), 'datasets', 'b.jsonl'));

    expect(resolveProjectPath(root, evals(), 'datasets/a-loop.jsonl')).toBeUndefined();
    expect(resolveProjectPath(root, evals(), 'datasets/a-loop.jsonl/rows.jsonl')).toBeUndefined();
  });

  it('follows a symlink that stays inside the project to its target', () => {
    symlinkSync(join(evals(), 'datasets', 'a.jsonl'), join(evals(), 'alias.jsonl'));

    expect(resolveProjectPath(root, evals(), 'alias.jsonl')).toBe(
      join(evals(), 'datasets', 'a.jsonl')
    );
  });

  it('checks against the real project root when the root path is a symlink', () => {
    const linkedRoot = join(base, 'linked-project');
    symlinkSync(root, linkedRoot);

    const result = resolveProjectPath(
      linkedRoot,
      join(linkedRoot, '.promptscript', 'evals'),
      'datasets/a.jsonl'
    );

    expect(result).toBe(join(evals(), 'datasets', 'a.jsonl'));
  });

  it('gives project-relative paths with forward slashes', () => {
    expect(projectRelative(root, join(evals(), 'datasets', 'a.jsonl'))).toBe(
      '.promptscript/evals/datasets/a.jsonl'
    );
  });
});
