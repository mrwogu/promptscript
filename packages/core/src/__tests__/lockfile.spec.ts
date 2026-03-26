import { describe, it, expect } from 'vitest';
import type { LockfileDependency, Lockfile } from '../types/lockfile.js';
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
});
