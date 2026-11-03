import { BLOCK_ALIASES, IMPORT_MARKER_PREFIX, type Block } from '@promptscript/core';
import type { ValidationRule } from '../types.js';

function describeBlock(name: string): string {
  const aliases = Object.entries(BLOCK_ALIASES)
    .filter(([, canonical]) => canonical === name)
    .map(([alias]) => `@${alias}`);
  return aliases.length > 0 ? `@${name} (alias ${aliases.join(', ')})` : `@${name}`;
}

/**
 * PS048: Duplicate blocks in one file
 *
 * A block name may appear once per file. Formatters read the first block of a
 * name, so a later block with the same name in the same file would be ignored.
 * Same-name blocks that come from different files (@inherit, @use) are merged
 * by the resolver and are not reported.
 */
export const duplicateBlocks: ValidationRule = {
  id: 'PS048',
  name: 'duplicate-blocks',
  description: 'Detect two blocks with the same name in one file',
  defaultSeverity: 'error',
  validate: (ctx) => {
    const firstByKey = new Map<string, Block>();

    for (const block of ctx.ast.blocks) {
      if (block.name.startsWith(IMPORT_MARKER_PREFIX)) continue;

      const key = `${block.loc.file}\0${block.name}`;
      const first = firstByKey.get(key);
      if (!first) {
        firstByKey.set(key, block);
        continue;
      }

      const label = describeBlock(block.name);
      ctx.report({
        message: `Duplicate ${label} block: already declared at line ${first.loc.line}, and only the first block is used`,
        location: block.loc,
        suggestion: `Merge the ${label} blocks into one, or remove one`,
      });
    }
  },
};
