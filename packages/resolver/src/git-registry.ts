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
import type { RegistryCache } from './registry-cache.js';
import {
  parseGitUrl,
  buildAuthenticatedUrl,
  parseVersionedPath,
  normalizeGitUrl,
} from './git-url-utils.js';

/** 24-hour TTL for cached tag lists */
const TAGS_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

/** Semver tag pattern: optional "v" prefix followed by major.minor.patch */
const SEMVER_TAG_RE = /^v?\d+\.\d+\.\d+/;

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
   * Clone a repo at a specific Git tag (shallow, depth=1).
   *
   * @param repoUrl - Repository URL to clone
   * @param tag - Git tag to check out
   * @param targetDir - Directory to clone into
   */
  async cloneAtTag(repoUrl: string, tag: string, targetDir: string): Promise<void> {
    if (existsSync(targetDir)) {
      await fs.rm(targetDir, { recursive: true, force: true });
    }
    await fs.mkdir(targetDir, { recursive: true });

    const git = this.createGit();
    try {
      await git.clone(repoUrl, targetDir, ['--depth=1', `--branch=${tag}`, '--single-branch']);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      if (this.isRefError(error)) {
        throw new GitRefNotFoundError(tag, repoUrl);
      }
      if (this.isAuthError(error)) {
        throw new GitAuthError(`Authentication failed for ${repoUrl}`, repoUrl, error);
      }
      throw new GitCloneError(
        `Failed to clone ${repoUrl} at tag ${tag}: ${error.message}`,
        repoUrl,
        error
      );
    }
  }

  /**
   * List all semver tags from a remote repo.
   * Results are cached via RegistryCache to avoid repeated ls-remote calls.
   *
   * @param repoUrl - Repository URL
   * @param cache - Optional RegistryCache (24-hour TTL for tag lists)
   * @returns Sorted semver tag strings
   */
  async listTags(repoUrl: string, cache?: RegistryCache): Promise<string[]> {
    // Check cache first
    if (cache) {
      const cached = await cache.getTagsMeta(repoUrl);
      if (cached && Date.now() - cached.fetchedAt < TAGS_CACHE_TTL_MS) {
        return cached.tags;
      }
    }

    const git = this.createGit();
    const raw = await git.listRemote(['--tags', repoUrl]);

    // Parse "abc123\trefs/tags/v1.0.0" lines; strip peeled tag suffixes (^{})
    const tags = [
      ...new Set(
        raw
          .split('\n')
          .map((line) => line.split('\t')[1]?.trim() ?? '')
          .filter((ref) => ref.startsWith('refs/tags/') && !ref.endsWith('^{}'))
          .map((ref) => ref.replace('refs/tags/', ''))
          .filter((tag) => SEMVER_TAG_RE.test(tag))
      ),
    ];

    if (cache) {
      await cache.setTagsMeta(repoUrl, tags);
    }

    return tags;
  }

  /**
   * Resolve a semver range against available tags from a remote repo.
   *
   * @param repoUrl - Repository URL
   * @param range - Semver range string (e.g. "^1.0.0", ">=2.0.0 <3.0.0", "1.x")
   * @param cache - Optional RegistryCache passed through to listTags
   * @returns Best-matching tag string, or null if no tag satisfies the range
   */
  async resolveVersion(
    repoUrl: string,
    range: string,
    cache?: RegistryCache
  ): Promise<string | null> {
    const tags = await this.listTags(repoUrl, cache);
    return maxSatisfying(tags, range);
  }

  /**
   * Clone with sparse checkout — only fetch the requested path within the repo.
   *
   * @param repoUrl - Repository URL
   * @param ref - Git ref (branch, tag, or commit)
   * @param targetDir - Directory to clone into
   * @param sparsePath - Subdirectory path to include in the sparse checkout
   */
  async cloneSparse(
    repoUrl: string,
    ref: string,
    targetDir: string,
    sparsePath: string
  ): Promise<void> {
    if (existsSync(targetDir)) {
      await fs.rm(targetDir, { recursive: true, force: true });
    }
    await fs.mkdir(targetDir, { recursive: true });

    const git = this.createGit();
    try {
      await git.clone(repoUrl, targetDir, [
        '--depth=1',
        `--branch=${ref}`,
        '--single-branch',
        '--filter=blob:none',
        '--sparse',
      ]);

      const repoGit = this.createGit(targetDir);
      await repoGit.raw(['sparse-checkout', 'set', sparsePath]);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      if (this.isRefError(error)) {
        throw new GitRefNotFoundError(ref, repoUrl);
      }
      if (this.isAuthError(error)) {
        throw new GitAuthError(`Authentication failed for ${repoUrl}`, repoUrl, error);
      }
      throw new GitCloneError(
        `Failed to sparse-clone ${repoUrl} at ${ref}: ${error.message}`,
        repoUrl,
        error
      );
    }
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
      const error = err instanceof Error ? err : new Error(String(err));

      // Check if ref doesn't exist first (more specific than auth errors)
      // A "branch not found" can sometimes look like an auth error to git
      if (this.isRefError(error)) {
        // Try cloning without branch specification and checkout afterward
        try {
          await git.clone(cloneUrl, targetPath, ['--depth=1']);
          const repoGit = this.createGit(targetPath);
          await repoGit.fetch(['origin', ref, '--depth=1']);
          await repoGit.checkout(ref);
        } catch (fetchErr) {
          const fetchError = fetchErr instanceof Error ? fetchErr : new Error(String(fetchErr));
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

      // Check if it's an auth error
      if (this.isAuthError(error)) {
        throw new GitAuthError(`Authentication failed for ${this.url}`, this.url, error);
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
      const error = err instanceof Error ? err : new Error(String(err));

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
   *
   * Note: The @ prefix is preserved as it's part of the directory name
   * (e.g., @core/base.prs lives in a directory literally named "@core")
   */
  private resolveFilePath(repoPath: string, relativePath: string): string {
    let cleanPath = relativePath;

    // Add .prs extension if not present and path doesn't end with /
    if (!cleanPath.endsWith('.prs') && !cleanPath.endsWith('.md') && !cleanPath.endsWith('/')) {
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
   *
   * Note: The @ prefix is preserved as it's part of the directory name
   * (e.g., @core lives in a directory literally named "@core")
   */
  private resolveDirectoryPath(repoPath: string, relativePath: string): string {
    // Build full path with optional subPath
    if (this.subPath) {
      return join(repoPath, this.subPath, relativePath);
    }

    return join(repoPath, relativePath);
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
      message.includes("couldn't find remote ref") ||
      message.includes('pathspec') ||
      message.includes('did not match any') ||
      message.includes('not found in upstream')
    );
  }
}

// ---------------------------------------------------------------------------
// Internal semver helpers (avoids requiring the semver package)
// ---------------------------------------------------------------------------

interface SemverParts {
  major: number;
  minor: number;
  patch: number;
  pre: string;
  raw: string;
}

function parseSemver(tag: string): SemverParts | null {
  const stripped = tag.startsWith('v') ? tag.slice(1) : tag;
  const match = /^(\d+)\.(\d+)\.(\d+)(-(.+))?$/.exec(stripped);
  if (!match) return null;
  return {
    major: parseInt(match[1] ?? '0', 10),
    minor: parseInt(match[2] ?? '0', 10),
    patch: parseInt(match[3] ?? '0', 10),
    pre: match[5] ?? '',
    raw: tag,
  };
}

function compareSemver(a: SemverParts, b: SemverParts): number {
  if (a.major !== b.major) return a.major - b.major;
  if (a.minor !== b.minor) return a.minor - b.minor;
  if (a.patch !== b.patch) return a.patch - b.patch;
  // Pre-release versions sort lower than release versions
  if (a.pre && !b.pre) return -1;
  if (!a.pre && b.pre) return 1;
  return a.pre.localeCompare(b.pre);
}

/**
 * Return the highest tag from `tags` that satisfies `range`.
 * Supports: exact versions, caret ranges (^1.2.3),
 * tilde ranges (~1.2.3), wildcards (1.x, 1.*), and
 * comparison operators (>=1.0.0 <2.0.0).
 */
function maxSatisfying(tags: string[], range: string): string | null {
  const parsed = tags.map(parseSemver).filter((v): v is SemverParts => v !== null);
  const satisfying = parsed.filter((v) => satisfiesRange(v, range));
  if (satisfying.length === 0) return null;
  satisfying.sort(compareSemver);
  const best = satisfying[satisfying.length - 1];
  return best ? best.raw : null;
}

function satisfiesRange(v: SemverParts, range: string): boolean {
  const trimmed = range.trim();

  // Wildcard / x-range
  if (/^[*xX]$/.test(trimmed) || trimmed === '') return true;

  const xRangeMatch = /^(\d+)(?:\.([0-9xX*]+))?(?:\.([0-9xX*]+))?$/.exec(trimmed);
  if (xRangeMatch) {
    const maj = xRangeMatch[1] ?? '0';
    const min = xRangeMatch[2];
    const pat = xRangeMatch[3];
    if (v.major !== parseInt(maj, 10)) return false;
    if (!min || /^[xX*]$/.test(min)) return true;
    if (v.minor !== parseInt(min, 10)) return false;
    if (!pat || /^[xX*]$/.test(pat)) return true;
    return v.patch === parseInt(pat, 10);
  }

  // Caret range: ^1.2.3
  const caretMatch = /^\^(.+)$/.exec(trimmed);
  if (caretMatch) {
    const base = parseSemver(caretMatch[1] ?? '');
    if (!base) return false;
    if (v.major !== base.major) return false;
    return compareSemver(v, base) >= 0;
  }

  // Tilde range: ~1.2.3
  const tildeMatch = /^~(.+)$/.exec(trimmed);
  if (tildeMatch) {
    const base = parseSemver(tildeMatch[1] ?? '');
    if (!base) return false;
    if (v.major !== base.major || v.minor !== base.minor) return false;
    return compareSemver(v, base) >= 0;
  }

  // Compound range (space-separated comparators): >=1.0.0 <2.0.0
  if (trimmed.includes(' ')) {
    return trimmed.split(/\s+/).every((part) => satisfiesRange(v, part));
  }

  // Single comparator: >=1.0.0, >1.0.0, <=1.0.0, <1.0.0, =1.0.0
  const compMatch = /^(>=|<=|>|<|=?)(.+)$/.exec(trimmed);
  if (compMatch) {
    const op = compMatch[1] ?? '';
    const ver = compMatch[2] ?? '';
    const base = parseSemver(ver);
    if (!base) return false;
    const cmp = compareSemver(v, base);
    if (op === '>=') return cmp >= 0;
    if (op === '<=') return cmp <= 0;
    if (op === '>') return cmp > 0;
    if (op === '<') return cmp < 0;
    return cmp === 0;
  }

  return false;
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
