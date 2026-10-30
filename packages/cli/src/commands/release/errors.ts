import { PSError } from '@promptscript/core';

/** Releases are not configured, or the configuration is invalid. */
export const PS5001_RELEASE_CONFIG = 'PS5001';
/** The environment is not in `releases.environments`. */
export const PS5002_UNKNOWN_ENVIRONMENT = 'PS5002';
/** A bundle, manifest entry or prompt the command needs does not exist. */
export const PS5003_BUNDLE_MISSING = 'PS5003';
/** A release file does not verify, or a hash is not the fresh compile hash. */
export const PS5004_VERIFICATION_FAILED = 'PS5004';
/** A promotion skips the previous environment. */
export const PS5005_PROMOTION_ORDER = 'PS5005';
/** The Git history a command needs is not there: no earlier label, or no base commit. */
export const PS5006_ROLLBACK_UNAVAILABLE = 'PS5006';
/** Another release command holds the lock. */
export const PS5007_RELEASE_LOCKED = 'PS5007';
/** A compile output path lies inside the release directory. */
export const PS5008_OUTPUT_IN_RELEASE_DIRECTORY = 'PS5008';
/** A promotion would drop a running experiment of the entry. */
export const PS5010_PROMOTE_ON_EXPERIMENT = 'PS5010';

export type ReleaseErrorCode =
  | typeof PS5001_RELEASE_CONFIG
  | typeof PS5002_UNKNOWN_ENVIRONMENT
  | typeof PS5003_BUNDLE_MISSING
  | typeof PS5004_VERIFICATION_FAILED
  | typeof PS5005_PROMOTION_ORDER
  | typeof PS5006_ROLLBACK_UNAVAILABLE
  | typeof PS5007_RELEASE_LOCKED
  | typeof PS5008_OUTPUT_IN_RELEASE_DIRECTORY
  | typeof PS5010_PROMOTE_ON_EXPERIMENT;

/** An error of a `prs release` command. Every message ends with the fix. */
export class ReleaseError extends PSError {
  constructor(code: ReleaseErrorCode, message: string, file?: string, cause?: Error) {
    super(message, code, {
      ...(file === undefined ? {} : { location: { file, line: 1, column: 1 } }),
      ...(cause === undefined ? {} : { cause }),
    });
    this.name = 'ReleaseError';
  }
}
