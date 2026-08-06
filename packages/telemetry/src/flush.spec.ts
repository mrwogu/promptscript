import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { runFlush } from './flush.js';
import { appendSpoolRecords, claimSpool, readFlushState } from './spool.js';
import type { ResolvedTelemetryConfig, SpoolRecord } from './types.js';

const directories: string[] = [];

function directory(): string {
  const value = mkdtempSync(join(tmpdir(), 'promptscript-flush-'));
  directories.push(value);
  return value;
}

function config(cacheDirectory: string, enabled = true): ResolvedTelemetryConfig {
  return {
    enabled,
    endpoint: 'https://telemetry.example/v1/events',
    cacheDirectory,
    vetoes: enabled ? [] : ['project config'],
  };
}

function record(count = 1): SpoolRecord {
  return {
    app_version: '1.16.0',
    runtime_version: '24',
    os: 'darwin',
    arch: 'arm64',
    event: { name: 'feature', feature: 'strict', count },
  };
}

afterEach(() => {
  vi.useRealTimers();
  for (const value of directories.splice(0)) {
    rmSync(value, { recursive: true, force: true });
  }
});

describe('runFlush', () => {
  it('delivers and removes accepted records', async () => {
    const cacheDirectory = directory();
    appendSpoolRecords(cacheDirectory, [record(), record()]);
    const fetchImplementation = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));

    const result = await runFlush(config(cacheDirectory), fetchImplementation);

    expect(result).toEqual({
      attempted: true,
      deliveredRecords: 2,
      rejectedRecords: 0,
      remainingRecords: 0,
    });
    expect(fetchImplementation).toHaveBeenCalledOnce();
    expect(claimSpool(cacheDirectory)).toBeNull();
    expect(readFlushState(cacheDirectory).lastSuccess).toBeDefined();
  });

  it('keeps records after retryable responses', async () => {
    const cacheDirectory = directory();
    appendSpoolRecords(cacheDirectory, [record()]);

    const result = await runFlush(
      config(cacheDirectory),
      vi.fn().mockResolvedValue(new Response(null, { status: 503 }))
    );

    expect(result.remainingRecords).toBe(1);
    expect(claimSpool(cacheDirectory)?.records).toHaveLength(1);
    expect(readFlushState(cacheDirectory).lastError).toContain('retryable');
  });

  it('quarantines collector-rejected records without blocking later batches', async () => {
    const cacheDirectory = directory();
    appendSpoolRecords(cacheDirectory, [record()]);

    const result = await runFlush(
      config(cacheDirectory),
      vi.fn().mockResolvedValue(new Response(null, { status: 400 }))
    );

    expect(result).toEqual({
      attempted: true,
      deliveredRecords: 0,
      rejectedRecords: 1,
      remainingRecords: 0,
    });
    expect(claimSpool(cacheDirectory)).toBeNull();
  });

  it('keeps corrupt-record diagnostics after finalizing the spool', async () => {
    const cacheDirectory = directory();
    writeFileSync(join(cacheDirectory, 'telemetry.ndjson'), '{"event":"private path"}\n');

    const result = await runFlush(config(cacheDirectory), vi.fn());

    expect(result.attempted).toBe(false);
    expect(readFlushState(cacheDirectory).lastError).toBe('Skipped 1 corrupt spool record(s)');
    expect(claimSpool(cacheDirectory)).toBeNull();
  });

  it('drops uncertain batches to preserve at-most-once delivery', async () => {
    vi.useFakeTimers();
    const cacheDirectory = directory();
    appendSpoolRecords(cacheDirectory, [record()]);
    const fetchImplementation = vi.fn(
      (_input: string | URL | Request, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => reject(new Error('aborted')));
        })
    );

    const flushPromise = runFlush(config(cacheDirectory), fetchImplementation);
    await vi.advanceTimersByTimeAsync(5_000);
    const result = await flushPromise;

    expect(result.deliveredRecords).toBe(1);
    expect(result.remainingRecords).toBe(0);
    expect(claimSpool(cacheDirectory)).toBeNull();
  });

  it('drops batches after network failures with unknown delivery state', async () => {
    const cacheDirectory = directory();
    appendSpoolRecords(cacheDirectory, [record()]);

    const result = await runFlush(
      config(cacheDirectory),
      vi.fn().mockRejectedValue(new Error('connection reset'))
    );

    expect(result.deliveredRecords).toBe(1);
    expect(result.remainingRecords).toBe(0);
    expect(claimSpool(cacheDirectory)).toBeNull();
  });

  it('sends at most three batches per process', async () => {
    const cacheDirectory = directory();
    appendSpoolRecords(cacheDirectory, [
      record(1_000_000),
      record(1_000_000),
      record(1_000_000),
      record(1_000_000),
    ]);
    const fetchImplementation = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));

    const result = await runFlush(config(cacheDirectory), fetchImplementation);

    expect(fetchImplementation).toHaveBeenCalledTimes(3);
    expect(result.deliveredRecords).toBe(3);
    expect(result.remainingRecords).toBe(1);
  });

  it('does nothing when disabled or another flusher holds the lease', async () => {
    const disabledDirectory = directory();
    const lockedDirectory = directory();
    mkdirSync(join(lockedDirectory, 'telemetry-flush.lock'));
    const fetchImplementation = vi.fn();

    expect(await runFlush(config(disabledDirectory, false), fetchImplementation)).toEqual({
      attempted: false,
      deliveredRecords: 0,
      rejectedRecords: 0,
      remainingRecords: 0,
    });
    expect(await runFlush(config(lockedDirectory), fetchImplementation)).toEqual({
      attempted: false,
      deliveredRecords: 0,
      rejectedRecords: 0,
      remainingRecords: 0,
    });
    expect(fetchImplementation).not.toHaveBeenCalled();
  });
});
