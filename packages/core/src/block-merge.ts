import type {
  ArrayContent,
  Block,
  BlockBody,
  BlockContent,
  BlockEntry,
  MixedContent,
  ObjectContent,
  TextContent,
  Value,
} from './types/index.js';
import { deepClone, isPlainObject } from './utils/index.js';
import {
  blockBodyToContent,
  blockContentToBody,
  createBlockBody,
  createValueNode,
  mergeValueNodeLocations,
  reconcileBlockBody,
  valueNodeToValue,
} from './canonical-ast.js';
import { selectPresentationEntries } from './presentation.js';

export interface BlockMergePolicy {
  readonly valuePrecedence: 'base' | 'incoming';
  readonly typeMismatchPrecedence: 'base' | 'incoming';
}

export interface BlockCollectionMergePolicy {
  readonly content: BlockMergePolicy;
  readonly outputOrder: 'base' | 'incoming';
}

export const INHERITANCE_MERGE_POLICY: BlockMergePolicy = {
  valuePrecedence: 'incoming',
  typeMismatchPrecedence: 'incoming',
};

export const IMPORT_MERGE_POLICY: BlockMergePolicy = {
  valuePrecedence: 'base',
  typeMismatchPrecedence: 'incoming',
};

function mergeTextContent(base: TextContent, incoming: TextContent): TextContent {
  const baseValue = base.value.trim();
  const incomingValue = incoming.value.trim();

  if (baseValue === incomingValue || incomingValue.includes(baseValue)) {
    return { ...deepClone(incoming), value: incomingValue };
  }
  if (baseValue.includes(incomingValue)) {
    return { ...deepClone(incoming), value: baseValue };
  }
  return {
    ...deepClone(incoming),
    value: `${baseValue}\n\n${incomingValue}`,
  };
}

function uniqueConcat<T>(base: readonly T[], incoming: readonly T[]): T[] {
  const seen = new Set<string>();
  const result: T[] = [];
  for (const item of [...base, ...incoming]) {
    const key = `${typeof item}:${JSON.stringify(item)}`;
    if (!seen.has(key)) {
      seen.add(key);
      result.push(deepClone(item));
    }
  }
  return result;
}

function hasSourceLocation(value: Record<string, unknown>): boolean {
  const loc = value['loc'];
  return (
    isPlainObject(loc) &&
    typeof loc['file'] === 'string' &&
    typeof loc['line'] === 'number' &&
    typeof loc['column'] === 'number'
  );
}

function hasOnlyKeys(value: Record<string, unknown>, allowed: readonly string[]): boolean {
  const allowedKeys = new Set(allowed);
  return Object.keys(value).every((key) => allowedKeys.has(key));
}

function isTextContentNode(value: Value): value is TextContent {
  return (
    isPlainObject(value) &&
    value['type'] === 'TextContent' &&
    typeof value['value'] === 'string' &&
    hasSourceLocation(value) &&
    hasOnlyKeys(value, ['type', 'value', 'loc'])
  );
}

function isTypedAstValue(value: Record<string, unknown>): boolean {
  if (!hasSourceLocation(value)) return false;
  switch (value['type']) {
    case 'TextContent':
      return typeof value['value'] === 'string' && hasOnlyKeys(value, ['type', 'value', 'loc']);
    case 'ObjectContent':
      return (
        isPlainObject(value['properties']) &&
        hasOnlyKeys(value, ['type', 'properties', 'listItems', 'inlineUses', 'loc'])
      );
    case 'MixedContent':
      return (
        isPlainObject(value['properties']) &&
        hasOnlyKeys(value, ['type', 'text', 'properties', 'listItems', 'inlineUses', 'loc'])
      );
    case 'ArrayContent':
      return Array.isArray(value['elements']) && hasOnlyKeys(value, ['type', 'elements', 'loc']);
    case 'TypeExpression':
      return (
        typeof value['kind'] === 'string' &&
        hasOnlyKeys(value, ['type', 'kind', 'params', 'constraints', 'loc'])
      );
    case 'TemplateExpression':
      return typeof value['name'] === 'string' && hasOnlyKeys(value, ['type', 'name', 'loc']);
    default:
      return false;
  }
}

function isMergeableRecord(value: Value): value is Record<string, Value> {
  if (!isPlainObject(value)) return false;
  return !isTypedAstValue(value);
}

function mergeOptionalArrays<T>(
  base: readonly T[] | undefined,
  incoming: readonly T[] | undefined
): T[] | undefined {
  if (base && incoming) return uniqueConcat(base, incoming);
  if (incoming) return [...deepClone(incoming)];
  if (base) return [...deepClone(base)];
  return undefined;
}

function mergeProperties(
  base: Record<string, Value>,
  incoming: Record<string, Value>,
  policy: BlockMergePolicy
): Record<string, Value> {
  const result = deepClone(base);
  for (const [key, incomingValue] of Object.entries(incoming)) {
    const baseValue = result[key];
    if (baseValue === undefined) {
      result[key] = deepClone(incomingValue);
    } else if (Array.isArray(baseValue) && Array.isArray(incomingValue)) {
      result[key] = uniqueConcat(baseValue, incomingValue);
    } else if (isTextContentNode(baseValue) && isTextContentNode(incomingValue)) {
      result[key] =
        policy.valuePrecedence === 'incoming' ? deepClone(incomingValue) : deepClone(baseValue);
    } else if (isMergeableRecord(baseValue) && isMergeableRecord(incomingValue)) {
      result[key] = mergeProperties(baseValue, incomingValue, policy);
    } else if (policy.valuePrecedence === 'incoming') {
      result[key] = deepClone(incomingValue);
    }
  }
  return result;
}

function mergeObjectContent(
  base: ObjectContent,
  incoming: ObjectContent,
  policy: BlockMergePolicy
): ObjectContent {
  const listItems = mergeOptionalArrays(base.listItems, incoming.listItems);
  const inlineUses = mergeOptionalArrays(base.inlineUses, incoming.inlineUses);
  return {
    ...deepClone(incoming),
    properties: mergeProperties(base.properties, incoming.properties, policy),
    ...(listItems ? { listItems } : {}),
    ...(inlineUses ? { inlineUses } : {}),
  };
}

function mergeArrayContent(base: ArrayContent, incoming: ArrayContent): ArrayContent {
  return {
    ...deepClone(incoming),
    elements: uniqueConcat(base.elements, incoming.elements),
  };
}

function mergeMixedContent(
  base: MixedContent,
  incoming: MixedContent,
  policy: BlockMergePolicy
): MixedContent {
  const listItems = mergeOptionalArrays(base.listItems, incoming.listItems);
  const inlineUses = mergeOptionalArrays(base.inlineUses, incoming.inlineUses);
  return {
    ...deepClone(incoming),
    text:
      base.text && incoming.text
        ? mergeTextContent(base.text, incoming.text)
        : deepClone(incoming.text ?? base.text),
    properties: mergeProperties(base.properties, incoming.properties, policy),
    ...(listItems ? { listItems } : {}),
    ...(inlineUses ? { inlineUses } : {}),
  };
}

/**
 * Merge legacy content through one browser-safe policy engine.
 */
export function mergeBlockContent(
  base: BlockContent,
  incoming: BlockContent,
  policy: BlockMergePolicy
): BlockContent {
  if (base.type === incoming.type) {
    switch (incoming.type) {
      case 'TextContent':
        return mergeTextContent(base as TextContent, incoming);
      case 'ObjectContent':
        return mergeObjectContent(base as ObjectContent, incoming, policy);
      case 'ArrayContent':
        return mergeArrayContent(base as ArrayContent, incoming);
      case 'MixedContent':
        return mergeMixedContent(base as MixedContent, incoming, policy);
    }
  }

  if (base.type === 'MixedContent' && incoming.type === 'TextContent') {
    return {
      ...deepClone(base),
      text: base.text ? mergeTextContent(base.text, incoming) : deepClone(incoming),
    };
  }
  if (base.type === 'TextContent' && incoming.type === 'MixedContent') {
    return {
      ...deepClone(incoming),
      text: incoming.text ? mergeTextContent(base, incoming.text) : deepClone(base),
    };
  }
  if (base.type === 'MixedContent' && incoming.type === 'ObjectContent') {
    const listItems = mergeOptionalArrays(base.listItems, incoming.listItems);
    const inlineUses = mergeOptionalArrays(base.inlineUses, incoming.inlineUses);
    return {
      ...deepClone(base),
      properties: mergeProperties(base.properties, incoming.properties, policy),
      ...(listItems ? { listItems } : {}),
      ...(inlineUses ? { inlineUses } : {}),
    };
  }
  if (base.type === 'ObjectContent' && incoming.type === 'MixedContent') {
    const listItems = mergeOptionalArrays(base.listItems, incoming.listItems);
    const inlineUses = mergeOptionalArrays(base.inlineUses, incoming.inlineUses);
    return {
      ...deepClone(incoming),
      properties: mergeProperties(base.properties, incoming.properties, policy),
      ...(listItems ? { listItems } : {}),
      ...(inlineUses ? { inlineUses } : {}),
    };
  }

  return policy.typeMismatchPrecedence === 'incoming' ? deepClone(incoming) : deepClone(base);
}

function contentText(content: BlockContent): TextContent | undefined {
  if (content.type === 'TextContent') return content;
  if (content.type === 'MixedContent') return content.text;
  return undefined;
}

function bodyProperties(body: BlockBody): Record<string, Value> {
  const properties: Record<string, Value> = {};
  for (const entry of body.entries) {
    if (entry.type === 'FieldEntry') {
      properties[entry.name] = valueNodeToValue(entry.value);
    }
  }
  return properties;
}

function bodyListValues(body: BlockBody): Value[] {
  return body.entries
    .filter((entry) => entry.type === 'ListEntry')
    .map((entry) => valueNodeToValue(entry.value));
}

function hasStructuredContent(content: BlockContent): content is ObjectContent | MixedContent {
  return content.type === 'ObjectContent' || content.type === 'MixedContent';
}

function projectMergedContent(body: BlockBody, mergedContent: BlockContent): BlockContent {
  const projected = blockBodyToContent(body);
  if (mergedContent.type === 'MixedContent' && projected.type !== 'MixedContent') {
    if (projected.type === 'TextContent') {
      return {
        type: 'MixedContent',
        text: projected,
        properties: {},
        loc: deepClone(projected.loc),
      };
    }
    if (projected.type === 'ObjectContent') {
      return {
        ...projected,
        type: 'MixedContent',
        ...(mergedContent.text ? { text: deepClone(mergedContent.text) } : {}),
      };
    }
  }
  return projected;
}

function mergeCanonicalBodies(
  base: BlockBody | undefined,
  incoming: BlockBody | undefined,
  baseContent: BlockContent,
  incomingContent: BlockContent,
  content: BlockContent,
  policy: BlockMergePolicy,
  blockName: string
): BlockBody {
  const baseBody = base ? reconcileBlockBody(base, baseContent) : blockContentToBody(baseContent);
  const incomingBody = incoming
    ? reconcileBlockBody(incoming, incomingContent)
    : blockContentToBody(incomingContent);
  const presentation = selectPresentationEntries(
    baseBody.entries,
    incomingBody.entries,
    policy.valuePrecedence,
    blockName
  );
  const selectedBasePresentation = new Set(presentation.base);
  const selectedIncomingPresentation = new Set(presentation.incoming);

  const taggedEntries = [
    ...baseBody.entries.map((entry) => ({ entry, layer: 'base' as const })),
    ...incomingBody.entries.map((entry) => ({ entry, layer: 'incoming' as const })),
  ];
  const baseProperties = bodyProperties(baseBody);
  const incomingProperties = bodyProperties(incomingBody);
  const baseListValues = bodyListValues(baseBody);
  const incomingListValues = bodyListValues(incomingBody);
  let properties: Record<string, Value> = {};
  let listValues: Value[] = [];
  if (content.type === 'ArrayContent') {
    listValues = content.elements;
  } else if (hasStructuredContent(content)) {
    if (hasStructuredContent(baseContent) && hasStructuredContent(incomingContent)) {
      properties = mergeProperties(baseProperties, incomingProperties, policy);
      listValues = uniqueConcat(baseListValues, incomingListValues);
    } else if (baseContent.type === 'MixedContent' && incomingContent.type === 'TextContent') {
      properties = baseProperties;
      listValues = baseListValues;
    } else if (baseContent.type === 'TextContent' && incomingContent.type === 'MixedContent') {
      properties = incomingProperties;
      listValues = incomingListValues;
    } else {
      const selectedLayer =
        policy.typeMismatchPrecedence === 'incoming'
          ? { body: incomingBody, content: incomingContent }
          : { body: baseBody, content: baseContent };
      if (hasStructuredContent(selectedLayer.content)) {
        properties = bodyProperties(selectedLayer.body);
        listValues = bodyListValues(selectedLayer.body);
      }
    }
  }
  const inlineUses =
    content.type === 'ObjectContent' || content.type === 'MixedContent'
      ? (content.inlineUses ?? [])
      : [];
  const text = contentText(content);
  const mergedTextValue = text?.value.trim();
  const baseTextValue = contentText(baseContent)?.value.trim();
  const incomingTextValue = contentText(incomingContent)?.value.trim();
  const selectedTextLayer =
    mergedTextValue !== undefined && mergedTextValue === incomingTextValue
      ? 'incoming'
      : mergedTextValue !== undefined && mergedTextValue === baseTextValue
        ? 'base'
        : undefined;
  const baseListKeys = new Set(
    baseBody.entries
      .filter((entry) => entry.type === 'ListEntry')
      .map((entry) => JSON.stringify(valueNodeToValue(entry.value)))
  );
  const incomingListKeys = new Set(
    incomingBody.entries
      .filter((entry) => entry.type === 'ListEntry')
      .map((entry) => JSON.stringify(valueNodeToValue(entry.value)))
  );
  const baseFieldNames = new Set(
    baseBody.entries.filter((entry) => entry.type === 'FieldEntry').map((entry) => entry.name)
  );
  const incomingFieldNames = new Set(
    incomingBody.entries.filter((entry) => entry.type === 'FieldEntry').map((entry) => entry.name)
  );
  const baseFieldNodes = new Map(
    baseBody.entries
      .filter((entry) => entry.type === 'FieldEntry')
      .map((entry) => [entry.name, entry.value])
  );
  const incomingFieldNodes = new Map(
    incomingBody.entries
      .filter((entry) => entry.type === 'FieldEntry')
      .map((entry) => [entry.name, entry.value])
  );
  const selectedFieldLayers = new Map<string, 'base' | 'incoming'>();
  for (const name of Object.keys(properties)) {
    selectedFieldLayers.set(
      name,
      policy.valuePrecedence === 'incoming'
        ? incomingFieldNames.has(name)
          ? 'incoming'
          : 'base'
        : baseFieldNames.has(name)
          ? 'base'
          : 'incoming'
    );
  }
  const lastFieldIndexes = new Map<string, number>();
  for (const [index, tagged] of taggedEntries.entries()) {
    if (
      tagged.entry.type === 'FieldEntry' &&
      selectedFieldLayers.get(tagged.entry.name) === tagged.layer
    ) {
      lastFieldIndexes.set(tagged.entry.name, index);
    }
  }

  const entries: BlockEntry[] = [];
  const usedLists = new Set<number>();
  const usedUses = new Set<number>();
  let emittedText = false;

  for (const [index, tagged] of taggedEntries.entries()) {
    const { entry, layer } = tagged;
    if (entry.type === 'PresentationEntry') {
      const selected = layer === 'base' ? selectedBasePresentation : selectedIncomingPresentation;
      if (selected.has(entry)) entries.push(deepClone(entry));
      continue;
    }
    if (entry.type === 'FieldEntry') {
      if (!Object.hasOwn(properties, entry.name) || selectedFieldLayers.get(entry.name) !== layer) {
        continue;
      }
      entries.push(
        lastFieldIndexes.get(entry.name) === index
          ? {
              ...deepClone(entry),
              value: mergeValueNodeLocations(
                baseFieldNodes.get(entry.name),
                incomingFieldNodes.get(entry.name),
                properties[entry.name]!,
                policy.valuePrecedence,
                entry.value
              ),
            }
          : deepClone(entry)
      );
      continue;
    }
    if (entry.type === 'TextEntry') {
      if (text && (!selectedTextLayer || selectedTextLayer === layer)) {
        entries.push(deepClone(entry));
        emittedText = true;
      }
      continue;
    }
    if (entry.type === 'ListEntry') {
      const valueKey = JSON.stringify(valueNodeToValue(entry.value));
      if (
        (layer === 'base' &&
          policy.valuePrecedence === 'incoming' &&
          incomingListKeys.has(valueKey)) ||
        (layer === 'incoming' && policy.valuePrecedence === 'base' && baseListKeys.has(valueKey))
      ) {
        continue;
      }
      const matchIndex = listValues.findIndex(
        (value, listIndex) => !usedLists.has(listIndex) && JSON.stringify(value) === valueKey
      );
      if (matchIndex >= 0) {
        usedLists.add(matchIndex);
        entries.push(deepClone(entry));
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
      entries.push({
        type: 'FieldEntry',
        name,
        value: createValueNode(value, content.loc),
        loc: deepClone(content.loc),
      });
    }
  }
  for (const [index, value] of listValues.entries()) {
    if (!usedLists.has(index)) {
      entries.push({
        type: 'ListEntry',
        value: createValueNode(value, content.loc),
        loc: deepClone(content.loc),
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

  return createBlockBody(entries, content.loc, {
    projection: content.type,
    ...(text ? { text } : {}),
  });
}

/**
 * Compose one matching block across source layers while preserving same-layer duplicates.
 */
export function mergeBlockCollections(
  base: readonly Block[],
  incoming: readonly Block[],
  policy: BlockCollectionMergePolicy
): Block[] {
  const primary = policy.outputOrder === 'base' ? base : incoming;
  const secondary = policy.outputOrder === 'base' ? incoming : base;
  const matchedNames = new Set<string>();
  const matchedSecondary = new Set<number>();
  const result: Block[] = [];

  for (const primaryBlock of primary) {
    const secondaryIndex = matchedNames.has(primaryBlock.name)
      ? -1
      : secondary.findIndex(
          (secondaryBlock, index) =>
            !matchedSecondary.has(index) && secondaryBlock.name === primaryBlock.name
        );
    if (secondaryIndex < 0) {
      result.push(deepClone(primaryBlock));
      continue;
    }

    const secondaryBlock = secondary[secondaryIndex]!;
    const baseBlock = policy.outputOrder === 'base' ? primaryBlock : secondaryBlock;
    const incomingBlock = policy.outputOrder === 'base' ? secondaryBlock : primaryBlock;
    const mergedContent = mergeBlockContent(
      baseBlock.content,
      incomingBlock.content,
      policy.content
    );
    const canonicalBody = mergeCanonicalBodies(
      baseBlock.canonicalBody,
      incomingBlock.canonicalBody,
      baseBlock.content,
      incomingBlock.content,
      mergedContent,
      policy.content,
      baseBlock.name
    );
    result.push({
      ...deepClone(incomingBlock),
      content: projectMergedContent(canonicalBody, mergedContent),
      canonicalBody,
    });
    matchedNames.add(primaryBlock.name);
    matchedSecondary.add(secondaryIndex);
  }

  for (const [index, secondaryBlock] of secondary.entries()) {
    if (!matchedSecondary.has(index)) {
      result.push(deepClone(secondaryBlock));
    }
  }
  return result;
}
