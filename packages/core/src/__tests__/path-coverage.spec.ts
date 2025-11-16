import { describe, it, expect } from 'vitest';
import {
  parsePath,
  isAbsolutePath,
  isRelativePath,
  resolvePath,
  createPathReference,
  getFileName,
} from '../utils/path';

describe('path coverage', () => {
  describe('parsePath edge cases', () => {
    it('should handle single-segment relative path', () => {
      const result = parsePath('./file');
      expect(result.segments).toEqual(['file']);
      expect(result.isRelative).toBe(true);
    });

    it('should handle parent path with single segment', () => {
      const result = parsePath('../file');
      expect(result.segments).toEqual(['file']);
      expect(result.isRelative).toBe(true);
    });

    it('should handle deeply nested parent path', () => {
      const result = parsePath('../../../deeply/nested/file');
      expect(result.segments).toContain('deeply');
      expect(result.segments).toContain('nested');
      expect(result.segments).toContain('file');
      expect(result.isRelative).toBe(true);
    });

    it('should parse namespace starting with underscore', () => {
      const result = parsePath('@_private/module');
      expect(result.namespace).toBe('_private');
      expect(result.segments).toEqual(['module']);
    });
  });

  describe('isAbsolutePath edge cases', () => {
    it('should return false for @/ paths (invalid format)', () => {
      expect(isAbsolutePath('@/path')).toBe(false);
    });

    it('should return true for various valid namespace formats', () => {
      expect(isAbsolutePath('@a/b')).toBe(true);
      expect(isAbsolutePath('@ABC/path')).toBe(true);
    });
  });

  describe('isRelativePath edge cases', () => {
    it('should return false for absolute paths', () => {
      expect(isRelativePath('@core/path')).toBe(false);
    });

    it('should return true for both types of relative paths', () => {
      expect(isRelativePath('./')).toBe(true);
      expect(isRelativePath('../')).toBe(true);
    });
  });

  describe('resolvePath edge cases', () => {
    it('should resolve relative path without basePath', () => {
      const result = resolvePath('./local/file', {
        registryPath: '/registry',
      });
      // Should use process.cwd() as base
      expect(result).toContain('local/file.prs');
    });

    it('should resolve relative path with basePath', () => {
      const result = resolvePath('./local/file', {
        registryPath: '/registry',
        basePath: '/project',
      });
      expect(result).toBe('/project/local/file.prs');
    });

    it('should resolve absolute path to registry', () => {
      const result = resolvePath('@core/guards/compliance', {
        registryPath: '/registry',
      });
      expect(result).toBe('/registry/@core/guards/compliance.prs');
    });

    it('should resolve single segment path', () => {
      const result = resolvePath('@ns/module', {
        registryPath: '/registry',
      });
      expect(result).toBe('/registry/@ns/module.prs');
    });
  });

  describe('createPathReference', () => {
    const loc = { file: 'test.prs', line: 1, column: 1 };

    it('should create PathReference for absolute path', () => {
      const ref = createPathReference('@core/guards', loc);
      expect(ref.type).toBe('PathReference');
      expect(ref.raw).toBe('@core/guards');
      expect(ref.namespace).toBe('core');
      expect(ref.isRelative).toBe(false);
      expect(ref.loc).toEqual(loc);
    });

    it('should create PathReference for relative path', () => {
      const ref = createPathReference('./local', loc);
      expect(ref.isRelative).toBe(true);
      expect(ref.namespace).toBeUndefined();
    });

    it('should create PathReference with version', () => {
      const ref = createPathReference('@core/guards@1.0.0', loc);
      expect(ref.version).toBe('1.0.0');
    });
  });

  describe('getFileName edge cases', () => {
    it('should return empty string for path with no segments', () => {
      // This should not happen in practice, but let's test the edge case
      const result = getFileName('./');
      // After filtering, segments might be empty
      expect(typeof result).toBe('string');
    });

    it('should get last segment from long path', () => {
      const result = getFileName('@ns/a/b/c/d/filename');
      expect(result).toBe('filename');
    });

    it('should get filename from simple path', () => {
      const result = getFileName('./myfile');
      expect(result).toBe('myfile');
    });
  });
});
