/** Where a diagnostic points. The file path is as the compiler reports it, usually absolute. */
export interface ValidateLocationV1 {
  /** Path of the file */
  file?: string;
  /**
   * Line number. Some parse errors have no position and report -1.
   * @asType integer
   * @minimum -1
   */
  line?: number;
  /**
   * Column number. Some parse errors have no position and report -1.
   * @asType integer
   * @minimum -1
   */
  column?: number;
  /**
   * Offset from the start of the file, set on some warnings.
   * @asType integer
   * @minimum 0
   */
  offset?: number;
}

/** One error of `prs validate`. */
export interface ValidateErrorV1 {
  /**
   * Error code, such as `PS2000`. Absent when the run stops before the compile with an error
   * that has no PS code, for example a missing entry file or a registry clone failure.
   * @pattern ^PS[0-9]{3,4}$
   */
  code?: string;
  /** Error message */
  message: string;
  /** Where the error is, when the compiler knows */
  location?: ValidateLocationV1;
}

/** One warning of `prs validate`. With `--strict` a warning fails the run. */
export interface ValidateWarningV1 {
  /**
   * Validator rule id
   * @example "PS008"
   */
  ruleId: string;
  /** Warning message */
  message: string;
  /** Suggested fix */
  suggestion?: string;
  /** Where the warning is */
  location?: ValidateLocationV1;
}

/** Counts of errors and warnings in a validate report. */
export interface ValidateSummaryV1 {
  /**
   * Number of errors
   * @asType integer
   * @minimum 0
   */
  errorCount: number;
  /**
   * Number of warnings
   * @asType integer
   * @minimum 0
   */
  warningCount: number;
}

/** Report of `prs validate --format json`, version 1. */
export interface ValidateReportV1 {
  /** Schema URL, the version tag of the report */
  $schema: 'https://getpromptscript.dev/schema/validate-report/v1.json';
  /** Major version of the report format, always 1 */
  version: 1;
  /** False when there are errors, or warnings under `--strict` */
  success: boolean;
  /** Errors of all validated files, in file order */
  errors: ValidateErrorV1[];
  /** Warnings of all validated files, in file order */
  warnings: ValidateWarningV1[];
  /** Counts of errors and warnings */
  summary: ValidateSummaryV1;
}
