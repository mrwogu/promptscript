import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { join } from 'path';

// Define mocks that will be hoisted
const mockCacheManager = {
  getCachePath: vi.fn().mockReturnValue('/home/user/.promptscript/.cache/git/test-key'),
  isValid: vi.fn().mockResolvedValue(false),
};

const mockGitRegistry = {
  exists: vi.fn().mockResolvedValue(true),
  fetch: vi.fn().mockResolvedValue('version: "1"'),
};

// Mock the resolver module - this gets hoisted
vi.mock('@promptscript/resolver', () => ({
  normalizeGitUrl: (url: string) => url.replace(/\.git$/, ''),
  getCacheKey: (url: string, ref: string) => `${url.replace(/[^a-z0-9]/gi, '-')}-${ref}`,
  GitCacheManager: class {
    getCachePath = mockCacheManager.getCachePath;
    isValid = mockCacheManager.isValid;
  },
  createGitRegistry: () => mockGitRegistry,
}));

// Import after mocking
import {
  getGitCachePath,
  hasRegistryConfig,
  resolveRegistryPath,
} from '../utils/registry-resolver.js';
import type { PromptScriptConfig } from '@promptscript/core';

// Minimal config for testing - only the fields we care about
type TestConfig = {
  version: '1';
  project?: { id: string };
  targets?: string[];
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
 */
describe('utils/registry-resolver', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCacheManager.getCachePath.mockReturnValue('/home/user/.promptscript/.cache/git/test-key');
    mockCacheManager.isValid.mockResolvedValue(false);
    mockGitRegistry.exists.mockResolvedValue(true);
    mockGitRegistry.fetch.mockResolvedValue('version: "1"');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

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

  describe('resolveRegistryPath', () => {
    it('should resolve git registry with valid cache', async () => {
      mockCacheManager.isValid.mockResolvedValue(true);

      const config: PromptScriptConfig = {
        version: '1',
        project: { id: 'test' },
        targets: ['github'],
        registry: {
          git: { url: 'https://github.com/org/registry.git' },
        },
      };

      const result = await resolveRegistryPath(config);

      expect(result.source).toBe('git');
      expect(result.isRemote).toBe(true);
      expect(result.path).toBe('/home/user/.promptscript/.cache/git/test-key');
    });

    it('should clone git registry when cache is invalid', async () => {
      mockCacheManager.isValid.mockResolvedValue(false);

      const config: PromptScriptConfig = {
        version: '1',
        project: { id: 'test' },
        targets: ['github'],
        registry: {
          git: { url: 'https://github.com/org/registry.git' },
        },
      };

      const result = await resolveRegistryPath(config);

      expect(result.source).toBe('git');
      expect(result.isRemote).toBe(true);
      expect(mockGitRegistry.fetch).toHaveBeenCalledWith('registry-manifest.yaml');
    });

    it('should append subpath for git registry', async () => {
      mockCacheManager.isValid.mockResolvedValue(true);
      mockCacheManager.getCachePath.mockReturnValue('/cache/git/registry');

      const config: PromptScriptConfig = {
        version: '1',
        project: { id: 'test' },
        targets: ['github'],
        registry: {
          git: {
            url: 'https://github.com/org/registry.git',
            path: 'configs',
          },
        },
      };

      const result = await resolveRegistryPath(config);

      expect(result.path).toBe(join('/cache/git/registry', 'configs'));
    });

    it('should resolve HTTP registry with fallback path', async () => {
      const config: PromptScriptConfig = {
        version: '1',
        project: { id: 'test' },
        targets: ['github'],
        registry: {
          url: 'https://registry.example.com',
          path: './local-cache',
        },
      };

      const result = await resolveRegistryPath(config);

      expect(result.source).toBe('http');
      expect(result.isRemote).toBe(true);
      expect(result.path).toBe('./local-cache');
    });

    it('should use default path for HTTP registry without path', async () => {
      const config: PromptScriptConfig = {
        version: '1',
        project: { id: 'test' },
        targets: ['github'],
        registry: {
          url: 'https://registry.example.com',
        },
      };

      const result = await resolveRegistryPath(config);

      expect(result.source).toBe('http');
      expect(result.path).toBe('./registry');
    });

    it('should resolve local path registry', async () => {
      const config: PromptScriptConfig = {
        version: '1',
        project: { id: 'test' },
        targets: ['github'],
        registry: {
          path: '../my-registry',
        },
      };

      const result = await resolveRegistryPath(config);

      expect(result.source).toBe('local');
      expect(result.isRemote).toBe(false);
      expect(result.path).toBe('../my-registry');
    });

    it('should use default path when no registry configured', async () => {
      const config: PromptScriptConfig = {
        version: '1',
        project: { id: 'test' },
        targets: ['github'],
      };

      const result = await resolveRegistryPath(config);

      expect(result.source).toBe('local');
      expect(result.isRemote).toBe(false);
      expect(result.path).toBe('./registry');
    });

    it('should prioritize git over HTTP over local', async () => {
      mockCacheManager.isValid.mockResolvedValue(true);

      const config: PromptScriptConfig = {
        version: '1',
        project: { id: 'test' },
        targets: ['github'],
        registry: {
          git: { url: 'https://github.com/org/registry.git' },
          url: 'https://registry.example.com',
          path: './local',
        },
      };

      const result = await resolveRegistryPath(config);

      expect(result.source).toBe('git');
    });

    it('should propagate clone errors that are not FileNotFoundError', async () => {
      mockCacheManager.isValid.mockResolvedValue(false);
      mockGitRegistry.fetch.mockRejectedValue(new Error('Network timeout'));

      const config: PromptScriptConfig = {
        version: '1',
        project: { id: 'test' },
        targets: ['github'],
        registry: {
          git: { url: 'https://github.com/org/registry.git' },
        },
      };

      await expect(resolveRegistryPath(config)).rejects.toThrow(
        'Failed to clone registry from https://github.com/org/registry.git: Network timeout'
      );
    });

    it('should not throw when manifest is not found (FileNotFoundError)', async () => {
      mockCacheManager.isValid.mockResolvedValue(false);
      mockCacheManager.getCachePath.mockReturnValue('/cache/git/registry');
      mockGitRegistry.fetch.mockRejectedValue(new Error('File not found'));

      const config: PromptScriptConfig = {
        version: '1',
        project: { id: 'test' },
        targets: ['github'],
        registry: {
          git: { url: 'https://github.com/org/registry.git' },
        },
      };

      const result = await resolveRegistryPath(config);

      expect(result.source).toBe('git');
      expect(result.path).toBe('/cache/git/registry');
    });
  });
});
