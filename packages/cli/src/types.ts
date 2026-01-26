/**
 * Options for the init command.
 */
export interface InitOptions {
  /** Team namespace */
  team?: string;
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
  /** Output format (github, claude, cursor) - alias for target */
  format?: string;
  /** Compile all configured targets */
  all?: boolean;
  /** Watch mode for continuous compilation */
  watch?: boolean;
  /** Output directory */
  output?: string;
  /** Preview changes without writing files */
  dryRun?: boolean;
  /** Registry path or URL (overrides config) */
  registry?: string;
  /** Path to custom config file */
  config?: string;
  /** Force overwrite existing files without prompts */
  force?: boolean;
}

/**
 * Options for the validate command.
 */
export interface ValidateOptions {
  /** Treat warnings as errors */
  strict?: boolean;
  /** Output format (text, json) */
  format?: 'text' | 'json';
}

/**
 * Options for the pull command.
 */
export interface PullOptions {
  /** Force overwrite local files */
  force?: boolean;
  /** Preview changes without pulling */
  dryRun?: boolean;
  /** Git branch to pull from */
  branch?: string;
  /** Git tag to pull from */
  tag?: string;
  /** Git commit hash to pull from */
  commit?: string;
  /** Force refresh/re-fetch from remote registry */
  refresh?: boolean;
}

/**
 * Options for the diff command.
 */
export interface DiffOptions {
  /** Specific target to diff */
  target?: string;
  /** Show diff for all targets at once */
  all?: boolean;
  /** Show full diff without truncation */
  full?: boolean;
  /** Disable pager (like git --no-pager) */
  noPager?: boolean;
  /** Force colored output */
  color?: boolean;
}

/**
 * Options for the check command.
 */
export interface CheckOptions {
  /** Attempt to fix issues automatically */
  fix?: boolean;
}
