import { describe, it, expect } from 'vitest';
import { verifyReferenceIntegrity } from '../reference-verifier.js';
import type { Lockfile } from '@promptscript/core';
import { LOCKFILE_VERSION, ResolveError } from '@promptscript/core';
import { hashContent, buildReferenceKey } from '@promptscript/resolver';

describe('verifyReferenceIntegrity', () => {
  const repoUrl = 'https://github.com/org/repo';
  const version = 'v1.0.0';

  it('should pass when hash matches', () => {
    const content = Buffer.from('valid content');
    const hash = hashContent(content);
    const key = buildReferenceKey(repoUrl, 'ref.md', version);
    const lockfile: Lockfile = {
      version: LOCKFILE_VERSION,
      dependencies: {},
      references: {
        [key]: { hash, lockedAt: '2026-04-01T00:00:00Z' },
      },
    };

    expect(() =>
      verifyReferenceIntegrity({
        content,
        repoUrl,
        relativePath: 'ref.md',
        version,
        lockfile,
      })
    ).not.toThrow();
  });

  it('should throw ResolveError on hash mismatch', () => {
    const content = Buffer.from('tampered content');
    const key = buildReferenceKey(repoUrl, 'ref.md', version);
    const lockfile: Lockfile = {
      version: LOCKFILE_VERSION,
      dependencies: {},
      references: {
        [key]: { hash: 'sha256-wrong', lockedAt: '2026-04-01T00:00:00Z' },
      },
    };

    expect(() =>
      verifyReferenceIntegrity({
        content,
        repoUrl,
        relativePath: 'ref.md',
        version,
        lockfile,
      })
    ).toThrow(ResolveError);
  });

  it('should throw ResolveError when no hash entry exists and lockfile has references section', () => {
    const content = Buffer.from('new content');
    const lockfile: Lockfile = {
      version: LOCKFILE_VERSION,
      dependencies: {},
      references: {},
    };

    expect(() =>
      verifyReferenceIntegrity({
        content,
        repoUrl,
        relativePath: 'new-ref.md',
        version,
        lockfile,
      })
    ).toThrow(ResolveError);
  });

  it('should skip verification when lockfile has no references section', () => {
    const content = Buffer.from('content');
    const lockfile: Lockfile = {
      version: LOCKFILE_VERSION,
      dependencies: {},
    };

    expect(() =>
      verifyReferenceIntegrity({
        content,
        repoUrl,
        relativePath: 'ref.md',
        version,
        lockfile,
      })
    ).not.toThrow();
  });

  it('should skip verification when no lockfile provided', () => {
    const content = Buffer.from('content');

    expect(() =>
      verifyReferenceIntegrity({
        content,
        repoUrl,
        relativePath: 'ref.md',
        version,
        lockfile: undefined,
      })
    ).not.toThrow();
  });

  it('should include file name and remediation in mismatch error', () => {
    const content = Buffer.from('tampered');
    const key = buildReferenceKey(repoUrl, 'patterns.md', version);
    const lockfile: Lockfile = {
      version: LOCKFILE_VERSION,
      dependencies: {},
      references: {
        [key]: { hash: 'sha256-wrong', lockedAt: '2026-04-01T00:00:00Z' },
      },
    };

    try {
      verifyReferenceIntegrity({
        content,
        repoUrl,
        relativePath: 'patterns.md',
        version,
        lockfile,
      });
      expect.fail('should have thrown');
    } catch (err) {
      const msg = (err as Error).message;
      expect(msg).toContain('patterns.md');
      expect(msg).toContain('prs lock --update');
    }
  });
});
