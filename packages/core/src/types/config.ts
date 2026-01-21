import type { ConventionName, OutputConvention } from './convention.js';

/**
 * GitHub Copilot output format versions.
 * - `simple`: Single file output (.github/copilot-instructions.md)
 * - `multifile`: Main + path-specific instructions + prompts
 * - `full`: Multifile + skills + AGENTS.md
 */
export type GithubVersion = 'simple' | 'multifile' | 'full';

/**
 * Claude Code output format versions.
 * - `simple`: Single file output (CLAUDE.md)
 * - `multifile`: Main + modular rules (.claude/rules/*.md)
 * - `full`: Multifile + skills + local memory
 */
export type ClaudeVersion = 'simple' | 'multifile' | 'full';

/**
 * Configuration for a single target.
 */
export interface TargetConfig {
  /**
   * Whether this target is enabled.
   * @default true
   */
  enabled?: boolean;

  /**
   * Custom output path for this target.
   */
  output?: string;

  /**
   * Output convention ('xml', 'markdown', or custom name).
   */
  convention?: ConventionName;

  /**
   * Target version or format variant.
   * Use 'legacy' for deprecated formats (e.g., Cursor's .cursorrules).
   * @example 'legacy' | '1.0' | '2.0'
   */
  version?: string;
}

/**
 * Target can be a simple string name or a full configuration object.
 */
export type TargetEntry = TargetName | { [key in TargetName]?: TargetConfig };

/**
 * PromptScript configuration file (promptscript.yaml).
 */
export interface PromptScriptConfig {
  /** Config version */
  version: '1';

  /**
   * Extend another configuration file.
   * Paths are resolved relative to the current config file.
   * @example extends: '../base-config.yaml'
   */
  extends?: string;

  /** Project identification */
  project: {
    id: string;
    team?: string;
  };

  /** Inheritance path */
  inherit?: string;

  /**
   * Input file configuration.
   * Controls which PromptScript files to compile.
   */
  input?: {
    /** Entry file path (defaults to '.promptscript/project.prs') */
    entry?: string;
    /** Glob patterns for additional files to include */
    include?: string[];
    /** Glob patterns for files to exclude */
    exclude?: string[];
  };

  /** Registry configuration */
  registry: {
    /** Local path to registry */
    path?: string;
    /** Remote URL */
    url?: string;
    /** Cache settings */
    cache?: {
      /** Whether caching is enabled */
      enabled?: boolean;
      /** Cache TTL in milliseconds */
      ttl?: number;
    };
    /** Authentication for private registries */
    auth?: {
      /** Authentication type */
      type: 'bearer' | 'basic';
      /** Token for bearer auth, or "username:password" for basic auth */
      token?: string;
      /** Environment variable containing the token (alternative to token) */
      tokenEnvVar?: string;
    };
  };

  /**
   * Watch mode configuration.
   * Settings for `prs compile --watch`.
   */
  watch?: {
    /** Glob patterns for files to watch (defaults to '**\/*.prs') */
    include?: string[];
    /** Glob patterns for files to ignore */
    exclude?: string[];
    /** Debounce time in milliseconds before recompiling */
    debounce?: number;
    /** Clear screen before each recompilation */
    clearScreen?: boolean;
  };

  /**
   * Output configuration.
   * Global output settings applied to all targets.
   */
  output?: {
    /** Base directory for all output files */
    baseDir?: string;
    /** Custom header to prepend to generated files */
    header?: string;
    /** Whether to overwrite existing files without warning */
    overwrite?: boolean;
  };

  /**
   * Output targets.
   *
   * Can be simple names or objects with configuration:
   * @example
   * targets:
   *   - github
   *   - claude:
   *       convention: markdown
   *       output: custom/CLAUDE.md
   */
  targets: TargetEntry[];

  /**
   * Custom convention definitions.
   * Register custom conventions that can be referenced by name in targets.
   */
  customConventions?: Record<string, OutputConvention>;

  /** Validation settings */
  validation?: {
    requiredGuards?: string[];
    rules?: Record<string, 'error' | 'warning' | 'off'>;
  };
}

/**
 * Supported output targets.q
 */
export type TargetName = 'github' | 'claude' | 'cursor' | 'gemini' | 'jetbrains' | string;

/**
 * Default output paths for each target.
 */
export const DEFAULT_OUTPUT_PATHS: Record<string, string> = {
  github: '.github/copilot-instructions.md',
  claude: 'CLAUDE.md',
  cursor: '.cursor/rules/project.mdc',
  gemini: '.gemini/config.md',
  jetbrains: '.junie/guidelines.md',
};
