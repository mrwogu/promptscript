import { UNSAFE_KEY } from '../client.js';
import { isObject } from '../load.js';

type Json = Record<string, unknown>;

/** A string of 1 to `max` characters with no control, format, line separator or lone surrogate. */
export const text = (value: unknown, max = 512): value is string =>
  typeof value === 'string' && value.length >= 1 && value.length <= max && !UNSAFE_KEY.test(value);

export const matches = (value: unknown, pattern: RegExp): value is string =>
  typeof value === 'string' && pattern.test(value);

export const finite = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

export const count = (value: unknown): value is number =>
  typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;

// The prompt id pattern of the approval record in core: every segment is a plain name
const PROMPT_ID = /^(?!.*\.\.)(?:@?[A-Za-z\d][\w.-]{0,63}(?<!\.)\/)+[A-Za-z\d][\w-]{0,63}$/;

/** A prompt id with plain name segments, at most 512 characters. */
export const promptId = (value: unknown): value is string =>
  matches(value, PROMPT_ID) && text(value);

/** An own property only: inherited values never count. */
export const own = (object: Json, key: string): unknown =>
  Object.hasOwn(object, key) ? object[key] : undefined;

export { isObject };
