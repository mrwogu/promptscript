import type { ValidationRule } from '../types.js';
import type { Value } from '@promptscript/core';

/** PRS block directives that should NOT appear in reference files */
const PRS_DIRECTIVES = [
  '@meta',
  '@identity',
  '@standards',
  '@restrictions',
  '@guards',
  '@skills',
  '@commands',
  '@agents',
  '@use',
  '@inherit',
  '@extend',
];

const DIRECTIVE_PATTERN = new RegExp(`^\\s*(${PRS_DIRECTIVES.join('|')}|""")`, 'm');

export const safeReferenceContent: ValidationRule = {
  id: 'PS026',
  name: 'safe-reference-content',
  description: 'Reference files should contain data, not PRS directives',
  defaultSeverity: 'warning',
  validate: (ctx) => {
    const skillsBlock = ctx.ast.blocks.find((b) => b.name === 'skills');
    if (!skillsBlock || skillsBlock.content.type !== 'ObjectContent') return;

    for (const [skillName, skillValue] of Object.entries(skillsBlock.content.properties)) {
      if (typeof skillValue !== 'object' || skillValue === null || Array.isArray(skillValue))
        continue;

      const skill = skillValue as Record<string, Value>;
      const resources = skill['resources'];
      if (!resources || !Array.isArray(resources)) continue;

      for (const resource of resources) {
        if (typeof resource !== 'object' || resource === null || Array.isArray(resource)) continue;

        const res = resource as Record<string, Value>;
        const relPath = res['relativePath'];
        const content = res['content'];

        if (typeof relPath !== 'string' || typeof content !== 'string') continue;

        // Only check reference files (not all resources)
        if (!relPath.startsWith('references/') && !relPath.includes('/references/')) continue;

        const match = content.match(DIRECTIVE_PATTERN);
        if (match) {
          ctx.report({
            message: `Reference file "${relPath}" in skill "${skillName}" contains PRS directive '${match[1]}' — references should contain data, not instructions`,
            location: skillsBlock.loc,
            suggestion:
              'Remove PRS directives from reference files. References are data files, not PromptScript source.',
          });
        }
      }
    }
  },
};
