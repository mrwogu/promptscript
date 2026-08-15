import type { Block, ObjectContent, Program, UseDeclaration, Value } from './types/index.js';
import { ResolveError } from './errors/index.js';
import { IMPORT_MERGE_POLICY, mergeBlockCollections } from './block-merge.js';
import { getSyntaxFeatureUsages } from './syntax-versions.js';
import { deepClone } from './utils/index.js';
import {
  findAgentConflicts,
  getAgentProperties,
  getAgentProvenanceEntries,
  qualifyAgentProperties,
} from './agent-names.js';
import type { AgentProvenance } from './types/ast.js';
import { AgentConflictError } from './errors/resolve.js';

export const IMPORT_MARKER_PREFIX = '__import__';

function withSkillOutputDirectory(source: Program, outputDir: string): Program {
  const result = deepClone(source);
  const skillsBlock = result.blocks.find((block) => block.name === 'skills');
  if (skillsBlock?.content.type !== 'ObjectContent') return result;

  for (const [name, value] of Object.entries(skillsBlock.content.properties)) {
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      (value as Record<string, Value>)['__outputDir'] = outputDir;
    } else {
      skillsBlock.content.properties[name] = {
        __outputDir: outputDir,
      } as unknown as Value;
    }
  }
  return result;
}

function assertNoDuplicateSkills(
  target: Program,
  source: Program,
  declaration: UseDeclaration
): void {
  const targetSkills = target.blocks.find((block) => block.name === 'skills');
  const sourceSkills = source.blocks.find((block) => block.name === 'skills');
  if (
    targetSkills?.content.type !== 'ObjectContent' ||
    sourceSkills?.content.type !== 'ObjectContent'
  ) {
    return;
  }

  const targetProperties = targetSkills.content.properties;
  const sourceProperties = sourceSkills.content.properties;
  const duplicates = Object.keys(sourceProperties).filter(
    (name) =>
      Object.hasOwn(targetProperties, name) &&
      JSON.stringify(sourceProperties[name]) !== JSON.stringify(targetProperties[name])
  );
  if (duplicates.length > 0) {
    throw new ResolveError(
      `Duplicate skill name(s) detected when importing '${declaration.path.raw}': ${duplicates.join(', ')}`,
      declaration.loc
    );
  }
}

function qualifyImportedAgents(
  source: Program,
  declaration: UseDeclaration
): { program: Program; provenance: AgentProvenance[] } {
  if (!declaration.alias) {
    const properties = getAgentProperties(source);
    const provenance = Object.keys(properties).flatMap((name) => {
      const existing = getAgentProvenanceEntries(source, name);
      return existing.length > 0
        ? existing.map((entry) => ({
            ...entry,
            ...(entry.action === 'qualified' ? {} : { importPath: declaration.path.raw }),
            action: entry.action === 'qualified' ? entry.action : ('imported' as const),
          }))
        : [
            {
              name,
              source: source.loc.file,
              importPath: declaration.path.raw,
              action: 'imported' as const,
              loc: declaration.loc,
            },
          ];
    });
    return {
      program: provenance.length > 0 ? { ...source, agentProvenance: provenance } : source,
      provenance,
    };
  }

  const agentsBlock = source.blocks.find((block) => block.name === 'agents');
  if (
    !agentsBlock ||
    (agentsBlock.content.type !== 'ObjectContent' && agentsBlock.content.type !== 'MixedContent')
  ) {
    return { program: source, provenance: source.agentProvenance ?? [] };
  }

  const qualified = qualifyAgentProperties(
    agentsBlock.content,
    declaration.alias,
    source,
    declaration.path.raw,
    declaration.loc
  );
  const blocks = source.blocks.map((block) =>
    block === agentsBlock
      ? {
          ...block,
          content: qualified.content,
        }
      : block
  );
  return {
    program: {
      ...source,
      blocks,
      agentProvenance: [
        ...(source.agentProvenance ?? []).filter(
          (entry) => !Object.hasOwn(getAgentProperties(source), entry.name)
        ),
        ...qualified.provenance,
      ],
    },
    provenance: qualified.provenance,
  };
}

function createAliasBlocks(declaration: UseDeclaration, source: Program): Block[] {
  if (!declaration.alias) return [];

  const alias = declaration.alias;
  const marker: Block = {
    type: 'Block',
    name: `${IMPORT_MARKER_PREFIX}${alias}`,
    content: {
      type: 'ObjectContent',
      properties: {
        __source: declaration.path.raw,
        __blocks: source.blocks.map((block) => block.name),
      },
      loc: declaration.loc,
    } satisfies ObjectContent,
    loc: declaration.loc,
  };
  return [
    marker,
    ...source.blocks.map((block) => ({
      ...block,
      name: `${IMPORT_MARKER_PREFIX}${alias}.${block.name}`,
    })),
  ];
}

/**
 * Merge one resolved top-level import into a program.
 */
export function resolveUseImport(
  target: Program,
  declaration: UseDeclaration,
  imported: Program
): Program {
  const source = declaration.outputDir
    ? withSkillOutputDirectory(imported, declaration.outputDir)
    : imported;
  const qualified = qualifyImportedAgents(source, declaration);
  const conflicts = findAgentConflicts(
    target,
    qualified.program,
    declaration.path.raw,
    declaration.loc
  );
  if (conflicts.length > 0) {
    throw new AgentConflictError(conflicts, declaration.loc);
  }
  assertNoDuplicateSkills(target, source, declaration);

  const blocks = mergeBlockCollections(qualified.program.blocks, target.blocks, {
    content: IMPORT_MERGE_POLICY,
    outputOrder: 'incoming',
  });
  const targetAgents = target.agentProvenance ?? [];
  const importedAgents = qualified.program.agentProvenance ?? [];
  return {
    ...target,
    blocks: [...blocks, ...createAliasBlocks(declaration, source)],
    agentProvenance:
      targetAgents.length > 0 || importedAgents.length > 0
        ? [...targetAgents, ...importedAgents]
        : undefined,
    syntaxFeatures: [
      ...getSyntaxFeatureUsages(target),
      ...getSyntaxFeatureUsages(qualified.program),
    ],
  };
}
