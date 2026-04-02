import type { ValidationRule } from '../types.js';
import type { ObjectContent } from '@promptscript/core';

/** Properties that support append-strategy merging with potential negation. */
const NEGATABLE_PROPERTIES = ['references', 'requires'];

/**
 * PS028: Valid append negation.
 *
 * Warns when negation prefix '!' appears in base skill definitions
 * (where it has no effect — negation only works in @extend blocks).
 * Also warns on empty negation paths and double negation '!!'.
 */
export const validAppendNegation: ValidationRule = {
  id: 'PS028',
  name: 'valid-append-negation',
  description: 'Negation prefix ! in append properties is only effective in @extend blocks',
  defaultSeverity: 'warning',
  validate: (ctx) => {
    const skillsBlock = ctx.ast.blocks.find((b) => b.name === 'skills');
    if (!skillsBlock || skillsBlock.content.type !== 'ObjectContent') return;

    const content = skillsBlock.content as ObjectContent;

    for (const [skillName, skillValue] of Object.entries(content.properties)) {
      if (typeof skillValue !== 'object' || skillValue === null || Array.isArray(skillValue))
        continue;

      const skill = skillValue as Record<string, unknown>;

      for (const prop of NEGATABLE_PROPERTIES) {
        const val = skill[prop];
        if (!Array.isArray(val)) continue;

        for (const entry of val) {
          if (typeof entry !== 'string') continue;

          if (entry === '!') {
            ctx.report({
              message: `Empty negation path in '${prop}' of skill '${skillName}'`,
              location: skillsBlock.loc,
              severity: 'warning',
            });
          } else if (entry.startsWith('!!')) {
            ctx.report({
              message: `Double negation '!!' in '${prop}' of skill '${skillName}' is likely a mistake`,
              location: skillsBlock.loc,
              severity: 'warning',
            });
          } else if (entry.startsWith('!')) {
            ctx.report({
              message: `Negation prefix '!' is only effective in @extend blocks (found in '${prop}' of skill '${skillName}')`,
              location: skillsBlock.loc,
              severity: 'warning',
            });
          }
        }
      }
    }
  },
};
