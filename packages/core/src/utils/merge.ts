import type { TextContent } from '../types/index.js';

/**
 * Options for deep merge behavior.
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
 * @param parent - Parent object
 * @param child - Child object (takes precedence)
 * @param options - Merge options
 * @returns Merged object
 */
export function deepMerge<T extends Record<string, unknown>>(
  parent: T,
  child: Partial<T>,
  options: Partial<MergeOptions> = {}
): T {
  const opts = { ...DEFAULT_MERGE_OPTIONS, ...options };
  const result = { ...parent };

  for (const key of Object.keys(child) as Array<keyof T>) {
    const childVal = child[key];

    // Skip undefined child values
    if (childVal === undefined) {
      continue;
    }

    result[key] = mergeValue(parent[key], childVal, opts) as T[keyof T];
  }

  return result;
}

/**
 * Merge a single value based on its type.
 */
function mergeValue(parentVal: unknown, childVal: unknown, opts: MergeOptions): unknown {
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
      return deepMerge(
        parentVal as Record<string, unknown>,
        childVal as Record<string, unknown>,
        opts
      );
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
    result[key] = deepClone(val);
  }
  return result as T;
}
