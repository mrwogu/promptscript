import type { ValidationRule } from '../types.js';
import type { Value } from '@promptscript/core';

const AST_NODE_TYPES = new Set([
  'TextContent',
  'ObjectContent',
  'TemplateExpression',
  'TypeExpression',
  'Block',
]);

const VALID_CONTRACT_TYPES = new Set(['string', 'number', 'boolean', 'enum']);

function isAstNode(value: unknown): boolean {
  if (typeof value !== 'object' || value === null) return false;
  const typed = value as Record<string, unknown>;
  return typeof typed['type'] === 'string' && AST_NODE_TYPES.has(typed['type'] as string);
}

function validateContractFields(
  fields: Record<string, unknown>,
  fieldKind: 'input' | 'output',
  skillName: string,
  report: (msg: { message: string; location: unknown; suggestion?: string }) => void,
  location: unknown
): void {
  for (const [fieldName, fieldDef] of Object.entries(fields)) {
    if (!fieldDef || typeof fieldDef !== 'object' || Array.isArray(fieldDef) || isAstNode(fieldDef))
      continue;

    const defObj = fieldDef as Record<string, Value>;
    const typeVal = defObj['type'];

    if (typeof typeVal === 'string' && !VALID_CONTRACT_TYPES.has(typeVal)) {
      report({
        message: `Skill "${skillName}": ${fieldKind} "${fieldName}" has unknown type "${typeVal}"`,
        location,
        suggestion: `Use one of: ${[...VALID_CONTRACT_TYPES].join(', ')}`,
      });
    }

    if (typeVal === 'enum') {
      const options = defObj['options'];
      if (!options || !Array.isArray(options) || options.length === 0) {
        report({
          message: `Skill "${skillName}": enum ${fieldKind} "${fieldName}" has no options defined`,
          location,
          suggestion: 'Add options array for enum field',
        });
      }
    }
  }
}

/**
 * PS017: Skill contract validation
 *
 * Validates inputs and outputs definitions in @skills block:
 * - Field types are valid (string, number, boolean, enum)
 * - Enum fields have options defined
 * - No name collisions between params and inputs
 */
export const skillContracts: ValidationRule = {
  id: 'PS017',
  name: 'skill-contracts',
  description: 'Validate skill contract definitions (inputs/outputs)',
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

      // Validate inputs
      const inputsVal = skillObj['inputs'];
      if (
        inputsVal &&
        typeof inputsVal === 'object' &&
        !Array.isArray(inputsVal) &&
        !isAstNode(inputsVal)
      ) {
        validateContractFields(
          inputsVal as Record<string, unknown>,
          'input',
          skillName,
          (msg) =>
            ctx.report({
              ...msg,
              location: skillsBlock.loc,
            }),
          skillsBlock.loc
        );

        // Check name collision between params and inputs
        const paramsVal = skillObj['params'];
        if (
          paramsVal &&
          typeof paramsVal === 'object' &&
          !Array.isArray(paramsVal) &&
          !isAstNode(paramsVal)
        ) {
          const paramNames = new Set(Object.keys(paramsVal as Record<string, Value>));
          for (const inputName of Object.keys(inputsVal as Record<string, Value>)) {
            if (paramNames.has(inputName)) {
              ctx.report({
                message: `Skill "${skillName}": "${inputName}" defined in both params and inputs`,
                location: skillsBlock.loc,
                suggestion: 'Use either params or inputs for each field, not both',
              });
            }
          }
        }
      }

      // Validate outputs
      const outputsVal = skillObj['outputs'];
      if (
        outputsVal &&
        typeof outputsVal === 'object' &&
        !Array.isArray(outputsVal) &&
        !isAstNode(outputsVal)
      ) {
        validateContractFields(
          outputsVal as Record<string, unknown>,
          'output',
          skillName,
          (msg) =>
            ctx.report({
              ...msg,
              location: skillsBlock.loc,
            }),
          skillsBlock.loc
        );
      }
    }
  },
};
