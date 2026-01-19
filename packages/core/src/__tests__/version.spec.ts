import { describe, it, expect } from 'vitest';
import {
  parseVersion,
  compareVersions,
  isValidVersion,
  formatVersion,
  incrementVersion,
  type SemVer,
} from '../utils/version';

describe('parseVersion', () => {
  it('should parse simple version', () => {
    const result = parseVersion('1.2.3');
    expect(result).toEqual({
      major: 1,
      minor: 2,
      patch: 3,
      prerelease: undefined,
    });
  });

  it('should parse version with prerelease', () => {
    const result = parseVersion('1.0.0-beta.1');
    expect(result).toEqual({
      major: 1,
      minor: 0,
      patch: 0,
      prerelease: 'beta.1',
    });
  });

  it('should parse version with alpha prerelease', () => {
    const result = parseVersion('2.1.0-alpha');
    expect(result).toEqual({
      major: 2,
      minor: 1,
      patch: 0,
      prerelease: 'alpha',
    });
  });

  it('should parse large version numbers', () => {
    const result = parseVersion('100.200.300');
    expect(result).toEqual({
      major: 100,
      minor: 200,
      patch: 300,
      prerelease: undefined,
    });
  });

  it('should throw for invalid versions', () => {
    expect(() => parseVersion('invalid')).toThrow('Invalid semantic version');
    expect(() => parseVersion('1.2')).toThrow('Invalid semantic version');
    expect(() => parseVersion('1.2.3.4')).toThrow('Invalid semantic version');
    expect(() => parseVersion('v1.2.3')).toThrow('Invalid semantic version');
  });
});

describe('compareVersions', () => {
  it('should return 0 for equal versions', () => {
    expect(compareVersions('1.0.0', '1.0.0')).toBe(0);
    expect(compareVersions('2.3.4', '2.3.4')).toBe(0);
  });

  it('should compare major versions', () => {
    expect(compareVersions('2.0.0', '1.0.0')).toBe(1);
    expect(compareVersions('1.0.0', '2.0.0')).toBe(-1);
  });

  it('should compare minor versions', () => {
    expect(compareVersions('1.2.0', '1.1.0')).toBe(1);
    expect(compareVersions('1.1.0', '1.2.0')).toBe(-1);
  });

  it('should compare patch versions', () => {
    expect(compareVersions('1.0.2', '1.0.1')).toBe(1);
    expect(compareVersions('1.0.1', '1.0.2')).toBe(-1);
  });

  it('should treat prerelease as lower than release', () => {
    expect(compareVersions('1.0.0-beta', '1.0.0')).toBe(-1);
    expect(compareVersions('1.0.0', '1.0.0-beta')).toBe(1);
  });

  it('should compare prerelease versions lexically', () => {
    expect(compareVersions('1.0.0-alpha', '1.0.0-beta')).toBe(-1);
    expect(compareVersions('1.0.0-beta', '1.0.0-alpha')).toBe(1);
    expect(compareVersions('1.0.0-beta.1', '1.0.0-beta.1')).toBe(0);
  });
});

describe('isValidVersion', () => {
  it('should return true for valid versions', () => {
    expect(isValidVersion('1.0.0')).toBe(true);
    expect(isValidVersion('1.2.3-beta')).toBe(true);
    expect(isValidVersion('0.0.1')).toBe(true);
  });

  it('should return false for invalid versions', () => {
    expect(isValidVersion('invalid')).toBe(false);
    expect(isValidVersion('1.2')).toBe(false);
    expect(isValidVersion('')).toBe(false);
  });
});

describe('formatVersion', () => {
  it('should format simple version', () => {
    const version: SemVer = { major: 1, minor: 2, patch: 3 };
    expect(formatVersion(version)).toBe('1.2.3');
  });

  it('should format version with prerelease', () => {
    const version: SemVer = { major: 1, minor: 0, patch: 0, prerelease: 'beta' };
    expect(formatVersion(version)).toBe('1.0.0-beta');
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

  it('should reset lower components on major increment', () => {
    expect(incrementVersion('1.5.9', 'major')).toBe('2.0.0');
  });

  it('should reset patch on minor increment', () => {
    expect(incrementVersion('1.5.9', 'minor')).toBe('1.6.0');
  });
});
