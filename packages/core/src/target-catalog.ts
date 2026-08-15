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

import { KNOWN_TARGETS, type KnownTarget } from './types/config.js';
import { DEFAULT_OUTPUT_PATHS } from './target-output-paths.js';
import {
  createTargetCapability,
  assertValidTargetCapabilities,
  TARGET_DELEGATES,
  TargetCapabilitiesError,
  type TargetCapability,
} from './target-capabilities.js';

/**
 * Target family classification.
 * - `base`: Formatters extending BaseFormatter directly (GitHub, Cursor, Claude, Antigravity)
 * - `markdown-instruction`: Formatters extending MarkdownInstructionFormatter
 * - `simple`: Formatters created via createSimpleMarkdownFormatter
 * - `agents-md-only`: Targets using the project-local AGENTS.md contract
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
export interface TargetDefinition extends TargetCapability {
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

interface TargetDefinitionBase {
  name: KnownTarget;
  outputPath: string;
  family: TargetFamily;
  skillPath: SkillPathConfig;
  features: DefaultFeatureProfile;
}

/**
 * Canonical target definitions.
 * Adding a new built-in target requires adding one entry here and one entry
 * in BUILTIN_FORMATTERS (packages/formatters/src/builtin-formatters.ts).
 */
const TARGET_DEFINITION_BASE = {
  // Original 7
  github: {
    name: 'github',
    outputPath: DEFAULT_OUTPUT_PATHS['github'],
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
    outputPath: DEFAULT_OUTPUT_PATHS['claude'],
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
    outputPath: DEFAULT_OUTPUT_PATHS['cursor'],
    family: 'base',
    skillPath: { basePath: '.agents/skills', fileName: 'SKILL.md' },
    features: {
      defaultEnabled: true,
      defaultVersion: 'standard',
      hasSkills: true,
      hasAgents: true,
      hasCommands: true,
    },
  },
  antigravity: {
    name: 'antigravity',
    outputPath: DEFAULT_OUTPUT_PATHS['antigravity'],
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
    outputPath: DEFAULT_OUTPUT_PATHS['factory'],
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
    outputPath: DEFAULT_OUTPUT_PATHS['opencode'],
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
    outputPath: DEFAULT_OUTPUT_PATHS['gemini'],
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
    outputPath: DEFAULT_OUTPUT_PATHS['windsurf'],
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
    outputPath: DEFAULT_OUTPUT_PATHS['cline'],
    family: 'simple',
    skillPath: { basePath: null, fileName: null },
    features: {
      defaultEnabled: false,
      defaultVersion: 'full',
      hasSkills: false,
      hasAgents: false,
      hasCommands: false,
    },
  },
  roo: {
    name: 'roo',
    outputPath: DEFAULT_OUTPUT_PATHS['roo'],
    family: 'simple',
    skillPath: { basePath: null, fileName: null },
    features: {
      defaultEnabled: false,
      defaultVersion: 'full',
      hasSkills: false,
      hasAgents: false,
      hasCommands: false,
    },
  },
  codex: {
    name: 'codex',
    outputPath: DEFAULT_OUTPUT_PATHS['codex'],
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
    outputPath: DEFAULT_OUTPUT_PATHS['continue'],
    family: 'simple',
    skillPath: { basePath: null, fileName: null },
    features: {
      defaultEnabled: false,
      defaultVersion: 'full',
      hasSkills: false,
      hasAgents: false,
      hasCommands: false,
    },
  },
  // Tier 2
  augment: {
    name: 'augment',
    outputPath: DEFAULT_OUTPUT_PATHS['augment'],
    family: 'simple',
    skillPath: { basePath: null, fileName: null },
    features: {
      defaultEnabled: false,
      defaultVersion: 'full',
      hasSkills: false,
      hasAgents: true,
      hasCommands: false,
    },
  },
  goose: {
    name: 'goose',
    outputPath: DEFAULT_OUTPUT_PATHS['goose'],
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
    outputPath: DEFAULT_OUTPUT_PATHS['kilo'],
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
    outputPath: DEFAULT_OUTPUT_PATHS['amp'],
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
  trae: {
    name: 'trae',
    outputPath: DEFAULT_OUTPUT_PATHS['trae'],
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
    outputPath: DEFAULT_OUTPUT_PATHS['junie'],
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
    outputPath: DEFAULT_OUTPUT_PATHS['kiro'],
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
    outputPath: DEFAULT_OUTPUT_PATHS['cortex'],
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
    outputPath: DEFAULT_OUTPUT_PATHS['crush'],
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
    outputPath: DEFAULT_OUTPUT_PATHS['command-code'],
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
    outputPath: DEFAULT_OUTPUT_PATHS['kode'],
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
    outputPath: DEFAULT_OUTPUT_PATHS['mcpjam'],
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
    outputPath: DEFAULT_OUTPUT_PATHS['mistral-vibe'],
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
    outputPath: DEFAULT_OUTPUT_PATHS['mux'],
    family: 'simple',
    skillPath: { basePath: null, fileName: null },
    features: {
      defaultEnabled: false,
      defaultVersion: 'full',
      hasSkills: false,
      hasAgents: false,
      hasCommands: false,
    },
  },
  openhands: {
    name: 'openhands',
    outputPath: DEFAULT_OUTPUT_PATHS['openhands'],
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
    outputPath: DEFAULT_OUTPUT_PATHS['pi'],
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
    outputPath: DEFAULT_OUTPUT_PATHS['qoder'],
    family: 'simple',
    skillPath: { basePath: null, fileName: null },
    features: {
      defaultEnabled: false,
      defaultVersion: 'full',
      hasSkills: false,
      hasAgents: false,
      hasCommands: false,
    },
  },
  'qwen-code': {
    name: 'qwen-code',
    outputPath: DEFAULT_OUTPUT_PATHS['qwen-code'],
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
    outputPath: DEFAULT_OUTPUT_PATHS['zencoder'],
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
    outputPath: DEFAULT_OUTPUT_PATHS['neovate'],
    family: 'simple',
    skillPath: { basePath: null, fileName: null },
    features: {
      defaultEnabled: false,
      defaultVersion: 'full',
      hasSkills: false,
      hasAgents: false,
      hasCommands: false,
    },
  },
  pochi: {
    name: 'pochi',
    outputPath: DEFAULT_OUTPUT_PATHS['pochi'],
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
    outputPath: DEFAULT_OUTPUT_PATHS['adal'],
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
    outputPath: DEFAULT_OUTPUT_PATHS['iflow'],
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
    outputPath: DEFAULT_OUTPUT_PATHS['openclaw'],
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
    outputPath: DEFAULT_OUTPUT_PATHS['codebuddy'],
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
    outputPath: DEFAULT_OUTPUT_PATHS['aider'],
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
    outputPath: DEFAULT_OUTPUT_PATHS['amazon-q'],
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
    outputPath: DEFAULT_OUTPUT_PATHS['warp'],
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
    outputPath: DEFAULT_OUTPUT_PATHS['zed'],
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
    outputPath: DEFAULT_OUTPUT_PATHS['jules'],
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
    outputPath: DEFAULT_OUTPUT_PATHS['devin'],
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
    outputPath: DEFAULT_OUTPUT_PATHS['grok'],
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
    outputPath: DEFAULT_OUTPUT_PATHS['kimi'],
    family: 'agents-md-only',
    skillPath: { basePath: null, fileName: null },
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
    outputPath: DEFAULT_OUTPUT_PATHS['mimo'],
    family: 'agents-md-only',
    skillPath: { basePath: null, fileName: null },
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
    outputPath: DEFAULT_OUTPUT_PATHS['deep-agents'],
    family: 'agents-md-only',
    skillPath: { basePath: null, fileName: null },
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
    outputPath: DEFAULT_OUTPUT_PATHS['forgecode'],
    family: 'agents-md-only',
    skillPath: { basePath: null, fileName: null },
    features: {
      defaultEnabled: false,
      defaultVersion: 'simple',
      hasSkills: false,
      hasAgents: false,
      hasCommands: false,
    },
  },
  hermes: {
    name: 'hermes',
    outputPath: DEFAULT_OUTPUT_PATHS['hermes'],
    family: 'agents-md-only',
    skillPath: { basePath: null, fileName: null },
    features: {
      defaultEnabled: false,
      defaultVersion: 'simple',
      hasSkills: false,
      hasAgents: false,
      hasCommands: false,
    },
  },
} as const satisfies Record<KnownTarget, TargetDefinitionBase>;

/**
 * Complete target definitions with version, section, feature, hook, and
 * resource capabilities attached to the compatibility catalog.
 */
export const TARGET_DEFINITIONS = Object.fromEntries(
  KNOWN_TARGETS.map((name) => [
    name,
    {
      ...TARGET_DEFINITION_BASE[name],
      ...createTargetCapability(name, TARGET_DEFINITION_BASE[name]),
    },
  ])
) as { readonly [Name in KnownTarget]: TargetDefinition };

/**
 * Capability-only view of the canonical target definitions.
 */
export const TARGET_CAPABILITIES = TARGET_DEFINITIONS as {
  readonly [Name in KnownTarget]: TargetCapability;
};

assertValidTargetCapabilities(TARGET_CAPABILITIES);

/**
 * Return contradictions between the target catalog and its capability data.
 */
export function validateTargetDefinitionConsistency(
  definitions: Readonly<Record<KnownTarget, TargetDefinition>> = TARGET_DEFINITIONS
): string[] {
  const issues: string[] = [];

  for (const target of KNOWN_TARGETS) {
    const definition = definitions[target];
    if (definition.name !== target) {
      issues.push(`${target}: definition name is "${definition.name}"`);
    }
    if (definition.outputPath !== DEFAULT_OUTPUT_PATHS[target]) {
      issues.push(`${target}: output path does not match the canonical path map`);
    }
    if (definition.features.hasSkills !== (definition.skillPath.basePath !== null)) {
      issues.push(`${target}: skill feature flag does not match the skill path`);
    }
    const resolvedDefault =
      definition.versionAliases[definition.features.defaultVersion] ??
      definition.features.defaultVersion;
    if (!definition.versions[resolvedDefault]) {
      issues.push(
        `${target}: default version "${definition.features.defaultVersion}" is not supported`
      );
    }
    if (definition.featureSupport['skills'] === 'supported' && !definition.features.hasSkills) {
      issues.push(`${target}: skills are marked supported without a skill path`);
    }
    if (
      definition.featureSupport['agent-instructions'] === 'supported' &&
      !definition.features.hasAgents
    ) {
      issues.push(`${target}: agent instructions are marked supported without agent output`);
    }
    if (
      definition.featureSupport['slash-commands'] === 'supported' &&
      !definition.features.hasCommands
    ) {
      issues.push(`${target}: slash commands are marked supported without command output`);
    }
  }

  for (const [target, delegate] of Object.entries(TARGET_DELEGATES)) {
    const targetDefinition = definitions[target as KnownTarget];
    const delegateDefinition = definitions[delegate as KnownTarget];
    if (!targetDefinition || !delegateDefinition) continue;

    for (const [featureId, status] of Object.entries(delegateDefinition.featureSupport)) {
      if (targetDefinition.featureSupport[featureId] !== status) {
        issues.push(
          `${target}: feature "${featureId}" differs from delegated target "${delegate}"`
        );
      }
    }
  }

  return issues;
}

/**
 * Throw when target definitions contradict the canonical output and feature metadata.
 */
export function assertTargetDefinitionConsistency(
  definitions: Readonly<Record<KnownTarget, TargetDefinition>> = TARGET_DEFINITIONS
): void {
  const issues = validateTargetDefinitionConsistency(definitions);
  if (issues.length > 0) {
    throw new TargetCapabilitiesError(`Inconsistent target catalog: ${issues.join('; ')}`);
  }
}

assertTargetDefinitionConsistency();

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
 * Get the complete capability contract for a known target.
 *
 * @param name - The target name
 * @returns The target capability contract
 */
export function getTargetCapability(name: KnownTarget): TargetCapability {
  return TARGET_CAPABILITIES[name];
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
