import { describe, expect, it } from 'vitest';
import type {
  InlineUseDeclaration,
  MixedContent,
  ObjectContent,
  PresentationEntry,
} from '../types/ast.js';
import {
  IMPORT_MERGE_POLICY,
  INHERITANCE_MERGE_POLICY,
  mergeBlockContent,
  mergeBlockCollections,
} from '../block-merge.js';
import {
  blockBodyToContent,
  createBlockBody,
  createCanonicalBlock,
  createValueNode,
  toLegacyBlock,
  valueNodeToValue,
} from '../canonical-ast.js';

const LOC = { file: 'merge.prs', line: 1, column: 1, offset: 0 };

function objectContent(properties: ObjectContent['properties']): ObjectContent {
  return { type: 'ObjectContent', properties, loc: LOC };
}

function inlineUse(raw: string): InlineUseDeclaration {
  return {
    type: 'InlineUseDeclaration',
    path: {
      type: 'PathReference',
      raw,
      namespace: undefined,
      segments: [raw],
      version: undefined,
      isRelative: true,
      loc: LOC,
    },
    loc: LOC,
  };
}

function presentation(
  title: string,
  source: PresentationEntry['source'] = 'explicit',
  sectionId?: string
): PresentationEntry {
  return {
    type: 'PresentationEntry',
    ...(sectionId ? { sectionId } : {}),
    title,
    source,
    loc: LOC,
    titleLoc: LOC,
  };
}

describe('block merge policies', () => {
  it('uses incoming values for inheritance', () => {
    const parent = objectContent({
      scalar: 'parent',
      nested: { left: true, shared: 'parent' },
      list: ['parent'],
    });
    const child = objectContent({
      scalar: 'child',
      nested: { right: true, shared: 'child' },
      list: ['child'],
    });

    const result = mergeBlockContent(parent, child, INHERITANCE_MERGE_POLICY);

    expect(result).toMatchObject({
      type: 'ObjectContent',
      properties: {
        scalar: 'child',
        nested: { left: true, right: true, shared: 'child' },
        list: ['parent', 'child'],
      },
    });
  });

  it('uses imported values for import composition', () => {
    const source = objectContent({
      scalar: 'source',
      nested: { left: true, shared: 'source' },
    });
    const target = objectContent({
      scalar: 'target',
      nested: { right: true, shared: 'target' },
    });

    const result = mergeBlockContent(source, target, IMPORT_MERGE_POLICY);

    expect(result).toMatchObject({
      type: 'ObjectContent',
      properties: {
        scalar: 'source',
        nested: { left: true, right: true, shared: 'source' },
      },
    });
  });

  it('merges presentation entries by rank and content precedence', () => {
    const createBlock = (entries: PresentationEntry[]) =>
      toLegacyBlock(createCanonicalBlock('standards', createBlockBody(entries, LOC), LOC), {
        preserveCanonicalBody: true,
      });
    const base = createBlock([
      presentation('Base code style'),
      presentation('Base commits', 'explicit', 'git-commits'),
    ]);
    const incoming = createBlock([
      presentation('Incoming legacy', 'legacy'),
      presentation('Incoming commits', 'explicit', 'git-commits'),
      presentation('Incoming config', 'explicit', 'configuration-files'),
    ]);

    const inherited = mergeBlockCollections([base], [incoming], {
      content: INHERITANCE_MERGE_POLICY,
      outputOrder: 'base',
    });
    const imported = mergeBlockCollections([base], [incoming], {
      content: IMPORT_MERGE_POLICY,
      outputOrder: 'base',
    });

    expect(inherited[0]!.canonicalBody?.entries).toMatchObject([
      { type: 'PresentationEntry', title: 'Base code style', source: 'explicit' },
      {
        type: 'PresentationEntry',
        sectionId: 'git-commits',
        title: 'Incoming commits',
      },
      {
        type: 'PresentationEntry',
        sectionId: 'configuration-files',
        title: 'Incoming config',
      },
    ]);
    expect(imported[0]!.canonicalBody?.entries).toMatchObject([
      { type: 'PresentationEntry', title: 'Base code style' },
      {
        type: 'PresentationEntry',
        sectionId: 'git-commits',
        title: 'Base commits',
      },
      {
        type: 'PresentationEntry',
        sectionId: 'configuration-files',
        title: 'Incoming config',
      },
    ]);
    expect(inherited[0]!.content).toEqual({
      type: 'ObjectContent',
      properties: {},
      loc: LOC,
    });
  });

  it('treats keyless and explicit primary section entries as equivalent', () => {
    const createBlock = (entries: PresentationEntry[]) =>
      toLegacyBlock(createCanonicalBlock('standards', createBlockBody(entries, LOC), LOC), {
        preserveCanonicalBody: true,
      });
    const base = createBlock([presentation('Base rules')]);
    const incoming = createBlock([presentation('Incoming rules', 'explicit', 'code-standards')]);

    const inherited = mergeBlockCollections([base], [incoming], {
      content: INHERITANCE_MERGE_POLICY,
      outputOrder: 'base',
    });
    const imported = mergeBlockCollections([base], [incoming], {
      content: IMPORT_MERGE_POLICY,
      outputOrder: 'base',
    });

    expect(inherited[0]!.canonicalBody?.entries).toMatchObject([
      {
        type: 'PresentationEntry',
        sectionId: 'code-standards',
        title: 'Incoming rules',
      },
    ]);
    expect(imported[0]!.canonicalBody?.entries).toMatchObject([
      { type: 'PresentationEntry', title: 'Base rules' },
    ]);
  });

  it('preserves text order for both policies', () => {
    const base = { type: 'TextContent' as const, value: 'base', loc: LOC };
    const incoming = { type: 'TextContent' as const, value: 'incoming', loc: LOC };

    expect(mergeBlockContent(base, incoming, INHERITANCE_MERGE_POLICY)).toMatchObject({
      value: 'base\n\nincoming',
    });
    expect(mergeBlockContent(base, incoming, IMPORT_MERGE_POLICY)).toMatchObject({
      value: 'base\n\nincoming',
    });
  });

  it('treats typed AST values as atomic during property merges', () => {
    const base = objectContent({
      config: { type: 'TextContent', value: 'base', loc: LOC },
      limit: {
        type: 'TypeExpression',
        kind: 'range',
        constraints: { min: 1, max: 10 },
        loc: LOC,
      },
    });
    const incoming = objectContent({
      config: { theme: 'dark' },
      limit: { constraints: { min: 5 } },
    });

    const result = mergeBlockContent(base, incoming, IMPORT_MERGE_POLICY);

    expect(result).toMatchObject({
      properties: {
        config: { type: 'TextContent', value: 'base' },
        limit: {
          type: 'TypeExpression',
          kind: 'range',
          constraints: { min: 1, max: 10 },
        },
      },
    });
  });

  it('keeps all typed AST property shapes atomic while merging user records', () => {
    const base = objectContent({
      objectNode: {
        type: 'ObjectContent',
        properties: { base: true },
        loc: LOC,
      },
      mixedNode: {
        type: 'MixedContent',
        properties: { base: true },
        loc: LOC,
      },
      arrayNode: { type: 'ArrayContent', elements: ['base'], loc: LOC },
      templateNode: { type: 'TemplateExpression', name: 'base', loc: LOC },
      message: { type: 'TextContent', value: 'base', loc: LOC },
      userRecord: { type: 'Unknown', nested: { base: true }, loc: LOC },
    });
    const incoming = objectContent({
      objectNode: { incoming: true },
      mixedNode: { incoming: true },
      arrayNode: { incoming: true },
      templateNode: { incoming: true },
      message: { type: 'TextContent', value: 'incoming', loc: LOC },
      userRecord: { type: 'Unknown', nested: { incoming: true }, loc: LOC },
    });

    const imported = mergeBlockContent(base, incoming, IMPORT_MERGE_POLICY);
    const inherited = mergeBlockContent(base, incoming, INHERITANCE_MERGE_POLICY);

    expect(imported).toMatchObject({
      properties: {
        objectNode: { type: 'ObjectContent', properties: { base: true } },
        mixedNode: { type: 'MixedContent', properties: { base: true } },
        arrayNode: { type: 'ArrayContent', elements: ['base'] },
        templateNode: { type: 'TemplateExpression', name: 'base' },
        message: { type: 'TextContent', value: 'base' },
        userRecord: {
          type: 'Unknown',
          nested: { base: true, incoming: true },
        },
      },
    });
    expect(inherited).toMatchObject({
      properties: {
        objectNode: { incoming: true },
        mixedNode: { incoming: true },
        arrayNode: { incoming: true },
        templateNode: { incoming: true },
        message: { type: 'TextContent', value: 'incoming' },
        userRecord: {
          type: 'Unknown',
          nested: { base: true, incoming: true },
        },
      },
    });
  });

  it('deep-merges user objects that only resemble AST discriminants', () => {
    const base = objectContent({
      config: {
        type: 'TextContent',
        value: 'user data',
        loc: LOC,
        nested: { base: true },
      },
    });
    const incoming = objectContent({
      config: {
        type: 'TextContent',
        value: 'user data',
        loc: LOC,
        nested: { incoming: true },
      },
    });

    const result = mergeBlockContent(base, incoming, INHERITANCE_MERGE_POLICY);

    expect(result).toMatchObject({
      properties: {
        config: {
          type: 'TextContent',
          value: 'user data',
          nested: { base: true, incoming: true },
        },
      },
    });
  });

  it('merges one cross-layer match and preserves same-layer duplicates', () => {
    const parent = [
      { type: 'Block' as const, name: 'context', content: objectContent({ parent: 1 }), loc: LOC },
      {
        type: 'Block' as const,
        name: 'context',
        content: objectContent({ parentDuplicate: 1 }),
        loc: LOC,
      },
    ];
    const child = [
      { type: 'Block' as const, name: 'context', content: objectContent({ child: 1 }), loc: LOC },
      {
        type: 'Block' as const,
        name: 'context',
        content: objectContent({ childDuplicate: 1 }),
        loc: LOC,
      },
    ];

    const result = mergeBlockCollections(parent, child, {
      content: INHERITANCE_MERGE_POLICY,
      outputOrder: 'base',
    });

    expect(result).toHaveLength(3);
    expect(result[0]!.content).toMatchObject({
      properties: { parent: 1, child: 1 },
    });
    expect(result[0]!.canonicalBody?.entries.map((entry) => entry.type)).toEqual([
      'FieldEntry',
      'FieldEntry',
    ]);
    expect(result[1]!.content).toMatchObject({
      properties: { parentDuplicate: 1 },
    });
    expect(result[2]!.content).toMatchObject({
      properties: { childDuplicate: 1 },
    });
  });

  it('merges interleaved dash-list projections', () => {
    const base = {
      ...objectContent({ parent: true }),
      listItems: ['parent'],
    };
    const incoming = {
      ...objectContent({ child: true }),
      listItems: ['child'],
    };

    const result = mergeBlockContent(base, incoming, INHERITANCE_MERGE_POLICY);

    expect(result).toMatchObject({
      listItems: ['parent', 'child'],
    });
  });

  it('keeps cross-layer dash lists separate from explicit items fields', () => {
    const incomingLoc = { ...LOC, file: 'incoming.prs', offset: 10 };
    const base = toLegacyBlock(
      createCanonicalBlock(
        'context',
        createBlockBody(
          [{ type: 'ListEntry', value: createValueNode('dash-item', LOC), loc: LOC }],
          LOC
        ),
        LOC
      ),
      { preserveCanonicalBody: true }
    );
    const incoming = toLegacyBlock(
      createCanonicalBlock(
        'context',
        createBlockBody(
          [
            {
              type: 'FieldEntry',
              name: 'items',
              value: createValueNode(['field-item'], incomingLoc),
              loc: incomingLoc,
            },
          ],
          incomingLoc
        ),
        incomingLoc
      ),
      { preserveCanonicalBody: true }
    );

    const result = mergeBlockCollections([base], [incoming], {
      content: INHERITANCE_MERGE_POLICY,
      outputOrder: 'base',
    });

    expect(result[0]!.content).toMatchObject({
      properties: { items: ['field-item'] },
      listItems: ['dash-item'],
    });
    expect(result[0]!.canonicalBody!.entries.map((entry) => entry.type)).toEqual([
      'ListEntry',
      'FieldEntry',
    ]);
  });

  it('preserves auxiliary collections across mixed and object content', () => {
    const base: MixedContent = {
      type: 'MixedContent',
      text: { type: 'TextContent', value: 'base', loc: LOC },
      properties: {},
      listItems: ['base'],
      inlineUses: [inlineUse('./base')],
      loc: LOC,
    };
    const incoming: ObjectContent = {
      ...objectContent({ child: true }),
      listItems: ['incoming'],
      inlineUses: [inlineUse('./incoming')],
    };

    const result = mergeBlockContent(base, incoming, INHERITANCE_MERGE_POLICY);

    expect(result).toMatchObject({
      listItems: ['base', 'incoming'],
    });
    expect(result.type).toBe('MixedContent');
    if (result.type !== 'MixedContent') {
      throw new Error('Expected mixed content');
    }
    expect(result.inlineUses?.map((use) => use.path.raw)).toEqual(['./base', './incoming']);
  });

  it('preserves auxiliary collections supplied by only one merge layer', () => {
    const result = mergeBlockContent(
      {
        ...objectContent({ base: true }),
        listItems: ['base item'],
      },
      {
        ...objectContent({ incoming: true }),
        inlineUses: [inlineUse('./incoming')],
      },
      INHERITANCE_MERGE_POLICY
    );

    expect(result).toMatchObject({
      type: 'ObjectContent',
      properties: { base: true, incoming: true },
      listItems: ['base item'],
      inlineUses: [{ path: { raw: './incoming' } }],
    });
  });

  it('preserves structured canonical bodies across content mismatches', () => {
    const mixedThenText = mergeBlockCollections(
      [
        {
          type: 'Block',
          name: 'context',
          content: {
            type: 'MixedContent',
            text: { type: 'TextContent', value: 'Base', loc: LOC },
            properties: { runtime: 'node' },
            listItems: ['base item'],
            loc: LOC,
          },
          loc: LOC,
        },
      ],
      [
        {
          type: 'Block',
          name: 'context',
          content: { type: 'TextContent', value: 'Incoming', loc: LOC },
          loc: LOC,
        },
      ],
      { content: INHERITANCE_MERGE_POLICY, outputOrder: 'base' }
    );
    const textThenObject = mergeBlockCollections(
      [
        {
          type: 'Block',
          name: 'identity',
          content: { type: 'TextContent', value: 'Base', loc: LOC },
          loc: LOC,
        },
      ],
      [
        {
          type: 'Block',
          name: 'identity',
          content: {
            ...objectContent({ runtime: 'node' }),
            listItems: ['incoming item'],
          },
          loc: LOC,
        },
      ],
      { content: INHERITANCE_MERGE_POLICY, outputOrder: 'base' }
    );

    expect(mixedThenText[0]!.content).toMatchObject({
      type: 'MixedContent',
      text: { value: 'Base\n\nIncoming' },
      properties: { runtime: 'node', items: ['base item'] },
    });
    expect(mixedThenText[0]!.canonicalBody?.entries.map((entry) => entry.type)).toEqual([
      'TextEntry',
      'FieldEntry',
      'ListEntry',
      'TextEntry',
    ]);
    expect(textThenObject[0]!.content).toMatchObject({
      type: 'ObjectContent',
      properties: { runtime: 'node', items: ['incoming item'] },
    });
    expect(textThenObject[0]!.canonicalBody?.entries.map((entry) => entry.type)).toEqual([
      'FieldEntry',
      'ListEntry',
    ]);
  });

  it('deduplicates canonical list and inline-use entries with base precedence', () => {
    const baseLoc = { ...LOC, file: 'base.prs', offset: 2 };
    const incomingLoc = { ...LOC, file: 'incoming.prs', offset: 20 };
    const declaration = inlineUse('./shared');
    const base = toLegacyBlock(
      createCanonicalBlock(
        'context',
        createBlockBody(
          [
            { type: 'ListEntry', value: createValueNode('same', baseLoc), loc: baseLoc },
            { type: 'InlineUseEntry', declaration, loc: baseLoc },
          ],
          baseLoc
        ),
        baseLoc
      ),
      { preserveCanonicalBody: true }
    );
    const incoming = toLegacyBlock(
      createCanonicalBlock(
        'context',
        createBlockBody(
          [
            {
              type: 'ListEntry',
              value: createValueNode('same', incomingLoc),
              loc: incomingLoc,
            },
            { type: 'InlineUseEntry', declaration, loc: incomingLoc },
          ],
          incomingLoc
        ),
        incomingLoc
      ),
      { preserveCanonicalBody: true }
    );

    const result = mergeBlockCollections([base], [incoming], {
      content: IMPORT_MERGE_POLICY,
      outputOrder: 'incoming',
    });
    const entries = result[0]!.canonicalBody!.entries;

    expect(entries.map((entry) => entry.type)).toEqual(['ListEntry', 'InlineUseEntry']);
    expect(entries.map((entry) => entry.loc)).toEqual([baseLoc, baseLoc]);
  });

  it('merges arrays and cross-shape content without losing its selected shape', () => {
    const array = mergeBlockContent(
      { type: 'ArrayContent', elements: ['base'], loc: LOC },
      { type: 'ArrayContent', elements: ['base', 'incoming'], loc: LOC },
      INHERITANCE_MERGE_POLICY
    );
    const mixedThenText = mergeBlockContent(
      {
        type: 'MixedContent',
        text: { type: 'TextContent', value: 'base detail', loc: LOC },
        properties: {},
        loc: LOC,
      },
      { type: 'TextContent', value: 'base', loc: LOC },
      INHERITANCE_MERGE_POLICY
    );
    const textThenMixed = mergeBlockContent(
      { type: 'TextContent', value: 'base', loc: LOC },
      { type: 'MixedContent', properties: { incoming: true }, loc: LOC },
      INHERITANCE_MERGE_POLICY
    );
    const objectThenMixed = mergeBlockContent(
      objectContent({ base: true }),
      {
        type: 'MixedContent',
        text: { type: 'TextContent', value: 'incoming', loc: LOC },
        properties: { incoming: true },
        loc: LOC,
      },
      INHERITANCE_MERGE_POLICY
    );
    const selectedBase = mergeBlockContent(
      { type: 'ArrayContent', elements: ['base'], loc: LOC },
      { type: 'TextContent', value: 'incoming', loc: LOC },
      { valuePrecedence: 'base', typeMismatchPrecedence: 'base' }
    );

    expect(array).toMatchObject({
      type: 'ArrayContent',
      elements: ['base', 'incoming'],
    });
    expect(mixedThenText).toMatchObject({
      type: 'MixedContent',
      text: { value: 'base detail' },
    });
    expect(textThenMixed).toMatchObject({
      type: 'MixedContent',
      text: { value: 'base' },
      properties: { incoming: true },
    });
    expect(objectThenMixed).toMatchObject({
      type: 'MixedContent',
      text: { value: 'incoming' },
      properties: { base: true, incoming: true },
    });
    expect(selectedBase).toMatchObject({
      type: 'ArrayContent',
      elements: ['base'],
    });
  });

  it('repairs mixed projections and preserves canonical array bodies', () => {
    const arrays = mergeBlockCollections(
      [
        {
          type: 'Block',
          name: 'restrictions',
          content: { type: 'ArrayContent', elements: ['base'], loc: LOC },
          loc: LOC,
        },
      ],
      [
        {
          type: 'Block',
          name: 'restrictions',
          content: { type: 'ArrayContent', elements: ['incoming'], loc: LOC },
          loc: LOC,
        },
      ],
      { content: INHERITANCE_MERGE_POLICY, outputOrder: 'base' }
    );
    const textProjection = mergeBlockCollections(
      [
        {
          type: 'Block',
          name: 'identity',
          content: { type: 'TextContent', value: 'base', loc: LOC },
          loc: LOC,
        },
      ],
      [
        {
          type: 'Block',
          name: 'identity',
          content: {
            type: 'MixedContent',
            text: { type: 'TextContent', value: 'incoming', loc: LOC },
            properties: {},
            loc: LOC,
          },
          loc: LOC,
        },
      ],
      { content: INHERITANCE_MERGE_POLICY, outputOrder: 'base' }
    );
    const objectProjection = mergeBlockCollections(
      [
        {
          type: 'Block',
          name: 'context',
          content: objectContent({ base: true }),
          loc: LOC,
        },
      ],
      [
        {
          type: 'Block',
          name: 'context',
          content: {
            type: 'MixedContent',
            properties: { incoming: true },
            loc: LOC,
          },
          loc: LOC,
        },
      ],
      { content: INHERITANCE_MERGE_POLICY, outputOrder: 'base' }
    );

    expect(arrays[0]!.content).toMatchObject({
      type: 'ArrayContent',
      elements: ['base', 'incoming'],
    });
    expect(arrays[0]!.canonicalBody?.entries.map((entry) => entry.type)).toEqual([
      'ListEntry',
      'ListEntry',
    ]);
    expect(textProjection[0]!.content).toMatchObject({
      type: 'MixedContent',
      text: { value: 'base\n\nincoming' },
    });
    expect(objectProjection[0]!.content).toMatchObject({
      type: 'MixedContent',
      properties: { base: true, incoming: true },
    });
  });

  it('preserves ordered canonical metadata while merging fields', () => {
    const baseLoc = { ...LOC, offset: 1 };
    const textLoc = { ...LOC, offset: 2 };
    const incomingLoc = { ...LOC, file: 'incoming.prs', offset: 10 };
    const incomingTextLoc = { ...incomingLoc, offset: 11 };
    const base = toLegacyBlock(
      createCanonicalBlock(
        'context',
        createBlockBody(
          [
            {
              type: 'FieldEntry',
              name: 'shared',
              value: createValueNode('base', baseLoc),
              loc: baseLoc,
            },
            { type: 'TextEntry', text: 'Base text', loc: textLoc },
          ],
          LOC
        ),
        LOC
      ),
      { preserveCanonicalBody: true }
    );
    const incoming = toLegacyBlock(
      createCanonicalBlock(
        'context',
        createBlockBody(
          [
            {
              type: 'FieldEntry',
              name: 'shared',
              value: createValueNode('incoming', incomingLoc),
              loc: incomingLoc,
            },
            {
              type: 'TextEntry',
              text: 'Incoming text',
              loc: incomingTextLoc,
            },
          ],
          incomingLoc
        ),
        incomingLoc
      ),
      { preserveCanonicalBody: true }
    );

    const result = mergeBlockCollections([base], [incoming], {
      content: INHERITANCE_MERGE_POLICY,
      outputOrder: 'base',
    });
    const entries = result[0]!.canonicalBody!.entries;

    expect(entries.map((entry) => entry.type)).toEqual(['FieldEntry', 'TextEntry', 'TextEntry']);
    expect(entries[0]!.loc).toEqual(incomingLoc);
    expect(entries[0]!.type).toBe('FieldEntry');
    if (entries[0]!.type !== 'FieldEntry') {
      throw new Error('Expected field entry');
    }
    expect(entries[0]!.value.loc).toEqual(incomingLoc);
    expect(blockBodyToContent(result[0]!.canonicalBody!)).toMatchObject({
      text: { value: 'Base text\n\nIncoming text' },
    });
  });

  it('keeps overridden fields at the position the base declared them', () => {
    const baseLoc = { ...LOC, file: 'base.prs', offset: 1 };
    const incomingLoc = { ...LOC, file: 'incoming.prs', offset: 20 };
    const canonicalBlock = (
      loc: typeof baseLoc,
      fields: ReadonlyArray<readonly [string, string]>
    ) =>
      toLegacyBlock(
        createCanonicalBlock(
          'standards',
          createBlockBody(
            fields.map(([name, value]) => ({
              type: 'FieldEntry' as const,
              name,
              value: createValueNode(value, loc),
              loc,
            })),
            loc
          ),
          loc
        ),
        { preserveCanonicalBody: true }
      );
    const base = canonicalBlock(baseLoc, [
      ['testing', 'jest'],
      ['linting', 'eslint'],
      ['coverage', 'text'],
    ]);
    const incoming = canonicalBlock(incomingLoc, [
      ['linting', 'biome'],
      ['docs', 'typedoc'],
    ]);

    const result = mergeBlockCollections([base], [incoming], {
      content: INHERITANCE_MERGE_POLICY,
      outputOrder: 'base',
    });
    const entries = result[0]!.canonicalBody!.entries;

    expect(
      entries
        .filter((entry) => entry.type === 'FieldEntry')
        .map((entry) => [entry.name, valueNodeToValue(entry.value)])
    ).toEqual([
      ['testing', 'jest'],
      ['linting', 'biome'],
      ['coverage', 'text'],
      ['docs', 'typedoc'],
    ]);
    expect(
      Object.keys((result[0]!.content as { properties: Record<string, unknown> }).properties)
    ).toEqual(['testing', 'linting', 'coverage', 'docs']);
  });

  it('synthesizes missing canonical bodies from their source layers', () => {
    const base = {
      type: 'Block' as const,
      name: 'context',
      content: {
        type: 'TextContent' as const,
        value: 'Base text',
        loc: LOC,
      },
      loc: LOC,
    };
    const incomingLoc = { ...LOC, file: 'incoming.prs' };
    const incoming = toLegacyBlock(
      createCanonicalBlock(
        'context',
        createBlockBody(
          [{ type: 'TextEntry', text: 'Incoming text', loc: incomingLoc }],
          incomingLoc
        ),
        incomingLoc
      ),
      { preserveCanonicalBody: true }
    );

    const result = mergeBlockCollections([base], [incoming], {
      content: INHERITANCE_MERGE_POLICY,
      outputOrder: 'base',
    });
    const entries = result[0]!.canonicalBody!.entries;

    expect(entries.map((entry) => entry.type)).toEqual(['TextEntry', 'TextEntry']);
    expect(entries.map((entry) => (entry.type === 'TextEntry' ? entry.text : ''))).toEqual([
      'Base text',
      'Incoming text',
    ]);
    expect(entries[1]!.loc).toEqual(incomingLoc);
  });

  it('repairs canonical bodies missing every projected entry kind', () => {
    const declaration = inlineUse('./shared');
    const base = {
      type: 'Block' as const,
      name: 'context',
      content: {
        type: 'MixedContent' as const,
        text: { type: 'TextContent' as const, value: 'Instructions', loc: LOC },
        properties: { runtime: 'node' },
        listItems: ['list item'],
        inlineUses: [declaration],
        loc: LOC,
      },
      canonicalBody: createBlockBody([], LOC),
      loc: LOC,
    };
    const incoming = {
      type: 'Block' as const,
      name: 'context',
      content: objectContent({}),
      canonicalBody: createBlockBody([], LOC),
      loc: LOC,
    };

    const result = mergeBlockCollections([base], [incoming], {
      content: INHERITANCE_MERGE_POLICY,
      outputOrder: 'base',
    });

    expect(result[0]!.canonicalBody!.entries.map((entry) => entry.type)).toEqual([
      'FieldEntry',
      'ListEntry',
      'InlineUseEntry',
      'TextEntry',
    ]);
    expect(blockBodyToContent(result[0]!.canonicalBody!)).toMatchObject({
      text: { value: 'Instructions' },
      properties: { runtime: 'node', items: ['list item'] },
      inlineUses: [declaration],
    });
  });

  it('preserves nested value locations from both merge layers', () => {
    const baseLoc = { ...LOC, offset: 3 };
    const incomingLoc = { ...LOC, file: 'incoming.prs', offset: 12 };
    const base = toLegacyBlock(
      createCanonicalBlock(
        'context',
        createBlockBody(
          [
            {
              type: 'FieldEntry',
              name: 'config',
              value: createValueNode({ baseOnly: true, shared: 'base' }, baseLoc),
              loc: baseLoc,
            },
          ],
          LOC
        ),
        LOC
      ),
      { preserveCanonicalBody: true }
    );
    const incoming = toLegacyBlock(
      createCanonicalBlock(
        'context',
        createBlockBody(
          [
            {
              type: 'FieldEntry',
              name: 'config',
              value: createValueNode({ incomingOnly: true, shared: 'incoming' }, incomingLoc),
              loc: incomingLoc,
            },
          ],
          incomingLoc
        ),
        incomingLoc
      ),
      { preserveCanonicalBody: true }
    );

    const result = mergeBlockCollections([base], [incoming], {
      content: INHERITANCE_MERGE_POLICY,
      outputOrder: 'base',
    });
    const entry = result[0]!.canonicalBody!.entries[0]!;
    if (entry.type !== 'FieldEntry' || entry.value.type !== 'ObjectValueNode') {
      throw new Error('Expected object field');
    }
    const fields = new Map(entry.value.fields.map((field) => [field.name, field]));

    expect(fields.get('baseOnly')!.loc).toEqual(baseLoc);
    expect(fields.get('shared')!.loc).toEqual(incomingLoc);
    expect(fields.get('incomingOnly')!.loc).toEqual(incomingLoc);
  });

  it('keeps only text fragments represented by contained text merges', () => {
    const base = toLegacyBlock(
      createCanonicalBlock(
        'context',
        createBlockBody([{ type: 'TextEntry', text: 'Base text', loc: LOC }], LOC),
        LOC
      ),
      { preserveCanonicalBody: true }
    );
    const incomingLoc = { ...LOC, file: 'incoming.prs' };
    const incoming = toLegacyBlock(
      createCanonicalBlock(
        'context',
        createBlockBody(
          [
            {
              type: 'TextEntry',
              text: 'Base text with more detail',
              loc: incomingLoc,
            },
          ],
          incomingLoc
        ),
        incomingLoc
      ),
      { preserveCanonicalBody: true }
    );

    const result = mergeBlockCollections([base], [incoming], {
      content: INHERITANCE_MERGE_POLICY,
      outputOrder: 'base',
    });
    const entries = result[0]!.canonicalBody!.entries;

    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({
      type: 'TextEntry',
      text: 'Base text with more detail',
      loc: incomingLoc,
    });
  });
});
