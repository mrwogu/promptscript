import {
  compareCodeUnits,
  levenshteinDistance,
  type ModelCatalog,
  type ModelProfile,
  type PromptBundleModel,
  type PromptBundleV1,
} from '@promptscript/core';
import { EVAL_CODES, type EvalCode } from '../errors.js';

/** What suites are checked against. */
export interface CheckContext {
  /** Prompt bundles the project compiles */
  bundles: readonly PromptBundleV1[];
  /** Where judge rubrics are looked up; defaults to `bundles` */
  rubrics?: readonly PromptBundleV1[];
  /** Model catalog with the project's profiles */
  catalog: ModelCatalog;
}

/** Adds a finding of a suite; the message has no file prefix and no final period. */
export type Add = (code: EvalCode, message: string, severity?: 'error' | 'warning') => void;

export function nearestIds(id: string, bundles: readonly PromptBundleV1[]): string[] {
  // A suite can hold a huge prompt string; the distance matrix grows with it
  const probe = id.slice(0, 200);
  return bundles
    .map((bundle) => ({ id: bundle.id, distance: levenshteinDistance(probe, bundle.id) }))
    .sort((a, b) => a.distance - b.distance || compareCodeUnits(a.id, b.id))
    .slice(0, 5)
    .map((entry) => entry.id);
}

export function resolveModel(
  ref: string,
  catalog: ModelCatalog,
  add: Add
): ModelProfile | undefined {
  const resolution = catalog.resolve(ref);
  if (resolution === undefined || resolution.kind === 'inherit') {
    add(
      EVAL_CODES.MODEL_REF,
      `model "${ref}" is not in the model catalog; use a profile id, alias or API id, or add it under models.profiles in promptscript.yaml`
    );
    return undefined;
  }
  const { profile } = resolution;
  if (profile.status === 'retired' || profile.status === 'deprecated') {
    const replacement = catalog.getReplacement(profile.id);
    const advice = replacement === undefined ? '' : `; use ${replacement.id}`;
    add(
      EVAL_CODES.MODEL_REF,
      `model "${ref}" is ${profile.status}${advice}`,
      profile.status === 'retired' ? 'error' : 'warning'
    );
  }
  return profile;
}

export function ownProfile(
  model: PromptBundleModel,
  catalog: ModelCatalog
): ModelProfile | undefined {
  const resolution = catalog.resolve(model.profile ?? model.ref);
  return resolution === undefined || resolution.kind === 'inherit' ? undefined : resolution.profile;
}
