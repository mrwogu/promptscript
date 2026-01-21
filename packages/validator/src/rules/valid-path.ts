import type { ValidationRule } from '../types.js';
import { walkUses } from '../walker.js';

// Pattern to validate path references
const VALID_PATH_PATTERNS = {
  // Namespace path: @namespace/path/to/file or @namespace/path@version
  namespace: /^@[a-z][a-z0-9-]*\/[a-z0-9-/]+(@\d+\.\d+\.\d+)?$/i,
  // Relative path: ./path/to/file or ../path/to/file
  relative: /^\.\.?\/[a-z0-9-/.]+$/i,
};

/**
 * Check if a path reference is valid.
 */
export function isValidPath(path: string): boolean {
  return VALID_PATH_PATTERNS.namespace.test(path) || VALID_PATH_PATTERNS.relative.test(path);
}

/**
 * PS006: Valid path references
 */
export const validPath: ValidationRule = {
  id: 'PS006',
  name: 'valid-path',
  description: 'Path references must be valid',
  defaultSeverity: 'error',
  validate: (ctx) => {
    // Check inherit path
    if (ctx.ast.inherit) {
      const path = ctx.ast.inherit.path;
      if (!isValidPath(path.raw)) {
        ctx.report({
          message: `Invalid path reference: "${path.raw}"`,
          location: ctx.ast.inherit.loc ?? ctx.ast.loc,
          suggestion:
            'Use @namespace/path format for absolute paths or ./relative/path for relative paths',
        });
      }
    }

    // Check use declarations
    walkUses(ctx.ast, (use) => {
      if (!isValidPath(use.path.raw)) {
        ctx.report({
          message: `Invalid path reference: "${use.path.raw}"`,
          location: use.loc,
          suggestion:
            'Use @namespace/path format for absolute paths or ./relative/path for relative paths',
        });
      }
    });
  },
};
