import type { PromptBundleV1 } from '@promptscript/core';
import type { DatasetRecord } from './dataset/read.js';

// Inputs after defaults, the values the cache key covers
export function effectiveInputs(
  bundle: PromptBundleV1,
  inputs: DatasetRecord['row']['inputs']
): Record<string, unknown> {
  const values: Record<string, unknown> = {};
  for (const [name, spec] of Object.entries(bundle.inputs)) {
    const value = Object.hasOwn(inputs, name) ? inputs[name] : spec.default;
    if (value !== undefined) values[name] = value;
  }
  return values;
}
