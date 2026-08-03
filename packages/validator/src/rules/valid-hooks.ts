import type { RuleContext, ValidationRule } from '../types.js';
import {
  isPortableHookInterpreter,
  isPortableHookScriptPath,
  isPortablePathSegment,
  KNOWN_TARGETS,
  type SourceLocation,
  type Value,
} from '@promptscript/core';

/** Portable hook events (PascalCase superset per architecture decision). */
const VALID_HOOK_EVENTS = new Set([
  'pre-terminal-command',
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
  'targets',
]);
const SCRIPT_FIELDS = new Set(['path', 'interpreter', 'args']);
const TARGET_OVERRIDE_FIELDS = new Set([
  'event',
  'command',
  'script',
  'matcher',
  'timeoutMs',
  'statusMessage',
  'continueOnFailure',
  'enabled',
  'cwd',
]);
const VALID_HOOK_TARGETS = new Set([...KNOWN_TARGETS, 'vscode']);

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
        validateCommand(hookId, command, hooksBlock.loc, ctx.report);
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
        if (typeof timeoutMs !== 'number' || !Number.isFinite(timeoutMs)) {
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

      const targets = hook['targets'];
      if (targets !== undefined) {
        if (typeof targets !== 'object' || targets === null || Array.isArray(targets)) {
          ctx.report({
            message: `Hook "${hookId}": targets must be an object`,
            location: hooksBlock.loc,
            severity: 'error',
          });
        } else {
          validateTargetOverrides(
            hookId,
            targets as Record<string, Value>,
            hooksBlock.loc,
            ctx.report
          );
        }
      }
    }
  },
};

function validateTargetOverrides(
  hookId: string,
  targets: Record<string, Value>,
  location: SourceLocation,
  report: RuleContext['report']
): void {
  for (const [target, value] of Object.entries(targets)) {
    if (!VALID_HOOK_TARGETS.has(target)) {
      report({
        message: `Hook "${hookId}": unknown target override "${target}"`,
        location,
        suggestion: `Valid targets: ${[...VALID_HOOK_TARGETS].join(', ')}`,
        severity: 'error',
      });
    }
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      report({
        message: `Hook "${hookId}": target override "${target}" must be an object`,
        location,
        severity: 'error',
      });
      continue;
    }

    const override = value as Record<string, Value>;
    for (const field of Object.keys(override)) {
      if (!TARGET_OVERRIDE_FIELDS.has(field)) {
        report({
          message: `Hook "${hookId}": unknown target override field "${field}"`,
          location,
          severity: 'error',
        });
      }
    }

    const command = override['command'];
    const script = override['script'];
    if (command !== undefined && script !== undefined) {
      report({
        message: `Hook "${hookId}": target override "${target}" command and script are mutually exclusive`,
        location,
        severity: 'error',
      });
    } else if (command !== undefined) {
      validateCommand(hookId, command, location, report, target);
    } else if (script !== undefined) {
      if (typeof script !== 'object' || script === null || Array.isArray(script)) {
        report({
          message: `Hook "${hookId}": target override "${target}" script must be an object`,
          location,
          severity: 'error',
        });
      } else {
        validateScript(hookId, script as Record<string, Value>, location, report, target);
      }
    }

    const event = override['event'];
    if (event !== undefined && (typeof event !== 'string' || !VALID_HOOK_EVENTS.has(event))) {
      report({
        message: `Hook "${hookId}": target override "${target}" has an invalid event`,
        location,
        severity: 'error',
      });
    }

    const matcher = override['matcher'];
    if (matcher !== undefined && typeof matcher !== 'string') {
      report({
        message: `Hook "${hookId}": target override "${target}" matcher must be a string`,
        location,
        severity: 'error',
      });
    }

    const timeoutMs = override['timeoutMs'];
    if (timeoutMs !== undefined && typeof timeoutMs !== 'number') {
      report({
        message: `Hook "${hookId}": target override "${target}" timeoutMs must be a number`,
        location,
        severity: 'error',
      });
    } else if (
      timeoutMs !== undefined &&
      (!Number.isFinite(timeoutMs) || timeoutMs < MIN_TIMEOUT_MS || timeoutMs > MAX_TIMEOUT_MS)
    ) {
      report({
        message: `Hook "${hookId}": target override "${target}" timeoutMs must be between ${MIN_TIMEOUT_MS} and ${MAX_TIMEOUT_MS}`,
        location,
        severity: 'error',
      });
    }

    const statusMessage = override['statusMessage'];
    if (statusMessage !== undefined && typeof statusMessage !== 'string') {
      report({
        message: `Hook "${hookId}": target override "${target}" statusMessage must be a string`,
        location,
        severity: 'error',
      });
    }

    const continueOnFailure = override['continueOnFailure'];
    if (continueOnFailure !== undefined && typeof continueOnFailure !== 'boolean') {
      report({
        message: `Hook "${hookId}": target override "${target}" continueOnFailure must be a boolean`,
        location,
        severity: 'error',
      });
    }

    const enabled = override['enabled'];
    if (enabled !== undefined && typeof enabled !== 'boolean') {
      report({
        message: `Hook "${hookId}": target override "${target}" enabled must be a boolean`,
        location,
        severity: 'error',
      });
    }

    const cwd = override['cwd'];
    if (
      cwd !== undefined &&
      (typeof cwd !== 'string' || (cwd !== 'project' && !isPortableRelativePath(cwd)))
    ) {
      report({
        message: `Hook "${hookId}": target override "${target}" cwd must be "project" or a portable relative path`,
        location,
        severity: 'error',
      });
    }
  }
}

function validateCommand(
  hookId: string,
  command: Value,
  location: SourceLocation,
  report: RuleContext['report'],
  target?: string
): void {
  const subject = target ? `Hook "${hookId}": target override "${target}"` : `Hook "${hookId}"`;
  if (!Array.isArray(command)) {
    report({
      message: `${subject}: command must be an array`,
      location,
      severity: 'error',
    });
    return;
  }
  if (command.length === 0) {
    report({
      message: `${subject}: command must not be empty`,
      location,
      severity: 'error',
    });
    return;
  }
  if (typeof command[0] === 'string' && command[0].trim().length === 0) {
    report({
      message: `${subject}: command executable must not be empty`,
      location,
      severity: 'error',
    });
  }
  for (const argument of command) {
    if (typeof argument !== 'string') {
      report({
        message: `${subject}: command arguments must be strings`,
        location,
        severity: 'error',
      });
      break;
    }
    if (argument.includes('$(') || argument.includes('`') || argument.includes('${')) {
      report({
        message: `${subject}: shell interpolation is forbidden in command arguments`,
        location,
        suggestion: 'Use explicit argument passing instead of shell interpolation',
        severity: 'error',
      });
    }
  }
}

function validateScript(
  hookId: string,
  script: Record<string, Value>,
  location: SourceLocation,
  report: RuleContext['report'],
  target?: string
): void {
  const subject = target ? `Hook "${hookId}": target override "${target}"` : `Hook "${hookId}"`;
  for (const field of Object.keys(script)) {
    if (!SCRIPT_FIELDS.has(field)) {
      report({
        message: `${subject}: unknown script field "${field}"`,
        location,
        severity: 'error',
      });
    }
  }

  const path = script['path'];
  if (typeof path !== 'string' || !isPortableHookScriptPath(path)) {
    report({
      message: `${subject}: script path must be a safe file under ".promptscript/scripts/"`,
      location,
      severity: 'error',
    });
  }

  const interpreter = script['interpreter'];
  if (typeof interpreter !== 'string' || !isPortableHookInterpreter(interpreter)) {
    report({
      message: `${subject}: script interpreter is required and must be portable`,
      location,
      suggestion:
        'Use python3, python, node, deno, bun, ruby, php, perl, bash, sh, zsh, pwsh, or powershell',
      severity: 'error',
    });
  }

  const args = script['args'];
  if (args !== undefined && (!Array.isArray(args) || args.some((arg) => typeof arg !== 'string'))) {
    report({
      message: `${subject}: script args must be an array of strings`,
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
