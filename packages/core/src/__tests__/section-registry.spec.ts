import { describe, expect, it } from 'vitest';
import {
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
});
