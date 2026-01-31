import { parse } from '@promptscript/parser';
import {
  noopLogger,
  type Logger,
  type Program,
  ResolveError,
  CircularDependencyError,
  FileNotFoundError,
  bindParams,
  interpolateAST,
  type TemplateContext,
} from '@promptscript/core';
import { FileLoader, type LoaderOptions } from './loader.js';
import { resolveInheritance } from './inheritance.js';
import { resolveUses } from './imports.js';
import { applyExtends } from './extensions.js';
import { resolveNativeSkills } from './skills.js';

/**
 * Options for the resolver.
 */
export interface ResolverOptions extends LoaderOptions {
  /** Whether to cache resolved ASTs. Defaults to true. */
  cache?: boolean;
  /** Logger for verbose/debug output */
  logger?: Logger;
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

  constructor(options: ResolverOptions) {
    this.loader = new FileLoader(options);
    this.cache = new Map();
    this.resolving = new Set();
    this.cacheEnabled = options.cache !== false;
    this.logger = options.logger ?? noopLogger;
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

    let ast = parseData.ast;
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

    // Resolve native skill files (replace @skills content with SKILL.md files if available)
    ast = await resolveNativeSkills(ast, this.loader.getRegistryPath(), absPath);

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
        errors.push(new ResolveError(err.message));
        return { ast: null };
      }
      throw err;
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
      const parent = await this.resolve(parentPath);
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
            errors.push(new ResolveError((err as Error).message, ast.inherit.loc));
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
      errors.push(new ResolveError(`Failed to resolve parent: ${(err as Error).message}`));
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
        const imported = await this.resolve(importPath);
        sources.push(...imported.sources);
        errors.push(...imported.errors);

        if (imported.ast) {
          // Handle parameterized imports
          let resolvedImport = imported.ast;
          if (imported.ast.meta?.params || use.params) {
            this.logger.debug(`Binding template parameters for ${importPath}`);
            try {
              const params = bindParams(use.params, imported.ast.meta?.params, importPath, use.loc);

              if (params.size > 0) {
                const ctx: TemplateContext = { params, sourceFile: importPath };
                resolvedImport = interpolateAST(imported.ast, ctx);
                this.logger.debug(`Interpolated ${params.size} parameter(s)`);
              }
            } catch (err) {
              errors.push(new ResolveError((err as Error).message, use.loc));
              continue;
            }
          }

          this.logger.debug(`Merging import${use.alias ? ` as "${use.alias}"` : ''}`);
          result = resolveUses(result, use, resolvedImport);
        }
      } catch (err) {
        if (err instanceof CircularDependencyError) {
          throw err;
        }
        errors.push(new ResolveError(`Failed to resolve import: ${(err as Error).message}`));
      }
    }

    return result;
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
