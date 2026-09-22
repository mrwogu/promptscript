import { afterEach, describe, expect, it, vi } from 'vitest';
import { getRuntimeInfo, getRuntimeVersion } from '../runtime-info.js';

describe('getRuntimeInfo', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should report node when the Deno namespace is absent', () => {
    expect(getRuntimeInfo()).toEqual({ runtime: 'node', standalone: false });
  });

  it('should treat a Deno namespace without build info as node', () => {
    vi.stubGlobal('Deno', {});
    expect(getRuntimeInfo()).toEqual({ runtime: 'node', standalone: false });
  });

  it('should report deno when the Deno namespace is present', () => {
    vi.stubGlobal('Deno', { build: { standalone: false } });
    expect(getRuntimeInfo()).toEqual({ runtime: 'deno', standalone: false });
  });

  it('should detect compiled standalone binaries via Deno.build.standalone', () => {
    vi.stubGlobal('Deno', { build: { standalone: true } });
    expect(getRuntimeInfo()).toEqual({ runtime: 'deno', standalone: true });
  });

  it('should treat missing standalone flag as non-standalone deno', () => {
    vi.stubGlobal('Deno', { build: {} });
    expect(getRuntimeInfo()).toEqual({ runtime: 'deno', standalone: false });
  });

  it('should report the node runtime version', () => {
    expect(getRuntimeVersion()).toBe(process.versions.node);
  });

  it('should report the deno runtime version', () => {
    vi.stubGlobal('Deno', {
      build: { standalone: false },
      version: { deno: '2.9.7' },
    });
    expect(getRuntimeVersion()).toBe('2.9.7');
  });

  it('should report an unknown deno version without using node compatibility', () => {
    vi.stubGlobal('Deno', { build: { standalone: false } });
    expect(getRuntimeVersion()).toBe('0');
  });
});
