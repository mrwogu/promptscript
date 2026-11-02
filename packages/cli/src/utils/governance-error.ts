import { PSError } from '@promptscript/core';

// Governance codes take PS5101-PS5110, after the release codes PS5001-PS5008.

/** `governance` is missing or invalid, or the role is not configured. */
export const PS5101_GOVERNANCE_CONFIG = 'PS5101';
/** The approval reference is malformed: prompt id shape, short or bad hash. */
export const PS5102_APPROVAL_REFERENCE = 'PS5102';
/** The hash is neither what the checkout builds nor a release bundle of the prompt. */
export const PS5103_UNKNOWN_HASH = 'PS5103';
/** The approver identity is missing or not a Git host user handle. */
export const PS5104_APPROVER_IDENTITY = 'PS5104';
/** An approval record with the same role, approver and hash exists. Exit code 2. */
export const PS5105_APPROVAL_EXISTS = 'PS5105';
/** The CODEOWNERS file is not managed by prs, or it is managed for another project. Exit code 2. */
export const PS5106_CODEOWNERS_UNMANAGED = 'PS5106';
/** A CODEOWNERS owner value or path is refused. */
export const PS5107_CODEOWNERS_REFUSED = 'PS5107';
/** Git is missing, the project is not in a repository, or a Git call failed. */
export const PS5108_GIT_UNAVAILABLE = 'PS5108';
/**
 * An approval record is invalid or misplaced and never counts (a warning), or the
 * approvals directory holds a link or a name that differs only in case.
 */
export const PS5109_APPROVAL_INVALID = 'PS5109';
/** --max-weight is not a percent from 0.01 to 100 with at most two decimals, or it comes without --env. */
export const PS5110_APPROVAL_CEILING = 'PS5110';

export type GovernanceErrorCode =
  | typeof PS5101_GOVERNANCE_CONFIG
  | typeof PS5102_APPROVAL_REFERENCE
  | typeof PS5103_UNKNOWN_HASH
  | typeof PS5104_APPROVER_IDENTITY
  | typeof PS5105_APPROVAL_EXISTS
  | typeof PS5106_CODEOWNERS_UNMANAGED
  | typeof PS5107_CODEOWNERS_REFUSED
  | typeof PS5108_GIT_UNAVAILABLE
  | typeof PS5109_APPROVAL_INVALID
  | typeof PS5110_APPROVAL_CEILING;

/** An error of a governance command. Every message ends with the fix. */
export class GovernanceError extends PSError {
  constructor(code: GovernanceErrorCode, message: string, file?: string) {
    super(message, code, file === undefined ? {} : { location: { file, line: 1, column: 1 } });
    this.name = 'GovernanceError';
  }
}
