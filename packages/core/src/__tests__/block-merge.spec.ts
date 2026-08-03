import { describe, expect, it } from 'vitest';
import type { InlineUseDeclaration, MixedContent, ObjectContent } from '../types/ast.js';
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

    expect(entries.map((entry) => entry.type)).toEqual(['TextEntry', 'FieldEntry', 'TextEntry']);
    expect(entries[1]!.loc).toEqual(incomingLoc);
    expect(entries[1]!.type).toBe('FieldEntry');
    if (entries[1]!.type !== 'FieldEntry') {
      throw new Error('Expected field entry');
    }
    expect(entries[1]!.value.loc).toEqual(incomingLoc);
    expect(blockBodyToContent(result[0]!.canonicalBody!)).toMatchObject({
      text: { value: 'Base text\n\nIncoming text' },
    });
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
