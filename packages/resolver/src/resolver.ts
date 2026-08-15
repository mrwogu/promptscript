import { existsSync } from 'fs';
import { lstat, readdir, readFile } from 'fs/promises';
import { basename, dirname, join, relative, resolve } from 'path';
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
  discoverSkillResources,
  resolveSkillReferences,
  type NativeSkillOptions,
  type SkillResource,
} from './skills.js';
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
  if (Array.isArray(value)) {
    return { type: 'ArrayContent', elements: value, loc: content.loc };
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

/**
 * Options for the resolver.
 */
export interface ResolverOptions extends LoaderOptions {
  /** Whether to cache resolved ASTs. Defaults to true. */
  cache?: boolean;
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
  private readonly resolving: Set<string>;
  private readonly cacheEnabled: boolean;
  private readonly logger: Logger;
  private readonly options: ResolverOptions;
  private readonly gitRegistry: GitRegistry;
  private readonly registryCache: RegistryCache;

  constructor(options: ResolverOptions) {
    this.options = options;
    this.loader = new FileLoader(options);
    this.cache = new Map();
    this.resolving = new Set();
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
    const absPath = this.loader.toAbsolutePath(entryPath);

    // Check for circular dependency
    if (this.resolving.has(absPath)) {
      this.logger.debug(`Circular dependency detected: ${absPath}`);
      throw new CircularDependencyError([...this.resolving, absPath]);
    }

    // Check cache
    if (!compositionContext && this.cacheEnabled && this.cache.has(absPath)) {
      this.logger.debug(`Cache hit: ${absPath}`);
      return this.cache.get(absPath)!;
    }

    this.resolving.add(absPath);
    this.logger.verbose(`Parsing ${absPath}`);

    try {
      const result = await this.doResolve(absPath, compositionContext);

      if (!compositionContext && this.cacheEnabled) {
        this.logger.debug(`Cache store: ${absPath}`);
        this.cache.set(absPath, result);
      }

      return result;
    } finally {
      this.resolving.delete(absPath);
    }
  }

  /**
   * Perform the actual resolution.
   */
  private async doResolve(
    absPath: string,
    compositionContext?: CompositionResolutionContext
  ): Promise<ResolvedAST> {
    const sources: string[] = [absPath];
    const errors: ResolveError[] = [];
    const inheritedProvenance: ProvenanceEntry[] = [];
    const provenanceEvents: ProvenanceEvent[] = [];

    // Load and parse file
    const parseData = await this.loadAndParse(absPath, sources, errors);
    if (!parseData.ast) {
      return {
        ast: null,
        sources,
        errors,
        provenance: emptyProvenance(absPath),
      };
    }

    let ast = parseData.ast;
    const sequentialOperations = usesSequentialOperations(ast);
    ast = normalizeBlockAliases(ast, {
      preserveDeclarationOrder: sequentialOperations,
    });
    this.logger.debug(`AST node count: ${this.countNodes(ast)}`);

    if (sequentialOperations) {
      ast = await this.resolveSequentialOperations(
        ast,
        absPath,
        sources,
        errors,
        inheritedProvenance,
        provenanceEvents,
        compositionContext
      );
    } else {
      // Preserve legacy phase ordering through syntax 1.5.x.
      ast = await this.resolveInherit(ast, absPath, sources, errors, false, inheritedProvenance);
      ast = await this.resolveImports(ast, absPath, sources, errors, inheritedProvenance);
    }

    // Legacy phase order resolves inline composition after top-level imports.
    if (!sequentialOperations) {
      ast = await this.resolveComposition(
        ast,
        absPath,
        sources,
        errors,
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
              errors,
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
              errors,
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
    errors: ResolveError[]
  ): Promise<{ ast: Program | null }> {
    let source: string;
    try {
      source = await this.loader.load(absPath);
    } catch (err) {
      if (err instanceof FileNotFoundError) {
        // Directory fallback: if path looks like .prs was appended, try as directory
        if (absPath.endsWith('.prs')) {
          const possibleDir = absPath.slice(0, -4); // strip .prs
          const dirResult = await this.tryDirectoryScan(possibleDir, sources, errors);
          if (dirResult) return dirResult;
        }
        errors.push(new ResolveError(err.message));
        return { ast: null };
      }
      throw err;
    }

    // Route .md files through content detection
    if (absPath.endsWith('.md')) {
      return await this.loadAndParseMd(absPath, source, errors);
    }

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
    const parsed = parseSkillMd(source);
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

    // Discover resource files alongside the SKILL.md and explicit reference
    // entries. This mirrors the behaviour of resolveNativeSkills() so a skill
    // pulled in via a registry import carries the same resources as a locally
    // discovered one.
    const skillDir = dirname(absPath);
    const collected: SkillResource[] = [];

    try {
      const discovered = await discoverSkillResources(skillDir, this.logger);
      collected.push(...discovered);
    } catch (err) {
      this.logger.verbose(
        `Failed to discover skill resources in ${skillDir}: ${
          err instanceof Error ? err.message : String(err)
        }`
      );
    }

    if (parsed.references && parsed.references.length > 0) {
      try {
        const refs = await resolveSkillReferences(parsed.references, skillDir, this.logger);
        collected.push(...refs);
      } catch (err) {
        if (err instanceof ResolveError) {
          errors.push(err);
        } else {
          errors.push(new ResolveError(err instanceof Error ? err.message : String(err)));
        }
      }
    }

    if (collected.length > 0) {
      // Deduplicate by relativePath: explicit references override discovered ones.
      const byPath = new Map<string, SkillResource>();
      for (const resource of collected) {
        byPath.set(resource.relativePath, resource);
      }
      skillProps['resources'] = Array.from(byPath.values()).map((r) => ({
        relativePath: r.relativePath,
        content: r.content,
      })) as Value[];
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
    errors: ResolveError[],
    parentWins = false,
    inheritedProvenance: ProvenanceEntry[] = []
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
        parent = await this.resolveRegistryImport(parentPath, errors);
      } else {
        parent = await this.resolve(parentPath);
      }
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
      const importPath = this.loader.resolveRef(use.path, absPath);
      this.logger.verbose(`Resolving import: ${use.path.raw}`);
      this.logger.verbose(`  → ${importPath}`);

      try {
        let imported: ResolvedAST;

        if (importPath.startsWith(REGISTRY_MARKER_PREFIX)) {
          // Remote registry import — handle async Git resolution
          imported = await this.resolveRegistryImport(importPath, errors);
        } else {
          imported = await this.resolve(importPath);
        }

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
    errors: ResolveError[],
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
          const subResult = await this.resolve(subPath, childContext);
          if (subResult.sources.length > 0) {
            sources.push(...subResult.sources);
          }
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
    errors: ResolveError[]
  ): Promise<ResolvedAST> {
    const parsed = parseRegistryMarker(marker);
    if (!parsed) {
      errors.push(new ResolveError(`Invalid registry marker: ${marker}`));
      return { ast: null, sources: [marker], errors: [], provenance: emptyProvenance(marker) };
    }

    const { repoUrl, path: subPath, version } = parsed;

    // Add to resolving set for circular dependency detection
    if (this.resolving.has(marker)) {
      this.logger.debug(`Circular dependency detected: ${marker}`);
      throw new CircularDependencyError([...this.resolving, marker]);
    }

    // Check internal AST cache
    if (this.cacheEnabled && this.cache.has(marker)) {
      this.logger.debug(`Cache hit (AST): ${marker}`);
      return this.cache.get(marker)!;
    }

    this.resolving.add(marker);

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
          this.resolving.delete(marker);
          return {
            ast: null,
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
          this.resolving.delete(marker);
          return {
            ast: null,
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
        const source = await readFile(resolvedFullPath, 'utf-8');
        const mdResult = await this.loadAndParseMd(resolvedFullPath, source, errors);
        resolvedAST = mdResult.ast;
      } else if (!isRoot && existsSync(resolvedFullPath)) {
        // Found a .prs file — parse it
        this.logger.debug(`Found .prs file: ${resolvedFullPath}`);
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

        // Containment check for directory discovery path
        if (!isRoot) {
          if (existsSync(discoverDir) && !(await isRealPathInside(discoverDir, cachePath))) {
            errors.push(
              new ResolveError(
                `Path traversal detected: subpath '${subPath}' resolves outside the repository cache boundary.`
              )
            );
            this.resolving.delete(marker);
            return {
              ast: null,
              sources: [marker],
              errors,
              provenance: emptyProvenance(marker),
            };
          }
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

          const dirResult = await this.tryDirectoryScan(discoverDir, [marker], []);
          if (dirResult?.ast) {
            resolvedAST = dirResult.ast;
          } else {
            resolvedAST = await discoverNativeContent(discoverDir);

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
        sources: [marker],
        errors: [],
        provenance: resolvedAST
          ? collectProvenance(resolvedAST, { entry: marker })
          : emptyProvenance(marker),
      };

      if (this.cacheEnabled) {
        this.cache.set(marker, result);
      }

      return result;
    } finally {
      this.resolving.delete(marker);
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
    errors: ResolveError[]
  ): Promise<{ ast: Program | null } | null> {
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
    const properties = await this.scanDirectoryForSkills(dirPath);

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
   * For each subdirectory:
   * - Skip if symlink
   * - Check for SKILL.md first
   * - Fallback: check for <dirname>.md
   * - Ignore other .md files (README, etc.)
   * - If a skill is found, do not recurse deeper into that subdirectory
   *
   * @param dir - Absolute path to the directory to scan
   * @returns Accumulated skill properties keyed by skill name
   */
  private async scanDirectoryForSkills(dir: string): Promise<Record<string, Value>> {
    const properties: Record<string, Value> = {};
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
          const parsed = parseSkillMd(skillContent);
          const skillName = parsed.name ?? entry.name;

          const skillProps: Record<string, Value> = {};
          if (parsed.description) {
            skillProps['description'] = parsed.description;
          }
          if (parsed.content) {
            skillProps['content'] = makeTextContent(parsed.content, skillMdPath);
          }

          properties[skillName] = skillProps;
          foundSkill = true;
          this.logger.debug(`Found skill "${skillName}" via SKILL.md in ${subDir}`);
        } catch {
          // SKILL.md not found, try dirname.md fallback
          const dirnameMdPath = join(subDir, `${entry.name}.md`);
          try {
            const fallbackContent = await readFile(dirnameMdPath, 'utf-8');
            const parsed = parseSkillMd(fallbackContent);
            const skillName = parsed.name ?? skillNameFromPath(dirnameMdPath);

            const skillProps: Record<string, Value> = {};
            if (parsed.description) {
              skillProps['description'] = parsed.description;
            }
            if (parsed.content) {
              skillProps['content'] = makeTextContent(parsed.content, dirnameMdPath);
            }

            properties[skillName] = skillProps;
            foundSkill = true;
            this.logger.debug(
              `Found skill "${skillName}" via ${basename(dirnameMdPath)} in ${subDir}`
            );
          } catch {
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
   * Clear the resolution cache.
   */
  clearCache(): void {
    this.cache.clear();
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
