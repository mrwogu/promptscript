import type { ValidationRule } from '../types.js';
import type { ObjectContent } from '@promptscript/core';

const MAX_PHASE_COUNT = 20;

/**
 * PS027: Valid skill composition validation.
 *
 * Checks post-resolution state of composed skills for issues:
 * - Inline @use in non-skills blocks (ignored at runtime)
 * - Excessive phase count (> 20 phases in __composedFrom)
 * - Phase name conflicts with parent skill name
 * - Empty phases (composedBlocks: [])
 */
export const validSkillComposition: ValidationRule = {
  id: 'PS027',
  name: 'valid-skill-composition',
  description: 'Skill composition must be valid: no conflicting phase names, no excessive phases',
  defaultSeverity: 'warning',
  validate: (ctx) => {
    // Check 1: @use in non-skills blocks
    for (const block of ctx.ast.blocks) {
      if (block.name === 'skills') continue;
      if (block.content.type !== 'ObjectContent') continue;
      const objContent = block.content as ObjectContent;
      if (objContent.inlineUses && objContent.inlineUses.length > 0) {
        ctx.report({
          message: `Inline @use is only supported within @skills blocks; ignored in @${block.name}`,
          location: block.loc,
          severity: 'warning',
        });
      }
    }

    // Checks 2-4: skills block composition checks
    const skillsBlock = ctx.ast.blocks.find((b) => b.name === 'skills');
    if (!skillsBlock || skillsBlock.content.type !== 'ObjectContent') return;

    const content = skillsBlock.content as ObjectContent;

    for (const [skillName, skillValue] of Object.entries(content.properties)) {
      if (typeof skillValue !== 'object' || skillValue === null || Array.isArray(skillValue))
        continue;

      const skill = skillValue as Record<string, unknown>;
      const composedFrom = skill['__composedFrom'];
      if (!Array.isArray(composedFrom)) continue;

      // Check 2: Phase count > 20
      if (composedFrom.length > MAX_PHASE_COUNT) {
        ctx.report({
          message: `Skill "${skillName}" has ${composedFrom.length} composed phases; maximum recommended is ${MAX_PHASE_COUNT}`,
          location: skillsBlock.loc,
          severity: 'warning',
        });
      }

      // Check 3 & 4: Phase name conflicts and empty phases
      for (const phase of composedFrom) {
        if (typeof phase !== 'object' || phase === null) continue;
        const p = phase as Record<string, unknown>;
        const phaseName = typeof p['name'] === 'string' ? p['name'] : null;
        const composedBlocks = Array.isArray(p['composedBlocks']) ? p['composedBlocks'] : null;

        // Check 3: Phase name = parent skill name
        if (phaseName !== null && phaseName === skillName) {
          ctx.report({
            message: `Composed phase name "${phaseName}" conflicts with parent skill name "${skillName}"`,
            location: skillsBlock.loc,
            severity: 'error',
          });
        }

        // Check 4: Empty phase
        if (composedBlocks !== null && composedBlocks.length === 0) {
          const label = phaseName ?? '(unknown)';
          ctx.report({
            message: `Composed phase "${label}" in skill "${skillName}" has no composed blocks`,
            location: skillsBlock.loc,
            severity: 'info',
          });
        }
      }
    }
  },
};
