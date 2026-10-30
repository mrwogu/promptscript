import { describe, expect, it } from 'vitest';
import { detectPii, scrubPii } from './pii.js';

// These guard against catastrophic backtracking, which takes minutes, not seconds.
// A tight wall-clock limit only flakes on a busy CI runner.
const SLOW_MS = 10_000;
const SLOW_TEST = { timeout: 20_000 };

describe('detectPii', () => {
  it.each([
    ['an email address', 'Write to ann.lee+orders@shop.example.com today', ['PS6112']],
    ['a Visa test number with spaces', 'Card 4111 1111 1111 1111 on file', ['PS6113']],
    ['a Mastercard test number with dashes', '5555-5555-5555-4444', ['PS6113']],
    ['a 15-digit Amex test number', 'amex 378282246310005', ['PS6113']],
    ['a German IBAN in groups', 'IBAN DE89 3704 0044 0532 0130 00 is mine', ['PS6114']],
    ['a British IBAN with letters', 'GB82WEST12345698765432', ['PS6114']],
    ['a Dutch IBAN with dashes', 'NL91-ABNA-0417-1643-00', ['PS6114']],
    ['a lowercase IBAN', 'de89370400440532013000', ['PS6114']],
    ['an IBAN with double spaces', 'DE89  3704 0044  0532 0130 00', ['PS6114']],
    ['an IBAN glued to more text', 'DE89370400440532013000X', ['PS6114']],
    ['an IBAN glued to letters before', 'ibanDE89370400440532013000', ['PS6114']],
    ['an email with accents', 'józef.kowalski@firma.pl', ['PS6112']],
    ['an email with an umlaut domain', 'jan@münchen.de', ['PS6112']],
    ['a card followed by a number', 'card 4111111111111111 123', ['PS6113']],
    ['a card followed by an expiry date', 'Card 4111 1111 1111 1111 12 27', ['PS6113']],
    ['a card after a quantity', 'qty 3 4111 1111 1111 1111', ['PS6113']],
    ['a card after a dash', 'ID-4111111111111111', ['PS6113']],
    ['a card with two spaces', '4111  1111  1111  1111', ['PS6113']],
    ['a card with a spaced dash', '4111 1111 - 1111 1111', ['PS6113']],
    ['a card with slashes', '4111/1111/1111/1111', ['PS6113']],
    ['a card with underscores', '4111_1111_1111_1111', ['PS6113']],
    ['a card with commas', '4111,1111,1111,1111', ['PS6113']],
    ['a card with en dashes', '4111\u20131111\u20131111\u20131111', ['PS6113']],
    ['a card glued in a long run', '12344111111111111111', ['PS6113']],
    ['all three', 'a@b.io 4111111111111111 NL91ABNA0417164300', ['PS6112', 'PS6113', 'PS6114']],
  ])('finds %s', (_name, text, codes) => {
    expect(detectPii(text)).toEqual(codes);
  });

  it.each([
    ['a handle without a domain', 'ping @ann or ann@localhost'],
    ['an at sign at the start', '@example.com'],
    ['a number that fails Luhn', '4111 1111 1111 1112'],
    ['an order number of 12 digits', 'order 411111111111'],
    ['two short numbers', '2024 0615 1200'],
    ['an IBAN with a bad check', 'DE88 3704 0044 0532 0130 00'],
    ['an IBAN of the wrong length', 'DE89 3704 0044 0532 0130 0'],
    ['an unknown country', 'XX89370400440532013000'],
    ['plain text', 'Where is my order?'],
  ])('ignores %s', (_name, text) => {
    expect(detectPii(text)).toEqual([]);
  });

  it.each([
    ['digits with commas', '1,'.repeat(32_768)],
    ['digits with three separators', '1 - '.repeat(16_384)],
    ['64-digit groups', `${'7'.repeat(64)} `.repeat(1000)],
    ['one long group', '7'.repeat(65_536)],
  ])('stays fast on %s', SLOW_TEST, (_name, text) => {
    const started = Date.now();

    scrubPii(text);

    expect(Date.now() - started).toBeLessThan(SLOW_MS);
  });

  it('stays fast on a long run of short digit groups', SLOW_TEST, () => {
    const started = Date.now();

    detectPii('1 '.repeat(50_000));

    expect(Date.now() - started).toBeLessThan(SLOW_MS);
  });

  it('stays fast on a long value without matches', SLOW_TEST, () => {
    const text = `${'a'.repeat(32 * 1024)}@${'b.'.repeat(16 * 1024)}`;
    const started = Date.now();

    detectPii(text);

    expect(Date.now() - started).toBeLessThan(SLOW_MS);
  });
});

describe('scrubPii', () => {
  it.each([
    [
      'an email address',
      'Write to ann.lee+orders@shop.example.com today',
      'Write to [email] today',
    ],
    ['a card with spaces', 'Card 4111 1111 1111 1111 on file', 'Card [card] on file'],
    ['a card with dashes', '5555-5555-5555-4444', '[card]'],
    ['an IBAN in groups', 'IBAN DE89 3704 0044 0532 0130 00 is mine', 'IBAN [iban] is mine'],
    ['a card-like run inside an address', '4111111111111111@shop.example.com', '[email]'],
    ['two addresses that share text', 'a@b.com@c.org', '[email]'],
    [
      'text without personal data',
      'Where is my order 411111111111?',
      'Where is my order 411111111111?',
    ],
    ['a card number that fails Luhn', '4111 1111 1111 1112', '4111 1111 1111 1112'],
    ['a card next to a quantity', 'qty 3 4111 1111 1111 1111', 'qty [card]'],
    ['an accented email', 'Mail józef.kowalski@firma.pl', 'Mail [email]'],
  ])('replaces %s', (_name, text, expected) => {
    expect(scrubPii(text).text).toBe(expected);
  });

  it('counts what it replaced by kind', () => {
    const { text, counts } = scrubPii('a@b.io, c@d.io, 4111111111111111, NL91ABNA0417164300');

    expect(text).toBe('[email], [email], [card], [iban]');
    expect(counts).toEqual({ email: 2, card: 1, iban: 1 });
  });

  it('leaves nothing for detectPii to find', () => {
    const text = 'x a@b.io 4111-1111-1111-1111 GB82 WEST 1234 5698 7654 32 y';

    expect(detectPii(scrubPii(text).text)).toEqual([]);
  });

  it.each([
    ['a card glued to an IBAN', '4111111111111111DE89370400440532013000'],
    ['a card next to digits', 'card 4111111111111111 123 and Card 4111 1111 1111 1111 12 27'],
    ['an accented email', 'józef.kowalski@firma.pl and jan@münchen.de'],
    ['a lowercase IBAN with double spaces', 'de89  3704 0044 0532  0130 00'],
    ['digits before an email', '4111111111111111@x.io'],
    ['an IBAN inside an email', 'DE89370400440532013000@x.io'],
    ['a card after a dash', 'ID-4111111111111111'],
  ])('settles on %s', (_name, text) => {
    expect(detectPii(scrubPii(text).text)).toEqual([]);
  });

  it('leaves nothing for detectPii over 20000 generated values', () => {
    const parts = ['a', '@', 'b.co', ' ', '-', '4', '1', '0', 'DE', '89', '3704', '0044', '0532'];
    parts.push('0130', '00', '.', 'x', '4111111111111111', 'DE89370400440532013000', 'a@b.com');
    let seed = 7;
    const next = (): number => {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      return seed / 2147483648;
    };
    const failures: string[] = [];
    for (let index = 0; index < 20000; index++) {
      let text = '';
      for (let part = 0, count = 1 + Math.floor(next() * 10); part < count; part++) {
        text += parts[Math.floor(next() * parts.length)];
      }
      if (detectPii(scrubPii(text).text).length > 0) failures.push(text);
    }

    expect(failures).toEqual([]);
  });

  it.each([
    ['an id with a card inside', 'order12344111111111111111'],
    ['a card between letters', 'A12344111111111111111B'],
    ['a card before a letter', '12344111111111111111x'],
    ['a Saudi IBAN', 'SA0380000000608010167519'],
    ['a Turkish IBAN', 'TR330006100519786457841326'],
  ])('replaces the digits of %s', (_name, text) => {
    const { text: scrubbed, counts } = scrubPii(text);

    expect(counts.card + counts.iban).toBeGreaterThan(0);
    expect(scrubbed).not.toMatch(/\d{10}/);
  });

  it('is idempotent', () => {
    const once = scrubPii('a@b.io 4111111111111111').text;

    expect(scrubPii(once)).toEqual({ text: once, counts: { email: 0, card: 0, iban: 0 } });
  });

  it('stays fast on a long value without matches', SLOW_TEST, () => {
    const text = `${'a'.repeat(32 * 1024)}@${'b.'.repeat(16 * 1024)}`;
    const started = Date.now();

    scrubPii(text);

    expect(Date.now() - started).toBeLessThan(SLOW_MS);
  });
});
