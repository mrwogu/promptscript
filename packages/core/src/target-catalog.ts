/**
 * Canonical target catalog for PromptScript built-in targets.
 *
 * This module provides typed metadata for every built-in target, including
 * the canonical target name, default output path, target family, skill path
 * configuration, and default feature profile. The `KnownTarget` type and
 * `KNOWN_TARGETS` array remain in `config.ts` for backwards compatibility;
 * this catalog adds the metadata layer that formatters, the compiler, and
 * the Playground consume.
 *
 * @module target-catalog
 */

import type { KnownTarget } from './types/config.js';

/**
 * Target family classification.
 * - `base`: Formatters extending BaseFormatter directly (GitHub, Cursor, Claude, Antigravity)
 * - `markdown-instruction`: Formatters extending MarkdownInstructionFormatter
 * - `simple`: Formatters created via createSimpleMarkdownFormatter
 * - `agents-md-only`: Future AGENTS.md-only targets (Task 6)
 */
export type TargetFamily = 'base' | 'markdown-instruction' | 'simple' | 'agents-md-only';

/**
 * Skill path configuration for a target.
 * - `basePath`: Directory where skill files are written (e.g. '.claude/skills')
 * - `fileName`: Skill file name (e.g. 'SKILL.md' or 'skill.md')
 * - Both are null when the target does not support skills.
 */
export interface SkillPathConfig {
  basePath: string | null;
  fileName: string | null;
}

/**
 * Default feature profile for a target.
 * Used by the Playground to initialize target settings.
 */
export interface DefaultFeatureProfile {
  /** Whether the target is enabled by default in the Playground */
  defaultEnabled: boolean;
  /** Default version string for the Playground */
  defaultVersion: string;
  /** Whether the target supports skills */
  hasSkills: boolean;
  /** Whether the target supports agent definitions */
  hasAgents: boolean;
  /** Whether the target supports slash commands */
  hasCommands: boolean;
}

/**
 * Complete metadata for a single built-in target.
 */
export interface TargetDefinition {
  /** Canonical target name (matches KnownTarget union member) */
  name: KnownTarget;
  /** Default output file path */
  outputPath: string;
  /** Target family for classification */
  family: TargetFamily;
  /** Skill path configuration */
  skillPath: SkillPathConfig;
  /** Default feature profile */
  features: DefaultFeatureProfile;
}

/**
 * Canonical target definitions.
 * Adding a new built-in target requires adding one entry here and one entry
 * in BUILTIN_FORMATTERS (packages/formatters/src/builtin-formatters.ts).
 */
export const TARGET_DEFINITIONS = {
  // Original 7
  github: {
    name: 'github',
    outputPath: '.github/copilot-instructions.md',
    family: 'base',
    skillPath: { basePath: '.github/skills', fileName: 'SKILL.md' },
    features: {
      defaultEnabled: true,
      defaultVersion: 'full',
      hasSkills: true,
      hasAgents: true,
      hasCommands: true,
    },
  },
  claude: {
    name: 'claude',
    outputPath: 'CLAUDE.md',
    family: 'base',
    skillPath: { basePath: '.claude/skills', fileName: 'SKILL.md' },
    features: {
      defaultEnabled: true,
      defaultVersion: 'full',
      hasSkills: true,
      hasAgents: true,
      hasCommands: true,
    },
  },
  cursor: {
    name: 'cursor',
    outputPath: '.cursor/rules/project.mdc',
    family: 'base',
    skillPath: { basePath: null, fileName: null },
    features: {
      defaultEnabled: true,
      defaultVersion: 'standard',
      hasSkills: false,
      hasAgents: false,
      hasCommands: true,
    },
  },
  antigravity: {
    name: 'antigravity',
    outputPath: '.agent/rules/project.md',
    family: 'base',
    skillPath: { basePath: null, fileName: null },
    features: {
      defaultEnabled: true,
      defaultVersion: 'frontmatter',
      hasSkills: false,
      hasAgents: false,
      hasCommands: true,
    },
  },
  factory: {
    name: 'factory',
    outputPath: 'AGENTS.md',
    family: 'base',
    skillPath: { basePath: '.factory/skills', fileName: 'SKILL.md' },
    features: {
      defaultEnabled: false,
      defaultVersion: 'full',
      hasSkills: true,
      hasAgents: true,
      hasCommands: true,
    },
  },
  opencode: {
    name: 'opencode',
    outputPath: 'OPENCODE.md',
    family: 'base',
    skillPath: { basePath: '.opencode/skills', fileName: 'SKILL.md' },
    features: {
      defaultEnabled: false,
      defaultVersion: 'full',
      hasSkills: true,
      hasAgents: true,
      hasCommands: true,
    },
  },
  gemini: {
    name: 'gemini',
    outputPath: 'GEMINI.md',
    family: 'base',
    skillPath: { basePath: '.gemini/skills', fileName: 'skill.md' },
    features: {
      defaultEnabled: false,
      defaultVersion: 'full',
      hasSkills: true,
      hasAgents: false,
      hasCommands: true,
    },
  },
  // Tier 1
  windsurf: {
    name: 'windsurf',
    outputPath: '.windsurf/rules/project.md',
    family: 'simple',
    skillPath: { basePath: '.windsurf/skills', fileName: 'SKILL.md' },
    features: {
      defaultEnabled: false,
      defaultVersion: 'full',
      hasSkills: true,
      hasAgents: false,
      hasCommands: false,
    },
  },
  cline: {
    name: 'cline',
    outputPath: '.clinerules',
    family: 'simple',
    skillPath: { basePath: '.clinerules/skills', fileName: 'SKILL.md' },
    features: {
      defaultEnabled: false,
      defaultVersion: 'full',
      hasSkills: true,
      hasAgents: false,
      hasCommands: false,
    },
  },
  roo: {
    name: 'roo',
    outputPath: '.roorules',
    family: 'simple',
    skillPath: { basePath: '.roo/skills', fileName: 'SKILL.md' },
    features: {
      defaultEnabled: false,
      defaultVersion: 'full',
      hasSkills: true,
      hasAgents: false,
      hasCommands: false,
    },
  },
  codex: {
    name: 'codex',
    outputPath: 'AGENTS.md',
    family: 'simple',
    skillPath: { basePath: '.agents/skills', fileName: 'SKILL.md' },
    features: {
      defaultEnabled: false,
      defaultVersion: 'full',
      hasSkills: true,
      hasAgents: true,
      hasCommands: false,
    },
  },
  continue: {
    name: 'continue',
    outputPath: '.continue/rules/project.md',
    family: 'simple',
    skillPath: { basePath: '.continue/skills', fileName: 'SKILL.md' },
    features: {
      defaultEnabled: false,
      defaultVersion: 'full',
      hasSkills: true,
      hasAgents: false,
      hasCommands: false,
    },
  },
  // Tier 2
  augment: {
    name: 'augment',
    outputPath: '.augment/rules/project.md',
    family: 'simple',
    skillPath: { basePath: '.augment/skills', fileName: 'SKILL.md' },
    features: {
      defaultEnabled: false,
      defaultVersion: 'full',
      hasSkills: true,
      hasAgents: true,
      hasCommands: false,
    },
  },
  goose: {
    name: 'goose',
    outputPath: '.goosehints',
    family: 'simple',
    skillPath: { basePath: '.goose/skills', fileName: 'SKILL.md' },
    features: {
      defaultEnabled: false,
      defaultVersion: 'full',
      hasSkills: true,
      hasAgents: false,
      hasCommands: false,
    },
  },
  kilo: {
    name: 'kilo',
    outputPath: '.kilocode/rules/project.md',
    family: 'simple',
    skillPath: { basePath: '.kilocode/skills', fileName: 'SKILL.md' },
    features: {
      defaultEnabled: false,
      defaultVersion: 'full',
      hasSkills: true,
      hasAgents: false,
      hasCommands: false,
    },
  },
  amp: {
    name: 'amp',
    outputPath: 'AGENTS.md',
    family: 'simple',
    skillPath: { basePath: '.agents/skills', fileName: 'SKILL.md' },
    features: {
      defaultEnabled: false,
      defaultVersion: 'full',
      hasSkills: true,
      hasAgents: false,
      hasCommands: false,
    },
  },
  trae: {
    name: 'trae',
    outputPath: '.trae/rules/project_rules.md',
    family: 'simple',
    skillPath: { basePath: '.trae/skills', fileName: 'SKILL.md' },
    features: {
      defaultEnabled: false,
      defaultVersion: 'full',
      hasSkills: true,
      hasAgents: false,
      hasCommands: false,
    },
  },
  junie: {
    name: 'junie',
    outputPath: '.junie/guidelines.md',
    family: 'simple',
    skillPath: { basePath: '.junie/skills', fileName: 'SKILL.md' },
    features: {
      defaultEnabled: false,
      defaultVersion: 'full',
      hasSkills: true,
      hasAgents: false,
      hasCommands: false,
    },
  },
  kiro: {
    name: 'kiro',
    outputPath: '.kiro/steering/project.md',
    family: 'simple',
    skillPath: { basePath: '.kiro/skills', fileName: 'SKILL.md' },
    features: {
      defaultEnabled: false,
      defaultVersion: 'full',
      hasSkills: true,
      hasAgents: false,
      hasCommands: false,
    },
  },
  // Tier 3
  cortex: {
    name: 'cortex',
    outputPath: '.cortex/rules/project.md',
    family: 'simple',
    skillPath: { basePath: '.cortex/skills', fileName: 'SKILL.md' },
    features: {
      defaultEnabled: false,
      defaultVersion: 'full',
      hasSkills: true,
      hasAgents: false,
      hasCommands: false,
    },
  },
  crush: {
    name: 'crush',
    outputPath: 'AGENTS.md',
    family: 'simple',
    skillPath: { basePath: '.crush/skills', fileName: 'SKILL.md' },
    features: {
      defaultEnabled: false,
      defaultVersion: 'full',
      hasSkills: true,
      hasAgents: false,
      hasCommands: false,
    },
  },
  'command-code': {
    name: 'command-code',
    outputPath: '.commandcode/rules/project.md',
    family: 'simple',
    skillPath: { basePath: '.commandcode/skills', fileName: 'SKILL.md' },
    features: {
      defaultEnabled: false,
      defaultVersion: 'full',
      hasSkills: true,
      hasAgents: false,
      hasCommands: true,
    },
  },
  kode: {
    name: 'kode',
    outputPath: '.kode/rules/project.md',
    family: 'simple',
    skillPath: { basePath: '.kode/skills', fileName: 'SKILL.md' },
    features: {
      defaultEnabled: false,
      defaultVersion: 'full',
      hasSkills: true,
      hasAgents: false,
      hasCommands: false,
    },
  },
  mcpjam: {
    name: 'mcpjam',
    outputPath: '.mcpjam/rules/project.md',
    family: 'simple',
    skillPath: { basePath: '.mcpjam/skills', fileName: 'SKILL.md' },
    features: {
      defaultEnabled: false,
      defaultVersion: 'full',
      hasSkills: true,
      hasAgents: false,
      hasCommands: false,
    },
  },
  'mistral-vibe': {
    name: 'mistral-vibe',
    outputPath: '.vibe/rules/project.md',
    family: 'simple',
    skillPath: { basePath: '.vibe/skills', fileName: 'SKILL.md' },
    features: {
      defaultEnabled: false,
      defaultVersion: 'full',
      hasSkills: true,
      hasAgents: false,
      hasCommands: false,
    },
  },
  mux: {
    name: 'mux',
    outputPath: '.mux/rules/project.md',
    family: 'simple',
    skillPath: { basePath: '.mux/skills', fileName: 'SKILL.md' },
    features: {
      defaultEnabled: false,
      defaultVersion: 'full',
      hasSkills: true,
      hasAgents: false,
      hasCommands: false,
    },
  },
  openhands: {
    name: 'openhands',
    outputPath: '.openhands/rules/project.md',
    family: 'simple',
    skillPath: { basePath: '.openhands/skills', fileName: 'SKILL.md' },
    features: {
      defaultEnabled: false,
      defaultVersion: 'full',
      hasSkills: true,
      hasAgents: false,
      hasCommands: false,
    },
  },
  pi: {
    name: 'pi',
    outputPath: '.pi/rules/project.md',
    family: 'simple',
    skillPath: { basePath: '.pi/skills', fileName: 'SKILL.md' },
    features: {
      defaultEnabled: false,
      defaultVersion: 'full',
      hasSkills: true,
      hasAgents: false,
      hasCommands: false,
    },
  },
  qoder: {
    name: 'qoder',
    outputPath: '.qoder/rules/project.md',
    family: 'simple',
    skillPath: { basePath: '.qoder/skills', fileName: 'SKILL.md' },
    features: {
      defaultEnabled: false,
      defaultVersion: 'full',
      hasSkills: true,
      hasAgents: false,
      hasCommands: false,
    },
  },
  'qwen-code': {
    name: 'qwen-code',
    outputPath: '.qwen/rules/project.md',
    family: 'simple',
    skillPath: { basePath: '.qwen/skills', fileName: 'SKILL.md' },
    features: {
      defaultEnabled: false,
      defaultVersion: 'full',
      hasSkills: true,
      hasAgents: false,
      hasCommands: false,
    },
  },
  zencoder: {
    name: 'zencoder',
    outputPath: '.zencoder/rules/project.md',
    family: 'simple',
    skillPath: { basePath: '.zencoder/skills', fileName: 'SKILL.md' },
    features: {
      defaultEnabled: false,
      defaultVersion: 'full',
      hasSkills: true,
      hasAgents: false,
      hasCommands: false,
    },
  },
  neovate: {
    name: 'neovate',
    outputPath: '.neovate/rules/project.md',
    family: 'simple',
    skillPath: { basePath: '.neovate/skills', fileName: 'SKILL.md' },
    features: {
      defaultEnabled: false,
      defaultVersion: 'full',
      hasSkills: true,
      hasAgents: false,
      hasCommands: false,
    },
  },
  pochi: {
    name: 'pochi',
    outputPath: '.pochi/rules/project.md',
    family: 'simple',
    skillPath: { basePath: '.pochi/skills', fileName: 'SKILL.md' },
    features: {
      defaultEnabled: false,
      defaultVersion: 'full',
      hasSkills: true,
      hasAgents: false,
      hasCommands: false,
    },
  },
  adal: {
    name: 'adal',
    outputPath: '.adal/rules/project.md',
    family: 'simple',
    skillPath: { basePath: '.adal/skills', fileName: 'SKILL.md' },
    features: {
      defaultEnabled: false,
      defaultVersion: 'full',
      hasSkills: true,
      hasAgents: false,
      hasCommands: false,
    },
  },
  iflow: {
    name: 'iflow',
    outputPath: '.iflow/rules/project.md',
    family: 'simple',
    skillPath: { basePath: '.iflow/skills', fileName: 'SKILL.md' },
    features: {
      defaultEnabled: false,
      defaultVersion: 'full',
      hasSkills: true,
      hasAgents: false,
      hasCommands: false,
    },
  },
  openclaw: {
    name: 'openclaw',
    outputPath: 'INSTRUCTIONS.md',
    family: 'simple',
    skillPath: { basePath: '.openclaw/skills', fileName: 'SKILL.md' },
    features: {
      defaultEnabled: false,
      defaultVersion: 'full',
      hasSkills: true,
      hasAgents: false,
      hasCommands: false,
    },
  },
  codebuddy: {
    name: 'codebuddy',
    outputPath: '.codebuddy/rules/project.md',
    family: 'simple',
    skillPath: { basePath: '.codebuddy/skills', fileName: 'SKILL.md' },
    features: {
      defaultEnabled: false,
      defaultVersion: 'full',
      hasSkills: true,
      hasAgents: false,
      hasCommands: false,
    },
  },
  // AGENTS.md-only targets
  aider: {
    name: 'aider',
    outputPath: 'AGENTS.md',
    family: 'agents-md-only',
    skillPath: { basePath: null, fileName: null },
    features: {
      defaultEnabled: false,
      defaultVersion: 'full',
      hasSkills: false,
      hasAgents: false,
      hasCommands: false,
    },
  },
  'amazon-q': {
    name: 'amazon-q',
    outputPath: 'AGENTS.md',
    family: 'agents-md-only',
    skillPath: { basePath: null, fileName: null },
    features: {
      defaultEnabled: false,
      defaultVersion: 'full',
      hasSkills: false,
      hasAgents: false,
      hasCommands: false,
    },
  },
  warp: {
    name: 'warp',
    outputPath: 'AGENTS.md',
    family: 'agents-md-only',
    skillPath: { basePath: null, fileName: null },
    features: {
      defaultEnabled: false,
      defaultVersion: 'full',
      hasSkills: false,
      hasAgents: false,
      hasCommands: false,
    },
  },
  zed: {
    name: 'zed',
    outputPath: 'AGENTS.md',
    family: 'agents-md-only',
    skillPath: { basePath: null, fileName: null },
    features: {
      defaultEnabled: false,
      defaultVersion: 'full',
      hasSkills: false,
      hasAgents: false,
      hasCommands: false,
    },
  },
  jules: {
    name: 'jules',
    outputPath: 'AGENTS.md',
    family: 'agents-md-only',
    skillPath: { basePath: null, fileName: null },
    features: {
      defaultEnabled: false,
      defaultVersion: 'full',
      hasSkills: false,
      hasAgents: false,
      hasCommands: false,
    },
  },
  devin: {
    name: 'devin',
    outputPath: 'AGENTS.md',
    family: 'agents-md-only',
    skillPath: { basePath: null, fileName: null },
    features: {
      defaultEnabled: false,
      defaultVersion: 'full',
      hasSkills: false,
      hasAgents: false,
      hasCommands: false,
    },
  },
  grok: {
    name: 'grok',
    outputPath: 'AGENTS.md',
    family: 'base',
    skillPath: { basePath: '.claude/skills', fileName: 'SKILL.md' },
    features: {
      defaultEnabled: false,
      defaultVersion: 'full',
      hasSkills: true,
      hasAgents: true,
      hasCommands: true,
    },
  },
  // Priority B CLI agents
  kimi: {
    name: 'kimi',
    outputPath: 'AGENTS.md',
    family: 'agents-md-only',
    skillPath: { basePath: '.kimi/skills', fileName: 'SKILL.md' },
    features: {
      defaultEnabled: false,
      defaultVersion: 'simple',
      hasSkills: false,
      hasAgents: false,
      hasCommands: false,
    },
  },
  mimo: {
    name: 'mimo',
    outputPath: 'AGENTS.md',
    family: 'agents-md-only',
    skillPath: { basePath: '.agents/skills', fileName: 'SKILL.md' },
    features: {
      defaultEnabled: false,
      defaultVersion: 'simple',
      hasSkills: false,
      hasAgents: false,
      hasCommands: false,
    },
  },
  'deep-agents': {
    name: 'deep-agents',
    outputPath: 'AGENTS.md',
    family: 'agents-md-only',
    skillPath: { basePath: '.agents/skills', fileName: 'SKILL.md' },
    features: {
      defaultEnabled: false,
      defaultVersion: 'simple',
      hasSkills: false,
      hasAgents: false,
      hasCommands: false,
    },
  },
  forgecode: {
    name: 'forgecode',
    outputPath: 'AGENTS.md',
    family: 'agents-md-only',
    skillPath: { basePath: '.forge/skills', fileName: 'SKILL.md' },
    features: {
      defaultEnabled: false,
      defaultVersion: 'simple',
      hasSkills: false,
      hasAgents: false,
      hasCommands: false,
    },
  },
} as const satisfies Record<KnownTarget, TargetDefinition>;

/**
 * Get the target definition for a known target.
 * @param name - The target name
 * @returns The target definition
 * @throws {Error} if the target name is not a known target
 */
export function getTargetDefinition(name: KnownTarget): TargetDefinition {
  const def = TARGET_DEFINITIONS[name];
  if (!def) {
    throw new Error(`Unknown target: ${name}`);
  }
  return def;
}

/**
 * Get the default output path for a known target.
 * @param name - The target name
 * @returns The default output path
 */
export function getDefaultOutputPath(name: KnownTarget): string {
  return getTargetDefinition(name).outputPath;
}

/**
 * Get the skill path configuration for a known target.
 * @param name - The target name
 * @returns The skill path configuration (basePath and fileName are null if unsupported)
 */
export function getTargetSkillPath(name: KnownTarget): SkillPathConfig {
  return getTargetDefinition(name).skillPath;
}

/**
 * Get the default feature profile for a known target.
 * @param name - The target name
 * @returns The default feature profile
 */
export function getTargetFeatures(name: KnownTarget): DefaultFeatureProfile {
  return getTargetDefinition(name).features;
}
