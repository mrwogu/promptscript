/**
 * Types for structured output merge plans.
 *
 * Kept in core so output plans can be consumed by Node.js and browser
 * adapters without importing formatter or filesystem code.
 */

/**
 * A single merge operation to apply to a structured settings file.
 */
export interface StructuredMergeOperation {
  /** Dotted path to the target key. */
  path: string;
  /** Value to set, or undefined to remove an owned value. */
  value: unknown;
}

/**
 * Plan for merging generated values into a structured settings file.
 */
export interface StructuredMergePlan {
  /** Target file format. */
  format: 'json' | 'toml';
  /** Owner identifier. */
  owner: string;
  /** Merge operations to apply. */
  operations: StructuredMergeOperation[];
}
