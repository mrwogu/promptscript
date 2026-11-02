import * as otel from '@opentelemetry/api';
import { AsyncLocalStorageContextManager } from '@opentelemetry/context-async-hooks';
import {
  AlwaysOnSampler,
  InMemorySpanExporter,
  ParentBasedSampler,
  SimpleSpanProcessor,
  TracerProvider,
} from '@opentelemetry/sdk-trace';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { renderedFull } from '../__tests__/rendered.js';
import { readPricing } from './pricing.js';
import { anthropicResult } from './readers.js';
import { createPromptTelemetry } from './telemetry.js';
import type { PromptSpanRef } from './types.js';

const exporter = new InMemorySpanExporter();
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

beforeAll(() => {
  otel.context.setGlobalContextManager(new AsyncLocalStorageContextManager().enable());
  otel.trace.setGlobalTracerProvider(
    new TracerProvider({
      sampler: new ParentBasedSampler({ root: new AlwaysOnSampler() }),
      spanProcessors: [new SimpleSpanProcessor({ exporter })],
    })
  );
});

afterEach(() => exporter.reset());

afterAll(() => {
  otel.trace.disable();
  otel.context.disable();
});

describe('with the OpenTelemetry SDK', () => {
  it('exports a client span that holds the prompt hash and the cost', async () => {
    // Arrange
    const telemetry = createPromptTelemetry(otel, { pricing });
    const rendered = renderedFull();
    let ref: PromptSpanRef | undefined;
    const response = { usage: { input_tokens: 1000, output_tokens: 500 } };

    // Act
    await telemetry.trace(
      rendered,
      async (span) => {
        ref = span;
        return response;
      },
      anthropicResult
    );

    // Assert
    const [span] = exporter.getFinishedSpans();
    expect(span?.name).toBe('chat claude-sonnet-5-5');
    expect(span?.kind).toBe(otel.SpanKind.CLIENT);
    expect(span?.attributes['promptscript.prompt.content_hash']).toBe(rendered.meta.contentHash);
    expect(span?.attributes['promptscript.usage.cost_usd']).toBe(0.007);
    expect(ref).toEqual({
      traceId: span?.spanContext().traceId,
      spanId: span?.spanContext().spanId,
      traceFlags: 1,
    });
  });

  it('makes a span started inside the call a child of the call span', async () => {
    const telemetry = createPromptTelemetry(otel);

    await telemetry.trace(renderedFull(), async () => {
      otel.trace.getTracer('http').startSpan('fetch').end();
    });

    const spans = exporter.getFinishedSpans();
    const call = spans.find((span) => span.name === 'chat claude-sonnet-5-5');
    const child = spans.find((span) => span.name === 'fetch');
    expect(child?.parentSpanContext?.spanId).toBe(call?.spanContext().spanId);
  });

  it('exports a feedback span under the call span as a remote parent', async () => {
    // Arrange
    const telemetry = createPromptTelemetry(otel);
    let ref: PromptSpanRef | undefined;
    await telemetry.trace(renderedFull(), async (span) => {
      ref = span;
    });

    // Act
    telemetry.feedback({ span: ref as PromptSpanRef, name: 'user.thumbs', score: 1, label: 'up' });

    // Assert
    const feedback = exporter.getFinishedSpans().find((span) => span.name.startsWith('evaluate'));
    expect(feedback?.kind).toBe(otel.SpanKind.INTERNAL);
    expect(feedback?.parentSpanContext).toMatchObject({
      traceId: ref?.traceId,
      spanId: ref?.spanId,
      isRemote: true,
    });
    expect(feedback?.events).toHaveLength(1);
    expect(feedback?.events[0]?.name).toBe('gen_ai.evaluation.result');
    expect(feedback?.events[0]?.attributes).toEqual({
      'gen_ai.evaluation.name': 'user.thumbs',
      'gen_ai.evaluation.score.value': 1,
      'gen_ai.evaluation.score.label': 'up',
    });
  });

  it('exports no feedback span for a ref that was not sampled', () => {
    const telemetry = createPromptTelemetry(otel);
    const ref: PromptSpanRef = { traceId: 'a'.repeat(32), spanId: 'b'.repeat(16), traceFlags: 0 };

    telemetry.feedback({ span: ref, name: 'user.thumbs', score: 1 });

    expect(exporter.getFinishedSpans()).toEqual([]);
  });

  it('exports an error status without a message or an exception event', async () => {
    const telemetry = createPromptTelemetry(otel);

    await telemetry
      .trace(renderedFull(), async () => {
        throw new RangeError('jan.kowalski@example.com');
      })
      .catch(() => undefined);

    const [span] = exporter.getFinishedSpans();
    expect(span?.status.code).toBe(otel.SpanStatusCode.ERROR);
    expect(span?.status.message).toBeUndefined();
    expect(span?.events).toEqual([]);
    expect(span?.attributes['error.type']).toBe('RangeError');
  });
});
