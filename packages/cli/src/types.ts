/**
 * Options for the init command.
 */
export interface InitOptions {
  /** Team namespace */
  team?: string;
  /** Project template to use */
  template?: string;
  /** Project name (overrides auto-detection) */
  name?: string;
  /** Inheritance path (e.g., @company/team) */
  inherit?: string;
  /** Registry path or URL */
  registry?: string;
  /** Target AI tools (github, claude, cursor) */
  targets?: string[];
  /** Interactive mode (prompts for all options) */
  interactive?: boolean;
  /** Skip prompts, use defaults */
  yes?: boolean;
  /** Force reinitialize even if already initialized */
  force?: boolean;
}

/**
 * Options for the compile command.
 */
export interface CompileOptions {
  /** Specific target to compile (github, claude, cursor) */
  target?: string;
  /** Compile all configured targets */
  all?: boolean;
  /** Watch mode for continuous compilation */
  watch?: boolean;
  /** Output directory */
  output?: string;
  /** Preview changes without writing files */
  dryRun?: boolean;
}

/**
 * Options for the validate command.
 */
export interface ValidateOptions {
  /** Treat warnings as errors */
  strict?: boolean;
  /** Auto-fix issues (future) */
  fix?: boolean;
}

/**
 * Options for the pull command.
 */
export interface PullOptions {
  /** Force overwrite local files */
  force?: boolean;
}

/**
 * Options for the diff command.
 */
export interface DiffOptions {
  /** Specific target to diff */
  target?: string;
}
