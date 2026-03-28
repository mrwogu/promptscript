import type { ValidationRule } from '../types.js';
import type { Value } from '@promptscript/core';
import { walkBlocks, getBlockName } from '../walker.js';
import { isAstNode } from './guard-utils.js';

/**
 * PS023: Valid examples validation.
 *
 * Validates that every example entry has required `input` and `output` fields.
 * Checks both:
 * - (a) Top-level @examples blocks
 * - (b) `examples` properties nested inside @skills entries
 */
export const validExamples: ValidationRule = {
  id: 'PS023',
  name: 'valid-examples',
  description: 'Validate that example entries have required input and output fields',
  defaultSeverity: 'warning',
  validate: (ctx) => {
    // (a) Top-level @examples blocks
    walkBlocks(ctx.ast, (block) => {
      const blockName = getBlockName(block);
      if (blockName !== 'examples') return;

      if (block.type === 'Block' && block.content.type === 'ObjectContent') {
        validateExamplesObject(block.content.properties, block.loc, ctx.report);
      }
    });

    // (b) examples nested inside @skills entries
    const skillsBlock = ctx.ast.blocks.find((b) => b.name === 'skills');
    if (!skillsBlock || skillsBlock.content.type !== 'ObjectContent') return;

    for (const [skillName, skillValue] of Object.entries(skillsBlock.content.properties)) {
      if (!skillValue || typeof skillValue !== 'object' || Array.isArray(skillValue)) continue;
      if (isAstNode(skillValue)) continue;

      const skillObj = skillValue as Record<string, Value>;
      const examplesVal = skillObj['examples'];
      if (
        !examplesVal ||
        typeof examplesVal !== 'object' ||
        Array.isArray(examplesVal) ||
        isAstNode(examplesVal)
      )
        continue;

      validateExamplesObject(
        examplesVal as Record<string, Value>,
        skillsBlock.loc,
        ctx.report,
        skillName
      );
    }
  },
};

function validateExamplesObject(
  properties: Record<string, Value>,
  location: import('@promptscript/core').SourceLocation,
  report: (msg: {
    message: string;
    location?: import('@promptscript/core').SourceLocation;
    suggestion?: string;
  }) => void,
  skillName?: string
): void {
  for (const [exampleName, exampleValue] of Object.entries(properties)) {
    if (!exampleValue || typeof exampleValue !== 'object' || Array.isArray(exampleValue)) continue;
    if (isAstNode(exampleValue)) continue;

    const exampleObj = exampleValue as Record<string, Value>;
    const prefix = skillName
      ? `Skill "${skillName}", example "${exampleName}"`
      : `Example "${exampleName}"`;

    if (!('input' in exampleObj)) {
      report({
        message: `${prefix} is missing required "input" field.`,
        location,
        suggestion: 'Add an "input" field to the example entry.',
      });
    }

    if (!('output' in exampleObj)) {
      report({
        message: `${prefix} is missing required "output" field.`,
        location,
        suggestion: 'Add an "output" field to the example entry.',
      });
    }
  }
}
