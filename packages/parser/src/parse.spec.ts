import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { parse } from './parse.js';

function loadFixture(name: string): string {
  return readFileSync(new URL(`./__tests__/__fixtures__/${name}`, import.meta.url), 'utf-8');
}

describe('parse', () => {
  describe('string escapes', () => {
    it.each([
      ['literalNewline', 'C:\\new'],
      ['literalTab', 'C:\\temp'],
      ['literalReturn', 'C:\\reports'],
      ['mixed', 'C:\\new\nnext'],
      ['newline', 'first\nsecond'],
      ['tab', 'first\tsecond'],
      ['carriageReturn', 'first\rsecond'],
      ['quote', 'say "hi"'],
      ['escapedQuote', 'a\\"b'],
      ['singleQuote', "it's"],
      ['unknown', '\\q'],
    ])('decodes %s once from left to right', (field, expected) => {
      const source = loadFixture('string-escapes.prs');

      const result = parse(source);

      expect(result.errors).toHaveLength(0);
      expect(result.ast?.meta?.fields[field]).toBe(expected);
    });
  });
});
