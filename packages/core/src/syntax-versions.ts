import { compareVersions } from './utils/version.js';

/**
 * Definition of a syntax version's capabilities.
 * Block lists are cumulative — each version includes all blocks from prior versions.
 */
export interface SyntaxVersionDef {
  /** All block types valid for this version (cumulative, not delta) */
  readonly blocks: readonly string[];
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
  },
};

/** Latest known syntax version. */
export const LATEST_SYNTAX_VERSION = '1.2.0';

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
