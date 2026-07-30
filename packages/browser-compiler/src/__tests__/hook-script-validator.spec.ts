import { describe, expect, it } from 'vitest';
import type { Program, SourceLocation } from '@promptscript/core';
import { validateBrowserHookScriptResources } from '../hook-script-validator.js';
import { VirtualFileSystem } from '../virtual-fs.js';

const loc: SourceLocation = { file: 'workspace/.promptscript/project.prs', line: 1, column: 1 };
function makeProgram(enabled = true): Program {
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
                path: '.promptscript/scripts/check.mjs',
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

describe('browser hook script resource validation', () => {
  it('finds scripts relative to the virtual project root', () => {
    const fs = new VirtualFileSystem({
      'workspace/.promptscript/project.prs': '',
      'workspace/.promptscript/scripts/check.mjs': 'process.exit(0);\n',
    });

    expect(
      validateBrowserHookScriptResources(makeProgram(), fs, 'workspace/.promptscript/project.prs')
    ).toEqual([]);
  });

  it('reports a missing virtual script', () => {
    const fs = new VirtualFileSystem({
      'workspace/.promptscript/project.prs': '',
    });

    expect(
      validateBrowserHookScriptResources(makeProgram(), fs, 'workspace/.promptscript/project.prs')
    ).toEqual([
      expect.objectContaining({
        code: 'PS2001',
        message: 'Hook "check" script not found: .promptscript/scripts/check.mjs',
        location: loc,
      }),
    ]);
  });

  it('ignores a missing virtual script for a disabled hook', () => {
    const fs = new VirtualFileSystem({
      'workspace/.promptscript/project.prs': '',
    });

    expect(
      validateBrowserHookScriptResources(
        makeProgram(false),
        fs,
        'workspace/.promptscript/project.prs'
      )
    ).toEqual([]);
  });

  it('uses an explicit project root for custom entry layouts', () => {
    const fs = new VirtualFileSystem({
      'workspace/config/project.prs': '',
      'workspace/.promptscript/scripts/check.mjs': 'process.exit(0);\n',
    });

    expect(
      validateBrowserHookScriptResources(
        makeProgram(),
        fs,
        'workspace/config/project.prs',
        'workspace'
      )
    ).toEqual([]);
  });
});
