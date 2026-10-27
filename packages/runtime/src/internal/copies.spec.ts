import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { refuseUrl } from './url-rules.js';

const core = new URL('../../../core/src/', import.meta.url);
const read = (base: URL | string, path: string): string =>
  readFileSync(new URL(path, base), 'utf8');

/** The source without import lines and the header that names the original. */
const body = (text: string): string =>
  text
    .split('\n')
    .filter((line) => !line.startsWith('import ') && !line.startsWith('// Copy of '))
    .join('\n');

const URL_TABLE = JSON.parse(read(core, '__tests__/url-rules-table.json')) as [
  string,
  string | null,
  string | null,
][];

describe('helpers copied from core', () => {
  it.each(URL_TABLE)('checks %s like the core URL rules table says', (url, refused, allowed) => {
    expect(refuseUrl(url, { allowPrivate: false })).toBe(refused ?? undefined);
    expect(refuseUrl(url, { allowPrivate: true })).toBe(allowed ?? undefined);
  });

  it('keeps the URL rules identical to core', () => {
    expect(read(import.meta.url, './url-rules.ts')).toBe(read(core, 'url-rules.ts'));
  });

  it.each([
    ['canonical-json.ts', 'utils/canonical-json.ts'],
    ['sha256.ts', 'utils/sha256.ts'],
    ['runtime-slots.ts', 'utils/runtime-slots.ts'],
    ['prompt-bundle-hash.ts', 'prompt-bundle-hash.ts'],
  ])('keeps %s equal to core apart from its imports', (copy, original) => {
    const text = read(import.meta.url, `./${copy}`);

    expect(text.split('\n')[0]).toMatch(`// Copy of packages/core/src/${original}.`);
    expect(body(text)).toBe(body(read(core, original)));
  });
});
