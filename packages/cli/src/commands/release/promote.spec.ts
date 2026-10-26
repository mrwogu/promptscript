import { describe, expect, it } from 'vitest';
import type { PromptBundleInput, PromptBundleV1 } from '@promptscript/core';
import { inputChangeWarnings, parsePromptReference, pickCandidate } from './promote.js';

const HEX = '0123456789abcdef'.repeat(4);

function bundle(inputs: Record<string, PromptBundleInput>): PromptBundleV1 {
  return { id: 'acme/refund', inputs } as unknown as PromptBundleV1;
}

const text = (description = 'Text'): PromptBundleInput => ({
  type: 'string',
  description,
  required: true,
});

describe('parsePromptReference', () => {
  it.each([
    ['acme/refund', { id: 'acme/refund' }],
    [`acme/refund@sha256-${HEX}`, { id: 'acme/refund', hash: `sha256-${HEX}` }],
    ['acme/refund@0123abcd', { id: 'acme/refund', hash: 'sha256-0123abcd' }],
    ['@scope/refund', { id: '@scope/refund' }],
  ])('reads %s', (reference, expected) => {
    expect(parsePromptReference(reference)).toEqual(expected);
  });

  it.each(['acme/refund@0123abc', 'acme/refund@0123ABCD', 'acme/refund@v2', 'acme/refund@'])(
    'refuses %s, whose suffix is not a hash',
    (reference) => {
      expect(() => parsePromptReference(reference)).toThrow('is not a content hash');
    }
  );
});

describe('inputChangeWarnings', () => {
  it('stays quiet when the inputs do not change', () => {
    const inputs = { message: text() };

    expect(inputChangeWarnings(bundle(inputs), bundle(inputs), 'prod.json')).toEqual([]);
  });

  it('names new required, newly required, removed and retyped inputs', () => {
    const before = bundle({
      message: { ...text(), required: false, default: 'hi' },
      tier: { type: 'enum', description: 'Tier', options: ['a', 'b'], required: true },
      total: { type: 'number', description: 'Total', required: true },
      gone: text(),
    });
    const after = bundle({
      message: text(),
      tier: { type: 'enum', description: 'Tier', options: ['a', 'c'], required: true },
      total: { type: 'string', description: 'Total', required: true },
      order: text(),
      note: { ...text(), required: false, default: '' },
    });

    const messages = inputChangeWarnings(before, after, 'prod.json').map((w) => w.message);

    expect(messages).toEqual([
      'acme/refund: input "message" is now required; update the callers before this release reaches them.',
      'acme/refund: input "tier" changes its options; update the callers before this release reaches them.',
      'acme/refund: input "total" changes type from number to string; update the callers before this release reaches them.',
      'acme/refund: new required input "order"; update the callers before this release reaches them.',
      'acme/refund: input "gone" is removed; update the callers before this release reaches them.',
    ]);
  });
});

describe('pickCandidate', () => {
  const a = `sha256-0123abcd${'0'.repeat(56)}`;
  const b = `sha256-0123abcd${'1'.repeat(56)}`;

  it('returns the only candidate', () => {
    expect(pickCandidate('acme/refund', 'sha256-0123abcd', [a], 'bundles')).toBe(a);
  });

  it('lists the candidates of an ambiguous prefix', () => {
    expect(() => pickCandidate('acme/refund', 'sha256-0123abcd', [a, b], 'bundles')).toThrow(
      expect.objectContaining({
        code: 'PS5003',
        message: `sha256-0123abcd matches 2 bundles of acme/refund: ${a}, ${b}. Give more hex digits of the hash.`,
      })
    );
  });
});
