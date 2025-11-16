import { describe, it, expect } from 'vitest';
import { deepMerge, isTextContent, isPlainObject, deepClone } from '../utils/merge';
import type { TextContent } from '../types';

describe('deepMerge coverage', () => {
  describe('array deduplication edge cases', () => {
    it('should deduplicate objects in arrays by JSON stringify', () => {
      const parent = { arr: [{ id: 1 }, { id: 2 }] };
      const child = { arr: [{ id: 2 }, { id: 3 }] };
      const result = deepMerge(parent, child);
      expect(result.arr).toHaveLength(3);
    });

    it('should deduplicate null values in arrays', () => {
      const parent = { arr: [null, 'a'] };
      const child = { arr: [null, 'b'] };
      const result = deepMerge(parent, child);
      // null is stringified as "null", so only one null should remain
      expect(result.arr.filter((x) => x === null)).toHaveLength(1);
    });

    it('should handle boolean values in array deduplication', () => {
      const parent = { arr: [true, false, true] };
      const child = { arr: [false, true] };
      const result = deepMerge(parent, child);
      expect(result.arr).toEqual([true, false]);
    });
  });

  describe('TextContent merging', () => {
    const createTextContent = (value: string): TextContent => ({
      type: 'TextContent',
      value,
      loc: { file: 'test', line: 1, column: 1 },
    });

    it('should use child when parent is not TextContent', () => {
      const parent = { text: 'not a TextContent' as unknown };
      const child = { text: createTextContent('Hello') };
      const result = deepMerge(parent, child) as { text: { value: string } };
      expect(result.text.value).toBe('Hello');
    });

    it('should prepend child text with prepend strategy', () => {
      const parent = { text: createTextContent('World') };
      const child = { text: createTextContent('Hello') };
      const result = deepMerge(parent, child, { textStrategy: 'prepend' });
      expect(result.text.value).toBe('Hello\n\nWorld');
    });

    it('should use custom separator', () => {
      const parent = { text: createTextContent('A') };
      const child = { text: createTextContent('B') };
      const result = deepMerge(parent, child, {
        textStrategy: 'concat',
        textSeparator: ' | ',
      });
      expect(result.text.value).toBe('A | B');
    });
  });

  describe('mergeValue edge cases', () => {
    it('should handle array child with non-array parent', () => {
      const parent = { items: 'not-an-array' as unknown };
      const child = { items: [1, 2, 3] };
      const result = deepMerge(parent, child);
      expect(result.items).toEqual([1, 2, 3]);
    });

    it('should handle object child with non-object parent', () => {
      const parent = { obj: 123 as unknown };
      const child = { obj: { key: 'value' } };
      const result = deepMerge(parent, child);
      expect(result.obj).toEqual({ key: 'value' });
    });
  });
});

describe('isTextContent coverage', () => {
  it('should return false for null', () => {
    expect(isTextContent(null)).toBe(false);
  });

  it('should return false for undefined', () => {
    expect(isTextContent(undefined)).toBe(false);
  });

  it('should return false for primitives', () => {
    expect(isTextContent('string')).toBe(false);
    expect(isTextContent(123)).toBe(false);
    expect(isTextContent(true)).toBe(false);
  });

  it('should return false for object without type', () => {
    expect(isTextContent({ value: 'text' })).toBe(false);
  });

  it('should return false for object with wrong type', () => {
    expect(isTextContent({ type: 'ObjectContent', value: 'text' })).toBe(false);
  });

  it('should return true for valid TextContent', () => {
    expect(
      isTextContent({
        type: 'TextContent',
        value: 'text',
        loc: { file: 'test', line: 1, column: 1 },
      })
    ).toBe(true);
  });
});

describe('isPlainObject coverage', () => {
  it('should return false for null', () => {
    expect(isPlainObject(null)).toBe(false);
  });

  it('should return false for arrays', () => {
    expect(isPlainObject([])).toBe(false);
    expect(isPlainObject([1, 2, 3])).toBe(false);
  });

  it('should return false for class instances', () => {
    class MyClass {
      value = 1;
    }
    expect(isPlainObject(new MyClass())).toBe(false);
  });

  it('should return true for plain objects', () => {
    expect(isPlainObject({})).toBe(true);
    expect(isPlainObject({ a: 1 })).toBe(true);
  });

  it('should return true for Object.create(Object.prototype)', () => {
    expect(isPlainObject(Object.create(Object.prototype))).toBe(true);
  });
});

describe('deepClone coverage', () => {
  it('should clone null', () => {
    expect(deepClone(null)).toBe(null);
  });

  it('should clone undefined', () => {
    expect(deepClone(undefined)).toBe(undefined);
  });

  it('should clone primitives', () => {
    expect(deepClone(123)).toBe(123);
    expect(deepClone('string')).toBe('string');
    expect(deepClone(true)).toBe(true);
  });

  it('should deep clone arrays', () => {
    const original = [1, [2, 3], { a: 4 }];
    const cloned = deepClone(original);

    expect(cloned).toEqual(original);
    expect(cloned).not.toBe(original);
    expect(cloned[1]).not.toBe(original[1]);
    expect(cloned[2]).not.toBe(original[2]);
  });

  it('should deep clone nested objects', () => {
    const original = { a: { b: { c: 1 } } };
    const cloned = deepClone(original);

    expect(cloned).toEqual(original);
    expect(cloned).not.toBe(original);
    expect(cloned.a).not.toBe(original.a);
    expect(cloned.a.b).not.toBe(original.a.b);
  });

  it('should handle mixed structures', () => {
    const original = {
      arr: [1, { nested: true }],
      obj: { items: [2, 3] },
      text: null as string | null,
    };
    const cloned = deepClone(original);

    expect(cloned).toEqual(original);
    expect(cloned.arr).not.toBe(original.arr);
    expect(cloned.obj.items).not.toBe(original.obj.items);
  });
});
