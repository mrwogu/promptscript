import { describe, expect, it } from 'vitest';
import {
  AgentConflictError,
  createNativeAgentNameMap,
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

  it('rejects conflicting prompt entries but permits identical ones', () => {
    const entry = (user: string): Record<string, Value> => ({
      review: { description: 'Review', user },
    });
    const target = program([block('prompts', entry('Local'))]);

    expect(() =>
      resolveUseImport(target, use(), program([block('prompts', entry('Other'))]))
    ).toThrow(
      /Duplicate prompt name\(s\) detected when importing '\.\/shared': review\. Rename one/
    );
    expect(() =>
      resolveUseImport(target, use(), program([block('prompts', entry('Local'))]))
    ).not.toThrow();
  });

  it('compares prompt entries that sit next to free text', () => {
    const mixed = (user: string): Block => ({
      type: 'Block',
      name: 'prompts',
      content: {
        type: 'MixedContent',
        text: { type: 'TextContent', value: 'notes', loc: LOC },
        properties: { review: { description: 'Review', user } },
        loc: LOC,
      },
      loc: LOC,
    });

    expect(() =>
      resolveUseImport(program([mixed('Local')]), use(), program([mixed('Other')]))
    ).toThrow(/Duplicate prompt name/);
    expect(() =>
      resolveUseImport(program([mixed('Local')]), use(), program([mixed('Local')]))
    ).not.toThrow();
  });

  it('adds new prompt entries and ignores where identical text was written', () => {
    const text = (file: string): Value => ({
      type: 'TextContent',
      value: 'Same text',
      loc: { file, line: 4, column: 3, offset: 40 },
    });
    const entry = (file: string): Record<string, Value> => ({
      review: { description: 'Review', user: text(file) },
    });
    const target = program([block('prompts', entry('local.prs'))]);
    const source = program([
      block('prompts', { ...entry('shared.prs'), extra: { description: 'Extra', user: 'Hi' } }),
    ]);

    const result = resolveUseImport(target, use(), source);

    expect(Object.keys((result.blocks[0]!.content as { properties: object }).properties)).toEqual([
      'review',
      'extra',
    ]);
  });

  it('does not treat object prototype names as existing prompts', () => {
    const target = program([block('prompts', { review: { description: 'R', user: 'U' } })]);
    const source = program([block('prompts', { constructor: { description: 'C', user: 'U' } })]);

    expect(() => resolveUseImport(target, use(), source)).not.toThrow();
  });

  it('qualifies imported agents under an alias and records provenance', () => {
    const source = program([block('agents', { reviewer: { description: 'Review code' } })]);

    const result = resolveUseImport(program([]), use({ alias: 'team' }), source);
    const agents = result.blocks.find((entry) => entry.name === 'agents');

    expect(agents?.content).toMatchObject({
      properties: {
        'team.reviewer': { description: 'Review code' },
      },
    });
    expect(result.agentProvenance).toEqual([
      expect.objectContaining({
        name: 'team.reviewer',
        source: 'import.prs',
        importPath: './shared',
        namespace: 'team',
        action: 'qualified',
      }),
    ]);
  });

  it('qualifies nested agent references under an alias', () => {
    const source = program([
      block('agents', {
        reviewer: {
          description: 'Review code',
          agent: 'planner',
          handoffs: [{ label: 'Plan work', agent: 'planner' }],
        },
        planner: { description: 'Plan work' },
      }),
    ]);

    const result = resolveUseImport(program([]), use({ alias: 'team' }), source);
    const agents = result.blocks.find((entry) => entry.name === 'agents');

    expect(agents?.content).toMatchObject({
      properties: {
        'team.reviewer': {
          agent: 'team.planner',
          handoffs: [{ agent: 'team.planner' }],
        },
        'team.planner': { description: 'Plan work' },
      },
    });
  });

  it('qualifies mixed agents and preserves other aliased blocks', () => {
    const source = program([
      {
        type: 'Block',
        name: 'agents',
        content: {
          type: 'MixedContent',
          properties: { reviewer: { description: 'Review code' } },
          loc: LOC,
        },
        loc: LOC,
      },
      block('identity', { text: 'Agent guidance' }),
    ]);

    const result = resolveUseImport(program([]), use({ alias: 'team' }), source);

    expect(result.blocks.map((entry) => entry.name)).toEqual([
      'agents',
      'identity',
      '__import__team',
      '__import__team.agents',
      '__import__team.identity',
    ]);
    expect(result.blocks[0]?.content).toMatchObject({
      type: 'MixedContent',
      properties: {
        'team.reviewer': { description: 'Review code' },
      },
    });
  });

  it('preserves existing provenance for aliased and unaliased imports', () => {
    const source = program([block('agents', { reviewer: { description: 'Review code' } })], []);
    source.agentProvenance = [
      {
        name: 'reviewer',
        source: 'source.prs',
        action: 'native',
        loc: LOC,
      },
    ];

    const unaliased = resolveUseImport(program([]), use(), source);
    expect(unaliased.agentProvenance).toEqual([
      expect.objectContaining({
        name: 'reviewer',
        source: 'source.prs',
        importPath: './shared',
        action: 'imported',
      }),
    ]);

    const aliased = resolveUseImport(program([]), use({ alias: 'team' }), source);
    expect(aliased.agentProvenance).toEqual([
      expect.objectContaining({
        name: 'team.reviewer',
        source: 'source.prs',
        importPath: './shared',
        namespace: 'team',
        action: 'qualified',
      }),
    ]);

    source.agentProvenance = [
      {
        name: 'reviewer',
        source: 'source.prs',
        importPath: './nested',
        namespace: 'team',
        action: 'qualified',
        loc: LOC,
      },
    ];
    const qualified = resolveUseImport(program([]), use(), source);
    expect(qualified.agentProvenance).toEqual([
      expect.objectContaining({
        name: 'reviewer',
        source: 'source.prs',
        importPath: './nested',
        namespace: 'team',
        action: 'qualified',
      }),
    ]);
  });

  it('preserves the original import path for transitive qualified agents', () => {
    const source = program([block('agents', { reviewer: { description: 'Review code' } })], []);
    source.agentProvenance = [
      {
        name: 'reviewer',
        source: 'nested.prs',
        importPath: './nested',
        namespace: 'inner',
        action: 'qualified',
        loc: LOC,
      },
    ];

    const result = resolveUseImport(
      program([]),
      use({ path: { ...use().path, raw: './outer' } }),
      source
    );

    expect(result.agentProvenance).toEqual([
      expect.objectContaining({
        name: 'reviewer',
        source: 'nested.prs',
        importPath: './nested',
        namespace: 'inner',
        action: 'qualified',
      }),
    ]);
  });

  it('reports all provenance when an agent import conflicts', () => {
    const target = program([block('agents', { reviewer: { description: 'Local review' } })]);
    const source = program([block('agents', { reviewer: { description: 'Imported review' } })]);

    expect(() => resolveUseImport(target, use(), source)).toThrow(AgentConflictError);
    try {
      resolveUseImport(target, use(), source);
      throw new Error('Expected agent conflict');
    } catch (error) {
      expect(error).toBeInstanceOf(AgentConflictError);
      const conflict = error as AgentConflictError;
      expect(conflict.message).toContain('reviewer');
      expect(conflict.message).toContain('./shared');
      expect(conflict.message).toContain('Use a unique @use alias');
      expect(conflict.provenance).toHaveLength(2);
    }
  });

  it('keeps unique unaliased agents and maps native collisions deterministically', () => {
    const source = program([block('agents', { reviewer: { description: 'Review code' } })]);
    const result = resolveUseImport(program([]), use(), source);

    expect(result.blocks.find((entry) => entry.name === 'agents')?.content).toMatchObject({
      properties: { reviewer: { description: 'Review code' } },
    });
    expect(result.agentProvenance).toEqual([
      expect.objectContaining({ name: 'reviewer', action: 'imported' }),
    ]);

    expect([...createNativeAgentNameMap(['team.reviewer', 'team-reviewer'])]).toEqual([
      ['team-reviewer', 'team-reviewer'],
      ['team.reviewer', 'team-reviewer-2'],
    ]);
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
