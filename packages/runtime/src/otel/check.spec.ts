import { describe, expect, it } from 'vitest';
import { promptId } from './check.js';

// The same table is in the CLI spec of the approval id check, which this copy must agree with.
const ID_TABLE: [string, boolean][] = [
  ['acme/refund-reply', true],
  ['@acme/support/reply', true],
  ['a.b/c_d-e', true],
  ['refund-reply', false],
  ['acme/../x', false],
  ['acme./x', false],
  ['acme/x.', false],
  ['acme/refund\u200b-reply', false],
  ['acme/\u0430bc', false],
  ['acme/x y', false],
];

describe('promptId', () => {
  it.each(ID_TABLE)('judges %j as %s', (id, expected) => {
    expect(promptId(id)).toBe(expected);
  });
});
