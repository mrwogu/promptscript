import type { Program } from '@promptscript/core';
import { normalize, resolve } from 'path';

/**
 * Walk resolved ASTs and collect all skill reference paths that come from
 * a registry cache directory.
 *
 * @param ast - Resolved program AST
 * @param cacheBasePath - Base path of the registry cache
 * @returns Deduplicated list of absolute paths to registry-sourced reference files
 */
export function collectRegistryReferences(ast: Program, cacheBasePath: string): string[] {
  const normalizedCache = resolve(normalize(cacheBasePath));
  const seen = new Set<string>();
  const results: string[] = [];

  for (const block of ast.blocks) {
    if (block.name !== 'skills' || block.content.type !== 'ObjectContent') {
      continue;
    }

    for (const [, skillValue] of Object.entries(block.content.properties)) {
      if (typeof skillValue !== 'object' || skillValue === null || !('references' in skillValue)) {
        continue;
      }

      const refs = (skillValue as Record<string, unknown>)['references'];
      if (!Array.isArray(refs)) continue;

      for (const ref of refs) {
        if (typeof ref !== 'string') continue;

        const normalizedRef = resolve(normalize(ref));
        if (normalizedRef.startsWith(normalizedCache + '/') && !seen.has(normalizedRef)) {
          seen.add(normalizedRef);
          results.push(ref);
        }
      }
    }
  }

  return results;
}
