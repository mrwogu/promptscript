import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { maybeSpawnFlush, TelemetrySession } from './reporter.js';
import { claimSpool, writeFlushState } from './spool.js';
import type { ResolvedTelemetryConfig, RuntimeMetadata } from './types.js';

const directories: string[] = [];

function directory(): string {
  const value = mkdtempSync(join(tmpdir(), 'promptscript-reporter-'));
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

const metadata: RuntimeMetadata = {
  app_version: '1.16.0',
  runtime_version: '24',
  os: 'darwin',
  arch: 'arm64',
};

afterEach(() => {
  for (const value of directories.splice(0)) {
    rmSync(value, { recursive: true, force: true });
  }
});

describe('TelemetrySession', () => {
  it('records one command and allowlisted features exactly once', () => {
    const cacheDirectory = directory();
    const session = new TelemetrySession({
      config: config(cacheDirectory),
      metadata,
      command: 'compile',
      features: ['strict', 'target:claude', 'path:/private/repo'],
      startTime: 0,
    });

    session.finish('success');
    session.finish('error');

    const events = claimSpool(cacheDirectory)?.records.map((record) => record.event);
    expect(events).toHaveLength(3);
    expect(events?.[0]).toMatchObject({
      name: 'command',
      command: 'compile',
      outcome: 'success',
      count: 1,
    });
    expect(events?.slice(1)).toEqual([
      { name: 'feature', feature: 'strict', count: 1 },
      { name: 'feature', feature: 'target:claude', count: 1 },
    ]);
  });

  it('records nothing when disabled or excluded', () => {
    const disabledDirectory = directory();
    const excludedDirectory = directory();

    new TelemetrySession({
      config: config(disabledDirectory, false),
      metadata,
      command: 'compile',
    }).finish('success');
    new TelemetrySession({
      config: config(excludedDirectory),
      metadata,
      command: 'hook',
    }).finish('success');

    expect(claimSpool(disabledDirectory)).toBeNull();
    expect(claimSpool(excludedDirectory)).toBeNull();
  });
});

describe('maybeSpawnFlush', () => {
  it('does not spawn when the spool is empty', () => {
    const cacheDirectory = directory();
    const spawn = vi.fn(() => ({ unref: vi.fn() }));

    expect(
      maybeSpawnFlush(config(cacheDirectory), {
        environment: {},
        entrypoint: '/prs.js',
        spawn,
      })
    ).toBe(false);
    expect(spawn).not.toHaveBeenCalled();
  });

  it('spawns immediately when the spool reaches the record threshold', () => {
    const cacheDirectory = directory();
    for (let index = 0; index < 50; index += 1) {
      new TelemetrySession({
        config: config(cacheDirectory),
        metadata,
        command: 'compile',
      }).finish('success');
    }
    const spawn = vi.fn(() => ({ unref: vi.fn() }));

    expect(
      maybeSpawnFlush(config(cacheDirectory), {
        environment: {},
        entrypoint: '/prs.js',
        spawn,
      })
    ).toBe(true);
    expect(spawn).toHaveBeenCalledOnce();
  });

  it('spawns one detached guarded child when records are due', () => {
    const cacheDirectory = directory();
    new TelemetrySession({
      config: config(cacheDirectory),
      metadata,
      command: 'compile',
    }).finish('success');
    const unref = vi.fn();
    const spawn = vi.fn(() => ({ unref }));

    const spawned = maybeSpawnFlush(config(cacheDirectory), {
      executable: '/node',
      entrypoint: '/prs.js',
      environment: {},
      spawn,
      now: Date.parse('2026-08-06T12:00:00.000Z'),
    });

    expect(spawned).toBe(true);
    expect(spawn).toHaveBeenCalledWith(
      '/node',
      ['/prs.js', '__telemetry-flush'],
      expect.objectContaining({
        detached: true,
        stdio: 'ignore',
        env: expect.objectContaining({
          PROMPTSCRIPT_TELEMETRY_FLUSH: '1',
          PROMPTSCRIPT_NO_UPDATE_CHECK: '1',
        }),
      })
    );
    expect(unref).toHaveBeenCalledOnce();
  });

  it('uses process defaults when options are omitted', () => {
    const cacheDirectory = directory();
    new TelemetrySession({
      config: config(cacheDirectory),
      metadata,
      command: 'compile',
    }).finish('success');
    const spawn = vi.fn(() => ({ unref: vi.fn() }));
    const originalArgv = process.argv[1];
    process.argv[1] = '/prs.js';

    try {
      expect(maybeSpawnFlush(config(cacheDirectory), { spawn })).toBe(true);
      expect(spawn).toHaveBeenCalledWith(
        process.execPath,
        ['/prs.js', '__telemetry-flush'],
        expect.any(Object)
      );
    } finally {
      if (originalArgv === undefined) {
        process.argv.splice(1, 1);
      } else {
        process.argv[1] = originalArgv;
      }
    }
  });

  it('returns false when detached spawn fails', () => {
    const cacheDirectory = directory();
    new TelemetrySession({
      config: config(cacheDirectory),
      metadata,
      command: 'compile',
    }).finish('success');
    const spawn = vi.fn(() => {
      throw new Error('spawn failed');
    });

    expect(
      maybeSpawnFlush(config(cacheDirectory), {
        environment: {},
        entrypoint: '/prs.js',
        spawn,
      })
    ).toBe(false);
  });

  it('does not spawn recursively or before the interval', () => {
    const cacheDirectory = directory();
    new TelemetrySession({
      config: config(cacheDirectory),
      metadata,
      command: 'compile',
    }).finish('success');
    writeFlushState(cacheDirectory, { lastAttempt: '2026-08-06T11:00:00.000Z' });
    const spawn = vi.fn(() => ({ unref: vi.fn() }));

    expect(
      maybeSpawnFlush(config(cacheDirectory), {
        environment: {},
        entrypoint: '/prs.js',
        spawn,
        now: Date.parse('2026-08-06T12:00:00.000Z'),
      })
    ).toBe(false);
    expect(
      maybeSpawnFlush(config(cacheDirectory), {
        environment: { PROMPTSCRIPT_TELEMETRY_FLUSH: '1' },
        entrypoint: '/prs.js',
        spawn,
        now: Date.parse('2026-08-07T12:00:00.000Z'),
      })
    ).toBe(false);
    expect(spawn).not.toHaveBeenCalled();
  });
});
