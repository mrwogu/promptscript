import type { Value } from '@promptscript/core';
import type { FormatterWarning } from './types.js';

/**
 * Portable hook event names (kebab-case).
 * These map to target-native event names per target contract.
 */
export type PortableHookEvent =
  | 'pre-tool-use'
  | 'post-tool-use'
  | 'session-start'
  | 'setup'
  | 'subagent-start'
  | 'notification'
  | 'stop';

/**
 * A parsed hook definition from the @hooks block.
 */
export interface HookDefinition {
  /** Stable hook ID (from object key). */
  id: string;
  /** Portable event name. */
  event: PortableHookEvent;
  /** Tool name matcher pattern (optional). */
  matcher?: string;
  /** Command arguments (non-empty array). */
  command: string[];
  /** Project-root or project-relative working directory. */
  cwd?: string;
  /** Timeout in milliseconds. */
  timeoutMs?: number;
  /** Status message shown during execution. */
  statusMessage?: string;
  /** Whether to continue if the hook fails. */
  continueOnFailure?: boolean;
  /** Whether the hook is enabled. */
  enabled?: boolean;
}

const HOOK_OWNERSHIP_MARKER = '# promptscript-generated';
const SHELL_SAFE_ARGUMENT = /^[A-Za-z0-9_@%+=:,./-]+$/;

function quotePosixArgument(argument: string): string {
  return SHELL_SAFE_ARGUMENT.test(argument) ? argument : `'${argument.replace(/'/g, `'"'"'`)}'`;
}

function quotePowerShellArgument(argument: string): string {
  return `'${argument.replace(/'/g, "''")}'`;
}

function serializePosixCommand(hook: HookDefinition, prefix = ''): string {
  return `${prefix}${hook.command.map(quotePosixArgument).join(' ')}`;
}

function serializeOwnedCommand(
  hook: HookDefinition,
  quoteArgument: (argument: string) => string = quotePosixArgument,
  prefix = ''
): string {
  const safeId = hook.id.replace(/[^A-Za-z0-9._-]/g, '-');
  return `${prefix}${hook.command.map(quoteArgument).join(' ')} ${HOOK_OWNERSHIP_MARKER}:${safeId}`;
}

function projectCwdPrefix(hook: HookDefinition, target: 'claude' | 'factory'): string {
  if (!hook.cwd) return '';

  const root = target === 'claude' ? '"${CLAUDE_PROJECT_DIR}"' : '"$FACTORY_PROJECT_DIR"';
  const directory = hook.cwd === 'project' ? root : `${root}/${quotePosixArgument(hook.cwd)}`;
  return `cd ${directory} && `;
}

/**
 * Extract hook definitions from a parsed @hooks block.
 */
export function extractHooks(hooksBlock: {
  content: { type: string; properties?: Record<string, Value> };
}): HookDefinition[] {
  if (hooksBlock.content.type !== 'ObjectContent' || !hooksBlock.content.properties) {
    return [];
  }

  const hooks: HookDefinition[] = [];
  for (const [id, value] of Object.entries(hooksBlock.content.properties)) {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) continue;
    const obj = value as Record<string, Value>;

    const event = obj['event'];
    if (typeof event !== 'string') continue;

    const command = obj['command'];
    if (!Array.isArray(command)) continue;

    const args = command.filter((c): c is string => typeof c === 'string');
    // Skip hooks whose command filters to nothing - they would emit a bare
    // ownership marker with no executable command. PS034 already rejects them.
    if (args.length === 0) continue;

    const hook: HookDefinition = {
      id,
      event: event as PortableHookEvent,
      command: args,
    };

    const matcher = obj['matcher'];
    if (typeof matcher === 'string') hook.matcher = matcher;

    const cwd = obj['cwd'];
    if (typeof cwd === 'string') hook.cwd = cwd;

    const timeoutMs = obj['timeoutMs'];
    if (typeof timeoutMs === 'number') hook.timeoutMs = timeoutMs;

    const statusMessage = obj['statusMessage'];
    if (typeof statusMessage === 'string') hook.statusMessage = statusMessage;

    const continueOnFailure = obj['continueOnFailure'];
    if (typeof continueOnFailure === 'boolean') hook.continueOnFailure = continueOnFailure;

    const enabled = obj['enabled'];
    if (typeof enabled === 'boolean') hook.enabled = enabled;

    hooks.push(hook);
  }

  return hooks;
}

/**
 * Target-native event name mapping.
 * Maps portable events to target-specific event names.
 */
const CLAUDE_EVENT_MAP: Record<PortableHookEvent, string> = {
  'pre-tool-use': 'PreToolUse',
  'post-tool-use': 'PostToolUse',
  'session-start': 'SessionStart',
  setup: 'SessionStart',
  'subagent-start': 'SubagentStart',
  notification: 'Notification',
  stop: 'Stop',
};

const CURSOR_EVENT_MAP: Record<PortableHookEvent, string> = {
  'pre-tool-use': 'preEdit',
  'post-tool-use': 'postEdit',
  'session-start': 'sessionStart',
  setup: 'sessionStart',
  'subagent-start': 'subagentStart',
  notification: 'notification',
  stop: 'stop',
};

const CODEX_EVENT_MAP: Record<PortableHookEvent, string> = {
  'pre-tool-use': 'pre_tool_use',
  'post-tool-use': 'post_tool_use',
  'session-start': 'session_start',
  setup: 'session_start',
  'subagent-start': 'subagent_start',
  notification: 'notification',
  stop: 'stop',
};

/**
 * Factory Droid hook event names.
 * Factory uses PascalCase event names.
 */
const FACTORY_EVENT_MAP: Partial<Record<PortableHookEvent, string>> = {
  'pre-tool-use': 'PreToolUse',
  'post-tool-use': 'PostToolUse',
  'session-start': 'SessionStart',
  setup: 'SessionStart',
  notification: 'Notification',
  stop: 'Stop',
};

/**
 * GitHub Copilot hook event names.
 */
const GITHUB_EVENT_MAP: Record<PortableHookEvent, string> = {
  'pre-tool-use': 'preToolUse',
  'post-tool-use': 'postToolUse',
  'session-start': 'sessionStart',
  setup: 'sessionStart',
  'subagent-start': 'subagentStart',
  notification: 'notification',
  stop: 'agentStop',
};

/**
 * Get the target-native event name for a portable event.
 */
export function mapEvent(
  event: PortableHookEvent,
  target: 'claude' | 'cursor' | 'codex' | 'factory' | 'github'
): string | null {
  const map =
    target === 'claude'
      ? CLAUDE_EVENT_MAP
      : target === 'cursor'
        ? CURSOR_EVENT_MAP
        : target === 'factory'
          ? FACTORY_EVENT_MAP
          : target === 'github'
            ? GITHUB_EVENT_MAP
            : CODEX_EVENT_MAP;
  return map[event] ?? null;
}

/**
 * Convert timeout from milliseconds to target units.
 */
export function convertTimeout(
  timeoutMs: number,
  target: 'claude' | 'cursor' | 'codex' | 'factory' | 'github'
): number {
  if (target === 'claude' || target === 'cursor' || target === 'factory' || target === 'github')
    return Math.ceil(timeoutMs / 1000);
  return timeoutMs;
}

/**
 * Generate Claude settings.json hook entries from portable hook definitions.
 */
export function generateClaudeHooks(hooks: HookDefinition[]): Record<string, unknown> {
  const result: Record<string, unknown[]> = {};

  for (const hook of hooks) {
    if (hook.enabled === false) continue;
    const nativeEvent = mapEvent(hook.event, 'claude');
    if (!nativeEvent) continue;

    if (!result[nativeEvent]) result[nativeEvent] = [];

    const entry: Record<string, unknown> = {
      matcher: hook.matcher ?? '.*',
      hooks: [
        {
          type: 'command',
          command: serializePosixCommand(hook, projectCwdPrefix(hook, 'claude')),
          timeout: hook.timeoutMs ? convertTimeout(hook.timeoutMs, 'claude') : 10,
        },
      ],
    };

    if (hook.statusMessage) {
      (entry['hooks'] as Record<string, unknown>[])[0]!['statusMessage'] = hook.statusMessage;
    }

    result[nativeEvent].push(entry);
  }

  return result;
}

/**
 * Generate Cursor hooks.json entries from portable hook definitions.
 *
 * Cursor uses a flat JSON structure keyed by event name.
 */
export function generateCursorHooks(hooks: HookDefinition[]): Record<string, unknown[]> {
  const result: Record<string, unknown[]> = {};

  for (const hook of hooks) {
    if (hook.enabled === false) continue;
    const nativeEvent = mapEvent(hook.event, 'cursor');
    if (!nativeEvent) continue;

    if (!result[nativeEvent]) result[nativeEvent] = [];

    result[nativeEvent].push({
      matcher: hook.matcher ?? '.*',
      command: serializePosixCommand(hook),
      timeout: hook.timeoutMs ? convertTimeout(hook.timeoutMs, 'cursor') : 10,
      ...(hook.statusMessage ? { statusMessage: hook.statusMessage } : {}),
      ...(hook.continueOnFailure !== undefined
        ? { continueOnFailure: hook.continueOnFailure }
        : {}),
    });
  }

  return result;
}

/**
 * Generate Factory Droid hooks for .factory/hooks.json.
 * Factory uses a structure similar to Claude (event -> array of entries).
 */
export function generateFactoryHooks(hooks: HookDefinition[]): Record<string, unknown[]> {
  const result: Record<string, unknown[]> = {};

  for (const hook of hooks) {
    if (hook.enabled === false) continue;
    const nativeEvent = mapEvent(hook.event, 'factory');
    if (!nativeEvent) continue;

    if (!result[nativeEvent]) result[nativeEvent] = [];

    result[nativeEvent].push({
      matcher: hook.matcher ?? '.*',
      hooks: [
        {
          type: 'command',
          command: serializeOwnedCommand(
            hook,
            quotePosixArgument,
            projectCwdPrefix(hook, 'factory')
          ),
          ...(hook.timeoutMs ? { timeout: convertTimeout(hook.timeoutMs, 'factory') } : {}),
        },
      ],
    });
  }

  return result;
}

const GITHUB_MATCHER_EVENTS = new Set([
  'pre-tool-use',
  'post-tool-use',
  'subagent-start',
  'notification',
]);

export function getHookCompatibilityWarnings(
  hooks: HookDefinition[],
  target: 'claude' | 'cursor' | 'codex' | 'factory' | 'github'
): FormatterWarning[] {
  const warnings: FormatterWarning[] = [];

  for (const hook of hooks) {
    if (hook.enabled === false) continue;

    if (!mapEvent(hook.event, target)) {
      warnings.push({
        code: 'PS4002',
        message: `Hook "${hook.id}" uses event "${hook.event}", which ${target} cannot represent and will omit.`,
        suggestion: `Use an event supported by the ${target} hook contract.`,
      });
      continue;
    }

    if (target === 'github' && hook.matcher && !GITHUB_MATCHER_EVENTS.has(hook.event)) {
      warnings.push({
        code: 'PS4002',
        message: `Hook "${hook.id}" uses matcher with "${hook.event}", which GitHub ignores.`,
        suggestion: 'Remove matcher or use a GitHub event that supports matcher filtering.',
      });
    }

    if (target === 'github' && hook.event === 'notification') {
      warnings.push({
        code: 'PS4002',
        message: `Hook "${hook.id}" uses notification, which Copilot CLI supports but GitHub Copilot cloud agent does not fire.`,
        suggestion: 'Use notification hooks only when Copilot CLI coverage is sufficient.',
      });
    }

    if (hook.cwd && (target === 'cursor' || target === 'codex')) {
      warnings.push({
        code: 'PS4002',
        message: `Hook "${hook.id}" requests cwd "${hook.cwd}", which ${target} cannot guarantee and will ignore.`,
        suggestion: `Review the generated ${target} hook because it will use the agent session working directory.`,
      });
    }

    if (hook.statusMessage && (target === 'factory' || target === 'github')) {
      warnings.push({
        code: 'PS4002',
        message: `Hook "${hook.id}" uses statusMessage, which ${target} cannot represent and will omit.`,
      });
    }

    if (hook.continueOnFailure !== undefined && (target === 'factory' || target === 'github')) {
      warnings.push({
        code: 'PS4002',
        message: `Hook "${hook.id}" uses continueOnFailure, which ${target} cannot represent and will omit.`,
      });
    }
  }

  return warnings;
}

/**
 * Generate GitHub Copilot repository hook entries.
 */
export function generateGitHubHooks(hooks: HookDefinition[]): Record<string, unknown[]> {
  const result: Record<string, unknown[]> = {};

  for (const hook of hooks) {
    if (hook.enabled === false) continue;
    const nativeEvent = mapEvent(hook.event, 'github');
    if (!nativeEvent) continue;

    if (!result[nativeEvent]) result[nativeEvent] = [];

    result[nativeEvent].push({
      type: 'command',
      bash: serializeOwnedCommand(hook),
      powershell: serializeOwnedCommand(hook, quotePowerShellArgument, '& '),
      ...(hook.cwd ? { cwd: hook.cwd === 'project' ? '.' : hook.cwd } : {}),
      ...(hook.matcher && GITHUB_MATCHER_EVENTS.has(hook.event) ? { matcher: hook.matcher } : {}),
      ...(hook.timeoutMs ? { timeoutSec: convertTimeout(hook.timeoutMs, 'github') } : {}),
    });
  }

  return result;
}

/**
 * Generate Codex config.toml hook entries from portable hook definitions.
 */
export function generateCodexHooks(hooks: HookDefinition[]): string {
  const lines: string[] = [];

  for (const hook of hooks) {
    if (hook.enabled === false) continue;
    const nativeEvent = mapEvent(hook.event, 'codex');
    if (!nativeEvent) continue;

    lines.push(`[[hooks.${nativeEvent}]]`);
    lines.push(`id = "${hook.id}"`);
    lines.push(
      `command = [${hook.command.map((c) => `"${c.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`).join(', ')}]`
    );
    if (hook.matcher) lines.push(`matcher = "${hook.matcher}"`);
    if (hook.timeoutMs) lines.push(`timeout_ms = ${hook.timeoutMs}`);
    if (hook.statusMessage) lines.push(`status_message = "${hook.statusMessage}"`);
    if (hook.continueOnFailure !== undefined)
      lines.push(`continue_on_failure = ${hook.continueOnFailure}`);
    lines.push('');
  }

  return lines.join('\n');
}
