import type { Block, ObjectContent, TextContent, Value, SourceLocation } from '@promptscript/core';

/**
 * Virtual source location used in synthesized AST nodes.
 *
 * Points to a synthetic file name, indicating the node was created
 * programmatically rather than parsed from real source. Prefer passing a
 * real file to the factory functions so findings on synthesized nodes stay
 * traceable; fall back to this only when no source file exists.
 */
export const VIRTUAL_LOC: SourceLocation = {
  file: '<synthesized>',
  line: 1,
  column: 1,
  offset: 0,
};

/**
 * Build a location pointing at the start of a real source file.
 */
export function fileLoc(file: string): SourceLocation {
  return { file, line: 1, column: 1, offset: 0 };
}

/**
 * Synthesize an ObjectContent node from a properties record.
 *
 * @param properties - Property values keyed by name
 * @param file - Optional source file for the loc; falls back to VIRTUAL_LOC
 */
export function makeObjectContent(properties: Record<string, Value>, file?: string): ObjectContent {
  return {
    type: 'ObjectContent',
    properties,
    loc: file ? fileLoc(file) : VIRTUAL_LOC,
  };
}

/**
 * Synthesize a TextContent node.
 *
 * @param value - The text value
 * @param file - Optional file path for the loc; falls back to VIRTUAL_LOC
 */
export function makeTextContent(value: string, file?: string): TextContent {
  return {
    type: 'TextContent',
    value,
    loc: file ? fileLoc(file) : VIRTUAL_LOC,
  };
}

/**
 * Synthesize a Block node.
 *
 * @param name - Block name
 * @param content - Block content
 * @param file - Optional source file for the loc; falls back to VIRTUAL_LOC
 */
export function makeBlock(
  name: string,
  content: ObjectContent | TextContent,
  file?: string
): Block {
  return {
    type: 'Block',
    name,
    content,
    loc: file ? fileLoc(file) : VIRTUAL_LOC,
  };
}
