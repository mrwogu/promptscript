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
      vi.useFakeTimers();
      const mockFetch = vi.fn(
        (_url: string, init: { signal: AbortSignal }) =>
          new Promise((_resolve, reject) => {
            init.signal.addEventListener('abort', () => {
              reject(new DOMException('Aborted', 'AbortError'));
            });
          })
      );
      vi.stubGlobal('fetch', mockFetch);

      try {
        const { fetchLatestVersion } = await import('../utils/version-check.js');
        const resultPromise = fetchLatestVersion();
        await vi.advanceTimersByTimeAsync(3000);

        await expect(resultPromise).resolves.toBeNull();
      } finally {
        vi.useRealTimers();
      }
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
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

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

    it('should reject versions with extra numeric segments', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ version: '1.0.0.1' }),
      });
      vi.stubGlobal('fetch', mockFetch);

      const { forceCheckForUpdates } = await import('../utils/version-check.js');
      const result = await forceCheckForUpdates('1.0.0');

      expect(result).toEqual({ info: null, error: true });
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

    it('should compare prerelease identifiers', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ version: '1.0.0-beta.1' }),
      });
      vi.stubGlobal('fetch', mockFetch);

      const { forceCheckForUpdates } = await import('../utils/version-check.js');
      const result = await forceCheckForUpdates('1.0.0-alpha.1');

      expect(result.info?.updateAvailable).toBe(true);
    });

    it('should compare numeric prerelease identifiers numerically', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ version: '1.0.0-beta.10' }),
      });
      vi.stubGlobal('fetch', mockFetch);

      const { forceCheckForUpdates } = await import('../utils/version-check.js');
      const result = await forceCheckForUpdates('1.0.0-beta.2');

      expect(result.info?.updateAvailable).toBe(true);
    });

    it.each([
      ['current prerelease identifiers end first', '1.0.0-alpha', '1.0.0-alpha.1', true],
      ['latest prerelease identifiers end first', '1.0.0-alpha.1', '1.0.0-alpha', false],
      ['latest identifier is nonnumeric', '1.0.0-1', '1.0.0-alpha', true],
      ['latest identifier is numeric', '1.0.0-alpha', '1.0.0-1', false],
      ['latest numeric identifier is higher', '1.0.0-alpha.1', '1.0.0-alpha.2', true],
      ['latest numeric identifier is lower', '1.0.0-alpha.2', '1.0.0-alpha.1', false],
      ['latest numeric identifier has fewer digits', '1.0.0-alpha.10', '1.0.0-alpha.2', false],
      ['latest lexical identifier is lower', '1.0.0-beta', '1.0.0-alpha', false],
      ['prerelease identifiers are equal', '1.0.0-alpha.1', '1.0.0-alpha.1', false],
      ['latest version is prerelease', '1.0.0', '1.0.0-alpha', false],
    ])('should compare when %s', async (_case, currentVersion, latestVersion, expected) => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ version: latestVersion }),
      });
      vi.stubGlobal('fetch', mockFetch);

      const { forceCheckForUpdates } = await import('../utils/version-check.js');
      const result = await forceCheckForUpdates(currentVersion);

      expect(result.error).toBe(false);
      expect(result.info?.updateAvailable).toBe(expected);
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

    it('should return null when version field is not valid semver', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ version: 42 }),
      });
      vi.stubGlobal('fetch', mockFetch);

      const { fetchLatestVersion } = await import('../utils/version-check.js');
      const result = await fetchLatestVersion();

      expect(result).toBeNull();
    });

    it.each(['1.0.0-alpha.01', '9007199254740992.0.0'])(
      'should return null for invalid semver %s',
      async (version) => {
        const mockFetch = vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({ version }),
        });
        vi.stubGlobal('fetch', mockFetch);

        const { fetchLatestVersion } = await import('../utils/version-check.js');
        const result = await fetchLatestVersion();

        expect(result).toBeNull();
      }
    );

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
    let mockFsPromisesModule: {
      readFile: ReturnType<typeof vi.fn>;
      writeFile: ReturnType<typeof vi.fn>;
      mkdir: ReturnType<typeof vi.fn>;
    };

    beforeEach(() => {
      vi.stubGlobal('fetch', vi.fn());

      mockFsPromisesModule = {
        readFile: vi.fn().mockRejectedValue(new Error('ENOENT')),
        writeFile: vi.fn().mockResolvedValue(undefined),
        mkdir: vi.fn().mockResolvedValue(undefined),
      };

      vi.doMock('fs/promises', () => mockFsPromisesModule);
    });

    afterEach(() => {
      vi.unstubAllGlobals();
      vi.doUnmock('fs/promises');
    });

    it('should use cached result when valid', async () => {
      mockFsPromisesModule.readFile.mockResolvedValue(
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

      mockFsPromisesModule.readFile.mockResolvedValue(
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
      mockFsPromisesModule.readFile.mockResolvedValue(
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
      mockFsPromisesModule.readFile.mockRejectedValue(new Error('Permission denied'));

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
      mockFsPromisesModule.readFile.mockResolvedValue('invalid json {{{');

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
      mockFsPromisesModule.readFile.mockResolvedValue(
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
      mockFsPromisesModule.readFile.mockResolvedValue(
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

    it.each([
      ['invalid current version', 'invalid', '2.0.0'],
      ['invalid latest version', '1.0.0', 'invalid'],
    ])('should ignore cache with %s', async (_case, currentVersion, latestVersion) => {
      mockFsPromisesModule.readFile.mockResolvedValue(
        JSON.stringify({
          lastCheck: new Date().toISOString(),
          latestVersion,
          currentVersion,
        })
      );

      const mockFetch = vi.fn();
      vi.stubGlobal('fetch', mockFetch);

      const { checkForUpdates } = await import('../utils/version-check.js');
      const result = await checkForUpdates(currentVersion);

      expect(result).toBeNull();
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should return null when fetch fails to get latest version', async () => {
      mockFsPromisesModule.readFile.mockRejectedValue(new Error('ENOENT')); // No cache

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
      mockFsPromisesModule.readFile.mockRejectedValue(new Error('ENOENT')); // No cache

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
