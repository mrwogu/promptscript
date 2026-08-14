import { mkdir, mkdtemp, rm, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { validateOutputPath } from './conflict-detector.js';

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true }))
  );
});

async function createOutputRoot(): Promise<{ root: string; outputRoot: string }> {
  const root = await mkdtemp(join(tmpdir(), 'promptscript-output-path-'));
  const outputRoot = join(root, 'output');
  await mkdir(outputRoot);
  temporaryDirectories.push(root);
  return { root, outputRoot };
}

describe('validateOutputPath symlink containment', () => {
  it('rejects a path through a symlink that escapes the output root', async () => {
    const { root, outputRoot } = await createOutputRoot();
    const outside = join(root, 'outside');
    await mkdir(outside);
    await symlink(outside, join(outputRoot, 'docs'), 'dir');

    expect(validateOutputPath('docs/generated.md', outputRoot)).toBeDefined();
  });

  it('accepts a path through a symlink that stays inside the output root', async () => {
    const { outputRoot } = await createOutputRoot();
    const inside = join(outputRoot, 'shared');
    await mkdir(inside);
    await symlink(inside, join(outputRoot, 'docs'), 'dir');

    expect(validateOutputPath('docs/generated.md', outputRoot)).toBeUndefined();
  });

  it('falls back to lexical containment for a broken symlink', async () => {
    const { outputRoot } = await createOutputRoot();
    await symlink(join(outputRoot, '..', 'missing'), join(outputRoot, 'docs'), 'dir');

    expect(() => validateOutputPath('docs/generated.md', outputRoot)).not.toThrow();
    expect(validateOutputPath('docs/generated.md', outputRoot)).toBeUndefined();
  });
});
