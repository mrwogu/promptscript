import { describe, expect, it } from 'vitest';
import {
  resolveUseImport,
  type Block,
  type Program,
  type UseDeclaration,
  type Value,
} from '../index.js';

const LOC = { file: 'import.prs', line: 1, column: 1, offset: 0 };

function block(name: string, properties: Record<string, Value>): Block {
  return {
    type: 'Block',
    name,
    content: { type: 'ObjectContent', properties, loc: LOC },
    loc: LOC,
  };
}

function program(blocks: Block[], syntaxFeatures: Program['syntaxFeatures'] = []): Program {
  return {
    type: 'Program',
    uses: [],
    blocks,
    extends: [],
    overrides: [],
    syntaxFeatures,
    loc: LOC,
  };
}

function use(overrides: Partial<UseDeclaration> = {}): UseDeclaration {
  return {
    type: 'UseDeclaration',
    path: {
      type: 'PathReference',
      raw: './shared',
      segments: ['shared'],
      isRelative: true,
      loc: LOC,
    },
    loc: LOC,
    ...overrides,
  };
}

describe('block import', () => {
  it('merges blocks and syntax features without an alias', () => {
    const target = program(
      [block('context', { local: true })],
      [{ feature: 'section-header-override', location: LOC }]
    );
    const source = program(
      [block('standards', { testing: ['Use Vitest'] })],
      [{ feature: 'explicit-override', location: LOC }]
    );

    const result = resolveUseImport(target, use(), source);

    expect(result.blocks.map((entry) => entry.name)).toEqual(['context', 'standards']);
    expect(result.syntaxFeatures).toEqual([
      { feature: 'section-header-override', location: LOC },
      { feature: 'explicit-override', location: LOC },
    ]);
  });

  it('creates alias markers and preserves skill output directories', () => {
    const source = program([
      block('skills', {
        review: { description: 'Review', content: 'Review code' },
        primitive: 'Imported',
      }),
    ]);

    const result = resolveUseImport(
      program([]),
      use({ alias: 'shared', outputDir: 'skills/team' }),
      source
    );

    expect(result.blocks.map((entry) => entry.name)).toEqual([
      'skills',
      '__import__shared',
      '__import__shared.skills',
    ]);
    expect(result.blocks[0]?.content).toMatchObject({
      properties: {
        review: { __outputDir: 'skills/team' },
        primitive: { __outputDir: 'skills/team' },
      },
    });
    expect(result.blocks[1]?.content).toMatchObject({
      properties: {
        __source: './shared',
        __blocks: ['skills'],
      },
    });
    expect(source.blocks[0]?.content).not.toMatchObject({
      properties: { review: { __outputDir: 'skills/team' } },
    });
  });

  it('rejects conflicting duplicate skills but permits identical definitions', () => {
    const target = program([block('skills', { review: { content: 'Local' } })]);

    expect(() =>
      resolveUseImport(
        target,
        use(),
        program([block('skills', { review: { content: 'Imported' } })])
      )
    ).toThrow(/Duplicate skill name/);
    expect(() =>
      resolveUseImport(target, use(), program([block('skills', { review: { content: 'Local' } })]))
    ).not.toThrow();
  });

  it('does not treat object prototype names as existing skills', () => {
    const result = resolveUseImport(
      program([block('skills', { review: { content: 'Review' } })]),
      use(),
      program([block('skills', { toString: { content: 'Stringify' } })])
    );
    const skills = result.blocks.find((entry) => entry.name === 'skills');

    expect(skills?.content).toMatchObject({
      properties: { toString: { content: 'Stringify' } },
    });
  });

  it('ignores output directory metadata when no skills block exists', () => {
    const result = resolveUseImport(
      program([]),
      use({ outputDir: 'skills/team' }),
      program([block('standards', { testing: true })])
    );

    expect(result.blocks).toEqual([block('standards', { testing: true })]);
  });
});
