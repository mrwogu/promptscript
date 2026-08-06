import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  isExcludedCommand,
  isTelemetryOutcome,
  sanitizeCommand,
  sanitizeFeature,
  TELEMETRY_EVENT_SCHEMA,
} from './schema.js';

describe('telemetry schema', () => {
  it('matches versioned manifest checksum', () => {
    const manifestPath = fileURLToPath(
      new URL('../telemetry-schema/promptscript-v1.json', import.meta.url)
    );
    const checksumPath = fileURLToPath(
      new URL('../telemetry-schema/promptscript-v1.sha256', import.meta.url)
    );
    const manifest: unknown = JSON.parse(readFileSync(manifestPath, 'utf8'));
    const actual = createHash('sha256').update(JSON.stringify(manifest)).digest('hex');

    expect(actual).toBe(readFileSync(checksumPath, 'utf8').trim());
    expect(TELEMETRY_EVENT_SCHEMA).toBe(1);
  });

  it('sanitizes commands and features through fixed allowlists', () => {
    expect(sanitizeCommand('compile')).toBe('compile');
    expect(sanitizeCommand('private-command')).toBe('other');
    expect(sanitizeFeature('strict')).toBe('strict');
    expect(sanitizeFeature('target:claude')).toBe('target:claude');
    expect(sanitizeFeature('target:private')).toBeNull();
    expect(sanitizeFeature('path:/private/repo')).toBeNull();
  });

  it('recognizes outcomes and excluded commands', () => {
    expect(isTelemetryOutcome('cancelled')).toBe(true);
    expect(isTelemetryOutcome('timeout')).toBe(false);
    expect(isExcludedCommand('hook')).toBe(true);
    expect(isExcludedCommand('telemetry')).toBe(true);
    expect(isExcludedCommand('__telemetry-flush')).toBe(true);
    expect(isExcludedCommand('compile')).toBe(false);
  });
});
