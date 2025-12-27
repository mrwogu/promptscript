import type {
  Program,
  ExtendBlock,
  Block,
  BlockContent,
  ObjectContent,
  MixedContent,
  TextContent,
  ArrayContent,
  Value,
} from '@promptscript/core';
import { deepMerge, deepClone, isTextContent } from '@promptscript/core';
import { IMPORT_MARKER_PREFIX } from './imports';

/**
 * Apply all @extend blocks to resolve extensions.
 *
 * @param ast - Program AST with @extend blocks
 * @returns Program with extensions applied and import markers removed
 */
export function applyExtends(ast: Program): Program {
  let blocks = [...ast.blocks];

  // Apply each extension
  for (const ext of ast.extends) {
    blocks = applyExtend(blocks, ext);
  }

  // Remove import markers
  blocks = blocks.filter((b) => !b.name.startsWith(IMPORT_MARKER_PREFIX));

  return {
    ...ast,
    blocks,
    extends: [],
  };
}

/**
 * Apply a single @extend block.
 */
function applyExtend(blocks: Block[], ext: ExtendBlock): Block[] {
  const pathParts = ext.targetPath.split('.');
  const rootName = pathParts[0];

  // Check if it's an import reference (alias.block)
  let targetName = rootName;
  let deepPath = pathParts.slice(1);

  // Check for aliased import reference
  const importMarker = blocks.find((b) => b.name === `${IMPORT_MARKER_PREFIX}${rootName}`);
  if (importMarker && pathParts.length > 1) {
    // This is alias.blockName - find the imported block
    targetName = `${IMPORT_MARKER_PREFIX}${rootName}.${pathParts[1]}`;
    deepPath = pathParts.slice(2);
  }

  const idx = blocks.findIndex((b) => b.name === targetName);
  if (idx === -1) {
    // Target not found - return unchanged
    return blocks;
  }

  const target = blocks[idx];
  if (!target) {
    return blocks;
  }

  const merged = mergeExtension(target, deepPath, ext);

  return [...blocks.slice(0, idx), merged, ...blocks.slice(idx + 1)];
}

/**
 * Merge extension content into a block.
 */
function mergeExtension(block: Block, path: string[], ext: ExtendBlock): Block {
  if (path.length === 0) {
    // Direct merge at block level
    return {
      ...block,
      content: mergeContent(block.content, ext.content),
    };
  }

  // Deep path merge - navigate into ObjectContent or MixedContent
  return {
    ...block,
    content: mergeAtPath(block.content, path, ext.content),
  };
}

/**
 * Merge content at a deep path.
 */
function mergeAtPath(
  content: BlockContent,
  path: string[],
  extContent: BlockContent
): BlockContent {
  if (path.length === 0) {
    return mergeContent(content, extContent);
  }

  const currentKey = path[0];
  if (!currentKey) {
    return mergeContent(content, extContent);
  }

  const rest = path.slice(1);

  if (content.type === 'ObjectContent') {
    const existing = content.properties[currentKey];

    if (rest.length === 0) {
      // We're at the target - merge or set
      return {
        ...content,
        properties: {
          ...content.properties,
          [currentKey]: mergeValue(existing, extContent),
        },
      };
    }

    // Navigate deeper
    if (existing && typeof existing === 'object' && !Array.isArray(existing)) {
      return {
        ...content,
        properties: {
          ...content.properties,
          [currentKey]: mergeAtPathValue(existing as Value, rest, extContent),
        },
      };
    }

    // Path doesn't exist - create it
    return {
      ...content,
      properties: {
        ...content.properties,
        [currentKey]: buildPathValue(rest, extContent),
      },
    };
  }

  if (content.type === 'MixedContent') {
    const existing = content.properties[currentKey];

    if (rest.length === 0) {
      return {
        ...content,
        properties: {
          ...content.properties,
          [currentKey]: mergeValue(existing, extContent),
        },
      };
    }

    if (existing && typeof existing === 'object' && !Array.isArray(existing)) {
      return {
        ...content,
        properties: {
          ...content.properties,
          [currentKey]: mergeAtPathValue(existing as Value, rest, extContent),
        },
      };
    }

    return {
      ...content,
      properties: {
        ...content.properties,
        [currentKey]: buildPathValue(rest, extContent),
      },
    };
  }

  // Can't navigate into TextContent or ArrayContent
  return content;
}

/**
 * Merge at path within a Value.
 */
function mergeAtPathValue(value: Value, path: string[], extContent: BlockContent): Value {
  if (path.length === 0) {
    return mergeValue(value, extContent);
  }

  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    // Can't navigate - build new path
    return buildPathValue(path, extContent);
  }

  const currentKey = path[0];
  if (!currentKey) {
    return mergeValue(value, extContent);
  }

  const rest = path.slice(1);
  const obj = value as Record<string, Value>;
  const existing = obj[currentKey];

  if (rest.length === 0) {
    return {
      ...obj,
      [currentKey]: mergeValue(existing, extContent),
    };
  }

  if (existing && typeof existing === 'object' && !Array.isArray(existing)) {
    return {
      ...obj,
      [currentKey]: mergeAtPathValue(existing as Value, rest, extContent),
    };
  }

  return {
    ...obj,
    [currentKey]: buildPathValue(rest, extContent),
  };
}

/**
 * Build a nested object from a path and final value.
 */
function buildPathValue(path: string[], extContent: BlockContent): Value {
  if (path.length === 0) {
    return extractValue(extContent);
  }

  const result: Record<string, Value> = {};
  let current = result;

  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i];
    if (key) {
      const next: Record<string, Value> = {};
      current[key] = next;
      current = next;
    }
  }

  const lastKey = path[path.length - 1];
  if (lastKey) {
    current[lastKey] = extractValue(extContent);
  }

  return result;
}

/**
 * Extract a Value from BlockContent.
 */
function extractValue(content: BlockContent): Value {
  switch (content.type) {
    case 'TextContent':
      return content.value;
    case 'ObjectContent':
      return deepClone(content.properties);
    case 'ArrayContent':
      return deepClone(content.elements);
    case 'MixedContent':
      return deepClone(content.properties);
  }
}

/**
 * Merge a Value with BlockContent.
 */
function mergeValue(existing: Value | undefined, extContent: BlockContent): Value {
  if (existing === undefined) {
    return extractValue(extContent);
  }

  // Array merging
  if (Array.isArray(existing) && extContent.type === 'ArrayContent') {
    return uniqueConcat(existing, extContent.elements);
  }

  // Object merging
  if (
    typeof existing === 'object' &&
    existing !== null &&
    !Array.isArray(existing) &&
    extContent.type === 'ObjectContent'
  ) {
    const merged = deepMerge(
      existing as Record<string, unknown>,
      extContent.properties as Record<string, unknown>
    );
    return merged as unknown as Value;
  }

  // TextContent merging
  if (isTextContent(existing) && extContent.type === 'TextContent') {
    return {
      ...extContent,
      value: `${existing.value}\n\n${extContent.value}`,
    };
  }

  // Default - extension wins
  return extractValue(extContent);
}

/**
 * Merge two BlockContent objects - handles same types.
 */
function mergeSameTypeContent(target: BlockContent, ext: BlockContent): BlockContent {
  switch (ext.type) {
    case 'TextContent':
      return {
        ...ext,
        value: `${(target as TextContent).value}\n\n${ext.value}`,
      };
    case 'ObjectContent':
      return {
        ...ext,
        properties: deepMerge((target as ObjectContent).properties, ext.properties),
      } as ObjectContent;
    case 'ArrayContent':
      return {
        ...ext,
        elements: uniqueConcat((target as ArrayContent).elements, ext.elements),
      };
    case 'MixedContent':
      return mergeMixedContent(target as MixedContent, ext);
  }
}

/**
 * Merge two MixedContent objects.
 */
function mergeMixedContent(target: MixedContent, ext: MixedContent): MixedContent {
  const mergedText =
    target.text && ext.text
      ? {
          ...ext.text,
          value: `${target.text.value}\n\n${ext.text.value}`,
        }
      : (ext.text ?? target.text);

  return {
    ...ext,
    text: mergedText,
    properties: deepMerge(target.properties, ext.properties),
  } as MixedContent;
}

/**
 * Merge two BlockContent objects.
 */
function mergeContent(target: BlockContent, ext: BlockContent): BlockContent {
  // Same type merging
  if (target.type === ext.type) {
    return mergeSameTypeContent(target, ext);
  }

  // Mixed type merging - Object + Text -> Mixed
  if (target.type === 'ObjectContent' && ext.type === 'TextContent') {
    return {
      type: 'MixedContent',
      text: ext,
      properties: (target as ObjectContent).properties,
      loc: ext.loc,
    } as MixedContent;
  }

  if (target.type === 'TextContent' && ext.type === 'ObjectContent') {
    return {
      type: 'MixedContent',
      text: target,
      properties: ext.properties,
      loc: ext.loc,
    } as MixedContent;
  }

  // Mixed + Text
  if (target.type === 'MixedContent' && ext.type === 'TextContent') {
    const mixed = target as MixedContent;
    return {
      ...mixed,
      text: mixed.text ? { ...ext, value: `${mixed.text.value}\n\n${ext.value}` } : ext,
    };
  }

  // Mixed + Object
  if (target.type === 'MixedContent' && ext.type === 'ObjectContent') {
    const mixed = target as MixedContent;
    return {
      ...mixed,
      properties: deepMerge(mixed.properties, ext.properties),
    };
  }

  // Default - extension wins
  return deepClone(ext);
}

/**
 * Unique concatenation of arrays.
 */
function uniqueConcat(parent: Value[], child: Value[]): Value[] {
  const seen = new Set<string>();
  const result: Value[] = [];

  for (const item of [...parent, ...child]) {
    const key = typeof item === 'object' && item !== null ? JSON.stringify(item) : String(item);
    if (!seen.has(key)) {
      seen.add(key);
      result.push(deepClone(item as Record<string, unknown>) as Value);
    }
  }

  return result;
}
