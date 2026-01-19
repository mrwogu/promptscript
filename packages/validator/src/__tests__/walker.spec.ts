import { describe, it, expect } from 'vitest';
import type { Program, SourceLocation } from '@promptscript/core';
import { walkText, walkBlocks, walkUses, hasContent } from '../walker';

/**
 * Create a minimal test AST.
 */
function createTestProgram(overrides: Partial<Program> = {}): Program {
  const defaultLoc: SourceLocation = { file: 'test.prs', line: 1, column: 1 };
  return {
    type: 'Program',
    loc: defaultLoc,
    meta: {
      type: 'MetaBlock',
      loc: defaultLoc,
      fields: {
        id: 'test-project',
        version: '1.0.0',
      },
    },
    uses: [],
    blocks: [],
    extends: [],
    ...overrides,
  };
}

describe('walker', () => {
  const defaultLoc: SourceLocation = { file: 'test.prs', line: 1, column: 1 };

  describe('walkText', () => {
    it('should walk text content in blocks', () => {
      const texts: string[] = [];
      const ast = createTestProgram({
        blocks: [
          {
            type: 'Block',
            name: 'identity',
            loc: defaultLoc,
            content: {
              type: 'TextContent',
              value: 'Hello, world!',
              loc: defaultLoc,
            },
          },
        ],
      });

      walkText(ast, (text) => texts.push(text));

      expect(texts).toEqual(['Hello, world!']);
    });

    it('should walk text in object content', () => {
      const texts: string[] = [];
      const ast = createTestProgram({
        blocks: [
          {
            type: 'Block',
            name: 'context',
            loc: defaultLoc,
            content: {
              type: 'ObjectContent',
              properties: {
                key1: 'value1',
                key2: 'value2',
              },
              loc: defaultLoc,
            },
          },
        ],
      });

      walkText(ast, (text) => texts.push(text));

      expect(texts).toContain('value1');
      expect(texts).toContain('value2');
    });

    it('should walk text in array content', () => {
      const texts: string[] = [];
      const ast = createTestProgram({
        blocks: [
          {
            type: 'Block',
            name: 'restrictions',
            loc: defaultLoc,
            content: {
              type: 'ArrayContent',
              elements: ['item1', 'item2', 'item3'],
              loc: defaultLoc,
            },
          },
        ],
      });

      walkText(ast, (text) => texts.push(text));

      expect(texts).toEqual(['item1', 'item2', 'item3']);
    });

    it('should walk text in mixed content', () => {
      const texts: string[] = [];
      const ast = createTestProgram({
        blocks: [
          {
            type: 'Block',
            name: 'identity',
            loc: defaultLoc,
            content: {
              type: 'MixedContent',
              text: {
                type: 'TextContent',
                value: 'Main text',
                loc: defaultLoc,
              },
              properties: {
                extra: 'Extra text',
              },
              loc: defaultLoc,
            },
          },
        ],
      });

      walkText(ast, (text) => texts.push(text));

      expect(texts).toContain('Main text');
      expect(texts).toContain('Extra text');
    });

    it('should walk text in extend blocks', () => {
      const texts: string[] = [];
      const ast = createTestProgram({
        extends: [
          {
            type: 'ExtendBlock',
            targetPath: 'identity',
            loc: defaultLoc,
            content: {
              type: 'TextContent',
              value: 'Extended content',
              loc: defaultLoc,
            },
          },
        ],
      });

      walkText(ast, (text) => texts.push(text));

      expect(texts).toEqual(['Extended content']);
    });

    it('should walk nested text content', () => {
      const texts: string[] = [];
      const ast = createTestProgram({
        blocks: [
          {
            type: 'Block',
            name: 'context',
            loc: defaultLoc,
            content: {
              type: 'ObjectContent',
              properties: {
                nested: {
                  type: 'TextContent',
                  value: 'Nested text',
                  loc: defaultLoc,
                },
              },
              loc: defaultLoc,
            },
          },
        ],
      });

      walkText(ast, (text) => texts.push(text));

      expect(texts).toContain('Nested text');
    });
  });

  describe('walkBlocks', () => {
    it('should walk all blocks', () => {
      const blockNames: string[] = [];
      const ast = createTestProgram({
        blocks: [
          {
            type: 'Block',
            name: 'identity',
            loc: defaultLoc,
            content: { type: 'TextContent', value: '', loc: defaultLoc },
          },
          {
            type: 'Block',
            name: 'context',
            loc: defaultLoc,
            content: { type: 'TextContent', value: '', loc: defaultLoc },
          },
        ],
      });

      walkBlocks(ast, (block) => {
        if ('name' in block) {
          blockNames.push(block.name);
        }
      });

      expect(blockNames).toEqual(['identity', 'context']);
    });

    it('should walk extend blocks', () => {
      const targetPaths: string[] = [];
      const ast = createTestProgram({
        extends: [
          {
            type: 'ExtendBlock',
            targetPath: 'identity',
            loc: defaultLoc,
            content: { type: 'TextContent', value: '', loc: defaultLoc },
          },
        ],
      });

      walkBlocks(ast, (block) => {
        if ('targetPath' in block) {
          targetPaths.push(block.targetPath);
        }
      });

      expect(targetPaths).toEqual(['identity']);
    });
  });

  describe('walkUses', () => {
    it('should walk use declarations', () => {
      const paths: string[] = [];
      const ast = createTestProgram({
        uses: [
          {
            type: 'UseDeclaration',
            loc: defaultLoc,
            path: {
              type: 'PathReference',
              raw: '@core/guards/compliance',
              namespace: 'core',
              segments: ['guards', 'compliance'],
              isRelative: false,
              loc: defaultLoc,
            },
          },
          {
            type: 'UseDeclaration',
            loc: defaultLoc,
            path: {
              type: 'PathReference',
              raw: './local/file',
              segments: ['local', 'file'],
              isRelative: true,
              loc: defaultLoc,
            },
          },
        ],
      });

      walkUses(ast, (use) => paths.push(use.path.raw));

      expect(paths).toEqual(['@core/guards/compliance', './local/file']);
    });
  });

  describe('hasContent', () => {
    it('should return true for non-empty text content', () => {
      expect(
        hasContent({
          type: 'TextContent',
          value: 'Hello',
          loc: defaultLoc,
        })
      ).toBe(true);
    });

    it('should return false for empty text content', () => {
      expect(
        hasContent({
          type: 'TextContent',
          value: '',
          loc: defaultLoc,
        })
      ).toBe(false);
    });

    it('should return false for whitespace-only text content', () => {
      expect(
        hasContent({
          type: 'TextContent',
          value: '   \n\t  ',
          loc: defaultLoc,
        })
      ).toBe(false);
    });

    it('should return true for non-empty object content', () => {
      expect(
        hasContent({
          type: 'ObjectContent',
          properties: { key: 'value' },
          loc: defaultLoc,
        })
      ).toBe(true);
    });

    it('should return false for empty object content', () => {
      expect(
        hasContent({
          type: 'ObjectContent',
          properties: {},
          loc: defaultLoc,
        })
      ).toBe(false);
    });

    it('should return true for non-empty array content', () => {
      expect(
        hasContent({
          type: 'ArrayContent',
          elements: ['item'],
          loc: defaultLoc,
        })
      ).toBe(true);
    });

    it('should return false for empty array content', () => {
      expect(
        hasContent({
          type: 'ArrayContent',
          elements: [],
          loc: defaultLoc,
        })
      ).toBe(false);
    });

    it('should return true for mixed content with text', () => {
      expect(
        hasContent({
          type: 'MixedContent',
          text: { type: 'TextContent', value: 'Hello', loc: defaultLoc },
          properties: {},
          loc: defaultLoc,
        })
      ).toBe(true);
    });

    it('should return true for mixed content with properties', () => {
      expect(
        hasContent({
          type: 'MixedContent',
          properties: { key: 'value' },
          loc: defaultLoc,
        })
      ).toBe(true);
    });

    it('should return false for empty mixed content', () => {
      expect(
        hasContent({
          type: 'MixedContent',
          properties: {},
          loc: defaultLoc,
        })
      ).toBe(false);
    });
  });
});
