import { readFile } from 'fs/promises';
import { resolve, dirname, isAbsolute, join } from 'path';
import type { PathReference } from '@promptscript/core';
import { FileNotFoundError } from '@promptscript/core';

/**
 * Options for the file loader.
 */
export interface LoaderOptions {
  /** Base path for registry lookups (@namespace/...) */
  registryPath: string;
  /** Base path for local/relative file resolution */
  localPath?: string;
}

/**
 * File loader for loading and resolving PromptScript files.
 */
export class FileLoader {
  private readonly registryPath: string;
  private readonly localPath: string;

  constructor(options: LoaderOptions) {
    this.registryPath = options.registryPath;
    this.localPath = options.localPath ?? process.cwd();
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
      const fileName = join(...ref.segments) + '.prs';
      return resolve(dir, fileName);
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
