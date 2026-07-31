import {
  HOOK_RUNTIME_CAPABILITIES,
  type PortableHookInterpreter,
  type Value,
} from '@promptscript/core';
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

export type HookTarget =
  | 'claude'
  | 'cursor'
  | 'codex'
  | 'factory'
  | 'github'
  | 'vscode'
  | 'gemini'
  | 'windsurf'
  | 'grok';

export interface HookTargetOverride {
  event?: PortableHookEvent;
  matcher?: string;
  timeoutMs?: number;
  statusMessage?: string;
  continueOnFailure?: boolean;
  enabled?: boolean;
  cwd?: string;
}

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
  command?: string[];
  /** Portable repository-local script. */
  script?: HookScriptDefinition;
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
  /** Target-specific overrides merged on top of the portable definition. */
  targets?: Partial<Record<HookTarget, HookTargetOverride>>;
}

export interface HookScriptDefinition {
  /** Script path under .promptscript/scripts/. */
  path: string;
  /** Portable interpreter name. */
  interpreter: PortableHookInterpreter;
  /** Additional script arguments. */
  args: string[];
}

// Ownership marker contract: the marker must remain the final token of every
// emitted hook command. The ownership regexes in
// packages/cli/src/utils/managed-output-cleanup.ts anchor it at end-of-command
// (/# promptscript-generated:[A-Za-z0-9._-]+\s*$/); keep both sides in sync.
const HOOK_OWNERSHIP_MARKER = '# promptscript-generated';
const SHELL_SAFE_ARGUMENT = /^[A-Za-z0-9_@%+=:,./-]+$/;

function quotePosixArgument(argument: string): string {
  return SHELL_SAFE_ARGUMENT.test(argument) ? argument : `'${argument.replace(/'/g, `'"'"'`)}'`;
}

function quotePowerShellArgument(argument: string): string {
  return `'${argument.replace(/'/g, "''")}'`;
}

function getPosixInterpreter(interpreter: PortableHookInterpreter): string[] {
  return interpreter === 'deno' ? ['deno', 'run'] : [interpreter];
}

function getCommandArguments(hook: HookDefinition): string[] {
  if (hook.command) return hook.command;
  if (!hook.script) return [];
  return [...getPosixInterpreter(hook.script.interpreter), hook.script.path, ...hook.script.args];
}

function serializePosixCommand(hook: HookDefinition, prefix = ''): string {
  return `${prefix}${getCommandArguments(hook).map(quotePosixArgument).join(' ')}`;
}

function serializeOwnedCommand(
  hook: HookDefinition,
  quoteArgument: (argument: string) => string = quotePosixArgument,
  prefix = ''
): string {
  const safeId = hook.id.replace(/[^A-Za-z0-9._-]/g, '-');
  return `${prefix}${getCommandArguments(hook).map(quoteArgument).join(' ')} ${HOOK_OWNERSHIP_MARKER}:${safeId}`;
}

function projectRootExpression(target: 'claude' | 'factory' | 'gemini' | 'grok'): string {
  if (target === 'claude') return '"${CLAUDE_PROJECT_DIR}"';
  if (target === 'factory') return '"$FACTORY_PROJECT_DIR"';
  if (target === 'gemini') return '"$GEMINI_PROJECT_DIR"';
  return '"$GROK_WORKSPACE_ROOT"';
}

function projectCwdPrefix(
  hook: HookDefinition,
  target: 'claude' | 'factory' | 'gemini' | 'grok'
): string {
  if (!hook.cwd) return '';

  const root = projectRootExpression(target);
  const directory = hook.cwd === 'project' ? root : `${root}/${quotePosixArgument(hook.cwd)}`;
  return `cd ${directory} && `;
}

function serializeProjectScriptCommand(
  hook: HookDefinition,
  target: 'claude' | 'factory' | 'gemini' | 'grok',
  owned = false
): string {
  if (!hook.script) {
    return owned
      ? serializeOwnedCommand(hook, quotePosixArgument, projectCwdPrefix(hook, target))
      : serializePosixCommand(hook, projectCwdPrefix(hook, target));
  }

  const root = projectRootExpression(target);
  const invocation = [
    ...getPosixInterpreter(hook.script.interpreter).map(quotePosixArgument),
    `${root}/${quotePosixArgument(hook.script.path)}`,
    ...hook.script.args.map(quotePosixArgument),
  ].join(' ');
  const marker = owned
    ? ` ${HOOK_OWNERSHIP_MARKER}:${hook.id.replace(/[^A-Za-z0-9._-]/g, '-')}`
    : '';
  return `${projectCwdPrefix(hook, target)}${invocation}${marker}`;
}

function serializeGitRootScriptCommand(hook: HookDefinition, owned = false): string {
  if (!hook.script) return serializePosixCommand(hook);

  const root = '"$PROMPTSCRIPT_PROJECT_ROOT"';
  const cwd =
    hook.cwd === undefined
      ? ''
      : `cd ${hook.cwd === 'project' ? root : `${root}/${quotePosixArgument(hook.cwd)}`} && `;
  const invocation = [
    ...getPosixInterpreter(hook.script.interpreter).map(quotePosixArgument),
    `${root}/${quotePosixArgument(hook.script.path)}`,
    ...hook.script.args.map(quotePosixArgument),
  ].join(' ');
  const marker = owned
    ? ` ${HOOK_OWNERSHIP_MARKER}:${hook.id.replace(/[^A-Za-z0-9._-]/g, '-')}`
    : '';
  return `PROMPTSCRIPT_PROJECT_ROOT="$(git rev-parse --show-toplevel)" && ${cwd}${invocation}${marker}`;
}

function getWindowsInterpreter(interpreter: PortableHookInterpreter): string[] | null {
  if (interpreter === 'python3') return ['py', '-3'];
  if (interpreter === 'deno') return ['deno', 'run'];
  if (interpreter === 'bash' || interpreter === 'sh' || interpreter === 'zsh') return null;
  return [interpreter];
}

function serializePowerShellScriptCommand(
  hook: HookDefinition,
  useGitRoot: boolean,
  owned = false
): string | null {
  if (!hook.script) {
    // Defensive: callers gate on hook.script, but an owned command must never
    // lose its ownership marker (see HOOK_OWNERSHIP_MARKER contract above).
    return owned
      ? serializeOwnedCommand(hook, quotePowerShellArgument, '& ')
      : `& ${getCommandArguments(hook).map(quotePowerShellArgument).join(' ')}`;
  }

  const interpreter = getWindowsInterpreter(hook.script.interpreter);
  if (!interpreter) return null;

  const scriptPath = useGitRoot
    ? `(Join-Path $promptscriptProjectRoot ${quotePowerShellArgument(hook.script.path)})`
    : quotePowerShellArgument(hook.script.path);
  const invocation = [
    '&',
    ...interpreter.map(quotePowerShellArgument),
    scriptPath,
    ...hook.script.args.map(quotePowerShellArgument),
  ].join(' ');
  const marker = owned
    ? ` ${HOOK_OWNERSHIP_MARKER}:${hook.id.replace(/[^A-Za-z0-9._-]/g, '-')}`
    : '';
  if (!useGitRoot) return `${invocation}${marker}`;

  const cwd =
    hook.cwd === undefined
      ? ''
      : `Set-Location ${
          hook.cwd === 'project'
            ? '$promptscriptProjectRoot'
            : `(Join-Path $promptscriptProjectRoot ${quotePowerShellArgument(hook.cwd)})`
        }; `;
  return `$promptscriptProjectRoot = git rev-parse --show-toplevel; ${cwd}${invocation}${marker}`;
}

function getScriptPathFromNativeCwd(hook: HookDefinition): string {
  if (!hook.script) return '';
  if (!hook.cwd || hook.cwd === 'project') return hook.script.path;
  const depth = hook.cwd.split('/').length;
  return `${'../'.repeat(depth)}${hook.script.path}`;
}

function serializeNativeCwdScriptCommand(
  hook: HookDefinition,
  shell: 'posix' | 'powershell',
  owned = false
): string | null {
  if (!hook.script) {
    return shell === 'posix'
      ? owned
        ? serializeOwnedCommand(hook)
        : serializePosixCommand(hook)
      : serializePowerShellScriptCommand(hook, false, owned);
  }

  const scriptPath = getScriptPathFromNativeCwd(hook);
  const interpreter =
    shell === 'posix'
      ? getPosixInterpreter(hook.script.interpreter)
      : getWindowsInterpreter(hook.script.interpreter);
  if (!interpreter) return null;

  const quote = shell === 'posix' ? quotePosixArgument : quotePowerShellArgument;
  const invocation = [
    ...(shell === 'powershell' ? ['&'] : []),
    ...interpreter.map(quote),
    quote(scriptPath),
    ...hook.script.args.map(quote),
  ].join(' ');
  if (!owned) return invocation;

  return `${invocation} ${HOOK_OWNERSHIP_MARKER}:${hook.id.replace(/[^A-Za-z0-9._-]/g, '-')}`;
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

    const hook: HookDefinition = {
      id,
      event: event as PortableHookEvent,
    };

    const command = obj['command'];
    if (Array.isArray(command)) {
      const args = command.filter((c): c is string => typeof c === 'string');
      // Ignore command arrays that filter to nothing - they would emit a bare
      // ownership marker with no executable command. PS034 already rejects them.
      if (args.length > 0) hook.command = args;
    }

    const script = obj['script'];
    if (typeof script === 'object' && script !== null && !Array.isArray(script)) {
      const scriptObject = script as Record<string, Value>;
      const path = scriptObject['path'];
      const interpreter = scriptObject['interpreter'];
      const args = scriptObject['args'];
      if (typeof path === 'string' && typeof interpreter === 'string') {
        hook.script = {
          path,
          interpreter: interpreter as PortableHookInterpreter,
          args: Array.isArray(args)
            ? args.filter((arg): arg is string => typeof arg === 'string')
            : [],
        };
      }
    }

    if (!hook.command && !hook.script) continue;

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

    const targets = obj['targets'];
    if (typeof targets === 'object' && targets !== null && !Array.isArray(targets)) {
      const overrides: Partial<Record<HookTarget, HookTargetOverride>> = {};
      for (const [target, value] of Object.entries(targets)) {
        if (typeof value !== 'object' || value === null || Array.isArray(value)) continue;
        const override = value as Record<string, Value>;
        const targetOverride: HookTargetOverride = {};
        if (typeof override['event'] === 'string') {
          targetOverride.event = override['event'] as PortableHookEvent;
        }
        if (typeof override['matcher'] === 'string') targetOverride.matcher = override['matcher'];
        if (typeof override['timeoutMs'] === 'number') {
          targetOverride.timeoutMs = override['timeoutMs'];
        }
        if (typeof override['statusMessage'] === 'string') {
          targetOverride.statusMessage = override['statusMessage'];
        }
        if (typeof override['continueOnFailure'] === 'boolean') {
          targetOverride.continueOnFailure = override['continueOnFailure'];
        }
        if (typeof override['enabled'] === 'boolean') targetOverride.enabled = override['enabled'];
        if (typeof override['cwd'] === 'string') targetOverride.cwd = override['cwd'];
        overrides[target as HookTarget] = targetOverride;
      }
      if (Object.keys(overrides).length > 0) hook.targets = overrides;
    }

    hooks.push(hook);
  }

  return hooks;
}

export function applyHookTargetOverrides(
  hooks: HookDefinition[],
  target: HookTarget
): HookDefinition[] {
  return hooks.map((hook) => {
    const override = hook.targets?.[target];
    if (!override) return hook;
    return { ...hook, ...override, targets: hook.targets };
  });
}

/**
 * Target-native event name mapping.
 * Maps portable events to target-specific event names.
 */
const CLAUDE_EVENT_MAP: Record<PortableHookEvent, string> = {
  'pre-tool-use': 'PreToolUse',
  'post-tool-use': 'PostToolUse',
  'session-start': 'SessionStart',
  setup: 'Setup',
  'subagent-start': 'SubagentStart',
  notification: 'Notification',
  stop: 'Stop',
};

const CURSOR_EVENT_MAP: Record<PortableHookEvent, string> = {
  'pre-tool-use': 'preToolUse',
  'post-tool-use': 'postToolUse',
  'session-start': 'sessionStart',
  setup: 'sessionStart',
  'subagent-start': 'subagentStart',
  notification: '',
  stop: 'stop',
};

const CODEX_EVENT_MAP: Record<PortableHookEvent, string> = {
  'pre-tool-use': 'PreToolUse',
  'post-tool-use': 'PostToolUse',
  'session-start': 'SessionStart',
  setup: 'SessionStart',
  'subagent-start': 'SubagentStart',
  notification: '',
  stop: 'Stop',
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

const GEMINI_EVENT_MAP: Record<PortableHookEvent, string> = {
  'pre-tool-use': 'BeforeTool',
  'post-tool-use': 'AfterTool',
  'session-start': 'SessionStart',
  setup: 'SessionStart',
  'subagent-start': '',
  notification: '',
  stop: 'AfterAgent',
};

const GROK_EVENT_MAP: Record<PortableHookEvent, string> = {
  'pre-tool-use': 'PreToolUse',
  'post-tool-use': 'PostToolUse',
  'session-start': 'SessionStart',
  setup: 'SessionStart',
  'subagent-start': 'SubagentStart',
  notification: 'Notification',
  stop: 'Stop',
};

const WINDSURF_EVENT_MAP: Record<PortableHookEvent, readonly string[]> = {
  'pre-tool-use': ['pre_read_code', 'pre_write_code', 'pre_run_command', 'pre_mcp_tool_use'],
  'post-tool-use': ['post_read_code', 'post_write_code', 'post_run_command', 'post_mcp_tool_use'],
  'session-start': [],
  setup: [],
  'subagent-start': [],
  notification: [],
  stop: ['post_cascade_response'],
};

const VSCODE_EVENT_MAP: Record<PortableHookEvent, string> = {
  'pre-tool-use': 'PreToolUse',
  'post-tool-use': 'PostToolUse',
  'session-start': 'SessionStart',
  setup: 'SessionStart',
  'subagent-start': 'SubagentStart',
  notification: '',
  stop: 'Stop',
};

/**
 * Get the target-native event name for a portable event.
 */
export function mapEvent(event: PortableHookEvent, target: HookTarget): string | null {
  if (target === 'windsurf') return WINDSURF_EVENT_MAP[event][0] ?? null;
  const map =
    target === 'claude'
      ? CLAUDE_EVENT_MAP
      : target === 'cursor'
        ? CURSOR_EVENT_MAP
        : target === 'factory'
          ? FACTORY_EVENT_MAP
          : target === 'github'
            ? GITHUB_EVENT_MAP
            : target === 'gemini'
              ? GEMINI_EVENT_MAP
              : target === 'grok'
                ? GROK_EVENT_MAP
                : target === 'vscode'
                  ? VSCODE_EVENT_MAP
                  : CODEX_EVENT_MAP;
  return map[event] || null;
}

function mapEvents(event: PortableHookEvent, target: HookTarget): readonly string[] {
  if (target === 'windsurf') return WINDSURF_EVENT_MAP[event];
  const mapped = mapEvent(event, target);
  return mapped ? [mapped] : [];
}

/**
 * Convert timeout from milliseconds to target units.
 */
export function convertTimeout(timeoutMs: number, target: HookTarget): number {
  if (target === 'gemini') return timeoutMs;
  if (target === 'windsurf') return timeoutMs;
  if (
    target === 'claude' ||
    target === 'cursor' ||
    target === 'codex' ||
    target === 'factory' ||
    target === 'github' ||
    target === 'vscode' ||
    target === 'grok'
  )
    return Math.ceil(timeoutMs / 1000);
  return timeoutMs;
}

/**
 * Generate Claude settings.json hook entries from portable hook definitions.
 */
export function generateClaudeHooks(hooks: HookDefinition[]): Record<string, unknown> {
  const result: Record<string, unknown[]> = {};

  for (const hook of applyHookTargetOverrides(hooks, 'claude')) {
    if (hook.enabled === false) continue;
    const nativeEvent = mapEvent(hook.event, 'claude');
    if (!nativeEvent) continue;

    if (!result[nativeEvent]) result[nativeEvent] = [];

    const entry: Record<string, unknown> = {
      matcher: hook.matcher ?? '.*',
      hooks: [
        {
          type: 'command',
          command: serializeProjectScriptCommand(hook, 'claude', true),
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
export function generateCursorHooks(hooks: HookDefinition[]): Record<string, unknown> {
  const result: Record<string, unknown[]> = {};

  for (const hook of applyHookTargetOverrides(hooks, 'cursor')) {
    if (hook.enabled === false) continue;
    const nativeEvent = mapEvent(hook.event, 'cursor');
    if (!nativeEvent) continue;

    if (!result[nativeEvent]) result[nativeEvent] = [];

    result[nativeEvent].push({
      matcher: hook.matcher ?? '.*',
      command: hook.script
        ? serializeGitRootScriptCommand(hook, true)
        : serializeOwnedCommand(hook),
      timeout: hook.timeoutMs ? convertTimeout(hook.timeoutMs, 'cursor') : 10,
    });
  }

  return { version: 1, hooks: result };
}

/**
 * Generate Factory Droid hooks for .factory/hooks.json.
 * Factory uses a structure similar to Claude (event -> array of entries).
 */
export function generateFactoryHooks(hooks: HookDefinition[]): Record<string, unknown[]> {
  const result: Record<string, unknown[]> = {};

  for (const hook of applyHookTargetOverrides(hooks, 'factory')) {
    if (hook.enabled === false) continue;
    const nativeEvent = mapEvent(hook.event, 'factory');
    if (!nativeEvent) continue;

    if (!result[nativeEvent]) result[nativeEvent] = [];

    result[nativeEvent].push({
      matcher: hook.matcher ?? '.*',
      hooks: [
        {
          type: 'command',
          command: serializeProjectScriptCommand(hook, 'factory', true),
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
  target: HookTarget
): FormatterWarning[] {
  const warnings: FormatterWarning[] = [];

  for (const hook of applyHookTargetOverrides(hooks, target)) {
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

    if (target === 'vscode' && hook.matcher) {
      warnings.push({
        code: 'PS4002',
        message: `Hook "${hook.id}" uses matcher, which VS Code currently parses but ignores.`,
        suggestion: 'Filter tool_name and tool_input inside the hook command for exact matching.',
      });
    }

    if (hook.cwd && !hook.script && (target === 'cursor' || target === 'codex')) {
      warnings.push({
        code: 'PS4002',
        message: `Hook "${hook.id}" requests cwd "${hook.cwd}", which ${target} cannot guarantee and will ignore.`,
        suggestion: `Review the generated ${target} hook because it will use the agent session working directory.`,
      });
    }

    if (hook.statusMessage && target !== 'claude' && target !== 'codex') {
      warnings.push({
        code: 'PS4002',
        message: `Hook "${hook.id}" uses statusMessage, which ${target} cannot represent and will omit.`,
      });
    }

    if (hook.continueOnFailure !== undefined) {
      warnings.push({
        code: 'PS4002',
        message: `Hook "${hook.id}" uses continueOnFailure, which ${target} cannot represent and will omit.`,
      });
    }

    if (hook.timeoutMs !== undefined && target === 'windsurf') {
      warnings.push({
        code: 'PS4002',
        message: `Hook "${hook.id}" uses timeoutMs, which Windsurf cannot represent and will omit.`,
        suggestion: 'Enforce a timeout inside the hook script when required.',
      });
    }

    if (hook.matcher && target === 'windsurf') {
      warnings.push({
        code: 'PS4002',
        message: `Hook "${hook.id}" uses matcher, which Windsurf cannot represent and will ignore.`,
        suggestion: 'Filter the received hook payload inside the script.',
      });
    }

    if (
      hook.matcher &&
      (target === 'gemini' || target === 'grok' || target === 'codex' || target === 'cursor') &&
      hook.event !== 'pre-tool-use' &&
      hook.event !== 'post-tool-use' &&
      hook.event !== 'session-start' &&
      hook.event !== 'setup' &&
      hook.event !== 'subagent-start'
    ) {
      warnings.push({
        code: 'PS4002',
        message: `Hook "${hook.id}" uses matcher with "${hook.event}", which ${target} ignores.`,
      });
    }

    const capability = HOOK_RUNTIME_CAPABILITIES[target];
    if (
      hook.script &&
      (capability.platforms as readonly string[]).includes('windows') &&
      !getWindowsInterpreter(hook.script.interpreter)
    ) {
      warnings.push({
        code: 'PS4002',
        message: `Hook "${hook.id}" uses interpreter "${hook.script.interpreter}", which ${target} cannot invoke natively on Windows.`,
        suggestion: 'Use a cross-platform interpreter or limit this hook to Unix environments.',
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

  for (const hook of applyHookTargetOverrides(hooks, 'github')) {
    if (hook.enabled === false) continue;
    const nativeEvent = mapEvent(hook.event, 'github');
    if (!nativeEvent) continue;

    if (!result[nativeEvent]) result[nativeEvent] = [];

    const bash = hook.script
      ? serializeNativeCwdScriptCommand(hook, 'posix', true)
      : serializeOwnedCommand(hook);
    const powershell = hook.script
      ? serializeNativeCwdScriptCommand(hook, 'powershell', true)
      : serializeOwnedCommand(hook, quotePowerShellArgument, '& ');

    result[nativeEvent].push({
      type: 'command',
      bash,
      ...(powershell ? { powershell } : {}),
      ...(hook.cwd || hook.script
        ? { cwd: !hook.cwd || hook.cwd === 'project' ? '.' : hook.cwd }
        : {}),
      ...(hook.matcher && GITHUB_MATCHER_EVENTS.has(hook.event) ? { matcher: hook.matcher } : {}),
      ...(hook.timeoutMs ? { timeoutSec: convertTimeout(hook.timeoutMs, 'github') } : {}),
    });
  }

  return result;
}

/**
 * Generate VS Code Copilot Agent hook entries.
 *
 * VS Code uses the Claude-compatible PascalCase event schema, but its
 * workspace hook loader currently ignores matcher values. The matcher is
 * retained for readability and the compatibility warning directs users to
 * filter tool input inside the command when exact filtering matters.
 */
export function generateVSCodeHooks(hooks: HookDefinition[]): Record<string, unknown[]> {
  const result: Record<string, unknown[]> = {};

  for (const hook of applyHookTargetOverrides(hooks, 'vscode')) {
    if (hook.enabled === false) continue;
    const nativeEvent = mapEvent(hook.event, 'vscode');
    if (!nativeEvent) continue;

    if (!result[nativeEvent]) result[nativeEvent] = [];
    const command = hook.script
      ? serializeNativeCwdScriptCommand(hook, 'posix', true)
      : serializeOwnedCommand(hook);
    const windows = hook.script
      ? serializeNativeCwdScriptCommand(hook, 'powershell', true)
      : serializeOwnedCommand(hook, quotePowerShellArgument, '& ');

    result[nativeEvent].push({
      type: 'command',
      command,
      ...(windows ? { windows } : {}),
      ...(hook.matcher ? { matcher: hook.matcher } : {}),
      ...(hook.cwd ? { cwd: hook.cwd === 'project' ? '.' : hook.cwd } : {}),
      ...(hook.timeoutMs ? { timeout: convertTimeout(hook.timeoutMs, 'vscode') } : {}),
    });
  }

  return result;
}

/**
 * Generate Gemini CLI settings.json hook entries.
 */
export function generateGeminiHooks(hooks: HookDefinition[]): Record<string, unknown[]> {
  const result: Record<string, unknown[]> = {};

  for (const hook of applyHookTargetOverrides(hooks, 'gemini')) {
    if (hook.enabled === false) continue;
    const nativeEvent = mapEvent(hook.event, 'gemini');
    if (!nativeEvent) continue;

    if (!result[nativeEvent]) result[nativeEvent] = [];
    result[nativeEvent].push({
      ...(hook.matcher ? { matcher: hook.matcher } : {}),
      hooks: [
        {
          type: 'command',
          command: hook.script
            ? serializeProjectScriptCommand(hook, 'gemini', true)
            : serializeOwnedCommand(hook, quotePosixArgument, projectCwdPrefix(hook, 'gemini')),
          ...(hook.timeoutMs ? { timeout: convertTimeout(hook.timeoutMs, 'gemini') } : {}),
        },
      ],
    });
  }

  return result;
}

/**
 * Generate Windsurf Cascade hook entries.
 */
export function generateWindsurfHooks(hooks: HookDefinition[]): Record<string, unknown[]> {
  const result: Record<string, unknown[]> = {};

  for (const hook of applyHookTargetOverrides(hooks, 'windsurf')) {
    if (hook.enabled === false) continue;
    for (const nativeEvent of mapEvents(hook.event, 'windsurf')) {
      if (!result[nativeEvent]) result[nativeEvent] = [];

      const command = hook.script
        ? serializeNativeCwdScriptCommand(hook, 'posix', true)
        : serializeOwnedCommand(hook);
      const powershell = hook.script
        ? serializeNativeCwdScriptCommand(hook, 'powershell', true)
        : serializeOwnedCommand(hook, quotePowerShellArgument, '& ');
      result[nativeEvent].push({
        command,
        ...(powershell ? { powershell } : {}),
        ...(hook.cwd || hook.script
          ? { working_directory: !hook.cwd || hook.cwd === 'project' ? '.' : hook.cwd }
          : {}),
      });
    }
  }

  return result;
}

/**
 * Generate native Grok Build hook entries.
 */
export function generateGrokHooks(hooks: HookDefinition[]): Record<string, unknown[]> {
  const result: Record<string, unknown[]> = {};

  for (const hook of applyHookTargetOverrides(hooks, 'grok')) {
    if (hook.enabled === false) continue;
    const nativeEvent = mapEvent(hook.event, 'grok');
    if (!nativeEvent) continue;

    if (!result[nativeEvent]) result[nativeEvent] = [];
    result[nativeEvent].push({
      ...(hook.matcher ? { matcher: hook.matcher } : {}),
      hooks: [
        {
          type: 'command',
          command: hook.script
            ? serializeProjectScriptCommand(hook, 'grok', true)
            : serializeOwnedCommand(hook, quotePosixArgument, projectCwdPrefix(hook, 'grok')),
          ...(hook.timeoutMs ? { timeout: convertTimeout(hook.timeoutMs, 'grok') } : {}),
        },
      ],
    });
  }

  return result;
}

/**
 * Generate Codex config.toml hook entries from portable hook definitions.
 */
export function generateCodexHooks(hooks: HookDefinition[]): string {
  const lines: string[] = [];

  for (const hook of applyHookTargetOverrides(hooks, 'codex')) {
    if (hook.enabled === false) continue;
    const nativeEvent = mapEvent(hook.event, 'codex');
    if (!nativeEvent) continue;

    lines.push(`[[hooks.${nativeEvent}]]`);
    if (hook.matcher) lines.push(`matcher = "${escapeTomlHookString(hook.matcher)}"`);
    lines.push(`[[hooks.${nativeEvent}.hooks]]`);
    lines.push('type = "command"');
    const command = hook.script
      ? serializeGitRootScriptCommand(hook, true)
      : serializeOwnedCommand(hook);
    lines.push(`command = "${escapeTomlHookString(command)}"`);
    const commandWindows = hook.script
      ? serializePowerShellScriptCommand(hook, true, true)
      : serializeOwnedCommand(hook, quotePowerShellArgument, '& ');
    if (commandWindows) {
      lines.push(`command_windows = "${escapeTomlHookString(commandWindows)}"`);
    }
    if (hook.timeoutMs) lines.push(`timeout = ${convertTimeout(hook.timeoutMs, 'codex')}`);
    if (hook.statusMessage) {
      lines.push(`statusMessage = "${escapeTomlHookString(hook.statusMessage)}"`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Generate Codex hooks.json entries from portable hook definitions.
 */
export function generateCodexHookConfig(hooks: HookDefinition[]): Record<string, unknown[]> {
  const result: Record<string, unknown[]> = {};

  for (const hook of applyHookTargetOverrides(hooks, 'codex')) {
    if (hook.enabled === false) continue;
    const nativeEvent = mapEvent(hook.event, 'codex');
    if (!nativeEvent) continue;

    const command = hook.script
      ? serializeGitRootScriptCommand(hook, true)
      : serializeOwnedCommand(hook);
    const commandWindows = hook.script
      ? serializePowerShellScriptCommand(hook, true, true)
      : serializeOwnedCommand(hook, quotePowerShellArgument, '& ');
    const handler = {
      type: 'command',
      command,
      ...(commandWindows ? { commandWindows } : {}),
      ...(hook.timeoutMs ? { timeout: convertTimeout(hook.timeoutMs, 'codex') } : {}),
      ...(hook.statusMessage ? { statusMessage: hook.statusMessage } : {}),
    };

    if (!result[nativeEvent]) result[nativeEvent] = [];
    result[nativeEvent].push({
      ...(hook.matcher ? { matcher: hook.matcher } : {}),
      hooks: [handler],
    });
  }

  return result;
}

function escapeTomlHookString(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r');
}
