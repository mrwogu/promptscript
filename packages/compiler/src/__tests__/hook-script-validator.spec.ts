import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdtemp, mkdir, rm, symlink, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import type { Program, SourceLocation, Value } from '@promptscript/core';
import { inferProjectRoot, validateHookScriptResources } from '../hook-script-validator.js';

const loc: SourceLocation = { file: '.promptscript/project.prs', line: 1, column: 1 };

function makeHookProgram(hook: Record<string, Value>): Program {
  return {
    type: 'Program',
    blocks: [
      {
        type: 'Block',
        name: 'hooks',
        content: {
          type: 'ObjectContent',
          properties: {
            check: hook,
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

function makeProgram(scriptPath: string, enabled = true): Program {
  return makeHookProgram({
    event: 'post-tool-use',
    script: {
      path: scriptPath,
      interpreter: 'node',
    },
    enabled,
  });
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

  it('ignores programs without a hooks block', async () => {
    const program: Program = {
      type: 'Program',
      blocks: [],
      uses: [],
      extends: [],
      loc,
    };

    await expect(validateHookScriptResources(program, projectRoot)).resolves.toEqual([]);
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

  it('reports a missing target-only script', async () => {
    const errors = await validateHookScriptResources(
      makeHookProgram({
        event: 'post-tool-use',
        command: ['node', 'base.mjs'],
        targets: {
          factory: {
            script: {
              path: '.promptscript/scripts/missing-target.mjs',
              interpreter: 'node',
            },
          },
        },
      }),
      projectRoot
    );

    expect(errors).toEqual([
      expect.objectContaining({
        code: 'PS2001',
        message: 'Hook "check" script not found: .promptscript/scripts/missing-target.mjs',
      }),
    ]);
  });

  it('ignores target scripts for disabled overrides', async () => {
    await expect(
      validateHookScriptResources(
        makeHookProgram({
          event: 'post-tool-use',
          command: ['node', 'base.mjs'],
          targets: {
            factory: {
              enabled: false,
              script: {
                path: '.promptscript/scripts/missing-target.mjs',
                interpreter: 'node',
              },
            },
          },
        }),
        projectRoot
      )
    ).resolves.toEqual([]);
  });

  it('validates inherited scripts for re-enabled targets', async () => {
    const errors = await validateHookScriptResources(
      makeHookProgram({
        event: 'post-tool-use',
        enabled: false,
        script: {
          path: '.promptscript/scripts/missing-inherited.mjs',
          interpreter: 'node',
        },
        targets: {
          factory: { enabled: true },
        },
      }),
      projectRoot
    );

    expect(errors).toEqual([
      expect.objectContaining({
        code: 'PS2001',
        message: 'Hook "check" script not found: .promptscript/scripts/missing-inherited.mjs',
      }),
    ]);
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
