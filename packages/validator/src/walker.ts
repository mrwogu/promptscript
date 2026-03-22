import type {
  Program,
  Block,
  ExtendBlock,
  BlockContent,
  Value,
  SourceLocation,
  UseDeclaration,
} from '@promptscript/core';

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
   * Property names to exclude from walking.
   * Useful for skipping non-instructional content like skill resource files.
   */
  excludeProperties?: string[];
}

/**
 * Walk all text content in the AST.
 * Visits text in blocks, extend blocks, and nested content.
 */
export function walkText(ast: Program, callback: TextCallback, options?: WalkTextOptions): void {
  const exclude = options?.excludeProperties ? new Set(options.excludeProperties) : undefined;

  // Walk blocks
  for (const block of ast.blocks) {
    walkBlockContent(block.content, block.loc, callback, exclude);
  }

  // Walk extend blocks
  for (const ext of ast.extends) {
    walkBlockContent(ext.content, ext.loc, callback, exclude);
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
    // Check if it's a TextContent node
    if ('type' in value) {
      const typed = value as { type: string; value?: string; loc?: SourceLocation };
      if (typed.type === 'TextContent' && typeof typed.value === 'string') {
        callback(typed.value, typed.loc ?? loc);
      }
    } else {
      // Regular object - walk its properties
      walkObjectProperties(value as Record<string, Value>, loc, callback, exclude);
    }
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
