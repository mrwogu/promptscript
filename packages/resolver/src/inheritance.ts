import type {
  Program,
  Block,
  BlockContent,
  TextContent,
  ObjectContent,
  ArrayContent,
  MixedContent,
  Value,
} from '@promptscript/core';
import { deepMerge, deepClone, isTextContent } from '@promptscript/core';

/**
 * Resolve inheritance by merging a parent program into a child program.
 *
 * Rules:
 * - Child's meta is merged with parent's (child wins on conflict)
 * - Blocks with same name are deep merged (child wins on conflict)
 * - TextContent is concatenated (parent + child)
 * - Arrays are unique concatenated
 * - Objects are deep merged
 * - Child's @inherit is cleared after resolution
 *
 * @param parent - Parent program AST
 * @param child - Child program AST
 * @returns Merged program
 */
export function resolveInheritance(parent: Program, child: Program): Program {
  return {
    ...child,
    meta:
      parent.meta && child.meta
        ? {
            ...child.meta,
            fields: deepMerge(parent.meta.fields, child.meta.fields),
          }
        : child.meta ?? parent.meta,
    blocks: mergeBlocks(parent.blocks, child.blocks),
    inherit: undefined,
    uses: child.uses,
    extends: child.extends,
  };
}

/**
 * Merge two arrays of blocks, combining blocks with the same name.
 */
function mergeBlocks(parent: Block[], child: Block[]): Block[] {
  const childMap = new Map(child.map((b) => [b.name, b]));
  const result: Block[] = [];
  const seen = new Set<string>();

  // First, process parent blocks (potentially merging with child)
  for (const pb of parent) {
    const cb = childMap.get(pb.name);
    if (cb) {
      result.push(mergeBlock(pb, cb));
      seen.add(pb.name);
    } else {
      result.push(deepClone(pb));
    }
  }

  // Then, add any child blocks that weren't in parent
  for (const cb of child) {
    if (!seen.has(cb.name)) {
      result.push(deepClone(cb));
    }
  }

  return result;
}

/**
 * Merge two blocks with the same name.
 */
function mergeBlock(parent: Block, child: Block): Block {
  return {
    ...child,
    content: mergeBlockContent(parent.content, child.content),
  };
}

/**
 * Merge block content based on content types.
 */
function mergeBlockContent(
  parent: BlockContent,
  child: BlockContent
): BlockContent {
  // Same type - merge based on type
  if (parent.type === child.type) {
    switch (child.type) {
      case 'TextContent':
        return mergeTextContent(parent as TextContent, child);
      case 'ObjectContent':
        return mergeObjectContent(parent as ObjectContent, child);
      case 'ArrayContent':
        return mergeArrayContent(parent as ArrayContent, child);
      case 'MixedContent':
        return mergeMixedContent(parent as MixedContent, child);
    }
  }

  // Handle MixedContent with TextContent
  if (parent.type === 'MixedContent' && child.type === 'TextContent') {
    return {
      ...parent,
      text: parent.text
        ? mergeTextContent(parent.text, child)
        : deepClone(child),
    };
  }

  if (parent.type === 'TextContent' && child.type === 'MixedContent') {
    return {
      ...child,
      text: child.text ? mergeTextContent(parent, child.text) : deepClone(parent),
    };
  }

  // Handle MixedContent with ObjectContent
  if (parent.type === 'MixedContent' && child.type === 'ObjectContent') {
    return {
      ...parent,
      properties: deepMerge(parent.properties, child.properties),
    };
  }

  if (parent.type === 'ObjectContent' && child.type === 'MixedContent') {
    return {
      ...child,
      properties: deepMerge(parent.properties, child.properties),
    };
  }

  // Different types - child wins
  return deepClone(child);
}

/**
 * Merge TextContent by concatenating values (parent + separator + child).
 */
function mergeTextContent(parent: TextContent, child: TextContent): TextContent {
  return {
    ...child,
    value: `${parent.value}\n\n${child.value}`,
  };
}

/**
 * Merge ObjectContent by deep merging properties.
 */
function mergeObjectContent(
  parent: ObjectContent,
  child: ObjectContent
): ObjectContent {
  return {
    ...child,
    properties: mergeProperties(parent.properties, child.properties),
  };
}

/**
 * Merge object properties with special handling for values.
 */
function mergeProperties(
  parent: Record<string, Value>,
  child: Record<string, Value>
): Record<string, Value> {
  const result: Record<string, Value> = { ...parent };

  for (const [key, childVal] of Object.entries(child)) {
    const parentVal = result[key];

    if (parentVal === undefined) {
      result[key] = deepCloneValue(childVal);
    } else if (Array.isArray(childVal) && Array.isArray(parentVal)) {
      // Unique concat for arrays
      result[key] = uniqueConcat(parentVal, childVal);
    } else if (isTextContent(childVal) && isTextContent(parentVal)) {
      // Concat text content
      result[key] = mergeTextContent(parentVal, childVal);
    } else if (isPlainObject(childVal) && isPlainObject(parentVal)) {
      // Deep merge objects
      result[key] = mergeProperties(
        parentVal as Record<string, Value>,
        childVal as Record<string, Value>
      );
    } else {
      // Child wins for primitives or type mismatch
      result[key] = deepCloneValue(childVal);
    }
  }

  return result;
}

/**
 * Merge ArrayContent by unique concatenation.
 */
function mergeArrayContent(
  parent: ArrayContent,
  child: ArrayContent
): ArrayContent {
  return {
    ...child,
    elements: uniqueConcat(parent.elements, child.elements),
  };
}

/**
 * Merge MixedContent by merging both text and properties.
 */
function mergeMixedContent(
  parent: MixedContent,
  child: MixedContent
): MixedContent {
  return {
    ...child,
    text:
      parent.text && child.text
        ? mergeTextContent(parent.text, child.text)
        : child.text ?? parent.text,
    properties: mergeProperties(parent.properties, child.properties),
  };
}

/**
 * Unique concatenation of arrays, preserving order.
 */
function uniqueConcat(parent: Value[], child: Value[]): Value[] {
  const seen = new Set<string>();
  const result: Value[] = [];

  for (const item of [...parent, ...child]) {
    const key =
      typeof item === 'object' && item !== null
        ? JSON.stringify(item)
        : String(item);
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
