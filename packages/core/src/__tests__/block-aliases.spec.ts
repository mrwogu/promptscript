import { describe, expect, it } from 'vitest';
import type { Block, Program } from '../index.js';
import { getCanonicalBlockName, normalizeBlockAliases } from '../index.js';

const LOC = { file: 'aliases.prs', line: 1, column: 1, offset: 0 };

function block(name: string, properties: Record<string, string>, offset: number): Block {
  return {
    type: 'Block',
    name,
    content: {
      type: 'ObjectContent',
      properties,
      loc: { ...LOC, offset },
    },
    loc: { ...LOC, offset },
  };
}

function program(blocks: Block[]): Program {
  return {
    type: 'Program',
    uses: [],
    blocks,
    extends: [],
    loc: LOC,
  };
}

describe('block aliases', () => {
  it('returns canonical built-in names without changing custom names', () => {
    expect(getCanonicalBlockName('commands')).toBe('shortcuts');
    expect(getCanonicalBlockName('team-domain')).toBe('team-domain');
  });

  it('normalizes commands to shortcuts', () => {
    const ast = program([block('commands', { '/test': 'Run tests' }, 1)]);

    const result = normalizeBlockAliases(ast);

    expect(result.blocks).toHaveLength(1);
    expect(result.blocks[0]?.name).toBe('shortcuts');
    expect(result.blocks[0]?.content).toMatchObject({
      type: 'ObjectContent',
      properties: { '/test': 'Run tests' },
    });
  });

  it.each([
    ['shortcuts', 'commands'],
    ['commands', 'shortcuts'],
    ['commands', 'commands'],
  ])('merges %s and %s declarations without dropping entries', (firstName, secondName) => {
    const ast = program([
      block(firstName, { '/review': 'Review old code' }, 1),
      block(secondName, { '/review': 'Review code', '/test': 'Run tests' }, 2),
    ]);

    const result = normalizeBlockAliases(ast);

    expect(result.blocks).toHaveLength(1);
    expect(result.blocks[0]?.name).toBe('shortcuts');
    expect(result.blocks[0]?.content).toMatchObject({
      type: 'ObjectContent',
      properties: {
        '/review': 'Review code',
        '/test': 'Run tests',
      },
    });
  });

  it('preserves repeated canonical blocks and unchanged program identity', () => {
    const ast = program([
      block('shortcuts', { '/review': 'Review code' }, 1),
      block('shortcuts', { '/test': 'Run tests' }, 2),
    ]);

    const result = normalizeBlockAliases(ast);

    expect(result).toBe(ast);
    expect(result.blocks).toHaveLength(2);
  });

  it('merges an alias with every repeated canonical declaration', () => {
    const ast = program([
      block('shortcuts', { '/review': 'Review code' }, 1),
      block('identity', { role: 'Maintainer' }, 2),
      block('shortcuts', { '/test': 'Run tests' }, 3),
      block('commands', { '/build': 'Build project' }, 4),
    ]);

    const result = normalizeBlockAliases(ast);
    const shortcuts = result.blocks.find((candidate) => candidate.name === 'shortcuts');

    expect(result.blocks).toHaveLength(2);
    expect(shortcuts?.content).toMatchObject({
      type: 'ObjectContent',
      properties: {
        '/review': 'Review code',
        '/test': 'Run tests',
        '/build': 'Build project',
      },
    });
  });

  it('normalizes commands extension targets', () => {
    const ast = program([block('commands', { '/test': 'Run tests' }, 1)]);
    ast.extends = [
      {
        type: 'ExtendBlock',
        targetPath: 'commands.test',
        content: {
          type: 'ObjectContent',
          properties: { description: 'Run complete tests' },
          loc: LOC,
        },
        loc: LOC,
      },
    ];

    const result = normalizeBlockAliases(ast);

    expect(result.extends[0]?.targetPath).toBe('shortcuts.test');
  });

  it('preserves extension roots that match import aliases', () => {
    const ast = program([block('identity', { role: 'Maintainer' }, 1)]);
    ast.uses = [
      {
        type: 'UseDeclaration',
        path: {
          type: 'PathReference',
          raw: './commands.prs',
          segments: ['commands.prs'],
          isRelative: true,
          loc: LOC,
        },
        alias: 'commands',
        loc: LOC,
      },
    ];
    ast.extends = [
      {
        type: 'ExtendBlock',
        targetPath: 'commands.skills',
        content: {
          type: 'ObjectContent',
          properties: { description: 'Imported skills' },
          loc: LOC,
        },
        loc: LOC,
      },
    ];

    const result = normalizeBlockAliases(ast);

    expect(result).toBe(ast);
    expect(result.extends[0]?.targetPath).toBe('commands.skills');
  });
});
