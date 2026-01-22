import { describe, it, expect } from 'vitest';
import {
  isGitUrl,
  parseGitUrl,
  normalizeGitUrl,
  buildAuthenticatedUrl,
  getCacheKey,
  parseVersionedPath,
  isKnownGitHost,
  getWebUrl,
} from '../git-url-utils.js';

describe('git-url-utils', () => {
  describe('isGitUrl', () => {
    it('should detect HTTPS GitHub URLs', () => {
      expect(isGitUrl('https://github.com/org/repo.git')).toBe(true);
      expect(isGitUrl('https://github.com/org/repo')).toBe(true);
    });

    it('should detect HTTPS GitLab URLs', () => {
      expect(isGitUrl('https://gitlab.com/org/repo.git')).toBe(true);
      expect(isGitUrl('https://gitlab.com/org/repo')).toBe(true);
    });

    it('should detect SSH URLs', () => {
      expect(isGitUrl('git@github.com:org/repo.git')).toBe(true);
      expect(isGitUrl('git@github.com:org/repo')).toBe(true);
      expect(isGitUrl('git@gitlab.com:org/repo.git')).toBe(true);
    });

    it('should detect git:// protocol URLs', () => {
      expect(isGitUrl('git://github.com/org/repo.git')).toBe(true);
    });

    it('should reject non-Git URLs', () => {
      expect(isGitUrl('https://example.com/api')).toBe(false);
      expect(isGitUrl('https://example.com/some/path')).toBe(false);
      expect(isGitUrl('http://localhost:3000')).toBe(false);
    });

    it('should accept unknown hosts with .git suffix', () => {
      expect(isGitUrl('https://custom-git.example.com/org/repo.git')).toBe(true);
    });

    it('should reject malformed URLs', () => {
      expect(isGitUrl('not-a-url')).toBe(false);
      expect(isGitUrl('')).toBe(false);
      expect(isGitUrl('git@')).toBe(false);
    });
  });

  describe('parseGitUrl', () => {
    it('should parse HTTPS URLs', () => {
      const parsed = parseGitUrl('https://github.com/org/repo.git');
      expect(parsed).toEqual({
        original: 'https://github.com/org/repo.git',
        protocol: 'https',
        host: 'github.com',
        owner: 'org',
        repo: 'repo',
      });
    });

    it('should parse HTTPS URLs without .git suffix', () => {
      const parsed = parseGitUrl('https://github.com/org/repo');
      expect(parsed).toEqual({
        original: 'https://github.com/org/repo',
        protocol: 'https',
        host: 'github.com',
        owner: 'org',
        repo: 'repo',
      });
    });

    it('should parse HTTPS URLs with port', () => {
      const parsed = parseGitUrl('https://git.example.com:8443/org/repo.git');
      expect(parsed).toEqual({
        original: 'https://git.example.com:8443/org/repo.git',
        protocol: 'https',
        host: 'git.example.com',
        owner: 'org',
        repo: 'repo',
        port: 8443,
      });
    });

    it('should parse SSH URLs', () => {
      const parsed = parseGitUrl('git@github.com:org/repo.git');
      expect(parsed).toEqual({
        original: 'git@github.com:org/repo.git',
        protocol: 'ssh',
        host: 'github.com',
        owner: 'org',
        repo: 'repo',
      });
    });

    it('should parse git:// protocol URLs', () => {
      const parsed = parseGitUrl('git://github.com/org/repo.git');
      expect(parsed).toEqual({
        original: 'git://github.com/org/repo.git',
        protocol: 'git',
        host: 'github.com',
        owner: 'org',
        repo: 'repo',
      });
    });

    it('should return null for invalid URLs', () => {
      expect(parseGitUrl('not-a-url')).toBeNull();
      expect(parseGitUrl('https://example.com')).toBeNull();
      expect(parseGitUrl('git@github.com')).toBeNull();
    });

    it('should handle HTTP URLs', () => {
      const parsed = parseGitUrl('http://github.com/org/repo.git');
      expect(parsed?.protocol).toBe('https'); // HTTP is treated as HTTPS in pattern
    });
  });

  describe('normalizeGitUrl', () => {
    it('should normalize SSH to HTTPS', () => {
      expect(normalizeGitUrl('git@github.com:org/repo.git')).toBe(
        'https://github.com/org/repo.git'
      );
    });

    it('should normalize git:// to HTTPS', () => {
      expect(normalizeGitUrl('git://github.com/org/repo.git')).toBe(
        'https://github.com/org/repo.git'
      );
    });

    it('should add .git suffix if missing', () => {
      expect(normalizeGitUrl('https://github.com/org/repo')).toBe(
        'https://github.com/org/repo.git'
      );
    });

    it('should preserve port in normalized URL', () => {
      expect(normalizeGitUrl('https://git.example.com:8443/org/repo.git')).toBe(
        'https://git.example.com:8443/org/repo.git'
      );
    });

    it('should return original for invalid URLs', () => {
      expect(normalizeGitUrl('not-a-url')).toBe('not-a-url');
    });
  });

  describe('buildAuthenticatedUrl', () => {
    it('should add token to HTTPS URL', () => {
      expect(buildAuthenticatedUrl('https://github.com/org/repo.git', 'token123')).toBe(
        'https://token123@github.com/org/repo.git'
      );
    });

    it('should preserve port in authenticated URL', () => {
      expect(buildAuthenticatedUrl('https://git.example.com:8443/org/repo.git', 'token123')).toBe(
        'https://token123@git.example.com:8443/org/repo.git'
      );
    });

    it('should not modify SSH URLs', () => {
      expect(buildAuthenticatedUrl('git@github.com:org/repo.git', 'token123')).toBe(
        'git@github.com:org/repo.git'
      );
    });

    it('should return original for invalid URLs', () => {
      expect(buildAuthenticatedUrl('not-a-url', 'token123')).toBe('not-a-url');
    });
  });

  describe('getCacheKey', () => {
    it('should generate cache key for URL', () => {
      const key = getCacheKey('https://github.com/org/repo.git');
      expect(key).toMatch(/^github\.com-org-repo-[a-f0-9]+$/);
    });

    it('should include ref in cache key', () => {
      const key = getCacheKey('https://github.com/org/repo.git', 'main');
      expect(key).toMatch(/^github\.com-org-repo-main-[a-f0-9]+$/);
    });

    it('should generate same key for same URL', () => {
      const key1 = getCacheKey('https://github.com/org/repo.git', 'main');
      const key2 = getCacheKey('https://github.com/org/repo.git', 'main');
      expect(key1).toBe(key2);
    });

    it('should generate different keys for different refs', () => {
      const key1 = getCacheKey('https://github.com/org/repo.git', 'main');
      const key2 = getCacheKey('https://github.com/org/repo.git', 'develop');
      expect(key1).not.toBe(key2);
    });

    it('should handle invalid URLs with hash fallback', () => {
      const key = getCacheKey('not-a-url');
      expect(key).toMatch(/^unknown-[a-f0-9]+$/);
    });
  });

  describe('parseVersionedPath', () => {
    it('should parse path with version', () => {
      expect(parseVersionedPath('@company/base@v1.0.0')).toEqual({
        path: '@company/base',
        version: 'v1.0.0',
      });
    });

    it('should parse path with semver version', () => {
      expect(parseVersionedPath('@company/base@1.2.3')).toEqual({
        path: '@company/base',
        version: '1.2.3',
      });
    });

    it('should parse path with prerelease version', () => {
      expect(parseVersionedPath('@company/base@v2.0.0-beta.1')).toEqual({
        path: '@company/base',
        version: 'v2.0.0-beta.1',
      });
    });

    it('should handle path without version', () => {
      expect(parseVersionedPath('@company/base')).toEqual({
        path: '@company/base',
        version: undefined,
      });
    });

    it('should handle nested paths with version', () => {
      expect(parseVersionedPath('@company/team/base@v1.0.0')).toEqual({
        path: '@company/team/base',
        version: 'v1.0.0',
      });
    });

    it('should handle major-only version', () => {
      expect(parseVersionedPath('@company/base@v1')).toEqual({
        path: '@company/base',
        version: 'v1',
      });
    });
  });

  describe('isKnownGitHost', () => {
    it('should return true for known hosts', () => {
      expect(isKnownGitHost('github.com')).toBe(true);
      expect(isKnownGitHost('gitlab.com')).toBe(true);
      expect(isKnownGitHost('bitbucket.org')).toBe(true);
    });

    it('should return false for unknown hosts', () => {
      expect(isKnownGitHost('example.com')).toBe(false);
      expect(isKnownGitHost('custom-git.internal')).toBe(false);
    });
  });

  describe('getWebUrl', () => {
    it('should convert HTTPS URL to web URL', () => {
      expect(getWebUrl('https://github.com/org/repo.git')).toBe('https://github.com/org/repo');
    });

    it('should convert SSH URL to web URL', () => {
      expect(getWebUrl('git@github.com:org/repo.git')).toBe('https://github.com/org/repo');
    });

    it('should return original for invalid URLs', () => {
      expect(getWebUrl('not-a-url')).toBe('not-a-url');
    });
  });
});
