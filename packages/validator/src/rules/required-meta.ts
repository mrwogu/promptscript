import type { ValidationRule } from '../types';

/**
 * PS001: @meta.id is required
 */
export const requiredMetaId: ValidationRule = {
  id: 'PS001',
  name: 'required-meta-id',
  description: '@meta.id is required',
  defaultSeverity: 'error',
  validate: (ctx) => {
    const meta = ctx.ast.meta;
    if (!meta) {
      ctx.report({
        message: '@meta block is required',
        location: ctx.ast.loc,
        suggestion: 'Add a @meta block with id and version fields',
      });
      return;
    }

    if (!meta.fields?.['id']) {
      ctx.report({
        message: '@meta block must include "id" field',
        location: meta.loc ?? ctx.ast.loc,
        suggestion: 'Add id: "your-project-id" to @meta',
      });
    }
  },
};

/**
 * PS002: @meta.syntax is required
 */
export const requiredMetaSyntax: ValidationRule = {
  id: 'PS002',
  name: 'required-meta-syntax',
  description: '@meta.syntax is required',
  defaultSeverity: 'error',
  validate: (ctx) => {
    const meta = ctx.ast.meta;
    if (!meta) {
      // PS001 will report the missing @meta block
      return;
    }

    if (!meta.fields?.['syntax']) {
      ctx.report({
        message: '@meta block must include "syntax" field',
        location: meta.loc ?? ctx.ast.loc,
        suggestion: 'Add syntax: "1.0.0" to @meta',
      });
    }
  },
};
