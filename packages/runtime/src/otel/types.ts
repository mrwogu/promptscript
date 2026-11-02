import type { PromptRuntimeError } from '../errors.js';
import type { PromptMeta, RenderedPrompt } from '../types.js';

/** Attribute value the telemetry entry writes. */
export type PromptAttributeValue = string | number | boolean | string[];

/** Attributes by name. */
export type PromptAttributes = Readonly<Record<string, PromptAttributeValue>>;

/** The part of an OpenTelemetry span context the entry reads and writes. */
export interface OtelSpanContextLike {
  readonly traceId: string;
  readonly spanId: string;
  readonly traceFlags: number;
  readonly isRemote?: boolean;
}

/** The part of an OpenTelemetry span the entry uses. */
export interface OtelSpanLike {
  spanContext(): OtelSpanContextLike;
  setAttribute(key: string, value: PromptAttributeValue): unknown;
  setStatus(status: { code: number }): unknown;
  addEvent(name: string, attributes?: PromptAttributes): unknown;
  end(): void;
}

/** Span options the entry passes to `startSpan`. */
export interface OtelSpanOptionsLike {
  kind?: number;
  attributes?: PromptAttributes;
}

/** The part of an OpenTelemetry tracer the entry uses. */
export interface OtelTracerLike {
  startSpan(name: string, options?: OtelSpanOptionsLike, context?: unknown): OtelSpanLike;
}

/**
 * The part of the `@opentelemetry/api` namespace the entry uses. The namespace object itself
 * fits, so the application passes `import * as otel from '@opentelemetry/api'`.
 */
export interface OtelApiLike {
  readonly trace: {
    getTracer(name: string): OtelTracerLike;
    wrapSpanContext(spanContext: OtelSpanContextLike): OtelSpanLike;
    setSpan(context: unknown, span: OtelSpanLike): unknown;
  };
  readonly context: {
    active(): unknown;
    with(context: unknown, fn: () => unknown): unknown;
  };
  readonly SpanKind: { readonly CLIENT: number; readonly INTERNAL: number };
  readonly SpanStatusCode: { readonly ERROR: number };
}

/** Price of one model, in USD per million tokens. */
export interface PromptModelPrice {
  readonly ref: string;
  readonly provider: string;
  readonly apiId: string;
  readonly inputUsdPerMillion: number;
  readonly outputUsdPerMillion: number;
  readonly checkedOn: string;
}

/** Prices read from a release `pricing.json`. */
export interface PromptPricingTable {
  /** Price of a model by provider and API id, or undefined when the release has none */
  find(provider: string, apiId: string): PromptModelPrice | undefined;
}

/** Options of `createPromptTelemetry`. */
export interface PromptTelemetryOptions {
  /** Tracer name. Default `@promptscript/runtime`. */
  readonly tracerName?: string;
  /** `gen_ai.operation.name` and span name prefix. Default `chat`. */
  readonly operation?: 'chat' | 'text_completion' | 'generate_content';
  /** `gen_ai.provider.name` when the bundle declares no model */
  readonly provider?: string;
  /** Prices from `readPricing`; enables `promptscript.usage.cost_usd` */
  readonly pricing?: PromptPricingTable;
  /** Default true; false writes the `promptscript.*` attributes and `error.type` only */
  readonly genAi?: boolean;
  /** Called with `telemetry-failed` when the tracer or `read` throws. Never with a cause. */
  readonly onError?: (error: PromptRuntimeError) => void;
}

/** Ids of a call span, to keep next to a session and pass to `feedback` later. */
export interface PromptSpanRef {
  /** 32 lowercase hex digits */
  readonly traceId: string;
  /** 16 lowercase hex digits */
  readonly spanId: string;
  /** 0 or 1, the sampled bit of the call span */
  readonly traceFlags: number;
}

/** What a model call returned, as far as the span records it. */
export interface PromptCallResult {
  readonly inputTokens?: number;
  readonly outputTokens?: number;
  readonly responseModel?: string;
  readonly responseId?: string;
  readonly finishReasons?: readonly string[];
}

/** A score or label for an earlier call. It has no free text field. */
export interface PromptFeedback {
  readonly span: PromptSpanRef;
  /** Evaluation name, such as `user.thumbs`: a lowercase letter, then up to 63 of a-z 0-9 _ . - */
  readonly name: string;
  /** Finite number */
  readonly score?: number;
  /** Such as `positive`: a lowercase letter, then up to 31 of a-z 0-9 _ - */
  readonly label?: string;
  /** Meta of the rendered prompt, copies the prompt attributes onto the feedback span */
  readonly prompt?: PromptMeta;
}

/** Spans for model calls and feedback. */
export interface PromptTelemetry {
  /**
   * Run `call` inside a span of the rendered prompt. The result is returned and an error is
   * rethrown as it is; a failure of the tracer never reaches the call.
   */
  trace<T>(
    rendered: RenderedPrompt,
    call: (span: PromptSpanRef) => Promise<T>,
    read?: (result: T) => PromptCallResult
  ): Promise<T>;
  /** The start attributes of a span, for an application that has its own span */
  attributes(rendered: RenderedPrompt): PromptAttributes;
  /** Record a score or label on a new span under the call span */
  feedback(input: PromptFeedback): void;
}
