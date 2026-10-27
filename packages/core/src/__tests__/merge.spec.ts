import { describe, it, expect } from 'vitest';
import {
  deepMerge,
  isTextContent,
  isPlainObject,
  deepClone,
  DEFAULT_MERGE_OPTIONS,
} from '../utils/merge.js';
import { ErrorCode } from '../errors/base.js';
import type { TextContent } from '../types/index.js';

describe('deepMerge', () => {
  describe('primitive values', () => {
    it('should let child win for primitives', () => {
      const parent = { a: 1, b: 'hello' };
      const child = { a: 2 };
      expect(deepMerge(parent, child)).toEqual({ a: 2, b: 'hello' });
    });

    it('should preserve parent values not in child', () => {
      const parent = { a: 1, b: 2, c: 3 };
      const child = { b: 20 };
      expect(deepMerge(parent, child)).toEqual({ a: 1, b: 20, c: 3 });
    });

    it('should allow null to overwrite', () => {
      const parent = { a: 1 as number | null, b: 2 };
      const child = { a: null };
      expect(deepMerge(parent, child)).toEqual({ a: null, b: 2 });
    });

    it('should skip undefined child values', () => {
      const parent = { a: 1, b: 2 };
      const child = { a: undefined };
      expect(deepMerge(parent, child)).toEqual({ a: 1, b: 2 });
    });
  });

  describe('nested objects', () => {
    it('should deep merge nested objects', () => {
      const parent = { nested: { a: 1, b: 2 } as Record<string, number> };
      const child = { nested: { b: 20, c: 30 } };
      expect(deepMerge(parent, child)).toEqual({
        nested: { a: 1, b: 20, c: 30 },
      });
    });

    it('should replace non-object with object', () => {
      const parent = { value: 'string' as unknown };
      const child = { value: { nested: true } };
      expect(deepMerge(parent, child)).toEqual({
        value: { nested: true },
      });
    });
  });

  describe('arrays', () => {
    it('should unique concat arrays by default', () => {
      const parent = { arr: [1, 2, 3] };
      const child = { arr: [2, 3, 4] };
      const result = deepMerge(parent, child);
      expect(result.arr).toEqual([1, 2, 3, 4]);
    });

    it('should concat arrays with concat strategy', () => {
      const parent = { arr: [1, 2] };
      const child = { arr: [2, 3] };
      const result = deepMerge(parent, child, { arrayStrategy: 'concat' });
      expect(result.arr).toEqual([1, 2, 2, 3]);
    });

    it('should replace arrays with replace strategy', () => {
      const parent = { arr: [1, 2, 3] };
      const child = { arr: [4, 5] };
      const result = deepMerge(parent, child, { arrayStrategy: 'replace' });
      expect(result.arr).toEqual([4, 5]);
    });

    it('should create array from empty parent', () => {
      const parent = { other: 'value', arr: [] as number[] };
      const child = { arr: [1, 2] };
      const result = deepMerge(parent, child);
      expect(result.arr).toEqual([1, 2]);
    });
  });

  describe('TextContent', () => {
    const createTextContent = (value: string): TextContent => ({
      type: 'TextContent',
      value,
      loc: { file: 'test', line: 1, column: 1 },
    });

    it('should concat text content by default', () => {
      const parent = { text: createTextContent('Hello') };
      const child = { text: createTextContent('World') };
      const result = deepMerge(parent, child);
      expect(result.text.value).toBe('Hello\n\nWorld');
    });

    it('should replace text with replace strategy', () => {
      const parent = { text: createTextContent('Hello') };
      const child = { text: createTextContent('World') };
      const result = deepMerge(parent, child, { textStrategy: 'replace' });
      expect(result.text.value).toBe('World');
    });

    it('should prepend text with prepend strategy', () => {
      const parent = { text: createTextContent('Hello') };
      const child = { text: createTextContent('World') };
      const result = deepMerge(parent, child, { textStrategy: 'prepend' });
      expect(result.text.value).toBe('World\n\nHello');
    });

    it('should use custom text separator', () => {
      const parent = { text: createTextContent('Hello') };
      const child = { text: createTextContent('World') };
      const result = deepMerge(parent, child, { textSeparator: ' - ' });
      expect(result.text.value).toBe('Hello - World');
    });

    it('should handle missing parent text', () => {
      const parent = { other: 'value', text: undefined as TextContent | undefined };
      const child = { text: createTextContent('World') };
      const result = deepMerge(parent, child);
      expect((result.text as TextContent).value).toBe('World');
    });
  });
});

describe('deepMerge reserved keys', () => {
  // JSON.parse and YAML parsers give "__proto__" as an own key, like a config file would.
  const parsed = (json: string): Record<string, unknown> =>
    JSON.parse(json) as Record<string, unknown>;

  it('refuses a "__proto__" key instead of setting the prototype', () => {
    const parent = { codeowners: { prompts: true } };
    const child = parsed('{"codeowners":{"__proto__":{"output":"CODEOWNERS"}}}');

    const merge = (): unknown => deepMerge(parent, child);

    expect(merge).toThrow(
      'The key "__proto__" under "codeowners" is reserved, so it cannot be merged. Rename or remove it.'
    );
    expect(merge).toThrow(expect.objectContaining({ code: ErrorCode.INVALID_VALUE }));
    expect(({} as Record<string, unknown>)['output']).toBeUndefined();
  });

  it('refuses a "constructor" key', () => {
    const parent: Record<string, unknown> = { a: 1 };
    const child = { constructor: { prototype: { polluted: true } } };

    expect(() => deepMerge(parent, child)).toThrow(
      'The key "constructor" at the top level is reserved, so it cannot be merged. Rename or remove it.'
    );
  });

  it('refuses a "prototype" key in the parent too', () => {
    const parent: Record<string, unknown> = { block: { prototype: { x: 1 } } };
    const child = { block: { y: 2 } };

    expect(() => deepMerge(parent, child)).toThrow(
      'The key "prototype" under "block" is reserved, so it cannot be merged. Rename or remove it.'
    );
  });

  it('reads only own properties of the parent', () => {
    const parent = Object.create({ inherited: { a: 1 } }) as Record<string, unknown>;
    parent['own'] = { b: 2 };
    const child = { inherited: { c: 3 }, toString: { d: 4 } };

    const merged = deepMerge(parent, child);

    expect(merged).toEqual({ own: { b: 2 }, inherited: { c: 3 }, toString: { d: 4 } });
    expect(Object.getPrototypeOf(merged)).toBe(Object.prototype);
  });
});

describe('DEFAULT_MERGE_OPTIONS', () => {
  it('should have expected defaults', () => {
    expect(DEFAULT_MERGE_OPTIONS).toEqual({
      arrayStrategy: 'unique',
      textStrategy: 'concat',
      textSeparator: '\n\n',
    });
  });
});

describe('isTextContent', () => {
  it('should return true for TextContent objects', () => {
    const text: TextContent = {
      type: 'TextContent',
      value: 'test',
      loc: { file: 'test', line: 1, column: 1 },
    };
    expect(isTextContent(text)).toBe(true);
  });

  it('should return false for non-TextContent', () => {
    expect(isTextContent(null)).toBe(false);
    expect(isTextContent(undefined)).toBe(false);
    expect(isTextContent('string')).toBe(false);
    expect(isTextContent({ type: 'Other' })).toBe(false);
    expect(isTextContent({ value: 'test' })).toBe(false);
  });
});

describe('isPlainObject', () => {
  it('should return true for plain objects', () => {
    expect(isPlainObject({})).toBe(true);
    expect(isPlainObject({ a: 1 })).toBe(true);
  });

  it('should return false for non-objects', () => {
    expect(isPlainObject(null)).toBe(false);
    expect(isPlainObject(undefined)).toBe(false);
    expect(isPlainObject('string')).toBe(false);
    expect(isPlainObject(123)).toBe(false);
  });

  it('should return false for arrays', () => {
    expect(isPlainObject([])).toBe(false);
    expect(isPlainObject([1, 2])).toBe(false);
  });

  it('should return false for class instances', () => {
    class TestClass {
      value = 0;
    }
    expect(isPlainObject(new TestClass())).toBe(false);
  });
});

describe('deepClone', () => {
  it('should clone primitives', () => {
    expect(deepClone(1)).toBe(1);
    expect(deepClone('hello')).toBe('hello');
    expect(deepClone(null)).toBe(null);
    expect(deepClone(true)).toBe(true);
  });

  it('should clone arrays', () => {
    const arr = [1, 2, [3, 4]];
    const cloned = deepClone(arr);
    expect(cloned).toEqual(arr);
    expect(cloned).not.toBe(arr);
    expect(cloned[2]).not.toBe(arr[2]);
  });

  it('should clone objects', () => {
    const obj = { a: 1, b: { c: 2 } };
    const cloned = deepClone(obj);
    expect(cloned).toEqual(obj);
    expect(cloned).not.toBe(obj);
    expect(cloned.b).not.toBe(obj.b);
  });

  it('should handle mixed nested structures', () => {
    const value = {
      array: [1, { nested: true }],
      object: { arr: [2, 3] },
    };
    const cloned = deepClone(value);
    expect(cloned).toEqual(value);
    expect(cloned.array).not.toBe(value.array);
    expect(cloned.object.arr).not.toBe(value.object.arr);
  });

  it('keeps an own "__proto__" key as a key instead of setting the prototype', () => {
    const value = JSON.parse('{"__proto__":{"output":"CODEOWNERS"},"a":1}') as Record<
      string,
      unknown
    >;

    const cloned = deepClone(value);

    expect(Object.getPrototypeOf(cloned)).toBe(Object.prototype);
    expect(Object.keys(cloned)).toEqual(['__proto__', 'a']);
    expect(cloned['output']).toBeUndefined();
    expect(JSON.stringify(cloned)).toBe(JSON.stringify(value));
  });
});
