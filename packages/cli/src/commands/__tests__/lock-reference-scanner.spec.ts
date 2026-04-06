import { describe, it, expect } from 'vitest';
import { collectRegistryReferences } from '../lock-reference-scanner.js';
import type { Program, SourceLocation, Block, Value } from '@promptscript/core';

const loc: SourceLocation = { file: 'test.prs', line: 1, column: 1 };

function makeSkillsBlock(skills: Record<string, { references?: string[] }>): Block {
  const properties: Record<string, Value> = {};
  for (const [name, skill] of Object.entries(skills)) {
    properties[name] = {
      description: `${name} skill`,
      ...(skill.references ? { references: skill.references } : {}),
    };
  }
  return {
    type: 'Block',
    name: 'skills',
    loc,
    content: { type: 'ObjectContent', properties, loc },
  };
}

function makeAst(blocks: Block[] = []): Program {
  return {
    type: 'Program',
    loc,
    meta: { type: 'MetaBlock', loc, fields: { id: 'test', version: '1.0.0' } },
    uses: [],
    blocks,
    extends: [],
  };
}

describe('collectRegistryReferences', () => {
  it('should return empty array when no skills blocks', () => {
    const result = collectRegistryReferences(makeAst(), '/cache');
    expect(result).toEqual([]);
  });

  it('should return empty array when skills have no references', () => {
    const ast = makeAst([makeSkillsBlock({ mySkill: {} })]);
    const result = collectRegistryReferences(ast, '/cache');
    expect(result).toEqual([]);
  });

  it('should collect references that start with cache path', () => {
    const ast = makeAst([
      makeSkillsBlock({
        mySkill: { references: ['/cache/registries/org/repo/v1/ref.md', './local.md'] },
      }),
    ]);
    const result = collectRegistryReferences(ast, '/cache');
    expect(result).toHaveLength(1);
    expect(result[0]).toBe('/cache/registries/org/repo/v1/ref.md');
  });

  it('should deduplicate references', () => {
    const refPath = '/cache/registries/org/repo/v1/ref.md';
    const ast = makeAst([
      makeSkillsBlock({
        skillA: { references: [refPath] },
        skillB: { references: [refPath] },
      }),
    ]);
    const result = collectRegistryReferences(ast, '/cache');
    expect(result).toHaveLength(1);
  });

  it('should skip non-string reference entries', () => {
    const block: Block = {
      type: 'Block',
      name: 'skills',
      loc,
      content: {
        type: 'ObjectContent',
        properties: {
          mySkill: { description: 'test', references: [123, null, '/cache/ref.md'] } as Value,
        },
        loc,
      },
    };
    const ast = makeAst([block]);
    const result = collectRegistryReferences(ast, '/cache');
    expect(result).toHaveLength(1);
  });

  it('should skip non-skills blocks', () => {
    const ast = makeAst([
      {
        type: 'Block',
        name: 'identity',
        loc,
        content: { type: 'TextContent', value: 'test', loc },
      },
    ]);
    const result = collectRegistryReferences(ast, '/cache');
    expect(result).toEqual([]);
  });
});
