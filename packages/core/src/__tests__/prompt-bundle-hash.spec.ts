import { describe, expect, it } from 'vitest';
import { canonicalizeJson } from '../utils/canonical-json.js';
import { sha256Hex } from '../utils/sha256.js';
import { hashPromptBundle } from '../prompt-bundle-hash.js';

const bundle = {
  $schema: 'https://getpromptscript.dev/schema/prompt-bundle/v1.json',
  id: 'acme/reply',
  description: 'Reply',
  messages: [{ role: 'user', content: 'Hello' }],
  inputs: {},
  governance: { owner: 'team' },
};

describe('hashPromptBundle', () => {
  it('hashes the canonical JSON of the bundle in the sha256- form', () => {
    expect(hashPromptBundle(bundle)).toBe(`sha256-${sha256Hex(canonicalizeJson(bundle))}`);
    expect(hashPromptBundle(bundle)).toMatch(/^sha256-[0-9a-f]{64}$/);
  });

  it('leaves out contentHash and provenance', () => {
    const full = {
      ...bundle,
      contentHash: 'sha256-old',
      provenance: { entry: 'a.prs', segments: [] },
    };

    expect(hashPromptBundle(full)).toBe(hashPromptBundle(bundle));
  });

  it('does not depend on key order', () => {
    const reversed = Object.fromEntries(Object.entries(bundle).reverse());

    expect(hashPromptBundle(reversed)).toBe(hashPromptBundle(bundle));
  });

  it('changes with the schema URL, which works as the version tag', () => {
    const other = {
      ...bundle,
      $schema: 'https://getpromptscript.dev/schema/prompt-bundle/v2.json',
    };

    expect(hashPromptBundle(other)).not.toBe(hashPromptBundle(bundle));
  });

  it('changes with the content', () => {
    const edited = { ...bundle, messages: [{ role: 'user', content: 'Hello!' }] };

    expect(hashPromptBundle(edited)).not.toBe(hashPromptBundle(bundle));
  });

  it('does not change its input', () => {
    const input = { ...bundle, contentHash: 'sha256-old' };

    hashPromptBundle(input);

    expect(input.contentHash).toBe('sha256-old');
  });

  it('throws for a number JSON cannot carry', () => {
    expect(() =>
      hashPromptBundle({ ...bundle, inputs: { n: Number.POSITIVE_INFINITY } })
    ).toThrow();
  });
});
