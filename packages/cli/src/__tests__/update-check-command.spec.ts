import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the version-check module
vi.mock('../utils/version-check.js', () => ({
  forceCheckForUpdates: vi.fn(),
}));

// Mock @promptscript/core
vi.mock('@promptscript/core', () => ({
  getPackageVersion: vi.fn(() => '1.0.0'),
}));

// Mock console output
vi.mock('../output/console.js', () => ({
  ConsoleOutput: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import { updateCheckCommand } from '../commands/update-check.js';
import { forceCheckForUpdates } from '../utils/version-check.js';
import { ConsoleOutput } from '../output/console.js';

describe('update-check command', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    process.exitCode = undefined;
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    process.exitCode = undefined;
  });

  it('should print current version', async () => {
    vi.mocked(forceCheckForUpdates).mockResolvedValue({
      info: {
        currentVersion: '1.0.0',
        latestVersion: '1.0.0',
        updateAvailable: false,
      },
      error: false,
    });

    await updateCheckCommand();

    expect(consoleSpy).toHaveBeenCalledWith('@promptscript/cli v1.0.0');
  });

  it('should show success when up to date', async () => {
    vi.mocked(forceCheckForUpdates).mockResolvedValue({
      info: {
        currentVersion: '1.0.0',
        latestVersion: '1.0.0',
        updateAvailable: false,
      },
      error: false,
    });

    await updateCheckCommand();

    expect(ConsoleOutput.success).toHaveBeenCalledWith('Up to date');
  });

  it('should show update message when newer version available', async () => {
    vi.mocked(forceCheckForUpdates).mockResolvedValue({
      info: {
        currentVersion: '1.0.0',
        latestVersion: '2.0.0',
        updateAvailable: true,
      },
      error: false,
    });

    await updateCheckCommand();

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Update available: 1.0.0'));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('2.0.0'));
  });

  it('should show error when network fails', async () => {
    vi.mocked(forceCheckForUpdates).mockResolvedValue({
      info: null,
      error: true,
    });

    await updateCheckCommand();

    expect(ConsoleOutput.error).toHaveBeenCalledWith('Could not check for updates');
    expect(process.exitCode).toBe(1);
  });
});
