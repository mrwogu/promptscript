import { describe, expect, it } from 'vitest';
import {
  consumeInlineUses,
  type Block,
  type InlineUseDeclaration,
  type Program,
} from '../index.js';

const LOC = { file: 'inline.prs', line: 1, column: 1, offset: 0 };

function program(blocks: Block[]): Program {
  return {
    type: 'Program',
    uses: [],
    blocks,
    extends: [],
    overrides: [],
    loc: LOC,
  };
}

const INLINE_USE: InlineUseDeclaration = {
  type: 'InlineUseDeclaration',
  path: {
    type: 'PathReference',
    raw: './phase',
    segments: ['phase'],
    isRelative: true,
    loc: LOC,
  },
  loc: LOC,
};

describe('consumeInlineUses', () => {
  it('returns the original program when no inline uses are pending', () => {
    const ast = program([
      {
        type: 'Block',
        name: 'standards',
        content: { type: 'ObjectContent', properties: {}, loc: LOC },
        loc: LOC,
      },
    ]);

    expect(consumeInlineUses(ast)).toBe(ast);
  });

  it('clears pending skill uses without changing unrelated blocks', () => {
    const standards: Block = {
      type: 'Block',
      name: 'standards',
      content: { type: 'ObjectContent', properties: { testing: true }, loc: LOC },
      loc: LOC,
    };
    const ast = program([
      {
        type: 'Block',
        name: 'skills',
        content: {
          type: 'ObjectContent',
          properties: { review: { content: 'Review' } },
          inlineUses: [INLINE_USE],
          loc: LOC,
        },
        loc: LOC,
      },
      standards,
    ]);

    const result = consumeInlineUses(ast);

    expect(result).not.toBe(ast);
    expect(result.blocks[0]?.content).toMatchObject({
      properties: { review: { content: 'Review' } },
      inlineUses: undefined,
    });
    expect(result.blocks[1]).toBe(standards);
    expect((ast.blocks[0]?.content as { inlineUses?: InlineUseDeclaration[] }).inlineUses).toEqual([
      INLINE_USE,
    ]);
  });
});
