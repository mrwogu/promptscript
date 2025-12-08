import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import type { Program, SourceLocation } from '@promptscript/core';
import { GitHubFormatter } from '../formatters/github';

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

describe('GitHubFormatter', () => {
  let formatter: GitHubFormatter;

  beforeEach(() => {
    formatter = new GitHubFormatter();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-01T00:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should have correct name, outputPath, description and defaultConvention', () => {
    expect(formatter.name).toBe('github');
    expect(formatter.outputPath).toBe('.github/copilot-instructions.md');
    expect(formatter.description).toBe('GitHub Copilot instructions (Markdown)');
    expect(formatter.defaultConvention).toBe('markdown');
  });

  describe('format with default Markdown convention', () => {
    it('should generate project section from identity block', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'identity',
            content: {
              type: 'TextContent',
              value: 'You are a helpful coding assistant.',
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast);
      expect(result.content).toContain('## project');
      expect(result.content).toContain('You are a helpful coding assistant.');
    });

    it('should generate restrictions as donts section', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'restrictions',
            content: {
              type: 'ArrayContent',
              elements: ['Never expose secrets', 'Always validate input'],
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast);
      expect(result.content).toContain('## donts');
      expect(result.content).toContain("- Don't expose secrets");
      expect(result.content).toContain('- Always validate input');
    });

    it('should generate restrictions from text content', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'restrictions',
            content: {
              type: 'TextContent',
              value: 'No secrets in code',
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast);
      expect(result.content).toContain('## donts');
      expect(result.content).toContain('No secrets in code');
    });

    it('should skip sections with empty content', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'standards',
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
      expect(result.content).not.toContain('## code-standards');
      expect(result.content).not.toContain('## tech-stack');
    });

    it('should ignore blocks starting with __', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: '__internal',
            content: {
              type: 'TextContent',
              value: 'Internal content',
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast);
      expect(result.content).not.toContain('Internal content');
    });

    it('should skip restrictions section when content is ObjectContent', () => {
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
      expect(result.content).not.toContain('## donts');
    });

    it('should use kebab-case for section names', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'standards',
            content: {
              type: 'ObjectContent',
              properties: {
                testing: {
                  coverage: 80,
                },
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast);
      expect(result.content).toContain('## code-standards');
    });
  });

  describe('format with XML convention', () => {
    it('should generate project section with XML tags', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'identity',
            content: {
              type: 'TextContent',
              value: 'You are a helpful coding assistant.',
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast, { convention: 'xml' });
      expect(result.content).toContain('<project>');
      expect(result.content).toContain('You are a helpful coding assistant.');
      expect(result.content).toContain('</project>');
    });

    it('should generate donts section with XML tags', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'restrictions',
            content: {
              type: 'ArrayContent',
              elements: ['Never expose secrets'],
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast, { convention: 'xml' });
      expect(result.content).toContain('<donts>');
      expect(result.content).toContain("- Don't expose secrets");
      expect(result.content).toContain('</donts>');
    });
  });

  describe('format with explicit markdown convention', () => {
    it('should generate header with meta information', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        meta: {
          type: 'MetaBlock',
          fields: { id: 'my-project', syntax: '1.0.0' },
          loc: createLoc(),
        },
      };

      const result = formatter.format(ast, { convention: 'markdown' });
      expect(result.path).toBe('.github/copilot-instructions.md');
      expect(result.content).toContain('# GitHub Copilot Instructions');
      expect(result.content).toContain('Source: my-project (syntax 1.0.0)');
      expect(result.content).toContain('Generated: 2024-01-01T00:00:00.000Z');
      expect(result.content).toContain('**Do not edit manually**');
    });

    it('should handle missing meta with defaults', () => {
      const ast = createMinimalProgram();
      const result = formatter.format(ast, { convention: 'markdown' });
      expect(result.content).toContain('Source: unknown (syntax 0.0.0)');
    });

    it('should generate project section with ## header', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'identity',
            content: {
              type: 'TextContent',
              value: 'You are a helpful coding assistant.',
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast, { convention: 'markdown' });
      expect(result.content).toContain('## project');
      expect(result.content).toContain('You are a helpful coding assistant.');
    });

    it('should generate donts section with ## header', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'restrictions',
            content: {
              type: 'ArrayContent',
              elements: ['Never expose secrets', 'Always validate input'],
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast, { convention: 'markdown' });
      expect(result.content).toContain('## donts');
      expect(result.content).toContain("- Don't expose secrets");
    });
  });

  describe('format with custom output path', () => {
    it('should use custom output path when provided', () => {
      const ast = createMinimalProgram();
      const result = formatter.format(ast, { outputPath: 'custom/path.md' });
      expect(result.path).toBe('custom/path.md');
    });
  });
});
