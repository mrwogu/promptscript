import type {
  Logger,
  OutputConvention,
  PrettierMarkdownOptions,
  Program,
} from '@promptscript/core';
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
  /** Additional files to generate (e.g., .cursor/commands/, .github/prompts/) */
  additionalFiles?: FormatterOutput[];
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
  /**
   * Prettier formatting options for markdown output.
   */
  prettier?: PrettierMarkdownOptions;

  /** Full target configuration, passed through from promptscript.yaml. */
  targetConfig?: TargetConfig;
}

/**
 * Interface for formatters that convert AST to target format.
 */
export interface Formatter {
  /** Formatter name (e.g., "github", "claude", "cursor") */
  readonly name: string;
  /** Output path pattern */
  readonly outputPath: string;
  /** Human-readable description */
  readonly description: string;
  /** Default convention for this formatter */
  readonly defaultConvention: string;
  /** Format the AST to target format */
  format(ast: Program, options?: FormatOptions): FormatterOutput;
  /** Base path for skills (e.g., '.claude/skills'), or null if no skill support */
  getSkillBasePath(): string | null;
  /** Skill file name (e.g., 'SKILL.md' or 'skill.md'), or null if no skill support */
  getSkillFileName(): string | null;
  /** How this formatter handles skill references: 'directory', 'inline', or 'none' */
  referencesMode(): 'directory' | 'inline' | 'none';
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

  /** Generate skills from @guards named entries (Factory). @default true */
  guardsAsSkills?: boolean;

  /** List generated guard skills in main output file (Factory). @default true */
  guardsSkillsListing?: boolean;
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
  /** Prettier formatting options for markdown output */
  prettier?: PrettierMarkdownOptions;
  /** Logger for verbose/debug output */
  logger?: Logger;
  /**
   * Content of the PromptScript SKILL.md to inject into compilation output.
   * When provided (and config doesn't disable it), this content is added
   * to each formatter's native skill directory.
   */
  skillContent?: string;
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

/**
 * Callback invoked when watch mode detects changes and recompiles.
 */
export type WatchCallback = (result: CompileResult, changedFiles: string[]) => void;

/**
 * Options for watch mode.
 */
export interface WatchOptions {
  /** Glob patterns to include. Defaults to all .prs files. */
  include?: string[];
  /** Glob patterns to exclude. Defaults to node_modules. */
  exclude?: string[];
  /** Debounce delay in milliseconds. Defaults to 300. */
  debounce?: number;
  /** Callback invoked on each recompilation */
  onCompile?: WatchCallback;
  /** Callback invoked on errors */
  onError?: (error: Error) => void;
}

/**
 * Handle returned by watch() to control the watcher.
 */
export interface Watcher {
  /** Stop watching and clean up */
  close(): Promise<void>;
}
