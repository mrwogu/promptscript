import type { ConventionName, OutputConvention } from './convention.js';
import type { PolicyDefinition } from './policy.js';
import type { PrettierMarkdownOptions } from './prettier.js';
import type { RegistriesConfig } from './registries.js';

/**
 * Formatting configuration for output files.
 * Controls how generated markdown is formatted.
 */
export interface FormattingConfig {
  /**
   * Enable Prettier formatting.
   * - `true`: Auto-detect .prettierrc in project
   * - `string`: Path to Prettier config file
   * - `PrettierMarkdownOptions`: Explicit options
   * @example
   * formatting:
   *   prettier: true  # Auto-detect
   *
   * formatting:
   *   prettier: "./config/.prettierrc"  # Explicit path
   *
   * formatting:
   *   proseWrap: always
   *   tabWidth: 4
   */
  prettier?: boolean | string | PrettierMarkdownOptions;

  /**
   * Explicit proseWrap setting (shorthand for prettier.proseWrap).
   */
  proseWrap?: PrettierMarkdownOptions['proseWrap'];

  /**
   * Explicit tabWidth setting (shorthand for prettier.tabWidth).
   */
  tabWidth?: PrettierMarkdownOptions['tabWidth'];

  /**
   * Explicit printWidth setting (shorthand for prettier.printWidth).
   */
  printWidth?: PrettierMarkdownOptions['printWidth'];
}

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
 * Factory always-on rules output mode.
 * - `monolith`: Keep all rule content in AGENTS.md
 * - `split`: Emit rule content under .factory/rules
 */
export type FactoryRulesMode = 'monolith' | 'split';

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

  /**
   * Factory always-on rules output mode.
   * Split mode requires Factory's `multifile` or `full` version.
   * @default 'monolith'
   */
  rulesMode?: FactoryRulesMode;

  /** Generate skills from @guards named entries (Factory). @default true */
  guardsAsSkills?: boolean;

  /** List generated guard skills in main output file (Factory). @default true */
  guardsSkillsListing?: boolean;

  /**
   * Custom base directory for generated skill files.
   * When set, skill files are emitted under this directory instead of the
   * target's native skill directory (for example `.factory/skills`).
   */
  skillBaseDir?: string;

  /**
   * Controls which skills are emitted for this target.
   * - `true` or omitted: emit all skills
   * - `false`: emit no skills
   * - string array: emit only the listed skill names
   */
  includeSkills?: boolean | string[];

  /**
   * Gemini skill path selection.
   * - `agents`: use `.agents/skills/` (interoperable, fixture-confirmed default)
   * - `gemini`: use `.gemini/skills/` (legacy)
   * - `both`: emit to both paths (requires explicit opt-in, deduplicates content)
   * @default 'agents'
   */
  skillPath?: 'agents' | 'gemini' | 'both';

  /**
   * Codex: maximum number of parallel agent threads.
   * Positive integer. Maps to Codex config, never to AGENTS.md.
   */
  maxThreads?: number;

  /**
   * Codex: maximum nesting depth for agent delegation.
   * Positive integer. Maps to Codex config, never to AGENTS.md.
   */
  maxDepth?: number;

  /**
   * Codex: override the agents file name for scoped build profiles.
   * Defaults to `AGENTS.md`. Use `AGENTS.override.md` only for scoped builds.
   */
  agentsFile?: string;
}

/**
 * Target can be a simple string name or a full configuration object.
 */
export type TargetEntry = TargetName | { [key in TargetName]?: TargetConfig };

/**
 * Named build profile for compiling a specific entry point to specific outputs.
 */
export interface BuildProfileConfig {
  /** Entry file path for this build profile */
  entry?: string;
  /** Output directory for this build profile */
  output?: string;
  /** Target list for this build profile */
  targets?: TargetEntry[];
}

/**
 * PromptScript configuration file (promptscript.yaml).
 */
export interface PromptScriptConfig {
  /** Project identifier */
  id: string;

  /** PromptScript syntax version */
  syntax: string;

  /** Project description */
  description?: string;

  /**
   * Extend another configuration file.
   * Paths are resolved relative to the current config file.
   * @example extends: '../base-config.yaml'
   */
  extends?: string;

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
  registry?: {
    /** Local path to registry */
    path?: string;
    /** Remote URL (HTTP registry) */
    url?: string;
    /**
     * Git repository configuration.
     * When specified, the registry will be cloned from a Git repository.
     */
    git?: {
      /** Git repository URL (HTTPS or SSH) */
      url: string;
      /**
       * Fallback Git URL to try when the primary `url` fails with an auth error.
       * Useful when the registry references an HTTPS URL but the user authenticates
       * via SSH (or vice versa).
       *
       * @example
       * registry:
       *   git:
       *     url: 'https://github.com/org/registry.git'
       *     fallbackUrl: 'git@github.com:org/registry.git'
       */
      fallbackUrl?: string;
      /**
       * Git ref to checkout (branch, tag, or commit hash).
       * @default 'main'
       */
      ref?: string;
      /**
       * Subdirectory within the repository to use as registry root.
       * @example 'registry/'
       */
      path?: string;
      /** Authentication options for private repositories */
      auth?: {
        /**
         * Authentication type.
         * - 'token': Use a personal access token (PAT)
         * - 'ssh': Use SSH key authentication
         */
        type: 'token' | 'ssh';
        /** Personal access token (for token auth) */
        token?: string;
        /** Environment variable containing the token */
        tokenEnvVar?: string;
        /**
         * Path to SSH key (for SSH auth).
         * @default '~/.ssh/id_rsa'
         */
        sshKeyPath?: string;
      };
    };
    /** Cache settings */
    cache?: {
      /** Whether caching is enabled */
      enabled?: boolean;
      /** Cache TTL in milliseconds */
      ttl?: number;
    };
    /** Authentication for HTTP registries */
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
   * Named registry aliases for multi-source imports.
   * Maps alias names to Git repository URLs.
   * Coexists with `registry` — aliases take precedence for matching paths.
   */
  registries?: RegistriesConfig;

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
   * Named per-command build profiles.
   * Profiles let one repository build multiple instruction artifacts to
   * different target directories without changing the default project compile.
   */
  builds?: Record<string, BuildProfileConfig>;

  /**
   * Per-source output directories for `@use` imports.
   *
   * Maps a `@use` source string (matching the path's `raw` value) to a
   * relative directory underneath each target's skill output location.
   * An inline `into "<path>"` on the same `@use` declaration overrides
   * the configured value.
   *
   * @example
   * skillTargets:
   *   "github.com/coreyhaines31/marketingskills/skills/seo-audit": "skills/seo-audit"
   */
  skillTargets?: Record<string, string>;

  /**
   * Formatting configuration.
   * Controls how generated markdown files are formatted.
   * @example
   * formatting:
   *   prettier: true  # Auto-detect .prettierrc
   *
   * formatting:
   *   tabWidth: 4
   *   proseWrap: always
   */
  formatting?: FormattingConfig;

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

  /**
   * Universal directory for auto-discovering skills and commands.
   * Skills are discovered from `<universalDir>/skills/` and commands from `<universalDir>/commands/`.
   *
   * - `true` or omitted: Use default `.agents/` directory
   * - `false`: Disable universal directory discovery
   * - `string`: Custom path (relative to project root)
   *
   * @default '.agents'
   * @example
   * universalDir: true           # Use .agents/ (default)
   * universalDir: '.my-agents'   # Custom directory
   * universalDir: false          # Disable
   */
  universalDir?: string | boolean;

  /**
   * Include the bundled PromptScript language skill in compilation output.
   * When enabled, the SKILL.md that teaches AI agents how to work with .prs files
   * is automatically added to each target's native skill directory.
   * @default true
   */
  includePromptScriptSkill?: boolean;

  /** Validation settings */
  validation?: {
    requiredGuards?: string[];
    rules?: Record<string, 'error' | 'warning' | 'off'>;
    /**
     * Maximum depth for recursive guard requires resolution. Default: 3.
     * Must be >= 1. Values <= 0 are clamped to 1 by the resolver.
     */
    guardRequiresDepth?: number;
  };

  /** Extension compliance policies */
  policies?: PolicyDefinition[];
}

/**
 * User-level configuration stored at ~/.promptscript/config.yaml.
 * Provides defaults that can be overridden by project config, env vars, or CLI flags.
 */
export interface UserConfig {
  version: '1';
  registry?: {
    git?: {
      url: string;
      fallbackUrl?: string;
      ref?: string;
      path?: string;
      auth?: {
        type: 'token' | 'ssh';
        tokenEnvVar?: string;
        sshKeyPath?: string;
      };
    };
    url?: string;
    cache?: {
      enabled?: boolean;
      ttl?: number;
    };
  };
  registries?: RegistriesConfig;
  defaults?: {
    targets?: string[];
    team?: string;
  };
}

/**
 * Known built-in output targets.
 * These are the targets with first-class formatter support.
 */
export type KnownTarget =
  // Original 7
  | 'github'
  | 'claude'
  | 'cursor'
  | 'antigravity'
  | 'factory'
  | 'opencode'
  | 'gemini'
  // Tier 1
  | 'windsurf'
  | 'cline'
  | 'roo'
  | 'codex'
  | 'continue'
  // Tier 2
  | 'augment'
  | 'goose'
  | 'kilo'
  | 'amp'
  | 'trae'
  | 'junie'
  | 'kiro'
  // Tier 3
  | 'cortex'
  | 'crush'
  | 'command-code'
  | 'kode'
  | 'mcpjam'
  | 'mistral-vibe'
  | 'mux'
  | 'openhands'
  | 'pi'
  | 'qoder'
  | 'qwen-code'
  | 'zencoder'
  | 'neovate'
  | 'pochi'
  | 'adal'
  | 'iflow'
  | 'openclaw'
  | 'codebuddy'
  // AGENTS.md-only targets
  | 'aider'
  | 'amazon-q'
  | 'warp'
  | 'zed'
  | 'jules'
  | 'devin'
  // Grok Build
  | 'grok';

/**
 * Branded type for custom (user-registered) target names.
 * Use `customTarget()` to create values of this type.
 */
export type CustomTarget = string & { readonly __brand?: 'CustomTarget' };

/**
 * Supported output targets.
 * Includes all known built-in targets plus custom targets registered via `registerFormatter`.
 *
 * - Use `KnownTarget` when you need exhaustiveness checks in switch/if-else.
 * - Use `TargetName` when you need to accept both known and custom targets.
 * - Use `isKnownTarget()` to narrow a `TargetName` to `KnownTarget` at runtime.
 * - Use `customTarget()` to create a `CustomTarget` from a plain string.
 */
export type TargetName = KnownTarget | CustomTarget;

/**
 * Runtime array of all known target names.
 * Useful for validation and iteration.
 */
export const KNOWN_TARGETS: readonly KnownTarget[] = [
  // Original 7
  'github',
  'claude',
  'cursor',
  'antigravity',
  'factory',
  'opencode',
  'gemini',
  // Tier 1
  'windsurf',
  'cline',
  'roo',
  'codex',
  'continue',
  // Tier 2
  'augment',
  'goose',
  'kilo',
  'amp',
  'trae',
  'junie',
  'kiro',
  // Tier 3
  'cortex',
  'crush',
  'command-code',
  'kode',
  'mcpjam',
  'mistral-vibe',
  'mux',
  'openhands',
  'pi',
  'qoder',
  'qwen-code',
  'zencoder',
  'neovate',
  'pochi',
  'adal',
  'iflow',
  'openclaw',
  'codebuddy',
  // AGENTS.md-only targets
  'aider',
  'amazon-q',
  'warp',
  'zed',
  'jules',
  'devin',
  // Grok Build
  'grok',
] as const;

/**
 * Type guard to check if a target name is a known built-in target.
 * Useful for narrowing `TargetName` to `KnownTarget` in switch statements
 * and enabling exhaustiveness checks.
 *
 * @param name - The target name to check
 * @returns True if the name is a known built-in target
 */
export function isKnownTarget(name: string): name is KnownTarget {
  return (KNOWN_TARGETS as readonly string[]).includes(name);
}

/**
 * Create a `CustomTarget` value from a plain string.
 * Use this when registering custom formatters to get proper typing.
 *
 * @param name - The custom target name
 * @returns The name typed as `CustomTarget`
 */
export function customTarget(name: string): CustomTarget {
  return name as CustomTarget;
}

/**
 * Default output paths for each target.
 */
export const DEFAULT_OUTPUT_PATHS: Record<string, string> = {
  // Original 7
  github: '.github/copilot-instructions.md',
  claude: 'CLAUDE.md',
  cursor: '.cursor/rules/project.mdc',
  antigravity: '.agent/rules/project.md',
  factory: 'AGENTS.md',
  opencode: 'OPENCODE.md',
  gemini: 'GEMINI.md',
  // Tier 1
  windsurf: '.windsurf/rules/project.md',
  cline: '.clinerules',
  roo: '.roorules',
  codex: 'AGENTS.md',
  continue: '.continue/rules/project.md',
  // Tier 2
  augment: '.augment/rules/project.md',
  goose: '.goosehints',
  kilo: '.kilocode/rules/project.md',
  amp: 'AGENTS.md',
  trae: '.trae/rules/project_rules.md',
  junie: '.junie/guidelines.md',
  kiro: '.kiro/steering/project.md',
  // Tier 3
  cortex: '.cortex/rules/project.md',
  crush: 'AGENTS.md',
  'command-code': '.commandcode/rules/project.md',
  kode: '.kode/rules/project.md',
  mcpjam: '.mcpjam/rules/project.md',
  'mistral-vibe': '.vibe/rules/project.md',
  mux: '.mux/rules/project.md',
  openhands: '.openhands/rules/project.md',
  pi: '.pi/rules/project.md',
  qoder: '.qoder/rules/project.md',
  'qwen-code': '.qwen/rules/project.md',
  zencoder: '.zencoder/rules/project.md',
  neovate: '.neovate/rules/project.md',
  pochi: '.pochi/rules/project.md',
  adal: '.adal/rules/project.md',
  iflow: '.iflow/rules/project.md',
  openclaw: 'INSTRUCTIONS.md',
  codebuddy: '.codebuddy/rules/project.md',
  // AGENTS.md-only targets
  aider: 'AGENTS.md',
  'amazon-q': 'AGENTS.md',
  warp: 'AGENTS.md',
  zed: 'AGENTS.md',
  jules: 'AGENTS.md',
  devin: 'AGENTS.md',
  grok: 'AGENTS.md',
};
