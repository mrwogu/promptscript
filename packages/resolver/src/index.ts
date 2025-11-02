// Main resolver
export { Resolver, createResolver } from './resolver';
export type { ResolverOptions, ResolvedAST } from './resolver';

// File loader
export { FileLoader } from './loader';
export type { LoaderOptions } from './loader';

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
