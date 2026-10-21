import type {
  Program,
  Block,
  BlockBody,
  ExtendBlock,
  BlockContent,
  OverrideBlock,
  Value,
  SourceLocation,
  UseDeclaration,
} from '@promptscript/core';
import { blockBodyToContent, valueNodeToValue } from '@promptscript/core';

/**
 * Callback function for text content.
 */
export type TextCallback = (text: string, loc: SourceLocation) => void;

/**
 * Callback function for blocks.
 */
export type BlockCallback = (block: Block | ExtendBlock) => void;

/**
 * Callback function for use declarations.
 */
export type UseCallback = (use: UseDeclaration) => void;

/**
 * Options for walkText.
 */
export interface WalkTextOptions {
  /**
   * Property names to exclude from walking, at every depth under every block.
   * For skill resource lists use `skipSkillResources`, which is scoped to
   * `@skills.<name>.resources`.
   */
  excludeProperties?: string[];
  /**
   * Skip skill resource lists (`@skills.<name>.resources`, including the same
   * path reached through `@extend` and `@override`). The `resources` key under
   * any other block or property is still scanned.
   */
  skipSkillResources?: boolean;
}

/**
 * Walk all text content in the AST.
 * Visits text in blocks, extend blocks, override replacements, and nested content.
 */
export function walkText(ast: Program, callback: TextCallback, options?: WalkTextOptions): void {
  const exclude = options?.excludeProperties ? new Set(options.excludeProperties) : undefined;
  const skipResources = options?.skipSkillResources === true;

  // Walk blocks
  for (const block of ast.blocks) {
    let content = block.name === 'skills' ? withoutSkillBaseSource(block.content) : block.content;
    if (skipResources) content = withoutSkillResources([block.name], content);
    walkBlockContent(content, block.loc, callback, exclude);
    walkPresentationTitles(block.canonicalBody, callback);
  }

  // Walk extend blocks
  for (const ext of ast.extends) {
    const content = skipResources
      ? withoutSkillResources(ext.targetPath.split('.'), ext.content)
      : ext.content;
    walkBlockContent(content, ext.loc, callback, exclude);
    walkPresentationTitles(ext.canonicalBody, callback);
  }

  // Walk override replacements. Their payload lives on `replacement` rather
  // than `content`, so text rules would otherwise never see it on an
  // unresolved program.
  for (const override of ast.overrides ?? []) {
    walkOverrideReplacement(override, callback, exclude, skipResources);
  }
}

/**
 * Drop the `__baseSource` path from each skill. The resolver always writes it
 * (a hand-written value is overwritten), so it is a file path, not prompt
 * text. Only this key on skill records is skipped, the same key anywhere else
 * is still scanned.
 */
function withoutSkillBaseSource(content: BlockContent): BlockContent {
  if (content.type !== 'ObjectContent') return content;
  const properties: Record<string, Value> = {};
  for (const [name, skill] of Object.entries(content.properties)) {
    if (
      skill !== null &&
      typeof skill === 'object' &&
      !Array.isArray(skill) &&
      '__baseSource' in skill
    ) {
      const rest: Record<string, Value> = { ...(skill as Record<string, Value>) };
      delete rest['__baseSource'];
      properties[name] = rest;
    } else {
      properties[name] = skill;
    }
  }
  return { ...content, properties };
}

/**
 * Drop skill `resources` from content found at `path` (block name, or the
 * dot-split target path of an extend/override). Only `skills.<name>.resources`
 * is affected: `resources` under any other block or key is left in place.
 */
function withoutSkillResources(path: string[], content: BlockContent): BlockContent {
  if (path[0] !== 'skills' || path.length > 3) return content;
  if (path.length === 3) {
    // The target is the resource list itself.
    return path[2] === 'resources'
      ? { type: 'ObjectContent', properties: {}, loc: content.loc }
      : content;
  }
  if (content.type !== 'ObjectContent' && content.type !== 'MixedContent') return content;
  const properties: Record<string, Value> = {};
  for (const [key, value] of Object.entries(content.properties)) {
    if (path.length === 2) {
      if (key !== 'resources') properties[key] = value;
    } else if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      const rest: Record<string, Value> = { ...(value as Record<string, Value>) };
      delete rest['resources'];
      properties[key] = rest;
    } else {
      properties[key] = value;
    }
  }
  return { ...content, properties };
}

function walkOverrideReplacement(
  override: OverrideBlock,
  callback: TextCallback,
  exclude?: Set<string>,
  skipResources = false
): void {
  const { replacement } = override;
  if (replacement.type === 'BlockReplacement') {
    const body = blockBodyToContent(replacement.body);
    walkBlockContent(
      skipResources ? withoutSkillResources(override.targetPath.split('.'), body) : body,
      replacement.loc ?? override.loc,
      callback,
      exclude
    );
    walkPresentationTitles(replacement.body, callback);
    return;
  }

  const loc = replacement.loc ?? override.loc;
  const value = valueNodeToValue(replacement.value);
  if (
    skipResources &&
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    (value as { type?: unknown }).type !== 'TextContent'
  ) {
    const scoped = withoutSkillResources(override.targetPath.split('.'), {
      type: 'ObjectContent',
      properties: value as Record<string, Value>,
      loc,
    });
    walkBlockContent(scoped, loc, callback, exclude);
    return;
  }
  if (skipResources && isSkillResourcesPath(override.targetPath)) return;
  walkValue(value, loc, callback, exclude);
}

function isSkillResourcesPath(targetPath: string): boolean {
  const path = targetPath.split('.');
  return path.length === 3 && path[0] === 'skills' && path[2] === 'resources';
}

function walkPresentationTitles(body: BlockBody | undefined, callback: TextCallback): void {
  for (const entry of body?.entries ?? []) {
    if (entry.type === 'PresentationEntry') {
      callback(entry.title, entry.titleLoc);
    }
  }
}

/**
 * Walk all blocks in the AST.
 */
export function walkBlocks(ast: Program, callback: BlockCallback): void {
  for (const block of ast.blocks) {
    callback(block);
  }
  for (const ext of ast.extends) {
    callback(ext);
  }
}

/**
 * Get the block name from a Block or ExtendBlock.
 * Block has `name`, ExtendBlock has `targetPath` (dot-separated, first segment is the block name).
 */
export function getBlockName(block: Block | ExtendBlock): string {
  if (block.type === 'Block') return block.name;
  return block.targetPath.split('.')[0]!;
}

/**
 * Walk all use declarations in the AST.
 */
export function walkUses(ast: Program, callback: UseCallback): void {
  for (const use of ast.uses) {
    callback(use);
  }
}

/**
 * Walk content within a block.
 */
function walkBlockContent(
  content: BlockContent,
  fallbackLoc: SourceLocation,
  callback: TextCallback,
  exclude?: Set<string>
): void {
  switch (content.type) {
    case 'TextContent':
      callback(content.value, content.loc ?? fallbackLoc);
      break;
    case 'ObjectContent':
      walkObjectProperties(content.properties, content.loc ?? fallbackLoc, callback, exclude);
      break;
    case 'ArrayContent':
      walkArrayElements(content.elements, content.loc ?? fallbackLoc, callback, exclude);
      break;
    case 'MixedContent':
      if (content.text) {
        callback(content.text.value, content.text.loc ?? fallbackLoc);
      }
      walkObjectProperties(content.properties, content.loc ?? fallbackLoc, callback, exclude);
      break;
  }
}

/**
 * Walk object properties looking for text content.
 */
function walkObjectProperties(
  properties: Record<string, Value>,
  loc: SourceLocation,
  callback: TextCallback,
  exclude?: Set<string>
): void {
  for (const [key, value] of Object.entries(properties)) {
    if (exclude?.has(key)) continue;
    walkValue(value, loc, callback, exclude);
  }
}

/**
 * Walk array elements looking for text content.
 */
function walkArrayElements(
  elements: Value[],
  loc: SourceLocation,
  callback: TextCallback,
  exclude?: Set<string>
): void {
  for (const element of elements) {
    walkValue(element, loc, callback, exclude);
  }
}

/**
 * Walk a value looking for text content.
 */
function walkValue(
  value: Value,
  loc: SourceLocation,
  callback: TextCallback,
  exclude?: Set<string>
): void {
  if (typeof value === 'string') {
    callback(value, loc);
  } else if (Array.isArray(value)) {
    walkArrayElements(value, loc, callback, exclude);
  } else if (value !== null && typeof value === 'object') {
    // Check if it's a TextContent node (terminal — extract text and stop)
    if ('type' in value) {
      const typed = value as { type: string; value?: string; loc?: SourceLocation };
      if (typed.type === 'TextContent' && typeof typed.value === 'string') {
        callback(typed.value, typed.loc ?? loc);
        return;
      }
    }
    // Regular object or non-TextContent AST node — recurse into properties
    walkObjectProperties(value as Record<string, Value>, loc, callback, exclude);
  }
}

/**
 * Compute the actual source location of a character offset within a text block.
 * Given the text block's starting location and a character index within the text,
 * returns the adjusted SourceLocation pointing to the exact line and column.
 */
export function offsetLocation(
  baseLoc: SourceLocation,
  text: string,
  charIndex: number
): SourceLocation {
  let line = baseLoc.line;
  let column = baseLoc.column;

  for (let i = 0; i < charIndex && i < text.length; i++) {
    if (text[i] === '\n') {
      line++;
      column = 1;
    } else {
      column++;
    }
  }

  return {
    file: baseLoc.file,
    line,
    column,
    offset: baseLoc.offset !== undefined ? baseLoc.offset + charIndex : undefined,
  };
}

/**
 * Check if a block has any meaningful content.
 */
export function hasContent(content: BlockContent): boolean {
  switch (content.type) {
    case 'TextContent':
      return content.value.trim().length > 0;
    case 'ObjectContent':
      return Object.keys(content.properties).length > 0;
    case 'ArrayContent':
      return content.elements.length > 0;
    case 'MixedContent':
      return (
        (content.text?.value?.trim().length ?? 0) > 0 || Object.keys(content.properties).length > 0
      );
  }
}
