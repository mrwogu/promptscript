import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { join } from 'path';
import { promises as fs } from 'fs';
import { tmpdir } from 'os';
import {
  FileSystemRegistry,
  createFileSystemRegistry,
  createHttpRegistry,
  createCompositeRegistry,
} from '../registry.js';
import { FileNotFoundError } from '@promptscript/core';

describe('FileSystemRegistry', () => {
  let tempDir: string;
  let registry: FileSystemRegistry;

  beforeEach(async () => {
    tempDir = join(tmpdir(), `prs-test-${Date.now()}`);
    await fs.mkdir(tempDir, { recursive: true });
    registry = createFileSystemRegistry(tempDir);
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('fetch', () => {
    it('should fetch file content', async () => {
      const filePath = 'test.prs';
      const content = '@meta { id: "test" }';
      await fs.writeFile(join(tempDir, filePath), content);

      const result = await registry.fetch(filePath);

      expect(result).toBe(content);
    });

    it('should throw FileNotFoundError for non-existent file', async () => {
      await expect(registry.fetch('non-existent.prs')).rejects.toThrow(FileNotFoundError);
    });

    it('should handle nested paths', async () => {
      const dir = join(tempDir, '@company', 'team');
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(join(dir, 'project.prs'), 'content');

      const result = await registry.fetch('@company/team/project.prs');

      expect(result).toBe('content');
    });
  });

  describe('exists', () => {
    it('should return true for existing file', async () => {
      await fs.writeFile(join(tempDir, 'test.prs'), 'content');

      const result = await registry.exists('test.prs');

      expect(result).toBe(true);
    });

    it('should return false for non-existent file', async () => {
      const result = await registry.exists('non-existent.prs');

      expect(result).toBe(false);
    });
  });

  describe('list', () => {
    it('should list directory contents', async () => {
      await fs.writeFile(join(tempDir, 'file1.prs'), '');
      await fs.writeFile(join(tempDir, 'file2.prs'), '');
      await fs.mkdir(join(tempDir, 'subdir'));

      const result = await registry.list('');

      expect(result).toContain('file1.prs');
      expect(result).toContain('file2.prs');
      expect(result).toContain('subdir/');
    });

    it('should return empty array for non-existent directory', async () => {
      const result = await registry.list('non-existent');

      expect(result).toEqual([]);
    });
  });
});

describe('HttpRegistry', () => {
  const mockFetch = vi.fn();
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = mockFetch;
    mockFetch.mockReset();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('fetch', () => {
    it('should fetch content from URL', async () => {
      const registry = createHttpRegistry({
        baseUrl: 'https://registry.example.com',
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('@meta { id: "test" }'),
      });

      const result = await registry.fetch('@company/project.prs');

      expect(result).toBe('@meta { id: "test" }');
      expect(mockFetch).toHaveBeenCalledWith(
        'https://registry.example.com/@company/project.prs',
        expect.any(Object)
      );
    });

    it('should throw FileNotFoundError for 404', async () => {
      const registry = createHttpRegistry({
        baseUrl: 'https://registry.example.com',
      });

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      await expect(registry.fetch('missing.prs')).rejects.toThrow(FileNotFoundError);
    });

    it('should add bearer auth header', async () => {
      const registry = createHttpRegistry({
        baseUrl: 'https://registry.example.com',
        auth: { type: 'bearer', token: 'my-token' },
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('content'),
      });

      await registry.fetch('test.prs');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer my-token',
          }),
        })
      );
    });

    it('should add basic auth header', async () => {
      const registry = createHttpRegistry({
        baseUrl: 'https://registry.example.com',
        auth: { type: 'basic', token: 'user:pass' },
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('content'),
      });

      await registry.fetch('test.prs');

      const expectedAuth = `Basic ${Buffer.from('user:pass').toString('base64')}`;
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: expectedAuth,
          }),
        })
      );
    });

    it('should use cache when enabled', async () => {
      const registry = createHttpRegistry({
        baseUrl: 'https://registry.example.com',
        cache: { enabled: true, ttl: 60000 },
      });

      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve('cached content'),
      });

      // First fetch
      await registry.fetch('test.prs');
      // Second fetch should use cache
      await registry.fetch('test.prs');

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should retry on server errors', async () => {
      const registry = createHttpRegistry({
        baseUrl: 'https://registry.example.com',
        retry: { maxRetries: 2, initialDelay: 10 },
      });

      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Server Error',
        })
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve('success'),
        });

      const result = await registry.fetch('test.prs');

      expect(result).toBe('success');
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should not retry on client errors', async () => {
      const registry = createHttpRegistry({
        baseUrl: 'https://registry.example.com',
        retry: { maxRetries: 2, initialDelay: 10 },
      });

      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      });

      await expect(registry.fetch('test.prs')).rejects.toThrow('401');
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('exists', () => {
    it('should return true for existing resource', async () => {
      const registry = createHttpRegistry({
        baseUrl: 'https://registry.example.com',
      });

      mockFetch.mockResolvedValueOnce({ ok: true });

      const result = await registry.exists('test.prs');

      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ method: 'HEAD' })
      );
    });

    it('should return false for non-existent resource', async () => {
      const registry = createHttpRegistry({
        baseUrl: 'https://registry.example.com',
      });

      mockFetch.mockResolvedValueOnce({ ok: false });

      const result = await registry.exists('test.prs');

      expect(result).toBe(false);
    });
  });

  describe('list', () => {
    it('should fetch .index.json for listing', async () => {
      const registry = createHttpRegistry({
        baseUrl: 'https://registry.example.com',
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('["file1.prs", "file2.prs"]'),
      });

      const result = await registry.list('@company');

      expect(result).toEqual(['file1.prs', 'file2.prs']);
    });

    it('should return empty array on error', async () => {
      const registry = createHttpRegistry({
        baseUrl: 'https://registry.example.com',
      });

      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await registry.list('@company');

      expect(result).toEqual([]);
    });
  });

  describe('clearCache', () => {
    it('should clear the cache', async () => {
      const registry = createHttpRegistry({
        baseUrl: 'https://registry.example.com',
        cache: { enabled: true, ttl: 60000 },
      });

      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve('content'),
      });

      await registry.fetch('test.prs');
      expect(mockFetch).toHaveBeenCalledTimes(1);

      registry.clearCache();

      await registry.fetch('test.prs');
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });
});

describe('CompositeRegistry', () => {
  it('should try registries in order', async () => {
    const registry1 = {
      fetch: vi.fn().mockRejectedValue(new FileNotFoundError('test.prs')),
      exists: vi.fn().mockResolvedValue(false),
      list: vi.fn().mockResolvedValue([]),
    };
    const registry2 = {
      fetch: vi.fn().mockResolvedValue('content from registry2'),
      exists: vi.fn().mockResolvedValue(true),
      list: vi.fn().mockResolvedValue(['file.prs']),
    };

    const composite = createCompositeRegistry([registry1, registry2]);

    const result = await composite.fetch('test.prs');

    expect(result).toBe('content from registry2');
    expect(registry1.fetch).toHaveBeenCalled();
    expect(registry2.fetch).toHaveBeenCalled();
  });

  it('should return first successful result', async () => {
    const registry1 = {
      fetch: vi.fn().mockResolvedValue('content from registry1'),
      exists: vi.fn().mockResolvedValue(true),
      list: vi.fn().mockResolvedValue(['a.prs']),
    };
    const registry2 = {
      fetch: vi.fn().mockResolvedValue('content from registry2'),
      exists: vi.fn().mockResolvedValue(true),
      list: vi.fn().mockResolvedValue(['b.prs']),
    };

    const composite = createCompositeRegistry([registry1, registry2]);

    const result = await composite.fetch('test.prs');

    expect(result).toBe('content from registry1');
    expect(registry2.fetch).not.toHaveBeenCalled();
  });

  it('should throw if all registries fail', async () => {
    const registry1 = {
      fetch: vi.fn().mockRejectedValue(new FileNotFoundError('test.prs')),
      exists: vi.fn().mockResolvedValue(false),
      list: vi.fn().mockResolvedValue([]),
    };
    const registry2 = {
      fetch: vi.fn().mockRejectedValue(new FileNotFoundError('test.prs')),
      exists: vi.fn().mockResolvedValue(false),
      list: vi.fn().mockResolvedValue([]),
    };

    const composite = createCompositeRegistry([registry1, registry2]);

    await expect(composite.fetch('test.prs')).rejects.toThrow(FileNotFoundError);
  });

  it('exists should return true if any registry has the file', async () => {
    const registry1 = {
      fetch: vi.fn(),
      exists: vi.fn().mockResolvedValue(false),
      list: vi.fn(),
    };
    const registry2 = {
      fetch: vi.fn(),
      exists: vi.fn().mockResolvedValue(true),
      list: vi.fn(),
    };

    const composite = createCompositeRegistry([registry1, registry2]);

    const result = await composite.exists('test.prs');

    expect(result).toBe(true);
  });

  it('list should combine entries from all registries', async () => {
    const registry1 = {
      fetch: vi.fn(),
      exists: vi.fn(),
      list: vi.fn().mockResolvedValue(['a.prs', 'b.prs']),
    };
    const registry2 = {
      fetch: vi.fn(),
      exists: vi.fn(),
      list: vi.fn().mockResolvedValue(['b.prs', 'c.prs']),
    };

    const composite = createCompositeRegistry([registry1, registry2]);

    const result = await composite.list('');

    expect(result).toContain('a.prs');
    expect(result).toContain('b.prs');
    expect(result).toContain('c.prs');
    expect(result.filter((e) => e === 'b.prs')).toHaveLength(1); // Deduplicated
  });
});
