/**
 * Git URL parsing and manipulation utilities.
 *
 * Supports various Git URL formats:
 * - HTTPS: https://github.com/org/repo.git
 * - SSH: git@github.com:org/repo.git
 * - Git protocol: git://github.com/org/repo.git
 *
 * @packageDocumentation
 */

import { createHash } from 'crypto';

/**
 * Parsed Git URL structure.
 */
export interface ParsedGitUrl {
  /** Full original URL */
  original: string;
  /** Protocol (https, ssh, git) */
  protocol: 'https' | 'ssh' | 'git';
  /** Host (e.g., github.com, gitlab.com) */
  host: string;
  /** Repository owner/organization */
  owner: string;
  /** Repository name (without .git) */
  repo: string;
  /** Port number (if specified) */
  port?: number;
}

/**
 * Parsed versioned path structure.
 */
export interface ParsedVersionedPath {
  /** Path without version (e.g., @company/base) */
  path: string;
  /** Version tag if specified (e.g., v1.0.0) */
  version?: string;
}

/**
 * Git URL patterns for detection and parsing.
 */
const GIT_URL_PATTERNS = {
  // HTTPS: https://github.com/org/repo.git or https://github.com/org/repo
  https:
    /^https?:\/\/(?<host>[^/:]+)(?::(?<port>\d+))?\/(?<owner>[^/]+)\/(?<repo>[^/]+?)(?:\.git)?$/,

  // SSH: git@github.com:org/repo.git or git@github.com:org/repo
  ssh: /^git@(?<host>[^:]+):(?<owner>[^/]+)\/(?<repo>[^/]+?)(?:\.git)?$/,

  // Git protocol: git://github.com/org/repo.git
  git: /^git:\/\/(?<host>[^/:]+)(?::(?<port>\d+))?\/(?<owner>[^/]+)\/(?<repo>[^/]+?)(?:\.git)?$/,
};

/**
 * Known Git hosting providers.
 */
const KNOWN_GIT_HOSTS = new Set([
  'github.com',
  'gitlab.com',
  'bitbucket.org',
  'dev.azure.com',
  'ssh.dev.azure.com',
  'gitea.io',
  'codeberg.org',
  'sr.ht',
]);

/**
 * Check if a URL is a Git repository URL.
 *
 * @param url - URL to check
 * @returns True if the URL is a Git repository URL
 *
 * @example
 * ```typescript
 * isGitUrl('https://github.com/org/repo.git'); // true
 * isGitUrl('git@github.com:org/repo.git'); // true
 * isGitUrl('https://example.com/api'); // false
 * ```
 */
export function isGitUrl(url: string): boolean {
  // Check for SSH pattern first
  if (url.startsWith('git@')) {
    return GIT_URL_PATTERNS.ssh.test(url);
  }

  // Check for git:// protocol
  if (url.startsWith('git://')) {
    return GIT_URL_PATTERNS.git.test(url);
  }

  // Check for HTTPS with known Git hosts or .git suffix
  if (url.startsWith('https://') || url.startsWith('http://')) {
    if (GIT_URL_PATTERNS.https.test(url)) {
      const parsed = parseGitUrl(url);
      if (parsed) {
        // Known Git host or ends with .git
        return KNOWN_GIT_HOSTS.has(parsed.host) || url.endsWith('.git');
      }
    }
  }

  return false;
}

/**
 * Parse a Git URL into its components.
 *
 * @param url - Git URL to parse
 * @returns Parsed URL components or null if invalid
 *
 * @example
 * ```typescript
 * const parsed = parseGitUrl('https://github.com/org/repo.git');
 * // { protocol: 'https', host: 'github.com', owner: 'org', repo: 'repo', original: '...' }
 * ```
 */
export function parseGitUrl(url: string): ParsedGitUrl | null {
  // Try SSH pattern
  if (url.startsWith('git@')) {
    const match = GIT_URL_PATTERNS.ssh.exec(url);
    if (match?.groups) {
      const { host, owner, repo } = match.groups;
      if (host && owner && repo) {
        return {
          original: url,
          protocol: 'ssh',
          host,
          owner,
          repo,
        };
      }
    }
    return null;
  }

  // Try git:// protocol
  if (url.startsWith('git://')) {
    const match = GIT_URL_PATTERNS.git.exec(url);
    if (match?.groups) {
      const { host, owner, repo, port } = match.groups;
      if (host && owner && repo) {
        return {
          original: url,
          protocol: 'git',
          host,
          owner,
          repo,
          port: port ? parseInt(port, 10) : undefined,
        };
      }
    }
    return null;
  }

  // Try HTTPS pattern
  if (url.startsWith('https://') || url.startsWith('http://')) {
    const match = GIT_URL_PATTERNS.https.exec(url);
    if (match?.groups) {
      const { host, owner, repo, port } = match.groups;
      if (host && owner && repo) {
        return {
          original: url,
          protocol: 'https',
          host,
          owner,
          repo,
          port: port ? parseInt(port, 10) : undefined,
        };
      }
    }
  }

  return null;
}

/**
 * Normalize a Git URL to a canonical HTTPS form.
 *
 * @param url - Git URL to normalize
 * @returns Normalized HTTPS URL
 *
 * @example
 * ```typescript
 * normalizeGitUrl('git@github.com:org/repo.git');
 * // 'https://github.com/org/repo.git'
 * ```
 */
export function normalizeGitUrl(url: string): string {
  const parsed = parseGitUrl(url);
  if (!parsed) {
    return url;
  }

  // Build normalized HTTPS URL
  const portPart = parsed.port ? `:${parsed.port}` : '';
  return `https://${parsed.host}${portPart}/${parsed.owner}/${parsed.repo}.git`;
}

/**
 * Build an authenticated Git URL with a token.
 *
 * @param url - Original Git URL
 * @param token - Authentication token (PAT)
 * @returns URL with embedded token for HTTPS auth
 *
 * @example
 * ```typescript
 * buildAuthenticatedUrl('https://github.com/org/repo.git', 'ghp_xxxx');
 * // 'https://ghp_xxxx@github.com/org/repo.git'
 * ```
 */
export function buildAuthenticatedUrl(url: string, token: string): string {
  const parsed = parseGitUrl(url);
  if (!parsed) {
    return url;
  }

  // SSH URLs don't use token auth in URL
  if (parsed.protocol === 'ssh') {
    return url;
  }

  // Build authenticated HTTPS URL
  const portPart = parsed.port ? `:${parsed.port}` : '';
  return `https://${token}@${parsed.host}${portPart}/${parsed.owner}/${parsed.repo}.git`;
}

/**
 * Generate a deterministic cache key for a Git URL.
 *
 * @param url - Git URL
 * @param ref - Optional Git ref (branch/tag/commit)
 * @returns Cache key string
 *
 * @example
 * ```typescript
 * getCacheKey('https://github.com/org/repo.git', 'main');
 * // 'github.com-org-repo-main-abc123'
 * ```
 */
export function getCacheKey(url: string, ref?: string): string {
  const parsed = parseGitUrl(url);
  if (!parsed) {
    // Fallback to hash of URL
    const hash = createHash('sha256').update(url).digest('hex').slice(0, 8);
    return `unknown-${hash}`;
  }

  // Create deterministic key: host-owner-repo-ref-hash
  const components = [parsed.host, parsed.owner, parsed.repo];
  if (ref) {
    components.push(ref);
  }

  // Add short hash for collision avoidance
  const hash = createHash('sha256').update(components.join('/')).digest('hex').slice(0, 8);

  return `${parsed.host}-${parsed.owner}-${parsed.repo}${ref ? `-${ref}` : ''}-${hash}`;
}

/**
 * Parse a versioned path to extract path and version.
 *
 * @param path - Path that may contain version (e.g., @company/base@v1.0.0)
 * @returns Parsed path and version
 *
 * @example
 * ```typescript
 * parseVersionedPath('@company/base@v1.0.0');
 * // { path: '@company/base', version: 'v1.0.0' }
 *
 * parseVersionedPath('@company/base');
 * // { path: '@company/base', version: undefined }
 * ```
 */
export function parseVersionedPath(path: string): ParsedVersionedPath {
  // Match version at end: @org/path@version
  // Version must start with 'v' followed by semver-like pattern or be a valid semver
  const versionMatch = /@(v?\d+(?:\.\d+)*(?:-[\w.]+)?)$/.exec(path);

  if (versionMatch) {
    const version = versionMatch[1];
    const basePath = path.slice(0, -versionMatch[0].length);
    return { path: basePath, version };
  }

  return { path, version: undefined };
}

/**
 * Check if a host is a known Git hosting provider.
 *
 * @param host - Hostname to check
 * @returns True if it's a known Git host
 */
export function isKnownGitHost(host: string): boolean {
  return KNOWN_GIT_HOSTS.has(host);
}

/**
 * Get the web URL for a Git repository.
 *
 * @param url - Git URL
 * @returns Web URL for browsing the repository
 *
 * @example
 * ```typescript
 * getWebUrl('git@github.com:org/repo.git');
 * // 'https://github.com/org/repo'
 * ```
 */
export function getWebUrl(url: string): string {
  const parsed = parseGitUrl(url);
  if (!parsed) {
    return url;
  }

  return `https://${parsed.host}/${parsed.owner}/${parsed.repo}`;
}
