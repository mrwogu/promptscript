import { ErrorCode, PSError } from '../errors/base.js';

function unsupported(kind: string, path: string): PSError {
  return new PSError(
    `Cannot canonicalize ${kind} at ${path || '<root>'}. Use only JSON values with finite numbers.`,
    ErrorCode.INVALID_VALUE
  );
}

const LONE_SURROGATE = /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/;

/** RFC 8785 section 3.2.2.2: a lone surrogate must be an error. */
function quote(text: string, path: string): string {
  if (LONE_SURROGATE.test(text)) throw unsupported('a lone surrogate', path);
  return JSON.stringify(text);
}

function serialize(value: unknown, path: string, ancestors: Set<object>): string {
  switch (typeof value) {
    case 'string':
      return quote(value, path);
    case 'boolean':
      return JSON.stringify(value);
    case 'number':
      if (!Number.isFinite(value)) throw unsupported(`non-finite number (${value})`, path);
      // JSON.stringify uses the ECMAScript number form RFC 8785 asks for
      return JSON.stringify(value);
    case 'object':
      break;
    default:
      throw unsupported(typeof value, path);
  }
  if (value === null) return 'null';
  if (ancestors.has(value)) throw unsupported('a circular reference', path);
  ancestors.add(value);
  try {
    return serializeContainer(value, path, ancestors);
  } finally {
    ancestors.delete(value);
  }
}

function serializeContainer(value: object, path: string, ancestors: Set<object>): string {
  if (Array.isArray(value)) {
    // Array.from visits holes as undefined, which then throws
    const items = Array.from(value, (item: unknown, i) =>
      serialize(item, `${path}[${i}]`, ancestors)
    );
    return '[' + items.join(',') + ']';
  }
  const proto: unknown = Object.getPrototypeOf(value);
  if (proto !== Object.prototype && proto !== null) throw unsupported('a non-plain object', path);
  const record = value as Record<string, unknown>;
  const members: string[] = [];
  // Sort by UTF-16 code units, as RFC 8785 requires
  for (const key of Object.keys(record).sort((a, b) => Number(a > b) - Number(a < b))) {
    const member = record[key];
    if (member === undefined) continue;
    const memberPath = path ? `${path}.${key}` : key;
    members.push(quote(key, memberPath) + ':' + serialize(member, memberPath, ancestors));
  }
  return '{' + members.join(',') + '}';
}

/**
 * Serialize a JSON value as RFC 8785 canonical JSON.
 *
 * No whitespace, object keys sorted by UTF-16 code units, strings and numbers in
 * ECMAScript form. Properties set to `undefined` are skipped. A lone surrogate in a
 * string or key is an error, as RFC 8785 requires.
 *
 * @param value - A JSON value
 * @returns The canonical JSON text
 * @throws PSError for a non-finite number, a bigint, a function, a symbol, an
 *   `undefined` outside an object property, an array hole, a circular reference or
 *   a lone surrogate or an object that is not a plain object (a Date, a Map, a class instance). The message names the path, such as `model.params.temperature`.
 *
 * @example
 * canonicalizeJson({ b: 1, a: [true, null] }); // '{"a":[true,null],"b":1}'
 */
export function canonicalizeJson(value: unknown): string {
  return serialize(value, '', new Set());
}
