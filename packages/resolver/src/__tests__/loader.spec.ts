import { describe, it, expect } from 'vitest';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { FileLoader } from '../loader.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const FIXTURES_DIR = resolve(__dirname, '__fixtures__');
const REGISTRY_DIR = resolve(__dirname, '__fixtures__/registry');

describe('FileLoader', () => {
  describe('constructor', () => {
    it('should create loader with registry path', () => {
      const loader = new FileLoader({ registryPath: '/registry' });
      expect(loader.getRegistryPath()).toBe('/registry');
    });

    it('should use cwd as default local path', () => {
      const loader = new FileLoader({ registryPath: '/registry' });
      expect(loader.getLocalPath()).toBe(process.cwd());
    });

    it('should use provided local path', () => {
      const loader = new FileLoader({
        registryPath: '/registry',
        localPath: '/local',
      });
      expect(loader.getLocalPath()).toBe('/local');
    });
  });

  describe('load', () => {
    it('should load file content', async () => {
      const loader = new FileLoader({
        registryPath: REGISTRY_DIR,
        localPath: FIXTURES_DIR,
      });

      const content = await loader.load(resolve(FIXTURES_DIR, 'minimal.prs'));
      expect(content).toContain('@meta');
      expect(content).toContain('id: "minimal"');
    });

    it('should throw FileNotFoundError for missing file', async () => {
      const loader = new FileLoader({
        registryPath: REGISTRY_DIR,
        localPath: FIXTURES_DIR,
      });

      await expect(loader.load(resolve(FIXTURES_DIR, 'nonexistent.prs'))).rejects.toThrow(
        'File not found'
      );
    });
  });

  describe('toAbsolutePath', () => {
    it('should return absolute paths unchanged', () => {
      const loader = new FileLoader({
        registryPath: '/registry',
        localPath: '/local',
      });

      expect(loader.toAbsolutePath('/absolute/path.prs')).toBe('/absolute/path.prs');
    });

    it('should resolve registry paths', () => {
      const loader = new FileLoader({
        registryPath: '/registry',
        localPath: '/local',
      });

      expect(loader.toAbsolutePath('@company/frontend')).toBe('/registry/@company/frontend.prs');
    });

    it('should resolve versioned registry paths', () => {
      const loader = new FileLoader({
        registryPath: '/registry',
        localPath: '/local',
      });

      expect(loader.toAbsolutePath('@company/frontend@1.0.0')).toBe(
        '/registry/@company/frontend.prs'
      );
    });

    it('should resolve local paths', () => {
      const loader = new FileLoader({
        registryPath: '/registry',
        localPath: '/local',
      });

      expect(loader.toAbsolutePath('myfile')).toBe('/local/myfile.prs');
    });

    it('should not add .prs extension if already present', () => {
      const loader = new FileLoader({
        registryPath: '/registry',
        localPath: '/local',
      });

      expect(loader.toAbsolutePath('myfile.prs')).toBe('/local/myfile.prs');
    });

    it('should handle nested registry paths', () => {
      const loader = new FileLoader({
        registryPath: '/registry',
        localPath: '/local',
      });

      expect(loader.toAbsolutePath('@company/teams/frontend/base')).toBe(
        '/registry/@company/teams/frontend/base.prs'
      );
    });
  });

  describe('resolveRef', () => {
    it('should resolve relative paths from file location', () => {
      const loader = new FileLoader({
        registryPath: '/registry',
        localPath: '/local',
      });

      const ref = {
        type: 'PathReference' as const,
        raw: './child',
        segments: ['child'],
        isRelative: true,
        loc: { file: '<test>', line: 1, column: 1 },
      };

      expect(loader.resolveRef(ref, '/local/parent.prs')).toBe('/local/child.prs');
    });

    it('should resolve absolute paths', () => {
      const loader = new FileLoader({
        registryPath: '/registry',
        localPath: '/local',
      });

      const ref = {
        type: 'PathReference' as const,
        raw: '@company/base',
        namespace: 'company',
        segments: ['base'],
        isRelative: false,
        loc: { file: '<test>', line: 1, column: 1 },
      };

      expect(loader.resolveRef(ref, '/project/child.prs')).toBe('/registry/@company/base.prs');
    });

    it('should resolve nested relative paths', () => {
      const loader = new FileLoader({
        registryPath: '/registry',
        localPath: '/local',
      });

      const ref = {
        type: 'PathReference' as const,
        raw: '../shared/utils',
        segments: ['..', 'shared', 'utils'],
        isRelative: true,
        loc: { file: '<test>', line: 1, column: 1 },
      };

      // Node's path.resolve normalizes the path
      expect(loader.resolveRef(ref, '/local/src/main.prs')).toBe('/local/shared/utils.prs');
    });

    it('should reject path traversal outside project root', () => {
      const loader = new FileLoader({
        registryPath: '/registry',
        localPath: '/local',
      });

      const ref = {
        type: 'PathReference' as const,
        raw: './../../etc/passwd',
        segments: ['..', '..', 'etc', 'passwd'],
        isRelative: true,
        loc: { file: '<test>', line: 1, column: 1 },
      };

      expect(() => loader.resolveRef(ref, '/local/subdir/file.prs')).toThrow(/path traversal/i);
    });

    it('should allow relative @use from a subdirectory of localPath', () => {
      // Regression: @use ./fragments/workspace from .promptscript/project.prs
      // was incorrectly flagged as path traversal on Windows because the check
      // used hardcoded '/' instead of platform-aware path comparison.
      const loader = new FileLoader({
        registryPath: '/registry',
        localPath: '/project',
      });

      const ref = {
        type: 'PathReference' as const,
        raw: './fragments/workspace',
        segments: ['fragments', 'workspace'],
        isRelative: true,
        loc: { file: '<test>', line: 1, column: 1 },
      };

      // Entry file is in a subdirectory; relative path stays inside project root
      expect(loader.resolveRef(ref, '/project/.promptscript/project.prs')).toBe(
        '/project/.promptscript/fragments/workspace.prs'
      );
    });

    it('should allow ../sibling from a deeply nested subdirectory', () => {
      const loader = new FileLoader({
        registryPath: '/registry',
        localPath: '/project',
      });

      const ref = {
        type: 'PathReference' as const,
        raw: '../shared/base',
        segments: ['..', 'shared', 'base'],
        isRelative: true,
        loc: { file: '<test>', line: 1, column: 1 },
      };

      // Goes up one level from src/ to project root level, still inside localPath
      expect(loader.resolveRef(ref, '/project/src/deep/file.prs')).toBe(
        '/project/src/shared/base.prs'
      );
    });

    it('should reject traversal from deeply nested file', () => {
      const loader = new FileLoader({
        registryPath: '/registry',
        localPath: '/project',
      });

      const ref = {
        type: 'PathReference' as const,
        raw: './../../../etc/shadow',
        segments: ['..', '..', '..', 'etc', 'shadow'],
        isRelative: true,
        loc: { file: '<test>', line: 1, column: 1 },
      };

      expect(() => loader.resolveRef(ref, '/project/a/b/file.prs')).toThrow(/path traversal/i);
    });
  });

  describe('.md extension handling', () => {
    it('should not append .prs to relative resolveRef with .md path', () => {
      const loader = new FileLoader({
        registryPath: '/registry',
        localPath: '/local',
      });

      const ref = {
        type: 'PathReference' as const,
        raw: './SKILL.md',
        segments: ['SKILL.md'],
        isRelative: true,
        loc: { file: '<test>', line: 1, column: 1 },
      };

      expect(loader.resolveRef(ref, '/local/parent.prs')).toBe('/local/SKILL.md');
    });

    it('should not append .prs to resolveRef with ../ and .md path', () => {
      const loader = new FileLoader({
        registryPath: '/registry',
        localPath: '/local',
      });

      const ref = {
        type: 'PathReference' as const,
        raw: '../shared/SKILL.md',
        segments: ['..', 'shared', 'SKILL.md'],
        isRelative: true,
        loc: { file: '<test>', line: 1, column: 1 },
      };

      expect(loader.resolveRef(ref, '/local/src/main.prs')).toBe('/local/shared/SKILL.md');
    });

    it('should not append .prs to toAbsolutePath with registry .md path', () => {
      const loader = new FileLoader({
        registryPath: '/registry',
        localPath: '/local',
      });

      expect(loader.toAbsolutePath('@org/skill.md')).toBe('/registry/@org/skill.md');
    });

    it('should not append .prs to toAbsolutePath with local .md path', () => {
      const loader = new FileLoader({
        registryPath: '/registry',
        localPath: '/local',
      });

      expect(loader.toAbsolutePath('skill.md')).toBe('/local/skill.md');
    });

    it('should still append .prs to paths without .md extension', () => {
      const loader = new FileLoader({
        registryPath: '/registry',
        localPath: '/local',
      });

      const ref = {
        type: 'PathReference' as const,
        raw: './child',
        segments: ['child'],
        isRelative: true,
        loc: { file: '<test>', line: 1, column: 1 },
      };

      expect(loader.resolveRef(ref, '/local/parent.prs')).toBe('/local/child.prs');
      expect(loader.toAbsolutePath('@org/skill')).toBe('/registry/@org/skill.prs');
      expect(loader.toAbsolutePath('skill')).toBe('/local/skill.prs');
    });
  });

  describe('load error handling', () => {
    it('should re-throw non-ENOENT errors', async () => {
      const loader = new FileLoader({
        registryPath: REGISTRY_DIR,
        localPath: FIXTURES_DIR,
      });

      // Try to load a directory instead of a file - causes EISDIR error
      await expect(loader.load(FIXTURES_DIR)).rejects.toThrow();
    });

    it('should throw FileNotFoundError for ENOENT', async () => {
      const loader = new FileLoader({
        registryPath: REGISTRY_DIR,
        localPath: FIXTURES_DIR,
      });

      await expect(
        loader.load(resolve(FIXTURES_DIR, 'definitely-does-not-exist.prs'))
      ).rejects.toThrow('File not found');
    });
  });
});
