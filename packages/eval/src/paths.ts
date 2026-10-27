import { lstatSync } from 'node:fs';
import { basename, dirname, isAbsolute, join, relative, resolve, sep, win32 } from 'node:path';
import { portableRealpathSync } from '@promptscript/core';

const DRIVE_PREFIX = /^[A-Za-z]:/;

function isInside(root: string, candidate: string): boolean {
  const relation = relative(root, candidate);
  return (
    relation === '' ||
    (relation !== '..' && !relation.startsWith(`..${sep}`) && !isAbsolute(relation))
  );
}

// Real path of the longest existing prefix plus the missing rest as written,
// so a path that does not exist yet is still checked through its parents.
// Undefined for a dangling symlink, a link loop, a path through a regular
// file, an unreadable directory or any other error: the guard fails closed.
function realpathOfExisting(path: string): string | undefined {
  try {
    return portableRealpathSync(path);
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    const parent = dirname(path);
    if (code !== 'ENOENT' || parent === path) return undefined;
    if (lstatSync(path, { throwIfNoEntry: false }) !== undefined) return undefined;
    const real = realpathOfExisting(parent);
    return real === undefined ? undefined : join(real, basename(path));
  }
}

/**
 * Resolve a relative path written in a suite against `baseDir` and return its
 * real path. Returns undefined when the value is absolute, has a drive letter,
 * a UNC prefix or a NUL byte, when its real path leaves the project root
 * through `..` or a symlink, when it is a dangling symlink or a link loop, or
 * when it cannot be resolved for any other reason. Callers read
 * the returned path, not the value, so the checked path is the path that is
 * read.
 *
 * @param projectRoot - Project root directory
 * @param baseDir - Directory the value is relative to
 * @param value - Path as written
 * @returns The real path inside the project, or undefined when refused
 */
export function resolveProjectPath(
  projectRoot: string,
  baseDir: string,
  value: string
): string | undefined {
  if (
    value === '' ||
    value.includes('\u0000') ||
    isAbsolute(value) ||
    win32.isAbsolute(value) ||
    DRIVE_PREFIX.test(value)
  ) {
    return undefined;
  }
  const root = portableRealpathSync(projectRoot);
  const real = realpathOfExisting(resolve(baseDir, value));
  return real !== undefined && isInside(root, real) ? real : undefined;
}

/** Path of `file` relative to the real project root, with `/` separators. */
export function projectRelative(projectRoot: string, file: string): string {
  return relative(portableRealpathSync(projectRoot), file).split(sep).join('/');
}
