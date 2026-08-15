import type {
  CanonicalProgram,
  OutputConvention,
  PrettierMarkdownOptions,
  Program,
  SourceLocation,
} from '@promptscript/core';
import type { StructuredMergePlan } from './structured-output.js';

export interface FormatterWarning {
  /** Stable warning code */
  code: string;
  /** Actionable compatibility message */
  message: string;
  /** Optional remediation */
  suggestion?: string;
  /** Source location that caused the compatibility warning */
  location?: SourceLocation;
}

/**
 * Output from a formatter.
 */
export interface FormatterOutput {
  /** Output file path (relative to project root) */
  path: string;
  /** Formatted content */
  content: string;
  /** File mode (e.g. 0o755 for executable scripts) */
  mode?: number;
  /** Structured merge plan for JSON/TOML settings files */
  merge?: StructuredMergePlan;
  /** Target compatibility warnings produced during formatting */
  warnings?: FormatterWarning[];
  /** Additional files to generate (e.g., workflows) */
  additionalFiles?: FormatterOutput[];
  /**
   * Relative directories exclusively managed by this output.
   * Writers may remove obsolete PromptScript-generated files within these
   * directories, but must preserve unmarked files and symlinks.
   */
  managedOutputDirectories?: string[];
  /**
   * Relative files exclusively managed by this output.
   * Writers may remove an obsolete file only when it carries a PromptScript
   * ownership marker.
   */
  managedOutputFiles?: string[];
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
  /** Transform AST to target format */
  format(ast: Program, options?: FormatOptions): FormatterOutput;
  /**
   * Optional canonical entry point.
   *
   * Implementations that do not provide this method are legacy formatters.
   * The formatter adapter creates a detached compatibility projection before
   * invoking their `format` method.
   */
  formatCanonical?(ast: CanonicalProgram, options?: FormatOptions): FormatterOutput;
  /** Base path for skills (e.g., '.claude/skills'), or null if no skill support */
  getSkillBasePath(): string | null;
  /** Skill file name (e.g., 'SKILL.md' or 'skill.md'), or null if no skill support */
  getSkillFileName(): string | null;
  /** How this formatter handles skill references: 'directory', 'inline', or 'none' */
  referencesMode(): 'directory' | 'inline' | 'none';
  /**
   * Transform the raw content of a pass-through skill file (e.g. the bundled
   * PromptScript SKILL.md injected by the compiler) before it is written to
   * disk. Formatters whose target tools enforce frontmatter schemas (such as
   * Factory AI) can override this to strip unsupported fields.
   *
   * Defaults to identity when not implemented.
   */
  transformInjectedSkillContent?(content: string): string;
}

/**
 * Explicit legacy formatter contract.
 *
 * Legacy formatters consume the mutable `Program` compatibility AST.
 */
export type LegacyFormatter = Omit<Formatter, 'formatCanonical'>;

/**
 * Formatter contract for implementations that consume the immutable AST.
 */
export interface CanonicalFormatter extends Formatter {
  formatCanonical(ast: CanonicalProgram, options?: FormatOptions): FormatterOutput;
}

/**
 * Configuration for a single generated skill file.
 */
export interface SkillFileConfig {
  /** Skill name */
  name: string;
  /** Description */
  description: string;
  /** Optional argument hint */
  argumentHint?: string;
  /** Skill content/instructions */
  content: string;
  /** Resource files to copy alongside the skill file */
  resources?: Array<{
    relativePath: string;
    content: string;
    origin?: string;
    executable?: boolean;
  }>;
  /** Raw frontmatter from source SKILL.md for pass-through */
  rawFrontmatter?: string;
  /** License identifier from SKILL.md frontmatter */
  license?: string;
  /** Pre-extracted examples from the skill's nested examples property */
  examples?: Array<{ name: string; input: string; output: string; description?: string }>;
  /**
   * Relative output directory underneath the target's skill folder.
   * Overrides the default `<skillBasePath>/<name>` layout when provided.
   */
  outputDir?: string;
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
