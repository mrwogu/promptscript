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
import { applyExtends } from '../extensions';
import { IMPORT_MARKER_PREFIX } from '../imports';

const createLoc = () => ({ file: '<test>', line: 1, column: 1 });

const createProgram = (overrides: Partial<Program> = {}): Program => ({
  type: 'Program',
  uses: [],
  blocks: [],
  extends: [],
  loc: createLoc(),
  ...overrides,
});

const createBlock = (
  name: string,
  content: Block['content']
): Block => ({
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

const createObjectContent = (
  properties: Record<string, Value>
): ObjectContent => ({
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

const createExtendBlock = (
  targetPath: string,
  content: ExtendBlock['content']
): ExtendBlock => ({
  type: 'ExtendBlock',
  targetPath,
  content,
  loc: createLoc(),
});

describe('applyExtends', () => {
  describe('direct block extension', () => {
    it('should extend TextContent block', () => {
      const ast = createProgram({
        blocks: [createBlock('identity', createTextContent('original'))],
        extends: [
          createExtendBlock('identity', createTextContent('extended')),
        ],
      });

      const result = applyExtends(ast);
      const content = result.blocks[0]?.content as TextContent;

      expect(content.value).toBe('original\n\nextended');
    });

    it('should extend ObjectContent block', () => {
      const ast = createProgram({
        blocks: [
          createBlock('standards', createObjectContent({ style: 'clean' })),
        ],
        extends: [
          createExtendBlock(
            'standards',
            createObjectContent({ lint: true, style: 'strict' })
          ),
        ],
      });

      const result = applyExtends(ast);
      const content = result.blocks[0]?.content as ObjectContent;

      expect(content.properties).toEqual({
        style: 'strict',
        lint: true,
      });
    });

    it('should extend ArrayContent block', () => {
      const ast = createProgram({
        blocks: [createBlock('list', createArrayContent(['a', 'b']))],
        extends: [createExtendBlock('list', createArrayContent(['b', 'c']))],
      });

      const result = applyExtends(ast);
      const content = result.blocks[0]?.content as ArrayContent;

      expect(content.elements).toEqual(['a', 'b', 'c']);
    });
  });

  describe('deep path extension', () => {
    it('should extend nested property', () => {
      const ast = createProgram({
        blocks: [
          createBlock(
            'standards',
            createObjectContent({
              code: { style: 'clean', indent: 2 },
            })
          ),
        ],
        extends: [
          createExtendBlock(
            'standards.code',
            createObjectContent({ lint: true })
          ),
        ],
      });

      const result = applyExtends(ast);
      const content = result.blocks[0]?.content as ObjectContent;

      expect(content.properties['code']).toEqual({
        style: 'clean',
        indent: 2,
        lint: true,
      });
    });

    it('should create nested path if not exists', () => {
      const ast = createProgram({
        blocks: [createBlock('standards', createObjectContent({}))],
        extends: [
          createExtendBlock(
            'standards.code',
            createObjectContent({ style: 'clean' })
          ),
        ],
      });

      const result = applyExtends(ast);
      const content = result.blocks[0]?.content as ObjectContent;

      expect(content.properties['code']).toEqual({ style: 'clean' });
    });

    it('should handle deeply nested paths', () => {
      const ast = createProgram({
        blocks: [
          createBlock(
            'config',
            createObjectContent({
              a: { b: { c: 'original' } },
            })
          ),
        ],
        extends: [
          createExtendBlock(
            'config.a.b',
            createObjectContent({ d: 'new' })
          ),
        ],
      });

      const result = applyExtends(ast);
      const content = result.blocks[0]?.content as ObjectContent;

      expect(content.properties['a']).toEqual({
        b: { c: 'original', d: 'new' },
      });
    });
  });

  describe('multiple extensions', () => {
    it('should apply extensions in order', () => {
      const ast = createProgram({
        blocks: [createBlock('identity', createTextContent('start'))],
        extends: [
          createExtendBlock('identity', createTextContent('middle')),
          createExtendBlock('identity', createTextContent('end')),
        ],
      });

      const result = applyExtends(ast);
      const content = result.blocks[0]?.content as TextContent;

      expect(content.value).toBe('start\n\nmiddle\n\nend');
    });

    it('should apply extensions to different blocks', () => {
      const ast = createProgram({
        blocks: [
          createBlock('identity', createTextContent('id')),
          createBlock('context', createTextContent('ctx')),
        ],
        extends: [
          createExtendBlock('identity', createTextContent('+ id')),
          createExtendBlock('context', createTextContent('+ ctx')),
        ],
      });

      const result = applyExtends(ast);

      expect((result.blocks[0]?.content as TextContent).value).toBe(
        'id\n\n+ id'
      );
      expect((result.blocks[1]?.content as TextContent).value).toBe(
        'ctx\n\n+ ctx'
      );
    });
  });

  describe('import marker handling', () => {
    it('should remove import markers after extension', () => {
      const ast = createProgram({
        blocks: [
          createBlock('identity', createTextContent('main')),
          createBlock(`${IMPORT_MARKER_PREFIX}sec`, createObjectContent({})),
          createBlock(
            `${IMPORT_MARKER_PREFIX}sec.guards`,
            createTextContent('guard')
          ),
        ],
        extends: [],
      });

      const result = applyExtends(ast);

      expect(result.blocks).toHaveLength(1);
      expect(result.blocks[0]?.name).toBe('identity');
    });
  });

  describe('target not found', () => {
    it('should ignore extension for non-existent target', () => {
      const ast = createProgram({
        blocks: [createBlock('identity', createTextContent('original'))],
        extends: [
          createExtendBlock('nonexistent', createTextContent('extended')),
        ],
      });

      const result = applyExtends(ast);

      expect(result.blocks).toHaveLength(1);
      expect((result.blocks[0]?.content as TextContent).value).toBe('original');
    });
  });

  describe('mixed content type extension', () => {
    it('should create MixedContent when extending Object with Text', () => {
      const ast = createProgram({
        blocks: [
          createBlock('block', createObjectContent({ key: 'value' })),
        ],
        extends: [createExtendBlock('block', createTextContent('text'))],
      });

      const result = applyExtends(ast);
      const content = result.blocks[0]?.content;

      expect(content?.type).toBe('MixedContent');
    });

    it('should create MixedContent when extending Text with Object', () => {
      const ast = createProgram({
        blocks: [createBlock('block', createTextContent('text'))],
        extends: [
          createExtendBlock('block', createObjectContent({ key: 'value' })),
        ],
      });

      const result = applyExtends(ast);
      const content = result.blocks[0]?.content;

      expect(content?.type).toBe('MixedContent');
    });
  });

  describe('clears extends after application', () => {
    it('should clear extends array', () => {
      const ast = createProgram({
        blocks: [createBlock('identity', createTextContent('text'))],
        extends: [createExtendBlock('identity', createTextContent('more'))],
      });

      const result = applyExtends(ast);

      expect(result.extends).toEqual([]);
    });
  });

  describe('MixedContent extension', () => {
    it('should extend MixedContent with TextContent', () => {
      const ast = createProgram({
        blocks: [
          createBlock(
            'block',
            createMixedContent(createTextContent('original'), { key: 'value' })
          ),
        ],
        extends: [createExtendBlock('block', createTextContent('extended'))],
      });

      const result = applyExtends(ast);
      const content = result.blocks[0]?.content as MixedContent;

      expect(content.text?.value).toBe('original\n\nextended');
      expect(content.properties['key']).toBe('value');
    });

    it('should extend MixedContent with ObjectContent', () => {
      const ast = createProgram({
        blocks: [
          createBlock(
            'block',
            createMixedContent(createTextContent('text'), { key1: 'value1' })
          ),
        ],
        extends: [
          createExtendBlock('block', createObjectContent({ key2: 'value2' })),
        ],
      });

      const result = applyExtends(ast);
      const content = result.blocks[0]?.content as MixedContent;

      expect(content.properties).toEqual({ key1: 'value1', key2: 'value2' });
    });

    it('should extend MixedContent without text with TextContent', () => {
      const ast = createProgram({
        blocks: [
          createBlock(
            'block',
            createMixedContent(undefined, { key: 'value' })
          ),
        ],
        extends: [createExtendBlock('block', createTextContent('new text'))],
      });

      const result = applyExtends(ast);
      const content = result.blocks[0]?.content as MixedContent;

      expect(content.text?.value).toBe('new text');
    });

    it('should extend MixedContent with MixedContent', () => {
      const ast = createProgram({
        blocks: [
          createBlock(
            'block',
            createMixedContent(createTextContent('text1'), { a: '1' })
          ),
        ],
        extends: [
          createExtendBlock(
            'block',
            createMixedContent(createTextContent('text2'), { b: '2' })
          ),
        ],
      });

      const result = applyExtends(ast);
      const content = result.blocks[0]?.content as MixedContent;

      expect(content.text?.value).toBe('text1\n\ntext2');
      expect(content.properties).toEqual({ a: '1', b: '2' });
    });
  });

  describe('deep path in MixedContent', () => {
    it('should extend nested property in MixedContent', () => {
      const ast = createProgram({
        blocks: [
          createBlock(
            'config',
            createMixedContent(createTextContent('desc'), {
              settings: { mode: 'dev' },
            })
          ),
        ],
        extends: [
          createExtendBlock(
            'config.settings',
            createObjectContent({ debug: true })
          ),
        ],
      });

      const result = applyExtends(ast);
      const content = result.blocks[0]?.content as MixedContent;

      expect(content.properties['settings']).toEqual({
        mode: 'dev',
        debug: true,
      });
    });

    it('should create nested path in MixedContent if not exists', () => {
      const ast = createProgram({
        blocks: [
          createBlock(
            'config',
            createMixedContent(createTextContent('desc'), {})
          ),
        ],
        extends: [
          createExtendBlock(
            'config.newProp',
            createObjectContent({ value: 'test' })
          ),
        ],
      });

      const result = applyExtends(ast);
      const content = result.blocks[0]?.content as MixedContent;

      expect(content.properties['newProp']).toEqual({ value: 'test' });
    });
  });

  describe('import aliased extension', () => {
    it('should extend imported block via alias', () => {
      const ast = createProgram({
        blocks: [
          createBlock(`${IMPORT_MARKER_PREFIX}sec`, createObjectContent({})),
          createBlock(
            `${IMPORT_MARKER_PREFIX}sec.guards`,
            createObjectContent({ level: 'low' })
          ),
        ],
        extends: [
          createExtendBlock(
            'sec.guards',
            createObjectContent({ level: 'high' })
          ),
        ],
      });

      const result = applyExtends(ast);

      // Import markers should be removed
      expect(result.blocks).toHaveLength(0);
    });
  });

  describe('TextContent and ArrayContent path extension', () => {
    it('should return unchanged when trying to navigate into TextContent', () => {
      const ast = createProgram({
        blocks: [createBlock('block', createTextContent('text'))],
        extends: [
          createExtendBlock(
            'block.nested',
            createObjectContent({ key: 'value' })
          ),
        ],
      });

      const result = applyExtends(ast);
      const content = result.blocks[0]?.content;

      // Should remain TextContent unchanged since we can't navigate into it
      expect(content?.type).toBe('TextContent');
    });

    it('should return unchanged when trying to navigate into ArrayContent', () => {
      const ast = createProgram({
        blocks: [createBlock('block', createArrayContent(['a', 'b']))],
        extends: [
          createExtendBlock(
            'block.nested',
            createObjectContent({ key: 'value' })
          ),
        ],
      });

      const result = applyExtends(ast);
      const content = result.blocks[0]?.content;

      // Should remain ArrayContent unchanged
      expect(content?.type).toBe('ArrayContent');
    });
  });

  describe('value merging', () => {
    it('should merge arrays when extending nested array', () => {
      const ast = createProgram({
        blocks: [
          createBlock(
            'config',
            createObjectContent({ items: ['a', 'b'] })
          ),
        ],
        extends: [
          createExtendBlock('config.items', createArrayContent(['b', 'c'])),
        ],
      });

      const result = applyExtends(ast);
      const content = result.blocks[0]?.content as ObjectContent;

      expect(content.properties['items']).toEqual(['a', 'b', 'c']);
    });

    it('should merge TextContent when extending nested text', () => {
      const ast = createProgram({
        blocks: [
          createBlock(
            'config',
            createObjectContent({
              desc: { type: 'TextContent', value: 'original', loc: createLoc() },
            })
          ),
        ],
        extends: [
          createExtendBlock('config.desc', createTextContent('extended')),
        ],
      });

      const result = applyExtends(ast);
      const content = result.blocks[0]?.content as ObjectContent;
      const desc = content.properties['desc'] as TextContent;

      expect(desc.value).toBe('original\n\nextended');
    });

    it('should handle primitive value replacement', () => {
      const ast = createProgram({
        blocks: [
          createBlock('config', createObjectContent({ value: 'old' })),
        ],
        extends: [
          createExtendBlock('config.value', createTextContent('new')),
        ],
      });

      const result = applyExtends(ast);
      const content = result.blocks[0]?.content as ObjectContent;

      expect(content.properties['value']).toBe('new');
    });
  });

  describe('deeply nested path building', () => {
    it('should build deeply nested path when extending non-existent path', () => {
      const ast = createProgram({
        blocks: [createBlock('config', createObjectContent({}))],
        extends: [
          createExtendBlock(
            'config.a.b.c',
            createObjectContent({ value: 'deep' })
          ),
        ],
      });

      const result = applyExtends(ast);
      const content = result.blocks[0]?.content as ObjectContent;

      expect(content.properties['a']).toEqual({
        b: { c: { value: 'deep' } },
      });
    });

    it('should handle extracting array value from ArrayContent', () => {
      const ast = createProgram({
        blocks: [createBlock('config', createObjectContent({}))],
        extends: [
          createExtendBlock('config.items', createArrayContent(['x', 'y'])),
        ],
      });

      const result = applyExtends(ast);
      const content = result.blocks[0]?.content as ObjectContent;

      expect(content.properties['items']).toEqual(['x', 'y']);
    });

    it('should handle extracting properties from MixedContent', () => {
      const ast = createProgram({
        blocks: [createBlock('config', createObjectContent({}))],
        extends: [
          createExtendBlock(
            'config.mixed',
            createMixedContent(undefined, { prop: 'value' })
          ),
        ],
      });

      const result = applyExtends(ast);
      const content = result.blocks[0]?.content as ObjectContent;

      expect(content.properties['mixed']).toEqual({ prop: 'value' });
    });
  });

  describe('navigating into non-object values', () => {
    it('should build path when trying to navigate into primitive', () => {
      const ast = createProgram({
        blocks: [
          createBlock('config', createObjectContent({ value: 'primitive' })),
        ],
        extends: [
          createExtendBlock(
            'config.value.nested',
            createObjectContent({ key: 'val' })
          ),
        ],
      });

      const result = applyExtends(ast);
      const content = result.blocks[0]?.content as ObjectContent;

      // Should replace primitive with nested object
      expect(content.properties['value']).toEqual({ nested: { key: 'val' } });
    });

    it('should build path when trying to navigate into array', () => {
      const ast = createProgram({
        blocks: [
          createBlock('config', createObjectContent({ arr: [1, 2, 3] })),
        ],
        extends: [
          createExtendBlock(
            'config.arr.nested',
            createObjectContent({ key: 'val' })
          ),
        ],
      });

      const result = applyExtends(ast);
      const content = result.blocks[0]?.content as ObjectContent;

      // Should replace array with nested object
      expect(content.properties['arr']).toEqual({ nested: { key: 'val' } });
    });
  });
});
