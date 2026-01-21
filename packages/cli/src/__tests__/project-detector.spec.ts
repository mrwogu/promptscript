import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  detectProject,
  detectProjectName,
  detectLanguages,
  detectFrameworks,
} from '../utils/project-detector.js';
import { type CliServices } from '../services.js';

vi.mock('path', () => ({
  basename: vi.fn().mockReturnValue('test-project'),
}));

describe('utils/project-detector', () => {
  let mockServices: CliServices;
  let mockFs: {
    existsSync: any;
    readFile: any;
  };

  beforeEach(() => {
    mockFs = {
      existsSync: vi.fn().mockReturnValue(false),
      readFile: vi.fn(),
    };

    mockServices = {
      fs: mockFs as any,
      prompts: {} as any,
      cwd: '/test',
    };
  });

  describe('detectProjectName', () => {
    it('should detect name from package.json', async () => {
      mockFs.existsSync.mockImplementation((path: string) => path === 'package.json');
      mockFs.readFile.mockResolvedValue('{"name": "my-awesome-project"}');

      const result = await detectProjectName(mockServices);

      expect(result.name).toBe('my-awesome-project');
      expect(result.source).toBe('package.json');
    });

    it('should strip scope from package.json name', async () => {
      mockFs.existsSync.mockImplementation((path: string) => path === 'package.json');
      mockFs.readFile.mockResolvedValue('{"name": "@org/my-package"}');

      const result = await detectProjectName(mockServices);

      expect(result.name).toBe('my-package');
      expect(result.source).toBe('package.json');
    });

    it('should detect name from pyproject.toml', async () => {
      mockFs.existsSync.mockImplementation((path: string) => path === 'pyproject.toml');
      mockFs.readFile.mockResolvedValue('[project]\nname = "python-project"');

      const result = await detectProjectName(mockServices);

      expect(result.name).toBe('python-project');
      expect(result.source).toBe('pyproject.toml');
    });

    it('should detect name from Cargo.toml', async () => {
      mockFs.existsSync.mockImplementation((path: string) => path === 'Cargo.toml');
      mockFs.readFile.mockResolvedValue('[package]\nname = "rust-project"');

      const result = await detectProjectName(mockServices);

      expect(result.name).toBe('rust-project');
      expect(result.source).toBe('cargo.toml');
    });

    it('should detect name from go.mod', async () => {
      mockFs.existsSync.mockImplementation((path: string) => path === 'go.mod');
      mockFs.readFile.mockResolvedValue('module github.com/user/go-project');

      const result = await detectProjectName(mockServices);

      expect(result.name).toBe('go-project');
      expect(result.source).toBe('go.mod');
    });

    it('should fallback to directory name when no manifest found', async () => {
      mockFs.existsSync.mockReturnValue(false);

      const result = await detectProjectName(mockServices);

      expect(result.name).toBe('test-project');
      expect(result.source).toBe('directory');
    });

    it('should handle JSON parse errors gracefully', async () => {
      mockFs.existsSync.mockImplementation((path: string) => path === 'package.json');
      mockFs.readFile.mockResolvedValue('invalid json');

      const result = await detectProjectName(mockServices);

      // Should fallback to directory name
      expect(result.source).toBe('directory');
    });
  });

  describe('detectLanguages', () => {
    it('should detect TypeScript', async () => {
      mockFs.existsSync.mockImplementation(
        (path: string) => path === 'package.json' || path === 'tsconfig.json'
      );

      const languages = await detectLanguages(mockServices);

      expect(languages).toContain('typescript');
      expect(languages).not.toContain('javascript');
    });

    it('should detect Python', async () => {
      mockFs.existsSync.mockImplementation((path: string) => path === 'pyproject.toml');

      const languages = await detectLanguages(mockServices);

      expect(languages).toContain('python');
    });

    it('should detect multiple languages', async () => {
      mockFs.existsSync.mockImplementation(
        (path: string) => path === 'package.json' || path === 'pyproject.toml'
      );

      const languages = await detectLanguages(mockServices);

      expect(languages).toContain('javascript');
      expect(languages).toContain('python');
    });

    it('should return empty array when no language files found', async () => {
      mockFs.existsSync.mockReturnValue(false);

      const languages = await detectLanguages(mockServices);

      expect(languages).toEqual([]);
    });
  });

  describe('detectFrameworks', () => {
    it('should detect Next.js from config file', async () => {
      mockFs.existsSync.mockImplementation((path: string) => path === 'next.config.js');

      const frameworks = await detectFrameworks(mockServices);

      expect(frameworks).toContain('nextjs');
    });

    it('should detect React from package.json', async () => {
      mockFs.existsSync.mockImplementation((path: string) => path === 'package.json');
      mockFs.readFile.mockResolvedValue('{"dependencies": {"react": "^18.0.0"}}');

      const frameworks = await detectFrameworks(mockServices);

      expect(frameworks).toContain('react');
    });

    it('should detect Django from pyproject.toml', async () => {
      mockFs.existsSync.mockImplementation((path: string) => path === 'pyproject.toml');
      mockFs.readFile.mockResolvedValue('[project]\ndependencies = ["django"]');

      const frameworks = await detectFrameworks(mockServices);

      expect(frameworks).toContain('django');
    });

    it('should return empty array when no frameworks detected', async () => {
      mockFs.existsSync.mockReturnValue(false);

      const frameworks = await detectFrameworks(mockServices);

      expect(frameworks).toEqual([]);
    });
  });

  describe('detectProject', () => {
    it('should return complete project info', async () => {
      mockFs.existsSync.mockImplementation(
        (path: string) => path === 'package.json' || path === 'tsconfig.json'
      );
      mockFs.readFile.mockResolvedValue(
        '{"name": "full-project", "dependencies": {"react": "^18.0.0"}}'
      );

      const info = await detectProject(mockServices);

      expect(info.name).toBe('full-project');
      expect(info.source).toBe('package.json');
      expect(info.languages).toContain('typescript');
      expect(info.frameworks).toContain('react');
    });
  });
});
