import { PSError, type EvalFindingSeverity, type SourceLocation } from '@promptscript/core';

/**
 * Codes of eval errors and findings: `PS61xx` datasets, `PS62xx` suites,
 * `PS63xx` providers, `PS65xx` cost.
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
  /** A provider call failed */
  PROVIDER_FAILED: 'PS6300',
  /** A cost threshold needs a price the catalog does not have */
  PRICING_MISSING: 'PS6501',
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
  constructor(message: string, code: EvalCode) {
    super(message, code);
    this.name = 'EvalProviderError';
  }
}
