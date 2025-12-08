import type { ValidationRule } from '../types';

/**
 * Check if a string is a valid semantic version.
 * Validates MAJOR.MINOR.PATCH format with optional prerelease and build metadata.
 */
export function isValidSemver(version: string): boolean {
  if (!version) {
    return false;
  }

  // Split into main version and prerelease/build parts
  const parts = version.split(/[-+]/);
  const mainVersion = parts[0];

  if (!mainVersion) {
    return false;
  }

  // Check main version format (MAJOR.MINOR.PATCH)
  const versionParts = mainVersion.split('.');
  if (versionParts.length !== 3) {
    return false;
  }

  // Each part must be a non-negative integer
  for (const part of versionParts) {
    // Must be all digits
    if (!/^\d+$/.test(part)) {
      return false;
    }
    // No leading zeros (except for 0 itself)
    if (part.length > 1 && part.startsWith('0')) {
      return false;
    }
  }

  return true;
}

/**
 * PS003: Syntax version must be valid semver
 */
export const validSemver: ValidationRule = {
  id: 'PS003',
  name: 'valid-semver',
  description: 'Syntax version must be valid semantic version',
  defaultSeverity: 'error',
  validate: (ctx) => {
    const meta = ctx.ast.meta;
    if (!meta?.fields?.['syntax']) {
      // PS002 will report the missing syntax
      return;
    }

    const syntax = meta.fields['syntax'];
    if (typeof syntax !== 'string') {
      ctx.report({
        message: '@meta.syntax must be a string',
        location: meta.loc ?? ctx.ast.loc,
        suggestion: 'Use a string value like syntax: "1.0.0"',
      });
      return;
    }

    if (!isValidSemver(syntax)) {
      ctx.report({
        message: `Invalid semantic version: "${syntax}"`,
        location: meta.loc ?? ctx.ast.loc,
        suggestion:
          'Use semantic versioning format: MAJOR.MINOR.PATCH (e.g., "1.0.0", "2.1.0-beta.1")',
      });
    }
  },
};
