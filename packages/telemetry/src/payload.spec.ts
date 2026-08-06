import { describe, expect, it } from 'vitest';
import { buildTelemetryBatches } from './payload.js';
import type { SpoolRecord, TelemetryEvent } from './types.js';

function record(event: TelemetryEvent, overrides: Partial<SpoolRecord> = {}): SpoolRecord {
  return {
    app_version: '1.16.0',
    runtime_version: '24',
    os: 'darwin',
    arch: 'arm64',
    event,
    ...overrides,
  };
}

describe('buildTelemetryBatches', () => {
  it('aggregates matching events and preserves source indexes', () => {
    const batches = buildTelemetryBatches([
      record({
        name: 'command',
        command: 'compile',
        outcome: 'success',
        count: 1,
        duration_ms_sum: 10,
      }),
      record({
        name: 'command',
        command: 'compile',
        outcome: 'success',
        count: 2,
        duration_ms_sum: 20,
      }),
      record({ name: 'feature', feature: 'strict', count: 1 }),
    ]);

    expect(batches).toHaveLength(1);
    expect(batches[0]?.sourceIndexes).toEqual([0, 1, 2]);
    expect(batches[0]?.payload.events).toEqual([
      {
        name: 'command',
        command: 'compile',
        outcome: 'success',
        count: 3,
        duration_ms_sum: 30,
      },
      { name: 'feature', feature: 'strict', count: 1 },
    ]);
  });

  it('separates runtime metadata groups', () => {
    const batches = buildTelemetryBatches([
      record({ name: 'feature', feature: 'strict', count: 1 }),
      record({ name: 'feature', feature: 'strict', count: 1 }, { app_version: '1.17.0' }),
    ]);

    expect(batches).toHaveLength(2);
    expect(batches.map((batch) => batch.payload.app_version)).toEqual(['1.16.0', '1.17.0']);
  });

  it('keeps aggregate values inside collector bounds', () => {
    const batches = buildTelemetryBatches([
      record({ name: 'feature', feature: 'strict', count: 1_000_000 }),
      record({ name: 'feature', feature: 'strict', count: 1 }),
    ]);

    expect(batches).toHaveLength(2);
    expect(batches.map((batch) => batch.payload.events[0]?.count)).toEqual([1_000_000, 1]);
  });

  it('limits each batch to 25 unique events', () => {
    const targets = [
      'github',
      'claude',
      'cursor',
      'antigravity',
      'factory',
      'opencode',
      'gemini',
      'windsurf',
      'cline',
      'roo',
      'codex',
      'continue',
      'augment',
      'goose',
      'kilo',
      'amp',
      'trae',
      'junie',
      'kiro',
      'cortex',
      'crush',
      'command-code',
      'kode',
      'mcpjam',
      'mistral-vibe',
      'mux',
    ];
    const batches = buildTelemetryBatches(
      targets.map((target) => record({ name: 'feature', feature: `target:${target}`, count: 1 }))
    );

    expect(batches.map((batch) => batch.payload.events.length)).toEqual([25, 1]);
    expect(batches[0]?.payload).toMatchObject({
      schema: 1,
      app: 'promptscript',
      event_schema: 1,
      runtime: 'node',
    });
  });
});
