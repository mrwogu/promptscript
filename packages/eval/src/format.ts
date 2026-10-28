import type {
  EvalCaseResultV1,
  EvalComparisonEntryV1,
  EvalComparisonV1,
  EvalModelResultV1,
  EvalReportV1,
  EvalSuiteResultV1,
  EvalThresholdResultV1,
} from '@promptscript/core';
import type { EvalPlan } from './run.js';
import { cleanValue, markdownCode, xmlText } from './sanitize.js';

/** Output formats of a run report. */
export type EvalReportFormat = 'text' | 'json' | 'markdown' | 'junit';

/** Output formats of a comparison. */
export type EvalComparisonFormat = 'text' | 'json' | 'markdown';

/** Options of {@link formatReport} and {@link formatComparison}. */
export interface FormatOptions {
  /** Color the text format; set it only for a terminal */
  color?: boolean;
  /** Suites or `suite/model` entries the baseline has and the candidate lacks, shown as a visible note */
  missing?: readonly string[];
}

const COMPARISON_SCHEMA = 'https://getpromptscript.dev/schema/eval-comparison/v1.json';
// Failed or regressed cases listed per model in text, in all in Markdown
const MAX_LISTED = 20;

type Paint = (code: 'red' | 'green' | 'yellow', text: string) => string;

const CODES = { red: 31, green: 32, yellow: 33 } as const;

function painter(color: boolean | undefined): Paint {
  return color === true
    ? (code, text) => `\u001b[${CODES[code]}m${text}\u001b[0m`
    : (_code, text) => text;
}

function percent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function signedPoints(delta: number): string {
  const points = (delta * 100).toFixed(1);
  return `${delta > 0 ? '+' : ''}${points} pp`;
}

function signed(value: number): string {
  return value >= 0 ? `+${value}` : String(value);
}

function usd(value: number | undefined): string {
  return value === undefined ? '-' : `$${value}`;
}

function costDelta(value: number | undefined): string {
  if (value === undefined) return '-';
  return value >= 0 ? `+$${value}` : `-$${Math.abs(value)}`;
}

function where(error: { file?: string; line?: number }): string {
  if (error.file === undefined) return '';
  return error.line === undefined ? ` (${error.file})` : ` (${error.file}:${error.line})`;
}

function errorLine(error: { code: string; message: string; file?: string; line?: number }): string {
  return `${error.code}: ${error.message}${where(error)}`;
}

function passRateLimit(suite: EvalSuiteResultV1, model: EvalModelResultV1): number | undefined {
  return suite.thresholds.find((entry) => entry.name === 'passRate' && entry.model === model.ref)
    ?.limit;
}

function passCount(model: EvalModelResultV1): string {
  const passed = model.cases.filter((entry) => entry.status === 'passed').length;
  return `${percent(model.passRate)} (${passed}/${model.cases.length})`;
}

function failedOf(model: EvalModelResultV1): EvalCaseResultV1[] {
  return model.cases.filter((entry) => entry.status !== 'passed');
}

// What went wrong in one case: the failed assertions or the error
function reasons(entry: EvalCaseResultV1): Array<{ id: string; text: string }> {
  if (entry.error !== undefined) {
    return [{ id: entry.error.code, text: entry.error.message }];
  }
  const failed = entry.assertions
    .filter((assertion) => !assertion.passed)
    .map((assertion) => ({ id: assertion.id, text: assertion.reason ?? 'failed' }));
  return failed.length > 0 ? failed : [{ id: 'case', text: 'failed' }];
}

function comparisonOf(
  report: EvalReportV1,
  suite: string,
  model: string
): EvalComparisonEntryV1 | undefined {
  return report.comparison?.entries.find((entry) => entry.suite === suite && entry.model === model);
}

function textFindings(suite: EvalSuiteResultV1, paint: Paint): string[] {
  return suite.findings.map((finding) => {
    const note =
      finding.allowedBecause === undefined ? '' : ` (allowed: ${finding.allowedBecause})`;
    const severity = paint('yellow', finding.severity);
    return `  ${severity} ${finding.code} row ${finding.rowId ?? '-'} at ${finding.path ?? '-'}${note}`;
  });
}

function textFailed(model: EvalModelResultV1, paint: Paint): string[] {
  const failed = failedOf(model);
  const lines: string[] = [];
  for (const entry of failed.slice(0, MAX_LISTED)) {
    for (const reason of reasons(entry)) {
      lines.push(`    ${paint('red', entry.id)}  ${reason.id}: ${reason.text}`);
    }
  }
  if (failed.length > MAX_LISTED) lines.push(`    ... and ${failed.length - MAX_LISTED} more`);
  return lines;
}

function textDelta(delta: EvalComparisonEntryV1 | undefined, paint: Paint): string[] {
  if (delta === undefined) return [];
  const lines: string[] = [];
  if (delta.regressions.length > 0) {
    lines.push(`    ${paint('red', 'regressed')}: ${delta.regressions.join(', ')}`);
  }
  if (delta.fixes.length > 0) lines.push(`    fixed: ${delta.fixes.join(', ')}`);
  if (delta.datasetChanged) lines.push('    dataset changed since the baseline');
  return lines;
}

function textModel(
  report: EvalReportV1,
  suite: EvalSuiteResultV1,
  model: EvalModelResultV1,
  paint: Paint
): string[] {
  const limit = passRateLimit(suite, model);
  const delta = comparisonOf(report, suite.name, model.ref);
  const parts = [
    `  ${model.ref}`,
    `pass ${passCount(model)}`,
    ...(limit === undefined ? [] : [`limit ${percent(limit)}`]),
    `cost ${usd(model.costUsd)}`,
    `p95 ${model.latencyMs.p95} ms`,
    ...(delta === undefined ? [] : [`delta ${signedPoints(delta.passRateDelta)}`]),
  ];
  return [parts.join('   '), ...textFailed(model, paint), ...textDelta(delta, paint)];
}

function textSuite(report: EvalReportV1, suite: EvalSuiteResultV1, paint: Paint): string[] {
  const state = suite.passed ? paint('green', 'passed') : paint('red', 'failed');
  return [
    `${suite.name}  ${suite.prompt.id}  ${state}`,
    ...textFindings(suite, paint),
    ...suite.models.flatMap((model) => textModel(report, suite, model, paint)),
  ];
}

function missingText(missing: readonly string[], paint: Paint): string[] {
  if (missing.length === 0) return [];
  return [`${paint('yellow', 'warning')}: only in the baseline, not run: ${missing.join(', ')}`];
}

function missingMarkdown(missing: readonly string[]): string[] {
  if (missing.length === 0) return [];
  const names = missing.map((name) => `- ${markdownCode(name)}`);
  return ['Only in the baseline, not run:', '', ...names, ''];
}

function textTotals(report: EvalReportV1): string {
  const { cache, usage, budget } = report;
  const cost = report.costUsd === undefined ? '' : `, cost ${usd(report.costUsd)}`;
  const spent =
    budget === undefined ? '' : `, budget ${usd(budget.maxUsd)} spent ${usd(budget.spentUsd)}`;
  const counts = `${cache.replayed} replayed, ${cache.live} live`;
  return `cache ${cache.mode} (${counts}), tokens in ${usage.inputTokens} out ${usage.outputTokens}${cost}${spent}`;
}

function textReport(
  report: EvalReportV1,
  color: boolean | undefined,
  missing: readonly string[]
): string {
  const paint = painter(color);
  const lines: string[] = [];
  for (const suite of report.suites) lines.push(...textSuite(report, suite, paint), '');
  for (const error of report.errors) lines.push(`${paint('red', 'error')} ${errorLine(error)}`);
  const outcome = paint(report.passed ? 'green' : 'red', report.outcome);
  lines.push(textTotals(report), ...missingText(missing, paint), `outcome: ${outcome}`);
  return `${lines.join('\n')}\n`;
}

function markdownRow(
  report: EvalReportV1,
  suite: EvalSuiteResultV1,
  model: EvalModelResultV1
): string {
  const limit = passRateLimit(suite, model);
  const delta = comparisonOf(report, suite.name, model.ref);
  const threshold = limit === undefined ? '-' : percent(limit);
  const change = delta === undefined ? '-' : signedPoints(delta.passRateDelta);
  const ref = markdownCode(model.ref, true);
  return `| ${ref} | ${passCount(model)} | ${threshold} | ${usd(model.costUsd)} | ${model.latencyMs.p95} ms | ${change} |`;
}

// One bullet per failed assertion or error of a failed case
function markdownFailures(
  suite: EvalSuiteResultV1,
  model: EvalModelResultV1,
  entry: EvalCaseResultV1
): string[] {
  const subject = `${markdownCode(suite.name)}/${markdownCode(model.ref)} ${markdownCode(entry.id)}`;
  return reasons(entry).map(
    (reason) => `- ${subject}: ${markdownCode(reason.id)} ${markdownCode(reason.text)}`
  );
}

function markdownSuite(
  report: EvalReportV1,
  suite: EvalSuiteResultV1
): { lines: string[]; failures: string[]; failedCases: number } {
  const lines = [
    `### ${markdownCode(suite.name)}`,
    '',
    '| Model | Pass rate | Threshold | Cost | p95 | Delta |',
    '| --- | --- | --- | --- | --- | --- |',
  ];
  const failures: string[] = [];
  let failedCases = 0;
  for (const model of suite.models) {
    lines.push(markdownRow(report, suite, model));
    for (const id of comparisonOf(report, suite.name, model.ref)?.regressions ?? []) {
      lines.push(`| regressed | ${markdownCode(id, true)} | | | | |`);
    }
    for (const entry of failedOf(model)) {
      failedCases += 1;
      failures.push(...markdownFailures(suite, model, entry));
    }
  }
  return { lines: [...lines, ''], failures, failedCases };
}

function markdownReport(report: EvalReportV1, missing: readonly string[]): string {
  const lines = [`Eval outcome: **${report.outcome}**`, ''];
  const listed: string[] = [];
  let notListed = 0;
  for (const suite of report.suites) {
    const part = markdownSuite(report, suite);
    lines.push(...part.lines);
    const room = Math.max(0, MAX_LISTED - listed.length);
    listed.push(...part.failures.slice(0, room));
    notListed += Math.max(0, part.failures.length - room);
  }
  if (listed.length > 0) {
    const more = notListed > 0 ? [`- ${notListed} more not listed`] : [];
    lines.push('Failed cases:', '', ...listed, ...more, '');
  }
  for (const error of report.errors) {
    lines.push(`- ${markdownCode(error.code)} ${markdownCode(error.message + where(error))}`);
  }
  if (report.errors.length > 0) lines.push('');
  const { cache } = report;
  lines.push(
    ...missingMarkdown(missing),
    `Cache mode \`${cache.mode}\`: ${cache.replayed} replayed, ${cache.live} live.`
  );
  return `${lines.join('\n')}\n`;
}

function seconds(ms: number): string {
  return String(Math.round(ms) / 1000);
}

function junitCase(classname: string, name: string, time: string, body: string[]): string[] {
  const head = `<testcase classname="${xmlText(classname)}" name="${xmlText(name)}" time="${time}"`;
  if (body.length === 0) return [`    ${head}/>`];
  return [`    ${head}>`, ...body.map((line) => `      ${line}`), '    </testcase>'];
}

function junitFailure(message: string): string {
  return `<failure message="${xmlText(message)}"/>`;
}

function junitError(message: string): string {
  return `<error message="${xmlText(message)}"/>`;
}

function junitSuiteHead(
  name: string,
  counts: { tests: number; failures: number; errors: number },
  time: string
): string {
  const { tests, failures, errors } = counts;
  const attributes = `tests="${tests}" failures="${failures}" errors="${errors}" time="${time}"`;
  return `  <testsuite name="${xmlText(name)}" ${attributes}>`;
}

// The body of a testcase: nothing for a pass, the error, or one failure per failed assertion
function junitBody(entry: EvalCaseResultV1): string[] {
  if (entry.status === 'error') {
    const code = entry.error?.code ?? 'PS6300';
    return [junitError(`${code}: ${entry.error?.message ?? 'error'}`)];
  }
  if (entry.status === 'failed') {
    return reasons(entry).map((reason) => junitFailure(`${reason.id}: ${reason.text}`));
  }
  return [];
}

function limitMessage(limit: EvalThresholdResultV1): string {
  const side = limit.name === 'passRate' ? 'below' : 'above';
  return `${limit.name}: ${limit.actual} is ${side} the limit ${limit.limit}`;
}

function junitModel(suite: EvalSuiteResultV1, model: EvalModelResultV1): string[] {
  const classname = `${suite.name}.${model.ref}`;
  const failures = model.cases.filter((entry) => entry.status === 'failed').length;
  const errors = model.cases.filter((entry) => entry.status === 'error').length;
  const limits = suite.thresholds.filter((entry) => !entry.passed && entry.model === model.ref);
  const total = model.cases.reduce((sum, entry) => sum + entry.latencyMs, 0);
  const counts = {
    tests: model.cases.length + limits.length,
    failures: failures + limits.length,
    errors,
  };
  const lines = [junitSuiteHead(`${suite.name}/${model.ref}`, counts, seconds(total))];
  for (const entry of model.cases) {
    lines.push(...junitCase(classname, entry.id, seconds(entry.latencyMs), junitBody(entry)));
  }
  for (const limit of limits) {
    const body = [junitFailure(limitMessage(limit))];
    lines.push(...junitCase(classname, `threshold ${limit.name}`, '0', body));
  }
  lines.push('  </testsuite>');
  return lines;
}

// Failed limits that belong to no model
function junitSuiteLimits(suite: EvalSuiteResultV1): string[] {
  const wide = suite.thresholds.filter((entry) => !entry.passed && entry.model === undefined);
  if (wide.length === 0) return [];
  const counts = { tests: wide.length, failures: wide.length, errors: 0 };
  const lines = [junitSuiteHead(suite.name, counts, '0')];
  for (const limit of wide) {
    const body = [junitFailure(limitMessage(limit))];
    lines.push(...junitCase(suite.name, `threshold ${limit.name}`, '0', body));
  }
  return [...lines, '  </testsuite>'];
}

// Setup errors and a regression, so a run without cases is not green
function junitProblems(report: EvalReportV1): string[] {
  const errors = report.errors.map((error) => [junitError(errorLine(error))]);
  const regression =
    report.outcome === 'regression' ? [[junitFailure('regression against the baseline')]] : [];
  const problems = [...errors, ...regression];
  if (problems.length === 0) return [];
  const counts = { tests: problems.length, failures: regression.length, errors: errors.length };
  const lines = [junitSuiteHead('eval', counts, '0')];
  for (const [index, body] of problems.entries()) {
    const name = index < errors.length ? `setup ${index + 1}` : 'baseline comparison';
    lines.push(...junitCase('eval', name, '0', body));
  }
  return [...lines, '  </testsuite>'];
}

function junitReport(report: EvalReportV1): string {
  const lines = ['<?xml version="1.0" encoding="UTF-8"?>', '<testsuites>'];
  for (const suite of report.suites) {
    const models = suite.models.flatMap((model) => junitModel(suite, model));
    lines.push(...models, ...junitSuiteLimits(suite));
  }
  lines.push(...junitProblems(report), '</testsuites>');
  return `${lines.join('\n')}\n`;
}

/**
 * File name of the report of one suite in a report directory:
 * `<suite>.<first 12 hex characters of the prompt content hash>.json`.
 *
 * @param suite - The suite result of a one-suite report
 * @returns The file name, no directory
 */
export function reportFileName(suite: EvalSuiteResultV1): string {
  return `${suite.name}.${suite.prompt.contentHash.replace(/^sha256-/, '').slice(0, 12)}.json`;
}

/**
 * Format a report. Every string is normalized first: line breaks fold to a
 * space and control and bidi characters go, in all four formats, on and off a
 * terminal. JSON and Markdown print one document; Markdown shows model text
 * only inside code spans; JUnit is XML 1.0 safe.
 *
 * @param report - The report
 * @param format - `text`, `json`, `markdown` or `junit`
 * @param options - `color` for the text format, `missing` baseline entries
 * @returns The document, ending with a newline
 */
export function formatReport(
  report: EvalReportV1,
  format: EvalReportFormat,
  options: FormatOptions = {}
): string {
  const clean = cleanValue(report);
  switch (format) {
    case 'json':
      return `${JSON.stringify(clean, null, 2)}\n`;
    case 'markdown':
      return markdownReport(clean, cleanValue([...(options.missing ?? [])]));
    case 'junit':
      return junitReport(clean);
    case 'text':
      return textReport(clean, options.color, cleanValue([...(options.missing ?? [])]));
  }
}

function comparisonLine(entry: EvalComparisonEntryV1): string {
  const cost = costDelta(entry.costUsdDelta);
  const latency = signed(entry.latencyP95MsDelta);
  return `${entry.suite} / ${entry.model}   pass ${signedPoints(entry.passRateDelta)}   cost ${cost}   p95 ${latency} ms`;
}

function comparisonDetails(entry: EvalComparisonEntryV1, paint: Paint): string[] {
  const lines: string[] = [];
  if (entry.regressions.length > 0) {
    lines.push(`  ${paint('red', 'regressed')}: ${entry.regressions.join(', ')}`);
  }
  if (entry.fixes.length > 0) lines.push(`  fixed: ${entry.fixes.join(', ')}`);
  if (entry.onlyInBaseline.length > 0) {
    lines.push(`  only in baseline: ${entry.onlyInBaseline.join(', ')}`);
  }
  if (entry.onlyInCandidate.length > 0) {
    lines.push(`  only in candidate: ${entry.onlyInCandidate.join(', ')}`);
  }
  if (entry.datasetChanged)
    lines.push('  dataset changed: only cases in both reports are compared');
  return lines;
}

function comparisonText(
  comparison: EvalComparisonV1,
  color: boolean | undefined,
  missing: readonly string[]
): string {
  const paint = painter(color);
  const lines = comparison.entries.flatMap((entry) => [
    comparisonLine(entry),
    ...comparisonDetails(entry, paint),
  ]);
  const verdict = comparison.regression
    ? paint('red', 'regression')
    : paint('green', 'no regression');
  lines.push(
    ...missingText(missing, paint),
    `tolerance: ${percent(comparison.tolerance)}`,
    `result: ${verdict}`
  );
  return `${lines.join('\n')}\n`;
}

function idList(ids: string[]): string {
  return ids.length === 0 ? '-' : ids.map((id) => markdownCode(id, true)).join(', ');
}

function comparisonRow(entry: EvalComparisonEntryV1): string {
  const names = `${markdownCode(entry.suite, true)} | ${markdownCode(entry.model, true)}`;
  const latency = `${signed(entry.latencyP95MsDelta)} ms`;
  const change = signedPoints(entry.passRateDelta);
  return `| ${names} | ${change} | ${costDelta(entry.costUsdDelta)} | ${latency} | ${idList(entry.regressions)} | ${idList(entry.fixes)} |`;
}

function comparisonMarkdown(comparison: EvalComparisonV1, missing: readonly string[]): string {
  const verdict = comparison.regression ? 'regression' : 'no regression';
  const changed = comparison.entries.some((entry) => entry.datasetChanged);
  const note = changed ? ' A dataset changed; only cases in both reports are compared.' : '';
  const lines = [
    `Eval comparison: **${verdict}**`,
    '',
    '| Suite | Model | Pass rate | Cost | p95 | Regressed | Fixed |',
    '| --- | --- | --- | --- | --- | --- | --- |',
    ...comparison.entries.map(comparisonRow),
    '',
    ...missingMarkdown(missing),
    `Tolerance ${percent(comparison.tolerance)}.${note}`,
  ];
  return `${lines.join('\n')}\n`;
}

/**
 * Format a comparison of two reports. JSON puts the schema URL first.
 *
 * @param comparison - From `compareReports`
 * @param format - `text`, `json` or `markdown`
 * @param options - `color` for the text format, `missing` baseline entries
 * @returns The document, ending with a newline
 */
export function formatComparison(
  comparison: EvalComparisonV1,
  format: EvalComparisonFormat,
  options: FormatOptions = {}
): string {
  const clean = cleanValue(comparison);
  switch (format) {
    case 'json':
      return `${JSON.stringify({ $schema: COMPARISON_SCHEMA, ...clean }, null, 2)}\n`;
    case 'markdown':
      return comparisonMarkdown(clean, cleanValue([...(options.missing ?? [])]));
    case 'text':
      return comparisonText(clean, options.color, cleanValue([...(options.missing ?? [])]));
  }
}

function planModelLine(model: EvalPlan['suites'][number]['models'][number]): string {
  return [
    `  ${model.ref} (${model.provider})`,
    `${model.cases} cases`,
    `hits ${model.hits}`,
    `misses ${model.misses}`,
    `calls ${model.calls}`,
    ...(model.priceSource === undefined ? [] : [`price ${model.priceSource}`]),
    ...(model.worstCaseUsd === undefined ? [] : [`worst case ${usd(model.worstCaseUsd)}`]),
  ].join('   ');
}

/**
 * Format the plan of a dry run as text: per suite and model entry the cases,
 * cache hits and misses, calls, price source and worst-case cost, then the
 * totals and any setup errors. Strings are cleaned like in a report.
 *
 * @param plan - From `planEval`
 * @param options - `color` for the text format
 * @returns The text, ending with a newline
 */
export function formatPlan(plan: EvalPlan, options: FormatOptions = {}): string {
  const paint = painter(options.color);
  const clean = cleanValue(plan);
  const lines = [`Plan, cache ${clean.mode}`];
  for (const suite of clean.suites) {
    lines.push(
      `${suite.name}  ${suite.prompt}  ${suite.rows} rows`,
      ...suite.models.map(planModelLine)
    );
  }
  for (const error of clean.errors) lines.push(`${paint('red', 'error')} ${errorLine(error)}`);
  const worst = clean.worstCaseUsd === undefined ? '' : `, worst case ${usd(clean.worstCaseUsd)}`;
  const budget = clean.budgetUsd === undefined ? '' : `, budget ${usd(clean.budgetUsd)}`;
  lines.push(
    `total: hits ${clean.hits}, misses ${clean.misses}, calls ${clean.calls}${worst}${budget}`,
    'dry run: no provider was called and nothing was written'
  );
  return `${lines.join('\n')}\n`;
}
