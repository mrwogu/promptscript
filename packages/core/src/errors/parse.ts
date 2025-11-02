import type { SourceLocation } from '../types/source';
import { PSError, ErrorCode } from './base';

/**
 * Error during parsing phase.
 */
export class ParseError extends PSError {
  constructor(
    message: string,
    location?: SourceLocation,
    code: ErrorCode = ErrorCode.PARSE_ERROR
  ) {
    super(message, code, { location });
    this.name = 'ParseError';
  }
}

/**
 * Unexpected token encountered.
 */
export class UnexpectedTokenError extends ParseError {
  /** The unexpected token */
  readonly token: string;
  /** Expected tokens */
  readonly expected?: string[];

  constructor(token: string, location: SourceLocation, expected?: string[]) {
    const expectedStr = expected?.length
      ? `, expected: ${expected.join(' | ')}`
      : '';
    super(
      `Unexpected token '${token}'${expectedStr}`,
      location,
      ErrorCode.UNEXPECTED_TOKEN
    );
    this.name = 'UnexpectedTokenError';
    this.token = token;
    this.expected = expected;
  }
}
