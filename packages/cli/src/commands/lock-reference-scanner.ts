import type { LockfileReference, Program } from '@promptscript/core';
import {
  buildReferenceKey,
  hashContent,
  isInsideCachePath,
  isRealPathInside,
} from '@promptscript/resolver';
import { readFile } from 'fs/promises';
import { dirname, isAbsolute, relative, resolve, sep } from 'path';

export interface RegistryReferenceRoot {
  repoUrl: string;
  version: string;
  cachePath: string;
}

/**
 * Collect and hash registry-sourced skill references from a resolved AST.
 */
export async function collectRegistryReferences(
  ast: Program,
  roots: RegistryReferenceRoot[],
  existing: Record<string, LockfileReference> = {},
  lockedAt: string = new Date().toISOString()
): Promise<Record<string, LockfileReference>> {
  const references: Record<string, LockfileReference> = {};
  const sortedRoots = [...roots].sort(
    (left, right) => resolve(right.cachePath).length - resolve(left.cachePath).length
  );

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

        const referencePath = isAbsolute(ref)
          ? resolve(ref)
          : resolve(dirname(block.loc.file), ref);
        const root = sortedRoots.find((candidate) =>
          isInsideCachePath(referencePath, candidate.cachePath)
        );
        if (!root) continue;
        if (!(await isRealPathInside(referencePath, root.cachePath))) {
          throw new Error(`Registry reference is missing or escapes its repository: ${ref}`);
        }

        const relativePath = relative(resolve(root.cachePath), referencePath).split(sep).join('/');
        const key = buildReferenceKey(root.repoUrl, relativePath, root.version);
        const hash = hashContent(await readFile(referencePath));
        const previous = existing[key];
        references[key] = {
          hash,
          lockedAt: previous?.hash === hash ? previous.lockedAt : lockedAt,
        };
      }
    }
  }

  return references;
}
