import type { ValidationRule } from '../types.js';
import { findLockfileDependency, isValidationExcludeLike } from '../import-exclusions.js';

/**
 * PS040: Per-import validation excludes must stay bound to the pinned commit.
 *
 * Suppression of validation findings is declared by the consumer, never by the
 * scanned content, so an imported file cannot mute its own scan. Every exclude
 * records the commit it was reviewed at; when the lockfile pins a different
 * commit, the exclude stops applying and this rule fails the build with a
 * clear message, forcing the consumer to re-review the new content.
 */
export const importExcludes: ValidationRule = {
  id: 'PS040',
  name: 'import-excludes',
  description: 'Import validation excludes must match the commit pinned in the lockfile',
  defaultSeverity: 'error',
  validate: (ctx) => {
    const configuredExcludes: unknown = ctx.config.excludes;
    if (configuredExcludes === undefined) return;
    if (!Array.isArray(configuredExcludes)) {
      ctx.report({
        message:
          'Invalid validation.excludes entry: expected { import: string, commit: string, rules: string[] }',
        suggestion: 'Fix the exclude entry in promptscript.yaml',
      });
      return;
    }
    if (configuredExcludes.length === 0) return;

    const lockfile = ctx.config.lockfile;
    if (!ctx.config.ignoreHashes && !lockfile) {
      ctx.report({
        message:
          'validation.excludes requires a lockfile. Run `prs lock` to pin imports, then record excludes against the pinned commits.',
        suggestion: 'Remove validation.excludes or run `prs lock`',
      });
      return;
    }

    for (const exclude of configuredExcludes) {
      if (!isValidationExcludeLike(exclude)) {
        ctx.report({
          message:
            'Invalid validation.excludes entry: expected { import: string, commit: string, rules: string[] }',
          suggestion: 'Fix the exclude entry in promptscript.yaml',
        });
        continue;
      }

      // With --ignore-hashes the whole integrity story is disabled. Exclusions
      // still apply location-wise, but commit binding cannot be verified.
      if (ctx.config.ignoreHashes) continue;
      if (!lockfile) continue;

      const dependency = findLockfileDependency(exclude.import, lockfile);
      if (!dependency) {
        ctx.report({
          message: `Exclude for import "${exclude.import}" does not match any dependency pinned in promptscript.lock.`,
          suggestion: 'Check the import source, or run `prs lock` to pin it',
        });
        continue;
      }

      if (!exclude.commit) {
        ctx.report({
          message: `Exclude for import "${exclude.import}" must record the commit SHA it was reviewed at.`,
          suggestion: `Add commit: ${dependency.commit} to the exclude entry`,
        });
        continue;
      }

      if (exclude.commit !== dependency.commit) {
        ctx.report({
          message: `Stale exclude for import "${exclude.import}": promptscript.lock pins commit ${dependency.commit} but the exclude records ${exclude.commit}.`,
          suggestion:
            'Re-review the imported content at the new commit, then update or remove the exclude',
        });
      }
    }
  },
};
