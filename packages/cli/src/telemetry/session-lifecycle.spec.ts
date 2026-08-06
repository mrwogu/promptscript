import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Command } from 'commander';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ResolvedTelemetryConfig, RuntimeMetadata } from '@promptscript/telemetry';

const mocks = vi.hoisted(() => {
  return {
    getSpoolInfo: vi.fn(() => ({ records: 0, bytes: 0 })),
    isExcludedCommand: vi.fn((value: string): boolean => value === 'hook' || value === 'telemetry'),
    maybeSpawnFlush: vi.fn(),
    readFlushState: vi.fn(() => ({})),
    resolveCliTelemetryConfig: vi.fn(),
    runFlush: vi.fn(),
    runtimeMetadata: vi.fn(),
    sanitizeFeature: vi.fn((value: string): string | null => value),
  };
});

vi.mock('@promptscript/telemetry', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@promptscript/telemetry')>();
  return {
    ...actual,
    getSpoolInfo: mocks.getSpoolInfo,
    isExcludedCommand: mocks.isExcludedCommand,
    maybeSpawnFlush: mocks.maybeSpawnFlush,
    readFlushState: mocks.readFlushState,
    runFlush: mocks.runFlush,
    runtimeMetadata: mocks.runtimeMetadata,
    sanitizeFeature: mocks.sanitizeFeature,
  };
});

vi.mock('./config.js', () => ({
  resolveCliTelemetryConfig: mocks.resolveCliTelemetryConfig,
}));

import {
  commandFeatures,
  finishCliTelemetry,
  flushCliTelemetry,
  normalizedCommandName,
  prepareCliTelemetry,
  telemetryStatus,
} from './session.js';

let config: ResolvedTelemetryConfig;
const metadata: RuntimeMetadata = {
  app_version: '1.16.0',
  runtime_version: '24',
  os: 'darwin',
  arch: 'arm64',
};

beforeEach(() => {
  vi.clearAllMocks();
  config = {
    enabled: true,
    endpoint: 'https://telemetry.example/v1/events',
    cacheDirectory: mkdtempSync(join(tmpdir(), 'promptscript-cli-session-')),
    vetoes: [],
  };
  delete process.env['PROMPTSCRIPT_TELEMETRY_FLUSH'];
  delete process.env['CI'];
  process.exitCode = undefined;
  mocks.resolveCliTelemetryConfig.mockResolvedValue(config);
  mocks.runtimeMetadata.mockReturnValue(metadata);
  mocks.sanitizeFeature.mockImplementation((value: string): string | null => {
    return value === 'target:claude' ? value : null;
  });
});

afterEach(() => {
  rmSync(config.cacheDirectory, { recursive: true, force: true });
  delete process.env['PROMPTSCRIPT_TELEMETRY_FLUSH'];
  process.exitCode = undefined;
  vi.restoreAllMocks();
});

describe('CLI telemetry lifecycle', () => {
  it('normalizes root commands and skips excluded entry points', async () => {
    expect(normalizedCommandName(new Command('compile'))).toBe('compile');

    await prepareCliTelemetry(new Command('telemetry'), '1.16.0');
    expect(mocks.resolveCliTelemetryConfig).not.toHaveBeenCalled();

    process.env['PROMPTSCRIPT_TELEMETRY_FLUSH'] = '1';
    await prepareCliTelemetry(new Command('compile'), '1.16.0');
    expect(mocks.resolveCliTelemetryConfig).not.toHaveBeenCalled();
  });

  it('extracts build features without CI metadata', () => {
    const command = new Command('build');
    command.setOptionValue('target', 42);
    command.setOptionValue('targets', [42]);

    expect(commandFeatures(command)).toEqual(['build_profile']);
  });

  it('prepares and finishes the active session', async () => {
    const command = new Command('compile');
    command.setOptionValue('cwd', 'project');
    command.setOptionValue('config', 'promptscript.yaml');
    command.setOptionValue('target', 'claude');

    await prepareCliTelemetry(command, '1.16.0');

    expect(mocks.resolveCliTelemetryConfig).toHaveBeenCalledWith({
      cwd: 'project',
      config: 'promptscript.yaml',
    });
    expect(mocks.maybeSpawnFlush).toHaveBeenCalledWith(config);

    finishCliTelemetry('error');
    expect(readFileSync(join(config.cacheDirectory, 'telemetry.ndjson'), 'utf8')).toContain(
      '"outcome":"error"'
    );

    process.exitCode = 1;
    await prepareCliTelemetry(new Command('compile'), '1.16.0');
    finishCliTelemetry();
    expect(readFileSync(join(config.cacheDirectory, 'telemetry.ndjson'), 'utf8')).toContain(
      '"outcome":"error"'
    );

    process.exitCode = undefined;
    await prepareCliTelemetry(new Command('compile'), '1.16.0');
    finishCliTelemetry();
    expect(readFileSync(join(config.cacheDirectory, 'telemetry.ndjson'), 'utf8')).toContain(
      '"outcome":"success"'
    );
  });

  it('runs exit and signal handlers without losing lifecycle control', async () => {
    await prepareCliTelemetry(new Command('compile'), '1.16.0');

    const exitListener = process.listeners('exit').at(-1);
    if (exitListener !== undefined) {
      exitListener(0);
    }

    const kill = vi.spyOn(process, 'kill').mockImplementation(() => true);
    const listenerCount = vi.spyOn(process, 'listenerCount').mockReturnValue(1);
    process.emit('SIGINT');
    expect(kill).not.toHaveBeenCalled();

    const exit = vi.spyOn(process, 'exit').mockImplementation((): never => {
      throw new Error('intercepted process.exit');
    });
    listenerCount.mockReturnValue(0);
    kill.mockImplementation(() => {
      throw new Error('intercepted process.kill');
    });

    expect(() => process.emit('SIGTERM')).toThrow('intercepted process.exit');
    expect(exit).toHaveBeenCalledWith(143);
  });

  it('flushes telemetry and reports current spool state', async () => {
    await flushCliTelemetry();
    expect(mocks.runFlush).toHaveBeenCalledWith(config);

    mocks.getSpoolInfo.mockReturnValue({ records: 2, bytes: 200 });
    mocks.readFlushState.mockReturnValue({ lastSuccess: '2026-08-06T12:00:00.000Z' });

    await expect(telemetryStatus()).resolves.toEqual({
      config,
      spool: { records: 2, bytes: 200 },
      state: { lastSuccess: '2026-08-06T12:00:00.000Z' },
    });
  });
});
