import { describe, expect, it, beforeEach } from 'vitest';
import type { Program, SourceLocation } from '@promptscript/core';
import { ClaudeFormatter } from '../formatters/claude';

const createLoc = (): SourceLocation => ({
  file: 'test.prs',
  line: 1,
  column: 1,
});

const createMinimalProgram = (): Program => ({
  type: 'Program',
  uses: [],
  blocks: [],
  extends: [],
  loc: createLoc(),
});

describe('ClaudeFormatter', () => {
  let formatter: ClaudeFormatter;

  beforeEach(() => {
    formatter = new ClaudeFormatter();
  });

  it('should have correct name, outputPath and description', () => {
    expect(formatter.name).toBe('claude');
    expect(formatter.outputPath).toBe('CLAUDE.md');
    expect(formatter.description).toBe('Claude Code instructions (concise Markdown)');
  });

  describe('convention support', () => {
    it('should support markdown convention (default)', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'identity',
            content: {
              type: 'TextContent',
              value: 'Test project',
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };
      const result = formatter.format(ast, { convention: 'markdown' });
      expect(result.content).toContain('## Project');
    });

    it('should support xml convention', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'identity',
            content: {
              type: 'TextContent',
              value: 'Test project',
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };
      const result = formatter.format(ast, { convention: 'xml' });
      // XML convention transforms names to kebab-case
      expect(result.content).toContain('<project>');
      expect(result.content).toContain('</project>');
      // XML convention should not include markdown header
      expect(result.content.startsWith('# CLAUDE.md')).toBe(false);
    });

    it('should default to markdown when no convention specified', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'identity',
            content: {
              type: 'TextContent',
              value: 'Test project',
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };
      const result = formatter.format(ast);
      expect(result.content).toContain('## Project');
    });
  });

  describe('format', () => {
    it('should always start with CLAUDE.md header', () => {
      const ast = createMinimalProgram();
      const result = formatter.format(ast);
      expect(result.path).toBe('CLAUDE.md');
      expect(result.content.startsWith('# CLAUDE.md\n')).toBe(true);
    });

    it('should generate project section from identity block', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'identity',
            content: {
              type: 'TextContent',
              value: 'Checkout microservice for e-commerce platform.\nMore details here.',
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast);
      expect(result.content).toContain('## Project');
      expect(result.content).toContain('Checkout microservice for e-commerce platform.');
      // Full identity text is now included for completeness
      expect(result.content).toContain('More details here.');
    });

    it('should generate tech stack as comma-separated list', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'standards',
            content: {
              type: 'ObjectContent',
              properties: {
                code: {
                  languages: ['TypeScript'],
                  frameworks: ['React 18', 'TanStack Query'],
                  testing: ['Vitest'],
                },
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast);
      expect(result.content).toContain('## Tech Stack');
      expect(result.content).toContain('TypeScript, React 18, TanStack Query, Vitest');
    });

    it('should generate commands section as code block', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'shortcuts',
            content: {
              type: 'ObjectContent',
              properties: {
                '/review': 'Code review',
                '/test': 'Write tests',
                '/docs': 'Generate docs',
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast);
      expect(result.content).toContain('## Commands');
      expect(result.content).toContain('```\n');
      expect(result.content).toContain('/review');
      expect(result.content).toContain('Code review');
      expect(result.content).toContain('/test');
      expect(result.content).toContain('Write tests');
      expect(result.content).toContain('/docs');
      expect(result.content).toContain('Generate docs');
    });

    it('should truncate long command descriptions', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'shortcuts',
            content: {
              type: 'ObjectContent',
              properties: {
                '/cmd': 'This is a very long description that should be truncated at 40 characters',
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast);
      expect(result.content).toContain('/cmd');
      expect(result.content).toContain('This is a very long description that sho');
      expect(result.content).not.toContain('truncated at 40 characters');
    });

    it('should generate code style section', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'standards',
            content: {
              type: 'ObjectContent',
              properties: {
                code: {
                  style: ['Functional React', 'Custom hooks for logic'],
                  patterns: ['Named exports only'],
                },
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast);
      expect(result.content).toContain('## Code Style');
      expect(result.content).toContain('- Functional React');
      expect(result.content).toContain('- Custom hooks for logic');
      expect(result.content).toContain('- Named exports only');
    });

    it("should generate don'ts section from restrictions", () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'restrictions',
            content: {
              type: 'ArrayContent',
              elements: ['No secrets in code', 'No any types'],
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast);
      expect(result.content).toContain("## Don'ts");
      expect(result.content).toContain('- No secrets in code');
      expect(result.content).toContain('- No any types');
    });

    it("should handle text content for don'ts section", () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'restrictions',
            content: {
              type: 'TextContent',
              value: 'No secrets\nNo any types\n- Already has dash',
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast);
      expect(result.content).toContain("## Don'ts");
      expect(result.content).toContain('- No secrets');
      expect(result.content).toContain('- No any types');
      expect(result.content).toContain('- Already has dash');
    });

    it('should skip empty sections', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'shortcuts',
            content: {
              type: 'ObjectContent',
              properties: {},
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast);
      expect(result.content).not.toContain('## Commands');
    });

    it('should handle single value arrays', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'standards',
            content: {
              type: 'ObjectContent',
              properties: {
                code: {
                  languages: 'TypeScript',
                  frameworks: 'React',
                },
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast);
      expect(result.content).toContain('TypeScript, React');
    });

    it('should skip donts section when content is ObjectContent', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'restrictions',
            content: {
              type: 'ObjectContent',
              properties: {
                key: 'value',
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast);
      expect(result.content).not.toContain("## Don'ts");
    });

    it('should extract donts items from ObjectContent with items array', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'restrictions',
            content: {
              type: 'ObjectContent',
              properties: {
                items: ['Never use any type', 'Never skip tests', 'Never commit secrets'],
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast);
      expect(result.content).toContain("## Don'ts");
      // Claude formatter transforms "Never" to "Don't"
      expect(result.content).toContain("- Don't use any type");
      expect(result.content).toContain("- Don't skip tests");
      expect(result.content).toContain("- Don't commit secrets");
    });
  });
});
