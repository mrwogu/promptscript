import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { refuseUrl } from '../url-rules.js';

/**
 * [url, reason with allowPrivate: false, reason with allowPrivate: true], null when the URL
 * passes. The runtime package runs its copy of the helper against this same file.
 */
const TABLE = JSON.parse(
  readFileSync(new URL('./url-rules-table.json', import.meta.url), 'utf8')
) as [string, string | null, string | null][];

describe('refuseUrl', () => {
  it.each(TABLE)('%s', (url, refused, allowed) => {
    expect(refuseUrl(url, { allowPrivate: false })).toBe(refused ?? undefined);
    expect(refuseUrl(url, { allowPrivate: true })).toBe(allowed ?? undefined);
  });

  it('accepts a URL object', () => {
    expect(refuseUrl(new URL('https://example.com/'), { allowPrivate: false })).toBeUndefined();
    expect(refuseUrl(new URL('https://[::1]/'), { allowPrivate: true })).toBe(
      'host is local or a metadata endpoint'
    );
  });
});
