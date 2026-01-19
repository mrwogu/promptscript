import type {
  Program,
  UseDeclaration,
  Block,
  ObjectContent,
} from '@promptscript/core';

/**
 * Import marker block prefix for storing imported content.
 */
export const IMPORT_MARKER_PREFIX = '__import__';

/**
 * Resolve @use imports by adding import markers for later @extend access.
 *
 * @param target - Target program AST
 * @param use - Use declaration being resolved
 * @param source - Source program AST (imported content)
 * @returns Updated program with import marker
 */
export function resolveUses(
  target: Program,
  use: UseDeclaration,
  source: Program
): Program {
  const alias = use.alias ?? extractId(source) ?? 'import';
  const markerName = `${IMPORT_MARKER_PREFIX}${alias}`;

  // Create import marker block
  const marker: Block = {
    type: 'Block',
    name: markerName,
    content: {
      type: 'ObjectContent',
      properties: {
        __source: use.path.raw,
        __blocks: source.blocks.map((b) => b.name),
      },
      loc: use.loc,
    } as ObjectContent,
    loc: use.loc,
  };

  // Store source blocks with alias prefix for @extend access
  const aliasedBlocks: Block[] = source.blocks.map((block) => ({
    ...block,
    name: `${IMPORT_MARKER_PREFIX}${alias}.${block.name}`,
  }));

  return {
    ...target,
    blocks: [...target.blocks, marker, ...aliasedBlocks],
  };
}

/**
 * Extract the id from a program's meta block.
 */
function extractId(program: Program): string | undefined {
  if (!program.meta?.fields?.['id']) {
    return undefined;
  }

  const id = program.meta.fields['id'];
  return typeof id === 'string' ? id : undefined;
}

/**
 * Check if a block name is an import marker.
 */
export function isImportMarker(blockName: string): boolean {
  return blockName.startsWith(IMPORT_MARKER_PREFIX);
}

/**
 * Get the alias from an import marker block name.
 */
export function getImportAlias(blockName: string): string | undefined {
  if (!isImportMarker(blockName)) {
    return undefined;
  }

  const withoutPrefix = blockName.slice(IMPORT_MARKER_PREFIX.length);
  const dotIndex = withoutPrefix.indexOf('.');
  return dotIndex === -1 ? withoutPrefix : withoutPrefix.slice(0, dotIndex);
}

/**
 * Get the original block name from an aliased import block.
 */
export function getOriginalBlockName(blockName: string): string | undefined {
  if (!isImportMarker(blockName)) {
    return undefined;
  }

  const withoutPrefix = blockName.slice(IMPORT_MARKER_PREFIX.length);
  const dotIndex = withoutPrefix.indexOf('.');
  return dotIndex === -1 ? undefined : withoutPrefix.slice(dotIndex + 1);
}
