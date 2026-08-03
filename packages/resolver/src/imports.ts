import type {
  Program,
  UseDeclaration,
  Block,
  ObjectContent,
  Value,
  ParamArgument,
} from '@promptscript/core';
import {
  deepClone,
  ResolveError,
  getCanonicalBlockName,
  getSyntaxFeatureUsages,
  IMPORT_MERGE_POLICY,
  mergeBlockCollections,
} from '@promptscript/core';

/**
 * Import marker block prefix for storing imported content.
 * Used for @extend access when alias is provided.
 */
export const IMPORT_MARKER_PREFIX = '__import__';

/**
 * Resolve @use imports by merging blocks into target.
 *
 * New behavior (v0.2.0):
 * - Blocks from source are merged into target (like inheritance)
 * - If alias is provided, blocks are also stored with prefix for @extend access
 *
 * @param target - Target program AST
 * @param use - Use declaration being resolved
 * @param source - Source program AST (imported content)
 * @returns Updated program with merged blocks
 */
export function resolveUses(target: Program, use: UseDeclaration, source: Program): Program {
  // If the @use carries an inline output directory, attach it to every skill
  // brought in by this import. We operate on a clone so cached source ASTs are
  // never mutated.
  if (use.outputDir) {
    source = deepClone(source);
    const skillsBlock = source.blocks.find((b) => b.name === 'skills');
    if (skillsBlock?.content.type === 'ObjectContent') {
      const props = (skillsBlock.content as ObjectContent).properties;
      for (const [name, value] of Object.entries(props)) {
        const isObj = typeof value === 'object' && value !== null && !Array.isArray(value);
        if (isObj) {
          (value as Record<string, Value>)['__outputDir'] = use.outputDir;
        } else {
          props[name] = { __outputDir: use.outputDir } as unknown as Value;
        }
      }
    }
  }

  // Pre-merge duplicate skill check: detect collisions in @skills block
  const targetSkillsBlock = target.blocks.find((b) => b.name === 'skills');
  const sourceSkillsBlock = source.blocks.find((b) => b.name === 'skills');

  if (
    targetSkillsBlock?.content.type === 'ObjectContent' &&
    sourceSkillsBlock?.content.type === 'ObjectContent'
  ) {
    const targetProps = (targetSkillsBlock.content as ObjectContent).properties;
    const sourceProps = (sourceSkillsBlock.content as ObjectContent).properties;

    const duplicates = Object.keys(sourceProps).filter(
      (key) =>
        key in targetProps && JSON.stringify(sourceProps[key]) !== JSON.stringify(targetProps[key])
    );

    if (duplicates.length > 0) {
      throw new ResolveError(
        `Duplicate skill name(s) detected when importing '${use.path.raw}': ${duplicates.join(', ')}`,
        use.loc
      );
    }
  }

  // Merge blocks from source into target
  const mergedBlocks = mergeBlockCollections(source.blocks, target.blocks, {
    content: IMPORT_MERGE_POLICY,
    outputOrder: 'incoming',
  });

  // If alias is provided, also add aliased blocks for @extend access
  const aliasedBlocks: Block[] = [];
  if (use.alias) {
    const alias = use.alias;
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

    aliasedBlocks.push(marker);

    // Store source blocks with alias prefix for @extend access
    for (const block of source.blocks) {
      aliasedBlocks.push({
        ...block,
        name: `${IMPORT_MARKER_PREFIX}${alias}.${block.name}`,
      });
    }
  }

  return {
    ...target,
    blocks: [...mergedBlocks, ...aliasedBlocks],
    syntaxFeatures: [...getSyntaxFeatureUsages(target), ...getSyntaxFeatureUsages(source)],
  };
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

// ============================================================
// @use Block Filtering
// ============================================================

/**
 * Result of extracting reserved parameters from @use arguments.
 */
export interface ReservedParamsResult {
  /** Block names to include (mutually exclusive with exclude) */
  only?: string[];
  /** Block names to exclude (mutually exclusive with only) */
  exclude?: string[];
  /** Skill names to include (mutually exclusive with excludes) */
  includes?: string[];
  /** Skill names to exclude (mutually exclusive with includes) */
  excludes?: string[];
  /** Remaining non-reserved parameters for template interpolation */
  remaining: ParamArgument[];
}

/**
 * Extract reserved parameters (only, exclude, includes, excludes) from @use
 * param arguments. These are consumed by the resolver for filtering and must
 * not be passed to bindParams (which would throw UnknownParamError).
 *
 * Only extracts when the value is an array. Non-array values are left in
 * remaining for the validator (PS021) to report as type errors.
 */
export function extractReservedParams(params: ParamArgument[] | undefined): ReservedParamsResult {
  if (!params || params.length === 0) {
    return { remaining: [] };
  }

  const remaining: ParamArgument[] = [];
  let only: string[] | undefined;
  let exclude: string[] | undefined;
  let includes: string[] | undefined;
  let excludes: string[] | undefined;

  for (const param of params) {
    if (param.name === 'only' && Array.isArray(param.value)) {
      only = param.value.filter((v): v is string => typeof v === 'string');
    } else if (param.name === 'exclude' && Array.isArray(param.value)) {
      exclude = param.value.filter((v): v is string => typeof v === 'string');
    } else if (param.name === 'includes' && Array.isArray(param.value)) {
      includes = param.value.filter((v): v is string => typeof v === 'string');
    } else if (param.name === 'excludes' && Array.isArray(param.value)) {
      excludes = param.value.filter((v): v is string => typeof v === 'string');
    } else {
      remaining.push(param);
    }
  }

  return { only, exclude, includes, excludes, remaining };
}

/**
 * Filter options for block-level @use filtering.
 */
export interface BlockFilterOptions {
  /** Keep only these block names */
  only?: string[];
  /** Remove these block names */
  exclude?: string[];
}

/**
 * Filter an array of blocks based on only/exclude criteria.
 * Returns a new array; does not mutate the input.
 */
export function filterBlocks(blocks: Block[], options: BlockFilterOptions): Block[] {
  if (options.only) {
    const allowSet = new Set(options.only.map(getCanonicalBlockName));
    return blocks.filter((b) => allowSet.has(b.name));
  }

  if (options.exclude) {
    const denySet = new Set(options.exclude.map(getCanonicalBlockName));
    return blocks.filter((b) => !denySet.has(b.name));
  }

  return blocks;
}

/**
 * Filter options for skill-level @use filtering.
 */
export interface SkillFilterOptions {
  /** Keep only these skill names */
  includes?: string[];
  /** Remove these skill names */
  excludes?: string[];
}

/**
 * Filter the @skills block within a program based on includes/excludes criteria.
 * Operates on the ObjectContent properties of the @skills block, filtering
 * individual skills by name. Other blocks are left untouched.
 *
 * Returns a new Program with a deep-cloned @skills block; does not mutate the
 * input (important for cached ASTs).
 */
export function filterSkillsBlock(program: Program, options: SkillFilterOptions): Program {
  if (!options.includes && !options.excludes) {
    return program;
  }

  const skillsBlock = program.blocks.find((b) => b.name === 'skills');
  if (!skillsBlock || skillsBlock.content.type !== 'ObjectContent') {
    return program;
  }

  const props = skillsBlock.content.properties;
  const skillNames = Object.keys(props);

  let filteredNames: string[];
  if (options.includes) {
    const allowSet = new Set(options.includes);
    filteredNames = skillNames.filter((name) => allowSet.has(name));
  } else {
    const denySet = new Set(options.excludes!);
    filteredNames = skillNames.filter((name) => !denySet.has(name));
  }

  if (filteredNames.length === skillNames.length) {
    return program;
  }

  const filteredProps: Record<string, Value> = {};
  for (const name of filteredNames) {
    filteredProps[name] = deepClone(props[name]!);
  }

  const newSkillsBlock: Block = {
    ...deepClone(skillsBlock),
    content: {
      type: 'ObjectContent',
      properties: filteredProps,
      loc: skillsBlock.content.loc,
    } as ObjectContent,
  };

  return {
    ...program,
    blocks: program.blocks.map((b) => (b.name === 'skills' ? newSkillsBlock : b)),
  };
}
