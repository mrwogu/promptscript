import { BLOCK_TYPES } from '@promptscript/core';
import type { ValidationRule } from '../types.js';

const BLOCK_TYPE_SET = new Set<string>(BLOCK_TYPES);
const RESERVED_USE_PARAMS = ['only', 'exclude'] as const;

/**
 * PS021: @use block filter validation
 *
 * Validates reserved parameters `only` and `exclude` on @use directives:
 * - Mutual exclusion: only and exclude cannot be used together
 * - Type: values must be arrays of strings
 * - Known names: warns on unknown block names
 * - Noop: warns on empty arrays
 */
export const useBlockFilter: ValidationRule = {
  id: 'PS021',
  name: 'use-block-filter',
  description: 'Validate only/exclude block filter parameters on @use directives',
  defaultSeverity: 'error',
  validate: (ctx) => {
    for (const use of ctx.ast.uses) {
      if (!use.params || use.params.length === 0) continue;

      const onlyParam = use.params.find((p) => p.name === 'only');
      const excludeParam = use.params.find((p) => p.name === 'exclude');

      if (!onlyParam && !excludeParam) continue;

      // Mutual exclusion check
      if (onlyParam && excludeParam) {
        ctx.report({
          message: '"only" and "exclude" are mutually exclusive in @use',
          location: use.loc,
          suggestion: 'Use either only: [...] or exclude: [...], not both',
        });
        continue;
      }

      for (const paramName of RESERVED_USE_PARAMS) {
        const param = paramName === 'only' ? onlyParam : excludeParam;
        if (!param) continue;

        // Type check: must be an array
        if (!Array.isArray(param.value)) {
          ctx.report({
            message: `"${paramName}" expects an array, got ${typeof param.value}. Use ${paramName}: ["blockName"]`,
            location: param.loc ?? use.loc,
          });
          continue;
        }

        // Empty array warning
        if (param.value.length === 0) {
          ctx.report({
            message:
              paramName === 'only'
                ? 'Empty "only" filter imports nothing — consider removing this @use'
                : 'Empty "exclude" filter has no effect — consider removing the parameter',
            location: param.loc ?? use.loc,
            severity: 'warning',
          });
          continue;
        }

        // Unknown block name warning
        for (const val of param.value) {
          const name = String(val);
          if (!BLOCK_TYPE_SET.has(name)) {
            ctx.report({
              message: `Unknown block name "${name}" in @use ${paramName} filter. Known block types: ${BLOCK_TYPES.join(', ')}`,
              location: param.loc ?? use.loc,
              severity: 'warning',
            });
          }
        }
      }
    }
  },
};
