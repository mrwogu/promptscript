/**
 * Structured output merge types and helpers.
 *
 * When a formatter produces structured output (JSON or TOML) that must be
 * merged with existing user-owned settings, the formatter attaches a
 * `StructuredMergePlan` to the `FormatterOutput.merge` field. The writer
 * reads the existing file, parses it, applies the merge operations while
 * preserving unknown keys, and writes the result atomically.
 *
 * Ownership is stored inside a valid target-specific data key (never a
 * comment in JSON). The `_promptscript` boolean marker is set on every
 * object that PromptScript owns, allowing the writer to identify and
 * remove previously owned entries that have disappeared from generated
 * output.
 *
 * @module structured-output
 */

/**
 * A single merge operation to apply to a structured settings file.
 */
export interface StructuredMergeOperation {
  /**
   * Dotted path to the target key (e.g. 'hooks.PreToolUse').
   * Intermediate objects are created if they do not exist.
   */
  path: string;
  /**
   * The value to set at the target path. When `undefined`, the key is
   * removed (only if it was previously owned by PromptScript).
   */
  value: unknown;
}

/**
 * Plan for merging structured output into an existing settings file.
 */
export interface StructuredMergePlan {
  /** Target file format */
  format: 'json' | 'toml';
  /** Owner identifier (e.g. 'promptscript') */
  owner: string;
  /** Merge operations to apply */
  operations: StructuredMergeOperation[];
}

/**
 * Ownership marker key. Set to `true` on every object that PromptScript
 * owns in a merged settings file.
 */
export const OWNERSHIP_KEY = '_promptscript';

/**
 * Parse a dotted path into segments.
 * @example 'hooks.PreToolUse' -> ['hooks', 'PreToolUse']
 */
export function parsePath(path: string): string[] {
  return path.split('.');
}

/**
 * Apply merge operations to a parsed settings object.
 *
 * - Creates intermediate objects as needed.
 * - Sets the ownership marker on every created object.
 * - Preserves unknown keys that were not created by PromptScript.
 * - When `value` is `undefined`, removes the key only if it was previously
 *   owned by PromptScript (has the ownership marker).
 *
 * @param target - The parsed existing settings (mutated in place)
 * @param plan - The merge plan to apply
 * @returns The mutated target object
 */
export function applyMergeOperations(
  target: Record<string, unknown>,
  plan: StructuredMergePlan
): Record<string, unknown> {
  for (const op of plan.operations) {
    const segments = parsePath(op.path);
    let current: Record<string, unknown> = target;

    // Navigate to the parent, creating intermediate objects as needed
    for (let i = 0; i < segments.length - 1; i++) {
      const segment = segments[i]!;
      if (current[segment] === undefined || current[segment] === null) {
        current[segment] = { [OWNERSHIP_KEY]: true } as Record<string, unknown>;
      }
      current = current[segment] as Record<string, unknown>;
    }

    const lastSegment = segments[segments.length - 1]!;

    if (op.value === undefined) {
      // Only remove if previously owned
      const existing = current[lastSegment];
      if (
        existing !== null &&
        typeof existing === 'object' &&
        (existing as Record<string, unknown>)[OWNERSHIP_KEY] === true
      ) {
        delete current[lastSegment];
      }
    } else {
      // Set the value, marking ownership on objects
      if (op.value !== null && typeof op.value === 'object' && !Array.isArray(op.value)) {
        current[lastSegment] = {
          ...(op.value as Record<string, unknown>),
          [OWNERSHIP_KEY]: true,
        };
      } else {
        current[lastSegment] = op.value;
      }
    }
  }

  return target;
}

/**
 * Remove previously owned entries that have disappeared from generated output.
 *
 * Walks the target object and removes any key that has the ownership marker
 * but is not present in the current plan's operations.
 *
 * @param target - The parsed settings object (mutated in place)
 * @param plan - The current merge plan
 */
export function removeStaleOwned(target: Record<string, unknown>, plan: StructuredMergePlan): void {
  const activePaths = new Set(plan.operations.map((op) => op.path));

  function walk(obj: Record<string, unknown>, prefix: string): void {
    for (const [key, value] of Object.entries(obj)) {
      if (key === OWNERSHIP_KEY) continue;
      const fullPath = prefix ? `${prefix}.${key}` : key;

      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        const childObj = value as Record<string, unknown>;
        if (childObj[OWNERSHIP_KEY] === true && !activePaths.has(fullPath)) {
          // This entire object was owned by PromptScript but is no longer
          // in the current plan - check if any child path is active
          const hasActiveChild =
            activePaths.has(fullPath) || [...activePaths].some((p) => p.startsWith(fullPath + '.'));
          if (!hasActiveChild) {
            delete obj[key];
          } else {
            walk(childObj, fullPath);
          }
        } else {
          walk(childObj, fullPath);
        }
      }
    }
  }

  walk(target, '');
}

/**
 * Serialize a merged settings object deterministically.
 *
 * @param data - The settings object to serialize
 * @param format - Target format ('json' or 'toml')
 * @returns Serialized string
 */
export function serializeMerged(data: Record<string, unknown>, format: 'json' | 'toml'): string {
  if (format === 'json') {
    return JSON.stringify(data, null, 2) + '\n';
  }
  // TOML serialization is handled by the writer using a TOML library
  // This placeholder allows tests to verify the plan structure
  throw new Error('TOML serialization requires a TOML library; use the writer implementation');
}

/**
 * Check whether a parsed settings object has any PromptScript-owned entries.
 *
 * @param data - The parsed settings object
 * @returns True if any entry has the ownership marker
 */
export function hasOwnedEntries(data: Record<string, unknown>): boolean {
  if (data[OWNERSHIP_KEY] === true) return true;
  for (const value of Object.values(data)) {
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      if (hasOwnedEntries(value as Record<string, unknown>)) return true;
    }
  }
  return false;
}
