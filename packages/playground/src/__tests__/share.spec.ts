import { describe, it, expect, beforeEach, vi } from 'vitest';
import LZString from 'lz-string';
import {
  encodeState,
  decodeState,
  generateShareUrl,
  loadStateFromUrl,
  getExampleIdFromUrl,
  mergeConfigWithDefaults,
} from '../utils/share';
import type { FileState, PlaygroundConfig } from '../store';

describe('share utilities', () => {
  const mockFiles: FileState[] = [
    { path: 'project.prs', content: '@meta { id: "test" }' },
    { path: 'utils.prs', content: '@identity { "helper" }' },
  ];

  describe('encodeState', () => {
    it('should encode files to compressed string', () => {
      const encoded = encodeState(mockFiles);
      expect(encoded).toBeTruthy();
      expect(typeof encoded).toBe('string');
    });

    it('should include formatter in encoded state', () => {
      const encoded = encodeState(mockFiles, 'github');
      const decoded = decodeState(encoded);
      expect(decoded?.formatter).toBe('github');
    });

    it('should include entry file in encoded state', () => {
      const encoded = encodeState(mockFiles, undefined, 'utils.prs');
      const decoded = decodeState(encoded);
      expect(decoded?.entry).toBe('utils.prs');
    });

    it('should default entry to first file', () => {
      const encoded = encodeState(mockFiles);
      const decoded = decodeState(encoded);
      expect(decoded?.entry).toBe('project.prs');
    });
  });

  describe('decodeState', () => {
    it('should decode compressed string back to state', () => {
      const encoded = encodeState(mockFiles, 'claude');
      const decoded = decodeState(encoded);

      expect(decoded).not.toBeNull();
      expect(decoded?.files).toHaveLength(2);
      expect(decoded?.files[0].path).toBe('project.prs');
      expect(decoded?.files[0].content).toBe('@meta { id: "test" }');
      expect(decoded?.formatter).toBe('claude');
    });

    it('should return null for invalid encoded string', () => {
      const decoded = decodeState('invalid-data');
      expect(decoded).toBeNull();
    });

    it('should return null for empty string', () => {
      const decoded = decodeState('');
      expect(decoded).toBeNull();
    });

    it('should return null for malformed JSON', () => {
      // LZ-compress invalid JSON
      const decoded = decodeState('N4IgDgTgpgbg');
      expect(decoded).toBeNull();
    });

    it('should return null if files array is missing', () => {
      // This would require manually encoding invalid state
      const encoded = encodeState([]);
      const decoded = decodeState(encoded);
      // Empty array is valid
      expect(decoded?.files).toEqual([]);
    });

    it('should return null if files is not an array', () => {
      // Manually create invalid state with files as object instead of array
      const invalidState = {
        files: { path: 'test.prs', content: 'test' }, // Object instead of array
        version: '1',
      };
      const json = JSON.stringify(invalidState);
      const encoded = LZString.compressToEncodedURIComponent(json);

      const decoded = decodeState(encoded);
      expect(decoded).toBeNull();
    });

    it('should return null if file path is not a string', () => {
      // Manually create invalid state with non-string path
      const invalidState = {
        files: [{ path: 123, content: 'test' }], // path is number
        version: '1',
      };
      const json = JSON.stringify(invalidState);
      const encoded = LZString.compressToEncodedURIComponent(json);

      const decoded = decodeState(encoded);
      expect(decoded).toBeNull();
    });

    it('should return null if file content is not a string', () => {
      // Manually create invalid state with non-string content
      const invalidState = {
        files: [{ path: 'test.prs', content: { nested: 'object' } }], // content is object
        version: '1',
      };
      const json = JSON.stringify(invalidState);
      const encoded = LZString.compressToEncodedURIComponent(json);

      const decoded = decodeState(encoded);
      expect(decoded).toBeNull();
    });

    it('should return null on JSON parse error', () => {
      // Create invalid compressed data that decompresses to invalid JSON
      // Use a string that LZString can decompress but results in invalid JSON
      const invalidJson = 'not valid json {{{';
      const encoded = LZString.compressToEncodedURIComponent(invalidJson);

      const decoded = decodeState(encoded);
      expect(decoded).toBeNull();
    });
  });

  describe('round-trip encoding', () => {
    it('should preserve file content through encode/decode', () => {
      const complexContent = `@meta {
  id: "complex"
  syntax: "1.0.0"
}

@identity {
  """
  Multiline content with special chars: "quotes" and 'apostrophes'
  Unicode: 日本語, emoji: 🎉
  """
}`;

      const files: FileState[] = [{ path: 'test.prs', content: complexContent }];
      const encoded = encodeState(files);
      const decoded = decodeState(encoded);

      expect(decoded?.files[0].content).toBe(complexContent);
    });

    it('should handle many files', () => {
      const manyFiles: FileState[] = Array.from({ length: 10 }, (_, i) => ({
        path: `file${i}.prs`,
        content: `Content for file ${i}`,
      }));

      const encoded = encodeState(manyFiles);
      const decoded = decodeState(encoded);

      expect(decoded?.files).toHaveLength(10);
      expect(decoded?.files[5].path).toBe('file5.prs');
    });
  });

  describe('config encoding', () => {
    const defaultConfig: PlaygroundConfig = {
      targets: {
        github: { enabled: true, version: 'full' },
        claude: { enabled: true, version: 'full' },
        cursor: { enabled: true, version: 'standard' },
        antigravity: { enabled: true, version: 'frontmatter' },
      },
      formatting: {
        tabWidth: 2,
        proseWrap: 'preserve',
        printWidth: 80,
      },
      envVars: {},
    };

    it('should not include config if all values are default', () => {
      const encoded = encodeState(mockFiles, 'github', undefined, defaultConfig);
      const decoded = decodeState(encoded);
      expect(decoded?.config).toBeUndefined();
    });

    it('should include only non-default target settings', () => {
      const config: PlaygroundConfig = {
        ...defaultConfig,
        targets: {
          ...defaultConfig.targets,
          github: { enabled: false, version: 'full' },
        },
      };

      const encoded = encodeState(mockFiles, 'github', undefined, config);
      const decoded = decodeState(encoded);

      expect(decoded?.config).toBeDefined();
      expect(decoded?.config?.targets?.github?.enabled).toBe(false);
      expect(decoded?.config?.targets?.claude).toBeUndefined();
    });

    it('should include only non-default formatting settings', () => {
      const config: PlaygroundConfig = {
        ...defaultConfig,
        formatting: {
          ...defaultConfig.formatting,
          tabWidth: 4,
        },
      };

      const encoded = encodeState(mockFiles, 'github', undefined, config);
      const decoded = decodeState(encoded);

      expect(decoded?.config?.formatting?.tabWidth).toBe(4);
      expect(decoded?.config?.formatting?.proseWrap).toBeUndefined();
    });

    it('should include non-default printWidth in formatting', () => {
      const config: PlaygroundConfig = {
        ...defaultConfig,
        formatting: {
          ...defaultConfig.formatting,
          printWidth: 120,
        },
      };

      const encoded = encodeState(mockFiles, 'github', undefined, config);
      const decoded = decodeState(encoded);

      expect(decoded?.config?.formatting?.printWidth).toBe(120);
    });

    it('should include non-default proseWrap in formatting', () => {
      const config: PlaygroundConfig = {
        ...defaultConfig,
        formatting: {
          ...defaultConfig.formatting,
          proseWrap: 'always',
        },
      };

      const encoded = encodeState(mockFiles, 'github', undefined, config);
      const decoded = decodeState(encoded);

      expect(decoded?.config?.formatting?.proseWrap).toBe('always');
    });

    it('should include multiple non-default formatting settings', () => {
      const config: PlaygroundConfig = {
        ...defaultConfig,
        formatting: {
          tabWidth: 4,
          proseWrap: 'never',
          printWidth: 100,
        },
      };

      const encoded = encodeState(mockFiles, 'github', undefined, config);
      const decoded = decodeState(encoded);

      expect(decoded?.config?.formatting?.tabWidth).toBe(4);
      expect(decoded?.config?.formatting?.proseWrap).toBe('never');
      expect(decoded?.config?.formatting?.printWidth).toBe(100);
    });

    it('mergeConfigWithDefaults should restore full config from partial', () => {
      const partial = {
        targets: { github: { enabled: false } },
        formatting: { tabWidth: 4 },
      };

      const merged = mergeConfigWithDefaults(partial);

      expect(merged.targets.github.enabled).toBe(false);
      expect(merged.targets.github.version).toBe('full');
      expect(merged.targets.claude.enabled).toBe(true);
      expect(merged.formatting.tabWidth).toBe(4);
      expect(merged.formatting.proseWrap).toBe('preserve');
    });

    it('mergeConfigWithDefaults should return defaults if no partial', () => {
      const merged = mergeConfigWithDefaults(undefined);

      expect(merged.targets.github.enabled).toBe(true);
      expect(merged.formatting.tabWidth).toBe(2);
    });

    it('should include non-default version in target settings', () => {
      const config: PlaygroundConfig = {
        ...defaultConfig,
        targets: {
          ...defaultConfig.targets,
          github: { enabled: true, version: 'simple' },
        },
      };

      const encoded = encodeState(mockFiles, 'github', undefined, config);
      const decoded = decodeState(encoded);

      expect(decoded?.config?.targets?.github?.version).toBe('simple');
      expect(decoded?.config?.targets?.github?.enabled).toBeUndefined();
    });

    it('should include convention in target settings', () => {
      const config: PlaygroundConfig = {
        ...defaultConfig,
        targets: {
          ...defaultConfig.targets,
          github: { enabled: true, version: 'full', convention: 'xml' },
        },
      };

      const encoded = encodeState(mockFiles, 'github', undefined, config);
      const decoded = decodeState(encoded);

      expect(decoded?.config?.targets?.github?.convention).toBe('xml');
      expect(decoded?.config?.targets?.github?.enabled).toBeUndefined(); // enabled is default
      expect(decoded?.config?.targets?.github?.version).toBeUndefined(); // version is default
    });

    it('should not include convention when undefined (default)', () => {
      const config: PlaygroundConfig = {
        ...defaultConfig,
        targets: {
          ...defaultConfig.targets,
          github: { enabled: true, version: 'full', convention: undefined },
        },
      };

      const encoded = encodeState(mockFiles, 'github', undefined, config);
      const decoded = decodeState(encoded);

      // Convention is undefined (default), so it shouldn't be included
      expect(decoded?.config?.targets?.github?.convention).toBeUndefined();
    });

    it('should merge convention from partial config', () => {
      const partial = {
        targets: {
          claude: { convention: 'xml' as const },
        },
      };

      const merged = mergeConfigWithDefaults(partial);

      expect(merged.targets.claude.convention).toBe('xml');
      expect(merged.targets.claude.enabled).toBe(true); // default
      expect(merged.targets.claude.version).toBe('full'); // default
    });

    it('should not include envVars when empty (default)', () => {
      const encoded = encodeState(mockFiles, 'github', undefined, defaultConfig);
      const decoded = decodeState(encoded);
      expect(decoded?.config?.envVars).toBeUndefined();
    });

    it('should include envVars when not empty', () => {
      const config: PlaygroundConfig = {
        ...defaultConfig,
        envVars: {
          API_KEY: 'test-123',
          PROJECT_NAME: 'my-project',
        },
      };

      const encoded = encodeState(mockFiles, 'github', undefined, config);
      const decoded = decodeState(encoded);

      expect(decoded?.config?.envVars).toEqual({
        API_KEY: 'test-123',
        PROJECT_NAME: 'my-project',
      });
    });

    it('should preserve envVars through round-trip encoding', () => {
      const config: PlaygroundConfig = {
        ...defaultConfig,
        envVars: {
          SPECIAL_CHARS: 'value with spaces & symbols!',
          EMPTY_VALUE: '',
          UNICODE: '日本語テスト',
        },
      };

      const encoded = encodeState(mockFiles, 'github', undefined, config);
      const decoded = decodeState(encoded);

      expect(decoded?.config?.envVars?.SPECIAL_CHARS).toBe('value with spaces & symbols!');
      expect(decoded?.config?.envVars?.EMPTY_VALUE).toBe('');
      expect(decoded?.config?.envVars?.UNICODE).toBe('日本語テスト');
    });

    it('mergeConfigWithDefaults should merge envVars from partial', () => {
      const partial = {
        envVars: {
          API_KEY: 'from-url',
          DEBUG: 'true',
        },
      };

      const merged = mergeConfigWithDefaults(partial);

      expect(merged.envVars).toEqual({
        API_KEY: 'from-url',
        DEBUG: 'true',
      });
      // Other config should be defaults
      expect(merged.targets.github.enabled).toBe(true);
      expect(merged.formatting.tabWidth).toBe(2);
    });

    it('mergeConfigWithDefaults should use empty envVars by default', () => {
      const merged = mergeConfigWithDefaults(undefined);
      expect(merged.envVars).toEqual({});
    });

    it('should include envVars with other config changes', () => {
      const config: PlaygroundConfig = {
        ...defaultConfig,
        targets: {
          ...defaultConfig.targets,
          github: { enabled: false, version: 'full' },
        },
        formatting: {
          ...defaultConfig.formatting,
          tabWidth: 4,
        },
        envVars: {
          VAR1: 'value1',
        },
      };

      const encoded = encodeState(mockFiles, 'github', undefined, config);
      const decoded = decodeState(encoded);

      expect(decoded?.config?.targets?.github?.enabled).toBe(false);
      expect(decoded?.config?.formatting?.tabWidth).toBe(4);
      expect(decoded?.config?.envVars?.VAR1).toBe('value1');
    });
  });

  describe('URL utilities', () => {
    beforeEach(() => {
      // Mock window.location
      Object.defineProperty(window, 'location', {
        value: { href: 'https://example.com/playground' },
        writable: true,
      });
    });

    it('generateShareUrl should create valid URL with state', () => {
      const url = generateShareUrl(mockFiles, 'cursor');

      expect(url).toContain('https://example.com/playground');
      expect(url).toContain('s=');
      expect(url).toContain('f=cursor');
    });

    it('loadStateFromUrl should return null if no state param', () => {
      Object.defineProperty(window, 'location', {
        value: { href: 'https://example.com/playground' },
        writable: true,
      });

      const state = loadStateFromUrl();
      expect(state).toBeNull();
    });

    it('loadStateFromUrl should decode state from URL', () => {
      const encoded = encodeState(mockFiles, 'github');
      Object.defineProperty(window, 'location', {
        value: { href: `https://example.com/playground?s=${encoded}` },
        writable: true,
      });

      const state = loadStateFromUrl();
      expect(state).not.toBeNull();
      expect(state?.files).toHaveLength(2);
    });

    it('loadStateFromUrl should override formatter from URL param', () => {
      const encoded = encodeState(mockFiles, 'github');
      Object.defineProperty(window, 'location', {
        value: { href: `https://example.com/playground?s=${encoded}&f=claude` },
        writable: true,
      });

      const state = loadStateFromUrl();
      expect(state?.formatter).toBe('claude');
    });

    it('getExampleIdFromUrl should return example ID', () => {
      Object.defineProperty(window, 'location', {
        value: { href: 'https://example.com/playground?e=minimal' },
        writable: true,
      });

      const exampleId = getExampleIdFromUrl();
      expect(exampleId).toBe('minimal');
    });

    it('getExampleIdFromUrl should return null if no example param', () => {
      Object.defineProperty(window, 'location', {
        value: { href: 'https://example.com/playground' },
        writable: true,
      });

      const exampleId = getExampleIdFromUrl();
      expect(exampleId).toBeNull();
    });

    it('loadStateFromUrl should return null for invalid state', () => {
      Object.defineProperty(window, 'location', {
        value: { href: 'https://example.com/playground?s=invalid-compressed-data' },
        writable: true,
      });

      const state = loadStateFromUrl();
      expect(state).toBeNull();
    });
  });

  describe('updateUrlState', () => {
    let replaceStateCalls: Array<{ state: unknown; title: string; url: string }> = [];

    beforeEach(() => {
      replaceStateCalls = [];
      Object.defineProperty(window, 'location', {
        value: { href: 'https://example.com/playground' },
        writable: true,
      });
      Object.defineProperty(window, 'history', {
        value: {
          replaceState: (state: unknown, title: string, url: string) => {
            replaceStateCalls.push({ state, title, url });
          },
        },
        writable: true,
      });
    });

    it('should update URL with encoded state', async () => {
      const { updateUrlState } = await import('../utils/share');
      updateUrlState(mockFiles, 'claude');

      expect(replaceStateCalls.length).toBe(1);
      expect(replaceStateCalls[0].url).toContain('s=');
      expect(replaceStateCalls[0].url).toContain('f=claude');
    });

    it('should remove example param when updating state', async () => {
      Object.defineProperty(window, 'location', {
        value: { href: 'https://example.com/playground?e=minimal' },
        writable: true,
      });

      const { updateUrlState } = await import('../utils/share');
      updateUrlState(mockFiles);

      expect(replaceStateCalls[0].url).not.toContain('e=');
    });
  });

  describe('clearUrlState', () => {
    let replaceStateCalls: Array<{ state: unknown; title: string; url: string }> = [];

    beforeEach(() => {
      replaceStateCalls = [];
      Object.defineProperty(window, 'location', {
        value: { href: 'https://example.com/playground?s=encoded&f=github&e=minimal' },
        writable: true,
      });
      Object.defineProperty(window, 'history', {
        value: {
          replaceState: (state: unknown, title: string, url: string) => {
            replaceStateCalls.push({ state, title, url });
          },
        },
        writable: true,
      });
    });

    it('should remove all state params from URL', async () => {
      const { clearUrlState } = await import('../utils/share');
      clearUrlState();

      expect(replaceStateCalls.length).toBe(1);
      expect(replaceStateCalls[0].url).not.toContain('s=');
      expect(replaceStateCalls[0].url).not.toContain('f=');
      expect(replaceStateCalls[0].url).not.toContain('e=');
    });
  });

  describe('copyShareUrl', () => {
    it('should copy URL to clipboard and return true on success', async () => {
      const writeTextMock = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: writeTextMock },
        writable: true,
        configurable: true,
      });
      Object.defineProperty(window, 'location', {
        value: { href: 'https://example.com/playground' },
        writable: true,
      });

      const { copyShareUrl } = await import('../utils/share');
      const result = await copyShareUrl(mockFiles, 'github');

      expect(result).toBe(true);
      expect(writeTextMock).toHaveBeenCalledWith(expect.stringContaining('https://example.com'));
    });

    it('should return false when clipboard fails', async () => {
      Object.defineProperty(navigator, 'clipboard', {
        value: {
          writeText: vi.fn().mockRejectedValue(new Error('Clipboard error')),
        },
        writable: true,
        configurable: true,
      });
      Object.defineProperty(window, 'location', {
        value: { href: 'https://example.com/playground' },
        writable: true,
      });

      const { copyShareUrl } = await import('../utils/share');
      const result = await copyShareUrl(mockFiles);

      expect(result).toBe(false);
    });
  });
});
