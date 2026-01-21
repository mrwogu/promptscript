import { describe, it, expect, beforeEach } from 'vitest';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { CircularDependencyError } from '@promptscript/core';
import { Resolver, createResolver } from '../resolver.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const FIXTURES_DIR = resolve(__dirname, '__fixtures__');

describe('Resolver', () => {
  let resolver: Resolver;

  beforeEach(() => {
    resolver = new Resolver({
      registryPath: resolve(FIXTURES_DIR, 'registry'),
      localPath: FIXTURES_DIR,
      cache: false,
    });
  });

  describe('constructor', () => {
    it('should create resolver with options', () => {
      const r = createResolver({
        registryPath: '/registry',
        localPath: '/local',
      });
      expect(r).toBeInstanceOf(Resolver);
    });

    it('should provide access to loader', () => {
      const loader = resolver.getLoader();
      expect(loader.getRegistryPath()).toBe(resolve(FIXTURES_DIR, 'registry'));
    });
  });

  describe('resolve', () => {
    it('should resolve a minimal file', async () => {
      const result = await resolver.resolve('./minimal.prs');

      expect(result.ast).not.toBeNull();
      expect(result.errors).toHaveLength(0);
      expect(result.sources).toHaveLength(1);
      expect(result.ast?.meta?.fields?.['id']).toBe('minimal');
    });

    it('should resolve file with inheritance', async () => {
      const result = await resolver.resolve('./child.prs');

      expect(result.ast).not.toBeNull();
      expect(result.errors).toHaveLength(0);
      expect(result.sources).toHaveLength(2);

      // Check meta merged
      expect(result.ast?.meta?.fields?.['id']).toBe('child');
      expect(result.ast?.meta?.fields?.['syntax']).toBe('1.0.0');

      // Check blocks merged
      const identityBlock = result.ast?.blocks.find((b) => b.name === 'identity');
      expect(identityBlock).toBeDefined();

      // Identity should have merged text (parent + child)
      const identityContent = identityBlock?.content;
      if (identityContent?.type === 'TextContent') {
        expect(identityContent.value).toContain('base assistant');
        expect(identityContent.value).toContain('specialized child assistant');
      }

      // Standards should be merged
      const standardsBlock = result.ast?.blocks.find((b) => b.name === 'standards');
      expect(standardsBlock).toBeDefined();

      // Context should come from child only
      const contextBlock = result.ast?.blocks.find((b) => b.name === 'context');
      expect(contextBlock).toBeDefined();
    });

    it('should resolve multi-level inheritance (3+ levels)', async () => {
      const result = await resolver.resolve('./grandchild.prs');

      expect(result.ast).not.toBeNull();
      expect(result.errors).toHaveLength(0);
      expect(result.sources).toHaveLength(3);

      // Should have content from all three levels
      const identityBlock = result.ast?.blocks.find((b) => b.name === 'identity');
      const identityContent = identityBlock?.content;

      if (identityContent?.type === 'TextContent') {
        expect(identityContent.value).toContain('base assistant');
        expect(identityContent.value).toContain('specialized child');
        expect(identityContent.value).toContain('grandchild assistant');
      }
    });

    it('should resolve file with @use imports', async () => {
      const result = await resolver.resolve('./with-imports.prs');

      expect(result.ast).not.toBeNull();
      expect(result.errors).toHaveLength(0);
      expect(result.sources).toHaveLength(2);

      // Import markers should be removed after resolution
      const hasImportMarker = result.ast?.blocks.some((b) => b.name.startsWith('__import__'));
      expect(hasImportMarker).toBe(false);
    });

    it('should resolve file with @extend', async () => {
      const result = await resolver.resolve('./with-extends.prs');

      expect(result.ast).not.toBeNull();
      expect(result.errors).toHaveLength(0);

      // Identity should be extended
      const identityBlock = result.ast?.blocks.find((b) => b.name === 'identity');
      const identityContent = identityBlock?.content;

      if (identityContent?.type === 'TextContent') {
        expect(identityContent.value).toContain('Base identity');
        expect(identityContent.value).toContain('Extended identity');
      }

      // Standards.code should be extended with frameworks
      const standardsBlock = result.ast?.blocks.find((b) => b.name === 'standards');
      const standardsContent = standardsBlock?.content;

      if (standardsContent?.type === 'ObjectContent') {
        const code = standardsContent.properties['code'] as Record<string, unknown>;
        expect(code['style']).toBe('clean');
        expect(code['frameworks']).toEqual(['react', 'vue']);
      }

      // Extends should be cleared
      expect(result.ast?.extends).toEqual([]);
    });

    it('should detect circular dependencies', async () => {
      await expect(resolver.resolve('./circular-a.prs')).rejects.toThrow(CircularDependencyError);
    });

    it('should handle missing files gracefully', async () => {
      const result = await resolver.resolve('./nonexistent.prs');

      expect(result.ast).toBeNull();
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]?.message).toContain('File not found');
    });

    it('should deduplicate sources', async () => {
      const result = await resolver.resolve('./grandchild.prs');

      const uniqueSources = [...new Set(result.sources)];
      expect(result.sources).toEqual(uniqueSources);
    });
  });

  describe('caching', () => {
    it('should cache resolved ASTs when enabled', async () => {
      const cachingResolver = new Resolver({
        registryPath: FIXTURES_DIR,
        localPath: FIXTURES_DIR,
        cache: true,
      });

      const result1 = await cachingResolver.resolve('./minimal.prs');
      const result2 = await cachingResolver.resolve('./minimal.prs');

      expect(result1).toBe(result2);
    });

    it('should not cache when disabled', async () => {
      const noCacheResolver = new Resolver({
        registryPath: FIXTURES_DIR,
        localPath: FIXTURES_DIR,
        cache: false,
      });

      const result1 = await noCacheResolver.resolve('./minimal.prs');
      const result2 = await noCacheResolver.resolve('./minimal.prs');

      expect(result1).not.toBe(result2);
    });

    it('should clear cache', async () => {
      const cachingResolver = new Resolver({
        registryPath: FIXTURES_DIR,
        localPath: FIXTURES_DIR,
        cache: true,
      });

      const result1 = await cachingResolver.resolve('./minimal.prs');
      cachingResolver.clearCache();
      const result2 = await cachingResolver.resolve('./minimal.prs');

      expect(result1).not.toBe(result2);
    });
  });

  describe('error handling', () => {
    it('should collect parse errors', async () => {
      const result = await resolver.resolve('./invalid-syntax.prs');

      expect(result.ast).toBeNull();
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle missing parent file in inheritance', async () => {
      const result = await resolver.resolve('./inherits-missing.prs');

      expect(result.errors.length).toBeGreaterThan(0);
      // Check that error contains info about resolution failure
      expect(
        result.errors.some(
          (e) => e.message.includes('File not found') || e.message.includes('resolve')
        )
      ).toBe(true);
    });

    it('should handle missing import file', async () => {
      const result = await resolver.resolve('./imports-missing.prs');

      expect(result.errors.length).toBeGreaterThan(0);
      // Check that error contains info about resolution failure
      expect(
        result.errors.some(
          (e) => e.message.includes('File not found') || e.message.includes('resolve')
        )
      ).toBe(true);
    });
  });
});
