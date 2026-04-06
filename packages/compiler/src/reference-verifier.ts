import type { Lockfile } from '@promptscript/core';
import { ResolveError, ErrorCode } from '@promptscript/core';
import { hashContent, buildReferenceKey } from '@promptscript/resolver';

/**
 * Parameters for reference integrity verification.
 */
export interface VerifyReferenceOptions {
  /** Raw file content (already read into memory) */
  content: Buffer;
  /** Repository URL */
  repoUrl: string;
  /** Relative path within the repository */
  relativePath: string;
  /** Version tag */
  version: string;
  /** Lockfile (may be undefined if not present) */
  lockfile: Lockfile | undefined;
}

/**
 * Verify that a registry reference file's content matches the lockfile hash.
 *
 * @throws Error if hash mismatches or entry is missing (when lockfile has references section)
 */
export function verifyReferenceIntegrity(options: VerifyReferenceOptions): void {
  const { content, repoUrl, relativePath, version, lockfile } = options;

  // No lockfile or no references section — skip (backward compat)
  if (!lockfile || !lockfile.references) {
    return;
  }

  const key = buildReferenceKey(repoUrl, relativePath, version);
  const entry = lockfile.references[key];

  if (!entry) {
    throw new ResolveError(
      `Reference file "${relativePath}" has no integrity hash in lockfile. ` +
        `Run \`prs lock\` to generate integrity hashes for registry references.`,
      undefined,
      ErrorCode.LOCKFILE_INTEGRITY
    );
  }

  const actualHash = hashContent(content);
  if (actualHash !== entry.hash) {
    throw new ResolveError(
      `Reference file hash mismatch: ${relativePath} has changed since last lock. ` +
        `Run \`prs lock --update\` to accept changes.`,
      undefined,
      ErrorCode.LOCKFILE_INTEGRITY
    );
  }
}
