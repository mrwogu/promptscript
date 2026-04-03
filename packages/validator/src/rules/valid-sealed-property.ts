import type { ValidationRule } from '../types.js';
import type { ObjectContent } from '@promptscript/core';

/** Replace-strategy properties that can be sealed. */
const REPLACE_PROPERTIES = new Set([
  'content',
  'description',
  'trigger',
  'userInvocable',
  'allowedTools',
  'disableModelInvocation',
  'context',
  'agent',
]);

/**
 * PS029: Valid sealed property.
 *
 * Warns when the `sealed` list in a skill definition contains property names
 * that are not replace-strategy properties (and therefore have no effect).
 * Also warns on empty sealed arrays.
 */
export const validSealedProperty: ValidationRule = {
  id: 'PS029',
  name: 'valid-sealed-property',
  description: 'Sealed property names must be replace-strategy properties',
  defaultSeverity: 'warning',
  validate: (ctx) => {
    const skillsBlock = ctx.ast.blocks.find((b) => b.name === 'skills');
    if (!skillsBlock || skillsBlock.content.type !== 'ObjectContent') return;

    const content = skillsBlock.content as ObjectContent;

    for (const [skillName, skillValue] of Object.entries(content.properties)) {
      if (typeof skillValue !== 'object' || skillValue === null || Array.isArray(skillValue))
        continue;

      const skill = skillValue as Record<string, unknown>;
      const sealed = skill['sealed'];
      if (sealed === undefined || sealed === true) continue;

      if (Array.isArray(sealed)) {
        if (sealed.length === 0) {
          ctx.report({
            message: `Empty sealed list in skill '${skillName}' has no effect`,
            location: skillsBlock.loc,
            severity: 'warning',
          });
          continue;
        }

        for (const entry of sealed) {
          if (typeof entry !== 'string') continue;
          if (!REPLACE_PROPERTIES.has(entry)) {
            ctx.report({
              message: `Sealed property '${entry}' in skill '${skillName}' is not a replace-strategy property and has no effect`,
              location: skillsBlock.loc,
              severity: 'warning',
            });
          }
        }
      }
    }
  },
};
