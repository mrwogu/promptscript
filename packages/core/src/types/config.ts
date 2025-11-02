/**
 * PromptScript configuration file (promptscript.config.yaml).
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

  /** Output targets */
  targets: TargetName[];

  /** Custom output paths */
  output?: Partial<Record<TargetName, string>>;

  /** Validation settings */
  validation?: {
    requiredGuards?: string[];
    rules?: Record<string, 'error' | 'warning' | 'off'>;
  };
}

/**
 * Supported output targets.
 */
export type TargetName =
  | 'github'
  | 'claude'
  | 'cursor'
  | 'gemini'
  | 'jetbrains'
  | string;

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
