/**
 * In-memory virtual file system for browser-based compilation.
 *
 * Provides a simple Map-based file system that replaces Node.js fs
 * operations for the browser environment.
 */

/**
 * Virtual file system for storing and retrieving files in memory.
 */
export class VirtualFileSystem {
  private readonly files: Map<string, string>;

  constructor(initialFiles?: Map<string, string> | Record<string, string>) {
    this.files = new Map();

    if (initialFiles) {
      if (initialFiles instanceof Map) {
        for (const [path, content] of initialFiles) {
          this.files.set(this.normalizePath(path), content);
        }
      } else {
        for (const [path, content] of Object.entries(initialFiles)) {
          this.files.set(this.normalizePath(path), content);
        }
      }
    }
  }

  /**
   * Normalize a path to use forward slashes and remove leading slash.
   */
  private normalizePath(path: string): string {
    // Convert backslashes to forward slashes
    let normalized = path.replace(/\\/g, '/');

    // Remove leading slash for consistency
    if (normalized.startsWith('/')) {
      normalized = normalized.slice(1);
    }

    // Remove trailing slash
    if (normalized.endsWith('/')) {
      normalized = normalized.slice(0, -1);
    }

    return normalized;
  }

  /**
   * Check if a file exists in the virtual file system.
   */
  exists(path: string): boolean {
    return this.files.has(this.normalizePath(path));
  }

  /**
   * Read a file from the virtual file system.
   *
   * @throws Error if the file does not exist
   */
  read(path: string): string {
    const normalizedPath = this.normalizePath(path);
    const content = this.files.get(normalizedPath);

    if (content === undefined) {
      throw new Error(`File not found: ${path}`);
    }

    return content;
  }

  /**
   * Write a file to the virtual file system.
   */
  write(path: string, content: string): void {
    this.files.set(this.normalizePath(path), content);
  }

  /**
   * Delete a file from the virtual file system.
   */
  delete(path: string): boolean {
    return this.files.delete(this.normalizePath(path));
  }

  /**
   * List all files in the virtual file system.
   */
  list(): string[] {
    return Array.from(this.files.keys());
  }

  /**
   * List files matching a glob-like pattern.
   * Supports basic patterns like "*.prs" and "**\/*.prs".
   */
  glob(pattern: string): string[] {
    const normalizedPattern = this.normalizePath(pattern);
    const regex = this.patternToRegex(normalizedPattern);

    return Array.from(this.files.keys()).filter((path) => regex.test(path));
  }

  /**
   * Convert a glob pattern to a regular expression.
   */
  private patternToRegex(pattern: string): RegExp {
    // First, escape special regex characters (except * and ?)
    let regexStr = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&');

    // Convert ** to a placeholder that won't be affected by * conversion
    regexStr = regexStr.replace(/\*\*/g, '\0DOUBLESTAR\0');

    // Convert * to match any characters except /
    regexStr = regexStr.replace(/\*/g, '[^/]*');

    // Convert the placeholder back to match any characters including /
    regexStr = regexStr.replace(/\0DOUBLESTAR\0/g, '.*');

    // Convert ? to match any single character except /
    regexStr = regexStr.replace(/\?/g, '[^/]');

    return new RegExp(`^${regexStr}$`);
  }

  /**
   * Clear all files from the virtual file system.
   */
  clear(): void {
    this.files.clear();
  }

  /**
   * Get the number of files in the virtual file system.
   */
  get size(): number {
    return this.files.size;
  }

  /**
   * Get all files as a Map.
   */
  toMap(): Map<string, string> {
    return new Map(this.files);
  }

  /**
   * Get all files as a plain object.
   */
  toObject(): Record<string, string> {
    const obj: Record<string, string> = {};
    for (const [path, content] of this.files) {
      obj[path] = content;
    }
    return obj;
  }

  /**
   * Clone this virtual file system.
   */
  clone(): VirtualFileSystem {
    return new VirtualFileSystem(this.files);
  }

  /**
   * Merge another virtual file system into this one.
   * Files from the other system will overwrite files in this system.
   */
  merge(other: VirtualFileSystem): void {
    for (const [path, content] of other.files) {
      this.files.set(path, content);
    }
  }
}
