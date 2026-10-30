/** One priced model of a release, as `prs release build` writes it. */
export interface PromptReleasePricingModel {
  /**
   * Catalog profile id of the model.
   * @example "claude-sonnet-5-5"
   */
  ref: string;
  /**
   * Provider API model identifier, as the bundles carry it.
   * @example "claude-sonnet-5-5"
   */
  apiId: string;
  /**
   * Model provider.
   * @example "anthropic"
   */
  provider: string;
  /**
   * Price of one million input tokens in USD.
   * @minimum 0
   */
  inputUsdPerMillion: number;
  /**
   * Price of one million output tokens in USD.
   * @minimum 0
   */
  outputUsdPerMillion: number;
  /**
   * Date the price was checked against the provider, YYYY-MM-DD.
   * @pattern ^\d{4}-\d{2}-\d{2}$
   */
  checkedOn: string;
}

/**
 * List prices of the models that the bundles of a release use, version 1.
 * Outside every content hash: a price update never changes a bundle. The prices are
 * estimates, cache, batch and tier discounts are ignored.
 */
export interface PromptReleasePricingV1 {
  /**
   * Schema URL, the version tag of the file.
   * @example "https://getpromptscript.dev/schema/prompt-release-pricing/v1.json"
   */
  $schema: 'https://getpromptscript.dev/schema/prompt-release-pricing/v1.json';
  /** Priced models sorted by ref. Models without a known price are left out. */
  models: PromptReleasePricingModel[];
}
