import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { join } from 'path';
import { homedir } from 'os';

describe('version-check', () => {
  const originalPlatform = process.platform;
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
    // Reset environment
    process.env = { ...originalEnv };
    delete process.env['PROMPTSCRIPT_NO_UPDATE_CHECK'];
    delete process.env['LOCALAPPDATA'];
    delete process.env['XDG_CACHE_HOME'];
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    Object.defineProperty(process, 'platform', { value: originalPlatform });
    vi.restoreAllMocks();
  });

  describe('getCacheDir', () => {
    it('should return XDG_CACHE_HOME path when set', async () => {
      process.env['XDG_CACHE_HOME'] = '/custom/cache';
      Object.defineProperty(process, 'platform', { value: 'linux' });

      const { getCacheDir } = await import('../utils/version-check.js');
      const result = getCacheDir();

      expect(result).toBe(join('/custom/cache', 'promptscript'));
    });

    it('should return ~/.cache/promptscript when XDG not set', async () => {
      delete process.env['XDG_CACHE_HOME'];
      Object.defineProperty(process, 'platform', { value: 'darwin' });

      const { getCacheDir } = await import('../utils/version-check.js');
      const result = getCacheDir();

      expect(result).toBe(join(homedir(), '.cache', 'promptscript'));
    });

    it('should return LOCALAPPDATA path on Windows', async () => {
      process.env['LOCALAPPDATA'] = 'C:\\Users\\Test\\AppData\\Local';
      Object.defineProperty(process, 'platform', { value: 'win32' });

      const { getCacheDir } = await import('../utils/version-check.js');
      const result = getCacheDir();

      expect(result).toBe(join('C:\\Users\\Test\\AppData\\Local', 'promptscript'));
    });
  });

  describe('getCachePath', () => {
    it('should return path to version.json', async () => {
      const { getCachePath } = await import('../utils/version-check.js');
      const result = getCachePath();

      expect(result).toContain('version.json');
    });
  });

  describe('fetchLatestVersion', () => {
    beforeEach(() => {
      vi.stubGlobal('fetch', vi.fn());
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('should return version on successful fetch', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ version: '2.0.0' }),
      });
      vi.stubGlobal('fetch', mockFetch);

      const { fetchLatestVersion } = await import('../utils/version-check.js');
      const result = await fetchLatestVersion();

      expect(result).toBe('2.0.0');
    });

    it('should return null on HTTP error', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
      });
      vi.stubGlobal('fetch', mockFetch);

      const { fetchLatestVersion } = await import('../utils/version-check.js');
      const result = await fetchLatestVersion();

      expect(result).toBeNull();
    });

    it('should return null on network error', async () => {
      const mockFetch = vi.fn().mockRejectedValue(new Error('ENOTFOUND'));
      vi.stubGlobal('fetch', mockFetch);

      const { fetchLatestVersion } = await import('../utils/version-check.js');
      const result = await fetchLatestVersion();

      expect(result).toBeNull();
    });

    it('should return null on timeout', async () => {
      const mockFetch = vi.fn().mockRejectedValue(new DOMException('Aborted', 'AbortError'));
      vi.stubGlobal('fetch', mockFetch);

      const { fetchLatestVersion } = await import('../utils/version-check.js');
      const result = await fetchLatestVersion();

      expect(result).toBeNull();
    });

    it('should return null on invalid JSON', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.reject(new SyntaxError('Invalid JSON')),
      });
      vi.stubGlobal('fetch', mockFetch);

      const { fetchLatestVersion } = await import('../utils/version-check.js');
      const result = await fetchLatestVersion();

      expect(result).toBeNull();
    });
  });

  describe('checkForUpdates', () => {
    it('should return null when PROMPTSCRIPT_NO_UPDATE_CHECK is set', async () => {
      process.env['PROMPTSCRIPT_NO_UPDATE_CHECK'] = '1';

      const { checkForUpdates } = await import('../utils/version-check.js');
      const result = await checkForUpdates('1.0.0');

      expect(result).toBeNull();
    });

    it('should return null when PROMPTSCRIPT_NO_UPDATE_CHECK is set to any value', async () => {
      process.env['PROMPTSCRIPT_NO_UPDATE_CHECK'] = 'true';

      const { checkForUpdates } = await import('../utils/version-check.js');
      const result = await checkForUpdates('1.0.0');

      expect(result).toBeNull();
    });
  });

  describe('forceCheckForUpdates', () => {
    beforeEach(() => {
      vi.stubGlobal('fetch', vi.fn());
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('should return update info when newer version available', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ version: '2.0.0' }),
      });
      vi.stubGlobal('fetch', mockFetch);

      const { forceCheckForUpdates } = await import('../utils/version-check.js');
      const result = await forceCheckForUpdates('1.0.0');

      expect(result.error).toBe(false);
      expect(result.info?.updateAvailable).toBe(true);
      expect(result.info?.latestVersion).toBe('2.0.0');
    });

    it('should return no update when on latest version', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ version: '1.0.0' }),
      });
      vi.stubGlobal('fetch', mockFetch);

      const { forceCheckForUpdates } = await import('../utils/version-check.js');
      const result = await forceCheckForUpdates('1.0.0');

      expect(result.error).toBe(false);
      expect(result.info?.updateAvailable).toBe(false);
    });

    it('should return error on network failure', async () => {
      const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'));
      vi.stubGlobal('fetch', mockFetch);

      const { forceCheckForUpdates } = await import('../utils/version-check.js');
      const result = await forceCheckForUpdates('1.0.0');

      expect(result.error).toBe(true);
      expect(result.info).toBeNull();
    });
  });

  describe('printUpdateNotification', () => {
    it('should print update notification', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const { printUpdateNotification } = await import('../utils/version-check.js');
      printUpdateNotification({
        currentVersion: '1.0.0',
        latestVersion: '2.0.0',
        updateAvailable: true,
      });

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Update available: 1.0.0'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('2.0.0'));
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('npm i -g @promptscript/cli')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('version comparison', () => {
    beforeEach(() => {
      vi.stubGlobal('fetch', vi.fn());
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('should detect newer major version', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ version: '2.0.0' }),
      });
      vi.stubGlobal('fetch', mockFetch);

      const { forceCheckForUpdates } = await import('../utils/version-check.js');
      const result = await forceCheckForUpdates('1.0.0');

      expect(result.info?.updateAvailable).toBe(true);
    });

    it('should detect newer minor version', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ version: '1.1.0' }),
      });
      vi.stubGlobal('fetch', mockFetch);

      const { forceCheckForUpdates } = await import('../utils/version-check.js');
      const result = await forceCheckForUpdates('1.0.0');

      expect(result.info?.updateAvailable).toBe(true);
    });

    it('should detect newer patch version', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ version: '1.0.1' }),
      });
      vi.stubGlobal('fetch', mockFetch);

      const { forceCheckForUpdates } = await import('../utils/version-check.js');
      const result = await forceCheckForUpdates('1.0.0');

      expect(result.info?.updateAvailable).toBe(true);
    });

    it('should handle prerelease versions', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ version: '1.0.0' }),
      });
      vi.stubGlobal('fetch', mockFetch);

      const { forceCheckForUpdates } = await import('../utils/version-check.js');
      const result = await forceCheckForUpdates('1.0.0-alpha.1');

      expect(result.info?.updateAvailable).toBe(true);
    });

    it('should not report update when versions are equal', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ version: '1.0.0' }),
      });
      vi.stubGlobal('fetch', mockFetch);

      const { forceCheckForUpdates } = await import('../utils/version-check.js');
      const result = await forceCheckForUpdates('1.0.0');

      expect(result.info?.updateAvailable).toBe(false);
    });

    it('should not report update when current is newer', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ version: '1.0.0' }),
      });
      vi.stubGlobal('fetch', mockFetch);

      const { forceCheckForUpdates } = await import('../utils/version-check.js');
      const result = await forceCheckForUpdates('2.0.0');

      expect(result.info?.updateAvailable).toBe(false);
    });
  });
});
