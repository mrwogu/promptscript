import type { ValidationRule } from '../types';
import { walkBlocks, hasContent } from '../walker';

/**
 * PS008: Block has no content
 */
export const emptyBlock: ValidationRule = {
  id: 'PS008',
  name: 'empty-block',
  description: 'Blocks should have content',
  defaultSeverity: 'warning',
  validate: (ctx) => {
    walkBlocks(ctx.ast, (block) => {
      if (!hasContent(block.content)) {
        const blockName = 'name' in block ? block.name : block.targetPath;
        ctx.report({
          message: `Block "${blockName}" has no content`,
          location: block.loc,
          suggestion: 'Add content to the block or remove it if not needed',
        });
      }
    });
  },
};
