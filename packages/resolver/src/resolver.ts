import { existsSync } from 'fs';
import { lstat, readdir, readFile } from 'fs/promises';
import { basename, join } from 'path';
import { parse } from '@promptscript/parser';
import {
  noopLogger,
  type Logger,
  type Program,
  type Value,
  ResolveError,
  CircularDependencyError,
  FileNotFoundError,
  bindParams,
  interpolateAST,
  type TemplateContext,
} from '@promptscript/core';
import {
  FileLoader,
  type LoaderOptions,
  REGISTRY_MARKER_PREFIX,
  parseRegistryMarker,
} from './loader.js';
import { resolveInheritance } from './inheritance.js';
import { resolveUses, extractReservedParams, filterBlocks } from './imports.js';
import { applyExtends } from './extensions.js';
import {
  resolveNativeSkills,
  resolveNativeCommands,
  resolveNativeAgents,
  parseSkillMd,
  skillNameFromPath,
  type NativeSkillOptions,
} from './skills.js';
import { detectContentType } from './content-detector.js';
import { makeBlock, makeObjectContent, makeTextContent, VIRTUAL_LOC } from './ast-factory.js';
import { resolveGuardRequires } from './guard-requires.js';
import { normalizeBlockAliases } from './normalize.js';
import { GitRegistry } from './git-registry.js';
import { RegistryCache } from './registry-cache.js';
import { discoverNativeContent } from './auto-discovery.js';

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
}

/**
 * Result of resolving a PromptScript file.
 */
export interface ResolvedAST {
  /** The resolved AST, or null if resolution failed */
  ast: Program | null;
  /** List of all source files involved in resolution */
  sources: string[];
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
  async resolve(entryPath: string): Promise<ResolvedAST> {
    const absPath = this.loader.toAbsolutePath(entryPath);

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
   * Perform the actual resolution.
   */
  private async doResolve(absPath: string): Promise<ResolvedAST> {
    const sources: string[] = [absPath];
    const errors: ResolveError[] = [];

    // Load and parse file
    const parseData = await this.loadAndParse(absPath, sources, errors);
    if (!parseData.ast) {
      return { ast: null, sources, errors };
    }

    let ast = normalizeBlockAliases(parseData.ast);
    this.logger.debug(`AST node count: ${this.countNodes(ast)}`);

    // Resolve inheritance
    ast = await this.resolveInherit(ast, absPath, sources, errors);

    // Resolve imports
    ast = await this.resolveImports(ast, absPath, sources, errors);

    // Apply extensions
    if (ast.extends.length > 0) {
      this.logger.debug(`Applying ${ast.extends.length} extension(s)`);
    }
    ast = applyExtends(ast);

    // Resolve guard requires dependencies
    ast = resolveGuardRequires(ast, {
      maxDepth: this.options.guardRequiresDepth ?? 3,
    });

    // Resolve native skill files (replace @skills content with SKILL.md files if available)
    ast = await resolveNativeSkills(
      ast,
      this.loader.getRegistryPath(),
      absPath,
      this.loader.getLocalPath(),
      { ...this.options.skills, logger: this.logger }
    );

    // Auto-discover command files from local and universal directories
    ast = await resolveNativeCommands(ast, absPath, this.loader.getLocalPath(), {
      ...this.options.skills,
      logger: this.logger,
    });

    // Auto-discover agent files from local and universal directories
    ast = await resolveNativeAgents(ast, absPath, this.loader.getLocalPath(), {
      ...this.options.skills,
      logger: this.logger,
    });

    this.logger.debug(`Resolved ${sources.length} source file(s)`);
    return {
      ast,
      sources: [...new Set(sources)],
      errors,
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
      return this.loadAndParseMd(absPath, source, errors);
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
   * with a @skills block.
   * Otherwise, treat as raw markdown and synthesize a Program with a @skills
   * block using the filename as the skill name.
   */
  private loadAndParseMd(
    absPath: string,
    source: string,
    errors: ResolveError[]
  ): { ast: Program | null } {
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
    errors: ResolveError[]
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
        return resolveInheritance(resolvedParent, ast);
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
    errors: ResolveError[]
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

        if (imported.ast) {
          let resolvedImport = imported.ast;

          // Extract reserved params (only/exclude) before they reach bindParams
          const { only, exclude, remaining } = extractReservedParams(use.params);

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

          this.logger.debug(`Merging import${use.alias ? ` as "${use.alias}"` : ''}`);
          result = resolveUses(result, use, resolvedImport);
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
      return { ast: null, sources: [marker], errors: [] };
    }

    const { repoUrl, path: subPath, version } = parsed;
    const effectiveVersion = version || 'latest';

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
      const lockEntry = this.options.lockfile?.dependencies[repoUrl];
      const pinnedTag = lockEntry?.version ?? (version || undefined);

      // Determine the Git tag to clone at
      const tag = pinnedTag ?? 'main';

      // Check RegistryCache for cached version
      const hasCached = await this.registryCache.has(repoUrl, effectiveVersion);
      let cachePath: string;

      if (hasCached) {
        this.logger.debug(`Registry cache hit: ${repoUrl}@${effectiveVersion}`);
        cachePath = this.registryCache.getCachePath(repoUrl, effectiveVersion);
      } else {
        this.logger.verbose(`Registry cache miss, cloning: ${repoUrl}@${tag}`);
        cachePath = this.registryCache.getCachePath(repoUrl, effectiveVersion);

        // Clone using GitRegistry
        await this.gitRegistry.cloneAtTag(repoUrl, tag, cachePath);

        // Record in RegistryCache
        const commitHash = lockEntry?.commit ?? 'unknown';
        await this.registryCache.set(repoUrl, effectiveVersion, commitHash);
      }

      // Resolve the file path within the cached repo
      const isMdPath = subPath.endsWith('.md');
      const resolvedFileName = isMdPath
        ? subPath
        : subPath.endsWith('.prs')
          ? subPath
          : `${subPath}.prs`;
      const resolvedFullPath = join(cachePath, resolvedFileName);

      let resolvedAST: Program | null = null;

      if (existsSync(resolvedFullPath) && isMdPath) {
        // Found a .md file — route through content detection
        this.logger.debug(`Found .md file: ${resolvedFullPath}`);
        const source = await readFile(resolvedFullPath, 'utf-8');
        const mdResult = this.loadAndParseMd(resolvedFullPath, source, errors);
        resolvedAST = mdResult.ast;
      } else if (existsSync(resolvedFullPath)) {
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
      } else {
        // No file found — try auto-discovery of native content
        const discoverDir = join(cachePath, subPath);
        this.logger.debug(`No .prs found, trying auto-discovery: ${discoverDir}`);
        resolvedAST = await discoverNativeContent(discoverDir);

        if (!resolvedAST) {
          errors.push(
            new ResolveError(
              `Cannot resolve registry import: no .prs file or native content at '${subPath}' in ${repoUrl}`
            )
          );
        }
      }

      const result: ResolvedAST = {
        ast: resolvedAST,
        sources: [marker],
        errors: [],
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
