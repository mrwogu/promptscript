import type { SourceLocation } from '../types/source.js';

/**
 * Error codes for PromptScript errors.
 */
export enum ErrorCode {
  // Parse errors (1xxx)
  PARSE_ERROR = 'PS1000',
  UNEXPECTED_TOKEN = 'PS1001',
  UNTERMINATED_STRING = 'PS1002',
  INVALID_PATH = 'PS1003',

  // Resolve errors (2xxx)
  RESOLVE_ERROR = 'PS2000',
  FILE_NOT_FOUND = 'PS2001',
  CIRCULAR_DEPENDENCY = 'PS2002',
  INVALID_INHERIT = 'PS2003',
  GIT_CLONE_ERROR = 'PS2004',
  GIT_AUTH_ERROR = 'PS2005',
  GIT_REF_NOT_FOUND = 'PS2006',
  MISSING_PARAM = 'PS2010',
  UNKNOWN_PARAM = 'PS2011',
  PARAM_TYPE_MISMATCH = 'PS2012',
  UNDEFINED_VARIABLE = 'PS2013',

  // Validation errors (3xxx)
  VALIDATION_ERROR = 'PS3000',
  REQUIRED_FIELD = 'PS3001',
  INVALID_VALUE = 'PS3002',
  BLOCKED_PATTERN = 'PS3003',
  MISSING_GUARD = 'PS3004',
}

/**
 * Base error class for all PromptScript errors.
 */
export class PSError extends Error {
  /** Error code */
  readonly code: ErrorCode | string;
  /** Source location where error occurred */
  readonly location?: SourceLocation;
  /** Original error if wrapping another error */
  override readonly cause?: Error;

  constructor(
    message: string,
    code: ErrorCode | string,
    options?: {
      location?: SourceLocation;
      cause?: Error;
    }
  ) {
    super(message);
    this.name = 'PSError';
    this.code = code;
    this.location = options?.location;
    this.cause = options?.cause;

    // Maintains proper stack trace in V8
    Error.captureStackTrace?.(this, this.constructor);
  }

  /**
   * Format error for display.
   */
  format(): string {
    let result = `${this.name} [${this.code}]: ${this.message}`;

    if (this.location) {
      result += `\n  at ${this.location.file}:${this.location.line}:${this.location.column}`;
    }

    return result;
  }

  /**
   * Convert to JSON-serializable object.
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      location: this.location,
    };
  }
}
