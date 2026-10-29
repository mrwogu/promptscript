import {
  compareCodeUnits,
  type EvalCaseStatus,
  type EvalComparisonEntryV1,
  type EvalComparisonV1,
  type EvalModelResultV1,
  type EvalReportV1,
  type EvalSuiteResultV1,
} from '@promptscript/core';
import { EVAL_CODES, EvalError } from './errors.js';
import { isRecord } from './shape.js';

const REPORT_SCHEMA = 'https://getpromptscript.dev/schema/eval-report/v1.json';
const STATUSES = new Set<unknown>(['passed', 'failed', 'error']);

/** Options of {@link compareReports}. */
export interface CompareOptions {
  /** Pass-rate drop that counts as a regression, 0 to 1 */
  tolerance: number;
}

function round6(value: number): number {
  return Math.round(value * 1e6) / 1e6;
}

function invalid(label: string, problem: string): EvalError {
  return new EvalError(
    `Report ${label} is not an eval report this version reads: ${problem}. Create it with prs eval run --format json.`,
    EVAL_CODES.REPORT_INVALID
  );
}

function isNumberIn(value: unknown, min: number, max: number): boolean {
  return typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;
}

function checkCases(cases: unknown, where: string, label: string): void {
  if (!Array.isArray(cases)) throw invalid(label, `${where}.cases must be a list`);
  const seen = new Set<string>();
  for (const entry of cases) {
    if (!isRecord(entry) || typeof entry['id'] !== 'string') {
      throw invalid(label, `a case of ${where} has no id`);
    }
    if (!STATUSES.has(entry['status'])) {
      throw invalid(label, `a case of ${where} has no valid status`);
    }
    if (seen.has(entry['id'])) throw invalid(label, `${where} repeats a case id`);
    seen.add(entry['id']);
  }
}

function checkModel(model: unknown, where: string, label: string): void {
  if (!isRecord(model) || typeof model['ref'] !== 'string') {
    throw invalid(label, `a model of ${where} has no ref`);
  }
  const path = `${where}/${model['ref'].slice(0, 80)}`;
  if (!isNumberIn(model['passRate'], 0, 1)) throw invalid(label, `${path} has no valid passRate`);
  const latency = model['latencyMs'];
  if (!isRecord(latency) || !isNumberIn(latency['p95'], 0, Number.MAX_SAFE_INTEGER)) {
    throw invalid(label, `${path} has no valid latencyMs.p95`);
  }
  const cost = model['costUsd'];
  if (cost !== undefined && !isNumberIn(cost, 0, Number.MAX_SAFE_INTEGER)) {
    throw invalid(label, `${path} has no valid costUsd`);
  }
  checkCases(model['cases'], path, label);
}

function checkSuite(suite: unknown, label: string): string {
  if (!isRecord(suite) || typeof suite['name'] !== 'string') {
    throw invalid(label, 'a suite has no name');
  }
  const name = suite['name'].slice(0, 80);
  const dataset = suite['dataset'];
  if (!isRecord(dataset) || typeof dataset['hash'] !== 'string') {
    throw invalid(label, `suite ${name} has no dataset hash`);
  }
  if (!Array.isArray(suite['models'])) throw invalid(label, `suite ${name} has no models`);
  const refs = new Set<string>();
  for (const model of suite['models'] as unknown[]) {
    checkModel(model, name, label);
    const ref = (model as { ref: string }).ref;
    if (refs.has(ref)) throw invalid(label, `suite ${name} repeats a model`);
    refs.add(ref);
  }
  return suite['name'];
}

/**
 * Parse a report file and check what a comparison reads: the schema URL,
 * suites with names, dataset hashes, models with a pass rate and p95
 * latency, and cases with an id and a status. Names, model refs and case ids
 * must be unique. The error names the file and the problem, never the
 * parser message or any content.
 *
 * @param text - File content
 * @param label - File name shown in errors
 * @returns The report
 * @throws EvalError `PS6701`
 */
export function readReport(text: string, label: string): EvalReportV1 {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw invalid(label, 'it is not valid JSON');
  }
  if (!isRecord(parsed)) throw invalid(label, 'the document is not an object');
  if (parsed['$schema'] !== REPORT_SCHEMA) throw invalid(label, `$schema is not ${REPORT_SCHEMA}`);
  const suites = parsed['suites'];
  if (!Array.isArray(suites)) throw invalid(label, 'suites must be a list');
  const names = new Set<string>();
  for (const suite of suites as unknown[]) {
    const name = checkSuite(suite, label);
    if (names.has(name)) throw invalid(label, 'a suite name appears twice');
    names.add(name);
  }
  return parsed as unknown as EvalReportV1;
}

function statusOf(model: EvalModelResultV1): Map<string, EvalCaseStatus> {
  return new Map(model.cases.map((entry) => [entry.id, entry.status]));
}

function sorted(ids: Iterable<string>): string[] {
  return [...ids].sort(compareCodeUnits);
}

function oneSided(
  suite: string,
  model: string,
  ids: string[],
  side: 'onlyInBaseline' | 'onlyInCandidate'
): EvalComparisonEntryV1 {
  return {
    suite,
    model,
    passRateDelta: 0,
    latencyP95MsDelta: 0,
    regressions: [],
    fixes: [],
    onlyInBaseline: side === 'onlyInBaseline' ? sorted(ids) : [],
    onlyInCandidate: side === 'onlyInCandidate' ? sorted(ids) : [],
    datasetChanged: true,
  };
}

function entryOf(
  suite: string,
  datasetChanged: boolean,
  a: EvalModelResultV1,
  b: EvalModelResultV1
): EvalComparisonEntryV1 {
  const before = statusOf(a);
  const after = statusOf(b);
  const common = sorted([...before.keys()].filter((id) => after.has(id)));
  const regressions = common.filter(
    (id) => before.get(id) === 'passed' && after.get(id) !== 'passed'
  );
  const fixes = common.filter((id) => before.get(id) !== 'passed' && after.get(id) === 'passed');
  return {
    suite,
    model: b.ref,
    passRateDelta: round6(b.passRate - a.passRate),
    ...(a.costUsd === undefined || b.costUsd === undefined
      ? {}
      : { costUsdDelta: round6(b.costUsd - a.costUsd) }),
    latencyP95MsDelta: b.latencyMs.p95 - a.latencyMs.p95,
    regressions,
    fixes,
    onlyInBaseline: sorted([...before.keys()].filter((id) => !after.has(id))),
    onlyInCandidate: sorted([...after.keys()].filter((id) => !before.has(id))),
    datasetChanged,
  };
}

function suiteEntries(
  name: string,
  a: EvalSuiteResultV1 | undefined,
  b: EvalSuiteResultV1 | undefined
): EvalComparisonEntryV1[] {
  const entries: EvalComparisonEntryV1[] = [];
  const baseline = new Map((a?.models ?? []).map((model) => [model.ref, model]));
  const candidate = new Map((b?.models ?? []).map((model) => [model.ref, model]));
  const changed = a?.dataset.hash !== b?.dataset.hash;
  for (const model of b?.models ?? []) {
    const before = baseline.get(model.ref);
    entries.push(
      before === undefined
        ? oneSided(
            name,
            model.ref,
            model.cases.map((entry) => entry.id),
            'onlyInCandidate'
          )
        : entryOf(name, changed, before, model)
    );
  }
  for (const model of a?.models ?? []) {
    if (!candidate.has(model.ref)) {
      entries.push(
        oneSided(
          name,
          model.ref,
          model.cases.map((entry) => entry.id),
          'onlyInBaseline'
        )
      );
    }
  }
  return entries;
}

/**
 * Compare a candidate report with a baseline. Suites match by name, models
 * by `ref`, cases by id. A case regressed when it passed in the baseline and
 * does not pass in the candidate; only ids both reports have are compared.
 * A suite or model one report lacks gets an entry that lists its cases under
 * `onlyInBaseline` or `onlyInCandidate`, and never counts as a regression.
 * `regression` is true when a case regressed or a pass rate dropped by more
 * than the tolerance.
 *
 * @param baseline - The earlier report
 * @param candidate - The report under test
 * @param options - Tolerance
 * @returns The comparison, entries sorted by suite name, then model order
 */
export function compareReports(
  baseline: EvalReportV1,
  candidate: EvalReportV1,
  options: CompareOptions
): EvalComparisonV1 {
  const before = new Map(baseline.suites.map((suite) => [suite.name, suite]));
  const after = new Map(candidate.suites.map((suite) => [suite.name, suite]));
  const names = sorted(new Set([...before.keys(), ...after.keys()]));
  const entries = names.flatMap((name) => suiteEntries(name, before.get(name), after.get(name)));
  const regression = entries.some(
    (entry) => entry.regressions.length > 0 || -entry.passRateDelta > options.tolerance
  );
  return { tolerance: options.tolerance, regression, entries };
}

/**
 * Suites and models the baseline has and the candidate lacks: `suite` for a
 * whole suite, `suite/model` for a model entry of a suite both have. A
 * comparison never counts these as regressions, so callers show them.
 *
 * @param baseline - The earlier report
 * @param candidate - The report under test
 * @returns Names sorted by code units
 */
export function missingFromCandidate(baseline: EvalReportV1, candidate: EvalReportV1): string[] {
  const after = new Map(candidate.suites.map((suite) => [suite.name, suite]));
  const missing: string[] = [];
  for (const suite of baseline.suites) {
    const other = after.get(suite.name);
    if (other === undefined) {
      missing.push(suite.name);
      continue;
    }
    const refs = new Set(other.models.map((model) => model.ref));
    for (const model of suite.models) {
      if (!refs.has(model.ref)) missing.push(`${suite.name}/${model.ref}`);
    }
  }
  return missing.sort(compareCodeUnits);
}
