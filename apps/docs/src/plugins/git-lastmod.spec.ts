import { describe, expect, it } from 'vitest';
import { gitLastModified, lastModifiedByPath } from './git-lastmod.mjs';

describe('lastModifiedByPath', () => {
  it('keeps the newest date per page and maps files to URLs', () => {
    const log = [
      '\u00002026-03-01T10:00:00+00:00',
      '',
      'docs/guides/ci.md',
      'docs/reference/formatters/index.md',
      'packages/core/src/index.ts',
      '\u00002026-02-01T10:00:00+00:00',
      '',
      'docs/guides/ci.md',
      'docs/index.md',
      'docs/assets/logo.svg',
    ].join('\n');

    const dates = lastModifiedByPath(log);

    expect(Object.fromEntries(dates)).toEqual({
      '/guides/ci/': '2026-03-01T10:00:00+00:00',
      '/reference/formatters/': '2026-03-01T10:00:00+00:00',
      '/': '2026-02-01T10:00:00+00:00',
    });
  });
});

describe('gitLastModified', () => {
  it('reads dates for docs pages from this repository', () => {
    const dates = gitLastModified();

    expect(dates.get('/getting-started/')).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(gitLastModified()).toBe(dates);
  });
});
