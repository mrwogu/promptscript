import { describe, it, expect } from 'vitest';
import {
  parseVersion,
  compareVersions,
  isValidVersion,
  formatVersion,
  incrementVersion,
} from '../utils/version.js';

describe('version coverage', () => {
  describe('parseVersion edge cases', () => {
    it('should parse version with complex prerelease', () => {
      const result = parseVersion('1.0.0-rc.1.beta.2');
      expect(result.prerelease).toBe('rc.1.beta.2');
    });

    it('should parse version with numeric-looking prerelease', () => {
      const result = parseVersion('1.0.0-123');
      expect(result.prerelease).toBe('123');
    });

    it('should handle version starting with zeros', () => {
      const result = parseVersion('0.0.0');
      expect(result).toEqual({
        major: 0,
        minor: 0,
        patch: 0,
        prerelease: undefined,
      });
    });
  });

  describe('compareVersions edge cases', () => {
    it('should return 0 when both have same prerelease', () => {
      expect(compareVersions('1.0.0-alpha', '1.0.0-alpha')).toBe(0);
    });

    it('should return 0 when both have no prerelease', () => {
      expect(compareVersions('1.0.0', '1.0.0')).toBe(0);
    });

    it('should handle comparison of prerelease versions', () => {
      // a < b lexically
      expect(compareVersions('1.0.0-a', '1.0.0-b')).toBe(-1);
      // b > a lexically
      expect(compareVersions('1.0.0-b', '1.0.0-a')).toBe(1);
    });

    it('should handle versions where only major differs', () => {
      expect(compareVersions('2.0.0', '1.0.0')).toBe(1);
      expect(compareVersions('1.0.0', '2.0.0')).toBe(-1);
    });

    it('should handle versions where only minor differs', () => {
      expect(compareVersions('1.2.0', '1.1.0')).toBe(1);
      expect(compareVersions('1.1.0', '1.2.0')).toBe(-1);
    });

    it('should handle versions where only patch differs', () => {
      expect(compareVersions('1.0.2', '1.0.1')).toBe(1);
      expect(compareVersions('1.0.1', '1.0.2')).toBe(-1);
    });
  });

  describe('formatVersion', () => {
    it('should format version without prerelease', () => {
      const result = formatVersion({ major: 1, minor: 2, patch: 3 });
      expect(result).toBe('1.2.3');
    });

    it('should format version with prerelease', () => {
      const result = formatVersion({
        major: 1,
        minor: 0,
        patch: 0,
        prerelease: 'beta.1',
      });
      expect(result).toBe('1.0.0-beta.1');
    });

    it('should format version with zeros', () => {
      const result = formatVersion({ major: 0, minor: 0, patch: 0 });
      expect(result).toBe('0.0.0');
    });
  });

  describe('incrementVersion', () => {
    it('should increment major version', () => {
      expect(incrementVersion('1.2.3', 'major')).toBe('2.0.0');
    });

    it('should increment minor version', () => {
      expect(incrementVersion('1.2.3', 'minor')).toBe('1.3.0');
    });

    it('should increment patch version', () => {
      expect(incrementVersion('1.2.3', 'patch')).toBe('1.2.4');
    });

    it('should strip prerelease when incrementing', () => {
      expect(incrementVersion('1.0.0-beta', 'patch')).toBe('1.0.1');
    });

    it('should handle incrementing zero version', () => {
      expect(incrementVersion('0.0.0', 'patch')).toBe('0.0.1');
      expect(incrementVersion('0.0.0', 'minor')).toBe('0.1.0');
      expect(incrementVersion('0.0.0', 'major')).toBe('1.0.0');
    });
  });

  describe('isValidVersion', () => {
    it('should return true for valid versions', () => {
      expect(isValidVersion('0.0.1')).toBe(true);
      expect(isValidVersion('1.0.0-rc.1')).toBe(true);
      expect(isValidVersion('999.999.999')).toBe(true);
    });

    it('should return false for invalid versions', () => {
      expect(isValidVersion('')).toBe(false);
      expect(isValidVersion('1')).toBe(false);
      expect(isValidVersion('1.2')).toBe(false);
      expect(isValidVersion('1.2.3.4')).toBe(false);
      expect(isValidVersion('v1.0.0')).toBe(false);
    });
  });
});
