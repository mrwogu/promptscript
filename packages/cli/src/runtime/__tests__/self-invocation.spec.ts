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
