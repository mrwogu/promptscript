import { describe, it, expect, vi, beforeEach } from 'vitest';
import { existsSync } from 'fs';
import { readFile } from 'fs/promises';
import {
  detectProject,
  detectProjectName,
  detectLanguages,
  detectFrameworks,
} from '../utils/project-detector';

vi.mock('fs', () => ({
  existsSync: vi.fn(),
}));

vi.mock('fs/promises', () => ({
  readFile: vi.fn(),
}));

vi.mock('path', () => ({
  basename: vi.fn().mockReturnValue('test-project'),
}));

describe('utils/project-detector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('detectProjectName', () => {
    it('should detect name from package.json', async () => {
      vi.mocked(existsSync).mockImplementation((path) => path === 'package.json');
      vi.mocked(readFile).mockResolvedValue('{"name": "my-awesome-project"}');

      const result = await detectProjectName();

      expect(result.name).toBe('my-awesome-project');
      expect(result.source).toBe('package.json');
    });

    it('should strip scope from package.json name', async () => {
      vi.mocked(existsSync).mockImplementation((path) => path === 'package.json');
      vi.mocked(readFile).mockResolvedValue('{"name": "@org/my-package"}');

      const result = await detectProjectName();

      expect(result.name).toBe('my-package');
      expect(result.source).toBe('package.json');
    });

    it('should detect name from pyproject.toml', async () => {
      vi.mocked(existsSync).mockImplementation((path) => path === 'pyproject.toml');
      vi.mocked(readFile).mockResolvedValue('[project]\nname = "python-project"');

      const result = await detectProjectName();

      expect(result.name).toBe('python-project');
      expect(result.source).toBe('pyproject.toml');
    });

    it('should detect name from Cargo.toml', async () => {
      vi.mocked(existsSync).mockImplementation((path) => path === 'Cargo.toml');
      vi.mocked(readFile).mockResolvedValue('[package]\nname = "rust-project"');

      const result = await detectProjectName();

      expect(result.name).toBe('rust-project');
      expect(result.source).toBe('cargo.toml');
    });

    it('should detect name from go.mod', async () => {
      vi.mocked(existsSync).mockImplementation((path) => path === 'go.mod');
      vi.mocked(readFile).mockResolvedValue('module github.com/user/go-project');

      const result = await detectProjectName();

      expect(result.name).toBe('go-project');
      expect(result.source).toBe('go.mod');
    });

    it('should fallback to directory name when no manifest found', async () => {
      vi.mocked(existsSync).mockReturnValue(false);

      const result = await detectProjectName();

      expect(result.name).toBe('test-project');
      expect(result.source).toBe('directory');
    });

    it('should handle JSON parse errors gracefully', async () => {
      vi.mocked(existsSync).mockImplementation((path) => path === 'package.json');
      vi.mocked(readFile).mockResolvedValue('invalid json');

      const result = await detectProjectName();

      // Should fallback to directory name
      expect(result.source).toBe('directory');
    });
  });

  describe('detectLanguages', () => {
    it('should detect TypeScript', async () => {
      vi.mocked(existsSync).mockImplementation(
        (path) => path === 'package.json' || path === 'tsconfig.json'
      );

      const languages = await detectLanguages();

      expect(languages).toContain('typescript');
      expect(languages).not.toContain('javascript');
    });

    it('should detect Python', async () => {
      vi.mocked(existsSync).mockImplementation((path) => path === 'pyproject.toml');

      const languages = await detectLanguages();

      expect(languages).toContain('python');
    });

    it('should detect multiple languages', async () => {
      vi.mocked(existsSync).mockImplementation(
        (path) => path === 'package.json' || path === 'pyproject.toml'
      );

      const languages = await detectLanguages();

      expect(languages).toContain('javascript');
      expect(languages).toContain('python');
    });

    it('should return empty array when no language files found', async () => {
      vi.mocked(existsSync).mockReturnValue(false);

      const languages = await detectLanguages();

      expect(languages).toEqual([]);
    });
  });

  describe('detectFrameworks', () => {
    it('should detect Next.js from config file', async () => {
      vi.mocked(existsSync).mockImplementation((path) => path === 'next.config.js');

      const frameworks = await detectFrameworks();

      expect(frameworks).toContain('nextjs');
    });

    it('should detect React from package.json', async () => {
      vi.mocked(existsSync).mockImplementation((path) => path === 'package.json');
      vi.mocked(readFile).mockResolvedValue('{"dependencies": {"react": "^18.0.0"}}');

      const frameworks = await detectFrameworks();

      expect(frameworks).toContain('react');
    });

    it('should detect Django from pyproject.toml', async () => {
      vi.mocked(existsSync).mockImplementation((path) => path === 'pyproject.toml');
      vi.mocked(readFile).mockResolvedValue('[project]\ndependencies = ["django"]');

      const frameworks = await detectFrameworks();

      expect(frameworks).toContain('django');
    });

    it('should return empty array when no frameworks detected', async () => {
      vi.mocked(existsSync).mockReturnValue(false);

      const frameworks = await detectFrameworks();

      expect(frameworks).toEqual([]);
    });
  });

  describe('detectProject', () => {
    it('should return complete project info', async () => {
      vi.mocked(existsSync).mockImplementation(
        (path) => path === 'package.json' || path === 'tsconfig.json'
      );
      vi.mocked(readFile).mockResolvedValue(
        '{"name": "full-project", "dependencies": {"react": "^18.0.0"}}'
      );

      const info = await detectProject();

      expect(info.name).toBe('full-project');
      expect(info.source).toBe('package.json');
      expect(info.languages).toContain('typescript');
      expect(info.frameworks).toContain('react');
    });
  });
});
