import type { Value } from '@promptscript/core';
import type { ValidationRule } from '../types.js';

function hasText(content: Value | undefined): boolean {
  if (typeof content === 'string') return content.trim().length > 0;
  if (typeof content !== 'object' || content === null || Array.isArray(content)) return false;
  const value = (content as Record<string, Value>)['value'];
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * PS049: a declared skill must have content.
 *
 * The resolver fills a skill from its SKILL.md. When no SKILL.md was found
 * and the declaration has no `content`, targets would get an empty stub with
 * only the description, so this is reported instead of passing silently.
 */
export const skillWithoutContent: ValidationRule = {
  id: 'PS049',
  name: 'skill-without-content',
  description: 'Declared skills must have a SKILL.md or content',
  defaultSeverity: 'warning',
  validate: (ctx) => {
    const skillsBlock = ctx.ast.blocks.find((block) => block.name === 'skills');
    if (skillsBlock?.content.type !== 'ObjectContent') return;

    for (const [name, skill] of Object.entries(skillsBlock.content.properties)) {
      if (name.startsWith('__')) continue;
      if (typeof skill !== 'object' || skill === null || Array.isArray(skill)) continue;
      if (hasText((skill as Record<string, Value>)['content'])) continue;

      ctx.report({
        message: `Skill "${name}" has no content: no SKILL.md with a body was found for it and the declaration has no content, so targets get an empty skill.`,
        location: skillsBlock.loc,
        suggestion: `Add skills/${name}/SKILL.md in the .promptscript directory of the project that declares the skill (if it exists, add a body to it), or set content in the declaration.`,
      });
    }
  },
};
