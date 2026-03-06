import type { Program, BlockName } from '@promptscript/core';

/**
 * Block name aliases: maps authoring names to their canonical internal names.
 * When a block uses an alias name, it gets normalized to the canonical name
 * so downstream code (formatters, validators) only needs to check one name.
 */
const BLOCK_ALIASES: Record<string, BlockName> = {
  commands: 'shortcuts',
};

/**
 * Normalize block alias names to their canonical internal names.
 *
 * For example, `@commands` is the preferred authoring name but internally
 * it's represented as `@shortcuts` so all existing formatter/validator code
 * works without modification.
 *
 * @param ast - Parsed program AST
 * @returns Program with normalized block names
 */
export function normalizeBlockAliases(ast: Program): Program {
  let changed = false;

  const blocks = ast.blocks.map((block) => {
    const canonical = BLOCK_ALIASES[block.name];
    if (canonical) {
      changed = true;
      return { ...block, name: canonical };
    }
    return block;
  });

  return changed ? { ...ast, blocks } : ast;
}
