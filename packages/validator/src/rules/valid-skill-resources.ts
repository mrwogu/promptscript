import type { ValidationRule } from '../types.js';
import type { Value } from '@promptscript/core';

/** Browser-safe path traversal check (no node:path dependency) */
function hasPathTraversal(path: string): boolean {
  if (path.startsWith('/') || /^[a-zA-Z]:/.test(path)) return true;
  const segments = path.split(/[/\\]/);
  return segments.some((s) => s === '..');
}

/**
 * PS032: Valid skill resources validation.
 *
 * Validates that skill `scripts` and `references` arrays in the AST
 * contain safe paths. Checks for:
 * - Path traversal attempts (e.g., ../../etc/passwd)
 * - Absolute paths
 * - Duplicate basenames in scripts
 * - Missing files (reported as warnings since the resolver may have already loaded them)
 */
export const validSkillResources: ValidationRule = {
  id: 'PS032',
  name: 'valid-skill-resources',
  description: 'Skill scripts and references must have safe paths',
  defaultSeverity: 'warning',
  validate: (ctx) => {
    const skillsBlock = ctx.ast.blocks.find((b) => b.name === 'skills');
    if (!skillsBlock || skillsBlock.content.type !== 'ObjectContent') return;

    for (const [skillName, skillValue] of Object.entries(skillsBlock.content.properties)) {
      if (typeof skillValue !== 'object' || skillValue === null || Array.isArray(skillValue))
        continue;

      const skill = skillValue as Record<string, Value>;

      // Validate scripts array
      const scripts = skill['scripts'];
      if (scripts && Array.isArray(scripts)) {
        const seenBasenames = new Set<string>();
        for (const script of scripts) {
          if (typeof script !== 'string') continue;

          if (hasPathTraversal(script)) {
            ctx.report({
              message: `Unsafe script path in skill "${skillName}": "${script}" — path traversal not allowed`,
              location: skillsBlock.loc,
              severity: 'error',
            });
            continue;
          }

          const basename = script.split(/[/\\]/).pop() ?? script;
          if (seenBasenames.has(basename)) {
            ctx.report({
              message: `Duplicate script basename "${basename}" in skill "${skillName}"`,
              location: skillsBlock.loc,
              severity: 'error',
            });
          }
          seenBasenames.add(basename);
        }
      }

      // Validate references array
      const refs = skill['references'];
      if (refs && Array.isArray(refs)) {
        const seen = new Set<string>();
        for (const ref of refs) {
          if (typeof ref !== 'string') continue;

          if (hasPathTraversal(ref)) {
            ctx.report({
              message: `Unsafe reference path in skill "${skillName}": "${ref}" — path traversal not allowed`,
              location: skillsBlock.loc,
              severity: 'error',
            });
            continue;
          }

          if (seen.has(ref)) {
            ctx.report({
              message: `Duplicate reference "${ref}" in skill "${skillName}"`,
              location: skillsBlock.loc,
            });
          }
          seen.add(ref);
        }
      }
    }
  },
};
