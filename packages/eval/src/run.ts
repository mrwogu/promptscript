import { Buffer } from 'node:buffer';
import { createHash, randomInt } from 'node:crypto';
import { createReadStream } from 'node:fs';
import {
  compareCodeUnits,
  getModelCatalog,
  type EvalCacheEntryV1,
  type EvalCacheMode,
  type EvalCaseStatus,
  type EvalFindingV1,
  type EvalModelEntry,
  type EvalReportV1,
  type ModelCatalog,
  type ModelParams,
  type ModelPricing,
  type PromptBundleV1,
} from '@promptscript/core';
import { loadPrompt, type Prompt, type PromptMessage } from '@promptscript/runtime';
import { evaluateAssertions, type DeterministicAssertion } from './assertions.js';
import {
  CACHE_ENTRY_SCHEMA,
  MAX_TOKENS,
  cacheKey,
  entryText,
  inputsHash,
  readCacheEntry,
  writeCacheEntry,
  type CacheRead,
} from './cache.js';
import { Budget, callCost, roundUsd, worstCaseCost } from './cost.js';
import { checkDatasetRow } from './dataset/check.js';
import { readDataset, type DatasetRecord } from './dataset/read.js';
import { scanDatasetRow } from './dataset/scan.js';
import {
  EVAL_CODES,
  EvalError,
  EvalProviderError,
  type EvalCode,
  type EvalFinding,
} from './errors.js';
import { projectRelative, resolveProjectPath } from './paths.js';
import type { EvalProvider, EvalProviderLookup, EvalResponse } from './provider.js';
import {
  buildReport,
  type CaseOutcome,
  type CasePlan,
  type ModelPlan,
  type SuitePlan,
} from './report.js';
import { isRecord } from './shape.js';
import { checkSuites } from './suite/check.js';
import type { LoadedSuite } from './suite/load.js';

/** Something that happened during a run, for the caller to show. */
export type EvalProgress =
  | { type: 'warning'; finding: EvalFinding }
  | { type: 'case'; suite: string; model: string; caseId: string; status: EvalCaseStatus };

/** Options of {@link runEval}. */
export interface RunEvalOptions {
  /** Project root directory */
  projectRoot: string;
  /** Suites from `loadSuites` */
  suites: readonly LoadedSuite[];
  /** Prompt bundles the project compiles; each is verified again before use */
  bundles: readonly PromptBundleV1[];
  /** Model catalog with the project's profiles */
  catalog: ModelCatalog;
  /** Provider of a name; called only for calls the cache cannot answer */
  providers: EvalProviderLookup;
  /** Cache mode and directory, relative to the project root */
  cache: { mode: EvalCacheMode; dir: string };
  /** Spending limit in USD; required by every mode that calls a provider */
  budget?: { maxCostUsd: number };
  /** Row limit of a dataset; default 1000 */
  maxCases?: number;
  /** Calls in flight at once; default 4, at most 16 */
  concurrency?: number;
  /** Output token cap when a prompt sets no `maxTokens`; default 1024 */
  maxOutputTokens?: number;
  /** Run every suite on this model only */
  modelOverride?: string;
  /** `validation.allowedPatterns` of the project, for the dataset scan */
  allowedPatterns?: readonly string[];
  /** Stops new calls; finished cases stay in the report */
  signal?: AbortSignal;
  /** Receives warnings and finished cases; after it throws once it gets no more */
  onProgress?: (event: EvalProgress) => void;
  /** First retry delay in milliseconds when a provider gives none; default 500 */
  retryBaseMs?: number;
}

const DEFAULT_MAX_OUTPUT_TOKENS = 1024;
const DEFAULT_CONCURRENCY = 4;
const MAX_CONCURRENCY = 16;
const MAX_RETRIES = 2;
const MAX_RETRY_AFTER_MS = 30_000;
// Statuses worth another try, and statuses a provider refuses before billing
const RETRIED = new Set([429, 500, 502, 503, 529]);
const RELEASED = new Set([400, 401, 403, 404, 413, 429]);

type Add = (code: EvalCode, message: string, file?: string, line?: number) => void;

interface RunContext {
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

/** Why a case has no answer. */
interface Failure {
  code: EvalCode;
  message: string;
  flags?: Partial<CaseOutcome>;
}

/** A provider answer written to the cache, or why there is none. */
type Answer = { response: EvalResponse; bytes: Buffer } | Failure;

function collector(errors: EvalFinding[]): Add {
  return (code, message, file, line) => {
    errors.push({
      code,
      severity: 'error',
      message,
      ...(file === undefined ? {} : { file }),
      ...(line === undefined ? {} : { line }),
    });
  };
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

// File system errors name absolute paths, and reports hold none: only the code is kept
function fileProblem(error: unknown): { code: EvalCode; message: string } {
  if (error instanceof EvalError) return { code: error.code as EvalCode, message: error.message };
  const reason = (error as NodeJS.ErrnoException | undefined)?.code ?? 'an unknown error';
  return {
    code: EVAL_CODES.CACHE_IO_FAILED,
    message: `The eval cache could not be used: ${reason}.`,
  };
}

async function hashFile(file: string): Promise<string> {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(file) as AsyncIterable<Buffer>) hash.update(chunk);
  return `sha256-${hash.digest('hex')}`;
}

function hasCostThreshold(suite: LoadedSuite): boolean {
  const limits = suite.suite.thresholds;
  return limits?.maxCostUsd !== undefined || limits?.maxCostPerCaseUsd !== undefined;
}

// The price of `ref` in the built-in catalog alone, without the project profiles
function builtInPrice(ref: string): ModelPricing | undefined {
  const resolution = getModelCatalog().resolve(ref);
  return resolution === undefined || resolution.kind === 'inherit'
    ? undefined
    : resolution.profile.pricing;
}

// A snapshot id such as `x-20261001`, `x-2026-10-01`, `x-0806` or `x-latest` costs what `x` costs
function undated(apiId: string): string {
  return apiId.replace(/-(?:\d{8}|\d{4}-\d{2}-\d{2}|\d{4}|latest)$/, '');
}

// The project price of a model. A project may raise a built-in price, never
// lower it, checked against the built-in price of the reference and of the
// API id the call goes to: a custom profile can point a cheap name at an
// expensive model. Gateway ids such as `vendor/model` match neither.
function priceOf(
  target: { priceRef: string; apiId: string },
  options: RunEvalOptions,
  file: string,
  add: Add
): ModelPricing | undefined {
  const ref = target.priceRef;
  const resolution = options.catalog.resolve(ref);
  const pricing = resolution?.kind === 'inherit' ? undefined : resolution?.profile.pricing;
  if (pricing === undefined) {
    add(
      EVAL_CODES.PRICING_MISSING,
      `Suite ${file}: model "${ref}" has no price and the run has a budget; add pricing under models.profiles in promptscript.yaml.`,
      file
    );
    return undefined;
  }
  const floors = [ref, target.apiId, undated(target.apiId)].map((id) => builtInPrice(id));
  const lowered = floors.some(
    (floor) =>
      floor !== undefined &&
      (pricing.inputUsdPerMillion < floor.inputUsdPerMillion ||
        pricing.outputUsdPerMillion < floor.outputUsdPerMillion)
  );
  if (lowered) {
    add(
      EVAL_CODES.PRICE_LOWERED,
      `Suite ${file}: the project price of "${ref}" is below the built-in price of the model or its API id ${target.apiId}; models.profiles may only raise it.`,
      file
    );
  }
  return pricing;
}

interface ModelTarget {
  ref: string;
  priceRef: string;
  provider: string;
  apiId: string;
  params: ModelParams;
}

function entryTarget(
  entry: string | EvalModelEntry,
  options: RunEvalOptions,
  file: string,
  add: Add
): ModelTarget[] {
  const ref = typeof entry === 'string' ? entry : entry.ref;
  const resolution = options.catalog.resolve(ref);
  if (resolution === undefined || resolution.kind === 'inherit') {
    add(EVAL_CODES.MODEL_REF, `Suite ${file}: model "${ref}" is not in the model catalog.`, file);
    return [];
  }
  const params = typeof entry === 'string' ? {} : (entry.params ?? {});
  return [
    {
      ref,
      priceRef: ref,
      provider: resolution.profile.provider,
      apiId: resolution.profile.apiId,
      params,
    },
  ];
}

function resolveModels(
  loaded: LoadedSuite,
  bundle: PromptBundleV1,
  options: RunEvalOptions,
  add: Add
): ModelPlan[] {
  const { suite, file } = loaded;
  const priced = options.budget !== undefined || hasCostThreshold(loaded);
  const entries =
    options.modelOverride === undefined ? (suite.models ?? []) : [options.modelOverride];
  const own = bundle.model;
  // Without entries the prompt's own model runs; checkSuites refused a prompt with neither
  const ownTarget: ModelTarget[] =
    own === undefined
      ? []
      : [
          {
            ref: own.ref,
            priceRef: own.profile ?? own.ref,
            provider: own.provider,
            apiId: own.apiId,
            params: {},
          },
        ];
  const targets =
    entries.length === 0
      ? ownTarget
      : entries.flatMap((entry) => entryTarget(entry, options, file, add));
  return targets.map((target) => {
    const merged = { ...own?.params, ...target.params };
    const maxOutputTokens =
      merged.maxTokens ?? options.maxOutputTokens ?? DEFAULT_MAX_OUTPUT_TOKENS;
    const pricing = priced ? priceOf(target, options, file, add) : undefined;
    return {
      ref: target.ref,
      provider: target.provider,
      apiId: target.apiId,
      params: { ...merged, maxTokens: maxOutputTokens },
      maxOutputTokens,
      ...(pricing === undefined ? {} : { pricing }),
    };
  });
}

// Inputs after defaults, the values the cache key covers
function effectiveInputs(
  bundle: PromptBundleV1,
  inputs: DatasetRecord['row']['inputs']
): Record<string, unknown> {
  const values: Record<string, unknown> = {};
  for (const [name, spec] of Object.entries(bundle.inputs)) {
    const value = Object.hasOwn(inputs, name) ? inputs[name] : spec.default;
    if (value !== undefined) values[name] = value;
  }
  return values;
}

interface ReadRows {
  rows: Array<{ record: DatasetRecord; messages: readonly PromptMessage[] }>;
  findings: EvalFindingV1[];
  path: string;
}

interface RowContext {
  bundle: PromptBundleV1;
  prompt: Prompt;
  loaded: LoadedSuite;
  path: string;
  options: RunEvalOptions;
  add: Add;
}

// Check, scan and render one row; the rendered messages are kept for the call
function takeRow(record: DatasetRecord, context: RowContext, read: ReadRows): void {
  const { bundle, prompt, loaded, path, options, add } = context;
  const { suite } = loaded;
  const ref = typeof suite.dataset === 'string' ? { path: suite.dataset } : suite.dataset;
  for (const finding of checkDatasetRow(record, {
    file: path,
    bundle,
    assertions: suite.assertions,
  })) {
    add(finding.code, finding.message, path, finding.line);
  }
  read.findings.push(
    ...scanDatasetRow(record, {
      file: path,
      ...(options.allowedPatterns === undefined
        ? {}
        : { allowedPatterns: options.allowedPatterns }),
      ...(ref.allow === undefined ? {} : { allow: ref.allow }),
      ...(ref.allowPii === undefined ? {} : { allowPii: ref.allowPii }),
    })
  );
  try {
    read.rows.push({ record, messages: prompt.render(record.row.inputs).messages });
  } catch (error) {
    add(EVAL_CODES.ROW_CONTRACT, `Row "${record.row.id}": ${messageOf(error)}`, path, record.line);
  }
}

async function readRows(
  loaded: LoadedSuite,
  bundle: PromptBundleV1,
  prompt: Prompt,
  options: RunEvalOptions,
  add: Add
): Promise<ReadRows | undefined> {
  const { suite } = loaded;
  const path = projectRelative(options.projectRoot, loaded.datasetFile);
  const read: ReadRows = { rows: [], findings: [], path };
  const context = { bundle, prompt, loaded, path, options, add };
  try {
    const records = readDataset(loaded.datasetFile, {
      projectRoot: options.projectRoot,
      contract: bundle,
      writtenPath: typeof suite.dataset === 'string' ? suite.dataset : suite.dataset.path,
      ...(options.maxCases === undefined ? {} : { maxRows: options.maxCases }),
    });
    for await (const record of records) takeRow(record, context, read);
  } catch (error) {
    if (!(error instanceof EvalError)) throw error;
    add(error.code as EvalCode, error.message, error.location?.file ?? path, error.location?.line);
    return undefined;
  }
  // The gate is the severity: an allowed finding stays in the report as a warning
  for (const finding of read.findings.filter((entry) => entry.severity === 'error')) {
    add(
      finding.code as EvalCode,
      `Dataset ${path}, row "${finding.rowId ?? ''}" at ${finding.path ?? ''}: rule ${finding.rule ?? ''} (${finding.ruleName ?? ''}) flagged the value; review it, or allow the rule in dataset.allow with a reason.`,
      path,
      finding.line
    );
  }
  return read;
}

async function prepareSuite(
  loaded: LoadedSuite,
  options: RunEvalOptions
): Promise<{ plan?: SuitePlan; errors: EvalFinding[] }> {
  const errors: EvalFinding[] = [];
  const add = collector(errors);
  const { suite, file } = loaded;
  const bundle = options.bundles.find((candidate) => candidate.id === suite.prompt);
  if (bundle === undefined) return { errors };
  const judged = suite.assertions.filter((assertion) => assertion.kind === 'llm-judge');
  for (const assertion of judged) {
    add(
      EVAL_CODES.JUDGE_UNSUPPORTED,
      `Suite ${file}: llm-judge assertion "${assertion.id}" cannot run in this version of eval; remove it to run the rest of the suite.`,
      file
    );
  }
  let prompt: Prompt;
  try {
    prompt = loadPrompt(bundle);
  } catch (error) {
    add(
      EVAL_CODES.UNKNOWN_PROMPT,
      `Suite ${file}: prompt "${bundle.id}" did not load: ${messageOf(error)}`,
      file
    );
    return { errors };
  }
  const models = resolveModels(loaded, bundle, options, add);
  // A profile is outside the eval config, so its values get the same secret check
  const secret = options.providers.secretIn?.(JSON.stringify(models));
  if (secret !== undefined) {
    add(
      EVAL_CODES.KEY_IN_CONFIG,
      `Suite ${file}: the value of ${secret} appears in a model of the suite, such as its API id; keep secrets only in the environment.`,
      file
    );
  }
  const read = await readRows(loaded, bundle, prompt, options, add);
  if (read === undefined || errors.length > 0) return { errors };

  const cases = models.flatMap((model) =>
    read.rows.map(({ record, messages }): CasePlan => {
      const cacheRequest = {
        contentHash: bundle.contentHash,
        inputsHash: inputsHash(effectiveInputs(bundle, record.row.inputs)),
        modelRef: model.ref,
        provider: model.provider,
        apiId: model.apiId,
        params: model.params,
        sample: 0,
      };
      return {
        row: record.row,
        model,
        request: {
          promptId: bundle.id,
          provider: model.provider,
          apiId: model.apiId,
          modelRef: model.ref,
          messages,
          params: model.params,
          ...(bundle.output === undefined ? {} : { output: bundle.output }),
          maxOutputTokens: model.maxOutputTokens,
        },
        cacheRequest,
        key: cacheKey(cacheRequest),
        worstCaseUsd:
          model.pricing === undefined
            ? 0
            : worstCaseCost(messages, bundle.output, model.maxOutputTokens, model.pricing),
      };
    })
  );
  return {
    errors,
    plan: {
      loaded,
      bundle,
      dataset: {
        path: read.path,
        rows: read.rows.length,
        hash: await hashFile(loaded.datasetFile),
      },
      findings: read.findings,
      models,
      assertions: suite.assertions.filter(
        (assertion): assertion is DeterministicAssertion => assertion.kind !== 'llm-judge'
      ),
      priced: options.budget !== undefined || hasCostThreshold(loaded),
      cases,
      timedOut: new Set(),
    },
  };
}

const LOOKUP_CONCURRENCY = 16;

type Read = { value: CacheRead } | { error: unknown };

// A few reads at a time; the results stay in case order, so errors come in a stable order
async function readAll(cases: readonly CasePlan[], cacheDir: string): Promise<Read[]> {
  const reads: Read[] = [];
  const items = cases.map((plan, index) => ({ plan, index }));
  await pool(items, LOOKUP_CONCURRENCY, async ({ plan, index }) => {
    try {
      reads[index] = { value: await readCacheEntry(cacheDir, plan.key) };
    } catch (error) {
      reads[index] = { error };
    }
  });
  return reads;
}

// Cache lookups for every case, before any call. Refresh walks the tree too,
// so a bad entry stops the run before a paid call, but it uses no hit.
async function lookUp(plans: readonly SuitePlan[], context: RunContext, add: Add): Promise<void> {
  const { cacheDir, options } = context;
  if (cacheDir === undefined) return;
  const cases = plans.flatMap((plan) => plan.cases);
  const reads = await readAll(cases, cacheDir);
  const refused = new Set<string>();
  for (const [index, plan] of cases.entries()) {
    const read = reads[index];
    if (read === undefined || 'error' in read) {
      const { code, message } = fileProblem(read?.error);
      if (!refused.has(message)) add(code, message);
      refused.add(message);
    } else if (context.mode === 'refresh') {
      continue;
    } else if (read.value.found) {
      plan.hit = { response: read.value.entry.response, bytes: read.value.bytes };
    } else if (read.value.invalid) {
      const file = `${projectRelative(options.projectRoot, cacheDir)}/${plan.key.slice(0, 2)}/${plan.key}.json`;
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
  }
}

function setUpProviders(plans: readonly SuitePlan[], context: RunContext, add: Add): void {
  const names = new Set(
    plans.flatMap((plan) =>
      plan.cases.filter((c) => c.hit === undefined).map((c) => c.model.provider)
    )
  );
  for (const name of [...names].sort(compareCodeUnits)) {
    try {
      context.providers.set(name, context.options.providers(name));
    } catch (error) {
      add(
        error instanceof EvalError ? (error.code as EvalCode) : EVAL_CODES.PROVIDER_UNCONFIGURED,
        messageOf(error)
      );
    }
  }
}

function errored(
  plan: CasePlan,
  code: EvalCode,
  message: string,
  flags: Partial<CaseOutcome> = {}
): CaseOutcome {
  return {
    ...flags,
    result: {
      id: plan.row.id,
      ...(plan.row.tags === undefined ? {} : { tags: plan.row.tags }),
      status: 'error',
      assertions: [],
      usage: { calls: 0, inputTokens: 0, outputTokens: 0 },
      latencyMs: 0,
      cache: { replayed: 0, live: 0 },
      cacheKeys: [],
      error: { code, message },
    },
  };
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

type Called = { response: EvalResponse } | Failure;

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
async function call(plan: CasePlan, context: RunContext, attempt = 0): Promise<Called> {
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
    response = await provider(plan.request, { signal, caseId: plan.row.id });
  } catch (error) {
    settleFailure(error, reserved, budget);
    const delay = retryDelay(error, attempt, context);
    if (delay !== undefined) {
      await sleep(delay, options.signal);
      if (options.signal?.aborted) {
        return { code: EVAL_CODES.RUN_STOPPED, message: 'The run stopped before the next try.' };
      }
      return call(plan, context, attempt + 1);
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

function entryOf(plan: CasePlan, response: EvalResponse): EvalCacheEntryV1 {
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
async function answer(plan: CasePlan, context: RunContext): Promise<Answer> {
  const called = await call(plan, context);
  if ('code' in called) return called;
  const entry = entryOf(plan, called.response);
  try {
    // off writes nothing; its digest covers the entries as they would have been written
    const bytes =
      context.mode === 'off' || context.cacheDir === undefined
        ? Buffer.from(entryText(entry), 'utf8')
        : await writeCacheEntry(context.cacheDir, entry);
    return { response: entry.response, bytes };
  } catch (error) {
    const { code, message } = fileProblem(error);
    return { code, message: `The cache entry ${plan.key} was not written. ${message}` };
  }
}

async function respond(
  plan: CasePlan,
  context: RunContext
): Promise<{ response: EvalResponse; bytes: Buffer; live: boolean } | CaseOutcome> {
  if (plan.hit !== undefined) return { ...plan.hit, live: false };
  if (context.mode === 'replay') {
    return errored(
      plan,
      EVAL_CODES.CACHE_MISS,
      `No cache entry ${plan.key} for row "${plan.row.id}" on ${plan.model.ref}; record it with prs eval run --cache record --max-cost <usd>.`,
      { cacheMiss: true }
    );
  }
  // Rows with the same request share one call; the later ones count as replayed
  const pending = context.answers.get(plan.key);
  const answered =
    pending ??
    answer(plan, context).catch((error: unknown): Answer => ({
      code: EVAL_CODES.PROVIDER_FAILED,
      message: messageOf(error),
    }));
  if (pending === undefined) context.answers.set(plan.key, answered);
  const got = await answered;
  if ('code' in got) return errored(plan, got.code, got.message, got.flags);
  return { response: got.response, bytes: got.bytes, live: pending === undefined };
}

async function runCase(
  suite: SuitePlan,
  plan: CasePlan,
  context: RunContext
): Promise<CaseOutcome> {
  if (context.options.signal?.aborted) {
    return errored(plan, EVAL_CODES.RUN_STOPPED, 'The run stopped before this case ran.');
  }
  const answered = await respond(plan, context);
  if ('result' in answered) return answered;
  const { response, bytes, live } = answered;
  let assertions;
  try {
    assertions = evaluateAssertions(suite.assertions, response.text, {
      ...(suite.bundle.output === undefined ? {} : { output: suite.bundle.output }),
      ...(plan.row.expected === undefined ? {} : { expected: plan.row.expected }),
      timedOut: suite.timedOut,
    });
  } catch (error) {
    return errored(
      plan,
      EVAL_CODES.ASSERTION_ERROR,
      `An assertion could not run: ${messageOf(error)}`
    );
  }
  const costUsd =
    suite.priced && plan.model.pricing !== undefined
      ? callCost(response.usage, plan.model.pricing)
      : undefined;
  return {
    bytes,
    ...(costUsd === undefined ? {} : { costUsd }),
    result: {
      id: plan.row.id,
      ...(plan.row.tags === undefined ? {} : { tags: plan.row.tags }),
      status: assertions.every((result) => result.passed) ? 'passed' : 'failed',
      assertions,
      usage: { calls: 1, ...response.usage },
      ...(costUsd === undefined ? {} : { costUsd: roundUsd(costUsd) }),
      latencyMs: response.latencyMs,
      cache: { replayed: live ? 0 : 1, live: live ? 1 : 0 },
      cacheKeys: [plan.key],
    },
  };
}

async function pool<T>(
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

// A limit that is not a plain number would switch off the check that uses it
function checkLimits(options: RunEvalOptions, add: Add): void {
  const maxCost = options.budget?.maxCostUsd;
  if (maxCost !== undefined && !(Number.isFinite(maxCost) && maxCost >= 0)) {
    add(
      EVAL_CODES.BUDGET_REQUIRED,
      `--max-cost must be a number of USD, 0 or more; got ${maxCost}.`
    );
  }
  const limits = [
    ['row limit', options.maxCases],
    ['concurrency', options.concurrency],
    ['output token cap', options.maxOutputTokens],
  ] as const;
  for (const [name, value] of limits) {
    if (value !== undefined && !(Number.isInteger(value) && value > 0 && value <= MAX_TOKENS)) {
      add(
        EVAL_CODES.RUN_OPTION_INVALID,
        `The ${name} must be a whole number above 0; got ${value}.`
      );
    }
  }
}

// Progress goes to the caller; a listener that throws is dropped, the run goes on
function notifier(options: RunEvalOptions): (event: EvalProgress) => void {
  let listener = options.onProgress;
  return (event) => {
    try {
      listener?.(event);
    } catch {
      listener = undefined;
    }
  };
}

// The budget and the cache directory of a run
function createContext(
  options: RunEvalOptions,
  notify: (event: EvalProgress) => void,
  add: Add
): RunContext {
  const mode = options.cache.mode;
  const context: RunContext = {
    options,
    mode,
    providers: new Map(),
    answers: new Map(),
    notify,
    ...(options.budget === undefined ? {} : { budget: new Budget(options.budget.maxCostUsd) }),
  };
  if (mode !== 'replay' && options.budget === undefined) {
    add(
      EVAL_CODES.BUDGET_REQUIRED,
      `--cache ${mode} calls providers and spends money; pass --max-cost <usd> to set a budget.`
    );
  }
  if (mode !== 'off') {
    context.cacheDir = resolveProjectPath(
      options.projectRoot,
      options.projectRoot,
      options.cache.dir
    );
    if (context.cacheDir === undefined) {
      add(
        EVAL_CODES.PATH_REFUSED,
        `The cache directory "${options.cache.dir.slice(0, 200)}" must be a relative path that stays inside the project.`
      );
    }
  }
  return context;
}

// Every miss at its worst case; rows with the same key share one call, so they count once
function checkPlanCost(plans: readonly SuitePlan[], context: RunContext, add: Add): void {
  const calls = new Map<string, number>();
  for (const plan of plans.flatMap((suite) => suite.cases)) {
    if (plan.hit === undefined) calls.set(plan.key, plan.worstCaseUsd);
  }
  const worstCase = [...calls.values()].reduce((sum, usd) => sum + usd, 0);
  if (context.budget !== undefined && worstCase > context.budget.maxUsd) {
    add(
      EVAL_CODES.BUDGET_EXCEEDED,
      `The run could cost up to ${roundUsd(worstCase)} USD and --max-cost is ${context.budget.maxUsd} USD; raise --max-cost or run fewer cases.`
    );
  }
}

// Suites, datasets, cache, providers and the budget plan, all before any call
async function setUp(
  options: RunEvalOptions,
  withProviders = true
): Promise<{ plans: SuitePlan[]; context: RunContext; errors: EvalFinding[] }> {
  const errors: EvalFinding[] = [];
  const add = collector(errors);
  const mode = options.cache.mode;
  const notify = notifier(options);
  checkLimits(options, add);
  const badLimits = errors.length > 0;
  const checks = checkSuites(options.suites, {
    bundles: options.bundles,
    catalog: options.catalog,
  });
  for (const finding of checks) {
    if (finding.severity === 'warning') notify({ type: 'warning', finding });
    else errors.push(finding);
  }
  // Datasets are read with the limits, so bad ones stop setup here, with the suite errors
  if (badLimits) {
    return {
      plans: [],
      context: { options, mode, providers: new Map(), answers: new Map(), notify },
      errors,
    };
  }
  const broken = new Set(errors.map((finding) => finding.file));
  const prepared = await Promise.all(
    options.suites
      .filter((suite) => !broken.has(suite.file))
      .map((suite) => prepareSuite(suite, options))
  );
  errors.push(...prepared.flatMap((entry) => entry.errors));
  const plans = prepared.flatMap((entry) => (entry.plan === undefined ? [] : [entry.plan]));

  if (errors.length === 0 && plans.every((plan) => plan.cases.length === 0)) {
    add(EVAL_CODES.RUN_OPTION_INVALID, 'There is no case to run; pass at least one suite.');
  }
  const context = createContext(options, notify, add);
  if (errors.length > 0) return { plans, context, errors };
  await lookUp(plans, context, add);
  if (mode === 'replay' || errors.length > 0) return { plans, context, errors };
  checkPlanCost(plans, context, add);
  if (errors.length > 0) return { plans, context, errors };
  // Providers last, so a run that stops here never announces where a key would go
  if (withProviders) setUpProviders(plans, context, add);
  return { plans, context, errors };
}

/** What {@link runEvalDetailed} gives back. */
export interface EvalRun {
  /** The report of the whole run */
  report: EvalReportV1;
  /**
   * One report per suite, built from that suite's cases alone, in suite name
   * order: its own outcome, usage, cache summary and digest, no budget and no
   * errors. Empty when setup failed.
   */
  suiteReports: EvalReportV1[];
}

/**
 * Run suites: check them, read and scan every dataset, render every row,
 * look up the cache and check the budget plan, all before the first call.
 * Any setup error ends the run there with outcome `error`. Then each case is
 * answered from the cache or a provider call and checked by its assertions.
 * A case failure never throws: it becomes a case with status `error`.
 *
 * `replay` never creates a provider. `record`, `refresh` and `off` call
 * providers and need a budget; every call reserves its worst case first.
 * The engine reads no environment and prints nothing.
 *
 * @param options - Suites, bundles, catalog, providers, cache, budget and limits
 * @returns The report of the run, and one report per suite
 */
export async function runEvalDetailed(options: RunEvalOptions): Promise<EvalRun> {
  const { plans, context, errors } = await setUp(options);
  const budget = context.budget === undefined ? {} : { budget: context.budget };
  if (errors.length > 0) {
    const report = buildReport({
      plans: [],
      outcomes: new Map(),
      mode: context.mode,
      errors,
      ...budget,
    });
    return { report, suiteReports: [] };
  }
  const outcomes = new Map<CasePlan, CaseOutcome>();
  const work = plans.flatMap((suite) => suite.cases.map((plan) => ({ suite, plan })));
  const concurrency = Math.min(MAX_CONCURRENCY, options.concurrency ?? DEFAULT_CONCURRENCY);
  await pool(work, concurrency, async ({ suite, plan }) => {
    const outcome = await runCase(suite, plan, context);
    outcomes.set(plan, outcome);
    context.notify({
      type: 'case',
      suite: suite.loaded.name,
      model: plan.model.ref,
      caseId: plan.row.id,
      status: outcome.result.status,
    });
  });
  const report = buildReport({ plans, outcomes, mode: context.mode, errors, ...budget });
  const suiteReports = [...plans]
    .sort((a, b) => compareCodeUnits(a.loaded.name, b.loaded.name))
    .map((plan) => {
      const mine = new Set(plan.cases);
      const own = new Map([...outcomes].filter(([key]) => mine.has(key)));
      return buildReport({ plans: [plan], outcomes: own, mode: context.mode, errors: [] });
    });
  return { report, suiteReports };
}

/**
 * Run suites and return the report of the whole run.
 *
 * @param options - Suites, bundles, catalog, providers, cache, budget and limits
 * @returns The report of the run
 * @see runEvalDetailed
 */
export async function runEval(options: RunEvalOptions): Promise<EvalReportV1> {
  return (await runEvalDetailed(options)).report;
}

/** Where the price of a model comes from. */
export type PriceSource = 'built-in' | 'project';

/** One model entry of a suite in a {@link EvalPlan}. */
export interface EvalPlanModel {
  ref: string;
  provider: string;
  apiId: string;
  /** Cases: rows of the dataset */
  cases: number;
  /** Cases the cache answers */
  hits: number;
  /** Cases the cache does not answer */
  misses: number;
  /** Calls a record or off run would make: misses, rows with one request counted once */
  calls: number;
  /** Price source, when the run is priced */
  priceSource?: PriceSource;
  /** Worst-case cost of its calls in USD, when the run is priced */
  worstCaseUsd?: number;
}

/** One suite in a {@link EvalPlan}. */
export interface EvalPlanSuite {
  name: string;
  prompt: string;
  rows: number;
  models: EvalPlanModel[];
}

/** What a run would do, without any call. */
export interface EvalPlan {
  mode: EvalCacheMode;
  /** Empty when setup found errors */
  suites: EvalPlanSuite[];
  hits: number;
  misses: number;
  calls: number;
  /** Worst case of every planned call in USD, when a budget applies */
  worstCaseUsd?: number;
  /** The `--max-cost` limit, when given */
  budgetUsd?: number;
  /** Setup errors: the same a run would stop at */
  errors: EvalFinding[];
}

// The price comes from the project when it differs from the built-in price of the model
function priceSourceOf(model: ModelPlan): PriceSource | undefined {
  const { pricing } = model;
  if (pricing === undefined) return undefined;
  const same = [model.ref, model.apiId, undated(model.apiId)]
    .map((id) => builtInPrice(id))
    .some(
      (built) =>
        built?.inputUsdPerMillion === pricing.inputUsdPerMillion &&
        built?.outputUsdPerMillion === pricing.outputUsdPerMillion
    );
  return same ? 'built-in' : 'project';
}

function planModel(suite: SuitePlan, model: ModelPlan, mode: EvalCacheMode): EvalPlanModel {
  const cases = suite.cases.filter((plan) => plan.model === model);
  const hits = cases.filter((plan) => plan.hit !== undefined).length;
  // Replay never calls: a miss there is an error of the run, not a call
  const calls = new Map(
    mode === 'replay'
      ? []
      : cases.filter((plan) => plan.hit === undefined).map((plan) => [plan.key, plan.worstCaseUsd])
  );
  const source = priceSourceOf(model);
  return {
    ref: model.ref,
    provider: model.provider,
    apiId: model.apiId,
    cases: cases.length,
    hits,
    misses: cases.length - hits,
    calls: calls.size,
    ...(source === undefined ? {} : { priceSource: source }),
    ...(model.pricing === undefined || mode === 'replay'
      ? {}
      : { worstCaseUsd: roundUsd([...calls.values()].reduce((sum, usd) => sum + usd, 0)) }),
  };
}

/**
 * Plan a run without calling anything: the same checks as {@link runEval},
 * the cache lookups, and the worst-case cost of every miss. It creates no
 * provider, so it needs no key and announces no host. It needs no budget: without
 * one the worst case is still estimated, from the prices, and checked against nothing.
 *
 * @param options - The options a run would get
 * @returns Hits, misses, calls and worst-case cost per suite and model entry
 */
export async function planEval(options: RunEvalOptions): Promise<EvalPlan> {
  // A plan needs prices to estimate, but no budget: stand in a limit that never fires
  const estimating: RunEvalOptions =
    options.budget === undefined && options.cache.mode !== 'replay'
      ? { ...options, budget: { maxCostUsd: Number.MAX_SAFE_INTEGER } }
      : options;
  const { plans, context, errors } = await setUp(estimating, false);
  const suites = errors.length > 0 ? [] : [...plans];
  suites.sort((a, b) => compareCodeUnits(a.loaded.name, b.loaded.name));
  const described = suites.map((suite): EvalPlanSuite => ({
    name: suite.loaded.name,
    prompt: suite.bundle.id,
    rows: suite.dataset.rows,
    models: suite.models.map((model) => planModel(suite, model, context.mode)),
  }));
  const models = described.flatMap((suite) => suite.models);
  const sum = (pick: (model: EvalPlanModel) => number): number =>
    models.reduce((total, model) => total + pick(model), 0);
  const priced = models.some((model) => model.worstCaseUsd !== undefined);
  return {
    mode: context.mode,
    suites: described,
    hits: sum((model) => model.hits),
    misses: sum((model) => model.misses),
    calls: sum((model) => model.calls),
    ...(priced ? { worstCaseUsd: roundUsd(sum((model) => model.worstCaseUsd ?? 0)) } : {}),
    ...(options.budget === undefined ? {} : { budgetUsd: options.budget.maxCostUsd }),
    errors,
  };
}
