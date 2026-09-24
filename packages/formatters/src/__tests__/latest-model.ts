import { getModelCatalog, type ModelProfile } from '@promptscript/core';

/**
 * Newest catalog release of a model family. Floating aliases follow it, so
 * specs read it from the catalog instead of pinning a release.
 */
export function latestModel(family: string): ModelProfile {
  const profile = getModelCatalog().getLatest(family);
  if (!profile) throw new Error(`No ${family} release in the model catalog`);
  return profile;
}
