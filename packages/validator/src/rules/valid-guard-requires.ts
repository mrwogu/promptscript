import type { ValidationRule } from '../types.js';
import type { Value } from '@promptscript/core';
import { findClosestMatch } from '@promptscript/core';
import { isAstNode } from './guard-utils.js';

/**
 * PS024: Valid guard requires references.
 *
 * Validates that guard `requires` references point to existing guards
 * (by key name in the same @guards block). Skips registry-style refs
 * starting with `@`. Provides fuzzy match suggestions for typos.
 */
export const validGuardRequires: ValidationRule = {
  id: 'PS024',
  name: 'valid-guard-requires',
  description: 'Validate that guard requires references point to existing guards',
  defaultSeverity: 'warning',
  validate: (ctx) => {
    const guardsBlock = ctx.ast.blocks.find((b) => b.name === 'guards');
    if (!guardsBlock || guardsBlock.content.type !== 'ObjectContent') return;

    const allGuardNames = Object.keys(guardsBlock.content.properties);
    const guardNameSet = new Set(allGuardNames);

    for (const [guardName, guardValue] of Object.entries(guardsBlock.content.properties)) {
      if (!guardValue || typeof guardValue !== 'object' || Array.isArray(guardValue)) continue;
      if (isAstNode(guardValue)) continue;

      const guardObj = guardValue as Record<string, Value>;
      const requiresVal = guardObj['requires'];
      if (!requiresVal || !Array.isArray(requiresVal)) continue;

      const requires = requiresVal.filter((r): r is string => typeof r === 'string');

      for (const reqName of requires) {
        // Skip registry-style references starting with @
        if (reqName.startsWith('@')) continue;

        if (!guardNameSet.has(reqName)) {
          const closest = findClosestMatch(reqName, allGuardNames, 2);
          const suggestion = closest
            ? `Did you mean "${closest.match}"?`
            : `Available guards: ${allGuardNames.join(', ')}`;

          ctx.report({
            message: `Guard "${guardName}" requires "${reqName}" which does not exist in @guards.`,
            location: guardsBlock.loc,
            suggestion,
          });
        }
      }
    }
  },
};
