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
          type: 'MixedContent',
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
});
