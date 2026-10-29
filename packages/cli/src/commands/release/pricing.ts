import {
  compareCodeUnits,
  getModelCatalog,
  type ModelsConfig,
  type PromptBundleV1,
  type PromptReleasePricingModel,
  type PromptReleasePricingV1,
} from '@promptscript/core';
import type { ReleaseDiagnostic } from '../../utils/release-report.js';
import { PROMPT_RELEASE_PRICING_SCHEMA_URL } from './layout.js';

export interface BuiltPricing {
  pricing: PromptReleasePricingV1;
  warnings: ReleaseDiagnostic[];
}

/**
 * Prices of the models that the bundles use, from the effective catalog (built-in
 * profiles plus `models.profiles`). A model without a price is left out. The result
 * depends on nothing but the bundles and the catalog, so a second build gives the same bytes.
 * When two profiles share a provider and API id, the lowest profile id wins, so the choice
 * does not depend on the order of the bundles.
 */
export function buildPricing(
  bundles: readonly PromptBundleV1[],
  models: ModelsConfig | undefined
): BuiltPricing {
  const catalog = getModelCatalog(models);
  const warnings: ReleaseDiagnostic[] = [];
  // A pair warns once, however many bundles carry it.
  const warned = new Set<string>();
  const priced = new Map<string, PromptReleasePricingModel>();
  for (const bundle of bundles) {
    const model = bundle.model;
    if (model?.profile === undefined) continue;
    const profile = catalog.getProfile(model.profile);
    if (profile?.pricing === undefined) continue;
    const entry: PromptReleasePricingModel = {
      ref: profile.id,
      apiId: model.apiId,
      provider: model.provider,
      inputUsdPerMillion: profile.pricing.inputUsdPerMillion,
      outputUsdPerMillion: profile.pricing.outputUsdPerMillion,
      checkedOn: profile.pricing.checkedOn,
    };
    // The runtime looks a price up by provider and API id, as the bundle carries them.
    const key = `${model.provider}\u0000${model.apiId}`;
    const current = priced.get(key);
    if (current === undefined) {
      priced.set(key, entry);
      continue;
    }
    if (current.ref === entry.ref) continue;
    const [winner, loser] =
      compareCodeUnits(current.ref, entry.ref) <= 0 ? [current, entry] : [entry, current];
    const pair = `${key}\u0000${winner.ref}\u0000${loser.ref}`;
    if (
      !warned.has(pair) &&
      (winner.inputUsdPerMillion !== loser.inputUsdPerMillion ||
        winner.outputUsdPerMillion !== loser.outputUsdPerMillion)
    ) {
      warned.add(pair);
      warnings.push({
        message: `Profiles ${winner.ref} and ${loser.ref} both map to ${model.provider} ${model.apiId} with different prices. pricing.json uses ${winner.ref}.`,
      });
    }
    priced.set(key, winner);
  }
  const sorted = [...priced.values()].sort(
    (a, b) =>
      compareCodeUnits(a.ref, b.ref) ||
      compareCodeUnits(a.provider, b.provider) ||
      compareCodeUnits(a.apiId, b.apiId)
  );
  return { pricing: { $schema: PROMPT_RELEASE_PRICING_SCHEMA_URL, models: sorted }, warnings };
}
