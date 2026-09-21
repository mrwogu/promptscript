import { afterEach, describe, expect, it, vi } from 'vitest';
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

  it('should preserve node loader arguments for TypeScript workers', () => {
    const originalExecArgv = process.execArgv;
    process.execArgv = [
      '--conditions',
      'development',
      '--import',
      '@swc-node/register/esm-register',
      '--inspect=0',
    ];
    try {
      expect(resolveSelfInvocation({ workerPath })).toEqual({
        executable: process.execPath,
        prefixArgs: ['--import', '@swc-node/register/esm-register', workerPath],
      });
    } finally {
      process.execArgv = originalExecArgv;
    }
  });

  it('should preserve inline node loader arguments', () => {
    const originalExecArgv = process.execArgv;
    process.execArgv = ['--experimental-loader=tsx'];
    try {
      expect(resolveSelfInvocation({ workerPath })).toEqual({
        executable: process.execPath,
        prefixArgs: ['--experimental-loader=tsx', workerPath],
      });
    } finally {
      process.execArgv = originalExecArgv;
    }
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
