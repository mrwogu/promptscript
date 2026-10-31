import type {
  OtelApiLike,
  OtelSpanContextLike,
  OtelSpanLike,
  PromptAttributes,
  PromptAttributeValue,
} from '../otel/types.js';

export type ThrowPoint =
  | 'getTracer'
  | 'startSpan'
  | 'setSpan'
  | 'with'
  | 'withAfterRun'
  | 'setAttribute'
  | 'setStatus'
  | 'addEvent'
  | 'end'
  | 'wrapSpanContext'
  | 'active';

export interface RecordedSpan {
  name: string;
  kind: number | undefined;
  attributes: Record<string, PromptAttributeValue>;
  status: { code: number } | undefined;
  events: { name: string; attributes: PromptAttributes | undefined }[];
  endCount: number;
  /** The span the context carried when this one started */
  parent: RecordedSpan | undefined;
  traceId: string;
  spanId: string;
  traceFlags: number;
}

export interface FakeOtel {
  api: OtelApiLike;
  spans: RecordedSpan[];
  /** The span active while a function given to `context.with` runs */
  activeDuringWith: (RecordedSpan | undefined)[];
  wrapped: OtelSpanContextLike[];
}

interface FakeContext {
  span: RecordedSpan | undefined;
}

interface FakeSpan extends OtelSpanLike {
  record: RecordedSpan;
}

const hex = (n: number, width: number): string => n.toString(16).padStart(width, '0');

/** An in-memory OpenTelemetry API that records spans and can throw from any member. */
export function createFakeOtel(throwOn: ReadonlySet<ThrowPoint> = new Set()): FakeOtel {
  const spans: RecordedSpan[] = [];
  const activeDuringWith: (RecordedSpan | undefined)[] = [];
  const wrapped: OtelSpanContextLike[] = [];
  let current: FakeContext = { span: undefined };
  let counter = 0;
  const maybeThrow = (point: ThrowPoint): void => {
    if (throwOn.has(point)) throw new Error(`fake ${point} failure`);
  };
  const makeSpan = (record: RecordedSpan): FakeSpan => ({
    record,
    spanContext: () => ({
      traceId: record.traceId,
      spanId: record.spanId,
      traceFlags: record.traceFlags,
    }),
    setAttribute(key, value) {
      maybeThrow('setAttribute');
      record.attributes[key] = value;
    },
    setStatus(status) {
      maybeThrow('setStatus');
      record.status = status;
    },
    addEvent(name, attributes) {
      maybeThrow('addEvent');
      record.events.push({ name, attributes });
    },
    end() {
      record.endCount += 1;
      maybeThrow('end');
    },
  });
  const asFake = (span: OtelSpanLike): FakeSpan => span as FakeSpan;
  const api: OtelApiLike = {
    trace: {
      getTracer() {
        maybeThrow('getTracer');
        return {
          startSpan(name, options, context) {
            maybeThrow('startSpan');
            counter += 1;
            const parent = (context as FakeContext | undefined)?.span;
            const record: RecordedSpan = {
              name,
              kind: options?.kind,
              attributes: { ...options?.attributes },
              status: undefined,
              events: [],
              endCount: 0,
              parent,
              traceId: parent?.traceId ?? hex(counter, 32),
              spanId: hex(counter, 16),
              traceFlags: parent?.traceFlags ?? 1,
            };
            spans.push(record);
            return makeSpan(record);
          },
        };
      },
      wrapSpanContext(spanContext) {
        maybeThrow('wrapSpanContext');
        wrapped.push(spanContext);
        return makeSpan({
          name: 'wrapped',
          kind: undefined,
          attributes: {},
          status: undefined,
          events: [],
          endCount: 0,
          parent: undefined,
          traceId: spanContext.traceId,
          spanId: spanContext.spanId,
          traceFlags: spanContext.traceFlags,
        });
      },
      setSpan(_context, span) {
        maybeThrow('setSpan');
        return { span: asFake(span).record } satisfies FakeContext;
      },
    },
    context: {
      active() {
        maybeThrow('active');
        return current;
      },
      with(context, fn) {
        maybeThrow('with');
        const previous = current;
        current = context as FakeContext;
        try {
          activeDuringWith.push(current.span);
          const result = fn();
          maybeThrow('withAfterRun');
          return result;
        } finally {
          current = previous;
        }
      },
    },
    SpanKind: { CLIENT: 2, INTERNAL: 0 },
    SpanStatusCode: { ERROR: 2 },
  };
  return { api, spans, activeDuringWith, wrapped };
}
