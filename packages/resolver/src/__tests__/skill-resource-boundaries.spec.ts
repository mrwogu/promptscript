import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';

const fsMocks = vi.hoisted(() => ({
  realpath: vi.fn(),
}));

vi.mock('fs/promises', async (importOriginal) => {
  const actual = await importOriginal<typeof import('fs/promises')>();
  fsMocks.realpath.mockImplementation(actual.realpath);
  return {
    ...actual,
    realpath: fsMocks.realpath,
  };
});

import { resolveSkillReferences, resolveSkillScripts } from '../skills.js';

describe('skill resource filesystem boundaries', () => {
  const temporaryDirectories: string[] = [];

  afterEach(async () => {
    fsMocks.realpath.mockClear();
    await Promise.all(
      temporaryDirectories
        .splice(0)
        .map((directory) => rm(directory, { recursive: true, force: true }))
    );
  });

  it('translates reference realpath failures into not found errors', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'skill-reference-realpath-'));
    temporaryDirectories.push(directory);
    await writeFile(join(directory, 'guide.md'), 'Guide');
    fsMocks.realpath.mockImplementationOnce(async () => {
      throw new Error('filesystem race');
    });

    await expect(resolveSkillReferences(['guide.md'], directory)).rejects.toThrow(
      'Reference file not found: guide.md'
    );
  });

  it('translates script realpath failures into not found errors', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'skill-script-realpath-'));
    temporaryDirectories.push(directory);
    await writeFile(join(directory, 'run.sh'), 'echo run');
    fsMocks.realpath.mockImplementationOnce(async () => {
      throw new Error('filesystem race');
    });

    await expect(resolveSkillScripts(['run.sh'], directory)).rejects.toThrow(
      'Script file not found: run.sh'
    );
  });
});
