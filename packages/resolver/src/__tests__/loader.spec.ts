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

      expect(loader.resolveRef(ref, '/project/parent.prs')).toBe('/project/child.prs');
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
      expect(loader.resolveRef(ref, '/project/src/main.prs')).toBe('/project/shared/utils.prs');
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
