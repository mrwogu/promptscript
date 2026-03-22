import type { ValidationRule } from '../types.js';
import { walkBlocks, getBlockName } from '../walker.js';
import { isBlockType, BLOCK_TYPES, findClosestMatch } from '@promptscript/core';

/**
 * PS019: Unknown block name detection.
 *
 * Warns when a block name is not a known PromptScript block type.
 * Provides fuzzy match suggestions for typos.
 */
export const unknownBlockName: ValidationRule = {
  id: 'PS019',
  name: 'unknown-block-name',
  description: 'Detect unknown block type names with typo suggestions',
  defaultSeverity: 'warning',
  validate: (ctx) => {
    walkBlocks(ctx.ast, (block) => {
      const blockName = getBlockName(block);
      if (isBlockType(blockName)) return;

      const closest = findClosestMatch(blockName, BLOCK_TYPES, 2);

      if (closest) {
        ctx.report({
          message: `Unknown block type @${blockName}.`,
          location: block.loc,
          suggestion: `Did you mean @${closest.match}?`,
        });
      } else {
        ctx.report({
          message: `Unknown block type @${blockName}.`,
          location: block.loc,
          suggestion: `Known block types: ${BLOCK_TYPES.join(', ')}.`,
        });
      }
    });
  },
};
