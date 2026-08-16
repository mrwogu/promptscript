import {
  collectProvenance,
  collectCompositionProvenanceEvents,
  collectProvenanceEvents,
  collectProvenanceValueEvents,
  createBlockBody,
  createValueNode,
  emptyProvenance,
  normalizeProgram,
  prefixProvenance,
  toLegacyProgram,
  type BlockEntry,
  type CanonicalProgram,
  type InlineUseDeclaration,
  type Program,
  type Value,
} from '../index.js';

const BASE_LOC = { file: 'base.prs', line: 2, column: 3, offset: 10 };
const CHILD_LOC = { file: 'child.prs', line: 4, column: 5, offset: 30 };

function createProgram(): Program {
  return {
    type: 'Program',
    blocks: [
      {
        type: 'Block',
        name: 'standards',
        content: {
          type: 'ObjectContent',
          properties: {
            code: {
              style: 'strict',
              frameworks: ['react', 'vue'],
            },
          },
          loc: BASE_LOC,
        },
        loc: BASE_LOC,
      },
    ],
    uses: [],
    extends: [],
    loc: BASE_LOC,
  };
}

describe('provenance', () => {
  it('collects blocks, nested values, and list entries through both projections', () => {
    const program = createProgram();
    const canonical = normalizeProgram(program);
    const legacy = toLegacyProgram(canonical, { preserveCanonicalBody: true });

    const canonicalTrace = collectProvenance(canonical, { entry: 'child.prs' });
    const legacyTrace = collectProvenance(legacy, { entry: 'child.prs' });

    expect(canonicalTrace.entries.map((entry) => entry.path)).toEqual(
      legacyTrace.entries.map((entry) => entry.path)
    );
    expect(canonicalTrace.entries.map((entry) => entry.path)).toEqual([
      'standards',
      'standards.code',
      'standards.code.frameworks',
      'standards.code.frameworks[0]',
      'standards.code.frameworks[1]',
      'standards.code.style',
    ]);
    expect(
      canonicalTrace.entries.find((entry) => entry.path === 'standards.code.style')?.source
    ).toEqual(BASE_LOC);
  });

  it('keeps inherited history and records replacement operations', () => {
    const base = collectProvenance(createProgram(), { entry: 'base.prs' });
    const extensionBody = createBlockBody(
      [
        {
          type: 'FieldEntry',
          name: 'code',
          value: createValueNode({ style: 'portable' }, CHILD_LOC),
          loc: CHILD_LOC,
        },
      ],
      CHILD_LOC
    );
    const child = collectProvenance(createProgram(), {
      entry: 'child.prs',
      inherited: base.entries,
      events: collectProvenanceEvents(
        extensionBody,
        'standards',
        'extend',
        CHILD_LOC,
        'merged',
        'merge'
      ),
    });
    const style = child.entries.find((entry) => entry.path === 'standards.code.style');

    expect(style).toBeDefined();
    expect(style?.history.some((step) => step.source.file === 'base.prs')).toBe(true);
    expect(style?.history.at(-1)).toMatchObject({
      operation: 'extend',
      action: 'merged',
      source: CHILD_LOC,
      strategy: 'merge',
    });
  });

  it('matches composition provenance by source and preserves source locations', () => {
    const declaration = {
      type: 'InlineUseDeclaration',
      path: {
        type: 'PathReference',
        raw: './phase',
        segments: ['phase'],
        isRelative: true,
        loc: BASE_LOC,
      },
      loc: BASE_LOC,
    } satisfies InlineUseDeclaration;
    const events = collectCompositionProvenanceEvents(
      [{ source: '/phase.prs', loc: CHILD_LOC }, { source: '/missing.prs' }],
      [{ declaration }],
      () => '/phase.prs',
      'ops'
    );

    expect(events).toHaveLength(4);
    expect(events.map((event) => event.path)).not.toContain('skills.ops.inputs');
    expect(events.map((event) => event.path)).not.toContain('skills.ops.outputs');
    for (const event of events) {
      expect(event.source).toEqual(CHILD_LOC);
    }
    expect(
      collectCompositionProvenanceEvents(
        [{ source: '/unmatched.prs' }],
        [{ declaration }],
        () => '/phase.prs',
        'ops'
      )
    ).toEqual([]);
  });

  it('maps incoming array events to final merged indexes', () => {
    const extensionBody = createBlockBody(
      [
        {
          type: 'FieldEntry',
          name: 'frameworks',
          value: createValueNode(['shared', 'new'], CHILD_LOC),
          loc: CHILD_LOC,
        },
      ],
      CHILD_LOC
    );
    const events = collectProvenanceEvents(
      extensionBody,
      'standards',
      'extend',
      CHILD_LOC,
      'merged',
      'append',
      {
        finalContent: {
          type: 'ObjectContent',
          properties: { frameworks: ['base', 'shared', 'new'] },
          loc: CHILD_LOC,
        },
        baseContent: {
          type: 'ObjectContent',
          properties: { frameworks: ['base', 'shared'] },
          loc: BASE_LOC,
        },
      }
    );

    expect(events.map((event) => event.path)).toEqual([
      'standards',
      'standards.frameworks',
      'standards.frameworks[2]',
    ]);
  });

  it('maps duplicate and structured list values to canonical positions', () => {
    const duplicateArray = ['shared'];
    const duplicateObject = { key: 'value' };
    const template = {
      type: 'TemplateExpression' as const,
      name: 'phase',
      loc: CHILD_LOC,
    };
    const typeExpression = {
      type: 'TypeExpression' as const,
      kind: 'string' as const,
      loc: CHILD_LOC,
    };
    const removedLoc = { file: 'removed.prs', line: 8, column: 1, offset: 80 };
    const extensionBody = createBlockBody(
      [
        {
          type: 'ListEntry',
          value: createValueNode(duplicateArray, CHILD_LOC),
          loc: CHILD_LOC,
        },
        {
          type: 'ListEntry',
          value: createValueNode(duplicateArray, CHILD_LOC),
          loc: CHILD_LOC,
        },
        {
          type: 'ListEntry',
          value: createValueNode(duplicateObject, CHILD_LOC),
          loc: CHILD_LOC,
        },
        {
          type: 'ListEntry',
          value: createValueNode(template, CHILD_LOC),
          loc: CHILD_LOC,
        },
        {
          type: 'ListEntry',
          value: createValueNode(typeExpression, CHILD_LOC),
          loc: CHILD_LOC,
        },
        {
          type: 'ListEntry',
          value: createValueNode('removed', removedLoc),
          loc: removedLoc,
        },
      ],
      CHILD_LOC
    );
    const finalContent = {
      type: 'ArrayContent' as const,
      elements: [duplicateArray, duplicateArray, duplicateObject, template, typeExpression],
      loc: CHILD_LOC,
    };
    const events = collectProvenanceEvents(
      extensionBody,
      'standards',
      'extend',
      CHILD_LOC,
      'merged',
      'merge',
      {
        finalContent,
        baseContent: {
          type: 'ArrayContent',
          elements: [duplicateObject],
          loc: BASE_LOC,
        },
      }
    );

    expect(events.map((event) => event.path)).toEqual([
      'standards',
      'standards[0]',
      'standards[0][0]',
      'standards[1]',
      'standards[1][0]',
      'standards[2]',
      'standards[2].key',
      'standards[3]',
      'standards[4]',
    ]);
  });

  it('skips composition metadata when resolving its source fails', () => {
    const declaration = {
      type: 'InlineUseDeclaration' as const,
      path: {
        type: 'PathReference' as const,
        raw: './phase',
        segments: ['phase'],
        isRelative: true,
        loc: BASE_LOC,
      },
      loc: BASE_LOC,
    } satisfies InlineUseDeclaration;

    expect(
      collectCompositionProvenanceEvents(
        [{ source: '/phase.prs' }],
        [{ declaration }],
        () => {
          throw new Error('phase unavailable');
        },
        'ops'
      )
    ).toEqual([]);
  });

  it('preserves transitive composition links from child provenance', () => {
    const declaration = {
      type: 'InlineUseDeclaration' as const,
      path: {
        type: 'PathReference' as const,
        raw: './phase',
        segments: ['phase'],
        isRelative: true,
        loc: BASE_LOC,
      },
      loc: BASE_LOC,
    } satisfies InlineUseDeclaration;
    const childLink = {
      operation: 'inherit' as const,
      source: BASE_LOC,
      target: 'base.prs',
      reference: './base',
    };
    const childTrace = {
      version: 1 as const,
      entry: 'phase.prs',
      entries: [
        {
          path: 'skills.phase.content',
          kind: 'value' as const,
          source: BASE_LOC,
          history: [
            {
              operation: 'declaration' as const,
              action: 'selected' as const,
              source: BASE_LOC,
              chain: [],
            },
            {
              operation: 'generated' as const,
              action: 'composed' as const,
              source: BASE_LOC,
              chain: [childLink],
            },
            {
              operation: 'extend' as const,
              action: 'merged' as const,
              source: CHILD_LOC,
              target: 'skills.phase',
              reference: './phase',
              alias: 'phase',
              chain: [childLink],
            },
          ],
        },
      ],
    };
    const events = collectCompositionProvenanceEvents(
      [
        {
          source: '/phase.prs',
          loc: CHILD_LOC,
          definitionLoc: BASE_LOC,
          provenance: childTrace,
        },
      ],
      [{ declaration }],
      () => '/phase.prs',
      'ops'
    );

    expect(events).not.toHaveLength(0);
    const composition = events[0]!;
    expect(composition.trace).toEqual(childTrace);
    expect(composition.chain).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ operation: 'compose' }),
        expect.objectContaining({ operation: 'inherit', target: 'base.prs' }),
        expect.objectContaining({ operation: 'extend', target: 'skills.phase' }),
      ])
    );
  });

  it('returns stable path ordering and versioned JSON shape', () => {
    const trace = collectProvenance(createProgram(), { entry: 'entry.prs' });

    expect(trace.version).toBe(1);
    expect(trace.entry).toBe('entry.prs');
    expect(JSON.stringify(trace)).toBe(
      JSON.stringify(collectProvenance(createProgram(), { entry: 'entry.prs' }))
    );
  });

  it('handles non-container values and optional operation metadata', () => {
    const program = createProgram();
    const block = program.blocks[0];
    if (block?.content.type !== 'ObjectContent') {
      throw new Error('Expected object content');
    }
    block.content.properties['template'] = {
      type: 'TemplateExpression',
      name: 'projectName',
      loc: BASE_LOC,
    };
    block.content.properties['text'] = {
      type: 'TextContent',
      value: 'text value',
      loc: BASE_LOC,
    };
    block.content.properties['type'] = {
      type: 'TypeExpression',
      kind: 'string',
      loc: BASE_LOC,
    };
    block.content.properties['value'] = 'base value';

    const extensionBody = createBlockBody(
      [
        {
          type: 'FieldEntry',
          name: 'value',
          value: createValueNode('value', CHILD_LOC),
          loc: CHILD_LOC,
        },
        { type: 'TextEntry', text: 'text', loc: CHILD_LOC },
      ],
      CHILD_LOC
    );
    const trace = collectProvenance(program);
    const withEvents = collectProvenance(program, {
      events: [
        ...collectProvenanceEvents(extensionBody, 'standards', 'extend', CHILD_LOC, 'merged').map(
          (event) => ({
            ...event,
            reference: './base',
            alias: 'base',
          })
        ),
        {
          path: 'standards',
          operation: 'extend',
          action: 'merged',
          source: { file: 'no-offset.prs', line: 1, column: 1 },
          chain: [],
        },
      ],
    });

    expect(trace.entry).toBe('<unknown>');
    expect(withEvents.entries.some((entry) => entry.path === 'standards.template')).toBe(true);
    expect(
      withEvents.entries
        .find((entry) => entry.path === 'standards.value')
        ?.history.some((step) => step.reference === './base')
    ).toBe(true);
  });

  it('omits resolver metadata from public paths', () => {
    const program = createProgram();
    const block = program.blocks[0];
    if (block?.content.type !== 'ObjectContent') {
      throw new Error('Expected object content');
    }
    const code = block.content.properties['code'];
    if (typeof code !== 'object' || code === null || Array.isArray(code)) {
      throw new Error('Expected code object');
    }
    const codeRecord = code as Record<string, Value>;
    codeRecord['__layerTrace'] = [];
    codeRecord['composedFrom'] = [];

    const trace = collectProvenance(program, { entry: 'entry.prs' });

    expect(trace.entries.some((entry) => entry.path.includes('__layerTrace'))).toBe(false);
    expect(trace.entries.some((entry) => entry.path.includes('composedFrom'))).toBe(false);
  });

  it('collects canonical entry kinds and nested operation events', () => {
    const inlineDeclaration = {
      type: 'InlineUseDeclaration' as const,
      path: {
        type: 'PathReference' as const,
        raw: './phase',
        segments: ['phase'],
        isRelative: true,
        loc: BASE_LOC,
      },
      loc: BASE_LOC,
    };
    const entries = [
      {
        type: 'FieldEntry' as const,
        name: 'value',
        value: createValueNode('first', BASE_LOC),
        loc: BASE_LOC,
      },
      {
        type: 'FieldEntry' as const,
        name: 'value',
        value: createValueNode('second', CHILD_LOC),
        loc: CHILD_LOC,
      },
      {
        type: 'FieldEntry' as const,
        name: 'nested',
        value: createValueNode({ child: ['item'] }, CHILD_LOC),
        loc: CHILD_LOC,
      },
      {
        type: 'FieldEntry' as const,
        name: '__private',
        value: createValueNode('hidden', CHILD_LOC),
        loc: CHILD_LOC,
      },
      {
        type: 'ListEntry' as const,
        value: createValueNode('list item', CHILD_LOC),
        loc: CHILD_LOC,
      },
      { type: 'TextEntry' as const, text: 'text fragment', loc: CHILD_LOC },
      { type: 'InlineUseEntry' as const, declaration: inlineDeclaration, loc: BASE_LOC },
      {
        type: 'PresentationEntry' as const,
        title: 'Context',
        source: 'explicit' as const,
        titleLoc: CHILD_LOC,
        loc: CHILD_LOC,
      },
    ] satisfies BlockEntry[];
    const body = createBlockBody(entries, BASE_LOC);
    const base = normalizeProgram(createProgram());
    const canonical = {
      ...base,
      blocks: [{ ...base.blocks[0]!, name: 'context', body }],
    } satisfies CanonicalProgram;
    const events = collectProvenanceEvents(
      body,
      'context',
      'extend',
      CHILD_LOC,
      'merged',
      'append'
    );
    const replacementEvents = collectProvenanceValueEvents(
      createValueNode({ nested: ['replacement'] }, CHILD_LOC),
      'context.value',
      CHILD_LOC
    );
    const trace = collectProvenance(canonical, {
      entry: 'entry.prs',
      events: [
        ...events,
        ...replacementEvents,
        {
          path: 'unmatched',
          operation: 'override',
          action: 'replaced',
          source: CHILD_LOC,
        },
      ],
    });

    expect(
      collectProvenanceEvents(undefined, 'context', 'extend', CHILD_LOC, 'merged')
    ).toHaveLength(1);
    expect(trace.entries.map((entry) => entry.path)).toEqual([
      'context',
      'context.$header',
      'context.@use[0]',
      'context.nested',
      'context.nested.child',
      'context.nested.child[0]',
      'context.text[0]',
      'context.value',
      'context[0]',
    ]);
    expect(trace.entries.find((entry) => entry.path === 'context.value')?.history).toEqual(
      expect.arrayContaining([expect.objectContaining({ operation: 'override' })])
    );
  });

  it('exposes import and inheritance operations in history and chain', () => {
    const trace = prefixProvenance(collectProvenance(createProgram(), { entry: 'base.prs' }), {
      operation: 'use',
      source: CHILD_LOC,
      target: 'base.prs',
      reference: './base.prs',
    });
    const entry = trace.entries.find((candidate) => candidate.path === 'standards.code.style');

    expect(entry?.history[0]).toMatchObject({
      operation: 'use',
      action: 'selected',
      target: 'base.prs',
    });
    expect(entry?.history[0]?.chain[0]).toMatchObject({
      operation: 'use',
      reference: './base.prs',
    });
  });

  it('deduplicates inherited steps and preserves nested provenance chains', () => {
    const base = collectProvenance(createProgram(), { entry: 'base.prs' });
    const inherited = base.entries.map((entry) =>
      entry.path === 'standards' ? { ...entry, source: CHILD_LOC } : entry
    );
    const child = collectProvenance(createProgram(), {
      entry: 'child.prs',
      inherited: [...inherited, ...inherited],
    });
    const standards = child.entries.find((entry) => entry.path === 'standards');

    expect(standards?.history).toHaveLength(2);
    expect(standards?.history.at(-1)?.action).toBe('selected');

    const linked = prefixProvenance(
      {
        version: 1,
        entry: 'base.prs',
        entries: [
          {
            path: 'standards',
            kind: 'block',
            source: BASE_LOC,
            history: [
              {
                operation: 'use',
                action: 'selected',
                source: BASE_LOC,
                chain: [
                  {
                    operation: 'inherit',
                    source: BASE_LOC,
                    target: 'parent.prs',
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        operation: 'use',
        source: CHILD_LOC,
        target: 'base.prs',
        reference: './base.prs',
        alias: 'base',
      }
    );

    expect(linked.entries[0]?.history[1]?.chain).toHaveLength(2);
    expect(linked.entries[0]?.history[0]).toMatchObject({ alias: 'base' });
    expect(
      prefixProvenance(collectProvenance(createProgram()), {
        operation: 'use',
        source: CHILD_LOC,
      }).entries
    ).not.toHaveLength(0);
    expect(emptyProvenance()).toEqual({ version: 1, entry: '<unknown>', entries: [] });
  });
});
