import { PSError, type EvalFindingSeverity, type SourceLocation } from '@promptscript/core';

/**
 * Codes of eval errors and findings: `PS61xx` datasets, `PS62xx` suites,
 * `PS63xx` providers and the run, `PS64xx` cache, `PS65xx` cost, `PS66xx` judge,
 * `PS67xx` reports and sample imports.
 */
export const EVAL_CODES = {
  /** Dataset file cannot be read or parsed, or a row has the wrong shape */
  DATASET_INVALID: 'PS6101',
  /** Dataset breaks a size or row limit */
  DATASET_LIMIT: 'PS6102',
  /** Row id is malformed or used twice */
  ROW_ID: 'PS6103',
  /** Row does not fit the prompt contract, or uses a key that is not allowed */
  ROW_CONTRACT: 'PS6104',
  /** An equals assertion has no value and the row has no expected value for it */
  ROW_NO_EXPECTED: 'PS6105',
  /** Dataset has no rows */
  DATASET_EMPTY: 'PS6106',
  /** A validator rule reports an error in a dataset value */
  SCAN_ERROR: 'PS6110',
  /** A validator rule reports a warning in a dataset value */
  SCAN_WARNING: 'PS6111',
  /** A dataset value holds an email address */
  PII_EMAIL: 'PS6112',
  /** A dataset value holds a payment card number */
  PII_CARD: 'PS6113',
  /** A dataset value holds an IBAN */
  PII_IBAN: 'PS6114',
  /** Suite file cannot be read, parsed or has the wrong structure */
  SUITE_INVALID: 'PS6200',
  /** Two suite files have the same name */
  SUITE_DUPLICATE: 'PS6201',
  /** A path is absolute or leaves the project */
  PATH_REFUSED: 'PS6202',
  /** The prompt under test is not compiled by the project */
  UNKNOWN_PROMPT: 'PS6203',
  /** An assertion reads a field the output contract does not declare */
  UNKNOWN_FIELD: 'PS6204',
  /** A json-schema assertion has no usable schema */
  NO_SCHEMA: 'PS6205',
  /** A model reference does not resolve, is retired or deprecated */
  MODEL_REF: 'PS6206',
  /** A regex assertion repeats a group that holds a quantifier */
  REGEX_RISK: 'PS6210',
  /** A dataset allow entry without a deterministic assertion */
  ALLOW_WITHOUT_ASSERTION: 'PS6213',
  /** An assertion could not run on a case */
  ASSERTION_ERROR: 'PS6214',
  /** A provider call failed */
  PROVIDER_FAILED: 'PS6300',
  /** A model's provider has no entry in `eval.providers` and no built-in default */
  PROVIDER_UNCONFIGURED: 'PS6301',
  /** A provider URL is refused, or a provider answered with a redirect */
  URL_REFUSED: 'PS6302',
  /** `eval.providers` holds a key that is not allowed, such as `apiKey` */
  CONFIG_KEY_REFUSED: 'PS6303',
  /** A provider refused the request with a 4xx status */
  PROVIDER_REJECTED: 'PS6304',
  /** A provider response body is larger than the cap */
  RESPONSE_TOO_LARGE: 'PS6305',
  /** The environment variable of a provider key is not set */
  KEY_MISSING: 'PS6306',
  /** The value of a provider key appears in the eval config */
  KEY_IN_CONFIG: 'PS6307',
  /** The run stopped before the case ran */
  RUN_STOPPED: 'PS6308',
  /** A run option is out of range, such as a concurrency that is not a positive integer */
  RUN_OPTION_INVALID: 'PS6309',
  /** The project config cannot be loaded, or the project does not compile */
  PROJECT_INVALID: 'PS6310',
  /** A cache entry is unreadable or does not match its key; it counts as a miss */
  CACHE_ENTRY_INVALID: 'PS6401',
  /** Replay found no cache entry for a call */
  CACHE_MISS: 'PS6402',
  /** The cache tree holds something that is not a plain directory or file */
  CACHE_TREE_INVALID: 'PS6403',
  /** The cache could not be read or written, such as a full disk or a denied directory */
  CACHE_IO_FAILED: 'PS6404',
  /** A cache entry is over the 1 MiB read cap, so it is not written */
  CACHE_ENTRY_TOO_LARGE: 'PS6405',
  /** A cost threshold needs a price the catalog does not have */
  PRICING_MISSING: 'PS6501',
  /** A provider response has no valid token counts */
  USAGE_INVALID: 'PS6502',
  /** The budget does not cover the planned or the next call */
  BUDGET_EXCEEDED: 'PS6503',
  /** A live cache mode runs without a budget */
  BUDGET_REQUIRED: 'PS6504',
  /** A project price is lower than the built-in price of the same model */
  PRICE_LOWERED: 'PS6505',
  /** The suite has an llm-judge assertion, which this version cannot run */
  JUDGE_UNSUPPORTED: 'PS6600',
  /** A report file cannot be read or is not an eval report of this version */
  REPORT_INVALID: 'PS6701',
  /** A report directory or file cannot be written */
  REPORT_WRITE_FAILED: 'PS6702',
  /** A sample file cannot be read, or has a shape the import cannot use */
  SAMPLE_INVALID: 'PS6711',
  /** A sample file has more lines than the import reads */
  SAMPLE_LIMIT: 'PS6712',
  /** The import output path exists or is refused */
  IMPORT_OUT_REFUSED: 'PS6713',
  /** The scrub left personal data in a value */
  SCRUB_LEFT_PII: 'PS6714',
  /** No sample matched the suite */
  NO_SAMPLE_MATCHED: 'PS6715',
  /** The sample file is tracked by Git */
  SAMPLE_TRACKED: 'PS6716',
} as const;

/** One eval code. */
export type EvalCode = (typeof EVAL_CODES)[keyof typeof EVAL_CODES];

/** A problem found while loading or checking suites and datasets. */
export interface EvalFinding {
  /** Eval code */
  code: EvalCode;
  /** Errors stop a run before any call */
  severity: EvalFindingSeverity;
  /** What is wrong and what to do; names keys and ids, never dataset values */
  message: string;
  /** File the finding is about, relative to the project root */
  file?: string;
  /** Line in the file */
  line?: number;
}

/** Base of every error the eval package throws. */
export class EvalError extends PSError {
  constructor(message: string, code: EvalCode, options?: { location?: SourceLocation }) {
    super(message, code, options);
    this.name = 'EvalError';
  }
}

/** A dataset file cannot be read or breaks a rule. */
export class EvalDatasetError extends EvalError {
  constructor(message: string, code: EvalCode, options?: { location?: SourceLocation }) {
    super(message, code, options);
    this.name = 'EvalDatasetError';
  }
}

/** A provider call failed. */
export class EvalProviderError extends EvalError {
  /** HTTP status of the failed call, when the provider answered */
  readonly status?: number;
  /** Delay the provider asked for in `retry-after`, in milliseconds */
  readonly retryAfterMs?: number;

  constructor(
    message: string,
    code: EvalCode,
    details: { status?: number; retryAfterMs?: number } = {}
  ) {
    super(message, code);
    this.name = 'EvalProviderError';
    this.status = details.status;
    this.retryAfterMs = details.retryAfterMs;
  }
}
