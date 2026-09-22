import { describe, expect, it, vi } from 'vitest';
import { portableRealpathSync } from '../realpath.js';

describe('portableRealpathSync', () => {
  it('resolves through the native implementation when present', () => {
    expect(portableRealpathSync('.')).toBe(process.cwd());
  });

  it('falls back to the portable implementation when native is missing', async () => {
    vi.resetModules();
    vi.doMock('node:fs', async (importOriginal) => {
      const actual = await importOriginal<typeof import('node:fs')>();
      // Function.prototype.bind drops own properties, so the copy has no
      // .native - the same shape runtimes like Deno expose.
      return { ...actual, realpathSync: actual.realpathSync.bind(null) };
    });

    const { portableRealpathSync: withoutNative } = await import('../realpath.js');
    expect(withoutNative('.')).toBe(process.cwd());

    vi.doUnmock('node:fs');
  });
});
