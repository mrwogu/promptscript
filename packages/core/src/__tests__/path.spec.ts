import { describe, it, expect } from 'vitest';
import {
  parsePath,
  isAbsolutePath,
  isRelativePath,
  resolvePath,
  createPathReference,
  getFileName,
  formatPath,
} from '../utils/path.js';

describe('parsePath', () => {
  describe('absolute paths', () => {
    it('should parse simple namespace path', () => {
      const result = parsePath('@core/guards');
      expect(result).toEqual({
        namespace: 'core',
        segments: ['guards'],
        version: undefined,
        isRelative: false,
      });
    });

    it('should parse namespace path with multiple segments', () => {
      const result = parsePath('@core/guards/compliance');
      expect(result).toEqual({
        namespace: 'core',
        segments: ['guards', 'compliance'],
        version: undefined,
        isRelative: false,
      });
    });

    it('should parse versioned path', () => {
      const result = parsePath('@core/guards/compliance@1.0.0');
      expect(result).toEqual({
        namespace: 'core',
        segments: ['guards', 'compliance'],
        version: '1.0.0',
        isRelative: false,
      });
    });

    it('should parse namespace with underscores and hyphens', () => {
      const result = parsePath('@my_org-namespace/path');
      expect(result).toEqual({
        namespace: 'my_org-namespace',
        segments: ['path'],
        version: undefined,
        isRelative: false,
      });
    });

    it('should throw for invalid path format', () => {
      expect(() => parsePath('invalid')).toThrow('Invalid path format');
      expect(() => parsePath('@/path')).toThrow('Invalid path format');
      expect(() => parsePath('@123invalid/path')).toThrow('Invalid path format');
    });
  });

  describe('relative paths', () => {
    it('should parse simple relative path', () => {
      const result = parsePath('./local');
      expect(result).toEqual({
        namespace: undefined,
        segments: ['local'],
        version: undefined,
        isRelative: true,
      });
    });

    it('should parse relative path with multiple segments', () => {
      const result = parsePath('./local/file');
      expect(result).toEqual({
        namespace: undefined,
        segments: ['local', 'file'],
        version: undefined,
        isRelative: true,
      });
    });

    it('should parse parent relative path', () => {
      const result = parsePath('../parent/file');
      expect(result).toEqual({
        namespace: undefined,
        segments: ['parent', 'file'],
        version: undefined,
        isRelative: true,
      });
    });
  });
});

describe('isAbsolutePath', () => {
  it('should return true for absolute paths', () => {
    expect(isAbsolutePath('@core/guards')).toBe(true);
    expect(isAbsolutePath('@namespace/path')).toBe(true);
  });

  it('should return false for relative paths', () => {
    expect(isAbsolutePath('./local')).toBe(false);
    expect(isAbsolutePath('../parent')).toBe(false);
  });

  it('should return false for @/ paths', () => {
    expect(isAbsolutePath('@/something')).toBe(false);
  });
});

describe('isRelativePath', () => {
  it('should return true for relative paths', () => {
    expect(isRelativePath('./local')).toBe(true);
    expect(isRelativePath('../parent')).toBe(true);
  });

  it('should return false for absolute paths', () => {
    expect(isRelativePath('@core/guards')).toBe(false);
    expect(isRelativePath('/absolute/path')).toBe(false);
  });
});

describe('resolvePath', () => {
  const options = {
    registryPath: '/registry',
    basePath: '/project',
  };

  it('should resolve absolute path to registry location', () => {
    const result = resolvePath('@core/guards/compliance', options);
    expect(result).toBe('/registry/@core/guards/compliance.prs');
  });

  it('should resolve relative path to base location', () => {
    const result = resolvePath('./local/file', options);
    expect(result).toBe('/project/local/file.prs');
  });

  it('should use cwd when basePath not provided', () => {
    const result = resolvePath('./local/file', { registryPath: '/registry' });
    expect(result).toContain('/local/file.prs');
  });
});

describe('createPathReference', () => {
  const loc = { file: 'test.prs', line: 1, column: 1 };

  it('should create PathReference for absolute path', () => {
    const result = createPathReference('@core/guards@1.0.0', loc);
    expect(result).toEqual({
      type: 'PathReference',
      raw: '@core/guards@1.0.0',
      namespace: 'core',
      segments: ['guards'],
      version: '1.0.0',
      isRelative: false,
      loc,
    });
  });

  it('should create PathReference for relative path', () => {
    const result = createPathReference('./local/file', loc);
    expect(result).toEqual({
      type: 'PathReference',
      raw: './local/file',
      namespace: undefined,
      segments: ['local', 'file'],
      version: undefined,
      isRelative: true,
      loc,
    });
  });
});

describe('getFileName', () => {
  it('should return last segment for absolute path', () => {
    expect(getFileName('@core/guards/compliance')).toBe('compliance');
  });

  it('should return last segment for relative path', () => {
    expect(getFileName('./local/file')).toBe('file');
  });

  it('should return single segment', () => {
    expect(getFileName('@core/guards')).toBe('guards');
  });
});

describe('formatPath', () => {
  it('should format absolute path without version', () => {
    const result = formatPath({
      namespace: 'core',
      segments: ['guards', 'compliance'],
      isRelative: false,
    });
    expect(result).toBe('@core/guards/compliance');
  });

  it('should format absolute path with version', () => {
    const result = formatPath({
      namespace: 'core',
      segments: ['guards'],
      version: '1.0.0',
      isRelative: false,
    });
    expect(result).toBe('@core/guards@1.0.0');
  });

  it('should format relative path', () => {
    const result = formatPath({
      segments: ['local', 'file'],
      isRelative: true,
    });
    expect(result).toBe('./local/file');
  });

  it('should round-trip with parsePath for absolute paths', () => {
    const original = '@core/guards/compliance@1.0.0';
    const parsed = parsePath(original);
    const formatted = formatPath(parsed);
    expect(formatted).toBe(original);
  });

  it('should round-trip with parsePath for relative paths', () => {
    const original = './local/file';
    const parsed = parsePath(original);
    const formatted = formatPath(parsed);
    expect(formatted).toBe(original);
  });
});
