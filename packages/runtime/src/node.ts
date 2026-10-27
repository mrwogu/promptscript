/**
 * Node.js entry of the runtime: a source that reads prompt files from a local directory.
 *
 * @packageDocumentation
 */
import { constants, lstat, open, realpath, type FileHandle } from 'node:fs/promises';
import { resolve } from 'node:path';
import { PromptLoadError } from './errors.js';
import { assertFilePath, decodeUtf8, DEFAULT_MAX_BYTES, wholeNumber } from './paths.js';
import type { DirectorySourceOptions, PromptSource, SourceFile } from './types.js';

export type { DirectorySourceOptions } from './types.js';

type Failure = (code: 'source-error' | 'not-found' | 'too-large', why: string) => PromptLoadError;

const errorCode = (error: unknown): unknown =>
  typeof error === 'object' && error !== null ? (error as { code?: unknown }).code : undefined;

/** Fill the buffer from the file; returns the number of bytes read. */
async function fill(file: FileHandle, buffer: Uint8Array, size: number): Promise<number> {
  if (size === buffer.length) return size;
  const { bytesRead } = await file.read(buffer, size, buffer.length - size, null);
  return bytesRead === 0 ? size : fill(file, buffer, size + bytesRead);
}

async function openBelow(root: string, path: string, fail: Failure): Promise<FileHandle> {
  try {
    // The root may be a link, such as a deployment's current release. Below it no link is
    // followed, the same rule as the release commands, so the path cannot leave the root.
    const realRoot = await realpath(root);
    const segments = path.split('/');
    const chain = segments.map((_, index) => resolve(realRoot, ...segments.slice(0, index + 1)));
    // All segments at once, then in path order: a link wins over a missing file behind it
    const entries = await Promise.allSettled(chain.map((entry) => lstat(entry)));
    for (const entry of entries) {
      if (entry.status === 'rejected') throw entry.reason;
      if (entry.value.isSymbolicLink()) throw fail('source-error', 'is a symbolic link.');
    }
    // A plain open() of a FIFO waits for a writer forever. With O_NONBLOCK it returns at
    // once and the fstat in readBelow refuses it. O_NOFOLLOW refuses a file swapped for a
    // link after the check. Windows has neither flag, and no FIFOs.
    const flags = constants.O_RDONLY | (constants.O_NONBLOCK ?? 0) | (constants.O_NOFOLLOW ?? 0);
    return await open(resolve(realRoot, path), flags);
  } catch (error) {
    if (error instanceof PromptLoadError) throw error;
    if (errorCode(error) === 'ENOENT') throw fail('not-found', 'does not exist.');
    throw fail('source-error', 'could not be read.');
  }
}

async function readBelow(root: string, path: string, maxBytes: number): Promise<SourceFile> {
  assertFilePath(path);
  const where = `Prompt file ${path} from ${root}`;
  const fail: Failure = (code, why) => new PromptLoadError(code, `${where} ${why}`, path);
  const file = await openBelow(root, path, fail);
  try {
    const info = await file.stat();
    if (!info.isFile()) throw fail('not-found', 'is not a file.');
    if (info.size > maxBytes) throw fail('too-large', `is larger than ${maxBytes} bytes.`);
    // One byte more than the stat size shows a file that grew while it was read
    const buffer = new Uint8Array(info.size + 1);
    const size = await fill(file, buffer, 0);
    if (size > info.size) throw fail('source-error', 'changed while it was read.');
    return { text: decodeUtf8(buffer.subarray(0, size), where, path) };
  } catch (error) {
    if (error instanceof PromptLoadError) throw error;
    throw fail('source-error', 'could not be read.');
  } finally {
    await file.close();
  }
}

/**
 * A source that reads prompt files from a local directory, such as a release directory
 * checked out with the application.
 *
 * Paths stay below `root`: `root` itself may be a symbolic link, but no link below it is
 * followed, as in the release commands. Only regular files are read, at most `maxBytes`
 * of them. The directory source sends no ETag, so every pointer refresh reads the file
 * again.
 *
 * @param root - Directory that holds the prompt files
 * @param options - Size limit
 * @returns A source for `createPromptClient`
 * @throws {RangeError} when `maxBytes` is not a whole number of 1 or more
 *
 * @example
 * const client = createPromptClient({
 *   source: directorySource('.promptscript/releases'),
 *   label: 'prod',
 * });
 */
export function directorySource(root: string, options: DirectorySourceOptions = {}): PromptSource {
  const name = resolve(root);
  const maxBytes = wholeNumber('maxBytes', options.maxBytes ?? DEFAULT_MAX_BYTES, 1);
  return { name, read: (path) => readBelow(name, path, maxBytes) };
}
