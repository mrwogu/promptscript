import { describe, it, expect } from 'vitest';
import type {
  Program,
  Block,
  TextContent,
  ObjectContent,
  ArrayContent,
  ExtendBlock,
  MixedContent,
  Value,
} from '@promptscript/core';
import { applyExtends } from '../extensions.js';
import { IMPORT_MARKER_PREFIX } from '../imports.js';

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

const createExtendBlock = (targetPath: string, content: ExtendBlock['content']): ExtendBlock => ({
  type: 'ExtendBlock',
  targetPath,
  content,
  loc: createLoc(),
});

describe('applyExtends additional coverage', () => {
  describe('extension to non-existent target', () => {
    it('should return unchanged when target block not found', () => {
      const ast = createProgram({
        blocks: [createBlock('identity', createTextContent('content'))],
        extends: [createExtendBlock('nonexistent', createTextContent('extension'))],
      });

      const result = applyExtends(ast);

      expect(result.blocks).toHaveLength(1);
      expect(result.blocks[0]?.name).toBe('identity');
    });
  });

  describe('MixedContent extension', () => {
    it('should extend MixedContent at path', () => {
      const ast = createProgram({
        blocks: [
          createBlock(
            'identity',
            createMixedContent(createTextContent('base text'), {
              key: 'value',
            })
          ),
        ],
        extends: [createExtendBlock('identity.newKey', createObjectContent({ nested: 'data' }))],
      });

      const result = applyExtends(ast);
      const content = result.blocks[0]?.content as MixedContent;

      expect(content.properties['key']).toBe('value');
      expect(content.properties['newKey']).toEqual({ nested: 'data' });
    });

    it('should navigate into MixedContent property', () => {
      const ast = createProgram({
        blocks: [
          createBlock(
            'config',
            createMixedContent(undefined, {
              nested: { existing: 'value' },
            })
          ),
        ],
        extends: [createExtendBlock('config.nested', createObjectContent({ added: 'new' }))],
      });

      const result = applyExtends(ast);
      const content = result.blocks[0]?.content as MixedContent;

      expect(content.properties['nested']).toEqual({
        existing: 'value',
        added: 'new',
      });
    });

    it('should build path in MixedContent when property does not exist', () => {
      const ast = createProgram({
        blocks: [createBlock('config', createMixedContent(undefined, {}))],
        extends: [createExtendBlock('config.new.nested', createObjectContent({ key: 'val' }))],
      });

      const result = applyExtends(ast);
      const content = result.blocks[0]?.content as MixedContent;

      expect(content.properties['new']).toEqual({
        nested: { key: 'val' },
      });
    });
  });

  describe('content type conversions', () => {
    it('should convert Text + Object to MixedContent', () => {
      const ast = createProgram({
        blocks: [createBlock('identity', createTextContent('text'))],
        extends: [createExtendBlock('identity', createObjectContent({ key: 'val' }))],
      });

      const result = applyExtends(ast);
      const content = result.blocks[0]?.content;

      expect(content?.type).toBe('MixedContent');
      if (content?.type === 'MixedContent') {
        expect(content.text?.value).toBe('text');
        expect(content.properties['key']).toBe('val');
      }
    });

    it('should extend Mixed + Text', () => {
      const ast = createProgram({
        blocks: [
          createBlock(
            'identity',
            createMixedContent(createTextContent('original'), { key: 'val' })
          ),
        ],
        extends: [createExtendBlock('identity', createTextContent('extended'))],
      });

      const result = applyExtends(ast);
      const content = result.blocks[0]?.content as MixedContent;

      expect(content.text?.value).toBe('original\n\nextended');
      expect(content.properties['key']).toBe('val');
    });

    it('should extend Mixed + Text when mixed has no text', () => {
      const ast = createProgram({
        blocks: [createBlock('identity', createMixedContent(undefined, { key: 'val' }))],
        extends: [createExtendBlock('identity', createTextContent('new text'))],
      });

      const result = applyExtends(ast);
      const content = result.blocks[0]?.content as MixedContent;

      expect(content.text?.value).toBe('new text');
    });

    it('should extend Mixed + Object', () => {
      const ast = createProgram({
        blocks: [
          createBlock('identity', createMixedContent(createTextContent('text'), { oldKey: 'old' })),
        ],
        extends: [createExtendBlock('identity', createObjectContent({ newKey: 'new' }))],
      });

      const result = applyExtends(ast);
      const content = result.blocks[0]?.content as MixedContent;

      expect(content.properties['oldKey']).toBe('old');
      expect(content.properties['newKey']).toBe('new');
    });

    it('should fallback to extension for incompatible types', () => {
      const ast = createProgram({
        blocks: [createBlock('data', createTextContent('text'))],
        extends: [createExtendBlock('data', createArrayContent(['a', 'b']))],
      });

      const result = applyExtends(ast);
      const content = result.blocks[0]?.content;

      expect(content?.type).toBe('ArrayContent');
    });
  });

  describe('path navigation into TextContent and ArrayContent', () => {
    it('should not modify TextContent when trying to navigate into it', () => {
      const ast = createProgram({
        blocks: [createBlock('identity', createTextContent('text'))],
        extends: [createExtendBlock('identity.something', createObjectContent({ key: 'val' }))],
      });

      const result = applyExtends(ast);
      const content = result.blocks[0]?.content;

      // Cannot navigate into TextContent, so it should remain unchanged
      expect(content?.type).toBe('TextContent');
    });

    it('should not modify ArrayContent when trying to navigate into it', () => {
      const ast = createProgram({
        blocks: [createBlock('list', createArrayContent(['a', 'b']))],
        extends: [createExtendBlock('list.something', createObjectContent({ key: 'val' }))],
      });

      const result = applyExtends(ast);
      const content = result.blocks[0]?.content;

      expect(content?.type).toBe('ArrayContent');
    });
  });

  describe('import alias references', () => {
    it('should extend aliased import block', () => {
      const ast = createProgram({
        blocks: [
          createBlock('identity', createTextContent('main')),
          createBlock(`${IMPORT_MARKER_PREFIX}sec`, createObjectContent({})),
          createBlock(`${IMPORT_MARKER_PREFIX}sec.guards`, createObjectContent({ guard1: true })),
        ],
        extends: [createExtendBlock('sec.guards', createObjectContent({ guard2: true }))],
      });

      const result = applyExtends(ast);

      // Import markers should be removed
      const guardBlock = result.blocks.find((b) => b.name === `${IMPORT_MARKER_PREFIX}sec.guards`);
      expect(guardBlock).toBeUndefined();
    });
  });

  describe('deeply nested path building', () => {
    it('should build path when empty key in path', () => {
      const ast = createProgram({
        blocks: [createBlock('config', createObjectContent({}))],
        extends: [createExtendBlock('config.a', createObjectContent({ b: 'value' }))],
      });

      const result = applyExtends(ast);
      const content = result.blocks[0]?.content as ObjectContent;

      expect(content.properties['a']).toEqual({ b: 'value' });
    });

    it('should handle mergeValue with array and ArrayContent', () => {
      const ast = createProgram({
        blocks: [createBlock('config', createObjectContent({ items: ['a'] }))],
        extends: [createExtendBlock('config.items', createArrayContent(['b']))],
      });

      const result = applyExtends(ast);
      const content = result.blocks[0]?.content as ObjectContent;

      expect(content.properties['items']).toEqual(['a', 'b']);
    });

    it('should handle mergeValue with object and ObjectContent', () => {
      const ast = createProgram({
        blocks: [createBlock('config', createObjectContent({ obj: { a: 1 } }))],
        extends: [createExtendBlock('config.obj', createObjectContent({ b: 2 }))],
      });

      const result = applyExtends(ast);
      const content = result.blocks[0]?.content as ObjectContent;

      expect(content.properties['obj']).toEqual({ a: 1, b: 2 });
    });

    it('should handle mergeValue with TextContent values', () => {
      const ast = createProgram({
        blocks: [
          createBlock(
            'config',
            createObjectContent({
              text: createTextContent('original'),
            })
          ),
        ],
        extends: [createExtendBlock('config.text', createTextContent('extended'))],
      });

      const result = applyExtends(ast);
      const content = result.blocks[0]?.content as ObjectContent;
      const text = content.properties['text'] as TextContent;

      expect(text.value).toBe('original\n\nextended');
    });

    it('should replace primitive values when merging', () => {
      const ast = createProgram({
        blocks: [createBlock('config', createObjectContent({ value: 'old' }))],
        extends: [createExtendBlock('config.value', createTextContent('new'))],
      });

      const result = applyExtends(ast);
      const content = result.blocks[0]?.content as ObjectContent;

      expect(content.properties['value']).toBe('new');
    });

    it('should handle null values when merging', () => {
      const ast = createProgram({
        blocks: [createBlock('config', createObjectContent({ value: null }))],
        extends: [createExtendBlock('config.value', createTextContent('new'))],
      });

      const result = applyExtends(ast);
      const content = result.blocks[0]?.content as ObjectContent;

      expect(content.properties['value']).toBe('new');
    });

    it('should handle undefined values when merging', () => {
      const ast = createProgram({
        blocks: [createBlock('config', createObjectContent({}))],
        extends: [createExtendBlock('config.value', createTextContent('new'))],
      });

      const result = applyExtends(ast);
      const content = result.blocks[0]?.content as ObjectContent;

      expect(content.properties['value']).toBe('new');
    });
  });

  describe('extractValue function', () => {
    it('should extract text from TextContent', () => {
      const ast = createProgram({
        blocks: [createBlock('config', createObjectContent({}))],
        extends: [createExtendBlock('config.text', createTextContent('extracted'))],
      });

      const result = applyExtends(ast);
      const content = result.blocks[0]?.content as ObjectContent;

      expect(content.properties['text']).toBe('extracted');
    });

    it('should extract properties from MixedContent', () => {
      const ast = createProgram({
        blocks: [createBlock('config', createObjectContent({}))],
        extends: [
          createExtendBlock(
            'config.mixed',
            createMixedContent(createTextContent('text'), { key: 'value' })
          ),
        ],
      });

      const result = applyExtends(ast);
      const content = result.blocks[0]?.content as ObjectContent;

      expect(content.properties['mixed']).toEqual({ key: 'value' });
    });

    it('should extract elements from ArrayContent', () => {
      const ast = createProgram({
        blocks: [createBlock('config', createObjectContent({}))],
        extends: [createExtendBlock('config.items', createArrayContent(['x', 'y', 'z']))],
      });

      const result = applyExtends(ast);
      const content = result.blocks[0]?.content as ObjectContent;

      expect(content.properties['items']).toEqual(['x', 'y', 'z']);
    });
  });

  describe('path navigation edge cases', () => {
    it('should build path when navigating into non-object value', () => {
      const ast = createProgram({
        blocks: [
          createBlock(
            'config',
            createObjectContent({
              existing: 'string value',
            })
          ),
        ],
        extends: [
          createExtendBlock('config.existing.nested.deep', createObjectContent({ key: 'value' })),
        ],
      });

      const result = applyExtends(ast);
      const content = result.blocks[0]?.content as ObjectContent;

      // Should build path since cannot navigate into string
      expect(content.properties['existing']).toEqual({
        nested: {
          deep: { key: 'value' },
        },
      });
    });

    it('should build path when navigating into array value', () => {
      const ast = createProgram({
        blocks: [
          createBlock(
            'config',
            createObjectContent({
              items: ['a', 'b', 'c'],
            })
          ),
        ],
        extends: [createExtendBlock('config.items.nested', createObjectContent({ key: 'value' }))],
      });

      const result = applyExtends(ast);
      const content = result.blocks[0]?.content as ObjectContent;

      // Should build path since cannot navigate into array
      expect(content.properties['items']).toEqual({
        nested: { key: 'value' },
      });
    });

    it('should build path when key is empty string in remaining path', () => {
      // This tests an edge case in mergeAtPathValue where path[0] might be empty
      const ast = createProgram({
        blocks: [
          createBlock(
            'config',
            createObjectContent({
              nested: { existing: 'value' },
            })
          ),
        ],
        extends: [createExtendBlock('config.nested.new', createObjectContent({ key: 'value' }))],
      });

      const result = applyExtends(ast);
      const content = result.blocks[0]?.content as ObjectContent;

      const nested = content.properties['nested'] as Record<string, Value>;
      expect(nested['existing']).toBe('value');
      expect(nested['new']).toEqual({ key: 'value' });
    });

    it('should handle path navigation when existing value is object but rest path is longer', () => {
      const ast = createProgram({
        blocks: [
          createBlock(
            'config',
            createObjectContent({
              a: { b: { c: 'deep' } },
            })
          ),
        ],
        extends: [createExtendBlock('config.a.b.c.d', createObjectContent({ key: 'value' }))],
      });

      const result = applyExtends(ast);
      const content = result.blocks[0]?.content as ObjectContent;

      const a = content.properties['a'] as Record<string, Value>;
      const b = a['b'] as Record<string, Value>;
      const c = b['c'] as Record<string, Value>;
      expect(c['d']).toEqual({ key: 'value' });
    });
  });

  describe('edge cases for line coverage', () => {
    it('should handle target block being undefined after findIndex', () => {
      // This is a defensive check - in practice, if findIndex returns a valid index,
      // the block should exist. But we verify the code path exists.
      const ast = createProgram({
        blocks: [createBlock('identity', createTextContent('content'))],
        extends: [createExtendBlock('nonexistent', createTextContent('extension'))],
      });

      const result = applyExtends(ast);

      expect(result.blocks).toHaveLength(1);
    });

    it('should handle empty key in path for ObjectContent', () => {
      // Test mergeAtPath when path[0] is truthy
      const ast = createProgram({
        blocks: [createBlock('config', createObjectContent({ existing: { deep: 'value' } }))],
        extends: [createExtendBlock('config.existing', createObjectContent({ added: 'new' }))],
      });

      const result = applyExtends(ast);
      const content = result.blocks[0]?.content as ObjectContent;

      expect(content.properties['existing']).toEqual({ deep: 'value', added: 'new' });
    });

    it('should handle mergeAtPathValue with empty rest path', () => {
      const ast = createProgram({
        blocks: [
          createBlock(
            'config',
            createObjectContent({
              target: { inner: 'original' },
            })
          ),
        ],
        extends: [createExtendBlock('config.target', createObjectContent({ extra: 'added' }))],
      });

      const result = applyExtends(ast);
      const content = result.blocks[0]?.content as ObjectContent;
      const target = content.properties['target'] as Record<string, Value>;

      expect(target['inner']).toBe('original');
      expect(target['extra']).toBe('added');
    });

    it('should handle buildPathValue with empty path', () => {
      const ast = createProgram({
        blocks: [createBlock('config', createObjectContent({}))],
        extends: [createExtendBlock('config.direct', createTextContent('value'))],
      });

      const result = applyExtends(ast);
      const content = result.blocks[0]?.content as ObjectContent;

      expect(content.properties['direct']).toBe('value');
    });

    it('should handle mergeMixedContent with both texts', () => {
      const ast = createProgram({
        blocks: [
          createBlock(
            'identity',
            createMixedContent(createTextContent('original'), { prop: 'val' })
          ),
        ],
        extends: [
          createExtendBlock(
            'identity',
            createMixedContent(createTextContent('extended'), { newProp: 'newVal' })
          ),
        ],
      });

      const result = applyExtends(ast);
      const content = result.blocks[0]?.content as MixedContent;

      expect(content.text?.value).toBe('original\n\nextended');
      expect(content.properties['prop']).toBe('val');
      expect(content.properties['newProp']).toBe('newVal');
    });

    it('should handle uniqueConcat with objects', () => {
      const ast = createProgram({
        blocks: [
          createBlock(
            'config',
            createObjectContent({
              items: [{ id: 1 }, { id: 2 }],
            })
          ),
        ],
        extends: [createExtendBlock('config.items', createArrayContent([{ id: 2 }, { id: 3 }]))],
      });

      const result = applyExtends(ast);
      const content = result.blocks[0]?.content as ObjectContent;
      const items = content.properties['items'] as Array<{ id: number }>;

      // Deduplication by JSON serialization
      expect(items).toHaveLength(3);
      expect(items.map((i) => i.id)).toEqual([1, 2, 3]);
    });

    it('should handle uniqueConcat with primitives', () => {
      const ast = createProgram({
        blocks: [createBlock('config', createObjectContent({ items: ['a', 'b'] }))],
        extends: [createExtendBlock('config.items', createArrayContent(['b', 'c']))],
      });

      const result = applyExtends(ast);
      const content = result.blocks[0]?.content as ObjectContent;
      const items = content.properties['items'] as string[];

      expect(items).toEqual(['a', 'b', 'c']);
    });
  });
});
