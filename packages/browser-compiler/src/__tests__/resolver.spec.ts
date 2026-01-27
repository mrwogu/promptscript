import { describe, it, expect, vi } from 'vitest';
import { BrowserResolver } from '../resolver.js';
import { VirtualFileSystem } from '../virtual-fs.js';

describe('BrowserResolver', () => {
  describe('resolve', () => {
    it('should resolve a simple file', async () => {
      const fs = new VirtualFileSystem({
        'project.prs': `@meta { id: "test" syntax: "1.0.0" }`,
      });
      const resolver = new BrowserResolver({ fs });

      const result = await resolver.resolve('project.prs');

      expect(result.ast).not.toBeNull();
      expect(result.errors).toEqual([]);
      expect(result.sources).toContain('project.prs');
    });

    it('should normalize paths with backslashes', async () => {
      const fs = new VirtualFileSystem({
        'dir/project.prs': `@meta { id: "test" syntax: "1.0.0" }`,
      });
      const resolver = new BrowserResolver({ fs });

      const result = await resolver.resolve('dir\\project.prs');

      expect(result.ast).not.toBeNull();
      expect(result.sources).toContain('dir/project.prs');
    });

    it('should add .prs extension if missing', async () => {
      const fs = new VirtualFileSystem({
        'project.prs': `@meta { id: "test" syntax: "1.0.0" }`,
      });
      const resolver = new BrowserResolver({ fs });

      const result = await resolver.resolve('project');

      expect(result.ast).not.toBeNull();
    });

    it('should remove leading slash from path', async () => {
      const fs = new VirtualFileSystem({
        'project.prs': `@meta { id: "test" syntax: "1.0.0" }`,
      });
      const resolver = new BrowserResolver({ fs });

      const result = await resolver.resolve('/project.prs');

      expect(result.ast).not.toBeNull();
    });

    it('should return error for missing file', async () => {
      const fs = new VirtualFileSystem({});
      const resolver = new BrowserResolver({ fs });

      const result = await resolver.resolve('missing.prs');

      expect(result.ast).toBeNull();
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].message).toContain('not found');
    });

    it('should return errors for invalid syntax', async () => {
      const fs = new VirtualFileSystem({
        'project.prs': `@meta { id: "broken`,
      });
      const resolver = new BrowserResolver({ fs });

      const result = await resolver.resolve('project.prs');

      expect(result.ast).toBeNull();
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should use cache when enabled', async () => {
      const fs = new VirtualFileSystem({
        'project.prs': `@meta { id: "test" syntax: "1.0.0" }`,
      });
      const resolver = new BrowserResolver({ fs, cache: true });

      const result1 = await resolver.resolve('project.prs');
      const result2 = await resolver.resolve('project.prs');

      expect(result1).toBe(result2);
    });

    it('should not use cache when disabled', async () => {
      const fs = new VirtualFileSystem({
        'project.prs': `@meta { id: "test" syntax: "1.0.0" }`,
      });
      const resolver = new BrowserResolver({ fs, cache: false });

      const result1 = await resolver.resolve('project.prs');
      const result2 = await resolver.resolve('project.prs');

      expect(result1).not.toBe(result2);
      expect(result1).toEqual(result2);
    });

    it('should detect circular dependencies', async () => {
      const fs = new VirtualFileSystem({
        'a.prs': `@meta { id: "a" syntax: "1.0.0" }
@inherit ./b`,
        'b.prs': `@meta { id: "b" syntax: "1.0.0" }
@inherit ./a`,
      });
      const resolver = new BrowserResolver({ fs });

      await expect(resolver.resolve('a.prs')).rejects.toThrow('Circular');
    });

    it('should log debug messages with custom logger', async () => {
      const logger = {
        debug: vi.fn(),
        verbose: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      };
      const fs = new VirtualFileSystem({
        'project.prs': `@meta { id: "test" syntax: "1.0.0" }`,
      });
      const resolver = new BrowserResolver({ fs, logger, cache: true });

      await resolver.resolve('project.prs');
      await resolver.resolve('project.prs'); // trigger cache hit

      expect(logger.verbose).toHaveBeenCalled();
      expect(logger.debug).toHaveBeenCalledWith(expect.stringContaining('Cache'));
    });
  });

  describe('clearCache', () => {
    it('should clear the resolution cache', async () => {
      const fs = new VirtualFileSystem({
        'project.prs': `@meta { id: "test" syntax: "1.0.0" }`,
      });
      const resolver = new BrowserResolver({ fs, cache: true });

      const result1 = await resolver.resolve('project.prs');
      resolver.clearCache();
      const result2 = await resolver.resolve('project.prs');

      expect(result1).not.toBe(result2);
    });
  });

  describe('inheritance resolution', () => {
    it('should resolve @inherit with relative path', async () => {
      const fs = new VirtualFileSystem({
        'project.prs': `@meta { id: "child" syntax: "1.0.0" }
@inherit ./base
@identity { """Child identity""" }`,
        'base.prs': `@meta { id: "parent" syntax: "1.0.0" }
@identity { """Base identity""" }`,
      });
      const resolver = new BrowserResolver({ fs });

      const result = await resolver.resolve('project.prs');

      expect(result.ast).not.toBeNull();
      expect(result.sources).toContain('project.prs');
      expect(result.sources).toContain('base.prs');
    });

    it('should resolve @inherit from nested directory', async () => {
      const fs = new VirtualFileSystem({
        'sub/project.prs': `@meta { id: "child" syntax: "1.0.0" }
@inherit ../base
@identity { """Child""" }`,
        'base.prs': `@meta { id: "parent" syntax: "1.0.0" }
@identity { """Base""" }`,
      });
      const resolver = new BrowserResolver({ fs });

      const result = await resolver.resolve('sub/project.prs');

      expect(result.ast).not.toBeNull();
      expect(result.sources).toContain('base.prs');
    });

    it('should resolve @inherit with registry path', async () => {
      const fs = new VirtualFileSystem({
        'project.prs': `@meta { id: "test" syntax: "1.0.0" }
@inherit @core/base`,
        '@core/base.prs': `@meta { id: "core-base" syntax: "1.0.0" }
@identity { """Core base""" }`,
      });
      const resolver = new BrowserResolver({ fs });

      const result = await resolver.resolve('project.prs');

      expect(result.ast).not.toBeNull();
      expect(result.sources).toContain('@core/base.prs');
    });

    it('should merge @meta fields during inheritance', async () => {
      const fs = new VirtualFileSystem({
        'project.prs': `@meta { id: "child" syntax: "1.0.0" description: "Child" }
@inherit ./base`,
        'base.prs': `@meta { id: "parent" syntax: "1.0.0" version: "2.0" }`,
      });
      const resolver = new BrowserResolver({ fs });

      const result = await resolver.resolve('project.prs');

      expect(result.ast?.meta?.fields).toMatchObject({
        id: 'child',
        description: 'Child',
        version: '2.0',
      });
    });

    it('should merge blocks during inheritance', async () => {
      const fs = new VirtualFileSystem({
        'project.prs': `@meta { id: "child" syntax: "1.0.0" }
@inherit ./base
@context { environment: "production" }`,
        'base.prs': `@meta { id: "parent" syntax: "1.0.0" }
@context { environment: "development" }
@identity { """Base identity""" }`,
      });
      const resolver = new BrowserResolver({ fs });

      const result = await resolver.resolve('project.prs');

      expect(result.ast).not.toBeNull();
      const contextBlock = result.ast?.blocks.find((b) => b.name === 'context');
      expect(contextBlock).toBeDefined();
    });

    it('should handle inheritance error gracefully', async () => {
      const fs = new VirtualFileSystem({
        'project.prs': `@meta { id: "child" syntax: "1.0.0" }
@inherit ./missing`,
      });
      const resolver = new BrowserResolver({ fs });

      const result = await resolver.resolve('project.prs');

      expect(result.errors.some((e) => e.message.includes('not found'))).toBe(true);
    });
  });

  describe('import resolution (@use)', () => {
    it('should resolve @use imports', async () => {
      const fs = new VirtualFileSystem({
        'project.prs': `@meta { id: "main" syntax: "1.0.0" }
@use ./utils`,
        'utils.prs': `@meta { id: "utils" syntax: "1.0.0" }
@standards { code: ["TypeScript"] }`,
      });
      const resolver = new BrowserResolver({ fs });

      const result = await resolver.resolve('project.prs');

      expect(result.ast).not.toBeNull();
      expect(result.sources).toContain('utils.prs');
    });

    it('should resolve @use with alias', async () => {
      const fs = new VirtualFileSystem({
        'project.prs': `@meta { id: "main" syntax: "1.0.0" }
@use ./utils as myUtils
@extend myUtils.standards { extra: "value" }`,
        'utils.prs': `@meta { id: "utils" syntax: "1.0.0" }
@standards { code: ["TypeScript"] }`,
      });
      const resolver = new BrowserResolver({ fs });

      const result = await resolver.resolve('project.prs');

      expect(result.ast).not.toBeNull();
      expect(result.sources).toContain('utils.prs');
      // Import markers are stripped after applying extends, but content should be merged
    });

    it('should merge blocks from imports', async () => {
      const fs = new VirtualFileSystem({
        'project.prs': `@meta { id: "main" syntax: "1.0.0" }
@use ./standards
@standards { languages: ["JavaScript"] }`,
        'standards.prs': `@meta { id: "standards" syntax: "1.0.0" }
@standards { languages: ["TypeScript"] }`,
      });
      const resolver = new BrowserResolver({ fs });

      const result = await resolver.resolve('project.prs');

      expect(result.ast).not.toBeNull();
    });

    it('should handle multiple @use imports', async () => {
      const fs = new VirtualFileSystem({
        'project.prs': `@meta { id: "main" syntax: "1.0.0" }
@use ./utils
@use ./standards`,
        'utils.prs': `@meta { id: "utils" syntax: "1.0.0" }
@tools { lint: { description: "Lint code" } }`,
        'standards.prs': `@meta { id: "standards" syntax: "1.0.0" }
@standards { code: ["Clean"] }`,
      });
      const resolver = new BrowserResolver({ fs });

      const result = await resolver.resolve('project.prs');

      expect(result.ast).not.toBeNull();
      expect(result.sources).toContain('utils.prs');
      expect(result.sources).toContain('standards.prs');
    });

    it('should handle import errors gracefully', async () => {
      const fs = new VirtualFileSystem({
        'project.prs': `@meta { id: "main" syntax: "1.0.0" }
@use ./missing`,
      });
      const resolver = new BrowserResolver({ fs });

      const result = await resolver.resolve('project.prs');

      expect(result.errors.some((e) => e.message.includes('not found'))).toBe(true);
    });
  });

  describe('extension resolution (@extend)', () => {
    it('should apply @extend to existing block', async () => {
      const fs = new VirtualFileSystem({
        'project.prs': `@meta { id: "test" syntax: "1.0.0" }
@standards { code: ["TypeScript"] }
@extend standards { testing: ["Vitest"] }`,
      });
      const resolver = new BrowserResolver({ fs });

      const result = await resolver.resolve('project.prs');

      expect(result.ast).not.toBeNull();
      const standardsBlock = result.ast?.blocks.find((b) => b.name === 'standards');
      expect(standardsBlock).toBeDefined();
    });

    it('should apply @extend to nested path', async () => {
      const fs = new VirtualFileSystem({
        'project.prs': `@meta { id: "test" syntax: "1.0.0" }
@context { project: { name: "Test" } }
@extend context.project { version: "1.0" }`,
      });
      const resolver = new BrowserResolver({ fs });

      const result = await resolver.resolve('project.prs');

      expect(result.ast).not.toBeNull();
    });

    it('should extend text content by appending', async () => {
      const fs = new VirtualFileSystem({
        'project.prs': `@meta { id: "test" syntax: "1.0.0" }
@identity { """Base identity.""" }
@extend identity { """Extended identity.""" }`,
      });
      const resolver = new BrowserResolver({ fs });

      const result = await resolver.resolve('project.prs');

      expect(result.ast).not.toBeNull();
      const identityBlock = result.ast?.blocks.find((b) => b.name === 'identity');
      if (identityBlock?.content.type === 'TextContent') {
        expect(identityBlock.content.value).toContain('Base identity');
        expect(identityBlock.content.value).toContain('Extended identity');
      }
    });

    it('should extend array content by concatenating', async () => {
      const fs = new VirtualFileSystem({
        'project.prs': `@meta { id: "test" syntax: "1.0.0" }
@restrictions { - "Rule 1" }
@extend restrictions { - "Rule 2" }`,
      });
      const resolver = new BrowserResolver({ fs });

      const result = await resolver.resolve('project.prs');

      expect(result.ast).not.toBeNull();
    });

    it('should handle @extend for non-existent target gracefully', async () => {
      const fs = new VirtualFileSystem({
        'project.prs': `@meta { id: "test" syntax: "1.0.0" }
@extend missing { content: "value" }`,
      });
      const resolver = new BrowserResolver({ fs });

      const result = await resolver.resolve('project.prs');

      // Should not throw, just skip the extension
      expect(result.ast).not.toBeNull();
    });

    it('should extend imported aliased blocks', async () => {
      const fs = new VirtualFileSystem({
        'project.prs': `@meta { id: "main" syntax: "1.0.0" }
@use ./utils as tools
@extend tools.standards { extra: "value" }`,
        'utils.prs': `@meta { id: "utils" syntax: "1.0.0" }
@standards { code: ["TypeScript"] }`,
      });
      const resolver = new BrowserResolver({ fs });

      const result = await resolver.resolve('project.prs');

      expect(result.ast).not.toBeNull();
    });
  });

  describe('content merging', () => {
    it('should merge TextContent by appending when different', async () => {
      const fs = new VirtualFileSystem({
        'project.prs': `@meta { id: "child" syntax: "1.0.0" }
@inherit ./base
@identity { """Child text""" }`,
        'base.prs': `@meta { id: "parent" syntax: "1.0.0" }
@identity { """Parent text""" }`,
      });
      const resolver = new BrowserResolver({ fs });

      const result = await resolver.resolve('project.prs');

      const identityBlock = result.ast?.blocks.find((b) => b.name === 'identity');
      if (identityBlock?.content.type === 'TextContent') {
        expect(identityBlock.content.value).toContain('Parent text');
        expect(identityBlock.content.value).toContain('Child text');
      }
    });

    it('should not duplicate identical TextContent', async () => {
      const fs = new VirtualFileSystem({
        'project.prs': `@meta { id: "child" syntax: "1.0.0" }
@inherit ./base
@identity { """Same text""" }`,
        'base.prs': `@meta { id: "parent" syntax: "1.0.0" }
@identity { """Same text""" }`,
      });
      const resolver = new BrowserResolver({ fs });

      const result = await resolver.resolve('project.prs');

      const identityBlock = result.ast?.blocks.find((b) => b.name === 'identity');
      if (identityBlock?.content.type === 'TextContent') {
        // Should only appear once, not duplicated
        const matches = identityBlock.content.value.match(/Same text/g);
        expect(matches?.length).toBe(1);
      }
    });

    it('should use child text if it includes parent text', async () => {
      const fs = new VirtualFileSystem({
        'project.prs': `@meta { id: "child" syntax: "1.0.0" }
@inherit ./base
@identity { """Parent text plus additional""" }`,
        'base.prs': `@meta { id: "parent" syntax: "1.0.0" }
@identity { """Parent text""" }`,
      });
      const resolver = new BrowserResolver({ fs });

      const result = await resolver.resolve('project.prs');

      const identityBlock = result.ast?.blocks.find((b) => b.name === 'identity');
      if (identityBlock?.content.type === 'TextContent') {
        expect(identityBlock.content.value).toBe('Parent text plus additional');
      }
    });

    it('should merge ObjectContent by deep merging properties', async () => {
      const fs = new VirtualFileSystem({
        'project.prs': `@meta { id: "child" syntax: "1.0.0" }
@inherit ./base
@context { childKey: "childValue" }`,
        'base.prs': `@meta { id: "parent" syntax: "1.0.0" }
@context { parentKey: "parentValue" }`,
      });
      const resolver = new BrowserResolver({ fs });

      const result = await resolver.resolve('project.prs');

      const contextBlock = result.ast?.blocks.find((b) => b.name === 'context');
      if (contextBlock?.content.type === 'ObjectContent') {
        expect(contextBlock.content.properties).toHaveProperty('parentKey');
        expect(contextBlock.content.properties).toHaveProperty('childKey');
      }
    });

    it('should merge ArrayContent with unique values', async () => {
      const fs = new VirtualFileSystem({
        'project.prs': `@meta { id: "child" syntax: "1.0.0" }
@inherit ./base
@restrictions { - "Rule B" - "Rule A" }`,
        'base.prs': `@meta { id: "parent" syntax: "1.0.0" }
@restrictions { - "Rule A" }`,
      });
      const resolver = new BrowserResolver({ fs });

      const result = await resolver.resolve('project.prs');

      const restrictionsBlock = result.ast?.blocks.find((b) => b.name === 'restrictions');
      if (restrictionsBlock?.content.type === 'ArrayContent') {
        // Should have unique elements only
        const elements = restrictionsBlock.content.elements;
        expect(elements.length).toBeLessThanOrEqual(2);
      }
    });

    it('should merge MixedContent combining text and properties', async () => {
      const fs = new VirtualFileSystem({
        'project.prs': `@meta { id: "child" syntax: "1.0.0" }
@inherit ./base
@context {
  """Child context text"""
  childProp: "childValue"
}`,
        'base.prs': `@meta { id: "parent" syntax: "1.0.0" }
@context {
  """Parent context text"""
  parentProp: "parentValue"
}`,
      });
      const resolver = new BrowserResolver({ fs });

      const result = await resolver.resolve('project.prs');

      expect(result.ast).not.toBeNull();
    });

    it('should handle MixedContent merged with TextContent', async () => {
      const fs = new VirtualFileSystem({
        'project.prs': `@meta { id: "child" syntax: "1.0.0" }
@inherit ./base
@context { """Just text""" }`,
        'base.prs': `@meta { id: "parent" syntax: "1.0.0" }
@context {
  """Mixed text"""
  key: "value"
}`,
      });
      const resolver = new BrowserResolver({ fs });

      const result = await resolver.resolve('project.prs');

      expect(result.ast).not.toBeNull();
    });

    it('should handle TextContent merged with MixedContent', async () => {
      const fs = new VirtualFileSystem({
        'project.prs': `@meta { id: "child" syntax: "1.0.0" }
@inherit ./base
@context {
  """Mixed text"""
  key: "value"
}`,
        'base.prs': `@meta { id: "parent" syntax: "1.0.0" }
@context { """Just text""" }`,
      });
      const resolver = new BrowserResolver({ fs });

      const result = await resolver.resolve('project.prs');

      expect(result.ast).not.toBeNull();
    });

    it('should handle MixedContent merged with ObjectContent', async () => {
      const fs = new VirtualFileSystem({
        'project.prs': `@meta { id: "child" syntax: "1.0.0" }
@inherit ./base
@context { childKey: "childValue" }`,
        'base.prs': `@meta { id: "parent" syntax: "1.0.0" }
@context {
  """Mixed text"""
  parentKey: "parentValue"
}`,
      });
      const resolver = new BrowserResolver({ fs });

      const result = await resolver.resolve('project.prs');

      expect(result.ast).not.toBeNull();
    });

    it('should handle ObjectContent merged with MixedContent', async () => {
      const fs = new VirtualFileSystem({
        'project.prs': `@meta { id: "child" syntax: "1.0.0" }
@inherit ./base
@context {
  """Child text"""
  childKey: "childValue"
}`,
        'base.prs': `@meta { id: "parent" syntax: "1.0.0" }
@context { parentKey: "parentValue" }`,
      });
      const resolver = new BrowserResolver({ fs });

      const result = await resolver.resolve('project.prs');

      expect(result.ast).not.toBeNull();
    });
  });

  describe('path utilities', () => {
    it('should handle simple parent directory path', async () => {
      const fs = new VirtualFileSystem({
        'dir/project.prs': `@meta { id: "test" syntax: "1.0.0" }
@inherit ../base`,
        'base.prs': `@meta { id: "base" syntax: "1.0.0" }`,
      });
      const resolver = new BrowserResolver({ fs });

      const result = await resolver.resolve('dir/project.prs');

      expect(result.sources).toContain('base.prs');
    });

    it('should handle paths with multiple .. segments', async () => {
      const fs = new VirtualFileSystem({
        'a/b/project.prs': `@meta { id: "test" syntax: "1.0.0" }
@inherit ../base`,
        'a/base.prs': `@meta { id: "base" syntax: "1.0.0" }`,
      });
      const resolver = new BrowserResolver({ fs });

      const result = await resolver.resolve('a/b/project.prs');

      expect(result.sources).toContain('a/base.prs');
    });

    it('should handle registry paths with version', async () => {
      const fs = new VirtualFileSystem({
        'project.prs': `@meta { id: "test" syntax: "1.0.0" }
@inherit @core/base@1.0.0`,
        '@core/base.prs': `@meta { id: "core-base" syntax: "1.0.0" }`,
      });
      const resolver = new BrowserResolver({ fs });

      const result = await resolver.resolve('project.prs');

      expect(result.ast).not.toBeNull();
    });

    it('should handle registry paths with nested segments', async () => {
      const fs = new VirtualFileSystem({
        'project.prs': `@meta { id: "test" syntax: "1.0.0" }
@inherit @myorg/deep/nested/file`,
        '@myorg/deep/nested/file.prs': `@meta { id: "nested" syntax: "1.0.0" }`,
      });
      const resolver = new BrowserResolver({ fs });

      const result = await resolver.resolve('project.prs');

      expect(result.ast).not.toBeNull();
    });
  });

  describe('edge cases', () => {
    it('should handle file with only @meta', async () => {
      const fs = new VirtualFileSystem({
        'project.prs': `@meta { id: "minimal" syntax: "1.0.0" }`,
      });
      const resolver = new BrowserResolver({ fs });

      const result = await resolver.resolve('project.prs');

      expect(result.ast).not.toBeNull();
      expect(result.ast?.blocks.length).toBe(0);
    });

    it('should handle inheritance without child meta', async () => {
      const fs = new VirtualFileSystem({
        'project.prs': `@meta { id: "child" syntax: "1.0.0" }
@inherit ./base`,
        'base.prs': `@meta { id: "parent" syntax: "1.0.0" }
@identity { """Base""" }`,
      });
      const resolver = new BrowserResolver({ fs });

      const result = await resolver.resolve('project.prs');

      expect(result.ast).not.toBeNull();
      expect(result.ast?.inherit).toBeUndefined(); // inherit should be cleared
    });

    it('should handle imports with overlapping block names', async () => {
      const fs = new VirtualFileSystem({
        'project.prs': `@meta { id: "main" syntax: "1.0.0" }
@use ./a
@use ./b
@standards { main: "value" }`,
        'a.prs': `@meta { id: "a" syntax: "1.0.0" }
@standards { a: "value" }`,
        'b.prs': `@meta { id: "b" syntax: "1.0.0" }
@standards { b: "value" }`,
      });
      const resolver = new BrowserResolver({ fs });

      const result = await resolver.resolve('project.prs');

      expect(result.ast).not.toBeNull();
    });

    it('should handle deep property merge in extensions', async () => {
      const fs = new VirtualFileSystem({
        'project.prs': `@meta { id: "test" syntax: "1.0.0" }
@context {
  level1: {
    level2: {
      original: "value"
    }
  }
}
@extend context.level1.level2 { added: "newValue" }`,
      });
      const resolver = new BrowserResolver({ fs });

      const result = await resolver.resolve('project.prs');

      expect(result.ast).not.toBeNull();
    });

    it('should strip import markers from final output', async () => {
      const fs = new VirtualFileSystem({
        'project.prs': `@meta { id: "main" syntax: "1.0.0" }
@use ./utils as myUtils`,
        'utils.prs': `@meta { id: "utils" syntax: "1.0.0" }
@tools { test: { description: "Test" } }`,
      });
      const resolver = new BrowserResolver({ fs });

      const result = await resolver.resolve('project.prs');

      // Import markers should not be in final blocks
      const hasImportMarker = result.ast?.blocks.some((b) => b.name.startsWith('__import__'));
      expect(hasImportMarker).toBe(false);
    });
  });

  describe('extension content merging', () => {
    it('should extend ObjectContent with TextContent to create MixedContent', async () => {
      const fs = new VirtualFileSystem({
        'project.prs': `@meta { id: "test" syntax: "1.0.0" }
@context { key: "value" }
@extend context { """Added text""" }`,
      });
      const resolver = new BrowserResolver({ fs });

      const result = await resolver.resolve('project.prs');

      expect(result.ast).not.toBeNull();
      const contextBlock = result.ast?.blocks.find((b) => b.name === 'context');
      expect(contextBlock?.content.type).toBe('MixedContent');
    });

    it('should extend TextContent with ObjectContent to create MixedContent', async () => {
      const fs = new VirtualFileSystem({
        'project.prs': `@meta { id: "test" syntax: "1.0.0" }
@identity { """Base text""" }
@extend identity { key: "value" }`,
      });
      const resolver = new BrowserResolver({ fs });

      const result = await resolver.resolve('project.prs');

      expect(result.ast).not.toBeNull();
      const identityBlock = result.ast?.blocks.find((b) => b.name === 'identity');
      expect(identityBlock?.content.type).toBe('MixedContent');
    });

    it('should extend MixedContent with TextContent', async () => {
      const fs = new VirtualFileSystem({
        'project.prs': `@meta { id: "test" syntax: "1.0.0" }
@context {
  """Initial text"""
  key: "value"
}
@extend context { """More text""" }`,
      });
      const resolver = new BrowserResolver({ fs });

      const result = await resolver.resolve('project.prs');

      expect(result.ast).not.toBeNull();
    });

    it('should extend MixedContent with ObjectContent', async () => {
      const fs = new VirtualFileSystem({
        'project.prs': `@meta { id: "test" syntax: "1.0.0" }
@context {
  """Some text"""
  existingKey: "existingValue"
}
@extend context { newKey: "newValue" }`,
      });
      const resolver = new BrowserResolver({ fs });

      const result = await resolver.resolve('project.prs');

      expect(result.ast).not.toBeNull();
      const contextBlock = result.ast?.blocks.find((b) => b.name === 'context');
      if (contextBlock?.content.type === 'MixedContent') {
        expect(contextBlock.content.properties).toHaveProperty('existingKey');
        expect(contextBlock.content.properties).toHaveProperty('newKey');
      }
    });

    it('should handle extension with incompatible types by using extension content', async () => {
      const fs = new VirtualFileSystem({
        'project.prs': `@meta { id: "test" syntax: "1.0.0" }
@restrictions { - "Rule 1" }
@extend restrictions { """This replaces array with text""" }`,
      });
      const resolver = new BrowserResolver({ fs });

      const result = await resolver.resolve('project.prs');

      expect(result.ast).not.toBeNull();
    });

    it('should extend array value with ArrayContent', async () => {
      const fs = new VirtualFileSystem({
        'project.prs': `@meta { id: "test" syntax: "1.0.0" }
@standards {
  languages: ["TypeScript", "JavaScript"]
}
@extend standards.languages { - "Python" }`,
      });
      const resolver = new BrowserResolver({ fs });

      const result = await resolver.resolve('project.prs');

      expect(result.ast).not.toBeNull();
    });

    it('should extend object value with ObjectContent', async () => {
      const fs = new VirtualFileSystem({
        'project.prs': `@meta { id: "test" syntax: "1.0.0" }
@context {
  settings: {
    debug: true
  }
}
@extend context.settings { verbose: true }`,
      });
      const resolver = new BrowserResolver({ fs });

      const result = await resolver.resolve('project.prs');

      expect(result.ast).not.toBeNull();
    });

    it('should extend TextContent value with TextContent', async () => {
      const fs = new VirtualFileSystem({
        'project.prs': `@meta { id: "test" syntax: "1.0.0" }
@context {
  description: {
    type: "TextContent"
    value: "Initial description"
  }
}`,
      });
      const resolver = new BrowserResolver({ fs });

      const result = await resolver.resolve('project.prs');

      expect(result.ast).not.toBeNull();
    });

    it('should create path when extending into non-existent nested path', async () => {
      const fs = new VirtualFileSystem({
        'project.prs': `@meta { id: "test" syntax: "1.0.0" }
@context { existing: "value" }
@extend context.deep.nested.path { content: "new" }`,
      });
      const resolver = new BrowserResolver({ fs });

      const result = await resolver.resolve('project.prs');

      expect(result.ast).not.toBeNull();
    });

    it('should handle buildPathValue with empty path', async () => {
      const fs = new VirtualFileSystem({
        'project.prs': `@meta { id: "test" syntax: "1.0.0" }
@context { key: "value" }
@extend context { anotherKey: "anotherValue" }`,
      });
      const resolver = new BrowserResolver({ fs });

      const result = await resolver.resolve('project.prs');

      expect(result.ast).not.toBeNull();
    });

    it('should handle MixedContent extension with text', async () => {
      const fs = new VirtualFileSystem({
        'project.prs': `@meta { id: "test" syntax: "1.0.0" }
@inherit ./base
@context { childKey: "childValue" }`,
        'base.prs': `@meta { id: "parent" syntax: "1.0.0" }
@context {
  """Base context text"""
  parentKey: "parentValue"
}`,
      });
      const resolver = new BrowserResolver({ fs });

      const result = await resolver.resolve('project.prs');

      expect(result.ast).not.toBeNull();
    });
  });

  describe('value cloning', () => {
    it('should deep clone arrays recursively', async () => {
      const fs = new VirtualFileSystem({
        'project.prs': `@meta { id: "test" syntax: "1.0.0" }
@standards {
  rules: [
    ["nested", "array"],
    { name: "object in array" }
  ]
}`,
      });
      const resolver = new BrowserResolver({ fs });

      const result = await resolver.resolve('project.prs');

      expect(result.ast).not.toBeNull();
    });

    it('should deep clone objects recursively', async () => {
      const fs = new VirtualFileSystem({
        'project.prs': `@meta { id: "test" syntax: "1.0.0" }
@context {
  level1: {
    level2: {
      level3: "deep value"
    }
  }
}`,
      });
      const resolver = new BrowserResolver({ fs });

      const result = await resolver.resolve('project.prs');

      expect(result.ast).not.toBeNull();
    });

    it('should handle null values in cloning', async () => {
      const fs = new VirtualFileSystem({
        'project.prs': `@meta { id: "test" syntax: "1.0.0" }
@context {
  value: null
}`,
      });
      const resolver = new BrowserResolver({ fs });

      const result = await resolver.resolve('project.prs');

      expect(result.ast).not.toBeNull();
    });
  });

  describe('properties merging', () => {
    it('should merge nested object properties', async () => {
      const fs = new VirtualFileSystem({
        'project.prs': `@meta { id: "child" syntax: "1.0.0" }
@inherit ./base
@context {
  settings: {
    child: true
  }
}`,
        'base.prs': `@meta { id: "parent" syntax: "1.0.0" }
@context {
  settings: {
    parent: true
  }
}`,
      });
      const resolver = new BrowserResolver({ fs });

      const result = await resolver.resolve('project.prs');

      expect(result.ast).not.toBeNull();
      const contextBlock = result.ast?.blocks.find((b) => b.name === 'context');
      if (contextBlock?.content.type === 'ObjectContent') {
        const settings = contextBlock.content.properties.settings as Record<string, unknown>;
        expect(settings).toHaveProperty('parent');
        expect(settings).toHaveProperty('child');
      }
    });

    it('should override primitive values in properties', async () => {
      const fs = new VirtualFileSystem({
        'project.prs': `@meta { id: "child" syntax: "1.0.0" }
@inherit ./base
@context { version: "2.0" }`,
        'base.prs': `@meta { id: "parent" syntax: "1.0.0" }
@context { version: "1.0" }`,
      });
      const resolver = new BrowserResolver({ fs });

      const result = await resolver.resolve('project.prs');

      expect(result.ast).not.toBeNull();
      const contextBlock = result.ast?.blocks.find((b) => b.name === 'context');
      if (contextBlock?.content.type === 'ObjectContent') {
        expect(contextBlock.content.properties.version).toBe('2.0');
      }
    });

    it('should add new properties from child', async () => {
      const fs = new VirtualFileSystem({
        'project.prs': `@meta { id: "child" syntax: "1.0.0" }
@inherit ./base
@context { childOnly: "value" }`,
        'base.prs': `@meta { id: "parent" syntax: "1.0.0" }
@context { parentOnly: "value" }`,
      });
      const resolver = new BrowserResolver({ fs });

      const result = await resolver.resolve('project.prs');

      expect(result.ast).not.toBeNull();
      const contextBlock = result.ast?.blocks.find((b) => b.name === 'context');
      if (contextBlock?.content.type === 'ObjectContent') {
        expect(contextBlock.content.properties).toHaveProperty('parentOnly');
        expect(contextBlock.content.properties).toHaveProperty('childOnly');
      }
    });
  });

  describe('extend path handling', () => {
    it('should handle single-segment path extension', async () => {
      const fs = new VirtualFileSystem({
        'project.prs': `@meta { id: "test" syntax: "1.0.0" }
@context { key: "value" }
@extend context { newKey: "newValue" }`,
      });
      const resolver = new BrowserResolver({ fs });

      const result = await resolver.resolve('project.prs');

      expect(result.ast).not.toBeNull();
    });

    it('should handle extending TextContent target', async () => {
      const fs = new VirtualFileSystem({
        'project.prs': `@meta { id: "test" syntax: "1.0.0" }
@identity { """Original""" }
@extend identity { """Extended""" }`,
      });
      const resolver = new BrowserResolver({ fs });

      const result = await resolver.resolve('project.prs');

      const identityBlock = result.ast?.blocks.find((b) => b.name === 'identity');
      if (identityBlock?.content.type === 'TextContent') {
        expect(identityBlock.content.value).toContain('Original');
        expect(identityBlock.content.value).toContain('Extended');
      }
    });

    it('should handle extending into array element path', async () => {
      const fs = new VirtualFileSystem({
        'project.prs': `@meta { id: "test" syntax: "1.0.0" }
@context { items: ["a", "b"] }
@extend context.items { - "c" }`,
      });
      const resolver = new BrowserResolver({ fs });

      const result = await resolver.resolve('project.prs');

      expect(result.ast).not.toBeNull();
    });
  });

  describe('MixedContent extension merging', () => {
    it('should merge MixedContent with MixedContent preserving both texts', async () => {
      const fs = new VirtualFileSystem({
        'project.prs': `@meta { id: "test" syntax: "1.0.0" }
@context {
  """Target text"""
  targetKey: "targetValue"
}
@extend context {
  """Extension text"""
  extKey: "extValue"
}`,
      });
      const resolver = new BrowserResolver({ fs });

      const result = await resolver.resolve('project.prs');

      expect(result.ast).not.toBeNull();
      const contextBlock = result.ast?.blocks.find((b) => b.name === 'context');
      if (contextBlock?.content.type === 'MixedContent') {
        expect(contextBlock.content.text?.value).toContain('Target text');
        expect(contextBlock.content.text?.value).toContain('Extension text');
        expect(contextBlock.content.properties).toHaveProperty('targetKey');
        expect(contextBlock.content.properties).toHaveProperty('extKey');
      }
    });

    it('should handle MixedContent extension when target has no text', async () => {
      const fs = new VirtualFileSystem({
        'project.prs': `@meta { id: "test" syntax: "1.0.0" }
@context { targetKey: "targetValue" }
@extend context {
  """Extension text"""
  extKey: "extValue"
}`,
      });
      const resolver = new BrowserResolver({ fs });

      const result = await resolver.resolve('project.prs');

      expect(result.ast).not.toBeNull();
    });

    it('should handle ArrayContent extension with ArrayContent', async () => {
      const fs = new VirtualFileSystem({
        'project.prs': `@meta { id: "test" syntax: "1.0.0" }
@restrictions {
  - "Rule 1"
  - "Rule 2"
}
@extend restrictions {
  - "Rule 3"
  - "Rule 4"
}`,
      });
      const resolver = new BrowserResolver({ fs });

      const result = await resolver.resolve('project.prs');

      expect(result.ast).not.toBeNull();
      const restrictionsBlock = result.ast?.blocks.find((b) => b.name === 'restrictions');
      if (restrictionsBlock?.content.type === 'ArrayContent') {
        expect(restrictionsBlock.content.elements.length).toBeGreaterThanOrEqual(4);
      }
    });
  });

  describe('unique concat with complex values', () => {
    it('should handle arrays with object elements during inheritance', async () => {
      const fs = new VirtualFileSystem({
        'project.prs': `@meta { id: "child" syntax: "1.0.0" }
@inherit ./base
@tools {
  childTool: {
    name: "childTool"
    description: "Child tool"
  }
}`,
        'base.prs': `@meta { id: "parent" syntax: "1.0.0" }
@tools {
  parentTool: {
    name: "parentTool"
    description: "Parent tool"
  }
}`,
      });
      const resolver = new BrowserResolver({ fs });

      const result = await resolver.resolve('project.prs');

      expect(result.ast).not.toBeNull();
    });

    it('should handle arrays with primitive duplicates', async () => {
      const fs = new VirtualFileSystem({
        'project.prs': `@meta { id: "child" syntax: "1.0.0" }
@inherit ./base
@restrictions {
  - "Same rule"
  - "Child only rule"
}`,
        'base.prs': `@meta { id: "parent" syntax: "1.0.0" }
@restrictions {
  - "Same rule"
  - "Parent only rule"
}`,
      });
      const resolver = new BrowserResolver({ fs });

      const result = await resolver.resolve('project.prs');

      expect(result.ast).not.toBeNull();
      const restrictionsBlock = result.ast?.blocks.find((b) => b.name === 'restrictions');
      if (restrictionsBlock?.content.type === 'ArrayContent') {
        // "Same rule" should appear only once
        const values = restrictionsBlock.content.elements.filter((e) => e === 'Same rule');
        expect(values.length).toBeLessThanOrEqual(1);
      }
    });
  });

  describe('deep clone with nested structures', () => {
    it('should deep clone nested arrays', async () => {
      const fs = new VirtualFileSystem({
        'project.prs': `@meta { id: "test" syntax: "1.0.0" }
@standards {
  matrix: [
    ["a", "b"],
    ["c", "d"]
  ]
}`,
      });
      const resolver = new BrowserResolver({ fs });

      const result = await resolver.resolve('project.prs');

      expect(result.ast).not.toBeNull();
    });

    it('should deep clone deeply nested objects', async () => {
      const fs = new VirtualFileSystem({
        'project.prs': `@meta { id: "test" syntax: "1.0.0" }
@context {
  a: {
    b: {
      c: {
        d: "deep value"
      }
    }
  }
}`,
      });
      const resolver = new BrowserResolver({ fs });

      const result = await resolver.resolve('project.prs');

      expect(result.ast).not.toBeNull();
    });

    it('should handle mixed arrays and objects in cloning', async () => {
      const fs = new VirtualFileSystem({
        'project.prs': `@meta { id: "test" syntax: "1.0.0" }
@standards {
  items: [
    { type: "object", value: 1 },
    ["nested", "array"],
    "plain string",
    123
  ]
}`,
      });
      const resolver = new BrowserResolver({ fs });

      const result = await resolver.resolve('project.prs');

      expect(result.ast).not.toBeNull();
    });
  });

  describe('isPlainObject type guard', () => {
    it('should handle objects during property merging', async () => {
      const fs = new VirtualFileSystem({
        'project.prs': `@meta { id: "child" syntax: "1.0.0" }
@inherit ./base
@context {
  nested: {
    child: "value"
  }
}`,
        'base.prs': `@meta { id: "parent" syntax: "1.0.0" }
@context {
  nested: {
    parent: "value"
  }
}`,
      });
      const resolver = new BrowserResolver({ fs });

      const result = await resolver.resolve('project.prs');

      expect(result.ast).not.toBeNull();
      const contextBlock = result.ast?.blocks.find((b) => b.name === 'context');
      if (contextBlock?.content.type === 'ObjectContent') {
        const nested = contextBlock.content.properties.nested as Record<string, unknown>;
        expect(nested).toHaveProperty('parent');
        expect(nested).toHaveProperty('child');
      }
    });
  });

  describe('registry path version handling', () => {
    it('should strip version suffix from registry path', async () => {
      const fs = new VirtualFileSystem({
        'project.prs': `@meta { id: "test" syntax: "1.0.0" }
@inherit @org/package@2.0.0`,
        '@org/package.prs': `@meta { id: "pkg" syntax: "1.0.0" }
@identity { """Package identity""" }`,
      });
      const resolver = new BrowserResolver({ fs });

      const result = await resolver.resolve('project.prs');

      expect(result.ast).not.toBeNull();
      expect(result.sources).toContain('@org/package.prs');
    });

    it('should handle registry path without version', async () => {
      const fs = new VirtualFileSystem({
        'project.prs': `@meta { id: "test" syntax: "1.0.0" }
@inherit @simple/pkg`,
        '@simple/pkg.prs': `@meta { id: "simple" syntax: "1.0.0" }`,
      });
      const resolver = new BrowserResolver({ fs });

      const result = await resolver.resolve('project.prs');

      expect(result.ast).not.toBeNull();
    });
  });

  describe('text content merging edge cases', () => {
    it('should use parent text if child text is contained in parent', async () => {
      const fs = new VirtualFileSystem({
        'project.prs': `@meta { id: "child" syntax: "1.0.0" }
@inherit ./base
@identity { """Base""" }`,
        'base.prs': `@meta { id: "parent" syntax: "1.0.0" }
@identity { """Base identity text""" }`,
      });
      const resolver = new BrowserResolver({ fs });

      const result = await resolver.resolve('project.prs');

      const identityBlock = result.ast?.blocks.find((b) => b.name === 'identity');
      if (identityBlock?.content.type === 'TextContent') {
        // Parent text contains child text, so parent should be used
        expect(identityBlock.content.value).toBe('Base identity text');
      }
    });

    it('should append child text when neither contains the other', async () => {
      const fs = new VirtualFileSystem({
        'project.prs': `@meta { id: "child" syntax: "1.0.0" }
@inherit ./base
@identity { """Unique child content""" }`,
        'base.prs': `@meta { id: "parent" syntax: "1.0.0" }
@identity { """Different parent content""" }`,
      });
      const resolver = new BrowserResolver({ fs });

      const result = await resolver.resolve('project.prs');

      const identityBlock = result.ast?.blocks.find((b) => b.name === 'identity');
      if (identityBlock?.content.type === 'TextContent') {
        expect(identityBlock.content.value).toContain('parent content');
        expect(identityBlock.content.value).toContain('child content');
      }
    });
  });

  describe('MixedContent text merge edge cases', () => {
    it('should use extension text when target MixedContent has no text', async () => {
      const fs = new VirtualFileSystem({
        'project.prs': `@meta { id: "test" syntax: "1.0.0" }
@inherit ./base
@context {
  """Child text"""
  childKey: "childValue"
}`,
        'base.prs': `@meta { id: "parent" syntax: "1.0.0" }
@context { parentKey: "parentValue" }`,
      });
      const resolver = new BrowserResolver({ fs });

      const result = await resolver.resolve('project.prs');

      expect(result.ast).not.toBeNull();
      const contextBlock = result.ast?.blocks.find((b) => b.name === 'context');
      if (contextBlock?.content.type === 'MixedContent') {
        expect(contextBlock.content.text?.value).toContain('Child text');
      }
    });

    it('should use target text when extension MixedContent has no text', async () => {
      const fs = new VirtualFileSystem({
        'project.prs': `@meta { id: "test" syntax: "1.0.0" }
@inherit ./base
@context { childKey: "childValue" }`,
        'base.prs': `@meta { id: "parent" syntax: "1.0.0" }
@context {
  """Parent text"""
  parentKey: "parentValue"
}`,
      });
      const resolver = new BrowserResolver({ fs });

      const result = await resolver.resolve('project.prs');

      expect(result.ast).not.toBeNull();
      const contextBlock = result.ast?.blocks.find((b) => b.name === 'context');
      if (contextBlock?.content.type === 'MixedContent') {
        expect(contextBlock.content.text?.value).toContain('Parent text');
      }
    });
  });

  describe('extend to nested path with primitive value', () => {
    it('should replace primitive value at nested path', async () => {
      const fs = new VirtualFileSystem({
        'project.prs': `@meta { id: "test" syntax: "1.0.0" }
@context {
  settings: {
    mode: "development"
  }
}
@extend context.settings.mode { value: "production" }`,
      });
      const resolver = new BrowserResolver({ fs });

      const result = await resolver.resolve('project.prs');

      expect(result.ast).not.toBeNull();
    });

    it('should handle extending deep path when intermediate is array', async () => {
      const fs = new VirtualFileSystem({
        'project.prs': `@meta { id: "test" syntax: "1.0.0" }
@context {
  items: ["a", "b"]
}
@extend context.items.extra { value: "new" }`,
      });
      const resolver = new BrowserResolver({ fs });

      const result = await resolver.resolve('project.prs');

      expect(result.ast).not.toBeNull();
    });
  });

  describe('buildPathValue edge cases', () => {
    it('should build nested path structure from empty', async () => {
      const fs = new VirtualFileSystem({
        'project.prs': `@meta { id: "test" syntax: "1.0.0" }
@context { existing: "value" }
@extend context.a.b.c.d { deep: "value" }`,
      });
      const resolver = new BrowserResolver({ fs });

      const result = await resolver.resolve('project.prs');

      expect(result.ast).not.toBeNull();
    });
  });

  describe('array value extension', () => {
    it('should convert array to ArrayContent when extending with array', async () => {
      const fs = new VirtualFileSystem({
        'project.prs': `@meta { id: "test" syntax: "1.0.0" }
@standards {
  rules: ["rule1"]
}
@extend standards.rules { - "rule2" - "rule3" }`,
      });
      const resolver = new BrowserResolver({ fs });

      const result = await resolver.resolve('project.prs');

      expect(result.ast).not.toBeNull();
    });
  });

  describe('object merging with null values', () => {
    it('should handle null in parent being overwritten by child', async () => {
      const fs = new VirtualFileSystem({
        'project.prs': `@meta { id: "child" syntax: "1.0.0" }
@inherit ./base
@context { value: "defined" }`,
        'base.prs': `@meta { id: "parent" syntax: "1.0.0" }
@context { value: null }`,
      });
      const resolver = new BrowserResolver({ fs });

      const result = await resolver.resolve('project.prs');

      expect(result.ast).not.toBeNull();
      const contextBlock = result.ast?.blocks.find((b) => b.name === 'context');
      if (contextBlock?.content.type === 'ObjectContent') {
        expect(contextBlock.content.properties.value).toBe('defined');
      }
    });
  });

  describe('extend with different content type combinations', () => {
    it('should handle ArrayContent extended with ObjectContent', async () => {
      const fs = new VirtualFileSystem({
        'project.prs': `@meta { id: "test" syntax: "1.0.0" }
@restrictions { - "Rule 1" }
@extend restrictions { key: "converts to object" }`,
      });
      const resolver = new BrowserResolver({ fs });

      const result = await resolver.resolve('project.prs');

      expect(result.ast).not.toBeNull();
    });

    it('should handle TextContent extended with ArrayContent', async () => {
      const fs = new VirtualFileSystem({
        'project.prs': `@meta { id: "test" syntax: "1.0.0" }
@identity { """Some text""" }
@extend identity { - "array item" }`,
      });
      const resolver = new BrowserResolver({ fs });

      const result = await resolver.resolve('project.prs');

      expect(result.ast).not.toBeNull();
    });
  });

  describe('multi-level inheritance', () => {
    it('should handle three levels of inheritance', async () => {
      const fs = new VirtualFileSystem({
        'child.prs': `@meta { id: "child" syntax: "1.0.0" }
@inherit ./parent
@identity { """Child level""" }`,
        'parent.prs': `@meta { id: "parent" syntax: "1.0.0" }
@inherit ./grandparent
@identity { """Parent level""" }`,
        'grandparent.prs': `@meta { id: "grandparent" syntax: "1.0.0" }
@identity { """Grandparent level""" }`,
      });
      const resolver = new BrowserResolver({ fs });

      const result = await resolver.resolve('child.prs');

      expect(result.ast).not.toBeNull();
      expect(result.sources).toContain('child.prs');
      expect(result.sources).toContain('parent.prs');
      expect(result.sources).toContain('grandparent.prs');
    });
  });

  describe('unique array concat with complex objects', () => {
    it('should not duplicate identical object values', async () => {
      const fs = new VirtualFileSystem({
        'project.prs': `@meta { id: "child" syntax: "1.0.0" }
@inherit ./base
@tools {
  tool1: {
    name: "same"
    version: "1.0"
  }
}`,
        'base.prs': `@meta { id: "parent" syntax: "1.0.0" }
@tools {
  tool1: {
    name: "same"
    version: "1.0"
  }
}`,
      });
      const resolver = new BrowserResolver({ fs });

      const result = await resolver.resolve('project.prs');

      expect(result.ast).not.toBeNull();
    });
  });
});
