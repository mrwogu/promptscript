import type {
  EvalCacheResponseV1,
  ModelParams,
  PromptBundleMessage,
  PromptBundleOutput,
} from '@promptscript/core';
import { EVAL_CODES, EvalProviderError } from './errors.js';

/** One model call a provider makes. */
export interface EvalRequest {
  /** Id of the prompt under test */
  promptId: string;
  /** Provider name, such as `anthropic` */
  provider: string;
  /** Provider API model identifier */
  apiId: string;
  /** Model reference as written in the suite or the prompt */
  modelRef: string;
  /** Rendered messages, system first */
  messages: readonly PromptBundleMessage[];
  /** Effective parameters */
  params: ModelParams;
  /** Output contract to request as structured output */
  output?: PromptBundleOutput;
  /** Output token cap, always set */
  maxOutputTokens: number;
}

/** What one call returned; the cache stores the same shape. */
export type EvalResponse = EvalCacheResponseV1;

/** Per-call context of a provider. */
export interface EvalProviderContext {
  /** Aborts the call */
  signal: AbortSignal;
  /** Dataset row id of the case the call is for */
  caseId: string;
  /** Run index of a judge call, from 1; 0 for the call of a case */
  sample?: number;
}

/**
 * Makes one model call. Throws `EvalProviderError` when the call fails;
 * retries, cache and budget belong to the caller.
 */
export type EvalProvider = (
  request: EvalRequest,
  context: EvalProviderContext
) => Promise<EvalResponse>;

/** Provider lookup of a run, by provider name. */
export interface EvalProviderLookup {
  (name: string): EvalProvider;
  /**
   * Name of the secret variable whose value appears in `text`, if any. The run
   * checks every model of a suite with it, so a `${VAR}` in a profile stops it.
   */
  secretIn?: (text: string) => string | undefined;
}

/** A scripted answer: the response text, or a response with defaults filled in. */
export type MockAnswer = string | (Pick<EvalResponse, 'text'> & Partial<EvalResponse>);

/** Answers by case id, or a function of the request. */
export type MockScript =
  | Readonly<Record<string, MockAnswer>>
  | ((request: EvalRequest, context: EvalProviderContext) => MockAnswer | Promise<MockAnswer>);

/** One call the mock received. */
export interface MockCall {
  caseId: string;
  request: EvalRequest;
}

/** A provider that answers from a script and records its calls. */
export type MockProvider = EvalProvider & { readonly calls: readonly MockCall[] };

function toResponse(answer: MockAnswer): EvalResponse {
  if (typeof answer === 'string') {
    return { text: answer, usage: { inputTokens: 0, outputTokens: 0 }, latencyMs: 0, status: 200 };
  }
  return {
    text: answer.text,
    usage: answer.usage ?? { inputTokens: 0, outputTokens: 0 },
    latencyMs: answer.latencyMs ?? 0,
    status: answer.status ?? 200,
    ...(answer.stopReason === undefined ? {} : { stopReason: answer.stopReason }),
  };
}

/**
 * Create a provider for tests that answers from a table keyed by case id or
 * from a function, with scripted usage and latency, and records every call.
 * It has no network code. Usage defaults to zero tokens, latency to 0 and
 * status to 200.
 *
 * @param script - Answers by case id, or a function of the request and context
 * @returns The provider, with its received calls in `calls`
 */
export function createMockProvider(script: MockScript): MockProvider {
  const calls: MockCall[] = [];
  const provider: EvalProvider = async (request, context) => {
    context.signal.throwIfAborted();
    calls.push({ caseId: context.caseId, request });
    if (typeof script === 'function') return toResponse(await script(request, context));
    const answer = Object.hasOwn(script, context.caseId) ? script[context.caseId] : undefined;
    if (answer === undefined) {
      throw new EvalProviderError(
        `The mock provider has no answer for case "${context.caseId}"; add it to the script.`,
        EVAL_CODES.PROVIDER_FAILED
      );
    }
    return toResponse(answer);
  };
  return Object.assign(provider, { calls });
}
