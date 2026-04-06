import { describe, it, expect } from 'vitest';
import type { LockfileDependency, Lockfile, LockfileReference } from '../types/lockfile.js';
import { isValidLockfile, LOCKFILE_VERSION } from '../types/lockfile.js';

describe('LockfileDependency', () => {
  describe('required fields', () => {
    it('should accept a dependency with only required fields', () => {
      const dep: LockfileDependency = {
        version: 'v1.0.0',
        commit: 'abc123def456',
        integrity: 'sha256-abc123',
      };

      expect(dep.version).toBe('v1.0.0');
      expect(dep.commit).toBe('abc123def456');
      expect(dep.integrity).toBe('sha256-abc123');
    });
  });

  describe('optional source field', () => {
    it('should accept a dependency with source set to "md"', () => {
      const dep: LockfileDependency = {
        version: 'v1.0.0',
        commit: 'abc123def456',
        integrity: 'sha256-abc123',
        source: 'md',
      };

      expect(dep.source).toBe('md');
    });

    it('should accept a dependency without source (backward compat)', () => {
      const dep: LockfileDependency = {
        version: 'v1.0.0',
        commit: 'abc123def456',
        integrity: 'sha256-abc123',
      };

      expect(dep.source).toBeUndefined();
    });
  });

  describe('optional fetchedAt field', () => {
    it('should accept a dependency with fetchedAt ISO timestamp', () => {
      const dep: LockfileDependency = {
        version: 'v1.0.0',
        commit: 'abc123def456',
        integrity: 'sha256-abc123',
        fetchedAt: '2026-03-26T12:00:00.000Z',
      };

      expect(dep.fetchedAt).toBe('2026-03-26T12:00:00.000Z');
    });

    it('should accept a dependency without fetchedAt (backward compat)', () => {
      const dep: LockfileDependency = {
        version: 'v1.0.0',
        commit: 'abc123def456',
        integrity: 'sha256-abc123',
      };

      expect(dep.fetchedAt).toBeUndefined();
    });
  });

  describe('optional skills field', () => {
    it('should accept a dependency with skills array', () => {
      const dep: LockfileDependency = {
        version: 'v1.0.0',
        commit: 'abc123def456',
        integrity: 'sha256-abc123',
        skills: ['commit', 'review-pr', 'test'],
      };

      expect(dep.skills).toEqual(['commit', 'review-pr', 'test']);
    });

    it('should accept a dependency with empty skills array', () => {
      const dep: LockfileDependency = {
        version: 'v1.0.0',
        commit: 'abc123def456',
        integrity: 'sha256-abc123',
        skills: [],
      };

      expect(dep.skills).toEqual([]);
    });

    it('should accept a dependency without skills (backward compat)', () => {
      const dep: LockfileDependency = {
        version: 'v1.0.0',
        commit: 'abc123def456',
        integrity: 'sha256-abc123',
      };

      expect(dep.skills).toBeUndefined();
    });
  });

  describe('all optional fields combined', () => {
    it('should accept a dependency with all optional fields set', () => {
      const dep: LockfileDependency = {
        version: 'v1.0.0',
        commit: 'abc123def456',
        integrity: 'sha256-abc123',
        source: 'md',
        fetchedAt: '2026-03-26T12:00:00.000Z',
        skills: ['commit', 'review-pr'],
      };

      expect(dep.source).toBe('md');
      expect(dep.fetchedAt).toBe('2026-03-26T12:00:00.000Z');
      expect(dep.skills).toEqual(['commit', 'review-pr']);
    });
  });
});

describe('isValidLockfile', () => {
  it('should return true for a valid lockfile with standard dependencies', () => {
    const lockfile: Lockfile = {
      version: LOCKFILE_VERSION,
      dependencies: {
        'github.com/org/repo': {
          version: 'v1.0.0',
          commit: 'abc123def456',
          integrity: 'sha256-abc123',
        },
      },
    };

    expect(isValidLockfile(lockfile)).toBe(true);
  });

  it('should return true for a lockfile with extended dependency entries', () => {
    const lockfile = {
      version: LOCKFILE_VERSION,
      dependencies: {
        'github.com/org/repo': {
          version: 'v1.0.0',
          commit: 'abc123def456',
          integrity: 'sha256-abc123',
          source: 'md',
          fetchedAt: '2026-03-26T12:00:00.000Z',
          skills: ['commit'],
        },
      },
    };

    expect(isValidLockfile(lockfile)).toBe(true);
  });

  it('should return true for a lockfile with empty dependencies', () => {
    const lockfile = {
      version: LOCKFILE_VERSION,
      dependencies: {},
    };

    expect(isValidLockfile(lockfile)).toBe(true);
  });

  it('should return false for a lockfile with wrong version', () => {
    const lockfile = {
      version: 999,
      dependencies: {},
    };

    expect(isValidLockfile(lockfile)).toBe(false);
  });

  it('should return false for null', () => {
    expect(isValidLockfile(null)).toBe(false);
  });

  it('should return false for non-object', () => {
    expect(isValidLockfile('not an object')).toBe(false);
  });

  it('should return false for object missing dependencies', () => {
    const lockfile = {
      version: LOCKFILE_VERSION,
    };

    expect(isValidLockfile(lockfile)).toBe(false);
  });

  it('should accept valid lockfile with references section', () => {
    const lockfile = {
      version: LOCKFILE_VERSION,
      dependencies: {},
      references: {
        'https://github.com/org/repo\0ref.md\0v1.0.0': {
          hash: 'sha256-abc123',
          lockedAt: '2026-04-01T12:00:00Z',
        },
      },
    };
    expect(isValidLockfile(lockfile)).toBe(true);
  });

  it('should accept lockfile without references section (backward compat)', () => {
    const lockfile = {
      version: LOCKFILE_VERSION,
      dependencies: {},
    };
    expect(isValidLockfile(lockfile)).toBe(true);
  });

  it('should reject lockfile with non-object references', () => {
    const lockfile = {
      version: LOCKFILE_VERSION,
      dependencies: {},
      references: 'bad',
    };
    expect(isValidLockfile(lockfile)).toBe(false);
  });

  it('should reject lockfile with array references', () => {
    const lockfile = {
      version: LOCKFILE_VERSION,
      dependencies: {},
      references: [],
    };
    expect(isValidLockfile(lockfile)).toBe(false);
  });

  it('should reject lockfile with malformed reference entry', () => {
    const lockfile = {
      version: LOCKFILE_VERSION,
      dependencies: {},
      references: {
        key: { hash: 123 },
      },
    };
    expect(isValidLockfile(lockfile)).toBe(false);
  });

  it('should reject lockfile with non-string lockedAt', () => {
    const lockfile = {
      version: LOCKFILE_VERSION,
      dependencies: {},
      references: {
        key: { hash: 'sha256-abc', lockedAt: 99 },
      },
    };
    expect(isValidLockfile(lockfile)).toBe(false);
  });
});

describe('LockfileReference', () => {
  it('should accept valid reference entry', () => {
    const ref: LockfileReference = {
      hash: 'sha256-abc123def456',
      lockedAt: '2026-04-01T12:00:00Z',
    };
    expect(ref.hash).toBe('sha256-abc123def456');
    expect(ref.lockedAt).toBe('2026-04-01T12:00:00Z');
  });
});
