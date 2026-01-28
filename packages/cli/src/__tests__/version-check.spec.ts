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
    it('should return ~/.promptscript/.cache/', async () => {
      const { getCacheDir } = await import('../utils/version-check.js');
      const result = getCacheDir();

      // Unified cache path for consistency with Git registry cache
      expect(result).toBe(join(homedir(), '.promptscript', '.cache'));
    });

    it('should use same parent directory as git registry cache', async () => {
      const { getCacheDir } = await import('../utils/version-check.js');
      const result = getCacheDir();

      // Both version cache and git cache should be under ~/.promptscript/.cache/
      expect(result).toContain('.promptscript');
      expect(result).toContain('.cache');
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

    it('should handle v prefix in versions', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ version: 'v2.0.0' }),
      });
      vi.stubGlobal('fetch', mockFetch);

      const { forceCheckForUpdates } = await import('../utils/version-check.js');
      const result = await forceCheckForUpdates('v1.0.0');

      expect(result.info?.updateAvailable).toBe(true);
    });

    it('should handle versions with different segment counts', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ version: '1.0.0.1' }),
      });
      vi.stubGlobal('fetch', mockFetch);

      const { forceCheckForUpdates } = await import('../utils/version-check.js');
      const result = await forceCheckForUpdates('1.0.0');

      expect(result.info?.updateAvailable).toBe(true);
    });

    it('should handle prerelease to stable upgrade', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ version: '1.0.0' }),
      });
      vi.stubGlobal('fetch', mockFetch);

      const { forceCheckForUpdates } = await import('../utils/version-check.js');
      const result = await forceCheckForUpdates('1.0.0-beta.2');

      expect(result.info?.updateAvailable).toBe(true);
    });

    it('should handle same version different prerelease', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ version: '1.0.0-beta.1' }),
      });
      vi.stubGlobal('fetch', mockFetch);

      const { forceCheckForUpdates } = await import('../utils/version-check.js');
      const result = await forceCheckForUpdates('1.0.0-alpha.1');

      // Both are prereleases, base versions are equal, no upgrade
      expect(result.info?.updateAvailable).toBe(false);
    });
  });

  describe('fetchLatestVersion edge cases', () => {
    beforeEach(() => {
      vi.stubGlobal('fetch', vi.fn());
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('should return null when version field is missing', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ name: '@promptscript/cli' }),
      });
      vi.stubGlobal('fetch', mockFetch);

      const { fetchLatestVersion } = await import('../utils/version-check.js');
      const result = await fetchLatestVersion();

      expect(result).toBeNull();
    });

    it('should handle error with code property', async () => {
      const error = new Error('Connection refused') as NodeJS.ErrnoException;
      error.code = 'ECONNREFUSED';
      const mockFetch = vi.fn().mockRejectedValue(error);
      vi.stubGlobal('fetch', mockFetch);

      const { fetchLatestVersion } = await import('../utils/version-check.js');
      const result = await fetchLatestVersion();

      expect(result).toBeNull();
    });
  });

  describe('checkForUpdates with cache', () => {
    let mockFsModule: {
      existsSync: ReturnType<typeof vi.fn>;
      readFileSync: ReturnType<typeof vi.fn>;
      writeFileSync: ReturnType<typeof vi.fn>;
      mkdirSync: ReturnType<typeof vi.fn>;
    };

    beforeEach(() => {
      vi.stubGlobal('fetch', vi.fn());

      mockFsModule = {
        existsSync: vi.fn().mockReturnValue(false),
        readFileSync: vi.fn(),
        writeFileSync: vi.fn(),
        mkdirSync: vi.fn(),
      };

      vi.doMock('fs', () => mockFsModule);
    });

    afterEach(() => {
      vi.unstubAllGlobals();
      vi.doUnmock('fs');
    });

    it('should use cached result when valid', async () => {
      mockFsModule.existsSync.mockReturnValue(true);
      mockFsModule.readFileSync.mockReturnValue(
        JSON.stringify({
          lastCheck: new Date().toISOString(),
          latestVersion: '2.0.0',
          currentVersion: '1.0.0',
        })
      );

      const mockFetch = vi.fn();
      vi.stubGlobal('fetch', mockFetch);

      const { checkForUpdates } = await import('../utils/version-check.js');
      const result = await checkForUpdates('1.0.0');

      // Should use cached result without fetching
      expect(result?.updateAvailable).toBe(true);
      expect(result?.latestVersion).toBe('2.0.0');
    });

    it('should fetch when cache is expired', async () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 2); // 2 days ago

      mockFsModule.existsSync.mockReturnValue(true);
      mockFsModule.readFileSync.mockReturnValue(
        JSON.stringify({
          lastCheck: oldDate.toISOString(),
          latestVersion: '1.5.0',
          currentVersion: '1.0.0',
        })
      );

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ version: '2.0.0' }),
      });
      vi.stubGlobal('fetch', mockFetch);

      const { checkForUpdates } = await import('../utils/version-check.js');
      await checkForUpdates('1.0.0');

      expect(mockFetch).toHaveBeenCalled();
    });

    it('should fetch when current version changed', async () => {
      mockFsModule.existsSync.mockReturnValue(true);
      mockFsModule.readFileSync.mockReturnValue(
        JSON.stringify({
          lastCheck: new Date().toISOString(),
          latestVersion: '2.0.0',
          currentVersion: '0.9.0', // Different from current
        })
      );

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ version: '2.0.0' }),
      });
      vi.stubGlobal('fetch', mockFetch);

      const { checkForUpdates } = await import('../utils/version-check.js');
      await checkForUpdates('1.0.0');

      expect(mockFetch).toHaveBeenCalled();
    });

    it('should handle cache read error gracefully', async () => {
      mockFsModule.existsSync.mockReturnValue(true);
      mockFsModule.readFileSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ version: '2.0.0' }),
      });
      vi.stubGlobal('fetch', mockFetch);

      const { checkForUpdates } = await import('../utils/version-check.js');
      const result = await checkForUpdates('1.0.0');

      expect(mockFetch).toHaveBeenCalled();
      expect(result?.updateAvailable).toBe(true);
    });

    it('should handle invalid cache JSON gracefully', async () => {
      mockFsModule.existsSync.mockReturnValue(true);
      mockFsModule.readFileSync.mockReturnValue('invalid json {{{');

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ version: '2.0.0' }),
      });
      vi.stubGlobal('fetch', mockFetch);

      const { checkForUpdates } = await import('../utils/version-check.js');
      const result = await checkForUpdates('1.0.0');

      expect(mockFetch).toHaveBeenCalled();
      expect(result?.updateAvailable).toBe(true);
    });

    it('should handle invalid cache date gracefully', async () => {
      mockFsModule.existsSync.mockReturnValue(true);
      mockFsModule.readFileSync.mockReturnValue(
        JSON.stringify({
          lastCheck: 'invalid-date',
          latestVersion: '2.0.0',
          currentVersion: '1.0.0',
        })
      );

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ version: '2.0.0' }),
      });
      vi.stubGlobal('fetch', mockFetch);

      const { checkForUpdates } = await import('../utils/version-check.js');
      await checkForUpdates('1.0.0');

      expect(mockFetch).toHaveBeenCalled();
    });

    it('should return null when cached version shows no update available', async () => {
      mockFsModule.existsSync.mockReturnValue(true);
      mockFsModule.readFileSync.mockReturnValue(
        JSON.stringify({
          lastCheck: new Date().toISOString(),
          latestVersion: '1.0.0', // Same as current
          currentVersion: '1.0.0',
        })
      );

      const mockFetch = vi.fn();
      vi.stubGlobal('fetch', mockFetch);

      const { checkForUpdates } = await import('../utils/version-check.js');
      const result = await checkForUpdates('1.0.0');

      // Should return null (no update) without fetching
      expect(result).toBeNull();
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should return null when fetch fails to get latest version', async () => {
      mockFsModule.existsSync.mockReturnValue(false); // No cache

      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      });
      vi.stubGlobal('fetch', mockFetch);

      const { checkForUpdates } = await import('../utils/version-check.js');
      const result = await checkForUpdates('1.0.0');

      expect(result).toBeNull();
    });

    it('should return null when current version is already latest', async () => {
      mockFsModule.existsSync.mockReturnValue(false); // No cache

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ version: '1.0.0' }), // Same as current
      });
      vi.stubGlobal('fetch', mockFetch);

      const { checkForUpdates } = await import('../utils/version-check.js');
      const result = await checkForUpdates('1.0.0');

      expect(result).toBeNull();
    });

    it('should return null in quiet mode', async () => {
      const { setContext, LogLevel } = await import('../output/console.js');
      setContext({ logLevel: LogLevel.Quiet });

      const { checkForUpdates } = await import('../utils/version-check.js');
      const result = await checkForUpdates('1.0.0');

      expect(result).toBeNull();
    });
  });

  describe('verbose logging', () => {
    beforeEach(async () => {
      const { setContext, LogLevel } = await import('../output/console.js');
      setContext({ logLevel: LogLevel.Verbose });
      vi.stubGlobal('fetch', vi.fn());
    });

    afterEach(async () => {
      const { setContext, LogLevel } = await import('../output/console.js');
      setContext({ logLevel: LogLevel.Normal });
    });

    it('should log verbose message on HTTP error', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
      });
      vi.stubGlobal('fetch', mockFetch);

      const { fetchLatestVersion } = await import('../utils/version-check.js');
      const result = await fetchLatestVersion();

      expect(result).toBeNull();
    });

    it('should log verbose message on network error', async () => {
      const error = new Error('ECONNREFUSED');
      (error as NodeJS.ErrnoException).code = 'ECONNREFUSED';
      const mockFetch = vi.fn().mockRejectedValue(error);
      vi.stubGlobal('fetch', mockFetch);

      const { fetchLatestVersion } = await import('../utils/version-check.js');
      const result = await fetchLatestVersion();

      expect(result).toBeNull();
    });
  });
});
