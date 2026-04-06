import { describe, it, expect } from 'vitest';
import { hashContent, buildReferenceKey, isInsideCachePath } from '../reference-hasher.js';

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
