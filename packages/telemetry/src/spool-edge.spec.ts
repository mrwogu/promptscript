import { chmodSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  appendSpoolRecords,
  claimSpool,
  completeSpoolClaim,
  getSpoolInfo,
  prepareSpoolAttempt,
  writeFlushState,
} from './spool.js';
import type { SpoolRecord } from './types.js';

const directories: string[] = [];

function directory(): string {
  const value = mkdtempSync(join(tmpdir(), 'promptscript-spool-edge-'));
  directories.push(value);
  return value;
}

function record(): SpoolRecord {
  return {
    app_version: '1.16.0',
    runtime_version: '24',
    os: 'darwin',
    arch: 'arm64',
    event: { name: 'feature', feature: 'strict', count: 1 },
  };
}

afterEach(() => {
  for (const value of directories.splice(0)) {
    rmSync(value, { recursive: true, force: true });
  }
});

describe('telemetry spool edge cases', () => {
  it('ignores empty append batches', () => {
    const cacheDirectory = directory();

    expect(() => appendSpoolRecords(cacheDirectory, [])).not.toThrow();
    expect(getSpoolInfo(cacheDirectory).records).toBe(0);
  });

  it('skips malformed and unsupported records', () => {
    const cacheDirectory = directory();
    const lines = [
      '{',
      '{}',
      JSON.stringify({ ...record(), event: { name: 'unknown', count: 1 } }),
      JSON.stringify({ ...record(), event: { name: 'command', count: 0 } }),
      JSON.stringify({
        ...record(),
        event: {
          name: 'command',
          command: 'private-command',
          outcome: 'success',
          count: 1,
          duration_ms_sum: 1,
        },
      }),
    ];
    writeFileSync(join(cacheDirectory, 'telemetry.inflight.ndjson'), `${lines.join('\n')}\n`);

    expect(claimSpool(cacheDirectory)).toEqual({
      records: [],
      corruptLines: lines.length,
    });
  });

  it('returns no claim when a stale inflight path cannot be removed', () => {
    const cacheDirectory = directory();
    mkdirSync(join(cacheDirectory, 'telemetry.inflight.ndjson'));

    expect(claimSpool(cacheDirectory)).toBeNull();
  });

  it('returns false when finalization cannot replace the inflight path', () => {
    const cacheDirectory = directory();
    mkdirSync(join(cacheDirectory, 'telemetry.inflight.ndjson'));

    expect(completeSpoolClaim(cacheDirectory, [])).toBe(false);
    expect(completeSpoolClaim(cacheDirectory, [record()])).toBe(false);
    expect(prepareSpoolAttempt(cacheDirectory, [record()])).toBe(false);
  });

  it('returns no claim when lock acquisition fails unexpectedly', () => {
    const cacheDirectory = directory();
    chmodSync(cacheDirectory, 0o500);

    try {
      expect(claimSpool(cacheDirectory)).toBeNull();
    } finally {
      chmodSync(cacheDirectory, 0o700);
    }
  });

  it('ignores filesystem failures during best-effort persistence', () => {
    const cacheDirectory = directory();
    const filePath = join(cacheDirectory, 'not-a-directory');
    writeFileSync(filePath, 'file');

    expect(() => appendSpoolRecords(filePath, [record()])).not.toThrow();
    expect(() => writeFlushState(filePath, {})).not.toThrow();
    expect(getSpoolInfo(join(cacheDirectory, 'missing'))).toEqual({ records: 0, bytes: 0 });
  });
});
