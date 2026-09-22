import type { Lockfile } from '@promptscript/core';
import type { RuleContext, ValidationRule } from '../types.js';
import { findLockfileDependency, isValidationExcludeLike } from '../import-exclusions.js';

function reportInvalidExclude(ctx: RuleContext): void {
  ctx.report({
    message:
      'Invalid validation.excludes entry: expected { import: string, commit: string, rules: string[] }',
    suggestion: 'Fix the exclude entry in promptscript.yaml',
  });
}

function validateExclude(ctx: RuleContext, value: unknown, lockfile: Lockfile | undefined): void {
  if (!isValidationExcludeLike(value)) {
    reportInvalidExclude(ctx);
    return;
  }
  if (ctx.config.ignoreHashes || !lockfile) return;

  const dependency = findLockfileDependency(value.import, lockfile);
  if (!dependency) {
    ctx.report({
      message: `Exclude for import "${value.import}" does not match any dependency pinned in promptscript.lock.`,
      suggestion: 'Check the import source, or run `prs lock` to pin it',
    });
    return;
  }

  if (!value.commit) {
    ctx.report({
      message: `Exclude for import "${value.import}" must record the commit SHA it was reviewed at.`,
      suggestion: `Add commit: ${dependency.commit} to the exclude entry`,
    });
    return;
  }

  if (value.commit !== dependency.commit) {
    ctx.report({
      message: `Stale exclude for import "${value.import}": promptscript.lock pins commit ${dependency.commit} but the exclude records ${value.commit}.`,
      suggestion:
        'Re-review the imported content at the new commit, then update or remove the exclude',
    });
  }
}

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
      reportInvalidExclude(ctx);
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
      validateExclude(ctx, exclude, lockfile);
    }
  },
};
