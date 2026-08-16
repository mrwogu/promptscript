import { existsSync } from 'fs';
import { lstat, readdir, readFile } from 'fs/promises';
import { basename, isAbsolute, join, relative, resolve, sep } from 'path';
import { parse } from '@promptscript/parser';
import {
  noopLogger,
  type Logger,
  type BlockContent,
  type CanonicalProgram,
  type ExtendBlock,
  type OverrideBlock,
  type Program,
  type Value,
  type Lockfile,
  ResolveError,
  CircularDependencyError,
  FileNotFoundError,
  ErrorCode,
  bindParams,
  applyOverride,
  blockBodyToContent,
  consumeInlineUses,
  deepClone,
  AgentConflictError,
  ensureAgentProvenance,
  getInlineUses,
  getSyntaxFeatureUsages,
  INHERITANCE_MERGE_POLICY,
  interpolateAST,
  mergeBlockCollections,
  normalizeProgram,
  collectProvenance,
  collectProvenanceEvents,
  collectCompositionProvenanceEvents,
  collectProvenanceValueEvents,
  emptyProvenance,
  prefixProvenance,
  SKILL_REPLACE_PROPERTY_NAMES,
  toLegacyBlock,
  type ProvenanceEntry,
  type ProvenanceEvent,
  type ProvenanceEventOptions,
  type ProvenanceLink,
  type ProvenanceTrace,
  usesSequentialOperations,
  type TemplateContext,
} from '@promptscript/core';
import {
  FileLoader,
  type LoaderOptions,
  REGISTRY_MARKER_PREFIX,
  parseRegistryMarker,
} from './loader.js';
import { resolveInheritance } from './inheritance.js';
import {
  IMPORT_MARKER_PREFIX,
  resolveUses,
  extractReservedParams,
  filterBlocks,
  filterSkillsBlock,
} from './imports.js';
import { applyExtend } from './extensions.js';
import {
  resolveNativeSkills,
  resolveNativeCommands,
  resolveNativeAgents,
  parseSkillMd,
  skillNameFromPath,
  type NativeSkillOptions,
} from './skills.js';
import { collectSkillResources, toSkillResourceValues } from './skill-resources.js';
import { detectContentType } from './content-detector.js';
import { makeBlock, makeObjectContent, makeTextContent, VIRTUAL_LOC } from './ast-factory.js';
import { resolveGuardRequires } from './guard-requires.js';
import { normalizeBlockAliases } from './normalize.js';
import {
  resolveSkillComposition,
  type CompositionResolutionContext,
  type ResolvedCompositionFile,
} from './skill-composition.js';
import { GitRegistry } from './git-registry.js';
import { RegistryCache } from './registry-cache.js';
import { hashContent, isRealPathInside } from './reference-hasher.js';
import { discoverNativeContent } from './auto-discovery.js';
import { findFallbackUrl } from './alias-resolver.js';
import {
  loadVendorManifest,
  resolveVendoredRepository,
  verifyGitRepositoryCheckout,
} from './vendor-manifest.js';

function effectiveCompositionPath(
  blocks: readonly Program['blocks'][number][],
  path: string
): string {
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

const SKILL_REPLACE_PROPERTIES = new Set<string>(SKILL_REPLACE_PROPERTY_NAMES);
const SKILL_APPEND_PROPERTIES = new Set(['references', 'examples', 'requires', 'scripts']);
const SKILL_MERGE_PROPERTIES = new Set(['params', 'inputs', 'outputs']);

interface SkillLayerTraceEntry {
  readonly property: string;
  readonly strategy: string;
  readonly action: ProvenanceEvent['action'];
  readonly source: string;
}

function isProvenanceAction(value: unknown): value is ProvenanceEvent['action'] {
  return (
    value === 'declared' ||
    value === 'selected' ||
    value === 'merged' ||
    value === 'appended' ||
    value === 'replaced' ||
    value === 'removed' ||
    value === 'composed'
  );
}

function getSkillProperties(content: BlockContent): Record<string, Value> | undefined {
  return content.type === 'ObjectContent' || content.type === 'MixedContent'
    ? content.properties
    : undefined;
}

function contentAtPath(content: BlockContent, path: string): BlockContent | undefined {
  const parts = path.split('.').slice(1);
  let value: unknown = content;
  for (const part of parts) {
    if (isValueRecord(value)) {
      if (value['type'] === 'ObjectContent' || value['type'] === 'MixedContent') {
        value = (value['properties'] as Record<string, Value> | undefined)?.[part];
      } else {
        value = value[part];
      }
    } else {
      return undefined;
    }
  }
  if (
    isValueRecord(value) &&
    (value['type'] === 'TextContent' ||
      value['type'] === 'ObjectContent' ||
      value['type'] === 'ArrayContent' ||
      value['type'] === 'MixedContent')
  ) {
    return value as unknown as BlockContent;
  }
  if (isValueRecord(value)) {
    return {
      type: 'ObjectContent',
      properties: value,
      loc: content.loc,
    };
  }
  if (typeof value === 'string') {
    return { type: 'TextContent', value, loc: content.loc };
  }
  return undefined;
}

function getSkillLayerTrace(
  content: BlockContent,
  targetPath: string,
  eventPath: string,
  sourceFile: string
): Pick<ProvenanceEvent, 'action' | 'strategy'> | undefined {
  const properties = getSkillProperties(content);
  if (!properties) return undefined;

  const targetParts = targetPath.split('.');
  const eventParts = eventPath.split('.');
  const skillName =
    targetParts[0] === 'skills' && targetParts[1]
      ? targetParts[1]
      : eventParts[0] === 'skills'
        ? eventParts[1]
        : undefined;
  if (!skillName) return undefined;

  const skill = properties[skillName];
  if (!isValueRecord(skill)) return undefined;
  const propertyIndex = 2;
  const property = eventParts[propertyIndex]?.split('[')[0];
  if (!property) return undefined;

  const layerTrace = skill['__layerTrace'];
  if (!Array.isArray(layerTrace)) return undefined;
  const matching = layerTrace.flatMap((entry): SkillLayerTraceEntry[] => {
    if (!isValueRecord(entry)) return [];
    const entryProperty = entry['property'];
    const strategy = entry['strategy'];
    const action = entry['action'];
    const source = entry['source'];
    if (
      typeof entryProperty !== 'string' ||
      typeof strategy !== 'string' ||
      !isProvenanceAction(action) ||
      typeof source !== 'string' ||
      entryProperty !== property ||
      source !== sourceFile
    ) {
      return [];
    }
    return [
      {
        property: entryProperty,
        strategy,
        action,
        source,
      },
    ];
  });
  /*
   * The trace is resolver metadata, so malformed entries are ignored instead
   * of making provenance collection fail.
   */
  const latest = matching.at(-1);
  if (!latest) return undefined;
  return { action: latest.action, strategy: latest.strategy };
}

function skillLayerDetails(
  content: BlockContent | undefined,
  targetPath: string,
  sourceFile: string
): ProvenanceEventOptions['resolveDetails'] | undefined {
  if (!content || !targetPath.split('.')[0] || targetPath.split('.')[0] !== 'skills') {
    return undefined;
  }
  return (path: string) => {
    const traced = getSkillLayerTrace(content, targetPath, path, sourceFile);
    if (traced) return traced;
    const property = path.split('.')[2]?.split('[')[0];
    if (!property) return undefined;
    if (SKILL_REPLACE_PROPERTIES.has(property)) {
      return { action: 'replaced', strategy: 'replace' };
    }
    if (SKILL_APPEND_PROPERTIES.has(property)) {
      return { action: 'appended', strategy: 'append' };
    }
    if (SKILL_MERGE_PROPERTIES.has(property)) {
      return { action: 'merged', strategy: 'merge' };
    }
    return undefined;
  };
}

function extensionStrategy(targetPath: string, hasReplacementModifier: boolean): string {
  if (hasReplacementModifier) return 'replace';
  return targetPath === 'skills' || targetPath.startsWith('skills.') ? 'mixed' : 'merge';
}

type CompositionBlock = Program['blocks'][number] & {
  content: Extract<BlockContent, { type: 'ObjectContent' | 'MixedContent' }>;
};

function isCompositionBlock(block: Program['blocks'][number]): block is CompositionBlock {
  return (
    block.name === 'skills' &&
    (block.content.type === 'ObjectContent' || block.content.type === 'MixedContent')
  );
}

function addParsedSkillMetadata(
  skillProps: Record<string, Value>,
  parsed: ReturnType<typeof parseSkillMd>
): void {
  if (parsed.params !== undefined) skillProps['params'] = parsed.params as unknown as Value;
  if (parsed.inputs !== undefined) skillProps['inputs'] = parsed.inputs as unknown as Value;
  if (parsed.outputs !== undefined) skillProps['outputs'] = parsed.outputs as unknown as Value;
  if (parsed.references !== undefined) {
    skillProps['references'] = parsed.references as unknown as Value;
  }
  if (parsed.scripts !== undefined) skillProps['scripts'] = parsed.scripts as unknown as Value;
  if (parsed.license !== undefined) skillProps['license'] = parsed.license;
  if (parsed.compatibility !== undefined) skillProps['compatibility'] = parsed.compatibility;
  if (parsed.metadata !== undefined) {
    skillProps['metadata'] = parsed.metadata as unknown as Value;
  }
  if (parsed.allowedTools !== undefined) {
    skillProps['allowedTools'] = parsed.allowedTools as unknown as Value;
  }
  if (parsed.rawFrontmatter !== undefined) {
    skillProps['__rawFrontmatter'] = parsed.rawFrontmatter;
  }
}

/**
 * Options for the resolver.
 */
export interface ResolverOptions extends LoaderOptions {
  /** Whether to cache resolved ASTs. Defaults to true. */
  cache?: boolean;
  /** Refuse remote registry clones and cache metadata writes. */
  readOnly?: boolean;
  /** Logger for verbose/debug output */
  logger?: Logger;
  /** Options for native skill resolution */
  skills?: NativeSkillOptions;
  /** Maximum depth for guard requires resolution. Defaults to 3. */
  guardRequiresDepth?: number;
  /** Base directory for the registry cache (defaults to ~/.promptscript/cache) */
  cacheDir?: string;
  /** Vendored registry directory to prefer over cache and network access */
  vendorDir?: string;
  /** Repository roots that use a cache layout other than RegistryCache */
  referenceRoots?: Record<string, string[]>;
  /**
   * Map from `@use` source `path.raw` to a target output directory.
   * Provides a config-driven default for skills imported via @use when no
   * inline `into "<path>"` clause is present on the directive.
   */
  skillTargets?: Record<string, string>;
}

/**
 * Result of resolving a PromptScript file.
 */
export interface ResolvedAST {
  /**
   * Immutable canonical AST used by compiler and validator stages.
   *
   * This is the primary resolved representation.
   */
  canonicalAst: CanonicalProgram | null;
  /**
   * Mutable compatibility projection for legacy integrations.
   *
   * @deprecated Use `canonicalAst` for new consumers.
   */
  ast: Program | null;
  /** List of all source files involved in resolution */
  sources: string[];
  /** Public source and composition provenance for final values */
  provenance: ProvenanceTrace;
  /** Files and directories read while resolving the AST */
  dependencies?: string[];
  /** List of errors encountered during resolution */
  errors: ResolveError[];
}

type PreflightRegistryImport =
  | {
      readonly type: 'result';
      readonly result: ResolvedAST;
    }
  | {
      readonly type: 'error';
      readonly error: unknown;
    };

interface ParsedFile {
  readonly ast: Program;
  readonly errors: readonly ResolveError[];
}

interface ResolutionContext {
  readonly resolving: Set<string>;
  readonly preflightRegistryImports: Map<string, PreflightRegistryImport>;
  readonly operationModeCache: Map<string, boolean>;
  readonly parsedFiles: Map<string, ParsedFile>;
}

function createResolutionContext(): ResolutionContext {
  return {
    resolving: new Set(),
    preflightRegistryImports: new Map(),
    operationModeCache: new Map(),
    parsedFiles: new Map(),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function collectDependencyPaths(value: unknown, dependencies: Set<string>): void {
  if (Array.isArray(value)) {
    for (const item of value) {
      collectDependencyPaths(item, dependencies);
    }
    return;
  }

  if (!isRecord(value)) return;

  const loc = value['loc'];
  if (isRecord(loc) && typeof loc['file'] === 'string') {
    const file = loc['file'];
    if (isAbsolute(file)) dependencies.add(file);
  }

  if (typeof value['origin'] === 'string' && isAbsolute(value['origin'])) {
    dependencies.add(value['origin']);
  }

  for (const child of Object.values(value)) {
    collectDependencyPaths(child, dependencies);
  }
}

function addDependencyPaths(dependencies: Set<string>, paths: readonly string[]): void {
  for (const path of paths) {
    dependencies.add(path);
  }
}

/**
 * Resolver for PromptScript files with inheritance and import support.
 *
 * Handles:
 * - @inherit: Single inheritance with deep merge
 * - @use: Import declarations
 * - @extend: Block modifications
 *
 * @example
 * ```typescript
 * const resolver = new Resolver({
 *   registryPath: '/path/to/registry',
 *   localPath: '/path/to/project',
 * });
 *
 * const result = await resolver.resolve('./instructions.prs');
 * if (result.ast) {
 *   console.log('Resolved successfully');
 * }
 * ```
 */
export class Resolver {
  private readonly loader: FileLoader;
  private readonly cache: Map<string, ResolvedAST>;
  private readonly cacheEnabled: boolean;
  private readonly logger: Logger;
  private readonly options: ResolverOptions;
  private readonly gitRegistry: GitRegistry;
  private readonly registryCache: RegistryCache;

  constructor(options: ResolverOptions) {
    this.options = options;
    this.loader = new FileLoader(options);
    this.cache = new Map();
    this.cacheEnabled = options.cache !== false;
    this.logger = options.logger ?? noopLogger;
    this.gitRegistry = new GitRegistry({ url: 'https://github.com/placeholder/placeholder.git' });
    const defaultCacheDir = join(
      process.env['HOME'] ?? process.env['USERPROFILE'] ?? '/tmp',
      '.promptscript',
      'cache'
    );
    this.registryCache = new RegistryCache(options.cacheDir ?? defaultCacheDir);
  }

  /**
   * Resolve a PromptScript file and all its dependencies.
   *
   * @param entryPath - Path to the entry file
   * @returns Resolved AST with sources and errors
   * @throws CircularDependencyError if a circular dependency is detected
   */
  async resolve(
    entryPath: string,
    compositionContext?: CompositionResolutionContext
  ): Promise<ResolvedAST> {
    return this.resolveWithContext(entryPath, createResolutionContext(), compositionContext);
  }

  private async resolveWithContext(
    entryPath: string,
    context: ResolutionContext,
    compositionContext?: CompositionResolutionContext
  ): Promise<ResolvedAST> {
    const absPath = this.loader.toAbsolutePath(entryPath);

    // Check for circular dependency
    if (context.resolving.has(absPath)) {
      this.logger.debug(`Circular dependency detected: ${absPath}`);
      throw new CircularDependencyError([...context.resolving, absPath]);
    }

    // Check cache
    if (!compositionContext && this.cacheEnabled && this.cache.has(absPath)) {
      this.logger.debug(`Cache hit: ${absPath}`);
      return this.cache.get(absPath)!;
    }

    context.resolving.add(absPath);
    this.logger.verbose(`Parsing ${absPath}`);

    try {
      const result = await this.doResolve(absPath, context, compositionContext);

      if (!compositionContext && this.cacheEnabled) {
        this.logger.debug(`Cache store: ${absPath}`);
        this.cache.set(absPath, result);
      }

      return result;
    } finally {
      context.resolving.delete(absPath);
    }
  }

  /**
   * Perform the actual resolution.
   */
  private async doResolve(
    absPath: string,
    context: ResolutionContext,
    compositionContext?: CompositionResolutionContext
  ): Promise<ResolvedAST> {
    const sources: string[] = [absPath];
    const dependencies = new Set<string>([absPath]);
    const errors: ResolveError[] = [];
    const inheritedProvenance: ProvenanceEntry[] = [];
    const provenanceEvents: ProvenanceEvent[] = [];

    // Load and parse file
    const parseData = await this.loadAndParse(absPath, sources, dependencies, errors, context);
    if (!parseData.ast) {
      return {
        ast: null,
        canonicalAst: null,
        sources,
        dependencies: [...dependencies],
        errors,
        provenance: emptyProvenance(absPath),
      };
    }

    let ast = parseData.ast;
    const sequentialOperations = await this.usesSequentialOperationsAfterComposition(
      ast,
      absPath,
      context
    );
    ast = normalizeBlockAliases(ast, {
      preserveDeclarationOrder: sequentialOperations,
    });
    ast = ensureAgentProvenance(ast, absPath);
    this.logger.debug(`AST node count: ${this.countNodes(ast)}`);

    if (sequentialOperations) {
      ast = await this.resolveSequentialOperations(
        ast,
        absPath,
        sources,
        dependencies,
        errors,
        context,
        inheritedProvenance,
        provenanceEvents,
        compositionContext
      );
    } else {
      // Preserve legacy phase ordering through syntax 1.5.x.
      ast = await this.resolveInherit(
        ast,
        absPath,
        sources,
        dependencies,
        errors,
        context,
        inheritedProvenance,
        false
      );
      ast = await this.resolveImports(
        ast,
        absPath,
        sources,
        dependencies,
        errors,
        context,
        inheritedProvenance
      );
    }

    // Legacy phase order resolves inline composition after top-level imports.
    if (!sequentialOperations) {
      ast = await this.resolveComposition(
        ast,
        absPath,
        sources,
        dependencies,
        errors,
        context,
        provenanceEvents,
        compositionContext
      );
    }

    // Apply extensions
    if (!sequentialOperations && ast.extends.length > 0) {
      this.logger.debug(`Applying ${ast.extends.length} extension(s)`);
    }
    if (!sequentialOperations) {
      const syntaxFeatures = getSyntaxFeatureUsages(ast);
      let extended = ast;
      for (const extension of ast.extends) {
        const targetPath = effectiveCompositionPath(extended.blocks, extension.targetPath);
        const baseBlock = extended.blocks.find((block) => block.name === targetPath.split('.')[0]);
        extended = {
          ...extended,
          blocks: applyExtend(extended.blocks, extension, this.logger),
        };
        const rootName = targetPath.split('.')[0];
        const finalBlockContent = extended.blocks.find((block) => block.name === rootName)?.content;
        const finalBlock = extended.blocks.find((block) => block.name === rootName);
        const finalContent = finalBlockContent
          ? contentAtPath(finalBlockContent, targetPath)
          : undefined;
        provenanceEvents.push(
          ...collectProvenanceEvents(
            extension.canonicalBody,
            targetPath,
            'extend',
            extension.loc,
            extension.replacements?.length ? 'replaced' : 'merged',
            extensionStrategy(targetPath, Boolean(extension.replacements?.length)),
            {
              finalContent,
              finalBody: finalBlock?.canonicalBody,
              baseContent: baseBlock?.content,
              resolveDetails: skillLayerDetails(finalBlockContent, targetPath, extension.loc.file),
            }
          )
        );
      }
      ast = {
        ...extended,
        blocks: extended.blocks.filter((block) => !block.name.startsWith(IMPORT_MARKER_PREFIX)),
        extends: [],
        syntaxFeatures,
      };
    }

    // Resolve guard requires dependencies
    ast = resolveGuardRequires(ast, {
      maxDepth: this.options.guardRequiresDepth ?? 3,
    });

    // Resolve native skill files (replace @skills content with SKILL.md files if available)
    // Preserve the parent fallback for custom local paths.
    const configuredProjectRoot = this.options.skills?.projectRoot ?? this.options.projectRoot;
    const projectRoot =
      configuredProjectRoot ??
      (basename(this.loader.getLocalPath()) === '.promptscript'
        ? this.loader.getProjectRoot()
        : undefined);
    const discoveryOptions = {
      ...this.options.skills,
      ...(projectRoot ? { projectRoot } : {}),
      logger: this.logger,
    };

    ast = await resolveNativeSkills(
      ast,
      this.loader.getRegistryPath(),
      absPath,
      this.loader.getLocalPath(),
      discoveryOptions
    );

    // Auto-discover command files from local and universal directories
    ast = await resolveNativeCommands(ast, absPath, this.loader.getLocalPath(), discoveryOptions);

    // Auto-discover agent files from local and universal directories
    ast = await resolveNativeAgents(ast, absPath, this.loader.getLocalPath(), discoveryOptions);

    const localDiscoveryPath = this.loader.getLocalPath();
    for (const directory of ['skills', 'commands', 'agents', 'shared'] as const) {
      dependencies.add(resolve(localDiscoveryPath, directory));
    }
    dependencies.add(resolve(this.loader.getRegistryPath(), '@skills'));
    dependencies.add(resolve(this.loader.getProjectRoot(), '.promptscript', 'scripts'));
    if (discoveryOptions.universalDir) {
      for (const directory of ['skills', 'commands', 'agents'] as const) {
        dependencies.add(
          resolve(this.loader.getProjectRoot(), discoveryOptions.universalDir, directory)
        );
      }
    }

    collectDependencyPaths(ast, dependencies);
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
      dependencies: [...dependencies],
      errors,
    };
  }

  /**
   * Select operation semantics from the complete reachable source graph.
   *
   * A lower-version entry file can compose a source that requires ordered
   * operations. Inspect dependencies before normalizing or resolving the
   * entry file so imports and local declarations use the effective mode.
   */
  private async usesSequentialOperationsAfterComposition(
    ast: Program,
    absPath: string,
    context: ResolutionContext
  ): Promise<boolean> {
    return this.inspectOperationMode(ast, absPath, new Set([absPath]), context);
  }

  private async inspectOperationMode(
    ast: Program,
    absPath: string,
    visited: Set<string>,
    context: ResolutionContext
  ): Promise<boolean> {
    const cachedMode = context.operationModeCache.get(absPath);
    if (cachedMode !== undefined) return cachedMode;

    if (usesSequentialOperations(ast)) {
      context.operationModeCache.set(absPath, true);
      return true;
    }

    const references = [
      ...(ast.inherit ? [ast.inherit.path] : []),
      ...ast.uses.map((use) => use.path),
      ...ast.blocks.flatMap((block) => getInlineUses(block).map((use) => use.path)),
      ...ast.extends.flatMap((extension) => {
        const content = extension.content;
        if (content.type !== 'ObjectContent' && content.type !== 'MixedContent') {
          return [];
        }
        return (content.inlineUses ?? []).map((use) => use.path);
      }),
    ];

    for (const reference of references) {
      let dependencyPath: string;
      try {
        dependencyPath = this.loader.resolveRef(reference, absPath);
      } catch {
        // The normal resolution pass reports invalid references.
        continue;
      }
      if (visited.has(dependencyPath)) continue;
      visited.add(dependencyPath);

      let dependencyAst: Program | null;
      try {
        if (dependencyPath.startsWith(REGISTRY_MARKER_PREFIX)) {
          const preflightErrors: ResolveError[] = [];
          const dependency = await this.resolveRegistryImport(
            dependencyPath,
            preflightErrors,
            context
          );
          dependencyAst = dependency.ast;
          context.preflightRegistryImports.set(dependencyPath, {
            type: 'result',
            result:
              preflightErrors.length > 0 && dependency.errors.length === 0
                ? { ...dependency, errors: preflightErrors }
                : dependency,
          });
        } else {
          // Mode inspection runs before resolution, so watch dependencies are
          // recorded by the real resolve pass rather than this probe.
          dependencyAst = (await this.loadAndParse(dependencyPath, [], new Set(), [], context)).ast;
        }
      } catch (error) {
        if (dependencyPath.startsWith(REGISTRY_MARKER_PREFIX)) {
          context.preflightRegistryImports.set(dependencyPath, { type: 'error', error });
        }
        continue;
      }
      if (
        dependencyAst &&
        (await this.inspectOperationMode(
          dependencyAst,
          dependencyAst.loc.file || dependencyPath,
          visited,
          context
        ))
      ) {
        context.operationModeCache.set(absPath, true);
        return true;
      }
    }

    context.operationModeCache.set(absPath, false);
    return false;
  }

  private async resolveSequentialOperations(
    ast: Program,
    absPath: string,
    sources: string[],
    dependencies: Set<string>,
    errors: ResolveError[],
    context: ResolutionContext,
    inheritedProvenance: ProvenanceEntry[],
    provenanceEvents: ProvenanceEvent[],
    compositionContext?: CompositionResolutionContext
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
            dependencies,
            errors,
            context,
            inheritedProvenance,
            true
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
            dependencies,
            errors,
            context,
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
            dependencies,
            errors,
            context,
            provenanceEvents,
            compositionContext
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
            const baseBlock = result.blocks.find(
              (block) =>
                block.name ===
                effectiveCompositionPath(result.blocks, extension.targetPath).split('.')[0]
            );
            result = {
              ...result,
              blocks: applyExtend(result.blocks, extension, this.logger),
            };
            const targetPath = effectiveCompositionPath(result.blocks, extension.targetPath);
            const rootName = targetPath.split('.')[0];
            const finalBlockContent = result.blocks.find(
              (block) => block.name === rootName
            )?.content;
            const finalBlock = result.blocks.find((block) => block.name === rootName);
            const finalContent = finalBlockContent
              ? contentAtPath(finalBlockContent, targetPath)
              : undefined;
            provenanceEvents.push(
              ...collectProvenanceEvents(
                extension.canonicalBody,
                targetPath,
                'extend',
                extension.loc,
                extension.replacements?.length ? 'replaced' : 'merged',
                extensionStrategy(targetPath, Boolean(extension.replacements?.length)),
                {
                  finalContent,
                  finalBody: finalBlock?.canonicalBody,
                  baseContent: baseBlock?.content,
                  resolveDetails: skillLayerDetails(
                    finalBlockContent,
                    targetPath,
                    extension.loc.file
                  ),
                }
              )
            );
            result = await this.resolveComposition(
              result,
              absPath,
              sources,
              dependencies,
              errors,
              context,
              provenanceEvents,
              compositionContext
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
              dependencies,
              errors,
              context,
              provenanceEvents,
              compositionContext
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
   * Count nodes in AST for debug output.
   */
  private countNodes(ast: Program): number {
    let count = 1; // Program node itself
    if (ast.meta) count++;
    if (ast.inherit) count++;
    count += ast.uses.length;
    count += ast.blocks.length;
    count += ast.extends.length;
    count += ast.overrides?.length ?? 0;
    return count;
  }

  /**
   * Load and parse a file.
   */
  private async loadAndParse(
    absPath: string,
    sources: string[],
    dependencies: Set<string>,
    errors: ResolveError[],
    context: ResolutionContext
  ): Promise<{ ast: Program | null }> {
    const cachedFile = context.parsedFiles.get(absPath);
    if (cachedFile) {
      errors.push(...cachedFile.errors);
      return { ast: cachedFile.ast };
    }

    let source: string;
    try {
      source = await this.loader.load(absPath);
    } catch (err) {
      if (err instanceof FileNotFoundError) {
        // Directory fallback: if path looks like .prs was appended, try as directory
        if (absPath.endsWith('.prs')) {
          const possibleDir = absPath.slice(0, -4); // strip .prs
          const dirErrors: ResolveError[] = [];
          const dirResult = await this.tryDirectoryScan(
            possibleDir,
            sources,
            dependencies,
            dirErrors
          );
          if (dirResult) {
            errors.push(...dirErrors);
            if (dirResult.ast) {
              context.parsedFiles.set(absPath, {
                ast: dirResult.ast,
                errors: dirErrors,
              });
            }
            return dirResult;
          }
        }
        errors.push(new ResolveError(err.message));
        return { ast: null };
      }
      throw err;
    }

    // Route .md files through content detection
    if (absPath.endsWith('.md')) {
      const mdErrors: ResolveError[] = [];
      const result = await this.loadAndParseMd(absPath, source, mdErrors);
      errors.push(...mdErrors);
      if (result.ast) {
        context.parsedFiles.set(absPath, {
          ast: result.ast,
          errors: mdErrors,
        });
      }
      return result;
    }

    const parseResult = parse(source, { filename: absPath });

    if (!parseResult.ast) {
      for (const e of parseResult.errors) {
        errors.push(new ResolveError(e.message, e.location));
      }
      return { ast: null };
    }

    const parseErrors = parseResult.errors.map(
      (err) => new ResolveError(err.message, err.location)
    );
    errors.push(...parseErrors);
    context.parsedFiles.set(absPath, {
      ast: parseResult.ast,
      errors: parseErrors,
    });

    return { ast: parseResult.ast };
  }

  /**
   * Load and parse a .md file, routing through content detection.
   *
   * If the content looks like PRS (has @identity block), parse as PRS.
   * If it has YAML frontmatter, treat as a skill and synthesize a Program
   * with a @skills block. Resource files alongside SKILL.md and explicit
   * `references:` entries are loaded so registry-imported skills behave the
   * same as locally-discovered ones.
   * Otherwise, treat as raw markdown and synthesize a Program with a @skills
   * block using the filename as the skill name.
   */
  private async loadAndParseMd(
    absPath: string,
    source: string,
    errors: ResolveError[]
  ): Promise<{ ast: Program | null }> {
    const contentType = detectContentType(source);

    if (contentType === 'prs') {
      // Parse as PromptScript
      const parseResult = parse(source, { filename: absPath });
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

    // skill or raw -> synthesize Program with @skills block
    let parsed: ReturnType<typeof parseSkillMd>;
    try {
      parsed = parseSkillMd(source, absPath);
    } catch (error: unknown) {
      errors.push(
        error instanceof ResolveError
          ? error
          : new ResolveError(
              `Skill frontmatter parsing failed: ${
                error instanceof Error ? error.message : String(error)
              }`,
              { file: absPath, line: 1, column: 1 }
            )
      );
      return { ast: null };
    }
    const skillName = parsed.name ?? skillNameFromPath(absPath);

    if (!parsed.name) {
      this.logger.verbose(
        `Missing frontmatter in ${absPath} — using filename "${skillName}" as skill name`
      );
    }

    const skillProps: Record<string, Value> = {};
    if (parsed.description) {
      skillProps['description'] = parsed.description;
    }
    if (parsed.content) {
      skillProps['content'] = makeTextContent(parsed.content, absPath);
    }
    addParsedSkillMetadata(skillProps, parsed);

    // Discover resource files alongside the SKILL.md and explicit reference
    // entries. This mirrors the behaviour of resolveNativeSkills() so a skill
    // pulled in via a registry import carries the same resources as a locally
    // discovered one.
    const collected = await collectSkillResources(absPath, parsed, this.logger);
    errors.push(...collected.errors);

    if (collected.resources.length > 0) {
      skillProps['resources'] = toSkillResourceValues(collected.resources);
    }

    const program: Program = {
      type: 'Program',
      blocks: [makeBlock('skills', makeObjectContent({ [skillName]: skillProps }))],
      uses: [],
      extends: [],
      loc: VIRTUAL_LOC,
    };

    return { ast: program };
  }

  /**
   * Resolve @inherit declaration.
   */
  private async resolveInherit(
    ast: Program,
    absPath: string,
    sources: string[],
    dependencies: Set<string>,
    errors: ResolveError[],
    context: ResolutionContext,
    inheritedProvenance: ProvenanceEntry[] = [],
    parentWins = false
  ): Promise<Program> {
    if (!ast.inherit) {
      return ast;
    }

    const parentPath = this.loader.resolveRef(ast.inherit.path, absPath);
    this.logger.verbose(`Resolving inherit: ${ast.inherit.path.raw}`);
    this.logger.verbose(`  → ${parentPath}`);

    try {
      let parent: ResolvedAST;
      if (parentPath.startsWith(REGISTRY_MARKER_PREFIX)) {
        parent = await this.resolveRegistryImport(parentPath, errors, context);
      } else {
        parent = await this.resolveWithContext(parentPath, context);
      }
      sources.push(...parent.sources);
      addDependencyPaths(dependencies, parent.dependencies ?? []);
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
        // Handle parameterized inheritance
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
        const inherited = resolveInheritance(resolvedParent, ast);
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
      if (err instanceof AgentConflictError) {
        errors.push(err);
        return ast;
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
    dependencies: Set<string>,
    errors: ResolveError[],
    context: ResolutionContext,
    inheritedProvenance: ProvenanceEntry[] = []
  ): Promise<Program> {
    let result = ast;

    for (const use of ast.uses) {
      const importPath = this.loader.resolveRef(use.path, absPath);
      this.logger.verbose(`Resolving import: ${use.path.raw}`);
      this.logger.verbose(`  → ${importPath}`);

      try {
        let imported: ResolvedAST;

        if (importPath.startsWith(REGISTRY_MARKER_PREFIX)) {
          // Remote registry import — handle async Git resolution
          imported = await this.resolveRegistryImport(importPath, errors, context);
        } else {
          imported = await this.resolveWithContext(importPath, context);
        }

        sources.push(...imported.sources);
        addDependencyPaths(dependencies, imported.dependencies ?? []);
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
          let resolvedImport = imported.ast;

          // Extract reserved params (only/exclude/includes/excludes) before they reach bindParams
          const { only, exclude, includes, excludes, remaining } = extractReservedParams(
            use.params
          );

          // Handle template parameter interpolation with remaining (non-reserved) params
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

          // Apply block filtering (post-interpolation)
          if (only || exclude) {
            this.logger.debug(
              `Filtering blocks: ${only ? `only=[${only.join(',')}]` : `exclude=[${exclude!.join(',')}]`}`
            );
            resolvedImport = {
              ...resolvedImport,
              blocks: filterBlocks(resolvedImport.blocks, { only, exclude }),
            };
          }

          // Apply skill filtering (post-interpolation, post-block-filter)
          if (includes || excludes) {
            this.logger.debug(
              `Filtering skills: ${includes ? `includes=[${includes.join(',')}]` : `excludes=[${excludes!.join(',')}]`}`
            );
            resolvedImport = filterSkillsBlock(resolvedImport, { includes, excludes });
          }

          // If no inline `into "<path>"` was given, fall back to the
          // skillTargets map from resolver options. When both are set the
          // inline directive wins and we surface a warning so users notice
          // the redundant config entry.
          let effectiveUse = use;
          const fromConfig = this.options.skillTargets?.[use.path.raw];
          if (use.outputDir && fromConfig && use.outputDir !== fromConfig) {
            this.logger.warn(
              `@use ${use.path.raw} into "${use.outputDir}" overrides skillTargets["${use.path.raw}"]="${fromConfig}"`
            );
          } else if (!use.outputDir && fromConfig) {
            effectiveUse = { ...use, outputDir: fromConfig };
          }

          this.logger.debug(
            `Merging import${effectiveUse.alias ? ` as "${effectiveUse.alias}"` : ''}${
              effectiveUse.outputDir ? ` into "${effectiveUse.outputDir}"` : ''
            }`
          );
          result = resolveUses(result, effectiveUse, resolvedImport);
        }
      } catch (err) {
        if (err instanceof CircularDependencyError) {
          throw err;
        }
        if (err instanceof AgentConflictError) {
          errors.push(err);
          continue;
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
   */
  private async resolveComposition(
    ast: Program,
    absPath: string,
    sources: string[],
    dependencies: Set<string>,
    errors: ResolveError[],
    context: ResolutionContext,
    provenanceEvents: ProvenanceEvent[] = [],
    compositionContext?: CompositionResolutionContext
  ): Promise<Program> {
    try {
      const inlineUses = ast.blocks
        .filter(isCompositionBlock)
        .flatMap(
          (block) => block.content.inlineUses?.map((declaration) => ({ block, declaration })) ?? []
        );
      ast = await resolveSkillComposition(ast, {
        currentFile: absPath,
        ...(compositionContext
          ? {
              resolutionStack: compositionContext.resolutionStack,
              depth: compositionContext.depth,
            }
          : {}),
        resolvePath: (ref: string, fromFile: string): string => {
          // Build a PathReference from the raw string, matching how the parser does it
          const isRelative = ref.startsWith('./') || ref.startsWith('../');
          const segments = ref.split('/').filter((s) => s !== '.' && s !== '..');

          const pathRef = {
            type: 'PathReference' as const,
            raw: ref,
            segments,
            isRelative,
            loc: { file: fromFile, line: 1, column: 1, offset: 0 },
          };

          return this.loader.resolveRef(pathRef, fromFile);
        },
        resolveFile: async (
          subPath: string,
          childContext?: CompositionResolutionContext
        ): Promise<ResolvedCompositionFile> => {
          const subResult = await this.resolveWithContext(subPath, context, childContext);
          if (subResult.sources.length > 0) {
            sources.push(...subResult.sources);
          }
          addDependencyPaths(dependencies, subResult.dependencies ?? []);
          if (subResult.errors.length > 0) {
            errors.push(...subResult.errors);
          }
          if (!subResult.ast) {
            throw new ResolveError(`Failed to resolve sub-skill: ${subPath}`);
          }
          return {
            ast: subResult.ast,
            provenance: subResult.provenance,
          };
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
              (declaration) => this.loader.resolveRef(declaration.path, absPath),
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
   * Resolve a remote registry import from a `__registry__:` marker path.
   *
   * Steps:
   * 1. Parse the marker to extract repoUrl, path, version
   * 2. Check lockfile for pinned commit
   * 3. Check RegistryCache for cached version
   * 4. On cache miss: clone via GitRegistry (cloneAtTag for tagged versions)
   * 5. Look for .prs file at the path in the cached repo
   * 6. If no .prs found: call discoverNativeContent() for auto-discovery
   * 7. Parse the result and return as ResolvedAST
   */
  private async resolveRegistryImport(
    marker: string,
    errors: ResolveError[],
    context: ResolutionContext
  ): Promise<ResolvedAST> {
    const preflightResult = context.preflightRegistryImports.get(marker);
    if (preflightResult) {
      context.preflightRegistryImports.delete(marker);
      if (preflightResult.type === 'error') {
        throw preflightResult.error;
      }
      return preflightResult.result;
    }

    const parsed = parseRegistryMarker(marker);
    if (!parsed) {
      errors.push(new ResolveError(`Invalid registry marker: ${marker}`));
      return {
        ast: null,
        canonicalAst: null,
        sources: [marker],
        errors: [],
        provenance: emptyProvenance(marker),
      };
    }

    const { repoUrl, path: subPath, version } = parsed;
    const dependencies = new Set<string>();

    // Check internal AST cache
    if (this.cacheEnabled && this.cache.has(marker)) {
      this.logger.debug(`Cache hit (AST): ${marker}`);
      return this.cache.get(marker)!;
    }

    context.resolving.add(marker);

    try {
      // Check lockfile for pinned commit
      const normalizeLockKey = (value: string): string =>
        value
          .replace(/^(?:https?:\/\/|git:\/\/)/i, '')
          .replace(/^git@([^:]+):/, '$1/')
          .replace(/\.git(?=\/|$)/, '');
      const normalizedRepoUrl = normalizeLockKey(repoUrl);
      const lockEntry = Object.entries(this.options.lockfile?.dependencies ?? {}).find(
        ([key, dependency]) => {
          const normalizedKey = normalizeLockKey(key);
          return (
            normalizedKey === normalizedRepoUrl ||
            (dependency.source === 'md' && normalizedKey === `${normalizedRepoUrl}/${subPath}`)
          );
        }
      )?.[1];
      const effectiveVersion = lockEntry?.version ?? (version || 'latest');
      const lockfileCommit =
        lockEntry?.commit &&
        /^[0-9a-f]{40}$/i.test(lockEntry.commit) &&
        !/^0{40}$/.test(lockEntry.commit)
          ? lockEntry.commit
          : null;
      const markerCommit =
        version && /^[0-9a-f]{40}$/i.test(version) && !/^0{40}$/.test(version) ? version : null;
      const lockedCommit = lockfileCommit ?? markerCommit;
      if (this.options.lockfile && !lockfileCommit) {
        throw new Error(`Remote dependency is not pinned by the lockfile: ${repoUrl}`);
      }

      const requestedRef = lockEntry?.version ?? (version || undefined);
      const tag =
        requestedRef && requestedRef !== 'latest' && !/^[0-9a-f]{40}$/i.test(requestedRef)
          ? requestedRef
          : undefined;

      let cachePath: string;
      let vendoredPath: string | null = null;
      const vendorManifest = this.options.vendorDir
        ? await loadVendorManifest(this.options.vendorDir)
        : null;
      if (this.options.vendorDir && existsSync(this.options.vendorDir) && !vendorManifest) {
        throw new Error(`Vendor manifest is missing: ${this.options.vendorDir}`);
      }
      if (this.options.vendorDir && vendorManifest) {
        if (!lockEntry || !lockedCommit) {
          throw new Error(`Vendored dependency is not pinned by the lockfile: ${repoUrl}`);
        }
        vendoredPath = await resolveVendoredRepository(
          this.options.vendorDir,
          repoUrl,
          lockEntry.version,
          lockedCommit
        );
      }

      if (vendoredPath) {
        this.logger.debug(`Vendor hit: ${repoUrl}@${effectiveVersion}`);
        cachePath = vendoredPath;
      } else if (await this.registryCache.has(repoUrl, effectiveVersion)) {
        this.logger.debug(`Registry cache hit: ${repoUrl}@${effectiveVersion}`);
        cachePath = this.registryCache.getCachePath(repoUrl, effectiveVersion);

        // If lockfile pins a specific commit, verify the cached repo matches
        if (lockedCommit) {
          let cacheMatchesLock = false;
          try {
            await verifyGitRepositoryCheckout(
              cachePath,
              '.git',
              lockedCommit,
              new Set(['.prs-registry-meta.json'])
            );
            cacheMatchesLock = true;
          } catch {
            cacheMatchesLock = false;
          }
          if (!cacheMatchesLock) {
            if (this.options.readOnly) {
              throw new Error(
                `Cached registry ${repoUrl}@${effectiveVersion} does not match locked commit ${lockedCommit}. ` +
                  'Read-only resolution cannot repair the registry cache.'
              );
            }
            this.logger.verbose(
              `Registry cache does not match locked commit for ${repoUrl}. Re-cloning.`
            );
            const cloneRepoUrl = repoUrl;
            const fallbackRepoUrl =
              lockEntry?.gitUrl ??
              (this.options.registries
                ? findFallbackUrl(repoUrl, this.options.registries)
                : undefined);
            await this.gitRegistry.cloneAtTag(cloneRepoUrl, tag, cachePath, fallbackRepoUrl);
            await this.gitRegistry.checkoutCommit(cachePath, lockedCommit);
            await this.registryCache.set(repoUrl, effectiveVersion, lockedCommit);
            await verifyGitRepositoryCheckout(
              cachePath,
              '.git',
              lockedCommit,
              new Set(['.prs-registry-meta.json'])
            );
          }
        }
      } else {
        if (this.options.readOnly) {
          throw new Error(
            `Registry ${repoUrl}@${effectiveVersion} is not available in the existing cache. ` +
              'Read-only resolution cannot clone remote registries. Run `prs vendor sync` or `prs compile` first.'
          );
        }
        this.logger.verbose(`Registry cache miss, cloning: ${repoUrl}@${tag ?? 'default'}`);
        cachePath = this.registryCache.getCachePath(repoUrl, effectiveVersion);

        // Look up fallback URL from registries config (for HTTPS→SSH auth retry)
        const cloneRepoUrl = repoUrl;
        const fallbackRepoUrl =
          lockEntry?.gitUrl ??
          (this.options.registries ? findFallbackUrl(repoUrl, this.options.registries) : undefined);

        // Clone using GitRegistry
        await this.gitRegistry.cloneAtTag(cloneRepoUrl, tag, cachePath, fallbackRepoUrl);

        // If lockfile pins a specific commit, checkout that exact commit
        if (lockedCommit) {
          this.logger.verbose(`Checking out locked commit: ${lockedCommit}`);
          await this.gitRegistry.checkoutCommit(cachePath, lockedCommit);
        }

        // Record in RegistryCache
        const commitHash = lockedCommit ?? lockEntry?.commit ?? 'unknown';
        await this.registryCache.set(repoUrl, effectiveVersion, commitHash);
        if (lockedCommit) {
          await verifyGitRepositoryCheckout(
            cachePath,
            '.git',
            lockedCommit,
            new Set(['.prs-registry-meta.json'])
          );
        }
      }
      dependencies.add(cachePath);

      // Resolve the file path within the cached repo. An empty sub-path means
      // the import targets the repository root (e.g. `@use github.com/foo/bar`)
      // so we skip the .prs/.md guess and go straight to auto-discovery.
      const isRoot = subPath === '';
      const isMdPath = !isRoot && subPath.endsWith('.md');
      const resolvedFileName = isRoot
        ? ''
        : isMdPath
          ? subPath
          : subPath.endsWith('.prs')
            ? subPath
            : `${subPath}.prs`;
      const resolvedFullPath = isRoot ? '' : join(cachePath, resolvedFileName);

      // Path containment check: ensure resolved path stays within cachePath
      // to prevent directory traversal via crafted subpaths (e.g. ../../etc/passwd)
      if (!isRoot) {
        const rel = relative(resolve(cachePath), resolve(resolvedFullPath));
        if (rel.startsWith('..') || resolve(resolvedFullPath) === resolve(cachePath)) {
          errors.push(
            new ResolveError(
              `Path traversal detected: subpath '${subPath}' escapes repository cache boundary.`
            )
          );
          context.resolving.delete(marker);
          return {
            ast: null,
            canonicalAst: null,
            sources: [marker],
            errors,
            provenance: emptyProvenance(marker),
          };
        }
        if (
          existsSync(resolvedFullPath) &&
          !(await isRealPathInside(resolvedFullPath, cachePath))
        ) {
          errors.push(
            new ResolveError(
              `Path traversal detected: subpath '${subPath}' resolves outside the repository cache boundary.`
            )
          );
          context.resolving.delete(marker);
          return {
            ast: null,
            canonicalAst: null,
            sources: [marker],
            errors,
            provenance: emptyProvenance(marker),
          };
        }
      }

      let resolvedAST: Program | null = null;

      if (!isRoot && existsSync(resolvedFullPath) && isMdPath) {
        // Found a .md file — route through content detection
        this.logger.debug(`Found .md file: ${resolvedFullPath}`);
        dependencies.add(resolvedFullPath);
        const source = await readFile(resolvedFullPath, 'utf-8');
        const mdResult = await this.loadAndParseMd(resolvedFullPath, source, errors);
        resolvedAST = mdResult.ast;
      } else if (!isRoot && existsSync(resolvedFullPath)) {
        // Found a .prs file — parse it
        this.logger.debug(`Found .prs file: ${resolvedFullPath}`);
        dependencies.add(resolvedFullPath);
        const source = await this.loader.load(resolvedFullPath);
        const parseResult = parse(source, { filename: resolvedFullPath });

        if (parseResult.ast) {
          resolvedAST = parseResult.ast;
        } else {
          for (const e of parseResult.errors) {
            errors.push(new ResolveError(e.message, e.location));
          }
        }
      } else if (isMdPath) {
        // Explicit .md path that does not exist — do not fall through to
        // directory auto-discovery (subPath is a file, not a directory).
        errors.push(
          new ResolveError(
            `Cannot resolve registry import: file '${subPath}' not found in ${repoUrl} (looked for ${resolvedFullPath}). Verify the path inside the repository.`
          )
        );
      } else {
        // No file found — try directory import and auto-discovery
        const discoverDir = isRoot ? cachePath : join(cachePath, subPath);

        // The lexical containment check above covers traversal before discovery.
        if (
          !isRoot &&
          existsSync(discoverDir) &&
          !(await isRealPathInside(discoverDir, cachePath))
        ) {
          errors.push(
            new ResolveError(
              `Path traversal detected: subpath '${subPath}' resolves outside the repository cache boundary.`
            )
          );
          context.resolving.delete(marker);
          return {
            ast: null,
            canonicalAst: null,
            sources: [marker],
            errors,
            provenance: emptyProvenance(marker),
          };
        }

        if (!isRoot && !existsSync(discoverDir)) {
          errors.push(
            new ResolveError(
              `Cannot resolve registry import: path '${subPath}' does not exist in repository ${repoUrl}.`
            )
          );
        } else {
          this.logger.debug(
            `No .prs found, trying directory scan and auto-discovery: ${discoverDir}`
          );

          dependencies.add(discoverDir);
          // Scan errors only matter when the scan produced skills: an empty
          // directory scan is the normal path into auto-discovery below.
          const scanErrors: ResolveError[] = [];
          const dirResult = await this.tryDirectoryScan(
            discoverDir,
            [marker],
            dependencies,
            scanErrors
          );
          if (dirResult?.ast) {
            resolvedAST = dirResult.ast;
            errors.push(...scanErrors);
          } else {
            resolvedAST = await discoverNativeContent(discoverDir, this.logger);

            if (!resolvedAST) {
              const where = isRoot ? '<repository root>' : `'${subPath}'`;
              const hint = isRoot ? ` Specify a sub-path (e.g. ${repoUrl}/skills/<name>).` : '';
              errors.push(
                new ResolveError(
                  `Cannot resolve registry import: no .prs file, .md file, or native content at ${where} in ${repoUrl}.${hint}`
                )
              );
            }
          }
        }
      }

      const result: ResolvedAST = {
        ast: resolvedAST,
        canonicalAst: resolvedAST ? normalizeProgram(resolvedAST) : null,
        sources: [marker],
        dependencies: [...dependencies],
        errors: [],
        provenance: resolvedAST
          ? collectProvenance(resolvedAST, { entry: marker })
          : emptyProvenance(marker),
      };
      if (resolvedAST) {
        collectDependencyPaths(resolvedAST, dependencies);
        result.dependencies = [...dependencies];
      }

      if (this.cacheEnabled) {
        this.cache.set(marker, result);
      }

      return result;
    } finally {
      context.resolving.delete(marker);
    }
  }

  /**
   * Try scanning a path as a directory of skills.
   *
   * Called when loadAndParse cannot find a .prs file. Checks whether
   * the original path (without .prs) is a real directory, scans it
   * for SKILL.md / dirname.md files, and synthesizes a Program with
   * a @skills block.
   *
   * @returns A parse result if the path is a directory, or null to
   *          let normal error handling continue.
   */
  private async tryDirectoryScan(
    dirPath: string,
    sources: string[],
    dependencies: Set<string>,
    errors: ResolveError[]
  ): Promise<{ ast: Program | null } | null> {
    dependencies.add(dirPath);
    let stat;
    try {
      stat = await lstat(dirPath);
    } catch {
      return null; // path doesn't exist at all
    }

    if (!stat.isDirectory() || stat.isSymbolicLink()) {
      return null;
    }

    this.logger.verbose(`Directory import detected: ${dirPath}`);
    const properties = await this.scanDirectoryForSkills(dirPath, errors);

    if (Object.keys(properties).length === 0) {
      errors.push(new ResolveError(`No skills found in directory: ${dirPath}`));
      return { ast: null };
    }

    this.logger.debug(`Found ${Object.keys(properties).length} skill(s) in directory: ${dirPath}`);

    const program: Program = {
      type: 'Program',
      blocks: [makeBlock('skills', makeObjectContent(properties))],
      uses: [],
      extends: [],
      loc: VIRTUAL_LOC,
    };

    return { ast: program };
  }

  /**
   * Scan a directory for skill files using BFS up to depth 3.
   *
   * The directory may be the skill itself — `@use ./skills/my-tool` pointing at
   * a directory whose own root holds SKILL.md — so that entry is picked up
   * first and wins any name clash with a deeper one.
   *
   * For each subdirectory:
   * - Skip if symlink
   * - Check for SKILL.md first
   * - Fallback: check for <dirname>.md
   * - Ignore other .md files (README, etc.)
   * - If a skill is found, do not recurse deeper into that subdirectory
   *
   * @param dir - Absolute path to the directory to scan
   * @param errors - Accumulator for resource resolution errors
   * @returns Accumulated skill properties keyed by skill name
   */
  private async scanDirectoryForSkills(
    dir: string,
    errors: ResolveError[]
  ): Promise<Record<string, Value>> {
    const properties: Record<string, Value> = {};
    const rootSkill = await this.readRootSkill(dir, errors);
    if (rootSkill) {
      properties[rootSkill[0]] = rootSkill[1];
    }

    const queue: Array<{ path: string; depth: number }> = [{ path: dir, depth: 0 }];

    while (queue.length > 0) {
      const { path: currentDir, depth } = queue.shift()!;

      let entries;
      try {
        entries = await readdir(currentDir, { withFileTypes: true });
      } catch {
        continue;
      }

      for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        if (entry.isSymbolicLink()) continue;

        const subDir = join(currentDir, entry.name);

        // Check for symlinked directory via lstat
        let subStat;
        try {
          subStat = await lstat(subDir);
        } catch {
          continue;
        }
        if (subStat.isSymbolicLink()) continue;

        // Try SKILL.md first
        const skillMdPath = join(subDir, 'SKILL.md');
        let foundSkill = false;

        try {
          const skillContent = await readFile(skillMdPath, 'utf-8');
          const [skillName, skillProps] = await this.buildSkillFromMd(
            skillMdPath,
            skillContent,
            entry.name,
            errors
          );

          // Shallower skills win: the first entry found for a name is kept.
          if (!(skillName in properties)) {
            properties[skillName] = skillProps;
          }
          foundSkill = true;
          this.logger.debug(`Found skill "${skillName}" via SKILL.md in ${subDir}`);
        } catch (error: unknown) {
          if (error instanceof ResolveError) {
            throw error;
          }
          // SKILL.md not found, try dirname.md fallback
          const dirnameMdPath = join(subDir, `${entry.name}.md`);
          try {
            const fallbackContent = await readFile(dirnameMdPath, 'utf-8');
            const [skillName, skillProps] = await this.buildSkillFromMd(
              dirnameMdPath,
              fallbackContent,
              skillNameFromPath(dirnameMdPath),
              errors
            );

            if (!(skillName in properties)) {
              properties[skillName] = skillProps;
            }
            foundSkill = true;
            this.logger.debug(
              `Found skill "${skillName}" via ${basename(dirnameMdPath)} in ${subDir}`
            );
          } catch (error: unknown) {
            if (error instanceof ResolveError) {
              throw error;
            }
            // Neither file found, will recurse if depth allows
          }
        }

        // Only recurse deeper if no skill was found at this level
        if (!foundSkill && depth < 3) {
          queue.push({ path: subDir, depth: depth + 1 });
        }
      }
    }

    return properties;
  }

  /**
   * Read a SKILL.md sitting at the root of an imported directory.
   *
   * A skill directory is a valid import target on its own, so `@use ./my-skill`
   * resolves the skill the directory holds rather than treating the directory
   * as a container of other skills.
   *
   * @param dir - Absolute path to the imported directory
   * @param errors - Accumulator for resource resolution errors
   * @returns The skill name and properties, or null when the directory holds no SKILL.md
   */
  private async readRootSkill(
    dir: string,
    errors: ResolveError[]
  ): Promise<[string, Record<string, Value>] | null> {
    const skillMdPath = join(dir, 'SKILL.md');

    let source: string;
    try {
      source = await readFile(skillMdPath, 'utf-8');
    } catch {
      return null;
    }

    const skill = await this.buildSkillFromMd(skillMdPath, source, basename(dir), errors);
    this.logger.debug(`Found skill "${skill[0]}" via SKILL.md in ${dir}`);
    return skill;
  }

  /**
   * Build a skill definition from a SKILL.md file found during a directory scan.
   *
   * Carries the same payload as a locally discovered skill: metadata from the
   * frontmatter plus every resource file that travels with the skill directory,
   * so `references/`, `scripts/` and data files survive a directory import.
   *
   * @param skillMdPath - Absolute path to the skill markdown file
   * @param source - Raw markdown content
   * @param fallbackName - Skill name used when the frontmatter declares none
   * @param errors - Accumulator for resource resolution errors
   * @returns The skill name and its synthesized properties
   */
  private async buildSkillFromMd(
    skillMdPath: string,
    source: string,
    fallbackName: string,
    errors: ResolveError[]
  ): Promise<[string, Record<string, Value>]> {
    const parsed = parseSkillMd(source, skillMdPath);
    const skillName = parsed.name ?? fallbackName;

    const skillProps: Record<string, Value> = {};
    if (parsed.description) {
      skillProps['description'] = parsed.description;
    }
    if (parsed.content) {
      skillProps['content'] = makeTextContent(parsed.content, skillMdPath);
    }
    addParsedSkillMetadata(skillProps, parsed);

    const collected = await collectSkillResources(skillMdPath, parsed, this.logger);
    errors.push(...collected.errors);
    if (collected.resources.length > 0) {
      skillProps['resources'] = toSkillResourceValues(collected.resources);
    }

    return [skillName, skillProps];
  }

  /**
   * Clear the resolution cache.
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Invalidate cached resolutions affected by changed files.
   *
   * @param changedPaths - Files or directories that changed
   */
  invalidate(changedPaths: readonly string[]): void {
    if (!this.cacheEnabled || changedPaths.length === 0) return;

    const normalizedChanges = changedPaths.map((path) =>
      isAbsolute(path) ? resolve(path) : resolve(this.loader.getProjectRoot(), path)
    );
    for (const [cacheKey, result] of this.cache) {
      const dependencies = result.dependencies ?? result.sources;
      if (dependencies.length === 0) {
        this.cache.delete(cacheKey);
        continue;
      }

      const affected = dependencies.some((dependency) => {
        if (!isAbsolute(dependency)) return false;
        const normalizedDependency = resolve(dependency);
        return normalizedChanges.some((changedPath) => {
          const relation = relative(normalizedDependency, changedPath);
          return (
            relation === '' ||
            (relation !== '..' && !relation.startsWith(`..${sep}`) && !isAbsolute(relation))
          );
        });
      });
      if (affected) this.cache.delete(cacheKey);
    }
  }

  /**
   * Verify integrity hashes for registry reference files.
   * Reads each referenced file from the registry cache and compares its
   * hash against the lockfile entry.
   *
   * @param lockfile - Lockfile with reference hashes
   * @returns Array of errors for mismatched references
   */
  async verifyReferenceHashes(lockfile: Lockfile): Promise<ResolveError[]> {
    if (!lockfile.references) return [];
    const errors: ResolveError[] = [];
    let hasVendorManifest: boolean;
    try {
      hasVendorManifest = Boolean(
        this.options.vendorDir && (await loadVendorManifest(this.options.vendorDir))
      );
    } catch (error) {
      errors.push(
        new ResolveError(
          error instanceof Error ? error.message : String(error),
          undefined,
          ErrorCode.LOCKFILE_INTEGRITY
        )
      );
      return errors;
    }

    for (const [key, entry] of Object.entries(lockfile.references)) {
      const parts = key.split('\0');
      if (parts.length !== 3) continue;
      const [repoUrl, relativePath, version] = parts as [string, string, string];

      try {
        let repositoryPath: string;
        if (hasVendorManifest && this.options.vendorDir) {
          const dependency = lockfile.dependencies[repoUrl];
          if (!dependency) {
            throw new Error(`Vendored reference repository is not pinned: ${repoUrl}`);
          }
          const vendoredPath = await resolveVendoredRepository(
            this.options.vendorDir,
            repoUrl,
            dependency.version,
            dependency.commit
          );
          if (!vendoredPath) {
            throw new Error(`Vendored reference repository is missing: ${repoUrl}`);
          }
          repositoryPath = vendoredPath;
        } else {
          const configuredRoots = Object.entries(this.options.referenceRoots ?? {}).find(
            ([configuredRepoUrl]) =>
              configuredRepoUrl
                .replace(/^(?:https?:\/\/|git:\/\/)/i, '')
                .replace(/^git@([^:]+):/, '$1/')
                .replace(/\.git(?=\/|$)/, '') ===
              repoUrl
                .replace(/^(?:https?:\/\/|git:\/\/)/i, '')
                .replace(/^git@([^:]+):/, '$1/')
                .replace(/\.git(?=\/|$)/, '')
          )?.[1];
          repositoryPath =
            configuredRoots?.find((root) => existsSync(root)) ??
            this.registryCache.getCachePath(repoUrl, version);
        }
        const fullPath = join(repositoryPath, relativePath);
        if (!existsSync(fullPath)) {
          throw new Error(
            `${hasVendorManifest ? 'Vendored reference' : 'Reference'} file is missing: ${relativePath}`
          );
        }
        if (!(await isRealPathInside(fullPath, repositoryPath))) {
          throw new Error(`Reference path escapes its repository: ${relativePath}`);
        }

        const content = await readFile(fullPath);
        const actualHash = hashContent(content);
        if (actualHash !== entry.hash) {
          errors.push(
            new ResolveError(
              `Reference file hash mismatch: ${relativePath} has changed since last lock. Run \`prs lock --update\` to accept changes.`,
              undefined,
              ErrorCode.LOCKFILE_INTEGRITY
            )
          );
        }
      } catch (error) {
        errors.push(
          new ResolveError(
            error instanceof Error ? error.message : String(error),
            undefined,
            ErrorCode.LOCKFILE_INTEGRITY
          )
        );
      }
    }

    return errors;
  }

  /**
   * Get the file loader.
   */
  getLoader(): FileLoader {
    return this.loader;
  }
}

/**
 * Create a resolver with the given options.
 *
 * @param options - Resolver options
 * @returns A new Resolver instance
 */
export function createResolver(options: ResolverOptions): Resolver {
  return new Resolver(options);
}
