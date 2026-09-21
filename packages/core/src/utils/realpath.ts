import { realpathSync } from 'node:fs';

interface NativeRealpathSync {
  native?: typeof realpathSync;
}

/**
 * realpathSync that works across runtimes. Node exposes the faster
 * realpathSync.native binding, but Deno only implements realpathSync, so the
 * native path is probed and used only where it exists. Results are identical
 * on both runtimes.
 *
 * @param path - Absolute or relative path to resolve
 * @returns The fully resolved canonical path
 */
export function portableRealpathSync(path: string): string {
  const native = (realpathSync as unknown as NativeRealpathSync).native;
  return native === undefined ? realpathSync(path) : native(path);
}
