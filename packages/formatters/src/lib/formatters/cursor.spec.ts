import { describe, expect, it, beforeEach } from 'vitest';
import type { Program, SourceLocation } from '@promptscript/core';
import { CursorFormatter } from './cursor';

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

describe('CursorFormatter', () => {
  let formatter: CursorFormatter;

  beforeEach(() => {
    formatter = new CursorFormatter();
  });

  it('should have correct name, outputPath and description', () => {
    expect(formatter.name).toBe('cursor');
    expect(formatter.outputPath).toBe('.cursorrules');
    expect(formatter.description).toBe('Cursor rules (plain text)');
  });

  describe('format', () => {
    it('should generate intro with default project', () => {
      const ast = createMinimalProgram();
      const result = formatter.format(ast);
      expect(result.path).toBe('.cursorrules');
      expect(result.content).toContain('You are working on the project.');
    });

    it('should generate intro with project from context', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'context',
            content: {
              type: 'ObjectContent',
              properties: {
                project: 'Checkout Service',
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast);
      expect(result.content).toContain('You are working on Checkout Service.');
    });

    it('should generate intro with project from identity fallback', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'identity',
            content: {
              type: 'TextContent',
              value: 'E-commerce platform backend',
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast);
      expect(result.content).toContain('You are working on E-commerce platform backend.');
    });

    it('should include organization in intro when available', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        meta: {
          type: 'MetaBlock',
          fields: { org: 'Acme Corp' },
          loc: createLoc(),
        },
        blocks: [
          {
            type: 'Block',
            name: 'context',
            content: {
              type: 'ObjectContent',
              properties: {
                project: 'Checkout Service',
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast);
      expect(result.content).toContain('You are working on Checkout Service at Acme Corp.');
    });

    it('should generate tech stack as plain text', () => {
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
                  frameworks: ['React', 'Node.js'],
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
      expect(result.content).toContain('Tech stack: TypeScript, React, Node.js, Vitest');
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
                  style: ['Functional React components', 'Custom hooks for business logic'],
                  patterns: ['Named exports only', 'No class components'],
                },
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast);
      expect(result.content).toContain('Code style:');
      expect(result.content).toContain('- Functional React components');
      expect(result.content).toContain('- Custom hooks for business logic');
      expect(result.content).toContain('- Named exports only');
      expect(result.content).toContain('- No class components');
    });

    it('should generate commands section', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'shortcuts',
            content: {
              type: 'ObjectContent',
              properties: {
                '/review': 'Review code for quality',
                '/test': 'Write comprehensive tests',
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast);
      expect(result.content).toContain('Commands:');
      expect(result.content).toContain('/review - Review code for quality');
      expect(result.content).toContain('/test - Write comprehensive tests');
    });

    it('should generate never section from restrictions array', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'restrictions',
            content: {
              type: 'ArrayContent',
              elements: ['Expose API keys or secrets', 'Use any types', 'Skip input validation'],
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast);
      expect(result.content).toContain('Never:');
      expect(result.content).toContain('- Expose API keys or secrets');
      expect(result.content).toContain('- Use any types');
      expect(result.content).toContain('- Skip input validation');
    });

    it('should handle text content for never section', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'restrictions',
            content: {
              type: 'TextContent',
              value: 'Expose secrets\nSkip validation\n- Already prefixed',
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast);
      expect(result.content).toContain('Never:');
      expect(result.content).toContain('- Expose secrets');
      expect(result.content).toContain('- Skip validation');
      expect(result.content).toContain('- Already prefixed');
    });

    it('should separate sections with double newlines (no markdown)', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        meta: {
          type: 'MetaBlock',
          fields: { org: 'Test' },
          loc: createLoc(),
        },
        blocks: [
          {
            type: 'Block',
            name: 'standards',
            content: {
              type: 'ObjectContent',
              properties: {
                code: {
                  languages: ['TypeScript'],
                },
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
          {
            type: 'Block',
            name: 'restrictions',
            content: {
              type: 'ArrayContent',
              elements: ['No secrets'],
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast);
      expect(result.content).toContain('\n\n');
      expect(result.content).not.toContain('##');
      expect(result.content).not.toContain('---');
    });

    it('should skip empty sections', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'standards',
            content: {
              type: 'ObjectContent',
              properties: {
                code: {},
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast);
      expect(result.content).not.toContain('Tech stack:');
      expect(result.content).not.toContain('Code style:');
    });

    it('should handle single value tech items', () => {
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
                },
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast);
      expect(result.content).toContain('Tech stack: TypeScript');
    });

    it('should skip never section when content is ObjectContent', () => {
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
      expect(result.content).not.toContain('Never:');
    });
  });
});
