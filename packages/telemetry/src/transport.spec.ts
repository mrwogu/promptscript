import { afterEach, describe, expect, it, vi } from 'vitest';
import { postTelemetry, type TelemetryFetch } from './transport.js';
import type { TelemetryPayload } from './types.js';

const payload: TelemetryPayload = {
  schema: 1,
  app: 'promptscript',
  event_schema: 1,
  app_version: '1.16.0',
  runtime: 'node',
  runtime_version: '24',
  os: 'darwin',
  arch: 'arm64',
  events: [{ name: 'feature', feature: 'strict', count: 1 }],
};

describe('postTelemetry', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it.each([
    [204, 'sent'],
    [400, 'rejected'],
    [413, 'rejected'],
    [429, 'retryable'],
    [503, 'retryable'],
    [302, 'rejected'],
  ] as const)('maps HTTP %s to %s', async (status, expected) => {
    const fetchImplementation = vi
      .fn<TelemetryFetch>()
      .mockResolvedValue(new Response(null, { status }));

    const result = await postTelemetry(
      'https://telemetry.example/v1/events',
      payload,
      100,
      fetchImplementation
    );

    expect(result).toBe(expected);
    expect(fetchImplementation).toHaveBeenCalledWith(
      'https://telemetry.example/v1/events',
      expect.objectContaining({
        method: 'POST',
        redirect: 'manual',
      })
    );
  });

  it('rejects non-HTTPS endpoints without fetching', async () => {
    const fetchImplementation = vi.fn<TelemetryFetch>();

    const result = await postTelemetry(
      'http://telemetry.example/v1/events',
      payload,
      100,
      fetchImplementation
    );

    expect(result).toBe('rejected');
    expect(fetchImplementation).not.toHaveBeenCalled();
  });

  it('classifies network failures as unknown to prevent duplicate delivery', async () => {
    const fetchImplementation = vi.fn<TelemetryFetch>().mockRejectedValue(new Error('offline'));

    const result = await postTelemetry(
      'https://telemetry.example/v1/events',
      payload,
      100,
      fetchImplementation
    );

    expect(result).toBe('unknown');
  });

  it('classifies an elapsed request deadline as unknown', async () => {
    vi.useFakeTimers();
    const fetchImplementation: TelemetryFetch = (_input, init) =>
      new Promise((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => reject(new Error('aborted')));
      });

    const resultPromise = postTelemetry(
      'https://telemetry.example/v1/events',
      payload,
      10,
      fetchImplementation
    );
    await vi.advanceTimersByTimeAsync(10);

    await expect(resultPromise).resolves.toBe('unknown');
  });
});
