import { describe, expect, it } from 'vitest';
import {
  BUILT_IN_CONVENTIONS,
  getBuiltInConvention,
  isBuiltInConvention,
  MARKDOWN_CONVENTION,
  XML_CONVENTION,
  type OutputConvention,
  type SectionRenderer,
} from '../types/convention';

describe('convention types', () => {
  describe('XML_CONVENTION', () => {
    it('should be named xml', () => {
      expect(XML_CONVENTION.name).toBe('xml');
    });

    it('should have description', () => {
      expect(XML_CONVENTION.description).toBe('XML-style tags for section structure');
    });

    it('should have section renderer with start and end tags', () => {
      expect(XML_CONVENTION.section.start).toBe('<{{name}}>');
      expect(XML_CONVENTION.section.end).toBe('</{{name}}>');
    });

    it('should have subsection renderer', () => {
      expect(XML_CONVENTION.subsection).toBeDefined();
      expect(XML_CONVENTION.subsection?.start).toBe('  <{{name}}>');
    });

    it('should use kebab-case name transform', () => {
      expect(XML_CONVENTION.section.nameTransform).toBe('kebab-case');
    });

    it('should use dash list style', () => {
      expect(XML_CONVENTION.listStyle).toBe('dash');
    });

    it('should use triple backtick code delimiter', () => {
      expect(XML_CONVENTION.codeBlockDelimiter).toBe('```');
    });
  });

  describe('MARKDOWN_CONVENTION', () => {
    it('should be named markdown', () => {
      expect(MARKDOWN_CONVENTION.name).toBe('markdown');
    });

    it('should have description', () => {
      expect(MARKDOWN_CONVENTION.description).toBe('Markdown headers for section structure');
    });

    it('should have section renderer with H2 header', () => {
      expect(MARKDOWN_CONVENTION.section.start).toBe('## {{name}}');
      expect(MARKDOWN_CONVENTION.section.end).toBe('');
    });

    it('should have subsection renderer with H3 header', () => {
      expect(MARKDOWN_CONVENTION.subsection?.start).toBe('### {{name}}');
    });

    it('should not transform names', () => {
      expect(MARKDOWN_CONVENTION.section.nameTransform).toBe('none');
    });
  });

  describe('BUILT_IN_CONVENTIONS', () => {
    it('should contain xml convention', () => {
      expect(BUILT_IN_CONVENTIONS.xml).toBe(XML_CONVENTION);
    });

    it('should contain markdown convention', () => {
      expect(BUILT_IN_CONVENTIONS.markdown).toBe(MARKDOWN_CONVENTION);
    });

    it('should only have xml and markdown', () => {
      expect(Object.keys(BUILT_IN_CONVENTIONS)).toHaveLength(2);
    });
  });

  describe('getBuiltInConvention', () => {
    it('should return xml convention for xml', () => {
      expect(getBuiltInConvention('xml')).toBe(XML_CONVENTION);
    });

    it('should return markdown convention for markdown', () => {
      expect(getBuiltInConvention('markdown')).toBe(MARKDOWN_CONVENTION);
    });
  });

  describe('isBuiltInConvention', () => {
    it('should return true for xml', () => {
      expect(isBuiltInConvention('xml')).toBe(true);
    });

    it('should return true for markdown', () => {
      expect(isBuiltInConvention('markdown')).toBe(true);
    });

    it('should return false for arbitrary string', () => {
      expect(isBuiltInConvention('custom')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isBuiltInConvention('')).toBe(false);
    });
  });
});

describe('type contracts', () => {
  it('should allow creating custom OutputConvention', () => {
    const custom: OutputConvention = {
      name: 'custom-convention',
      description: 'A custom convention',
      section: {
        start: '=== {{name}} ===',
        end: '=== end ===',
        nameTransform: 'none',
        indent: '    ',
      },
      listStyle: 'asterisk',
      codeBlockDelimiter: '~~~',
    };

    expect(custom.name).toBe('custom-convention');
    expect(custom.section.nameTransform).toBe('none');
  });

  it('should allow SectionRenderer with minimal config', () => {
    const minimal: SectionRenderer = {
      start: '{{name}}:',
    };

    expect(minimal.start).toBe('{{name}}:');
    expect(minimal.end).toBeUndefined();
    expect(minimal.nameTransform).toBeUndefined();
    expect(minimal.indent).toBeUndefined();
  });

  it('should allow OutputConvention with rootWrapper', () => {
    const wrapped: OutputConvention = {
      name: 'wrapped',
      section: { start: '{{name}}', end: '' },
      rootWrapper: {
        start: '<?xml version="1.0"?>\n<instructions>',
        end: '</instructions>',
      },
    };

    expect(wrapped.rootWrapper?.start).toContain('<?xml');
    expect(wrapped.rootWrapper?.end).toBe('</instructions>');
  });
});
