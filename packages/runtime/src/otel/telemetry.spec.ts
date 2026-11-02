import { describe, expect, it, vi } from 'vitest';
import { createFakeOtel, type ThrowPoint } from '../__tests__/fake-otel.js';
import { makeBundle } from '../__tests__/fixture.js';
import { renderedFull, renderedPlain } from '../__tests__/rendered.js';
import { createPromptClient } from '../client.js';
import { PromptRuntimeError } from '../errors.js';
import { readPricing } from './pricing.js';
import { anthropicResult } from './readers.js';
import { createPromptTelemetry } from './telemetry.js';
import type { PromptSource } from '../types.js';
import type { PromptSpanRef, PromptTelemetryOptions } from './types.js';

function setup(throwOn: ThrowPoint[] = [], options: PromptTelemetryOptions = {}) {
  const fake = createFakeOtel(new Set(throwOn));
  const errors: PromptRuntimeError[] = [];
  const telemetry = createPromptTelemetry(fake.api, {
    ...options,
    onError: (error) => errors.push(error),
  });
  return { ...fake, errors, telemetry };
}

const ZERO_TRACE = '0'.repeat(32);

describe('trace', () => {
  it('runs the call in a span and returns its value', async () => {
    // Arrange
    const { telemetry, spans, activeDuringWith } = setup();
    const rendered = renderedFull();
    let seen: PromptSpanRef | undefined;

    // Act
    const value = await telemetry.trace(rendered, async (span) => {
      seen = span;
      return 'reply';
    });

    // Assert
    expect(value).toBe('reply');
    expect(spans).toHaveLength(1);
    const [span] = spans;
    expect(span).toMatchObject({ name: 'chat claude-sonnet-5-5', kind: 2, endCount: 1 });
    expect(span?.attributes).toEqual(telemetry.attributes(rendered));
    expect(span?.status).toBeUndefined();
    expect(seen).toEqual({ traceId: span?.traceId, spanId: span?.spanId, traceFlags: 1 });
    expect(Object.isFrozen(seen)).toBe(true);
    expect(Object.keys(seen as object)).toHaveLength(3);
    expect(activeDuringWith).toEqual([span]);
  });

  it.each(['free text with spaces', 'free text/x'])(
    'drops the prompt id %s from a hand built rendered prompt',
    async (id) => {
      const { telemetry, spans } = setup();
      const rendered = renderedFull();
      const forged = { ...rendered, meta: { ...rendered.meta, id } };

      await telemetry.trace(forged, async () => 1);

      expect(JSON.stringify(spans[0]?.attributes)).not.toContain('free text');
    }
  );

  it('uses the operation option in the name and the attribute', async () => {
    const { telemetry, spans } = setup([], { operation: 'text_completion' });

    await telemetry.trace(renderedFull(), async () => 1);

    expect(spans[0]?.name).toBe('text_completion claude-sonnet-5-5');
    expect(spans[0]?.attributes['gen_ai.operation.name']).toBe('text_completion');
  });

  it('names a span of a bundle without a model by the operation alone', async () => {
    const { telemetry, spans } = setup();

    await telemetry.trace(renderedPlain(), async () => 1);

    expect(spans[0]?.name).toBe('chat');
  });

  it('sets the result attributes before the span ends', async () => {
    const pricing = readPricing(
      JSON.stringify({
        $schema: 'https://getpromptscript.dev/schema/prompt-release-pricing/v1.json',
        models: [
          {
            ref: 'm',
            apiId: 'claude-sonnet-5-5',
            provider: 'anthropic',
            inputUsdPerMillion: 2,
            outputUsdPerMillion: 10,
            checkedOn: '2026-10-22',
          },
        ],
      })
    );
    const { telemetry, spans } = setup([], { pricing });
    const response = { usage: { input_tokens: 1000, output_tokens: 500 }, id: 'msg_1' };

    await telemetry.trace(renderedFull(), async () => response, anthropicResult);

    expect(spans[0]?.attributes).toMatchObject({
      'gen_ai.usage.input_tokens': 1000,
      'gen_ai.usage.output_tokens': 500,
      'gen_ai.response.id': 'msg_1',
      'promptscript.usage.cost_usd': 0.007,
    });
    expect(spans[0]?.endCount).toBe(1);
  });

  it('rethrows the same error and marks the span', async () => {
    const { telemetry, spans } = setup();
    const error = new TypeError('boom jan.kowalski@example.com');

    await expect(
      telemetry.trace(renderedFull(), async () => {
        throw error;
      })
    ).rejects.toBe(error);

    const [span] = spans;
    expect(span?.attributes['error.type']).toBe('TypeError');
    expect(span?.status).toEqual({ code: 2 });
    expect(span?.status).not.toHaveProperty('message');
    expect(span?.endCount).toBe(1);
    expect(span?.events).toEqual([]);
  });

  it('treats a synchronous throw of the call like a rejection', async () => {
    const { telemetry, spans } = setup();
    const error = new PromptRuntimeError('timeout', 'x');
    const call = (): Promise<string> => {
      throw error;
    };

    await expect(telemetry.trace(renderedFull(), call)).rejects.toBe(error);

    expect(spans[0]?.attributes['error.type']).toBe('timeout');
    expect(spans[0]?.endCount).toBe(1);
  });

  it.each<ThrowPoint>(['getTracer', 'startSpan', 'setSpan', 'active'])(
    'runs the call once with the zero ref when %s throws',
    async (point) => {
      // Arrange
      const { telemetry, errors, spans } = setup([point]);
      const call = vi.fn(async (_span: PromptSpanRef) => 'reply');

      // Act
      const value = await telemetry.trace(renderedFull(), call);

      // Assert
      expect(value).toBe('reply');
      expect(call).toHaveBeenCalledTimes(1);
      expect(call.mock.calls[0]?.[0]).toMatchObject({ traceId: ZERO_TRACE, traceFlags: 0 });
      expect(errors).toHaveLength(1);
      expect(errors[0]).toBeInstanceOf(PromptRuntimeError);
      expect(errors[0]?.code).toBe('telemetry-failed');
      expect(errors[0]?.message).toBe('The tracer threw on start.');
      expect('cause' in (errors[0] as object)).toBe(false);
      // A span that started before the failure is ended, none is left open
      expect(spans).toHaveLength(point === 'setSpan' ? 1 : 0);
      for (const span of spans) expect(span.endCount).toBe(1);
    }
  );

  it.each<ThrowPoint>(['with', 'withAfterRun'])(
    'runs the call once and returns its value when context.with fails as %s',
    async (point) => {
      const { telemetry, errors, spans } = setup([point]);
      const call = vi.fn(async () => 'reply');

      const value = await telemetry.trace(renderedFull(), call);

      expect(value).toBe('reply');
      expect(call).toHaveBeenCalledTimes(1);
      expect(errors.map((error) => error.message)).toEqual(['The context threw.']);
      expect(spans[0]?.endCount).toBe(1);
    }
  );

  it('keeps the value and ends the span when read throws, without its message', async () => {
    const { telemetry, errors, spans } = setup();
    const read = (): never => {
      throw new Error('jan.kowalski@example.com');
    };

    const value = await telemetry.trace(renderedFull(), async () => 'reply', read);

    expect(value).toBe('reply');
    expect(spans[0]?.endCount).toBe(1);
    expect(errors.map((error) => error.message)).toEqual(['The read callback threw.']);
    expect(JSON.stringify(errors)).not.toContain('kowalski');
  });

  it.each<[ThrowPoint, string, boolean]>([
    ['setAttribute', 'The span threw on update.', true],
    ['setAttribute', 'The span threw on update.', false],
    ['setStatus', 'The span threw on update.', false],
    ['end', 'The span threw on end.', true],
  ])('keeps the outcome when %s throws (success: %s)', async (point, message, success) => {
    // Arrange
    const { telemetry, errors } = setup([point]);
    const failure = new Error('call failed');
    const call = async (): Promise<string> => {
      if (success) return 'reply';
      throw failure;
    };
    const read = (): { inputTokens: number } => ({ inputTokens: 1 });

    // Act
    const outcome = await telemetry.trace(renderedFull(), call, read).catch((e: unknown) => e);

    // Assert
    expect(outcome).toBe(success ? 'reply' : failure);
    expect(errors.map((error) => error.message)).toEqual([message]);
  });

  it('survives an onError that throws or returns a rejected promise', async () => {
    const fake = createFakeOtel(new Set<ThrowPoint>(['startSpan']));
    const throwing = createPromptTelemetry(fake.api, {
      onError: () => {
        throw new Error('callback failed');
      },
    });
    const rejecting = createPromptTelemetry(fake.api, {
      onError: (() => Promise.reject(new Error('later'))) as never,
    });

    await expect(throwing.trace(renderedFull(), async () => 1)).resolves.toBe(1);
    await expect(rejecting.trace(renderedFull(), async () => 2)).resolves.toBe(2);
    await new Promise((resolve) => setTimeout(resolve, 0));
  });

  it('works without an onError callback', async () => {
    const fake = createFakeOtel(new Set<ThrowPoint>(['startSpan']));
    const telemetry = createPromptTelemetry(fake.api);

    await expect(telemetry.trace(renderedFull(), async () => 1)).resolves.toBe(1);
  });

  it.each([
    ['not valid hex', { traceId: 'x', spanId: 'y', traceFlags: 1 }],
    [
      'objects whose toString looks like an id',
      {
        traceId: { toString: () => 'a'.repeat(32) } as unknown as string,
        spanId: { toString: () => 'b'.repeat(16) } as unknown as string,
        traceFlags: 1,
      },
    ],
    [
      'flags that are no number',
      { traceId: 'a'.repeat(32), spanId: 'b'.repeat(16), traceFlags: '1' as unknown as number },
    ],
  ])('uses the zero ref for a span context that is %s', async (_name, context) => {
    const fake = createFakeOtel();
    const api = {
      ...fake.api,
      trace: {
        ...fake.api.trace,
        getTracer: () => ({
          startSpan: () => ({
            spanContext: () => context,
            setAttribute: () => undefined,
            setStatus: () => undefined,
            addEvent: () => undefined,
            end: () => undefined,
          }),
        }),
      },
    };
    const telemetry = createPromptTelemetry(api);
    let seen: PromptSpanRef | undefined;

    await telemetry.trace(renderedFull(), async (span) => (seen = span));

    expect(seen?.traceId).toBe(ZERO_TRACE);
  });
});

describe('attributes', () => {
  it('returns the frozen start attributes', () => {
    const { telemetry } = setup();

    const attributes = telemetry.attributes(renderedFull());

    expect(Object.isFrozen(attributes)).toBe(true);
    expect(attributes['promptscript.prompt.id']).toBe('acme-support/refund-reply');
  });

  it('returns {} and reports when a meta getter throws', () => {
    const { telemetry, errors } = setup();
    const rendered = renderedFull();
    const meta = Object.defineProperty({ ...rendered.meta }, 'id', {
      get: () => {
        throw new Error('hostile');
      },
    });

    const attributes = telemetry.attributes({ ...rendered, meta });

    expect(attributes).toEqual({});
    expect(Object.isFrozen(attributes)).toBe(true);
    expect(errors.map((error) => error.message)).toEqual(['The attributes could not be read.']);
  });
});

describe('createPromptTelemetry', () => {
  const { api } = createFakeOtel();

  it.each<[string, unknown, string]>([
    ['tracerName', { tracerName: '' }, 'tracerName'],
    ['tracerName with a control character', { tracerName: 'a\nb' }, 'tracerName'],
    ['operation', { operation: 'embed' }, 'operation'],
    ['provider', { provider: 'Anthropic' }, 'provider'],
    ['pricing', { pricing: {} }, 'pricing'],
    ['genAi', { genAi: 'yes' }, 'genAi'],
    ['onError', { onError: 3 }, 'onError'],
  ])('throws a TypeError for a bad %s that names it and not its value', (_name, options, part) => {
    let error: unknown;
    try {
      createPromptTelemetry(api, options as PromptTelemetryOptions);
    } catch (caught) {
      error = caught;
    }

    expect(error).toBeInstanceOf(TypeError);
    expect((error as Error).message).toContain(part);
    expect((error as Error).message).not.toContain('Anthropic');
  });

  it.each([null, {}, { trace: {} }, { context: {} }, { trace: 1, context: {} }])(
    'throws a TypeError for an api of %j',
    (bad) => {
      expect(() => createPromptTelemetry(bad as never)).toThrow(TypeError);
    }
  );

  it('accepts a custom tracer name and the other options', async () => {
    const options: PromptTelemetryOptions = {
      tracerName: 'my-app',
      provider: 'acme',
      genAi: false,
      pricing: { find: () => undefined },
    };
    const { telemetry, spans } = setup([], options);

    await telemetry.trace(renderedPlain(), async () => 1);

    expect(Object.keys(spans[0]?.attributes ?? {})).toEqual([
      'promptscript.prompt.id',
      'promptscript.prompt.content_hash',
    ]);
  });
});

describe('what is recorded', () => {
  const PII = ['jan.kowalski@example.com', '4111', 'internal.example', 'user-7f3a', 'Kowalski'];
  const LOADED_AT = '2026-10-30T10:00:00.000Z';
  const LABEL_V2 = 'https://getpromptscript.dev/schema/prompt-release-label/v2.json';

  /** A client whose source and key hold private text, and a label that runs an experiment. */
  async function privatePrompt() {
    const control = makeBundle({ model: undefined });
    const warm = makeBundle({ description: 'Warm' });
    const files = new Map<string, string>([
      [`bundles/${control['contentHash'] as string}.json`, JSON.stringify(control)],
      [`bundles/${warm['contentHash'] as string}.json`, JSON.stringify(warm)],
      [
        'prod.json',
        JSON.stringify({
          $schema: LABEL_V2,
          environment: 'prod',
          prompts: [
            {
              id: control['id'],
              contentHash: control['contentHash'],
              experiment: {
                name: 'warm-tone',
                arms: [
                  { variant: 'control', contentHash: control['contentHash'], weight: 5000 },
                  { variant: 'warm', contentHash: warm['contentHash'], weight: 5000 },
                ],
              },
            },
          ],
        }),
      ],
    ]);
    const source: PromptSource = {
      name: 'https://internal.example/releases/',
      read: async (path) => {
        const text = files.get(path);
        if (text === undefined) throw new Error('missing');
        return { text };
      },
    };
    const client = createPromptClient({ source, label: 'prod' });
    const prompt = await client.get(control['id'] as string, { key: 'user-7f3a' });
    return prompt;
  }

  it('holds no input, key, source, load time or error text in any span', async () => {
    // Arrange
    const { telemetry, spans } = setup();
    const prompt = await privatePrompt();
    const rendered = prompt.render({
      message: 'Jan Kowalski jan.kowalski@example.com 4111 1111 1111 1111',
    });

    // Act
    await telemetry
      .trace(rendered, async () => {
        throw new Error('jan.kowalski@example.com');
      })
      .catch(() => undefined);
    telemetry.feedback({
      span: { traceId: 'a'.repeat(32), spanId: 'b'.repeat(16), traceFlags: 1 },
      name: 'user.thumbs',
      score: 1,
      prompt: rendered.meta,
    });

    // Assert
    const recorded = JSON.stringify(spans.map(({ parent: _parent, ...rest }) => rest));
    for (const secret of [...PII, LOADED_AT, rendered.meta.loadedAt]) {
      expect(recorded).not.toContain(secret);
    }
    expect(rendered.meta.experiment).toBe('warm-tone');
    expect(spans[0]?.attributes).toMatchObject({
      'promptscript.experiment.name': 'warm-tone',
      'promptscript.experiment.variant': rendered.meta.variant,
      'promptscript.prompt.label': 'prod',
    });
    expect(spans[1]?.attributes['promptscript.experiment.name']).toBe('warm-tone');
  });
});
