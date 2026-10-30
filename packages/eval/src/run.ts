import { Buffer } from 'node:buffer';
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import {
  compareCodeUnits,
  getModelCatalog,
  type EvalCacheMode,
  type EvalAssertionResultV1,
  type EvalCaseStatus,
  type EvalLlmJudgeAssertion,
  type EvalFindingV1,
  type EvalModelEntry,
  type EvalReportV1,
  type ModelCatalog,
  type ModelParams,
  type ModelPricing,
  type PromptBundleModel,
  type PromptBundleV1,
} from '@promptscript/core';
import { loadPrompt, type Prompt, type PromptMessage } from '@promptscript/runtime';
import { evaluateAssertions, type DeterministicAssertion } from './assertions.js';
import { MAX_TOKENS, cacheKey, inputsHash } from './cache.js';
import { messageOf, obtain, pool, searchCache, type Add, type RunContext } from './calls.js';
import { Budget, callCost, roundUsd, worstCaseCost } from './cost.js';
import {
  judgeCase,
  judgeEstimate,
  judgeSetups,
  setupCalls,
  type JudgedCase,
  type JudgePlan,
} from './judge.js';
import { effectiveInputs } from './inputs.js';
import { readLabels, unmatchedLabels } from './labels.js';
import { checkDatasetRow } from './dataset/check.js';
import { readDataset, type DatasetRecord } from './dataset/read.js';
import { scanDatasetRow } from './dataset/scan.js';
import { EVAL_CODES, EvalError, type EvalCode, type EvalFinding } from './errors.js';
import { projectRelative, resolveProjectPath } from './paths.js';
import type { EvalProviderLookup, EvalResponse } from './provider.js';
import {
  buildReport,
  type CaseOutcome,
  type CallPlan,
  type CasePlan,
  type ModelPlan,
  type SuitePlan,
} from './report.js';
import { checkSuites } from './suite/check.js';
import { judgeModelRef } from './suite/rubric.js';
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
const DEFAULT_JUDGE_RUNS = 3;
const MAX_CONCURRENCY = 16;

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
  return targets.map((target) => planOf(target, own, priced, loaded, options, add));
}

// One model plan: the prompt's own parameters under the entry's, the output cap folded in
function planOf(
  target: ModelTarget,
  own: PromptBundleModel | undefined,
  priced: boolean,
  loaded: LoadedSuite,
  options: RunEvalOptions,
  add: Add
): ModelPlan {
  const merged = { ...own?.params, ...target.params };
  const maxOutputTokens = merged.maxTokens ?? options.maxOutputTokens ?? DEFAULT_MAX_OUTPUT_TOKENS;
  const pricing = priced ? priceOf(target, options, loaded.file, add) : undefined;
  return {
    ref: target.ref,
    provider: target.provider,
    apiId: target.apiId,
    params: { ...merged, maxTokens: maxOutputTokens },
    maxOutputTokens,
    ...(pricing === undefined ? {} : { pricing }),
  };
}

// The model of a judge assertion; --model never changes it
function judgeModelPlan(
  assertion: EvalLlmJudgeAssertion,
  rubric: PromptBundleV1,
  loaded: LoadedSuite,
  options: RunEvalOptions,
  add: Add
): ModelPlan | undefined {
  const chosen = judgeModelRef(assertion, loaded.suite, rubric);
  const own = rubric.model;
  if (chosen === undefined) return undefined;
  const priced = options.budget !== undefined || hasCostThreshold(loaded);
  const targets =
    chosen.fromRubric && own !== undefined
      ? [
          {
            ref: own.ref,
            priceRef: own.profile ?? own.ref,
            provider: own.provider,
            apiId: own.apiId,
            params: {},
          },
        ]
      : entryTarget(chosen.ref, options, loaded.file, add);
  const [target] = targets;
  return target === undefined ? undefined : planOf(target, own, priced, loaded, options, add);
}

// The judge assertions of a suite, with their rubrics loaded and their models resolved
function prepareJudges(loaded: LoadedSuite, options: RunEvalOptions, add: Add): JudgePlan[] {
  const plans: JudgePlan[] = [];
  for (const assertion of loaded.suite.assertions) {
    if (assertion.kind !== 'llm-judge') continue;
    const rubric = options.bundles.find((candidate) => candidate.id === assertion.rubric);
    if (rubric === undefined) continue;
    let prompt: Prompt;
    try {
      prompt = loadPrompt(rubric);
    } catch (error) {
      add(
        EVAL_CODES.UNKNOWN_PROMPT,
        `Suite ${loaded.file}: rubric "${rubric.id}" did not load: ${messageOf(error)}`,
        loaded.file
      );
      continue;
    }
    const model = judgeModelPlan(assertion, rubric, loaded, options, add);
    if (model === undefined) continue;
    const runs = assertion.runs ?? loaded.suite.judge?.runs ?? DEFAULT_JUDGE_RUNS;
    plans.push({ assertion, rubric, prompt, model, runs });
  }
  return plans;
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

// Human labels of a suite; a file problem or a label for another assertion stops the run
async function prepareLabels(
  loaded: LoadedSuite,
  options: RunEvalOptions,
  add: Add
): Promise<SuitePlan['labels']> {
  if (loaded.labelsFile === undefined) return undefined;
  const { suite } = loaded;
  const path = projectRelative(options.projectRoot, loaded.labelsFile);
  try {
    const read = await readLabels(loaded.labelsFile, path, {
      judgeIds: new Set(
        suite.assertions.filter((entry) => entry.kind === 'llm-judge').map((entry) => entry.id)
      ),
      assertionIds: new Set(suite.assertions.map((entry) => entry.id)),
      suiteFile: loaded.file,
      ...(suite.labels === undefined ? {} : { writtenPath: suite.labels }),
    });
    for (const finding of read.findings) {
      add(finding.code, finding.message, finding.file, finding.line);
    }
    return read.labels;
  } catch (error) {
    if (!(error instanceof EvalError)) throw error;
    add(error.code as EvalCode, error.message, error.location?.file ?? path, error.location?.line);
    return undefined;
  }
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
  const judges = prepareJudges(loaded, options, add);
  // A profile is outside the eval config, so its values get the same secret check
  const secret = options.providers.secretIn?.(
    JSON.stringify([...models, ...judges.map((judge) => judge.model)])
  );
  if (secret !== undefined) {
    add(
      EVAL_CODES.KEY_IN_CONFIG,
      `Suite ${file}: the value of ${secret} appears in a model of the suite, such as its API id; keep secrets only in the environment.`,
      file
    );
  }
  const labels = await prepareLabels(loaded, options, add);
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
      judges,
      ...(labels === undefined ? {} : { labels }),
      priced: options.budget !== undefined || hasCostThreshold(loaded),
      cases,
      timedOut: new Set(),
    },
  };
}

// Cache lookups for every case, before any call
async function lookUp(plans: readonly SuitePlan[], context: RunContext, add: Add): Promise<void> {
  await searchCache(
    plans.flatMap((plan) => plan.cases),
    context,
    add
  );
}

// The judge calls of a case the cache answers are known now, so they are looked up like the case
function judgeCallsOf(suite: SuitePlan, plan: CasePlan, context: RunContext): CallPlan[] {
  if (plan.hit === undefined) {
    // Without an answer the judge keys are unknown, so the plan only estimates them
    if (context.mode !== 'replay') planEstimate(suite, plan);
    return [];
  }
  try {
    plan.judgeSetups = judgeSetups(suite.judges, suite.bundle, plan.row, plan.hit.response.text);
  } catch {
    // The run of the case reports why the judges cannot be set up
    return [];
  }
  return setupCalls(plan.judgeSetups);
}

async function lookUpJudges(
  plans: readonly SuitePlan[],
  context: RunContext,
  add: Add
): Promise<void> {
  const calls = plans
    .filter((suite) => suite.judges.length > 0)
    .flatMap((suite) => suite.cases.flatMap((plan) => judgeCallsOf(suite, plan, context)));
  if (context.mode === 'replay' || context.mode === 'record') {
    await searchCache(calls, context, add);
  }
}

function planEstimate(suite: SuitePlan, plan: CasePlan): void {
  try {
    const estimate = judgeEstimate(suite.judges, suite.bundle, plan.row, plan.model);
    plan.judgeEstimateUsd = estimate.usd;
    plan.judgeEstimateCalls = estimate.calls;
  } catch {
    // The same rendering error stops the case when it runs
  }
}

// Judge calls a record or off run would make: by key, rows with one request counted once
function judgeMisses(cases: readonly CasePlan[]): Map<string, number> {
  const misses = new Map<string, number>();
  const calls = cases.flatMap((plan) => setupCalls(plan.judgeSetups ?? []));
  for (const call of calls.filter((entry) => entry.hit === undefined)) {
    misses.set(call.key, call.worstCaseUsd);
  }
  return misses;
}

// Providers of the calls the cache cannot answer: the models under test, and the judges
// of a suite that has a case or a judge call to make
function providerNames(plans: readonly SuitePlan[]): Set<string> {
  const names = new Set<string>();
  for (const suite of plans) {
    const missed = suite.cases.filter((plan) => plan.hit === undefined);
    for (const plan of missed) names.add(plan.model.provider);
    if (missed.length > 0 || judgeMisses(suite.cases).size > 0) {
      for (const judge of suite.judges) names.add(judge.model.provider);
    }
  }
  return names;
}

function setUpProviders(plans: readonly SuitePlan[], context: RunContext, add: Add): void {
  const names = providerNames(plans);
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

async function respond(
  plan: CasePlan,
  context: RunContext
): Promise<{ response: EvalResponse; bytes: Buffer; live: boolean } | CaseOutcome> {
  const got = await obtain(plan, plan.row.id, context);
  return 'code' in got ? errored(plan, got.code, got.message, got.flags) : got;
}

// The deterministic assertions, or the case as an error when one cannot run
function checkCase(
  suite: SuitePlan,
  plan: CasePlan,
  text: string
): EvalAssertionResultV1[] | CaseOutcome {
  try {
    return evaluateAssertions(suite.assertions, text, {
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
}

// Judge setups of a case: the ones known before the run, else made from the answer
async function judgeOf(
  suite: SuitePlan,
  plan: CasePlan,
  text: string,
  context: RunContext
): Promise<JudgedCase> {
  if (suite.judges.length === 0) return { results: [], uses: [] };
  try {
    const setups = plan.judgeSetups ?? judgeSetups(suite.judges, suite.bundle, plan.row, text);
    return await judgeCase(setups, plan.row.id, context);
  } catch (error) {
    const message = `A judge assertion could not run: ${messageOf(error)}`;
    return { results: [], uses: [], failure: { code: EVAL_CODES.ASSERTION_ERROR, message } };
  }
}

function statusOf(
  assertions: readonly EvalAssertionResultV1[],
  judged: JudgedCase
): EvalCaseStatus {
  if (judged.failure !== undefined) return 'error';
  return assertions.every((result) => result.passed) ? 'passed' : 'failed';
}

interface Answered {
  response: EvalResponse;
  bytes: Buffer;
  live: boolean;
}

// The case as it finished: the case call, the deterministic results and the judge runs together
function finishCase(
  suite: SuitePlan,
  plan: CasePlan,
  answered: Answered,
  checked: readonly EvalAssertionResultV1[],
  judged: JudgedCase
): CaseOutcome {
  const { response, bytes, live } = answered;
  const results = new Map([...checked, ...judged.results].map((result) => [result.id, result]));
  const assertions = suite.loaded.suite.assertions.flatMap((assertion) => {
    const result = results.get(assertion.id);
    return result === undefined ? [] : [result];
  });
  const priced = suite.priced && plan.model.pricing !== undefined;
  const caseCost = priced && plan.model.pricing ? callCost(response.usage, plan.model.pricing) : 0;
  const costUsd = judged.uses.reduce((sum, use) => sum + (use.costUsd ?? 0), caseCost);
  const lives = [live, ...judged.uses.map((use) => use.live)].filter(Boolean).length;
  const status = statusOf(assertions, judged);
  return {
    entries: [
      { key: plan.key, bytes },
      ...judged.uses.map(({ key, bytes: used }) => ({ key, bytes: used })),
    ],
    ...(priced ? { costUsd } : {}),
    ...judged.failure?.flags,
    result: {
      id: plan.row.id,
      ...(plan.row.tags === undefined ? {} : { tags: plan.row.tags }),
      status,
      assertions,
      usage: judged.uses.reduce(
        (total, use) => ({
          calls: total.calls + 1,
          inputTokens: total.inputTokens + use.usage.inputTokens,
          outputTokens: total.outputTokens + use.usage.outputTokens,
        }),
        { calls: 1, ...response.usage }
      ),
      ...(priced ? { costUsd: roundUsd(costUsd) } : {}),
      latencyMs: response.latencyMs,
      cache: { replayed: judged.uses.length + 1 - lives, live: lives },
      cacheKeys: [plan.key, ...judged.uses.map((use) => use.key)],
      ...(judged.failure === undefined
        ? {}
        : { error: { code: judged.failure.code, message: judged.failure.message } }),
    },
  };
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
  const checked = checkCase(suite, plan, answered.response.text);
  if ('result' in checked) return checked;
  // Judges run whatever the deterministic assertions said, so their data does not depend on them
  const judged = await judgeOf(suite, plan, answered.response.text, context);
  return finishCase(suite, plan, answered, checked, judged);
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

// Every miss at its worst case; rows with the same key share one call, so they count once.
// Judge calls of a case with no answer have no key yet, so each counts at its estimate.
function checkPlanCost(plans: readonly SuitePlan[], context: RunContext, add: Add): void {
  const cases = plans.flatMap((suite) => suite.cases);
  const calls = new Map<string, number>(judgeMisses(cases));
  for (const plan of cases) {
    if (plan.hit === undefined) calls.set(plan.key, plan.worstCaseUsd);
  }
  const estimated = cases.reduce((sum, plan) => sum + (plan.judgeEstimateUsd ?? 0), 0);
  const worstCase = [...calls.values()].reduce((sum, usd) => sum + usd, estimated);
  if (context.budget !== undefined && worstCase > context.budget.maxUsd) {
    add(
      EVAL_CODES.BUDGET_EXCEEDED,
      `The run could cost up to ${roundUsd(worstCase)} USD and --max-cost is ${context.budget.maxUsd} USD; raise --max-cost or run fewer cases.`
    );
  }
}

// Labels of rows the run did not read are no error: the row limit and dataset edits cause them
function warnUnmatchedLabels(
  plans: readonly SuitePlan[],
  notify: (event: EvalProgress) => void
): void {
  for (const plan of plans) {
    if (plan.labels === undefined) continue;
    const rows = new Set(plan.cases.map((entry) => entry.row.id));
    for (const finding of unmatchedLabels(plan.labels, rows, plan.loaded.file)) {
      notify({ type: 'warning', finding });
    }
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
  if (errors.length === 0) warnUnmatchedLabels(plans, notify);

  if (errors.length === 0 && plans.every((plan) => plan.cases.length === 0)) {
    add(EVAL_CODES.RUN_OPTION_INVALID, 'There is no case to run; pass at least one suite.');
  }
  const context = createContext(options, notify, add);
  if (errors.length > 0) return { plans, context, errors };
  await lookUp(plans, context, add);
  if (errors.length === 0) await lookUpJudges(plans, context, add);
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
  /** Judge calls the cache answers; only for a suite with judge assertions */
  judgeHits?: number;
  /**
   * Judge calls a record or off run would make, 0 in replay. A case with no
   * cached answer counts its judge runs at their estimate.
   */
  judgeCalls?: number;
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
  /** Judge calls the cache answers; only when a suite has judge assertions */
  judgeHits?: number;
  /** Judge calls a run would make; only when a suite has judge assertions */
  judgeCalls?: number;
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
  const judged = suite.judges.length > 0;
  const judgeMiss = mode === 'replay' ? new Map<string, number>() : judgeMisses(cases);
  const estimated = mode === 'replay' ? [] : cases.filter((plan) => plan.hit === undefined);
  const judgeCalls =
    judgeMiss.size + estimated.reduce((sum, plan) => sum + (plan.judgeEstimateCalls ?? 0), 0);
  const worst =
    [...calls.values(), ...judgeMiss.values()].reduce((sum, usd) => sum + usd, 0) +
    estimated.reduce((sum, plan) => sum + (plan.judgeEstimateUsd ?? 0), 0);
  const source = priceSourceOf(model);
  return {
    ref: model.ref,
    provider: model.provider,
    apiId: model.apiId,
    cases: cases.length,
    hits,
    misses: cases.length - hits,
    calls: calls.size,
    ...(judged ? { judgeHits: judgeHitsOf(cases), judgeCalls } : {}),
    ...(source === undefined ? {} : { priceSource: source }),
    ...(model.pricing === undefined || mode === 'replay' ? {} : { worstCaseUsd: roundUsd(worst) }),
  };
}

function judgeHitsOf(cases: readonly CasePlan[]): number {
  return cases
    .flatMap((plan) => setupCalls(plan.judgeSetups ?? []))
    .filter((call) => call.hit !== undefined).length;
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
  const judged = suites.some((suite) => suite.judges.length > 0);
  return {
    mode: context.mode,
    suites: described,
    hits: sum((model) => model.hits),
    misses: sum((model) => model.misses),
    calls: sum((model) => model.calls),
    ...(judged
      ? {
          judgeHits: sum((model) => model.judgeHits ?? 0),
          judgeCalls: sum((model) => model.judgeCalls ?? 0),
        }
      : {}),
    ...(priced ? { worstCaseUsd: roundUsd(sum((model) => model.worstCaseUsd ?? 0)) } : {}),
    ...(options.budget === undefined ? {} : { budgetUsd: options.budget.maxCostUsd }),
    errors,
  };
}
