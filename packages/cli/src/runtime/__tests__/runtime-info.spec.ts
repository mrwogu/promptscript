import { afterEach, describe, expect, it, vi } from 'vitest';
import { getRuntimeInfo } from '../runtime-info.js';

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
});
