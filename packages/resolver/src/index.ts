// Main resolver
export { Resolver, createResolver } from './resolver';
export type { ResolverOptions, ResolvedAST } from './resolver';

// File loader
export { FileLoader } from './loader';
export type { LoaderOptions } from './loader';

// Registry implementations
export {
  FileSystemRegistry,
  HttpRegistry,
  CompositeRegistry,
  createFileSystemRegistry,
  createHttpRegistry,
  createCompositeRegistry,
  type Registry,
  type FileSystemRegistryOptions,
  type HttpRegistryOptions,
  type CompositeRegistryOptions,
} from './registry';

// Inheritance resolution
export { resolveInheritance } from './inheritance';

// Import resolution
export {
  resolveUses,
  isImportMarker,
  getImportAlias,
  getOriginalBlockName,
  IMPORT_MARKER_PREFIX,
} from './imports';

// Extension resolution
export { applyExtends } from './extensions';

// Standalone resolve function
import type { ResolvedAST, ResolverOptions } from './resolver';
import { createResolver } from './resolver';

/**
 * Options for standalone resolve function.
 */
export interface ResolveOptions extends ResolverOptions {
  /** Reuse an existing resolver instance */
  resolver?: Resolver;
}

// Forward declaration to avoid circular deps
interface Resolver {
  resolve(entryPath: string): Promise<ResolvedAST>;
}

/**
 * Resolve a PromptScript file with a standalone function.
 *
 * @param entryPath - Path to the entry file
 * @param options - Resolution options
 * @returns Resolved AST with sources and errors
 *
 * @example
 * ```typescript
 * import { resolve } from '@promptscript/resolver';
 *
 * const result = await resolve('./project.prs', {
 *   registryPath: '/path/to/registry',
 *   localPath: process.cwd(),
 * });
 *
 * if (result.ast) {
 *   console.log('Resolved successfully');
 * }
 * ```
 */
export async function resolve(entryPath: string, options: ResolveOptions): Promise<ResolvedAST> {
  const { resolver, ...resolverOptions } = options;

  if (resolver) {
    return resolver.resolve(entryPath);
  }

  const r = createResolver(resolverOptions);
  return r.resolve(entryPath);
}
