import { PromptLoadError } from './errors.js';

/** Largest file a source accepts by default: 1 MiB. */
export const DEFAULT_MAX_BYTES = 1_048_576;

const SEGMENT = /^\w[\w.-]*$/;

/**
 * Check a prompt file path: one or two plain segments, the last ending in `.json`.
 * Refuses `..`, absolute paths, hidden names and separators other than `/`.
 *
 * @param path - Path relative to the source root
 * @param listedIn - The pointer file that listed the path, named in the error
 * @throws {PromptLoadError} `invalid-index`
 */
export function assertFilePath(path: string, listedIn?: string): void {
  const segments = path.split('/');
  if (segments.length <= 2 && segments.every((s) => SEGMENT.test(s)) && path.endsWith('.json')) {
    return;
  }
  const where = listedIn
    ? `${listedIn} lists an invalid prompt file path`
    : 'Invalid prompt file path';
  throw new PromptLoadError(
    'invalid-index',
    `${where}. A path has one or two plain segments and ends in .json.`,
    listedIn
  );
}

/**
 * Check a numeric option when it is set. `Number()` of an unset environment variable is
 * `NaN`, which would turn a size cap, a cache bound or a refresh off without a word.
 *
 * @param name - Option name, used in the error
 * @param value - The value to check
 * @param min - Smallest allowed value
 * @returns The value
 * @throws {RangeError} when the value is not a whole number of `min` or more
 */
export function wholeNumber(name: string, value: number, min: 0 | 1): number {
  if (Number.isSafeInteger(value) && value >= min) return value;
  throw new RangeError(`${name} must be a whole number of ${min} or more.`);
}

/** Decode UTF-8 strictly, so a broken file never turns into replacement characters. */
export function decodeUtf8(bytes: Uint8Array, where: string, path: string): string {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    throw new PromptLoadError('source-error', `${where} is not valid UTF-8.`, path);
  }
}
