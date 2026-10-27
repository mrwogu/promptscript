import { ErrorCode, PSError } from '../errors/base.js';
import type { TextContent } from '../types/index.js';

/**
 * Keys a merge refuses. Assigning `__proto__` sets the prototype of the merged object
 * instead of adding a key, so a value from YAML or JSON would hide in the prototype;
 * `constructor` and `prototype` are the other names prototype pollution goes through.
 */
const RESERVED_KEYS: ReadonlySet<string> = new Set(['__proto__', 'constructor', 'prototype']);

/**
 * Options for deep merge behavior.
 * @internal Used by the resolver for inheritance merging.
 */
export interface MergeOptions {
  /** How to merge arrays */
  arrayStrategy: 'replace' | 'concat' | 'unique';
  /** How to merge text content */
  textStrategy: 'replace' | 'concat' | 'prepend';
  /** Separator for concatenated text */
  textSeparator: string;
}

/**
 * Default merge options following PromptScript inheritance rules.
 * @internal Used by the resolver for inheritance merging.
 */
export const DEFAULT_MERGE_OPTIONS: MergeOptions = {
  arrayStrategy: 'unique',
  textStrategy: 'concat',
  textSeparator: '\n\n',
};

/**
 * Deep merge two objects following PromptScript inheritance rules.
 *
 * Rules:
 * - Objects: deep merge (child wins on conflict)
 * - Arrays: strategy-dependent (default: unique concat)
 * - TextContent: concatenate (parent + child)
 * - Primitives: child wins
 *
 * Only own properties are read and written, so nothing comes from or goes to a prototype.
 *
 * @param parent - Parent object
 * @param child - Child object (takes precedence)
 * @param options - Merge options
 * @returns Merged object
 * @throws PSError (`INVALID_VALUE`) when either side has a `__proto__`, `constructor` or
 * `prototype` key in an object that is merged, at the top or at a path both sides share
 */
export function deepMerge<T extends Record<string, unknown>>(
  parent: T,
  child: Partial<T>,
  options: Partial<MergeOptions> = {}
): T {
  const opts = { ...DEFAULT_MERGE_OPTIONS, ...options };
  return mergeObjects(parent, child, opts, '') as T;
}

function refuseReservedKeys(value: Record<string, unknown>, path: string): void {
  const key = Object.keys(value).find((name) => RESERVED_KEYS.has(name));
  if (key === undefined) return;
  const where = path === '' ? 'at the top level' : `under "${path}"`;
  throw new PSError(
    `The key "${key}" ${where} is reserved, so it cannot be merged. Rename or remove it.`,
    ErrorCode.INVALID_VALUE
  );
}

function mergeObjects(
  parent: Record<string, unknown>,
  child: Record<string, unknown>,
  opts: MergeOptions,
  path: string
): Record<string, unknown> {
  refuseReservedKeys(parent, path);
  refuseReservedKeys(child, path);
  // Spread copies own properties only; every key that can reach it is checked above.
  const result: Record<string, unknown> = { ...parent };

  for (const key of Object.keys(child)) {
    const childVal = child[key];

    // Skip undefined child values
    if (childVal === undefined) {
      continue;
    }

    const parentVal = Object.hasOwn(parent, key) ? parent[key] : undefined;
    const keyPath = path === '' ? key : `${path}.${key}`;
    result[key] = mergeValue(parentVal, childVal, opts, keyPath);
  }

  return result;
}

/**
 * Merge a single value based on its type.
 */
function mergeValue(
  parentVal: unknown,
  childVal: unknown,
  opts: MergeOptions,
  path: string
): unknown {
  // Null explicitly overwrites
  if (childVal === null) {
    return null;
  }

  // Arrays
  if (Array.isArray(childVal)) {
    return mergeArrays(Array.isArray(parentVal) ? parentVal : [], childVal, opts.arrayStrategy);
  }

  // TextContent special handling
  if (isTextContent(childVal)) {
    return mergeTextContent(isTextContent(parentVal) ? parentVal : undefined, childVal, opts);
  }

  // Objects (recursive merge)
  if (isPlainObject(childVal)) {
    if (isPlainObject(parentVal)) {
      return mergeObjects(parentVal, childVal, opts, path);
    }
    return childVal;
  }

  // Primitives - child wins
  return childVal;
}

/**
 * Merge two arrays based on strategy.
 */
function mergeArrays(
  parent: unknown[],
  child: unknown[],
  strategy: MergeOptions['arrayStrategy']
): unknown[] {
  switch (strategy) {
    case 'replace':
      return [...child];
    case 'concat':
      return [...parent, ...child];
    case 'unique':
      return deduplicateArray([...parent, ...child]);
  }
}

/**
 * Deduplicate an array while preserving order.
 */
function deduplicateArray(arr: unknown[]): unknown[] {
  const seen = new Set<string>();
  const result: unknown[] = [];

  for (const item of arr) {
    const key = typeof item === 'object' ? JSON.stringify(item) : String(item);
    if (!seen.has(key)) {
      seen.add(key);
      result.push(item);
    }
  }

  return result;
}

/**
 * Merge text content based on strategy.
 */
function mergeTextContent(
  parent: TextContent | undefined,
  child: TextContent,
  opts: MergeOptions
): TextContent {
  if (!parent) {
    return child;
  }

  switch (opts.textStrategy) {
    case 'replace':
      return child;
    case 'concat':
      return {
        ...child,
        value: `${parent.value}${opts.textSeparator}${child.value}`,
      };
    case 'prepend':
      return {
        ...child,
        value: `${child.value}${opts.textSeparator}${parent.value}`,
      };
  }
}

/**
 * Type guard for TextContent.
 */
export function isTextContent(val: unknown): val is TextContent {
  return (
    typeof val === 'object' &&
    val !== null &&
    'type' in val &&
    (val as { type: string }).type === 'TextContent'
  );
}

/**
 * Type guard for plain objects.
 */
export function isPlainObject(val: unknown): val is Record<string, unknown> {
  return (
    typeof val === 'object' &&
    val !== null &&
    !Array.isArray(val) &&
    Object.getPrototypeOf(val) === Object.prototype
  );
}

/**
 * Deep clone a value.
 */
export function deepClone<T>(value: T): T {
  if (value === null || typeof value !== 'object') {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(deepClone) as T;
  }

  const result: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(value)) {
    if (key === '__proto__') {
      // An own "__proto__" key stays an own key; assigning it would set the prototype.
      Object.defineProperty(result, key, {
        value: deepClone(val),
        enumerable: true,
        writable: true,
        configurable: true,
      });
    } else {
      result[key] = deepClone(val);
    }
  }
  return result as T;
}
