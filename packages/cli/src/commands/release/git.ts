import { execFile, spawn, type ExecException } from 'node:child_process';
import { statSync } from 'node:fs';
import { win32 } from 'node:path';
import { DEFAULT_GIT_TIMEOUT_MS, GIT_TIMEOUT_ENV_VAR } from '@promptscript/resolver';
import { PS5006_ROLLBACK_UNAVAILABLE, ReleaseError } from './errors.js';

const MAX_GIT_OUTPUT_BYTES = 1024 * 1024;
/** A path below a device, which no file can have, so Git reads no grafts. */
const NO_GRAFT_FILE =
  process.platform === 'win32'
    ? String.raw`\\.\NUL\promptscript-no-grafts`
    : '/dev/null/promptscript-no-grafts';
/** Names of the Git binary that Windows runs for `git`. */
const WINDOWS_GIT_NAMES = ['git.exe', 'git.com'];

/** Read a positive finite timeout (ms) from PROMPTSCRIPT_GIT_TIMEOUT. */
function gitTimeout(): number {
  const raw = process.env[GIT_TIMEOUT_ENV_VAR];
  if (raw === undefined || raw.trim() === '') {
    return DEFAULT_GIT_TIMEOUT_MS;
  }
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_GIT_TIMEOUT_MS;
}

function isFile(path: string): boolean {
  try {
    return statSync(path).isFile();
  } catch {
    return false;
  }
}

/**
 * The absolute path of Git on Windows, from the absolute entries of PATH only. Windows
 * looks in the child's working directory, the user's checkout, before PATH, so a
 * committed `git.exe` would run if the command name were passed as is.
 */
export function resolveWindowsGit(
  pathValue: string | undefined,
  exists: (path: string) => boolean = isFile
): string | undefined {
  for (const entry of (pathValue ?? '').split(';')) {
    const directory = entry.trim().replaceAll('"', '');
    if (!win32.isAbsolute(directory)) continue;
    const found = WINDOWS_GIT_NAMES.map((name) => win32.join(directory, name)).find(exists);
    if (found !== undefined) return found;
  }
  return undefined;
}

let windowsGit: string | undefined;

/** The command to run: `git` from PATH, or on Windows its absolute path. */
function gitCommand(): string {
  if (process.platform !== 'win32') return 'git';
  windowsGit ??= resolveWindowsGit(process.env['PATH']);
  if (windowsGit === undefined) {
    throw new ReleaseError(
      PS5006_ROLLBACK_UNAVAILABLE,
      'git was not found in any absolute PATH entry. Install Git and run the command again.'
    );
  }
  return windowsGit;
}

/** The environment Git runs with: no prompts, no pager, no optional locks. */
function gitEnvironment(): NodeJS.ProcessEnv {
  return {
    ...process.env,
    GIT_TERMINAL_PROMPT: '0',
    GIT_PAGER: 'cat',
    GIT_OPTIONAL_LOCKS: '0',
    // Paths are file names, never globs or pathspec magic.
    GIT_LITERAL_PATHSPECS: '1',
    // A replace ref must not change what a commit holds, and a partial clone must not
    // fetch from the network.
    GIT_NO_REPLACE_OBJECTS: '1',
    GIT_NO_LAZY_FETCH: '1',
    // Nor may a grafts file in .git/info cut or rewrite the history.
    GIT_GRAFT_FILE: NO_GRAFT_FILE,
  };
}

/** The environment with `overrides` applied; an undefined value removes the variable. */
function withOverrides(
  base: NodeJS.ProcessEnv,
  overrides: Readonly<Record<string, string | undefined>> = {}
): NodeJS.ProcessEnv {
  const env = { ...base };
  for (const [name, value] of Object.entries(overrides)) {
    if (value === undefined) delete env[name];
    else env[name] = value;
  }
  return env;
}

export interface GitResult {
  stdout: string;
  stderr: string;
  /** Exit status; a non-zero status is returned, not thrown */
  status: number;
}

/** What a Git failure that is no exit status means, and what to do about it. */
function failureDetail(args: string[], error: ExecException, maxBuffer: number): string {
  if (error.code === 'ENOENT') {
    return 'git is not installed or not on PATH. Install Git and run the command again.';
  }
  if (error.code === 'ERR_CHILD_PROCESS_STDIO_MAXBUFFER') {
    return `git ${args[0]} printed more than ${maxBuffer} bytes, more than this command reads. Remove what the repository no longer needs and run the command again.`;
  }
  return `git ${args[0]} failed: ${stripControlCharacters(error.message)}. Check PROMPTSCRIPT_GIT_TIMEOUT and run the command again.`;
}

/**
 * Run Git in the project with an argument array, no prompts, no pager, no fsmonitor hook,
 * literal pathspecs and no optional index refresh. Paths must follow `--` in `args`. `env`
 * overrides single variables of that environment; an undefined value removes one.
 * Spawn failures, timeouts and more output than `maxBuffer` bytes (1 MiB by default) throw.
 */
export function runGit(
  args: string[],
  cwd: string,
  {
    maxBuffer = MAX_GIT_OUTPUT_BYTES,
    env: overrides,
  }: { maxBuffer?: number; env?: Readonly<Record<string, string | undefined>> } = {}
): Promise<GitResult> {
  return new Promise((resolvePromise, reject) => {
    execFile(
      // The user's own Git is the one to run, on their own checkout; Windows gets an absolute path.
      gitCommand(), // NOSONAR
      ['-c', 'core.fsmonitor=false', ...args],
      {
        cwd,
        timeout: gitTimeout(),
        maxBuffer,
        encoding: 'utf-8',
        env: withOverrides(gitEnvironment(), overrides),
      },
      (error, stdout, stderr) => {
        if (error && typeof error.code === 'number') {
          resolvePromise({ stdout, stderr, status: error.code });
          return;
        }
        if (error) {
          const detail = failureDetail(args, error, maxBuffer);
          reject(new ReleaseError(PS5006_ROLLBACK_UNAVAILABLE, detail, undefined, error));
          return;
        }
        resolvePromise({ stdout, stderr, status: 0 });
      }
    );
  });
}

/** Blobs read with one `git cat-file --batch`, by the id asked for. */
export interface BlobBatch {
  /** Content of each blob of at most `maxBytes` bytes */
  blobs: Map<string, Buffer>;
  /** Blobs larger than `maxBytes`, whose content is not kept */
  tooLarge: Set<string>;
  /** Ids Git has no blob for */
  missing: Set<string>;
}

/** Longest header line `git cat-file --batch` prints: an id, a type and a size. */
const MAX_BATCH_HEADER_BYTES = 256;
const BLOB_ID_RE = /^(?:[0-9a-f]{40}|[0-9a-f]{64})$/;
const BATCH_HEADER_RE = /^([0-9a-f]{40}|[0-9a-f]{64}) ([a-z]+) (\d+)$/;
const BATCH_MISSING_RE = /^(\S+) (?:missing|ambiguous)$/;

/**
 * Parser of `git cat-file --batch` output: `<id> <type> <size>\n<content>\n` per object,
 * or `<id> missing\n`. Content is framed by its size, never by lines, so a record may hold
 * any bytes. An object that is no blob counts as missing. With `asked`, an answer for any
 * other id throws.
 */
export class CatFileBatchParser {
  readonly result: BlobBatch = { blobs: new Map(), tooLarge: new Set(), missing: new Set() };
  private buffered: Buffer = Buffer.alloc(0);
  private current:
    { id: string; blob: boolean; remaining: number; kept: Buffer[] | undefined } | undefined;

  constructor(
    private readonly maxBytes: number,
    private readonly asked?: ReadonlySet<string>
  ) {}

  /** Take the next chunk of output. Output Git does not print throws. */
  push(chunk: Buffer): void {
    this.buffered = this.buffered.length === 0 ? chunk : Buffer.concat([this.buffered, chunk]);
    while (this.current === undefined ? this.header() : this.content()) {
      // Each step takes one header or one piece of content.
    }
  }

  /** The output ended; an object cut short throws. */
  finish(): BlobBatch {
    if (this.current !== undefined || this.buffered.length > 0) {
      throw new Error('the output ended in the middle of an object');
    }
    return this.result;
  }

  private header(): boolean {
    const end = this.buffered.indexOf(0x0a);
    if (end === -1) {
      if (this.buffered.length > MAX_BATCH_HEADER_BYTES) throw new Error('a header is too long');
      return false;
    }
    const line = this.buffered.subarray(0, end).toString('utf-8');
    this.buffered = this.buffered.subarray(end + 1);
    const missing = BATCH_MISSING_RE.exec(line);
    if (missing?.[1] !== undefined) {
      this.result.missing.add(this.askedFor(missing[1]));
      return true;
    }
    const [, id, type, size] = BATCH_HEADER_RE.exec(line) ?? [];
    if (id === undefined || type === undefined || size === undefined) {
      throw new Error(`unexpected header "${stripControlCharacters(line)}"`);
    }
    this.askedFor(id);
    const bytes = Number(size);
    const blob = type === 'blob';
    // The content and the line feed after it.
    this.current = {
      id,
      blob,
      remaining: bytes + 1,
      kept: blob && bytes <= this.maxBytes ? [] : undefined,
    };
    return true;
  }

  private askedFor(id: string): string {
    if (this.asked !== undefined && !this.asked.has(id)) {
      throw new Error(`an answer for ${stripControlCharacters(id)}, which was not asked for`);
    }
    return id;
  }

  private content(): boolean {
    const current = this.current;
    if (current === undefined || this.buffered.length === 0) return false;
    const taken = Math.min(current.remaining, this.buffered.length);
    current.kept?.push(this.buffered.subarray(0, taken));
    current.remaining -= taken;
    const last = this.buffered[taken - 1];
    this.buffered = this.buffered.subarray(taken);
    if (current.remaining > 0) return true;
    if (last !== 0x0a) throw new Error(`object ${current.id} does not end with a line feed`);
    this.current = undefined;
    if (!current.blob) {
      this.result.missing.add(current.id);
    } else if (current.kept === undefined) {
      this.result.tooLarge.add(current.id);
    } else {
      const content = Buffer.concat(current.kept);
      this.result.blobs.set(current.id, content.subarray(0, -1));
    }
    return true;
  }
}

/**
 * Read blobs by id with one `git cat-file --batch`, in the environment of {@link runGit} and
 * under the same timeout. Ids go to stdin, so no id is an argument. A spawn failure, a
 * timeout, a non-zero exit, output Git does not print or an id with no answer throws:
 * a caller never takes a blob it could not read as one that is not there.
 */
export function readBlobs(
  ids: readonly string[],
  cwd: string,
  { maxBytes }: { maxBytes: number }
): Promise<BlobBatch> {
  const asked = [...new Set(ids)];
  const malformed = asked.find((id) => !BLOB_ID_RE.test(id));
  if (malformed !== undefined) {
    // An id is one line of stdin; anything else would ask Git for something else.
    return Promise.reject(
      new ReleaseError(
        PS5006_ROLLBACK_UNAVAILABLE,
        `"${stripControlCharacters(malformed)}" is not a Git object id.`
      )
    );
  }
  if (asked.length === 0) {
    return Promise.resolve({ blobs: new Map(), tooLarge: new Set(), missing: new Set() });
  }
  return new Promise((resolvePromise, reject) => {
    const parser = new CatFileBatchParser(maxBytes, new Set(asked));
    let stderr = '';
    let settled = false;
    const refuse = (error: ReleaseError): void => {
      if (settled) return;
      settled = true;
      // A grandchild that holds the pipes must not keep this waiting.
      child.stdout.destroy();
      child.stderr.destroy();
      reject(error);
    };
    const fail = (detail: string, cause?: Error): void => {
      refuse(
        new ReleaseError(
          PS5006_ROLLBACK_UNAVAILABLE,
          `git cat-file --batch failed: ${stripControlCharacters(detail)}.`,
          undefined,
          cause
        )
      );
    };
    const child = spawn(
      // The user's own Git is the one to run, on their own checkout; Windows gets an absolute path.
      gitCommand(), // NOSONAR
      ['-c', 'core.fsmonitor=false', 'cat-file', '--batch'],
      { cwd, timeout: gitTimeout(), env: gitEnvironment(), stdio: ['pipe', 'pipe', 'pipe'] }
    );
    child.on('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'ENOENT') {
        refuse(
          new ReleaseError(
            PS5006_ROLLBACK_UNAVAILABLE,
            'git is not installed or not on PATH. Install Git and run the command again.',
            undefined,
            error
          )
        );
      } else {
        fail(error.message, error);
        child.kill();
      }
    });
    // Git that exits early closes stdin; the exit status says why.
    child.stdin.on('error', () => undefined);
    child.stdout.on('data', (chunk: Buffer) => {
      // A refused read destroys stdout, so no chunk comes after it.
      try {
        parser.push(chunk);
      } catch (error) {
        fail(errorMessage(error));
        child.kill();
      }
    });
    child.stderr.on('data', (chunk: Buffer) => {
      if (stderr.length < MAX_GIT_OUTPUT_BYTES) stderr += chunk.toString('utf-8');
    });
    child.on('exit', (_status, signal) => {
      if (signal !== null) {
        fail(
          `git was stopped with ${signal}, after the timeout or by another process. Check PROMPTSCRIPT_GIT_TIMEOUT and run the command again`
        );
      }
    });
    child.on('close', (status) => {
      if (settled) return;
      if (status !== 0) {
        fail(stderr.trim() === '' ? `exit status ${status}` : stderr.trim());
        return;
      }
      try {
        const result = parser.finish();
        const unanswered = asked.filter(
          (id) => !result.blobs.has(id) && !result.tooLarge.has(id) && !result.missing.has(id)
        );
        if (unanswered.length > 0) {
          const more = unanswered.length > 1 ? ` and ${unanswered.length - 1} more` : '';
          throw new Error(`no answer for ${unanswered[0]}${more}`);
        }
        settled = true;
        resolvePromise(result);
      } catch (error) {
        fail(errorMessage(error));
      }
    });
    child.stdin.end(`${asked.join('\n')}\n`);
  });
}

/** The message of a thrown value, which need not be an Error. */
export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Characters that move, recolor or hide terminal text: C0, DEL, C1, the bidi controls and
 * marks, zero-width characters, line and paragraph separators, word joiner and BOM.
 */
const TERMINAL_CONTROL_RE =
  // eslint-disable-next-line no-control-regex
  /[\u0000-\u001f\u007f-\u009f\u061c\u200b-\u200f\u2028\u2029\u202a-\u202e\u2060\u2066-\u2069\ufeff]/g;

/** Remove the characters that could rewrite terminal output, from text Git or a file supplies. */
export function stripControlCharacters(text: string): string {
  return text.replaceAll(TERMINAL_CONTROL_RE, '');
}
