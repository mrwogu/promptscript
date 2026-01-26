import type { OutputConvention, PrettierMarkdownOptions, Program } from '@promptscript/core';

/**
 * Output from a formatter.
 */
export interface FormatterOutput {
  /** Output file path (relative to project root) */
  path: string;
  /** Formatted content */
  content: string;
  /** Additional files to generate (e.g., workflows) */
  additionalFiles?: FormatterOutput[];
}

/**
 * Options for formatting.
 */
export interface FormatOptions {
  /**
   * Output convention to use.
   * Can be a built-in convention name ('xml', 'markdown') or a custom OutputConvention.
   */
  convention?: OutputConvention | string;

  /**
   * Custom output path (overrides default).
   */
  outputPath?: string;

  /**
   * Target version or format variant.
   * Use 'legacy' for deprecated formats (e.g., Cursor's .cursorrules).
   * @example 'legacy' | '1.0' | '2.0'
   */
  version?: string;

  /**
   * Prettier formatting options for markdown output.
   */
  prettier?: PrettierMarkdownOptions;
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
  /** Default convention for this formatter */
  readonly defaultConvention: string;
  /** Transform AST to tool-specific format */
  format(ast: Program, options?: FormatOptions): FormatterOutput;
}

/**
 * Factory function type for creating formatter instances.
 */
export type FormatterFactory = () => Formatter;
