import { BLOCK_TYPES } from '@promptscript/core';
import type { ValidationRule } from '../types.js';

const BLOCK_TYPE_SET = new Set<string>(BLOCK_TYPES);
const RESERVED_BLOCK_PARAMS = ['only', 'exclude'] as const;
const RESERVED_SKILL_PARAMS = ['includes', 'excludes'] as const;

/**
 * PS021: @use block/skill filter validation
 *
 * Validates reserved parameters on @use directives:
 *
 * Block-level filters (`only`, `exclude`):
 * - Mutual exclusion: only and exclude cannot be used together
 * - Type: values must be arrays of strings
 * - Known names: warns on unknown block names
 * - Noop: warns on empty arrays
 *
 * Skill-level filters (`includes`, `excludes`):
 * - Mutual exclusion: includes and excludes cannot be used together
 * - Type: values must be arrays of strings
 * - Noop: warns on empty arrays
 * - No "unknown name" check (skill names are dynamic, only known after resolution)
 */
export const useBlockFilter: ValidationRule = {
  id: 'PS021',
  name: 'use-block-filter',
  description: 'Validate only/exclude/includes/excludes filter parameters on @use directives',
  defaultSeverity: 'error',
  validate: (ctx) => {
    for (const use of ctx.ast.uses) {
      if (!use.params || use.params.length === 0) continue;

      const onlyParam = use.params.find((p) => p.name === 'only');
      const excludeParam = use.params.find((p) => p.name === 'exclude');
      const includesParam = use.params.find((p) => p.name === 'includes');
      const excludesParam = use.params.find((p) => p.name === 'excludes');

      if (!onlyParam && !excludeParam && !includesParam && !excludesParam) continue;

      // Block filter mutual exclusion check
      if (onlyParam && excludeParam) {
        ctx.report({
          message: '"only" and "exclude" are mutually exclusive in @use',
          location: use.loc,
          suggestion: 'Use either only: [...] or exclude: [...], not both',
        });
        continue;
      }

      // Skill filter mutual exclusion check
      if (includesParam && excludesParam) {
        ctx.report({
          message: '"includes" and "excludes" are mutually exclusive in @use',
          location: use.loc,
          suggestion: 'Use either includes: [...] or excludes: [...], not both',
        });
        continue;
      }

      // Validate block-level filters (only/exclude)
      for (const paramName of RESERVED_BLOCK_PARAMS) {
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

      // Validate skill-level filters (includes/excludes)
      for (const paramName of RESERVED_SKILL_PARAMS) {
        const param = paramName === 'includes' ? includesParam : excludesParam;
        if (!param) continue;

        // Type check: must be an array
        if (!Array.isArray(param.value)) {
          ctx.report({
            message: `"${paramName}" expects an array, got ${typeof param.value}. Use ${paramName}: ["skillName"]`,
            location: param.loc ?? use.loc,
          });
          continue;
        }

        // Empty array warning
        if (param.value.length === 0) {
          ctx.report({
            message:
              paramName === 'includes'
                ? 'Empty "includes" filter imports nothing — consider removing this @use'
                : 'Empty "excludes" filter has no effect — consider removing the parameter',
            location: param.loc ?? use.loc,
            severity: 'warning',
          });
          continue;
        }

        // No "unknown name" check for skill filters — skill names are
        // dynamic and only known after resolution, unlike block type names.
      }
    }
  },
};
