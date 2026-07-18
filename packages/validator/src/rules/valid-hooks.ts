import type { ValidationRule } from '../types.js';
import type { Value } from '@promptscript/core';

/** Portable hook events (PascalCase superset per architecture decision). */
const VALID_HOOK_EVENTS = new Set([
  'pre-tool-use',
  'post-tool-use',
  'session-start',
  'setup',
  'subagent-start',
  'notification',
  'stop',
]);

/** Minimum and maximum timeout in milliseconds. */
const MIN_TIMEOUT_MS = 100;
const MAX_TIMEOUT_MS = 600_000; // 10 minutes

/**
 * PS034: Valid hooks block.
 *
 * Validates the @hooks block structure and fields:
 * - Hook IDs must be stable (from object keys, non-empty)
 * - `event` must be a valid portable event
 * - `command` must be a non-empty string array (no shell interpolation)
 * - `timeoutMs` must be in valid range
 * - `matcher` must be a string if present
 * - `statusMessage` must be a string if present
 * - `continueOnFailure` must be a boolean if present
 * - `enabled` must be a boolean if present
 * - Forbids shell interpolation in command arguments
 */
export const validHooks: ValidationRule = {
  id: 'PS034',
  name: 'valid-hooks',
  description: 'Hook definitions must match the portable hooks schema',
  defaultSeverity: 'warning',
  validate: (ctx) => {
    const hooksBlock = ctx.ast.blocks.find((b) => b.name === 'hooks');
    if (!hooksBlock || hooksBlock.content.type !== 'ObjectContent') return;

    for (const [hookId, hookValue] of Object.entries(hooksBlock.content.properties)) {
      // Hook ID must be non-empty
      if (!hookId || hookId.length === 0) {
        ctx.report({
          message: 'Hook ID must be a non-empty string',
          location: hooksBlock.loc,
          severity: 'error',
        });
        continue;
      }

      if (typeof hookValue !== 'object' || hookValue === null || Array.isArray(hookValue)) {
        ctx.report({
          message: `Hook "${hookId}" must be an object`,
          location: hooksBlock.loc,
          severity: 'error',
        });
        continue;
      }

      const hook = hookValue as Record<string, Value>;

      // Validate event (required)
      const event = hook['event'];
      if (event === undefined) {
        ctx.report({
          message: `Hook "${hookId}": missing required field "event"`,
          location: hooksBlock.loc,
          severity: 'error',
        });
      } else if (typeof event !== 'string') {
        ctx.report({
          message: `Hook "${hookId}": event must be a string`,
          location: hooksBlock.loc,
          severity: 'error',
        });
      } else if (!VALID_HOOK_EVENTS.has(event)) {
        ctx.report({
          message: `Hook "${hookId}": invalid event "${event}"`,
          location: hooksBlock.loc,
          suggestion: `Valid events: ${[...VALID_HOOK_EVENTS].join(', ')}`,
          severity: 'error',
        });
      }

      // Validate command (required, non-empty string array, no interpolation)
      const command = hook['command'];
      if (command === undefined) {
        ctx.report({
          message: `Hook "${hookId}": missing required field "command"`,
          location: hooksBlock.loc,
          severity: 'error',
        });
      } else if (!Array.isArray(command)) {
        ctx.report({
          message: `Hook "${hookId}": command must be an array`,
          location: hooksBlock.loc,
          severity: 'error',
        });
      } else if (command.length === 0) {
        ctx.report({
          message: `Hook "${hookId}": command must not be empty`,
          location: hooksBlock.loc,
          severity: 'error',
        });
      } else {
        for (const arg of command) {
          if (typeof arg !== 'string') {
            ctx.report({
              message: `Hook "${hookId}": command arguments must be strings`,
              location: hooksBlock.loc,
              severity: 'error',
            });
            break;
          }
          // Forbid shell interpolation patterns
          if (arg.includes('$(') || arg.includes('`') || arg.includes('${')) {
            ctx.report({
              message: `Hook "${hookId}": shell interpolation is forbidden in command arguments`,
              location: hooksBlock.loc,
              suggestion: 'Use explicit argument passing instead of shell interpolation',
              severity: 'error',
            });
          }
        }
      }

      // Validate timeoutMs
      const timeoutMs = hook['timeoutMs'];
      if (timeoutMs !== undefined) {
        if (typeof timeoutMs !== 'number') {
          ctx.report({
            message: `Hook "${hookId}": timeoutMs must be a number`,
            location: hooksBlock.loc,
            severity: 'error',
          });
        } else if (timeoutMs < MIN_TIMEOUT_MS || timeoutMs > MAX_TIMEOUT_MS) {
          ctx.report({
            message: `Hook "${hookId}": timeoutMs must be between ${MIN_TIMEOUT_MS} and ${MAX_TIMEOUT_MS}`,
            location: hooksBlock.loc,
            severity: 'error',
          });
        }
      }

      // Validate matcher
      const matcher = hook['matcher'];
      if (matcher !== undefined && typeof matcher !== 'string') {
        ctx.report({
          message: `Hook "${hookId}": matcher must be a string`,
          location: hooksBlock.loc,
          severity: 'error',
        });
      }

      // Validate statusMessage
      const statusMessage = hook['statusMessage'];
      if (statusMessage !== undefined && typeof statusMessage !== 'string') {
        ctx.report({
          message: `Hook "${hookId}": statusMessage must be a string`,
          location: hooksBlock.loc,
          severity: 'error',
        });
      }

      // Validate continueOnFailure
      const continueOnFailure = hook['continueOnFailure'];
      if (continueOnFailure !== undefined && typeof continueOnFailure !== 'boolean') {
        ctx.report({
          message: `Hook "${hookId}": continueOnFailure must be a boolean`,
          location: hooksBlock.loc,
          severity: 'error',
        });
      }

      // Validate enabled
      const enabled = hook['enabled'];
      if (enabled !== undefined && typeof enabled !== 'boolean') {
        ctx.report({
          message: `Hook "${hookId}": enabled must be a boolean`,
          location: hooksBlock.loc,
          severity: 'error',
        });
      }
    }
  },
};
