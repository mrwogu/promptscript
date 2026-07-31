import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { FormatterOutput } from '@promptscript/compiler';
import { join, resolve } from 'node:path';

const { mockLstat, mockOpen, mockReadFile, mockReaddir } = vi.hoisted(() => ({
  mockLstat: vi.fn(),
  mockOpen: vi.fn(),
  mockReadFile: vi.fn(),
  mockReaddir: vi.fn(),
}));

vi.mock('node:fs/promises', () => ({
  lstat: (...args: unknown[]) => mockLstat(...args),
  open: (...args: unknown[]) => mockOpen(...args),
  readFile: (...args: unknown[]) => mockReadFile(...args),
  readdir: (...args: unknown[]) => mockReaddir(...args),
}));

import { cleanupManagedOutputs } from '../managed-output-cleanup.js';

interface MockStat {
  dev: number;
  ino: number;
  isDirectory: () => boolean;
  isFile: () => boolean;
  isSymbolicLink: () => boolean;
}

describe('cleanupManagedOutputs race handling', () => {
  const root = resolve('project');
  const factoryDirectory = join(root, '.factory');
  const rulesDirectory = join(factoryDirectory, 'rules');
  const staleFile = join(rulesDirectory, 'stale.md');
  const hooksFile = join(factoryDirectory, 'hooks.json');
  const pathStats = new Map<string, MockStat>();
  const handleStats = new Map<string, MockStat>();

  beforeEach(() => {
    vi.clearAllMocks();
    pathStats.clear();
    handleStats.clear();

    const rootStat = createStat(1, 1, 'directory');
    const factoryStat = createStat(1, 2, 'directory');
    const rulesStat = createStat(1, 3, 'directory');
    pathStats.set(root, rootStat);
    pathStats.set(factoryDirectory, factoryStat);
    pathStats.set(rulesDirectory, rulesStat);
    handleStats.set(root, rootStat);
    handleStats.set(factoryDirectory, factoryStat);
    handleStats.set(rulesDirectory, rulesStat);

    mockOpen.mockImplementation(async (path: string) => {
      const stat = handleStats.get(path);
      if (!stat) throw createNodeError('ENOENT');
      return {
        close: vi.fn().mockResolvedValue(undefined),
        stat: vi.fn().mockResolvedValue(stat),
      };
    });
    mockLstat.mockImplementation(async (path: string) => {
      const stat = pathStats.get(path);
      if (!stat) throw createNodeError('ENOENT');
      return stat;
    });
    mockReadFile.mockResolvedValue('');
    mockReaddir.mockResolvedValue([]);
  });

  it('should stop when an ancestor directory no longer matches its open handle', async () => {
    pathStats.set(factoryDirectory, createStat(2, 2, 'directory'));

    await expect(cleanupManagedOutputs(createOutputs(), { outputRoot: root })).resolves.toEqual({
      removed: [],
      removedDirectories: [],
    });
    expect(mockReaddir).not.toHaveBeenCalled();
  });

  it('should stop when the managed directory no longer matches its open handle', async () => {
    pathStats.set(rulesDirectory, createStat(2, 3, 'directory'));

    await expect(cleanupManagedOutputs(createOutputs(), { outputRoot: root })).resolves.toEqual({
      removed: [],
      removedDirectories: [],
    });
    expect(mockReaddir).not.toHaveBeenCalled();
  });

  it('should ignore a managed file that disappears before inspection', async () => {
    mockReaddir.mockResolvedValue([{ name: 'stale.md' }]);

    await expect(cleanupManagedOutputs(createOutputs(), { outputRoot: root })).resolves.toEqual({
      removed: [],
      removedDirectories: [],
    });
    expect(mockReadFile).not.toHaveBeenCalled();
  });

  it('should ignore a managed file that disappears before its marker is read', async () => {
    pathStats.set(staleFile, createStat(1, 4, 'file'));
    mockReaddir.mockResolvedValue([{ name: 'stale.md' }]);
    mockReadFile.mockRejectedValue(createNodeError('ENOENT'));

    await expect(cleanupManagedOutputs(createOutputs(), { outputRoot: root })).resolves.toEqual({
      removed: [],
      removedDirectories: [],
    });
    expect(mockReadFile).toHaveBeenCalledWith(staleFile, 'utf-8');
  });

  it('should stop when the managed directory changes while a marker is read', async () => {
    pathStats.set(staleFile, createStat(1, 4, 'file'));
    mockReaddir.mockResolvedValue([{ name: 'stale.md' }]);
    mockReadFile.mockImplementation(async () => {
      pathStats.set(rulesDirectory, createStat(2, 3, 'directory'));
      return '<!-- PromptScript 2026-07-15T00:00:00.000Z | source: project.prs | target: factory - do not edit -->';
    });

    await expect(cleanupManagedOutputs(createOutputs(), { outputRoot: root })).resolves.toEqual({
      removed: [],
      removedDirectories: [],
    });
  });

  it('should preserve a generated file whose identity changes before deletion', async () => {
    const originalStat = createStat(1, 4, 'file');
    const replacementStat = createStat(1, 5, 'file');
    let fileStatCalls = 0;
    mockLstat.mockImplementation(async (path: string) => {
      if (path === staleFile) {
        fileStatCalls += 1;
        return fileStatCalls === 1 ? originalStat : replacementStat;
      }
      const stat = pathStats.get(path);
      if (!stat) throw createNodeError('ENOENT');
      return stat;
    });
    mockReadFile.mockResolvedValue(
      '<!-- PromptScript 2026-07-15T00:00:00.000Z | source: project.prs | target: factory - do not edit -->'
    );
    mockReaddir.mockResolvedValue([{ name: 'stale.md' }]);

    await expect(cleanupManagedOutputs(createOutputs(), { outputRoot: root })).resolves.toEqual({
      removed: [],
      removedDirectories: [],
    });
    expect(fileStatCalls).toBe(2);
  });

  it('should stop exact-file cleanup when an ancestor changes after opening', async () => {
    pathStats.set(hooksFile, createStat(1, 4, 'file'));
    mockReadFile.mockResolvedValue(ownedHooksJson());
    let factoryStatCalls = 0;
    mockLstat.mockImplementation(async (path: string) => {
      if (path === factoryDirectory) {
        factoryStatCalls += 1;
        return factoryStatCalls === 1
          ? pathStats.get(factoryDirectory)!
          : createStat(2, 2, 'directory');
      }
      const stat = pathStats.get(path);
      if (!stat) throw createNodeError('ENOENT');
      return stat;
    });

    await expect(cleanupManagedOutputs(createHookOutputs(), { outputRoot: root })).resolves.toEqual(
      {
        removed: [],
        removedDirectories: [],
      }
    );
  });

  it('should stop exact-file cleanup when its parent is no longer a directory', async () => {
    pathStats.set(hooksFile, createStat(1, 4, 'file'));
    mockReadFile.mockResolvedValue(ownedHooksJson());
    let factoryStatCalls = 0;
    mockLstat.mockImplementation(async (path: string) => {
      if (path === factoryDirectory) {
        factoryStatCalls += 1;
        return factoryStatCalls <= 2 ? pathStats.get(factoryDirectory)! : createStat(1, 2, 'file');
      }
      const stat = pathStats.get(path);
      if (!stat) throw createNodeError('ENOENT');
      return stat;
    });

    await expect(cleanupManagedOutputs(createHookOutputs(), { outputRoot: root })).resolves.toEqual(
      {
        removed: [],
        removedDirectories: [],
      }
    );
  });
});

function createOutputs(): Map<string, FormatterOutput> {
  return new Map([
    [
      'AGENTS.md',
      {
        path: 'AGENTS.md',
        content: '# AGENTS.md\n',
        managedOutputDirectories: ['.factory/rules'],
      },
    ],
  ]);
}

function createHookOutputs(): Map<string, FormatterOutput> {
  return new Map([
    [
      'AGENTS.md',
      {
        path: 'AGENTS.md',
        content: '# AGENTS.md\n',
        managedOutputFiles: ['.factory/hooks.json'],
      },
    ],
  ]);
}

function ownedHooksJson(): string {
  return '{"hooks":{"PreToolUse":[{"hooks":[{"type":"command","command":"echo ok # promptscript-generated:test"}]}]}}';
}

function createStat(dev: number, ino: number, type: 'directory' | 'file'): MockStat {
  return {
    dev,
    ino,
    isDirectory: () => type === 'directory',
    isFile: () => type === 'file',
    isSymbolicLink: () => false,
  };
}

function createNodeError(code: string): NodeJS.ErrnoException {
  return Object.assign(new Error(code), { code });
}
