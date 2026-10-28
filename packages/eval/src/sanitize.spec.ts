import { describe, expect, it } from 'vitest';
import { cleanText, cleanValue, markdownCode, xmlText } from './sanitize.js';

describe('cleanText', () => {
  it('folds CR, LF and line separators to a space', () => {
    expect(cleanText('a\r\nb\nc\rd\u2028e\u2029f')).toBe('a  b c d e f');
  });

  it('strips C0, DEL and C1 controls including ESC', () => {
    expect(cleanText('a\u001b[31mred\u0000\u0007\u007f\u0085\u009fz')).toBe('a[31mredz');
  });

  it('strips bidi controls', () => {
    expect(cleanText('a\u202eb\u2066c\u2069d\u200fe\u061cf')).toBe('abcdef');
  });

  it('leaves ordinary text alone', () => {
    expect(cleanText('Zażółć gęślą jaźń 😀')).toBe('Zażółć gęślą jaźń 😀');
  });
});

describe('cleanValue', () => {
  it('cleans every string of a nested value and keeps the rest', () => {
    const value = { a: ['x\u202e', 1, true], b: { c: 'l1\nl2' } };

    expect(cleanValue(value)).toEqual({ a: ['x', 1, true], b: { c: 'l1 l2' } });
  });
});

describe('markdownCode', () => {
  it('wraps the text in a code span', () => {
    expect(markdownCode('refund')).toBe('`refund`');
  });

  it('uses a fence one longer than the longest backtick run', () => {
    expect(markdownCode('a ``` b `` c')).toBe('```` a ``` b `` c ````');
  });

  it('cleans the text and leaves pipes alone outside a table', () => {
    expect(markdownCode('a|b\nc\u202e')).toBe('`a|b c`');
  });

  it('escapes pipes in a table cell', () => {
    expect(markdownCode('a|b', true)).toBe('`a\\|b`');
  });

  it('escapes a backslash before a pipe in a cell, so the pipe stays escaped', () => {
    const slash = String.fromCodePoint(92);

    expect(markdownCode(`a${slash}|b`, true)).toBe(`\`a${slash}${slash}${slash}|b\``);
  });

  it('gives a dash for empty text, also after cleaning', () => {
    expect(markdownCode('')).toBe('-');
    expect(markdownCode('\u202e\u0007')).toBe('-');
  });

  it('pads a span that starts or ends with a backtick', () => {
    expect(markdownCode('`x`')).toBe('`` `x` ``');
  });
});

describe('xmlText', () => {
  it('escapes the five XML characters', () => {
    expect(xmlText(`<a href="x">&'</a>`)).toBe('&lt;a href=&quot;x&quot;&gt;&amp;&apos;&lt;/a&gt;');
  });

  it('removes characters XML 1.0 cannot hold, lone surrogates included', () => {
    expect(xmlText('a\ud800b\ufffe\uffffc')).toBe('abc');
  });
});
