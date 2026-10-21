import type { Block, SourceLocation } from '@promptscript/core';

/** Build a block with ObjectContent holding the given properties. */
export function createObjectBlock(name: string, properties: Record<string, unknown>): Block {
  const loc: SourceLocation = { file: 'test.prs', line: 1, column: 1 };
  return {
    type: 'Block',
    name,
    loc,
    content: { type: 'ObjectContent', properties: properties as never, loc },
  };
}
