import { join, dirname } from 'path';
import { parse as parseYaml } from 'yaml';
import type { RegistryManifest, CatalogEntry, NamespaceDefinition } from '@promptscript/core';
import type { CliServices } from '../services.js';
import { createDefaultServices } from '../services.js';

/**
 * Official PromptScript Registry configuration.
 */
export const OFFICIAL_REGISTRY = {
  name: 'PromptScript Official Registry',
  url: 'https://github.com/mrwogu/promptscript-registry.git',
  branch: 'main',
  manifestUrl:
    'https://raw.githubusercontent.com/mrwogu/promptscript-registry/main/registry-manifest.yaml',
} as const;

/**
 * Error thrown when manifest loading fails.
 */
export class ManifestLoadError extends Error {
  public readonly originalCause?: Error;

  constructor(message: string, cause?: Error) {
    super(message);
    this.name = 'ManifestLoadError';
    this.originalCause = cause;
  }
}

/**
 * Options for loading the manifest.
 */
export interface ManifestLoadOptions {
  /** Registry path (local directory or git URL) */
  registryPath?: string;
  /** Cache the manifest in memory */
  useCache?: boolean;
}

/**
 * Manifest loader result.
 */
export interface LoadedManifest {
  /** The parsed manifest */
  manifest: RegistryManifest;
  /** Path to the manifest file */
  path: string;
  /** Whether it was loaded from cache */
  cached: boolean;
}

/** In-memory cache for manifests */
const manifestCache = new Map<string, RegistryManifest>();

/**
 * Default manifest file name.
 */
export const MANIFEST_FILENAME = 'registry-manifest.yaml';

/**
 * Load the registry manifest from a registry path.
 *
 * @param options - Loading options
 * @param services - CLI services for file operations
 * @returns The loaded manifest with metadata
 *
 * @example
 * ```typescript
 * const { manifest } = await loadManifest({
 *   registryPath: '../promptscript-registry'
 * });
 * console.log(manifest.meta.name);
 * ```
 */
export async function loadManifest(
  options: ManifestLoadOptions = {},
  services: CliServices = createDefaultServices()
): Promise<LoadedManifest> {
  const { registryPath = findDefaultRegistryPath(services), useCache = true } = options;

  const manifestPath = resolveManifestPath(registryPath, services);

  // Check cache
  if (useCache && manifestCache.has(manifestPath)) {
    return {
      manifest: manifestCache.get(manifestPath)!,
      path: manifestPath,
      cached: true,
    };
  }

  // Load and parse
  const manifest = await loadManifestFromPath(manifestPath, services);

  // Validate
  validateManifest(manifest);

  // Cache
  if (useCache) {
    manifestCache.set(manifestPath, manifest);
  }

  return {
    manifest,
    path: manifestPath,
    cached: false,
  };
}

/**
 * Clear the manifest cache.
 */
export function clearManifestCache(): void {
  manifestCache.clear();
}

/**
 * Find the default registry path by looking for common locations.
 */
function findDefaultRegistryPath(services: CliServices): string {
  const candidates = ['./registry', '../promptscript-registry', './.promptscript-registry'];

  for (const candidate of candidates) {
    const manifestPath = join(services.cwd, candidate, MANIFEST_FILENAME);
    if (services.fs.existsSync(manifestPath)) {
      return candidate;
    }
  }

  // Return default even if not found - will error later with clear message
  return './registry';
}

/**
 * Resolve the manifest file path from a registry path.
 */
function resolveManifestPath(registryPath: string, services: CliServices): string {
  // If it's already a full path to the manifest file
  if (registryPath.endsWith('.yaml') || registryPath.endsWith('.yml')) {
    return join(services.cwd, registryPath);
  }

  // Otherwise, look for manifest in the directory
  return join(services.cwd, registryPath, MANIFEST_FILENAME);
}

/**
 * Load and parse manifest from a file path.
 */
async function loadManifestFromPath(
  manifestPath: string,
  services: CliServices
): Promise<RegistryManifest> {
  if (!services.fs.existsSync(manifestPath)) {
    throw new ManifestLoadError(
      `Registry manifest not found at: ${manifestPath}\n` +
        'Run `prs pull` to fetch the registry or check your registry configuration.'
    );
  }

  try {
    const content = await services.fs.readFile(manifestPath, 'utf-8');
    const manifest = parseYaml(content) as RegistryManifest;
    return manifest;
  } catch (error) {
    throw new ManifestLoadError(
      `Failed to parse manifest: ${manifestPath}`,
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Validate manifest structure.
 */
function validateManifest(manifest: RegistryManifest): void {
  if (!manifest.version) {
    throw new ManifestLoadError('Manifest missing required field: version');
  }
  if (manifest.version !== '1') {
    throw new ManifestLoadError(`Unsupported manifest version: ${manifest.version}`);
  }
  if (!manifest.meta) {
    throw new ManifestLoadError('Manifest missing required field: meta');
  }
  if (!manifest.catalog) {
    throw new ManifestLoadError('Manifest missing required field: catalog');
  }
  if (!Array.isArray(manifest.catalog)) {
    throw new ManifestLoadError('Manifest catalog must be an array');
  }
}

/**
 * Get a catalog entry by ID.
 */
export function getCatalogEntry(manifest: RegistryManifest, id: string): CatalogEntry | undefined {
  return manifest.catalog.find((entry) => entry.id === id);
}

/**
 * Get all catalog entries in a namespace.
 */
export function getCatalogEntriesByNamespace(
  manifest: RegistryManifest,
  namespace: string
): CatalogEntry[] {
  const normalizedNamespace = namespace.startsWith('@') ? namespace : `@${namespace}`;
  return manifest.catalog.filter((entry) => entry.id.startsWith(`${normalizedNamespace}/`));
}

/**
 * Get all catalog entries with a specific tag.
 */
export function getCatalogEntriesByTag(manifest: RegistryManifest, tag: string): CatalogEntry[] {
  return manifest.catalog.filter((entry) => entry.tags.includes(tag));
}

/**
 * Get namespace definition.
 */
export function getNamespace(
  manifest: RegistryManifest,
  namespace: string
): NamespaceDefinition | undefined {
  const normalizedNamespace = namespace.startsWith('@') ? namespace : `@${namespace}`;
  return manifest.namespaces[normalizedNamespace];
}

/**
 * Get all namespaces sorted by priority.
 */
export function getNamespacesSortedByPriority(
  manifest: RegistryManifest
): Array<{ name: string; definition: NamespaceDefinition }> {
  return Object.entries(manifest.namespaces)
    .map(([name, definition]) => ({ name, definition }))
    .sort((a, b) => b.definition.priority - a.definition.priority);
}

/**
 * Search catalog entries by text.
 */
export function searchCatalog(manifest: RegistryManifest, query: string): CatalogEntry[] {
  const normalizedQuery = query.toLowerCase();
  return manifest.catalog.filter(
    (entry) =>
      entry.id.toLowerCase().includes(normalizedQuery) ||
      entry.name.toLowerCase().includes(normalizedQuery) ||
      entry.description.toLowerCase().includes(normalizedQuery) ||
      entry.tags.some((tag) => tag.toLowerCase().includes(normalizedQuery))
  );
}

/**
 * Get the base directory of the registry from the manifest path.
 */
export function getRegistryBaseDir(manifestPath: string): string {
  return dirname(manifestPath);
}

/**
 * Resolve a catalog entry path to a full file path.
 */
export function resolveCatalogEntryPath(manifestPath: string, entry: CatalogEntry): string {
  const baseDir = getRegistryBaseDir(manifestPath);
  return join(baseDir, entry.path);
}

/**
 * Remote manifest loader result.
 */
export interface RemoteLoadedManifest {
  /** The parsed manifest */
  manifest: RegistryManifest;
  /** URL the manifest was loaded from */
  url: string;
  /** Whether it was loaded from cache */
  cached: boolean;
}

/**
 * Load manifest from a remote URL.
 *
 * @param url - URL to fetch manifest from (defaults to official registry)
 * @param useCache - Whether to use in-memory cache
 * @returns The loaded manifest with metadata
 *
 * @example
 * ```typescript
 * // Load from official registry
 * const { manifest } = await loadManifestFromUrl();
 *
 * // Load from custom URL
 * const { manifest } = await loadManifestFromUrl('https://example.com/registry-manifest.yaml');
 * ```
 */
export async function loadManifestFromUrl(
  url: string = OFFICIAL_REGISTRY.manifestUrl,
  useCache: boolean = true
): Promise<RemoteLoadedManifest> {
  // Check cache
  if (useCache && manifestCache.has(url)) {
    return {
      manifest: manifestCache.get(url)!,
      url,
      cached: true,
    };
  }

  try {
    const response = await fetch(url, {
      headers: {
        Accept: 'application/x-yaml, text/yaml, text/plain',
        'User-Agent': 'PromptScript-CLI',
      },
    });

    if (!response.ok) {
      throw new ManifestLoadError(
        `Failed to fetch manifest from ${url}: ${response.status} ${response.statusText}`
      );
    }

    const content = await response.text();
    const manifest = parseYaml(content) as RegistryManifest;

    // Validate
    validateManifest(manifest);

    // Cache
    if (useCache) {
      manifestCache.set(url, manifest);
    }

    return {
      manifest,
      url,
      cached: false,
    };
  } catch (error) {
    if (error instanceof ManifestLoadError) {
      throw error;
    }
    throw new ManifestLoadError(
      `Failed to load manifest from ${url}`,
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Convert a GitHub repository URL to a raw manifest URL.
 *
 * @param repoUrl - GitHub repository URL
 * @param branch - Branch name (default: main)
 * @returns Raw URL for the manifest file
 *
 * @example
 * ```typescript
 * const url = githubRepoToManifestUrl('https://github.com/user/registry.git');
 * // Returns: https://raw.githubusercontent.com/user/registry/main/registry-manifest.yaml
 * ```
 */
export function githubRepoToManifestUrl(repoUrl: string, branch: string = 'main'): string {
  // Parse GitHub URL
  const match = repoUrl.match(/github\.com[/:]([^/]+)\/([^/]+?)(?:\.git)?$/);
  if (!match) {
    throw new ManifestLoadError(`Invalid GitHub repository URL: ${repoUrl}`);
  }

  const [, owner, repo] = match;
  return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${MANIFEST_FILENAME}`;
}

/**
 * Check if a URL points to a remote resource.
 */
export function isRemoteUrl(path: string): boolean {
  return path.startsWith('http://') || path.startsWith('https://') || path.includes('github.com');
}
