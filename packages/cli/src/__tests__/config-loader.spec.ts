import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { existsSync } from 'fs';
import { readFile } from 'fs/promises';
import { loadConfig, findConfigFile, CONFIG_FILES } from '../config/loader.js';

// Mock fs modules
vi.mock('fs', () => ({
  existsSync: vi.fn(),
}));

vi.mock('fs/promises', () => ({
  readFile: vi.fn(),
  writeFile: vi.fn(),
  mkdir: vi.fn(),
  rm: vi.fn(),
}));

describe('config/loader', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('CONFIG_FILES', () => {
    it('should export expected config file names', () => {
      expect(CONFIG_FILES).toContain('promptscript.yaml');
      expect(CONFIG_FILES).toContain('promptscript.yml');
      expect(CONFIG_FILES).toContain('.promptscriptrc.yaml');
      expect(CONFIG_FILES).toContain('.promptscriptrc.yml');
    });
  });

  describe('findConfigFile', () => {
    it('should return first matching config file', () => {
      vi.mocked(existsSync)
        .mockReturnValueOnce(false) // promptscript.yaml
        .mockReturnValueOnce(true); // promptscript.yml

      const result = findConfigFile();

      expect(result).toBe('promptscript.yml');
      expect(existsSync).toHaveBeenCalledTimes(2);
    });

    it('should return null when no config file exists', () => {
      vi.mocked(existsSync).mockReturnValue(false);

      const result = findConfigFile();

      expect(result).toBeNull();
      expect(existsSync).toHaveBeenCalledTimes(CONFIG_FILES.length);
    });

    it('should return first file when it exists', () => {
      vi.mocked(existsSync).mockReturnValueOnce(true);

      const result = findConfigFile();

      expect(result).toBe('promptscript.yaml');
      expect(existsSync).toHaveBeenCalledTimes(1);
    });

    it('should use custom path when provided', () => {
      vi.mocked(existsSync).mockReturnValueOnce(true);

      const result = findConfigFile('/custom/config.yaml');

      expect(result).toBe('/custom/config.yaml');
      expect(existsSync).toHaveBeenCalledWith('/custom/config.yaml');
    });

    it('should return null when custom path does not exist', () => {
      vi.mocked(existsSync).mockReturnValueOnce(false);

      const result = findConfigFile('/custom/missing.yaml');

      expect(result).toBeNull();
    });

    it('should check PROMPTSCRIPT_CONFIG environment variable', () => {
      process.env['PROMPTSCRIPT_CONFIG'] = '/env/config.yaml';
      vi.mocked(existsSync).mockReturnValueOnce(true);

      const result = findConfigFile();

      expect(result).toBe('/env/config.yaml');
      expect(existsSync).toHaveBeenCalledWith('/env/config.yaml');
    });

    it('should fall back to default files when env config does not exist', () => {
      process.env['PROMPTSCRIPT_CONFIG'] = '/env/missing.yaml';
      vi.mocked(existsSync)
        .mockReturnValueOnce(false) // env config
        .mockReturnValueOnce(true); // promptscript.yaml

      const result = findConfigFile();

      expect(result).toBe('promptscript.yaml');
    });
  });

  describe('loadConfig', () => {
    it('should throw error when no config file found', async () => {
      vi.mocked(existsSync).mockReturnValue(false);

      await expect(loadConfig()).rejects.toThrow(
        'No PromptScript configuration found. Run: prs init'
      );
    });

    it('should parse valid YAML config', async () => {
      vi.mocked(existsSync).mockReturnValueOnce(true);
      vi.mocked(readFile).mockResolvedValueOnce(`
version: '1'
project:
  id: "test-project"
  team: "frontend"
targets:
  - github
  - claude
registry:
  path: "./registry"
`);

      const config = await loadConfig();

      expect(config.version).toBe('1');
      expect(config.project.id).toBe('test-project');
      expect(config.project.team).toBe('frontend');
      expect(config.targets).toEqual(['github', 'claude']);
      expect(config.registry.path).toBe('./registry');
    });

    it('should throw error for invalid YAML', async () => {
      vi.mocked(existsSync).mockReturnValueOnce(true);
      vi.mocked(readFile).mockResolvedValueOnce(`
invalid yaml:
  - [unclosed bracket
`);

      await expect(loadConfig()).rejects.toThrow(/Failed to parse/);
    });

    it('should throw specific error when custom path not found', async () => {
      vi.mocked(existsSync).mockReturnValue(false);

      await expect(loadConfig('/custom/config.yaml')).rejects.toThrow(
        'Configuration file not found: /custom/config.yaml'
      );
    });

    it('should interpolate environment variables in config', async () => {
      process.env['TEST_PROJECT_ID'] = 'my-project-from-env';
      vi.mocked(existsSync).mockReturnValueOnce(true);
      vi.mocked(readFile).mockResolvedValueOnce(`
version: '1'
project:
  id: "\${TEST_PROJECT_ID}"
`);

      const config = await loadConfig();

      expect(config.project.id).toBe('my-project-from-env');
    });

    it('should use default value for missing environment variable', async () => {
      delete process.env['MISSING_VAR'];
      vi.mocked(existsSync).mockReturnValueOnce(true);
      vi.mocked(readFile).mockResolvedValueOnce(`
version: '1'
project:
  id: "\${MISSING_VAR:-default-id}"
`);

      const config = await loadConfig();

      expect(config.project.id).toBe('default-id');
    });

    it('should warn and use empty string for missing env var without default', async () => {
      delete process.env['MISSING_VAR'];
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      vi.mocked(existsSync).mockReturnValueOnce(true);
      vi.mocked(readFile).mockResolvedValueOnce(`
version: '1'
project:
  id: "\${MISSING_VAR}"
`);

      const config = await loadConfig();

      expect(config.project.id).toBe('');
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("Environment variable 'MISSING_VAR' is not set")
      );
      warnSpy.mockRestore();
    });
  });
});
