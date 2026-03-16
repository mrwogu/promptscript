import type { ValidationRule } from '../types.js';
import type { Value } from '@promptscript/core';

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
 * PS016: Skill dependency validation
 *
 * Validates the `requires` field in @skills block entries:
 * - Required skills must exist in the same @skills block
 * - No self-referencing requires
 * - No circular dependencies
 */
export const skillDependencies: ValidationRule = {
  id: 'PS016',
  name: 'skill-dependencies',
  description: 'Validate skill dependency declarations (requires)',
  defaultSeverity: 'error',
  validate: (ctx) => {
    const skillsBlock = ctx.ast.blocks.find((b) => b.name === 'skills');
    if (!skillsBlock || skillsBlock.content.type !== 'ObjectContent') {
      return;
    }

    const allSkillNames = new Set(Object.keys(skillsBlock.content.properties));

    // Build dependency graph
    const deps = new Map<string, string[]>();

    for (const [skillName, skillValue] of Object.entries(skillsBlock.content.properties)) {
      if (!skillValue || typeof skillValue !== 'object' || Array.isArray(skillValue)) continue;
      if (isAstNode(skillValue)) continue;

      const skillObj = skillValue as Record<string, Value>;
      const requiresVal = skillObj['requires'];
      if (!requiresVal || !Array.isArray(requiresVal)) continue;

      const requires = requiresVal.filter((r): r is string => typeof r === 'string');

      // Check self-reference
      if (requires.includes(skillName)) {
        ctx.report({
          message: `Skill "${skillName}" requires itself`,
          location: skillsBlock.loc,
          suggestion: 'Remove self-reference from requires array',
        });
        continue;
      }

      deps.set(skillName, requires);

      // Check that required skills exist
      for (const reqName of requires) {
        if (!allSkillNames.has(reqName)) {
          ctx.report({
            message: `Skill "${skillName}" requires "${reqName}" which does not exist in @skills`,
            location: skillsBlock.loc,
            suggestion: `Add "${reqName}" to the @skills block or remove it from requires`,
          });
        }
      }
    }

    // Detect circular dependencies
    const visited = new Set<string>();
    const inStack = new Set<string>();

    function hasCycle(node: string): boolean {
      if (inStack.has(node)) return true;
      if (visited.has(node)) return false;

      visited.add(node);
      inStack.add(node);

      const nodeDeps = deps.get(node) ?? [];
      for (const dep of nodeDeps) {
        if (deps.has(dep) && hasCycle(dep)) {
          return true;
        }
      }

      inStack.delete(node);
      return false;
    }

    for (const skillName of deps.keys()) {
      visited.clear();
      inStack.clear();
      if (hasCycle(skillName)) {
        ctx.report({
          message: `Circular dependency detected involving skill "${skillName}"`,
          location: skillsBlock.loc,
          suggestion: 'Break the circular dependency chain in requires',
        });
      }
    }
  },
};
