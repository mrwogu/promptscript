import type { EvalAssertionKind } from '@promptscript/core';
import { SCAN_RULES } from '../dataset/scan.js';
import type { DocumentPath } from '../parse-document.js';

/** One structural problem of a suite, at a path inside the document. */
export interface SuiteIssue {
  path: DocumentPath;
  message: string;
}

type Check = (value: unknown, path: DocumentPath, issues: SuiteIssue[]) => void;

const SUITE_SCHEMA = 'https://getpromptscript.dev/schema/eval-suite/v1.json';
const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_.-]{0,63}$/;
const SCAN_RULE_IDS = SCAN_RULES.map((rule) => rule.id);

/** Format a document path the way messages show it, such as `assertions[1].flags`. */
export function formatPath(path: DocumentPath): string {
  return path
    .map((part, index) => {
      if (typeof part === 'number') return `[${part}]`;
      return index === 0 ? part : `.${part}`;
    })
    .join('');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function object(fields: Readonly<Record<string, Check>>, required: readonly string[] = []): Check {
  return (value, path, issues) => {
    if (!isRecord(value)) {
      issues.push({ path, message: `${formatPath(path) || 'the suite'} must be a mapping` });
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

function rule(test: (value: unknown) => boolean, expectation: string): Check {
  return (value, path, issues) => {
    if (!test(value)) issues.push({ path, message: `${formatPath(path)} must be ${expectation}` });
  };
}

const text = rule((value) => typeof value === 'string', 'a string');
const flag = rule((value) => typeof value === 'boolean', 'true or false');

function number(min?: number, max?: number, integer = false): Check {
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

function oneOf(options: readonly unknown[]): Check {
  return rule((value) => options.includes(value), `one of ${options.join(', ')}`);
}

function list(item: Check, min = 0, max = Number.MAX_SAFE_INTEGER): Check {
  return (value, path, issues) => {
    if (!Array.isArray(value) || value.length < min || value.length > max) {
      const size = max === Number.MAX_SAFE_INTEGER ? '' : ` of ${min} to ${max} items`;
      issues.push({ path, message: `${formatPath(path)} must be a list${size}` });
      return;
    }
    value.forEach((entry: unknown, index) => item(entry, [...path, index], issues));
  };
}

function textOr(check: Check): Check {
  return (value, path, issues) => {
    if (typeof value !== 'string') check(value, path, issues);
  };
}

const params = object({
  temperature: number(),
  topP: number(),
  topK: number(1, undefined, true),
  maxTokens: number(1, undefined, true),
  stop: list(text),
  seed: number(0, Number.MAX_SAFE_INTEGER, true),
});
const runs = oneOf([1, 3, 5]);
// A reason needs a letter or digit, so blanks and zero-width characters do not count
const reason = rule(
  (value) => typeof value === 'string' && /[\p{L}\p{N}]/u.test(value) && value.length <= 500,
  'a reason of 1 to 500 characters with at least one letter or digit'
);
const assertionId = rule(
  (value) => typeof value === 'string' && ID_PATTERN.test(value),
  'an id of 1-64 letters, digits, dots, dashes or underscores'
);

const regexFlags = rule(
  (value) =>
    typeof value === 'string' && /^[imsu]*$/.test(value) && new Set(value).size === value.length,
  'any of i, m, s and u, each at most once'
);

const ASSERTION_FIELDS: Readonly<Record<EvalAssertionKind, Readonly<Record<string, Check>>>> = {
  equals: { negate: flag, value: text, ignoreCase: flag, trim: flag },
  contains: {
    negate: flag,
    values: list(text, 1, 20),
    mode: oneOf(['all', 'any']),
    ignoreCase: flag,
  },
  regex: { negate: flag, pattern: text, flags: regexFlags },
  // Inline schemas hold any JSON Schema keyword, so only the type is checked here
  'json-schema': { schema: rule(isRecord, 'a mapping') },
  'llm-judge': { rubric: text, criteria: text, model: text, runs },
};
const ASSERTION_REQUIRED: Readonly<Record<EvalAssertionKind, readonly string[]>> = {
  equals: [],
  contains: ['values'],
  regex: ['pattern'],
  'json-schema': [],
  'llm-judge': ['rubric'],
};

function isKind(value: unknown): value is EvalAssertionKind {
  return typeof value === 'string' && Object.hasOwn(ASSERTION_FIELDS, value);
}

const assertion: Check = (value, path, issues) => {
  const kind = isRecord(value) ? value['kind'] : undefined;
  if (!isKind(kind)) {
    issues.push({
      path: isRecord(value) ? [...path, 'kind'] : path,
      message: `${formatPath([...path, 'kind'])} must be one of ${Object.keys(ASSERTION_FIELDS).join(', ')}`,
    });
    return;
  }
  const fields = { id: assertionId, kind: text, field: text, ...ASSERTION_FIELDS[kind] };
  object(fields, ['id', ...ASSERTION_REQUIRED[kind]])(value, path, issues);
};

function compileRegex(value: Record<string, unknown>): RegExp | undefined {
  try {
    return new RegExp(
      String(value['pattern']),
      typeof value['flags'] === 'string' ? value['flags'] : ''
    );
  } catch {
    return undefined;
  }
}

const assertions: Check = (value, path, issues) => {
  const before = issues.length;
  list(assertion, 1, 20)(value, path, issues);
  if (issues.length > before || !Array.isArray(value)) return;
  const seen = new Set<unknown>();
  value.forEach((entry: Record<string, unknown>, index) => {
    if (seen.has(entry['id'])) {
      issues.push({
        path: [...path, index, 'id'],
        message: `${formatPath([...path, index, 'id'])} repeats an earlier assertion id`,
      });
    }
    seen.add(entry['id']);
    if (entry['kind'] === 'regex' && compileRegex(entry) === undefined) {
      issues.push({
        path: [...path, index, 'pattern'],
        message: `${formatPath([...path, index, 'pattern'])} is not a valid regular expression`,
      });
    }
  });
};

const datasetRef = object(
  {
    path: text,
    allow: list(object({ rule: oneOf(SCAN_RULE_IDS), reason }, ['rule', 'reason'])),
    allowPii: object({ reason }, ['reason']),
  },
  ['path']
);

const suite = object(
  {
    $schema: oneOf([SUITE_SCHEMA]),
    prompt: text,
    dataset: textOr(datasetRef),
    labels: text,
    models: list(textOr(object({ ref: text, params }, ['ref'])), 1, 8),
    judge: object({ model: text, runs }),
    assertions,
    thresholds: object({
      passRate: number(0, 1),
      maxCostUsd: number(0),
      maxCostPerCaseUsd: number(0),
      latencyMs: object({ p50: number(1, undefined, true), p95: number(1, undefined, true) }),
    }),
  },
  ['prompt', 'dataset', 'assertions']
);

/**
 * Check the structure of a parsed suite file against `EvalSuiteV1`. Unknown
 * keys are errors, so a typo cannot switch a check off. Stricter than the
 * schema in four places: assertion ids are unique, regex patterns compile,
 * `allow` names only rules the dataset scan runs, and a reason has a letter or digit.
 *
 * @param value - Parsed suite document
 * @returns Problems with their paths; empty when the suite is valid
 */
export function validateSuite(value: unknown): SuiteIssue[] {
  const issues: SuiteIssue[] = [];
  suite(value, [], issues);
  return issues;
}
