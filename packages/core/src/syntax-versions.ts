import { compareVersions } from './utils/version.js';
import type { Program, SourceLocation } from './types/index.js';

/**
 * Syntax features that are versioned independently from block availability.
 */
export const SYNTAX_FEATURES = {
  REGULAR_BLOCK_REPLACE: 'regular-block-replace',
} as const;

export type SyntaxFeature = (typeof SYNTAX_FEATURES)[keyof typeof SYNTAX_FEATURES];

/**
 * A syntax feature found in a parsed program.
 */
export interface SyntaxFeatureUsage {
  feature: SyntaxFeature;
  location: SourceLocation;
}

/**
 * Definition of a syntax version's capabilities.
 * Block lists are cumulative — each version includes all blocks from prior versions.
 */
export interface SyntaxVersionDef {
  /** All block types valid for this version (cumulative, not delta) */
  readonly blocks: readonly string[];
  /** All non-block syntax features valid for this version (cumulative, not delta) */
  readonly features: readonly SyntaxFeature[];
}

/**
 * Registry of known PromptScript syntax versions and their supported blocks.
 */
export const SYNTAX_VERSIONS: Readonly<Record<string, SyntaxVersionDef>> = {
  '1.0.0': {
    blocks: [
      'identity',
      'context',
      'standards',
      'restrictions',
      'knowledge',
      'shortcuts',
      'commands',
      'guards',
      'params',
      'skills',
      'local',
    ],
    features: [],
  },
  '1.1.0': {
    blocks: [
      'identity',
      'context',
      'standards',
      'restrictions',
      'knowledge',
      'shortcuts',
      'commands',
      'guards',
      'params',
      'skills',
      'local',
      'agents',
      'workflows',
      'prompts',
    ],
    features: [],
  },
  '1.2.0': {
    blocks: [
      'identity',
      'context',
      'standards',
      'restrictions',
      'knowledge',
      'shortcuts',
      'commands',
      'guards',
      'params',
      'skills',
      'local',
      'agents',
      'workflows',
      'prompts',
      'examples',
    ],
    features: [],
  },
  '1.3.0': {
    blocks: [
      'identity',
      'context',
      'standards',
      'restrictions',
      'knowledge',
      'shortcuts',
      'commands',
      'guards',
      'params',
      'skills',
      'local',
      'agents',
      'workflows',
      'prompts',
      'examples',
    ],
    features: [SYNTAX_FEATURES.REGULAR_BLOCK_REPLACE],
  },
};

/** Latest known syntax version. */
export const LATEST_SYNTAX_VERSION = '1.3.0';

/**
 * Get the latest known syntax version.
 */
export function getLatestSyntaxVersion(): string {
  return LATEST_SYNTAX_VERSION;
}

/**
 * Check if a version string is a known syntax version.
 */
export function isKnownSyntaxVersion(version: string): boolean {
  return version in SYNTAX_VERSIONS;
}

/**
 * Get the list of valid blocks for a known syntax version.
 * @returns Block list, or undefined if version is unknown
 */
export function getBlocksForVersion(version: string): readonly string[] | undefined {
  return SYNTAX_VERSIONS[version]?.blocks;
}

/**
 * Get the list of non-block syntax features for a known syntax version.
 * @returns Feature list, or undefined if version is unknown
 */
export function getFeaturesForVersion(version: string): readonly SyntaxFeature[] | undefined {
  return SYNTAX_VERSIONS[version]?.features;
}

/**
 * Get the minimum syntax version that supports a given block type.
 * @returns Version string, or undefined if the block is not in any known version
 */
export function getMinimumVersionForBlock(blockName: string): string | undefined {
  const versions = Object.keys(SYNTAX_VERSIONS).sort((a, b) => compareVersions(a, b));
  for (const version of versions) {
    if (SYNTAX_VERSIONS[version]!.blocks.includes(blockName)) {
      return version;
    }
  }
  return undefined;
}

/**
 * Get the minimum syntax version that supports a non-block feature.
 * @returns Version string, or undefined if the feature is not registered
 */
export function getMinimumVersionForFeature(feature: SyntaxFeature): string | undefined {
  const versions = Object.keys(SYNTAX_VERSIONS).sort((a, b) => compareVersions(a, b));
  for (const version of versions) {
    if (SYNTAX_VERSIONS[version]!.features.includes(feature)) {
      return version;
    }
  }
  return undefined;
}

/**
 * Find all versioned non-block syntax features used by a parsed program.
 */
export function getSyntaxFeatureUsages(ast: Program): SyntaxFeatureUsage[] {
  const usages: SyntaxFeatureUsage[] = [...(ast.syntaxFeatures ?? [])];
  for (const ext of ast.extends) {
    for (const modifier of ext.replacements ?? []) {
      usages.push({
        feature: SYNTAX_FEATURES.REGULAR_BLOCK_REPLACE,
        location: modifier.loc,
      });
    }
  }

  const seen = new Set<string>();
  return usages.filter((usage) => {
    const { file, line, column, offset } = usage.location;
    const key = `${usage.feature}\0${file}\0${line}\0${column}\0${offset ?? ''}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
