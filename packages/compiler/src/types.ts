import type { OutputConvention, Program } from '@promptscript/core';
import type { ResolverOptions } from '@promptscript/resolver';
import type { ValidatorConfig, ValidationMessage } from '@promptscript/validator';

/**
 * Output from a formatter.
 */
export interface FormatterOutput {
  /** Output file path */
  path: string;
  /** Formatted content */
  content: string;
}

/**
 * Options for formatting.
 */
export interface FormatOptions {
  /** Output convention to use */
  convention?: OutputConvention | string;
  /** Custom output path */
  outputPath?: string;
  /**
   * Target version or format variant.
   * Use 'legacy' for deprecated formats.
   * @example 'legacy' | '1.0' | '2.0'
   */
  version?: string;
}

/**
 * Interface for formatters that convert AST to target format.
 */
export interface Formatter {
  /** Formatter name (e.g., "github", "claude", "cursor") */
  readonly name: string;
  /** Output path pattern */
  readonly outputPath: string;
  /** Default convention for this formatter */
  readonly defaultConvention: string;
  /** Format the AST to target format */
  format(ast: Program, options?: FormatOptions): FormatterOutput;
}

/**
 * Formatter class constructor type.
 */
export type FormatterConstructor = new () => Formatter;

/**
 * Configuration for a single target.
 */
export interface TargetConfig {
  /** Whether this target is enabled */
  enabled?: boolean;
  /** Custom output path */
  output?: string;
  /** Output convention ('xml', 'markdown', or custom name) */
  convention?: string;
  /**
   * Target version or format variant.
   * Use 'legacy' for deprecated formats.
   * @example 'legacy' | '1.0' | '2.0'
   */
  version?: string;
}

/**
 * Options for the compiler.
 */
export interface CompilerOptions {
  /** Resolver configuration */
  resolver: ResolverOptions;
  /** Validator configuration */
  validator?: ValidatorConfig;
  /** Formatters to use (names, instances, or configs) */
  formatters: (Formatter | string | { name: string; config?: TargetConfig })[];
  /** Custom convention definitions */
  customConventions?: Record<string, OutputConvention>;
}

/**
 * Compilation error with additional metadata.
 */
export interface CompileError {
  /** Error name/type */
  name: string;
  /** Error code or rule ID */
  code: string;
  /** Error message */
  message: string;
  /** Source location */
  location?: {
    file?: string;
    line?: number;
    column?: number;
  };
  /** Format error for display */
  format?: () => string;
}

/**
 * Statistics about the compilation process.
 */
export interface CompileStats {
  /** Time spent resolving (ms) */
  resolveTime: number;
  /** Time spent validating (ms) */
  validateTime: number;
  /** Time spent formatting (ms) */
  formatTime: number;
  /** Total compilation time (ms) */
  totalTime: number;
}

/**
 * Result of a compilation.
 */
export interface CompileResult {
  /** Whether compilation succeeded */
  success: boolean;
  /** Formatter outputs keyed by formatter name */
  outputs: Map<string, FormatterOutput>;
  /** Errors encountered during compilation */
  errors: CompileError[];
  /** Warnings from validation */
  warnings: ValidationMessage[];
  /** Compilation statistics */
  stats: CompileStats;
}
