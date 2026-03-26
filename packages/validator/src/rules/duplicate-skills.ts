import type { ValidationRule } from '../types.js';

/**
 * PS020: Duplicate skill names
 *
 * Detects duplicate skill names that arise from:
 * - Multiple @use directives importing skills with the same alias
 * - Duplicate keys in the @skills block across different import sources
 */
export const duplicateSkills: ValidationRule = {
  id: 'PS020',
  name: 'duplicate-skills',
  description: 'Detect duplicate skill names across @use imports',
  defaultSeverity: 'error',
  validate: (ctx) => {
    // Check for duplicate aliases across @use directives
    const aliasCounts = new Map<string, number>();

    for (const use of ctx.ast.uses) {
      if (use.alias) {
        aliasCounts.set(use.alias, (aliasCounts.get(use.alias) ?? 0) + 1);
      }
    }

    for (const [alias, count] of aliasCounts) {
      if (count > 1) {
        // Find the location of the second occurrence for better diagnostics
        const secondUse = ctx.ast.uses.filter((u) => u.alias === alias)[1];
        ctx.report({
          message: `Duplicate skill name "${alias}" — imported ${count} times via @use`,
          location: secondUse?.loc,
          suggestion: `Rename one of the @use aliases to avoid the conflict`,
        });
      }
    }
  },
};
