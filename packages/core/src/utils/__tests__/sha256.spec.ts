import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { sha256Hex } from '../sha256.js';

const reference = (text: string): string => createHash('sha256').update(text, 'utf8').digest('hex');

describe('sha256Hex', () => {
  it.each([
    ['empty string', '', 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'],
    ['abc', 'abc', 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'],
    [
      'two-block message',
      'abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq',
      '248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1',
    ],
    [
      'one million a',
      'a'.repeat(1_000_000),
      'cdc76e5c9914fb9281a1c7e284d73e67f1809a48a497200e046d39ccc7112cd0',
    ],
  ])('matches the FIPS 180-4 vector for %s', (_name, input, expected) => {
    expect(sha256Hex(input)).toBe(expected);
  });

  it('encodes non-ASCII text as UTF-8', () => {
    const input = 'zażółć gęślą jaźń € \u{1F600}  ';

    expect(sha256Hex(input)).toBe(reference(input));
  });

  it.each([0, 1, 54, 55, 56, 57, 63, 64, 65, 118, 119, 120, 121, 127, 128, 129, 1000])(
    'matches node:crypto for %i bytes of input',
    (length) => {
      const input = Array.from({ length }, (_, i) => String.fromCharCode(33 + ((i * 7) % 90))).join(
        ''
      );

      expect(sha256Hex(input)).toBe(reference(input));
    }
  );
});
