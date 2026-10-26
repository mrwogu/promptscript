import { afterEach, describe, expect, it, vi } from 'vitest';
import { existsSync } from 'node:fs';
import { mkdtemp, readFile, rm, utimes, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const renameHook = vi.hoisted(() => ({ before: undefined as undefined | (() => Promise<void>) }));
const openHook = vi.hoisted(() => ({ failOnce: undefined as undefined | Error }));

vi.mock('node:fs/promises', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs/promises')>();
  return {
    ...actual,
    open: async (...args: Parameters<typeof actual.open>) => {
      const failure = openHook.failOnce;
      openHook.failOnce = undefined;
      if (failure) throw failure;
      return actual.open(...args);
    },
    rename: async (from: string, to: string): Promise<void> => {
      const before = renameHook.before;
      renameHook.before = undefined;
      await before?.();
      return actual.rename(from, to);
    },
  };
});

const { acquireProjectLock, ProjectLockBusyError } = await import('./project-lock.js');

const BUSY = 'Another command is running.';
const DEAD_PID = 2 ** 22 + 12345;
const directories: string[] = [];

async function lockPath(): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), 'promptscript-project-lock-'));
  directories.push(directory);
  return join(directory, 'project.lock');
}

const metadata = (pid: number, acquiredAt: number, token: string): string =>
  JSON.stringify({ acquiredAt, pid, token });

afterEach(async () => {
  renameHook.before = undefined;
  openHook.failOnce = undefined;
  for (const directory of directories.splice(0)) {
    await rm(directory, { recursive: true, force: true });
  }
});

describe('acquireProjectLock', () => {
  it('creates the lock and removes it on release', async () => {
    const path = await lockPath();

    const lock = await acquireProjectLock(path, BUSY);
    const held = JSON.parse(await readFile(path, 'utf8')) as { pid: number };
    await lock.release();

    expect(held.pid).toBe(process.pid);
    expect(existsSync(path)).toBe(false);
  });

  it('refuses a lock that a live process holds', async () => {
    const path = await lockPath();
    const lock = await acquireProjectLock(path, BUSY);

    await expect(acquireProjectLock(path, BUSY)).rejects.toThrow(
      expect.objectContaining({ name: 'ProjectLockBusyError', message: BUSY })
    );
    await lock.release();
  });

  it('breaks a lock whose process is gone', async () => {
    const path = await lockPath();
    await writeFile(path, metadata(DEAD_PID, Date.now(), 'dead'));

    const lock = await acquireProjectLock(path, BUSY);

    expect(await readFile(path, 'utf8')).not.toContain('dead');
    await lock.release();
  });

  it('breaks a lock older than 30 minutes even when its process looks alive', async () => {
    const path = await lockPath();
    await writeFile(path, metadata(process.pid, Date.now() - 31 * 60 * 1000, 'old'));

    const lock = await acquireProjectLock(path, BUSY);

    expect(await readFile(path, 'utf8')).not.toContain('old');
    await lock.release();
  });

  it('judges a lock without metadata by its age', async () => {
    const path = await lockPath();
    await writeFile(path, 'not json');

    await expect(acquireProjectLock(path, BUSY)).rejects.toBeInstanceOf(ProjectLockBusyError);

    const old = new Date(Date.now() - 31 * 60 * 1000);
    await utimes(path, old, old);
    const lock = await acquireProjectLock(path, BUSY);
    await lock.release();
  });

  it('reports busy when a fresh lock replaces the stale one during the break', async () => {
    const path = await lockPath();
    await writeFile(path, metadata(DEAD_PID, Date.now(), 'dead'));
    renameHook.before = async () => {
      await writeFile(path, metadata(process.pid, Date.now(), 'fresh'));
    };

    await expect(acquireProjectLock(path, BUSY)).rejects.toBeInstanceOf(ProjectLockBusyError);
    expect(await readFile(path, 'utf8')).toContain('fresh');
  });

  it('treats a lock that is gone right after the failed open as held', async () => {
    const path = await lockPath();
    openHook.failOnce = Object.assign(new Error('exists'), { code: 'EEXIST' });

    await expect(acquireProjectLock(path, BUSY)).rejects.toBeInstanceOf(ProjectLockBusyError);
  });

  it('passes through an error while moving a stale lock aside', async () => {
    const path = await lockPath();
    await writeFile(path, metadata(DEAD_PID, Date.now(), 'dead'));
    renameHook.before = async () => {
      throw Object.assign(new Error('denied'), { code: 'EACCES' });
    };

    await expect(acquireProjectLock(path, BUSY)).rejects.toMatchObject({ code: 'EACCES' });
  });

  it('moves back a fresh lock whose metadata is not written yet', async () => {
    const path = await lockPath();
    await writeFile(path, metadata(DEAD_PID, Date.now(), 'dead'));
    renameHook.before = async () => {
      await writeFile(path, '');
    };

    await expect(acquireProjectLock(path, BUSY)).rejects.toBeInstanceOf(ProjectLockBusyError);
    expect(await readFile(path, 'utf8')).toBe('');
  });

  it('keeps a live lock whose time is a few seconds ahead after a clock step', async () => {
    const path = await lockPath();
    await writeFile(path, metadata(process.pid, Date.now() + 5000, 'ahead'));

    await expect(acquireProjectLock(path, BUSY)).rejects.toBeInstanceOf(ProjectLockBusyError);
    expect(await readFile(path, 'utf8')).toContain('ahead');
  });

  it('breaks a lock that claims to be taken far in the future', async () => {
    const path = await lockPath();
    await writeFile(path, metadata(process.pid, Date.now() + 24 * 60 * 60 * 1000, 'future'));

    const lock = await acquireProjectLock(path, BUSY);

    expect(await readFile(path, 'utf8')).not.toContain('future');
    await lock.release();
  });

  it('leaves a lock alone on release when another holder took it over', async () => {
    const path = await lockPath();
    const lock = await acquireProjectLock(path, BUSY);
    await writeFile(path, metadata(process.pid, Date.now(), 'other'));

    await lock.release();

    expect(await readFile(path, 'utf8')).toContain('other');
  });

  it('passes through errors other than an existing lock', async () => {
    const path = join(await lockPath(), 'missing-directory', 'project.lock');

    await expect(acquireProjectLock(path, BUSY)).rejects.toMatchObject({ code: 'ENOENT' });
  });
});
