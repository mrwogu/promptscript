import { afterEach, describe, expect, it, vi } from 'vitest';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { resolveSelfInvocation } from '../self-invocation.js';

describe('resolveSelfInvocation', () => {
  const workerPath = '/absolute/path/managed-output-worker.js';

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should spawn node with the worker module on node', () => {
    expect(resolveSelfInvocation({ workerPath })).toEqual({
      executable: process.execPath,
      prefixArgs: [workerPath],
    });
  });

  function withExecArgv<T>(execArgv: string[], body: () => T): T {
    const originalExecArgv = process.execArgv;
    process.execArgv = execArgv;
    try {
      return body();
    } finally {
      process.execArgv = originalExecArgv;
    }
  }

  it('should preserve node loader arguments for TypeScript workers', () => {
    const invocation = withExecArgv(
      ['--conditions', 'development', '--import', '@swc-node/register/esm-register', '--inspect=0'],
      () => resolveSelfInvocation({ workerPath })
    );

    expect(invocation?.prefixArgs).toEqual([
      '--import',
      // The child runs in the output directory, so the bare specifier must
      // arrive as an absolute URL resolved from the parent installation.
      expect.stringMatching(/^file:\/\/.*@swc-node[/\\]register/),
      workerPath,
    ]);
  });

  it('should preserve inline node loader arguments', () => {
    const invocation = withExecArgv(['--experimental-loader=tsx'], () =>
      resolveSelfInvocation({ workerPath })
    );

    expect(invocation?.prefixArgs).toHaveLength(2);
    expect(invocation?.prefixArgs[0]).toMatch(/^--experimental-loader=/);
    expect(invocation?.prefixArgs[1]).toBe(workerPath);
  });

  it('should resolve a relative loader path against the parent cwd', () => {
    const invocation = withExecArgv(['--import', './loaders/hook.mjs'], () =>
      resolveSelfInvocation({ workerPath })
    );

    expect(invocation?.prefixArgs).toEqual([
      '--import',
      pathToFileURL(resolve(process.cwd(), 'loaders/hook.mjs')).href,
      workerPath,
    ]);
  });

  it('should forward loader URLs unchanged', () => {
    const invocation = withExecArgv(['--import', 'data:text/javascript,void 0'], () =>
      resolveSelfInvocation({ workerPath })
    );

    expect(invocation?.prefixArgs).toEqual(['--import', 'data:text/javascript,void 0', workerPath]);
  });

  it('should forward an unresolvable bare loader specifier unchanged', () => {
    const invocation = withExecArgv(['--import', '@promptscript/no-such-loader'], () =>
      resolveSelfInvocation({ workerPath })
    );

    expect(invocation?.prefixArgs).toEqual([
      '--import',
      '@promptscript/no-such-loader',
      workerPath,
    ]);
  });

  it('should return undefined on node without a worker module', () => {
    expect(resolveSelfInvocation({ workerPath: undefined })).toBeUndefined();
  });

  it('should re-execute the compiled binary for deno standalone', () => {
    vi.stubGlobal('Deno', { build: { standalone: true } });
    expect(resolveSelfInvocation({ workerPath: undefined })).toEqual({
      executable: process.execPath,
      prefixArgs: [],
    });
  });

  it('should spawn deno run with scoped permissions for deno run mode', () => {
    vi.stubGlobal('Deno', { build: { standalone: false } });
    expect(resolveSelfInvocation({ workerPath })).toEqual({
      executable: process.execPath,
      prefixArgs: [
        'run',
        '--no-config',
        '--no-lock',
        '--allow-read=.',
        '--allow-write=.',
        workerPath,
      ],
    });
  });

  it('should return undefined for deno run mode without a worker module', () => {
    vi.stubGlobal('Deno', { build: { standalone: false } });
    expect(resolveSelfInvocation({ workerPath: undefined })).toBeUndefined();
  });
});
