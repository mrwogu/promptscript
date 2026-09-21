import { createHash } from 'node:crypto';
import { readdir, mkdtemp, readFile, rm, stat, writeFile, lstat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { runManagedOutputWorkerProtocol } from '../managed-output-worker.js';

function sha256(content: string): string {
  return createHash('sha256').update(content).digest('hex');
}

/**
 * Race and hard-failure paths of the guarded operations. Some branches can
 * only run when the filesystem state changes mid-operation or errors
 * unexpectedly, so node:fs is statefully stubbed here. The default mock
 * delegates to the real implementation.
 */
const workerFsState = vi.hoisted(() => ({
  lstatSyncImpl: null as ((path: string) => unknown) | null,
  renameSyncImpl: null as ((from: string, to: string) => void) | null,
  mkdirSyncImpl: null as ((path: string) => void) | null,
  linkSyncImpl: null as ((from: string, to: string) => void) | null,
}));

vi.mock('node:fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs')>();
  return {
    ...actual,
    lstatSync: (path: string) =>
      workerFsState.lstatSyncImpl ? workerFsState.lstatSyncImpl(path) : actual.lstatSync(path),
    renameSync: (from: string, to: string) =>
      workerFsState.renameSyncImpl
        ? workerFsState.renameSyncImpl(from, to)
        : actual.renameSync(from, to),
    mkdirSync: (path: string) =>
      workerFsState.mkdirSyncImpl ? workerFsState.mkdirSyncImpl(path) : actual.mkdirSync(path),
    linkSync: (from: string, to: string) =>
      workerFsState.linkSyncImpl ? workerFsState.linkSyncImpl(from, to) : actual.linkSync(from, to),
  };
});

describe('managed output worker race paths', () => {
  const temporaryDirectories: string[] = [];

  afterEach(async () => {
    workerFsState.lstatSyncImpl = null;
    workerFsState.renameSyncImpl = null;
    workerFsState.mkdirSyncImpl = null;
    workerFsState.linkSyncImpl = null;
    await Promise.all(
      temporaryDirectories
        .splice(0)
        .map((directory) => rm(directory, { recursive: true, force: true }))
    );
  });

  async function createProject(prefix: string): Promise<string> {
    const project = await mkdtemp(join(tmpdir(), prefix));
    temporaryDirectories.push(project);
    return project;
  }

  async function runIn(cwd: string, opArgs: string[], stdinContent?: string): Promise<number> {
    const originalCwd = process.cwd();
    try {
      process.chdir(cwd);
      return runManagedOutputWorkerProtocol(
        opArgs,
        stdinContent === undefined ? undefined : Buffer.from(stdinContent, 'utf-8')
      );
    } finally {
      process.chdir(originalCwd);
    }
  }

  async function expectNoTemporaryFiles(project: string): Promise<void> {
    const entries = await readdir(project);
    expect(entries.filter((entry) => entry.includes('promptscript-'))).toEqual([]);
  }

  it('skips the rewrite when the file identity changes mid-swap', async () => {
    const project = await createProject('worker-race-identity-');
    await writeFile(join(project, 'hooks.json'), 'old', { mode: 0o644 });
    const directory = await stat(project);
    const file = await lstat(join(project, 'hooks.json'));
    // The first lstat must be the real one so the identity checks pass; the
    // second probe (the pre-swap re-check) sees a different file.
    const actual = await vi.importActual<typeof import('node:fs')>('node:fs');
    let lstatCalls = 0;
    workerFsState.lstatSyncImpl = (path: string) => {
      lstatCalls += 1;
      return lstatCalls === 1
        ? actual.lstatSync(path)
        : {
            isFile: () => true,
            isDirectory: () => false,
            isSymbolicLink: () => false,
            dev: directory.dev,
            ino: 999999,
          };
    };

    const code = await runIn(
      project,
      [
        'rewrite',
        'hooks.json',
        String(directory.dev),
        String(directory.ino),
        String(file.dev),
        String(file.ino),
        sha256('old'),
        '',
      ],
      'new'
    );

    expect(code).toBe(0);
    expect(await readFile(join(project, 'hooks.json'), 'utf-8')).toBe('old');
    await expectNoTemporaryFiles(project);
  });

  it('cleans the temporary file and reports failure when the swap rename fails', async () => {
    const project = await createProject('worker-race-rename-');
    await writeFile(join(project, 'hooks.json'), 'old', { mode: 0o644 });
    const directory = await stat(project);
    const file = await lstat(join(project, 'hooks.json'));
    workerFsState.renameSyncImpl = () => {
      throw Object.assign(new Error('rename failed'), { code: 'EACCES' });
    };

    const code = await runIn(
      project,
      [
        'rewrite',
        'hooks.json',
        String(directory.dev),
        String(directory.ino),
        String(file.dev),
        String(file.ino),
        sha256('old'),
        '',
      ],
      'new'
    );

    expect(code).toBe(1);
    expect(await readFile(join(project, 'hooks.json'), 'utf-8')).toBe('old');
    await expectNoTemporaryFiles(project);
  });

  it('reports failure when the rewrite target cannot be examined', async () => {
    const project = await createProject('worker-race-lstat-');
    const directory = await stat(project);
    workerFsState.lstatSyncImpl = () => {
      throw Object.assign(new Error('permission denied'), { code: 'EACCES' });
    };

    const code = await runIn(
      project,
      ['rewrite', 'hooks.json', String(directory.dev), String(directory.ino), '1', '2', 'abc', ''],
      'new'
    );

    expect(code).toBe(1);
  });

  it('skips create when the entry appears between the check and the link', async () => {
    const project = await createProject('worker-race-create-');
    const directory = await stat(project);
    await writeFile(join(project, 'target.sh'), 'original', { mode: 0o755 });
    workerFsState.lstatSyncImpl = () => {
      throw Object.assign(new Error('missing'), { code: 'ENOENT' });
    };

    const code = await runIn(
      project,
      ['create', 'target.sh', String(directory.dev), String(directory.ino), '493'],
      'new content'
    );

    expect(code).toBe(0);
    expect(await readFile(join(project, 'target.sh'), 'utf-8')).toBe('original');
    await expectNoTemporaryFiles(project);
  });

  it('reports failure when directory creation fails hard', async () => {
    const project = await createProject('worker-race-mkdir-');
    const directory = await stat(project);
    workerFsState.mkdirSyncImpl = () => {
      throw Object.assign(new Error('permission denied'), { code: 'EACCES' });
    };

    const code = await runIn(project, [
      'mkdir',
      'hooks',
      String(directory.dev),
      String(directory.ino),
    ]);

    expect(code).toBe(1);
  });

  it('reports failure when the unlink target cannot be examined', async () => {
    const project = await createProject('worker-race-unlink-lstat-');
    const directory = await stat(project);
    workerFsState.lstatSyncImpl = () => {
      throw Object.assign(new Error('permission denied'), { code: 'EACCES' });
    };

    const code = await runIn(project, [
      'unlink',
      'stale.md',
      String(directory.dev),
      String(directory.ino),
      '1',
      '2',
    ]);

    expect(code).toBe(1);
  });

  it('reports failure when the create target cannot be examined', async () => {
    const project = await createProject('worker-race-create-lstat-');
    const directory = await stat(project);
    workerFsState.lstatSyncImpl = () => {
      throw Object.assign(new Error('permission denied'), { code: 'EACCES' });
    };

    const code = await runIn(
      project,
      ['create', 'run.sh', String(directory.dev), String(directory.ino), '493'],
      'hello'
    );

    expect(code).toBe(1);
  });

  it('reports failure when the create link fails hard', async () => {
    const project = await createProject('worker-race-create-link-');
    const directory = await stat(project);
    workerFsState.lstatSyncImpl = () => {
      throw Object.assign(new Error('missing'), { code: 'ENOENT' });
    };
    workerFsState.linkSyncImpl = () => {
      throw Object.assign(new Error('permission denied'), { code: 'EACCES' });
    };

    const code = await runIn(
      project,
      ['create', 'run.sh', String(directory.dev), String(directory.ino), '493'],
      'hello'
    );

    expect(code).toBe(1);
    await expectNoTemporaryFiles(project);
  });
});
