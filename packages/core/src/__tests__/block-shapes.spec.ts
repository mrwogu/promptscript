import { describe, expect, it } from 'vitest';
import type { Block, BlockEntry, BlockShape, BlockTypeName } from '../index.js';
import {
  BLOCK_SHAPE_CONTRACTS,
  BLOCK_TYPES,
  createBlockBody,
  createCanonicalBlock,
  getBlockShapeContract,
  getObservedBlockShape,
} from '../index.js';

const LOC = { file: 'shapes.prs', line: 1, column: 1, offset: 0 };

function makeLegacyBlock(shape: BlockShape): Block {
  switch (shape) {
    case 'text':
      return {
        type: 'Block',
        name: 'identity',
        content: { type: 'TextContent', value: 'Text', loc: LOC },
        loc: LOC,
      };
    case 'object':
      return {
        type: 'Block',
        name: 'context',
        content: { type: 'ObjectContent', properties: { project: 'Example' }, loc: LOC },
        loc: LOC,
      };
    case 'array':
      return {
        type: 'Block',
        name: 'restrictions',
        content: { type: 'ArrayContent', elements: ['Rule'], loc: LOC },
        loc: LOC,
      };
    case 'mixed':
      return {
        type: 'Block',
        name: 'context',
        content: {
          type: 'MixedContent',
          text: { type: 'TextContent', value: 'Text', loc: LOC },
          properties: { project: 'Example' },
          loc: LOC,
        },
        loc: LOC,
      };
  }
}

describe('block shape contracts', () => {
  it('defines one complete contract for every built-in block', () => {
    expect(Object.keys(BLOCK_SHAPE_CONTRACTS)).toEqual(BLOCK_TYPES);

    for (const name of BLOCK_TYPES) {
      const contract = BLOCK_SHAPE_CONTRACTS[name];
      expect(contract.supportedShapes).toContain(contract.canonicalShape);
      expect(contract.example).toContain(`@${name}`);
      for (const legacyShape of contract.legacyShapes) {
        expect(contract.supportedShapes).toContain(legacyShape);
      }
    }
  });

  it('returns contracts only for built-in blocks', () => {
    expect(getBlockShapeContract('identity')).toBe(BLOCK_SHAPE_CONTRACTS.identity);
    expect(getBlockShapeContract('custom')).toBeUndefined();
  });

  it.each(['text', 'object', 'array', 'mixed'] as const)(
    'observes %s from compatibility content',
    (shape) => {
      expect(getObservedBlockShape(makeLegacyBlock(shape))).toBe(shape);
    }
  );

  it('observes canonical body shape without projecting it', () => {
    const entries: BlockEntry[] = [
      {
        type: 'FieldEntry',
        name: 'project',
        value: { type: 'ScalarValueNode', value: 'Example', loc: LOC },
        loc: LOC,
      },
      { type: 'TextEntry', text: 'Context', loc: { ...LOC, offset: 10 } },
    ];
    const block = createCanonicalBlock('context', createBlockBody(entries, LOC), LOC);

    expect(getObservedBlockShape(block)).toBe('mixed');
  });

  it('classifies compatibility list items by canonical categories', () => {
    const listOnly = makeLegacyBlock('object');
    if (listOnly.content.type !== 'ObjectContent') {
      throw new Error('Expected object content');
    }
    listOnly.content.properties = {};
    listOnly.content.listItems = ['Rule'];

    const fieldsAndList = makeLegacyBlock('object');
    if (fieldsAndList.content.type !== 'ObjectContent') {
      throw new Error('Expected object content');
    }
    fieldsAndList.content.listItems = ['Rule'];

    expect(getObservedBlockShape(listOnly)).toBe('array');
    expect(getObservedBlockShape(fieldsAndList)).toBe('mixed');
  });

  it('reconciles compatibility metadata with mutable content', () => {
    const block = makeLegacyBlock('text');
    block.canonicalBody = createBlockBody([{ type: 'TextEntry', text: 'Text', loc: LOC }], LOC);
    block.content = {
      type: 'ObjectContent',
      properties: { project: 'Changed' },
      loc: LOC,
    };

    expect(getObservedBlockShape(block)).toBe('object');
  });

  it('keeps contract keys assignable to the strict block name union', () => {
    const names: BlockTypeName[] = Object.keys(BLOCK_SHAPE_CONTRACTS) as BlockTypeName[];

    expect(names).toHaveLength(BLOCK_TYPES.length);
  });
});
