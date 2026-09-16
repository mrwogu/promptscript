import { homedir } from 'os';
import { resolve } from 'path';

/**
 * User-level files the compiler must never write.
 *
 * These files belong to the person, not the project: they are personal
 * overrides the target tools document as user-owned. A global output root
 * (for example `--output "$HOME"`) must not clobber them.
 */
const PROTECTED_USER_FILES: readonly { readonly path: string; readonly reason: string }[] = [
  {
    // Factory AI contract: ~/.factory/AGENTS.md is a personal override file.
    path: '.factory/AGENTS.md',
    reason: 'Factory personal override (~/.factory/AGENTS.md is user-owned, never compiler output)',
  },
];

export interface ProtectedUserFile {
  /** Display path with the ~ prefix. */
  readonly displayPath: string;
  /** Why the file is protected. */
  readonly reason: string;
}

/**
 * Return the protection record when an absolute path is a protected
 * user-level file, or undefined when the path is safe to write.
 */
export function describeProtectedUserFile(absolutePath: string): ProtectedUserFile | undefined {
  const home = homedir();
  for (const entry of PROTECTED_USER_FILES) {
    if (absolutePath === resolve(home, entry.path)) {
      return { displayPath: `~/${entry.path}`, reason: entry.reason };
    }
  }
  return undefined;
}
