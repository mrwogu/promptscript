import type { ObjectContent, Program } from './types/index.js';

/**
 * Consume pending inline uses after a composition attempt fails.
 */
export function consumeInlineUses(ast: Program): Program {
  let changed = false;
  const blocks = ast.blocks.map((block) => {
    if (
      block.name !== 'skills' ||
      block.content.type !== 'ObjectContent' ||
      !block.content.inlineUses?.length
    ) {
      return block;
    }

    changed = true;
    return {
      ...block,
      content: {
        ...block.content,
        inlineUses: undefined,
      } satisfies ObjectContent,
    };
  });

  return changed ? { ...ast, blocks } : ast;
}
