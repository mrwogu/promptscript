import { describe, expect, it } from 'vitest';
import {
  BUILT_IN_CONVENTIONS,
  getBuiltInConvention,
  isBuiltInConvention,
  MARKDOWN_CONVENTION,
  XML_CONVENTION,
} from '@promptscript/core';
import {
  ConventionRenderer,
  createConventionRenderer,
  conventionRenderers,
} from '../convention-renderer';

describe('OutputConvention types', () => {
  describe('XML_CONVENTION', () => {
    it('should have correct name', () => {
      expect(XML_CONVENTION.name).toBe('xml');
    });

    it('should use XML-style section tags', () => {
      expect(XML_CONVENTION.section.start).toBe('<{{name}}>');
      expect(XML_CONVENTION.section.end).toBe('</{{name}}>');
    });

    it('should transform names to kebab-case', () => {
      expect(XML_CONVENTION.section.nameTransform).toBe('kebab-case');
    });
  });

  describe('MARKDOWN_CONVENTION', () => {
    it('should have correct name', () => {
      expect(MARKDOWN_CONVENTION.name).toBe('markdown');
    });

    it('should use Markdown headers', () => {
      expect(MARKDOWN_CONVENTION.section.start).toBe('## {{name}}');
      expect(MARKDOWN_CONVENTION.section.end).toBe('');
    });

    it('should not transform names', () => {
      expect(MARKDOWN_CONVENTION.section.nameTransform).toBe('none');
    });
  });

  describe('getBuiltInConvention', () => {
    it('should return XML convention', () => {
      expect(getBuiltInConvention('xml')).toBe(XML_CONVENTION);
    });

    it('should return Markdown convention', () => {
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

    it('should return false for unknown convention', () => {
      expect(isBuiltInConvention('custom')).toBe(false);
    });
  });

  describe('BUILT_IN_CONVENTIONS', () => {
    it('should contain both xml and markdown', () => {
      expect(Object.keys(BUILT_IN_CONVENTIONS)).toEqual(['xml', 'markdown']);
    });
  });
});

describe('ConventionRenderer', () => {
  describe('constructor', () => {
    it('should create with string convention name', () => {
      const renderer = new ConventionRenderer('xml');
      expect(renderer.getConvention().name).toBe('xml');
    });

    it('should create with custom convention object', () => {
      const customConvention = {
        name: 'custom',
        section: {
          start: '=== {{name}} ===',
          end: '=== end ===',
        },
      };
      const renderer = new ConventionRenderer(customConvention);
      expect(renderer.getConvention().name).toBe('custom');
    });

    it('should throw for unknown built-in convention', () => {
      expect(() => new ConventionRenderer('unknown')).toThrow('Unknown convention: unknown');
    });

    it('should default to xml convention', () => {
      const renderer = new ConventionRenderer();
      expect(renderer.getConvention().name).toBe('xml');
    });
  });

  describe('renderSection', () => {
    describe('with XML convention', () => {
      const renderer = new ConventionRenderer('xml');

      it('should render section with XML tags', () => {
        const result = renderer.renderSection('project', 'Hello world');
        expect(result).toBe('<project>\n  Hello world\n</project>');
      });

      it('should convert names to kebab-case', () => {
        const result = renderer.renderSection('techStack', 'content');
        expect(result).toBe('<tech-stack>\n  content\n</tech-stack>');
      });

      it('should render empty section correctly', () => {
        const result = renderer.renderSection('empty', '');
        expect(result).toBe('<empty>\n</empty>');
      });

      it('should render subsection with proper indentation', () => {
        const result = renderer.renderSection('typescript', 'rules', 2);
        expect(result).toContain('<typescript>');
        expect(result).toContain('</typescript>');
      });
    });

    describe('with Markdown convention', () => {
      const renderer = new ConventionRenderer('markdown');

      it('should render section with Markdown header', () => {
        const result = renderer.renderSection('Project', 'Hello world');
        expect(result).toBe('## Project\nHello world');
      });

      it('should not convert names', () => {
        const result = renderer.renderSection('Tech Stack', 'content');
        expect(result).toBe('## Tech Stack\ncontent');
      });

      it('should render subsection with H3', () => {
        const result = renderer.renderSection('TypeScript', 'rules', 2);
        expect(result).toBe('### TypeScript\nrules');
      });
    });
  });

  describe('renderList', () => {
    it('should render list with dash markers by default', () => {
      const renderer = new ConventionRenderer('xml');
      const result = renderer.renderList(['item1', 'item2', 'item3']);
      expect(result).toBe('- item1\n- item2\n- item3');
    });

    it('should handle empty list', () => {
      const renderer = new ConventionRenderer('xml');
      const result = renderer.renderList([]);
      expect(result).toBe('');
    });
  });

  describe('renderCodeBlock', () => {
    it('should render code block with triple backticks', () => {
      const renderer = new ConventionRenderer('xml');
      const result = renderer.renderCodeBlock('const x = 1;', 'typescript');
      expect(result).toBe('```typescript\nconst x = 1;\n```');
    });

    it('should render code block without language', () => {
      const renderer = new ConventionRenderer('xml');
      const result = renderer.renderCodeBlock('echo hello');
      expect(result).toBe('```\necho hello\n```');
    });
  });

  describe('wrapRoot', () => {
    it('should not wrap if no rootWrapper defined', () => {
      const renderer = new ConventionRenderer('xml');
      const result = renderer.wrapRoot('content');
      expect(result).toBe('content');
    });

    it('should wrap content with rootWrapper', () => {
      const customConvention = {
        name: 'wrapped',
        section: { start: '{{name}}', end: '' },
        rootWrapper: { start: '<root>', end: '</root>' },
      };
      const renderer = new ConventionRenderer(customConvention);
      const result = renderer.wrapRoot('content');
      expect(result).toBe('<root>\ncontent\n</root>');
    });
  });

  describe('getSectionSeparator', () => {
    it('should return double newline for any convention', () => {
      const xmlRenderer = new ConventionRenderer('xml');
      const mdRenderer = new ConventionRenderer('markdown');

      expect(xmlRenderer.getSectionSeparator()).toBe('\n\n');
      expect(mdRenderer.getSectionSeparator()).toBe('\n\n');
    });
  });
});

describe('createConventionRenderer', () => {
  it('should create renderer with default xml convention', () => {
    const renderer = createConventionRenderer();
    expect(renderer.getConvention().name).toBe('xml');
  });

  it('should create renderer with specified convention', () => {
    const renderer = createConventionRenderer('markdown');
    expect(renderer.getConvention().name).toBe('markdown');
  });
});

describe('conventionRenderers', () => {
  it('should have pre-created xml renderer', () => {
    expect(conventionRenderers.xml.getConvention().name).toBe('xml');
  });

  it('should have pre-created markdown renderer', () => {
    expect(conventionRenderers.markdown.getConvention().name).toBe('markdown');
  });
});

describe('Custom conventions', () => {
  it('should support asterisk list style', () => {
    const customConvention = {
      name: 'custom',
      section: { start: '{{name}}', end: '' },
      listStyle: 'asterisk' as const,
    };
    const renderer = new ConventionRenderer(customConvention);
    const result = renderer.renderList(['item1', 'item2']);
    expect(result).toBe('* item1\n* item2');
  });

  it('should support bullet list style', () => {
    const customConvention = {
      name: 'custom',
      section: { start: '{{name}}', end: '' },
      listStyle: 'bullet' as const,
    };
    const renderer = new ConventionRenderer(customConvention);
    const result = renderer.renderList(['item1', 'item2']);
    expect(result).toBe('• item1\n• item2');
  });

  it('should support numbered list style', () => {
    const customConvention = {
      name: 'custom',
      section: { start: '{{name}}', end: '' },
      listStyle: 'numbered' as const,
    };
    const renderer = new ConventionRenderer(customConvention);
    const result = renderer.renderList(['item1', 'item2']);
    expect(result).toBe('1. item1\n1. item2');
  });

  it('should support custom code block delimiter', () => {
    const customConvention = {
      name: 'custom',
      section: { start: '{{name}}', end: '' },
      codeBlockDelimiter: '~~~',
    };
    const renderer = new ConventionRenderer(customConvention);
    const result = renderer.renderCodeBlock('code', 'js');
    expect(result).toBe('~~~js\ncode\n~~~');
  });

  it('should support PascalCase name transform', () => {
    const customConvention = {
      name: 'custom',
      section: {
        start: '<{{name}}>',
        end: '</{{name}}>',
        nameTransform: 'PascalCase' as const,
      },
    };
    const renderer = new ConventionRenderer(customConvention);
    const result = renderer.renderSection('tech-stack', 'content');
    expect(result).toContain('<TechStack>');
    expect(result).toContain('</TechStack>');
  });

  it('should support camelCase name transform', () => {
    const customConvention = {
      name: 'custom',
      section: {
        start: '<{{name}}>',
        end: '</{{name}}>',
        nameTransform: 'camelCase' as const,
      },
    };
    const renderer = new ConventionRenderer(customConvention);
    const result = renderer.renderSection('tech-stack', 'content');
    expect(result).toContain('<techStack>');
    expect(result).toContain('</techStack>');
  });

  it('should support repeat helper in templates', () => {
    const customConvention = {
      name: 'custom',
      section: {
        start: '{{#repeat level}}#{{/repeat}} {{name}}',
        end: '',
      },
    };
    const renderer = new ConventionRenderer(customConvention);

    // Level 1 should have 1 hash
    const result1 = renderer.renderSection('Project', 'content', 1);
    expect(result1).toBe('# Project\ncontent');

    // Level 2 should have 2 hashes
    const result2 = renderer.renderSection('Section', 'content', 2);
    expect(result2).toBe('## Section\ncontent');

    // Level 3 should have 3 hashes
    const result3 = renderer.renderSection('Subsection', 'content', 3);
    expect(result3).toBe('### Subsection\ncontent');
  });

  it('should handle non-XML convention with indent (fallback path)', () => {
    const customConvention = {
      name: 'indented-non-xml',
      section: {
        start: '> {{name}}',
        end: '',
        indent: '  ',
      },
    };
    const renderer = new ConventionRenderer(customConvention);
    const result = renderer.renderSection('Quote', 'content', 1);
    // Should return content as-is since it's not XML convention
    expect(result).toBe('> Quote\ncontent');
  });
});
