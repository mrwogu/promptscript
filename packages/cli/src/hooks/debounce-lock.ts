import { createHash } from 'node:crypto';
import { existsSync, writeFileSync, unlinkSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const STALE_THRESHOLD_MS = 30_000;

export function getLockPath(projectDir: string): string {
  const hash = createHash('md5').update(projectDir).digest('hex').slice(0, 12);
  return join(tmpdir(), `prs-compile-${hash}.lock`);
}

export function acquireLock(projectDir: string): boolean {
  const lockPath = getLockPath(projectDir);
  if (existsSync(lockPath)) {
    try {
      const stat = statSync(lockPath);
      const age = Date.now() - stat.mtimeMs;
      if (age < STALE_THRESHOLD_MS) return false;
      unlinkSync(lockPath);
    } catch {
      /* race condition */
    }
  }
  try {
    writeFileSync(lockPath, String(process.pid), { flag: 'wx' });
    return true;
  } catch {
    return false;
  }
}

export function releaseLock(projectDir: string): void {
  try {
    unlinkSync(getLockPath(projectDir));
  } catch {
    /* already removed */
  }
}
