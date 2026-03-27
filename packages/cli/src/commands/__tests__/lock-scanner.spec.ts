import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockParse, mockExistsSync, mockReadFile } = vi.hoisted(() => {
  const mockParse = vi.fn();
  const mockExistsSync = vi.fn();
  const mockReadFile = vi.fn();
  return { mockParse, mockExistsSync, mockReadFile };
});

vi.mock('@promptscript/parser', () => ({
  parse: mockParse,
}));

vi.mock('fs', () => ({ existsSync: mockExistsSync }));

vi.mock('fs/promises', () => ({
  readFile: mockReadFile,
}));

import { collectRemoteImports } from '../lock-scanner.js';
import type { Program, PathReference, UseDeclaration } from '@promptscript/core';

/** Helper to build a minimal PathReference. */
function pathRef(raw: string, overrides: Partial<PathReference> = {}): PathReference {
  const isRelative = raw.startsWith('./') || raw.startsWith('../');
  const segments = raw.replace(/^\.\//, '').split('/');
  return {
    type: 'PathReference',
    raw,
    segments,
    isRelative,
    loc: { file: 'test.prs', line: 1, column: 1 },
    ...overrides,
  };
}

/** Helper to build a UseDeclaration. */
function useDecl(raw: string, overrides: Partial<PathReference> = {}): UseDeclaration {
  return {
    type: 'UseDeclaration',
    path: pathRef(raw, overrides),
    loc: { file: 'test.prs', line: 1, column: 1 },
  };
}

/** Helper to build a minimal Program with uses. */
function program(uses: UseDeclaration[]): Program {
  return {
    type: 'Program',
    uses,
    blocks: [],
    extends: [],
    loc: { file: 'test.prs', line: 1, column: 1 },
  };
}

const LOCAL_PATH = '/project';

describe('collectRemoteImports', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return empty array when entry file does not exist', async () => {
    mockExistsSync.mockReturnValue(false);

    const result = await collectRemoteImports('/project/project.prs', {
      localPath: LOCAL_PATH,
    });

    expect(result).toEqual([]);
  });

  it('should return empty array when entry file has no @use statements', async () => {
    mockExistsSync.mockReturnValue(true);
    mockReadFile.mockResolvedValue('@meta\n  name: test');
    mockParse.mockReturnValue({ ast: program([]), errors: [] });

    const result = await collectRemoteImports('/project/project.prs', {
      localPath: LOCAL_PATH,
    });

    expect(result).toEqual([]);
  });

  it('should collect direct github.com @use imports', async () => {
    mockExistsSync.mockReturnValue(true);
    mockReadFile.mockResolvedValue('@use github.com/org/repo/skills');
    mockParse.mockReturnValue({
      ast: program([
        useDecl('github.com/org/repo/skills', {
          segments: ['github.com', 'org', 'repo', 'skills'],
        }),
      ]),
      errors: [],
    });

    const result = await collectRemoteImports('/project/project.prs', {
      localPath: LOCAL_PATH,
    });

    expect(result).toEqual([
      { repoUrl: 'https://github.com/org/repo', path: 'skills', version: '' },
    ]);
  });

  it('should follow local @use imports recursively', async () => {
    // project.prs -> ./remote-skills (local) -> github.com/org/repo/skills (remote)
    const knownFiles = new Set(['/project/project.prs', '/project/remote-skills.prs']);
    mockExistsSync.mockImplementation((p: string) => knownFiles.has(p));

    const projectSource = '@use ./remote-skills';
    const remoteSkillsSource = '@use github.com/org/repo/skills';

    mockReadFile.mockImplementation(async (filePath: string) => {
      if (filePath === '/project/project.prs') return projectSource;
      if (filePath === '/project/remote-skills.prs') return remoteSkillsSource;
      throw new Error(`Unexpected read: ${filePath}`);
    });

    mockParse.mockImplementation((source: string) => {
      if (source === projectSource) {
        return {
          ast: program([useDecl('./remote-skills')]),
          errors: [],
        };
      }
      if (source === remoteSkillsSource) {
        return {
          ast: program([
            useDecl('github.com/org/repo/skills', {
              segments: ['github.com', 'org', 'repo', 'skills'],
            }),
          ]),
          errors: [],
        };
      }
      return { ast: program([]), errors: [] };
    });

    const result = await collectRemoteImports('/project/project.prs', {
      localPath: LOCAL_PATH,
    });

    expect(result).toEqual([
      { repoUrl: 'https://github.com/org/repo', path: 'skills', version: '' },
    ]);
  });

  it('should deduplicate imports from the same repo+path', async () => {
    mockExistsSync.mockReturnValue(true);

    const source = '@use github.com/org/repo/skills\n@use github.com/org/repo/skills';
    mockReadFile.mockResolvedValue(source);
    mockParse.mockReturnValue({
      ast: program([
        useDecl('github.com/org/repo/skills', {
          segments: ['github.com', 'org', 'repo', 'skills'],
        }),
        useDecl('github.com/org/repo/skills', {
          segments: ['github.com', 'org', 'repo', 'skills'],
        }),
      ]),
      errors: [],
    });

    const result = await collectRemoteImports('/project/project.prs', {
      localPath: LOCAL_PATH,
    });

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      repoUrl: 'https://github.com/org/repo',
      path: 'skills',
      version: '',
    });
  });

  it('should collect imports from registry aliases when registries config provided', async () => {
    mockExistsSync.mockReturnValue(true);

    const source = '@use @company/guards';
    mockReadFile.mockResolvedValue(source);
    mockParse.mockReturnValue({
      ast: program([
        useDecl('@company/guards', {
          segments: ['guards'],
          namespace: 'company',
          isRelative: false,
        }),
      ]),
      errors: [],
    });

    const result = await collectRemoteImports('/project/project.prs', {
      localPath: LOCAL_PATH,
      registries: {
        '@company': 'github.com/company/promptscript',
      },
    });

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      repoUrl: 'github.com/company/promptscript',
      path: 'guards',
      version: '',
    });
  });

  it('should not recurse into remote imports', async () => {
    // project.prs has both a remote import and a local import.
    // The remote import should NOT be recursed into.
    mockExistsSync.mockReturnValue(true);

    const source = '@use github.com/org/repo/skills\n@use ./local-file';
    const localSource = '@meta\n  name: local';

    mockReadFile.mockImplementation(async (filePath: string) => {
      if (filePath === '/project/project.prs') return source;
      if (filePath === '/project/local-file.prs') return localSource;
      throw new Error(`Unexpected read: ${filePath}`);
    });

    mockParse.mockImplementation((src: string) => {
      if (src === source) {
        return {
          ast: program([
            useDecl('github.com/org/repo/skills', {
              segments: ['github.com', 'org', 'repo', 'skills'],
            }),
            useDecl('./local-file'),
          ]),
          errors: [],
        };
      }
      if (src === localSource) {
        return { ast: program([]), errors: [] };
      }
      return { ast: program([]), errors: [] };
    });

    const result = await collectRemoteImports('/project/project.prs', {
      localPath: LOCAL_PATH,
    });

    // Should only have the one remote import, and should have read both local files
    expect(result).toEqual([
      { repoUrl: 'https://github.com/org/repo', path: 'skills', version: '' },
    ]);
    expect(mockReadFile).toHaveBeenCalledTimes(2);
  });

  it('should skip gracefully when resolveRef throws (path traversal)', async () => {
    mockExistsSync.mockReturnValue(true);

    const source = '@use ../../../../etc/passwd';
    mockReadFile.mockResolvedValue(source);
    mockParse.mockReturnValue({
      ast: program([
        useDecl('../../../../etc/passwd', {
          isRelative: true,
          segments: ['..', '..', '..', '..', 'etc', 'passwd'],
        }),
      ]),
      errors: [],
    });

    const result = await collectRemoteImports('/project/project.prs', {
      localPath: LOCAL_PATH,
    });

    expect(result).toEqual([]);
  });

  it('should handle circular local imports without infinite loop', async () => {
    const knownFiles = new Set(['/project/a.prs', '/project/b.prs']);
    mockExistsSync.mockImplementation((p: string) => knownFiles.has(p));

    const sourceA = '@use ./b';
    const sourceB = '@use ./a';

    mockReadFile.mockImplementation(async (filePath: string) => {
      if (filePath === '/project/a.prs') return sourceA;
      if (filePath === '/project/b.prs') return sourceB;
      throw new Error(`Unexpected read: ${filePath}`);
    });

    mockParse.mockImplementation((source: string) => {
      if (source === sourceA) {
        return { ast: program([useDecl('./b')]), errors: [] };
      }
      if (source === sourceB) {
        return { ast: program([useDecl('./a')]), errors: [] };
      }
      return { ast: program([]), errors: [] };
    });

    const result = await collectRemoteImports('/project/a.prs', {
      localPath: LOCAL_PATH,
    });

    expect(result).toEqual([]);
    // Both files should be read exactly once (no infinite loop)
    expect(mockReadFile).toHaveBeenCalledTimes(2);
  });

  it('should skip gracefully when parse returns null AST', async () => {
    mockExistsSync.mockReturnValue(true);
    mockReadFile.mockResolvedValue('invalid content');
    mockParse.mockReturnValue({ ast: null, errors: [{ message: 'parse error' }] });

    const result = await collectRemoteImports('/project/project.prs', {
      localPath: LOCAL_PATH,
    });

    expect(result).toEqual([]);
  });

  it('should collect versioned remote imports', async () => {
    mockExistsSync.mockReturnValue(true);
    mockReadFile.mockResolvedValue('@use github.com/org/repo/skills@1.2.0');
    mockParse.mockReturnValue({
      ast: program([
        useDecl('github.com/org/repo/skills@1.2.0', {
          segments: ['github.com', 'org', 'repo', 'skills'],
          version: '1.2.0',
        }),
      ]),
      errors: [],
    });

    const result = await collectRemoteImports('/project/project.prs', {
      localPath: LOCAL_PATH,
    });

    // resolveRef splits raw by '/' so the sub-path includes the @version suffix;
    // the version field comes from ref.version
    expect(result).toEqual([
      { repoUrl: 'https://github.com/org/repo', path: 'skills@1.2.0', version: '1.2.0' },
    ]);
  });
});
