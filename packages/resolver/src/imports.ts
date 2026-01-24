import type {
  Program,
  UseDeclaration,
  Block,
  ObjectContent,
  BlockContent,
  TextContent,
  ArrayContent,
  MixedContent,
  Value,
} from '@promptscript/core';
import { deepClone, isTextContent } from '@promptscript/core';

/**
 * Import marker block prefix for storing imported content.
 * Used for @extend access when alias is provided.
 */
export const IMPORT_MARKER_PREFIX = '__import__';

/**
 * Resolve @use imports by merging blocks into target.
 *
 * New behavior (v0.2.0):
 * - Blocks from source are merged into target (like inheritance)
 * - If alias is provided, blocks are also stored with prefix for @extend access
 *
 * @param target - Target program AST
 * @param use - Use declaration being resolved
 * @param source - Source program AST (imported content)
 * @returns Updated program with merged blocks
 */
export function resolveUses(target: Program, use: UseDeclaration, source: Program): Program {
  // Merge blocks from source into target
  const mergedBlocks = mergeBlocks(target.blocks, source.blocks);

  // If alias is provided, also add aliased blocks for @extend access
  const aliasedBlocks: Block[] = [];
  if (use.alias) {
    const alias = use.alias;
    const markerName = `${IMPORT_MARKER_PREFIX}${alias}`;

    // Create import marker block
    const marker: Block = {
      type: 'Block',
      name: markerName,
      content: {
        type: 'ObjectContent',
        properties: {
          __source: use.path.raw,
          __blocks: source.blocks.map((b) => b.name),
        },
        loc: use.loc,
      } as ObjectContent,
      loc: use.loc,
    };

    aliasedBlocks.push(marker);

    // Store source blocks with alias prefix for @extend access
    for (const block of source.blocks) {
      aliasedBlocks.push({
        ...block,
        name: `${IMPORT_MARKER_PREFIX}${alias}.${block.name}`,
      });
    }
  }

  return {
    ...target,
    blocks: [...mergedBlocks, ...aliasedBlocks],
  };
}

/**
 * Merge two arrays of blocks, combining blocks with the same name.
 */
function mergeBlocks(target: Block[], source: Block[]): Block[] {
  const targetMap = new Map(target.map((b) => [b.name, b]));
  const result: Block[] = [];
  const seen = new Set<string>();

  // First, process target blocks (potentially merging with source)
  for (const tb of target) {
    const sb = source.find((b) => b.name === tb.name);
    if (sb) {
      result.push(mergeBlock(sb, tb));
      seen.add(tb.name);
    } else {
      result.push(deepClone(tb));
    }
  }

  // Then, add any source blocks that weren't in target
  for (const sb of source) {
    if (!seen.has(sb.name) && !targetMap.has(sb.name)) {
      result.push(deepClone(sb));
    }
  }

  return result;
}

/**
 * Merge two blocks with the same name.
 * Source content comes first, target content comes second (target wins on conflict).
 */
function mergeBlock(source: Block, target: Block): Block {
  return {
    ...target,
    content: mergeBlockContent(source.content, target.content),
  };
}

/**
 * Merge block content based on content types.
 */
function mergeBlockContent(source: BlockContent, target: BlockContent): BlockContent {
  // Same type - merge based on type
  if (source.type === target.type) {
    switch (target.type) {
      case 'TextContent':
        return mergeTextContent(source as TextContent, target);
      case 'ObjectContent':
        return mergeObjectContent(source as ObjectContent, target);
      case 'ArrayContent':
        return mergeArrayContent(source as ArrayContent, target);
      case 'MixedContent':
        return mergeMixedContent(source as MixedContent, target);
    }
  }

  // Handle MixedContent with TextContent
  if (source.type === 'MixedContent' && target.type === 'TextContent') {
    return {
      ...source,
      text: source.text ? mergeTextContent(source.text, target) : deepClone(target),
    };
  }

  if (source.type === 'TextContent' && target.type === 'MixedContent') {
    return {
      ...target,
      text: target.text ? mergeTextContent(source, target.text) : deepClone(source),
    };
  }

  // Handle MixedContent with ObjectContent
  if (source.type === 'MixedContent' && target.type === 'ObjectContent') {
    return {
      ...source,
      properties: mergeProperties(source.properties, target.properties),
    };
  }

  if (source.type === 'ObjectContent' && target.type === 'MixedContent') {
    return {
      ...target,
      properties: mergeProperties(source.properties, target.properties),
    };
  }

  // Different types - target wins
  return deepClone(target);
}

/**
 * Merge TextContent by concatenating values (source + separator + target).
 * Deduplicates identical content and removes redundant substrings.
 */
function mergeTextContent(source: TextContent, target: TextContent): TextContent {
  const sourceVal = source.value.trim();
  const targetVal = target.value.trim();

  // If identical, return just one
  if (sourceVal === targetVal) {
    return { ...target, value: targetVal };
  }

  // If target already contains source, return target only
  if (targetVal.includes(sourceVal)) {
    return { ...target, value: targetVal };
  }

  // If source already contains target, return source only
  if (sourceVal.includes(targetVal)) {
    return { ...target, value: sourceVal };
  }

  // Otherwise concatenate
  return {
    ...target,
    value: `${sourceVal}\n\n${targetVal}`,
  };
}

/**
 * Merge ObjectContent by deep merging properties.
 */
function mergeObjectContent(source: ObjectContent, target: ObjectContent): ObjectContent {
  return {
    ...target,
    properties: mergeProperties(source.properties, target.properties),
  };
}

/**
 * Merge object properties with special handling for values.
 */
function mergeProperties(
  source: Record<string, Value>,
  target: Record<string, Value>
): Record<string, Value> {
  const result: Record<string, Value> = { ...source };

  for (const [key, targetVal] of Object.entries(target)) {
    const sourceVal = result[key];
    if (sourceVal === undefined) {
      result[key] = deepCloneValue(targetVal);
    } else if (Array.isArray(targetVal) && Array.isArray(sourceVal)) {
      // Unique concat for arrays
      result[key] = uniqueConcat(sourceVal, targetVal);
    } else if (isTextContent(targetVal) && isTextContent(sourceVal)) {
      // Source (import) wins for TextContent properties (new @use overrides accumulated)
      // sourceVal is already in result from spread, so no action needed
    } else if (isTextContent(sourceVal) || isTextContent(targetVal)) {
      // Source (import) wins when one is TextContent and other is string
      // (triple-quoted vs regular string - both represent text values)
      // sourceVal is already in result from spread, so no action needed
    } else if (isPlainObject(targetVal) && isPlainObject(sourceVal)) {
      // Deep merge objects
      result[key] = mergeProperties(
        sourceVal as Record<string, Value>,
        targetVal as Record<string, Value>
      );
    } else {
      // Source (import) wins for same-type primitives and type mismatches.
      // This allows imported files to override inherited/accumulated values,
      // including changing a string shortcut to an object with prompt: true.
      // sourceVal is already in result from spread, so no action needed
    }
  }

  return result;
}

/**
 * Merge ArrayContent by unique concatenation.
 */
function mergeArrayContent(source: ArrayContent, target: ArrayContent): ArrayContent {
  return {
    ...target,
    elements: uniqueConcat(source.elements, target.elements),
  };
}

/**
 * Merge MixedContent by merging both text and properties.
 */
function mergeMixedContent(source: MixedContent, target: MixedContent): MixedContent {
  return {
    ...target,
    text:
      source.text && target.text
        ? mergeTextContent(source.text, target.text)
        : (target.text ?? source.text),
    properties: mergeProperties(source.properties, target.properties),
  };
}

/**
 * Unique concatenation of arrays, preserving order.
 */
function uniqueConcat(source: Value[], target: Value[]): Value[] {
  const seen = new Set<string>();
  const result: Value[] = [];

  for (const item of [...source, ...target]) {
    const key = typeof item === 'object' && item !== null ? JSON.stringify(item) : String(item);
    if (!seen.has(key)) {
      seen.add(key);
      result.push(deepCloneValue(item));
    }
  }

  return result;
}

/**
 * Type guard for plain objects.
 */
function isPlainObject(val: unknown): val is Record<string, unknown> {
  return (
    typeof val === 'object' &&
    val !== null &&
    !Array.isArray(val) &&
    Object.getPrototypeOf(val) === Object.prototype
  );
}

/**
 * Deep clone a value.
 */
function deepCloneValue(value: Value): Value {
  if (value === null || typeof value !== 'object') {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(deepCloneValue);
  }

  const result: Record<string, Value> = {};
  for (const [key, val] of Object.entries(value)) {
    result[key] = deepCloneValue(val as Value);
  }
  return result;
}

/**
 * Check if a block name is an import marker.
 */
export function isImportMarker(blockName: string): boolean {
  return blockName.startsWith(IMPORT_MARKER_PREFIX);
}

/**
 * Get the alias from an import marker block name.
 */
export function getImportAlias(blockName: string): string | undefined {
  if (!isImportMarker(blockName)) {
    return undefined;
  }

  const withoutPrefix = blockName.slice(IMPORT_MARKER_PREFIX.length);
  const dotIndex = withoutPrefix.indexOf('.');
  return dotIndex === -1 ? withoutPrefix : withoutPrefix.slice(0, dotIndex);
}

/**
 * Get the original block name from an aliased import block.
 */
export function getOriginalBlockName(blockName: string): string | undefined {
  if (!isImportMarker(blockName)) {
    return undefined;
  }

  const withoutPrefix = blockName.slice(IMPORT_MARKER_PREFIX.length);
  const dotIndex = withoutPrefix.indexOf('.');
  return dotIndex === -1 ? undefined : withoutPrefix.slice(dotIndex + 1);
}
