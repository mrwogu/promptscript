import { describe, it, expect } from 'vitest';
import {
  SYNTAX_VERSIONS,
  getLatestSyntaxVersion,
  isKnownSyntaxVersion,
  getBlocksForVersion,
  getMinimumVersionForBlock,
} from '../syntax-versions.js';
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

describe('registry consistency', () => {
  it('latest version should contain ALL block types from BLOCK_TYPES', () => {
    const latest = getLatestSyntaxVersion();
    const latestBlocks = getBlocksForVersion(latest);
    for (const blockType of BLOCK_TYPES) {
      expect(latestBlocks).toContain(blockType);
    }
  });
});

describe('getLatestSyntaxVersion', () => {
  it('should return the highest known version', () => {
    expect(getLatestSyntaxVersion()).toBe('1.1.0');
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
