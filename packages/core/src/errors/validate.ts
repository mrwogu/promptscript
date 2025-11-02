import type { SourceLocation } from '../types/source';
import { PSError, ErrorCode } from './base';

/**
 * Severity level for validation issues.
 */
export type Severity = 'error' | 'warning' | 'info';

/**
 * Error during validation phase.
 */
export class ValidationError extends PSError {
  /** Validation rule ID */
  readonly ruleId: string;
  /** Severity level */
  readonly severity: Severity;
  /** Suggestion for fixing */
  readonly suggestion?: string;

  constructor(
    message: string,
    ruleId: string,
    options?: {
      severity?: Severity;
      location?: SourceLocation;
      suggestion?: string;
    }
  ) {
    super(message, `${ErrorCode.VALIDATION_ERROR}_${ruleId}`, {
      location: options?.location,
    });
    this.name = 'ValidationError';
    this.ruleId = ruleId;
    this.severity = options?.severity ?? 'error';
    this.suggestion = options?.suggestion;
  }

  override format(): string {
    let result = super.format();
    if (this.suggestion) {
      result += `\n  suggestion: ${this.suggestion}`;
    }
    return result;
  }
}
