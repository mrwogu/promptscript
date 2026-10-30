import { createHash } from 'node:crypto';
import {
  compareCodeUnits,
  sha256Hex,
  type EvalCacheMode,
  type EvalCacheResponseV1,
  type EvalCacheRequestV1,
  type EvalCaseResultV1,
  type EvalDatasetRefV1,
  type EvalFindingV1,
  type EvalJudgeRefV1,
  type EvalModelResultV1,
  type EvalOutcome,
  type EvalReportV1,
  type EvalSuiteResultV1,
  type EvalJudgeAgreementV1,
  type EvalThresholdResultV1,
  type EvalVerdict,
  type EvalUsageV1,
  type ModelParams,
  type ModelPricing,
  type PromptBundleV1,
} from '@promptscript/core';
import type { DeterministicAssertion } from './assertions.js';
import { roundUsd, type Budget } from './cost.js';
import type { DatasetRecord } from './dataset/read.js';
import type { JudgePlan, JudgeSetup } from './judge.js';
import type { EvalFinding } from './errors.js';
import type { EvalRequest } from './provider.js';
import type { LoadedSuite } from './suite/load.js';

/** Schema URL of a report. */
const REPORT_SCHEMA = 'https://getpromptscript.dev/schema/eval-report/v1.json';

/** One model entry a suite runs, resolved. */
export interface ModelPlan {
  /** Reference as written in the suite or the prompt */
  ref: string;
  provider: string;
  apiId: string;
  /** Effective parameters, the output token cap folded in */
  params: ModelParams;
  maxOutputTokens: number;
  /** Price, when the run or the suite needs one */
  pricing?: ModelPricing;
}

/** The fields a provider call needs; a case call and a judge call both have them. */
export interface CallPlan {
  model: ModelPlan;
  request: EvalRequest;
  cacheRequest: EvalCacheRequestV1;
  key: string;
  /** Upper bound of the call cost in USD; 0 without a price */
  worstCaseUsd: number;
  /** Cache entry found before the run, with its file bytes */
  hit?: { response: EvalCacheResponseV1; bytes: Buffer };
  /** The cache was already searched for this key, so a miss is final */
  searched?: boolean;
}

/** One case: a dataset row on a model entry, ready to call or replay. */
export interface CasePlan extends CallPlan {
  row: DatasetRecord['row'];
  /** What the judge assertions do, known before the run for a case the cache answers */
  judgeSetups?: JudgeSetup[];
  /** Worst case of the judge calls of a case with no cached answer, in USD; their keys are not known yet */
  judgeEstimateUsd?: number;
  /** Number of those judge calls */
  judgeEstimateCalls?: number;
}

/** One suite, checked and ready to run. */
export interface SuitePlan {
  loaded: LoadedSuite;
  bundle: PromptBundleV1;
  dataset: EvalDatasetRefV1;
  findings: EvalFindingV1[];
  models: ModelPlan[];
  assertions: DeterministicAssertion[];
  /** The llm-judge assertions, in suite order */
  judges: JudgePlan[];
  /** Human labels by row id, then judge assertion id; present when the suite names a label file */
  labels?: ReadonlyMap<string, ReadonlyMap<string, EvalVerdict>>;
  /** Costs are reported when a budget or a cost threshold applies */
  priced: boolean;
  cases: CasePlan[];
  /** Assertion ids whose patterns ran out of time, shared by every case */
  timedOut: Set<string>;
}

/** What running one case gave. */
export interface CaseOutcome {
  result: EvalCaseResultV1;
  /** Cost in USD, not rounded, when the suite is priced */
  costUsd?: number;
  /** Every cache entry the case consumed, with its file bytes, for the digest */
  entries?: Array<{ key: string; bytes: Buffer }>;
  /** The case stopped because the budget ran out */
  budgetHit?: boolean;
  /** Replay found no entry for the case */
  cacheMiss?: boolean;
}

/** Everything the report is built from. */
export interface ReportInput {
  plans: readonly SuitePlan[];
  outcomes: ReadonlyMap<CasePlan, CaseOutcome>;
  mode: EvalCacheMode;
  budget?: Budget;
  errors: readonly EvalFinding[];
}

/** Nearest-rank percentile; 0 for no values. */
export function percentile(values: readonly number[], fraction: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.max(0, Math.ceil(fraction * sorted.length) - 1)] ?? 0;
}

function addUsage(total: EvalUsageV1, usage: EvalUsageV1): EvalUsageV1 {
  return {
    calls: total.calls + usage.calls,
    inputTokens: total.inputTokens + usage.inputTokens,
    outputTokens: total.outputTokens + usage.outputTokens,
  };
}

const NO_USAGE: EvalUsageV1 = { calls: 0, inputTokens: 0, outputTokens: 0 };

interface ModelSummary {
  result: EvalModelResultV1;
  costUsd: number;
  maxCaseUsd: number;
}

// How often the judge majority matched the human label, for the cases it judged and a human labelled
function judgeAgreement(
  suite: SuitePlan,
  cases: readonly EvalCaseResultV1[]
): EvalJudgeAgreementV1[] {
  const ids = [...new Set(suite.judges.map((judge) => judge.assertion.id))];
  return ids.map((id) => {
    const pairs = cases.flatMap((result) => {
      const label = suite.labels?.get(result.id)?.get(id);
      const judged = result.assertions.find(
        (entry) => entry.id === id && entry.judge !== undefined
      );
      return label === undefined || judged === undefined ? [] : [{ label, passed: judged.passed }];
    });
    const agreed = pairs.filter((pair) => pair.passed === (pair.label === 'pass')).length;
    return { assertion: id, labelled: pairs.length, agreed };
  });
}

function modelSummary(suite: SuitePlan, model: ModelPlan, input: ReportInput): ModelSummary {
  const outcomes = suite.cases
    .filter((plan) => plan.model === model)
    .map((plan) => input.outcomes.get(plan))
    .filter((outcome): outcome is CaseOutcome => outcome !== undefined)
    .sort((a, b) => compareCodeUnits(a.result.id, b.result.id));
  const cases = outcomes.map((outcome) => outcome.result);
  const passed = cases.filter((result) => result.status === 'passed').length;
  const latencies = cases.filter((result) => result.status !== 'error').map((r) => r.latencyMs);
  const costs = outcomes.map((outcome) => outcome.costUsd ?? 0);
  const costUsd = costs.reduce((sum, cost) => sum + cost, 0);
  return {
    result: {
      ref: model.ref,
      provider: model.provider,
      apiId: model.apiId,
      passRate: cases.length === 0 ? 0 : passed / cases.length,
      usage: cases.reduce((total, result) => addUsage(total, result.usage), NO_USAGE),
      ...(suite.priced ? { costUsd: roundUsd(costUsd) } : {}),
      latencyMs: { p50: percentile(latencies, 0.5), p95: percentile(latencies, 0.95) },
      ...(suite.labels === undefined ? {} : { judgeAgreement: judgeAgreement(suite, cases) }),
      cases,
    },
    costUsd,
    maxCaseUsd: Math.max(0, ...costs),
  };
}

function thresholdResults(
  suite: SuitePlan,
  summaries: readonly ModelSummary[]
): EvalThresholdResultV1[] {
  const limits = suite.loaded.suite.thresholds ?? {};
  const results: EvalThresholdResultV1[] = [];
  const add = (
    name: EvalThresholdResultV1['name'],
    limit: number,
    actual: number,
    model?: string
  ): void => {
    const passed = name === 'passRate' ? actual >= limit : actual <= limit;
    results.push({ name, ...(model === undefined ? {} : { model }), limit, actual, passed });
  };
  for (const { result, maxCaseUsd } of summaries) {
    add('passRate', limits.passRate ?? 1, result.passRate, result.ref);
    if (limits.maxCostPerCaseUsd !== undefined) {
      add('maxCostPerCaseUsd', limits.maxCostPerCaseUsd, roundUsd(maxCaseUsd), result.ref);
    }
    if (limits.latencyMs?.p50 !== undefined) {
      add('latencyMs.p50', limits.latencyMs.p50, result.latencyMs.p50, result.ref);
    }
    if (limits.latencyMs?.p95 !== undefined) {
      add('latencyMs.p95', limits.latencyMs.p95, result.latencyMs.p95, result.ref);
    }
  }
  if (limits.maxCostUsd !== undefined) {
    const total = summaries.reduce((sum, summary) => sum + summary.costUsd, 0);
    add('maxCostUsd', limits.maxCostUsd, roundUsd(total));
  }
  return results;
}

// One entry per rubric, by id, so editing a rubric shows in the report
function judgeRefs(suite: SuitePlan): EvalJudgeRefV1[] {
  const refs = new Map<string, EvalJudgeRefV1>();
  for (const { rubric } of suite.judges) {
    refs.set(rubric.id, { rubric: rubric.id, contentHash: rubric.contentHash });
  }
  return [...refs.values()].sort((a, b) => compareCodeUnits(a.rubric, b.rubric));
}

function suiteResult(
  suite: SuitePlan,
  input: ReportInput
): { result: EvalSuiteResultV1; costUsd: number } {
  const summaries = suite.models.map((model) => modelSummary(suite, model, input));
  const thresholds = thresholdResults(suite, summaries);
  return {
    result: {
      name: suite.loaded.name,
      suiteHash: suite.loaded.hash,
      prompt: { id: suite.bundle.id, contentHash: suite.bundle.contentHash },
      dataset: suite.dataset,
      ...(suite.judges.length === 0 ? {} : { judges: judgeRefs(suite) }),
      passed: thresholds.every((threshold) => threshold.passed),
      thresholds,
      findings: suite.findings,
      models: summaries.map((summary) => summary.result),
    },
    costUsd: summaries.reduce((sum, summary) => sum + summary.costUsd, 0),
  };
}

// SHA-256 over the SHA-256 of each consumed entry file, in key order.
function cacheDigest(outcomes: readonly CaseOutcome[]): string {
  const bytes = new Map<string, Buffer>();
  for (const outcome of outcomes) {
    for (const entry of outcome.entries ?? []) bytes.set(entry.key, entry.bytes);
  }
  const lines = [...bytes.keys()].sort(compareCodeUnits).map((key) =>
    createHash('sha256')
      .update(bytes.get(key) ?? '')
      .digest('hex')
  );
  return `sha256-${sha256Hex(lines.join('\n'))}`;
}

function outcomeOf(
  input: ReportInput,
  suites: readonly EvalSuiteResultV1[],
  outcomes: readonly CaseOutcome[]
): EvalOutcome {
  if (input.errors.length > 0 || outcomes.some((outcome) => outcome.cacheMiss === true))
    return 'error';
  if (outcomes.some((outcome) => outcome.budgetHit === true)) return 'budget-exceeded';
  const failed =
    suites.some((suite) => !suite.passed) ||
    outcomes.some((outcome) => outcome.result.status === 'error');
  return failed ? 'failed' : 'passed';
}

/**
 * Build the report of a run: suites sorted by name, model entries in suite
 * order, cases sorted by id, costs rounded to six decimals, and no
 * timestamps, so the same inputs give the same bytes.
 *
 * @param input - Plans, case outcomes, cache mode, budget and setup errors
 * @returns The report
 */
export function buildReport(input: ReportInput): EvalReportV1 {
  const plans = [...input.plans].sort((a, b) => compareCodeUnits(a.loaded.name, b.loaded.name));
  const built = plans.map((plan) => suiteResult(plan, input));
  const suites = built.map((entry) => entry.result);
  const outcomes = [...input.outcomes.values()];
  const cases = outcomes.map((outcome) => outcome.result);
  const outcome = outcomeOf(input, suites, outcomes);
  const priced = plans.length > 0 && plans.every((plan) => plan.priced);
  return {
    $schema: REPORT_SCHEMA,
    outcome,
    passed: outcome === 'passed',
    cache: {
      mode: input.mode,
      replayed: cases.reduce((sum, result) => sum + result.cache.replayed, 0),
      live: cases.reduce((sum, result) => sum + result.cache.live, 0),
      digest: cacheDigest(outcomes),
    },
    usage: cases.reduce((total, result) => addUsage(total, result.usage), NO_USAGE),
    ...(priced ? { costUsd: roundUsd(built.reduce((sum, entry) => sum + entry.costUsd, 0)) } : {}),
    ...(input.budget === undefined
      ? {}
      : { budget: { maxUsd: input.budget.maxUsd, spentUsd: roundUsd(input.budget.spent) } }),
    suites,
    errors: input.errors.map(({ code, message, file, line }) => ({
      code,
      message,
      ...(file === undefined ? {} : { file }),
      ...(line === undefined ? {} : { line }),
    })),
  };
}
