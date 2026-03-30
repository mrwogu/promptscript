import { describe, it, expect } from 'vitest';
import { parseSkillMd } from '../skills.js';

describe('skill references', () => {
  describe('parseSkillMd with references', () => {
    it('should parse references from SKILL.md frontmatter', () => {
      const content = [
        '---',
        'name: test-skill',
        'description: A test skill',
        'references:',
        '  - references/architecture.md',
        '  - references/modules.md',
        '---',
        'Skill content here.',
      ].join('\n');

      const result = parseSkillMd(content);

      expect(result.name).toBe('test-skill');
      expect(result.references).toEqual(['references/architecture.md', 'references/modules.md']);
    });

    it('should return undefined references when not specified', () => {
      const content = [
        '---',
        'name: test-skill',
        'description: A test skill',
        '---',
        'Skill content here.',
      ].join('\n');

      const result = parseSkillMd(content);

      expect(result.references).toBeUndefined();
    });

    it('should parse empty references list', () => {
      const content = ['---', 'name: test-skill', 'references:', '---', 'Content.'].join('\n');

      const result = parseSkillMd(content);

      expect(result.references).toEqual([]);
    });
  });
});
