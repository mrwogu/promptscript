import { Buffer } from 'node:buffer';
import { randomBytes } from 'node:crypto';
import { lstat, mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import {
  canonicalizeJson,
  sha256Hex,
  type EvalCacheEntryV1,
  type EvalCacheRequestV1,
} from '@promptscript/core';
import { EVAL_CODES, EvalError } from './errors.js';
import { checkShape, modelParams, number, object, oneOf, rule, text } from './shape.js';

/** Schema URL of a cache entry. */
export const CACHE_ENTRY_SCHEMA = 'https://getpromptscript.dev/schema/eval-cache-entry/v1.json';

const MAX_ENTRY_BYTES = 1024 * 1024;
/** Largest token count an entry or a provider answer may hold. */
export const MAX_TOKENS = 1_000_000_000;
const KEY = /^[0-9a-f]{64}$/;
const HASH = /^sha256-[0-9a-f]{64}$/;

const hash = rule((value) => typeof value === 'string' && HASH.test(value), 'a sha256 hash');
const count = number(0, undefined, true);
const tokens = number(0, MAX_TOKENS, true);
const entryShape = object(
  {
    $schema: oneOf([CACHE_ENTRY_SCHEMA]),
    key: rule((value) => typeof value === 'string' && KEY.test(value), 'a cache key'),
    request: object(
      {
        contentHash: hash,
        inputsHash: hash,
        modelRef: text,
        provider: text,
        apiId: text,
        params: modelParams,
        sample: count,
      },
      ['contentHash', 'inputsHash', 'modelRef', 'provider', 'apiId', 'params', 'sample']
    ),
    response: object(
      {
        text,
        usage: object({ inputTokens: tokens, outputTokens: tokens }, [
          'inputTokens',
          'outputTokens',
        ]),
        latencyMs: count,
        status: number(100, 599, true),
        stopReason: text,
      },
      ['text', 'usage', 'latencyMs', 'status']
    ),
  },
  ['$schema', 'key', 'request', 'response']
);

/** A cache read: the entry with its raw file bytes, or a miss. */
export type CacheRead =
  { found: true; entry: EvalCacheEntryV1; bytes: Buffer } | { found: false; invalid: boolean };

/**
 * Cache key of a request: the SHA-256 of its RFC 8785 canonical JSON, so key
 * order never matters and any changed field gives a new key.
 *
 * @param request - The request the entry answers
 * @returns 64 lowercase hex characters
 */
export function cacheKey(request: EvalCacheRequestV1): string {
  return sha256Hex(canonicalizeJson(request));
}

/**
 * Hash of the case inputs for a cache request: the inputs after defaults,
 * as canonical JSON.
 *
 * @param inputs - Input values by name
 * @returns `sha256-` plus 64 hex characters
 */
export function inputsHash(inputs: Readonly<Record<string, unknown>>): string {
  return `sha256-${sha256Hex(canonicalizeJson(inputs))}`;
}

/** The bytes of an entry file: two-space JSON in schema key order and a newline. */
export function entryText(entry: EvalCacheEntryV1): string {
  return `${JSON.stringify(entry, null, 2)}\n`;
}

function treeError(path: string): EvalError {
  return new EvalError(
    `The eval cache holds ${path}, which is not a plain directory or file; remove it and record again.`,
    EVAL_CODES.CACHE_TREE_INVALID
  );
}

async function lstatOrMissing(
  path: string
): Promise<Awaited<ReturnType<typeof lstat>> | undefined> {
  try {
    return await lstat(path);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return undefined;
    throw error;
  }
}

function isEntry(value: unknown, key: string): value is EvalCacheEntryV1 {
  if (checkShape(entryShape, value).length > 0) return false;
  const entry = value as EvalCacheEntryV1;
  return entry.key === key && cacheKey(entry.request) === key;
}

/**
 * Read the entry of a key from `<dir>/<first 2 hex>/<key>.json`. The path is
 * checked with `lstat`, so a symlink or another file type in the tree is an
 * error, never followed. An entry over 1 MiB, one that does not match the
 * schema, or one whose key does not match its file name or its request is a
 * miss with `invalid` set. Other read errors are thrown.
 *
 * @param dir - Real path of the cache directory
 * @param key - Cache key
 * @returns The entry and its bytes, or a miss
 * @throws EvalError `PS6403` when the tree holds something other than plain directories and files
 */
export async function readCacheEntry(dir: string, key: string): Promise<CacheRead> {
  const folder = join(dir, key.slice(0, 2));
  const folderInfo = await lstatOrMissing(folder);
  if (folderInfo === undefined) return { found: false, invalid: false };
  if (!folderInfo.isDirectory()) throw treeError(`${key.slice(0, 2)}/`);

  const file = join(folder, `${key}.json`);
  const info = await lstatOrMissing(file);
  if (info === undefined) return { found: false, invalid: false };
  if (!info.isFile()) throw treeError(`${key.slice(0, 2)}/${key}.json`);
  if (info.size > MAX_ENTRY_BYTES) return { found: false, invalid: true };

  // A read error is not a broken entry: it stops the run instead of paying for a new call
  const bytes = await readFile(file);
  try {
    const value: unknown = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
    return isEntry(value, key)
      ? { found: true, entry: value, bytes }
      : { found: false, invalid: true };
  } catch {
    return { found: false, invalid: true };
  }
}

/**
 * Write an entry atomically: a temporary file in the same directory, then a
 * rename over the old file. The directory of the key prefix must be a plain
 * directory.
 *
 * @param dir - Real path of the cache directory
 * @param entry - Entry to write
 * @returns The bytes written
 * @throws EvalError `PS6405` for an entry over the 1 MiB read cap, which replay would refuse,
 *   or `PS6403` when the key prefix directory is not a plain directory
 */
export async function writeCacheEntry(dir: string, entry: EvalCacheEntryV1): Promise<Buffer> {
  const bytes = Buffer.from(entryText(entry), 'utf8');
  if (bytes.byteLength > MAX_ENTRY_BYTES) {
    throw new EvalError(
      `The entry is over ${MAX_ENTRY_BYTES} bytes, so replay could not read it.`,
      EVAL_CODES.CACHE_ENTRY_TOO_LARGE
    );
  }
  const folder = join(dir, entry.key.slice(0, 2));
  await mkdir(folder, { recursive: true });
  if (!(await lstat(folder)).isDirectory()) throw treeError(`${entry.key.slice(0, 2)}/`);
  const temporary = join(folder, `.${entry.key}.${randomBytes(6).toString('hex')}.tmp`);
  try {
    await writeFile(temporary, bytes, { flag: 'wx' });
    await rename(temporary, join(folder, `${entry.key}.json`));
  } catch (error) {
    await rm(temporary, { force: true });
    throw error;
  }
  return bytes;
}
