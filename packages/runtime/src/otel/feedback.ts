import { ENVIRONMENT, EXPERIMENT_NAME, VARIANT_NAME } from '../client.js';
import { PromptRuntimeError } from '../errors.js';
import { HASH_PATTERN } from '../load.js';
import { finite, isObject, matches, promptId } from './check.js';
import type { MetaFields } from './attributes.js';
import type { PromptSpanRef } from './types.js';

export const TRACE_ID = /^[\da-f]{32}$/;
export const SPAN_ID = /^[\da-f]{16}$/;
export const NAME = /^[a-z][a-z\d_.-]{0,63}$/;
const LABEL = /^[a-z][a-z\d_-]{0,31}$/;
const ZEROS = /^0+$/;

/** A feedback input that passed every check. */
export interface CheckedFeedback {
  readonly span: PromptSpanRef;
  readonly name: string;
  readonly score?: number;
  readonly label?: string;
  readonly prompt?: MetaFields;
}

const PROMPT_FIELDS: readonly (readonly [string, (value: unknown) => boolean])[] = [
  ['id', promptId],
  ['contentHash', (value) => matches(value, HASH_PATTERN)],
  ['label', (value) => matches(value, ENVIRONMENT)],
  ['experiment', (value) => matches(value, EXPERIMENT_NAME)],
  ['variant', (value) => matches(value, VARIANT_NAME)],
  ['stale', (value) => typeof value === 'boolean'],
];
// Keys of a rendered prompt meta that are allowed but never read
const IGNORED_FIELDS = ['source', 'loadedAt', 'warnings'];

function refuse(path: string): never {
  throw new PromptRuntimeError('invalid-feedback', `Feedback field ${path} is not valid.`);
}

/** Refuse a symbol key and any key that is not allowed, without echoing the key text. */
function checkKeys(value: object, allowed: readonly string[], path: string): void {
  for (const key of Reflect.ownKeys(value)) {
    if (typeof key === 'symbol') refuse(path);
    if (!allowed.includes(key)) {
      throw new PromptRuntimeError('invalid-feedback', 'Feedback has a field that is not allowed.');
    }
  }
}

/**
 * Read the allowed own data properties of a plain object, each descriptor once. No getter runs,
 * so a Proxy or an accessor cannot answer twice.
 */
function ownData(
  value: unknown,
  read: readonly string[],
  ignored: readonly string[],
  path: string
): Map<string, unknown> {
  const proto: unknown = isObject(value) ? Object.getPrototypeOf(value) : undefined;
  if (!isObject(value) || (proto !== Object.prototype && proto !== null)) refuse(path);
  checkKeys(value, [...read, ...ignored], path);
  const data = new Map<string, unknown>();
  for (const key of read) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (descriptor === undefined) continue;
    if (!('value' in descriptor)) refuse(`${path}.${key}`);
    data.set(key, descriptor.value);
  }
  return data;
}

function pick<T>(
  data: Map<string, unknown>,
  key: string,
  path: string,
  ok: (value: unknown) => value is T
): T | undefined {
  const value = data.get(key);
  if (value === undefined) return undefined;
  return ok(value) ? value : refuse(path);
}

const isFlags = (value: unknown): value is number => value === 0 || value === 1;

/** The ref, or undefined for the all-zero ref a no-op API hands out. */
function checkSpan(value: unknown): PromptSpanRef | undefined {
  const data = ownData(value, ['traceId', 'spanId', 'traceFlags'], [], 'span');
  const traceId = pick(data, 'traceId', 'span.traceId', (v): v is string => matches(v, TRACE_ID));
  const spanId = pick(data, 'spanId', 'span.spanId', (v): v is string => matches(v, SPAN_ID));
  const traceFlags = pick(data, 'traceFlags', 'span.traceFlags', isFlags);
  if (traceId === undefined) refuse('span.traceId');
  if (spanId === undefined) refuse('span.spanId');
  if (traceFlags === undefined) refuse('span.traceFlags');
  const noTrace = ZEROS.test(traceId);
  const noSpan = ZEROS.test(spanId);
  if (noTrace && noSpan) return undefined;
  if (noTrace) refuse('span.traceId');
  if (noSpan) refuse('span.spanId');
  return { traceId, spanId, traceFlags };
}

function checkPrompt(value: unknown): MetaFields {
  const keys = PROMPT_FIELDS.map(([key]) => key);
  const data = ownData(value, keys, IGNORED_FIELDS, 'prompt');
  const meta: Record<string, unknown> = {};
  for (const [key, ok] of PROMPT_FIELDS) {
    const field = data.get(key);
    if (field === undefined) continue;
    if (!ok(field)) refuse(`prompt.${key}`);
    meta[key] = field;
  }
  return meta;
}

/**
 * Check a feedback input: plain object, own data properties only, known keys only. It has no
 * free text field, so a `comment` or any other key is refused.
 *
 * @returns The checked values, or undefined when the span ref is all zeros and so there is
 * nothing to attach to
 * @throws {PromptRuntimeError} `invalid-feedback`, naming the field and never its value
 */
export function checkFeedback(input: unknown): CheckedFeedback | undefined {
  const data = ownData(input, ['span', 'name', 'score', 'label', 'prompt'], [], 'feedback');
  const name = pick(data, 'name', 'name', (v): v is string => matches(v, NAME));
  const score = pick(data, 'score', 'score', finite);
  const label = pick(data, 'label', 'label', (v): v is string => matches(v, LABEL));
  if (name === undefined) refuse('name');
  if (score === undefined && label === undefined) refuse('score or label');
  const prompt = data.get('prompt') === undefined ? undefined : checkPrompt(data.get('prompt'));
  const span = checkSpan(data.get('span'));
  return span && { span, name, score, label, prompt };
}
