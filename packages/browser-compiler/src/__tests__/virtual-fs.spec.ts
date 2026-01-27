import { describe, it, expect, beforeEach } from 'vitest';
import { VirtualFileSystem } from '../virtual-fs.js';

describe('VirtualFileSystem', () => {
  let fs: VirtualFileSystem;

  beforeEach(() => {
    fs = new VirtualFileSystem();
  });

  describe('constructor', () => {
    it('should create empty file system', () => {
      expect(fs.size).toBe(0);
      expect(fs.list()).toEqual([]);
    });

    it('should accept initial files as Map', () => {
      const initial = new Map([
        ['file1.prs', 'content1'],
        ['file2.prs', 'content2'],
      ]);
      const fsWithInit = new VirtualFileSystem(initial);
      expect(fsWithInit.size).toBe(2);
      expect(fsWithInit.read('file1.prs')).toBe('content1');
    });

    it('should accept initial files as Record', () => {
      const initial = {
        'file1.prs': 'content1',
        'file2.prs': 'content2',
      };
      const fsWithInit = new VirtualFileSystem(initial);
      expect(fsWithInit.size).toBe(2);
      expect(fsWithInit.read('file2.prs')).toBe('content2');
    });

    it('should normalize paths in initial files', () => {
      const fsWithInit = new VirtualFileSystem({
        '/leading/slash.prs': 'content1',
        'trailing/slash/': 'content2',
      });
      expect(fsWithInit.exists('leading/slash.prs')).toBe(true);
      expect(fsWithInit.exists('trailing/slash')).toBe(true);
    });
  });

  describe('read/write', () => {
    it('should write and read files', () => {
      fs.write('test.prs', 'hello world');
      expect(fs.read('test.prs')).toBe('hello world');
    });

    it('should throw on reading non-existent file', () => {
      expect(() => fs.read('nonexistent.prs')).toThrow('File not found: nonexistent.prs');
    });

    it('should overwrite existing files', () => {
      fs.write('test.prs', 'original');
      fs.write('test.prs', 'updated');
      expect(fs.read('test.prs')).toBe('updated');
    });

    it('should handle paths with backslashes', () => {
      fs.write('path\\to\\file.prs', 'content');
      expect(fs.read('path/to/file.prs')).toBe('content');
    });

    it('should handle paths with leading slash', () => {
      fs.write('/path/to/file.prs', 'content');
      expect(fs.read('path/to/file.prs')).toBe('content');
    });
  });

  describe('exists', () => {
    it('should return true for existing files', () => {
      fs.write('exists.prs', 'content');
      expect(fs.exists('exists.prs')).toBe(true);
    });

    it('should return false for non-existing files', () => {
      expect(fs.exists('nonexistent.prs')).toBe(false);
    });

    it('should normalize path for existence check', () => {
      fs.write('path/to/file.prs', 'content');
      expect(fs.exists('/path/to/file.prs')).toBe(true);
    });
  });

  describe('delete', () => {
    it('should delete existing files', () => {
      fs.write('todelete.prs', 'content');
      expect(fs.delete('todelete.prs')).toBe(true);
      expect(fs.exists('todelete.prs')).toBe(false);
    });

    it('should return false for non-existing files', () => {
      expect(fs.delete('nonexistent.prs')).toBe(false);
    });
  });

  describe('list', () => {
    it('should list all files', () => {
      fs.write('file1.prs', 'content1');
      fs.write('file2.prs', 'content2');
      fs.write('dir/file3.prs', 'content3');
      expect(fs.list()).toEqual(['file1.prs', 'file2.prs', 'dir/file3.prs']);
    });

    it('should return empty array for empty fs', () => {
      expect(fs.list()).toEqual([]);
    });
  });

  describe('glob', () => {
    beforeEach(() => {
      fs.write('file1.prs', 'content1');
      fs.write('file2.prs', 'content2');
      fs.write('file1.md', 'content3');
      fs.write('dir/file3.prs', 'content4');
      fs.write('dir/sub/file4.prs', 'content5');
    });

    it('should match simple patterns', () => {
      expect(fs.glob('*.prs')).toEqual(['file1.prs', 'file2.prs']);
    });

    it('should match with **', () => {
      // **/*.prs should match any .prs file at any depth
      const matches = fs.glob('**.prs');
      expect(matches).toContain('file1.prs');
      expect(matches).toContain('file2.prs');
      expect(matches).toContain('dir/file3.prs');
      expect(matches).toContain('dir/sub/file4.prs');
      expect(matches.length).toBe(4);
    });

    it('should match specific paths', () => {
      expect(fs.glob('dir/*.prs')).toEqual(['dir/file3.prs']);
    });
  });

  describe('clear', () => {
    it('should clear all files', () => {
      fs.write('file1.prs', 'content1');
      fs.write('file2.prs', 'content2');
      fs.clear();
      expect(fs.size).toBe(0);
      expect(fs.list()).toEqual([]);
    });
  });

  describe('toMap/toObject', () => {
    it('should convert to Map', () => {
      fs.write('file1.prs', 'content1');
      fs.write('file2.prs', 'content2');
      const map = fs.toMap();
      expect(map.get('file1.prs')).toBe('content1');
      expect(map.get('file2.prs')).toBe('content2');
    });

    it('should convert to Object', () => {
      fs.write('file1.prs', 'content1');
      fs.write('file2.prs', 'content2');
      const obj = fs.toObject();
      expect(obj['file1.prs']).toBe('content1');
      expect(obj['file2.prs']).toBe('content2');
    });
  });

  describe('clone', () => {
    it('should create independent copy', () => {
      fs.write('file.prs', 'original');
      const cloned = fs.clone();

      fs.write('file.prs', 'modified');
      expect(cloned.read('file.prs')).toBe('original');
    });
  });

  describe('merge', () => {
    it('should merge another fs', () => {
      fs.write('file1.prs', 'content1');

      const other = new VirtualFileSystem({
        'file2.prs': 'content2',
        'file1.prs': 'overwritten',
      });

      fs.merge(other);
      expect(fs.read('file1.prs')).toBe('overwritten');
      expect(fs.read('file2.prs')).toBe('content2');
    });
  });
});
