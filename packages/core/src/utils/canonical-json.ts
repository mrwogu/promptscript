import { ErrorCode, PSError } from '../errors/base.js';

function unsupported(kind: string, path: string): PSError {
  return new PSError(
    `Cannot canonicalize ${kind} at ${path || '<root>'}. Use only JSON values with finite numbers.`,
    ErrorCode.INVALID_VALUE
  );
}

function serialize(value: unknown, path: string): string {
  switch (typeof value) {
    case 'string':
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
  if (Array.isArray(value)) {
    return `[${value.map((item, i) => serialize(item, `${path}[${i}]`)).join(',')}]`;
  }
  const record = value as Record<string, unknown>;
  const members: string[] = [];
  // Default sort order compares UTF-16 code units, as RFC 8785 requires
  for (const key of Object.keys(record).sort()) {
    const member = record[key];
    if (member === undefined) continue;
    members.push(`${JSON.stringify(key)}:${serialize(member, path ? `${path}.${key}` : key)}`);
  }
  return `{${members.join(',')}}`;
}

/**
 * Serialize a JSON value as RFC 8785 canonical JSON.
 *
 * No whitespace, object keys sorted by UTF-16 code units, strings and numbers in
 * ECMAScript form. Properties set to `undefined` are skipped.
 *
 * @param value - A JSON value
 * @returns The canonical JSON text
 * @throws PSError for a non-finite number, a bigint, a function, a symbol or an
 *   `undefined` outside an object property. The message names the path, such as `model.params.temperature`.
 *
 * @example
 * canonicalizeJson({ b: 1, a: [true, null] }); // '{"a":[true,null],"b":1}'
 */
export function canonicalizeJson(value: unknown): string {
  return serialize(value, '');
}
