import type { DocumentPath } from './parse-document.js';

/** One structural problem of a document, at a path inside it. */
export interface ShapeIssue {
  path: DocumentPath;
  message: string;
}

/** Checks one value at a path and adds what is wrong to `issues`. */
export type Check = (value: unknown, path: DocumentPath, issues: ShapeIssue[]) => void;

/** Format a document path the way messages show it, such as `assertions[1].flags`. */
export function formatPath(path: DocumentPath): string {
  return path
    .map((part, index) => {
      if (typeof part === 'number') return `[${part}]`;
      return index === 0 ? part : `.${part}`;
    })
    .join('');
}

/** True for an object that is not null and not an array. */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** A mapping with these keys; unknown keys are issues. */
export function object(
  fields: Readonly<Record<string, Check>>,
  required: readonly string[] = []
): Check {
  return (value, path, issues) => {
    if (!isRecord(value)) {
      issues.push({ path, message: `${formatPath(path) || 'the document'} must be a mapping` });
      return;
    }
    for (const key of required) {
      if (value[key] === undefined) {
        issues.push({ path, message: `${formatPath([...path, key])} is required` });
      }
    }
    for (const [key, item] of Object.entries(value)) {
      const check = Object.hasOwn(fields, key) ? fields[key] : undefined;
      if (check === undefined) {
        issues.push({
          path: [...path, key],
          message: `${formatPath([...path, key])} is not a known key`,
        });
      } else {
        check(item, [...path, key], issues);
      }
    }
  };
}

/** A value that passes `test`, else `<path> must be <expectation>`. */
export function rule(test: (value: unknown) => boolean, expectation: string): Check {
  return (value, path, issues) => {
    if (!test(value)) issues.push({ path, message: `${formatPath(path)} must be ${expectation}` });
  };
}

export const text = rule((value) => typeof value === 'string', 'a string');
export const flag = rule((value) => typeof value === 'boolean', 'true or false');

/** A finite number, an integer when asked, inside the bounds that are set. */
export function number(min?: number, max?: number, integer = false): Check {
  let expectation = integer ? 'an integer' : 'a number';
  if (min !== undefined) {
    expectation += max === undefined ? ` of at least ${min}` : ` from ${min} to ${max}`;
  }
  return rule(
    (value) =>
      typeof value === 'number' &&
      Number.isFinite(value) &&
      (!integer || Number.isInteger(value)) &&
      value >= (min ?? -Infinity) &&
      value <= (max ?? Infinity),
    expectation
  );
}

/** One of the given values. */
export function oneOf(options: readonly unknown[]): Check {
  return rule((value) => options.includes(value), `one of ${options.join(', ')}`);
}

/** A list whose items pass `item`, with a size between `min` and `max`. */
export function list(item: Check, min = 0, max = Number.MAX_SAFE_INTEGER): Check {
  return (value, path, issues) => {
    if (!Array.isArray(value) || value.length < min || value.length > max) {
      const size = max === Number.MAX_SAFE_INTEGER ? '' : ` of ${min} to ${max} items`;
      issues.push({ path, message: `${formatPath(path)} must be a list${size}` });
      return;
    }
    value.forEach((entry: unknown, index) => item(entry, [...path, index], issues));
  };
}

/** A string, or a value that passes `check`. */
export function textOr(check: Check): Check {
  return (value, path, issues) => {
    if (typeof value !== 'string') check(value, path, issues);
  };
}

/** Invocation parameters of a model, `ModelParams` in core. */
export const modelParams = object({
  temperature: number(),
  topP: number(),
  topK: number(1, undefined, true),
  maxTokens: number(1, undefined, true),
  stop: list(text),
  seed: number(0, Number.MAX_SAFE_INTEGER, true),
});

/**
 * Run a check on a document.
 *
 * @param check - The check of the document root
 * @param value - Parsed document
 * @returns Problems with their paths; empty when the document fits
 */
export function checkShape(check: Check, value: unknown): ShapeIssue[] {
  const issues: ShapeIssue[] = [];
  check(value, [], issues);
  return issues;
}
