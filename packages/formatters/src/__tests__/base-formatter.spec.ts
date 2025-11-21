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
import { BaseFormatter } from '../base-formatter';
import type { FormatterOutput } from '../types';

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
          fields: { version: 1 },
          loc: createLoc(),
        },
        uses: [],
        blocks: [],
        extends: [],
        loc: createLoc(),
      };

      expect(formatter.testGetMetaField(ast, 'version')).toBe('1');
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
});
