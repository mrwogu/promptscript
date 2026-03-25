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

  /** Full target configuration, passed through from promptscript.yaml. */
  targetConfig?: import('@promptscript/core').TargetConfig;
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
  /** Base path for skills (e.g., '.claude/skills'), or null if no skill support */
  getSkillBasePath(): string | null;
  /** Skill file name (e.g., 'SKILL.md' or 'skill.md'), or null if no skill support */
  getSkillFileName(): string | null;
}

/**
 * Factory function type for creating formatter instances.
 */
export type FormatterFactory = () => Formatter;

/**
 * Version information for a single formatter version.
 */
export interface FormatterVersionInfo {
  /** Version identifier (e.g. 'simple', 'multifile', 'full') */
  readonly name: string;
  /** Human-readable description */
  readonly description: string;
  /** Default output file path for this version */
  readonly outputPath: string;
}

/**
 * Version configuration map returned by getSupportedVersions().
 * Maps version name to its configuration.
 */
export type FormatterVersionMap = Readonly<Record<string, FormatterVersionInfo>>;

/**
 * Static interface for formatter classes.
 *
 * Enforces that every formatter class provides a static `getSupportedVersions()`
 * method returning its version configuration. TypeScript cannot enforce static
 * methods via `implements`, so this type is used at registration time to
 * provide compile-time safety.
 *
 * @example
 * ```ts
 * // This will type-check:
 * FormatterRegistry.register('claude', ClaudeFormatter);
 *
 * // This will fail at compile time if MissingFormatter lacks getSupportedVersions():
 * FormatterRegistry.register('missing', MissingFormatter);
 * ```
 */
export interface FormatterClass {
  /** Create a new formatter instance */
  new (): Formatter;
  /** Return version configuration for this formatter */
  getSupportedVersions(): FormatterVersionMap;
}
