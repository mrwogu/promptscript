import type { Program, SourceLocation, Value } from '@promptscript/core';

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
  /** Program with a single @agents block. */
  createAgentsProgram(agents: Record<string, Value>): Program;
  /** Program with a single @skills block. */
  createSkillsProgram(skills: Record<string, Value>): Program;
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

  function createEntriesProgram(
    name: 'agents' | 'skills',
    entries: Record<string, Value>
  ): Program {
    return createProgram([
      createBlock(name, { type: 'ObjectContent', properties: entries, loc: createLoc(1) }, 1),
    ]);
  }

  function createAgentsProgram(agents: Record<string, Value>): Program {
    return createEntriesProgram('agents', agents);
  }

  function createSkillsProgram(skills: Record<string, Value>): Program {
    return createEntriesProgram('skills', skills);
  }

  return { createLoc, createBlock, createProgram, createAgentsProgram, createSkillsProgram };
}
