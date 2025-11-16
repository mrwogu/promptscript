import { describe, it, expect } from 'vitest';
import type { Program, SourceLocation, TextContent } from '@promptscript/core';
import { walkText, walkBlocks, hasContent } from '../walker';

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

describe('walker additional coverage', () => {
  const defaultLoc: SourceLocation = { file: 'test.prs', line: 1, column: 1 };

  describe('walkText with complex nested content', () => {
    it('should walk text in deeply nested arrays', () => {
      const texts: string[] = [];
      const ast = createTestProgram({
        blocks: [
          {
            type: 'Block',
            name: 'test',
            loc: defaultLoc,
            content: {
              type: 'ArrayContent',
              elements: [['nested', 'array'], 'single', { key: 'object-value' }],
              loc: defaultLoc,
            },
          },
        ],
      });

      walkText(ast, (text) => texts.push(text));
      expect(texts).toContain('nested');
      expect(texts).toContain('array');
      expect(texts).toContain('single');
      expect(texts).toContain('object-value');
    });

    it('should walk TextContent nodes in values', () => {
      const texts: string[] = [];
      const textContent: TextContent = {
        type: 'TextContent',
        value: 'text-content-value',
        loc: defaultLoc,
      };
      const ast = createTestProgram({
        blocks: [
          {
            type: 'Block',
            name: 'test',
            loc: defaultLoc,
            content: {
              type: 'ObjectContent',
              properties: {
                nested: textContent,
              },
              loc: defaultLoc,
            },
          },
        ],
      });

      walkText(ast, (text) => texts.push(text));
      expect(texts).toContain('text-content-value');
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
              value: 'extended content',
              loc: defaultLoc,
            },
          },
        ],
      });

      walkText(ast, (text) => texts.push(text));
      expect(texts).toContain('extended content');
    });

    it('should handle null values in objects', () => {
      const texts: string[] = [];
      const ast = createTestProgram({
        blocks: [
          {
            type: 'Block',
            name: 'test',
            loc: defaultLoc,
            content: {
              type: 'ObjectContent',
              properties: {
                nullValue: null,
                stringValue: 'text',
              },
              loc: defaultLoc,
            },
          },
        ],
      });

      walkText(ast, (text) => texts.push(text));
      expect(texts).toContain('text');
      expect(texts).toHaveLength(1);
    });

    it('should handle number values', () => {
      const texts: string[] = [];
      const ast = createTestProgram({
        blocks: [
          {
            type: 'Block',
            name: 'test',
            loc: defaultLoc,
            content: {
              type: 'ObjectContent',
              properties: {
                numberValue: 42,
                boolValue: true,
              },
              loc: defaultLoc,
            },
          },
        ],
      });

      walkText(ast, (text) => texts.push(text));
      expect(texts).toHaveLength(0);
    });

    it('should walk mixed content with properties', () => {
      const texts: string[] = [];
      const ast = createTestProgram({
        blocks: [
          {
            type: 'Block',
            name: 'test',
            loc: defaultLoc,
            content: {
              type: 'MixedContent',
              text: { type: 'TextContent', value: 'main text', loc: defaultLoc },
              properties: {
                extra: 'extra text',
              },
              loc: defaultLoc,
            },
          },
        ],
      });

      walkText(ast, (text) => texts.push(text));
      expect(texts).toContain('main text');
      expect(texts).toContain('extra text');
    });

    it('should use content.loc when available', () => {
      const customLoc: SourceLocation = { file: 'custom.prs', line: 10, column: 5 };
      const locs: SourceLocation[] = [];
      const ast = createTestProgram({
        blocks: [
          {
            type: 'Block',
            name: 'test',
            loc: defaultLoc,
            content: {
              type: 'TextContent',
              value: 'with loc',
              loc: customLoc,
            },
          },
        ],
      });

      walkText(ast, (_text, loc) => locs.push(loc));
      expect(locs[0]).toEqual(customLoc);
    });

    it('should fallback to parent loc when content.loc is undefined', () => {
      const blockLoc: SourceLocation = { file: 'block.prs', line: 5, column: 1 };
      const locs: SourceLocation[] = [];
      const ast = createTestProgram({
        blocks: [
          {
            type: 'Block',
            name: 'test',
            loc: blockLoc,
            content: {
              type: 'TextContent',
              value: 'no loc',
              loc: undefined as unknown as SourceLocation,
            },
          },
        ],
      });

      walkText(ast, (_text, loc) => locs.push(loc));
      expect(locs[0]).toEqual(blockLoc);
    });
  });

  describe('walkBlocks', () => {
    it('should walk both regular blocks and extend blocks', () => {
      const blockNames: string[] = [];
      const ast = createTestProgram({
        blocks: [
          {
            type: 'Block',
            name: 'identity',
            loc: defaultLoc,
            content: { type: 'TextContent', value: 'content', loc: defaultLoc },
          },
          {
            type: 'Block',
            name: 'context',
            loc: defaultLoc,
            content: { type: 'TextContent', value: 'content', loc: defaultLoc },
          },
        ],
        extends: [
          {
            type: 'ExtendBlock',
            targetPath: 'identity',
            loc: defaultLoc,
            content: { type: 'TextContent', value: 'extension', loc: defaultLoc },
          },
        ],
      });

      walkBlocks(ast, (block) => {
        if (block.type === 'Block') {
          blockNames.push(block.name);
        } else {
          blockNames.push(`extend:${block.targetPath}`);
        }
      });

      expect(blockNames).toEqual(['identity', 'context', 'extend:identity']);
    });
  });

  describe('hasContent edge cases', () => {
    it('should handle mixed content with undefined text', () => {
      expect(
        hasContent({
          type: 'MixedContent',
          text: undefined,
          properties: { key: 'value' },
          loc: defaultLoc,
        })
      ).toBe(true);
    });

    it('should handle mixed content with empty text and properties', () => {
      expect(
        hasContent({
          type: 'MixedContent',
          text: { type: 'TextContent', value: '', loc: defaultLoc },
          properties: {},
          loc: defaultLoc,
        })
      ).toBe(false);
    });

    it('should handle mixed content with whitespace-only text', () => {
      expect(
        hasContent({
          type: 'MixedContent',
          text: { type: 'TextContent', value: '   ', loc: defaultLoc },
          properties: {},
          loc: defaultLoc,
        })
      ).toBe(false);
    });

    it('should handle mixed content with text but no text.value', () => {
      const content = {
        type: 'MixedContent' as const,
        text: { type: 'TextContent', value: undefined } as unknown as TextContent,
        properties: {},
        loc: defaultLoc,
      };
      // This tests the ?. operator in the hasContent function
      expect(hasContent(content)).toBe(false);
    });
  });
});
