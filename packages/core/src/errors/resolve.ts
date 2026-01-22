import type { SourceLocation } from '../types/source.js';
import { PSError, ErrorCode } from './base.js';

/**
 * Error during resolution phase.
 */
export class ResolveError extends PSError {
  constructor(
    message: string,
    location?: SourceLocation,
    code: ErrorCode = ErrorCode.RESOLVE_ERROR
  ) {
    super(message, code, { location });
    this.name = 'ResolveError';
  }
}

/**
 * File not found during resolution.
 */
export class FileNotFoundError extends ResolveError {
  /** Path that was not found */
  readonly path: string;

  constructor(path: string, location?: SourceLocation) {
    super(`File not found: ${path}`, location, ErrorCode.FILE_NOT_FOUND);
    this.name = 'FileNotFoundError';
    this.path = path;
  }
}

/**
 * Circular dependency detected.
 */
export class CircularDependencyError extends ResolveError {
  /** Chain of files forming the cycle */
  readonly chain: string[];

  constructor(chain: string[]) {
    super(
      `Circular dependency detected: ${chain.join(' → ')}`,
      undefined,
      ErrorCode.CIRCULAR_DEPENDENCY
    );
    this.name = 'CircularDependencyError';
    this.chain = chain;
  }
}

/**
 * Git clone operation failed.
 */
export class GitCloneError extends ResolveError {
  /** Git repository URL */
  readonly url: string;

  constructor(message: string, url: string, location?: SourceLocation, cause?: Error) {
    super(message, location, ErrorCode.GIT_CLONE_ERROR);
    this.name = 'GitCloneError';
    this.url = url;
    if (cause) {
      (this as { cause?: Error }).cause = cause;
    }
  }
}

/**
 * Git authentication failed.
 */
export class GitAuthError extends ResolveError {
  /** Git repository URL */
  readonly url: string;

  constructor(message: string, url: string, location?: SourceLocation) {
    super(message, location, ErrorCode.GIT_AUTH_ERROR);
    this.name = 'GitAuthError';
    this.url = url;
  }
}

/**
 * Git ref (branch/tag/commit) not found.
 */
export class GitRefNotFoundError extends ResolveError {
  /** Git ref that was not found */
  readonly ref: string;
  /** Git repository URL */
  readonly url: string;

  constructor(ref: string, url: string, location?: SourceLocation) {
    super(`Git ref not found: ${ref} in ${url}`, location, ErrorCode.GIT_REF_NOT_FOUND);
    this.name = 'GitRefNotFoundError';
    this.ref = ref;
    this.url = url;
  }
}
