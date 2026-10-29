import type {
  EvalCaseResultV1,
  EvalCaseStatus,
  EvalModelResultV1,
  EvalReportV1,
  EvalSuiteResultV1,
} from '@promptscript/core';

const HASH = `sha256-${'a'.repeat(64)}`;

/** A case result for specs: no assertions unless given. */
export function caseResult(
  id: string,
  status: EvalCaseStatus = 'passed',
  extra: Partial<EvalCaseResultV1> = {}
): EvalCaseResultV1 {
  return {
    id,
    status,
    assertions: [],
    usage: { calls: 1, inputTokens: 10, outputTokens: 5 },
    latencyMs: 100,
    cache: { replayed: 1, live: 0 },
    cacheKeys: [],
    ...extra,
  };
}

/** A model result whose pass rate follows its cases. */
export function modelResult(
  ref: string,
  cases: EvalCaseResultV1[],
  extra: Partial<EvalModelResultV1> = {}
): EvalModelResultV1 {
  const passed = cases.filter((entry) => entry.status === 'passed').length;
  return {
    ref,
    provider: 'anthropic',
    apiId: ref,
    passRate: cases.length === 0 ? 0 : passed / cases.length,
    usage: { calls: cases.length, inputTokens: 10 * cases.length, outputTokens: 5 * cases.length },
    latencyMs: { p50: 100, p95: 100 },
    cases,
    ...extra,
  };
}

/** A suite result with one prompt and dataset hash `a...a`. */
export function suiteResult(
  name: string,
  models: EvalModelResultV1[],
  extra: Partial<EvalSuiteResultV1> = {}
): EvalSuiteResultV1 {
  return {
    name,
    suiteHash: HASH,
    prompt: { id: 'acme/refund', contentHash: HASH },
    dataset: { path: `.promptscript/evals/${name}.jsonl`, rows: 0, hash: HASH },
    passed: models.every((model) => model.passRate === 1),
    thresholds: [],
    findings: [],
    models,
    ...extra,
  };
}

/** A report that passed; override any field. */
export function report(
  suites: EvalSuiteResultV1[],
  extra: Partial<EvalReportV1> = {}
): EvalReportV1 {
  return {
    $schema: 'https://getpromptscript.dev/schema/eval-report/v1.json',
    outcome: 'passed',
    passed: true,
    cache: { mode: 'replay', replayed: 0, live: 0, digest: HASH },
    usage: { calls: 0, inputTokens: 0, outputTokens: 0 },
    suites,
    errors: [],
    ...extra,
  };
}
