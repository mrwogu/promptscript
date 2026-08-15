/**
 * Canonical capability metadata shared by all built-in targets.
 *
 * Formatter-specific registries project this contract into their public APIs.
 * Keep target exceptions here instead of duplicating them in consumers.
 */

import { HOOK_CAPABILITIES, type HookCapability } from './hook-capabilities.js';
import { KNOWN_TARGETS, type KnownTarget } from './types/config.js';
import { PSError } from './errors/base.js';

export interface TargetVersionCapability {
  readonly name: string;
  readonly description: string;
  readonly outputPath: string;
}

export type TargetVersionMap = Readonly<Record<string, TargetVersionCapability>>;

interface TargetVersionData {
  readonly versions: TargetVersionMap;
  readonly aliases?: Readonly<Record<string, string>>;
}

export type TargetReferenceMode = 'directory' | 'inline' | 'none';
export type TargetSectionSupport = 'required' | 'optional';

export interface TargetSectionCapability {
  readonly support: TargetSectionSupport;
  readonly headers: string | readonly string[];
}

export type TargetSectionMap = Readonly<Record<string, TargetSectionCapability>>;

export type TargetFeatureStatus = 'supported' | 'not-supported' | 'planned' | 'partial';

export interface TargetResourceCapability {
  /** Resource category and generated file contract. */
  readonly kind: 'main' | 'skills' | 'agents' | 'commands' | 'hooks' | 'mcp' | 'plugins';
  /** Relative path; `<name>` denotes a generated entry name. */
  readonly path: string;
  /** Formatter versions that can emit this resource. */
  readonly versions: readonly string[];
  /** Whether the resource depends on a corresponding source block or setting. */
  readonly conditional?: boolean;
}

export interface TargetCapability {
  readonly versions: TargetVersionMap;
  readonly defaultVersion: string;
  readonly versionAliases: Readonly<Record<string, string>>;
  readonly referencesMode: TargetReferenceMode;
  readonly sections: TargetSectionMap;
  readonly featureSupport: Readonly<Record<string, TargetFeatureStatus>>;
  readonly hooks: HookCapability;
  readonly resources: readonly TargetResourceCapability[];
  readonly unsupportedBlocks: readonly string[];
  readonly mcpConfigPath: string | null;
  readonly mcpConfigFormat: 'json' | 'toml' | null;
}

export class TargetCapabilitiesError extends PSError {
  constructor(message: string) {
    super(message, 'TARGET_CAPABILITIES_ERROR');
    this.name = 'TargetCapabilitiesError';
  }
}

const PARITY_SECTION_IDS = [
  'project-identity',
  'tech-stack',
  'architecture',
  'code-standards',
  'git-commits',
  'config-files',
  'commands',
  'dev-commands',
  'post-work',
  'documentation',
  'diagrams',
  'restrictions',
] as const;

const DEFAULT_SECTION_HEADERS: Readonly<Record<string, string>> = {
  'project-identity': '## Project',
  'tech-stack': '## Tech Stack',
  architecture: '## Architecture',
  'code-standards': '## Code Style',
  'git-commits': '## Git Commits',
  'config-files': '## Config Files',
  commands: '## Commands',
  'dev-commands': '## Development Commands',
  'post-work': '## Post-Work Verification',
  documentation: '## Documentation',
  diagrams: '## Diagrams',
  restrictions: '## Restrictions',
};

const REQUIRED_SECTIONS: Readonly<Record<string, readonly KnownTarget[]>> = {
  'project-identity': [
    'github',
    'cursor',
    'claude',
    'antigravity',
    'factory',
    'opencode',
    'gemini',
    'augment',
    'codex',
    'continue',
    'kiro',
  ],
  'tech-stack': ['github', 'antigravity', 'factory'],
  architecture: ['github', 'antigravity'],
  'code-standards': ['github', 'cursor', 'antigravity', 'factory'],
  'git-commits': ['github', 'antigravity', 'factory'],
  'config-files': ['github', 'antigravity'],
  commands: ['github', 'cursor', 'claude', 'antigravity', 'factory', 'opencode', 'gemini', 'kiro'],
  'dev-commands': ['github', 'antigravity'],
  'post-work': ['github', 'antigravity'],
  documentation: ['github', 'antigravity'],
  diagrams: ['github', 'antigravity'],
  restrictions: [
    'github',
    'cursor',
    'claude',
    'antigravity',
    'factory',
    'opencode',
    'gemini',
    'augment',
    'codex',
    'continue',
  ],
};

const SECTION_HEADER_OVERRIDES: Readonly<
  Record<string, Partial<Record<KnownTarget, string | readonly string[]>>>
> = {
  'project-identity': { antigravity: '## Project Identity', cursor: '' },
  'tech-stack': { cursor: 'Tech stack:' },
  architecture: { cursor: '' },
  'code-standards': {
    antigravity: '## Code Standards',
    cursor: ['TypeScript:', 'Naming:', 'Testing:'],
    factory: '## Conventions & Patterns',
  },
  'git-commits': { cursor: 'Git Commits:', factory: '## Git Workflows' },
  'config-files': {
    antigravity: '## Configuration Files',
    cursor: 'Config:',
    factory: '## Configuration',
  },
  commands: { cursor: 'Commands:' },
  'dev-commands': {
    cursor: '',
    github: '## Dev Commands',
    roo: '## Commands',
    windsurf: '## Commands',
  },
  'post-work': { cursor: '', factory: '## Build & Test' },
  documentation: { cursor: '' },
  diagrams: { cursor: '' },
  restrictions: {
    antigravity: "## Don'ts",
    claude: "## Don'ts",
    codex: "## Don'ts",
    cursor: 'Never:',
    factory: "## Don'ts",
    github: "## Don'ts",
  },
};

interface FeatureStatusGroups {
  readonly supported?: readonly KnownTarget[];
  readonly partial?: readonly KnownTarget[];
  readonly planned?: readonly KnownTarget[];
}

const FEATURE_IDS = [
  'markdown-output',
  'code-blocks',
  'single-file',
  'mdc-format',
  'mermaid-diagrams',
  'multi-file-rules',
  'workflows',
  'nested-directories',
  'yaml-frontmatter',
  'frontmatter-description',
  'frontmatter-globs',
  'activation-type',
  'glob-patterns',
  'always-apply',
  'manual-activation',
  'auto-activation',
  'examples',
  'character-limit',
  'sections-splitting',
  'guard-requires',
  'context-inclusion',
  'at-mentions',
  'tool-integration',
  'path-specific-rules',
  'prompt-files',
  'slash-commands',
  'skills',
  'agent-instructions',
  'local-memory',
  'nested-memory',
] as const;

const FEATURE_STATUS_GROUPS: Readonly<Record<string, FeatureStatusGroups>> = {
  'mdc-format': { supported: ['cursor', 'zencoder'] },
  'mermaid-diagrams': {
    supported: [
      'github',
      'cursor',
      'claude',
      'antigravity',
      'factory',
      'opencode',
      'gemini',
      'windsurf',
      'cline',
      'roo',
      'augment',
      'kilo',
      'amp',
      'trae',
      'junie',
      'openhands',
      'qwen-code',
      'zencoder',
      'neovate',
    ],
  },
  'multi-file-rules': {
    supported: [
      'github',
      'cursor',
      'claude',
      'antigravity',
      'factory',
      'opencode',
      'gemini',
      'augment',
      'kilo',
      'amp',
      'cortex',
      'command-code',
      'mistral-vibe',
      'openhands',
      'qwen-code',
      'zencoder',
    ],
    partial: ['neovate'],
    planned: ['cline', 'roo', 'continue', 'kiro'],
  },
  workflows: { supported: ['claude', 'antigravity'] },
  'nested-directories': {
    supported: ['cursor', 'factory', 'roo', 'augment'],
    partial: ['codex', 'kilo'],
    planned: ['antigravity'],
  },
  'yaml-frontmatter': {
    supported: [
      'github',
      'cursor',
      'claude',
      'antigravity',
      'factory',
      'opencode',
      'gemini',
      'augment',
      'amp',
      'kiro',
      'cortex',
      'command-code',
      'mistral-vibe',
      'openhands',
      'zencoder',
    ],
    planned: ['windsurf', 'cline', 'continue'],
  },
  'frontmatter-description': {
    supported: [
      'cursor',
      'antigravity',
      'factory',
      'opencode',
      'gemini',
      'augment',
      'amp',
      'cortex',
      'command-code',
      'mistral-vibe',
      'openhands',
      'zencoder',
    ],
    planned: ['continue'],
  },
  'frontmatter-globs': {
    supported: ['github', 'cursor', 'claude', 'antigravity', 'zencoder'],
    planned: ['cline', 'continue'],
  },
  'activation-type': {
    supported: ['cursor', 'antigravity', 'augment', 'zencoder'],
    partial: ['kiro'],
    planned: ['windsurf', 'continue'],
  },
  'glob-patterns': {
    supported: ['github', 'cursor', 'claude', 'antigravity', 'zencoder'],
    planned: ['cline', 'continue'],
  },
  'always-apply': {
    supported: [
      'github',
      'cursor',
      'claude',
      'antigravity',
      'factory',
      'opencode',
      'gemini',
      'cline',
      'roo',
      'codex',
      'continue',
      'augment',
      'goose',
      'kilo',
      'amp',
      'junie',
      'kiro',
      'cortex',
      'crush',
      'command-code',
      'kode',
      'mcpjam',
      'mistral-vibe',
      'mux',
      'openhands',
      'pi',
      'qoder',
      'qwen-code',
      'zencoder',
      'neovate',
      'pochi',
      'adal',
      'iflow',
      'openclaw',
      'codebuddy',
    ],
    planned: ['windsurf'],
  },
  'manual-activation': { supported: ['antigravity', 'augment', 'zencoder'], partial: ['cursor'] },
  'auto-activation': {
    supported: ['antigravity', 'augment'],
    partial: ['cursor'],
    planned: ['continue'],
  },
  examples: {
    supported: [
      'github',
      'cursor',
      'claude',
      'antigravity',
      'factory',
      'opencode',
      'gemini',
      'windsurf',
      'cline',
      'roo',
      'codex',
      'continue',
      'augment',
      'goose',
      'kilo',
      'amp',
      'trae',
      'junie',
      'kiro',
      'cortex',
      'crush',
      'command-code',
      'kode',
      'mcpjam',
      'mistral-vibe',
      'mux',
      'openhands',
      'pi',
      'qoder',
      'qwen-code',
      'zencoder',
      'neovate',
      'pochi',
      'adal',
      'iflow',
      'openclaw',
      'codebuddy',
    ],
  },
  'character-limit': { supported: ['antigravity', 'augment'] },
  'sections-splitting': {
    supported: [
      'github',
      'cursor',
      'claude',
      'antigravity',
      'factory',
      'opencode',
      'gemini',
      'windsurf',
      'cline',
      'roo',
      'codex',
      'augment',
      'goose',
      'kilo',
      'amp',
      'trae',
      'kiro',
      'cortex',
      'crush',
      'command-code',
      'kode',
      'mcpjam',
      'mistral-vibe',
      'mux',
      'openhands',
      'pi',
      'qoder',
      'qwen-code',
      'zencoder',
      'neovate',
      'pochi',
      'adal',
      'iflow',
      'openclaw',
      'codebuddy',
    ],
    planned: ['continue'],
  },
  'guard-requires': {
    supported: [
      'github',
      'claude',
      'antigravity',
      'factory',
      'opencode',
      'gemini',
      'windsurf',
      'cline',
      'roo',
      'codex',
      'continue',
      'augment',
      'goose',
      'kilo',
      'amp',
      'trae',
      'junie',
      'kiro',
      'cortex',
      'crush',
      'command-code',
      'kode',
      'mcpjam',
      'mistral-vibe',
      'mux',
      'openhands',
      'pi',
      'qoder',
      'qwen-code',
      'zencoder',
      'neovate',
      'pochi',
      'adal',
      'iflow',
      'openclaw',
      'codebuddy',
    ],
  },
  'context-inclusion': { supported: ['cursor'], planned: ['claude'] },
  'at-mentions': { supported: ['augment', 'zencoder'], planned: ['cursor'] },
  'tool-integration': { supported: ['claude', 'augment'], partial: ['cursor'] },
  'path-specific-rules': {
    supported: ['github', 'cursor', 'claude', 'antigravity'],
    partial: ['codex', 'kilo'],
    planned: ['cline', 'continue'],
  },
  'prompt-files': { supported: ['github'] },
  'local-memory': { partial: ['claude', 'zencoder'] },
  'nested-memory': {
    supported: ['codex', 'augment', 'amp'],
    planned: ['cursor', 'claude', 'antigravity', 'gemini'],
  },
};

const MCP_CONFIGS: Readonly<
  Partial<Record<KnownTarget, { path: string; format: 'json' | 'toml' }>>
> = {
  antigravity: { path: '.agents/mcp_config.json', format: 'json' },
  github: { path: '.vscode/mcp.json', format: 'json' },
  claude: { path: '.mcp.json', format: 'json' },
  cursor: { path: '.cursor/mcp.json', format: 'json' },
  factory: { path: '.factory/mcp.json', format: 'json' },
  gemini: { path: '.gemini/mcp_config.json', format: 'json' },
  windsurf: { path: '.windsurf/mcp_config.json', format: 'json' },
  cline: { path: '.cline/cline_mcp_settings.json', format: 'json' },
  roo: { path: '.roo/mcp_settings.json', format: 'json' },
  codex: { path: '.codex/mcp.json', format: 'json' },
  goose: { path: '.goose/mcp_config.json', format: 'json' },
  kilo: { path: '.kilocode/mcp_settings.json', format: 'json' },
  openhands: { path: '.openhands/mcp_config.toml', format: 'toml' },
  'qwen-code': { path: '.qwen/mcp.json', format: 'json' },
  crush: { path: '.crush/mcp.json', format: 'json' },
  continue: { path: '.continue/config.json', format: 'json' },
  grok: { path: '.mcp.json', format: 'json' },
};

interface NativeResourcePaths {
  readonly agents?: string;
  readonly commands?: string;
  readonly plugins?: string;
}

const NATIVE_RESOURCE_PATHS: Readonly<Partial<Record<KnownTarget, NativeResourcePaths>>> = {
  github: {
    agents: '.github/agents/<name>.md',
    commands: '.github/prompts/<name>.prompt.md',
  },
  claude: {
    agents: '.claude/agents/<name>.md',
    commands: '.claude/commands/<name>.md',
  },
  cursor: {
    agents: '.cursor/agents/<name>.md',
    commands: '.cursor/commands/<name>.md',
    plugins: '.cursor/plugins.json',
  },
  antigravity: { commands: '.agent/workflows/<name>.md' },
  factory: {
    agents: '.factory/droids/<name>.md',
    commands: '.factory/commands/<name>.md',
    plugins: '.factory/plugins.json',
  },
  opencode: {
    agents: '.opencode/agents/<name>.md',
    commands: '.opencode/commands/<name>.md',
  },
  gemini: { commands: '.gemini/commands/<name>.toml' },
  codex: { agents: '.codex/agents/<name>.toml', plugins: '.codex/plugins.json' },
  augment: { agents: '.augment/agents/<name>.md' },
  amp: { agents: '.agents/agents/<name>.md' },
  'command-code': { commands: '.commandcode/commands/<name>.md' },
  grok: {
    agents: '.claude/agents/<name>.md',
    commands: '.claude/commands/<name>.md',
    plugins: '.grok/plugins.json',
  },
};

const SKILLS_IN_MULTIFILE: ReadonlySet<KnownTarget> = new Set(['factory', 'opencode', 'gemini']);

const UNSUPPORTED_BLOCKS: Readonly<Partial<Record<KnownTarget, readonly string[]>>> = {
  hermes: [
    'skills',
    'agents',
    'workflows',
    'prompts',
    'shortcuts',
    'guards',
    'local',
    'hooks',
    'mcpServers',
    'plugins',
  ],
};

const VERSION_CAPABILITIES: Readonly<Record<KnownTarget, TargetVersionData>> = {
  github: {
    versions: {
      simple: {
        name: 'simple',
        description: 'Single file output (.github/copilot-instructions.md)',
        outputPath: '.github/copilot-instructions.md',
      },
      multifile: {
        name: 'multifile',
        description: 'Main + path-specific instructions (.github/instructions/) + prompts',
        outputPath: '.github/copilot-instructions.md',
      },
      full: {
        name: 'full',
        description: 'Multifile + skills (.github/skills/) + agents (.github/agents/) + AGENTS.md',
        outputPath: '.github/copilot-instructions.md',
      },
    },
  },
  claude: {
    versions: {
      simple: {
        name: 'simple',
        description: 'Single file output (CLAUDE.md)',
        outputPath: 'CLAUDE.md',
      },
      multifile: {
        name: 'multifile',
        description: 'Main + modular rules (.claude/rules/*.md) + commands (.claude/commands/*.md)',
        outputPath: 'CLAUDE.md',
      },
      full: {
        name: 'full',
        description:
          'Multifile + skills (.claude/skills/) + agents (.claude/agents/) + commands (.claude/commands/) + local memory',
        outputPath: 'CLAUDE.md',
      },
    },
  },
  cursor: {
    versions: {
      modern: {
        name: 'modern',
        description:
          'MDC format with YAML frontmatter (.cursor/rules/project.mdc) + slash commands (.cursor/commands/)',
        outputPath: '.cursor/rules/project.mdc',
      },
      'agents-md': {
        name: 'agents-md',
        description: 'Plain markdown at AGENTS.md (Cursor 2.4+)  -  no frontmatter required',
        outputPath: 'AGENTS.md',
      },
      full: {
        name: 'full',
        description:
          'MDC + skills (.agents/skills/<name>/SKILL.md) + subagents (.cursor/agents/<name>.md)',
        outputPath: '.cursor/rules/project.mdc',
      },
      multifile: {
        name: 'multifile',
        description: 'Multiple MDC files with glob-based targeting + slash commands',
        outputPath: '.cursor/rules/project.mdc',
      },
      legacy: {
        name: 'legacy',
        description: 'Plain text format (.cursorrules) - DEPRECATED',
        outputPath: '.cursorrules',
      },
    },
    aliases: { standard: 'modern' },
  },
  antigravity: {
    versions: {
      simple: {
        name: 'simple',
        description: 'Plain Markdown without frontmatter',
        outputPath: '.agent/rules/project.md',
      },
      frontmatter: {
        name: 'frontmatter',
        description: 'Markdown with YAML frontmatter for activation',
        outputPath: '.agent/rules/project.md',
      },
      'agents-md': {
        name: 'agents-md',
        description: 'Root AGENTS.md (interoperable with Codex, Cursor, etc.)',
        outputPath: 'AGENTS.md',
      },
    },
  },
  factory: {
    versions: {
      simple: { name: 'simple', description: 'Single AGENTS.md file', outputPath: 'AGENTS.md' },
      multifile: {
        name: 'multifile',
        description: 'AGENTS.md + .factory/skills/<name>/SKILL.md',
        outputPath: 'AGENTS.md',
      },
      full: {
        name: 'full',
        description: 'Multifile + droids + additional supporting files',
        outputPath: 'AGENTS.md',
      },
    },
  },
  opencode: {
    versions: {
      simple: { name: 'simple', description: 'Single OPENCODE.md file', outputPath: 'OPENCODE.md' },
      multifile: {
        name: 'multifile',
        description:
          'OPENCODE.md + .opencode/skills/<name>/SKILL.md + .opencode/commands/<name>.md',
        outputPath: 'OPENCODE.md',
      },
      full: {
        name: 'full',
        description:
          'Multifile + .opencode/skills/<name>/SKILL.md + .opencode/commands/<name>.md + .opencode/agents/<name>.md',
        outputPath: 'OPENCODE.md',
      },
    },
  },
  gemini: {
    versions: {
      simple: { name: 'simple', description: 'Single GEMINI.md file', outputPath: 'GEMINI.md' },
      multifile: {
        name: 'multifile',
        description: 'GEMINI.md + .gemini/commands/<name>.toml + .gemini/skills/<name>/skill.md',
        outputPath: 'GEMINI.md',
      },
      full: {
        name: 'full',
        description: 'Multifile (Gemini has no agent concept, equivalent to multifile)',
        outputPath: 'GEMINI.md',
      },
    },
  },
  windsurf: {
    versions: {
      simple: {
        name: 'simple',
        description: 'Single .windsurf/rules/project.md file',
        outputPath: '.windsurf/rules/project.md',
      },
      multifile: {
        name: 'multifile',
        description: 'Single .windsurf/rules/project.md file (skills via full mode)',
        outputPath: '.windsurf/rules/project.md',
      },
      full: {
        name: 'full',
        description: '.windsurf/rules/project.md + .windsurf/skills/<name>/SKILL.md',
        outputPath: '.windsurf/rules/project.md',
      },
    },
  },
  cline: {
    versions: {
      simple: { name: 'simple', description: 'Single .clinerules file', outputPath: '.clinerules' },
      multifile: {
        name: 'multifile',
        description: '.clinerules + .cline/cline_mcp_settings.json',
        outputPath: '.clinerules',
      },
      full: {
        name: 'full',
        description: '.clinerules + .cline/cline_mcp_settings.json',
        outputPath: '.clinerules',
      },
    },
  },
  roo: {
    versions: {
      simple: { name: 'simple', description: 'Single .roorules file', outputPath: '.roorules' },
      multifile: {
        name: 'multifile',
        description: '.roorules + .roo/mcp_settings.json',
        outputPath: '.roorules',
      },
      full: {
        name: 'full',
        description: '.roorules + .roo/mcp_settings.json',
        outputPath: '.roorules',
      },
    },
  },
  codex: {
    versions: {
      simple: { name: 'simple', description: 'Single AGENTS.md file', outputPath: 'AGENTS.md' },
      multifile: {
        name: 'multifile',
        description: 'AGENTS.md + .codex/agents/<name>.toml + .agents/skills/<name>/SKILL.md',
        outputPath: 'AGENTS.md',
      },
      full: {
        name: 'full',
        description: 'Multifile + skills (Codex full mode)',
        outputPath: 'AGENTS.md',
      },
    },
  },
  continue: {
    versions: {
      simple: {
        name: 'simple',
        description: 'Single .continue/rules/project.md file',
        outputPath: '.continue/rules/project.md',
      },
      multifile: {
        name: 'multifile',
        description: 'Single .continue/rules/project.md file (skills via full mode)',
        outputPath: '.continue/rules/project.md',
      },
      full: {
        name: 'full',
        description: '.continue/rules/project.md + .continue/skills/<name>/SKILL.md',
        outputPath: '.continue/rules/project.md',
      },
    },
  },
  augment: {
    versions: {
      simple: {
        name: 'simple',
        description: 'Single .augment/rules/project.md file',
        outputPath: '.augment/rules/project.md',
      },
      multifile: {
        name: 'multifile',
        description: 'Single .augment/rules/project.md file',
        outputPath: '.augment/rules/project.md',
      },
      full: {
        name: 'full',
        description: '.augment/rules/project.md + .augment/agents/<name>.md',
        outputPath: '.augment/rules/project.md',
      },
    },
  },
  goose: {
    versions: {
      simple: { name: 'simple', description: 'Single .goosehints file', outputPath: '.goosehints' },
      multifile: {
        name: 'multifile',
        description: '.goosehints + .goose/mcp_config.json',
        outputPath: '.goosehints',
      },
      full: {
        name: 'full',
        description: 'Multifile + .goose/skills/<name>/SKILL.md',
        outputPath: '.goosehints',
      },
    },
  },
  kilo: {
    versions: {
      simple: {
        name: 'simple',
        description: 'Single .kilocode/rules/project.md file',
        outputPath: '.kilocode/rules/project.md',
      },
      multifile: {
        name: 'multifile',
        description:
          '.kilocode/rules/project.md + .kilocode/mcp_settings.json (skills via full mode)',
        outputPath: '.kilocode/rules/project.md',
      },
      full: {
        name: 'full',
        description:
          '.kilocode/rules/project.md + .kilocode/skills/<name>/SKILL.md + .kilocode/mcp_settings.json',
        outputPath: '.kilocode/rules/project.md',
      },
    },
  },
  amp: {
    versions: {
      simple: { name: 'simple', description: 'Single AGENTS.md file', outputPath: 'AGENTS.md' },
      multifile: {
        name: 'multifile',
        description: 'Single AGENTS.md file',
        outputPath: 'AGENTS.md',
      },
      full: {
        name: 'full',
        description: 'Multifile + .agents/skills/<name>/SKILL.md + .agents/agents/<name>.md',
        outputPath: 'AGENTS.md',
      },
    },
  },
  trae: {
    versions: {
      simple: {
        name: 'simple',
        description: 'Single .trae/rules/project_rules.md file',
        outputPath: '.trae/rules/project_rules.md',
      },
      multifile: {
        name: 'multifile',
        description: 'Single .trae/rules/project_rules.md file (skills via full mode)',
        outputPath: '.trae/rules/project_rules.md',
      },
      full: {
        name: 'full',
        description: '.trae/rules/project_rules.md + .trae/skills/<name>/SKILL.md',
        outputPath: '.trae/rules/project_rules.md',
      },
    },
  },
  junie: {
    versions: {
      simple: {
        name: 'simple',
        description: 'Single .junie/guidelines.md file',
        outputPath: '.junie/guidelines.md',
      },
      multifile: {
        name: 'multifile',
        description: 'Single .junie/guidelines.md file (skills via full mode)',
        outputPath: '.junie/guidelines.md',
      },
      full: {
        name: 'full',
        description: '.junie/guidelines.md + .junie/skills/<name>/SKILL.md',
        outputPath: '.junie/guidelines.md',
      },
    },
  },
  kiro: {
    versions: {
      simple: {
        name: 'simple',
        description: 'Single .kiro/steering/project.md file',
        outputPath: '.kiro/steering/project.md',
      },
      multifile: {
        name: 'multifile',
        description: 'Single .kiro/steering/project.md file (skills via full mode)',
        outputPath: '.kiro/steering/project.md',
      },
      full: {
        name: 'full',
        description: '.kiro/steering/project.md + .kiro/skills/<name>/SKILL.md',
        outputPath: '.kiro/steering/project.md',
      },
    },
  },
  cortex: {
    versions: {
      simple: {
        name: 'simple',
        description: 'Single .cortex/rules/project.md file',
        outputPath: '.cortex/rules/project.md',
      },
      multifile: {
        name: 'multifile',
        description: 'Single .cortex/rules/project.md file (skills via full mode)',
        outputPath: '.cortex/rules/project.md',
      },
      full: {
        name: 'full',
        description: '.cortex/rules/project.md + .cortex/skills/<name>/SKILL.md',
        outputPath: '.cortex/rules/project.md',
      },
    },
  },
  crush: {
    versions: {
      simple: { name: 'simple', description: 'Single AGENTS.md file', outputPath: 'AGENTS.md' },
      multifile: {
        name: 'multifile',
        description: 'AGENTS.md + .crush/skills/<name>/SKILL.md + .crush/mcp.json',
        outputPath: 'AGENTS.md',
      },
      full: {
        name: 'full',
        description: 'Multifile + .crush/skills/<name>/SKILL.md + .crush/mcp.json',
        outputPath: 'AGENTS.md',
      },
    },
  },
  'command-code': {
    versions: {
      simple: {
        name: 'simple',
        description: 'Single .commandcode/rules/project.md file',
        outputPath: '.commandcode/rules/project.md',
      },
      multifile: {
        name: 'multifile',
        description:
          '.commandcode/rules/project.md + .commandcode/commands/<name>.md (skills via full mode)',
        outputPath: '.commandcode/rules/project.md',
      },
      full: {
        name: 'full',
        description:
          '.commandcode/rules/project.md + .commandcode/skills/<name>/SKILL.md + .commandcode/commands/<name>.md',
        outputPath: '.commandcode/rules/project.md',
      },
    },
  },
  kode: {
    versions: {
      simple: {
        name: 'simple',
        description: 'Single .kode/rules/project.md file',
        outputPath: '.kode/rules/project.md',
      },
      multifile: {
        name: 'multifile',
        description: 'Single .kode/rules/project.md file (skills via full mode)',
        outputPath: '.kode/rules/project.md',
      },
      full: {
        name: 'full',
        description: '.kode/rules/project.md + .kode/skills/<name>/SKILL.md',
        outputPath: '.kode/rules/project.md',
      },
    },
  },
  mcpjam: {
    versions: {
      simple: {
        name: 'simple',
        description: 'Single .mcpjam/rules/project.md file',
        outputPath: '.mcpjam/rules/project.md',
      },
      multifile: {
        name: 'multifile',
        description: 'Single .mcpjam/rules/project.md file (skills via full mode)',
        outputPath: '.mcpjam/rules/project.md',
      },
      full: {
        name: 'full',
        description: '.mcpjam/rules/project.md + .mcpjam/skills/<name>/SKILL.md',
        outputPath: '.mcpjam/rules/project.md',
      },
    },
  },
  'mistral-vibe': {
    versions: {
      simple: {
        name: 'simple',
        description: 'Single .vibe/rules/project.md file',
        outputPath: '.vibe/rules/project.md',
      },
      multifile: {
        name: 'multifile',
        description: 'Single .vibe/rules/project.md file (skills via full mode)',
        outputPath: '.vibe/rules/project.md',
      },
      full: {
        name: 'full',
        description: '.vibe/rules/project.md + .vibe/skills/<name>/SKILL.md',
        outputPath: '.vibe/rules/project.md',
      },
    },
  },
  mux: {
    versions: {
      simple: {
        name: 'simple',
        description: 'Single .mux/rules/project.md file',
        outputPath: '.mux/rules/project.md',
      },
      multifile: {
        name: 'multifile',
        description: 'Single .mux/rules/project.md file',
        outputPath: '.mux/rules/project.md',
      },
      full: {
        name: 'full',
        description: 'Single .mux/rules/project.md file',
        outputPath: '.mux/rules/project.md',
      },
    },
  },
  openhands: {
    versions: {
      simple: {
        name: 'simple',
        description: 'Single .openhands/rules/project.md file',
        outputPath: '.openhands/rules/project.md',
      },
      multifile: {
        name: 'multifile',
        description:
          '.openhands/rules/project.md + .openhands/mcp_config.toml (skills via full mode)',
        outputPath: '.openhands/rules/project.md',
      },
      full: {
        name: 'full',
        description:
          '.openhands/rules/project.md + .openhands/skills/<name>/SKILL.md + .openhands/mcp_config.toml',
        outputPath: '.openhands/rules/project.md',
      },
    },
  },
  pi: {
    versions: {
      simple: {
        name: 'simple',
        description: 'Single .pi/rules/project.md file',
        outputPath: '.pi/rules/project.md',
      },
      multifile: {
        name: 'multifile',
        description: 'Single .pi/rules/project.md file (skills via full mode)',
        outputPath: '.pi/rules/project.md',
      },
      full: {
        name: 'full',
        description: '.pi/rules/project.md + .pi/skills/<name>/SKILL.md',
        outputPath: '.pi/rules/project.md',
      },
    },
  },
  qoder: {
    versions: {
      simple: {
        name: 'simple',
        description: 'Single .qoder/rules/project.md file',
        outputPath: '.qoder/rules/project.md',
      },
      multifile: {
        name: 'multifile',
        description: 'Single .qoder/rules/project.md file',
        outputPath: '.qoder/rules/project.md',
      },
      full: {
        name: 'full',
        description: 'Single .qoder/rules/project.md file',
        outputPath: '.qoder/rules/project.md',
      },
    },
  },
  'qwen-code': {
    versions: {
      simple: {
        name: 'simple',
        description: 'Single .qwen/rules/project.md file',
        outputPath: '.qwen/rules/project.md',
      },
      multifile: {
        name: 'multifile',
        description: '.qwen/rules/project.md + .qwen/mcp.json (skills via full mode)',
        outputPath: '.qwen/rules/project.md',
      },
      full: {
        name: 'full',
        description: '.qwen/rules/project.md + .qwen/skills/<name>/SKILL.md + .qwen/mcp.json',
        outputPath: '.qwen/rules/project.md',
      },
    },
  },
  zencoder: {
    versions: {
      simple: {
        name: 'simple',
        description: 'Single .zencoder/rules/project.md file',
        outputPath: '.zencoder/rules/project.md',
      },
      multifile: {
        name: 'multifile',
        description: 'Single .zencoder/rules/project.md file (skills via full mode)',
        outputPath: '.zencoder/rules/project.md',
      },
      full: {
        name: 'full',
        description: '.zencoder/rules/project.md + .zencoder/skills/<name>/SKILL.md',
        outputPath: '.zencoder/rules/project.md',
      },
    },
  },
  neovate: {
    versions: {
      simple: {
        name: 'simple',
        description: 'Single .neovate/rules/project.md file',
        outputPath: '.neovate/rules/project.md',
      },
      multifile: {
        name: 'multifile',
        description: 'Single .neovate/rules/project.md file',
        outputPath: '.neovate/rules/project.md',
      },
      full: {
        name: 'full',
        description: 'Single .neovate/rules/project.md file',
        outputPath: '.neovate/rules/project.md',
      },
    },
  },
  pochi: {
    versions: {
      simple: {
        name: 'simple',
        description: 'Single .pochi/rules/project.md file',
        outputPath: '.pochi/rules/project.md',
      },
      multifile: {
        name: 'multifile',
        description: 'Single .pochi/rules/project.md file (skills via full mode)',
        outputPath: '.pochi/rules/project.md',
      },
      full: {
        name: 'full',
        description: '.pochi/rules/project.md + .pochi/skills/<name>/SKILL.md',
        outputPath: '.pochi/rules/project.md',
      },
    },
  },
  adal: {
    versions: {
      simple: {
        name: 'simple',
        description: 'Single .adal/rules/project.md file',
        outputPath: '.adal/rules/project.md',
      },
      multifile: {
        name: 'multifile',
        description: 'Single .adal/rules/project.md file (skills via full mode)',
        outputPath: '.adal/rules/project.md',
      },
      full: {
        name: 'full',
        description: '.adal/rules/project.md + .adal/skills/<name>/SKILL.md',
        outputPath: '.adal/rules/project.md',
      },
    },
  },
  iflow: {
    versions: {
      simple: {
        name: 'simple',
        description: 'Single .iflow/rules/project.md file',
        outputPath: '.iflow/rules/project.md',
      },
      multifile: {
        name: 'multifile',
        description: 'Single .iflow/rules/project.md file (skills via full mode)',
        outputPath: '.iflow/rules/project.md',
      },
      full: {
        name: 'full',
        description: '.iflow/rules/project.md + .iflow/skills/<name>/SKILL.md',
        outputPath: '.iflow/rules/project.md',
      },
    },
  },
  openclaw: {
    versions: {
      simple: {
        name: 'simple',
        description: 'Single INSTRUCTIONS.md file',
        outputPath: 'INSTRUCTIONS.md',
      },
      multifile: {
        name: 'multifile',
        description: 'Single INSTRUCTIONS.md file',
        outputPath: 'INSTRUCTIONS.md',
      },
      full: {
        name: 'full',
        description: 'Multifile + .openclaw/skills/<name>/SKILL.md',
        outputPath: 'INSTRUCTIONS.md',
      },
    },
  },
  codebuddy: {
    versions: {
      simple: {
        name: 'simple',
        description: 'Single .codebuddy/rules/project.md file',
        outputPath: '.codebuddy/rules/project.md',
      },
      multifile: {
        name: 'multifile',
        description: 'Single .codebuddy/rules/project.md file (skills via full mode)',
        outputPath: '.codebuddy/rules/project.md',
      },
      full: {
        name: 'full',
        description: '.codebuddy/rules/project.md + .codebuddy/skills/<name>/SKILL.md',
        outputPath: '.codebuddy/rules/project.md',
      },
    },
  },
  aider: {
    versions: {
      simple: { name: 'simple', description: 'Single AGENTS.md file', outputPath: 'AGENTS.md' },
      multifile: {
        name: 'multifile',
        description: 'Single AGENTS.md file',
        outputPath: 'AGENTS.md',
      },
      full: { name: 'full', description: 'Single AGENTS.md file', outputPath: 'AGENTS.md' },
    },
  },
  'amazon-q': {
    versions: {
      simple: { name: 'simple', description: 'Single AGENTS.md file', outputPath: 'AGENTS.md' },
      multifile: {
        name: 'multifile',
        description: 'Single AGENTS.md file',
        outputPath: 'AGENTS.md',
      },
      full: { name: 'full', description: 'Single AGENTS.md file', outputPath: 'AGENTS.md' },
    },
  },
  warp: {
    versions: {
      simple: { name: 'simple', description: 'Single AGENTS.md file', outputPath: 'AGENTS.md' },
      multifile: {
        name: 'multifile',
        description: 'Single AGENTS.md file',
        outputPath: 'AGENTS.md',
      },
      full: { name: 'full', description: 'Single AGENTS.md file', outputPath: 'AGENTS.md' },
    },
  },
  zed: {
    versions: {
      simple: { name: 'simple', description: 'Single AGENTS.md file', outputPath: 'AGENTS.md' },
      multifile: {
        name: 'multifile',
        description: 'AGENTS.md + .zed/settings.json',
        outputPath: 'AGENTS.md',
      },
      full: {
        name: 'full',
        description: 'AGENTS.md + .zed/settings.json',
        outputPath: 'AGENTS.md',
      },
    },
  },
  jules: {
    versions: {
      simple: { name: 'simple', description: 'Single AGENTS.md file', outputPath: 'AGENTS.md' },
      multifile: {
        name: 'multifile',
        description: 'Single AGENTS.md file',
        outputPath: 'AGENTS.md',
      },
      full: { name: 'full', description: 'Single AGENTS.md file', outputPath: 'AGENTS.md' },
    },
  },
  devin: {
    versions: {
      simple: { name: 'simple', description: 'Single AGENTS.md file', outputPath: 'AGENTS.md' },
      multifile: {
        name: 'multifile',
        description: 'Single AGENTS.md file',
        outputPath: 'AGENTS.md',
      },
      full: { name: 'full', description: 'Single AGENTS.md file', outputPath: 'AGENTS.md' },
    },
  },
  grok: {
    versions: {
      simple: { name: 'simple', description: 'Root AGENTS.md only', outputPath: 'AGENTS.md' },
      multifile: {
        name: 'multifile',
        description: 'AGENTS.md, CLAUDE.md, Claude rules and commands',
        outputPath: 'AGENTS.md',
      },
      full: {
        name: 'full',
        description:
          'AGENTS.md, CLAUDE.md, Claude rules, commands, skills, agents, and local memory',
        outputPath: 'AGENTS.md',
      },
    },
  },
  kimi: {
    versions: {
      simple: { name: 'simple', description: 'Single AGENTS.md file', outputPath: 'AGENTS.md' },
      multifile: {
        name: 'multifile',
        description: 'Single AGENTS.md file',
        outputPath: 'AGENTS.md',
      },
      full: { name: 'full', description: 'Single AGENTS.md file', outputPath: 'AGENTS.md' },
    },
  },
  mimo: {
    versions: {
      simple: { name: 'simple', description: 'Single AGENTS.md file', outputPath: 'AGENTS.md' },
      multifile: {
        name: 'multifile',
        description: 'Single AGENTS.md file',
        outputPath: 'AGENTS.md',
      },
      full: { name: 'full', description: 'Single AGENTS.md file', outputPath: 'AGENTS.md' },
    },
  },
  'deep-agents': {
    versions: {
      simple: { name: 'simple', description: 'Single AGENTS.md file', outputPath: 'AGENTS.md' },
      multifile: {
        name: 'multifile',
        description: 'Single AGENTS.md file',
        outputPath: 'AGENTS.md',
      },
      full: { name: 'full', description: 'Single AGENTS.md file', outputPath: 'AGENTS.md' },
    },
  },
  forgecode: {
    versions: {
      simple: { name: 'simple', description: 'Single AGENTS.md file', outputPath: 'AGENTS.md' },
      multifile: {
        name: 'multifile',
        description: 'Single AGENTS.md file',
        outputPath: 'AGENTS.md',
      },
      full: { name: 'full', description: 'Single AGENTS.md file', outputPath: 'AGENTS.md' },
    },
  },
  hermes: {
    versions: {
      simple: { name: 'simple', description: 'Single AGENTS.md file', outputPath: 'AGENTS.md' },
      multifile: {
        name: 'multifile',
        description: 'Single AGENTS.md file',
        outputPath: 'AGENTS.md',
      },
      full: { name: 'full', description: 'Single AGENTS.md file', outputPath: 'AGENTS.md' },
    },
  },
};

export interface TargetCapabilitySeed {
  readonly outputPath: string;
  readonly skillPath: { readonly basePath: string | null; readonly fileName: string | null };
  readonly features: {
    readonly defaultVersion: string;
    readonly hasSkills: boolean;
    readonly hasAgents: boolean;
    readonly hasCommands: boolean;
  };
}

function featureStatus(
  target: KnownTarget,
  featureId: string,
  seed: TargetCapabilitySeed
): TargetFeatureStatus {
  if (
    featureId === 'markdown-output' ||
    featureId === 'code-blocks' ||
    featureId === 'single-file'
  ) {
    return 'supported';
  }
  if (featureId === 'skills') return seed.features.hasSkills ? 'supported' : 'not-supported';
  if (featureId === 'agent-instructions') {
    return seed.features.hasAgents ? 'supported' : 'not-supported';
  }
  if (featureId === 'slash-commands') {
    return seed.features.hasCommands ? 'supported' : 'not-supported';
  }

  const groups = FEATURE_STATUS_GROUPS[featureId];
  if (groups?.supported?.includes(target)) return 'supported';
  if (groups?.partial?.includes(target)) return 'partial';
  if (groups?.planned?.includes(target)) return 'planned';
  return 'not-supported';
}

function createSections(target: KnownTarget): TargetSectionMap {
  return Object.fromEntries(
    PARITY_SECTION_IDS.map((id) => {
      const required = REQUIRED_SECTIONS[id]?.includes(target) ?? false;
      const headers = SECTION_HEADER_OVERRIDES[id]?.[target] ?? DEFAULT_SECTION_HEADERS[id]!;
      return [id, { support: required ? 'required' : 'optional', headers }];
    })
  );
}

export function createTargetCapability(
  target: KnownTarget,
  seed: TargetCapabilitySeed
): TargetCapability {
  const versionData = VERSION_CAPABILITIES[target];
  const versions = versionData.versions;
  const versionNames = Object.keys(versions);
  const versionAliases = versionData.aliases ?? {};
  const skillVersions = SKILLS_IN_MULTIFILE.has(target) ? ['multifile', 'full'] : ['full'];
  const skillResource =
    seed.skillPath.basePath && seed.skillPath.fileName
      ? {
          kind: 'skills' as const,
          path: `${seed.skillPath.basePath}/<name>/${seed.skillPath.fileName}`,
          versions: skillVersions,
          conditional: true,
        }
      : undefined;
  const mainResourceVersions = new Map<string, string[]>();
  for (const [version, capability] of Object.entries(versions)) {
    const versionsForPath = mainResourceVersions.get(capability.outputPath) ?? [];
    versionsForPath.push(version);
    mainResourceVersions.set(capability.outputPath, versionsForPath);
  }
  const mainResources: TargetResourceCapability[] = [...mainResourceVersions].map(
    ([path, versionsForPath]) => ({
      kind: 'main',
      path,
      versions: versionsForPath,
    })
  );
  const resources: TargetResourceCapability[] = [
    ...mainResources,
    ...(skillResource ? [skillResource] : []),
  ];
  const mcpConfig = MCP_CONFIGS[target];
  if (mcpConfig) {
    resources.push({
      kind: 'mcp',
      path: mcpConfig.path,
      versions:
        target === 'github' || target === 'claude' || target === 'cursor' || target === 'grok'
          ? ['full']
          : target === 'antigravity'
            ? versionNames
            : ['multifile', 'full'],
      conditional: true,
    });
  }
  const nativePaths = NATIVE_RESOURCE_PATHS[target];
  if (seed.features.hasAgents) {
    resources.push({
      kind: 'agents',
      path: nativePaths?.agents ?? '<target-native-agents>/<name>',
      versions: target === 'codex' ? ['multifile', 'full'] : ['full'],
      conditional: true,
    });
  }
  if (seed.features.hasCommands) {
    resources.push({
      kind: 'commands',
      path: nativePaths?.commands ?? '<target-native-commands>/<name>',
      versions:
        target === 'antigravity'
          ? versionNames
          : target === 'cursor'
            ? ['modern', 'multifile', 'full']
            : ['multifile', 'full'],
      conditional: true,
    });
  }
  if (nativePaths?.plugins) {
    resources.push({
      kind: 'plugins',
      path: nativePaths.plugins,
      versions: target === 'cursor' || target === 'grok' ? ['full'] : ['multifile', 'full'],
      conditional: true,
    });
  }
  if (HOOK_CAPABILITIES[target].configPath) {
    resources.push({
      kind: 'hooks',
      path: HOOK_CAPABILITIES[target].configPath,
      versions: HOOK_CAPABILITIES[target].nativeVersions ?? versionNames,
      conditional: true,
    });
  }
  return {
    versions,
    defaultVersion: seed.features.defaultVersion,
    versionAliases,
    referencesMode:
      target === 'cursor' || target === 'antigravity'
        ? 'inline'
        : seed.skillPath.basePath === null
          ? 'none'
          : 'directory',
    sections: createSections(target),
    featureSupport: Object.fromEntries(
      FEATURE_IDS.map((featureId) => [featureId, featureStatus(target, featureId, seed)])
    ),
    hooks: HOOK_CAPABILITIES[target],
    resources,
    unsupportedBlocks: UNSUPPORTED_BLOCKS[target] ?? [],
    mcpConfigPath: mcpConfig?.path ?? null,
    mcpConfigFormat: mcpConfig?.format ?? null,
  };
}

export function resolveTargetVersion(
  capability: TargetCapability,
  version: string | undefined
): string {
  const requested = version ?? capability.defaultVersion;
  const resolved = capability.versionAliases[requested] ?? requested;
  const defaultVersion =
    capability.versionAliases[capability.defaultVersion] ?? capability.defaultVersion;
  // Keep unknown version requests lenient: callers receive the target default.
  return capability.versions[resolved] ? resolved : defaultVersion;
}

export function getTargetFeatureStatus(
  capability: TargetCapability,
  featureId: string
): TargetFeatureStatus {
  return capability.featureSupport[featureId] ?? 'not-supported';
}

export function getTargetSectionCapability(
  capability: TargetCapability,
  sectionId: string
): TargetSectionCapability | undefined {
  return capability.sections[sectionId];
}

/**
 * Return actionable issues in a capability registry.
 *
 * This check is intentionally independent from formatter implementations so
 * core consumers can validate metadata without importing the formatter package.
 */
export function validateTargetCapabilities(
  capabilities: Readonly<Partial<Record<KnownTarget, TargetCapability>>>
): string[] {
  const issues: string[] = [];

  for (const target of KNOWN_TARGETS) {
    const capability = capabilities[target];
    if (!capability) {
      issues.push(`${target}: capability entry is missing`);
      continue;
    }

    const versions = capability.versions ?? {};
    const versionAliases = capability.versionAliases ?? {};
    const sections = capability.sections ?? {};
    const featureSupport = capability.featureSupport ?? {};
    const resources = capability.resources ?? [];
    const hookCapability = capability.hooks;
    const versionNames = Object.keys(versions);
    if (versionNames.length === 0) {
      issues.push(`${target}: no versions are declared`);
    }

    const defaultVersion = versionAliases[capability.defaultVersion] ?? capability.defaultVersion;
    if (!versions[defaultVersion]) {
      issues.push(`${target}: default version "${capability.defaultVersion}" is not declared`);
    }

    for (const [alias, version] of Object.entries(versionAliases)) {
      if (!versions[version]) {
        issues.push(`${target}: version alias "${alias}" points to "${version}"`);
      }
    }

    for (const [featureId, status] of Object.entries(featureSupport)) {
      if (
        status !== 'supported' &&
        status !== 'not-supported' &&
        status !== 'planned' &&
        status !== 'partial'
      ) {
        issues.push(`${target}: feature "${featureId}" has invalid status "${status}"`);
      }
    }
    for (const featureId of FEATURE_IDS) {
      if (!featureSupport[featureId]) {
        issues.push(`${target}: feature "${featureId}" is missing`);
      }
    }

    for (const sectionId of PARITY_SECTION_IDS) {
      if (!sections[sectionId]) {
        issues.push(`${target}: section "${sectionId}" is missing`);
      }
    }

    const resourcePaths = resources.map((resource) => resource.path);
    if (new Set(resourcePaths).size !== resourcePaths.length) {
      issues.push(`${target}: resource paths are duplicated`);
    }
    if (!resources.some((resource) => resource.kind === 'main')) {
      issues.push(`${target}: main output resource is missing`);
    }
    for (const resource of resources) {
      if (resource.path.trim().length === 0) {
        issues.push(`${target}: ${resource.kind} resource path is empty`);
      }
      if (resource.versions.length === 0) {
        issues.push(`${target}: ${resource.kind} resource has no versions`);
      }
      if (new Set(resource.versions).size !== resource.versions.length) {
        issues.push(`${target}: ${resource.kind} resource versions are duplicated`);
      }
      for (const version of resource.versions) {
        if (!versions[version]) {
          issues.push(`${target}: ${resource.kind} resource uses unknown version "${version}"`);
        }
      }
    }
    if (
      typeof capability.mcpConfigPath === 'string' &&
      !resources.some(
        (resource) => resource.kind === 'mcp' && resource.path === capability.mcpConfigPath
      )
    ) {
      issues.push(`${target}: MCP config resource is missing`);
    }
    if (capability.mcpConfigPath === null && capability.mcpConfigFormat !== null) {
      issues.push(`${target}: MCP config format is declared without a path`);
    }
    if (
      typeof hookCapability?.configPath === 'string' &&
      !resources.some(
        (resource) => resource.kind === 'hooks' && resource.path === hookCapability.configPath
      )
    ) {
      issues.push(`${target}: hook config resource is missing`);
    }

    if (!hookCapability) {
      issues.push(`${target}: hook capability is missing`);
    }
  }

  return issues;
}

/**
 * Throw when a capability registry contains missing or contradictory metadata.
 */
export function assertValidTargetCapabilities(
  capabilities: Readonly<Partial<Record<KnownTarget, TargetCapability>>>
): void {
  const issues = validateTargetCapabilities(capabilities);
  if (issues.length > 0) {
    throw new TargetCapabilitiesError(`Invalid target capability registry: ${issues.join('; ')}`);
  }
}
