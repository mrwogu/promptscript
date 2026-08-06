import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../telemetry/config.js', () => ({
  setUserTelemetryEnabled: vi.fn(),
}));

vi.mock('../telemetry/session.js', () => ({
  telemetryStatus: vi.fn(),
}));

vi.mock('../output/console.js', () => ({
  ConsoleOutput: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import { telemetryCommand } from '../commands/telemetry.js';
import { ConsoleOutput } from '../output/console.js';
import { setUserTelemetryEnabled } from '../telemetry/config.js';
import { telemetryStatus } from '../telemetry/session.js';

describe('telemetry command', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    process.exitCode = undefined;
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    process.exitCode = undefined;
    consoleSpy.mockRestore();
  });

  it.each([
    ['enable', true, 'Anonymous usage telemetry enabled in user config'],
    ['disable', false, 'Anonymous usage telemetry disabled in user config'],
  ] as const)('updates the user setting for %s', async (action, enabled, message) => {
    await telemetryCommand(action);

    expect(setUserTelemetryEnabled).toHaveBeenCalledWith(enabled);
    expect(ConsoleOutput.success).toHaveBeenCalledWith(message);
  });

  it('prints effective telemetry status', async () => {
    vi.mocked(telemetryStatus).mockResolvedValue({
      config: {
        enabled: false,
        endpoint: 'https://telemetry.example/v1/events',
        cacheDirectory: '/tmp/cache',
        vetoes: ['project config'],
      },
      spool: { records: 2, bytes: 200 },
      state: {
        lastAttempt: '2026-08-06T12:00:00.000Z',
        lastError: 'offline',
      },
    });

    await telemetryCommand('status');

    expect(consoleSpy).toHaveBeenCalledWith('Enabled: no');
    expect(consoleSpy).toHaveBeenCalledWith('Spool records: 2');
    expect(consoleSpy).toHaveBeenCalledWith('Last success: never');
    expect(consoleSpy).toHaveBeenCalledWith('Disabled by: project config');
  });

  it('rejects unsupported actions', async () => {
    await telemetryCommand('erase');

    expect(ConsoleOutput.error).toHaveBeenCalledWith('Action must be status, enable, or disable');
    expect(process.exitCode).toBe(1);
  });
});
