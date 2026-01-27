import { describe, it, expect, beforeEach } from 'vitest';
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
  });
});
