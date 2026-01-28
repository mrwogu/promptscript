import { describe, it, expect } from 'vitest';
import { getGitCachePath, hasRegistryConfig } from '../utils/registry-resolver.js';

// Minimal config for testing - only the fields we care about
type TestConfig = {
  version: '1';
  registry?: {
    git?: {
      url: string;
      ref?: string;
      path?: string;
      auth?: { type: 'token'; tokenEnvVar: string };
    };
    url?: string;
    path?: string;
    cache?: { enabled?: boolean; ttl?: number };
  };
};

/**
 * Tests for registry-resolver utility.
 *
 * Note: resolveRegistryPath() requires actual GitRegistry/GitCacheManager
 * which need file system and git operations. Those are tested via integration
 * tests (smoke tests). Here we test the pure utility functions.
 */
describe('utils/registry-resolver', () => {
  describe('getGitCachePath', () => {
    it('should return cache path for URL and ref', () => {
      const path = getGitCachePath('https://github.com/org/registry.git', 'main');

      expect(path).toContain('.promptscript');
      expect(path).toContain('.cache');
      expect(path).toContain('git');
    });

    it('should return different paths for different refs', () => {
      const pathMain = getGitCachePath('https://github.com/org/registry.git', 'main');
      const pathV1 = getGitCachePath('https://github.com/org/registry.git', 'v1.0.0');

      expect(pathMain).not.toBe(pathV1);
    });

    it('should return different paths for different URLs', () => {
      const path1 = getGitCachePath('https://github.com/org1/registry.git', 'main');
      const path2 = getGitCachePath('https://github.com/org2/registry.git', 'main');

      expect(path1).not.toBe(path2);
    });

    it('should default to main branch', () => {
      const path = getGitCachePath('https://github.com/org/registry.git');
      const pathMain = getGitCachePath('https://github.com/org/registry.git', 'main');

      expect(path).toBe(pathMain);
    });
  });

  describe('hasRegistryConfig', () => {
    it('should return true for git registry', () => {
      const config: TestConfig = {
        version: '1',
        registry: {
          git: {
            url: 'https://github.com/org/registry.git',
          },
        },
      };

      expect(hasRegistryConfig(config)).toBe(true);
    });

    it('should return true for HTTP registry', () => {
      const config: TestConfig = {
        version: '1',
        registry: {
          url: 'https://registry.example.com',
        },
      };

      expect(hasRegistryConfig(config)).toBe(true);
    });

    it('should return true for local path registry', () => {
      const config: TestConfig = {
        version: '1',
        registry: {
          path: './registry',
        },
      };

      expect(hasRegistryConfig(config)).toBe(true);
    });

    it('should return false when no registry configured', () => {
      const config: TestConfig = {
        version: '1',
      };

      expect(hasRegistryConfig(config)).toBe(false);
    });

    it('should return false for empty registry object', () => {
      const config: TestConfig = {
        version: '1',
        registry: {},
      };

      expect(hasRegistryConfig(config)).toBe(false);
    });

    it('should return true for git registry with all options', () => {
      const config: TestConfig = {
        version: '1',
        registry: {
          git: {
            url: 'https://github.com/org/registry.git',
            ref: 'v1.0.0',
            path: 'configs/',
            auth: {
              type: 'token',
              tokenEnvVar: 'GITHUB_TOKEN',
            },
          },
          cache: {
            enabled: true,
            ttl: 3600000,
          },
        },
      };

      expect(hasRegistryConfig(config)).toBe(true);
    });
  });
});
