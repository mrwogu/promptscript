import { describe, it, expect } from 'vitest';
import {
  SYNTAX_VERSIONS,
  getLatestSyntaxVersion,
  isKnownSyntaxVersion,
  getBlocksForVersion,
  getFeaturesForVersion,
  getMinimumVersionForBlock,
  getMinimumVersionForFeature,
  getSyntaxFeatureUsages,
  SYNTAX_FEATURES,
  usesSequentialOperations,
  type SyntaxFeature,
} from '../syntax-versions.js';
import type { Program } from '../types/ast.js';
import { BLOCK_TYPES } from '../types/constants.js';

describe('SYNTAX_VERSIONS', () => {
  it('should have 1.0.0 and 1.1.0 entries', () => {
    expect(SYNTAX_VERSIONS['1.0.0']).toBeDefined();
    expect(SYNTAX_VERSIONS['1.1.0']).toBeDefined();
  });

  it('should have cumulative block lists (1.1.0 includes all 1.0.0 blocks)', () => {
    const v100blocks = SYNTAX_VERSIONS['1.0.0']!.blocks;
    const v110blocks = SYNTAX_VERSIONS['1.1.0']!.blocks;
    for (const block of v100blocks) {
      expect(v110blocks).toContain(block);
    }
  });

  it('1.1.0 should add agents, workflows, prompts', () => {
    const v110blocks = SYNTAX_VERSIONS['1.1.0']!.blocks;
    expect(v110blocks).toContain('agents');
    expect(v110blocks).toContain('workflows');
    expect(v110blocks).toContain('prompts');
  });

  it('1.0.0 should NOT contain agents, workflows, prompts', () => {
    const v100blocks = SYNTAX_VERSIONS['1.0.0']!.blocks;
    expect(v100blocks).not.toContain('agents');
    expect(v100blocks).not.toContain('workflows');
    expect(v100blocks).not.toContain('prompts');
  });
});

describe('usesSequentialOperations', () => {
  const loc = { file: 'ordered.prs', line: 1, column: 1, offset: 0 };
  const program = (syntax: string): Program => ({
    type: 'Program',
    meta: {
      type: 'MetaBlock',
      fields: { id: 'ordered', syntax },
      loc,
    },
    uses: [],
    blocks: [],
    extends: [],
    overrides: [],
    loc,
  });

  it('enables ordered execution for syntax 1.5.0 and explicit overrides', () => {
    const legacyWithOverride = program('1.4.0');
    legacyWithOverride.overrides = [
      {
        type: 'OverrideBlock',
        targetPath: 'standards.testing',
        replacement: {
          type: 'ValueReplacement',
          value: {
            type: 'ScalarValueNode',
            value: true,
            loc,
          },
          loc,
        },
        loc,
      },
    ];

    expect(usesSequentialOperations(program('1.4.0'))).toBe(false);
    expect(usesSequentialOperations(program('1.5.0'))).toBe(true);
    expect(usesSequentialOperations(legacyWithOverride)).toBe(true);
  });

  it('does not treat partial or invalid versions as sequential', () => {
    expect(usesSequentialOperations(program('1.5'))).toBe(false);
    expect(usesSequentialOperations(program('invalid'))).toBe(false);
  });
});

describe('registry consistency', () => {
  it('latest version should contain ALL block types from BLOCK_TYPES', () => {
    const latest = getLatestSyntaxVersion();
    const latestBlocks = getBlocksForVersion(latest);
    for (const blockType of BLOCK_TYPES) {
      expect(latestBlocks).toContain(blockType);
    }
  });

  it('should keep blocks and syntax features cumulative across versions', () => {
    const versions = Object.keys(SYNTAX_VERSIONS);
    for (let index = 1; index < versions.length; index++) {
      const previous = SYNTAX_VERSIONS[versions[index - 1]!]!;
      const current = SYNTAX_VERSIONS[versions[index]!]!;
      for (const block of previous.blocks) {
        expect(current.blocks).toContain(block);
      }
      for (const feature of previous.features) {
        expect(current.features).toContain(feature);
      }
    }
  });
});

describe('getLatestSyntaxVersion', () => {
  it('should return the highest known version', () => {
    expect(getLatestSyntaxVersion()).toBe('1.5.0');
  });
});

describe('isKnownSyntaxVersion', () => {
  it('should return true for known versions', () => {
    expect(isKnownSyntaxVersion('1.0.0')).toBe(true);
    expect(isKnownSyntaxVersion('1.1.0')).toBe(true);
  });

  it('should return false for unknown versions', () => {
    expect(isKnownSyntaxVersion('1.4.7')).toBe(false);
    expect(isKnownSyntaxVersion('2.0.0')).toBe(false);
    expect(isKnownSyntaxVersion('0.0.1')).toBe(false);
  });
});

describe('getBlocksForVersion', () => {
  it('should return blocks for known version', () => {
    const blocks = getBlocksForVersion('1.0.0');
    expect(blocks).toContain('identity');
    expect(blocks).toContain('skills');
    expect(blocks).not.toContain('agents');
  });

  it('should return undefined for unknown version', () => {
    expect(getBlocksForVersion('9.9.9')).toBeUndefined();
  });
});

describe('getMinimumVersionForBlock', () => {
  it('should return 1.0.0 for base blocks', () => {
    expect(getMinimumVersionForBlock('identity')).toBe('1.0.0');
    expect(getMinimumVersionForBlock('skills')).toBe('1.0.0');
  });

  it('should return 1.1.0 for new blocks', () => {
    expect(getMinimumVersionForBlock('agents')).toBe('1.1.0');
    expect(getMinimumVersionForBlock('workflows')).toBe('1.1.0');
    expect(getMinimumVersionForBlock('prompts')).toBe('1.1.0');
  });

  it('should return undefined for unknown block names', () => {
    expect(getMinimumVersionForBlock('foobar')).toBeUndefined();
    expect(getMinimumVersionForBlock('my-custom-block')).toBeUndefined();
  });
});

describe('syntax feature capabilities', () => {
  it('should expose cumulative features by syntax version', () => {
    expect(getFeaturesForVersion('1.2.0')).toEqual([]);
    expect(getFeaturesForVersion('1.3.0')).toContain(SYNTAX_FEATURES.REGULAR_BLOCK_REPLACE);
    expect(getFeaturesForVersion('1.4.0')).toEqual([SYNTAX_FEATURES.REGULAR_BLOCK_REPLACE]);
    expect(getFeaturesForVersion('1.5.0')).toEqual([
      SYNTAX_FEATURES.REGULAR_BLOCK_REPLACE,
      SYNTAX_FEATURES.SECTION_HEADER_OVERRIDE,
      SYNTAX_FEATURES.EXPLICIT_OVERRIDE,
      SYNTAX_FEATURES.ENV_VAR_VALUE,
    ]);
    expect(getFeaturesForVersion('9.9.9')).toBeUndefined();
  });

  it('should return the minimum version for registered features', () => {
    expect(getMinimumVersionForFeature(SYNTAX_FEATURES.REGULAR_BLOCK_REPLACE)).toBe('1.3.0');
    expect(getMinimumVersionForFeature(SYNTAX_FEATURES.SECTION_HEADER_OVERRIDE)).toBe('1.5.0');
    expect(getMinimumVersionForFeature(SYNTAX_FEATURES.EXPLICIT_OVERRIDE)).toBe('1.5.0');
    expect(getMinimumVersionForFeature(SYNTAX_FEATURES.ENV_VAR_VALUE)).toBe('1.5.0');
    expect(getMinimumVersionForFeature('unknown-feature' as SyntaxFeature)).toBeUndefined();
  });

  it('should detect feature usage from explicit AST modifiers', () => {
    const loc = { file: 'test.prs', line: 3, column: 10 };
    const ast: Program = {
      type: 'Program',
      loc,
      uses: [],
      blocks: [],
      extends: [
        {
          type: 'ExtendBlock',
          targetPath: 'standards',
          content: { type: 'ObjectContent', properties: { testing: ['Vitest'] }, loc },
          replacements: [{ type: 'ReplaceModifier', property: 'testing', loc }],
          loc,
        },
      ],
      overrides: [
        {
          type: 'OverrideBlock',
          targetPath: 'standards.testing',
          replacement: {
            type: 'ValueReplacement',
            value: { type: 'ScalarValueNode', value: true, loc },
            loc,
          },
          loc,
        },
      ],
    };

    expect(getSyntaxFeatureUsages(ast)).toEqual([
      { feature: SYNTAX_FEATURES.REGULAR_BLOCK_REPLACE, location: loc },
      { feature: SYNTAX_FEATURES.EXPLICIT_OVERRIDE, location: loc },
    ]);
  });

  it('should deduplicate retained and explicit feature usage at the same location', () => {
    const loc = { file: 'test.prs', line: 3, column: 10, offset: 24 };
    const ast: Program = {
      type: 'Program',
      loc,
      uses: [],
      blocks: [],
      syntaxFeatures: [{ feature: SYNTAX_FEATURES.REGULAR_BLOCK_REPLACE, location: loc }],
      extends: [
        {
          type: 'ExtendBlock',
          targetPath: 'standards',
          content: { type: 'ObjectContent', properties: { testing: ['Vitest'] }, loc },
          replacements: [{ type: 'ReplaceModifier', property: 'testing', loc }],
          loc,
        },
      ],
    };

    expect(getSyntaxFeatureUsages(ast)).toEqual([
      { feature: SYNTAX_FEATURES.REGULAR_BLOCK_REPLACE, location: loc },
    ]);
  });
});
