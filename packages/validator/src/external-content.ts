import { isAbsolute, relative, sep } from 'node:path';
import type { SourceLocation } from '@promptscript/core';
import type { ValidatorConfig } from './types.js';

/**
 * Check whether a path sits inside a root directory.
 * True for the root itself and any path below it.
 */
function isPathInside(root: string, candidate: string): boolean {
  const relation = relative(root, candidate);
  return (
    relation === '' ||
    (relation !== '..' && !relation.startsWith(`..${sep}`) && !isAbsolute(relation))
  );
}

/**
 * Check whether a location points at imported content.
 *
 * Imported content lives under the registry cache or vendor directory, which
 * the compiler reports through `externalRoots`. Heuristic rules skip it by
 * default: a project cannot fix a false positive in someone else's skill, and
 * `--strict` would turn it into a hard failure.
 *
 * Opting in via `scanExternalContent: true` restores full scanning.
 */
export function isExternalLocation(
  loc: SourceLocation | undefined,
  config: ValidatorConfig
): boolean {
  if (config.scanExternalContent || !loc) return false;
  const roots = config.externalRoots;
  if (!roots || roots.length === 0) return false;
  return roots.some((root) => isPathInside(root, loc.file));
}
