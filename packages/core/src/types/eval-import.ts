import type { EvalFindingV1, EvalInputValue } from './eval.js';

/** Feedback attached to a production sample. There is no free-text field on purpose. */
export interface EvalSampleFeedbackV1 {
  /**
   * Feedback name.
   * @pattern ^[a-z][a-z0-9_.-]{0,63}$
   * @example "user.thumbs"
   */
  name: string;
  /** Score, any finite number */
  score?: number;
  /**
   * Feedback label.
   * @pattern ^[a-z][a-z0-9_-]{0,31}$
   * @example "negative"
   */
  label?: string;
}

/**
 * One production sample, version 1: a line of the JSONL file `prs eval import`
 * reads. The schema is closed: there is no field for a comment, an assignment
 * key, a user, a session or a trace.
 */
export interface EvalSampleV1 {
  /**
   * Prompt id the sample was served from.
   * @minLength 1
   * @maxLength 200
   * @example "acme-support/refund-reply"
   */
  prompt: string;
  /**
   * Content hash of the served prompt: `sha256-` plus 64 lowercase hex characters.
   * @pattern ^sha256-[0-9a-f]{64}$
   */
  contentHash?: string;
  /**
   * Arm of an online experiment, or `control`.
   * @pattern ^(?:control|[a-z][a-z0-9-]{0,31})$
   * @example "warm"
   */
  variant?: string;
  /** Prompt input values by input name; scalars only */
  inputs: Record<string, EvalInputValue>;
  /** Model response text */
  output?: string;
  /** Feedback on the response */
  feedback?: EvalSampleFeedbackV1;
}

/** Counts of the import steps, in the order the steps run. */
export interface EvalImportStepsV1 {
  /** Non-blank lines read */
  read: number;
  /** Lines that passed the sample schema */
  valid: number;
  /** Samples of the suite's prompt */
  forPrompt: number;
  /** Samples left after `--max-score` and `--label` */
  filtered: number;
  /** Samples whose inputs fit the prompt */
  fitted: number;
  /** Samples left after the duplicates are dropped */
  unique: number;
  /** Rows written, or that would be written */
  sampled: number;
}

/** Samples dropped, by reason. */
export interface EvalImportSkippedV1 {
  /** The line is not JSON */
  invalidJson: number;
  /** The line breaks the sample schema or a size limit, before or after the scrub */
  invalidSample: number;
  /** The sample is of another prompt */
  otherPrompt: number;
  /** The feedback score is above `--max-score` or absent */
  filteredScore: number;
  /** The feedback label is not one of `--label` or absent */
  filteredLabel: number;
  /** An input the prompt does not declare */
  undeclaredInput: number;
  /** An input has another type, or a required input is missing */
  inputMismatch: number;
  /** The sample fits the bundle of its hash but not the current prompt, so a run would refuse the row */
  staleContract: number;
  /** A number input has 13 or more digits, so it could be a card number, and it cannot be replaced without changing its type */
  numericPii: number;
  /** A value hides personal data with zero-width characters, fullwidth forms or dots */
  obfuscatedPii: number;
  /** Same scrubbed inputs as an earlier sample */
  duplicate: number;
  /** Left out by sampling down to `--max-rows` */
  sampledOut: number;
}

/** Values replaced by the scrub, by kind. */
export interface EvalImportReplacementsV1 {
  email: number;
  card: number;
  iban: number;
  /** Inputs replaced by `--redact-input` */
  redacted: number;
}

/** Summary of `prs eval import --format json`: counts only, never sample values. */
export interface EvalImportSummaryV1 {
  /** Schema URL, the version tag of the summary */
  $schema: 'https://getpromptscript.dev/schema/eval-import-summary/v1.json';
  /** Suite name */
  suite: string;
  /** Prompt id of the suite */
  prompt: string;
  /** Dataset path, relative to the project root */
  out: string;
  /** True when nothing was written because of `--dry-run` */
  dryRun: boolean;
  /** True when the dataset file was written */
  written: boolean;
  /** Counts per step */
  steps: EvalImportStepsV1;
  /** Samples dropped, by reason */
  skipped: EvalImportSkippedV1;
  /** Values replaced, by kind */
  replacements: EvalImportReplacementsV1;
  /** Findings of the dataset security scan; they do not stop the import */
  findings: EvalFindingV1[];
  /** Warnings, such as a sample file under the project root */
  warnings: string[];
}
