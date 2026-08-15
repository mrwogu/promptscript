import { describe, expect, it } from 'vitest';
import {
  createNativeAgentNameMap,
  ensureAgentProvenance,
  findAgentConflicts,
  getAgentProperties,
  getAgentProvenance,
  getAgentProvenanceEntries,
  qualifyAgentName,
  qualifyAgentProperties,
  toNativeAgentName,
  type Block,
  type MixedContent,
  type Program,
  type SourceLocation,
} from '../index.js';

const LOC = { file: 'agents.prs', line: 1, column: 1, offset: 0 };

function block(name: string, content: Block['content'], loc: SourceLocation = LOC): Block {
  return {
    type: 'Block',
    name,
    content,
    loc,
  };
}

function program(blocks: Block[], agentProvenance?: Program['agentProvenance']): Program {
  return {
    type: 'Program',
    uses: [],
    blocks,
    extends: [],
    loc: LOC,
    ...(agentProvenance ? { agentProvenance } : {}),
  };
}

describe('agent names', () => {
  it('qualifies names and maps native identifiers without collisions', () => {
    expect(qualifyAgentName('team', 'reviewer')).toBe('team.reviewer');
    expect(toNativeAgentName('team.reviewer')).toBe('team-reviewer');
    expect([
      ...createNativeAgentNameMap(['team.reviewer', 'team-reviewer', 'team.reviewer']),
    ]).toEqual([
      ['team-reviewer', 'team-reviewer'],
      ['team.reviewer', 'team-reviewer-2'],
    ]);
  });

  it('avoids native collisions that differ only by case', () => {
    expect([...createNativeAgentNameMap(['team.reviewer', 'Team.reviewer'])]).toEqual([
      ['Team.reviewer', 'Team-reviewer'],
      ['team.reviewer', 'team-reviewer-2'],
    ]);
  });

  it('reads object and mixed agent blocks and returns empty non-object blocks', () => {
    const mixed: MixedContent = {
      type: 'MixedContent',
      text: { type: 'TextContent', value: 'Instructions', loc: LOC },
      properties: { reviewer: { description: 'Review' } },
      loc: LOC,
    };

    expect(getAgentProperties(program([]))).toEqual({});
    expect(
      getAgentProperties(
        program([block('identity', { type: 'TextContent', value: 'Text', loc: LOC })])
      )
    ).toEqual({});
    expect(
      getAgentProperties(
        program([block('agents', { type: 'TextContent', value: 'Text', loc: LOC })])
      )
    ).toEqual({});
    expect(getAgentProperties(program([block('agents', mixed)]))).toEqual(mixed.properties);
  });

  it('adds fallback provenance only for unknown agent names', () => {
    const ast = program([
      block('agents', {
        type: 'ObjectContent',
        properties: {
          reviewer: { description: 'Review' },
          planner: { description: 'Plan' },
        },
        loc: LOC,
      }),
    ]);

    const result = ensureAgentProvenance(ast, 'project.prs', 'native');

    expect(result).not.toBe(ast);
    expect(result.agentProvenance).toEqual([
      expect.objectContaining({ name: 'reviewer', source: 'project.prs', action: 'native' }),
      expect.objectContaining({ name: 'planner', source: 'project.prs', action: 'native' }),
    ]);
    expect(ensureAgentProvenance(result, 'other.prs')).toBe(result);
    expect(ensureAgentProvenance(program([]), 'empty.prs')).toEqual(program([]));
  });

  it('ignores source locations when comparing equal agent values', () => {
    const target = program([
      block('agents', {
        type: 'ObjectContent',
        properties: {
          reviewer: {
            description: 'Review',
            tools: [{ name: 'Read', loc: { ...LOC, line: 2 } }],
            loc: { ...LOC, line: 3 },
          },
        },
        loc: LOC,
      }),
    ]);
    const source = program([
      block('agents', {
        type: 'ObjectContent',
        properties: {
          reviewer: {
            description: 'Review',
            tools: [{ name: 'Read', loc: { ...LOC, line: 9 } }],
            loc: { ...LOC, line: 10 },
          },
        },
        loc: LOC,
      }),
    ]);

    expect(findAgentConflicts(target, source, './shared')).toEqual([]);
  });

  it('ignores property order when comparing equal agent values', () => {
    const target = program([
      block('agents', {
        type: 'ObjectContent',
        properties: {
          reviewer: {
            description: 'Review',
            model: 'sonnet',
          },
        },
        loc: LOC,
      }),
    ]);
    const source = program([
      block('agents', {
        type: 'ObjectContent',
        properties: {
          reviewer: {
            model: 'sonnet',
            description: 'Review',
          },
        },
        loc: LOC,
      }),
    ]);

    expect(findAgentConflicts(target, source, './shared')).toEqual([]);
  });

  it('records fallback provenance for conflicting definitions', () => {
    const targetAgentsLoc = { ...LOC, file: 'target.prs', line: 2 };
    const importLoc = { ...LOC, file: 'child.prs', line: 10 };
    const target = program([
      block(
        'agents',
        {
          type: 'ObjectContent',
          properties: { reviewer: { description: 'Local' } },
          loc: targetAgentsLoc,
        },
        targetAgentsLoc
      ),
    ]);
    const source = program([
      block('agents', {
        type: 'ObjectContent',
        properties: { reviewer: { description: 'Imported' } },
        loc: LOC,
      }),
    ]);

    const conflicts = findAgentConflicts(target, source, './shared', importLoc);

    expect(conflicts).toEqual([
      {
        name: 'reviewer',
        provenance: [
          expect.objectContaining({
            name: 'reviewer',
            source: 'agents.prs',
            action: 'local',
            loc: targetAgentsLoc,
          }),
          expect.objectContaining({
            name: 'reviewer',
            source: 'agents.prs',
            action: 'imported',
            importPath: './shared',
            loc: importLoc,
          }),
        ],
      },
    ]);

    const attributedTarget = program(
      [
        block('agents', {
          type: 'ObjectContent',
          properties: { reviewer: { description: 'Local' } },
          loc: LOC,
        }),
      ],
      [{ name: 'reviewer', source: 'project.prs', action: 'local', loc: LOC }]
    );
    const attributedSource = program(
      [
        block('agents', {
          type: 'ObjectContent',
          properties: { reviewer: { description: 'Imported' } },
          loc: LOC,
        }),
      ],
      [
        {
          name: 'reviewer',
          source: 'shared.prs',
          importPath: './shared',
          action: 'imported',
          loc: LOC,
        },
      ]
    );

    expect(findAgentConflicts(attributedTarget, attributedSource, './shared', LOC)).toEqual([
      expect.objectContaining({
        name: 'reviewer',
        provenance: [
          expect.objectContaining({ source: 'project.prs', action: 'local' }),
          expect.objectContaining({ source: 'shared.prs', action: 'imported' }),
        ],
      }),
    ]);
  });

  it('qualifies mixed content and preserves nested provenance namespaces', () => {
    const sourceProvenance = [
      {
        name: 'reviewer',
        source: 'nested.prs',
        namespace: 'inner',
        action: 'imported' as const,
      },
    ];
    const source = program(
      [
        block('agents', {
          type: 'MixedContent',
          text: { type: 'TextContent', value: 'Agents', loc: LOC },
          properties: {
            reviewer: { description: 'Review' },
            planner: { description: 'Plan' },
          },
          loc: LOC,
        }),
      ],
      sourceProvenance
    );
    const agents = source.blocks[0]!.content;
    if (agents.type !== 'MixedContent') {
      throw new Error('Expected mixed agent content');
    }

    const result = qualifyAgentProperties(agents, 'team', source, './nested', LOC);

    expect(result.content).toMatchObject({
      type: 'MixedContent',
      text: { value: 'Agents' },
      properties: {
        'team.reviewer': { description: 'Review' },
        'team.planner': { description: 'Plan' },
      },
    });
    expect(result.provenance).toEqual([
      expect.objectContaining({
        name: 'team.reviewer',
        namespace: 'team.inner',
        action: 'qualified',
        importPath: './nested',
        loc: LOC,
      }),
      expect.objectContaining({
        name: 'team.planner',
        namespace: 'team',
        action: 'qualified',
        importPath: './nested',
        source: 'agents.prs',
        loc: LOC,
      }),
    ]);
    expect(getAgentProvenance(source, 'reviewer')).toEqual(sourceProvenance[0]);
    expect(getAgentProvenanceEntries(source, 'missing')).toEqual([]);
  });

  it('returns no conflicts when target has no matching agents', () => {
    const target = program([
      block('agents', {
        type: 'ObjectContent',
        properties: { planner: { description: 'Plan' } },
        loc: LOC,
      }),
    ]);
    const source = program([
      block('agents', {
        type: 'ObjectContent',
        properties: { reviewer: { description: 'Review' } },
        loc: LOC,
      }),
    ]);

    expect(findAgentConflicts(target, source, './shared')).toEqual([]);
  });
});
