import type { ValidationRule } from '../types.js';
import { walkBlocks, getBlockName } from '../walker.js';
import { isValidSemver } from './valid-semver.js';
import {
  isKnownSyntaxVersion,
  getLatestSyntaxVersion,
  getMinimumVersionForBlock,
  compareVersions,
} from '@promptscript/core';

/**
 * PS018: Syntax version compatibility check.
 */
export const syntaxVersionCompat: ValidationRule = {
  id: 'PS018',
  name: 'syntax-version-compat',
  description: 'Check syntax version compatibility with used blocks',
  defaultSeverity: 'warning',
  validate: (ctx) => {
    const meta = ctx.ast.meta;
    if (!meta?.fields?.['syntax']) return;

    const syntax = meta.fields['syntax'];
    if (typeof syntax !== 'string' || !isValidSemver(syntax)) return;

    if (!isKnownSyntaxVersion(syntax)) {
      ctx.report({
        message: `Unknown syntax version "${syntax}". Latest known version is "${getLatestSyntaxVersion()}".`,
        location: meta.loc ?? ctx.ast.loc,
        suggestion: 'Use "prs upgrade" to update to the latest syntax version.',
      });
      return;
    }

    walkBlocks(ctx.ast, (block) => {
      const blockName = getBlockName(block);
      const minVersion = getMinimumVersionForBlock(blockName);
      if (!minVersion) return;

      if (compareVersions(syntax, minVersion) < 0) {
        ctx.report({
          message: `Block @${blockName} requires syntax >= ${minVersion}, but file declares "${syntax}".`,
          location: block.loc,
          suggestion: 'Use "prs validate --fix" to update the syntax version.',
        });
      }
    });
  },
};
