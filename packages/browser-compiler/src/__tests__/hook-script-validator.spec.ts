import { describe, expect, it } from 'vitest';
import type { Program, SourceLocation, Value } from '@promptscript/core';
import { validateBrowserHookScriptResources } from '../hook-script-validator.js';
import { VirtualFileSystem } from '../virtual-fs.js';

const loc: SourceLocation = { file: 'workspace/.promptscript/project.prs', line: 1, column: 1 };
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

function makeProgram(enabled = true, scriptPath = '.promptscript/scripts/check.mjs'): Program {
  return makeHookProgram({
    event: 'post-tool-use',
    script: {
      path: scriptPath,
      interpreter: 'node',
    },
    enabled,
  });
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

  it('rejects traversal to an existing script outside the project scripts directory', () => {
    const fs = new VirtualFileSystem({
      'workspace/.promptscript/project.prs': '',
      'workspace/outside.mjs': 'process.exit(0);\n',
    });

    expect(
      validateBrowserHookScriptResources(
        makeProgram(true, '../outside.mjs'),
        fs,
        'workspace/.promptscript/project.prs'
      )
    ).toEqual([
      expect.objectContaining({
        name: 'ResolveError',
        code: 'PS1003',
        message: 'Hook "check" script resolves outside ".promptscript/scripts/": ../outside.mjs',
      }),
    ]);
  });

  it('rejects an absolute script path outside the project scripts directory', () => {
    const fs = new VirtualFileSystem({
      'workspace/.promptscript/project.prs': '',
    });

    expect(
      validateBrowserHookScriptResources(
        makeProgram(true, '/workspace/.promptscript/scripts/check.mjs'),
        fs,
        'workspace/.promptscript/project.prs'
      )
    ).toEqual([
      expect.objectContaining({
        name: 'ResolveError',
        code: 'PS1003',
        message:
          'Hook "check" script resolves outside ".promptscript/scripts/": /workspace/.promptscript/scripts/check.mjs',
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

  it('reports a missing target-only virtual script', () => {
    const fs = new VirtualFileSystem({
      'workspace/.promptscript/project.prs': '',
    });

    expect(
      validateBrowserHookScriptResources(
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
        fs,
        'workspace/.promptscript/project.prs'
      )
    ).toEqual([
      expect.objectContaining({
        code: 'PS2001',
        message: 'Hook "check" script not found: .promptscript/scripts/missing-target.mjs',
      }),
    ]);
  });

  it('ignores virtual target scripts for disabled overrides', () => {
    const fs = new VirtualFileSystem({
      'workspace/.promptscript/project.prs': '',
    });

    expect(
      validateBrowserHookScriptResources(
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
        fs,
        'workspace/.promptscript/project.prs'
      )
    ).toEqual([]);
  });

  it('validates inherited virtual scripts for re-enabled targets', () => {
    const fs = new VirtualFileSystem({
      'workspace/.promptscript/project.prs': '',
    });

    expect(
      validateBrowserHookScriptResources(
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
        fs,
        'workspace/.promptscript/project.prs'
      )
    ).toEqual([
      expect.objectContaining({
        code: 'PS2001',
        message: 'Hook "check" script not found: .promptscript/scripts/missing-inherited.mjs',
      }),
    ]);
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

  it('normalizes a relative explicit project root', () => {
    const fs = new VirtualFileSystem({
      'workspace/config/project.prs': '',
      'workspace/.promptscript/scripts/check.mjs': 'process.exit(0);\n',
    });

    expect(
      validateBrowserHookScriptResources(
        makeProgram(),
        fs,
        'workspace/config/project.prs',
        './workspace'
      )
    ).toEqual([]);
  });

  it.each(['.promptscript/project.prs', 'project.prs'])(
    'resolves script paths for a %s entry',
    (entryPath) => {
      const fs = new VirtualFileSystem({
        '.promptscript/scripts/check.mjs': 'process.exit(0);\n',
      });

      expect(validateBrowserHookScriptResources(makeProgram(), fs, entryPath)).toEqual([]);
    }
  );
});
