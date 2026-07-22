import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Program, PromptScriptConfig } from '@promptscript/core';

const { mockResolve, mockGetCachePath, mockResolveRegistryPath, mockCollectRegistryReferences } =
  vi.hoisted(() => ({
    mockResolve: vi.fn(),
    mockGetCachePath: vi.fn(),
    mockResolveRegistryPath: vi.fn(),
    mockCollectRegistryReferences: vi.fn(),
  }));

vi.mock('@promptscript/resolver', () => ({
  Resolver: class {
    resolve = mockResolve;
  },
  RegistryCache: class {
    getCachePath = mockGetCachePath;
  },
}));

vi.mock('../../utils/registry-resolver.js', () => ({
  resolveRegistryPath: mockResolveRegistryPath,
}));

vi.mock('../lock-reference-scanner.js', () => ({
  collectRegistryReferences: mockCollectRegistryReferences,
}));

import { generateLockfileReferences } from '../lock-references.js';

const ast: Program = {
  type: 'Program',
  loc: { file: 'project.prs', line: 1, column: 1 },
  uses: [],
  blocks: [],
  extends: [],
};

describe('generateLockfileReferences', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResolveRegistryPath.mockResolvedValue({
      path: './registry',
      isRemote: false,
      source: 'local',
    });
    mockResolve.mockResolvedValue({ ast, sources: [], errors: [] });
    mockGetCachePath.mockImplementation(
      (repoUrl: string, version: string) => `/cache/${repoUrl}/${version}`
    );
    mockCollectRegistryReferences.mockResolvedValue({});
  });

  it('should resolve the project and hash each unique registry root', async () => {
    const config = {
      id: 'test',
      syntax: '1.4.0',
      targets: [],
      registries: { '@company': 'github.com/company/base' },
    } satisfies PromptScriptConfig;
    const lockfile = {
      version: 1,
      dependencies: {
        'github.com/company/base': {
          version: 'v1.0.0',
          commit: 'a'.repeat(40),
          integrity: 'sha256-pending',
        },
      },
    };
    const imports = [
      { repoUrl: 'github.com/company/base', path: 'rules', version: 'v1.0.0' },
      { repoUrl: 'github.com/company/base', path: 'other', version: 'v1.0.0' },
    ];

    await generateLockfileReferences(
      config,
      '/project/.promptscript/project.prs',
      '/project/.promptscript',
      lockfile,
      imports
    );

    expect(mockCollectRegistryReferences).toHaveBeenCalledWith(
      ast,
      [
        {
          repoUrl: 'github.com/company/base',
          version: 'v1.0.0',
          cachePath: '/cache/github.com/company/base/v1.0.0',
        },
      ],
      undefined
    );
  });

  it('should reject resolution errors', async () => {
    mockResolve.mockResolvedValue({
      ast: null,
      sources: [],
      errors: [{ message: 'Remote import failed' }],
    });

    await expect(
      generateLockfileReferences(
        { id: 'test', syntax: '1.4.0', targets: [] },
        '/project/.promptscript/project.prs',
        '/project/.promptscript',
        { version: 1, dependencies: {} },
        []
      )
    ).rejects.toThrow('Remote import failed');
  });

  it('should reject a missing AST without error details', async () => {
    mockResolve.mockResolvedValue({ ast: null, sources: [], errors: [] });

    await expect(
      generateLockfileReferences(
        { id: 'test', syntax: '1.4.0', targets: [] },
        '/project/.promptscript/project.prs',
        '/project/.promptscript',
        { version: 1, dependencies: {} },
        []
      )
    ).rejects.toThrow('Cannot resolve project references');
  });

  it('should use the resolved lock version for cache paths', async () => {
    await generateLockfileReferences(
      {
        id: 'test',
        syntax: '1.4.0',
        targets: [],
        registries: { '@company': 'github.com/company/base' },
      },
      '/project/.promptscript/project.prs',
      '/project/.promptscript',
      {
        version: 1,
        dependencies: {
          'github.com/company/base': {
            version: 'main',
            commit: 'a'.repeat(40),
            integrity: 'sha256-pending',
          },
        },
      },
      [{ repoUrl: 'github.com/company/base', path: 'rules', version: '' }]
    );

    expect(mockGetCachePath).toHaveBeenCalledWith('github.com/company/base', 'main');
  });

  it('should reject references from unpinned repositories', async () => {
    await expect(
      generateLockfileReferences(
        { id: 'test', syntax: '1.4.0', targets: [] },
        '/project/.promptscript/project.prs',
        '/project/.promptscript',
        { version: 1, dependencies: {} },
        [{ repoUrl: 'github.com/company/base', path: 'rules', version: '' }]
      )
    ).rejects.toThrow('unpinned repository');
  });

  it('should match markdown-sourced pins to their remote import paths', async () => {
    await generateLockfileReferences(
      { id: 'test', syntax: '1.4.0', targets: [] },
      '/project/.promptscript/project.prs',
      '/project/.promptscript',
      {
        version: 1,
        dependencies: {
          'github.com/company/base/rules': {
            version: 'main',
            commit: 'a'.repeat(40),
            integrity: 'sha256-pending',
            source: 'md',
          },
        },
      },
      [{ repoUrl: 'https://github.com/company/base.git', path: 'rules', version: '' }]
    );

    expect(mockCollectRegistryReferences).toHaveBeenCalledWith(
      ast,
      [
        {
          repoUrl: 'github.com/company/base/rules',
          version: 'main',
          cachePath: '/cache/https://github.com/company/base.git/main',
        },
      ],
      undefined
    );
  });

  it('should hash references from the default Git registry root', async () => {
    mockResolveRegistryPath.mockResolvedValue({
      path: '/cache/default/configs',
      isRemote: true,
      source: 'git',
      repositoryUrl: 'github.com/company/registry',
      repositoryPath: '/cache/default',
    });
    const lockfile = {
      version: 1,
      dependencies: {
        'github.com/company/registry': {
          version: 'main',
          commit: 'a'.repeat(40),
          integrity: 'sha256-pending',
        },
      },
    };

    await generateLockfileReferences(
      { id: 'test', syntax: '1.4.0', targets: [] },
      '/project/.promptscript/project.prs',
      '/project/.promptscript',
      lockfile,
      []
    );

    expect(mockCollectRegistryReferences).toHaveBeenCalledWith(
      ast,
      [
        {
          repoUrl: 'github.com/company/registry',
          version: 'main',
          cachePath: '/cache/default',
        },
      ],
      undefined
    );
  });

  it('should reject an unpinned default Git registry root', async () => {
    mockResolveRegistryPath.mockResolvedValue({
      path: '/cache/default/configs',
      isRemote: true,
      source: 'git',
      repositoryUrl: 'git@github.com:company/registry.git',
      repositoryPath: '/cache/default',
    });

    await expect(
      generateLockfileReferences(
        { id: 'test', syntax: '1.4.0', targets: [] },
        '/project/.promptscript/project.prs',
        '/project/.promptscript',
        { version: 1, dependencies: {} },
        []
      )
    ).rejects.toThrow(
      'Cannot lock references for unpinned repository: git@github.com:company/registry.git'
    );
  });

  it('should include pinned transitive repository roots', async () => {
    const lockfile = {
      version: 1,
      dependencies: {
        'github.com/company/direct': {
          version: 'v1.0.0',
          commit: 'a'.repeat(40),
          integrity: 'sha256-pending',
        },
        'github.com/company/transitive': {
          version: 'v2.0.0',
          commit: 'b'.repeat(40),
          integrity: 'sha256-pending',
        },
      },
    };

    await generateLockfileReferences(
      { id: 'test', syntax: '1.4.0', targets: [] },
      '/project/.promptscript/project.prs',
      '/project/.promptscript',
      lockfile,
      [{ repoUrl: 'github.com/company/direct', path: 'rules', version: 'v1.0.0' }]
    );

    expect(mockCollectRegistryReferences).toHaveBeenCalledWith(
      ast,
      [
        {
          repoUrl: 'github.com/company/direct',
          version: 'v1.0.0',
          cachePath: '/cache/github.com/company/direct/v1.0.0',
        },
        {
          repoUrl: 'github.com/company/transitive',
          version: 'v2.0.0',
          cachePath: '/cache/github.com/company/transitive/v2.0.0',
        },
      ],
      undefined
    );
  });
});
