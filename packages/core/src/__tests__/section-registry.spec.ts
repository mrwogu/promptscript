import { describe, expect, it } from 'vitest';
import {
  SECTION_PROFILES,
  SECTION_REGISTRY,
  blockOwnsSection,
  getPrimarySectionForBlock,
  getSectionContract,
  getSectionsForBlock,
} from '../section-registry.js';

describe('section registry', () => {
  it('should expose unique canonical IDs and formatter aliases', () => {
    const ids = SECTION_REGISTRY.map((section) => section.id);
    const aliases = SECTION_REGISTRY.flatMap((section) => section.formatterAliases);

    expect(new Set(ids).size).toBe(ids.length);
    expect(getSectionContract('git-commits')?.id).toBe('git-commits');
    expect(getSectionContract('gitCommits')?.id).toBe('git-commits');
    expect(new Set(aliases).size).toBe(aliases.length);
  });

  it('should define primary and derived sections per owner block', () => {
    expect(getPrimarySectionForBlock('standards')?.id).toBe('code-standards');
    expect(getPrimarySectionForBlock('context')?.id).toBe('context');
    expect(getSectionsForBlock('standards').map((section) => section.id)).toEqual([
      'tech-stack',
      'code-standards',
      'git-commits',
      'configuration-files',
      'documentation',
      'diagrams',
    ]);
    expect(blockOwnsSection('knowledge', 'commands')).toBe(true);
    expect(blockOwnsSection('identity', 'git-commits')).toBe(false);
  });

  describe('profiles', () => {
    it('should use the existing registry for the coding profile', () => {
      expect(SECTION_PROFILES.coding).toBe(SECTION_REGISTRY);
    });

    it('should list five optional sections without an identity heading in the general profile', () => {
      const general = SECTION_PROFILES.general;

      expect(general.map((section) => section.id)).toEqual([
        'context',
        'knowledge',
        'standards',
        'restrictions',
        'examples',
      ]);
      expect(general.every((section) => !section.required)).toBe(true);
      expect(general.some((section) => section.primaryForBlocks.includes('identity'))).toBe(false);
    });
  });
});
