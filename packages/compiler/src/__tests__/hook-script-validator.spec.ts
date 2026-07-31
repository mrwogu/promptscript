import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdtemp, mkdir, rm, symlink, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import type { Program, SourceLocation } from '@promptscript/core';
import { inferProjectRoot, validateHookScriptResources } from '../hook-script-validator.js';

const loc: SourceLocation = { file: '.promptscript/project.prs', line: 1, column: 1 };

function makeProgram(scriptPath: string, enabled = true): Program {
  return {
    type: 'Program',
    blocks: [
      {
        type: 'Block',
        name: 'hooks',
        content: {
          type: 'ObjectContent',
          properties: {
            check: {
              event: 'post-tool-use',
              script: {
                path: scriptPath,
                interpreter: 'node',
              },
              enabled,
            },
          },
          loc,
        },
        loc,
      },
    ],
    uses: [],
    extends: [],
    loc,
  };
}

describe('hook script resource validation', () => {
  let projectRoot: string;

  beforeEach(async () => {
    projectRoot = await mkdtemp(join(tmpdir(), 'promptscript-hook-script-'));
    await mkdir(join(projectRoot, '.promptscript', 'scripts'), { recursive: true });
  });

  afterEach(async () => {
    await rm(projectRoot, { recursive: true, force: true });
  });

  it('accepts a repository-local script with spaces', async () => {
    await writeFile(
      join(projectRoot, '.promptscript', 'scripts', 'check file.mjs'),
      'process.exit(0);\n'
    );

    await expect(
      validateHookScriptResources(makeProgram('.promptscript/scripts/check file.mjs'), projectRoot)
    ).resolves.toEqual([]);
  });

  it('reports a missing script', async () => {
    const errors = await validateHookScriptResources(
      makeProgram('.promptscript/scripts/missing.mjs'),
      projectRoot
    );

    expect(errors).toEqual([
      expect.objectContaining({
        code: 'PS2001',
        message: expect.stringContaining('script not found'),
        location: loc,
      }),
    ]);
  });

  it('falls back when the project root cannot be resolved', async () => {
    const errors = await validateHookScriptResources(
      makeProgram('.promptscript/scripts/missing.mjs'),
      join(projectRoot, 'missing-project')
    );

    expect(errors).toEqual([
      expect.objectContaining({
        code: 'PS2001',
        message: expect.stringContaining('script not found'),
      }),
    ]);
  });

  it('ignores a missing script for a disabled hook', async () => {
    await expect(
      validateHookScriptResources(
        makeProgram('.promptscript/scripts/missing.mjs', false),
        projectRoot
      )
    ).resolves.toEqual([]);
  });

  it('rejects a script symlink that escapes the scripts directory', async () => {
    const outside = join(projectRoot, 'outside.mjs');
    await writeFile(outside, 'process.exit(0);\n');
    await symlink(outside, join(projectRoot, '.promptscript', 'scripts', 'linked.mjs'));

    const errors = await validateHookScriptResources(
      makeProgram('.promptscript/scripts/linked.mjs'),
      projectRoot
    );

    expect(errors).toEqual([
      expect.objectContaining({
        code: 'PS1003',
        message: expect.stringContaining('resolves outside'),
      }),
    ]);
  });

  it('rejects a directory in place of a script', async () => {
    await mkdir(join(projectRoot, '.promptscript', 'scripts', 'directory'));

    const errors = await validateHookScriptResources(
      makeProgram('.promptscript/scripts/directory'),
      projectRoot
    );

    expect(errors).toEqual([
      expect.objectContaining({
        code: 'PS1003',
        message: expect.stringContaining('is not a file'),
      }),
    ]);
  });

  it('infers the repository root from a .promptscript local path', () => {
    expect(inferProjectRoot(join(projectRoot, '.promptscript'), undefined)).toBe(projectRoot);
    expect(
      inferProjectRoot(undefined, undefined, join(projectRoot, '.promptscript', 'project.prs'))
    ).toBe(projectRoot);
    expect(
      inferProjectRoot(undefined, undefined, join(projectRoot, '.promptscript', 'builds', 'ci.prs'))
    ).toBe(projectRoot);
    expect(inferProjectRoot(join(projectRoot, '.promptscript', 'builds'), undefined)).toBe(
      projectRoot
    );
    expect(inferProjectRoot('/ignored', projectRoot)).toBe(projectRoot);
  });
});
