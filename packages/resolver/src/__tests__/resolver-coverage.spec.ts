import { describe, it, expect, beforeEach } from 'vitest';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { Resolver, createResolver } from '../resolver.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const FIXTURES_DIR = resolve(__dirname, '__fixtures__');

describe('Resolver additional coverage', () => {
  let resolver: Resolver;

  beforeEach(() => {
    resolver = new Resolver({
      registryPath: resolve(FIXTURES_DIR, 'registry'),
      localPath: FIXTURES_DIR,
      cache: true, // Enable caching for cache tests
    });
  });

  describe('cache handling', () => {
    it('should use cache on second resolve', async () => {
      // First resolve - should cache
      const result1 = await resolver.resolve('./minimal.prs');
      expect(result1.ast).not.toBeNull();

      // Second resolve - should use cache
      const result2 = await resolver.resolve('./minimal.prs');
      expect(result2.ast).not.toBeNull();

      // Results should be identical
      expect(result2.ast?.meta?.fields?.['id']).toBe(result1.ast?.meta?.fields?.['id']);
    });

    it('should clear cache when clearCache is called', async () => {
      // First resolve
      const result1 = await resolver.resolve('./minimal.prs');
      expect(result1.ast).not.toBeNull();

      // Clear cache
      resolver.clearCache();

      // Second resolve - should re-resolve
      const result2 = await resolver.resolve('./minimal.prs');
      expect(result2.ast).not.toBeNull();
    });
  });

  describe('error handling', () => {
    it('should handle non-existent file', async () => {
      const result = await resolver.resolve('./non-existent.prs');

      expect(result.ast).toBeNull();
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle parse errors', async () => {
      const result = await resolver.resolve('./invalid-syntax.prs');

      // Should have errors from parsing
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle file with inheritance to non-existent parent', async () => {
      const result = await resolver.resolve('./missing-parent.prs');

      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('createResolver factory', () => {
    it('should create resolver with all options', () => {
      const r = createResolver({
        registryPath: '/registry',
        localPath: '/local',
        cache: true,
      });

      expect(r).toBeInstanceOf(Resolver);
      expect(r.getLoader()).toBeDefined();
    });

    it('should create resolver without cache option', () => {
      const r = createResolver({
        registryPath: '/registry',
        localPath: '/local',
      });

      expect(r).toBeInstanceOf(Resolver);
    });
  });

  describe('import resolution', () => {
    it('should resolve uses with alias', async () => {
      const result = await resolver.resolve('./with-use.prs');

      expect(result.ast).not.toBeNull();
      // Sources should include both main file and imported file
      expect(result.sources.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('circular dependency', () => {
    it('should detect circular inheritance', async () => {
      try {
        await resolver.resolve('./circular-a.prs');
        expect.fail('Should have thrown circular dependency error');
      } catch (error) {
        expect((error as Error).message).toMatch(/circular/i);
      }
    });
  });
});

describe('Resolver with disabled cache', () => {
  let resolver: Resolver;

  beforeEach(() => {
    resolver = new Resolver({
      registryPath: resolve(FIXTURES_DIR, 'registry'),
      localPath: FIXTURES_DIR,
      cache: false,
    });
  });

  it('should re-parse file every time when cache is disabled', async () => {
    const result1 = await resolver.resolve('./minimal.prs');
    const result2 = await resolver.resolve('./minimal.prs');

    expect(result1.ast).not.toBeNull();
    expect(result2.ast).not.toBeNull();
  });
});

describe('Resolver with custom loader options', () => {
  it('should use provided loader options', () => {
    const resolver = new Resolver({
      registryPath: '/custom/registry',
      localPath: '/custom/local',
    });

    const loader = resolver.getLoader();
    expect(loader).toBeDefined();
  });
});

describe('Resolver error paths with failing imports', () => {
  it('should handle error during import resolution', async () => {
    const resolver = new Resolver({
      registryPath: resolve(FIXTURES_DIR, 'registry'),
      localPath: FIXTURES_DIR,
      cache: true,
    });

    // Try to resolve a file that imports a non-existent file
    const result = await resolver.resolve('./use-missing.prs');

    // Should have errors but not throw
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('should accumulate errors from imported file with parse errors', async () => {
    const resolver = new Resolver({
      registryPath: resolve(FIXTURES_DIR, 'registry'),
      localPath: FIXTURES_DIR,
      cache: true,
    });

    // Resolve a file that imports a file with invalid syntax
    const result = await resolver.resolve('./use-invalid.prs');

    // Should accumulate parse errors from imported file
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('should handle invalid syntax file directly', async () => {
    const resolver = new Resolver({
      registryPath: resolve(FIXTURES_DIR, 'registry'),
      localPath: FIXTURES_DIR,
      cache: true,
    });

    // Resolve a file with invalid syntax
    const result = await resolver.resolve('./invalid-syntax.prs');

    // Should have errors from parsing
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.ast).toBeNull();
  });
});

describe('Resolver error paths coverage', () => {
  describe('loadFile error handling', () => {
    it('should re-throw non-FileNotFoundError errors', async () => {
      const resolver = new Resolver({
        registryPath: resolve(FIXTURES_DIR, 'registry'),
        localPath: FIXTURES_DIR,
        cache: true,
      });

      // Attempting to load a directory should throw an error (not FileNotFoundError)
      await expect(resolver.resolve(FIXTURES_DIR)).rejects.toThrow();
    });
  });

  describe('parseResult error handling', () => {
    it('should collect parse errors when AST is null', async () => {
      const resolver = new Resolver({
        registryPath: resolve(FIXTURES_DIR, 'registry'),
        localPath: FIXTURES_DIR,
        cache: true,
      });

      const result = await resolver.resolve('./invalid-syntax.prs');

      expect(result.ast).toBeNull();
      expect(result.errors.length).toBeGreaterThan(0);
      // Errors should have location information from parse errors
    });
  });

  describe('resolveInherit error handling', () => {
    it('should handle failed parent resolution with error message', async () => {
      const resolver = new Resolver({
        registryPath: resolve(FIXTURES_DIR, 'registry'),
        localPath: FIXTURES_DIR,
        cache: true,
      });

      // File that inherits from a non-existent parent
      const result = await resolver.resolve('./missing-parent.prs');

      expect(result.errors.length).toBeGreaterThan(0);
      // Should have an error about failed parent resolution
    });
  });

  describe('resolveImports error handling', () => {
    it('should handle failed import resolution with error message', async () => {
      const resolver = new Resolver({
        registryPath: resolve(FIXTURES_DIR, 'registry'),
        localPath: FIXTURES_DIR,
        cache: true,
      });

      const result = await resolver.resolve('./use-missing.prs');

      expect(result.errors.length).toBeGreaterThan(0);
      // Should have an error about failed import resolution
    });

    it('should accumulate errors from imported files', async () => {
      const resolver = new Resolver({
        registryPath: resolve(FIXTURES_DIR, 'registry'),
        localPath: FIXTURES_DIR,
        cache: true,
      });

      const result = await resolver.resolve('./use-invalid.prs');

      // Should have accumulated errors from the invalid imported file
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});
