import { describe, expect, it } from 'vitest';
import {
  KNOWN_SECTIONS,
  getExpectedSections,
  extractSectionsFromOutput,
  findMissingSections,
  normalizeSectionName,
} from '../section-registry.js';

describe('Section Registry', () => {
  describe('KNOWN_SECTIONS', () => {
    it('should have unique section IDs', () => {
      const ids = KNOWN_SECTIONS.map((s) => s.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have required fields for each section', () => {
      for (const section of KNOWN_SECTIONS) {
        expect(section.id).toBeDefined();
        expect(section.name).toBeDefined();
        expect(section.description).toBeDefined();
        expect(section.sourceBlocks).toBeDefined();
        expect(Array.isArray(section.sourceBlocks)).toBe(true);
        expect(typeof section.required).toBe('boolean');
      }
    });

    it('should have project section as required', () => {
      const projectSection = KNOWN_SECTIONS.find((s) => s.id === 'project');
      expect(projectSection).toBeDefined();
      expect(projectSection?.required).toBe(true);
    });
  });

  describe('getExpectedSections', () => {
    it('should return sections based on available blocks', () => {
      const availableBlocks = ['identity', 'context', 'standards'];
      const expected = getExpectedSections(availableBlocks);

      expect(expected).toContain('project'); // from identity
      expect(expected).toContain('tech-stack'); // from context
      expect(expected).toContain('architecture'); // from context
      expect(expected).toContain('code-standards'); // from standards
    });

    it('should return empty array when no blocks match', () => {
      const availableBlocks = ['unknown-block'];
      const expected = getExpectedSections(availableBlocks);

      expect(expected).toEqual([]);
    });

    it('should handle shortcuts block', () => {
      const availableBlocks = ['shortcuts'];
      const expected = getExpectedSections(availableBlocks);

      expect(expected).toContain('commands');
    });

    it('should handle restrictions block', () => {
      const availableBlocks = ['restrictions'];
      const expected = getExpectedSections(availableBlocks);

      expect(expected).toContain('restrictions');
    });

    it('should handle knowledge block', () => {
      const availableBlocks = ['knowledge'];
      const expected = getExpectedSections(availableBlocks);

      expect(expected).toContain('commands'); // knowledge also produces commands
      expect(expected).toContain('post-work');
    });
  });

  describe('extractSectionsFromOutput', () => {
    it('should extract markdown headers', () => {
      const content = `
## Project

Some content.

## Tech-Stack

More content.

## Code-Standards

Standards here.
`;
      const sections = extractSectionsFromOutput(content);

      expect(sections).toContain('project');
      expect(sections).toContain('tech-stack');
      expect(sections).toContain('code-standards');
    });

    it('should extract XML tags', () => {
      const content = `
<project>
Some content.
</project>

<tech-stack>
More content.
</tech-stack>
`;
      const sections = extractSectionsFromOutput(content);

      expect(sections).toContain('project');
      expect(sections).toContain('tech-stack');
    });

    it('should handle mixed markdown and XML', () => {
      const content = `
## Project

<tech-stack>
TypeScript
</tech-stack>

## Code-Standards

Standards here.
`;
      const sections = extractSectionsFromOutput(content);

      expect(sections).toContain('project');
      expect(sections).toContain('tech-stack');
      expect(sections).toContain('code-standards');
    });

    it('should not duplicate sections', () => {
      const content = `
<project>
Content
</project>

## Project

More content.
`;
      const sections = extractSectionsFromOutput(content);

      // Should not have duplicates
      const uniqueSections = new Set(sections);
      expect(uniqueSections.size).toBe(sections.length);
    });

    it('should return empty array for content without sections', () => {
      const content = 'Just plain text without any headers or tags.';
      const sections = extractSectionsFromOutput(content);

      expect(sections).toEqual([]);
    });
  });

  describe('findMissingSections', () => {
    it('should find sections that are missing', () => {
      const outputSections = ['project', 'tech-stack'];
      const expectedSections = ['project', 'tech-stack', 'code-standards', 'restrictions'];

      const missing = findMissingSections(outputSections, expectedSections);

      expect(missing).toContain('code-standards');
      expect(missing).toContain('restrictions');
      expect(missing).not.toContain('project');
      expect(missing).not.toContain('tech-stack');
    });

    it('should return empty array when all sections present', () => {
      const outputSections = ['project', 'tech-stack', 'code-standards'];
      const expectedSections = ['project', 'tech-stack', 'code-standards'];

      const missing = findMissingSections(outputSections, expectedSections);

      expect(missing).toEqual([]);
    });

    it('should be case-insensitive', () => {
      const outputSections = ['PROJECT', 'Tech-Stack'];
      const expectedSections = ['project', 'tech-stack', 'code-standards'];

      const missing = findMissingSections(outputSections, expectedSections);

      expect(missing).toEqual(['code-standards']);
    });

    it('should handle empty expected sections', () => {
      const outputSections = ['project'];
      const expectedSections: string[] = [];

      const missing = findMissingSections(outputSections, expectedSections);

      expect(missing).toEqual([]);
    });
  });

  describe('normalizeSectionName', () => {
    it('should normalize donts to restrictions', () => {
      expect(normalizeSectionName('donts')).toBe('restrictions');
      expect(normalizeSectionName("don'ts")).toBe('restrictions');
      expect(normalizeSectionName('don')).toBe('restrictions');
    });

    it('should normalize code-style to code-standards', () => {
      expect(normalizeSectionName('code-style')).toBe('code-standards');
      expect(normalizeSectionName('code')).toBe('code-standards');
    });

    it('should normalize verification sections', () => {
      expect(normalizeSectionName('post-work-verification')).toBe('post-work');
      expect(normalizeSectionName('documentation-verification')).toBe('documentation');
    });

    it('should be case-insensitive', () => {
      expect(normalizeSectionName('DONTS')).toBe('restrictions');
      expect(normalizeSectionName('Code-Style')).toBe('code-standards');
    });

    it('should return lowercase for unknown sections', () => {
      expect(normalizeSectionName('Unknown-Section')).toBe('unknown-section');
      expect(normalizeSectionName('CUSTOM')).toBe('custom');
    });
  });
});
