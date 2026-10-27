/**
 * Node.js entry of the runtime: a source that reads prompt files from a local directory.
 *
 * @packageDocumentation
 */
import { open, realpath, type FileHandle } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import { PromptLoadError } from './errors.js';
import { assertFilePath, decodeUtf8, DEFAULT_MAX_BYTES } from './paths.js';
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
    const realRoot = await realpath(root);
    const real = await realpath(resolve(realRoot, path));
    if (!real.startsWith(`${realRoot}${sep}`)) {
      throw fail('source-error', 'leads outside the directory.');
    }
    return await open(real, 'r');
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
 * Paths stay below `root`: a symbolic link that leads outside it is refused. Only regular
 * files are read, at most `maxBytes` of them. The directory source sends no ETag, so
 * every pointer refresh reads the file again.
 *
 * @param root - Directory that holds the prompt files
 * @param options - Size limit
 * @returns A source for `createPromptClient`
 *
 * @example
 * const client = createPromptClient({
 *   source: directorySource('.promptscript/releases'),
 *   label: 'prod',
 * });
 */
export function directorySource(root: string, options: DirectorySourceOptions = {}): PromptSource {
  const name = resolve(root);
  const maxBytes = options.maxBytes ?? DEFAULT_MAX_BYTES;
  return { name, read: (path) => readBelow(name, path, maxBytes) };
}
