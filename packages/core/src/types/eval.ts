import type { ModelParams } from './prompts.js';

/** Scalar value of an eval case input. */
export type EvalInputValue = string | number | boolean;

/** Expected value of one output property: a scalar or a list of strings. */
export type EvalExpectedValue = EvalInputValue | string[];

/**
 * One row of an eval dataset, version 1: a JSONL line, a YAML item or a
 * CSV row.
 */
export interface EvalDatasetRowV1 {
  /**
   * Row id, unique in the dataset. Absent ids default to `row-<n>`,
   * counted from 1 in file order.
   * @pattern ^[A-Za-z0-9][A-Za-z0-9_.-]{0,63}$
   * @example "late-delivery"
   */
  id?: string;
  /** Prompt input values by input name */
  inputs: Record<string, EvalInputValue>;
  /**
   * Golden answer: the whole response text, or the expected output
   * properties when the prompt has an output contract. A partial object
   * is allowed.
   */
  expected?: string | Record<string, EvalExpectedValue>;
  /** Free-form tags, for filtering and reporting */
  tags?: string[];
}

/** A dataset scan rule the suite owner expects to fire, with the reason. */
export interface EvalDatasetAllow {
  /**
   * Validator rule id whose findings are expected in the dataset.
   * @pattern ^PS\d{3,4}$
   * @example "PS005"
   */
  rule: string;
  /**
   * Why the content is expected; copied into the report.
   * @minLength 1
   * @maxLength 500
   */
  reason: string;
}

/** Decision that the dataset may hold personal data, with the reason. */
export interface EvalDatasetAllowPii {
  /**
   * Why personal data is expected; copied into the report.
   * @minLength 1
   * @maxLength 500
   */
  reason: string;
}

/** Dataset reference of a suite with review decisions. */
export interface EvalDatasetRef {
  /**
   * Dataset file, relative to the suite file.
   * @example "datasets/refund-reply.jsonl"
   */
  path: string;
  /** Scan rules whose findings are expected in this dataset */
  allow?: EvalDatasetAllow[];
  /** Personal data is expected in this dataset */
  allowPii?: EvalDatasetAllowPii;
}

/** One model a suite runs, with parameters merged over the prompt's own. */
export interface EvalModelEntry {
  /**
   * Model reference: profile id, alias or API id.
   * @example "gpt-5.1"
   */
  ref: string;
  /** Parameters that override the prompt's parameters for this entry only */
  params?: ModelParams;
}

/** Number of judge runs per case; the majority verdict counts. */
export type EvalJudgeRuns = 1 | 3 | 5;

/** Judge settings shared by the suite's llm-judge assertions. */
export interface EvalJudgeConfig {
  /** Model reference the judge runs on */
  model?: string;
  /** Judge runs per case; default 3 */
  runs?: EvalJudgeRuns;
}

/** Kind of an eval assertion. */
export type EvalAssertionKind = 'equals' | 'contains' | 'regex' | 'json-schema' | 'llm-judge';

export interface EvalAssertionBase {
  /**
   * Assertion id, unique in the suite.
   * @pattern ^[A-Za-z0-9][A-Za-z0-9_.-]{0,63}$
   * @example "decision-matches"
   */
  id: string;
  /** Output property the assertion reads; absent means the whole response text */
  field?: string;
}

/** Passes when the target equals `value`, else the row's expected value. */
export interface EvalEqualsAssertion extends EvalAssertionBase {
  kind: 'equals';
  /** Inverts the result */
  negate?: boolean;
  /** Value to compare with; absent means the row's expected value */
  value?: string;
  /** Compare case-insensitively */
  ignoreCase?: boolean;
  /** Trim both sides before comparing; default true */
  trim?: boolean;
}

/** Passes when the target contains the values. */
export interface EvalContainsAssertion extends EvalAssertionBase {
  kind: 'contains';
  /** Inverts the result */
  negate?: boolean;
  /**
   * Substrings to look for.
   * @minItems 1
   * @maxItems 20
   */
  values: string[];
  /** Whether every value or any value must appear; default all */
  mode?: 'all' | 'any';
  /** Compare case-insensitively */
  ignoreCase?: boolean;
}

/** Passes when the pattern matches the target. */
export interface EvalRegexAssertion extends EvalAssertionBase {
  kind: 'regex';
  /** Inverts the result */
  negate?: boolean;
  /**
   * Regular expression source.
   * @example "\\bguarantee(d)?\\b"
   */
  pattern: string;
  /**
   * Regular expression flags, any of `i`, `m`, `s` and `u`, each at most once.
   * @pattern ^(?!.*(.).*\1)[imsu]{0,4}$
   */
  flags?: string;
}

/** Passes when the parsed response matches a JSON Schema. */
export interface EvalJsonSchemaAssertion extends EvalAssertionBase {
  kind: 'json-schema';
  /** Inline JSON Schema; absent means the prompt's output contract */
  schema?: Record<string, unknown>;
}

/**
 * Passes when the majority of judge runs say pass. The rubric receives
 * the inputs `response`, `case_inputs`, `expected`, `criteria` and the
 * reserved `boundary`.
 */
export interface EvalLlmJudgeAssertion extends EvalAssertionBase {
  kind: 'llm-judge';
  /**
   * Prompt id of the rubric.
   * @example "acme-support/judge-polite-reply"
   */
  rubric: string;
  /** Extra criteria passed to the rubric as its `criteria` input */
  criteria?: string;
  /** Model reference the judge runs on; absent means the suite judge, then the rubric's own model */
  model?: string;
  /** Judge runs per case; absent means the suite judge setting */
  runs?: EvalJudgeRuns;
}

/** One assertion of a suite, by kind. */
export type EvalAssertion =
  | EvalEqualsAssertion
  | EvalContainsAssertion
  | EvalRegexAssertion
  | EvalJsonSchemaAssertion
  | EvalLlmJudgeAssertion;

/** Latency limits over the recorded latencies of a run. */
export interface EvalLatencyThresholds {
  /**
   * Median latency limit in milliseconds.
   * @asType integer
   * @minimum 1
   */
  p50?: number;
  /**
   * 95th percentile latency limit in milliseconds.
   * @asType integer
   * @minimum 1
   */
  p95?: number;
}

/** Limits a run must meet for the suite to pass. */
export interface EvalThresholds {
  /**
   * Minimum share of passed cases per model entry, 0 to 1; default 1.
   * @minimum 0
   * @maximum 1
   */
  passRate?: number;
  /**
   * Cost limit of the whole suite run in USD.
   * @minimum 0
   */
  maxCostUsd?: number;
  /**
   * Cost limit of one case in USD.
   * @minimum 0
   */
  maxCostPerCaseUsd?: number;
  /** Latency limits */
  latencyMs?: EvalLatencyThresholds;
}

/** An eval suite file, version 1. */
export interface EvalSuiteV1 {
  /**
   * Schema URL, the version tag of the suite.
   * @example "https://getpromptscript.dev/schema/eval-suite/v1.json"
   */
  $schema?: 'https://getpromptscript.dev/schema/eval-suite/v1.json';
  /**
   * Prompt id under test.
   * @example "acme-support/refund-reply"
   */
  prompt: string;
  /** Dataset file relative to the suite file, or a reference with review decisions */
  dataset: string | EvalDatasetRef;
  /**
   * Human label file, relative to the suite file.
   * @example "labels/refund-reply.jsonl"
   */
  labels?: string;
  /**
   * Models to run the whole dataset on; absent means the prompt's own model.
   * @minItems 1
   * @maxItems 8
   */
  models?: Array<string | EvalModelEntry>;
  /** Judge settings shared by the llm-judge assertions */
  judge?: EvalJudgeConfig;
  /**
   * Assertions every case must pass.
   * @minItems 1
   * @maxItems 20
   */
  assertions: EvalAssertion[];
  /** Limits the run must meet */
  thresholds?: EvalThresholds;
}

/** Verdict of a judge run or a human label. */
export type EvalVerdict = 'pass' | 'fail';

/** One human label of a judged case, version 1. */
export interface EvalLabelRowV1 {
  /**
   * Dataset row id the label is for.
   * @pattern ^[A-Za-z0-9][A-Za-z0-9_.-]{0,63}$
   */
  id: string;
  /**
   * Id of the llm-judge assertion the label is for.
   * @pattern ^[A-Za-z0-9][A-Za-z0-9_.-]{0,63}$
   */
  assertion: string;
  /** Human verdict */
  verdict: EvalVerdict;
  /** Reviewer note */
  note?: string;
}

/** The request a cache entry answers; the cache key is derived from it. */
export interface EvalCacheRequestV1 {
  /**
   * Content hash of the prompt bundle, or of the rubric for a judge call.
   * @pattern ^sha256-[0-9a-f]{64}$
   */
  contentHash: string;
  /**
   * Hash of the canonical JSON of the case inputs after validation and
   * defaults. For a judge call it is the hash of the rubric inputs without
   * `boundary`.
   * @pattern ^sha256-[0-9a-f]{64}$
   */
  inputsHash: string;
  /**
   * Model reference as written in the suite or the prompt.
   * @example "claude-sonnet-5-5"
   */
  modelRef: string;
  /**
   * Provider name.
   * @example "anthropic"
   */
  provider: string;
  /**
   * Provider API model identifier.
   * @example "claude-sonnet-5-5"
   */
  apiId: string;
  /** Effective parameters of the call, the output token cap included */
  params: ModelParams;
  /**
   * Sample index: 0 for the case call, the run index for judge calls.
   * @asType integer
   * @minimum 0
   */
  sample: number;
}

/**
 * Cache key: the SHA-256 of the canonical JSON of a cache request, 64
 * lowercase hex characters.
 * @pattern ^[0-9a-f]{64}$
 */
export type EvalCacheKey = string; // NOSONAR - the alias carries the key pattern into the schemas

/** Token counts of one or more model calls. */
export interface EvalTokenUsageV1 {
  /**
   * Input tokens.
   * @asType integer
   * @minimum 0
   */
  inputTokens: number;
  /**
   * Output tokens.
   * @asType integer
   * @minimum 0
   */
  outputTokens: number;
}

/** The recorded response of a cache entry. */
export interface EvalCacheResponseV1 {
  /** Response text */
  text: string;
  /** Token usage the provider reported */
  usage: EvalTokenUsageV1;
  /**
   * Call latency in milliseconds.
   * @asType integer
   * @minimum 0
   */
  latencyMs: number;
  /**
   * HTTP status of the call.
   * @asType integer
   * @minimum 100
   * @maximum 599
   */
  status: number;
  /** Provider stop reason, when reported */
  stopReason?: string;
}

/**
 * One recorded model call of the eval cache, version 1. The file name is
 * the key, and the key is the SHA-256 of the canonical JSON of `request`.
 */
export interface EvalCacheEntryV1 {
  /**
   * Schema URL, the version tag of the entry.
   * @example "https://getpromptscript.dev/schema/eval-cache-entry/v1.json"
   */
  $schema: 'https://getpromptscript.dev/schema/eval-cache-entry/v1.json';
  /** Cache key */
  key: EvalCacheKey;
  /** The request the entry answers */
  request: EvalCacheRequestV1;
  /** The recorded response */
  response: EvalCacheResponseV1;
}

/** How a run uses the cache. */
export type EvalCacheMode = 'replay' | 'record' | 'refresh' | 'off';

/** Outcome of a run. */
export type EvalOutcome = 'passed' | 'failed' | 'regression' | 'budget-exceeded' | 'error';

/** Status of one case. */
export type EvalCaseStatus = 'passed' | 'failed' | 'error';

/** Calls and tokens of a run, a model entry or a case. */
export interface EvalUsageV1 extends EvalTokenUsageV1 {
  /**
   * Model calls, cache hits included.
   * @asType integer
   * @minimum 0
   */
  calls: number;
}

/** How many calls came from the cache and how many went to a provider. */
export interface EvalCacheUseV1 {
  /**
   * Calls answered from the cache.
   * @asType integer
   * @minimum 0
   */
  replayed: number;
  /**
   * Calls made to a provider.
   * @asType integer
   * @minimum 0
   */
  live: number;
}

/** Cache summary of a run. */
export interface EvalReportCacheV1 extends EvalCacheUseV1 {
  /** Cache mode of the run */
  mode: EvalCacheMode;
  /**
   * Digest of the consumed cache entries. Take the unique keys of every
   * case's `cacheKeys`, sorted ascending; for each key the lowercase hex
   * SHA-256 of its entry file bytes; join those with `\n` and take the
   * SHA-256 of the result. An empty set gives the SHA-256 of the empty
   * string.
   * @pattern ^sha256-[0-9a-f]{64}$
   */
  digest: string;
}

/** Budget of a run. */
export interface EvalBudgetV1 {
  /**
   * Spending limit in USD.
   * @minimum 0
   */
  maxUsd: number;
  /**
   * Amount spent in USD.
   * @minimum 0
   */
  spentUsd: number;
}

/** An error of a run that is not tied to one case. */
export interface EvalReportErrorV1 {
  /**
   * Error code.
   * @pattern ^PS\d{3,4}$
   * @example "PS6202"
   */
  code: string;
  /** What went wrong and what to do */
  message: string;
  /** File the error is about, relative to the project root */
  file?: string;
  /**
   * Line in the file.
   * @asType integer
   * @minimum 1
   */
  line?: number;
}

/** Judge runs behind one llm-judge assertion result. */
export interface EvalJudgeResultV1 {
  /** Verdict of each run, in run order */
  verdicts: EvalVerdict[];
  /**
   * Runs made.
   * @asType integer
   * @minimum 1
   */
  runs: number;
  /**
   * Cost of the judge runs in USD.
   * @minimum 0
   */
  costUsd?: number;
}

/** Result of one assertion on one case. */
export interface EvalAssertionResultV1 {
  /** Assertion id */
  id: string;
  /** Assertion kind */
  kind: EvalAssertionKind;
  /** Whether the assertion passed */
  passed: boolean;
  /**
   * Why it failed, with at most 80 characters of the actual value.
   * @maxLength 160
   */
  reason?: string;
  /** Judge runs, for llm-judge assertions */
  judge?: EvalJudgeResultV1;
}

/** Error that stopped one case. */
export interface EvalCaseErrorV1 {
  /**
   * Error code.
   * @pattern ^PS\d{3,4}$
   */
  code: string;
  /** What went wrong and what to do */
  message: string;
}

/** Result of one case on one model entry. */
export interface EvalCaseResultV1 {
  /** Dataset row id */
  id: string;
  /** Row tags */
  tags?: string[];
  /** Case status */
  status: EvalCaseStatus;
  /** Assertion results in suite order */
  assertions: EvalAssertionResultV1[];
  /** Calls and tokens of the case, judge runs included */
  usage: EvalUsageV1;
  /**
   * Cost of the case in USD.
   * @minimum 0
   */
  costUsd?: number;
  /**
   * Latency of the case call in milliseconds.
   * @asType integer
   * @minimum 0
   */
  latencyMs: number;
  /** Cache use of the case */
  cache: EvalCacheUseV1;
  /** Cache keys of every call or hit the case consumed, judge runs included, in call order */
  cacheKeys: EvalCacheKey[];
  /** Error that stopped the case */
  error?: EvalCaseErrorV1;
}

/** Latency percentiles over the recorded latencies, nearest rank. */
export interface EvalLatencyV1 {
  /**
   * Median latency in milliseconds.
   * @asType integer
   * @minimum 0
   */
  p50: number;
  /**
   * 95th percentile latency in milliseconds.
   * @asType integer
   * @minimum 0
   */
  p95: number;
}

/** Agreement between a judge assertion and the human labels. */
export interface EvalJudgeAgreementV1 {
  /** Judge assertion id */
  assertion: string;
  /**
   * Cases with a human label.
   * @asType integer
   * @minimum 0
   */
  labelled: number;
  /**
   * Labelled cases where the judge agreed with the label.
   * @asType integer
   * @minimum 0
   */
  agreed: number;
}

/** Result of one model entry of a suite. */
export interface EvalModelResultV1 {
  /** Model reference as written */
  ref: string;
  /** Provider name */
  provider: string;
  /** Provider API model identifier */
  apiId: string;
  /**
   * Passed cases over all cases.
   * @minimum 0
   * @maximum 1
   */
  passRate: number;
  /** Calls and tokens of the entry */
  usage: EvalUsageV1;
  /**
   * Cost of the entry in USD.
   * @minimum 0
   */
  costUsd?: number;
  /** Latency percentiles of the entry */
  latencyMs: EvalLatencyV1;
  /** Agreement with human labels per judge assertion, in assertion order */
  judgeAgreement?: EvalJudgeAgreementV1[];
  /** Case results sorted by id */
  cases: EvalCaseResultV1[];
}

/** Name of a suite threshold. */
export type EvalThresholdName =
  'passRate' | 'maxCostUsd' | 'maxCostPerCaseUsd' | 'latencyMs.p50' | 'latencyMs.p95';

/** One threshold check of a suite. */
export interface EvalThresholdResultV1 {
  /** Threshold name */
  name: EvalThresholdName;
  /** Model entry the check applies to; absent for a suite-wide limit */
  model?: string;
  /** Limit from the suite */
  limit: number;
  /** Value of the run */
  actual: number;
  /** Whether the limit held */
  passed: boolean;
}

/** Severity of a dataset finding. */
export type EvalFindingSeverity = 'error' | 'warning';

/** One finding of the dataset scan. */
export interface EvalFindingV1 {
  /**
   * Eval code of the finding.
   * @pattern ^PS\d{3,4}$
   * @example "PS6110"
   */
  code: string;
  /**
   * Validator rule that fired, for a scan finding.
   * @pattern ^PS\d{3,4}$
   * @example "PS005"
   */
  rule?: string;
  /**
   * Validator rule name, for a scan finding.
   * @example "blocked-patterns"
   */
  ruleName?: string;
  /** Severity after any downgrade */
  severity: EvalFindingSeverity;
  /** Dataset row id */
  rowId?: string;
  /**
   * JSON path of the value inside the row.
   * @example "inputs.message"
   */
  path?: string;
  /**
   * Line of the row in the dataset file.
   * @asType integer
   * @minimum 1
   */
  line?: number;
  /** Reason from the suite's allow entry when the finding was downgraded */
  allowedBecause?: string;
}

/** Prompt under test as the run saw it. */
export interface EvalPromptRefV1 {
  /** Prompt id */
  id: string;
  /**
   * Content hash of the bundle.
   * @pattern ^sha256-[0-9a-f]{64}$
   */
  contentHash: string;
}

/** A judge rubric the run used. */
export interface EvalJudgeRefV1 {
  /** Rubric prompt id */
  rubric: string;
  /**
   * Content hash of the rubric bundle.
   * @pattern ^sha256-[0-9a-f]{64}$
   */
  contentHash: string;
}

/** Dataset as the run saw it. */
export interface EvalDatasetRefV1 {
  /** Dataset file, relative to the project root */
  path: string;
  /**
   * Rows read.
   * @asType integer
   * @minimum 0
   */
  rows: number;
  /**
   * SHA-256 of the dataset file bytes.
   * @pattern ^sha256-[0-9a-f]{64}$
   */
  hash: string;
}

/** Result of one suite. */
export interface EvalSuiteResultV1 {
  /** Suite name */
  name: string;
  /**
   * SHA-256 of the suite file bytes.
   * @pattern ^sha256-[0-9a-f]{64}$
   */
  suiteHash: string;
  /** Prompt under test */
  prompt: EvalPromptRefV1;
  /** Dataset the suite ran on */
  dataset: EvalDatasetRefV1;
  /** Judge rubrics the suite used, sorted by rubric id */
  judges?: EvalJudgeRefV1[];
  /** Whether every threshold held */
  passed: boolean;
  /** Threshold checks */
  thresholds: EvalThresholdResultV1[];
  /** Dataset findings */
  findings: EvalFindingV1[];
  /** Model entries in suite order */
  models: EvalModelResultV1[];
}

/** Comparison of one suite and model entry between two reports. */
export interface EvalComparisonEntryV1 {
  /** Suite name */
  suite: string;
  /** Model reference */
  model: string;
  /** Candidate pass rate minus baseline pass rate */
  passRateDelta: number;
  /** Candidate cost minus baseline cost in USD, when both reports carry a cost */
  costUsdDelta?: number;
  /** Candidate p95 latency minus baseline p95 latency in milliseconds */
  latencyP95MsDelta: number;
  /** Cases that passed in the baseline and not in the candidate */
  regressions: string[];
  /** Cases that passed in the candidate and not in the baseline */
  fixes: string[];
  /** Case ids only the baseline has */
  onlyInBaseline: string[];
  /** Case ids only the candidate has */
  onlyInCandidate: string[];
  /** Whether the dataset hashes differ */
  datasetChanged: boolean;
}

/**
 * Comparison of a candidate report against a baseline, version 1: the
 * JSON output of a standalone compare, or `comparison` inside a report.
 */
export interface EvalComparisonV1 {
  /**
   * Schema URL, the version tag of a standalone comparison; absent inside
   * a report.
   * @example "https://getpromptscript.dev/schema/eval-comparison/v1.json"
   */
  $schema?: 'https://getpromptscript.dev/schema/eval-comparison/v1.json';
  /**
   * Format version, 1 in standalone comparisons this CLI writes. Absent
   * inside a report and in comparisons from older versions; read a missing
   * value as 1.
   */
  version?: 1;
  /**
   * Pass-rate drop that counts as a regression.
   * @minimum 0
   * @maximum 1
   */
  tolerance: number;
  /** Whether any case regressed or a pass rate dropped beyond the tolerance */
  regression: boolean;
  /** Entries sorted by suite name, then model order */
  entries: EvalComparisonEntryV1[];
}

/**
 * Report of one eval run, version 1. Deterministic: no timestamps, no
 * wall-clock durations, no absolute paths, arrays sorted by suite name,
 * model order and case id.
 */
export interface EvalReportV1 {
  /**
   * Schema URL, the version tag of the report.
   * @example "https://getpromptscript.dev/schema/eval-report/v1.json"
   */
  $schema: 'https://getpromptscript.dev/schema/eval-report/v1.json';
  /**
   * Format version, always 1 in reports this CLI writes. Older reports lack
   * it; read a missing value as 1.
   */
  version?: 1;
  /** Outcome of the run */
  outcome: EvalOutcome;
  /** Whether every suite passed and nothing else went wrong */
  passed: boolean;
  /** Cache summary */
  cache: EvalReportCacheV1;
  /** Calls and tokens of the run */
  usage: EvalUsageV1;
  /**
   * Cost of the run in USD, when every model used has a price.
   * @minimum 0
   */
  costUsd?: number;
  /** Budget of the run, when one applied */
  budget?: EvalBudgetV1;
  /** Suite results sorted by name */
  suites: EvalSuiteResultV1[];
  /** Comparison against a baseline report */
  comparison?: EvalComparisonV1;
  /** Errors not tied to one case */
  errors: EvalReportErrorV1[];
}
