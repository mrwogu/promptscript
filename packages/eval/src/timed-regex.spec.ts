import { describe, expect, it } from 'vitest';
import { isRegexTimeout, timedRegExp, timedRegexTest, withRegexBudget } from './timed-regex.js';

describe('timedRegexTest', () => {
  it('matches like RegExp.test', () => {
    expect(timedRegexTest('^ref', 'i', 'Refund')).toBe(true);
    expect(timedRegexTest('^ref', '', 'Refund')).toBe(false);
  });

  it('throws a timeout for a pattern that backtracks', () => {
    let thrown: unknown;

    try {
      timedRegexTest('^(a+)+$', '', `${'a'.repeat(32)}!`, 20);
    } catch (error) {
      thrown = error;
    }

    expect(isRegexTimeout(thrown)).toBe(true);
  });

  it('shares one budget across calls inside withRegexBudget', () => {
    const started = Date.now();
    let thrown: unknown;

    try {
      withRegexBudget(50, () => {
        for (let call = 0; call < 1000; call++)
          timedRegexTest('^(a|a)*$', '', `${'a'.repeat(18)}!`);
      });
    } catch (error) {
      thrown = error;
    }

    expect(isRegexTimeout(thrown)).toBe(true);
    expect(Date.now() - started).toBeLessThan(1000);
  });

  it('refuses to start a test once the budget is spent and restores it after', () => {
    expect(() => withRegexBudget(0, () => timedRegexTest('a', '', 'a'))).toThrow(
      'The regex time budget is spent.'
    );
    expect(timedRegexTest('a', '', 'a')).toBe(true);
  });

  it('tells other errors apart from the timeout', () => {
    expect(isRegexTimeout(new Error('x'))).toBe(false);
    expect(isRegexTimeout(undefined)).toBe(false);
  });
});

describe('timedRegExp', () => {
  it('gives Ajv a distinct key per pattern and flags', () => {
    expect(timedRegExp('a+', 'u').toString()).toBe('/a+/u');
    expect(timedRegExp('b', 'u').toString()).toBe('/b/u');
  });

  it('throws for a bad pattern up front', () => {
    expect(() => timedRegExp('(', 'u')).toThrow();
  });
});
