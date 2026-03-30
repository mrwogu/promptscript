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
import { IMPORT_MARKER_PREFIX } from './imports.js';

// ── Skill-aware merge strategy sets ──────────────────────────────────

/** Properties where the extension value replaces the base value. */
const SKILL_REPLACE_PROPERTIES = new Set([
  'content',
  'description',
  'trigger',
  'userInvocable',
  'allowedTools',
  'disableModelInvocation',
  'context',
  'agent',
]);

/** Properties where array elements are appended (deduplicated). */
const SKILL_APPEND_PROPERTIES = new Set(['references', 'examples', 'requires']);

/** Properties where objects are shallow-merged (extension wins per key). */
const SKILL_MERGE_PROPERTIES = new Set(['params', 'inputs', 'outputs']);

// ── AST-node type guards ─────────────────────────────────────────────

interface ArrayContentNode {
  readonly type: 'ArrayContent';
  elements: Value[];
  loc: { file: string; line: number; column: number };
}

interface ObjectContentNode {
  readonly type: 'ObjectContent';
  properties: Record<string, Value>;
  loc: { file: string; line: number; column: number };
}

function isArrayContent(v: unknown): v is ArrayContentNode {
  return (
    typeof v === 'object' && v !== null && (v as Record<string, unknown>)['type'] === 'ArrayContent'
  );
}

function isObjectContent(v: unknown): v is ObjectContentNode {
  return (
    typeof v === 'object' &&
    v !== null &&
    (v as Record<string, unknown>)['type'] === 'ObjectContent'
  );
}

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

  // Determine if the extend target is inside a @skills block
  const skillContext = ext.targetPath.split('.')[0] === 'skills';

  const merged = mergeExtension(target, deepPath, ext, skillContext);

  return [...blocks.slice(0, idx), merged, ...blocks.slice(idx + 1)];
}

/**
 * Merge extension content into a block.
 */
function mergeExtension(
  block: Block,
  path: string[],
  ext: ExtendBlock,
  skillContext: boolean
): Block {
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
    content: mergeAtPath(block.content, path, ext.content, skillContext),
  };
}

/**
 * Merge content at a deep path.
 */
function mergeAtPath(
  content: BlockContent,
  path: string[],
  extContent: BlockContent,
  skillContext: boolean
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
          [currentKey]: mergeValue(existing, extContent, skillContext),
        },
      };
    }

    // Navigate deeper
    if (existing && typeof existing === 'object' && !Array.isArray(existing)) {
      return {
        ...content,
        properties: {
          ...content.properties,
          [currentKey]: mergeAtPathValue(existing as Value, rest, extContent, skillContext),
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
          [currentKey]: mergeValue(existing, extContent, skillContext),
        },
      };
    }

    if (existing && typeof existing === 'object' && !Array.isArray(existing)) {
      return {
        ...content,
        properties: {
          ...content.properties,
          [currentKey]: mergeAtPathValue(existing as Value, rest, extContent, skillContext),
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
function mergeAtPathValue(
  value: Value,
  path: string[],
  extContent: BlockContent,
  skillContext: boolean
): Value {
  if (path.length === 0) {
    return mergeValue(value, extContent, skillContext);
  }

  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    // Can't navigate - build new path
    return buildPathValue(path, extContent);
  }

  const currentKey = path[0];
  if (!currentKey) {
    return mergeValue(value, extContent, skillContext);
  }

  const rest = path.slice(1);
  const obj = value as Record<string, Value>;
  const existing = obj[currentKey];

  if (rest.length === 0) {
    return {
      ...obj,
      [currentKey]: mergeValue(existing, extContent, skillContext),
    };
  }

  if (existing && typeof existing === 'object' && !Array.isArray(existing)) {
    return {
      ...obj,
      [currentKey]: mergeAtPathValue(existing as Value, rest, extContent, skillContext),
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
function mergeValue(
  existing: Value | undefined,
  extContent: BlockContent,
  skillContext: boolean = false
): Value {
  if (existing === undefined) {
    return extractValue(extContent);
  }

  // Skill-aware merging: delegate to mergeSkillValue when inside a @skills block
  if (skillContext && isObjectContent(existing) && extContent.type === 'ObjectContent') {
    return mergeSkillValue(existing, extContent);
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
 * Skill-aware merge: applies replace/append/shallow-merge strategies
 * based on the property name within a skill definition.
 *
 * Returns a flat Record matching the shape produced by deepMerge
 * (ObjectContent structural fields + skill properties at top level).
 */
function mergeSkillValue(existing: ObjectContentNode, ext: ObjectContent): Value {
  // Start with a shallow copy of the existing node (preserves type, loc, etc.)
  const base = { ...existing } as unknown as Record<string, Value>;
  // Flatten base properties to top level (matching deepMerge behaviour).
  // Only set from .properties if the key doesn't already exist at top level
  // (a previous merge pass may have placed a more up-to-date value there).
  for (const [k, v] of Object.entries(existing.properties)) {
    if (!(k in base)) {
      base[k] = v;
    }
  }

  for (const [key, extVal] of Object.entries(ext.properties)) {
    const baseVal = base[key];

    if (SKILL_REPLACE_PROPERTIES.has(key)) {
      // Extension value wins outright
      base[key] = deepClone(extVal as Record<string, unknown>) as Value;
    } else if (SKILL_APPEND_PROPERTIES.has(key)) {
      // Append array elements
      if (isArrayContent(baseVal) && isArrayContent(extVal)) {
        base[key] = {
          type: 'ArrayContent' as const,
          elements: uniqueConcat(baseVal.elements, extVal.elements),
          loc: extVal.loc,
        } as unknown as Value;
      } else if (isArrayContent(extVal)) {
        base[key] = deepClone(extVal as unknown as Record<string, unknown>) as Value;
      } else {
        base[key] = deepClone(extVal as Record<string, unknown>) as Value;
      }
    } else if (SKILL_MERGE_PROPERTIES.has(key)) {
      // Shallow merge of object properties
      if (isObjectContent(baseVal) && isObjectContent(extVal)) {
        base[key] = {
          ...baseVal.properties,
          ...extVal.properties,
        } as unknown as Value;
      } else if (isObjectContent(extVal)) {
        base[key] = deepClone(extVal as unknown as Record<string, unknown>) as Value;
      } else {
        base[key] = deepClone(extVal as Record<string, unknown>) as Value;
      }
    } else {
      // Unknown property — fallback to deepMerge
      if (
        baseVal !== undefined &&
        typeof baseVal === 'object' &&
        baseVal !== null &&
        !Array.isArray(baseVal) &&
        typeof extVal === 'object' &&
        extVal !== null &&
        !Array.isArray(extVal)
      ) {
        base[key] = deepMerge(
          baseVal as Record<string, unknown>,
          extVal as Record<string, unknown>
        ) as unknown as Value;
      } else {
        base[key] = deepClone(extVal as Record<string, unknown>) as Value;
      }
    }
  }

  return base as unknown as Value;
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
