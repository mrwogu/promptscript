import { describe, it, expect } from 'vitest';
import {
  createBlockBody,
  createValueNode,
  type Program,
  type SourceLocation,
} from '@promptscript/core';
import { walkText, walkBlocks, walkUses, hasContent, offsetLocation } from '../walker.js';

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

    it('should walk presentation titles at their exact locations', () => {
      const visited: Array<{ text: string; loc: SourceLocation }> = [];
      const titleLoc: SourceLocation = { file: 'test.prs', line: 4, column: 11 };
      const ast = createTestProgram({
        blocks: [
          {
            type: 'Block',
            name: 'standards',
            loc: defaultLoc,
            content: {
              type: 'ObjectContent',
              properties: {},
              loc: defaultLoc,
            },
            canonicalBody: createBlockBody(
              [
                {
                  type: 'PresentationEntry',
                  title: 'Security-sensitive title',
                  source: 'explicit',
                  loc: defaultLoc,
                  titleLoc,
                },
              ],
              defaultLoc
            ),
          },
        ],
      });

      walkText(ast, (text, loc) => visited.push({ text, loc }));

      expect(visited).toContainEqual({
        text: 'Security-sensitive title',
        loc: titleLoc,
      });
    });

    it('should walk block replacement content in override blocks', () => {
      const texts: string[] = [];
      const ast = createTestProgram({
        overrides: [
          {
            type: 'OverrideBlock',
            targetPath: 'standards',
            loc: defaultLoc,
            replacement: {
              type: 'BlockReplacement',
              loc: defaultLoc,
              body: createBlockBody(
                [
                  {
                    type: 'FieldEntry',
                    name: 'testing',
                    value: createValueNode(['Replaced rule'], defaultLoc),
                    loc: defaultLoc,
                  },
                ],
                defaultLoc
              ),
            },
          },
        ],
      });

      walkText(ast, (text) => texts.push(text));

      expect(texts).toEqual(['Replaced rule']);
    });

    it('should walk presentation titles in override replacements', () => {
      const visited: Array<{ text: string; loc: SourceLocation }> = [];
      const titleLoc: SourceLocation = { file: 'test.prs', line: 9, column: 13 };
      const ast = createTestProgram({
        overrides: [
          {
            type: 'OverrideBlock',
            targetPath: 'standards',
            loc: defaultLoc,
            replacement: {
              type: 'BlockReplacement',
              loc: defaultLoc,
              body: createBlockBody(
                [
                  {
                    type: 'PresentationEntry',
                    title: 'Overridden sensitive title',
                    source: 'explicit',
                    loc: defaultLoc,
                    titleLoc,
                  },
                ],
                defaultLoc
              ),
            },
          },
        ],
      });

      walkText(ast, (text, loc) => visited.push({ text, loc }));

      expect(visited).toContainEqual({
        text: 'Overridden sensitive title',
        loc: titleLoc,
      });
    });

    it('should walk value replacement content in override blocks', () => {
      const texts: string[] = [];
      const replacementLoc: SourceLocation = { file: 'test.prs', line: 7, column: 5 };
      const ast = createTestProgram({
        overrides: [
          {
            type: 'OverrideBlock',
            targetPath: 'standards.testing',
            loc: defaultLoc,
            replacement: {
              type: 'ValueReplacement',
              loc: replacementLoc,
              value: createValueNode(['Replaced item'], replacementLoc),
            },
          },
        ],
      });

      walkText(ast, (text, loc) => texts.push(`${text}@${loc.line}`));

      expect(texts).toEqual(['Replaced item@7']);
    });

    it('should respect excludeProperties inside override replacements', () => {
      const texts: string[] = [];
      const ast = createTestProgram({
        overrides: [
          {
            type: 'OverrideBlock',
            targetPath: 'skills.review',
            loc: defaultLoc,
            replacement: {
              type: 'BlockReplacement',
              loc: defaultLoc,
              body: createBlockBody(
                [
                  {
                    type: 'FieldEntry',
                    name: 'description',
                    value: createValueNode('Visible description', defaultLoc),
                    loc: defaultLoc,
                  },
                  {
                    type: 'FieldEntry',
                    name: 'resources',
                    value: createValueNode('Excluded resource', defaultLoc),
                    loc: defaultLoc,
                  },
                ],
                defaultLoc
              ),
            },
          },
        ],
      });

      walkText(ast, (text) => texts.push(text), { excludeProperties: ['resources'] });

      expect(texts).toEqual(['Visible description']);
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

describe('offsetLocation', () => {
  it('should return base location for index 0', () => {
    const base: SourceLocation = { file: 'test.prs', line: 10, column: 5 };
    const result = offsetLocation(base, 'hello', 0);

    expect(result.line).toBe(10);
    expect(result.column).toBe(5);
    expect(result.file).toBe('test.prs');
  });

  it('should advance column for same-line offset', () => {
    const base: SourceLocation = { file: 'test.prs', line: 10, column: 5 };
    const result = offsetLocation(base, 'hello world', 6);

    expect(result.line).toBe(10);
    expect(result.column).toBe(11); // 5 + 6
  });

  it('should advance line on newlines', () => {
    const base: SourceLocation = { file: 'test.prs', line: 10, column: 5 };
    const result = offsetLocation(base, 'line1\nline2\nline3', 12);

    expect(result.line).toBe(12); // 10 + 2 newlines
    expect(result.column).toBe(1 + (12 - 'line1\nline2\n'.length)); // column within line3
  });

  it('should reset column after newline', () => {
    const base: SourceLocation = { file: 'test.prs', line: 1, column: 1 };
    // 'abc\ndef' → process indices 0-4 to reach index 5
    // a→col2, b→col3, c→col4, \n→line2/col1, d→col2
    // Character at index 5 ('e') is at line 2, column 2
    const result = offsetLocation(base, 'abc\ndef', 5);

    expect(result.line).toBe(2);
    expect(result.column).toBe(2);
  });

  it('should handle offset property', () => {
    const base: SourceLocation = { file: 'test.prs', line: 1, column: 1, offset: 100 };
    const result = offsetLocation(base, 'hello', 3);

    expect(result.offset).toBe(103);
  });

  it('should return undefined offset when base has no offset', () => {
    const base: SourceLocation = { file: 'test.prs', line: 1, column: 1 };
    const result = offsetLocation(base, 'hello', 3);

    expect(result.offset).toBeUndefined();
  });
});
