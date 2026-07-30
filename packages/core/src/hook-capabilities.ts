import type { KnownTarget } from './types/config.js';

export type HookSupportStatus =
  | 'native'
  | 'compatible'
  | 'agent-scoped'
  | 'plugin-only'
  | 'unsupported';

export type HookTimeoutUnit = 'milliseconds' | 'seconds' | 'none';

export type HookProjectRootStrategy =
  | 'environment'
  | 'git-root'
  | 'native-cwd'
  | 'workspace-cwd'
  | 'none';

export interface HookCapability {
  status: HookSupportStatus;
  configPath: string | null;
  events: readonly string[];
  commandFormat: string;
  timeoutUnit: HookTimeoutUnit;
  projectRootStrategy: HookProjectRootStrategy;
  platforms: readonly ('unix' | 'windows')[];
  nativeVersions?: readonly string[];
  fallback: string;
  documentationUrl: string;
}

const PORTABLE_EVENTS = [
  'pre-tool-use',
  'post-tool-use',
  'session-start',
  'setup',
  'subagent-start',
  'notification',
  'stop',
] as const;

const UNSUPPORTED_CAPABILITY = {
  status: 'unsupported',
  configPath: null,
  events: [],
  commandFormat: 'none',
  timeoutUnit: 'none',
  projectRootStrategy: 'none',
  platforms: [],
  fallback: 'Run `prs compile --watch` when automatic regeneration is required.',
  documentationUrl: 'https://promptscript.dev/docs/guides/hooks/',
} as const satisfies HookCapability;

/**
 * Audited lifecycle-hook capabilities for every built-in formatter target.
 *
 * Plugin-only and agent-scoped APIs are not treated as portable repository
 * hooks because enabling them requires generated runtime code or selecting a
 * custom agent, which would change target behavior beyond hook installation.
 */
export const HOOK_CAPABILITIES = {
  github: {
    status: 'native',
    configPath: '.github/hooks/promptscript.json',
    events: PORTABLE_EVENTS,
    commandFormat: 'versioned JSON with bash and powershell commands',
    timeoutUnit: 'seconds',
    projectRootStrategy: 'native-cwd',
    platforms: ['unix', 'windows'],
    nativeVersions: ['multifile', 'full'],
    fallback: "Use GitHub version 'multifile' or 'full'.",
    documentationUrl: 'https://docs.github.com/en/copilot/reference/hooks-reference',
  },
  claude: {
    status: 'native',
    configPath: '.claude/settings.json',
    events: PORTABLE_EVENTS,
    commandFormat: 'nested command hooks',
    timeoutUnit: 'seconds',
    projectRootStrategy: 'environment',
    platforms: ['unix'],
    nativeVersions: ['full'],
    fallback: "Use Claude version 'full'.",
    documentationUrl: 'https://code.claude.com/docs/en/hooks',
  },
  cursor: {
    status: 'native',
    configPath: '.cursor/hooks.json',
    events: ['pre-tool-use', 'post-tool-use', 'session-start', 'setup', 'subagent-start', 'stop'],
    commandFormat: 'versioned JSON command hooks',
    timeoutUnit: 'seconds',
    projectRootStrategy: 'git-root',
    platforms: ['unix'],
    nativeVersions: ['full'],
    fallback: "Use Cursor version 'full'.",
    documentationUrl: 'https://cursor.com/docs/hooks',
  },
  antigravity: UNSUPPORTED_CAPABILITY,
  factory: {
    status: 'native',
    configPath: '.factory/hooks.json',
    events: ['pre-tool-use', 'post-tool-use', 'session-start', 'setup', 'notification', 'stop'],
    commandFormat: 'nested command hooks',
    timeoutUnit: 'seconds',
    projectRootStrategy: 'environment',
    platforms: ['unix'],
    nativeVersions: ['multifile', 'full'],
    fallback: "Use Factory version 'multifile' or 'full'.",
    documentationUrl: 'https://docs.factory.ai/reference/hooks-reference',
  },
  opencode: {
    ...UNSUPPORTED_CAPABILITY,
    status: 'plugin-only',
    fallback:
      'OpenCode lifecycle events require a JavaScript or TypeScript plugin; use `prs compile --watch` for regeneration.',
    documentationUrl: 'https://opencode.ai/docs/plugins/',
  },
  gemini: {
    status: 'native',
    configPath: '.gemini/settings.json',
    events: ['pre-tool-use', 'post-tool-use', 'session-start', 'setup', 'stop'],
    commandFormat: 'nested command hooks',
    timeoutUnit: 'milliseconds',
    projectRootStrategy: 'environment',
    platforms: ['unix'],
    nativeVersions: ['multifile', 'full'],
    fallback: "Use Gemini version 'multifile' or 'full'.",
    documentationUrl: 'https://geminicli.com/docs/hooks/reference/',
  },
  windsurf: {
    status: 'native',
    configPath: '.windsurf/hooks.json',
    events: ['pre-tool-use', 'post-tool-use', 'stop'],
    commandFormat: 'flat command and powershell entries',
    timeoutUnit: 'none',
    projectRootStrategy: 'native-cwd',
    platforms: ['unix', 'windows'],
    nativeVersions: ['multifile', 'full'],
    fallback: "Use Windsurf version 'multifile' or 'full'.",
    documentationUrl: 'https://docs.windsurf.com/windsurf/cascade/hooks',
  },
  cline: {
    ...UNSUPPORTED_CAPABILITY,
    status: 'plugin-only',
    fallback:
      'Current Cline lifecycle integration is SDK plugin-only; use `prs compile --watch` for regeneration.',
    documentationUrl: 'https://docs.cline.bot/customization/hooks',
  },
  roo: UNSUPPORTED_CAPABILITY,
  codex: {
    status: 'native',
    configPath: '.codex/hooks.json',
    events: ['pre-tool-use', 'post-tool-use', 'session-start', 'setup', 'subagent-start', 'stop'],
    commandFormat: 'nested command and commandWindows hooks',
    timeoutUnit: 'seconds',
    projectRootStrategy: 'git-root',
    platforms: ['unix', 'windows'],
    nativeVersions: ['multifile', 'full'],
    fallback: "Use Codex version 'multifile' or 'full'.",
    documentationUrl: 'https://developers.openai.com/codex/hooks',
  },
  continue: UNSUPPORTED_CAPABILITY,
  augment: UNSUPPORTED_CAPABILITY,
  goose: UNSUPPORTED_CAPABILITY,
  kilo: {
    ...UNSUPPORTED_CAPABILITY,
    status: 'plugin-only',
    fallback:
      'Kilo lifecycle events require a CLI plugin; use `prs compile --watch` for regeneration.',
    documentationUrl: 'https://kilo.ai/docs/automate/extending/plugins',
  },
  amp: UNSUPPORTED_CAPABILITY,
  trae: UNSUPPORTED_CAPABILITY,
  junie: UNSUPPORTED_CAPABILITY,
  kiro: {
    ...UNSUPPORTED_CAPABILITY,
    status: 'agent-scoped',
    fallback:
      'Kiro CLI hooks are custom-agent scoped and do not apply to the default agent; use `prs compile --watch`.',
    documentationUrl: 'https://kiro.dev/docs/cli/hooks/',
  },
  cortex: UNSUPPORTED_CAPABILITY,
  crush: UNSUPPORTED_CAPABILITY,
  'command-code': UNSUPPORTED_CAPABILITY,
  kode: UNSUPPORTED_CAPABILITY,
  mcpjam: UNSUPPORTED_CAPABILITY,
  'mistral-vibe': UNSUPPORTED_CAPABILITY,
  mux: UNSUPPORTED_CAPABILITY,
  openhands: UNSUPPORTED_CAPABILITY,
  pi: UNSUPPORTED_CAPABILITY,
  qoder: UNSUPPORTED_CAPABILITY,
  'qwen-code': UNSUPPORTED_CAPABILITY,
  zencoder: UNSUPPORTED_CAPABILITY,
  neovate: UNSUPPORTED_CAPABILITY,
  pochi: UNSUPPORTED_CAPABILITY,
  adal: UNSUPPORTED_CAPABILITY,
  iflow: UNSUPPORTED_CAPABILITY,
  openclaw: UNSUPPORTED_CAPABILITY,
  codebuddy: UNSUPPORTED_CAPABILITY,
  aider: UNSUPPORTED_CAPABILITY,
  'amazon-q': {
    ...UNSUPPORTED_CAPABILITY,
    status: 'agent-scoped',
    fallback:
      'Amazon Q Developer hooks are custom-agent scoped and do not apply globally; use `prs compile --watch`.',
    documentationUrl:
      'https://docs.aws.amazon.com/amazonq/latest/qdeveloper-ug/command-line-custom-agents.html',
  },
  warp: UNSUPPORTED_CAPABILITY,
  zed: UNSUPPORTED_CAPABILITY,
  jules: UNSUPPORTED_CAPABILITY,
  devin: UNSUPPORTED_CAPABILITY,
  grok: {
    status: 'native',
    configPath: '.grok/hooks/promptscript.json',
    events: PORTABLE_EVENTS,
    commandFormat: 'nested command hooks',
    timeoutUnit: 'seconds',
    projectRootStrategy: 'environment',
    platforms: ['unix'],
    nativeVersions: ['full'],
    fallback: "Use Grok version 'full'.",
    documentationUrl: 'https://docs.x.ai/build/features/hooks',
  },
  kimi: UNSUPPORTED_CAPABILITY,
  mimo: UNSUPPORTED_CAPABILITY,
  'deep-agents': UNSUPPORTED_CAPABILITY,
  forgecode: UNSUPPORTED_CAPABILITY,
} as const satisfies Record<KnownTarget, HookCapability>;

export const PORTABLE_HOOK_INTERPRETERS = [
  'python3',
  'python',
  'node',
  'deno',
  'bun',
  'ruby',
  'php',
  'perl',
  'bash',
  'sh',
  'zsh',
  'pwsh',
  'powershell',
] as const;

export type PortableHookInterpreter = (typeof PORTABLE_HOOK_INTERPRETERS)[number];

export function isPortableHookInterpreter(value: string): value is PortableHookInterpreter {
  return (PORTABLE_HOOK_INTERPRETERS as readonly string[]).includes(value);
}

export function isPortablePathSegment(segment: string): boolean {
  if (
    segment.length === 0 ||
    segment === '.' ||
    segment === '..' ||
    /[<>:"|?*]/.test(segment) ||
    [...segment].some((character) => character.charCodeAt(0) <= 31) ||
    /[. ]$/.test(segment)
  ) {
    return false;
  }

  const basename = segment.split('.')[0]!.toUpperCase();
  return !/^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/.test(basename);
}

export function isPortableHookScriptPath(value: string): boolean {
  if (!value.startsWith('.promptscript/scripts/')) return false;
  if (
    value.includes('\\') ||
    value.includes('\0') ||
    value.includes('\n') ||
    value.includes('\r')
  ) {
    return false;
  }

  const segments = value.split('/');
  return segments.every(isPortablePathSegment);
}
