import { describe, expect, it } from 'vitest';
import {
  applyOverride,
  createBlockBody,
  createValueNode,
  type Block,
  type OverrideBlock,
  type Program,
  type Value,
} from '../index.js';

const LOC = { file: 'override.prs', line: 1, column: 1, offset: 0 };

function block(name: string, properties: Record<string, Value>): Block {
  return {
    type: 'Block',
    name,
    content: { type: 'ObjectContent', properties, loc: LOC },
    loc: LOC,
  };
}

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

function valueOverride(targetPath: string, value: Value): OverrideBlock {
  return {
    type: 'OverrideBlock',
    targetPath,
    replacement: {
      type: 'ValueReplacement',
      value: createValueNode(value, LOC),
      loc: LOC,
    },
    loc: LOC,
  };
}

describe('block override', () => {
  it('replaces existing nested values without mutating input', () => {
    const replacementLoc = { ...LOC, line: 7, offset: 120 };
    const ast = program([
      {
        ...block('standards', {
          testing: { runner: 'jest', coverage: 80 },
        }),
        canonicalBody: createBlockBody(
          [
            {
              type: 'PresentationEntry',
              title: 'Engineering Rules',
              source: 'explicit',
              titleLoc: LOC,
              loc: LOC,
            },
            {
              type: 'FieldEntry',
              name: 'testing',
              value: createValueNode({ runner: 'jest', coverage: 80 }, LOC),
              loc: LOC,
            },
          ],
          LOC
        ),
      },
    ]);

    const result = applyOverride(ast, {
      type: 'OverrideBlock',
      targetPath: 'standards.testing.runner',
      replacement: {
        type: 'ValueReplacement',
        value: createValueNode('vitest', replacementLoc),
        loc: replacementLoc,
      },
      loc: replacementLoc,
    });

    expect(result.blocks[0]?.content).toMatchObject({
      properties: {
        testing: { runner: 'vitest', coverage: 80 },
      },
    });
    expect(result.blocks[0]?.canonicalBody?.entries[0]).toMatchObject({
      type: 'PresentationEntry',
      title: 'Engineering Rules',
    });
    expect(result.blocks[0]?.canonicalBody?.entries[1]).toMatchObject({
      type: 'FieldEntry',
      value: {
        type: 'ObjectValueNode',
        fields: expect.arrayContaining([
          expect.objectContaining({
            name: 'runner',
            value: expect.objectContaining({ loc: replacementLoc }),
          }),
        ]),
      },
    });
    expect(ast.blocks[0]?.content).toMatchObject({
      properties: {
        testing: { runner: 'jest', coverage: 80 },
      },
    });
  });

  it('replaces a complete block body atomically', () => {
    const ast = program([block('standards', { old: true })]);
    const override: OverrideBlock = {
      type: 'OverrideBlock',
      targetPath: 'standards',
      replacement: {
        type: 'BlockReplacement',
        body: createBlockBody(
          [
            {
              type: 'FieldEntry',
              name: 'testing',
              value: createValueNode(['Use Vitest'], LOC),
              loc: LOC,
            },
          ],
          LOC
        ),
        loc: LOC,
      },
      loc: LOC,
    };

    const result = applyOverride(ast, override);

    expect(result.blocks[0]?.content).toMatchObject({
      type: 'ObjectContent',
      properties: { testing: ['Use Vitest'] },
    });
    expect(result.blocks[0]?.content).not.toMatchObject({
      properties: { old: true },
    });
  });

  it('converts standalone block bodies for nested replacements', () => {
    const nested = (
      entries: Parameters<typeof createBlockBody>[0],
      projection?: 'ArrayContent'
    ): OverrideBlock => ({
      type: 'OverrideBlock',
      targetPath: 'standards.testing',
      replacement: {
        type: 'BlockReplacement',
        body: createBlockBody(entries, LOC, projection ? { projection } : undefined),
        loc: LOC,
      },
      loc: LOC,
    });
    const ast = program([block('standards', { testing: 'Old' })]);

    const textResult = applyOverride(
      ast,
      nested([{ type: 'TextEntry', text: 'Use Vitest', loc: LOC }])
    );
    const arrayResult = applyOverride(
      ast,
      nested(
        [{ type: 'ListEntry', value: createValueNode('Use Vitest', LOC), loc: LOC }],
        'ArrayContent'
      )
    );
    const objectResult = applyOverride(
      ast,
      nested([
        {
          type: 'FieldEntry',
          name: 'runner',
          value: createValueNode('vitest', LOC),
          loc: LOC,
        },
      ])
    );

    expect(textResult.blocks[0]?.content).toMatchObject({
      properties: { testing: { type: 'TextContent', value: 'Use Vitest' } },
    });
    expect(arrayResult.blocks[0]?.content).toMatchObject({
      properties: { testing: ['Use Vitest'] },
    });
    expect(objectResult.blocks[0]?.content).toMatchObject({
      properties: { testing: { runner: 'vitest' } },
    });
    expect(() =>
      applyOverride(
        ast,
        nested([
          { type: 'TextEntry', text: 'Required', loc: LOC },
          {
            type: 'FieldEntry',
            name: 'runner',
            value: createValueNode('vitest', LOC),
            loc: LOC,
          },
        ])
      )
    ).toThrow(/mixed block content/);
  });

  it('replaces root text, array, and mixed block bodies', () => {
    const textResult = applyOverride(
      program([block('identity', { old: true })]),
      valueOverride('identity', 'New identity')
    );
    const arrayResult = applyOverride(
      program([block('restrictions', { old: true })]),
      valueOverride('restrictions', ['No unsafe casts'])
    );
    const mixedResult = applyOverride(program([block('standards', { old: true })]), {
      type: 'OverrideBlock',
      targetPath: 'standards',
      replacement: {
        type: 'BlockReplacement',
        body: createBlockBody(
          [
            { type: 'TextEntry', text: 'Required rules', loc: LOC },
            {
              type: 'FieldEntry',
              name: 'testing',
              value: createValueNode(['Use Vitest'], LOC),
              loc: LOC,
            },
            {
              type: 'ListEntry',
              value: createValueNode('Document failures', LOC),
              loc: LOC,
            },
          ],
          LOC
        ),
        loc: LOC,
      },
      loc: LOC,
    });
    const textNodeResult = applyOverride(program([block('identity', { old: true })]), {
      type: 'OverrideBlock',
      targetPath: 'identity',
      replacement: {
        type: 'ValueReplacement',
        value: { type: 'TextValueNode', value: 'Text node identity', loc: LOC },
        loc: LOC,
      },
      loc: LOC,
    });

    expect(textResult.blocks[0]?.content).toMatchObject({
      type: 'TextContent',
      value: 'New identity',
    });
    expect(arrayResult.blocks[0]?.content).toMatchObject({
      type: 'ArrayContent',
      elements: ['No unsafe casts'],
    });
    expect(mixedResult.blocks[0]?.content).toMatchObject({
      type: 'MixedContent',
      text: { value: 'Required rules' },
      properties: {
        testing: ['Use Vitest'],
        items: ['Document failures'],
      },
    });
    expect(textNodeResult.blocks[0]?.content).toMatchObject({
      type: 'TextContent',
      value: 'Text node identity',
    });
  });

  it('treats domain type fields as ordinary object data', () => {
    const typeExpressionResult = applyOverride(
      program([block('standards', { old: true })]),
      valueOverride('standards', { type: 'TypeExpression', data: true })
    );
    const textContentResult = applyOverride(
      program([block('standards', { old: true })]),
      valueOverride('standards', {
        type: 'TextContent',
        value: 'domain value',
        extra: true,
      })
    );
    const nestedObjectContentResult = applyOverride(
      program([
        block('standards', {
          config: {
            type: 'ObjectContent',
            properties: { runner: 'jest' },
          },
        }),
      ]),
      valueOverride('standards.config.properties.runner', 'vitest')
    );

    expect(typeExpressionResult.blocks[0]?.content).toMatchObject({
      type: 'ObjectContent',
      properties: { type: 'TypeExpression', data: true },
    });
    expect(textContentResult.blocks[0]?.content).toMatchObject({
      type: 'ObjectContent',
      properties: {
        type: 'TextContent',
        value: 'domain value',
        extra: true,
      },
    });
    expect(nestedObjectContentResult.blocks[0]?.content).toMatchObject({
      properties: {
        config: {
          type: 'ObjectContent',
          properties: { runner: 'vitest' },
        },
      },
    });
  });

  it('replaces presentation and inline uses with the root body', () => {
    const ast = program([
      {
        ...block('skills', { old: { content: 'Old' } }),
        canonicalBody: createBlockBody(
          [
            {
              type: 'PresentationEntry',
              title: 'Old Skills',
              source: 'explicit',
              titleLoc: LOC,
              loc: LOC,
            },
            {
              type: 'InlineUseEntry',
              declaration: {
                type: 'InlineUseDeclaration',
                path: {
                  type: 'PathReference',
                  raw: './old',
                  segments: ['old'],
                  isRelative: true,
                  loc: LOC,
                },
                loc: LOC,
              },
              loc: LOC,
            },
          ],
          LOC
        ),
      },
    ]);

    const result = applyOverride(ast, valueOverride('skills', { new: { content: 'New' } }));

    expect(result.blocks[0]?.canonicalBody?.entries).toEqual([
      expect.objectContaining({ type: 'FieldEntry', name: 'new' }),
    ]);
  });

  it('resolves imported aliases to surviving blocks', () => {
    const ast = program([
      block('__import__base', { __source: './base.prs' }),
      block('standards', { testing: ['Old'] }),
    ]);

    const result = applyOverride(ast, valueOverride('base.standards.testing', ['New']));

    expect(result.blocks[1]?.content).toMatchObject({
      properties: { testing: ['New'] },
    });
  });

  it('resolves direct and aliased qualified agent paths', () => {
    const direct = applyOverride(
      program([block('agents', { 'team.reviewer': { description: 'Original' } })]),
      valueOverride('agents.team.reviewer', { description: 'Direct update' })
    );
    const unqualified = applyOverride(
      program([block('agents', { reviewer: { description: 'Original' } })]),
      valueOverride('agents.reviewer', { description: 'Unqualified update' })
    );
    const aliased = applyOverride(
      program([
        block('__import__team', {
          __source: './team.prs',
          __blocks: ['agents'],
        }),
        block('agents', { 'team.reviewer': { description: 'Original' } }),
      ]),
      valueOverride('team.agents.reviewer.description', 'Aliased update')
    );

    expect(direct.blocks[0]?.content).toMatchObject({
      properties: { 'team.reviewer': { description: 'Direct update' } },
    });
    expect(unqualified.blocks[0]?.content).toMatchObject({
      properties: { reviewer: { description: 'Unqualified update' } },
    });
    expect(aliased.blocks[1]?.content).toMatchObject({
      properties: { 'team.reviewer': { description: 'Aliased update' } },
    });
  });

  it('rejects blocks that were not exported by an imported alias', () => {
    const ast = program([
      block('__import__base', {
        __source: './base.prs',
        __blocks: ['context'],
      }),
      block('standards', { testing: ['Local'] }),
    ]);

    expect(() => applyOverride(ast, valueOverride('base.standards.testing', ['Invalid']))).toThrow(
      /is not exported by alias "base"/
    );
  });

  it('rejects missing paths and scalar traversal', () => {
    const ast = program([block('standards', { testing: 'strict' })]);

    expect(() => applyOverride(ast, valueOverride('standards.missing', true))).toThrow(
      /does not exist at segment "missing"/
    );
    expect(() => applyOverride(ast, valueOverride('standards.testing.runner', 'vitest'))).toThrow(
      /non-object segment "runner"/
    );
    expect(() => applyOverride(ast, valueOverride('standards.toString', 'invalid'))).toThrow(
      /does not exist at segment "toString"/
    );
    const objectAst = program([block('standards', { testing: { runner: 'jest' } })]);
    expect(() =>
      applyOverride(objectAst, valueOverride('standards.testing.missing', 'invalid'))
    ).toThrow(/does not exist at segment "missing"/);
    expect(() => applyOverride(ast, valueOverride('context.runtime', 'node'))).toThrow(
      /target "context.runtime" does not exist/
    );

    const textBlock: Block = {
      type: 'Block',
      name: 'identity',
      content: { type: 'TextContent', value: 'Identity', loc: LOC },
      loc: LOC,
    };
    expect(() =>
      applyOverride(program([textBlock]), valueOverride('identity.name', 'invalid'))
    ).toThrow(/root block is not object-shaped/);
  });

  it('rejects primitive root block replacements', () => {
    const ast = program([block('standards', { testing: ['Old'] })]);

    expect(() => applyOverride(ast, valueOverride('standards', true))).toThrow(
      /Cannot replace block "@standards" with boolean content/
    );
  });

  it('cannot remove or change sealed skill properties', () => {
    const ast = program([
      block('skills', {
        review: {
          description: 'Review code',
          content: 'Critical instructions',
          license: 'MIT',
          sealed: ['content', 'license'],
        },
      }),
    ]);

    expect(() => applyOverride(ast, valueOverride('skills.review.content', 'Changed'))).toThrow(
      /Cannot override sealed property 'content'/
    );
    expect(() => applyOverride(ast, valueOverride('skills.review.license', 'Apache-2.0'))).toThrow(
      /Cannot override sealed property 'license'/
    );
    expect(() => applyOverride(ast, valueOverride('skills.review.sealed', false))).toThrow(
      /Cannot override protected property 'sealed'/
    );
    expect(() =>
      applyOverride(
        ast,
        valueOverride('skills.review', {
          description: 'Review code',
          license: 'MIT',
          sealed: ['content', 'license'],
        })
      )
    ).toThrow(/Cannot change sealed property 'content'/);

    const fullySealed = program([
      block('skills', {
        review: {
          description: 'Review code',
          content: 'Critical instructions',
          sealed: true,
        },
      }),
    ]);
    expect(() =>
      applyOverride(fullySealed, valueOverride('skills.review.description', 'Changed'))
    ).toThrow(/Cannot override sealed property 'description'/);

    const unsealed = program([
      block('skills', {
        review: {
          description: 'Review code',
          content: 'Instructions',
          sealed: false,
        },
      }),
    ]);
    expect(
      applyOverride(unsealed, valueOverride('skills.review.description', 'Changed')).blocks[0]
        ?.content
    ).toMatchObject({
      properties: { review: { description: 'Changed' } },
    });
  });

  it('rejects replacements that weaken sealed skill contracts', () => {
    const ast = program([
      block('skills', {
        review: {
          description: 'Review code',
          content: 'Critical instructions',
          sealed: ['content'],
        },
      }),
    ]);

    expect(() => applyOverride(ast, valueOverride('skills', 'Invalid'))).toThrow(
      /Cannot replace @skills with non-object content/
    );
    expect(() =>
      applyOverride(ast, valueOverride('skills', { deploy: { content: 'Deploy' } }))
    ).toThrow(/Cannot remove skill "review"/);
    expect(() => applyOverride(ast, valueOverride('skills.missing.content', 'Invalid'))).toThrow(
      /does not exist at segment "missing"/
    );
    expect(() => applyOverride(ast, valueOverride('skills.review', 'Invalid'))).toThrow(
      /Cannot replace skill "review" with non-object content/
    );
    expect(() =>
      applyOverride(
        ast,
        valueOverride('skills.review', {
          description: 'Review code',
          content: 'Critical instructions',
          sealed: ['description'],
        })
      )
    ).toThrow(/Cannot change protected property 'sealed'/);
  });

  it('protects sealed declarations during complete skills replacement', () => {
    const ast = program([
      block('skills', {
        review: {
          description: 'Review code',
          content: 'Critical instructions',
          sealed: ['content'],
        },
      }),
    ]);

    expect(() =>
      applyOverride(
        ast,
        valueOverride('skills', {
          review: {
            description: 'Updated description',
            content: 'Critical instructions',
            sealed: ['content'],
          },
          deploy: {
            content: 'Deploy',
            sealed: ['content'],
          },
        })
      )
    ).toThrow(/Cannot add protected property 'sealed'/);
    expect(() =>
      applyOverride(
        ast,
        valueOverride('skills', {
          review: {
            description: 'Updated description',
            content: 'Critical instructions',
            sealed: ['content'],
          },
          toString: {
            content: 'Prototype collision',
            sealed: ['content'],
          },
        })
      )
    ).toThrow(/Cannot add protected property 'sealed'/);
  });

  it('allows complete skills replacement to update unsealed fields', () => {
    const ast = program([
      block('skills', {
        review: {
          description: 'Review code',
          content: 'Critical instructions',
          sealed: ['content'],
        },
        removable: {
          content: 'Unsealed instructions',
        },
      }),
    ]);

    const result = applyOverride(
      ast,
      valueOverride('skills', {
        review: {
          description: 'Updated description',
          content: 'Critical instructions',
          sealed: ['content'],
        },
      })
    );

    expect(result.blocks[0]?.content).toMatchObject({
      properties: {
        review: {
          description: 'Updated description',
          content: 'Critical instructions',
          sealed: ['content'],
        },
      },
    });
  });

  it('compares sealed text semantically instead of by source location', () => {
    const originalTextLoc = { ...LOC, line: 3, offset: 25 };
    const replacementTextLoc = { ...LOC, line: 12, offset: 180 };
    const ast = program([
      block('skills', {
        review: {
          description: 'Review code',
          content: {
            type: 'TextContent',
            value: 'Critical instructions',
            loc: originalTextLoc,
          },
          sealed: ['content'],
        },
      }),
    ]);

    const result = applyOverride(
      ast,
      valueOverride('skills.review', {
        description: 'Updated description',
        content: {
          type: 'TextContent',
          value: 'Critical instructions',
          loc: replacementTextLoc,
        },
        sealed: ['content'],
      })
    );

    expect(result.blocks[0]?.content).toMatchObject({
      properties: {
        review: {
          description: 'Updated description',
          content: {
            value: 'Critical instructions',
            loc: replacementTextLoc,
          },
        },
      },
    });
  });
});
