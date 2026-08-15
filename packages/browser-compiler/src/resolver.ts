/**
 * Browser-compatible resolver for PromptScript files.
 *
 * Replaces the Node.js file-system-based Resolver with one that
 * uses an in-memory VirtualFileSystem.
 */

import { parse } from '@promptscript/parser';
import {
  noopLogger,
  type Logger,
  type CanonicalProgram,
  type Program,
  type PathReference,
  ResolveError,
  CircularDependencyError,
  deepMerge,
  deepClone,
  applyOverride,
  blockBodyToContent,
  consumeInlineUses,
  isTextContent,
  INHERITANCE_MERGE_POLICY,
  mergeBlockCollections,
  bindParams,
  getCanonicalBlockName,
  interpolateAST,
  getSyntaxFeatureUsages,
  normalizeBlockAliases,
  normalizeProgram,
  collectProvenance,
  collectProvenanceEvents,
  collectCompositionProvenanceEvents,
  collectProvenanceValueEvents,
  emptyProvenance,
  prefixProvenance,
  toLegacyBlock,
  usesSequentialOperations,
  composeBlockBodies,
  prepareBlockContentForMerge,
  reconcileBlockBodyAtPath,
  resolveUseImport,
  SKILL_REPLACE_PROPERTY_NAMES,
  type TemplateContext,
} from '@promptscript/core';
import { VirtualFileSystem } from './virtual-fs.js';
import { resolveSkillComposition } from './skill-composition.js';
import { resolveGuardRequires } from './guard-requires.js';
import type {
  Block,
  BlockContent,
  TextContent,
  ObjectContent,
  ArrayContent,
  MixedContent,
  Value,
  ExtendBlock,
  OverrideBlock,
  ParamArgument,
  ProvenanceEntry,
  ProvenanceEvent,
  ProvenanceLink,
  ProvenanceTrace,
} from '@promptscript/core';

/**
 * Result of separating reserved (`only`/`exclude`/`includes`/`excludes`) `@use`
 * parameters from regular template parameters.
 */
interface ReservedParamsResult {
  only?: string[];
  exclude?: string[];
  includes?: string[];
  excludes?: string[];
  remaining: ParamArgument[];
}

type CompositionBlock = Block & {
  content: Extract<BlockContent, { type: 'ObjectContent' | 'MixedContent' }>;
};

function isCompositionBlock(block: Block): block is CompositionBlock {
  return (
    block.name === 'skills' &&
    (block.content.type === 'ObjectContent' || block.content.type === 'MixedContent')
  );
}

/**
 * Extract reserved `only`/`exclude`/`includes`/`excludes` parameters from a
 * `@use` argument list, returning them separately from the remaining template
 * parameters. Mirrors the logic in `@promptscript/resolver` so the playground
 * produces the same output as the CLI for filtered imports.
 */
function extractReservedParams(params: ParamArgument[] | undefined): ReservedParamsResult {
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
 * Filter an imported program's blocks by `only`/`exclude` lists.
 * Exactly one of `only` or `exclude` must be set; callers gate on this.
 * Returns a new array; does not mutate the input.
 */
function filterBlocksBy(
  blocks: Block[],
  options: { only?: string[]; exclude?: string[] }
): Block[] {
  if (options.only) {
    const allowSet = new Set(options.only.map(getCanonicalBlockName));
    return blocks.filter((b) => allowSet.has(b.name));
  }
  const denySet = new Set(options.exclude?.map(getCanonicalBlockName));
  return blocks.filter((b) => !denySet.has(b.name));
}

/**
 * Filter the @skills block within a program by `includes`/`excludes` lists.
 * Operates on the ObjectContent properties of the @skills block. Other blocks
 * are left untouched. Returns a new Program; does not mutate the input.
 *
 * Caller must gate on `includes || excludes` before calling.
 */
function filterSkillsBy(
  program: Program,
  options: { includes?: string[]; excludes?: string[] }
): Program {
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

/**
 * Options for the browser resolver.
 */
export interface BrowserResolverOptions {
  /** Virtual file system containing all files */
  fs: VirtualFileSystem;
  /** Whether to cache resolved ASTs. Defaults to true. */
  cache?: boolean;
  /** Logger for verbose/debug output */
  logger?: Logger;
  /**
   * Simulated environment variables for interpolation.
   * When provided, ${VAR} and ${VAR:-default} syntax in source files
   * will be replaced with values from this map.
   */
  envVars?: Record<string, string>;
}

/**
 * Result of resolving a PromptScript file.
 */
export interface ResolvedAST {
  /** The resolved AST, or null if resolution failed */
  ast: Program | null;
  /** Immutable canonical projection of the resolved AST */
  canonicalAst?: CanonicalProgram | null;
  /** List of all source files involved in resolution */
  sources: string[];
  /** Public source and composition provenance for final values */
  provenance: ProvenanceTrace;
  /** List of errors encountered during resolution */
  errors: ResolveError[];
}

/**
 * Import marker block prefix for storing imported content.
 */
const IMPORT_MARKER_PREFIX = '__import__';

function effectiveCompositionPath(blocks: readonly Block[], path: string): string {
  const parts = path.split('.');
  const root = parts[0];
  if (!root || parts.length < 2) return path;
  if (blocks.some((block) => block.name === `${IMPORT_MARKER_PREFIX}${root}`)) {
    return parts.slice(1).join('.');
  }
  return path;
}

function isValueRecord(value: unknown): value is Record<string, Value> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

// ── Skill-aware merge strategy sets ──────────────────────────────────
//
// Mirrors the canonical CLI resolver in `@promptscript/resolver/extensions`
// so the playground produces the same output for `@extend skills.<name>`
// (and aliased `@extend alias.skills.<name>`) as `prs compile`. Without
// this, generic `deepMerge` concatenated TextContent properties like
// `content` instead of letting the overlay replace them.

/** Properties where the extension value replaces the base value. */
const SKILL_REPLACE_PROPERTIES = new Set<string>(SKILL_REPLACE_PROPERTY_NAMES);

/** Properties where array elements are appended (deduplicated). */
const SKILL_APPEND_PROPERTIES = new Set(['references', 'examples', 'requires', 'scripts']);

/** Properties where objects are shallow-merged (extension wins per key). */
const SKILL_MERGE_PROPERTIES = new Set(['params', 'inputs', 'outputs']);

/** Properties that are never overwritten by @extend (resolver-generated). */
const SKILL_PRESERVE_PROPERTIES = new Set([
  'composedFrom',
  '__composedFrom',
  'sealed',
  '__layerTrace',
]);

/**
 * Resolve the `sealed` property value into a set of enforceable property names.
 * Only replace-strategy property names are enforceable; others are silently ignored.
 * Mirrors `resolveSealedKeys` in `@promptscript/resolver/extensions`.
 */
function resolveSealedKeys(val: unknown): Set<string> {
  if (val === true) {
    return new Set(SKILL_REPLACE_PROPERTIES);
  }
  let names: string[];
  if (Array.isArray(val)) {
    names = val.filter((el): el is string => typeof el === 'string');
  } else {
    return new Set();
  }
  return new Set(names.filter((n) => SKILL_REPLACE_PROPERTIES.has(n)));
}

/**
 * Type guard for values that should be treated as a skill object. The parser
 * emits nested object literals inside `@skills` as plain `Record<string, Value>`,
 * never as ObjectContent AST nodes — so any non-array, non-AST-node object
 * qualifies. TextContent (`{ type: 'TextContent', ... }`) must be excluded.
 */
function isSkillRecordCandidate(v: unknown): v is Record<string, Value> {
  return (
    v !== null &&
    typeof v === 'object' &&
    !Array.isArray(v) &&
    (v as Record<string, unknown>)['type'] !== 'TextContent'
  );
}

/** Extract string elements from a plain array. */
function extractSkillElements(val: unknown): string[] | null {
  if (Array.isArray(val)) {
    return val.filter((el): el is string => typeof el === 'string');
  }
  return null;
}

/** True for plain `{}` objects, false for arrays, primitives, and AST nodes. */
function isPlainSkillObject(v: unknown): v is Record<string, Value> {
  return (
    v !== null &&
    typeof v === 'object' &&
    !Array.isArray(v) &&
    (v as Record<string, unknown>)['type'] !== 'TextContent'
  );
}

/**
 * Browser-compatible resolver for PromptScript files with inheritance and import support.
 *
 * This resolver uses an in-memory virtual file system instead of Node.js fs.
 */
export class BrowserResolver {
  private readonly fs: VirtualFileSystem;
  private readonly cache: Map<string, ResolvedAST>;
  private readonly resolving: Set<string>;
  private readonly cacheEnabled: boolean;
  private readonly logger: Logger;
  private readonly envVars?: Record<string, string>;

  constructor(options: BrowserResolverOptions) {
    this.fs = options.fs;
    this.cache = new Map();
    this.resolving = new Set();
    this.cacheEnabled = options.cache !== false;
    this.logger = options.logger ?? noopLogger;
    this.envVars = options.envVars;
  }

  /**
   * Resolve a PromptScript file and all its dependencies.
   *
   * @param entryPath - Path to the entry file
   * @returns Resolved AST with sources and errors
   */
  async resolve(entryPath: string): Promise<ResolvedAST> {
    const absPath = this.normalizePath(entryPath);

    // Check for circular dependency
    if (this.resolving.has(absPath)) {
      this.logger.debug(`Circular dependency detected: ${absPath}`);
      throw new CircularDependencyError([...this.resolving, absPath]);
    }

    // Check cache
    if (this.cacheEnabled && this.cache.has(absPath)) {
      this.logger.debug(`Cache hit: ${absPath}`);
      return this.cache.get(absPath)!;
    }

    this.resolving.add(absPath);
    this.logger.verbose(`Parsing ${absPath}`);

    try {
      const result = await this.doResolve(absPath);

      if (this.cacheEnabled) {
        this.logger.debug(`Cache store: ${absPath}`);
        this.cache.set(absPath, result);
      }

      return result;
    } finally {
      this.resolving.delete(absPath);
    }
  }

  /**
   * Normalize a path for consistent lookups.
   */
  private normalizePath(path: string): string {
    let normalized = path.replace(/\\/g, '/');

    // Remove leading slash
    if (normalized.startsWith('/')) {
      normalized = normalized.slice(1);
    }

    // Add .prs extension if missing
    if (!normalized.endsWith('.prs')) {
      normalized = `${normalized}.prs`;
    }

    return normalized;
  }

  /**
   * Resolve a PathReference to a normalized path.
   */
  private resolveRef(ref: PathReference, fromFile: string): string {
    if (ref.isRelative) {
      // Get directory of the current file
      const dir = this.dirname(fromFile);
      // Resolve relative path
      return this.normalizePath(this.joinPath(dir, ref.raw));
    }

    // Registry path: @namespace/path
    if (ref.raw.startsWith('@')) {
      const match = ref.raw.match(/^@([a-zA-Z_][a-zA-Z0-9_-]*)\/(.+?)(?:@[\d.]+)?$/);
      if (match && match[1] && match[2]) {
        const namespace = match[1];
        const segments = match[2];
        const fileName = segments.endsWith('.prs') ? segments : `${segments}.prs`;
        return `@${namespace}/${fileName}`;
      }
    }

    return this.normalizePath(ref.raw);
  }

  /**
   * Get directory name from a path.
   */
  private dirname(path: string): string {
    const lastSlash = path.lastIndexOf('/');
    return lastSlash === -1 ? '' : path.slice(0, lastSlash);
  }

  /**
   * Join path segments.
   */
  private joinPath(...segments: string[]): string {
    const parts: string[] = [];

    for (const segment of segments) {
      if (!segment) continue;

      const subParts = segment.split('/');
      for (const part of subParts) {
        if (part === '..') {
          parts.pop();
        } else if (part !== '.' && part !== '') {
          parts.push(part);
        }
      }
    }

    return parts.join('/');
  }

  /**
   * Perform the actual resolution.
   */
  private async doResolve(absPath: string): Promise<ResolvedAST> {
    const sources: string[] = [absPath];
    const errors: ResolveError[] = [];
    const inheritedProvenance: ProvenanceEntry[] = [];
    const provenanceEvents: ProvenanceEvent[] = [];

    // Load and parse file
    const parseData = this.loadAndParse(absPath, sources, errors);
    if (!parseData.ast) {
      return { ast: null, sources, errors, provenance: emptyProvenance(absPath) };
    }

    let ast = parseData.ast;
    const sequentialOperations = usesSequentialOperations(ast);
    ast = normalizeBlockAliases(ast, {
      preserveDeclarationOrder: sequentialOperations,
    });

    if (sequentialOperations) {
      ast = await this.resolveSequentialOperations(
        ast,
        absPath,
        sources,
        errors,
        inheritedProvenance,
        provenanceEvents
      );
    } else {
      ast = await this.resolveInherit(ast, absPath, sources, errors, false, inheritedProvenance);
      ast = await this.resolveImports(ast, absPath, sources, errors, inheritedProvenance);
    }

    // Legacy phase order resolves inline composition after top-level imports.
    if (!sequentialOperations) {
      ast = await this.resolveComposition(ast, absPath, sources, errors, provenanceEvents);
    }

    // Apply extensions
    if (!sequentialOperations && ast.extends.length > 0) {
      this.logger.debug(`Applying ${ast.extends.length} extension(s)`);
    }
    if (!sequentialOperations) {
      try {
        ast = this.applyExtends(ast, (extension, extensionBlocks) => {
          provenanceEvents.push(
            ...collectProvenanceEvents(
              extension.canonicalBody,
              effectiveCompositionPath(extensionBlocks, extension.targetPath),
              'extend',
              extension.loc,
              extension.replacements?.length ? 'replaced' : 'merged',
              extension.replacements?.length ? 'replace' : 'merge'
            )
          );
        });
      } catch (err) {
        if (err instanceof ResolveError) {
          errors.push(err);
        } else {
          errors.push(
            new ResolveError(
              `Extension resolution failed: ${err instanceof Error ? err.message : String(err)}`
            )
          );
        }
      }
    }

    // Resolve guard requires dependencies
    ast = resolveGuardRequires(ast, { maxDepth: 3 });

    this.logger.debug(`Resolved ${sources.length} source file(s)`);
    return {
      ast,
      canonicalAst: normalizeProgram(ast),
      sources: [...new Set(sources)],
      provenance: collectProvenance(ast, {
        entry: absPath,
        inherited: inheritedProvenance,
        events: provenanceEvents,
      }),
      errors,
    };
  }

  private async resolveSequentialOperations(
    ast: Program,
    absPath: string,
    sources: string[],
    errors: ResolveError[],
    inheritedProvenance: ProvenanceEntry[],
    provenanceEvents: ProvenanceEvent[]
  ): Promise<Program> {
    const operations = normalizeProgram(ast).operations;
    const localBlockNames = new Set<string>();
    let result: Program = {
      ...ast,
      inherit: undefined,
      uses: [],
      blocks: [],
      extends: [],
      overrides: [],
      syntaxFeatures: getSyntaxFeatureUsages(ast),
    };

    for (const operation of operations) {
      switch (operation.type) {
        case 'InheritOperation':
          result = await this.resolveInherit(
            {
              ...result,
              inherit: deepClone(operation.declaration) as unknown as NonNullable<
                Program['inherit']
              >,
            },
            absPath,
            sources,
            errors,
            true,
            inheritedProvenance
          );
          break;
        case 'UseOperation':
          result = await this.resolveImports(
            {
              ...result,
              uses: [deepClone(operation.declaration) as unknown as Program['uses'][number]],
            },
            absPath,
            sources,
            errors,
            inheritedProvenance
          );
          result = { ...result, uses: [] };
          break;
        case 'BlockOperation': {
          const block = toLegacyBlock(operation.block, { preserveCanonicalBody: true });
          result = {
            ...result,
            blocks: localBlockNames.has(block.name)
              ? [...result.blocks, block]
              : mergeBlockCollections(result.blocks, [block], {
                  content: INHERITANCE_MERGE_POLICY,
                  outputOrder: 'base',
                }),
          };
          localBlockNames.add(block.name);
          result = await this.resolveComposition(
            result,
            absPath,
            sources,
            errors,
            provenanceEvents
          );
          break;
        }
        case 'ExtendOperation': {
          const extension: ExtendBlock = {
            type: 'ExtendBlock',
            targetPath: operation.extension.targetPath,
            content: blockBodyToContent(operation.extension.body),
            canonicalBody: deepClone(operation.extension.body),
            ...(operation.extension.replacements
              ? {
                  replacements: operation.extension.replacements.map(
                    (replacement) =>
                      deepClone(replacement) as unknown as NonNullable<
                        ExtendBlock['replacements']
                      >[number]
                  ),
                }
              : {}),
            loc: deepClone(operation.extension.loc),
          };
          try {
            result = {
              ...result,
              blocks: this.applyExtend(result.blocks, extension),
            };
            provenanceEvents.push(
              ...collectProvenanceEvents(
                extension.canonicalBody,
                effectiveCompositionPath(result.blocks, extension.targetPath),
                'extend',
                extension.loc,
                extension.replacements?.length ? 'replaced' : 'merged',
                extension.replacements?.length ? 'replace' : 'merge'
              )
            );
            result = await this.resolveComposition(
              result,
              absPath,
              sources,
              errors,
              provenanceEvents
            );
          } catch (error) {
            errors.push(
              error instanceof ResolveError
                ? error
                : new ResolveError(
                    `Extension resolution failed: ${
                      error instanceof Error ? error.message : String(error)
                    }`,
                    extension.loc
                  )
            );
          }
          break;
        }
        case 'OverrideOperation': {
          const override: OverrideBlock = {
            type: 'OverrideBlock',
            targetPath: operation.override.targetPath,
            replacement: deepClone(
              operation.override.replacement
            ) as unknown as OverrideBlock['replacement'],
            loc: deepClone(operation.override.loc),
          };
          try {
            result = applyOverride(result, override, {
              importMarkerPrefix: IMPORT_MARKER_PREFIX,
            });
            if (override.replacement.type === 'BlockReplacement') {
              provenanceEvents.push(
                ...collectProvenanceEvents(
                  override.replacement.body,
                  effectiveCompositionPath(result.blocks, override.targetPath),
                  'override',
                  override.loc,
                  'replaced',
                  'replace'
                )
              );
            } else {
              provenanceEvents.push(
                ...collectProvenanceValueEvents(
                  override.replacement.value,
                  effectiveCompositionPath(result.blocks, override.targetPath),
                  override.replacement.value.loc
                )
              );
            }
            result = await this.resolveComposition(
              result,
              absPath,
              sources,
              errors,
              provenanceEvents
            );
          } catch (error) {
            errors.push(
              error instanceof ResolveError
                ? error
                : new ResolveError(
                    `Override resolution failed: ${
                      error instanceof Error ? error.message : String(error)
                    }`,
                    override.loc
                  )
            );
          }
          break;
        }
      }
    }

    return {
      ...result,
      blocks: result.blocks.filter((block) => !block.name.startsWith(IMPORT_MARKER_PREFIX)),
      inherit: undefined,
      uses: [],
      extends: [],
      overrides: [],
      syntaxFeatures: getSyntaxFeatureUsages(result),
    };
  }

  /**
   * Load and parse a file.
   */
  private loadAndParse(
    absPath: string,
    _sources: string[],
    errors: ResolveError[]
  ): { ast: Program | null } {
    let source: string;
    try {
      source = this.fs.read(absPath);
    } catch {
      errors.push(new ResolveError(`File not found: ${absPath}`));
      return { ast: null };
    }

    // Configure parsing options
    const parseOptions: Parameters<typeof parse>[1] = { filename: absPath };

    // Enable environment variable interpolation if envVars are provided
    if (this.envVars && Object.keys(this.envVars).length > 0) {
      parseOptions.interpolateEnv = true;
      parseOptions.envProvider = (name: string) => this.envVars?.[name];
    }

    const parseResult = parse(source, parseOptions);

    if (!parseResult.ast) {
      for (const e of parseResult.errors) {
        errors.push(new ResolveError(e.message, e.location));
      }
      return { ast: null };
    }

    for (const err of parseResult.errors) {
      errors.push(new ResolveError(err.message, err.location));
    }

    return { ast: parseResult.ast };
  }

  /**
   * Resolve @inherit declaration.
   */
  private async resolveInherit(
    ast: Program,
    absPath: string,
    sources: string[],
    errors: ResolveError[],
    parentWins = false,
    inheritedProvenance: ProvenanceEntry[] = []
  ): Promise<Program> {
    if (!ast.inherit) {
      return ast;
    }

    const parentPath = this.resolveRef(ast.inherit.path, absPath);
    this.logger.verbose(`Resolving inherit: ${ast.inherit.path.raw}`);
    this.logger.verbose(`  → ${parentPath}`);

    try {
      const parent = await this.resolve(parentPath);
      sources.push(...parent.sources);
      errors.push(...parent.errors);
      inheritedProvenance.push(
        ...prefixProvenance(parent.provenance, {
          operation: 'inherit',
          source: deepClone(ast.inherit.loc),
          target: parentPath,
          reference: ast.inherit.path.raw,
        } satisfies ProvenanceLink).entries
      );

      if (parent.ast) {
        // Handle parameterized inheritance (template interpolation)
        let resolvedParent = parent.ast;
        if (parent.ast.meta?.params || ast.inherit.params) {
          this.logger.debug(`Binding template parameters for ${parentPath}`);
          try {
            const params = bindParams(
              ast.inherit.params,
              parent.ast.meta?.params,
              parentPath,
              ast.inherit.loc
            );

            if (params.size > 0) {
              const ctx: TemplateContext = { params, sourceFile: parentPath };
              resolvedParent = interpolateAST(parent.ast, ctx);
              this.logger.debug(`Interpolated ${params.size} parameter(s)`);
            }
          } catch (err) {
            errors.push(
              new ResolveError(err instanceof Error ? err.message : String(err), ast.inherit.loc)
            );
            return ast;
          }
        }

        this.logger.debug(`Merging with parent AST`);
        const inherited = this.resolveInheritance(resolvedParent, ast);
        return parentWins
          ? {
              ...inherited,
              blocks: mergeBlockCollections(ast.blocks, resolvedParent.blocks, {
                content: INHERITANCE_MERGE_POLICY,
                outputOrder: 'base',
              }),
            }
          : inherited;
      }
    } catch (err) {
      if (err instanceof CircularDependencyError) {
        throw err;
      }
      errors.push(
        new ResolveError(
          `Failed to resolve parent: ${err instanceof Error ? err.message : String(err)}`
        )
      );
    }

    return ast;
  }

  /**
   * Resolve @use imports.
   */
  private async resolveImports(
    ast: Program,
    absPath: string,
    sources: string[],
    errors: ResolveError[],
    inheritedProvenance: ProvenanceEntry[] = []
  ): Promise<Program> {
    let result = ast;

    for (const use of ast.uses) {
      const importPath = this.resolveRef(use.path, absPath);
      this.logger.verbose(`Resolving import: ${use.path.raw}`);
      this.logger.verbose(`  → ${importPath}`);

      try {
        const imported = await this.resolve(importPath);
        sources.push(...imported.sources);
        errors.push(...imported.errors);
        inheritedProvenance.push(
          ...prefixProvenance(imported.provenance, {
            operation: 'use',
            source: deepClone(use.loc),
            target: importPath,
            reference: use.path.raw,
            ...(use.alias ? { alias: use.alias } : {}),
          } satisfies ProvenanceLink).entries
        );

        if (imported.ast) {
          // Handle parameterized imports (template interpolation)
          let resolvedImport = imported.ast;

          // Extract reserved params (only/exclude/includes/excludes) before they reach bindParams
          const { only, exclude, includes, excludes, remaining } = extractReservedParams(
            use.params
          );

          if (imported.ast.meta?.params || remaining.length > 0) {
            this.logger.debug(`Binding template parameters for ${importPath}`);
            try {
              const params = bindParams(
                remaining.length > 0 ? remaining : undefined,
                imported.ast.meta?.params,
                importPath,
                use.loc
              );

              if (params.size > 0) {
                const ctx: TemplateContext = { params, sourceFile: importPath };
                resolvedImport = interpolateAST(imported.ast, ctx);
                this.logger.debug(`Interpolated ${params.size} parameter(s)`);
              }
            } catch (err) {
              errors.push(
                new ResolveError(err instanceof Error ? err.message : String(err), use.loc)
              );
              continue;
            }
          }

          // Apply block filtering (post-interpolation) so the playground
          // matches the CLI's `only:` / `exclude:` semantics.
          if (only || exclude) {
            this.logger.debug(
              `Filtering blocks: ${only ? `only=[${only.join(',')}]` : `exclude=[${exclude!.join(',')}]`}`
            );
            resolvedImport = {
              ...resolvedImport,
              blocks: filterBlocksBy(resolvedImport.blocks, { only, exclude }),
            };
          }
          // Apply skill filtering (post-interpolation, post-block-filter)
          if (includes || excludes) {
            this.logger.debug(
              `Filtering skills: ${includes ? `includes=[${includes.join(',')}]` : `excludes=[${excludes!.join(',')}]`}`
            );
            resolvedImport = filterSkillsBy(resolvedImport, { includes, excludes });
          }

          this.logger.debug(`Merging import${use.alias ? ` as "${use.alias}"` : ''}`);
          result = resolveUseImport(result, use, resolvedImport);
        }
      } catch (err) {
        if (err instanceof CircularDependencyError) {
          throw err;
        }
        errors.push(
          new ResolveError(
            `Failed to resolve import: ${err instanceof Error ? err.message : String(err)}`
          )
        );
      }
    }

    return result;
  }

  /**
   * Resolve inline @use declarations within @skills blocks (skill composition).
   *
   * Mirrors the CLI resolver's resolveComposition: loads each inline @use
   * sub-skill through the full resolver pipeline, extracts its skill
   * definition and context blocks, and composes them into the parent skill
   * as numbered phase sections.
   */
  private async resolveComposition(
    ast: Program,
    absPath: string,
    sources: string[],
    errors: ResolveError[],
    provenanceEvents: ProvenanceEvent[] = []
  ): Promise<Program> {
    try {
      const inlineUses = ast.blocks
        .filter(isCompositionBlock)
        .flatMap(
          (block) => block.content.inlineUses?.map((declaration) => ({ block, declaration })) ?? []
        );
      ast = await resolveSkillComposition(ast, {
        currentFile: absPath,
        resolvePath: (ref: string, fromFile: string): string => {
          // Build a PathReference-like object matching the parser's shape
          const isRelative = ref.startsWith('./') || ref.startsWith('../');
          const segments = ref.split('/').filter((s) => s !== '.' && s !== '..');

          const pathRef: PathReference = {
            type: 'PathReference',
            raw: ref,
            segments,
            isRelative,
            loc: { file: fromFile, line: 1, column: 1, offset: 0 },
          };

          return this.resolveRef(pathRef, fromFile);
        },
        resolveFile: async (subPath: string): Promise<Program> => {
          const subResult = await this.resolve(subPath);
          if (subResult.sources.length > 0) {
            sources.push(...subResult.sources);
          }
          if (subResult.errors.length > 0) {
            errors.push(...subResult.errors);
          }
          if (!subResult.ast) {
            throw new ResolveError(`Failed to resolve sub-skill: ${subPath}`);
          }
          return subResult.ast;
        },
      });
      const skillsBlock = ast.blocks.find(
        (block) => block.name === 'skills' && block.content.type === 'ObjectContent'
      );
      if (skillsBlock?.content.type === 'ObjectContent') {
        for (const [skillName, skillValue] of Object.entries(skillsBlock.content.properties)) {
          if (!isValueRecord(skillValue)) continue;
          const composed = skillValue['__composedFrom'];
          if (!Array.isArray(composed)) continue;
          provenanceEvents.push(
            ...collectCompositionProvenanceEvents(
              composed,
              inlineUses,
              (declaration) => this.resolveRef(declaration.path, absPath),
              skillName
            )
          );
        }
      }
    } catch (err) {
      if (err instanceof ResolveError) {
        errors.push(err);
      } else {
        errors.push(
          new ResolveError(
            `Skill composition failed: ${err instanceof Error ? err.message : String(err)}`
          )
        );
      }
      ast = consumeInlineUses(ast);
    }

    return ast;
  }

  /**
   * Clear the resolution cache.
   */
  clearCache(): void {
    this.cache.clear();
  }

  // ============================================================
  // Inheritance Resolution (ported from @promptscript/resolver)
  // ============================================================

  /**
   * Resolve inheritance by merging a parent program into a child program.
   */
  private resolveInheritance(parent: Program, child: Program): Program {
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
      syntaxFeatures: [...getSyntaxFeatureUsages(parent), ...getSyntaxFeatureUsages(child)],
    };
  }

  // ============================================================
  // Import Resolution (ported from @promptscript/resolver)
  // ============================================================

  // ============================================================
  // Extension Resolution (ported from @promptscript/resolver)
  // ============================================================

  /**
   * Apply all @extend blocks to resolve extensions.
   */
  private applyExtends(
    ast: Program,
    onExtensionApplied?: (extension: ExtendBlock, previousBlocks: readonly Block[]) => void
  ): Program {
    let blocks = [...ast.blocks];

    for (const ext of ast.extends) {
      const previousBlocks = blocks;
      blocks = this.applyExtend(blocks, ext);
      onExtensionApplied?.(ext, previousBlocks);
    }

    blocks = blocks.filter((b) => !b.name.startsWith(IMPORT_MARKER_PREFIX));

    return {
      ...ast,
      blocks,
      extends: [],
      syntaxFeatures: getSyntaxFeatureUsages(ast),
    };
  }

  /**
   * Apply a single @extend block.
   */
  private applyExtend(blocks: Block[], ext: ExtendBlock): Block[] {
    const pathParts = ext.targetPath.split('.');
    const rootName = pathParts[0];

    let targetName = rootName;
    let deepPath = pathParts.slice(1);

    // Aliased imports are merged into the un-aliased namespace by
    // resolveUses; the aliased `__import__alias.<name>` copies are stripped
    // at the end of applyExtends. Redirect alias.<block> targets to the
    // un-aliased block so the @extend modifies the surviving copy.
    const importMarker = blocks.find((b) => b.name === `${IMPORT_MARKER_PREFIX}${rootName}`);
    if (importMarker && pathParts.length > 1) {
      targetName = pathParts[1] ?? rootName;
      deepPath = pathParts.slice(2);
    }

    const skillContext = targetName === 'skills';
    const replacementKeys = new Set(ext.replacements?.map((modifier) => modifier.property) ?? []);

    if (skillContext && replacementKeys.size > 0) {
      throw new ResolveError(
        'The ! replace modifier is only supported for regular block fields and cannot target @skills. Remove ! and use the documented skill-specific merge and sealed property semantics.',
        ext.replacements?.[0]?.loc ?? ext.loc
      );
    }

    if (skillContext && deepPath.length <= 1 && ext.content.type !== 'ObjectContent') {
      throw new ResolveError(
        'Skill extensions must use named object fields so skill-specific merge and sealed property semantics can be enforced.',
        ext.loc
      );
    }

    const idx = blocks.findIndex((b) => b.name === targetName);
    if (idx === -1) {
      return blocks;
    }

    const target = blocks[idx];
    if (!target) {
      return blocks;
    }

    if (skillContext) {
      this.assertSkillPathCanExtend(target.content, deepPath, ext);
    }

    const merged = this.mergeExtension(target, deepPath, ext, replacementKeys, skillContext);

    return [...blocks.slice(0, idx), merged, ...blocks.slice(idx + 1)];
  }

  private assertSkillPathCanExtend(content: BlockContent, path: string[], ext: ExtendBlock): void {
    const skillName = path[0];
    const propertyName = path[1];
    if (!skillName || !propertyName) {
      return;
    }

    if (propertyName === 'sealed') {
      throw new ResolveError("Cannot override protected property 'sealed' on skill", ext.loc);
    }

    if (content.type !== 'ObjectContent' && content.type !== 'MixedContent') {
      return;
    }

    const skill = content.properties[skillName];
    if (!isSkillRecordCandidate(skill)) {
      return;
    }

    const properties =
      (skill as Record<string, unknown>)['type'] === 'ObjectContent'
        ? ((skill as unknown as ObjectContent).properties as Record<string, Value>)
        : skill;
    if (resolveSealedKeys(properties['sealed']).has(propertyName)) {
      throw new ResolveError(
        `Cannot override sealed property '${propertyName}' on skill (sealed by base definition)`,
        ext.loc
      );
    }
  }

  /**
   * Merge extension content into a block.
   */
  private mergeExtension(
    block: Block,
    path: string[],
    ext: ExtendBlock,
    replacementKeys: ReadonlySet<string>,
    skillContext: boolean
  ): Block {
    if (path.length === 0) {
      const baseContent = prepareBlockContentForMerge(block.canonicalBody, block.content);
      const extensionContent = prepareBlockContentForMerge(ext.canonicalBody, ext.content);
      const content = skillContext
        ? this.mergeSkillsBlockContent(baseContent, extensionContent)
        : this.mergeExtendContent(baseContent, extensionContent, replacementKeys);
      return {
        ...block,
        content,
        canonicalBody: composeBlockBodies(
          block.canonicalBody,
          ext.canonicalBody,
          baseContent,
          extensionContent,
          content,
          block.name
        ),
      };
    }

    const content = this.mergeAtPath(
      block.content,
      path,
      ext.content,
      replacementKeys,
      skillContext
    );
    return {
      ...block,
      content,
      canonicalBody: reconcileBlockBodyAtPath(
        block.canonicalBody,
        ext.canonicalBody,
        block.content,
        ext.content,
        content,
        path
      ),
    };
  }

  private mergeSkillsBlockContent(target: BlockContent, ext: BlockContent): BlockContent {
    if (
      (target.type !== 'ObjectContent' && target.type !== 'MixedContent') ||
      ext.type !== 'ObjectContent'
    ) {
      return this.mergeExtendContent(target, ext);
    }

    const properties = { ...target.properties };
    for (const [skillName, extValue] of Object.entries(ext.properties)) {
      const extContent =
        (extValue as Record<string, unknown>)?.['type'] === 'ObjectContent'
          ? (extValue as unknown as ObjectContent)
          : isSkillRecordCandidate(extValue)
            ? ({
                type: 'ObjectContent',
                properties: extValue,
                loc: ext.loc,
              } as ObjectContent)
            : undefined;

      if (!extContent) {
        throw new ResolveError(
          `Skill '${skillName}' extension must use named object fields so sealed property semantics can be enforced.`,
          ext.loc
        );
      }
      properties[skillName] = this.mergeExtendValue(
        properties[skillName],
        extContent,
        new Set(),
        true
      );
    }

    return {
      ...target,
      properties,
      ...this.mergeAuxiliaryContent(target, ext),
    };
  }

  /**
   * Merge content at a deep path.
   */
  private mergeAtPath(
    content: BlockContent,
    path: string[],
    extContent: BlockContent,
    replacementKeys: ReadonlySet<string>,
    skillContext: boolean
  ): BlockContent {
    if (path.length === 0) {
      return this.mergeExtendContent(content, extContent, replacementKeys);
    }

    const currentKey = path[0];
    if (!currentKey) {
      return this.mergeExtendContent(content, extContent, replacementKeys);
    }

    const rest = path.slice(1);

    if (content.type === 'ObjectContent') {
      const existing = content.properties[currentKey];

      if (rest.length === 0) {
        return {
          ...content,
          properties: {
            ...content.properties,
            [currentKey]: this.mergeExtendValue(
              existing,
              extContent,
              replacementKeys,
              skillContext
            ),
          },
        };
      }

      if (existing && typeof existing === 'object' && !Array.isArray(existing)) {
        return {
          ...content,
          properties: {
            ...content.properties,
            [currentKey]: this.mergeAtPathValue(
              existing as Value,
              rest,
              extContent,
              replacementKeys,
              skillContext
            ),
          },
        };
      }

      return {
        ...content,
        properties: {
          ...content.properties,
          [currentKey]: this.buildPathValue(rest, extContent),
        },
      };
    }

    if (content.type === 'MixedContent') {
      const existing = content.properties[currentKey];

      if (rest.length === 0) {
        return {
          ...content,
          properties: {
            ...content.properties,
            [currentKey]: this.mergeExtendValue(
              existing,
              extContent,
              replacementKeys,
              skillContext
            ),
          },
        };
      }

      if (existing && typeof existing === 'object' && !Array.isArray(existing)) {
        return {
          ...content,
          properties: {
            ...content.properties,
            [currentKey]: this.mergeAtPathValue(
              existing as Value,
              rest,
              extContent,
              replacementKeys,
              skillContext
            ),
          },
        };
      }

      return {
        ...content,
        properties: {
          ...content.properties,
          [currentKey]: this.buildPathValue(rest, extContent),
        },
      };
    }

    return content;
  }

  /**
   * Merge at path within a Value.
   */
  private mergeAtPathValue(
    value: Value,
    path: string[],
    extContent: BlockContent,
    replacementKeys: ReadonlySet<string>,
    skillContext: boolean
  ): Value {
    // Caller (mergeAtPath / self-recursion) guarantees path is non-empty
    // and split('.') never yields empty segments for validated input.
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      return this.buildPathValue(path, extContent);
    }

    const currentKey = path[0]!;
    const rest = path.slice(1);
    const obj = value as Record<string, Value>;
    const existing = obj[currentKey];

    if (rest.length === 0) {
      return {
        ...obj,
        [currentKey]: this.mergeExtendValue(existing, extContent, replacementKeys, skillContext),
      };
    }

    if (existing && typeof existing === 'object' && !Array.isArray(existing)) {
      return {
        ...obj,
        [currentKey]: this.mergeAtPathValue(
          existing as Value,
          rest,
          extContent,
          replacementKeys,
          skillContext
        ),
      };
    }

    return {
      ...obj,
      [currentKey]: this.buildPathValue(rest, extContent),
    };
  }

  /**
   * Build a nested object from a path and final value.
   */
  private buildPathValue(path: string[], extContent: BlockContent): Value {
    if (path.length === 0) {
      return this.extractValue(extContent);
    }

    const result: Record<string, Value> = {};
    let current = result;

    for (let i = 0; i < path.length - 1; i++) {
      const key = path[i];
      if (key) {
        const next: Record<string, Value> = {};
        current[key] = next;
        current = next;
      }
    }

    const lastKey = path[path.length - 1];
    if (lastKey) {
      current[lastKey] = this.extractValue(extContent);
    }

    return result;
  }

  /**
   * Extract a Value from BlockContent.
   */
  private extractValue(content: BlockContent): Value {
    switch (content.type) {
      case 'TextContent':
        return content.value;
      case 'ObjectContent':
        return deepClone(content.properties);
      case 'ArrayContent':
        return deepClone(content.elements);
      case 'MixedContent':
        return content.text || content.listItems || content.inlineUses
          ? (deepClone(content) as unknown as Value)
          : deepClone(content.properties);
    }
  }

  private isMixedContentValue(value: Value): value is Value & MixedContent {
    return (
      typeof value === 'object' &&
      value !== null &&
      !Array.isArray(value) &&
      (value as Record<string, unknown>)['type'] === 'MixedContent' &&
      typeof (value as Record<string, unknown>)['properties'] === 'object'
    );
  }

  /**
   * Merge a Value with BlockContent.
   */
  private mergeExtendValue(
    existing: Value | undefined,
    extContent: BlockContent,
    replacementKeys: ReadonlySet<string> = new Set(),
    skillContext: boolean = false
  ): Value {
    if (existing === undefined) {
      return this.extractValue(extContent);
    }

    // Skill-aware merging: when overlaying a skill inside a `@skills` block,
    // apply replace/append/merge strategies per property name instead of
    // running everything through generic deepMerge (which would concatenate
    // TextContent properties like `content` and silently keep base text).
    if (skillContext && extContent.type === 'ObjectContent' && isSkillRecordCandidate(existing)) {
      return this.mergeSkillValue(existing, extContent);
    }

    const existingMixed = this.isMixedContentValue(existing) ? existing : undefined;
    if (existingMixed && extContent.type === 'ObjectContent') {
      return {
        ...(deepClone(existingMixed) as unknown as MixedContent),
        properties: this.mergeRegularProperties(
          existingMixed.properties,
          extContent.properties,
          replacementKeys
        ),
        ...this.mergeAuxiliaryContent(existingMixed, extContent),
      } as unknown as Value;
    }
    if (existingMixed && extContent.type === 'TextContent') {
      return {
        ...(deepClone(existingMixed) as unknown as MixedContent),
        text: existingMixed.text
          ? {
              ...extContent,
              value: `${existingMixed.text.value}\n\n${extContent.value}`,
            }
          : deepClone(extContent),
      } as unknown as Value;
    }

    if (Array.isArray(existing) && extContent.type === 'ArrayContent') {
      return this.uniqueConcat(existing, extContent.elements);
    }

    if (
      typeof existing === 'object' &&
      existing !== null &&
      !Array.isArray(existing) &&
      extContent.type === 'ObjectContent'
    ) {
      return this.mergeRegularProperties(
        existing as Record<string, Value>,
        extContent.properties,
        replacementKeys
      );
    }

    if (
      typeof existing === 'object' &&
      existing !== null &&
      !Array.isArray(existing) &&
      extContent.type === 'MixedContent'
    ) {
      const targetProperties = existingMixed
        ? existingMixed.properties
        : (existing as Record<string, Value>);
      const properties = this.mergeRegularProperties(
        targetProperties,
        extContent.properties,
        replacementKeys
      );
      if (!existingMixed && !extContent.text && !extContent.listItems && !extContent.inlineUses) {
        return properties;
      }
      const text =
        existingMixed?.text && extContent.text
          ? {
              ...extContent.text,
              value: `${existingMixed.text.value}\n\n${extContent.text.value}`,
            }
          : (extContent.text ?? existingMixed?.text);
      return {
        ...deepClone(extContent),
        ...(text ? { text } : {}),
        properties,
        ...this.mergeAuxiliaryContent(
          existingMixed ?? {
            type: 'ObjectContent',
            properties: targetProperties,
            loc: extContent.loc,
          },
          extContent
        ),
      } as unknown as Value;
    }

    if (isTextContent(existing) && extContent.type === 'TextContent') {
      return {
        ...extContent,
        value: `${existing.value}\n\n${extContent.value}`,
      };
    }

    return this.extractValue(extContent);
  }

  /**
   * Skill-aware merge — applies replace/append/shallow-merge strategies per
   * property name. Mirrors `mergeSkillValue` in `@promptscript/resolver`.
   *
   * Returns a plain `Record<string, Value>` so the result matches the shape
   * the parser uses for nested skill objects.
   */
  private mergeSkillValue(existing: Record<string, Value>, ext: ObjectContent): Value {
    const base: Record<string, Value> = { ...existing };

    for (const [key, extVal] of Object.entries(ext.properties)) {
      if (SKILL_PRESERVE_PROPERTIES.has(key)) {
        continue;
      }

      // Check sealed properties — block overrides of sealed replace-strategy properties
      const sealedKeys = resolveSealedKeys(base['sealed']);
      if (sealedKeys.has(key)) {
        throw new ResolveError(
          `Cannot override sealed property '${key}' on skill (sealed by base definition)`
        );
      }

      if (SKILL_REPLACE_PROPERTIES.has(key)) {
        base[key] = this.deepCloneValue(extVal as Value);
        continue;
      }

      if (SKILL_APPEND_PROPERTIES.has(key)) {
        // The validator rejects non-array values for references/examples/
        // requires, so we trust the overlay is an array here.
        const extElems = extractSkillElements(extVal) ?? [];
        const baseElems = extractSkillElements(base[key]) ?? [];
        base[key] = this.processSkillAppend(baseElems, extElems) as unknown as Value;
        continue;
      }

      if (SKILL_MERGE_PROPERTIES.has(key)) {
        // Shallow merge of object properties. The validator rejects non-object
        // values for these keys, so the deepClone fallback only fires when
        // overlay is the first to introduce the property.
        const baseVal = base[key];
        if (isPlainSkillObject(baseVal) && isPlainSkillObject(extVal)) {
          base[key] = { ...baseVal, ...extVal };
        } else {
          base[key] = this.deepCloneValue(extVal as Value);
        }
        continue;
      }

      // Unknown property — deep-merge nested objects, otherwise overlay wins.
      const baseVal = base[key];
      if (isPlainSkillObject(baseVal) && isPlainSkillObject(extVal)) {
        base[key] = deepMerge(
          baseVal as Record<string, unknown>,
          extVal as Record<string, unknown>
        ) as unknown as Value;
      } else {
        base[key] = this.deepCloneValue(extVal as Value);
      }
    }

    return base as unknown as Value;
  }

  /**
   * Append-strategy with negation support: `!path` entries remove matching
   * base entries, remaining entries are appended with deduplication.
   */
  private processSkillAppend(baseItems: string[], extItems: string[]): string[] {
    const negations = new Set<string>();
    const additions: string[] = [];
    for (const item of extItems) {
      if (item.startsWith('!')) {
        negations.add(item.slice(1));
      } else {
        additions.push(item);
      }
    }

    const filtered =
      negations.size === 0 ? baseItems : baseItems.filter((item) => !negations.has(item));

    const seen = new Set<string>();
    const result: string[] = [];
    for (const item of [...filtered, ...additions]) {
      if (!seen.has(item)) {
        seen.add(item);
        result.push(item);
      }
    }
    return result;
  }

  /**
   * Merge regular block properties, replacing fields explicitly marked with !.
   */
  private mergeRegularProperties(
    target: Record<string, Value>,
    ext: Record<string, Value>,
    replacementKeys: ReadonlySet<string>
  ): Record<string, Value> {
    const merged = deepMerge(target, ext);
    for (const key of replacementKeys) {
      if (Object.prototype.hasOwnProperty.call(ext, key)) {
        merged[key] = this.deepCloneValue(ext[key]!);
      }
    }
    return merged;
  }

  /**
   * Merge two BlockContent objects for extensions.
   */
  private mergeAuxiliaryContent(
    target: ObjectContent | MixedContent,
    ext: ObjectContent | MixedContent
  ): Pick<ObjectContent, 'listItems' | 'inlineUses'> {
    const listItems =
      target.listItems || ext.listItems
        ? this.uniqueConcat(target.listItems ?? [], ext.listItems ?? [])
        : undefined;
    const inlineUses =
      target.inlineUses || ext.inlineUses
        ? this.uniqueConcat(target.inlineUses ?? [], ext.inlineUses ?? [])
        : undefined;
    return {
      ...(listItems ? { listItems } : {}),
      ...(inlineUses ? { inlineUses } : {}),
    };
  }

  private mergeExtendContent(
    target: BlockContent,
    ext: BlockContent,
    replacementKeys: ReadonlySet<string> = new Set()
  ): BlockContent {
    if (target.type === ext.type) {
      switch (ext.type) {
        case 'TextContent':
          return {
            ...ext,
            value: `${(target as TextContent).value}\n\n${ext.value}`,
          };
        case 'ObjectContent':
          return {
            ...ext,
            properties: this.mergeRegularProperties(
              (target as ObjectContent).properties,
              ext.properties,
              replacementKeys
            ),
            ...this.mergeAuxiliaryContent(target as ObjectContent, ext),
          } as ObjectContent;
        case 'ArrayContent':
          return {
            ...ext,
            elements: this.uniqueConcat((target as ArrayContent).elements, ext.elements),
          };
        case 'MixedContent': {
          const targetMixed = target as MixedContent;
          const mergedText =
            targetMixed.text && ext.text
              ? {
                  ...ext.text,
                  value: `${targetMixed.text.value}\n\n${ext.text.value}`,
                }
              : (ext.text ?? targetMixed.text);
          return {
            ...ext,
            text: mergedText,
            properties: this.mergeRegularProperties(
              targetMixed.properties,
              ext.properties,
              replacementKeys
            ),
            ...this.mergeAuxiliaryContent(targetMixed, ext),
          } as MixedContent;
        }
      }
    }

    if (target.type === 'ObjectContent' && ext.type === 'TextContent') {
      return {
        type: 'MixedContent',
        text: ext,
        properties: (target as ObjectContent).properties,
        ...this.mergeAuxiliaryContent(target, {
          type: 'ObjectContent',
          properties: {},
          loc: ext.loc,
        }),
        loc: ext.loc,
      } as MixedContent;
    }

    if (target.type === 'TextContent' && ext.type === 'ObjectContent') {
      return {
        type: 'MixedContent',
        text: target,
        properties: ext.properties,
        ...this.mergeAuxiliaryContent(
          {
            type: 'ObjectContent',
            properties: {},
            loc: target.loc,
          },
          ext
        ),
        loc: ext.loc,
      } as MixedContent;
    }

    if (target.type === 'MixedContent' && ext.type === 'TextContent') {
      const mixed = target as MixedContent;
      return {
        ...mixed,
        text: mixed.text ? { ...ext, value: `${mixed.text.value}\n\n${ext.value}` } : ext,
      };
    }

    if (target.type === 'MixedContent' && ext.type === 'ObjectContent') {
      const mixed = target as MixedContent;
      return {
        ...mixed,
        properties: this.mergeRegularProperties(mixed.properties, ext.properties, replacementKeys),
        ...this.mergeAuxiliaryContent(mixed, ext),
      };
    }

    if (target.type === 'ObjectContent' && ext.type === 'MixedContent') {
      return {
        ...ext,
        properties: this.mergeRegularProperties(target.properties, ext.properties, replacementKeys),
        ...this.mergeAuxiliaryContent(target, ext),
      };
    }

    return deepClone(ext);
  }

  // ============================================================
  // Utility Methods
  // ============================================================

  /**
   * Unique concatenation of arrays, preserving order.
   */
  private uniqueConcat<T>(parent: readonly T[], child: readonly T[]): T[] {
    const seen = new Set<string>();
    const result: T[] = [];

    for (const item of [...parent, ...child]) {
      const key = typeof item === 'object' && item !== null ? JSON.stringify(item) : String(item);
      if (!seen.has(key)) {
        seen.add(key);
        result.push(deepClone(item));
      }
    }

    return result;
  }

  /**
   * Deep clone a value.
   */
  private deepCloneValue(value: Value): Value {
    if (value === null || typeof value !== 'object') {
      return value;
    }

    if (Array.isArray(value)) {
      return value.map((v) => this.deepCloneValue(v));
    }

    const result: Record<string, Value> = {};
    for (const [key, val] of Object.entries(value)) {
      result[key] = this.deepCloneValue(val as Value);
    }
    return result;
  }
}
