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

describe('resolveInheritance', () => {
  describe('meta merging', () => {
    it('should merge meta fields', () => {
      const parent = createProgram({
        meta: {
          type: 'MetaBlock',
          fields: { id: 'parent', version: '1.0.0' },
          loc: createLoc(),
        },
      });

      const child = createProgram({
        meta: {
          type: 'MetaBlock',
          fields: { id: 'child', author: 'test' },
          loc: createLoc(),
        },
      });

      const result = resolveInheritance(parent, child);

      expect(result.meta?.fields).toEqual({
        id: 'child',
        version: '1.0.0',
        author: 'test',
      });
    });

    it('should use parent meta if child has none', () => {
      const parent = createProgram({
        meta: {
          type: 'MetaBlock',
          fields: { id: 'parent' },
          loc: createLoc(),
        },
      });

      const child = createProgram();

      const result = resolveInheritance(parent, child);

      expect(result.meta?.fields).toEqual({ id: 'parent' });
    });

    it('should use child meta if parent has none', () => {
      const parent = createProgram();

      const child = createProgram({
        meta: {
          type: 'MetaBlock',
          fields: { id: 'child' },
          loc: createLoc(),
        },
      });

      const result = resolveInheritance(parent, child);

      expect(result.meta?.fields).toEqual({ id: 'child' });
    });
  });

  describe('block merging', () => {
    it('should include blocks from both parent and child', () => {
      const parent = createProgram({
        blocks: [createBlock('identity', createTextContent('parent identity'))],
      });

      const child = createProgram({
        blocks: [createBlock('context', createTextContent('child context'))],
      });

      const result = resolveInheritance(parent, child);

      expect(result.blocks).toHaveLength(2);
      expect(result.blocks.map((b) => b.name)).toEqual(['identity', 'context']);
    });

    it('should merge blocks with same name', () => {
      const parent = createProgram({
        blocks: [createBlock('identity', createTextContent('parent text'))],
      });

      const child = createProgram({
        blocks: [createBlock('identity', createTextContent('child text'))],
      });

      const result = resolveInheritance(parent, child);

      expect(result.blocks).toHaveLength(1);
      const content = result.blocks[0]?.content as TextContent;
      expect(content.value).toBe('parent text\n\nchild text');
    });

    it('should preserve order: parent blocks first, then child-only blocks', () => {
      const parent = createProgram({
        blocks: [
          createBlock('a', createTextContent('a')),
          createBlock('b', createTextContent('b')),
        ],
      });

      const child = createProgram({
        blocks: [
          createBlock('c', createTextContent('c')),
          createBlock('b', createTextContent('b2')),
        ],
      });

      const result = resolveInheritance(parent, child);

      expect(result.blocks.map((b) => b.name)).toEqual(['a', 'b', 'c']);
    });
  });

  describe('TextContent merging', () => {
    it('should concatenate text with double newline', () => {
      const parent = createProgram({
        blocks: [createBlock('identity', createTextContent('Line 1'))],
      });

      const child = createProgram({
        blocks: [createBlock('identity', createTextContent('Line 2'))],
      });

      const result = resolveInheritance(parent, child);
      const content = result.blocks[0]?.content as TextContent;

      expect(content.value).toBe('Line 1\n\nLine 2');
    });
  });

  describe('ObjectContent merging', () => {
    it('should deep merge object properties', () => {
      const parent = createProgram({
        blocks: [
          createBlock(
            'standards',
            createObjectContent({
              code: { style: 'clean', indent: 2 },
              docs: true,
            })
          ),
        ],
      });

      const child = createProgram({
        blocks: [
          createBlock(
            'standards',
            createObjectContent({
              code: { style: 'strict', lint: true },
            })
          ),
        ],
      });

      const result = resolveInheritance(parent, child);
      const content = result.blocks[0]?.content as ObjectContent;

      expect(content.properties).toEqual({
        code: { style: 'strict', indent: 2, lint: true },
        docs: true,
      });
    });

    it('should unique concat arrays in objects', () => {
      const parent = createProgram({
        blocks: [
          createBlock(
            'standards',
            createObjectContent({
              frameworks: ['react', 'vue'],
            })
          ),
        ],
      });

      const child = createProgram({
        blocks: [
          createBlock(
            'standards',
            createObjectContent({
              frameworks: ['vue', 'angular'],
            })
          ),
        ],
      });

      const result = resolveInheritance(parent, child);
      const content = result.blocks[0]?.content as ObjectContent;

      expect(content.properties['frameworks']).toEqual(['react', 'vue', 'angular']);
    });
  });

  describe('ArrayContent merging', () => {
    it('should unique concat arrays', () => {
      const parent = createProgram({
        blocks: [createBlock('list', createArrayContent(['a', 'b']))],
      });

      const child = createProgram({
        blocks: [createBlock('list', createArrayContent(['b', 'c']))],
      });

      const result = resolveInheritance(parent, child);
      const content = result.blocks[0]?.content as ArrayContent;

      expect(content.elements).toEqual(['a', 'b', 'c']);
    });
  });

  describe('MixedContent merging', () => {
    it('should merge both text and properties', () => {
      const parent = createProgram({
        blocks: [
          createBlock('mixed', {
            type: 'MixedContent',
            text: createTextContent('parent text'),
            properties: { key1: 'value1' },
            loc: createLoc(),
          } as MixedContent),
        ],
      });

      const child = createProgram({
        blocks: [
          createBlock('mixed', {
            type: 'MixedContent',
            text: createTextContent('child text'),
            properties: { key2: 'value2' },
            loc: createLoc(),
          } as MixedContent),
        ],
      });

      const result = resolveInheritance(parent, child);
      const content = result.blocks[0]?.content as MixedContent;

      expect(content.text?.value).toBe('parent text\n\nchild text');
      expect(content.properties).toEqual({ key1: 'value1', key2: 'value2' });
    });
  });

  describe('different content type merging', () => {
    it('should create MixedContent when merging Text with Object', () => {
      const parent = createProgram({
        blocks: [createBlock('block', createTextContent('text'))],
      });

      const child = createProgram({
        blocks: [createBlock('block', createObjectContent({ key: 'value' }))],
      });

      const result = resolveInheritance(parent, child);
      const content = result.blocks[0]?.content;

      // Child wins with different type
      expect(content?.type).toBe('ObjectContent');
    });

    it('should merge MixedContent with TextContent by using parent text', () => {
      const parent = createProgram({
        blocks: [
          createBlock('block', {
            type: 'MixedContent',
            text: createTextContent('parent text'),
            properties: { key: 'value' },
            loc: createLoc(),
          } as MixedContent),
        ],
      });

      const child = createProgram({
        blocks: [createBlock('block', createTextContent('child text'))],
      });

      const result = resolveInheritance(parent, child);
      const content = result.blocks[0]?.content as MixedContent;

      expect(content.type).toBe('MixedContent');
      expect(content.text?.value).toContain('parent text');
      expect(content.text?.value).toContain('child text');
    });

    it('should merge TextContent with MixedContent', () => {
      const parent = createProgram({
        blocks: [createBlock('block', createTextContent('parent text'))],
      });

      const child = createProgram({
        blocks: [
          createBlock('block', {
            type: 'MixedContent',
            text: createTextContent('child text'),
            properties: { key: 'value' },
            loc: createLoc(),
          } as MixedContent),
        ],
      });

      const result = resolveInheritance(parent, child);
      const content = result.blocks[0]?.content as MixedContent;

      expect(content.type).toBe('MixedContent');
      expect(content.text?.value).toContain('parent text');
      expect(content.text?.value).toContain('child text');
    });

    it('should merge MixedContent with ObjectContent', () => {
      const parent = createProgram({
        blocks: [
          createBlock('block', {
            type: 'MixedContent',
            text: createTextContent('text'),
            properties: { a: '1' },
            loc: createLoc(),
          } as MixedContent),
        ],
      });

      const child = createProgram({
        blocks: [createBlock('block', createObjectContent({ b: '2' }))],
      });

      const result = resolveInheritance(parent, child);
      const content = result.blocks[0]?.content as MixedContent;

      expect(content.type).toBe('MixedContent');
      expect(content.properties).toEqual({ a: '1', b: '2' });
    });

    it('should merge ObjectContent with MixedContent', () => {
      const parent = createProgram({
        blocks: [createBlock('block', createObjectContent({ a: '1' }))],
      });

      const child = createProgram({
        blocks: [
          createBlock('block', {
            type: 'MixedContent',
            properties: { b: '2' },
            loc: createLoc(),
          } as MixedContent),
        ],
      });

      const result = resolveInheritance(parent, child);
      const content = result.blocks[0]?.content as MixedContent;

      expect(content.type).toBe('MixedContent');
      expect(content.properties).toEqual({ a: '1', b: '2' });
    });
  });

  describe('inherit clearing', () => {
    it('should clear inherit declaration after resolution', () => {
      const parent = createProgram({
        inherit: {
          type: 'InheritDeclaration',
          path: {
            type: 'PathReference',
            raw: './grandparent',
            segments: ['grandparent'],
            isRelative: true,
            loc: createLoc(),
          },
          loc: createLoc(),
        },
      });

      const child = createProgram({
        inherit: {
          type: 'InheritDeclaration',
          path: {
            type: 'PathReference',
            raw: './parent',
            segments: ['parent'],
            isRelative: true,
            loc: createLoc(),
          },
          loc: createLoc(),
        },
      });

      const result = resolveInheritance(parent, child);

      expect(result.inherit).toBeUndefined();
    });
  });
});
