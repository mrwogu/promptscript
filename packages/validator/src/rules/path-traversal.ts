import type { ValidationRule } from '../types.js';
import { walkUses } from '../walker.js';

/**
 * Check if a path contains path traversal sequences after the initial prefix.
 *
 * A path is considered dangerous if it contains ".." anywhere after the first
 * segment. This prevents attacks like:
 * - ./foo/../../etc/passwd (escaping through nested traversal)
 * - ../../../etc/passwd (multiple levels up)
 * - ./foo/../bar (using .. to navigate within the path)
 *
 * NOTE: Patterns use bounded quantifiers to prevent ReDoS attacks.
 */

/**
 * Pattern to detect dangerous path traversal.
 *
 * Matches paths that:
 * 1. Start with ./ or ../
 * 2. Contain /.. or /../ anywhere after the start
 *
 * Uses bounded quantifiers to prevent ReDoS:
 * - [a-zA-Z0-9._-]{1,255} limits segment length
 * - (?:\/[a-zA-Z0-9._-]{1,255}){0,50} limits number of segments
 */
const PATH_TRAVERSAL_AFTER_START = /^\.\.?\/(?:[a-zA-Z0-9._-]{1,255}\/){0,50}\.\.(?:\/|$)/;

/**
 * Pattern to detect excessive parent directory traversal.
 * More than one level of ../ at the start is suspicious.
 *
 * Matches: ../../ (two or more levels up)
 * Uses bounded repetition to prevent ReDoS.
 */
const EXCESSIVE_PARENT_TRAVERSAL = /^(?:\.\.\/){2,20}/;

/**
 * Pattern to detect .. embedded in the middle of a path after other segments.
 * This catches ./valid/../escape patterns.
 *
 * Uses bounded quantifiers for safety.
 */
const EMBEDDED_TRAVERSAL =
  /^\.\.?\/[a-zA-Z0-9._-]{1,255}(?:\/[a-zA-Z0-9._-]{1,255}){0,50}\/\.\.(?:\/|$)/;

/**
 * Check if a path contains dangerous traversal patterns.
 */
export function hasPathTraversal(path: string): boolean {
  // Check for excessive parent traversal (../../.. etc)
  if (EXCESSIVE_PARENT_TRAVERSAL.test(path)) {
    return true;
  }

  // Check for traversal after the initial ./ or ../
  if (PATH_TRAVERSAL_AFTER_START.test(path)) {
    return true;
  }

  // Check for embedded .. after other path segments
  if (EMBEDDED_TRAVERSAL.test(path)) {
    return true;
  }

  return false;
}

/**
 * PS013: Detect path traversal attacks in path references.
 *
 * This rule identifies paths that could escape the intended directory
 * through ".." sequences. While ./path and ../path are valid for referencing
 * files in the current or parent directory, patterns like ./foo/../../etc/passwd
 * could be used to access files outside the intended scope.
 *
 * Valid paths:
 * - ./valid/path - stays within current directory
 * - ../parent/file - one level up is acceptable
 *
 * Dangerous paths:
 * - ./foo/../../etc/passwd - escapes through traversal
 * - ../../../etc/passwd - multiple levels up
 * - ./foo/../bar - embedded traversal
 */
export const pathTraversal: ValidationRule = {
  id: 'PS013',
  name: 'path-traversal',
  description: 'Detect path traversal attacks that could escape the intended directory',
  defaultSeverity: 'error',
  validate: (ctx) => {
    // Check inherit path
    if (ctx.ast.inherit) {
      const path = ctx.ast.inherit.path;
      if (hasPathTraversal(path.raw)) {
        ctx.report({
          message: `Path traversal detected: "${path.raw}" contains ".." sequences that could escape the intended directory`,
          location: ctx.ast.inherit.loc ?? ctx.ast.loc,
          suggestion:
            'Use direct paths without ".." traversal after the initial prefix. Reorganize your file structure if needed.',
        });
      }
    }

    // Check use declarations
    walkUses(ctx.ast, (use) => {
      if (hasPathTraversal(use.path.raw)) {
        ctx.report({
          message: `Path traversal detected: "${use.path.raw}" contains ".." sequences that could escape the intended directory`,
          location: use.loc,
          suggestion:
            'Use direct paths without ".." traversal after the initial prefix. Reorganize your file structure if needed.',
        });
      }
    });
  },
};
