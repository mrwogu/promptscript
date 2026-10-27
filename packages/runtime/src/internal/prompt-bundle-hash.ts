// Copy of packages/core/src/prompt-bundle-hash.ts. copies.spec.ts fails when the two drift.
import { canonicalizeJson } from './canonical-json.js';
import { sha256Hex } from './sha256.js';

/** Schema URL of a prompt bundle. It is the version tag and is part of the hash. */
export const PROMPT_BUNDLE_SCHEMA_URL = 'https://getpromptscript.dev/schema/prompt-bundle/v1.json';

/** Schema URL of a prompt bundle index. */
export const PROMPT_BUNDLE_INDEX_SCHEMA_URL =
  'https://getpromptscript.dev/schema/prompt-bundle-index/v1.json';

/**
 * Content hash of a prompt bundle.
 *
 * SHA-256 over the RFC 8785 canonical JSON of every field except `contentHash` and
 * `provenance`, written as `sha256-` plus 64 lowercase hex characters. `$schema` stays in the
 * input, so it works as the version tag of the hash.
 *
 * @param bundle - A bundle object, with or without `contentHash`
 * @returns The hash a bundle with this content must carry
 * @throws {PSError} when the bundle holds a value JSON cannot carry, such as a non-finite number
 *
 * @example
 * const hash = hashPromptBundle(JSON.parse(text));
 * if (hash !== bundle.contentHash) throw new Error('hash mismatch');
 */
export function hashPromptBundle(bundle: object): string {
  const hashed: Record<string, unknown> = { ...bundle };
  delete hashed['contentHash'];
  delete hashed['provenance'];
  return `sha256-${sha256Hex(canonicalizeJson(hashed))}`;
}
