/**
 * Represents a location in source code.
 */
export interface SourceLocation {
  /** File path */
  file: string;
  /** Line number (1-indexed) */
  line: number;
  /** Column number (1-indexed) */
  column: number;
  /** Byte offset from start of file */
  offset?: number;
}

/**
 * Range in source code (start to end).
 */
export interface SourceRange {
  start: SourceLocation;
  end: SourceLocation;
}
