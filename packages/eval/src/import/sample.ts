import { Buffer } from 'node:buffer';
import {
  PROMPT_INPUT_NAME_PATTERN,
  type EvalInputValue,
  type EvalSampleV1,
} from '@promptscript/core';
import { isRecord } from '../shape.js';

/** Largest string value of a sample, in UTF-8 bytes; the dataset leaf limit. */
export const MAX_SAMPLE_STRING_BYTES = 64 * 1024;

const SAMPLE_KEYS: ReadonlySet<string> = new Set([
  'prompt',
  'contentHash',
  'variant',
  'inputs',
  'output',
  'feedback',
]);
const FEEDBACK_KEYS: ReadonlySet<string> = new Set(['name', 'score', 'label']);
const UNSAFE_NAMES: ReadonlySet<string> = new Set([
  'prototype',
  ...Object.getOwnPropertyNames(Object.prototype),
]);
const CONTENT_HASH = /^sha256-[0-9a-f]{64}$/;
const VARIANT = /^(?:control|[a-z][a-z0-9-]{0,31})$/;
const FEEDBACK_NAME = /^[a-z][a-z0-9_.-]{0,63}$/;
/** Pattern of a feedback label. */
export const FEEDBACK_LABEL_PATTERN = /^[a-z][a-z0-9_-]{0,31}$/;

// Plain objects only: a class instance or an object with another prototype could
// hide a getter that the checks below would call
function isPlain(value: unknown): value is Record<string, unknown> {
  if (!isRecord(value)) return false;
  const prototype = Object.getPrototypeOf(value) as unknown;
  return prototype === Object.prototype || prototype === null;
}

// Own enumerable string keys only, none outside the set; a symbol key is refused too
function hasOnlyKeys(value: Record<string, unknown>, allowed: ReadonlySet<string>): boolean {
  return Reflect.ownKeys(value).every((key) => typeof key === 'string' && allowed.has(key));
}

// The value of an own data property; a getter gives undefined and is never called
function own(value: Record<string, unknown>, key: string): unknown {
  return Object.getOwnPropertyDescriptor(value, key)?.value;
}

function isShortString(value: unknown): value is string {
  return typeof value === 'string' && Buffer.byteLength(value, 'utf8') <= MAX_SAMPLE_STRING_BYTES;
}

function isScalar(value: unknown): value is EvalInputValue {
  return (
    isShortString(value) ||
    typeof value === 'boolean' ||
    (typeof value === 'number' && Number.isFinite(value))
  );
}

function matches(value: unknown, pattern: RegExp): value is string {
  return typeof value === 'string' && pattern.test(value);
}

function toInputs(value: unknown): Record<string, EvalInputValue> | undefined {
  if (!isPlain(value)) return undefined;
  const inputs = Object.create(null) as Record<string, EvalInputValue>;
  for (const key of Reflect.ownKeys(value)) {
    if (typeof key !== 'string' || !PROMPT_INPUT_NAME_PATTERN.test(key) || UNSAFE_NAMES.has(key)) {
      return undefined;
    }
    const item = own(value, key);
    if (!isScalar(item)) return undefined;
    inputs[key] = item;
  }
  return inputs;
}

function isAbsentOr(value: unknown, test: (value: unknown) => boolean): boolean {
  return value === undefined || test(value);
}

const isFiniteNumber = (value: unknown): boolean =>
  typeof value === 'number' && Number.isFinite(value);

function toFeedback(value: unknown): EvalSampleV1['feedback'] | undefined {
  if (!isPlain(value) || !hasOnlyKeys(value, FEEDBACK_KEYS)) return undefined;
  const [name, score, label] = ['name', 'score', 'label'].map((key) => own(value, key));
  if (!matches(name, FEEDBACK_NAME) || !isAbsentOr(score, isFiniteNumber)) return undefined;
  if (!isAbsentOr(label, (item) => matches(item, FEEDBACK_LABEL_PATTERN))) return undefined;
  return {
    name,
    ...(typeof score === 'number' ? { score } : {}),
    ...(typeof label === 'string' ? { label } : {}),
  };
}

// The scalar fields of a sample, checked against their patterns and limits
function scalarsFit(fields: Record<string, unknown>): boolean {
  const { prompt, contentHash, variant, output } = fields;
  return (
    typeof prompt === 'string' &&
    prompt.length >= 1 &&
    prompt.length <= 200 &&
    isAbsentOr(contentHash, (item) => matches(item, CONTENT_HASH)) &&
    isAbsentOr(variant, (item) => matches(item, VARIANT)) &&
    isAbsentOr(output, isShortString)
  );
}

/**
 * Check one parsed JSONL line against the closed sample schema
 * (`schema/eval-sample-v1.json`) and copy it. Anything the schema does not list
 * makes the sample invalid: a `feedback.comment`, an assignment key, a user,
 * session or trace id, a nested input, an unknown top-level key. The sample is
 * rebuilt from the listed fields only, so nothing else can ride along.
 *
 * @param value - The parsed line
 * @returns The sample, or undefined when the line breaks the schema or a size limit
 */
export function parseSample(value: unknown): EvalSampleV1 | undefined {
  if (!isPlain(value) || !hasOnlyKeys(value, SAMPLE_KEYS)) return undefined;
  const fields: Record<string, unknown> = {};
  for (const key of SAMPLE_KEYS) fields[key] = own(value, key);
  const inputs = toInputs(fields['inputs']);
  const feedback = fields['feedback'] === undefined ? undefined : toFeedback(fields['feedback']);
  if (!scalarsFit(fields) || inputs === undefined) return undefined;
  if (fields['feedback'] !== undefined && feedback === undefined) return undefined;
  const { prompt, contentHash, variant, output } = fields as {
    prompt: string;
    contentHash?: string;
    variant?: string;
    output?: string;
  };
  return {
    prompt,
    ...(contentHash === undefined ? {} : { contentHash }),
    ...(variant === undefined ? {} : { variant }),
    inputs,
    ...(output === undefined ? {} : { output }),
    ...(feedback === undefined ? {} : { feedback }),
  };
}
