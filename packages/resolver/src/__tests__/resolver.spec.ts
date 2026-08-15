import { describe, it, expect, beforeEach } from 'vitest';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs';
import { CircularDependencyError } from '@promptscript/core';
import { Resolver, createResolver } from '../resolver.js';
import { join } from 'path';
import { tmpdir } from 'os';

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

    it('should expose the project root used for discovery', () => {
      const r = createResolver({
        registryPath: '/registry',
        localPath: '/project/.promptscript',
      });
      expect(r.getLoader().getProjectRoot()).toBe(resolve('/project'));
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

      const inheritedIdentity = result.provenance.entries.find(
        (entry) => entry.path === 'identity.text[0]'
      );
      expect(
        inheritedIdentity?.history.some(
          (step) => step.operation === 'inherit' && step.chain[0]?.operation === 'inherit'
        )
      ).toBe(true);
    });

    it('should expose provenance for inherited fields and extension operations', async () => {
      const result = await resolver.resolve('./with-extends.prs');

      expect(result.provenance.version).toBe(1);
      expect(result.provenance.entry).toContain('with-extends.prs');
      expect(result.provenance.entries.some((entry) => entry.path === 'identity')).toBe(true);
      const frameworkEntry = result.provenance.entries.find(
        (entry) => entry.path === 'standards.code.frameworks[1]'
      );
      expect(frameworkEntry?.source.file).toContain('with-extends.prs');
      expect(
        frameworkEntry?.history.some(
          (step) =>
            step.operation === 'extend' && (step.action === 'merged' || step.action === 'appended')
        )
      ).toBe(true);
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

    it('should resolve parent-relative path (../) inheritance', async () => {
      const result = await resolver.resolve('./subdir/nested-child.prs');

      expect(result.ast).not.toBeNull();
      expect(result.errors).toHaveLength(0);
      expect(result.sources).toHaveLength(2);

      // Should inherit from base.prs in parent directory
      const identityBlock = result.ast?.blocks.find((b) => b.name === 'identity');
      const identityContent = identityBlock?.content;

      if (identityContent?.type === 'TextContent') {
        // Should have content from both base and nested-child
        expect(identityContent.value).toContain('base assistant');
        expect(identityContent.value).toContain('nested child assistant');
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

      const importedGuard = result.provenance.entries.find(
        (entry) => entry.path === 'guards.security.level'
      );
      expect(
        importedGuard?.history.some(
          (step) => step.operation === 'use' && step.chain[0]?.operation === 'use'
        )
      ).toBe(true);
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

    it('should ignore invalidation when caching is disabled', () => {
      resolver.invalidate([resolve(FIXTURES_DIR, 'minimal.prs')]);
    });

    it('should remove legacy cache entries without absolute dependencies', () => {
      const cachingResolver = new Resolver({
        registryPath: FIXTURES_DIR,
        localPath: FIXTURES_DIR,
        cache: true,
      });
      const cache = (cachingResolver as unknown as { cache: Map<string, unknown> }).cache;
      cache.set('empty', { sources: [] });
      cache.set('relative', { sources: ['relative.prs'] });

      cachingResolver.invalidate([resolve(FIXTURES_DIR, 'minimal.prs')]);

      expect(cache.has('empty')).toBe(false);
      expect(cache.has('relative')).toBe(true);
    });

    it('should track and invalidate imported file dependencies', async () => {
      const root = mkdtempSync(join(tmpdir(), 'promptscript-resolver-watch-'));
      const entryPath = join(root, 'entry.prs');
      const importedPath = join(root, 'imported.prs');
      writeFileSync(entryPath, '@meta {\n  id: "entry"\n  syntax: "1.0.0"\n}\n\n@use ./imported\n');
      writeFileSync(importedPath, '@identity {\n  """\n  Initial imported content.\n  """\n}\n');

      try {
        const cachingResolver = new Resolver({
          registryPath: root,
          localPath: root,
          projectRoot: root,
          cache: true,
        });

        const first = await cachingResolver.resolve(entryPath);
        expect(first.dependencies).toEqual(expect.arrayContaining([entryPath, importedPath]));

        writeFileSync(importedPath, '@identity {\n  """\n  Updated imported content.\n  """\n}\n');
        cachingResolver.invalidate([importedPath]);

        const second = await cachingResolver.resolve(entryPath);
        expect(second).not.toBe(first);
        const identity = second.ast?.blocks.find((block) => block.name === 'identity');
        expect(identity?.content.type === 'TextContent' && identity.content.value).toContain(
          'Updated imported content'
        );
      } finally {
        rmSync(root, { recursive: true, force: true });
      }
    });

    it('should invalidate native skill resource dependencies', async () => {
      const root = mkdtempSync(join(tmpdir(), 'promptscript-resolver-skill-watch-'));
      const entryPath = join(root, 'entry.prs');
      const skillDir = join(root, 'skills', 'review');
      const skillPath = join(skillDir, 'SKILL.md');
      const resourcePath = join(skillDir, 'checklist.md');
      writeFileSync(entryPath, '@skills {\n  review: {}\n}\n');
      mkdirSync(skillDir, { recursive: true });
      writeFileSync(skillPath, '---\nname: review\n---\n\nReview instructions.\n');
      writeFileSync(resourcePath, 'Initial checklist.\n');

      try {
        const cachingResolver = new Resolver({
          registryPath: root,
          localPath: root,
          projectRoot: root,
          cache: true,
        });

        const first = await cachingResolver.resolve(entryPath);
        expect(first.dependencies).toEqual(expect.arrayContaining([skillPath, resourcePath]));

        writeFileSync(resourcePath, 'Updated checklist.\n');
        cachingResolver.invalidate([resourcePath]);

        const second = await cachingResolver.resolve(entryPath);
        expect(second).not.toBe(first);
        const skillsBlock = second.ast?.blocks.find((block) => block.name === 'skills');
        if (!skillsBlock || skillsBlock.content.type !== 'ObjectContent') {
          throw new Error('Expected resolved skills block');
        }
        const review = skillsBlock.content.properties['review'] as Record<string, unknown>;
        const resources = review['resources'] as
          Array<{ relativePath: string; content: string }> | undefined;
        expect(
          resources?.find((resource) => resource.relativePath === 'checklist.md')?.content
        ).toBe('Updated checklist.\n');
      } finally {
        rmSync(root, { recursive: true, force: true });
      }
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

    it('should report registry inheritance failures', async () => {
      const directory = mkdtempSync(join(tmpdir(), 'promptscript-resolver-registry-inherit-'));
      const entryPath = join(directory, 'entry.prs');
      writeFileSync(
        entryPath,
        '@inherit github.com/org/repo/standards\n@identity { """Local identity""" }\n'
      );

      try {
        const registryResolver = new Resolver({
          registryPath: directory,
          localPath: directory,
          cache: false,
          lockfile: { version: 1, dependencies: {} },
        });
        const result = await registryResolver.resolve(entryPath);

        expect(
          result.errors.some((error) => error.message.includes('Failed to resolve parent'))
        ).toBe(true);
      } finally {
        rmSync(directory, { recursive: true, force: true });
      }
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
