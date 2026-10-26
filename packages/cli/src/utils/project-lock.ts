import { randomUUID } from 'node:crypto';
import { open, readFile, rename, rm, stat, type FileHandle } from 'node:fs/promises';

/** A lock older than this is stale even when its process id still looks alive. */
const PROJECT_LOCK_STALE_MS = 30 * 60 * 1000;

/** Thrown when another process holds the lock and it is not stale. */
export class ProjectLockBusyError extends Error {
  constructor(message: string, cause?: unknown) {
    super(message, cause instanceof Error ? { cause } : undefined);
    this.name = 'ProjectLockBusyError';
  }
}

/** A held project lock. Call `release()` in a `finally` block. */
export interface ProjectLock {
  readonly path: string;
  release(): Promise<void>;
}

interface LockMetadata {
  acquiredAt: number;
  pid: number;
  token: string;
}

function getErrorCode(error: unknown): string | undefined {
  if (error instanceof Error && 'code' in error) {
    const code = (error as { code?: unknown }).code;
    return typeof code === 'string' ? code : undefined;
  }
  return undefined;
}

function isProcessAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return getErrorCode(error) === 'EPERM';
  }
}

function isLockMetadata(value: unknown): value is LockMetadata {
  return (
    typeof value === 'object' &&
    value !== null &&
    'acquiredAt' in value &&
    typeof value.acquiredAt === 'number' &&
    'pid' in value &&
    typeof value.pid === 'number' &&
    'token' in value &&
    typeof value.token === 'string'
  );
}

function parseLockMetadata(text: string): LockMetadata | undefined {
  try {
    const parsed: unknown = JSON.parse(text);
    return isLockMetadata(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
}

async function readLockMetadata(lockPath: string): Promise<LockMetadata | undefined> {
  try {
    return parseLockMetadata(await readFile(lockPath, 'utf-8'));
  } catch {
    return undefined;
  }
}

/** The lock vanished between the failed open and the stale check: just try again. */
const LOCK_GONE = Symbol('lock-gone');

function isExpired(acquiredAt: number): boolean {
  const age = Date.now() - acquiredAt;
  // A clock can step back a little (NTP, wake, VM resume) under a live lock; only a time
  // far in the future is a broken or hand-made lock.
  return age < -PROJECT_LOCK_STALE_MS || age > PROJECT_LOCK_STALE_MS;
}

/**
 * The token of a stale lock, `''` for a stale lock without metadata, or undefined when
 * the lock is live.
 */
async function staleLockToken(lockPath: string): Promise<string | typeof LOCK_GONE | undefined> {
  let metadata: LockMetadata | undefined;
  try {
    metadata = parseLockMetadata(await readFile(lockPath, 'utf-8'));
  } catch (error) {
    // Released between the failed open and this read, or taken again: treat it as held.
    if (getErrorCode(error) === 'ENOENT') return undefined;
  }
  if (metadata && Number.isInteger(metadata.pid) && metadata.pid > 0) {
    // A recycled PID can look alive forever, so age still expires the lock.
    const stale =
      !isProcessAlive(metadata.pid) ||
      (Number.isFinite(metadata.acquiredAt) && isExpired(metadata.acquiredAt));
    return stale ? metadata.token : undefined;
  }
  try {
    return isExpired((await stat(lockPath)).mtimeMs) ? '' : undefined;
  } catch (error) {
    return getErrorCode(error) === 'ENOENT' ? LOCK_GONE : undefined;
  }
}

/**
 * Whether a moved lock file is still the stale lock. A fresh lock taken in between has
 * another token, or no metadata yet if its holder has not written it; both are not ours.
 */
async function isStaleLock(path: string, staleToken: string): Promise<boolean> {
  const moved = await readLockMetadata(path);
  if (moved !== undefined) return moved.token === staleToken;
  if (staleToken !== '') return false;
  try {
    return isExpired((await stat(path)).mtimeMs);
  } catch {
    return false;
  }
}

/**
 * Move a stale lock aside and delete it. The quarantined file is checked again before
 * deletion: when it is not the stale lock any more, it is moved back and reported as busy.
 */
async function breakStaleLock(lockPath: string, staleToken: string): Promise<void> {
  const quarantinePath = `${lockPath}.stale-${process.pid}-${randomUUID()}`;
  try {
    await rename(lockPath, quarantinePath);
  } catch (error) {
    if (getErrorCode(error) === 'ENOENT') return;
    throw error;
  }
  if (!(await isStaleLock(quarantinePath, staleToken))) {
    await rename(quarantinePath, lockPath).catch(() => {
      // The fresh holder releases by token, so a lock we could not move back is removed by nobody
      // and expires as stale.
    });
    throw new ProjectLockBusyError('lock-taken');
  }
  await rm(quarantinePath, { force: true });
}

/**
 * Create the lock file. Returns undefined after breaking a stale lock, so the caller
 * tries once more.
 */
async function openLock(lockPath: string, busyMessage: string): Promise<FileHandle | undefined> {
  try {
    return await open(lockPath, 'wx', 0o600);
  } catch (error) {
    if (getErrorCode(error) !== 'EEXIST') {
      throw error;
    }
    const staleToken = await staleLockToken(lockPath);
    if (staleToken === undefined) {
      throw new ProjectLockBusyError(busyMessage, error);
    }
    if (staleToken === LOCK_GONE) return undefined;
    try {
      await breakStaleLock(lockPath, staleToken);
    } catch (breakError) {
      throw breakError instanceof ProjectLockBusyError
        ? new ProjectLockBusyError(busyMessage, error)
        : breakError;
    }
    return undefined;
  }
}

/** Write the metadata into a fresh lock file; on failure the file is removed again. */
async function writeLockMetadata(file: FileHandle, lockPath: string): Promise<LockMetadata> {
  const metadata: LockMetadata = { acquiredAt: Date.now(), pid: process.pid, token: randomUUID() };
  try {
    await file.writeFile(JSON.stringify(metadata), 'utf-8');
  } catch (error) {
    await file.close().catch(() => {
      // Best-effort close must not hide the write error.
    });
    await rm(lockPath, { force: true }).catch(() => {
      // Best-effort cleanup must not hide the write error.
    });
    throw error;
  }
  return metadata;
}

/**
 * Take an exclusive lock file for a project-wide transaction.
 *
 * The file is created with `wx`, so two processes never both own it. A lock left by a
 * process that is gone, or older than 30 minutes, is broken. When the lock is held,
 * a {@link ProjectLockBusyError} with `busyMessage` is thrown.
 */
export async function acquireProjectLock(
  lockPath: string,
  busyMessage: string
): Promise<ProjectLock> {
  const file = (await openLock(lockPath, busyMessage)) ?? (await openLock(lockPath, busyMessage));
  if (file === undefined) {
    // Both attempts found a lock again right after breaking a stale one.
    throw new ProjectLockBusyError(busyMessage);
  }
  const { token } = await writeLockMetadata(file, lockPath);
  return {
    path: lockPath,
    async release(): Promise<void> {
      await file.close().catch(() => {
        // Best-effort close must not leave the project lock behind.
      });
      const current = await readLockMetadata(lockPath);
      if (current?.token === token) {
        await rm(lockPath, { force: true }).catch(() => {
          // Best-effort cleanup allows stale-lock recovery on the next invocation.
        });
      }
    },
  };
}
