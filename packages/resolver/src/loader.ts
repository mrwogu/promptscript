import { readFile } from 'fs/promises';
import { resolve, dirname, isAbsolute } from 'path';
import type { PathReference, RegistriesConfig, Lockfile } from '@promptscript/core';
import { FileNotFoundError } from '@promptscript/core';
import type { Registry } from './registry.js';
import { expandAlias } from './alias-resolver.js';

/**
 * Prefix used for registry marker paths returned by resolveRef.
 * Format: `__registry__:<base64(JSON({repoUrl, path, version}))>`
 *
 * These markers are intercepted by the Resolver to perform async
 * Git-based import resolution while keeping FileLoader synchronous.
 */
export const REGISTRY_MARKER_PREFIX = '__registry__:';

/** Separator used inside registry markers between encoded fields. */
const MARKER_SEP = '\0';

/**
 * Parse a registry marker string back into its components.
 *
 * @param marker - A string starting with `__registry__:`
 * @returns Parsed components or null if not a valid marker
 */
export function parseRegistryMarker(
  marker: string
): { repoUrl: string; path: string; version: string } | null {
  if (!marker.startsWith(REGISTRY_MARKER_PREFIX)) {
    return null;
  }
  const payload = marker.slice(REGISTRY_MARKER_PREFIX.length);
  const parts = payload.split(MARKER_SEP);
  if (parts.length !== 3) return null;
  const repoUrl = parts[0] ?? '';
  const path = parts[1] ?? '';
  const version = parts[2] ?? '';
  return { repoUrl, path, version };
}

/**
 * Build a registry marker string from its components.
 *
 * @param repoUrl - Git repository URL
 * @param path - Path within the repository
 * @param version - Version tag (use empty string for latest/default)
 * @returns Marker string for Resolver to intercept
 */
export function buildRegistryMarker(repoUrl: string, path: string, version: string): string {
  return `${REGISTRY_MARKER_PREFIX}${repoUrl}${MARKER_SEP}${path}${MARKER_SEP}${version}`;
}

/**
 * Options for the file loader.
 */
export interface LoaderOptions {
  /** Base path for registry lookups (@namespace/...) */
  registryPath: string;
  /** Base path for local/relative file resolution */
  localPath?: string;
  /** Optional Registry implementation for file fetching */
  registry?: Registry;
  /** Registry alias configuration for remote imports */
  registries?: RegistriesConfig;
  /** Lockfile for pinning remote dependencies */
  lockfile?: Lockfile;
}

/**
 * File loader for loading and resolving PromptScript files.
 */
export class FileLoader {
  private readonly registryPath: string;
  private readonly localPath: string;
  private readonly options: LoaderOptions;

  constructor(options: LoaderOptions) {
    this.registryPath = options.registryPath;
    this.localPath = options.localPath ?? process.cwd();
    this.options = options;
  }

  /**
   * Load file content from disk.
   *
   * @param path - Absolute path to the file
   * @returns File content as string
   * @throws FileNotFoundError if file doesn't exist
   */
  async load(path: string): Promise<string> {
    try {
      return await readFile(path, 'utf-8');
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new FileNotFoundError(path);
      }
      throw err;
    }
  }

  /**
   * Convert a path string to an absolute path.
   *
   * Handles:
   * - Already absolute paths (start with /)
   * - Registry paths (@namespace/path)
   * - Relative paths (./path, ../path, or bare path)
   *
   * @param path - Path to convert
   * @returns Absolute filesystem path
   */
  toAbsolutePath(path: string): string {
    // Already absolute
    if (isAbsolute(path)) {
      return path;
    }

    // Registry path: @namespace/path[@version]
    if (path.startsWith('@')) {
      const match = path.match(/^@([a-zA-Z_][a-zA-Z0-9_-]*)\/(.+?)(?:@[\d.]+)?$/);
      if (match && match[1] && match[2]) {
        const namespace = match[1];
        const segments = match[2];
        const fileName = segments.endsWith('.prs') ? segments : `${segments}.prs`;
        return resolve(this.registryPath, `@${namespace}`, fileName);
      }
    }

    // Relative or local path
    const fileName = path.endsWith('.prs') ? path : `${path}.prs`;
    return resolve(this.localPath, fileName);
  }

  /**
   * Resolve a PathReference to an absolute path.
   *
   * @param ref - PathReference from AST
   * @param fromFile - File containing the reference (for relative resolution)
   * @returns Absolute filesystem path
   */
  resolveRef(ref: PathReference, fromFile: string): string {
    if (ref.isRelative) {
      const dir = dirname(fromFile);
      // Use the raw path which preserves .. and . components
      const rawPath = ref.raw.endsWith('.prs') ? ref.raw : `${ref.raw}.prs`;
      return resolve(dir, rawPath);
    }

    // Registry alias path: @alias/subpath[@version]
    // Only intercept when a registries config is provided and the alias is known
    if (ref.raw.startsWith('@') && this.options.registries) {
      const firstSlash = ref.raw.indexOf('/');
      const aliasName = firstSlash === -1 ? ref.raw : ref.raw.slice(0, firstSlash);
      if (aliasName in this.options.registries) {
        const expanded = expandAlias(ref.raw, this.options.registries);
        return buildRegistryMarker(expanded.repoUrl, expanded.path, expanded.version ?? '');
      }
    }

    // URL-like path: first segment contains a dot (e.g., github.com/org/repo/path)
    if (!ref.raw.startsWith('@') && ref.segments.length > 0 && ref.segments[0]?.includes('.')) {
      // Extract repo host + path and sub-path from the URL segments
      // Convention: first 3 segments = host/owner/repo, rest = path within repo
      const segments = ref.raw.split('/');
      if (segments.length >= 3) {
        const repoUrl = `https://${segments.slice(0, 3).join('/')}`;
        const subPath = segments.slice(3).join('/');
        const version = ref.version ?? '';
        return buildRegistryMarker(repoUrl, subPath, version);
      }
    }

    return this.toAbsolutePath(ref.raw);
  }

  /**
   * Get the registry path.
   */
  getRegistryPath(): string {
    return this.registryPath;
  }

  /**
   * Get the local path.
   */
  getLocalPath(): string {
    return this.localPath;
  }
}
