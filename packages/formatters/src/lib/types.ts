import type { Program } from '@promptscript/core';

/**
 * Output from a formatter.
 */
export interface FormatterOutput {
  /** Output file path (relative to project root) */
  path: string;
  /** Formatted content */
  content: string;
}

/**
 * Common interface for all formatters.
 */
export interface Formatter {
  /** Unique formatter identifier */
  readonly name: string;
  /** Default output file path */
  readonly outputPath: string;
  /** Human-readable description */
  readonly description: string;
  /** Transform AST to tool-specific format */
  format(ast: Program): FormatterOutput;
}

/**
 * Factory function type for creating formatter instances.
 */
export type FormatterFactory = () => Formatter;
