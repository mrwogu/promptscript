import type { ValidationRule } from '../types.js';
import type { Value } from '@promptscript/core';
import { isAstNode } from './guard-utils.js';

/**
 * PS022: Circular guard requires detection.
 *
 * Detects circular dependencies in guard requires chains using DFS.
 * Builds a requiresMap from the @guards block, then performs DFS
 * with visited/inStack sets to find cycles.
 */
export const circularGuardRequires: ValidationRule = {
  id: 'PS022',
  name: 'circular-guard-requires',
  description: 'Detect circular dependencies in guard requires chains',
  defaultSeverity: 'warning',
  validate: (ctx) => {
    const guardsBlock = ctx.ast.blocks.find((b) => b.name === 'guards');
    if (!guardsBlock || guardsBlock.content.type !== 'ObjectContent') return;

    // Build requires map
    const requiresMap = new Map<string, string[]>();

    for (const [guardName, guardValue] of Object.entries(guardsBlock.content.properties)) {
      if (!guardValue || typeof guardValue !== 'object' || Array.isArray(guardValue)) continue;
      if (isAstNode(guardValue)) continue;

      const guardObj = guardValue as Record<string, Value>;
      const requiresVal = guardObj['requires'];
      if (!requiresVal || !Array.isArray(requiresVal)) continue;

      const requires = requiresVal.filter((r): r is string => typeof r === 'string');
      if (requires.length > 0) {
        requiresMap.set(guardName, requires);
      }
    }

    // DFS cycle detection
    const visited = new Set<string>();
    const inStack = new Set<string>();

    function hasCycle(node: string): boolean {
      if (inStack.has(node)) return true;
      if (visited.has(node)) return false;

      visited.add(node);
      inStack.add(node);

      const deps = requiresMap.get(node) ?? [];
      for (const dep of deps) {
        if (hasCycle(dep)) {
          return true;
        }
      }

      inStack.delete(node);
      return false;
    }

    for (const guardName of requiresMap.keys()) {
      if (visited.has(guardName)) continue;
      if (hasCycle(guardName)) {
        ctx.report({
          message: `Circular dependency detected in guard requires chain involving "${guardName}".`,
          location: guardsBlock.loc,
          suggestion: 'Break the circular dependency chain in guard requires.',
        });
      }
    }
  },
};
