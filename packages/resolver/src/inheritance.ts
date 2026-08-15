import type { Program } from '@promptscript/core';
import {
  deepMerge,
  AgentConflictError,
  findAgentConflicts,
  getSyntaxFeatureUsages,
  INHERITANCE_MERGE_POLICY,
  mergeBlockCollections,
} from '@promptscript/core';

/**
 * Resolve inheritance by merging a parent program into a child program.
 *
 * Rules:
 * - Child's meta is merged with parent's (child wins on conflict)
 * - Blocks with same name are deep merged (child wins on conflict)
 * - TextContent is concatenated (parent + child)
 * - Arrays are unique concatenated
 * - Objects are deep merged
 * - Child's @inherit is cleared after resolution
 *
 * @param parent - Parent program AST
 * @param child - Child program AST
 * @returns Merged program
 */
export function resolveInheritance(parent: Program, child: Program): Program {
  const conflicts = findAgentConflicts(child, parent, parent.loc.file, child.inherit?.loc);
  if (conflicts.length > 0) {
    throw new AgentConflictError(conflicts, child.inherit?.loc);
  }

  return {
    ...child,
    meta:
      parent.meta && child.meta
        ? {
            ...child.meta,
            fields: deepMerge(parent.meta.fields, child.meta.fields),
          }
        : (child.meta ?? parent.meta),
    blocks: mergeBlockCollections(parent.blocks, child.blocks, {
      content: INHERITANCE_MERGE_POLICY,
      outputOrder: 'base',
    }),
    inherit: undefined,
    uses: child.uses,
    extends: child.extends,
    agentProvenance:
      parent.agentProvenance || child.agentProvenance
        ? [...(parent.agentProvenance ?? []), ...(child.agentProvenance ?? [])]
        : undefined,
    syntaxFeatures: [...getSyntaxFeatureUsages(parent), ...getSyntaxFeatureUsages(child)],
  };
}
