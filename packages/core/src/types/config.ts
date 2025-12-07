import type { ConventionName, OutputConvention } from './convention';

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

  /** Project identification */
  project: {
    id: string;
    team?: string;
  };

  /** Inheritance path */
  inherit?: string;

  /** Registry configuration */
  registry: {
    /** Local path to registry */
    path?: string;
    /** Remote URL */
    url?: string;
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
  cursor: '.cursorrules',
  gemini: '.gemini/config.md',
  jetbrains: '.junie/guidelines.md',
};
