import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { PromptRuntimeError } from '../errors.js';
import { callCostUsd, readPricing } from './pricing.js';
import type { PromptModelPrice } from './types.js';

const SCHEMA = 'https://getpromptscript.dev/schema/prompt-release-pricing/v1.json';
const EXAMPLE = new URL(
  '../../../../examples/runtime-node/.promptscript/releases/pricing.json',
  import.meta.url
);

const model = (fields: Record<string, unknown> = {}): Record<string, unknown> => ({
  ref: 'claude-sonnet-5-5',
  apiId: 'claude-sonnet-5-5',
  provider: 'anthropic',
  inputUsdPerMillion: 2,
  outputUsdPerMillion: 10,
  checkedOn: '2026-10-22',
  ...fields,
});
const file = (models: unknown, schema: unknown = SCHEMA): string =>
  JSON.stringify({ $schema: schema, models });

const refusal = (run: () => unknown): PromptRuntimeError => {
  try {
    run();
  } catch (error) {
    return error as PromptRuntimeError;
  }
  throw new Error('expected a refusal');
};

describe('readPricing', () => {
  it('reads the example pricing file into a frozen table', () => {
    // Arrange
    const text = readFileSync(EXAMPLE, 'utf8');

    // Act
    const table = readPricing(text);
    const price = table.find('anthropic', 'claude-sonnet-5-5');

    // Assert
    expect(price).toEqual(model());
    expect(Object.isFrozen(table)).toBe(true);
    expect(Object.isFrozen(price)).toBe(true);
    expect(table.find('openai', 'claude-sonnet-5-5')).toBeUndefined();
    expect(table.find('anthropic', 'gpt-5')).toBeUndefined();
  });

  it.each([
    ['not a string', 42 as unknown as string, 'the content is'],
    ['too long', ' '.repeat(262_145), 'the content is'],
    ['bad JSON', '{', 'the JSON is'],
    ['an array', '[]', '$schema or models'],
    ['another schema', file([], 'https://example.com/x.json'), '$schema or models'],
    ['no models', JSON.stringify({ $schema: SCHEMA }), '$schema or models'],
    ['models not an array', file({}), '$schema or models'],
    ['513 models', file(Array.from({ length: 513 }, () => model())), '$schema or models'],
    ['a model not an object', file([model(), 7]), 'models[1] is not valid'],
    ['no apiId', file([model({ apiId: undefined })]), 'models[0].apiId'],
    ['empty apiId', file([model({ apiId: '' })]), 'models[0].apiId'],
    ['control character', file([model({ apiId: 'a\u0000b' })]), 'models[0].apiId'],
    ['negative price', file([model({ inputUsdPerMillion: -1 })]), 'models[0].inputUsdPerMillion'],
    ['string price', file([model({ outputUsdPerMillion: '2' })]), 'models[0].outputUsdPerMillion'],
    ['bad date', file([model({ checkedOn: '2026-1-1' })]), 'models[0].checkedOn'],
  ])('refuses %s', (_name, text, part) => {
    const error = refusal(() => readPricing(text));

    expect(error).toBeInstanceOf(PromptRuntimeError);
    expect(error.code).toBe('invalid-pricing');
    expect(error.message).toContain(part);
  });

  it('refuses a price that parses to infinity', () => {
    const text = `{"$schema":"${SCHEMA}","models":[${JSON.stringify(model()).replace('"inputUsdPerMillion":2', '"inputUsdPerMillion":1e400')}]}`;

    expect(refusal(() => readPricing(text)).message).toContain('models[0].inputUsdPerMillion');
  });

  it('accepts 512 models', () => {
    const models = Array.from({ length: 512 }, (_, index) => model({ apiId: `m-${index}` }));

    expect(readPricing(file(models)).find('anthropic', 'm-511')).toBeDefined();
  });

  it('does not count an inherited price', () => {
    // Arrange: JSON.parse makes __proto__ an own key, which still gives no own price
    const text = `{"$schema":"${SCHEMA}","models":[{"ref":"a","apiId":"a","provider":"p","outputUsdPerMillion":1,"checkedOn":"2026-10-22","__proto__":{"inputUsdPerMillion":1}}]}`;

    // Act
    const error = refusal(() => readPricing(text));

    // Assert
    expect(error.message).toContain('models[0].inputUsdPerMillion');
  });

  it('keeps __proto__ and constructor as plain ids', () => {
    // Arrange
    const text = file([model({ apiId: '__proto__', provider: 'constructor' })]);

    // Act
    const table = readPricing(text);

    // Assert
    expect(table.find('constructor', '__proto__')).toMatchObject({ inputUsdPerMillion: 2 });
    expect(({} as Record<string, unknown>)['inputUsdPerMillion']).toBeUndefined();
  });

  it('keeps the higher price of each side for a repeated model', () => {
    const text = file([
      model({ ref: 'a', inputUsdPerMillion: 1, outputUsdPerMillion: 20 }),
      model({ ref: 'b', inputUsdPerMillion: 3, outputUsdPerMillion: 5 }),
    ]);

    expect(readPricing(text).find('anthropic', 'claude-sonnet-5-5')).toMatchObject({
      inputUsdPerMillion: 3,
      outputUsdPerMillion: 20,
    });
  });

  it('names the path and never the value', () => {
    const text = file([model(), model({ outputUsdPerMillion: -987654.321 })]);

    const { message } = refusal(() => readPricing(text));

    expect(message).toContain('models[1].outputUsdPerMillion');
    expect(message).not.toContain('987654.321');
  });
});

describe('callCostUsd', () => {
  interface EvalCost {
    callCost(
      usage: { inputTokens: number; outputTokens: number },
      pricing: { inputUsdPerMillion: number; outputUsdPerMillion: number }
    ): number;
  }
  const isEvalCost = (value: unknown): value is EvalCost =>
    typeof value === 'object' && value !== null && 'callCost' in value;

  it.each([
    [0, 0, 2, 10],
    [1000, 500, 2, 10],
    [1_234_567, 7_654_321, 0.15, 0.6],
    [5, 5, 0, 0],
  ])('matches the eval formula for %d in and %d out at %d and %d', async (inTok, outTok, p, q) => {
    // Same formula as eval callCost; this fails when they drift
    const evalModule: unknown = await import(
      new URL('../../../eval/src/cost.ts', import.meta.url).href
    );
    if (!isEvalCost(evalModule)) throw new Error('eval cost module has no callCost');
    const price: PromptModelPrice = {
      ref: 'm',
      provider: 'p',
      apiId: 'm',
      inputUsdPerMillion: p,
      outputUsdPerMillion: q,
      checkedOn: '2026-10-22',
    };

    const cost = callCostUsd(inTok, outTok, price);

    expect(cost).toBe(
      evalModule.callCost(
        { inputTokens: inTok, outputTokens: outTok },
        { inputUsdPerMillion: p, outputUsdPerMillion: q }
      )
    );
  });
});
