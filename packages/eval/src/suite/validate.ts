import type { EvalAssertionKind } from '@promptscript/core';
import { SCAN_RULES } from '../dataset/scan.js';
import {
  checkShape,
  flag,
  isRecord,
  list,
  modelParams,
  number,
  object,
  oneOf,
  rule,
  text,
  textOr,
  type Check,
  formatPath,
  type ShapeIssue,
} from '../shape.js';

const SUITE_SCHEMA = 'https://getpromptscript.dev/schema/eval-suite/v1.json';
const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_.-]{0,63}$/;
const SCAN_RULE_IDS = SCAN_RULES.map((rule) => rule.id);

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
    models: list(textOr(object({ ref: text, params: modelParams }, ['ref'])), 1, 8),
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
export function validateSuite(value: unknown): ShapeIssue[] {
  if (!isRecord(value)) return [{ path: [], message: 'the suite must be a mapping' }];
  return checkShape(suite, value);
}
