import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  loadManifest,
  clearManifestCache,
  getCatalogEntry,
  getCatalogEntriesByNamespace,
  getCatalogEntriesByTag,
  getNamespace,
  getNamespacesSortedByPriority,
  searchCatalog,
  ManifestLoadError,
  isRemoteUrl,
  isValidGitHostUrl,
  isValidGitUrl,
} from '../utils/manifest-loader.js';
import { type CliServices } from '../services.js';
import type { RegistryManifest } from '@promptscript/core';

describe('utils/manifest-loader', () => {
  let mockServices: CliServices;
  let mockFs: {
    existsSync: ReturnType<typeof vi.fn>;
    readFile: ReturnType<typeof vi.fn>;
    writeFile: ReturnType<typeof vi.fn>;
    mkdir: ReturnType<typeof vi.fn>;
    readdir: ReturnType<typeof vi.fn>;
    readFileSync: ReturnType<typeof vi.fn>;
  };

  const sampleManifest: RegistryManifest = {
    version: '1',
    meta: {
      name: 'Test Registry',
      description: 'Test description',
      lastUpdated: '2026-01-28',
    },
    namespaces: {
      '@core': {
        description: 'Core configs',
        priority: 100,
      },
      '@stacks': {
        description: 'Tech stacks',
        priority: 80,
      },
      '@fragments': {
        description: 'Reusable fragments',
        priority: 70,
      },
    },
    catalog: [
      {
        id: '@core/base',
        path: '@core/base.prs',
        name: 'Base Foundation',
        description: 'Universal AI assistant foundation',
        tags: ['core', 'foundation'],
        targets: ['github', 'claude', 'cursor'],
        dependencies: [],
        detectionHints: { always: true },
      },
      {
        id: '@stacks/react',
        path: '@stacks/react.prs',
        name: 'React Stack',
        description: 'React + TypeScript configuration',
        tags: ['stack', 'react', 'frontend'],
        targets: ['github', 'claude', 'cursor'],
        dependencies: ['@core/base'],
        detectionHints: { frameworks: ['react'] },
      },
      {
        id: '@fragments/testing',
        path: '@fragments/testing.prs',
        name: 'Testing Standards',
        description: 'Testing patterns and best practices',
        tags: ['fragment', 'testing'],
        targets: ['github', 'claude', 'cursor'],
        dependencies: [],
      },
    ],
    suggestionRules: [
      {
        condition: { always: true },
        suggest: { inherit: '@core/base' },
      },
    ],
  };

  const manifestYaml = `
version: '1'
meta:
  name: Test Registry
  description: Test description
  lastUpdated: '2026-01-28'
namespaces:
  '@core':
    description: Core configs
    priority: 100
  '@stacks':
    description: Tech stacks
    priority: 80
  '@fragments':
    description: Reusable fragments
    priority: 70
catalog:
  - id: '@core/base'
    path: '@core/base.prs'
    name: Base Foundation
    description: Universal AI assistant foundation
    tags: [core, foundation]
    targets: [github, claude, cursor]
    dependencies: []
    detectionHints:
      always: true
  - id: '@stacks/react'
    path: '@stacks/react.prs'
    name: React Stack
    description: React + TypeScript configuration
    tags: [stack, react, frontend]
    targets: [github, claude, cursor]
    dependencies: ['@core/base']
    detectionHints:
      frameworks: [react]
  - id: '@fragments/testing'
    path: '@fragments/testing.prs'
    name: Testing Standards
    description: Testing patterns and best practices
    tags: [fragment, testing]
    targets: [github, claude, cursor]
    dependencies: []
suggestionRules:
  - condition:
      always: true
    suggest:
      inherit: '@core/base'
`;

  beforeEach(() => {
    clearManifestCache();

    mockFs = {
      existsSync: vi.fn().mockReturnValue(false),
      readFile: vi.fn(),
      writeFile: vi.fn(),
      mkdir: vi.fn(),
      readdir: vi.fn(),
      readFileSync: vi.fn(),
    };

    mockServices = {
      fs: mockFs as unknown as CliServices['fs'],
      prompts: {} as CliServices['prompts'],
      cwd: '/test',
    };
  });

  afterEach(() => {
    clearManifestCache();
  });

  describe('loadManifest', () => {
    it('should load manifest from registry path', async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFile.mockResolvedValue(manifestYaml);

      const result = await loadManifest({ registryPath: './registry' }, mockServices);

      expect(result.manifest.version).toBe('1');
      expect(result.manifest.meta.name).toBe('Test Registry');
      expect(result.manifest.catalog).toHaveLength(3);
      expect(result.cached).toBe(false);
    });

    it('should cache manifest on subsequent loads', async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFile.mockResolvedValue(manifestYaml);

      const result1 = await loadManifest({ registryPath: './registry' }, mockServices);
      const result2 = await loadManifest({ registryPath: './registry' }, mockServices);

      expect(result1.cached).toBe(false);
      expect(result2.cached).toBe(true);
      expect(mockFs.readFile).toHaveBeenCalledTimes(1);
    });

    it('should skip cache when useCache is false', async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFile.mockResolvedValue(manifestYaml);

      await loadManifest({ registryPath: './registry' }, mockServices);
      const result = await loadManifest(
        { registryPath: './registry', useCache: false },
        mockServices
      );

      expect(result.cached).toBe(false);
      expect(mockFs.readFile).toHaveBeenCalledTimes(2);
    });

    it('should throw ManifestLoadError when manifest not found', async () => {
      mockFs.existsSync.mockReturnValue(false);

      await expect(loadManifest({ registryPath: './registry' }, mockServices)).rejects.toThrow(
        ManifestLoadError
      );
    });

    it('should throw ManifestLoadError for invalid YAML', async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFile.mockResolvedValue('invalid: yaml: content: {');

      await expect(loadManifest({ registryPath: './registry' }, mockServices)).rejects.toThrow(
        ManifestLoadError
      );
    });

    it('should throw ManifestLoadError for missing version', async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFile.mockResolvedValue(`
meta:
  name: Test
catalog: []
`);

      await expect(loadManifest({ registryPath: './registry' }, mockServices)).rejects.toThrow(
        'missing required field: version'
      );
    });

    it('should throw ManifestLoadError for unsupported version', async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFile.mockResolvedValue(`
version: '2'
meta:
  name: Test
catalog: []
`);

      await expect(loadManifest({ registryPath: './registry' }, mockServices)).rejects.toThrow(
        'Unsupported manifest version'
      );
    });
  });

  describe('getCatalogEntry', () => {
    it('should return entry by ID', () => {
      const entry = getCatalogEntry(sampleManifest, '@stacks/react');

      expect(entry).toBeDefined();
      expect(entry?.name).toBe('React Stack');
    });

    it('should return undefined for unknown ID', () => {
      const entry = getCatalogEntry(sampleManifest, '@unknown/entry');

      expect(entry).toBeUndefined();
    });
  });

  describe('getCatalogEntriesByNamespace', () => {
    it('should return entries in namespace', () => {
      const entries = getCatalogEntriesByNamespace(sampleManifest, '@core');

      expect(entries).toHaveLength(1);
      expect(entries[0]!.id).toBe('@core/base');
    });

    it('should normalize namespace without @ prefix', () => {
      const entries = getCatalogEntriesByNamespace(sampleManifest, 'stacks');

      expect(entries).toHaveLength(1);
      expect(entries[0]!.id).toBe('@stacks/react');
    });

    it('should return empty array for unknown namespace', () => {
      const entries = getCatalogEntriesByNamespace(sampleManifest, '@unknown');

      expect(entries).toEqual([]);
    });
  });

  describe('getCatalogEntriesByTag', () => {
    it('should return entries with tag', () => {
      const entries = getCatalogEntriesByTag(sampleManifest, 'frontend');

      expect(entries).toHaveLength(1);
      expect(entries[0]!.id).toBe('@stacks/react');
    });

    it('should return multiple entries with same tag', () => {
      const entries = getCatalogEntriesByTag(sampleManifest, 'testing');

      expect(entries).toHaveLength(1);
    });

    it('should return empty array for unknown tag', () => {
      const entries = getCatalogEntriesByTag(sampleManifest, 'unknown-tag');

      expect(entries).toEqual([]);
    });
  });

  describe('getNamespace', () => {
    it('should return namespace definition', () => {
      const ns = getNamespace(sampleManifest, '@core');

      expect(ns).toBeDefined();
      expect(ns?.priority).toBe(100);
    });

    it('should normalize namespace without @ prefix', () => {
      const ns = getNamespace(sampleManifest, 'stacks');

      expect(ns).toBeDefined();
      expect(ns?.priority).toBe(80);
    });

    it('should return undefined for unknown namespace', () => {
      const ns = getNamespace(sampleManifest, '@unknown');

      expect(ns).toBeUndefined();
    });
  });

  describe('getNamespacesSortedByPriority', () => {
    it('should return namespaces sorted by priority (highest first)', () => {
      const sorted = getNamespacesSortedByPriority(sampleManifest);

      expect(sorted).toHaveLength(3);
      expect(sorted[0]!.name).toBe('@core');
      expect(sorted[1]!.name).toBe('@stacks');
      expect(sorted[2]!.name).toBe('@fragments');
    });
  });

  describe('searchCatalog', () => {
    it('should search by ID', () => {
      const results = searchCatalog(sampleManifest, 'react');

      expect(results.some((e) => e.id === '@stacks/react')).toBe(true);
    });

    it('should search by name', () => {
      const results = searchCatalog(sampleManifest, 'Foundation');

      expect(results.some((e) => e.id === '@core/base')).toBe(true);
    });

    it('should search by description', () => {
      const results = searchCatalog(sampleManifest, 'TypeScript');

      expect(results.some((e) => e.id === '@stacks/react')).toBe(true);
    });

    it('should search by tag', () => {
      const results = searchCatalog(sampleManifest, 'frontend');

      expect(results.some((e) => e.id === '@stacks/react')).toBe(true);
    });

    it('should be case-insensitive', () => {
      const results = searchCatalog(sampleManifest, 'REACT');

      expect(results.some((e) => e.id === '@stacks/react')).toBe(true);
    });

    it('should return empty array for no matches', () => {
      const results = searchCatalog(sampleManifest, 'nonexistent');

      expect(results).toEqual([]);
    });
  });

  describe('isRemoteUrl', () => {
    it('should return true for HTTPS URLs', () => {
      expect(isRemoteUrl('https://github.com/user/repo.git')).toBe(true);
      expect(isRemoteUrl('https://example.com/registry')).toBe(true);
    });

    it('should return true for HTTP URLs', () => {
      expect(isRemoteUrl('http://example.com/registry')).toBe(true);
    });

    it('should return true for git@ SSH URLs', () => {
      expect(isRemoteUrl('git@github.com:user/repo.git')).toBe(true);
    });

    it('should return false for local paths', () => {
      expect(isRemoteUrl('./registry')).toBe(false);
      expect(isRemoteUrl('../promptscript-registry')).toBe(false);
      expect(isRemoteUrl('/absolute/path')).toBe(false);
    });
  });

  describe('isValidGitUrl', () => {
    it('should accept valid HTTPS URLs without host restriction', () => {
      expect(isValidGitUrl('https://github.com/user/repo.git')).toBe(true);
      expect(isValidGitUrl('https://gitlab.com/user/repo.git')).toBe(true);
      expect(isValidGitUrl('https://git.company.com/team/repo.git')).toBe(true);
      expect(isValidGitUrl('https://self-hosted.internal/repo')).toBe(true);
    });

    it('should accept valid SSH URLs without host restriction', () => {
      expect(isValidGitUrl('git@github.com:user/repo.git')).toBe(true);
      expect(isValidGitUrl('git@git.company.com:team/repo.git')).toBe(true);
    });

    it('should reject invalid URLs', () => {
      expect(isValidGitUrl('not-a-url')).toBe(false);
      expect(isValidGitUrl('')).toBe(false);
      expect(isValidGitUrl('./local-path')).toBe(false);
      expect(isValidGitUrl('ftp://example.com/repo')).toBe(false);
    });

    it('should validate against allowed hosts when specified', () => {
      const allowedHosts = ['github.com', 'git.company.com'];

      expect(isValidGitUrl('https://github.com/user/repo.git', allowedHosts)).toBe(true);
      expect(isValidGitUrl('https://git.company.com/team/repo', allowedHosts)).toBe(true);
      expect(isValidGitUrl('https://gitlab.com/user/repo', allowedHosts)).toBe(false);
      expect(isValidGitUrl('git@github.com:user/repo.git', allowedHosts)).toBe(true);
      expect(isValidGitUrl('git@gitlab.com:user/repo.git', allowedHosts)).toBe(false);
    });
  });

  describe('isValidGitHostUrl', () => {
    it('should accept valid GitHub HTTPS URLs', () => {
      expect(isValidGitHostUrl('https://github.com/user/repo.git')).toBe(true);
      expect(isValidGitHostUrl('https://github.com/org/registry')).toBe(true);
    });

    it('should accept valid GitLab HTTPS URLs', () => {
      expect(isValidGitHostUrl('https://gitlab.com/user/repo.git')).toBe(true);
    });

    it('should accept valid Bitbucket HTTPS URLs', () => {
      expect(isValidGitHostUrl('https://bitbucket.org/user/repo.git')).toBe(true);
    });

    it('should accept valid SSH URLs', () => {
      expect(isValidGitHostUrl('git@github.com:user/repo.git')).toBe(true);
      expect(isValidGitHostUrl('git@gitlab.com:user/repo.git')).toBe(true);
    });

    it('should reject URLs with spoofed hostnames (security test)', () => {
      // These are malicious URLs that try to bypass simple substring checks
      expect(isValidGitHostUrl('https://evil.com/github.com/fake')).toBe(false);
      expect(isValidGitHostUrl('https://github.com.evil.com/user/repo')).toBe(false);
      expect(isValidGitHostUrl('https://fakegithub.com/user/repo')).toBe(false);
      expect(isValidGitHostUrl('https://evil.com?github.com')).toBe(false);
    });

    it('should reject self-hosted Git servers (use isValidGitUrl for those)', () => {
      expect(isValidGitHostUrl('https://git.company.com/team/repo')).toBe(false);
      expect(isValidGitHostUrl('https://self-hosted.internal/repo')).toBe(false);
    });

    it('should reject invalid URLs', () => {
      expect(isValidGitHostUrl('not-a-url')).toBe(false);
      expect(isValidGitHostUrl('')).toBe(false);
      expect(isValidGitHostUrl('./local-path')).toBe(false);
    });
  });
});
