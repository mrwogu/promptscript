import { describe, expect, it, beforeEach } from 'vitest';
import type {
  ArrayContent,
  Block,
  BlockContent,
  MixedContent,
  ObjectContent,
  Program,
  SourceLocation,
  TextContent,
  Value,
} from '@promptscript/core';
import { BaseFormatter } from '../base-formatter.js';
import type { FormatterOutput } from '../types.js';

const createLoc = (): SourceLocation => ({
  file: 'test.prs',
  line: 1,
  column: 1,
});

// Concrete implementation for testing
class TestFormatter extends BaseFormatter {
  readonly name = 'test';
  readonly outputPath = 'test.md';
  readonly description = 'Test formatter';
  readonly defaultConvention = 'markdown';

  format(): FormatterOutput {
    return { path: this.outputPath, content: '' };
  }

  // Expose protected methods for testing
  public testFindBlock(ast: Program, name: string): Block | undefined {
    return this.findBlock(ast, name);
  }

  public testExtractText(content: BlockContent): string {
    return this.extractText(content);
  }

  public testGetProp(content: BlockContent, key: string): Value | undefined {
    return this.getProp(content, key);
  }

  public testGetProps(content: BlockContent): Record<string, Value> {
    return this.getProps(content);
  }

  public testFormatArray(arr: unknown[]): string {
    return this.formatArray(arr);
  }

  public testTruncate(str: string, max: number): string {
    return this.truncate(str, max);
  }

  public testGetMetaField(ast: Program, key: string): string | undefined {
    return this.getMetaField(ast, key);
  }

  public testGetArrayElements(content: BlockContent): Value[] {
    return this.getArrayElements(content);
  }

  public testValueToString(value: Value): string {
    return this.valueToString(value);
  }

  public testExtractSectionWithCodeBlock(text: string, header: string): string | null {
    return this.extractSectionWithCodeBlock(text, header);
  }

  public testCreateRenderer(options?: { convention?: string; prettier?: object }) {
    return this.createRenderer(options);
  }

  public testGetPrettierOptions(options?: { prettier?: object }) {
    return this.getPrettierOptions(options);
  }

  public testGetOutputPath(options?: { outputPath?: string }) {
    return this.getOutputPath(options);
  }

  public testNormalizeMarkdownForPrettier(content: string): string {
    return this.normalizeMarkdownForPrettier(content);
  }

  public testStripAllIndent(content: string): string {
    return this.stripAllIndent(content);
  }
}

describe('BaseFormatter', () => {
  let formatter: TestFormatter;

  beforeEach(() => {
    formatter = new TestFormatter();
  });

  describe('findBlock', () => {
    it('should find block by name', () => {
      const ast: Program = {
        type: 'Program',
        uses: [],
        blocks: [
          {
            type: 'Block',
            name: 'identity',
            content: { type: 'TextContent', value: 'test', loc: createLoc() },
            loc: createLoc(),
          },
        ],
        extends: [],
        loc: createLoc(),
      };

      const result = formatter.testFindBlock(ast, 'identity');
      expect(result).toBeDefined();
      expect(result?.name).toBe('identity');
    });

    it('should return undefined for missing block', () => {
      const ast: Program = {
        type: 'Program',
        uses: [],
        blocks: [],
        extends: [],
        loc: createLoc(),
      };

      const result = formatter.testFindBlock(ast, 'identity');
      expect(result).toBeUndefined();
    });

    it('should skip blocks starting with __', () => {
      const ast: Program = {
        type: 'Program',
        uses: [],
        blocks: [
          {
            type: 'Block',
            name: '__internal',
            content: { type: 'TextContent', value: 'test', loc: createLoc() },
            loc: createLoc(),
          },
        ],
        extends: [],
        loc: createLoc(),
      };

      const result = formatter.testFindBlock(ast, '__internal');
      expect(result).toBeUndefined();
    });
  });

  describe('extractText', () => {
    it('should extract from TextContent', () => {
      const content: TextContent = {
        type: 'TextContent',
        value: '  hello world  ',
        loc: createLoc(),
      };

      expect(formatter.testExtractText(content)).toBe('hello world');
    });

    it('should extract from MixedContent with text', () => {
      const content: MixedContent = {
        type: 'MixedContent',
        text: { type: 'TextContent', value: '  mixed text  ', loc: createLoc() },
        properties: {},
        loc: createLoc(),
      };

      expect(formatter.testExtractText(content)).toBe('mixed text');
    });

    it('should return empty for MixedContent without text', () => {
      const content: MixedContent = {
        type: 'MixedContent',
        properties: { key: 'value' },
        loc: createLoc(),
      };

      expect(formatter.testExtractText(content)).toBe('');
    });

    it('should return empty for ObjectContent', () => {
      const content: ObjectContent = {
        type: 'ObjectContent',
        properties: { key: 'value' },
        loc: createLoc(),
      };

      expect(formatter.testExtractText(content)).toBe('');
    });

    it('should return empty for ArrayContent', () => {
      const content: ArrayContent = {
        type: 'ArrayContent',
        elements: ['item1', 'item2'],
        loc: createLoc(),
      };

      expect(formatter.testExtractText(content)).toBe('');
    });
  });

  describe('getProp', () => {
    it('should get prop from ObjectContent', () => {
      const content: ObjectContent = {
        type: 'ObjectContent',
        properties: { key: 'value' },
        loc: createLoc(),
      };

      expect(formatter.testGetProp(content, 'key')).toBe('value');
    });

    it('should get prop from MixedContent', () => {
      const content: MixedContent = {
        type: 'MixedContent',
        properties: { key: 'value' },
        loc: createLoc(),
      };

      expect(formatter.testGetProp(content, 'key')).toBe('value');
    });

    it('should return undefined for TextContent', () => {
      const content: TextContent = {
        type: 'TextContent',
        value: 'text',
        loc: createLoc(),
      };

      expect(formatter.testGetProp(content, 'key')).toBeUndefined();
    });

    it('should return undefined for ArrayContent', () => {
      const content: ArrayContent = {
        type: 'ArrayContent',
        elements: ['item'],
        loc: createLoc(),
      };

      expect(formatter.testGetProp(content, 'key')).toBeUndefined();
    });
  });

  describe('getProps', () => {
    it('should get props from ObjectContent', () => {
      const content: ObjectContent = {
        type: 'ObjectContent',
        properties: { key1: 'value1', key2: 'value2' },
        loc: createLoc(),
      };

      expect(formatter.testGetProps(content)).toEqual({
        key1: 'value1',
        key2: 'value2',
      });
    });

    it('should get props from MixedContent', () => {
      const content: MixedContent = {
        type: 'MixedContent',
        properties: { key: 'value' },
        loc: createLoc(),
      };

      expect(formatter.testGetProps(content)).toEqual({ key: 'value' });
    });

    it('should return empty object for TextContent', () => {
      const content: TextContent = {
        type: 'TextContent',
        value: 'text',
        loc: createLoc(),
      };

      expect(formatter.testGetProps(content)).toEqual({});
    });

    it('should return empty object for ArrayContent', () => {
      const content: ArrayContent = {
        type: 'ArrayContent',
        elements: ['item'],
        loc: createLoc(),
      };

      expect(formatter.testGetProps(content)).toEqual({});
    });
  });

  describe('formatArray', () => {
    it('should format array as comma-separated string', () => {
      expect(formatter.testFormatArray(['a', 'b', 'c'])).toBe('a, b, c');
    });

    it('should handle mixed types', () => {
      expect(formatter.testFormatArray([1, 'two', true])).toBe('1, two, true');
    });

    it('should handle empty array', () => {
      expect(formatter.testFormatArray([])).toBe('');
    });
  });

  describe('truncate', () => {
    it('should not truncate short strings', () => {
      expect(formatter.testTruncate('short', 10)).toBe('short');
    });

    it('should truncate long strings with ellipsis', () => {
      expect(formatter.testTruncate('this is a long string', 10)).toBe('this is...');
    });

    it('should handle exact length', () => {
      expect(formatter.testTruncate('exact', 5)).toBe('exact');
    });
  });

  describe('getMetaField', () => {
    it('should get string field', () => {
      const ast: Program = {
        type: 'Program',
        meta: {
          type: 'MetaBlock',
          fields: { id: 'test-id' },
          loc: createLoc(),
        },
        uses: [],
        blocks: [],
        extends: [],
        loc: createLoc(),
      };

      expect(formatter.testGetMetaField(ast, 'id')).toBe('test-id');
    });

    it('should get number field as string', () => {
      const ast: Program = {
        type: 'Program',
        meta: {
          type: 'MetaBlock',
          fields: { syntax: 1 },
          loc: createLoc(),
        },
        uses: [],
        blocks: [],
        extends: [],
        loc: createLoc(),
      };

      expect(formatter.testGetMetaField(ast, 'syntax')).toBe('1');
    });

    it('should return undefined for missing field', () => {
      const ast: Program = {
        type: 'Program',
        meta: {
          type: 'MetaBlock',
          fields: {},
          loc: createLoc(),
        },
        uses: [],
        blocks: [],
        extends: [],
        loc: createLoc(),
      };

      expect(formatter.testGetMetaField(ast, 'missing')).toBeUndefined();
    });

    it('should return undefined for missing meta', () => {
      const ast: Program = {
        type: 'Program',
        uses: [],
        blocks: [],
        extends: [],
        loc: createLoc(),
      };

      expect(formatter.testGetMetaField(ast, 'id')).toBeUndefined();
    });
  });

  describe('getArrayElements', () => {
    it('should get elements from ArrayContent', () => {
      const content: ArrayContent = {
        type: 'ArrayContent',
        elements: ['a', 'b', 'c'],
        loc: createLoc(),
      };

      expect(formatter.testGetArrayElements(content)).toEqual(['a', 'b', 'c']);
    });

    it('should return empty for non-ArrayContent', () => {
      const content: TextContent = {
        type: 'TextContent',
        value: 'text',
        loc: createLoc(),
      };

      expect(formatter.testGetArrayElements(content)).toEqual([]);
    });
  });

  describe('valueToString', () => {
    it('should convert null to empty string', () => {
      expect(formatter.testValueToString(null)).toBe('');
    });

    it('should convert string as-is', () => {
      expect(formatter.testValueToString('hello')).toBe('hello');
    });

    it('should convert number to string', () => {
      expect(formatter.testValueToString(42)).toBe('42');
    });

    it('should convert boolean to string', () => {
      expect(formatter.testValueToString(true)).toBe('true');
      expect(formatter.testValueToString(false)).toBe('false');
    });

    it('should convert array to comma-separated string', () => {
      expect(formatter.testValueToString(['a', 'b', 'c'])).toBe('a, b, c');
    });

    it('should extract text from TextContent', () => {
      const textContent: TextContent = {
        type: 'TextContent',
        value: '  trimmed  ',
        loc: createLoc(),
      };
      expect(formatter.testValueToString(textContent)).toBe('trimmed');
    });

    it('should return empty for non-TextContent objects', () => {
      const objectContent: ObjectContent = {
        type: 'ObjectContent',
        properties: {},
        loc: createLoc(),
      };
      expect(formatter.testValueToString(objectContent as unknown as Value)).toBe('');
    });

    it('should return empty for objects without type property', () => {
      const plainObject = { key: 'value' };
      expect(formatter.testValueToString(plainObject as unknown as Value)).toBe('');
    });
  });

  describe('extractSectionWithCodeBlock', () => {
    it('should extract section with header and code block', () => {
      const text = '## Header\n\nSome content\n\n```js\ncode here\n```\n\nMore content';
      const result = formatter.testExtractSectionWithCodeBlock(text, '## Header');
      expect(result).toBe('## Header\n\nSome content\n\n```js\ncode here\n```');
    });

    it('should return null when header not found', () => {
      const text = '## Other\n\n```js\ncode\n```';
      const result = formatter.testExtractSectionWithCodeBlock(text, '## Header');
      expect(result).toBeNull();
    });

    it('should return null when no opening code block found', () => {
      const text = '## Header\n\nJust text without code block';
      const result = formatter.testExtractSectionWithCodeBlock(text, '## Header');
      expect(result).toBeNull();
    });

    it('should return null when no closing code block found', () => {
      const text = '## Header\n\n```js\nunclosed code block';
      const result = formatter.testExtractSectionWithCodeBlock(text, '## Header');
      expect(result).toBeNull();
    });
  });

  describe('formatStandardsList', () => {
    it('should convert array of strings to string array', () => {
      const input: Value[] = ['Strict mode enabled', 'Never use any type'];
      const result = (formatter as any).formatStandardsList(input);
      expect(result).toEqual(['Strict mode enabled', 'Never use any type']);
    });

    it('should return empty array for non-array input', () => {
      const result = (formatter as any).formatStandardsList({ key: 'value' });
      expect(result).toEqual([]);
    });

    it('should filter out empty strings', () => {
      const input: Value[] = ['Rule 1', '', 'Rule 2'];
      const result = (formatter as any).formatStandardsList(input);
      expect(result).toEqual(['Rule 1', 'Rule 2']);
    });

    it('should convert non-string values using valueToString', () => {
      const input: Value[] = ['Rule 1', 123, true];
      const result = (formatter as any).formatStandardsList(input);
      expect(result).toEqual(['Rule 1', '123', 'true']);
    });
  });

  describe('createRenderer', () => {
    it('should create renderer with default convention', () => {
      const renderer = formatter.testCreateRenderer();
      expect(renderer).toBeDefined();
    });

    it('should create renderer with xml convention', () => {
      const renderer = formatter.testCreateRenderer({ convention: 'xml' });
      expect(renderer).toBeDefined();
    });

    it('should pass prettier options to renderer', () => {
      const renderer = formatter.testCreateRenderer({
        prettier: { tabWidth: 4 },
      });
      expect(renderer).toBeDefined();
    });
  });

  describe('getPrettierOptions', () => {
    it('should return default options when none provided', () => {
      const options = formatter.testGetPrettierOptions();
      expect(options).toHaveProperty('tabWidth');
      expect(options).toHaveProperty('printWidth');
    });

    it('should merge provided options with defaults', () => {
      const options = formatter.testGetPrettierOptions({
        prettier: { tabWidth: 4 },
      });
      expect(options.tabWidth).toBe(4);
      expect(options).toHaveProperty('printWidth');
    });
  });

  describe('getOutputPath', () => {
    it('should return default output path', () => {
      const path = formatter.testGetOutputPath();
      expect(path).toBe('test.md');
    });

    it('should use custom output path when provided', () => {
      const path = formatter.testGetOutputPath({ outputPath: 'custom.md' });
      expect(path).toBe('custom.md');
    });
  });

  describe('normalizeMarkdownForPrettier', () => {
    it('should strip common leading indentation', () => {
      const content = '    # Header\n    Content\n    More content';
      const result = formatter.testNormalizeMarkdownForPrettier(content);
      expect(result).toBe('# Header\n\nContent\nMore content');
    });

    it('should preserve code block content', () => {
      const content = '# Header\n\n```js\n  const x = 1;\n```';
      const result = formatter.testNormalizeMarkdownForPrettier(content);
      expect(result).toContain('const x = 1;');
    });

    it('should add blank line after header', () => {
      const content = '# Header\nContent';
      const result = formatter.testNormalizeMarkdownForPrettier(content);
      expect(result).toBe('# Header\n\nContent');
    });

    it('should add blank line before list', () => {
      const content = 'Text\n- Item 1\n- Item 2';
      const result = formatter.testNormalizeMarkdownForPrettier(content);
      expect(result).toContain('\n\n- Item 1');
    });

    it('should not add extra blank line between list items', () => {
      const content = '- Item 1\n- Item 2\n- Item 3';
      const result = formatter.testNormalizeMarkdownForPrettier(content);
      expect(result).toBe('- Item 1\n- Item 2\n- Item 3');
    });

    it('should add blank line before numbered list', () => {
      const content = 'Text\n1. First\n2. Second';
      const result = formatter.testNormalizeMarkdownForPrettier(content);
      expect(result).toContain('\n\n1. First');
    });

    it('should escape __name__ pattern', () => {
      // The regex matches __x__ pattern (double underscores on both sides)
      const content = 'Use __test__ in paths';
      const result = formatter.testNormalizeMarkdownForPrettier(content);
      expect(result).toContain('\\_\\_test\\_\\_');
    });

    it('should escape glob asterisks outside backticks', () => {
      const content = 'packages/* glob pattern';
      const result = formatter.testNormalizeMarkdownForPrettier(content);
      expect(result).toContain('packages/\\*');
    });

    it('should not escape asterisks inside backticks', () => {
      const content = 'Use `packages/*` for glob';
      const result = formatter.testNormalizeMarkdownForPrettier(content);
      expect(result).toContain('`packages/*`');
    });

    it('should format markdown tables', () => {
      const content = '| Col1 | Col2 |\n|------|------|\n| a | b |';
      const result = formatter.testNormalizeMarkdownForPrettier(content);
      expect(result).toContain('| Col1 |');
      expect(result).toContain('| ---- |');
    });

    it('should add blank line before code block', () => {
      const content = 'Some text\n```js\ncode\n```';
      const result = formatter.testNormalizeMarkdownForPrettier(content);
      expect(result).toContain('Some text\n\n```js');
    });

    it('should handle empty content', () => {
      const result = formatter.testNormalizeMarkdownForPrettier('');
      expect(result).toBe('');
    });

    it('should handle content with only code blocks', () => {
      const content = '```js\ncode\n```';
      const result = formatter.testNormalizeMarkdownForPrettier(content);
      expect(result).toBe('```js\ncode\n```');
    });

    it('should handle text ending with colon before list', () => {
      const content = 'Steps:\n- Step 1\n- Step 2';
      const result = formatter.testNormalizeMarkdownForPrettier(content);
      expect(result).toContain('Steps:\n\n- Step 1');
    });

    it('should handle multiple tables', () => {
      const content = '| A | B |\n|---|---|\n| 1 | 2 |\n\nText\n\n| C | D |\n|---|---|\n| 3 | 4 |';
      const result = formatter.testNormalizeMarkdownForPrettier(content);
      // Tables are formatted with padding
      expect(result).toContain('| A');
      expect(result).toContain('| C');
    });
  });

  describe('stripAllIndent', () => {
    it('should strip all leading whitespace', () => {
      const content = '    Line 1\n        Line 2\n    Line 3';
      const result = formatter.testStripAllIndent(content);
      expect(result).toBe('Line 1\nLine 2\nLine 3');
    });

    it('should preserve code block content indentation', () => {
      const content = 'Text\n```\n  indented code\n```';
      const result = formatter.testStripAllIndent(content);
      expect(result).toContain('  indented code');
    });

    it('should add blank line before code block', () => {
      const content = 'Some text\n```\ncode\n```';
      const result = formatter.testStripAllIndent(content);
      expect(result).toContain('Some text\n\n```');
    });

    it('should escape __ in content', () => {
      const content = '__dirname is used';
      const result = formatter.testStripAllIndent(content);
      // stripAllIndent escapes __ to \_\_ so __dirname becomes \_\_dirname
      expect(result).toContain('\\_\\_dirname');
    });

    it('should escape glob patterns', () => {
      const content = 'Match packages/* files';
      const result = formatter.testStripAllIndent(content);
      expect(result).toContain('packages/\\*');
    });

    it('should add blank line before list after text', () => {
      const content = 'Text here\n- Item 1';
      const result = formatter.testStripAllIndent(content);
      expect(result).toContain('Text here\n\n- Item 1');
    });

    it('should add blank line before list after colon', () => {
      const content = 'Steps:\n- Step 1';
      const result = formatter.testStripAllIndent(content);
      expect(result).toContain('Steps:\n\n- Step 1');
    });

    it('should handle numbered lists', () => {
      const content = 'Steps\n1. First step';
      const result = formatter.testStripAllIndent(content);
      expect(result).toContain('\n\n1. First step');
    });

    it('should handle empty content', () => {
      const result = formatter.testStripAllIndent('');
      expect(result).toBe('');
    });

    it('should strip indent from code block markers', () => {
      const content = '    ```js\n    code\n    ```';
      const result = formatter.testStripAllIndent(content);
      expect(result).toContain('```js');
    });
  });
});
