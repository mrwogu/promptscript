import {
  collectProvenance,
  collectProvenanceEvents,
  createBlockBody,
  createValueNode,
  normalizeProgram,
  prefixProvenance,
  toLegacyProgram,
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

  it('returns stable path ordering and versioned JSON shape', () => {
    const trace = collectProvenance(createProgram(), { entry: 'entry.prs' });

    expect(trace.version).toBe(1);
    expect(trace.entry).toBe('entry.prs');
    expect(JSON.stringify(trace)).toBe(
      JSON.stringify(collectProvenance(createProgram(), { entry: 'entry.prs' }))
    );
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
});
