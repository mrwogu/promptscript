import type { ValidationRule } from '../types.js';
import type { Value } from '@promptscript/core';

const ALLOWED_EXTENSIONS = new Set(['.md', '.json', '.yaml', '.yml', '.txt', '.csv']);

/** Browser-safe path traversal check (no node:path dependency) */
function hasPathTraversal(path: string): boolean {
  if (path.startsWith('/') || /^[a-zA-Z]:/.test(path)) return true;
  const segments = path.split(/[/\\]/);
  return segments.some((s) => s === '..');
}

function getExtension(path: string): string {
  const dot = path.lastIndexOf('.');
  return dot >= 0 ? path.slice(dot).toLowerCase() : '';
}

/**
 * PS025: Valid skill references validation.
 *
 * Validates that skill `references` arrays contain safe, supported file paths.
 * Checks for:
 * - Path traversal attempts (e.g., ../../etc/passwd)
 * - Unsupported file extensions
 * - Duplicate references within a skill
 */
export const validSkillReferences: ValidationRule = {
  id: 'PS025',
  name: 'valid-skill-references',
  description: 'Skill references must have valid paths and allowed file types',
  defaultSeverity: 'warning',
  validate: (ctx) => {
    const skillsBlock = ctx.ast.blocks.find((b) => b.name === 'skills');
    if (!skillsBlock || skillsBlock.content.type !== 'ObjectContent') return;

    for (const [skillName, skillValue] of Object.entries(skillsBlock.content.properties)) {
      if (typeof skillValue !== 'object' || skillValue === null || Array.isArray(skillValue))
        continue;

      const skill = skillValue as Record<string, Value>;
      const refs = skill['references'];
      if (!refs || !Array.isArray(refs)) continue;

      const seen = new Set<string>();
      for (const ref of refs) {
        if (typeof ref !== 'string') continue;

        if (hasPathTraversal(ref)) {
          ctx.report({
            message: `Unsafe reference in skill "${skillName}": "${ref}" — path traversal not allowed`,
            location: skillsBlock.loc,
            severity: 'error',
          });
          continue;
        }

        const ext = getExtension(ref);
        if (ext && !ALLOWED_EXTENSIONS.has(ext)) {
          ctx.report({
            message: `Reference "${ref}" in skill "${skillName}" has unsupported extension "${ext}"`,
            location: skillsBlock.loc,
            suggestion: `Allowed extensions: ${[...ALLOWED_EXTENSIONS].join(', ')}`,
          });
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
  },
};
