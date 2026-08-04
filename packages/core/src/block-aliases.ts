import type { Block, BlockName, Program } from './types/index.js';
import {
  INHERITANCE_MERGE_POLICY,
  mergeBlockCollections,
  type BlockCollectionMergePolicy,
} from './block-merge.js';

/**
 * Authoring aliases mapped to their canonical internal block names.
 */
export const BLOCK_ALIASES: Readonly<Record<string, BlockName>> = {
  commands: 'shortcuts',
};

/**
 * Return the canonical internal name for a built-in alias or custom name.
 */
export function getCanonicalBlockName(name: string): string {
  return BLOCK_ALIASES[name] ?? name;
}

const ALIAS_MERGE_POLICY: BlockCollectionMergePolicy = {
  content: INHERITANCE_MERGE_POLICY,
  outputOrder: 'base',
};

function mergeAliasCollision(base: Block, incoming: Block): Block {
  return mergeBlockCollections([base], [incoming], ALIAS_MERGE_POLICY)[0]!;
}

export interface NormalizeBlockAliasOptions {
  readonly preserveDeclarationOrder?: boolean;
}

function precedes(
  left: { file: string; line: number; column: number; offset?: number },
  right: { file: string; line: number; column: number; offset?: number }
): boolean {
  if (left.file !== right.file) return false;
  if (left.offset !== undefined && right.offset !== undefined) return left.offset < right.offset;
  return left.line < right.line || (left.line === right.line && left.column < right.column);
}

/**
 * Normalize aliases and merge alias/canonical collisions in source order.
 *
 * Repeated canonical blocks remain distinct for compatibility. A collision is
 * merged only when at least one declaration used an alias.
 */
export function normalizeBlockAliases(
  ast: Program,
  options: NormalizeBlockAliasOptions = {}
): Program {
  let changed = false;
  const blocks: Block[] = [];
  const aliasNames = new Set<string>();

  for (const block of ast.blocks) {
    const canonicalName = BLOCK_ALIASES[block.name];
    const normalized = canonicalName ? { ...block, name: canonicalName } : block;
    if (canonicalName) changed = true;

    if (options.preserveDeclarationOrder) {
      blocks.push(normalized);
      continue;
    }

    const existingIndexes = blocks.flatMap((candidate, index) =>
      candidate.name === normalized.name ? [index] : []
    );
    if (
      existingIndexes.length > 0 &&
      (canonicalName !== undefined || aliasNames.has(normalized.name))
    ) {
      const firstIndex = existingIndexes[0]!;
      let merged = blocks[firstIndex]!;
      for (const index of existingIndexes.slice(1)) {
        merged = mergeAliasCollision(merged, blocks[index]!);
      }
      merged = mergeAliasCollision(merged, normalized);
      const matchedIndexes = new Set(existingIndexes);
      const remaining = blocks.filter((_candidate, index) => !matchedIndexes.has(index));
      remaining.splice(firstIndex, 0, merged);
      blocks.splice(0, blocks.length, ...remaining);
      aliasNames.add(normalized.name);
      changed = true;
      continue;
    }

    blocks.push(normalized);
    if (canonicalName) aliasNames.add(normalized.name);
  }

  const useAliases = new Set(
    ast.uses
      .map((declaration) => declaration.alias)
      .filter((alias): alias is string => alias !== undefined)
  );
  const isVisibleUseAlias = (name: string, location: Block['loc']): boolean =>
    options.preserveDeclarationOrder
      ? ast.uses.some(
          (declaration) => declaration.alias === name && precedes(declaration.loc, location)
        )
      : useAliases.has(name);
  const extensions = ast.extends.map((extension) => {
    const [root, ...rest] = extension.targetPath.split('.');
    const canonicalName =
      root && !isVisibleUseAlias(root, extension.loc) ? BLOCK_ALIASES[root] : undefined;
    if (!canonicalName) return extension;
    changed = true;
    return {
      ...extension,
      targetPath: [canonicalName, ...rest].join('.'),
    };
  });
  const overrides = (ast.overrides ?? []).map((override) => {
    const [root, ...rest] = override.targetPath.split('.');
    const canonicalName =
      root && !isVisibleUseAlias(root, override.loc) ? BLOCK_ALIASES[root] : undefined;
    if (!canonicalName) return override;
    changed = true;
    return {
      ...override,
      targetPath: [canonicalName, ...rest].join('.'),
    };
  });

  return changed ? { ...ast, blocks, extends: extensions, overrides } : ast;
}
