import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { PromptScriptConfig } from '@promptscript/core';
import {
  findPrettierConfig,
  loadPrettierConfig,
  resolvePrettierOptions,
  PRETTIER_CONFIG_FILES,
} from '../prettier/loader.js';

// Mock fs modules
const mockExistsSync = vi.fn();
const mockReadFile = vi.fn();
const mockParseYaml = vi.fn();

vi.mock('fs', () => ({
  existsSync: (...args: unknown[]) => mockExistsSync(...args),
}));

vi.mock('fs/promises', () => ({
  readFile: (...args: unknown[]) => mockReadFile(...args),
}));

vi.mock('yaml', () => ({
  parse: (...args: unknown[]) => mockParseYaml(...args),
}));

describe('prettier/loader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: no files exist
    mockExistsSync.mockReturnValue(false);
    // Default: YAML parser works normally (parse JSON/YAML content)
    mockParseYaml.mockImplementation((content: string) => {
      // Simple YAML-like parsing for tests (handles JSON and simple YAML)
      try {
        return JSON.parse(content);
      } catch {
        // Parse simple key: value YAML
        const result: Record<string, unknown> = {};
        for (const line of content.split('\n')) {
          const match = line.match(/^(\w+):\s*(.+)$/);
          if (match && match[1] && match[2]) {
            const key = match[1];
            const value = match[2];
            if (value === 'true') result[key] = true;
            else if (value === 'false') result[key] = false;
            else if (!isNaN(Number(value))) result[key] = Number(value);
            else result[key] = value;
          }
        }
        return result;
      }
    });
  });

  describe('PRETTIER_CONFIG_FILES', () => {
    it('should contain expected config file names', () => {
      expect(PRETTIER_CONFIG_FILES).toContain('.prettierrc');
      expect(PRETTIER_CONFIG_FILES).toContain('.prettierrc.json');
      expect(PRETTIER_CONFIG_FILES).toContain('.prettierrc.yaml');
      expect(PRETTIER_CONFIG_FILES).toContain('.prettierrc.yml');
      expect(PRETTIER_CONFIG_FILES).toHaveLength(4);
    });
  });

  describe('findPrettierConfig', () => {
    it('should return null when no config file exists', () => {
      mockExistsSync.mockReturnValue(false);

      const result = findPrettierConfig('/test/project');

      expect(result).toBeNull();
    });

    it('should find .prettierrc in current directory', () => {
      mockExistsSync.mockImplementation((path) => {
        return String(path) === '/test/project/.prettierrc';
      });

      const result = findPrettierConfig('/test/project');

      expect(result).toBe('/test/project/.prettierrc');
    });

    it('should find .prettierrc.json in current directory', () => {
      mockExistsSync.mockImplementation((path) => {
        return String(path) === '/test/project/.prettierrc.json';
      });

      const result = findPrettierConfig('/test/project');

      expect(result).toBe('/test/project/.prettierrc.json');
    });

    it('should find .prettierrc.yaml in current directory', () => {
      mockExistsSync.mockImplementation((path) => {
        return String(path) === '/test/project/.prettierrc.yaml';
      });

      const result = findPrettierConfig('/test/project');

      expect(result).toBe('/test/project/.prettierrc.yaml');
    });

    it('should find .prettierrc.yml in current directory', () => {
      mockExistsSync.mockImplementation((path) => {
        return String(path) === '/test/project/.prettierrc.yml';
      });

      const result = findPrettierConfig('/test/project');

      expect(result).toBe('/test/project/.prettierrc.yml');
    });

    it('should prioritize .prettierrc over .prettierrc.json', () => {
      mockExistsSync.mockImplementation((path) => {
        const p = String(path);
        return p === '/test/project/.prettierrc' || p === '/test/project/.prettierrc.json';
      });

      const result = findPrettierConfig('/test/project');

      expect(result).toBe('/test/project/.prettierrc');
    });

    it('should search parent directories', () => {
      mockExistsSync.mockImplementation((path) => {
        // Only parent has the config
        return String(path) === '/test/.prettierrc';
      });

      const result = findPrettierConfig('/test/project');

      expect(result).toBe('/test/.prettierrc');
    });
  });

  describe('loadPrettierConfig', () => {
    it('should parse JSON config file', async () => {
      mockReadFile.mockResolvedValue('{"tabWidth": 4, "proseWrap": "always"}');

      const result = await loadPrettierConfig('/test/.prettierrc.json');

      expect(result).toEqual({
        tabWidth: 4,
        proseWrap: 'always',
      });
    });

    it('should parse YAML config file', async () => {
      mockReadFile.mockResolvedValue('tabWidth: 4\nproseWrap: never');

      const result = await loadPrettierConfig('/test/.prettierrc.yaml');

      expect(result).toEqual({
        tabWidth: 4,
        proseWrap: 'never',
      });
    });

    it('should parse .prettierrc.yml file', async () => {
      mockReadFile.mockResolvedValue('tabWidth: 3\nprintWidth: 100');

      const result = await loadPrettierConfig('/test/.prettierrc.yml');

      expect(result).toEqual({
        tabWidth: 3,
        printWidth: 100,
      });
    });

    it('should parse .prettierrc as YAML (can be JSON or YAML)', async () => {
      mockReadFile.mockResolvedValue('{"tabWidth": 2}');

      const result = await loadPrettierConfig('/test/.prettierrc');

      expect(result).toEqual({
        tabWidth: 2,
      });
    });

    it('should parse .prettierrc as pure YAML', async () => {
      mockReadFile.mockResolvedValue('tabWidth: 2\nprintWidth: 100');

      const result = await loadPrettierConfig('/test/.prettierrc');

      expect(result).toEqual({
        tabWidth: 2,
        printWidth: 100,
      });
    });

    it('should extract only markdown-relevant options', async () => {
      mockReadFile.mockResolvedValue(
        JSON.stringify({
          tabWidth: 4,
          proseWrap: 'always',
          printWidth: 120,
          semi: true,
          singleQuote: true,
        })
      );

      const result = await loadPrettierConfig('/test/.prettierrc.json');

      expect(result).toEqual({
        tabWidth: 4,
        proseWrap: 'always',
        printWidth: 120,
      });
    });

    it('should return null for invalid JSON in .json file', async () => {
      mockReadFile.mockResolvedValue('{ invalid json }');

      const result = await loadPrettierConfig('/test/.prettierrc.json');

      expect(result).toBeNull();
    });

    it('should return null when parsed value is null', async () => {
      mockReadFile.mockResolvedValue('null');

      const result = await loadPrettierConfig('/test/.prettierrc.json');

      expect(result).toBeNull();
    });

    it('should return null when parsed value is not an object', async () => {
      mockReadFile.mockResolvedValue('"just a string"');

      const result = await loadPrettierConfig('/test/.prettierrc.json');

      expect(result).toBeNull();
    });

    it('should return null when file read fails', async () => {
      mockReadFile.mockRejectedValue(new Error('File not found'));

      const result = await loadPrettierConfig('/test/.prettierrc.json');

      expect(result).toBeNull();
    });

    it('should ignore invalid proseWrap values', async () => {
      mockReadFile.mockResolvedValue('{"proseWrap": "invalid", "tabWidth": 2}');

      const result = await loadPrettierConfig('/test/.prettierrc.json');

      expect(result).toEqual({
        tabWidth: 2,
      });
    });

    it('should accept proseWrap: always', async () => {
      mockReadFile.mockResolvedValue('{"proseWrap": "always"}');

      const result = await loadPrettierConfig('/test/.prettierrc.json');

      expect(result).toEqual({ proseWrap: 'always' });
    });

    it('should accept proseWrap: never', async () => {
      mockReadFile.mockResolvedValue('{"proseWrap": "never"}');

      const result = await loadPrettierConfig('/test/.prettierrc.json');

      expect(result).toEqual({ proseWrap: 'never' });
    });

    it('should accept proseWrap: preserve', async () => {
      mockReadFile.mockResolvedValue('{"proseWrap": "preserve"}');

      const result = await loadPrettierConfig('/test/.prettierrc.json');

      expect(result).toEqual({ proseWrap: 'preserve' });
    });

    it('should ignore non-number tabWidth', async () => {
      mockReadFile.mockResolvedValue('{"tabWidth": "four"}');

      const result = await loadPrettierConfig('/test/.prettierrc.json');

      expect(result).toEqual({});
    });

    it('should ignore non-number printWidth', async () => {
      mockReadFile.mockResolvedValue('{"printWidth": "eighty"}');

      const result = await loadPrettierConfig('/test/.prettierrc.json');

      expect(result).toEqual({});
    });

    it('should fallback to JSON parsing for .prettierrc when YAML fails', async () => {
      const jsonContent = '{"tabWidth": 4}';
      mockReadFile.mockResolvedValue(jsonContent);
      // Make YAML parser throw, forcing fallback to JSON.parse
      mockParseYaml.mockImplementation(() => {
        throw new Error('YAML parse error');
      });

      const result = await loadPrettierConfig('/test/.prettierrc');

      expect(result).toEqual({ tabWidth: 4 });
    });

    it('should use JSON fallback when YAML parsing throws for .prettierrc', async () => {
      const jsonContent = '{"tabWidth": 2, "proseWrap": "always"}';
      mockReadFile.mockResolvedValue(jsonContent);
      // Make YAML parser throw, forcing fallback to JSON.parse
      mockParseYaml.mockImplementation(() => {
        throw new Error('Invalid YAML syntax');
      });

      const result = await loadPrettierConfig('/test/.prettierrc');

      expect(result).toEqual({ tabWidth: 2, proseWrap: 'always' });
    });
  });

  describe('resolvePrettierOptions', () => {
    it('should return defaults when no config provided', async () => {
      const result = await resolvePrettierOptions();

      expect(result).toEqual({
        proseWrap: 'preserve',
        tabWidth: 2,
        printWidth: 80,
      });
    });

    it('should return defaults when config has no formatting', async () => {
      const result = await resolvePrettierOptions({
        project: { id: 'test' },
      } as Partial<PromptScriptConfig>);

      expect(result).toEqual({
        proseWrap: 'preserve',
        tabWidth: 2,
        printWidth: 80,
      });
    });

    it('should auto-detect .prettierrc when prettier: true', async () => {
      mockExistsSync.mockImplementation((path) => {
        return String(path) === '/test/.prettierrc';
      });
      mockReadFile.mockResolvedValue('{"tabWidth": 4}');

      const result = await resolvePrettierOptions(
        {
          formatting: { prettier: true },
        } as Partial<PromptScriptConfig>,
        '/test'
      );

      expect(result).toEqual({
        proseWrap: 'preserve',
        tabWidth: 4,
        printWidth: 80,
      });
    });

    it('should use explicit path when prettier is a string', async () => {
      mockExistsSync.mockImplementation((path) => {
        return String(path) === '/test/config/.prettierrc';
      });
      mockReadFile.mockResolvedValue('{"tabWidth": 6, "proseWrap": "always"}');

      const result = await resolvePrettierOptions(
        {
          formatting: { prettier: './config/.prettierrc' },
        } as Partial<PromptScriptConfig>,
        '/test'
      );

      expect(result).toEqual({
        proseWrap: 'always',
        tabWidth: 6,
        printWidth: 80,
      });
    });

    it('should use inline options when prettier is an object', async () => {
      const result = await resolvePrettierOptions({
        formatting: {
          prettier: {
            tabWidth: 8,
            proseWrap: 'never',
            printWidth: 100,
          },
        },
      } as Partial<PromptScriptConfig>);

      expect(result).toEqual({
        proseWrap: 'never',
        tabWidth: 8,
        printWidth: 100,
      });
    });

    it('should override with explicit shorthand options', async () => {
      mockExistsSync.mockImplementation((path) => {
        return String(path) === '/test/.prettierrc';
      });
      mockReadFile.mockResolvedValue('{"tabWidth": 4}');

      const result = await resolvePrettierOptions(
        {
          formatting: {
            prettier: true,
            tabWidth: 6,
            proseWrap: 'always',
          },
        } as Partial<PromptScriptConfig>,
        '/test'
      );

      expect(result).toEqual({
        proseWrap: 'always',
        tabWidth: 6,
        printWidth: 80,
      });
    });

    it('should return defaults when prettier: true but no config found', async () => {
      mockExistsSync.mockReturnValue(false);

      const result = await resolvePrettierOptions(
        {
          formatting: { prettier: true },
        } as Partial<PromptScriptConfig>,
        '/test'
      );

      expect(result).toEqual({
        proseWrap: 'preserve',
        tabWidth: 2,
        printWidth: 80,
      });
    });

    it('should return defaults when explicit path does not exist', async () => {
      mockExistsSync.mockReturnValue(false);

      const result = await resolvePrettierOptions(
        {
          formatting: { prettier: './nonexistent/.prettierrc' },
        } as Partial<PromptScriptConfig>,
        '/test'
      );

      expect(result).toEqual({
        proseWrap: 'preserve',
        tabWidth: 2,
        printWidth: 80,
      });
    });

    it('should only apply defined explicit options', async () => {
      const result = await resolvePrettierOptions({
        formatting: {
          tabWidth: 4,
        },
      } as Partial<PromptScriptConfig>);

      expect(result).toEqual({
        proseWrap: 'preserve',
        tabWidth: 4,
        printWidth: 80,
      });
    });

    it('should merge partial prettier object with defaults', async () => {
      const result = await resolvePrettierOptions({
        formatting: {
          prettier: {
            tabWidth: 4,
          },
        },
      } as Partial<PromptScriptConfig>);

      expect(result).toEqual({
        proseWrap: 'preserve',
        tabWidth: 4,
        printWidth: 80,
      });
    });

    it('should apply printWidth from explicit options', async () => {
      const result = await resolvePrettierOptions({
        formatting: {
          printWidth: 120,
        },
      } as Partial<PromptScriptConfig>);

      expect(result).toEqual({
        proseWrap: 'preserve',
        tabWidth: 2,
        printWidth: 120,
      });
    });

    it('should apply proseWrap from explicit options', async () => {
      const result = await resolvePrettierOptions({
        formatting: {
          proseWrap: 'never',
        },
      } as Partial<PromptScriptConfig>);

      expect(result).toEqual({
        proseWrap: 'never',
        tabWidth: 2,
        printWidth: 80,
      });
    });
  });
});
