import { describe, expect, it } from 'vitest';

/**
 * The CLI module registers every command and shared flag at import time.
 *
 * Loading it in a test covers the registration wiring (including the
 * --resources option on compile and build) without parsing anything: the
 * direct-execution guard keeps `run()` inert when argv does not point at
 * this file.
 */
describe('cli module wiring', () => {
  it('exposes the program runner after registering commands', async () => {
    const cli = await import('../cli.js');
    expect(typeof cli.run).toBe('function');
  });
});
