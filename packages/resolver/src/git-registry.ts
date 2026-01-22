/**
 * Git-based registry implementation.
 *
 * Fetches PromptScript files from Git repositories with:
 * - Lazy cloning (on first use)
 * - Local caching with TTL
 * - Support for branches, tags, and commits
 * - Authentication via token or SSH
 * - Version-tagged paths (@org/package@v1.0.0)
 *
 * @packageDocumentation
 */

import { existsSync, promises as fs } from 'fs';
import { join } from 'path';
import type { SimpleGit, SimpleGitOptions } from 'simple-git';
import { simpleGit } from 'simple-git';
import { FileNotFoundError } from '@promptscript/core';
import type { Registry } from './registry.js';
import { GitCacheManager } from './git-cache-manager.js';
import {
  parseGitUrl,
  buildAuthenticatedUrl,
  parseVersionedPath,
  normalizeGitUrl,
} from './git-url-utils.js';

/**
 * Authentication options for Git registry.
 */
export interface GitAuthOptions {
  /** Authentication type */
  type: 'token' | 'ssh';
  /** Personal access token (for token auth) */
  token?: string;
  /** Environment variable containing the token */
  tokenEnvVar?: string;
  /** Path to SSH key (for SSH auth, defaults to ~/.ssh/id_rsa) */
  sshKeyPath?: string;
}

/**
 * Options for GitRegistry.
 */
export interface GitRegistryOptions {
  /** Git repository URL */
  url: string;
  /** Git ref to checkout (branch/tag/commit). Defaults to 'main' */
  ref?: string;
  /** Subdirectory within the repository to use as registry root */
  path?: string;
  /** Cache directory override */
  cacheDir?: string;
  /** Authentication options */
  auth?: GitAuthOptions;
  /** Cache configuration */
  cache?: {
    /** Whether caching is enabled. Defaults to true */
    enabled?: boolean;
    /** Cache TTL in milliseconds. Defaults to 1 hour */
    ttl?: number;
  };
  /** Request timeout in milliseconds for Git operations. Defaults to 60000 (1 minute) */
  timeout?: number;
}

/**
 * Git clone error.
 */
export class GitCloneError extends Error {
  override readonly cause?: Error;

  constructor(
    message: string,
    public readonly url: string,
    cause?: Error
  ) {
    super(message, { cause });
    this.name = 'GitCloneError';
    this.cause = cause;
  }
}

/**
 * Git authentication error.
 */
export class GitAuthError extends Error {
  override readonly cause?: Error;

  constructor(
    message: string,
    public readonly url: string,
    cause?: Error
  ) {
    super(message, { cause });
    this.name = 'GitAuthError';
    this.cause = cause;
  }
}

/**
 * Git ref not found error.
 */
export class GitRefNotFoundError extends Error {
  constructor(
    public readonly ref: string,
    public readonly url: string
  ) {
    super(`Git ref not found: ${ref} in ${url}`);
    this.name = 'GitRefNotFoundError';
  }
}

/**
 * Git-based registry implementation.
 */
export class GitRegistry implements Registry {
  private readonly url: string;
  private readonly originalUrl: string;
  private readonly defaultRef: string;
  private readonly subPath: string;
  private readonly auth?: GitAuthOptions;
  private readonly cacheEnabled: boolean;
  private readonly timeout: number;
  private readonly cacheManager: GitCacheManager;
  private initialized = false;

  constructor(options: GitRegistryOptions) {
    this.originalUrl = options.url;
    this.url = normalizeGitUrl(options.url);
    this.defaultRef = options.ref ?? 'main';
    this.subPath = options.path ?? '';
    this.auth = options.auth;
    this.cacheEnabled = options.cache?.enabled ?? true;
    this.timeout = options.timeout ?? 60000;
    this.cacheManager = new GitCacheManager({
      cacheDir: options.cacheDir,
      ttl: options.cache?.ttl,
    });
  }

  /**
   * Fetch the content of a file from the registry.
   *
   * @param path - Path to the file (may include version tag)
   * @returns File content as string
   * @throws FileNotFoundError if the file doesn't exist
   * @throws GitCloneError if cloning fails
   * @throws GitRefNotFoundError if the ref doesn't exist
   */
  async fetch(path: string): Promise<string> {
    const { path: basePath, version } = parseVersionedPath(path);
    const ref = version ?? this.defaultRef;

    // Ensure repository is cloned and up-to-date
    const repoPath = await this.ensureCloned(ref);

    // Build full file path
    const filePath = this.resolveFilePath(repoPath, basePath);

    // Check if file exists
    if (!existsSync(filePath)) {
      throw new FileNotFoundError(path);
    }

    // Read and return content
    return fs.readFile(filePath, 'utf-8');
  }

  /**
   * Check if a file exists in the registry.
   *
   * @param path - Path to check (may include version tag)
   * @returns True if the file exists
   */
  async exists(path: string): Promise<boolean> {
    try {
      const { path: basePath, version } = parseVersionedPath(path);
      const ref = version ?? this.defaultRef;

      const repoPath = await this.ensureCloned(ref);
      const filePath = this.resolveFilePath(repoPath, basePath);

      return existsSync(filePath);
    } catch {
      return false;
    }
  }

  /**
   * List files in a directory.
   *
   * @param path - Directory path (may include version tag)
   * @returns Array of file/directory names
   */
  async list(path: string): Promise<string[]> {
    try {
      const { path: basePath, version } = parseVersionedPath(path);
      const ref = version ?? this.defaultRef;

      const repoPath = await this.ensureCloned(ref);
      const dirPath = this.resolveDirectoryPath(repoPath, basePath);

      if (!existsSync(dirPath)) {
        return [];
      }

      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      return entries.map((e) => (e.isDirectory() ? `${e.name}/` : e.name));
    } catch {
      return [];
    }
  }

  /**
   * Force refresh the cache for a specific ref.
   *
   * @param ref - Git ref to refresh (defaults to defaultRef)
   */
  async refresh(ref?: string): Promise<void> {
    const targetRef = ref ?? this.defaultRef;
    await this.cacheManager.remove(this.url, targetRef);
    await this.ensureCloned(targetRef);
  }

  /**
   * Get the current commit hash for a ref.
   *
   * @param ref - Git ref (defaults to defaultRef)
   * @returns Commit hash
   */
  async getCommitHash(ref?: string): Promise<string> {
    const targetRef = ref ?? this.defaultRef;
    const repoPath = await this.ensureCloned(targetRef);

    const git = this.createGit(repoPath);
    const result = await git.revparse(['HEAD']);
    return result.trim();
  }

  /**
   * Ensure the repository is cloned and at the correct ref.
   */
  private async ensureCloned(ref: string): Promise<string> {
    // Check if we have a valid cache
    if (this.cacheEnabled) {
      const entry = await this.cacheManager.get(this.url, ref);

      if (entry && !entry.isStale) {
        return entry.path;
      }

      // If cache exists but is stale, try to update it
      if (entry) {
        try {
          await this.fetchUpdates(entry.path, ref);
          const commitHash = await this.getCurrentCommit(entry.path);
          await this.cacheManager.touch(this.url, ref, commitHash);
          return entry.path;
        } catch {
          // If fetch fails, try a fresh clone
          await this.cacheManager.remove(this.url, ref);
        }
      }
    }

    // Clone fresh
    const cachePath = this.cacheManager.getCachePath(this.url, ref);
    await this.clone(cachePath, ref);

    // Update cache metadata
    const commitHash = await this.getCurrentCommit(cachePath);
    await this.cacheManager.set(this.url, ref, commitHash);

    return cachePath;
  }

  /**
   * Clone the repository to the specified path.
   */
  private async clone(targetPath: string, ref: string): Promise<void> {
    // Remove existing directory if present
    if (existsSync(targetPath)) {
      await fs.rm(targetPath, { recursive: true, force: true });
    }

    // Create parent directory
    await fs.mkdir(targetPath, { recursive: true });

    const cloneUrl = this.getAuthenticatedUrl();
    const git = this.createGit();

    try {
      // Clone with shallow depth for efficiency
      await git.clone(cloneUrl, targetPath, ['--depth=1', `--branch=${ref}`, '--single-branch']);
    } catch (err) {
      const error = err as Error;

      // Check if it's an auth error
      if (this.isAuthError(error)) {
        throw new GitAuthError(`Authentication failed for ${this.url}`, this.url, error);
      }

      // Check if ref doesn't exist - try fetching all refs
      if (this.isRefError(error)) {
        // Try cloning without branch specification and checkout afterward
        try {
          await git.clone(cloneUrl, targetPath, ['--depth=1']);
          const repoGit = this.createGit(targetPath);
          await repoGit.fetch(['origin', ref, '--depth=1']);
          await repoGit.checkout(ref);
        } catch (fetchErr) {
          const fetchError = fetchErr as Error;
          if (this.isRefError(fetchError)) {
            throw new GitRefNotFoundError(ref, this.url);
          }
          throw new GitCloneError(
            `Failed to clone repository: ${fetchError.message}`,
            this.url,
            fetchError
          );
        }
        return;
      }

      throw new GitCloneError(`Failed to clone repository: ${error.message}`, this.url, error);
    }
  }

  /**
   * Fetch updates for an existing clone.
   */
  private async fetchUpdates(repoPath: string, ref: string): Promise<void> {
    const git = this.createGit(repoPath);

    try {
      await git.fetch(['origin', ref, '--depth=1']);
      await git.checkout(ref);
      await git.reset(['--hard', `origin/${ref}`]);
    } catch (err) {
      const error = err as Error;

      // If ref is a tag or commit, try direct checkout
      if (this.isRefError(error)) {
        try {
          await git.fetch(['origin', '--tags', '--depth=1']);
          await git.checkout(ref);
          return;
        } catch {
          throw new GitRefNotFoundError(ref, this.url);
        }
      }

      throw error;
    }
  }

  /**
   * Get the current commit hash of a repository.
   */
  private async getCurrentCommit(repoPath: string): Promise<string> {
    const git = this.createGit(repoPath);
    const result = await git.revparse(['HEAD']);
    return result.trim();
  }

  /**
   * Build the authenticated URL for cloning.
   */
  private getAuthenticatedUrl(): string {
    if (!this.auth) {
      return this.url;
    }

    if (this.auth.type === 'token') {
      const token = this.resolveToken();
      if (token) {
        return buildAuthenticatedUrl(this.url, token);
      }
    }

    // For SSH, the URL should already be in SSH format or will be used as-is
    return this.url;
  }

  /**
   * Resolve the authentication token.
   */
  private resolveToken(): string | undefined {
    if (this.auth?.token) {
      return this.auth.token;
    }

    if (this.auth?.tokenEnvVar) {
      return process.env[this.auth.tokenEnvVar];
    }

    return undefined;
  }

  /**
   * Create a simple-git instance.
   */
  private createGit(baseDir?: string): SimpleGit {
    const options: Partial<SimpleGitOptions> = {
      timeout: {
        block: this.timeout,
      },
    };

    if (baseDir) {
      options.baseDir = baseDir;
    }

    const git = simpleGit(options);

    // Configure SSH key if using SSH auth
    if (this.auth?.type === 'ssh' && this.auth.sshKeyPath) {
      const parsed = parseGitUrl(this.originalUrl);
      if (parsed?.protocol === 'ssh') {
        git.env('GIT_SSH_COMMAND', `ssh -i ${this.auth.sshKeyPath} -o StrictHostKeyChecking=no`);
      }
    }

    return git;
  }

  /**
   * Resolve a file path within the repository.
   */
  private resolveFilePath(repoPath: string, relativePath: string): string {
    // Remove leading @ from path if present
    let cleanPath = relativePath.startsWith('@') ? relativePath.slice(1) : relativePath;

    // Add .prs extension if not present and path doesn't end with /
    if (!cleanPath.endsWith('.prs') && !cleanPath.endsWith('/')) {
      cleanPath += '.prs';
    }

    // Build full path with optional subPath
    if (this.subPath) {
      return join(repoPath, this.subPath, cleanPath);
    }

    return join(repoPath, cleanPath);
  }

  /**
   * Resolve a directory path within the repository.
   */
  private resolveDirectoryPath(repoPath: string, relativePath: string): string {
    // Remove leading @ from path if present
    const cleanPath = relativePath.startsWith('@') ? relativePath.slice(1) : relativePath;

    // Build full path with optional subPath
    if (this.subPath) {
      return join(repoPath, this.subPath, cleanPath);
    }

    return join(repoPath, cleanPath);
  }

  /**
   * Check if an error is an authentication error.
   */
  private isAuthError(error: Error): boolean {
    const message = error.message.toLowerCase();
    return (
      message.includes('authentication') ||
      message.includes('permission denied') ||
      message.includes('could not read from remote') ||
      message.includes('invalid credentials') ||
      message.includes('401') ||
      message.includes('403')
    );
  }

  /**
   * Check if an error is a ref not found error.
   */
  private isRefError(error: Error): boolean {
    const message = error.message.toLowerCase();
    return (
      message.includes('could not find remote branch') ||
      message.includes('pathspec') ||
      message.includes('did not match any') ||
      message.includes('not found in upstream')
    );
  }
}

/**
 * Create a new GitRegistry instance.
 *
 * @param options - Git registry options
 * @returns GitRegistry instance
 *
 * @example
 * ```typescript
 * // Public repository
 * const registry = createGitRegistry({
 *   url: 'https://github.com/org/promptscript-registry.git',
 *   ref: 'main',
 *   path: 'registry/',
 * });
 *
 * // Private repository with token
 * const privateRegistry = createGitRegistry({
 *   url: 'https://github.com/org/private-registry.git',
 *   auth: {
 *     type: 'token',
 *     tokenEnvVar: 'GITHUB_TOKEN',
 *   },
 * });
 *
 * // Fetch a file
 * const content = await registry.fetch('@company/base');
 *
 * // Fetch a specific version
 * const v1Content = await registry.fetch('@company/base@v1.0.0');
 * ```
 */
export function createGitRegistry(options: GitRegistryOptions): GitRegistry {
  return new GitRegistry(options);
}
