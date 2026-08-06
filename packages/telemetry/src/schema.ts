import manifest from '../telemetry-schema/promptscript-v1.json' with { type: 'json' };
import type { TelemetryOutcome } from './types.js';

export const TELEMETRY_EVENT_SCHEMA = manifest.eventSchema as 1;
export const MAX_EVENTS_PER_BATCH = manifest.limits.maxEvents;
export const MAX_EVENT_COUNT = manifest.limits.maxCount;
export const MAX_DURATION_SUM_MS = manifest.limits.maxDurationSumMs;

const COMMANDS = new Set<string>(manifest.commands);
const OUTCOMES = new Set<string>(manifest.outcomes);
const FEATURES = new Set<string>(manifest.features);
const TARGETS = new Set<string>(manifest.targets);

export function sanitizeCommand(value: string): string {
  return COMMANDS.has(value) ? value : 'other';
}

export function isTelemetryOutcome(value: string): value is TelemetryOutcome {
  return OUTCOMES.has(value);
}

export function sanitizeFeature(value: string): string | null {
  if (FEATURES.has(value)) {
    return value;
  }
  const parts = value.split(':');
  const target = parts[1];
  if (parts.length === 2 && parts[0] === 'target' && target !== undefined && TARGETS.has(target)) {
    return value;
  }
  return null;
}

export function isExcludedCommand(value: string): boolean {
  return value === 'hook' || value === 'telemetry' || value === '__telemetry-flush';
}
