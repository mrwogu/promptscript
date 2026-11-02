import { describe, expect, it, vi } from 'vitest';
import { createFakeOtel, type ThrowPoint } from '../__tests__/fake-otel.js';
import { renderedFull } from '../__tests__/rendered.js';
import { PromptRuntimeError } from '../errors.js';
import { createPromptTelemetry } from './telemetry.js';
import type { PromptFeedback, PromptSpanRef } from './types.js';

const REF: PromptSpanRef = { traceId: 'a'.repeat(32), spanId: 'b'.repeat(16), traceFlags: 1 };
const ZERO: PromptSpanRef = { traceId: '0'.repeat(32), spanId: '0'.repeat(16), traceFlags: 0 };

function setup(throwOn: ThrowPoint[] = []) {
  const fake = createFakeOtel(new Set(throwOn));
  const errors: PromptRuntimeError[] = [];
  const telemetry = createPromptTelemetry(fake.api, { onError: (error) => errors.push(error) });
  return { ...fake, errors, telemetry };
}

const refusal = (run: () => unknown): PromptRuntimeError => {
  try {
    run();
  } catch (error) {
    return error as PromptRuntimeError;
  }
  throw new Error('expected a refusal');
};

describe('feedback', () => {
  it('records an evaluation event on a span under the call span', () => {
    // Arrange
    const { telemetry, spans, wrapped } = setup();

    // Act
    telemetry.feedback({ span: REF, name: 'user.thumbs', score: 1, label: 'positive' });

    // Assert
    expect(wrapped).toEqual([{ ...REF, isRemote: true }]);
    expect(spans).toHaveLength(1);
    const [span] = spans;
    expect(span).toMatchObject({ name: 'evaluate user.thumbs', kind: 0, endCount: 1 });
    expect(span?.parent).toMatchObject({ traceId: REF.traceId, spanId: REF.spanId });
    expect(span?.events).toEqual([
      {
        name: 'gen_ai.evaluation.result',
        attributes: {
          'gen_ai.evaluation.name': 'user.thumbs',
          'gen_ai.evaluation.score.value': 1,
          'gen_ai.evaluation.score.label': 'positive',
        },
      },
    ]);
    expect(JSON.stringify(spans)).not.toContain('explanation');
  });

  it.each([0, 1])('passes the sampled flag %d through', (traceFlags) => {
    const { telemetry, wrapped } = setup();

    telemetry.feedback({ span: { ...REF, traceFlags }, name: 'user.thumbs', score: 1 });

    expect(wrapped[0]?.traceFlags).toBe(traceFlags);
  });

  it('writes only the given score or label', () => {
    const { telemetry, spans } = setup();

    telemetry.feedback({ span: REF, name: 'a', score: 0 });
    telemetry.feedback({ span: REF, name: 'b', label: 'negative' });

    expect(spans[0]?.events[0]?.attributes).toEqual({
      'gen_ai.evaluation.name': 'a',
      'gen_ai.evaluation.score.value': 0,
    });
    expect(spans[1]?.events[0]?.attributes).toEqual({
      'gen_ai.evaluation.name': 'b',
      'gen_ai.evaluation.score.label': 'negative',
    });
  });

  it('copies the prompt attributes of a rendered meta and of a plain meta', () => {
    const { telemetry, spans } = setup();
    const rendered = renderedFull();
    const plain = { ...rendered.meta, warnings: undefined };
    delete plain.warnings;

    telemetry.feedback({ span: REF, name: 'a', score: 1, prompt: rendered.meta });
    telemetry.feedback({ span: REF, name: 'a', score: 1, prompt: plain });

    for (const span of spans) {
      expect(span.attributes).toEqual({
        'promptscript.prompt.id': rendered.meta.id,
        'promptscript.prompt.content_hash': rendered.meta.contentHash,
      });
    }
  });

  it('accepts a null prototype object', () => {
    const { telemetry, spans } = setup();
    const input = Object.assign(Object.create(null) as object, {
      span: REF,
      name: 'a',
      score: 1,
    });

    telemetry.feedback(input as PromptFeedback);

    expect(spans).toHaveLength(1);
  });

  it.each<[string, unknown, string]>([
    ['a missing span', { span: undefined }, 'span'],
    ['a short trace id', { span: { ...REF, traceId: 'a'.repeat(31) } }, 'span.traceId'],
    ['an uppercase trace id', { span: { ...REF, traceId: 'A'.repeat(32) } }, 'span.traceId'],
    ['a non hex trace id', { span: { ...REF, traceId: 'g'.repeat(32) } }, 'span.traceId'],
    ['a short span id', { span: { ...REF, spanId: 'b'.repeat(15) } }, 'span.spanId'],
    ['a zero trace id with a span id', { span: { ...REF, traceId: ZERO.traceId } }, 'span.traceId'],
    ['a zero span id with a trace id', { span: { ...REF, spanId: ZERO.spanId } }, 'span.spanId'],
    ['flags 2', { span: { ...REF, traceFlags: 2 } }, 'span.traceFlags'],
    ['flags as a string', { span: { ...REF, traceFlags: '1' } }, 'span.traceFlags'],
    ['missing flags', { span: { traceId: REF.traceId, spanId: REF.spanId } }, 'span.traceFlags'],
    ['a missing trace id', { span: { spanId: REF.spanId, traceFlags: 1 } }, 'span.traceId'],
    ['a missing span id', { span: { traceId: REF.traceId, traceFlags: 1 } }, 'span.spanId'],
    ['an uppercase name', { name: 'User.Thumbs' }, 'name'],
    ['a long name', { name: `a${'b'.repeat(64)}` }, 'name'],
    ['an empty name', { name: '' }, 'name'],
    ['a missing name', { name: undefined }, 'name'],
    ['an uppercase label', { label: 'Positive' }, 'label'],
    ['a long label', { label: `a${'b'.repeat(32)}` }, 'label'],
    ['a NaN score', { score: Number.NaN }, 'score'],
    ['an infinite score', { score: Number.POSITIVE_INFINITY }, 'score'],
    ['a string score', { score: '1' }, 'score'],
    ['neither score nor label', { score: undefined }, 'score or label'],
    ['a comment', { comment: 'great' }, 'not allowed'],
    ['an explanation', { explanation: 'great' }, 'not allowed'],
    ['an unknown key', { foo: 1 }, 'not allowed'],
    ['a span extra key', { span: { ...REF, extra: 1 } }, 'not allowed'],
    ['a prompt comment', { prompt: { comment: 'x' } }, 'not allowed'],
    ['a forged content hash', { prompt: { contentHash: 'x' } }, 'prompt.contentHash'],
    ['a prompt id that is free text', { prompt: { id: 'free text with spaces' } }, 'prompt.id'],
    ['a prompt id with free text before the slash', { prompt: { id: 'free text/x' } }, 'prompt.id'],
    ['a forged variant', { prompt: { variant: 'Warm' } }, 'prompt.variant'],
    ['a prompt that is no object', { prompt: 'x' }, 'prompt'],
    ['a span that is no object', { span: 'x' }, 'span'],
  ])('refuses %s', (_name, patch, part) => {
    // Arrange
    const { telemetry, spans } = setup();
    const input = { span: REF, name: 'user.thumbs', score: 1, ...(patch as object) };

    // Act
    const error = refusal(() => telemetry.feedback(input as PromptFeedback));

    // Assert
    expect(error).toBeInstanceOf(PromptRuntimeError);
    expect(error.code).toBe('invalid-feedback');
    expect(error.message).toContain(part);
    expect(spans).toEqual([]);
  });

  it('refuses an input that is not a plain object', () => {
    const { telemetry } = setup();
    class Holder {
      span = REF;
      name = 'a';
      score = 1;
    }
    const inherited = Object.create({}) as Record<string, unknown>;
    Object.assign(inherited, { span: REF, name: 'a', score: 1 });
    const symbolic = { span: REF, name: 'a', score: 1, [Symbol('x')]: 1 };
    const accessor = Object.defineProperty({ span: REF, score: 1 }, 'name', {
      enumerable: true,
      get: () => 'a',
    });

    for (const input of [[], null, new Holder(), inherited, symbolic, accessor, 'text']) {
      expect(refusal(() => telemetry.feedback(input as PromptFeedback)).code).toBe(
        'invalid-feedback'
      );
    }
  });

  it('never runs a getter of the prototype', () => {
    const { telemetry } = setup();
    const getter = vi.fn(() => 'x');
    const proto = Object.defineProperty({}, 'comment', { get: getter });
    const input = Object.assign(Object.create(proto) as object, { span: REF, name: 'a', score: 1 });

    expect(refusal(() => telemetry.feedback(input as PromptFeedback)).code).toBe(
      'invalid-feedback'
    );
    expect(getter).not.toHaveBeenCalled();
  });

  it('never runs a getter of a meta field it does not read', () => {
    const { telemetry, spans } = setup();
    const getter = vi.fn(() => 'x');
    const prompt = Object.defineProperty({ id: 'a/b' }, 'warnings', { get: getter });

    telemetry.feedback({ span: REF, name: 'a', score: 1, prompt: prompt as never });

    expect(getter).not.toHaveBeenCalled();
    expect(spans).toHaveLength(1);
  });

  it('does not echo an unknown key', () => {
    const { telemetry } = setup();
    const key = 'my email is jan.kowalski@example.com';
    const input = { span: REF, name: 'a', score: 1, [key]: 1 };

    const error = refusal(() => telemetry.feedback(input as PromptFeedback));

    expect(error.message).not.toContain('kowalski');
  });

  it('records nothing and does not throw for the all-zero ref', () => {
    const { telemetry, spans, errors } = setup();

    expect(() => telemetry.feedback({ span: ZERO, name: 'user.thumbs', score: 1 })).not.toThrow();

    expect(spans).toEqual([]);
    expect(errors).toEqual([]);
  });

  it.each<[ThrowPoint, string]>([
    ['startSpan', 'The tracer threw on feedback.'],
    ['wrapSpanContext', 'The tracer threw on feedback.'],
    ['addEvent', 'The tracer threw on feedback.'],
    ['end', 'The span threw on end.'],
  ])('reports a failure of %s and does not throw', (point, message) => {
    const { telemetry, errors, spans } = setup([point]);

    expect(() => telemetry.feedback({ span: REF, name: 'a', score: 1 })).not.toThrow();

    // A feedback span that started is always ended
    for (const span of spans) expect(span.endCount).toBe(1);

    expect(errors.map((error) => error.message)).toEqual([message]);
    expect(errors[0]?.code).toBe('telemetry-failed');
  });
});
