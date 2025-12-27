import { existsSync, promises as fs } from 'fs';
import { join } from 'path';
import { FileNotFoundError } from '@promptscript/core';

/**
 * Registry interface for fetching PromptScript files.
 */
export interface Registry {
  /**
   * Fetch the content of a file from the registry.
   *
   * @param path - Path to the file (relative to registry root)
   * @returns File content as string
   * @throws FileNotFoundError if the file doesn't exist
   */
  fetch(path: string): Promise<string>;

  /**
   * Check if a file exists in the registry.
   *
   * @param path - Path to check
   * @returns True if the file exists
   */
  exists(path: string): Promise<boolean>;

  /**
   * List files in a directory.
   *
   * @param path - Directory path
   * @returns Array of file/directory names
   */
  list(path: string): Promise<string[]>;
}

/**
 * Options for FileSystemRegistry.
 */
export interface FileSystemRegistryOptions {
  /** Root directory for the registry */
  rootPath: string;
}

/**
 * Registry implementation backed by the local filesystem.
 */
export class FileSystemRegistry implements Registry {
  private readonly rootPath: string;

  constructor(options: FileSystemRegistryOptions) {
    this.rootPath = options.rootPath;
  }

  /**
   * Resolve a path relative to the registry root.
   */
  private resolvePath(path: string): string {
    return join(this.rootPath, path);
  }

  async fetch(path: string): Promise<string> {
    const fullPath = this.resolvePath(path);

    try {
      return await fs.readFile(fullPath, 'utf-8');
    } catch (err) {
      const error = err as NodeJS.ErrnoException;
      if (error.code === 'ENOENT') {
        throw new FileNotFoundError(fullPath);
      }
      throw err;
    }
  }

  async exists(path: string): Promise<boolean> {
    const fullPath = this.resolvePath(path);
    return existsSync(fullPath);
  }

  async list(path: string): Promise<string[]> {
    const fullPath = this.resolvePath(path);

    try {
      const entries = await fs.readdir(fullPath, { withFileTypes: true });
      return entries.map((e) => (e.isDirectory() ? `${e.name}/` : e.name));
    } catch {
      return [];
    }
  }
}

/**
 * Options for HttpRegistry.
 */
export interface HttpRegistryOptions {
  /** Base URL of the registry */
  baseUrl: string;
  /** Authentication options */
  auth?: {
    /** Auth type: 'bearer' or 'basic' */
    type: 'bearer' | 'basic';
    /** Token for bearer auth, or "username:password" for basic */
    token: string;
  };
  /** Cache settings */
  cache?: {
    /** Whether caching is enabled */
    enabled: boolean;
    /** TTL in milliseconds */
    ttl: number;
  };
  /** Retry settings */
  retry?: {
    /** Maximum number of retries */
    maxRetries: number;
    /** Initial delay in ms (doubles each retry) */
    initialDelay: number;
  };
  /** Request timeout in ms */
  timeout?: number;
}

interface CacheEntry {
  content: string;
  timestamp: number;
}

/**
 * Registry implementation backed by HTTP.
 */
export class HttpRegistry implements Registry {
  private readonly baseUrl: string;
  private readonly auth?: HttpRegistryOptions['auth'];
  private readonly cacheEnabled: boolean;
  private readonly cacheTtl: number;
  private readonly maxRetries: number;
  private readonly initialDelay: number;
  private readonly timeout: number;
  private readonly cache = new Map<string, CacheEntry>();

  constructor(options: HttpRegistryOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.auth = options.auth;
    this.cacheEnabled = options.cache?.enabled ?? false;
    this.cacheTtl = options.cache?.ttl ?? 300000; // 5 minutes default
    this.maxRetries = options.retry?.maxRetries ?? 3;
    this.initialDelay = options.retry?.initialDelay ?? 1000;
    this.timeout = options.timeout ?? 30000;
  }

  /**
   * Build full URL for a path.
   */
  private buildUrl(path: string): string {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${this.baseUrl}${normalizedPath}`;
  }

  /**
   * Build headers for request.
   */
  private buildHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};

    if (this.auth) {
      if (this.auth.type === 'bearer') {
        headers['Authorization'] = `Bearer ${this.auth.token}`;
      } else if (this.auth.type === 'basic') {
        const encoded = Buffer.from(this.auth.token).toString('base64');
        headers['Authorization'] = `Basic ${encoded}`;
      }
    }

    return headers;
  }

  /**
   * Sleep for specified milliseconds.
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Fetch with timeout.
   */
  private async fetchWithTimeout(url: string, options: RequestInit): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      return await fetch(url, {
        ...options,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Check if an error should not be retried.
   */
  private isNonRetryableError(error: Error & { isClientError?: boolean }): boolean {
    return error.isClientError === true || error.name === 'AbortError';
  }

  /**
   * Handle HTTP response, throwing for errors.
   */
  private handleResponse(response: Response): Response {
    if (response.ok) {
      return response;
    }

    const errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    const error = new Error(errorMessage) as Error & { isClientError?: boolean };

    // Mark client errors (4xx) as non-retryable
    if (response.status >= 400 && response.status < 500) {
      error.isClientError = true;
    }

    throw error;
  }

  /**
   * Fetch with retry logic.
   */
  private async fetchWithRetry(url: string): Promise<Response> {
    let lastError: Error | undefined;
    let delay = this.initialDelay;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await this.fetchWithTimeout(url, {
          method: 'GET',
          headers: this.buildHeaders(),
        });

        return this.handleResponse(response);
      } catch (err) {
        const error = err as Error & { isClientError?: boolean };

        if (this.isNonRetryableError(error)) {
          if (error.name === 'AbortError') {
            throw new Error(`Request timeout after ${this.timeout}ms`);
          }
          throw error;
        }

        lastError = error;
      }

      // Wait before retry (except on last attempt)
      if (attempt < this.maxRetries) {
        await this.sleep(delay);
        delay *= 2; // Exponential backoff
      }
    }

    throw lastError ?? new Error('Unknown fetch error');
  }

  /**
   * Check if cached entry is still valid.
   */
  private isCacheValid(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp < this.cacheTtl;
  }

  async fetch(path: string): Promise<string> {
    // Check cache first
    if (this.cacheEnabled) {
      const cached = this.cache.get(path);
      if (cached && this.isCacheValid(cached)) {
        return cached.content;
      }
    }

    const url = this.buildUrl(path);

    try {
      const response = await this.fetchWithRetry(url);
      const content = await response.text();

      // Store in cache
      if (this.cacheEnabled) {
        this.cache.set(path, {
          content,
          timestamp: Date.now(),
        });
      }

      return content;
    } catch (err) {
      const error = err as Error;
      if (error.message.includes('404')) {
        throw new FileNotFoundError(path);
      }
      throw new Error(`Failed to fetch ${path}: ${error.message}`);
    }
  }

  async exists(path: string): Promise<boolean> {
    try {
      const url = this.buildUrl(path);
      const response = await this.fetchWithTimeout(url, {
        method: 'HEAD',
        headers: this.buildHeaders(),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async list(path: string): Promise<string[]> {
    // HTTP registries typically don't support listing
    // This would need a specific API endpoint (e.g., .index.json)
    const url = this.buildUrl(`${path}/.index.json`);

    try {
      const response = await this.fetchWithTimeout(url, {
        method: 'GET',
        headers: this.buildHeaders(),
      });

      if (!response.ok) {
        return [];
      }

      const content = await response.text();
      return JSON.parse(content) as string[];
    } catch {
      return [];
    }
  }

  /**
   * Clear the cache.
   */
  clearCache(): void {
    this.cache.clear();
  }
}

/**
 * Options for CompositeRegistry.
 */
export interface CompositeRegistryOptions {
  /** Registries to compose (checked in order) */
  registries: Registry[];
}

/**
 * Registry that combines multiple registries with fallback.
 */
export class CompositeRegistry implements Registry {
  private readonly registries: Registry[];

  constructor(options: CompositeRegistryOptions) {
    this.registries = options.registries;
  }

  async fetch(path: string): Promise<string> {
    let lastError: Error | undefined;

    for (const registry of this.registries) {
      try {
        return await registry.fetch(path);
      } catch (err) {
        lastError = err as Error;
        // Continue to next registry
      }
    }

    throw lastError ?? new FileNotFoundError(path);
  }

  async exists(path: string): Promise<boolean> {
    for (const registry of this.registries) {
      if (await registry.exists(path)) {
        return true;
      }
    }
    return false;
  }

  async list(path: string): Promise<string[]> {
    const allEntries = new Set<string>();

    for (const registry of this.registries) {
      const entries = await registry.list(path);
      entries.forEach((e) => allEntries.add(e));
    }

    return [...allEntries];
  }
}

/**
 * Create a filesystem-based registry.
 *
 * @param rootPath - Root directory for the registry
 * @returns FileSystemRegistry instance
 *
 * @example
 * ```typescript
 * const registry = createFileSystemRegistry('/path/to/registry');
 * const content = await registry.fetch('@core/guards/compliance.prs');
 * ```
 */
export function createFileSystemRegistry(rootPath: string): FileSystemRegistry {
  return new FileSystemRegistry({ rootPath });
}

/**
 * Create an HTTP-based registry.
 *
 * @param options - HTTP registry options
 * @returns HttpRegistry instance
 *
 * @example
 * ```typescript
 * const registry = createHttpRegistry({
 *   baseUrl: 'https://registry.example.com',
 *   auth: { type: 'bearer', token: 'your-token' },
 *   cache: { enabled: true, ttl: 300000 },
 *   retry: { maxRetries: 3, initialDelay: 1000 },
 * });
 * ```
 */
export function createHttpRegistry(options: HttpRegistryOptions): HttpRegistry {
  return new HttpRegistry(options);
}

/**
 * Create a composite registry from multiple sources.
 *
 * @param registries - Registries to combine
 * @returns CompositeRegistry instance
 *
 * @example
 * ```typescript
 * const registry = createCompositeRegistry([
 *   createFileSystemRegistry('/local/registry'),
 *   createHttpRegistry({ baseUrl: 'https://registry.example.com' }),
 * ]);
 * ```
 */
export function createCompositeRegistry(registries: Registry[]): CompositeRegistry {
  return new CompositeRegistry({ registries });
}
