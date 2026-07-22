import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { join } from 'path';

// Define mocks that will be hoisted
const mockCacheManager = {
  getCachePath: vi.fn().mockReturnValue('/home/user/.promptscript/.cache/git/test-key'),
  isValid: vi.fn().mockResolvedValue(false),
  remove: vi.fn().mockResolvedValue(undefined),
  touch: vi.fn().mockResolvedValue(undefined),
};

const mockGitRegistry = {
  exists: vi.fn().mockResolvedValue(true),
  fetch: vi.fn().mockResolvedValue('version: "1"'),
  checkoutCommit: vi.fn().mockResolvedValue(undefined),
};
const {
  mockIsRealPathInside,
  mockLoadVendorManifest,
  mockResolveVendoredRepository,
  mockVerifyGitRepository,
  mockVersionSatisfiesRange,
} = vi.hoisted(() => ({
  mockIsRealPathInside: vi.fn().mockResolvedValue(true),
  mockLoadVendorManifest: vi.fn().mockResolvedValue(null),
  mockResolveVendoredRepository: vi.fn().mockResolvedValue('/project/.promptscript/vendor/repo'),
  mockVerifyGitRepository: vi.fn().mockResolvedValue(undefined),
  mockVersionSatisfiesRange: vi.fn().mockReturnValue(true),
}));

// Mock the resolver module - this gets hoisted
vi.mock('@promptscript/resolver', () => ({
  normalizeGitUrl: (url: string) => url.replace(/\.git$/, ''),
  getCacheKey: (url: string, ref: string) => `${url.replace(/[^a-z0-9]/gi, '-')}-${ref}`,
  isSemverRange: (value: string) => value.startsWith('^'),
  isRealPathInside: mockIsRealPathInside,
  versionSatisfiesRange: mockVersionSatisfiesRange,
  GitCacheManager: class {
    getCachePath = mockCacheManager.getCachePath;
    isValid = mockCacheManager.isValid;
    remove = mockCacheManager.remove;
    touch = mockCacheManager.touch;
  },
  createGitRegistry: () => mockGitRegistry,
  loadVendorManifest: mockLoadVendorManifest,
  resolveVendoredRepository: mockResolveVendoredRepository,
  verifyGitRepositoryCheckout: mockVerifyGitRepository,
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
  id?: string;
  syntax?: string;
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
    mockGitRegistry.checkoutCommit.mockResolvedValue(undefined);
    mockIsRealPathInside.mockResolvedValue(true);
    mockVerifyGitRepository.mockResolvedValue(undefined);
    mockVersionSatisfiesRange.mockReturnValue(true);
    mockLoadVendorManifest.mockResolvedValue(null);
    mockResolveVendoredRepository.mockResolvedValue('/project/.promptscript/vendor/repo');
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
        id: 'test',
        syntax: '1.0.0',
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
        id: 'test',
        syntax: '1.0.0',
        registry: {
          url: 'https://registry.example.com',
        },
      };

      expect(hasRegistryConfig(config)).toBe(true);
    });

    it('should return true for local path registry', () => {
      const config: TestConfig = {
        id: 'test',
        syntax: '1.0.0',
        registry: {
          path: './registry',
        },
      };

      expect(hasRegistryConfig(config)).toBe(true);
    });

    it('should return false when no registry configured', () => {
      const config: TestConfig = {
        id: 'test',
        syntax: '1.0.0',
      };

      expect(hasRegistryConfig(config)).toBe(false);
    });

    it('should return false for empty registry object', () => {
      const config: TestConfig = {
        id: 'test',
        syntax: '1.0.0',
        registry: {},
      };

      expect(hasRegistryConfig(config)).toBe(false);
    });

    it('should return true for git registry with all options', () => {
      const config: TestConfig = {
        id: 'test',
        syntax: '1.0.0',
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
    it('uses a pinned vendored git registry without cache or network access', async () => {
      mockLoadVendorManifest.mockResolvedValue({ version: 1, dependencies: {} });
      const config: PromptScriptConfig = {
        id: 'test',
        syntax: '1.0.0',
        targets: ['github'],
        registry: {
          git: {
            url: 'https://github.com/org/registry.git',
            ref: 'v1.0.0',
            path: 'configs',
          },
        },
      };

      const result = await resolveRegistryPath(config, {
        vendorDir: '/project/.promptscript/vendor',
        lockfile: {
          version: 1,
          dependencies: {
            'https://github.com/org/registry.git': {
              version: 'v1.0.0',
              commit: 'a'.repeat(40),
              integrity: 'sha256-test',
            },
          },
        },
      });

      expect(result).toEqual({
        path: join('/project/.promptscript/vendor/repo', 'configs'),
        isRemote: false,
        source: 'git',
        repositoryUrl: 'https://github.com/org/registry.git',
        repositoryPath: '/project/.promptscript/vendor/repo',
      });
      expect(mockResolveVendoredRepository).toHaveBeenCalledWith(
        '/project/.promptscript/vendor',
        'https://github.com/org/registry.git',
        'v1.0.0',
        'a'.repeat(40)
      );
      expect(mockGitRegistry.fetch).not.toHaveBeenCalled();
    });

    it('rejects a vendored registry whose lock version does not match the configured ref', async () => {
      mockLoadVendorManifest.mockResolvedValue({ version: 1, dependencies: {} });
      const config: PromptScriptConfig = {
        id: 'test',
        syntax: '1.0.0',
        targets: ['github'],
        registry: {
          git: {
            url: 'https://github.com/org/registry.git',
            ref: 'v2.0.0',
          },
        },
      };

      await expect(
        resolveRegistryPath(config, {
          vendorDir: '/project/.promptscript/vendor',
          lockfile: {
            version: 1,
            dependencies: {
              'https://github.com/org/registry.git': {
                version: 'v1.0.0',
                commit: 'a'.repeat(40),
                integrity: 'sha256-test',
              },
            },
          },
        })
      ).rejects.toThrow('does not match configured ref');
    });

    it('rejects a configured registry path outside the vendored repository', async () => {
      mockLoadVendorManifest.mockResolvedValue({ version: 1, dependencies: {} });
      const config: PromptScriptConfig = {
        id: 'test',
        syntax: '1.0.0',
        targets: ['github'],
        registry: {
          git: {
            url: 'https://github.com/org/registry.git',
            ref: 'v1.0.0',
            path: '../outside',
          },
        },
      };

      await expect(
        resolveRegistryPath(config, {
          vendorDir: '/project/.promptscript/vendor',
          lockfile: {
            version: 1,
            dependencies: {
              'https://github.com/org/registry.git': {
                version: 'v1.0.0',
                commit: 'a'.repeat(40),
                integrity: 'sha256-test',
              },
            },
          },
        })
      ).rejects.toThrow('Registry path escapes its repository');
    });

    it('rejects a vendored registry subpath whose real path escapes the repository', async () => {
      mockLoadVendorManifest.mockResolvedValue({ version: 1, dependencies: {} });
      mockResolveVendoredRepository.mockResolvedValue(process.cwd());
      mockIsRealPathInside.mockResolvedValue(false);
      const config: PromptScriptConfig = {
        id: 'test',
        syntax: '1.0.0',
        targets: ['github'],
        registry: {
          git: {
            url: 'https://github.com/org/registry.git',
            ref: 'v1.0.0',
            path: 'src',
          },
        },
      };

      await expect(
        resolveRegistryPath(config, {
          vendorDir: process.cwd(),
          lockfile: {
            version: 1,
            dependencies: {
              'https://github.com/org/registry.git': {
                version: 'v1.0.0',
                commit: 'a'.repeat(40),
                integrity: 'sha256-test',
              },
            },
          },
        })
      ).rejects.toThrow('Registry path escapes its repository');
      expect(mockIsRealPathInside).toHaveBeenCalledWith(join(process.cwd(), 'src'), process.cwd());
    });

    it('accepts a vendored registry subpath contained by its real path', async () => {
      mockLoadVendorManifest.mockResolvedValue({ version: 1, dependencies: {} });
      mockResolveVendoredRepository.mockResolvedValue(process.cwd());
      const config: PromptScriptConfig = {
        id: 'test',
        syntax: '1.0.0',
        targets: ['github'],
        registry: {
          git: {
            url: 'https://github.com/org/registry.git',
            ref: 'v1.0.0',
            path: 'src',
          },
        },
      };

      const result = await resolveRegistryPath(config, {
        vendorDir: process.cwd(),
        lockfile: {
          version: 1,
          dependencies: {
            'https://github.com/org/registry.git': {
              version: 'v1.0.0',
              commit: 'a'.repeat(40),
              integrity: 'sha256-test',
            },
          },
        },
      });

      expect(result.path).toBe(join(process.cwd(), 'src'));
      expect(mockIsRealPathInside).toHaveBeenCalledWith(join(process.cwd(), 'src'), process.cwd());
    });

    it('does not fall back to network when an existing vendor directory lacks a manifest', async () => {
      mockLoadVendorManifest.mockResolvedValue(null);
      const config: PromptScriptConfig = {
        id: 'test',
        syntax: '1.0.0',
        targets: ['github'],
        registry: {
          git: { url: 'https://github.com/org/registry.git' },
        },
      };

      await expect(
        resolveRegistryPath(config, {
          vendorDir: process.cwd(),
          lockfile: { version: 1, dependencies: {} },
        })
      ).rejects.toThrow('Vendor manifest is missing');
      expect(mockGitRegistry.fetch).not.toHaveBeenCalled();
    });

    it('rejects a git registry missing from a supplied lockfile', async () => {
      const config: PromptScriptConfig = {
        id: 'test',
        syntax: '1.0.0',
        targets: ['github'],
        registry: {
          git: { url: 'https://github.com/org/registry.git' },
        },
      };

      await expect(
        resolveRegistryPath(config, {
          lockfile: {
            version: 1,
            dependencies: {
              'https://github.com/other/registry.git': {
                version: 'main',
                commit: 'a'.repeat(40),
                integrity: 'sha256-test',
              },
            },
          },
        })
      ).rejects.toThrow('Git registry is not pinned by the lockfile');
    });

    it('rejects a vendor manifest without a lockfile pin', async () => {
      mockLoadVendorManifest.mockResolvedValue({ version: 1, dependencies: {} });
      const config: PromptScriptConfig = {
        id: 'test',
        syntax: '1.0.0',
        targets: ['github'],
        registry: {
          git: { url: 'https://github.com/org/registry.git' },
        },
      };

      await expect(
        resolveRegistryPath(config, {
          vendorDir: process.cwd(),
        })
      ).rejects.toThrow('Vendored registry is not pinned by the lockfile');
    });

    it('rejects a lockfile pin whose vendored repository is missing', async () => {
      mockLoadVendorManifest.mockResolvedValue({ version: 1, dependencies: {} });
      mockResolveVendoredRepository.mockResolvedValue(null);
      const config: PromptScriptConfig = {
        id: 'test',
        syntax: '1.0.0',
        targets: ['github'],
        registry: {
          git: { url: 'https://github.com/org/registry.git' },
        },
      };

      await expect(
        resolveRegistryPath(config, {
          vendorDir: process.cwd(),
          lockfile: {
            version: 1,
            dependencies: {
              'https://github.com/org/registry.git': {
                version: 'main',
                commit: 'a'.repeat(40),
                integrity: 'sha256-test',
              },
            },
          },
        })
      ).rejects.toThrow('Vendored registry is missing');
    });

    it('matches a lockfile repository through dependency gitUrl', async () => {
      mockCacheManager.isValid.mockResolvedValue(true);
      const commit = 'a'.repeat(40);
      const config: PromptScriptConfig = {
        id: 'test',
        syntax: '1.0.0',
        targets: ['github'],
        registry: {
          git: { url: 'https://github.com/org/registry.git' },
        },
      };

      const result = await resolveRegistryPath(config, {
        lockfile: {
          version: 1,
          dependencies: {
            'registry-alias': {
              version: 'main',
              commit,
              integrity: 'sha256-test',
              gitUrl: 'https://github.com/org/registry.git',
            },
          },
        },
      });

      expect(result.repositoryUrl).toBe('registry-alias');
      expect(mockVerifyGitRepository).toHaveBeenCalledWith(
        '/home/user/.promptscript/.cache/git/test-key',
        '.git',
        commit,
        new Set(['.prs-cache-meta.json'])
      );
    });

    it('accepts a locked version satisfying a configured semver range', async () => {
      mockCacheManager.isValid.mockResolvedValue(true);
      const config: PromptScriptConfig = {
        id: 'test',
        syntax: '1.0.0',
        targets: ['github'],
        registry: {
          git: {
            url: 'https://github.com/org/registry.git',
            ref: '^1.0.0',
          },
        },
      };

      await resolveRegistryPath(config, {
        lockfile: {
          version: 1,
          dependencies: {
            'https://github.com/org/registry.git': {
              version: '1.2.0',
              commit: 'a'.repeat(40),
              integrity: 'sha256-test',
            },
          },
        },
      });

      expect(mockVersionSatisfiesRange).toHaveBeenCalledWith('1.2.0', '^1.0.0');
    });

    it('rejects a locked version outside a configured semver range', async () => {
      mockVersionSatisfiesRange.mockReturnValue(false);
      const config: PromptScriptConfig = {
        id: 'test',
        syntax: '1.0.0',
        targets: ['github'],
        registry: {
          git: {
            url: 'https://github.com/org/registry.git',
            ref: '^2.0.0',
          },
        },
      };

      await expect(
        resolveRegistryPath(config, {
          lockfile: {
            version: 1,
            dependencies: {
              'https://github.com/org/registry.git': {
                version: '1.2.0',
                commit: 'a'.repeat(40),
                integrity: 'sha256-test',
              },
            },
          },
        })
      ).rejects.toThrow('does not match configured ref');
      expect(mockVersionSatisfiesRange).toHaveBeenCalledWith('1.2.0', '^2.0.0');
    });

    it('should resolve git registry with valid cache', async () => {
      mockCacheManager.isValid.mockResolvedValue(true);

      const config: PromptScriptConfig = {
        id: 'test',
        syntax: '1.0.0',
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

    it('verifies a cached Git registry against its locked commit', async () => {
      mockCacheManager.isValid.mockResolvedValue(true);
      const commit = 'a'.repeat(40);
      const config: PromptScriptConfig = {
        id: 'test',
        syntax: '1.0.0',
        targets: ['github'],
        registry: {
          git: { url: 'https://github.com/org/registry.git' },
        },
      };

      await resolveRegistryPath(config, {
        lockfile: {
          version: 1,
          dependencies: {
            'https://github.com/org/registry.git': {
              version: 'main',
              commit,
              integrity: 'sha256-test',
            },
          },
        },
      });

      expect(mockVerifyGitRepository).toHaveBeenCalledWith(
        '/home/user/.promptscript/.cache/git/test-key',
        '.git',
        commit,
        new Set(['.prs-cache-meta.json'])
      );
      expect(mockGitRegistry.fetch).not.toHaveBeenCalled();
    });

    it('repairs a cached Git registry that fails locked checkout verification', async () => {
      mockCacheManager.isValid.mockResolvedValue(true);
      mockVerifyGitRepository
        .mockRejectedValueOnce(new Error('Invalid cached checkout'))
        .mockResolvedValueOnce(undefined);
      const commit = 'a'.repeat(40);
      const config: PromptScriptConfig = {
        id: 'test',
        syntax: '1.0.0',
        targets: ['github'],
        registry: {
          git: { url: 'https://github.com/org/registry.git' },
        },
      };

      await resolveRegistryPath(config, {
        lockfile: {
          version: 1,
          dependencies: {
            'https://github.com/org/registry.git': {
              version: 'main',
              commit,
              integrity: 'sha256-test',
            },
          },
        },
      });

      expect(mockCacheManager.remove).toHaveBeenCalledWith(
        'https://github.com/org/registry',
        'main'
      );
      expect(mockGitRegistry.fetch).toHaveBeenCalledWith('registry-manifest.yaml');
      expect(mockGitRegistry.checkoutCommit).toHaveBeenCalledWith(
        '/home/user/.promptscript/.cache/git/test-key',
        commit
      );
      expect(mockCacheManager.touch).toHaveBeenCalledWith(
        'https://github.com/org/registry',
        'main',
        commit
      );
      expect(mockVerifyGitRepository).toHaveBeenCalledTimes(2);
    });

    it('should clone git registry when cache is invalid', async () => {
      mockCacheManager.isValid.mockResolvedValue(false);

      const config: PromptScriptConfig = {
        id: 'test',
        syntax: '1.0.0',
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
        id: 'test',
        syntax: '1.0.0',
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
        id: 'test',
        syntax: '1.0.0',
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
        id: 'test',
        syntax: '1.0.0',
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
        id: 'test',
        syntax: '1.0.0',
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
        id: 'test',
        syntax: '1.0.0',
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
        id: 'test',
        syntax: '1.0.0',
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
        id: 'test',
        syntax: '1.0.0',
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
        id: 'test',
        syntax: '1.0.0',
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
