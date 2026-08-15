import type {
  ArrayContent,
  ArrayElementNode,
  ArrayValueNode,
  AgentProvenance,
  Block,
  BlockBody,
  BlockContent,
  BlockEntry,
  BlockInput,
  CanonicalBlock,
  CanonicalExtendBlock,
  CanonicalOverrideBlock,
  CanonicalProgram,
  DeepReadonly,
  ExtendBlock,
  FieldEntry,
  InheritDeclaration,
  InlineUseDeclaration,
  ListEntry,
  MetaBlock,
  MixedContent,
  ObjectContent,
  ObjectFieldNode,
  ObjectValueNode,
  OverrideBlock,
  OverrideReplacement,
  Program,
  ProgramInput,
  ProgramOperation,
  ReplaceModifier,
  ScalarValueNode,
  SourceLocation,
  TemplateExpression,
  TemplateValueNode,
  TextContent,
  TextEntry,
  TextValueNode,
  TypeExpression,
  TypeExpressionValueNode,
  UseDeclaration,
  Value,
  ValueNode,
} from './types/index.js';
import type { SyntaxFeatureUsage } from './syntax-versions.js';
import { deepClone } from './utils/index.js';
import { selectPresentationEntries } from './presentation.js';

type LegacyContentType = BlockContent['type'];

export interface BlockBodyOptions {
  readonly projection?: LegacyContentType;
  readonly text?: DeepReadonly<TextContent>;
}

export interface CanonicalProgramOptions {
  readonly meta?: DeepReadonly<MetaBlock>;
  readonly operations: readonly ProgramOperation[];
  readonly agentProvenance?: readonly DeepReadonly<AgentProvenance>[];
  readonly syntaxFeatures?: readonly DeepReadonly<SyntaxFeatureUsage>[];
  readonly loc: SourceLocation;
}

export interface LegacyProjectionOptions {
  readonly preserveCanonicalBody?: boolean;
}

function deepFreeze<T>(value: T): DeepReadonly<T> {
  if (value === null || typeof value !== 'object' || Object.isFrozen(value)) {
    return value as DeepReadonly<T>;
  }

  for (const child of Object.values(value)) {
    deepFreeze(child);
  }
  return Object.freeze(value) as DeepReadonly<T>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isSourceLocation(value: unknown): value is SourceLocation {
  return (
    isRecord(value) &&
    typeof value['file'] === 'string' &&
    typeof value['line'] === 'number' &&
    typeof value['column'] === 'number' &&
    (value['offset'] === undefined || typeof value['offset'] === 'number')
  );
}

function hasOnlyKeys(value: Record<string, unknown>, allowed: readonly string[]): boolean {
  const allowedKeys = new Set(allowed);
  return Object.keys(value).every((key) => allowedKeys.has(key));
}

function valueLocation(value: Value, fallback: SourceLocation): SourceLocation {
  if (isRecord(value) && isSourceLocation(value['loc'])) {
    return deepClone(value['loc']);
  }
  return deepClone(fallback);
}

function isTextContent(value: Value): value is TextContent {
  return (
    isRecord(value) &&
    value['type'] === 'TextContent' &&
    typeof value['value'] === 'string' &&
    isSourceLocation(value['loc']) &&
    hasOnlyKeys(value, ['type', 'value', 'loc'])
  );
}

function isTemplateExpression(value: Value): value is TemplateExpression {
  return (
    isRecord(value) &&
    value['type'] === 'TemplateExpression' &&
    typeof value['name'] === 'string' &&
    isSourceLocation(value['loc']) &&
    hasOnlyKeys(value, ['type', 'name', 'loc'])
  );
}

function isTypeExpression(value: Value): value is TypeExpression {
  return (
    isRecord(value) &&
    value['type'] === 'TypeExpression' &&
    typeof value['kind'] === 'string' &&
    ['range', 'enum', 'list', 'string', 'number', 'boolean'].includes(value['kind']) &&
    isSourceLocation(value['loc']) &&
    hasOnlyKeys(value, ['type', 'kind', 'params', 'constraints', 'loc'])
  );
}

export function createValueNode(value: Value, fallbackLoc: SourceLocation): ValueNode {
  const loc = valueLocation(value, fallbackLoc);

  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    value === null
  ) {
    return deepFreeze<ScalarValueNode>({
      type: 'ScalarValueNode',
      value,
      loc,
    });
  }

  if (Array.isArray(value)) {
    const elements = value.map<ArrayElementNode>((item) => {
      const itemLoc = valueLocation(item, fallbackLoc);
      return {
        type: 'ArrayElementNode',
        value: createValueNode(item, itemLoc),
        loc: itemLoc,
      };
    });
    return deepFreeze<ArrayValueNode>({
      type: 'ArrayValueNode',
      elements,
      loc,
    });
  }

  if (isTextContent(value)) {
    return deepFreeze<TextValueNode>({
      type: 'TextValueNode',
      value: value.value,
      loc,
    });
  }

  if (isTemplateExpression(value)) {
    return deepFreeze<TemplateValueNode>({
      type: 'TemplateValueNode',
      name: value.name,
      loc,
    });
  }

  if (isTypeExpression(value)) {
    return deepFreeze<TypeExpressionValueNode>({
      type: 'TypeExpressionValueNode',
      expression: deepClone(value),
      loc,
    });
  }

  const fields = Object.entries(value).map<ObjectFieldNode>(([name, item]) => {
    const itemLoc = valueLocation(item, fallbackLoc);
    return {
      type: 'ObjectFieldNode',
      name,
      value: createValueNode(item, itemLoc),
      loc: itemLoc,
    };
  });
  return deepFreeze<ObjectValueNode>({
    type: 'ObjectValueNode',
    fields,
    loc,
  });
}

export function valueNodeToValue(node: ValueNode): Value {
  switch (node.type) {
    case 'ScalarValueNode':
      return node.value;
    case 'TextValueNode':
      return {
        type: 'TextContent',
        value: node.value,
        loc: deepClone(node.loc),
      };
    case 'TemplateValueNode':
      return {
        type: 'TemplateExpression',
        name: node.name,
        loc: deepClone(node.loc),
      } satisfies TemplateExpression;
    case 'TypeExpressionValueNode':
      return deepClone(node.expression) as TypeExpression;
    case 'ArrayValueNode':
      return node.elements.map((element) => valueNodeToValue(element.value));
    case 'ObjectValueNode': {
      const result: Record<string, Value> = {};
      for (const field of node.fields) {
        result[field.name] = valueNodeToValue(field.value);
      }
      return result;
    }
  }
}

function inferBodyShape(entries: readonly BlockEntry[]): BlockBody['shape'] {
  const hasText = entries.some((entry) => entry.type === 'TextEntry');
  const hasFields = entries.some(
    (entry) => entry.type === 'FieldEntry' || entry.type === 'InlineUseEntry'
  );
  const hasList = entries.some((entry) => entry.type === 'ListEntry');
  const categories = Number(hasText) + Number(hasFields) + Number(hasList);

  if (categories > 1) return 'mixed';
  if (hasText) return 'text';
  if (hasList) return 'array';
  return 'object';
}

export function createBlockBody(
  entries: readonly BlockEntry[],
  loc: SourceLocation,
  options: BlockBodyOptions = {}
): BlockBody {
  const body = {
    type: 'BlockBody',
    shape: inferBodyShape(entries),
    entries: deepClone(entries),
    loc: deepClone(loc),
    ...(options.projection ? { legacyProjection: options.projection } : {}),
    ...(options.text ? { legacyText: deepClone(options.text) } : {}),
  } satisfies BlockBody;
  return deepFreeze(body);
}

function getBodyProjection(body: BlockBody): LegacyContentType | undefined {
  return body.legacyProjection;
}

export function blockContentToBody(content: BlockContent): BlockBody {
  const entries: BlockEntry[] = [];

  if (content.type === 'TextContent') {
    entries.push({
      type: 'TextEntry',
      text: content.value,
      loc: deepClone(content.loc),
    });
  } else if (content.type === 'ArrayContent') {
    for (const value of content.elements) {
      const loc = valueLocation(value, content.loc);
      entries.push({
        type: 'ListEntry',
        value: createValueNode(value, loc),
        loc,
      });
    }
  } else {
    if (content.type === 'MixedContent' && content.text) {
      entries.push({
        type: 'TextEntry',
        text: content.text.value,
        loc: deepClone(content.text.loc),
      });
    }
    for (const [name, value] of Object.entries(content.properties)) {
      const loc = valueLocation(value, content.loc);
      entries.push({
        type: 'FieldEntry',
        name,
        value: createValueNode(value, loc),
        loc,
      });
    }
    for (const value of content.listItems ?? []) {
      const loc = valueLocation(value, content.loc);
      entries.push({
        type: 'ListEntry',
        value: createValueNode(value, loc),
        loc,
      });
    }
    if (content.inlineUses) {
      for (const declaration of content.inlineUses ?? []) {
        entries.push({
          type: 'InlineUseEntry',
          declaration: deepClone(declaration),
          loc: deepClone(declaration.loc),
        });
      }
    }
  }

  entries.sort((left, right) => (left.loc.offset ?? 0) - (right.loc.offset ?? 0));
  return createBlockBody(entries, content.loc, { projection: content.type });
}

function textFromEntries(entries: readonly TextEntry[]): TextContent | undefined {
  const first = entries[0];
  if (!first) return undefined;
  return {
    type: 'TextContent',
    value: entries.map((entry) => entry.text).join('\n'),
    loc: deepClone(first.loc),
  };
}

function contentText(content: BlockContent): TextContent | undefined {
  if (content.type === 'TextContent') return content;
  if (content.type === 'MixedContent') return content.text;
  return undefined;
}

export function blockBodyToContent(body: BlockBody): BlockContent {
  const textEntries = body.entries.filter(
    (entry): entry is TextEntry => entry.type === 'TextEntry'
  );
  const fieldEntries = body.entries.filter(
    (entry): entry is FieldEntry => entry.type === 'FieldEntry'
  );
  const listEntries = body.entries.filter(
    (entry): entry is ListEntry => entry.type === 'ListEntry'
  );
  const inlineUses = body.entries
    .filter((entry) => entry.type === 'InlineUseEntry')
    .map((entry) => deepClone(entry.declaration) as InlineUseDeclaration);
  const text = body.legacyText
    ? (deepClone(body.legacyText) as TextContent)
    : textFromEntries(textEntries);
  const properties: Record<string, Value> = {};
  const listItems = listEntries.map((entry) => valueNodeToValue(entry.value));

  for (const entry of fieldEntries) {
    properties[entry.name] = valueNodeToValue(entry.value);
  }

  const projection = getBodyProjection(body);
  if (projection === 'ArrayContent') {
    return {
      type: 'ArrayContent',
      elements: listItems,
      loc: deepClone(body.loc),
    } satisfies ArrayContent;
  }

  const separateListItems =
    listItems.length > 0 && Object.hasOwn(properties, 'items') ? listItems : undefined;
  if (listItems.length > 0 && !separateListItems) {
    properties['items'] = listItems;
  }

  if (
    inlineUses.length === 0 &&
    listItems.length === 0 &&
    (projection === 'TextContent' || (text && Object.keys(properties).length === 0))
  ) {
    return (
      text ?? {
        type: 'TextContent',
        value: '',
        loc: deepClone(body.loc),
      }
    );
  }

  if (text) {
    const content: MixedContent = {
      type: 'MixedContent',
      text,
      properties,
      loc: deepClone(body.loc),
    };
    if (inlineUses.length > 0) {
      content.inlineUses = inlineUses;
    }
    if (separateListItems) {
      content.listItems = separateListItems;
    }
    return content;
  }

  const content: ObjectContent = {
    type: 'ObjectContent',
    properties,
    loc: deepClone(body.loc),
  };
  if (inlineUses.length > 0) {
    content.inlineUses = inlineUses;
  }
  if (separateListItems) {
    content.listItems = separateListItems;
  }
  return content;
}

export function reconcileValueNode(node: ValueNode, value: Value): ValueNode {
  if (node.type === 'ArrayValueNode' && Array.isArray(value)) {
    return deepFreeze<ArrayValueNode>({
      ...deepClone(node),
      elements: value.map((item, index) => {
        const existing = node.elements[index];
        if (!existing) {
          const itemNode = createValueNode(item, node.loc);
          return {
            type: 'ArrayElementNode',
            value: itemNode,
            loc: itemNode.loc,
          };
        }
        return {
          ...deepClone(existing),
          value: reconcileValueNode(existing.value, item),
        };
      }),
    });
  }

  if (
    node.type === 'ObjectValueNode' &&
    isRecord(value) &&
    !isTextContent(value) &&
    !isTemplateExpression(value) &&
    !isTypeExpression(value)
  ) {
    const entries = Object.entries(value) as [string, Value][];
    const values = new Map(entries);
    const lastIndexes = new Map<string, number>();
    for (const [index, field] of node.fields.entries()) {
      lastIndexes.set(field.name, index);
    }
    const fields: ObjectFieldNode[] = [];
    for (const [index, field] of node.fields.entries()) {
      const next = values.get(field.name);
      if (next === undefined && !values.has(field.name)) continue;
      fields.push(
        lastIndexes.get(field.name) === index
          ? {
              ...deepClone(field),
              value: reconcileValueNode(field.value, next!),
            }
          : deepClone(field)
      );
      if (lastIndexes.get(field.name) === index) {
        values.delete(field.name);
      }
    }
    for (const [name, next] of values) {
      const nextNode = createValueNode(next, node.loc);
      fields.push({
        type: 'ObjectFieldNode',
        name,
        value: nextNode,
        loc: nextNode.loc,
      });
    }
    return deepFreeze<ObjectValueNode>({
      ...deepClone(node),
      fields,
    });
  }

  if (
    node.type === 'ScalarValueNode' &&
    (typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean' ||
      value === null)
  ) {
    return deepFreeze<ScalarValueNode>({
      ...deepClone(node),
      value,
    });
  }
  if (node.type === 'TextValueNode' && isTextContent(value)) {
    return deepFreeze<TextValueNode>({
      ...deepClone(node),
      value: value.value,
    });
  }
  if (node.type === 'TemplateValueNode' && isTemplateExpression(value)) {
    return deepFreeze<TemplateValueNode>({
      ...deepClone(node),
      name: value.name,
    });
  }
  if (node.type === 'TypeExpressionValueNode' && isTypeExpression(value)) {
    return deepFreeze<TypeExpressionValueNode>({
      ...deepClone(node),
      expression: deepClone(value),
    });
  }
  return createValueNode(value, node.loc);
}

export function mergeValueNodeLocations(
  base: ValueNode | undefined,
  incoming: ValueNode | undefined,
  value: Value,
  precedence: 'base' | 'incoming',
  fallback: ValueNode
): ValueNode {
  const selectedFallback = fallback;

  if (
    base?.type === 'ArrayValueNode' &&
    incoming?.type === 'ArrayValueNode' &&
    Array.isArray(value)
  ) {
    const baseElements = [...base.elements];
    const incomingElements = [...incoming.elements];
    const usedBase = new Set<number>();
    const usedIncoming = new Set<number>();
    return deepFreeze<ArrayValueNode>({
      ...deepClone(precedence === 'incoming' ? incoming : base),
      elements: value.map((item) => {
        const findBase = (): number =>
          baseElements.findIndex(
            (element, index) =>
              !usedBase.has(index) &&
              JSON.stringify(valueNodeToValue(element.value)) === JSON.stringify(item)
          );
        const findIncoming = (): number =>
          incomingElements.findIndex(
            (element, index) =>
              !usedIncoming.has(index) &&
              JSON.stringify(valueNodeToValue(element.value)) === JSON.stringify(item)
          );
        const sourceOrder =
          precedence === 'incoming'
            ? (['incoming', 'base'] as const)
            : (['base', 'incoming'] as const);
        for (const source of sourceOrder) {
          const matchIndex = source === 'base' ? findBase() : findIncoming();
          if (matchIndex < 0) continue;
          if (source === 'base') {
            usedBase.add(matchIndex);
            return deepClone(baseElements[matchIndex]!);
          }
          usedIncoming.add(matchIndex);
          return deepClone(incomingElements[matchIndex]!);
        }
        const node = createValueNode(item, selectedFallback.loc);
        return { type: 'ArrayElementNode', value: node, loc: node.loc };
      }),
    });
  }

  if (
    base?.type === 'ObjectValueNode' &&
    incoming?.type === 'ObjectValueNode' &&
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  ) {
    const record = value as Record<string, Value>;
    const baseFields = new Map(base.fields.map((field) => [field.name, field]));
    const incomingFields = new Map(incoming.fields.map((field) => [field.name, field]));
    const baseNames = new Set(baseFields.keys());
    const incomingNames = new Set(incomingFields.keys());
    const selectedLayers = new Map<string, 'base' | 'incoming'>();
    for (const name of Object.keys(record)) {
      selectedLayers.set(
        name,
        precedence === 'incoming'
          ? incomingNames.has(name)
            ? 'incoming'
            : 'base'
          : baseNames.has(name)
            ? 'base'
            : 'incoming'
      );
    }
    const taggedFields = [
      ...base.fields.map((field) => ({ field, layer: 'base' as const })),
      ...incoming.fields.map((field) => ({ field, layer: 'incoming' as const })),
    ];
    const lastIndexes = new Map<string, number>();
    for (const [index, tagged] of taggedFields.entries()) {
      if (selectedLayers.get(tagged.field.name) === tagged.layer) {
        lastIndexes.set(tagged.field.name, index);
      }
    }
    const fields: ObjectFieldNode[] = [];
    const emitted = new Set<string>();
    for (const [index, tagged] of taggedFields.entries()) {
      const { field, layer } = tagged;
      const fieldValue = record[field.name];
      if (fieldValue === undefined || selectedLayers.get(field.name) !== layer) {
        continue;
      }
      fields.push(
        lastIndexes.get(field.name) === index
          ? {
              ...deepClone(field),
              value: mergeValueNodeLocations(
                baseFields.get(field.name)?.value,
                incomingFields.get(field.name)?.value,
                fieldValue,
                precedence,
                field.value
              ),
            }
          : deepClone(field)
      );
      emitted.add(field.name);
    }
    for (const [name, fieldValue] of Object.entries(record)) {
      if (emitted.has(name)) continue;
      const fieldNode = createValueNode(fieldValue, selectedFallback.loc);
      fields.push({
        type: 'ObjectFieldNode',
        name,
        value: fieldNode,
        loc: fieldNode.loc,
      });
    }
    return deepFreeze<ObjectValueNode>({
      ...deepClone(precedence === 'incoming' ? incoming : base),
      fields,
    });
  }

  const baseValue = base ? valueNodeToValue(base) : undefined;
  const incomingValue = incoming ? valueNodeToValue(incoming) : undefined;
  const baseMatches = base && JSON.stringify(baseValue) === JSON.stringify(value);
  const incomingMatches = incoming && JSON.stringify(incomingValue) === JSON.stringify(value);
  const selected =
    baseMatches && incomingMatches
      ? precedence === 'incoming'
        ? incoming
        : base
      : incomingMatches
        ? incoming
        : baseMatches
          ? base
          : selectedFallback;
  return reconcileValueNode(selected, value);
}

export function reconcileBlockBody(body: BlockBody, content: BlockContent): BlockBody {
  const rawProperties =
    content.type === 'ObjectContent' || content.type === 'MixedContent' ? content.properties : {};
  const text = contentText(content);
  const hasListEntries = body.entries.some((entry) => entry.type === 'ListEntry');
  const hasExplicitItemsField = body.entries.some(
    (entry) => entry.type === 'FieldEntry' && entry.name === 'items'
  );
  const hasSyntheticItems =
    hasListEntries &&
    !hasExplicitItemsField &&
    (content.type === 'ObjectContent' || content.type === 'MixedContent') &&
    !content.listItems &&
    Array.isArray(rawProperties['items']);
  const properties = { ...rawProperties };
  if (hasSyntheticItems) delete properties['items'];
  const syntheticListItems =
    hasSyntheticItems && Array.isArray(rawProperties['items']) ? rawProperties['items'] : [];
  const retainedListItems =
    hasExplicitItemsField &&
    (content.type === 'ObjectContent' || content.type === 'MixedContent') &&
    !content.listItems
      ? body.entries
          .filter((entry): entry is ListEntry => entry.type === 'ListEntry')
          .map((entry) => valueNodeToValue(entry.value))
      : [];
  const listItems =
    content.type === 'ArrayContent'
      ? content.elements
      : content.type === 'ObjectContent' || content.type === 'MixedContent'
        ? (content.listItems ?? (hasSyntheticItems ? syntheticListItems : retainedListItems))
        : [];
  const inlineUses =
    content.type === 'ObjectContent' || content.type === 'MixedContent'
      ? (content.inlineUses ?? [])
      : [];
  const existingText =
    body.legacyText ??
    textFromEntries(body.entries.filter((entry): entry is TextEntry => entry.type === 'TextEntry'));
  const textChanged = text?.value !== existingText?.value;
  const lastFieldIndexes = new Map<string, number>();
  for (const [index, entry] of body.entries.entries()) {
    if (entry.type === 'FieldEntry') lastFieldIndexes.set(entry.name, index);
  }
  const entries: BlockEntry[] = [];
  const sourceListEntries = body.entries
    .map((entry, bodyIndex) => ({ entry, bodyIndex }))
    .filter(
      (candidate): candidate is { entry: ListEntry; bodyIndex: number } =>
        candidate.entry.type === 'ListEntry'
    );
  const usedListSources = new Set<number>();
  const listAssignments: Array<{ targetIndex: number; sourceIndex?: number }> = listItems.map(
    (value, targetIndex) => {
      const valueKey = JSON.stringify(value);
      const sourceIndex = sourceListEntries.findIndex(
        (candidate, candidateIndex) =>
          !usedListSources.has(candidateIndex) &&
          JSON.stringify(valueNodeToValue(candidate.entry.value)) === valueKey
      );
      if (sourceIndex >= 0) {
        usedListSources.add(sourceIndex);
        return { targetIndex, sourceIndex };
      }
      return { targetIndex };
    }
  );
  for (const assignment of listAssignments) {
    if (assignment.sourceIndex !== undefined) continue;
    const preferredSource = assignment.targetIndex;
    const sourceIndex =
      preferredSource < sourceListEntries.length && !usedListSources.has(preferredSource)
        ? preferredSource
        : sourceListEntries.findIndex((_, index) => !usedListSources.has(index));
    if (sourceIndex >= 0) {
      usedListSources.add(sourceIndex);
      assignment.sourceIndex = sourceIndex;
    }
  }
  let previousSourceIndex = -1;
  const hasMonotonicListSources = listAssignments.every((assignment) => {
    if (assignment.sourceIndex === undefined) return true;
    if (assignment.sourceIndex <= previousSourceIndex) return false;
    previousSourceIndex = assignment.sourceIndex;
    return true;
  });
  const listAssignmentByBodyIndex = new Map<number, (typeof listAssignments)[number]>();
  if (hasMonotonicListSources) {
    for (const assignment of listAssignments) {
      if (assignment.sourceIndex !== undefined) {
        listAssignmentByBodyIndex.set(
          sourceListEntries[assignment.sourceIndex]!.bodyIndex,
          assignment
        );
      }
    }
  } else {
    for (const [index, assignment] of listAssignments.entries()) {
      const outputSlot = sourceListEntries[index];
      if (outputSlot) listAssignmentByBodyIndex.set(outputSlot.bodyIndex, assignment);
    }
  }
  const usedLists = new Set<number>();
  const usedUses = new Set<number>();
  let emittedText = false;

  for (const [index, entry] of body.entries.entries()) {
    if (entry.type === 'PresentationEntry') {
      entries.push(deepClone(entry));
      continue;
    }
    if (entry.type === 'FieldEntry') {
      if (!Object.hasOwn(properties, entry.name)) continue;
      entries.push(
        lastFieldIndexes.get(entry.name) === index
          ? {
              ...deepClone(entry),
              value: reconcileValueNode(entry.value, properties[entry.name]!),
            }
          : deepClone(entry)
      );
      continue;
    }
    if (entry.type === 'TextEntry') {
      if (text && (!textChanged || !emittedText)) {
        entries.push(
          textChanged
            ? {
                type: 'TextEntry',
                text: text.value,
                loc: deepClone(entry.loc),
              }
            : deepClone(entry)
        );
        emittedText = true;
      }
      continue;
    }
    if (entry.type === 'ListEntry') {
      const assignment = listAssignmentByBodyIndex.get(index);
      if (assignment) {
        const value = listItems[assignment.targetIndex]!;
        const sourceEntry =
          assignment.sourceIndex !== undefined
            ? sourceListEntries[assignment.sourceIndex]!.entry
            : entry;
        usedLists.add(assignment.targetIndex);
        entries.push({
          ...deepClone(sourceEntry),
          value: reconcileValueNode(sourceEntry.value, value),
        });
      }
      continue;
    }
    const useKey = JSON.stringify(entry.declaration);
    const matchIndex = inlineUses.findIndex(
      (declaration, useIndex) => !usedUses.has(useIndex) && JSON.stringify(declaration) === useKey
    );
    if (matchIndex >= 0) {
      usedUses.add(matchIndex);
      entries.push(deepClone(entry));
    }
  }

  for (const [name, value] of Object.entries(properties)) {
    if (!lastFieldIndexes.has(name)) {
      const valueNode = createValueNode(value, content.loc);
      entries.push({
        type: 'FieldEntry',
        name,
        value: valueNode,
        loc: valueNode.loc,
      });
    }
  }
  for (const [index, value] of listItems.entries()) {
    if (!usedLists.has(index)) {
      const valueNode = createValueNode(value, content.loc);
      entries.push({
        type: 'ListEntry',
        value: valueNode,
        loc: valueNode.loc,
      });
    }
  }
  for (const [index, declaration] of inlineUses.entries()) {
    if (!usedUses.has(index)) {
      entries.push({
        type: 'InlineUseEntry',
        declaration: deepClone(declaration),
        loc: deepClone(declaration.loc),
      });
    }
  }
  if (text && !emittedText) {
    entries.push({
      type: 'TextEntry',
      text: text.value,
      loc: deepClone(text.loc),
    });
  }

  return createBlockBody(entries, body.loc, {
    projection: content.type,
    ...(text ? { text } : {}),
  });
}

export function prepareBlockContentForMerge(
  body: BlockBody | undefined,
  content: BlockContent
): BlockContent {
  if (!body || (content.type !== 'ObjectContent' && content.type !== 'MixedContent')) {
    return deepClone(content) as BlockContent;
  }
  const reconciled = reconcileBlockBody(body, content);
  const hasExplicitItemsField = reconciled.entries.some(
    (entry) => entry.type === 'FieldEntry' && entry.name === 'items'
  );
  const listItems = reconciled.entries
    .filter((entry): entry is ListEntry => entry.type === 'ListEntry')
    .map((entry) => valueNodeToValue(entry.value));
  if (
    hasExplicitItemsField ||
    content.listItems ||
    listItems.length === 0 ||
    !Array.isArray(content.properties['items'])
  ) {
    return deepClone(content) as BlockContent;
  }
  const prepared = deepClone(content) as ObjectContent | MixedContent;
  delete prepared.properties['items'];
  prepared.listItems = listItems;
  return prepared;
}

export function composeBlockBodies(
  baseBody: BlockBody | undefined,
  incomingBody: BlockBody | undefined,
  baseContent: BlockContent,
  incomingContent: BlockContent,
  mergedContent: BlockContent,
  blockName?: string
): BlockBody {
  const base = baseBody ?? blockContentToBody(baseContent);
  const incoming = incomingBody ?? blockContentToBody(incomingContent);
  const text = contentText(mergedContent);
  const incomingFieldNames = new Set(
    incoming.entries
      .filter((entry): entry is FieldEntry => entry.type === 'FieldEntry')
      .map((entry) => entry.name)
  );
  const baseFields = new Map(
    base.entries
      .filter((entry): entry is FieldEntry => entry.type === 'FieldEntry')
      .map((entry) => [entry.name, entry])
  );
  const mergedProperties =
    mergedContent.type === 'ObjectContent' || mergedContent.type === 'MixedContent'
      ? mergedContent.properties
      : {};
  const presentation = selectPresentationEntries(
    base.entries,
    incoming.entries,
    'incoming',
    blockName
  );
  const selectedBasePresentation = new Set(presentation.base);
  const selectedIncomingPresentation = new Set(presentation.incoming);
  const baseEntries = base.entries.filter(
    (entry) =>
      (entry.type !== 'PresentationEntry' || selectedBasePresentation.has(entry)) &&
      (entry.type !== 'FieldEntry' || !incomingFieldNames.has(entry.name))
  );
  const lastIncomingIndexes = new Map<string, number>();
  for (const [index, entry] of incoming.entries.entries()) {
    if (entry.type === 'FieldEntry') lastIncomingIndexes.set(entry.name, index);
  }
  const incomingEntries = incoming.entries
    .map((entry, index) => ({ entry, index }))
    .filter(
      ({ entry }) => entry.type !== 'PresentationEntry' || selectedIncomingPresentation.has(entry)
    )
    .map(({ entry, index }) => {
      const baseField = entry.type === 'FieldEntry' ? baseFields.get(entry.name) : undefined;
      const mergedValue = entry.type === 'FieldEntry' ? mergedProperties[entry.name] : undefined;
      return baseField &&
        entry.type === 'FieldEntry' &&
        lastIncomingIndexes.get(entry.name) === index &&
        mergedValue !== undefined
        ? {
            ...deepClone(entry),
            value: mergeValueNodeLocations(
              baseField.value,
              entry.value,
              mergedValue,
              'incoming',
              entry.value
            ),
          }
        : deepClone(entry);
    });
  return reconcileBlockBody(
    createBlockBody([...baseEntries.map(deepClone), ...incomingEntries], mergedContent.loc, {
      projection: mergedContent.type,
      ...(text ? { text } : {}),
    }),
    mergedContent
  );
}

function blockContentToValue(content: BlockContent): Value {
  if (content.type === 'TextContent') return content.value;
  if (content.type === 'ArrayContent') return deepClone(content.elements);
  if (content.type === 'MixedContent') {
    return content.text || content.listItems || content.inlineUses
      ? (deepClone(content) as unknown as Value)
      : deepClone(content.properties);
  }
  return deepClone(content.properties);
}

function blockBodyToValueNode(body: BlockBody, content: BlockContent): ValueNode {
  const value = blockContentToValue(content);
  const fallback = createValueNode(value, body.loc);
  if (fallback.type === 'ArrayValueNode') {
    const listEntries = body.entries.filter(
      (entry): entry is ListEntry => entry.type === 'ListEntry'
    );
    if (listEntries.length === fallback.elements.length) {
      return {
        ...fallback,
        elements: listEntries.map((entry) => ({
          type: 'ArrayElementNode',
          value: deepClone(entry.value),
          loc: deepClone(entry.loc),
        })),
      };
    }
  }
  if (fallback.type === 'ObjectValueNode') {
    const bodyFields = new Map(
      body.entries
        .filter((entry): entry is FieldEntry => entry.type === 'FieldEntry')
        .map((entry) => [entry.name, entry])
    );
    if (content.type === 'MixedContent') {
      const textEntry = body.entries.find(
        (entry): entry is TextEntry => entry.type === 'TextEntry'
      );
      const listEntries = body.entries.filter(
        (entry): entry is ListEntry => entry.type === 'ListEntry'
      );
      const useEntries = body.entries.filter((entry) => entry.type === 'InlineUseEntry');
      return deepFreeze<ObjectValueNode>({
        ...fallback,
        fields: fallback.fields.map((field) => {
          if (field.name === 'properties' && field.value.type === 'ObjectValueNode') {
            return {
              ...field,
              value: {
                ...field.value,
                fields: field.value.fields.map((property) => {
                  const bodyField = bodyFields.get(property.name);
                  return bodyField
                    ? {
                        type: 'ObjectFieldNode',
                        name: property.name,
                        value: deepClone(bodyField.value),
                        loc: deepClone(bodyField.loc),
                      }
                    : property;
                }),
              },
            };
          }
          if (field.name === 'text' && content.text && textEntry) {
            return {
              ...field,
              value: createValueNode(content.text, textEntry.loc),
              loc: deepClone(textEntry.loc),
            };
          }
          if (
            field.name === 'listItems' &&
            field.value.type === 'ArrayValueNode' &&
            listEntries.length === field.value.elements.length
          ) {
            return {
              ...field,
              value: {
                ...field.value,
                elements: listEntries.map((entry) => ({
                  type: 'ArrayElementNode',
                  value: deepClone(entry.value),
                  loc: deepClone(entry.loc),
                })),
              },
              loc: deepClone(listEntries[0]?.loc ?? field.loc),
            };
          }
          if (field.name === 'inlineUses' && useEntries.length > 0) {
            return { ...field, loc: deepClone(useEntries[0]!.loc) };
          }
          return field;
        }),
      });
    }
    return {
      ...fallback,
      fields: fallback.fields.map((field) => {
        const bodyField = bodyFields.get(field.name);
        return bodyField
          ? {
              type: 'ObjectFieldNode',
              name: field.name,
              value: deepClone(bodyField.value),
              loc: deepClone(bodyField.loc),
            }
          : field;
      }),
    };
  }
  const textEntry = body.entries.find((entry): entry is TextEntry => entry.type === 'TextEntry');
  return textEntry ? createValueNode(value, textEntry.loc) : fallback;
}

function mergeValueNodeAtPath(
  base: ValueNode,
  incoming: ValueNode,
  path: readonly string[],
  value: Value,
  original?: ValueNode
): ValueNode {
  const current = path[0];
  if (
    !current &&
    base.type === 'ObjectValueNode' &&
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    (value as Record<string, Value>)['type'] === 'MixedContent'
  ) {
    const isMixedNode = (node: ObjectValueNode): boolean => {
      const typeField = node.fields.find((field) => field.name === 'type');
      return typeField ? valueNodeToValue(typeField.value) === 'MixedContent' : false;
    };
    const wrapProperties = (node: ObjectValueNode): ObjectValueNode => ({
      type: 'ObjectValueNode',
      fields: [
        {
          type: 'ObjectFieldNode',
          name: 'properties',
          value: node,
          loc: deepClone(node.loc),
        },
      ],
      loc: deepClone(node.loc),
    });
    const baseNode = isMixedNode(base) ? base : wrapProperties(base);
    const incomingNode =
      incoming.type === 'ObjectValueNode'
        ? isMixedNode(incoming)
          ? incoming
          : wrapProperties(incoming)
        : {
            type: 'ObjectValueNode' as const,
            fields: [
              {
                type: 'ObjectFieldNode' as const,
                name: 'text',
                value: createValueNode((value as Record<string, Value>)['text']!, incoming.loc),
                loc: deepClone(incoming.loc),
              },
            ],
            loc: deepClone(incoming.loc),
          };
    return mergeValueNodeLocations(baseNode, incomingNode, value, 'incoming', incomingNode);
  }
  if (!current || base.type !== 'ObjectValueNode' || typeof value !== 'object' || value === null) {
    return mergeValueNodeLocations(base, incoming, value, 'incoming', incoming);
  }
  if (Array.isArray(value)) {
    return mergeValueNodeLocations(base, incoming, value, 'incoming', incoming);
  }

  const record = value as Record<string, Value>;
  const targetValue = record[current];
  if (targetValue === undefined) return base;
  const lastIndexes = new Map<string, number>();
  for (const [index, field] of base.fields.entries()) {
    lastIndexes.set(field.name, index);
  }
  const targetIndex = lastIndexes.get(current);
  const targetField = targetIndex === undefined ? undefined : base.fields[targetIndex];
  const originalFields =
    original?.type === 'ObjectValueNode'
      ? new Map(original.fields.map((field) => [field.name, field]))
      : new Map<string, ObjectFieldNode>();
  const originalTarget = originalFields.get(current);
  const targetNode = targetField?.value ?? createValueNode(targetValue, incoming.loc);
  const nextValue = mergeValueNodeAtPath(
    targetNode,
    incoming,
    path.slice(1),
    targetValue,
    originalTarget?.value
  );
  const fields: ObjectFieldNode[] = [];
  const emitted = new Set<string>();
  for (const [index, field] of base.fields.entries()) {
    if (!Object.hasOwn(record, field.name)) continue;
    fields.push(
      field.name === current && targetIndex === index
        ? {
            ...deepClone(field),
            value: nextValue,
            loc: deepClone(originalTarget ? field.loc : incoming.loc),
          }
        : deepClone(field)
    );
    emitted.add(field.name);
  }
  for (const [name, fieldValue] of Object.entries(record)) {
    if (emitted.has(name)) continue;
    const fieldNode = name === current ? nextValue : createValueNode(fieldValue, base.loc);
    fields.push({
      type: 'ObjectFieldNode',
      name,
      value: fieldNode,
      loc: deepClone(name === current ? incoming.loc : fieldNode.loc),
    });
  }
  return {
    ...deepClone(base),
    fields,
  };
}

export function reconcileBlockBodyAtPath(
  baseBody: BlockBody | undefined,
  incomingBody: BlockBody | undefined,
  baseContent: BlockContent,
  incomingContent: BlockContent,
  mergedContent: BlockContent,
  path: readonly string[]
): BlockBody {
  const base = baseBody ?? blockContentToBody(baseContent);
  const rootName = path[0];
  const originalRoot =
    rootName === undefined
      ? undefined
      : [...base.entries]
          .reverse()
          .find(
            (entry): entry is FieldEntry => entry.type === 'FieldEntry' && entry.name === rootName
          );
  const reconciled = reconcileBlockBody(base, mergedContent);
  if (
    path.length === 0 ||
    (mergedContent.type !== 'ObjectContent' && mergedContent.type !== 'MixedContent')
  ) {
    return reconciled;
  }
  if (!rootName) return reconciled;
  const rootValue = mergedContent.properties[rootName];
  if (rootValue === undefined) return reconciled;
  const incoming = incomingBody ?? blockContentToBody(incomingContent);
  const incomingNode = blockBodyToValueNode(incoming, incomingContent);
  let lastRootIndex = -1;
  for (const [index, entry] of reconciled.entries.entries()) {
    if (entry.type === 'FieldEntry' && entry.name === rootName) {
      lastRootIndex = index;
    }
  }
  return createBlockBody(
    reconciled.entries.map((entry, index) =>
      entry.type === 'FieldEntry' && entry.name === rootName && index === lastRootIndex
        ? {
            ...deepClone(entry),
            value: mergeValueNodeAtPath(
              entry.value,
              incomingNode,
              path.slice(1),
              rootValue,
              originalRoot?.value
            ),
            loc: deepClone(originalRoot ? entry.loc : incomingNode.loc),
          }
        : deepClone(entry)
    ),
    reconciled.loc,
    {
      projection: reconciled.legacyProjection,
      ...(reconciled.legacyText ? { text: reconciled.legacyText } : {}),
    }
  );
}

export function createCanonicalBlock(
  name: string,
  body: BlockBody,
  loc: SourceLocation
): CanonicalBlock {
  const canonicalBody = deepClone(body) as BlockBody;
  return deepFreeze<CanonicalBlock>({
    type: 'CanonicalBlock',
    name,
    body: canonicalBody,
    content: blockBodyToContent(canonicalBody),
    loc: deepClone(loc),
  });
}

export function updateCanonicalBlockBody(block: CanonicalBlock, body: BlockBody): CanonicalBlock {
  const requestedProjection = body.legacyProjection ?? block.body.legacyProjection;
  const contentEntries = body.entries.filter((entry) => entry.type !== 'PresentationEntry');
  const projection =
    requestedProjection === 'ArrayContent' &&
    !contentEntries.every((entry) => entry.type === 'ListEntry')
      ? undefined
      : requestedProjection === 'TextContent' &&
          !contentEntries.every((entry) => entry.type === 'TextEntry')
        ? undefined
        : requestedProjection;
  return createCanonicalBlock(
    block.name,
    createBlockBody(body.entries, body.loc, {
      projection,
      ...(body.legacyText ? { text: body.legacyText } : {}),
    }),
    block.loc
  );
}

export function createCanonicalExtendBlock(
  targetPath: string,
  body: BlockBody,
  replacements: readonly ReplaceModifier[] | undefined,
  loc: SourceLocation
): CanonicalExtendBlock {
  const canonicalBody = deepClone(body) as BlockBody;
  const extension: CanonicalExtendBlock = {
    type: 'CanonicalExtendBlock',
    targetPath,
    body: canonicalBody,
    content: blockBodyToContent(canonicalBody),
    loc: deepClone(loc),
  };
  if (replacements && replacements.length > 0) {
    return deepFreeze({
      ...extension,
      replacements: deepClone(replacements),
    });
  }
  return deepFreeze(extension);
}

export function createCanonicalOverrideBlock(
  targetPath: string,
  replacement: OverrideReplacement,
  loc: SourceLocation
): CanonicalOverrideBlock {
  return deepFreeze({
    type: 'CanonicalOverrideBlock',
    targetPath,
    replacement: deepClone(replacement),
    loc: deepClone(loc),
  });
}

export function createCanonicalProgram(options: CanonicalProgramOptions): CanonicalProgram {
  const operations = deepClone(options.operations) as ProgramOperation[];
  const inherit = operations.find(
    (operation) => operation.type === 'InheritOperation'
  )?.declaration;
  const uses = operations
    .filter((operation) => operation.type === 'UseOperation')
    .map((operation) => operation.declaration);
  const blocks = operations
    .filter((operation) => operation.type === 'BlockOperation')
    .map((operation) => operation.block);
  const extensions = operations
    .filter((operation) => operation.type === 'ExtendOperation')
    .map((operation) => operation.extension);
  const overrides = operations
    .filter((operation) => operation.type === 'OverrideOperation')
    .map((operation) => operation.override);

  const program: CanonicalProgram = {
    type: 'CanonicalProgram',
    uses,
    blocks,
    extends: extensions,
    overrides,
    operations,
    loc: deepClone(options.loc),
  };
  return deepFreeze({
    ...program,
    ...(options.meta ? { meta: deepClone(options.meta) } : {}),
    ...(inherit ? { inherit } : {}),
    ...(options.agentProvenance ? { agentProvenance: deepClone(options.agentProvenance) } : {}),
    ...(options.syntaxFeatures ? { syntaxFeatures: deepClone(options.syntaxFeatures) } : {}),
  });
}

export function updateCanonicalProgramOperations(
  program: CanonicalProgram,
  operations: readonly ProgramOperation[]
): CanonicalProgram {
  return createCanonicalProgram({
    ...(program.meta ? { meta: program.meta } : {}),
    operations,
    ...(program.agentProvenance ? { agentProvenance: program.agentProvenance } : {}),
    ...(program.syntaxFeatures ? { syntaxFeatures: program.syntaxFeatures } : {}),
    loc: program.loc,
  });
}

export function isCanonicalProgram(program: ProgramInput): program is CanonicalProgram {
  return program.type === 'CanonicalProgram';
}

export function isCanonicalBlock(block: BlockInput): block is CanonicalBlock {
  return block.type === 'CanonicalBlock';
}

function normalizeBlock(block: Block): CanonicalBlock {
  const body = block.canonicalBody
    ? reconcileBlockBody(block.canonicalBody, block.content)
    : blockContentToBody(block.content);
  return createCanonicalBlock(block.name, body, block.loc);
}

function normalizeExtension(extension: ExtendBlock): CanonicalExtendBlock {
  const body = extension.canonicalBody
    ? reconcileBlockBody(extension.canonicalBody, extension.content)
    : blockContentToBody(extension.content);
  return createCanonicalExtendBlock(
    extension.targetPath,
    body,
    extension.replacements,
    extension.loc
  );
}

function normalizeOverride(override: OverrideBlock): CanonicalOverrideBlock {
  return createCanonicalOverrideBlock(override.targetPath, override.replacement, override.loc);
}

export function normalizeProgram(input: ProgramInput): CanonicalProgram {
  if (isCanonicalProgram(input)) {
    return createCanonicalProgram({
      ...(input.meta ? { meta: input.meta } : {}),
      operations: input.operations,
      ...(input.agentProvenance ? { agentProvenance: input.agentProvenance } : {}),
      ...(input.syntaxFeatures ? { syntaxFeatures: input.syntaxFeatures } : {}),
      loc: input.loc,
    });
  }

  const operations: ProgramOperation[] = [];
  if (input.inherit) {
    operations.push({
      type: 'InheritOperation',
      declaration: deepClone(input.inherit),
      sourceLayerId: input.inherit.loc.file,
      loc: deepClone(input.inherit.loc),
    });
  }
  for (const declaration of input.uses) {
    operations.push({
      type: 'UseOperation',
      declaration: deepClone(declaration),
      sourceLayerId: declaration.loc.file,
      loc: deepClone(declaration.loc),
    });
  }
  for (const block of input.blocks) {
    operations.push({
      type: 'BlockOperation',
      block: normalizeBlock(block),
      sourceLayerId: block.loc.file,
      loc: deepClone(block.loc),
    });
  }
  for (const extension of input.extends) {
    operations.push({
      type: 'ExtendOperation',
      extension: normalizeExtension(extension),
      sourceLayerId: extension.loc.file,
      loc: deepClone(extension.loc),
    });
  }
  for (const override of input.overrides ?? []) {
    operations.push({
      type: 'OverrideOperation',
      override: normalizeOverride(override),
      sourceLayerId: override.loc.file,
      loc: deepClone(override.loc),
    });
  }
  // Keep loop formatting aligned with main's canonical formatter output.
  // prettier-ignore
  for (let start = 0; start < operations.length; ) {
    let end = start + 1;
    while (
      end < operations.length &&
      operations[end]!.sourceLayerId === operations[start]!.sourceLayerId
    ) {
      end += 1;
    }
    const sourceRun = operations.slice(start, end);
    sourceRun.sort((left, right) => (left.loc.offset ?? 0) - (right.loc.offset ?? 0));
    operations.splice(start, sourceRun.length, ...sourceRun);
    start = end;
  }
  return createCanonicalProgram({
    meta: input.meta,
    operations,
    ...(input.agentProvenance ? { agentProvenance: input.agentProvenance } : {}),
    syntaxFeatures: input.syntaxFeatures,
    loc: input.loc,
  });
}

export function getCanonicalBlocks(input: ProgramInput): readonly CanonicalBlock[] {
  return normalizeProgram(input).blocks;
}

export function toLegacyBlock(block: CanonicalBlock, options: LegacyProjectionOptions = {}): Block {
  const legacy: Block = {
    type: 'Block',
    name: block.name,
    content: blockBodyToContent(block.body),
    loc: deepClone(block.loc),
  };
  if (options.preserveCanonicalBody) {
    legacy.canonicalBody = deepClone(block.body) as BlockBody;
  }
  return legacy;
}

export function toLegacyProgram(
  program: CanonicalProgram,
  options: LegacyProjectionOptions = {}
): Program {
  const legacy: Program = {
    type: 'Program',
    uses: program.uses.map((declaration) => deepClone(declaration) as UseDeclaration),
    blocks: program.blocks.map((block) => toLegacyBlock(block, options)),
    extends: program.extends.map((extension) => {
      const result: ExtendBlock = {
        type: 'ExtendBlock',
        targetPath: extension.targetPath,
        content: blockBodyToContent(extension.body),
        loc: deepClone(extension.loc),
      };
      if (options.preserveCanonicalBody) {
        result.canonicalBody = deepClone(extension.body) as BlockBody;
      }
      if (extension.replacements) {
        result.replacements = extension.replacements.map(
          (replacement) => deepClone(replacement) as ReplaceModifier
        );
      }
      return result;
    }),
    overrides: (program.overrides ?? []).map((override) => ({
      type: 'OverrideBlock',
      targetPath: override.targetPath,
      replacement: deepClone(override.replacement) as OverrideReplacement,
      loc: deepClone(override.loc),
    })),
    loc: deepClone(program.loc),
  };
  if (program.meta) legacy.meta = deepClone(program.meta) as MetaBlock;
  if (program.inherit) {
    legacy.inherit = deepClone(program.inherit) as InheritDeclaration;
  }
  if (program.syntaxFeatures) {
    legacy.syntaxFeatures = program.syntaxFeatures.map(
      (usage) => deepClone(usage) as SyntaxFeatureUsage
    );
  }
  if (program.agentProvenance) {
    legacy.agentProvenance = program.agentProvenance.map(
      (entry) => deepClone(entry) as AgentProvenance
    );
  }
  return legacy;
}

export function getBlockProperties(block: BlockInput): Record<string, Value> {
  const content = isCanonicalBlock(block) ? blockBodyToContent(block.body) : block.content;
  if (content.type === 'ObjectContent' || content.type === 'MixedContent') {
    return deepClone(content.properties);
  }
  return {};
}

export function getBlockText(block: BlockInput): string | undefined {
  const content = isCanonicalBlock(block) ? blockBodyToContent(block.body) : block.content;
  if (content.type === 'TextContent') return content.value;
  if (content.type === 'MixedContent') return content.text?.value;
  return undefined;
}

export function getBlockItems(block: BlockInput): Value[] {
  const content = isCanonicalBlock(block) ? blockBodyToContent(block.body) : block.content;
  if (content.type === 'ArrayContent') return deepClone(content.elements);
  if ((content.type === 'ObjectContent' || content.type === 'MixedContent') && content.listItems) {
    return deepClone(content.listItems);
  }
  if (
    (content.type === 'ObjectContent' || content.type === 'MixedContent') &&
    Array.isArray(content.properties['items'])
  ) {
    return deepClone(content.properties['items']);
  }
  return [];
}

export function getInlineUses(block: BlockInput): InlineUseDeclaration[] {
  const content = isCanonicalBlock(block) ? blockBodyToContent(block.body) : block.content;
  if (content.type !== 'ObjectContent' && content.type !== 'MixedContent') return [];
  return (content.inlineUses ?? []).map((declaration) => deepClone(declaration));
}
