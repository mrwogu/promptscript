import type { PathReference, SourceLocation } from '../types';

/**
 * Parsed path components.
 */
export interface ParsedPath {
  /** Namespace (without @) */
  namespace?: string;
  /** Path segments */
  segments: string[];
  /** Version */
  version?: string;
  /** Is relative path */
  isRelative: boolean;
}

/**
 * Parse a PromptScript path reference.
 *
 * @param path - Path string to parse
 * @returns Parsed path components
 * @throws {Error} If path format is invalid
 *
 * @example
 * ```typescript
 * parsePath('@core/guards/compliance@1.0.0')
 * // { namespace: 'core', segments: ['guards', 'compliance'], version: '1.0.0', isRelative: false }
 *
 * parsePath('./local/file')
 * // { namespace: undefined, segments: ['local', 'file'], version: undefined, isRelative: true }
 * ```
 */
export function parsePath(path: string): ParsedPath {
  // Relative path
  if (path.startsWith('./') || path.startsWith('../')) {
    const segments = path.split('/').filter(Boolean);
    // Remove leading . or ..
    if (segments[0] === '.' || segments[0] === '..') {
      segments.shift();
    }
    return {
      namespace: undefined,
      segments,
      version: undefined,
      isRelative: true,
    };
  }

  // Absolute path: @namespace/path@version
  const match = path.match(
    /^@([a-zA-Z_][a-zA-Z0-9_-]*)\/(.+?)(?:@(\d+\.\d+\.\d+))?$/
  );

  if (!match) {
    throw new Error(`Invalid path format: ${path}`);
  }

  const [, namespace, segmentStr, version] = match;
  const segments = (segmentStr ?? '').split('/').filter(Boolean);

  return {
    namespace,
    segments,
    version,
    isRelative: false,
  };
}

/**
 * Check if a path is absolute (starts with @namespace).
 */
export function isAbsolutePath(path: string): boolean {
  return path.startsWith('@') && !path.startsWith('@/');
}

/**
 * Check if a path is relative.
 */
export function isRelativePath(path: string): boolean {
  return path.startsWith('./') || path.startsWith('../');
}

/**
 * Resolve a path to a filesystem location.
 *
 * @param path - Path to resolve
 * @param options - Resolution options
 * @returns Resolved filesystem path
 */
export function resolvePath(
  path: string,
  options: {
    registryPath: string;
    basePath?: string;
  }
): string {
  const parsed = parsePath(path);

  if (parsed.isRelative) {
    const base = options.basePath ?? process.cwd();
    return `${base}/${parsed.segments.join('/')}.prs`;
  }

  // Absolute path - resolve from registry
  return `${options.registryPath}/@${parsed.namespace}/${parsed.segments.join('/')}.prs`;
}

/**
 * Create a PathReference AST node from a path string.
 */
export function createPathReference(
  path: string,
  loc: SourceLocation
): PathReference {
  const parsed = parsePath(path);

  return {
    type: 'PathReference',
    raw: path,
    namespace: parsed.namespace,
    segments: parsed.segments,
    version: parsed.version,
    isRelative: parsed.isRelative,
    loc,
  };
}

/**
 * Get the file name from a path (last segment).
 */
export function getFileName(path: string): string {
  const parsed = parsePath(path);
  return parsed.segments[parsed.segments.length - 1] ?? '';
}
