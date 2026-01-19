import type { ValidationRule } from '../types';

/**
 * PS007: Deprecated features
 *
 * This rule checks for deprecated features in the AST.
 * Currently a placeholder for future deprecation warnings.
 */
export const deprecated: ValidationRule = {
  id: 'PS007',
  name: 'deprecated',
  description: 'Warns about deprecated features',
  defaultSeverity: 'warning',
  validate: (ctx) => {
    // Check for deprecated block names
    const deprecatedBlocks: Record<string, string> = {
      // Example: 'oldBlockName': 'Use @newBlockName instead'
    };

    for (const block of ctx.ast.blocks) {
      if (block.name in deprecatedBlocks) {
        ctx.report({
          message: `Block "@${block.name}" is deprecated`,
          location: block.loc,
          suggestion: deprecatedBlocks[block.name],
        });
      }
    }

    // Check for deprecated meta fields
    const deprecatedMetaFields: Record<string, string> = {
      // Example: 'oldField': 'Use "newField" instead'
    };

    if (ctx.ast.meta) {
      for (const field of Object.keys(ctx.ast.meta.fields ?? {})) {
        if (field in deprecatedMetaFields) {
          ctx.report({
            message: `Meta field "${field}" is deprecated`,
            location: ctx.ast.meta.loc ?? ctx.ast.loc,
            suggestion: deprecatedMetaFields[field],
          });
        }
      }
    }
  },
};
