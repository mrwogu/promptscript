import { describe, it, expect, vi, beforeEach } from 'vitest';
import { existsSync } from 'fs';
import { readFile } from 'fs/promises';
import { loadConfig, findConfigFile, CONFIG_FILES } from '../config/loader';

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
  beforeEach(() => {
    vi.clearAllMocks();
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
  });
});
