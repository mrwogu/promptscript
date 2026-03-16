import type { ValidationRule } from '../types.js';
import type { Value } from '@promptscript/core';

const VALID_PARAM_TYPES = new Set(['string', 'number', 'boolean', 'enum']);
const AST_NODE_TYPES = new Set([
  'TextContent',
  'ObjectContent',
  'TemplateExpression',
  'TypeExpression',
  'Block',
]);

function isAstNode(value: unknown): boolean {
  if (typeof value !== 'object' || value === null) return false;
  const typed = value as Record<string, unknown>;
  return typeof typed['type'] === 'string' && AST_NODE_TYPES.has(typed['type'] as string);
}

/**
 * PS015: Valid skill parameter definitions
 *
 * Validates parameters defined in @skills block entries:
 * - Param type is a known type (string, number, boolean, enum)
 * - No duplicate param names within a skill
 * - Enum params should have options defined
 */
export const skillParams: ValidationRule = {
  id: 'PS015',
  name: 'skill-params',
  description: 'Validate parameter definitions in @skills block',
  defaultSeverity: 'warning',
  validate: (ctx) => {
    const skillsBlock = ctx.ast.blocks.find((b) => b.name === 'skills');
    if (!skillsBlock || skillsBlock.content.type !== 'ObjectContent') {
      return;
    }

    for (const [skillName, skillValue] of Object.entries(skillsBlock.content.properties)) {
      if (!skillValue || typeof skillValue !== 'object' || Array.isArray(skillValue)) continue;
      if (isAstNode(skillValue)) continue;

      const skillObj = skillValue as Record<string, Value>;
      const paramsVal = skillObj['params'];
      if (!paramsVal || typeof paramsVal !== 'object' || Array.isArray(paramsVal)) continue;
      if (isAstNode(paramsVal)) continue;

      const paramsObj = paramsVal as Record<string, Value>;
      const seenNames = new Set<string>();

      for (const [paramName, paramDef] of Object.entries(paramsObj)) {
        // Check for duplicate param names
        if (seenNames.has(paramName)) {
          ctx.report({
            message: `Skill "${skillName}": duplicate parameter "${paramName}"`,
            location: skillsBlock.loc,
            suggestion: 'Remove the duplicate parameter definition',
          });
        }
        seenNames.add(paramName);

        // If param definition is an object with type, validate it
        if (
          paramDef &&
          typeof paramDef === 'object' &&
          !Array.isArray(paramDef) &&
          !isAstNode(paramDef)
        ) {
          const defObj = paramDef as Record<string, Value>;
          const typeVal = defObj['type'];

          if (typeof typeVal === 'string' && !VALID_PARAM_TYPES.has(typeVal)) {
            ctx.report({
              message: `Skill "${skillName}": parameter "${paramName}" has unknown type "${typeVal}"`,
              location: skillsBlock.loc,
              suggestion: `Use one of: ${[...VALID_PARAM_TYPES].join(', ')}`,
            });
          }

          // Check enum has options
          if (typeVal === 'enum') {
            const options = defObj['options'];
            if (!options || !Array.isArray(options) || options.length === 0) {
              ctx.report({
                message: `Skill "${skillName}": enum parameter "${paramName}" has no options defined`,
                location: skillsBlock.loc,
                suggestion: 'Add options array for enum parameter',
              });
            }
          }
        }
      }
    }
  },
};
