import { describe, it, expect, afterEach } from 'vitest';
import { utimesSync, existsSync } from 'node:fs';
import { acquireLock, releaseLock, getLockPath } from '../debounce-lock.js';

const TEST_DIR = '/tmp/prs-test-debounce-lock-project';

afterEach(() => {
  releaseLock(TEST_DIR);
});

describe('getLockPath', () => {
  it('contains prs-compile- prefix and .lock suffix', () => {
    const lockPath = getLockPath(TEST_DIR);
    expect(lockPath).toMatch(/prs-compile-/);
    expect(lockPath).toMatch(/\.lock$/);
  });
});

describe('acquireLock', () => {
  it('acquires lock when none exists and returns true', () => {
    // Arrange: ensure no lock file exists
    releaseLock(TEST_DIR);

    // Act
    const result = acquireLock(TEST_DIR);

    // Assert
    expect(result).toBe(true);
    expect(existsSync(getLockPath(TEST_DIR))).toBe(true);
  });

  it('returns false when lock is already held', () => {
    // Arrange: hold the lock
    acquireLock(TEST_DIR);

    // Act: try to acquire again
    const result = acquireLock(TEST_DIR);

    // Assert
    expect(result).toBe(false);
  });

  it('acquires lock after it has been released', () => {
    // Arrange
    acquireLock(TEST_DIR);
    releaseLock(TEST_DIR);

    // Act
    const result = acquireLock(TEST_DIR);

    // Assert
    expect(result).toBe(true);
  });

  it('acquires lock when existing lock file is stale (older than 30s)', () => {
    // Arrange: create a fresh lock, then backdate it by 31 seconds
    acquireLock(TEST_DIR);
    const lockPath = getLockPath(TEST_DIR);
    const staleTime = new Date(Date.now() - 31_000);
    utimesSync(lockPath, staleTime, staleTime);

    // Act
    const result = acquireLock(TEST_DIR);

    // Assert
    expect(result).toBe(true);
  });
});
