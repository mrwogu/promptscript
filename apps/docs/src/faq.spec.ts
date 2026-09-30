import { describe, expect, it } from 'vitest';
import { HOME_FAQ, faqHtml } from './faq';

describe('faqHtml', () => {
  it('renders one details element per item and escapes markup', () => {
    const html = faqHtml([{ question: 'A <b>?', answer: 'x & y' }]);

    expect(html).toBe(
      '<details class="home-faq__item"><summary>A &lt;b&gt;?</summary><p>x &amp; y</p></details>'
    );
  });

  it('keeps the homepage FAQ non-empty and without duplicate questions', () => {
    const questions = HOME_FAQ.map((item) => item.question);

    expect(questions.length).toBeGreaterThan(0);
    expect(new Set(questions).size).toBe(questions.length);
  });
});
