import type { ValidationRule } from '../types.js';
import type { Value } from '@promptscript/core';

/**
 * PS036: Valid plugin definitions.
 *
 * Validates the @plugins block:
 * - Plugin names must be stable (non-empty, alphanumeric+hyphen)
 * - `version` must be a valid semver string if present
 * - `skills`, `hooks`, `mcpServers` must be string arrays if present
 * - All references must be non-empty strings
 * - Detects duplicate plugin names
 */
export const validPlugins: ValidationRule = {
  id: 'PS036',
  name: 'valid-plugins',
  description: 'Plugin definitions must match the portable schema',
  defaultSeverity: 'warning',
  validate: (ctx) => {
    const pluginsBlock = ctx.ast.blocks.find((b) => b.name === 'plugins');
    if (!pluginsBlock || pluginsBlock.content.type !== 'ObjectContent') return;

    const seenNames = new Set<string>();

    for (const [pluginName, pluginValue] of Object.entries(pluginsBlock.content.properties)) {
      if (!pluginName || !/^[a-zA-Z0-9._-]+$/.test(pluginName)) {
        ctx.report({
          message: `Plugin name "${pluginName}" must be alphanumeric with hyphens/dots only`,
          location: pluginsBlock.loc,
          severity: 'error',
        });
        continue;
      }

      if (seenNames.has(pluginName)) {
        ctx.report({
          message: `Duplicate plugin name "${pluginName}"`,
          location: pluginsBlock.loc,
          severity: 'error',
        });
      }
      seenNames.add(pluginName);

      if (typeof pluginValue !== 'object' || pluginValue === null || Array.isArray(pluginValue)) {
        ctx.report({
          message: `Plugin "${pluginName}" must be an object`,
          location: pluginsBlock.loc,
          severity: 'error',
        });
        continue;
      }

      const plugin = pluginValue as Record<string, Value>;

      // Validate version (optional, must be semver if present)
      const version = plugin['version'];
      if (version !== undefined && typeof version === 'string') {
        if (!/^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?$/.test(version)) {
          ctx.report({
            message: `Plugin "${pluginName}": invalid version "${version}"`,
            location: pluginsBlock.loc,
            suggestion: 'Use semantic versioning (e.g. "1.0.0")',
            severity: 'error',
          });
        }
      }

      // Validate reference arrays (skills, hooks, mcpServers)
      const refFields = ['skills', 'hooks', 'mcpServers'] as const;
      for (const field of refFields) {
        const refs = plugin[field];
        if (refs === undefined) continue;
        if (!Array.isArray(refs)) {
          ctx.report({
            message: `Plugin "${pluginName}": ${field} must be an array`,
            location: pluginsBlock.loc,
            severity: 'error',
          });
          continue;
        }
        for (const ref of refs) {
          if (typeof ref !== 'string' || ref.length === 0) {
            ctx.report({
              message: `Plugin "${pluginName}": ${field} must contain non-empty strings`,
              location: pluginsBlock.loc,
              severity: 'error',
            });
            break;
          }
        }
      }
    }
  },
};
