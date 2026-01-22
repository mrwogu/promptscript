import { describe, it, expect } from 'vitest';
import type { Program, Block, TextContent, ObjectContent, Value } from '@promptscript/core';
import {
  resolveUses,
  isImportMarker,
  getImportAlias,
  getOriginalBlockName,
  IMPORT_MARKER_PREFIX,
} from '../imports.js';

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

describe('imports', () => {
  describe('resolveUses', () => {
    it('should merge blocks from source into target', () => {
      const target = createProgram({
        blocks: [createBlock('identity', createTextContent('main'))],
      });

      const use = {
        type: 'UseDeclaration' as const,
        path: {
          type: 'PathReference' as const,
          raw: './guards',
          segments: ['guards'],
          isRelative: true,
          loc: createLoc(),
        },
        loc: createLoc(),
      };

      const source = createProgram({
        blocks: [createBlock('guards', createObjectContent({ level: 'high' }))],
      });

      const result = resolveUses(target, use, source);

      // Should have original block + merged block (no markers without alias)
      expect(result.blocks).toHaveLength(2);
      expect(result.blocks[0]?.name).toBe('identity');
      expect(result.blocks[1]?.name).toBe('guards');
    });

    it('should add aliased blocks when alias is provided', () => {
      const target = createProgram({
        blocks: [createBlock('identity', createTextContent('main'))],
      });

      const use = {
        type: 'UseDeclaration' as const,
        path: {
          type: 'PathReference' as const,
          raw: './guards',
          segments: ['guards'],
          isRelative: true,
          loc: createLoc(),
        },
        alias: 'sec',
        loc: createLoc(),
      };

      const source = createProgram({
        meta: {
          type: 'MetaBlock',
          fields: { id: 'guards-module' },
          loc: createLoc(),
        },
        blocks: [createBlock('guards', createObjectContent({ level: 'high' }))],
      });

      const result = resolveUses(target, use, source);

      // Should have: original + merged + marker + aliased
      expect(result.blocks).toHaveLength(4);
      expect(result.blocks[0]?.name).toBe('identity');
      expect(result.blocks[1]?.name).toBe('guards');
      expect(result.blocks[2]?.name).toBe(`${IMPORT_MARKER_PREFIX}sec`);
      expect(result.blocks[3]?.name).toBe(`${IMPORT_MARKER_PREFIX}sec.guards`);
    });

    it('should merge same-name blocks with target winning on conflict', () => {
      const target = createProgram({
        blocks: [createBlock('rules', createTextContent('target rules'))],
      });

      const use = {
        type: 'UseDeclaration' as const,
        path: {
          type: 'PathReference' as const,
          raw: './guards',
          segments: ['guards'],
          isRelative: true,
          loc: createLoc(),
        },
        loc: createLoc(),
      };

      const source = createProgram({
        blocks: [createBlock('rules', createTextContent('source rules'))],
      });

      const result = resolveUses(target, use, source);

      // Should have merged block with concatenated text (source + target)
      expect(result.blocks).toHaveLength(1);
      expect(result.blocks[0]?.name).toBe('rules');
      const content = result.blocks[0]?.content as TextContent;
      expect(content.value).toBe('source rules\n\ntarget rules');
    });

    it('should override string properties in ObjectContent (source wins)', () => {
      const target = createProgram({
        blocks: [
          createBlock(
            'shortcuts',
            createObjectContent({
              '/test': 'target value',
              '/other': 'only in target',
            })
          ),
        ],
      });

      const use = {
        type: 'UseDeclaration' as const,
        path: {
          type: 'PathReference' as const,
          raw: './commands',
          segments: ['commands'],
          isRelative: true,
          loc: createLoc(),
        },
        loc: createLoc(),
      };

      const source = createProgram({
        blocks: [
          createBlock(
            'shortcuts',
            createObjectContent({
              '/test': 'source value',
              '/new': 'only in source',
            })
          ),
        ],
      });

      const result = resolveUses(target, use, source);

      // Source (import) should override target for string properties
      expect(result.blocks).toHaveLength(1);
      const content = result.blocks[0]?.content as ObjectContent;
      expect(content.properties['/test']).toBe('source value'); // source wins
      expect(content.properties['/other']).toBe('only in target'); // only in target
      expect(content.properties['/new']).toBe('only in source'); // only in source
    });

    it('should deduplicate identical text content', () => {
      const target = createProgram({
        blocks: [createBlock('identity', createTextContent('Same content'))],
      });

      const use = {
        type: 'UseDeclaration' as const,
        path: {
          type: 'PathReference' as const,
          raw: './base',
          segments: ['base'],
          isRelative: true,
          loc: createLoc(),
        },
        loc: createLoc(),
      };

      const source = createProgram({
        blocks: [createBlock('identity', createTextContent('Same content'))],
      });

      const result = resolveUses(target, use, source);

      // Should deduplicate identical content
      expect(result.blocks).toHaveLength(1);
      const content = result.blocks[0]?.content as TextContent;
      expect(content.value).toBe('Same content');
    });

    it('should deduplicate when target contains source', () => {
      const target = createProgram({
        blocks: [createBlock('identity', createTextContent('Full text with more details'))],
      });

      const use = {
        type: 'UseDeclaration' as const,
        path: {
          type: 'PathReference' as const,
          raw: './base',
          segments: ['base'],
          isRelative: true,
          loc: createLoc(),
        },
        loc: createLoc(),
      };

      const source = createProgram({
        blocks: [createBlock('identity', createTextContent('Full text'))],
      });

      const result = resolveUses(target, use, source);

      // Should return target only since it contains source
      expect(result.blocks).toHaveLength(1);
      const content = result.blocks[0]?.content as TextContent;
      expect(content.value).toBe('Full text with more details');
    });

    it('should store source info in marker when alias provided', () => {
      const target = createProgram();

      const use = {
        type: 'UseDeclaration' as const,
        path: {
          type: 'PathReference' as const,
          raw: '@company/guards',
          namespace: 'company',
          segments: ['guards'],
          isRelative: false,
          loc: createLoc(),
        },
        alias: 'g',
        loc: createLoc(),
      };

      const source = createProgram({
        blocks: [createBlock('rules', createTextContent('rule 1'))],
      });

      const result = resolveUses(target, use, source);

      // Merged block + marker + aliased block
      expect(result.blocks).toHaveLength(3);
      expect(result.blocks[0]?.name).toBe('rules');

      const marker = result.blocks[1];
      expect(marker?.name).toBe(`${IMPORT_MARKER_PREFIX}g`);
      const content = marker?.content as ObjectContent;

      expect(content.properties['__source']).toBe('@company/guards');
      expect(content.properties['__blocks']).toEqual(['rules']);
    });
  });

  describe('isImportMarker', () => {
    it('should return true for import markers', () => {
      expect(isImportMarker(`${IMPORT_MARKER_PREFIX}alias`)).toBe(true);
      expect(isImportMarker(`${IMPORT_MARKER_PREFIX}alias.block`)).toBe(true);
    });

    it('should return false for regular blocks', () => {
      expect(isImportMarker('identity')).toBe(false);
      expect(isImportMarker('standards')).toBe(false);
    });
  });

  describe('getImportAlias', () => {
    it('should extract alias from marker name', () => {
      expect(getImportAlias(`${IMPORT_MARKER_PREFIX}sec`)).toBe('sec');
      expect(getImportAlias(`${IMPORT_MARKER_PREFIX}guards`)).toBe('guards');
    });

    it('should extract alias from aliased block name', () => {
      expect(getImportAlias(`${IMPORT_MARKER_PREFIX}sec.rules`)).toBe('sec');
    });

    it('should return undefined for non-import blocks', () => {
      expect(getImportAlias('identity')).toBeUndefined();
    });
  });

  describe('getOriginalBlockName', () => {
    it('should extract original block name from aliased import', () => {
      expect(getOriginalBlockName(`${IMPORT_MARKER_PREFIX}sec.rules`)).toBe('rules');
      expect(getOriginalBlockName(`${IMPORT_MARKER_PREFIX}g.guards`)).toBe('guards');
    });

    it('should return undefined for marker-only names', () => {
      expect(getOriginalBlockName(`${IMPORT_MARKER_PREFIX}sec`)).toBeUndefined();
    });

    it('should return undefined for non-import blocks', () => {
      expect(getOriginalBlockName('identity')).toBeUndefined();
    });
  });
});
