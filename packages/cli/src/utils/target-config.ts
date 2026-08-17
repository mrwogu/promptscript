import type { TargetConfig } from '@promptscript/core';

export interface ParsedTarget {
  name: string;
  config?: TargetConfig;
}

export function isTargetConfig(value: unknown): value is TargetConfig {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function parseTargetEntries(targets: unknown): ParsedTarget[] {
  if (!Array.isArray(targets)) {
    if (targets === undefined) {
      return [];
    }
    throw new Error('Compilation targets must be an array');
  }

  return targets
    .flatMap<ParsedTarget>((entry): ParsedTarget[] => {
      if (typeof entry === 'string' && entry.trim().length > 0) {
        return [{ name: entry }];
      }
      if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
        throw new Error('Target entries must be non-empty names or configuration objects');
      }

      const entries = Object.entries(entry);
      if (entries.length === 0) {
        throw new Error('Empty target configuration');
      }

      return entries.map(([name, config]) => {
        if (!isTargetConfig(config)) {
          throw new Error(`Target "${name}" configuration must be an object`);
        }
        return { name, config };
      });
    })
    .filter((target) => target.config?.enabled !== false);
}
