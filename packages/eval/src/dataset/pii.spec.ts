import { describe, expect, it } from 'vitest';
import { detectPii } from './pii.js';

describe('detectPii', () => {
  it.each([
    ['an email address', 'Write to ann.lee+orders@shop.example.com today', ['PS6112']],
    ['a Visa test number with spaces', 'Card 4111 1111 1111 1111 on file', ['PS6113']],
    ['a Mastercard test number with dashes', '5555-5555-5555-4444', ['PS6113']],
    ['a 15-digit Amex test number', 'amex 378282246310005', ['PS6113']],
    ['a German IBAN in groups', 'IBAN DE89 3704 0044 0532 0130 00 is mine', ['PS6114']],
    ['a British IBAN with letters', 'GB82WEST12345698765432', ['PS6114']],
    ['a Dutch IBAN with dashes', 'NL91-ABNA-0417-1643-00', ['PS6114']],
    ['all three', 'a@b.io 4111111111111111 NL91ABNA0417164300', ['PS6112', 'PS6113', 'PS6114']],
  ])('finds %s', (_name, text, codes) => {
    expect(detectPii(text)).toEqual(codes);
  });

  it.each([
    ['a handle without a domain', 'ping @ann or ann@localhost'],
    ['an at sign at the start', '@example.com'],
    ['a number that fails Luhn', '4111 1111 1111 1112'],
    ['an order number of 12 digits', 'order 411111111111'],
    ['a run of 25 digits', '4111111111111111111111111'],
    ['an IBAN with a bad check', 'DE88 3704 0044 0532 0130 00'],
    ['an IBAN of the wrong length', 'DE89 3704 0044 0532 0130 0'],
    ['an IBAN glued to more text', 'DE89370400440532013000X'],
    ['an unknown country', 'XX89370400440532013000'],
    ['a lowercase IBAN', 'de89370400440532013000'],
    ['plain text', 'Where is my order?'],
  ])('ignores %s', (_name, text) => {
    expect(detectPii(text)).toEqual([]);
  });

  it('stays fast on a long value without matches', () => {
    const text = `${'a'.repeat(32 * 1024)}@${'b.'.repeat(16 * 1024)}`;
    const started = Date.now();

    detectPii(text);

    expect(Date.now() - started).toBeLessThan(1000);
  });
});
