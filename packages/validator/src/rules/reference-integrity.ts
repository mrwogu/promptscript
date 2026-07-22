import type { ValidationRule } from '../types.js';

/**
 * PS031: Reference integrity.
 *
 * Checks that registry-sourced skill reference files have corresponding
 * integrity hash entries in the lockfile. This is a structural presence
 * check — actual hash verification happens in the compiler layer.
 */
export const referenceIntegrity: ValidationRule = {
  id: 'PS031',
  name: 'reference-integrity',
  description: 'Registry reference files must have integrity hashes in lockfile',
  defaultSeverity: 'warning',
  validate: (ctx) => {
    const { lockfile, registryReferences, registryReferencePaths, ignoreHashes } = ctx.config;

    // Skip if no lockfile, no registry references, or hashes are disabled
    if (ignoreHashes || !lockfile || (!registryReferences && !registryReferencePaths)) {
      return;
    }
    const lockedReferences = lockfile.references ?? {};

    // Walk @skills blocks looking for references arrays
    for (const block of ctx.ast.blocks) {
      if (block.name !== 'skills' || block.content.type !== 'ObjectContent') {
        continue;
      }

      for (const [, skillValue] of Object.entries(block.content.properties)) {
        if (
          typeof skillValue !== 'object' ||
          skillValue === null ||
          !('references' in skillValue)
        ) {
          continue;
        }

        const refs = (skillValue as Record<string, unknown>)['references'];
        if (!Array.isArray(refs)) continue;

        for (const ref of refs) {
          if (typeof ref !== 'string') continue;

          const canonicalKey = block.loc.file
            ? registryReferencePaths?.get(block.loc.file)?.get(ref)
            : undefined;
          if (registryReferencePaths ? !canonicalKey : !registryReferences?.has(ref)) {
            continue;
          }

          const hasEntry = canonicalKey
            ? Object.hasOwn(lockedReferences, canonicalKey)
            : Object.keys(lockedReferences).some((key) => key.split('\0')[1] === ref);

          if (!hasEntry) {
            ctx.report({
              message: `Registry reference "${ref}" has no integrity hash in lockfile`,
              location: block.loc,
              suggestion: 'Run `prs lock` to generate integrity hashes for registry references',
            });
          }
        }
      }
    }
  },
};
