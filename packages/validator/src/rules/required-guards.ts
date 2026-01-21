import type { ValidationRule } from '../types.js';

/**
 * PS004: Required guards must be present
 */
export const requiredGuards: ValidationRule = {
  id: 'PS004',
  name: 'required-guards',
  description: 'Required guards must be present',
  defaultSeverity: 'error',
  validate: (ctx) => {
    const requiredGuardsList = ctx.config.requiredGuards;
    if (!requiredGuardsList || requiredGuardsList.length === 0) {
      // No required guards configured
      return;
    }

    // Find the guards block
    const guardsBlock = ctx.ast.blocks.find((block) => block.name === 'guards');
    if (!guardsBlock) {
      ctx.report({
        message: `Missing @guards block. Required guards: ${requiredGuardsList.join(', ')}`,
        location: ctx.ast.loc,
        suggestion: 'Add a @guards block with the required guard references',
      });
      return;
    }

    // Extract guard references from the guards block
    const presentGuards = extractGuardReferences(guardsBlock.content);

    // Check each required guard
    for (const required of requiredGuardsList) {
      if (!presentGuards.includes(required)) {
        ctx.report({
          message: `Missing required guard: "${required}"`,
          location: guardsBlock.loc ?? ctx.ast.loc,
          suggestion: `Add @use ${required} to include the required guard`,
        });
      }
    }
  },
};

/**
 * Extract guard references from block content.
 */
function extractGuardReferences(content: {
  type: string;
  elements?: unknown[];
  properties?: Record<string, unknown>;
}): string[] {
  const guards: string[] = [];

  if (content.type === 'ArrayContent' && Array.isArray(content.elements)) {
    for (const element of content.elements) {
      if (typeof element === 'string') {
        guards.push(element);
      }
    }
  } else if (content.type === 'ObjectContent' && content.properties) {
    // Guards might be specified as keys in an object
    for (const key of Object.keys(content.properties)) {
      guards.push(key);
    }
  }

  return guards;
}
