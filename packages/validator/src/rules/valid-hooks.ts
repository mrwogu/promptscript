import type { RuleContext, ValidationRule } from '../types.js';
import {
  isPortableHookInterpreter,
  isPortableHookScriptPath,
  isPortablePathSegment,
  type SourceLocation,
  type Value,
} from '@promptscript/core';

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
const HOOK_FIELDS = new Set([
  'event',
  'command',
  'script',
  'cwd',
  'matcher',
  'timeoutMs',
  'statusMessage',
  'continueOnFailure',
  'enabled',
]);
const SCRIPT_FIELDS = new Set(['path', 'interpreter', 'args']);

/**
 * PS034: Valid hooks block.
 *
 * Validates the @hooks block structure and fields:
 * - Hook IDs must be stable (from object keys, non-empty)
 * - `event` must be a valid portable event
 * - Exactly one of `command` or `script` must be configured
 * - `command` must be a non-empty string array (no shell interpolation)
 * - `script` must reference a supported repository-local script
 * - `cwd` must be "project" or a portable relative path
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
    if (!hooksBlock) return;
    if (hooksBlock.content.type !== 'ObjectContent') {
      ctx.report({
        message: '@hooks must contain named hook objects',
        location: hooksBlock.loc,
        severity: 'error',
      });
      return;
    }

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
      for (const field of Object.keys(hook)) {
        if (!HOOK_FIELDS.has(field)) {
          ctx.report({
            message: `Hook "${hookId}": unknown field "${field}"`,
            location: hooksBlock.loc,
            severity: 'error',
          });
        }
      }

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

      // Validate command or script
      const command = hook['command'];
      const script = hook['script'];
      if (command === undefined && script === undefined) {
        ctx.report({
          message: `Hook "${hookId}": exactly one of "command" or "script" is required`,
          location: hooksBlock.loc,
          severity: 'error',
        });
      } else if (command !== undefined && script !== undefined) {
        ctx.report({
          message: `Hook "${hookId}": "command" and "script" are mutually exclusive`,
          location: hooksBlock.loc,
          severity: 'error',
        });
      } else if (command !== undefined) {
        if (!Array.isArray(command)) {
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
          if (typeof command[0] === 'string' && command[0].trim().length === 0) {
            ctx.report({
              message: `Hook "${hookId}": command executable must not be empty`,
              location: hooksBlock.loc,
              severity: 'error',
            });
          }
          for (const arg of command) {
            if (typeof arg !== 'string') {
              ctx.report({
                message: `Hook "${hookId}": command arguments must be strings`,
                location: hooksBlock.loc,
                severity: 'error',
              });
              break;
            }
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
      } else if (typeof script !== 'object' || script === null || Array.isArray(script)) {
        ctx.report({
          message: `Hook "${hookId}": script must be an object`,
          location: hooksBlock.loc,
          severity: 'error',
        });
      } else {
        validateScript(hookId, script as Record<string, Value>, hooksBlock.loc, ctx.report);
      }

      // Validate cwd
      const cwd = hook['cwd'];
      if (cwd !== undefined) {
        if (typeof cwd !== 'string') {
          ctx.report({
            message: `Hook "${hookId}": cwd must be a string`,
            location: hooksBlock.loc,
            severity: 'error',
          });
        } else if (cwd !== 'project' && !isPortableRelativePath(cwd)) {
          ctx.report({
            message: `Hook "${hookId}": cwd must be "project" or a portable path relative to the project root`,
            location: hooksBlock.loc,
            suggestion: 'Use "project" or forward-slash path segments without "." or ".."',
            severity: 'error',
          });
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

function validateScript(
  hookId: string,
  script: Record<string, Value>,
  location: SourceLocation,
  report: RuleContext['report']
): void {
  for (const field of Object.keys(script)) {
    if (!SCRIPT_FIELDS.has(field)) {
      report({
        message: `Hook "${hookId}": unknown script field "${field}"`,
        location,
        severity: 'error',
      });
    }
  }

  const path = script['path'];
  if (typeof path !== 'string' || !isPortableHookScriptPath(path)) {
    report({
      message: `Hook "${hookId}": script path must be a safe file under ".promptscript/scripts/"`,
      location,
      severity: 'error',
    });
  }

  const interpreter = script['interpreter'];
  if (typeof interpreter !== 'string' || !isPortableHookInterpreter(interpreter)) {
    report({
      message: `Hook "${hookId}": script interpreter is required and must be portable`,
      location,
      suggestion:
        'Use python3, python, node, deno, bun, ruby, php, perl, bash, sh, zsh, pwsh, or powershell',
      severity: 'error',
    });
  }

  const args = script['args'];
  if (args !== undefined && (!Array.isArray(args) || args.some((arg) => typeof arg !== 'string'))) {
    report({
      message: `Hook "${hookId}": script args must be an array of strings`,
      location,
      severity: 'error',
    });
  }
}

function isPortableRelativePath(path: string): boolean {
  if (!path || path.startsWith('/') || path.includes('\\')) return false;
  if (
    /^[A-Za-z]:/.test(path) ||
    path.includes('\0') ||
    path.includes('\n') ||
    path.includes('\r')
  ) {
    return false;
  }
  return path.split('/').every(isPortablePathSegment);
}
