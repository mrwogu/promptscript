import type { SourceLocation } from '../types/source.js';
import { ErrorCode } from './base.js';
import { ResolveError } from './resolve.js';

/**
 * Unknown registry alias referenced in import.
 */
export class UnknownAliasError extends ResolveError {
  readonly alias: string;

  constructor(alias: string, location?: SourceLocation) {
    super(
      `Unknown registry alias '${alias}'. Run 'prs registry list' to see available aliases.`,
      location,
      ErrorCode.UNKNOWN_ALIAS
    );
    this.name = 'UnknownAliasError';
    this.alias = alias;
  }
}

/**
 * Path not found within registry repository.
 */
export class RegistryPathNotFoundError extends ResolveError {
  readonly importPath: string;
  readonly available: string[];

  constructor(importPath: string, available: string[], location?: SourceLocation) {
    const availStr = available.length > 0 ? ` Available: ${available.join(', ')}` : '';
    super(
      `Cannot resolve '${importPath}': path not found in repository.${availStr}`,
      location,
      ErrorCode.REGISTRY_PATH_NOT_FOUND
    );
    this.name = 'RegistryPathNotFoundError';
    this.importPath = importPath;
    this.available = available;
  }
}

/**
 * No version satisfying the requested semver range.
 */
export class SemverNoMatchError extends ResolveError {
  readonly range: string;
  readonly latest?: string;

  constructor(range: string, repoUrl: string, latest?: string, location?: SourceLocation) {
    const latestStr = latest ? ` Latest: ${latest}` : '';
    super(
      `No version matching '${range}' for '${repoUrl}'.${latestStr}`,
      location,
      ErrorCode.SEMVER_NO_MATCH
    );
    this.name = 'SemverNoMatchError';
    this.range = range;
    this.latest = latest;
  }
}

/**
 * Lockfile integrity check failed for a resolved import.
 */
export class LockfileIntegrityError extends ResolveError {
  readonly importPath: string;

  constructor(importPath: string, location?: SourceLocation) {
    super(
      `Lockfile integrity check failed for '${importPath}'. Run 'prs update' or 'prs lock' to refresh.`,
      location,
      ErrorCode.LOCKFILE_INTEGRITY
    );
    this.name = 'LockfileIntegrityError';
    this.importPath = importPath;
  }
}

/**
 * Cannot resolve import while offline with no cached version.
 */
export class OfflineResolveError extends ResolveError {
  readonly importPath: string;

  constructor(importPath: string, location?: SourceLocation) {
    super(
      `Cannot resolve '${importPath}': no network and no cached version. Run 'prs vendor sync' while online.`,
      location,
      ErrorCode.OFFLINE_RESOLVE
    );
    this.name = 'OfflineResolveError';
    this.importPath = importPath;
  }
}

/**
 * Rate limit exceeded when contacting registry.
 */
export class RateLimitError extends ResolveError {
  readonly retryAfterMinutes?: number;

  constructor(url: string, retryAfterMinutes?: number, location?: SourceLocation) {
    const retryStr = retryAfterMinutes
      ? ` Retry in ${retryAfterMinutes} minutes or set GITHUB_TOKEN for higher limits.`
      : ' Set GITHUB_TOKEN for higher rate limits.';
    super(`Rate limit exceeded for '${url}'.${retryStr}`, location, ErrorCode.RATE_LIMITED);
    this.name = 'RateLimitError';
    this.retryAfterMinutes = retryAfterMinutes;
  }
}
