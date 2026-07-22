import { afterEach, describe, it, expect } from 'vitest';
import { mkdtemp, mkdir, rm, symlink, writeFile } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import {
  hashContent,
  buildReferenceKey,
  isInsideCachePath,
  isRealPathInside,
} from '../reference-hasher.js';

const tempDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    tempDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true }))
  );
});

describe('hashContent', () => {
  it('should produce sha256- prefixed hash', () => {
    const content = Buffer.from('hello world');
    const result = hashContent(content);
    expect(result).toMatch(/^sha256-[a-f0-9]{64}$/);
  });

  it('should produce consistent hash for same content', () => {
    const content = Buffer.from('test content');
    expect(hashContent(content)).toBe(hashContent(content));
  });

  it('should produce different hash for different content', () => {
    const a = Buffer.from('content a');
    const b = Buffer.from('content b');
    expect(hashContent(a)).not.toBe(hashContent(b));
  });

  it('should handle empty buffer', () => {
    const result = hashContent(Buffer.from(''));
    expect(result).toMatch(/^sha256-[a-f0-9]{64}$/);
  });
});

describe('buildReferenceKey', () => {
  it('should join components with null byte separator', () => {
    const key = buildReferenceKey(
      'https://github.com/org/repo',
      'references/patterns.md',
      'v2.1.0'
    );
    expect(key).toBe('https://github.com/org/repo\0references/patterns.md\0v2.1.0');
  });

  it('should handle empty version', () => {
    const key = buildReferenceKey('https://github.com/org/repo', 'file.md', '');
    expect(key).toBe('https://github.com/org/repo\0file.md\0');
  });

  it('should not collide with crafted URL containing separator chars', () => {
    const key1 = buildReferenceKey('https://evil.com/a', 'b.md', 'v1');
    const key2 = buildReferenceKey('https://evil.com/a\0b.md\0v1', '', '');
    expect(key1).not.toBe(key2);
  });
});

describe('isInsideCachePath', () => {
  it('should return true for path inside cache', () => {
    expect(isInsideCachePath('/cache/registries/org/repo/v1/file.md', '/cache')).toBe(true);
  });

  it('should return false for path traversal outside cache', () => {
    expect(isInsideCachePath('/cache/../etc/passwd', '/cache')).toBe(false);
  });

  it('should return false for completely outside path', () => {
    expect(isInsideCachePath('/other/path/file.md', '/cache')).toBe(false);
  });

  it('should handle nested traversal', () => {
    expect(isInsideCachePath('/cache/a/../../etc/passwd', '/cache')).toBe(false);
  });

  it('should normalize paths before comparison', () => {
    expect(isInsideCachePath('/cache/./registries/../registries/file.md', '/cache')).toBe(true);
  });
});

describe('isRealPathInside', () => {
  it('rejects paths outside the cache before resolving real paths', async () => {
    await expect(isRealPathInside('/outside/file.md', '/cache')).resolves.toBe(false);
  });

  it('returns false when an inside path does not exist', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'prs-reference-hasher-'));
    tempDirectories.push(directory);
    const cachePath = join(directory, 'cache');
    await mkdir(cachePath);

    await expect(isRealPathInside(join(cachePath, 'missing.md'), cachePath)).resolves.toBe(false);
  });

  it('accepts an existing file inside the cache path', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'prs-reference-hasher-'));
    tempDirectories.push(directory);
    const cachePath = join(directory, 'cache');
    const filePath = join(cachePath, 'nested', 'file.md');
    await mkdir(join(cachePath, 'nested'), { recursive: true });
    await writeFile(filePath, 'inside');

    await expect(isRealPathInside(filePath, cachePath)).resolves.toBe(true);
  });

  it('rejects a symlink that escapes the cache path', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'prs-reference-hasher-'));
    tempDirectories.push(directory);
    const cachePath = join(directory, 'cache');
    const outsidePath = join(directory, 'outside.md');
    await mkdir(cachePath);
    await writeFile(outsidePath, 'outside');
    const linkedPath = join(cachePath, 'linked.md');
    await symlink(outsidePath, linkedPath);

    await expect(isRealPathInside(linkedPath, cachePath)).resolves.toBe(false);
  });
});
