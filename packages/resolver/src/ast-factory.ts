import type { Block, ObjectContent, TextContent, Value, SourceLocation } from '@promptscript/core';

/**
 * Virtual source location used in synthesized AST nodes.
 *
 * Points to a synthetic file name, indicating the node was created
 * programmatically rather than parsed from real source.
 */
export const VIRTUAL_LOC: SourceLocation = {
  file: '<synthesized>',
  line: 1,
  column: 1,
  offset: 0,
};

/**
 * Synthesize an ObjectContent node from a properties record.
 */
export function makeObjectContent(properties: Record<string, Value>): ObjectContent {
  return {
    type: 'ObjectContent',
    properties,
    loc: VIRTUAL_LOC,
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
    loc: file ? { file, line: 1, column: 1, offset: 0 } : VIRTUAL_LOC,
  };
}

/**
 * Synthesize a Block node.
 */
export function makeBlock(name: string, content: ObjectContent | TextContent): Block {
  return {
    type: 'Block',
    name,
    content,
    loc: VIRTUAL_LOC,
  };
}
