import { Buffer } from 'node:buffer';
import { randomInt } from 'node:crypto';
import type { EvalCacheEntryV1, EvalCacheMode } from '@promptscript/core';
import {
  CACHE_ENTRY_SCHEMA,
  MAX_TOKENS,
  entryText,
  readCacheEntry,
  writeCacheEntry,
  type CacheRead,
} from './cache.js';
import { Budget, callCost } from './cost.js';
import { EVAL_CODES, EvalError, EvalProviderError, type EvalCode } from './errors.js';
import { projectRelative } from './paths.js';
import type { EvalProvider, EvalResponse } from './provider.js';
import type { CallPlan, CaseOutcome } from './report.js';
import type { EvalProgress, RunEvalOptions } from './run.js';
import { isRecord } from './shape.js';

const MAX_RETRIES = 2;
const MAX_RETRY_AFTER_MS = 30_000;
const LOOKUP_CONCURRENCY = 16;
// Statuses worth another try, and statuses a provider refuses before billing
const RETRIED = new Set([429, 500, 502, 503, 529]);
const RELEASED = new Set([400, 401, 403, 404, 413, 429]);

/** Adds a setup error. */
export type Add = (code: EvalCode, message: string, file?: string, line?: number) => void;

/** What one run shares between its calls. */
export interface RunContext {
  options: RunEvalOptions;
  mode: EvalCacheMode;
  cacheDir?: string;
  providers: Map<string, EvalProvider>;
  budget?: Budget;
  /** One answer per cache key, so rows with the same request pay once */
  answers: Map<string, Promise<Answer>>;
  /** Receives progress; dropped after it throws once */
  notify: (event: EvalProgress) => void;
}

/** Why a call has no answer. */
export interface Failure {
  code: EvalCode;
  message: string;
  flags?: Partial<CaseOutcome>;
}

/** A provider answer written to the cache, or why there is none. */
export type Answer = { response: EvalResponse; bytes: Buffer; fresh: boolean } | Failure;

/** What {@link obtain} gives: a response, and whether this call paid for it. */
export type Obtained = { response: EvalResponse; bytes: Buffer; live: boolean } | Failure;

type Called = { response: EvalResponse } | Failure;

type Read = { value: CacheRead } | { error: unknown };

export function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

// File system errors name absolute paths, and reports hold none: only the code is kept
export function fileProblem(error: unknown): { code: EvalCode; message: string } {
  if (error instanceof EvalError) return { code: error.code as EvalCode, message: error.message };
  const reason = (error as NodeJS.ErrnoException | undefined)?.code ?? 'an unknown error';
  return {
    code: EVAL_CODES.CACHE_IO_FAILED,
    message: `The eval cache could not be used: ${reason}.`,
  };
}

/** A bounded number of tasks at a time; results are the caller's to keep. */
export async function pool<T>(
  items: readonly T[],
  size: number,
  work: (item: T) => Promise<void>
): Promise<void> {
  let next = 0;
  const worker = async (): Promise<void> => {
    const item = items[next++];
    if (item === undefined) return;
    await work(item);
    return worker();
  };
  await Promise.all(Array.from({ length: Math.min(size, items.length) }, worker));
}

// A few reads at a time; the results stay in call order, so errors come in a stable order
export async function readAll(calls: readonly CallPlan[], cacheDir: string): Promise<Read[]> {
  const reads: Read[] = [];
  const items = calls.map((plan, index) => ({ plan, index }));
  await pool(items, LOOKUP_CONCURRENCY, async ({ plan, index }) => {
    try {
      reads[index] = { value: await readCacheEntry(cacheDir, plan.key) };
    } catch (error) {
      reads[index] = { error };
    }
  });
  return reads;
}

/** Tell the caller that a cache entry is unusable and counts as a miss. */
export function warnInvalidEntry(context: RunContext, cacheDir: string, key: string): void {
  const file = `${projectRelative(context.options.projectRoot, cacheDir)}/${key.slice(0, 2)}/${key}.json`;
  context.notify({
    type: 'warning',
    finding: {
      code: EVAL_CODES.CACHE_ENTRY_INVALID,
      severity: 'warning',
      message: `Cache entry ${file} is unreadable or does not match its key; it counts as a miss.`,
      file,
    },
  });
}

/**
 * Look every call up in the cache, before any call. Refresh walks the tree
 * too, so a bad entry stops the run before a paid call, but it uses no hit.
 */
export async function searchCache(
  calls: readonly CallPlan[],
  context: RunContext,
  add: Add
): Promise<void> {
  const { cacheDir } = context;
  if (cacheDir === undefined) return;
  const reads = await readAll(calls, cacheDir);
  const refused = new Set<string>();
  for (const [index, plan] of calls.entries()) {
    const read = reads[index];
    if (read === undefined || 'error' in read) {
      const { code, message } = fileProblem(read?.error);
      if (!refused.has(message)) add(code, message);
      refused.add(message);
      continue;
    }
    plan.searched = true;
    if (context.mode === 'refresh') continue;
    if (read.value.found) {
      plan.hit = { response: read.value.entry.response, bytes: read.value.bytes };
    } else if (read.value.invalid) {
      warnInvalidEntry(context, cacheDir, plan.key);
    }
  }
}

// The listener goes away with the timer, so retries do not pile them up on the run signal
function sleep(ms: number, signal: AbortSignal | undefined): Promise<void> {
  return new Promise((resolve) => {
    const done = (): void => {
      clearTimeout(timer);
      signal?.removeEventListener('abort', done);
      resolve();
    };
    const timer = setTimeout(done, ms);
    signal?.addEventListener('abort', done, { once: true });
  });
}

// A provider built in code may answer anything; only whole token counts pass
function validUsage(response: unknown): boolean {
  if (!isRecord(response) || !isRecord(response['usage'])) return false;
  const { inputTokens, outputTokens } = response['usage'];
  return [inputTokens, outputTokens].every(
    (value) =>
      typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= MAX_TOKENS
  );
}

// Delay before the next try, or undefined when the failure is final
function retryDelay(error: unknown, attempt: number, context: RunContext): number | undefined {
  if (!(error instanceof EvalProviderError) || error.status === undefined) return undefined;
  if (attempt >= MAX_RETRIES || !RETRIED.has(error.status) || context.options.signal?.aborted) {
    return undefined;
  }
  if (error.retryAfterMs !== undefined) return Math.min(error.retryAfterMs, MAX_RETRY_AFTER_MS);
  const base = context.options.retryBaseMs ?? 500;
  return base * 2 ** attempt + randomInt(base + 1);
}

// A refused call gives its reservation back; any other failure may have been billed
function settleFailure(error: unknown, reserved: number, budget: Budget | undefined): void {
  const status = error instanceof EvalProviderError ? error.status : undefined;
  if (status !== undefined && RELEASED.has(status)) budget?.release(reserved);
  else budget?.keep(reserved);
}

// One call with its reservation, retried for 429 and 5xx up to twice
async function call(
  plan: CallPlan,
  caseId: string,
  context: RunContext,
  attempt = 0
): Promise<Called> {
  const { budget, options } = context;
  const provider = context.providers.get(plan.model.provider);
  const reserved = plan.worstCaseUsd;
  if (provider === undefined) {
    const message = `Provider ${plan.model.provider} is not set up.`;
    return { code: EVAL_CODES.PROVIDER_UNCONFIGURED, message };
  }
  if (budget !== undefined && !budget.reserve(reserved)) {
    const message = `The next call could pass --max-cost ${budget.maxUsd} USD, so the case did not run; raise --max-cost to run it.`;
    return { code: EVAL_CODES.BUDGET_EXCEEDED, message, flags: { budgetHit: true } };
  }
  let response: EvalResponse;
  try {
    const signal = options.signal ?? new AbortController().signal;
    response = await provider(plan.request, { signal, caseId, sample: plan.cacheRequest.sample });
  } catch (error) {
    settleFailure(error, reserved, budget);
    const delay = retryDelay(error, attempt, context);
    if (delay !== undefined) {
      await sleep(delay, options.signal);
      if (options.signal?.aborted) {
        return { code: EVAL_CODES.RUN_STOPPED, message: 'The run stopped before the next try.' };
      }
      return call(plan, caseId, context, attempt + 1);
    }
    const code = error instanceof EvalError ? (error.code as EvalCode) : EVAL_CODES.PROVIDER_FAILED;
    return { code, message: messageOf(error) };
  }
  if (!validUsage(response)) {
    budget?.keep(reserved);
    const message = `Provider ${plan.model.provider} answered without valid token counts.`;
    return { code: EVAL_CODES.USAGE_INVALID, message };
  }
  const pricing = plan.model.pricing;
  budget?.settle(reserved, pricing === undefined ? 0 : callCost(response.usage, pricing));
  return { response };
}

function entryOf(plan: CallPlan, response: EvalResponse): EvalCacheEntryV1 {
  // Keys in schema order, so the file bytes do not depend on the provider
  return {
    $schema: CACHE_ENTRY_SCHEMA,
    key: plan.key,
    request: plan.cacheRequest,
    response: {
      text: response.text,
      usage: { inputTokens: response.usage.inputTokens, outputTokens: response.usage.outputTokens },
      latencyMs: Math.max(0, Math.round(response.latencyMs)),
      status: response.status,
      ...(response.stopReason === undefined ? {} : { stopReason: response.stopReason }),
    },
  };
}

// Call the provider and write the entry; the cache gets one entry per key
async function answer(plan: CallPlan, caseId: string, context: RunContext): Promise<Answer> {
  const called = await call(plan, caseId, context);
  if ('code' in called) return called;
  const entry = entryOf(plan, called.response);
  try {
    // off writes nothing; its digest covers the entries as they would have been written
    const bytes =
      context.mode === 'off' || context.cacheDir === undefined
        ? Buffer.from(entryText(entry), 'utf8')
        : await writeCacheEntry(context.cacheDir, entry);
    return { response: entry.response, bytes, fresh: true };
  } catch (error) {
    const { code, message } = fileProblem(error);
    return { code, message: `The cache entry ${plan.key} was not written. ${message}` };
  }
}

// A call nobody searched the cache for yet, in record mode: an entry of an earlier run answers it
async function lazyHit(plan: CallPlan, context: RunContext): Promise<Answer | undefined> {
  const { cacheDir } = context;
  if (context.mode !== 'record' || plan.searched === true || cacheDir === undefined) {
    return undefined;
  }
  try {
    const read = await readCacheEntry(cacheDir, plan.key);
    if (read.found) return { response: read.entry.response, bytes: read.bytes, fresh: false };
    if (read.invalid) warnInvalidEntry(context, cacheDir, plan.key);
  } catch (error) {
    return fileProblem(error);
  }
  return undefined;
}

async function resolve(plan: CallPlan, caseId: string, context: RunContext): Promise<Answer> {
  try {
    return (await lazyHit(plan, context)) ?? (await answer(plan, caseId, context));
  } catch (error) {
    return { code: EVAL_CODES.PROVIDER_FAILED, message: messageOf(error) };
  }
}

/**
 * The response of one call: the entry found before the run, a replay miss, or
 * a provider call. Calls with the same key share one answer, and only the first
 * of them is live.
 */
export async function obtain(
  plan: CallPlan,
  caseId: string,
  context: RunContext
): Promise<Obtained> {
  if (plan.hit !== undefined) return { ...plan.hit, live: false };
  if (context.mode === 'replay') {
    return {
      code: EVAL_CODES.CACHE_MISS,
      message: `No cache entry ${plan.key} for row "${caseId}" on ${plan.model.ref}; record it with prs eval run --cache record --max-cost <usd>.`,
      flags: { cacheMiss: true },
    };
  }
  // Rows with the same request share one call; the later ones count as replayed
  const pending = context.answers.get(plan.key);
  const answered = pending ?? resolve(plan, caseId, context);
  if (pending === undefined) context.answers.set(plan.key, answered);
  const got = await answered;
  if ('code' in got) return got;
  return { response: got.response, bytes: got.bytes, live: pending === undefined && got.fresh };
}
