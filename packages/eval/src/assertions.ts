import { Buffer } from 'node:buffer';
import { Ajv, type ValidateFunction } from 'ajv';
import { isRecord } from './shape.js';
import type {
  EvalAssertion,
  EvalAssertionResultV1,
  EvalContainsAssertion,
  EvalEqualsAssertion,
  EvalExpectedValue,
  EvalJsonSchemaAssertion,
  EvalLlmJudgeAssertion,
  EvalRegexAssertion,
  PromptBundleOutput,
} from '@promptscript/core';
import {
  isRegexTimeout,
  REGEX_TIMEOUT_MS,
  timedRegExp,
  timedRegexTest,
  withRegexBudget,
} from './timed-regex.js';

/** An assertion that checks a response without a model call. */
export type DeterministicAssertion = Exclude<EvalAssertion, EvalLlmJudgeAssertion>;

/** What a response is checked against, besides the assertions. */
export interface AssertionContext {
  /** Output contract of the prompt, the default schema of `json-schema` */
  output?: PromptBundleOutput;
  /** Expected value of the row, the default value of `equals` */
  expected?: string | Record<string, EvalExpectedValue>;
  /**
   * Ids of assertions whose patterns ran out of time on an earlier case. They
   * fail at once, and an assertion that runs out is added, so a slow pattern
   * costs its time budget once per run instead of once per case.
   */
  timedOut?: Set<string>;
}

interface Outcome {
  passed: boolean;
  reason?: string;
  timedOut?: true;
}

type Target = { ok: true; value: unknown } | { ok: false; reason: string };

const MAX_REASON = 160;
const MAX_VALUE = 60;
const MAX_REGEX_TARGET = 64 * 1024;
const FENCE = '```';
const compiled = new WeakMap<object, ValidateFunction>();

/**
 * Compile a JSON Schema with Ajv in strict mode, once per schema object.
 * Remote `$ref` is never loaded, and schema patterns run with the regex
 * time limit.
 *
 * @param schema - JSON Schema
 * @returns The validate function
 * @throws Error when Ajv cannot compile the schema
 */
export function compileJsonSchema(schema: object): ValidateFunction {
  let validate = compiled.get(schema);
  if (validate === undefined) {
    // A fresh instance per schema, so `$id` values of different suites never clash
    validate = new Ajv({
      strict: true,
      allowUnionTypes: true,
      code: { regExp: timedRegExp },
    }).compile(schema);
    compiled.set(schema, validate);
  }
  return validate;
}

// The actual value in a reason, at most MAX_VALUE characters of it.
function show(value: unknown): string {
  const text = typeof value === 'string' ? value : (JSON.stringify(value) ?? String(value));
  return JSON.stringify(text.length > MAX_VALUE ? `${text.slice(0, MAX_VALUE)}...` : text);
}

// Trim, unwrap one fenced block, parse; only a JSON object counts.
function parseResponse(response: string): Record<string, unknown> | undefined {
  let text = response.trim();
  const start = text.indexOf('\n');
  if (
    text.startsWith(FENCE) &&
    text.endsWith(FENCE) &&
    start !== -1 &&
    start < text.length - FENCE.length
  ) {
    text = text.slice(start + 1, -FENCE.length).trim();
  }
  try {
    const value: unknown = JSON.parse(text);
    return isRecord(value) ? value : undefined;
  } catch {
    return undefined;
  }
}

function normalize(text: string, trim: boolean, ignoreCase: boolean): string {
  const value = (trim ? text.trim() : text).normalize('NFC');
  return ignoreCase ? value.toLowerCase() : value;
}

function same(
  actual: unknown,
  expected: EvalExpectedValue,
  assertion: EvalEqualsAssertion
): boolean {
  if (typeof expected === 'string') {
    const trim = assertion.trim ?? true;
    const ignoreCase = assertion.ignoreCase ?? false;
    return (
      typeof actual === 'string' &&
      normalize(actual, trim, ignoreCase) === normalize(expected, trim, ignoreCase)
    );
  }
  if (Array.isArray(expected)) {
    return (
      Array.isArray(actual) &&
      actual.length === expected.length &&
      expected.every((item, index) => same(actual[index], item, assertion))
    );
  }
  return actual === expected;
}

function expectedFor(
  assertion: EvalEqualsAssertion,
  expected: AssertionContext['expected']
): EvalExpectedValue | undefined {
  if (assertion.value !== undefined) return assertion.value;
  if (assertion.field === undefined) return typeof expected === 'string' ? expected : undefined;
  return isRecord(expected) && Object.hasOwn(expected, assertion.field)
    ? expected[assertion.field]
    : undefined;
}

function checkEquals(
  assertion: EvalEqualsAssertion,
  actual: unknown,
  context: AssertionContext
): Outcome {
  const expected = expectedFor(assertion, context.expected);
  if (expected === undefined) {
    return {
      passed: false,
      reason: 'No expected value: set value on the assertion or expected in the row',
    };
  }
  const passed = same(actual, expected, assertion) !== (assertion.negate ?? false);
  if (passed) return { passed };
  return assertion.negate
    ? { passed, reason: `Expected any value but ${show(expected)}` }
    : { passed, reason: `Expected ${show(expected)}, got ${show(actual)}` };
}

function checkContains(assertion: EvalContainsAssertion, actual: unknown): Outcome {
  if (typeof actual !== 'string') return { passed: false, reason: `Not a string: ${show(actual)}` };
  const ignoreCase = assertion.ignoreCase ?? false;
  const text = normalize(actual, false, ignoreCase);
  const found = assertion.values.filter((value) =>
    text.includes(normalize(value, false, ignoreCase))
  );
  const holds =
    assertion.mode === 'any' ? found.length > 0 : found.length === assertion.values.length;
  const passed = holds !== (assertion.negate ?? false);
  if (passed) return { passed };
  if (assertion.negate) return { passed, reason: `Found ${show(found[0])} in ${show(actual)}` };
  const missing = assertion.values.find((value) => !found.includes(value));
  return { passed, reason: `Missing ${show(missing)} in ${show(actual)}` };
}

function checkRegex(assertion: EvalRegexAssertion, actual: unknown): Outcome {
  if (typeof actual !== 'string') return { passed: false, reason: `Not a string: ${show(actual)}` };
  if (Buffer.byteLength(actual, 'utf8') > MAX_REGEX_TARGET) {
    return { passed: false, reason: `Target is longer than ${MAX_REGEX_TARGET} bytes` };
  }
  let matched: boolean;
  try {
    matched = timedRegexTest(assertion.pattern, assertion.flags ?? '', actual);
  } catch (error) {
    // checkSuites refuses bad patterns; a direct caller still gets a failed case
    if (isRegexTimeout(error)) {
      return {
        passed: false,
        reason: `Regex ran longer than ${REGEX_TIMEOUT_MS} ms`,
        timedOut: true,
      };
    }
    return { passed: false, reason: 'Regex pattern or flags are not valid' };
  }
  const passed = matched !== (assertion.negate ?? false);
  if (passed) return { passed };
  return { passed, reason: `${matched ? 'Matches' : 'No match'} in ${show(actual)}` };
}

function checkJsonSchema(
  assertion: EvalJsonSchemaAssertion,
  actual: unknown,
  context: AssertionContext
): Outcome {
  const properties = context.output?.properties;
  const property =
    assertion.field !== undefined &&
    properties !== undefined &&
    Object.hasOwn(properties, assertion.field)
      ? properties[assertion.field]
      : undefined;
  const schema = assertion.schema ?? (assertion.field === undefined ? context.output : property);
  if (schema === undefined) {
    return { passed: false, reason: 'No schema: add schema or an output contract' };
  }
  let validate: ValidateFunction;
  try {
    validate = compileJsonSchema(schema);
  } catch {
    return { passed: false, reason: 'Schema does not compile; checkSuites reports why' };
  }
  let valid: boolean;
  try {
    valid = validate(actual);
  } catch (error) {
    // A slow schema pattern, or a recursive schema on a very deep response
    if (isRegexTimeout(error)) {
      return {
        passed: false,
        reason: `Schema patterns ran longer than ${REGEX_TIMEOUT_MS} ms`,
        timedOut: true,
      };
    }
    return { passed: false, reason: 'Schema check could not finish on this response' };
  }
  if (valid) return { passed: true };
  const error = validate.errors?.[0];
  const at = error === undefined || error.instancePath === '' ? '/' : error.instancePath;
  return { passed: false, reason: `Schema error at ${show(at)}: ${error?.message ?? 'invalid'}` };
}

function check(
  assertion: DeterministicAssertion,
  value: unknown,
  context: AssertionContext
): Outcome {
  switch (assertion.kind) {
    case 'equals':
      return checkEquals(assertion, value, context);
    case 'contains':
      return checkContains(assertion, value);
    case 'regex':
      return checkRegex(assertion, value);
    case 'json-schema':
      return checkJsonSchema(assertion, value, context);
  }
}

/**
 * Check a response with the four deterministic assertion kinds: `equals`,
 * `contains`, `regex` and `json-schema`. A `field` reads one property of the
 * response parsed as JSON (trimmed, one fenced block unwrapped, own
 * properties only); without `field` the whole text is the target, except
 * for `json-schema`, which checks the parsed object. A response that does not
 * parse fails every assertion that needs the object. Reasons are at most 160
 * characters and quote at most 60 characters of the actual value.
 *
 * @param assertions - Assertions in suite order
 * @param response - Response text
 * @param context - Output contract and the row's expected value
 * @returns One result per assertion, in the same order
 */
export function evaluateAssertions(
  assertions: readonly DeterministicAssertion[],
  response: string,
  context: AssertionContext
): EvalAssertionResultV1[] {
  // Parsed at most once, and only when an assertion needs the object
  let parsed: { object?: Record<string, unknown> } | undefined;
  const target = (assertion: DeterministicAssertion): Target => {
    if (assertion.field === undefined && assertion.kind !== 'json-schema') {
      return { ok: true, value: response };
    }
    parsed ??= { object: parseResponse(response) };
    const object = parsed.object;
    if (object === undefined) return { ok: false, reason: 'Response is not a JSON object' };
    if (assertion.field === undefined) return { ok: true, value: object };
    if (!Object.hasOwn(object, assertion.field)) {
      return { ok: false, reason: `Field ${show(assertion.field)} is missing from the response` };
    }
    return { ok: true, value: object[assertion.field] };
  };

  const evaluate = (assertion: DeterministicAssertion): Outcome => {
    if (context.timedOut?.has(assertion.id)) {
      return {
        passed: false,
        reason: 'Patterns ran out of time on an earlier case; not run again',
      };
    }
    const found = target(assertion);
    if (!found.ok) return { passed: false, reason: found.reason };
    const outcome = withRegexBudget(REGEX_TIMEOUT_MS, () => check(assertion, found.value, context));
    if (outcome.timedOut) context.timedOut?.add(assertion.id);
    return outcome;
  };

  return assertions.map((assertion) => {
    const outcome = evaluate(assertion);
    return {
      id: assertion.id,
      kind: assertion.kind,
      passed: outcome.passed,
      ...(outcome.reason === undefined ? {} : { reason: outcome.reason.slice(0, MAX_REASON) }),
    };
  });
}
