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
