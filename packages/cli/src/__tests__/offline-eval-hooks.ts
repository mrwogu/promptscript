import { afterEach, beforeEach, vi } from 'vitest';
import { rm } from 'node:fs/promises';

/**
 * Register hooks for eval specs that must never reach the network: fetch throws,
 * CLI output is muted, and the temp copies in `roots` are removed after each test.
 */
export function useOfflineEval(roots: string[], what: string): void {
  const noNetwork = vi.fn((): never => {
    throw new Error(`no network in the ${what} check`);
  });

  beforeEach(() => {
    vi.stubGlobal('fetch', noNetwork);
    noNetwork.mockClear();
    vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    process.exitCode = undefined;
    await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
  });
}
