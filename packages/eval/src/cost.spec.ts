import { describe, expect, it } from 'vitest';
import { Budget, callCost, roundUsd, worstCaseCost } from './cost.js';

const PRICE = { inputUsdPerMillion: 3, outputUsdPerMillion: 15, checkedOn: '2026-10-01' };

describe('cost', () => {
  it('prices tokens per million', () => {
    expect(callCost({ inputTokens: 1_000_000, outputTokens: 200_000 }, PRICE)).toBe(6);
  });

  it('counts every UTF-8 byte of the messages as an input token in the worst case', () => {
    const messages = [
      { role: 'system' as const, content: 'abc' },
      { role: 'user' as const, content: 'z\u0142' },
    ];

    expect(worstCaseCost(messages, undefined, 1000, PRICE)).toBe(
      ((6 + 2 + 2 * 16) * 3 + 1000 * 15) / 1_000_000
    );
  });

  it('counts the output schema as input, since providers bill it', () => {
    const output = {
      type: 'object' as const,
      properties: { reply: { type: 'string' as const } },
      required: ['reply'],
      additionalProperties: false as const,
    };
    const schemaBytes = JSON.stringify(output).length;

    expect(worstCaseCost([], output, 0, PRICE)).toBe((schemaBytes * 3) / 1_000_000);
  });

  it('rounds to six decimals', () => {
    expect(roundUsd(0.123_456_789)).toBe(0.123457);
  });
});

describe('Budget', () => {
  it('refuses a reservation that is not a finite amount', () => {
    const budget = new Budget(1);

    expect(budget.reserve(Number.NaN)).toBe(false);
    expect(budget.reserve(Number.POSITIVE_INFINITY)).toBe(false);
    expect(budget.reserve(-1)).toBe(false);
  });

  it('refuses a reservation past the limit', () => {
    const budget = new Budget(1);

    expect(budget.reserve(0.6)).toBe(true);
    expect(budget.reserve(0.6)).toBe(false);
  });

  it('replaces a reservation with the actual cost after a success', () => {
    const budget = new Budget(1);
    budget.reserve(0.6);

    budget.settle(0.6, 0.1);

    expect(budget.spent).toBe(0.1);
    expect(budget.reserve(0.9)).toBe(true);
  });

  it('keeps a failed reservation as spent and gives a released one back', () => {
    const budget = new Budget(1);
    budget.reserve(0.4);
    budget.reserve(0.4);

    budget.keep(0.4);
    budget.release(0.4);

    expect(budget.spent).toBe(0.4);
    expect(budget.reserve(0.6)).toBe(true);
    expect(budget.reserve(0.01)).toBe(false);
  });
});
