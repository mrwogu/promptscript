/**
 * Lifecycle status of a model profile.
 * - `current`: recommended for new instructions
 * - `legacy`: still served, but superseded by a newer version
 * - `deprecated`: the provider announced a retirement date
 * - `retired`: the provider no longer serves the model
 */
export type ModelStatus = 'current' | 'legacy' | 'deprecated' | 'retired';

/**
 * Model profile declared in promptscript.yaml.
 *
 * A key of `models.profiles` that matches a built-in profile id overrides only
 * the fields it sets. Any other key adds a new profile, so a team can use a
 * model before PromptScript ships it in the built-in catalog.
 *
 * @example
 * models:
 *   profiles:
 *     claude-opus-9:
 *       provider: anthropic
 *       family: claude-opus
 *       version: '9'
 *       displayName: Claude Opus 9
 *       apiId: claude-opus-9
 *       releaseDate: '2027-01-15'
 */
export interface ModelProfileInput {
  /** Model provider (e.g. 'anthropic', 'openai', 'google', 'xai') */
  provider?: string;
  /**
   * Family grouping the versions of one model line (e.g. 'claude-opus').
   * The newest non-retired release of a family backs its floating alias.
   */
  family?: string;
  /** Version inside the family (e.g. '4.5') */
  version?: string;
  /** Human-readable name (e.g. 'Claude Opus 4.5') */
  displayName?: string;
  /** Provider API model identifier */
  apiId?: string;
  /** Additional names that resolve to this profile */
  aliases?: string[];
  /** Lifecycle status */
  status?: ModelStatus;
  /** Profile id of the recommended replacement */
  successor?: string;
  /** Release date in YYYY-MM-DD format */
  releaseDate?: string;
  /** Date the provider stops (or stopped) serving the model, in YYYY-MM-DD format */
  retirementDate?: string;
  /**
   * Native model names per target. A target listed here always receives this
   * name, even when its naming scheme or provider list would not map the model.
   * Keys are target names, matched case-insensitively. Only targets that write
   * a native model field use them; validation reports other keys.
   * @example
   * targets:
   *   github: Claude Opus 9 (Preview)
   */
  targets?: Record<string, string>;
}

/**
 * A model profile in the resolved catalog.
 */
export interface ModelProfile {
  /** Profile id, the provider's canonical model name (e.g. 'claude-opus-5-5') */
  readonly id: string;
  /** Model provider (e.g. 'anthropic', 'openai', 'google', 'xai') */
  readonly provider: string;
  /** Family grouping the versions of one model line (e.g. 'claude-opus') */
  readonly family: string;
  /** Version inside the family (e.g. '5.5') */
  readonly version: string;
  /** Human-readable name (e.g. 'Claude Opus 5.5') */
  readonly displayName: string;
  /** Provider API model identifier, the pinned snapshot when one exists */
  readonly apiId: string;
  /** Additional names that resolve to this profile */
  readonly aliases: readonly string[];
  /** Lifecycle status */
  readonly status: ModelStatus;
  /** Profile id of the recommended replacement */
  readonly successor?: string;
  /** Release date in YYYY-MM-DD format */
  readonly releaseDate?: string;
  /** Date the provider stops (or stopped) serving the model, in YYYY-MM-DD format */
  readonly retirementDate?: string;
  /** Native model names per target, overriding the target naming scheme */
  readonly targets: Readonly<Record<string, string>>;
}

/**
 * Model catalog configuration (`models` in promptscript.yaml).
 */
export interface ModelsConfig {
  /**
   * Model set the instructions are written and tested for.
   * Entries are profile ids, aliases, or provider model identifiers.
   * Validation reports agents and skills pinned outside this set.
   * @example ['claude-opus-5-5', 'gpt-6-sol']
   */
  supported?: string[];

  /**
   * Custom model profiles, or overrides of built-in profiles, keyed by profile id.
   */
  profiles?: Record<string, ModelProfileInput>;
}
