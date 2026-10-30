import { PromptRuntimeError } from '../errors.js';
import type { RenderedPrompt } from '../types.js';
import {
  errorType,
  metaAttributes,
  promptAttributes,
  resultAttributes,
  type AttributeSettings,
} from './attributes.js';
import { isObject, matches, text } from './check.js';
import { checkFeedback, NAME, SPAN_ID, TRACE_ID } from './feedback.js';
import type {
  OtelApiLike,
  OtelSpanContextLike,
  OtelSpanLike,
  PromptAttributes,
  PromptCallResult,
  PromptFeedback,
  PromptSpanRef,
  PromptTelemetry,
  PromptTelemetryOptions,
} from './types.js';

const OPERATIONS: ReadonlySet<unknown> = new Set(['chat', 'text_completion', 'generate_content']);
const DEFAULT_TRACER = '@promptscript/runtime';

// What the app gets when no span could start, and what a no-op API hands out
const ZERO_REF: PromptSpanRef = Object.freeze({
  traceId: '0'.repeat(32),
  spanId: '0'.repeat(16),
  traceFlags: 0,
});

type Outcome<T> = { ok: true; value: T } | { ok: false; error: unknown };

interface Env {
  readonly api: OtelApiLike;
  readonly settings: AttributeSettings;
  readonly tracerName: string;
  report(message: string): void;
}

interface Started {
  readonly span: OtelSpanLike;
  readonly context: unknown;
  readonly ref: PromptSpanRef;
}

const OPTION_CHECKS: readonly (readonly [
  keyof PromptTelemetryOptions,
  (value: unknown) => boolean,
])[] = [
  ['tracerName', (value) => text(value, 128)],
  ['operation', (value) => OPERATIONS.has(value)],
  ['provider', (value) => matches(value, NAME)],
  ['pricing', (value) => isObject(value) && typeof value['find'] === 'function'],
  ['genAi', (value) => typeof value === 'boolean'],
  ['onError', (value) => typeof value === 'function'],
];

function checkOptions(api: unknown, options: PromptTelemetryOptions): void {
  if (!isObject(api) || !isObject(api['trace']) || !isObject(api['context'])) {
    throw new TypeError('Option api must be the OpenTelemetry API namespace.');
  }
  for (const [name, ok] of OPTION_CHECKS) {
    if (options[name] !== undefined && !ok(options[name])) {
      throw new TypeError(`Option ${name} is not valid.`);
    }
  }
}

function toRef(context: OtelSpanContextLike): PromptSpanRef {
  const { traceId, spanId, traceFlags } = context;
  // A hostile span context could hand over objects whose toString looks like an id
  const valid =
    matches(traceId, TRACE_ID) && matches(spanId, SPAN_ID) && typeof traceFlags === 'number';
  if (!valid) return ZERO_REF;
  return Object.freeze({ traceId, spanId, traceFlags: traceFlags & 1 });
}

function start(env: Env, rendered: RenderedPrompt): Started | undefined {
  const { api, settings } = env;
  let span: OtelSpanLike | undefined;
  try {
    const attributes = promptAttributes(rendered, settings);
    const apiId = rendered.model?.apiId;
    const name = text(apiId, 128) ? `${settings.operation} ${apiId}` : settings.operation;
    const parent = api.context.active();
    const started = api.trace
      .getTracer(env.tracerName)
      .startSpan(name, { kind: api.SpanKind.CLIENT, attributes }, parent);
    span = started;
    const ref = toRef(started.spanContext());
    return { span: started, context: api.trace.setSpan(parent, started), ref };
  } catch {
    env.report('The tracer threw on start.');
    // A span that started but could not be used must not stay open
    if (span) endSpan(env, span);
    return undefined;
  }
}

/** Run the call and keep its outcome, so a throw of any kind is data and never escapes. */
async function settle<T>(
  call: (span: PromptSpanRef) => Promise<T>,
  ref: PromptSpanRef
): Promise<Outcome<T>> {
  try {
    return { ok: true, value: await call(ref) };
  } catch (error) {
    return { ok: false, error };
  }
}

function recordResult<T>(
  env: Env,
  span: OtelSpanLike,
  rendered: RenderedPrompt,
  read: (result: T) => PromptCallResult,
  value: T
): void {
  let attributes: PromptAttributes;
  try {
    attributes = resultAttributes(read(value), rendered, env.settings);
  } catch {
    env.report('The read callback threw.');
    return;
  }
  for (const [key, attribute] of Object.entries(attributes)) span.setAttribute(key, attribute);
}

function endSpan(env: Env, span: OtelSpanLike): void {
  try {
    span.end();
  } catch {
    env.report('The span threw on end.');
  }
}

function finish<T>(
  env: Env,
  span: OtelSpanLike,
  outcome: Outcome<T>,
  rendered: RenderedPrompt,
  read: ((result: T) => PromptCallResult) | undefined
): void {
  try {
    if (!outcome.ok) {
      span.setAttribute('error.type', errorType(outcome.error));
      span.setStatus({ code: env.api.SpanStatusCode.ERROR });
    } else if (read) {
      recordResult(env, span, rendered, read, outcome.value);
    }
  } catch {
    env.report('The span threw on update.');
  }
  endSpan(env, span);
}

async function trace<T>(
  env: Env,
  rendered: RenderedPrompt,
  call: (span: PromptSpanRef) => Promise<T>,
  read: ((result: T) => PromptCallResult) | undefined
): Promise<T> {
  const started = start(env, rendered);
  if (!started) return call(ZERO_REF);
  const slot: { pending?: Promise<Outcome<T>> } = {};
  const run = (): Promise<Outcome<T>> => {
    slot.pending ??= settle(call, started.ref);
    return slot.pending;
  };
  try {
    // The call runs with the span active, so spans of an instrumented client become children
    env.api.context.with(started.context, run);
  } catch {
    env.report('The context threw.');
  }
  const outcome = await (slot.pending ?? run());
  finish(env, started.span, outcome, rendered, read);
  if (outcome.ok) return outcome.value;
  throw outcome.error;
}

function recordFeedback(env: Env, input: PromptFeedback): void {
  const checked = checkFeedback(input);
  if (!checked) return;
  const { api } = env;
  const { span: ref, name, score, label, prompt } = checked;
  let span: OtelSpanLike | undefined;
  try {
    const parent = api.trace.wrapSpanContext({ ...ref, isRemote: true });
    const context = api.trace.setSpan(api.context.active(), parent);
    span = api.trace
      .getTracer(env.tracerName)
      .startSpan(
        `evaluate ${name}`,
        { kind: api.SpanKind.INTERNAL, attributes: prompt ? metaAttributes(prompt) : {} },
        context
      );
    span.addEvent('gen_ai.evaluation.result', {
      'gen_ai.evaluation.name': name,
      ...(score !== undefined && { 'gen_ai.evaluation.score.value': score }),
      ...(label !== undefined && { 'gen_ai.evaluation.score.label': label }),
    });
  } catch {
    env.report('The tracer threw on feedback.');
  } finally {
    if (span) endSpan(env, span);
  }
}

/**
 * Create spans for model calls and feedback. The application passes its own OpenTelemetry API
 * namespace, so this entry imports nothing and works with any 1.9 or later 1.x API.
 *
 * A span records ids, the prompt hash, the model parameters and token counts. It never records
 * inputs, messages, response text, assignment keys, sources or error messages. A failure of the
 * tracer never reaches the call: it goes to `onError` as `telemetry-failed`.
 *
 * @param api - The `@opentelemetry/api` namespace
 * @param options - Tracer name, operation, provider, prices, `genAi` switch and error callback
 * @returns The telemetry object
 * @throws {TypeError} when `api` or an option has the wrong shape
 *
 * @example
 * import * as otel from '@opentelemetry/api';
 * const telemetry = createPromptTelemetry(otel);
 * const reply = await telemetry.trace(rendered, (span) => callModel(body), anthropicResult);
 */
export function createPromptTelemetry(
  api: OtelApiLike,
  options: PromptTelemetryOptions = {}
): PromptTelemetry {
  checkOptions(api, options);
  const { onError } = options;
  const env: Env = {
    api,
    settings: {
      operation: options.operation ?? 'chat',
      provider: options.provider,
      genAi: options.genAi ?? true,
      pricing: options.pricing,
    },
    tracerName: options.tracerName ?? DEFAULT_TRACER,
    report(message) {
      if (!onError) return;
      try {
        const result: unknown = onError(new PromptRuntimeError('telemetry-failed', message));
        // A callback that returns a rejected promise must not become an unhandled rejection
        if (result instanceof Promise) result.catch(() => undefined);
      } catch {
        // The callback must not break the call either
      }
    },
  };
  return {
    trace: (rendered, call, read) => trace(env, rendered, call, read),
    attributes(rendered) {
      try {
        return Object.freeze(promptAttributes(rendered, env.settings));
      } catch {
        env.report('The attributes could not be read.');
        return Object.freeze({});
      }
    },
    feedback: (input) => recordFeedback(env, input),
  };
}
