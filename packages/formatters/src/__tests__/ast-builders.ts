import type { Program, SourceLocation } from '@promptscript/core';

/**
 * File-bound AST node builders shared by formatter specs.
 * Keeps test files free of duplicated createLoc/createBlock/createProgram helpers.
 */
export interface AstBuilders {
  createLoc(line: number): SourceLocation;
  createBlock(
    name: string,
    content: Program['blocks'][number]['content'],
    line: number
  ): Program['blocks'][number];
  createProgram(blocks: Program['blocks']): Program;
}

export function createAstBuilders(file: string): AstBuilders {
  const createLoc = (line: number): SourceLocation => ({
    file,
    line,
    column: 1,
  });

  function createBlock(
    name: string,
    content: Program['blocks'][number]['content'],
    line: number
  ): Program['blocks'][number] {
    return {
      type: 'Block' as const,
      name,
      content,
      loc: createLoc(line),
    };
  }

  function createProgram(blocks: Program['blocks']): Program {
    return {
      type: 'Program',
      blocks,
      uses: [],
      extends: [],
      loc: createLoc(1),
    };
  }

  return { createLoc, createBlock, createProgram };
}
