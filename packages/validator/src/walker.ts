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
 * Walk all text content in the AST.
 * Visits text in blocks, extend blocks, and nested content.
 */
export function walkText(ast: Program, callback: TextCallback): void {
  // Walk blocks
  for (const block of ast.blocks) {
    walkBlockContent(block.content, block.loc, callback);
  }

  // Walk extend blocks
  for (const ext of ast.extends) {
    walkBlockContent(ext.content, ext.loc, callback);
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
  callback: TextCallback
): void {
  switch (content.type) {
    case 'TextContent':
      callback(content.value, content.loc ?? fallbackLoc);
      break;
    case 'ObjectContent':
      walkObjectProperties(content.properties, content.loc ?? fallbackLoc, callback);
      break;
    case 'ArrayContent':
      walkArrayElements(content.elements, content.loc ?? fallbackLoc, callback);
      break;
    case 'MixedContent':
      if (content.text) {
        callback(content.text.value, content.text.loc ?? fallbackLoc);
      }
      walkObjectProperties(content.properties, content.loc ?? fallbackLoc, callback);
      break;
  }
}

/**
 * Walk object properties looking for text content.
 */
function walkObjectProperties(
  properties: Record<string, Value>,
  loc: SourceLocation,
  callback: TextCallback
): void {
  for (const value of Object.values(properties)) {
    walkValue(value, loc, callback);
  }
}

/**
 * Walk array elements looking for text content.
 */
function walkArrayElements(elements: Value[], loc: SourceLocation, callback: TextCallback): void {
  for (const element of elements) {
    walkValue(element, loc, callback);
  }
}

/**
 * Walk a value looking for text content.
 */
function walkValue(value: Value, loc: SourceLocation, callback: TextCallback): void {
  if (typeof value === 'string') {
    callback(value, loc);
  } else if (Array.isArray(value)) {
    walkArrayElements(value, loc, callback);
  } else if (value !== null && typeof value === 'object') {
    // Check if it's a TextContent node
    if ('type' in value) {
      const typed = value as { type: string; value?: string; loc?: SourceLocation };
      if (typed.type === 'TextContent' && typeof typed.value === 'string') {
        callback(typed.value, typed.loc ?? loc);
      }
    } else {
      // Regular object - walk its properties
      walkObjectProperties(value as Record<string, Value>, loc, callback);
    }
  }
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
