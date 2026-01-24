import { parse } from '@promptscript/parser';
import type { Program } from '@promptscript/core';
import { ResolveError, CircularDependencyError, FileNotFoundError } from '@promptscript/core';
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

  constructor(options: ResolverOptions) {
    this.loader = new FileLoader(options);
    this.cache = new Map();
    this.resolving = new Set();
    this.cacheEnabled = options.cache !== false;
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
      throw new CircularDependencyError([...this.resolving, absPath]);
    }

    // Check cache
    if (this.cacheEnabled && this.cache.has(absPath)) {
      return this.cache.get(absPath)!;
    }

    this.resolving.add(absPath);

    try {
      const result = await this.doResolve(absPath);

      if (this.cacheEnabled) {
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

    // Resolve inheritance
    ast = await this.resolveInherit(ast, absPath, sources, errors);

    // Resolve imports
    ast = await this.resolveImports(ast, absPath, sources, errors);

    // Apply extensions
    ast = applyExtends(ast);

    // Resolve native skill files (replace @skills content with SKILL.md files if available)
    ast = await resolveNativeSkills(ast, this.loader.getRegistryPath(), absPath);

    return {
      ast,
      sources: [...new Set(sources)],
      errors,
    };
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

    try {
      const parent = await this.resolve(parentPath);
      sources.push(...parent.sources);
      errors.push(...parent.errors);

      if (parent.ast) {
        return resolveInheritance(parent.ast, ast);
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

      try {
        const imported = await this.resolve(importPath);
        sources.push(...imported.sources);
        errors.push(...imported.errors);

        if (imported.ast) {
          result = resolveUses(result, use, imported.ast);
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
