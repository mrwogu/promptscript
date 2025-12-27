import { describe, it, expect } from 'vitest';
import type { Program, Block, TextContent, ObjectContent, Value } from '@promptscript/core';
import {
  resolveUses,
  isImportMarker,
  getImportAlias,
  getOriginalBlockName,
  IMPORT_MARKER_PREFIX,
} from '../imports';

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
    it('should add import marker block', () => {
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

      // Should have original block + marker + aliased block
      expect(result.blocks).toHaveLength(3);
      expect(result.blocks[0]?.name).toBe('identity');
      expect(result.blocks[1]?.name).toBe(`${IMPORT_MARKER_PREFIX}sec`);
      expect(result.blocks[2]?.name).toBe(`${IMPORT_MARKER_PREFIX}sec.guards`);
    });

    it('should use source id as alias if no alias provided', () => {
      const target = createProgram();

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
        meta: {
          type: 'MetaBlock',
          fields: { id: 'guards-module' },
          loc: createLoc(),
        },
        blocks: [],
      });

      const result = resolveUses(target, use, source);

      expect(result.blocks[0]?.name).toBe(`${IMPORT_MARKER_PREFIX}guards-module`);
    });

    it('should use "import" as fallback alias', () => {
      const target = createProgram();

      const use = {
        type: 'UseDeclaration' as const,
        path: {
          type: 'PathReference' as const,
          raw: './no-meta',
          segments: ['no-meta'],
          isRelative: true,
          loc: createLoc(),
        },
        loc: createLoc(),
      };

      const source = createProgram({
        blocks: [],
      });

      const result = resolveUses(target, use, source);

      expect(result.blocks[0]?.name).toBe(`${IMPORT_MARKER_PREFIX}import`);
    });

    it('should store source info in marker', () => {
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
      const marker = result.blocks[0];
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
