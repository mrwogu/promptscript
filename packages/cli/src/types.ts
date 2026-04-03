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
  /** Install migration skill for AI-assisted migration */
  migrate?: boolean;
  /** Non-interactive static import of detected files (--auto-import) */
  autoImport?: boolean;
  /** Create backup before migration */
  backup?: boolean;
  /** Internal: force migrate flow (used by prs migrate) */
  _forceMigrate?: boolean;
  /** Internal: force LLM flow (used by prs migrate --llm) */
  _forceLlm?: boolean;
  /** Internal: specific files to migrate (used by prs migrate --files) */
  _migrateFiles?: string[];
}

/**
 * Options for the migrate command.
 */
export interface MigrateOptions {
  static?: boolean;
  llm?: boolean;
  files?: string[];
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
  /** Treat output path conflicts as errors */
  strict?: boolean;
  /** Working directory (project root) */
  cwd?: string;
}

/**
 * Options for the validate command.
 */
export interface ValidateOptions {
  /** Treat warnings as errors */
  strict?: boolean;
  /** Output format (text, json) */
  format?: 'text' | 'json';
  /** Auto-fix syntax version issues */
  fix?: boolean;
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
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface CheckOptions {}

/**
 * Options for the registry init command.
 */
export interface RegistryInitOptions {
  /** Registry name */
  name?: string;
  /** Registry description */
  description?: string;
  /** Namespace names to create */
  namespaces?: string[];
  /** Skip prompts, use defaults */
  yes?: boolean;
  /** Output directory */
  output?: string;
  /** Whether to seed with starter configs (default true) */
  seed?: boolean;
}

/**
 * Options for the registry validate command.
 */
export interface RegistryValidateOptions {
  /** Treat warnings as errors */
  strict?: boolean;
  /** Output format */
  format?: 'text' | 'json';
}

/**
 * Options for the registry publish command.
 */
export interface RegistryPublishOptions {
  /** Preview what would be published */
  dryRun?: boolean;
  /** Skip validation */
  force?: boolean;
  /** Git commit message */
  message?: string;
  /** Git tag for release */
  tag?: string;
}

/**
 * Options for the registry add command.
 */
export interface RegistryAddOptions {
  /** Add to global user config instead of project config */
  global?: boolean;
}

/**
 * Options for the lock command.
 */
export interface LockOptions {
  /** Preview without writing lockfile */
  dryRun?: boolean;
}

/**
 * Options for the update command.
 */
export interface UpdateOptions {
  /** Preview without writing lockfile */
  dryRun?: boolean;
}

/**
 * Options for the vendor sync command.
 */
export interface VendorSyncOptions {
  /** Preview without copying files */
  dryRun?: boolean;
}

/**
 * Options for the vendor check command.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface VendorCheckOptions {}

/**
 * Options for the resolve command.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ResolveCommandOptions {}

/**
 * Options for the hook command.
 */
export interface HookOptions {
  action: 'pre-edit' | 'post-edit';
}

/**
 * Options for the hooks install/uninstall command.
 */
export interface HooksOptions {
  /** Install/uninstall for all detected tools */
  all?: boolean;
}

/**
 * Options for the skills add subcommand.
 */
export interface SkillsAddOptions {
  /** Target .prs file to modify */
  file?: string;
  /** Preview changes without writing */
  dryRun?: boolean;
}

/**
 * Options for the skills remove subcommand.
 */
export interface SkillsRemoveOptions {
  /** Preview changes without writing */
  dryRun?: boolean;
}

/**
 * Options for the skills update subcommand.
 */
export interface SkillsUpdateOptions {
  /** Preview changes without writing */
  dryRun?: boolean;
}

/**
 * Options for the inspect command.
 */
export interface InspectOptions {
  /** Show layer-level view instead of property-level */
  layers?: boolean;
  /** Output format */
  format?: 'text' | 'json';
  /** Path to custom config file */
  config?: string;
  /** Working directory (project root) */
  cwd?: string;
}
