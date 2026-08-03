import { describe, expect, it } from 'vitest';
import type { BlockBody, BlockEntry, Program } from '../types/ast.js';
import { SYNTAX_FEATURES } from '../syntax-versions.js';
import {
  composeBlockBodies,
  createBlockBody,
  createCanonicalBlock,
  createCanonicalExtendBlock,
  createCanonicalProgram,
  createValueNode,
  blockBodyToContent,
  blockContentToBody,
  getBlockItems,
  getCanonicalBlocks,
  getBlockProperties,
  getBlockText,
  getInlineUses,
  normalizeProgram,
  prepareBlockContentForMerge,
  reconcileBlockBodyAtPath,
  reconcileBlockBody,
  reconcileValueNode,
  mergeValueNodeLocations,
  toLegacyProgram,
  updateCanonicalProgramOperations,
  updateCanonicalBlockBody,
  valueNodeToValue,
} from '../canonical-ast.js';

const LOC = { file: 'legacy.prs', line: 1, column: 1, offset: 0 };

describe('canonical AST compatibility', () => {
  it('normalizes existing Program object literals without new fields', () => {
    const legacy: Program = {
      type: 'Program',
      uses: [],
      blocks: [
        {
          type: 'Block',
          name: 'context',
          content: {
            type: 'ObjectContent',
            properties: { runtime: 'node' },
            loc: LOC,
          },
          loc: LOC,
        },
      ],
      extends: [],
      loc: LOC,
    };

    const canonical = normalizeProgram(legacy);

    expect(canonical.operations.map((operation) => operation.type)).toEqual(['BlockOperation']);
    expect(getBlockProperties(canonical.blocks[0]!)).toEqual({ runtime: 'node' });
    expect(Object.isFrozen(canonical.blocks[0]!.content)).toBe(true);
  });

  it('creates detached legacy projections', () => {
    const legacy: Program = {
      type: 'Program',
      uses: [],
      blocks: [
        {
          type: 'Block',
          name: 'identity',
          content: { type: 'TextContent', value: 'Original', loc: LOC },
          loc: LOC,
        },
      ],
      extends: [],
      loc: LOC,
    };
    const canonical = normalizeProgram(legacy);
    const projection = toLegacyProgram(canonical);

    if (projection.blocks[0]!.content.type !== 'TextContent') {
      throw new Error('Expected text projection');
    }
    projection.blocks[0]!.content.value = 'Changed';

    expect(getBlockText(canonical.blocks[0]!)).toBe('Original');
    expect(getBlockText(projection.blocks[0]!)).toBe('Changed');
  });

  it('creates immutable updates without modifying the original graph', () => {
    const canonical = normalizeProgram({
      type: 'Program',
      uses: [],
      blocks: [
        {
          type: 'Block',
          name: 'identity',
          content: { type: 'TextContent', value: 'Original', loc: LOC },
          loc: LOC,
        },
      ],
      extends: [],
      loc: LOC,
    });

    const updated = updateCanonicalProgramOperations(canonical, []);

    expect(updated).not.toBe(canonical);
    expect(updated.operations).toEqual([]);
    expect(canonical.operations).toHaveLength(1);
    expect(Object.isFrozen(updated)).toBe(true);
    expect(Object.isFrozen(updated.operations)).toBe(true);
  });

  it('retains inline uses when text is projected to legacy content', () => {
    const block = createCanonicalBlock(
      'skills',
      createBlockBody(
        [
          { type: 'TextEntry', text: 'Instructions', loc: LOC },
          {
            type: 'InlineUseEntry',
            declaration: {
              type: 'InlineUseDeclaration',
              path: {
                type: 'PathReference',
                raw: './shared',
                namespace: undefined,
                segments: ['shared'],
                version: undefined,
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
      LOC
    );

    expect(block.content.type).toBe('MixedContent');
    expect(getInlineUses(block)).toHaveLength(1);
  });

  it('freezes detached copies of caller-supplied canonical programs', () => {
    const mutableCanonical = {
      type: 'CanonicalProgram' as const,
      uses: [],
      blocks: [],
      extends: [],
      operations: [],
      loc: { ...LOC },
    };

    const normalized = normalizeProgram(mutableCanonical);
    mutableCanonical.loc.line = 9;

    expect(normalized).not.toBe(mutableCanonical);
    expect(normalized.loc.line).toBe(1);
    expect(Object.isFrozen(normalized)).toBe(true);
    expect(Object.isFrozen(normalized.operations)).toBe(true);
  });

  it('recovers legacy operation order from source offsets', () => {
    const canonical = normalizeProgram({
      type: 'Program',
      uses: [
        {
          type: 'UseDeclaration',
          path: {
            type: 'PathReference',
            raw: './shared',
            namespace: undefined,
            segments: ['shared'],
            version: undefined,
            isRelative: true,
            loc: { ...LOC, offset: 10 },
          },
          loc: { ...LOC, offset: 10 },
        },
      ],
      blocks: [
        {
          type: 'Block',
          name: 'identity',
          content: { type: 'TextContent', value: 'Identity', loc: { ...LOC, offset: 1 } },
          loc: { ...LOC, offset: 1 },
        },
      ],
      extends: [],
      loc: LOC,
    });

    expect(canonical.operations.map((operation) => operation.type)).toEqual([
      'BlockOperation',
      'UseOperation',
    ]);
  });

  it('reads list items from mixed content', () => {
    const items = getBlockItems({
      type: 'Block',
      name: 'context',
      content: {
        type: 'MixedContent',
        text: { type: 'TextContent', value: 'Context', loc: LOC },
        properties: { items: ['one', 'two'] },
        loc: LOC,
      },
      loc: LOC,
    });

    expect(items).toEqual(['one', 'two']);
  });

  it('preserves legacy array projection across canonical updates', () => {
    const canonical = normalizeProgram({
      type: 'Program',
      uses: [],
      blocks: [
        {
          type: 'Block',
          name: 'restrictions',
          content: { type: 'ArrayContent', elements: ['one'], loc: LOC },
          loc: LOC,
        },
      ],
      extends: [],
      loc: LOC,
    });

    const updated = updateCanonicalProgramOperations(canonical, canonical.operations);
    const legacy = toLegacyProgram(updated);

    expect(legacy.blocks[0]!.content.type).toBe('ArrayContent');
    expect(getCanonicalBlocks(legacy)).toHaveLength(1);
  });

  it('keeps explicit items fields separate from dash-list entries', () => {
    const block = createCanonicalBlock(
      'context',
      createBlockBody(
        [
          {
            type: 'FieldEntry',
            name: 'items',
            value: createValueNode(['field-value'], LOC),
            loc: LOC,
          },
          {
            type: 'ListEntry',
            value: createValueNode('list-value', LOC),
            loc: LOC,
          },
        ],
        LOC
      ),
      LOC
    );

    expect(block.content).toMatchObject({
      properties: { items: ['field-value'] },
      listItems: ['list-value'],
    });
    expect(getBlockItems(block)).toEqual(['list-value']);
  });

  it('does not reinterpret explicit items fields as dash lists during reconciliation', () => {
    const body = createBlockBody(
      [
        {
          type: 'FieldEntry',
          name: 'items',
          value: createValueNode(['field-value'], LOC),
          loc: LOC,
        },
        {
          type: 'ListEntry',
          value: createValueNode('list-value', { ...LOC, offset: 2 }),
          loc: { ...LOC, offset: 2 },
        },
      ],
      LOC
    );

    const reconciled = reconcileBlockBody(body, {
      type: 'ObjectContent',
      properties: { items: ['updated-field'] },
      loc: LOC,
    });

    expect(reconciled.entries.map((entry) => entry.type)).toEqual(['FieldEntry', 'ListEntry']);
    expect(blockBodyToContent(reconciled)).toMatchObject({
      properties: { items: ['updated-field'] },
      listItems: ['list-value'],
    });
  });

  it('uses declaration files as legacy operation source layers', () => {
    const canonical = normalizeProgram({
      type: 'Program',
      uses: [],
      blocks: [
        {
          type: 'Block',
          name: 'identity',
          content: { type: 'TextContent', value: 'Imported', loc: LOC },
          loc: { ...LOC, file: 'imported.prs' },
        },
      ],
      extends: [],
      loc: { ...LOC, file: 'root.prs' },
    });

    expect(canonical.operations[0]!.sourceLayerId).toBe('imported.prs');
  });

  it('preserves resolved block order across noncontiguous source layers', () => {
    const rootLoc = { ...LOC, file: 'root.prs' };
    const importedLoc = { ...LOC, file: 'imported.prs' };
    const canonical = normalizeProgram({
      type: 'Program',
      uses: [],
      blocks: [
        {
          type: 'Block',
          name: 'root-before',
          content: { type: 'ObjectContent', properties: {}, loc: rootLoc },
          loc: { ...rootLoc, offset: 10 },
        },
        {
          type: 'Block',
          name: 'imported',
          content: { type: 'ObjectContent', properties: {}, loc: importedLoc },
          loc: { ...importedLoc, offset: 1 },
        },
        {
          type: 'Block',
          name: 'root-after',
          content: { type: 'ObjectContent', properties: {}, loc: rootLoc },
          loc: { ...rootLoc, offset: 20 },
        },
      ],
      extends: [],
      loc: rootLoc,
    });

    expect(canonical.blocks.map((block) => block.name)).toEqual([
      'root-before',
      'imported',
      'root-after',
    ]);
  });

  it('sorts legacy body entries by source location', () => {
    const body = blockContentToBody({
      type: 'MixedContent',
      text: {
        type: 'TextContent',
        value: 'Text',
        loc: { ...LOC, offset: 10 },
      },
      properties: {
        field: {
          type: 'TextContent',
          value: 'Field',
          loc: { ...LOC, offset: 20 },
        },
      },
      listItems: [
        {
          type: 'TextContent',
          value: 'List',
          loc: { ...LOC, offset: 15 },
        },
      ],
      inlineUses: [
        {
          type: 'InlineUseDeclaration',
          path: {
            type: 'PathReference',
            raw: './first',
            namespace: undefined,
            segments: ['first'],
            version: undefined,
            isRelative: true,
            loc: { ...LOC, offset: 5 },
          },
          loc: { ...LOC, offset: 5 },
        },
      ],
      loc: LOC,
    });

    expect(body.entries.map((entry) => entry.type)).toEqual([
      'InlineUseEntry',
      'TextEntry',
      'ListEntry',
      'FieldEntry',
    ]);
  });

  it('preserves array projection when updating a canonical block body', () => {
    const canonical = normalizeProgram({
      type: 'Program',
      uses: [],
      blocks: [
        {
          type: 'Block',
          name: 'restrictions',
          content: { type: 'ArrayContent', elements: ['one'], loc: LOC },
          loc: LOC,
        },
      ],
      extends: [],
      loc: LOC,
    });

    const updated = updateCanonicalBlockBody(
      canonical.blocks[0]!,
      createBlockBody([{ type: 'ListEntry', value: createValueNode('two', LOC), loc: LOC }], LOC)
    );

    expect(updated.content.type).toBe('ArrayContent');
  });

  it('does not retain stale array projection for mixed-body updates', () => {
    const canonical = normalizeProgram({
      type: 'Program',
      uses: [],
      blocks: [
        {
          type: 'Block',
          name: 'restrictions',
          content: { type: 'ArrayContent', elements: ['one'], loc: LOC },
          loc: LOC,
        },
      ],
      extends: [],
      loc: LOC,
    });

    const updated = updateCanonicalBlockBody(
      canonical.blocks[0]!,
      createBlockBody(
        [
          {
            type: 'FieldEntry',
            name: 'mode',
            value: createValueNode('strict', LOC),
            loc: LOC,
          },
          {
            type: 'ListEntry',
            value: createValueNode('two', LOC),
            loc: LOC,
          },
        ],
        LOC
      )
    );

    expect(updated.content.type).toBe('ObjectContent');
    expect(getBlockProperties(updated)).toMatchObject({
      mode: 'strict',
      items: ['two'],
    });
  });

  it('clones block bodies before freezing canonical output', () => {
    const entries: BlockEntry[] = [
      {
        type: 'FieldEntry',
        name: 'runtime',
        value: createValueNode('node', LOC),
        loc: LOC,
      },
    ];
    const body: BlockBody = {
      type: 'BlockBody',
      shape: 'object',
      entries,
      loc: { ...LOC },
    };

    const block = createCanonicalBlock('context', body, LOC);
    entries.push({
      type: 'FieldEntry',
      name: 'version',
      value: createValueNode(22, LOC),
      loc: LOC,
    });

    expect(Object.isFrozen(body)).toBe(false);
    expect(entries).toHaveLength(2);
    expect(block.body.entries).toHaveLength(1);
  });

  it('derives projections from cloned operations without freezing caller input', () => {
    const declaration = {
      type: 'UseDeclaration' as const,
      path: {
        type: 'PathReference' as const,
        raw: './shared',
        namespace: undefined,
        segments: ['shared'],
        version: undefined,
        isRelative: true,
        loc: LOC,
      },
      loc: LOC,
    };
    const operation = {
      type: 'UseOperation' as const,
      declaration,
      sourceLayerId: LOC.file,
      loc: LOC,
    };

    const canonical = createCanonicalProgram({
      operations: [operation],
      loc: LOC,
    });

    expect(Object.isFrozen(operation)).toBe(false);
    expect(canonical.operations[0]).not.toBe(operation);
    expect(canonical.operations[0]!.type).toBe('UseOperation');
    if (canonical.operations[0]!.type !== 'UseOperation') {
      throw new Error('Expected use operation');
    }
    expect(canonical.uses[0]).toBe(canonical.operations[0]!.declaration);
  });

  it('does not regroup noncontiguous source layers', () => {
    const canonical = normalizeProgram({
      type: 'Program',
      uses: [
        {
          type: 'UseDeclaration',
          path: {
            type: 'PathReference',
            raw: './a',
            namespace: undefined,
            segments: ['a'],
            version: undefined,
            isRelative: true,
            loc: { ...LOC, file: 'a.prs', offset: 100 },
          },
          loc: { ...LOC, file: 'a.prs', offset: 100 },
        },
      ],
      blocks: [
        {
          type: 'Block',
          name: 'from-b',
          content: { type: 'TextContent', value: 'B', loc: LOC },
          loc: { ...LOC, file: 'b.prs', offset: 1 },
        },
        {
          type: 'Block',
          name: 'from-a',
          content: { type: 'TextContent', value: 'A', loc: LOC },
          loc: { ...LOC, file: 'a.prs', offset: 2 },
        },
      ],
      extends: [],
      loc: LOC,
    });

    expect(canonical.operations.map((operation) => operation.sourceLayerId)).toEqual([
      'a.prs',
      'b.prs',
      'a.prs',
    ]);
    expect(canonical.operations.map((operation) => operation.loc.offset)).toEqual([100, 1, 2]);
  });

  it('keeps user objects with AST-like fields as object values', () => {
    const node = createValueNode(
      {
        type: 'TextContent',
        value: 'user data',
        extra: true,
        loc: LOC,
      },
      { ...LOC, line: 2 }
    );

    expect(node.type).toBe('ObjectValueNode');
    if (node.type !== 'ObjectValueNode') {
      throw new Error('Expected object value node');
    }
    expect(node.fields.map((field) => field.name)).toEqual(['type', 'value', 'extra', 'loc']);
  });

  it('falls back when value location metadata is malformed', () => {
    const fallback = { ...LOC, line: 4, column: 8 };

    const node = createValueNode(
      {
        type: 'TemplateExpression',
        name: 'user data',
        loc: { file: 42 },
      },
      fallback
    );

    expect(node.type).toBe('ObjectValueNode');
    expect(node.loc).toEqual(fallback);
  });

  it('preserves empty legacy items fields', () => {
    const canonical = normalizeProgram({
      type: 'Program',
      uses: [],
      blocks: [
        {
          type: 'Block',
          name: 'restrictions',
          content: {
            type: 'ObjectContent',
            properties: { items: [] },
            loc: LOC,
          },
          loc: LOC,
        },
      ],
      extends: [],
      loc: LOC,
    });

    expect(toLegacyProgram(canonical).blocks[0]!.content).toMatchObject({
      properties: { items: [] },
    });
    expect(canonical.blocks[0]!.body.entries[0]!.type).toBe('FieldEntry');
  });

  it('retains exact canonical bodies through mutable compatibility projections', () => {
    const fieldLoc = { ...LOC, offset: 5, column: 6 };
    const textLoc = { ...LOC, offset: 20, column: 21 };
    const block = createCanonicalBlock(
      'context',
      createBlockBody(
        [
          {
            type: 'FieldEntry',
            name: 'runtime',
            value: createValueNode('node', fieldLoc),
            loc: fieldLoc,
          },
          {
            type: 'TextEntry',
            text: 'After field',
            loc: textLoc,
          },
        ],
        LOC
      ),
      LOC
    );
    const canonical = createCanonicalProgram({
      operations: [
        {
          type: 'UseOperation',
          declaration: {
            type: 'UseDeclaration',
            path: {
              type: 'PathReference',
              raw: './shared.prs',
              namespace: undefined,
              segments: ['shared.prs'],
              version: undefined,
              isRelative: true,
              loc: LOC,
            },
            loc: LOC,
          },
          sourceLayerId: LOC.file,
          loc: LOC,
        },
        {
          type: 'BlockOperation',
          block,
          sourceLayerId: LOC.file,
          loc: LOC,
        },
      ],
      loc: LOC,
    });

    const restored = normalizeProgram(toLegacyProgram(canonical, { preserveCanonicalBody: true }));
    const entries = restored.blocks[0]!.body.entries;

    expect(entries.map((entry) => entry.type)).toEqual(['FieldEntry', 'TextEntry']);
    expect(entries[0]!.loc).toEqual(fieldLoc);
    expect(entries[0]!.type).toBe('FieldEntry');
    if (entries[0]!.type !== 'FieldEntry') {
      throw new Error('Expected field entry');
    }
    expect(entries[0]!.value.loc).toEqual(fieldLoc);
    expect(restored.uses[0]!.path.raw).toBe('./shared.prs');
  });

  it('reconciles transformed content without losing order or nested locations', () => {
    const fieldLoc = { ...LOC, offset: 5, column: 6 };
    const textLoc = { ...LOC, offset: 20, column: 21 };
    const block = createCanonicalBlock(
      'context',
      createBlockBody(
        [
          {
            type: 'FieldEntry',
            name: 'config',
            value: createValueNode({ nested: { left: 'base' } }, fieldLoc),
            loc: fieldLoc,
          },
          { type: 'TextEntry', text: 'After field', loc: textLoc },
        ],
        LOC
      ),
      LOC
    );
    const canonical = createCanonicalProgram({
      operations: [
        {
          type: 'BlockOperation',
          block,
          sourceLayerId: LOC.file,
          loc: LOC,
        },
      ],
      loc: LOC,
    });
    const legacy = toLegacyProgram(canonical, { preserveCanonicalBody: true });
    if (legacy.blocks[0]!.content.type !== 'MixedContent') {
      throw new Error('Expected mixed content');
    }
    legacy.blocks[0]!.content.properties['config'] = {
      nested: { left: 'changed', right: true },
    };
    if (!legacy.blocks[0]!.content.text) {
      throw new Error('Expected mixed text');
    }
    legacy.blocks[0]!.content.text.value = 'Changed text';

    const restored = normalizeProgram(legacy);
    const entries = restored.blocks[0]!.body.entries;

    expect(entries.map((entry) => entry.type)).toEqual(['FieldEntry', 'TextEntry']);
    expect(entries[0]!.loc).toEqual(fieldLoc);
    expect(entries[0]!.type).toBe('FieldEntry');
    if (entries[0]!.type !== 'FieldEntry' || entries[0]!.value.type !== 'ObjectValueNode') {
      throw new Error('Expected object field');
    }
    expect(entries[0]!.value.loc).toEqual(fieldLoc);
    expect(entries[0]!.value.fields[0]!.value.loc).toEqual(fieldLoc);
    expect(entries[1]).toMatchObject({ type: 'TextEntry', text: 'Changed text' });
  });

  it('reconciles changed list values in place', () => {
    const itemLoc = { ...LOC, offset: 9, column: 10 };
    const body = createBlockBody(
      [
        { type: 'TextEntry', text: 'Before', loc: LOC },
        {
          type: 'ListEntry',
          value: createValueNode('old', itemLoc),
          loc: itemLoc,
        },
      ],
      LOC
    );

    const reconciled = reconcileBlockBody(body, {
      type: 'MixedContent',
      text: { type: 'TextContent', value: 'Before', loc: LOC },
      properties: {},
      listItems: ['new'],
      loc: LOC,
    });

    expect(reconciled.entries.map((entry) => entry.type)).toEqual(['TextEntry', 'ListEntry']);
    expect(reconciled.entries[1]!.loc).toEqual(itemLoc);
    expect(reconciled.entries[1]).toMatchObject({
      type: 'ListEntry',
      value: { type: 'ScalarValueNode', value: 'new', loc: itemLoc },
    });
  });

  it('preserves list provenance when merged values are deduplicated', () => {
    const baseLoc = { ...LOC, offset: 3, column: 4 };
    const duplicateLoc = { ...LOC, file: 'incoming.prs', offset: 7, column: 8 };
    const tailLoc = { ...LOC, file: 'incoming.prs', offset: 11, column: 12 };
    const body = createBlockBody(
      [
        {
          type: 'ListEntry',
          value: createValueNode('same', baseLoc),
          loc: baseLoc,
        },
        {
          type: 'ListEntry',
          value: createValueNode('same', duplicateLoc),
          loc: duplicateLoc,
        },
        {
          type: 'ListEntry',
          value: createValueNode('tail', tailLoc),
          loc: tailLoc,
        },
      ],
      LOC
    );

    const reconciled = reconcileBlockBody(body, {
      type: 'ObjectContent',
      properties: { items: ['same', 'tail'] },
      loc: LOC,
    });
    const listEntries = reconciled.entries.filter(
      (entry): entry is Extract<BlockEntry, { type: 'ListEntry' }> => entry.type === 'ListEntry'
    );

    expect(listEntries.map((entry) => valueNodeToValue(entry.value))).toEqual(['same', 'tail']);
    expect(listEntries.map((entry) => entry.loc)).toEqual([baseLoc, tailLoc]);
  });

  it('reconciles the last duplicate nested field', () => {
    const firstLoc = { ...LOC, offset: 3 };
    const lastLoc = { ...LOC, offset: 8 };
    const body = createBlockBody(
      [
        {
          type: 'FieldEntry',
          name: 'config',
          value: {
            type: 'ObjectValueNode',
            fields: [
              {
                type: 'ObjectFieldNode',
                name: 'duplicate',
                value: createValueNode('first', firstLoc),
                loc: firstLoc,
              },
              {
                type: 'ObjectFieldNode',
                name: 'duplicate',
                value: createValueNode('last', lastLoc),
                loc: lastLoc,
              },
            ],
            loc: LOC,
          },
          loc: LOC,
        },
      ],
      LOC
    );

    const reconciled = reconcileBlockBody(body, {
      type: 'ObjectContent',
      properties: { config: { duplicate: 'updated' } },
      loc: LOC,
    });
    const entry = reconciled.entries[0]!;
    if (entry.type !== 'FieldEntry' || entry.value.type !== 'ObjectValueNode') {
      throw new Error('Expected object field');
    }

    expect(entry.value.fields.map((field) => valueNodeToValue(field.value))).toEqual([
      'first',
      'updated',
    ]);
    expect(entry.value.fields[1]!.loc).toEqual(lastLoc);
  });

  it('deep-freezes merged value-node locations', () => {
    const incomingLoc = { ...LOC, file: 'incoming.prs' };
    const baseArray = createValueNode(['same'], LOC);
    const incomingArray = createValueNode(['same'], incomingLoc);
    const baseObject = createValueNode({ base: true }, LOC);
    const incomingObject = createValueNode({ incoming: true }, LOC);

    const array = mergeValueNodeLocations(
      baseArray,
      incomingArray,
      ['same'],
      'incoming',
      incomingArray
    );
    const object = mergeValueNodeLocations(
      baseObject,
      incomingObject,
      { base: true, incoming: true },
      'incoming',
      incomingObject
    );

    expect(Object.isFrozen(array)).toBe(true);
    expect(array.type).toBe('ArrayValueNode');
    if (array.type !== 'ArrayValueNode') throw new Error('Expected array value');
    expect(Object.isFrozen(array.elements)).toBe(true);
    expect(array.elements[0]!.loc).toEqual(incomingLoc);
    expect(Object.isFrozen(object)).toBe(true);
    expect(object.type).toBe('ObjectValueNode');
    if (object.type !== 'ObjectValueNode') throw new Error('Expected object value');
    expect(Object.isFrozen(object.fields)).toBe(true);
  });

  it('round-trips and reconciles exact value node variants', () => {
    const fallbackLoc = { ...LOC, line: 4, column: 5, offset: 8 };
    const sourceLoc = { ...LOC, file: 'source.prs', line: 7, column: 3, offset: 20 };
    const text = { type: 'TextContent' as const, value: 'before', loc: sourceLoc };
    const template = { type: 'TemplateExpression' as const, name: 'before', loc: sourceLoc };
    const expression = {
      type: 'TypeExpression' as const,
      kind: 'string' as const,
      constraints: { min: 2 },
      loc: sourceLoc,
    };

    const textNode = reconcileValueNode(createValueNode(text, fallbackLoc), {
      ...text,
      value: 'after',
    });
    const templateNode = reconcileValueNode(createValueNode(template, fallbackLoc), {
      ...template,
      name: 'after',
    });
    const expressionNode = reconcileValueNode(createValueNode(expression, fallbackLoc), {
      ...expression,
      constraints: { min: 4 },
    });
    const arrayNode = reconcileValueNode(createValueNode(['first'], fallbackLoc), [
      'updated',
      text,
    ]);

    expect(valueNodeToValue(textNode)).toEqual({ ...text, value: 'after' });
    expect(valueNodeToValue(templateNode)).toEqual({ ...template, name: 'after' });
    expect(valueNodeToValue(expressionNode)).toEqual({
      ...expression,
      constraints: { min: 4 },
    });
    expect(valueNodeToValue(arrayNode)).toEqual(['updated', text]);
    expect(textNode.loc).toEqual(sourceLoc);
    expect(templateNode.loc).toEqual(sourceLoc);
    expect(expressionNode.loc).toEqual(sourceLoc);
    expect(arrayNode.loc).toEqual(fallbackLoc);
    if (arrayNode.type !== 'ArrayValueNode') throw new Error('Expected array value');
    expect(arrayNode.elements.map((element) => element.loc)).toEqual([fallbackLoc, sourceLoc]);
    expect(Object.isFrozen(textNode)).toBe(true);
    expect(Object.isFrozen(templateNode)).toBe(true);
    expect(Object.isFrozen(expressionNode)).toBe(true);
    expect(Object.isFrozen(arrayNode.elements)).toBe(true);
  });

  it('prepares only synthetic legacy items projections for merging', () => {
    const listBody = createBlockBody(
      [{ type: 'ListEntry', value: createValueNode('dash item', LOC), loc: LOC }],
      LOC
    );
    const legacyProjection = {
      type: 'ObjectContent' as const,
      properties: { items: ['dash item'] },
      loc: LOC,
    };
    const explicitBody = createBlockBody(
      [
        {
          type: 'FieldEntry',
          name: 'items',
          value: createValueNode(['field item'], LOC),
          loc: LOC,
        },
      ],
      LOC
    );

    const prepared = prepareBlockContentForMerge(listBody, legacyProjection);
    const explicit = prepareBlockContentForMerge(explicitBody, legacyProjection);
    const detached = prepareBlockContentForMerge(undefined, legacyProjection);

    expect(prepared).toEqual({
      type: 'ObjectContent',
      properties: {},
      listItems: ['dash item'],
      loc: LOC,
    });
    expect(explicit).toEqual(legacyProjection);
    expect(detached).toEqual(legacyProjection);
    expect(detached).not.toBe(legacyProjection);
  });

  it('composes nested fields with incoming provenance and represented entries', () => {
    const baseLoc = { ...LOC, file: 'base.prs', offset: 2 };
    const incomingLoc = { ...LOC, file: 'incoming.prs', offset: 12 };
    const declaration = {
      type: 'InlineUseDeclaration' as const,
      path: {
        type: 'PathReference' as const,
        raw: './shared',
        namespace: undefined,
        segments: ['shared'],
        version: undefined,
        isRelative: true,
        loc: baseLoc,
      },
      loc: baseLoc,
    };
    const baseBody = createBlockBody(
      [
        {
          type: 'FieldEntry',
          name: 'config',
          value: createValueNode({ nested: { base: true } }, baseLoc),
          loc: baseLoc,
        },
        { type: 'TextEntry', text: 'Instructions', loc: baseLoc },
        { type: 'ListEntry', value: createValueNode('keep', baseLoc), loc: baseLoc },
        { type: 'InlineUseEntry', declaration, loc: baseLoc },
      ],
      baseLoc
    );
    const incomingBody = createBlockBody(
      [
        {
          type: 'FieldEntry',
          name: 'config',
          value: createValueNode({ nested: { incoming: true } }, incomingLoc),
          loc: incomingLoc,
        },
      ],
      incomingLoc
    );
    const baseContent = blockBodyToContent(baseBody);
    const incomingContent = blockBodyToContent(incomingBody);
    const mergedContent = {
      type: 'MixedContent' as const,
      text: { type: 'TextContent' as const, value: 'Instructions', loc: baseLoc },
      properties: { config: { nested: { base: true, incoming: true } } },
      listItems: ['keep'],
      inlineUses: [declaration],
      loc: incomingLoc,
    };

    const composed = composeBlockBodies(
      baseBody,
      incomingBody,
      baseContent,
      incomingContent,
      mergedContent
    );
    const config = composed.entries.find(
      (entry): entry is Extract<BlockEntry, { type: 'FieldEntry' }> =>
        entry.type === 'FieldEntry' && entry.name === 'config'
    );

    expect(config && valueNodeToValue(config.value)).toEqual({
      nested: { base: true, incoming: true },
    });
    if (!config || config.value.type !== 'ObjectValueNode') {
      throw new Error('Expected config object field');
    }
    const nested = config.value.fields[0]!.value;
    if (nested.type !== 'ObjectValueNode') throw new Error('Expected nested object');
    expect(nested.fields.find((field) => field.name === 'incoming')?.loc).toEqual(incomingLoc);
    expect(composed.entries.map((entry) => entry.type)).toEqual([
      'TextEntry',
      'ListEntry',
      'InlineUseEntry',
      'FieldEntry',
    ]);
    expect(composed.entries[0]).toMatchObject({ type: 'TextEntry', text: 'Instructions' });
    expect(composed.entries[1]).toMatchObject({
      type: 'ListEntry',
      value: { type: 'ScalarValueNode', value: 'keep' },
    });
    expect(composed.entries[2]).toMatchObject({
      type: 'InlineUseEntry',
      declaration,
    });
  });

  it('reconciles deep extension paths without losing canonical provenance', () => {
    const baseLoc = { ...LOC, file: 'base.prs', offset: 3 };
    const incomingLoc = { ...LOC, file: 'incoming.prs', offset: 30 };
    const baseContent = {
      type: 'ObjectContent' as const,
      properties: { config: { nested: { left: 'base', right: 'base' } } },
      loc: baseLoc,
    };
    const incomingContent = {
      type: 'ObjectContent' as const,
      properties: { right: 'incoming' },
      loc: incomingLoc,
    };
    const mergedContent = {
      type: 'ObjectContent' as const,
      properties: { config: { nested: { left: 'base', right: 'incoming' } } },
      loc: incomingLoc,
    };
    const baseBody = blockContentToBody(baseContent);
    const incomingBody = blockContentToBody(incomingContent);

    const reconciled = reconcileBlockBodyAtPath(
      baseBody,
      incomingBody,
      baseContent,
      incomingContent,
      mergedContent,
      ['config', 'nested']
    );
    const root = reconciled.entries[0]!;

    expect(blockBodyToContent(reconciled)).toMatchObject({
      properties: mergedContent.properties,
    });
    if (root.type !== 'FieldEntry' || root.value.type !== 'ObjectValueNode') {
      throw new Error('Expected config object field');
    }
    const nested = root.value.fields[0]!.value;
    if (nested.type !== 'ObjectValueNode') throw new Error('Expected nested object');
    expect(nested.fields.map((field) => valueNodeToValue(field.value))).toEqual([
      'base',
      'incoming',
    ]);
    expect(nested.fields.map((field) => field.loc)).toEqual([baseLoc, incomingLoc]);
    expect(root.loc).toEqual(baseLoc);

    const mixedBaseContent = {
      type: 'ObjectContent' as const,
      properties: {
        summary: {
          type: 'MixedContent' as const,
          text: { type: 'TextContent', value: 'Base text', loc: baseLoc },
          properties: { audience: 'developers' },
          loc: baseLoc,
        },
      },
      loc: baseLoc,
    };
    const textExtension = {
      type: 'TextContent' as const,
      value: 'Incoming text',
      loc: incomingLoc,
    };
    const mixedMergedContent = {
      type: 'ObjectContent' as const,
      properties: {
        summary: {
          type: 'MixedContent',
          text: { type: 'TextContent', value: 'Incoming text', loc: incomingLoc },
          properties: { audience: 'developers' },
          loc: incomingLoc,
        },
      },
      loc: incomingLoc,
    };

    const mixed = reconcileBlockBodyAtPath(
      blockContentToBody(mixedBaseContent),
      blockContentToBody(textExtension),
      mixedBaseContent,
      textExtension,
      mixedMergedContent,
      ['summary']
    );
    const summary = mixed.entries[0]!;

    expect(blockBodyToContent(mixed)).toMatchObject({
      properties: mixedMergedContent.properties,
    });
    if (summary.type !== 'FieldEntry' || summary.value.type !== 'ObjectValueNode') {
      throw new Error('Expected mixed summary field');
    }
    expect(summary.value.fields.find((field) => field.name === 'text')?.loc).toEqual(incomingLoc);
  });

  it('round-trips canonical extensions and program compatibility metadata', () => {
    const inheritLoc = { ...LOC, offset: 1 };
    const extensionLoc = { ...LOC, offset: 10 };
    const replacement = {
      type: 'ReplaceModifier' as const,
      property: 'testing',
      loc: extensionLoc,
    };
    const extension = createCanonicalExtendBlock(
      'standards',
      createBlockBody(
        [
          {
            type: 'FieldEntry',
            name: 'testing',
            value: createValueNode(['Vitest'], extensionLoc),
            loc: extensionLoc,
          },
        ],
        extensionLoc
      ),
      [replacement],
      extensionLoc
    );
    const inherit = {
      type: 'InheritDeclaration' as const,
      path: {
        type: 'PathReference' as const,
        raw: './base',
        namespace: undefined,
        segments: ['base'],
        version: undefined,
        isRelative: true,
        loc: inheritLoc,
      },
      loc: inheritLoc,
    };
    const canonical = createCanonicalProgram({
      operations: [
        {
          type: 'InheritOperation',
          declaration: inherit,
          sourceLayerId: LOC.file,
          loc: inheritLoc,
        },
        {
          type: 'ExtendOperation',
          extension,
          sourceLayerId: LOC.file,
          loc: extensionLoc,
        },
      ],
      syntaxFeatures: [{ feature: SYNTAX_FEATURES.REGULAR_BLOCK_REPLACE, location: extensionLoc }],
      loc: LOC,
    });

    const legacy = toLegacyProgram(canonical);
    const restored = normalizeProgram(legacy);

    expect(legacy.inherit).toEqual(inherit);
    expect(legacy.extends[0]!.replacements).toEqual([replacement]);
    expect(legacy.syntaxFeatures).toEqual(canonical.syntaxFeatures);
    expect(restored.inherit).toEqual(inherit);
    expect(restored.extends[0]!.replacements).toEqual([replacement]);
    expect(restored.syntaxFeatures).toEqual(canonical.syntaxFeatures);
    expect(Object.isFrozen(restored.extends[0])).toBe(true);
  });

  it('projects array and inline-use body shapes directly', () => {
    const declaration = {
      type: 'InlineUseDeclaration' as const,
      path: {
        type: 'PathReference' as const,
        raw: './shared',
        namespace: undefined,
        segments: ['shared'],
        version: undefined,
        isRelative: true,
        loc: LOC,
      },
      loc: LOC,
    };
    const array = createBlockBody(
      [
        { type: 'ListEntry', value: createValueNode('one', LOC), loc: LOC },
        { type: 'ListEntry', value: createValueNode('two', LOC), loc: LOC },
      ],
      LOC,
      { projection: 'ArrayContent' }
    );
    const mixed = createBlockBody(
      [
        { type: 'TextEntry', text: 'Instructions', loc: LOC },
        { type: 'InlineUseEntry', declaration, loc: LOC },
      ],
      LOC
    );
    const inlineOnly = createBlockBody([{ type: 'InlineUseEntry', declaration, loc: LOC }], LOC);
    const mixedSeparateItems = createBlockBody(
      [
        { type: 'TextEntry', text: 'Instructions', loc: LOC },
        {
          type: 'FieldEntry',
          name: 'items',
          value: createValueNode(['field item'], LOC),
          loc: LOC,
        },
        { type: 'ListEntry', value: createValueNode('dash item', LOC), loc: LOC },
      ],
      LOC
    );

    expect(blockBodyToContent(array)).toEqual({
      type: 'ArrayContent',
      elements: ['one', 'two'],
      loc: LOC,
    });
    expect(blockBodyToContent(mixed)).toEqual({
      type: 'MixedContent',
      text: { type: 'TextContent', value: 'Instructions', loc: LOC },
      properties: {},
      inlineUses: [declaration],
      loc: LOC,
    });
    expect(blockBodyToContent(inlineOnly)).toEqual({
      type: 'ObjectContent',
      properties: {},
      inlineUses: [declaration],
      loc: LOC,
    });
    expect(blockBodyToContent(mixedSeparateItems)).toEqual({
      type: 'MixedContent',
      text: { type: 'TextContent', value: 'Instructions', loc: LOC },
      properties: { items: ['field item'] },
      listItems: ['dash item'],
      loc: LOC,
    });
  });

  it('merges array and scalar locations by precedence and value match', () => {
    const baseLoc = { ...LOC, file: 'base.prs', offset: 2 };
    const incomingLoc = { ...LOC, file: 'incoming.prs', offset: 12 };
    const fallbackLoc = { ...LOC, file: 'merged.prs', offset: 20 };
    const base = createValueNode(['base-only', 'shared'], baseLoc);
    const incoming = createValueNode(['incoming-only', 'shared'], incomingLoc);
    const fallback = createValueNode([], fallbackLoc);
    const value = ['base-only', 'shared', 'incoming-only', 'new'];

    const baseResult = mergeValueNodeLocations(base, incoming, value, 'base', fallback);
    const incomingResult = mergeValueNodeLocations(base, incoming, value, 'incoming', fallback);

    expect(valueNodeToValue(baseResult)).toEqual(value);
    expect(valueNodeToValue(incomingResult)).toEqual(value);
    if (baseResult.type !== 'ArrayValueNode' || incomingResult.type !== 'ArrayValueNode') {
      throw new Error('Expected array values');
    }
    expect(baseResult.elements.map((element) => element.loc)).toEqual([
      baseLoc,
      baseLoc,
      incomingLoc,
      fallbackLoc,
    ]);
    expect(incomingResult.elements.map((element) => element.loc)).toEqual([
      baseLoc,
      incomingLoc,
      incomingLoc,
      fallbackLoc,
    ]);

    const baseScalar = createValueNode('same', baseLoc);
    const incomingScalar = createValueNode('same', incomingLoc);
    const fallbackScalar = createValueNode('fallback', fallbackLoc);
    const bothMatch = mergeValueNodeLocations(
      baseScalar,
      incomingScalar,
      'same',
      'base',
      fallbackScalar
    );
    const neitherMatches = mergeValueNodeLocations(
      baseScalar,
      incomingScalar,
      'changed',
      'incoming',
      fallbackScalar
    );

    expect(valueNodeToValue(bothMatch)).toBe('same');
    expect(bothMatch.loc).toEqual(baseLoc);
    expect(valueNodeToValue(neitherMatches)).toBe('changed');
    expect(neitherMatches.loc).toEqual(fallbackLoc);
  });

  it('merges object field values and locations by precedence', () => {
    const baseLoc = { ...LOC, file: 'base.prs', offset: 2 };
    const incomingLoc = { ...LOC, file: 'incoming.prs', offset: 12 };
    const fallbackLoc = { ...LOC, file: 'merged.prs', offset: 20 };
    const base = createValueNode({ baseOnly: 'base', shared: 'base' }, baseLoc);
    const incoming = createValueNode({ incomingOnly: 'incoming', shared: 'incoming' }, incomingLoc);
    const fallback = createValueNode({}, fallbackLoc);
    const value = {
      baseOnly: 'base',
      incomingOnly: 'incoming',
      shared: 'incoming',
      brandNew: true,
    };

    const incomingResult = mergeValueNodeLocations(base, incoming, value, 'incoming', fallback);
    const baseResult = mergeValueNodeLocations(
      base,
      incoming,
      { ...value, shared: 'base' },
      'base',
      fallback
    );
    const removedResult = reconcileValueNode(base, { baseOnly: 'base' });

    expect(valueNodeToValue(incomingResult)).toEqual(value);
    if (incomingResult.type !== 'ObjectValueNode' || baseResult.type !== 'ObjectValueNode') {
      throw new Error('Expected object values');
    }
    expect(incomingResult.fields.map((field) => field.name)).toEqual([
      'baseOnly',
      'incomingOnly',
      'shared',
      'brandNew',
    ]);
    expect(incomingResult.fields.map((field) => field.loc)).toEqual([
      baseLoc,
      incomingLoc,
      incomingLoc,
      fallbackLoc,
    ]);
    expect(baseResult.fields.find((field) => field.name === 'shared')).toMatchObject({
      value: { type: 'ScalarValueNode', value: 'base', loc: baseLoc },
      loc: baseLoc,
    });
    expect(valueNodeToValue(removedResult)).toEqual({ baseOnly: 'base' });
  });

  it('reconciles added entry kinds and changed array items', () => {
    const useLoc = { ...LOC, file: 'base.prs', offset: 2 };
    const contentLoc = { ...LOC, file: 'incoming.prs', offset: 20 };
    const textLoc = { ...contentLoc, offset: 24 };
    const secondUseLoc = { ...contentLoc, offset: 22 };
    const firstUse = {
      type: 'InlineUseDeclaration' as const,
      path: {
        type: 'PathReference' as const,
        raw: './first',
        namespace: undefined,
        segments: ['first'],
        version: undefined,
        isRelative: true,
        loc: useLoc,
      },
      loc: useLoc,
    };
    const secondUse = {
      type: 'InlineUseDeclaration' as const,
      path: {
        type: 'PathReference' as const,
        raw: './second',
        namespace: undefined,
        segments: ['second'],
        version: undefined,
        isRelative: true,
        loc: secondUseLoc,
      },
      loc: secondUseLoc,
    };
    const reconciled = reconcileBlockBody(
      createBlockBody([{ type: 'InlineUseEntry', declaration: firstUse, loc: useLoc }], useLoc),
      {
        type: 'MixedContent',
        text: { type: 'TextContent', value: 'Instructions', loc: textLoc },
        properties: { runtime: 'node' },
        listItems: ['list item'],
        inlineUses: [firstUse, secondUse],
        loc: contentLoc,
      }
    );

    expect(reconciled.entries.map((entry) => entry.type)).toEqual([
      'InlineUseEntry',
      'FieldEntry',
      'ListEntry',
      'InlineUseEntry',
      'TextEntry',
    ]);
    expect(
      reconciled.entries.map((entry) =>
        entry.type === 'FieldEntry'
          ? [entry.name, valueNodeToValue(entry.value)]
          : entry.type === 'InlineUseEntry'
            ? entry.declaration.path.raw
            : entry.type === 'TextEntry'
              ? entry.text
              : valueNodeToValue(entry.value)
      )
    ).toEqual(['./first', ['runtime', 'node'], 'list item', './second', 'Instructions']);
    expect(reconciled.entries.map((entry) => entry.loc)).toEqual([
      useLoc,
      contentLoc,
      contentLoc,
      secondUseLoc,
      textLoc,
    ]);

    const firstItemLoc = { ...LOC, offset: 4 };
    const arrayBody = createBlockBody(
      [{ type: 'ListEntry', value: createValueNode('old', firstItemLoc), loc: firstItemLoc }],
      LOC,
      { projection: 'ArrayContent' }
    );
    const arrayResult = reconcileBlockBody(arrayBody, {
      type: 'ArrayContent',
      elements: ['changed', 'appended'],
      loc: contentLoc,
    });

    expect(blockBodyToContent(arrayResult)).toEqual({
      type: 'ArrayContent',
      elements: ['changed', 'appended'],
      loc: LOC,
    });
    expect(arrayResult.entries.map((entry) => entry.loc)).toEqual([firstItemLoc, contentLoc]);

    const secondItemLoc = { ...LOC, offset: 8 };
    const reordered = reconcileBlockBody(
      createBlockBody(
        [
          { type: 'ListEntry', value: createValueNode('first', firstItemLoc), loc: firstItemLoc },
          {
            type: 'ListEntry',
            value: createValueNode('second', secondItemLoc),
            loc: secondItemLoc,
          },
        ],
        LOC
      ),
      {
        type: 'ObjectContent',
        properties: { items: ['second', 'first'] },
        loc: contentLoc,
      }
    );

    expect(
      reordered.entries.map((entry) =>
        entry.type === 'ListEntry' ? valueNodeToValue(entry.value) : undefined
      )
    ).toEqual(['second', 'first']);
    expect(reordered.entries.map((entry) => entry.loc)).toEqual([secondItemLoc, firstItemLoc]);
  });

  it('uses compatibility fallbacks for incompatible and absent content', () => {
    const textBlock = createCanonicalBlock(
      'identity',
      createBlockBody([{ type: 'TextEntry', text: 'Original', loc: LOC }], LOC, {
        projection: 'TextContent',
      }),
      LOC
    );
    const updated = updateCanonicalBlockBody(
      textBlock,
      createBlockBody(
        [
          {
            type: 'FieldEntry',
            name: 'runtime',
            value: createValueNode('node', LOC),
            loc: LOC,
          },
        ],
        LOC
      )
    );
    const extension = createCanonicalExtendBlock(
      'standards',
      createBlockBody([], LOC),
      undefined,
      LOC
    );

    expect(updated.content).toEqual({
      type: 'ObjectContent',
      properties: { runtime: 'node' },
      loc: LOC,
    });
    expect(extension).not.toHaveProperty('replacements');
    expect(
      getBlockProperties({
        type: 'Block',
        name: 'identity',
        content: { type: 'TextContent', value: 'Text', loc: LOC },
        loc: LOC,
      })
    ).toEqual({});
    expect(
      getBlockText({
        type: 'Block',
        name: 'context',
        content: { type: 'MixedContent', properties: { runtime: 'node' }, loc: LOC },
        loc: LOC,
      })
    ).toBeUndefined();
    expect(
      getBlockItems({
        type: 'Block',
        name: 'context',
        content: { type: 'ObjectContent', properties: { runtime: 'node' }, loc: LOC },
        loc: LOC,
      })
    ).toEqual([]);
  });

  it('preserves mixed extension substructures and their source locations', () => {
    const baseLoc = { ...LOC, file: 'base.prs', offset: 2 };
    const incomingLoc = { ...LOC, file: 'incoming.prs', offset: 20 };
    const baseUse = {
      type: 'InlineUseDeclaration' as const,
      path: {
        type: 'PathReference' as const,
        raw: './base',
        segments: ['base'],
        isRelative: true,
        loc: baseLoc,
      },
      loc: baseLoc,
    };
    const incomingUse = {
      type: 'InlineUseDeclaration' as const,
      path: {
        type: 'PathReference' as const,
        raw: './incoming',
        segments: ['incoming'],
        isRelative: true,
        loc: incomingLoc,
      },
      loc: incomingLoc,
    };
    const baseSummary = {
      type: 'MixedContent' as const,
      text: { type: 'TextContent' as const, value: 'Base', loc: baseLoc },
      properties: { base: true },
      listItems: ['base item'],
      inlineUses: [baseUse],
      loc: baseLoc,
    };
    const incomingSummary = {
      type: 'MixedContent' as const,
      text: { type: 'TextContent' as const, value: 'Incoming', loc: incomingLoc },
      properties: { incoming: true },
      listItems: ['incoming item'],
      inlineUses: [incomingUse],
      loc: incomingLoc,
    };
    const mergedSummary = {
      type: 'MixedContent' as const,
      text: {
        type: 'TextContent' as const,
        value: 'Base\n\nIncoming',
        loc: incomingLoc,
      },
      properties: { base: true, incoming: true },
      listItems: ['base item', 'incoming item'],
      inlineUses: [baseUse, incomingUse],
      loc: incomingLoc,
    };
    const baseContent = {
      type: 'ObjectContent' as const,
      properties: { summary: baseSummary },
      loc: baseLoc,
    };
    const mergedContent = {
      type: 'ObjectContent' as const,
      properties: { summary: mergedSummary },
      loc: incomingLoc,
    };

    const reconciled = reconcileBlockBodyAtPath(
      blockContentToBody(baseContent),
      blockContentToBody(incomingSummary),
      baseContent,
      incomingSummary,
      mergedContent,
      ['summary']
    );
    const summary = reconciled.entries[0]!;

    expect(blockBodyToContent(reconciled)).toMatchObject({
      properties: mergedContent.properties,
    });
    if (summary.type !== 'FieldEntry' || summary.value.type !== 'ObjectValueNode') {
      throw new Error('Expected mixed summary field');
    }
    const fields = new Map(summary.value.fields.map((field) => [field.name, field]));
    expect(fields.get('text')?.loc).toEqual(incomingLoc);
    expect(fields.get('listItems')?.loc).toEqual(incomingLoc);
    expect(fields.get('inlineUses')?.loc).toEqual(incomingLoc);
    expect(fields.get('properties')?.value).toMatchObject({
      type: 'ObjectValueNode',
      fields: [
        { name: 'base', loc: baseLoc },
        { name: 'incoming', loc: incomingLoc },
      ],
    });
  });

  it('preserves array and text provenance at extension paths', () => {
    const baseLoc = { ...LOC, file: 'base.prs', offset: 2 };
    const incomingLoc = { ...LOC, file: 'incoming.prs', offset: 20 };
    const baseContent = {
      type: 'ObjectContent' as const,
      properties: { rules: ['base'], summary: 'Base' },
      loc: baseLoc,
    };
    const arrayExtension = {
      type: 'ArrayContent' as const,
      elements: ['incoming'],
      loc: incomingLoc,
    };
    const arrayMerged = {
      type: 'ObjectContent' as const,
      properties: { rules: ['base', 'incoming'], summary: 'Base' },
      loc: incomingLoc,
    };
    const arrayBody = reconcileBlockBodyAtPath(
      blockContentToBody(baseContent),
      blockContentToBody(arrayExtension),
      baseContent,
      arrayExtension,
      arrayMerged,
      ['rules']
    );
    const rules = arrayBody.entries.find(
      (entry): entry is Extract<BlockEntry, { type: 'FieldEntry' }> =>
        entry.type === 'FieldEntry' && entry.name === 'rules'
    );

    expect(rules && valueNodeToValue(rules.value)).toEqual(['base', 'incoming']);
    if (!rules || rules.value.type !== 'ArrayValueNode') {
      throw new Error('Expected rules array');
    }
    expect(rules.value.elements.map((element) => element.loc)).toEqual([baseLoc, incomingLoc]);

    const textExtension = {
      type: 'TextContent' as const,
      value: 'Incoming',
      loc: incomingLoc,
    };
    const textMerged = {
      type: 'ObjectContent' as const,
      properties: { rules: ['base'], summary: 'Base\n\nIncoming' },
      loc: incomingLoc,
    };
    const textBody = reconcileBlockBodyAtPath(
      blockContentToBody(baseContent),
      blockContentToBody(textExtension),
      baseContent,
      textExtension,
      textMerged,
      ['summary']
    );
    const summary = textBody.entries.find(
      (entry): entry is Extract<BlockEntry, { type: 'FieldEntry' }> =>
        entry.type === 'FieldEntry' && entry.name === 'summary'
    );

    expect(summary && valueNodeToValue(summary.value)).toBe('Base\n\nIncoming');
    expect(summary?.value.loc).toEqual(baseLoc);
  });

  it('adds missing nested extension paths with incoming provenance', () => {
    const baseLoc = { ...LOC, file: 'base.prs', offset: 2 };
    const incomingLoc = { ...LOC, file: 'incoming.prs', offset: 20 };
    const baseContent = {
      type: 'ObjectContent' as const,
      properties: { config: { existing: true } },
      loc: baseLoc,
    };
    const incomingContent = {
      type: 'ObjectContent' as const,
      properties: { enabled: true },
      loc: incomingLoc,
    };
    const nestedMerged = {
      type: 'ObjectContent' as const,
      properties: {
        config: {
          existing: true,
          feature: { enabled: true },
          sibling: true,
        },
      },
      loc: incomingLoc,
    };
    const nested = reconcileBlockBodyAtPath(
      blockContentToBody(baseContent),
      blockContentToBody(incomingContent),
      baseContent,
      incomingContent,
      nestedMerged,
      ['config', 'feature']
    );
    const rootMerged = {
      type: 'ObjectContent' as const,
      properties: {
        config: { existing: true },
        feature: { enabled: true },
      },
      loc: incomingLoc,
    };
    const root = reconcileBlockBodyAtPath(
      blockContentToBody(baseContent),
      blockContentToBody(incomingContent),
      baseContent,
      incomingContent,
      rootMerged,
      ['feature']
    );

    expect(blockBodyToContent(nested)).toMatchObject({
      properties: nestedMerged.properties,
    });
    expect(blockBodyToContent(root)).toMatchObject({
      properties: rootMerged.properties,
    });
    const nestedConfig = nested.entries.find(
      (entry): entry is Extract<BlockEntry, { type: 'FieldEntry' }> =>
        entry.type === 'FieldEntry' && entry.name === 'config'
    );
    if (!nestedConfig || nestedConfig.value.type !== 'ObjectValueNode') {
      throw new Error('Expected nested config object');
    }
    expect(nestedConfig.value.fields.find((field) => field.name === 'feature')?.loc).toEqual(
      incomingLoc
    );
    expect(
      root.entries.find(
        (entry): entry is Extract<BlockEntry, { type: 'FieldEntry' }> =>
          entry.type === 'FieldEntry' && entry.name === 'feature'
      )?.loc
    ).toEqual(incomingLoc);
  });

  it('reconciles mixed and mismatched nested extension values', () => {
    const baseLoc = { ...LOC, file: 'base.prs', offset: 2 };
    const incomingLoc = { ...LOC, file: 'incoming.prs', offset: 20 };
    const plainBase = {
      type: 'ObjectContent' as const,
      properties: { summary: { audience: 'developers' } },
      loc: baseLoc,
    };
    const textExtension = {
      type: 'TextContent' as const,
      value: 'Incoming',
      loc: incomingLoc,
    };
    const mixedMerged = {
      type: 'ObjectContent' as const,
      properties: {
        summary: {
          type: 'MixedContent',
          text: textExtension,
          properties: { audience: 'developers' },
          loc: incomingLoc,
        },
      },
      loc: incomingLoc,
    };
    const mixed = reconcileBlockBodyAtPath(
      blockContentToBody(plainBase),
      blockContentToBody(textExtension),
      plainBase,
      textExtension,
      mixedMerged,
      ['summary']
    );

    expect(blockBodyToContent(mixed)).toMatchObject({
      properties: mixedMerged.properties,
    });

    const objectBase = {
      type: 'ObjectContent' as const,
      properties: { config: { existing: true } },
      loc: baseLoc,
    };
    const arrayExtension = {
      type: 'ArrayContent' as const,
      elements: ['replacement'],
      loc: incomingLoc,
    };
    const arrayMerged = {
      type: 'ObjectContent' as const,
      properties: { config: ['replacement'] },
      loc: incomingLoc,
    };
    const array = reconcileBlockBodyAtPath(
      blockContentToBody(objectBase),
      blockContentToBody(arrayExtension),
      objectBase,
      arrayExtension,
      arrayMerged,
      ['config', 'nested']
    );
    const unchanged = reconcileBlockBodyAtPath(
      blockContentToBody(objectBase),
      undefined,
      objectBase,
      objectBase,
      objectBase,
      ['config', 'missing']
    );
    const removedMerged = {
      type: 'ObjectContent' as const,
      properties: { config: { feature: { enabled: true } } },
      loc: incomingLoc,
    };
    const removed = reconcileBlockBodyAtPath(
      blockContentToBody(objectBase),
      blockContentToBody({
        type: 'ObjectContent',
        properties: { enabled: true },
        loc: incomingLoc,
      }),
      objectBase,
      {
        type: 'ObjectContent',
        properties: { enabled: true },
        loc: incomingLoc,
      },
      removedMerged,
      ['config', 'feature']
    );

    expect(blockBodyToContent(array)).toMatchObject({
      properties: arrayMerged.properties,
    });
    expect(blockBodyToContent(unchanged)).toEqual(objectBase);
    expect(blockBodyToContent(removed)).toEqual({
      type: 'ObjectContent',
      properties: removedMerged.properties,
      loc: baseLoc,
    });
  });

  it('returns reconciled content for empty or inapplicable extension paths', () => {
    const content = {
      type: 'ObjectContent' as const,
      properties: { existing: true },
      loc: LOC,
    };
    const body = blockContentToBody(content);
    const changed = {
      type: 'ObjectContent' as const,
      properties: { existing: true, added: true },
      loc: LOC,
    };
    const text = { type: 'TextContent' as const, value: 'Text', loc: LOC };

    const emptyPath = reconcileBlockBodyAtPath(body, undefined, content, changed, changed, []);
    const textContent = reconcileBlockBodyAtPath(body, undefined, content, text, text, [
      'existing',
    ]);
    const emptyRoot = reconcileBlockBodyAtPath(body, undefined, content, changed, changed, ['']);
    const missingRoot = reconcileBlockBodyAtPath(body, undefined, content, changed, changed, [
      'missing',
    ]);

    expect(blockBodyToContent(emptyPath)).toEqual(changed);
    expect(blockBodyToContent(textContent)).toEqual(text);
    expect(blockBodyToContent(emptyRoot)).toEqual(changed);
    expect(blockBodyToContent(missingRoot)).toEqual(changed);
  });

  it('preserves extension bodies and inline-use compatibility projections', () => {
    const block = createCanonicalBlock(
      'identity',
      createBlockBody([{ type: 'TextEntry', text: 'Text', loc: LOC }], LOC, {
        projection: 'TextContent',
      }),
      LOC
    );
    const extension = createCanonicalExtendBlock(
      'context',
      createBlockBody(
        [
          {
            type: 'FieldEntry',
            name: 'runtime',
            value: createValueNode('node', LOC),
            loc: LOC,
          },
        ],
        LOC
      ),
      undefined,
      LOC
    );
    const canonical = createCanonicalProgram({
      operations: [
        {
          type: 'BlockOperation',
          block,
          sourceLayerId: LOC.file,
          loc: LOC,
        },
        {
          type: 'ExtendOperation',
          extension,
          sourceLayerId: LOC.file,
          loc: LOC,
        },
      ],
      meta: { type: 'MetaBlock', fields: { id: 'example' }, loc: LOC },
      loc: LOC,
    });
    const legacy = toLegacyProgram(canonical, { preserveCanonicalBody: true });

    expect(legacy.blocks[0]!.canonicalBody).toEqual(block.body);
    expect(legacy.extends[0]!.canonicalBody).toEqual(extension.body);
    expect(legacy.meta).toEqual(canonical.meta);
    expect(
      getBlockText({
        type: 'Block',
        name: 'context',
        content: { type: 'ObjectContent', properties: {}, loc: LOC },
        loc: LOC,
      })
    ).toBeUndefined();
    expect(
      getBlockItems({
        type: 'Block',
        name: 'standards',
        content: { type: 'ArrayContent', elements: ['one'], loc: LOC },
        loc: LOC,
      })
    ).toEqual(['one']);
    expect(
      getInlineUses({
        type: 'Block',
        name: 'identity',
        content: { type: 'TextContent', value: 'Text', loc: LOC },
        loc: LOC,
      })
    ).toEqual([]);
  });
});
