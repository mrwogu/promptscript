import { describe, expect, it } from 'vitest';
import { countAt, wrapLines } from './home-motion';

describe('wrapLines', () => {
  it('wraps each line and keeps the line breaks', () => {
    const html = '<span class="a">$</span> prs validate\n\nok';

    const wrapped = wrapLines(html);

    expect(wrapped).toBe(
      '<span class="home-line"><span class="a">$</span> prs validate</span>\n' +
        '<span class="home-line"></span>\n' +
        '<span class="home-line">ok</span>'
    );
  });
});

describe('countAt', () => {
  it('starts at zero and ends at the target', () => {
    expect(countAt(0, 50)).toBe(0);
    expect(countAt(1, 50)).toBe(50);
  });

  it('clamps progress outside the range', () => {
    expect(countAt(-1, 50)).toBe(0);
    expect(countAt(2, 50)).toBe(50);
  });

  it('eases out, so the middle is past half', () => {
    expect(countAt(0.5, 40)).toBeGreaterThan(20);
  });
});
