import { describe, it, expect } from 'vitest';
import type {
  Program,
  Block,
  TextContent,
  ObjectContent,
  ArrayContent,
  MixedContent,
  Value,
} from '@promptscript/core';
import { resolveInheritance } from '../inheritance';

const createLoc = () => ({ file: '<test>', line: 1, column: 1 });

const createProgram = (overrides: Partial<Program> = {}): Program => ({
  type: 'Program',
  uses: [],
  blocks: [],
  extends: [],
  loc: createLoc(),
  ...overrides,
});

const createBlock = (name: string, content: Block['content']): Block => ({
  type: 'Block',
  name,
  content,
  loc: createLoc(),
});

const createTextContent = (value: string): TextContent => ({
  type: 'TextContent',
  value,
  loc: createLoc(),
});

const createObjectContent = (properties: Record<string, Value>): ObjectContent => ({
  type: 'ObjectContent',
  properties,
  loc: createLoc(),
});

const createArrayContent = (elements: Value[]): ArrayContent => ({
  type: 'ArrayContent',
  elements,
  loc: createLoc(),
});

const createMixedContent = (
  text: TextContent | undefined,
  properties: Record<string, Value>
): MixedContent => ({
  type: 'MixedContent',
  text,
  properties,
  loc: createLoc(),
});

describe('resolveInheritance additional coverage', () => {
  describe('meta merging edge cases', () => {
    it('should handle parent with meta and child without', () => {
      const parent = createProgram({
        meta: {
          type: 'MetaBlock',
          loc: createLoc(),
          fields: { id: 'parent', version: '1.0.0' },
        },
      });
      const child = createProgram({ meta: undefined });

      const result = resolveInheritance(parent, child);

      // Child has no meta, so parent's meta should be used
      expect(result.meta).toEqual(parent.meta);
    });

    it('should handle child with meta and parent without', () => {
      const parent = createProgram({ meta: undefined });
      const child = createProgram({
        meta: {
          type: 'MetaBlock',
          loc: createLoc(),
          fields: { id: 'child', version: '2.0.0' },
        },
      });

      const result = resolveInheritance(parent, child);

      expect(result.meta?.fields?.['id']).toBe('child');
    });
  });

  describe('block content merging edge cases', () => {
    it('should merge MixedContent with TextContent (parent is Mixed)', () => {
      const parent = createProgram({
        blocks: [
          createBlock(
            'identity',
            createMixedContent(createTextContent('parent text'), { key: 'value' })
          ),
        ],
      });
      const child = createProgram({
        blocks: [createBlock('identity', createTextContent('child text'))],
      });

      const result = resolveInheritance(parent, child);
      const content = result.blocks[0]?.content;

      expect(content?.type).toBe('MixedContent');
      if (content?.type === 'MixedContent') {
        expect(content.text?.value).toContain('parent text');
        expect(content.text?.value).toContain('child text');
      }
    });

    it('should merge TextContent with MixedContent (parent is Text)', () => {
      const parent = createProgram({
        blocks: [createBlock('identity', createTextContent('parent text'))],
      });
      const child = createProgram({
        blocks: [
          createBlock(
            'identity',
            createMixedContent(createTextContent('child text'), { key: 'value' })
          ),
        ],
      });

      const result = resolveInheritance(parent, child);
      const content = result.blocks[0]?.content;

      expect(content?.type).toBe('MixedContent');
      if (content?.type === 'MixedContent') {
        expect(content.text?.value).toContain('parent text');
        expect(content.text?.value).toContain('child text');
      }
    });

    it('should merge MixedContent with ObjectContent', () => {
      const parent = createProgram({
        blocks: [
          createBlock(
            'standards',
            createMixedContent(createTextContent('description'), { oldKey: 'old' })
          ),
        ],
      });
      const child = createProgram({
        blocks: [createBlock('standards', createObjectContent({ newKey: 'new' }))],
      });

      const result = resolveInheritance(parent, child);
      const content = result.blocks[0]?.content;

      expect(content?.type).toBe('MixedContent');
      if (content?.type === 'MixedContent') {
        expect(content.properties['oldKey']).toBe('old');
        expect(content.properties['newKey']).toBe('new');
      }
    });

    it('should merge ObjectContent with MixedContent', () => {
      const parent = createProgram({
        blocks: [createBlock('standards', createObjectContent({ oldKey: 'old' }))],
      });
      const child = createProgram({
        blocks: [
          createBlock(
            'standards',
            createMixedContent(createTextContent('description'), { newKey: 'new' })
          ),
        ],
      });

      const result = resolveInheritance(parent, child);
      const content = result.blocks[0]?.content;

      expect(content?.type).toBe('MixedContent');
      if (content?.type === 'MixedContent') {
        expect(content.properties['oldKey']).toBe('old');
        expect(content.properties['newKey']).toBe('new');
      }
    });

    it('should handle different content types (child wins)', () => {
      const parent = createProgram({
        blocks: [createBlock('data', createArrayContent(['a', 'b']))],
      });
      const child = createProgram({
        blocks: [createBlock('data', createObjectContent({ key: 'value' }))],
      });

      const result = resolveInheritance(parent, child);
      const content = result.blocks[0]?.content;

      // Child type wins when types are incompatible
      expect(content?.type).toBe('ObjectContent');
    });

    it('should handle MixedContent without text in parent', () => {
      const parent = createProgram({
        blocks: [createBlock('identity', createMixedContent(undefined, { key: 'value' }))],
      });
      const child = createProgram({
        blocks: [createBlock('identity', createTextContent('child text'))],
      });

      const result = resolveInheritance(parent, child);
      const content = result.blocks[0]?.content;

      expect(content?.type).toBe('MixedContent');
      if (content?.type === 'MixedContent') {
        expect(content.text?.value).toBe('child text');
      }
    });

    it('should handle MixedContent without text in child', () => {
      const parent = createProgram({
        blocks: [createBlock('identity', createTextContent('parent text'))],
      });
      const child = createProgram({
        blocks: [createBlock('identity', createMixedContent(undefined, { key: 'value' }))],
      });

      const result = resolveInheritance(parent, child);
      const content = result.blocks[0]?.content;

      expect(content?.type).toBe('MixedContent');
      if (content?.type === 'MixedContent') {
        expect(content.text?.value).toBe('parent text');
      }
    });
  });

  describe('property merging', () => {
    it('should unique-concat arrays in properties', () => {
      const parent = createProgram({
        blocks: [createBlock('config', createObjectContent({ items: ['a', 'b', 'c'] }))],
      });
      const child = createProgram({
        blocks: [createBlock('config', createObjectContent({ items: ['b', 'c', 'd'] }))],
      });

      const result = resolveInheritance(parent, child);
      const content = result.blocks[0]?.content as ObjectContent;

      expect(content.properties['items']).toEqual(['a', 'b', 'c', 'd']);
    });

    it('should merge TextContent values in properties', () => {
      const parent = createProgram({
        blocks: [
          createBlock(
            'config',
            createObjectContent({
              desc: createTextContent('parent desc'),
            })
          ),
        ],
      });
      const child = createProgram({
        blocks: [
          createBlock(
            'config',
            createObjectContent({
              desc: createTextContent('child desc'),
            })
          ),
        ],
      });

      const result = resolveInheritance(parent, child);
      const content = result.blocks[0]?.content as ObjectContent;
      const desc = content.properties['desc'] as TextContent;

      expect(desc.value).toContain('parent desc');
      expect(desc.value).toContain('child desc');
    });

    it('should deep merge nested objects in properties', () => {
      const parent = createProgram({
        blocks: [
          createBlock(
            'config',
            createObjectContent({
              nested: { a: 1, b: 2 },
            })
          ),
        ],
      });
      const child = createProgram({
        blocks: [
          createBlock(
            'config',
            createObjectContent({
              nested: { b: 3, c: 4 },
            })
          ),
        ],
      });

      const result = resolveInheritance(parent, child);
      const content = result.blocks[0]?.content as ObjectContent;

      expect(content.properties['nested']).toEqual({ a: 1, b: 3, c: 4 });
    });

    it('should handle primitive type mismatch (child wins)', () => {
      const parent = createProgram({
        blocks: [createBlock('config', createObjectContent({ value: 'string' }))],
      });
      const child = createProgram({
        blocks: [createBlock('config', createObjectContent({ value: 123 }))],
      });

      const result = resolveInheritance(parent, child);
      const content = result.blocks[0]?.content as ObjectContent;

      expect(content.properties['value']).toBe(123);
    });
  });

  describe('array unique concat with objects', () => {
    it('should deduplicate objects by JSON serialization', () => {
      const parent = createProgram({
        blocks: [
          createBlock(
            'config',
            createObjectContent({
              items: [{ id: 1 }, { id: 2 }],
            })
          ),
        ],
      });
      const child = createProgram({
        blocks: [
          createBlock(
            'config',
            createObjectContent({
              items: [{ id: 2 }, { id: 3 }],
            })
          ),
        ],
      });

      const result = resolveInheritance(parent, child);
      const content = result.blocks[0]?.content as ObjectContent;
      const items = content.properties['items'] as Array<{ id: number }>;

      expect(items.length).toBe(3);
      expect(items.map((i) => i.id)).toEqual([1, 2, 3]);
    });
  });

  describe('mixed content merging', () => {
    it('should merge MixedContent completely', () => {
      const parent = createProgram({
        blocks: [
          createBlock(
            'identity',
            createMixedContent(createTextContent('parent text'), {
              parentKey: 'parentValue',
            })
          ),
        ],
      });
      const child = createProgram({
        blocks: [
          createBlock(
            'identity',
            createMixedContent(createTextContent('child text'), {
              childKey: 'childValue',
            })
          ),
        ],
      });

      const result = resolveInheritance(parent, child);
      const content = result.blocks[0]?.content as MixedContent;

      expect(content.text?.value).toContain('parent text');
      expect(content.text?.value).toContain('child text');
      expect(content.properties['parentKey']).toBe('parentValue');
      expect(content.properties['childKey']).toBe('childValue');
    });

    it('should merge MixedContent when parent has no text', () => {
      const parent = createProgram({
        blocks: [createBlock('identity', createMixedContent(undefined, { parentKey: 'value' }))],
      });
      const child = createProgram({
        blocks: [
          createBlock(
            'identity',
            createMixedContent(createTextContent('child text'), {
              childKey: 'value',
            })
          ),
        ],
      });

      const result = resolveInheritance(parent, child);
      const content = result.blocks[0]?.content as MixedContent;

      expect(content.text?.value).toBe('child text');
      expect(content.properties['parentKey']).toBe('value');
      expect(content.properties['childKey']).toBe('value');
    });

    it('should merge MixedContent when child has no text', () => {
      const parent = createProgram({
        blocks: [
          createBlock(
            'identity',
            createMixedContent(createTextContent('parent text'), {
              parentKey: 'value',
            })
          ),
        ],
      });
      const child = createProgram({
        blocks: [createBlock('identity', createMixedContent(undefined, { childKey: 'value' }))],
      });

      const result = resolveInheritance(parent, child);
      const content = result.blocks[0]?.content as MixedContent;

      expect(content.text?.value).toBe('parent text');
      expect(content.properties['parentKey']).toBe('value');
      expect(content.properties['childKey']).toBe('value');
    });
  });

  describe('deepCloneValue coverage', () => {
    it('should deep clone object values in properties', () => {
      const parent = createProgram({
        blocks: [
          createBlock(
            'config',
            createObjectContent({
              nested: { a: 1, b: { c: 2 } },
            })
          ),
        ],
      });
      const child = createProgram({
        blocks: [
          createBlock(
            'config',
            createObjectContent({
              extra: 'value',
            })
          ),
        ],
      });

      const result = resolveInheritance(parent, child);
      const content = result.blocks[0]?.content as ObjectContent;
      const nested = content.properties['nested'] as Record<string, unknown>;

      // Verify deep clone created new object references
      expect(nested['a']).toBe(1);
      expect((nested['b'] as Record<string, unknown>)['c']).toBe(2);
    });

    it('should deep clone array values in properties', () => {
      const parent = createProgram({
        blocks: [
          createBlock(
            'config',
            createObjectContent({
              items: [{ id: 1 }, { id: 2 }],
            })
          ),
        ],
      });
      const child = createProgram({
        blocks: [
          createBlock(
            'config',
            createObjectContent({
              extra: 'value',
            })
          ),
        ],
      });

      const result = resolveInheritance(parent, child);
      const content = result.blocks[0]?.content as ObjectContent;
      const items = content.properties['items'] as Array<{ id: number }>;

      expect(items).toHaveLength(2);
      expect(items[0]?.id).toBe(1);
    });

    it('should handle null values in deepClone', () => {
      const parent = createProgram({
        blocks: [
          createBlock(
            'config',
            createObjectContent({
              nullValue: null,
            })
          ),
        ],
      });
      const child = createProgram({
        blocks: [createBlock('config', createObjectContent({ other: 'value' }))],
      });

      const result = resolveInheritance(parent, child);
      const content = result.blocks[0]?.content as ObjectContent;

      expect(content.properties['nullValue']).toBeNull();
      expect(content.properties['other']).toBe('value');
    });

    it('should handle primitive values in deepClone', () => {
      const parent = createProgram({
        blocks: [
          createBlock(
            'config',
            createObjectContent({
              str: 'string',
              num: 42,
              bool: true,
            })
          ),
        ],
      });
      const child = createProgram({
        blocks: [createBlock('config', createObjectContent({ extra: 'value' }))],
      });

      const result = resolveInheritance(parent, child);
      const content = result.blocks[0]?.content as ObjectContent;

      expect(content.properties['str']).toBe('string');
      expect(content.properties['num']).toBe(42);
      expect(content.properties['bool']).toBe(true);
    });
  });
});
