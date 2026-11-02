import { describe, expect, it } from 'vitest';
import { renderedFull, renderedPlain, withMeta } from '../__tests__/rendered.js';
import { PromptRuntimeError } from '../errors.js';
import {
  errorType,
  metaAttributes,
  promptAttributes,
  resultAttributes,
  type AttributeSettings,
} from './attributes.js';
import type { PromptModelPrice, PromptPricingTable } from './types.js';

const SETTINGS: AttributeSettings = { operation: 'chat', genAi: true };
const HASH = `sha256-${'a'.repeat(64)}`;
const price: PromptModelPrice = {
  ref: 'claude-sonnet-5-5',
  provider: 'anthropic',
  apiId: 'claude-sonnet-5-5',
  inputUsdPerMillion: 2,
  outputUsdPerMillion: 10,
  checkedOn: '2026-10-22',
};
const pricing: PromptPricingTable = {
  find: (provider, apiId) =>
    provider === price.provider && apiId === price.apiId ? price : undefined,
};

describe('promptAttributes', () => {
  it('writes every start attribute of a full bundle', () => {
    // Arrange
    const rendered = renderedFull();

    // Act
    const attributes = promptAttributes(rendered, SETTINGS);

    // Assert
    expect(attributes).toStrictEqual({
      'promptscript.prompt.id': 'acme-support/refund-reply',
      'promptscript.prompt.content_hash': rendered.meta.contentHash,
      'gen_ai.prompt.name': 'acme-support/refund-reply',
      'gen_ai.prompt.version': rendered.meta.contentHash,
      'gen_ai.operation.name': 'chat',
      'gen_ai.provider.name': 'anthropic',
      'gen_ai.request.model': 'claude-sonnet-5-5',
      'gen_ai.request.max_tokens': 800,
      'gen_ai.request.temperature': 0.2,
      'gen_ai.request.top_p': 0.9,
      'gen_ai.request.top_k': 40,
      'gen_ai.output.type': 'json',
    });
    expect(rendered.meta.contentHash).toMatch(/^sha256-/);
  });

  it('leaves out the model and the provider of a bundle without a model', () => {
    const attributes = promptAttributes(renderedPlain(), SETTINGS);

    expect(attributes).not.toHaveProperty('gen_ai.request.model');
    expect(attributes).not.toHaveProperty('gen_ai.provider.name');
    expect(attributes).not.toHaveProperty('gen_ai.output.type');
  });

  it('takes the provider option when the bundle has no model, never over the bundle', () => {
    const settings = { ...SETTINGS, provider: 'acme' };

    expect(promptAttributes(renderedPlain(), settings)['gen_ai.provider.name']).toBe('acme');
    expect(promptAttributes(renderedFull(), settings)['gen_ai.provider.name']).toBe('anthropic');
  });

  it('leaves out the gen_ai prompt name and version when the meta values are forged', () => {
    const rendered = withMeta(renderedFull(), { id: 'a\nb', contentHash: 'x' });

    const attributes = promptAttributes(rendered, SETTINGS);

    expect(attributes).not.toHaveProperty('gen_ai.prompt.name');
    expect(attributes).not.toHaveProperty('gen_ai.prompt.version');
  });

  it('writes only promptscript attributes with genAi false', () => {
    const attributes = promptAttributes(renderedFull(), { ...SETTINGS, genAi: false });

    expect(Object.keys(attributes).length).toBeGreaterThan(0);
    for (const key of Object.keys(attributes)) expect(key).toMatch(/^promptscript\./);
  });

  it('skips a model parameter that is not a finite number', () => {
    const rendered = { ...renderedFull(), params: { temperature: Number.NaN, maxTokens: 5 } };

    const attributes = promptAttributes(rendered, SETTINGS);

    expect(attributes).not.toHaveProperty('gen_ai.request.temperature');
    expect(attributes['gen_ai.request.max_tokens']).toBe(5);
  });

  it('takes the operation from the option', () => {
    const attributes = promptAttributes(renderedFull(), {
      ...SETTINGS,
      operation: 'text_completion',
    });

    expect(attributes['gen_ai.operation.name']).toBe('text_completion');
  });
});

describe('metaAttributes', () => {
  it('writes label, stale and the experiment with its variant', () => {
    const meta = withMeta(renderedPlain(), {
      label: 'prod',
      stale: true,
      experiment: 'warm-tone',
      variant: 'control',
    }).meta;

    expect(metaAttributes(meta)).toMatchObject({
      'promptscript.prompt.label': 'prod',
      'promptscript.prompt.stale': true,
      'promptscript.experiment.name': 'warm-tone',
      'promptscript.experiment.variant': 'control',
    });
  });

  it('writes neither experiment field without the other', () => {
    const only = metaAttributes({ experiment: 'warm-tone' });
    const other = metaAttributes({ variant: 'control' });

    expect(only).toEqual({});
    expect(other).toEqual({});
  });

  it.each(['acme-support/refund-reply', '@acme/team/refund-reply', 'a.b/c_d/e-f'])(
    'keeps the multi-segment prompt id %s',
    (id) => {
      expect(metaAttributes({ id })).toEqual({ 'promptscript.prompt.id': id });
    }
  );

  it('writes no stale attribute for a fresh prompt', () => {
    expect(metaAttributes({ stale: false })).toEqual({});
  });

  it.each([
    ['label', { label: 'Prod!' }],
    ['content hash', { contentHash: 'x' }],
    ['id with a line break', { id: 'a\nb' }],
    ['empty id', { id: '' }],
    ['id that is free text', { id: 'free text with spaces' }],
    ['id with free text before the slash', { id: 'free text/x' }],
    ['id with a bad last segment', { id: 'acme/not a name' }],
    ['id over 512', { id: 'a'.repeat(513) }],
    ['experiment', { experiment: 'Warm', variant: 'control' }],
    ['variant', { experiment: 'warm', variant: 'Warm' }],
    ['non string id', { id: 7 }],
  ])('drops a forged %s', (_name, meta) => {
    const attributes = metaAttributes({ id: 'a/b', contentHash: HASH, ...meta });
    const kept = JSON.stringify(attributes);

    for (const value of Object.values(meta)) expect(kept).not.toContain(JSON.stringify(value));
  });
});

describe('resultAttributes', () => {
  const rendered = renderedFull();

  it('writes tokens, response data and finish reasons', () => {
    const result = {
      inputTokens: 100,
      outputTokens: 50,
      responseModel: 'claude-sonnet-5-5-20261001',
      responseId: 'msg_1',
      finishReasons: ['end_turn'],
    };

    expect(resultAttributes(result, rendered, SETTINGS)).toStrictEqual({
      'gen_ai.usage.input_tokens': 100,
      'gen_ai.usage.output_tokens': 50,
      'gen_ai.response.model': 'claude-sonnet-5-5-20261001',
      'gen_ai.response.id': 'msg_1',
      'gen_ai.response.finish_reasons': ['end_turn'],
    });
  });

  it.each([-1, 1.5, Number.NaN, 2 ** 53, '3'])('drops a token count of %j', (tokens) => {
    const result = { inputTokens: tokens as number, outputTokens: tokens as number };

    expect(resultAttributes(result, rendered, SETTINGS)).toEqual({});
  });

  it('cuts a long response model to 128 characters', () => {
    const result = { responseModel: 'm'.repeat(200) };

    const attributes = resultAttributes(result, rendered, SETTINGS);

    expect(attributes['gen_ai.response.model']).toBe('m'.repeat(128));
  });

  it('drops a response value whose cut splits a surrogate pair and keeps a whole pair', () => {
    const split = { responseModel: `${'a'.repeat(127)}😀` };
    const whole = { responseModel: `${'a'.repeat(126)}😀` };

    expect(resultAttributes(split, rendered, SETTINGS)).toEqual({});
    expect(resultAttributes(whole, rendered, SETTINGS)['gen_ai.response.model']).toBe(
      whole.responseModel
    );
  });

  it('drops a response id with a bidi override', () => {
    expect(resultAttributes({ responseId: 'a\u202Eb' }, rendered, SETTINGS)).toEqual({});
  });

  it('keeps the first eight finish reasons and skips values that are not strings', () => {
    const finishReasons = [7 as unknown as string, ...Array.from({ length: 9 }, (_, i) => `r${i}`)];

    const attributes = resultAttributes({ finishReasons }, rendered, SETTINGS);

    expect(attributes['gen_ai.response.finish_reasons']).toEqual(
      Array.from({ length: 8 }, (_, i) => `r${i}`)
    );
  });

  it('writes no finish reasons when none is usable or the value is no array', () => {
    expect(resultAttributes({ finishReasons: ['a\nb'] }, rendered, SETTINGS)).toEqual({});
    const result = { finishReasons: 'stop' as unknown as string[] };
    expect(resultAttributes(result, rendered, SETTINGS)).toEqual({});
  });

  it('ignores a result that is not an object', () => {
    expect(resultAttributes(null as never, rendered, SETTINGS)).toEqual({});
  });

  describe('cost', () => {
    const tokens = { inputTokens: 1000, outputTokens: 500 };

    it('is written from the price and both token counts', () => {
      const attributes = resultAttributes(tokens, rendered, { ...SETTINGS, pricing });

      expect(attributes['promptscript.usage.cost_usd']).toBe((1000 * 2 + 500 * 10) / 1_000_000);
    });

    it('is kept with genAi false while the usage attributes go', () => {
      const attributes = resultAttributes(tokens, rendered, { ...SETTINGS, genAi: false, pricing });

      expect(Object.keys(attributes)).toEqual(['promptscript.usage.cost_usd']);
    });

    it.each([
      ['no pricing', tokens, rendered, undefined],
      ['one token count', { inputTokens: 5 }, rendered, pricing],
      ['no price for the model', tokens, renderedFull({ apiId: 'other' }), pricing],
      ['no model', tokens, renderedPlain(), pricing],
    ])('is left out with %s', (_name, result, prompt, table) => {
      const attributes = resultAttributes(result, prompt, { ...SETTINGS, pricing: table });

      expect(attributes).not.toHaveProperty('promptscript.usage.cost_usd');
    });

    it('is left out when the price gives no finite cost', () => {
      const broken: PromptPricingTable = {
        find: () => ({ ...price, inputUsdPerMillion: Number.POSITIVE_INFINITY }),
      };

      const attributes = resultAttributes({ inputTokens: 0, outputTokens: 1 }, rendered, {
        ...SETTINGS,
        pricing: broken,
      });

      expect(attributes).not.toHaveProperty('promptscript.usage.cost_usd');
    });
  });
});

describe('errorType', () => {
  it('gives the code of a runtime error', () => {
    expect(errorType(new PromptRuntimeError('timeout', 'x'))).toBe('timeout');
  });

  it('does not trust a code that is not a plain token and falls back to the name', () => {
    const error = Object.assign(new PromptRuntimeError('timeout', 'x'), { code: 'free text' });

    expect(errorType(error)).toBe('PromptRuntimeError');
  });

  it('gives _OTHER for a Proxy whose prototype trap throws', () => {
    const hostile = new Proxy(
      {},
      {
        getPrototypeOf: () => {
          throw new Error('trap');
        },
      }
    );

    expect(errorType(hostile)).toBe('_OTHER');
  });

  it('gives the name of a plain error', () => {
    expect(errorType(new TypeError('x'))).toBe('TypeError');
  });

  it.each([
    ['a name with a space', Object.assign(new Error('x'), { name: 'bad name!' })],
    ['a 65 character name', Object.assign(new Error('x'), { name: 'a'.repeat(65) })],
    ['a thrown string', 'boom'],
    ['null', null],
    ['undefined', undefined],
    ['a name that is no string', { name: 7 }],
    [
      'a name getter that throws',
      Object.defineProperty({}, 'name', {
        get: () => {
          throw new Error('no');
        },
      }),
    ],
  ])('gives _OTHER for %s', (_label, error) => {
    expect(errorType(error)).toBe('_OTHER');
  });
});
