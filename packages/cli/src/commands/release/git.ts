import { execFile, type ExecException } from 'node:child_process';
import { statSync } from 'node:fs';
import { win32 } from 'node:path';
import { DEFAULT_GIT_TIMEOUT_MS, GIT_TIMEOUT_ENV_VAR } from '@promptscript/resolver';
import { PS5006_ROLLBACK_UNAVAILABLE, ReleaseError } from './errors.js';

const MAX_GIT_OUTPUT_BYTES = 1024 * 1024;
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
 * literal pathspecs and no optional index refresh. Paths must follow `--` in `args`.
 * Spawn failures, timeouts and more output than `maxBuffer` bytes (1 MiB by default) throw.
 */
export function runGit(
  args: string[],
  cwd: string,
  { maxBuffer = MAX_GIT_OUTPUT_BYTES }: { maxBuffer?: number } = {}
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
        env: {
          ...process.env,
          GIT_TERMINAL_PROMPT: '0',
          GIT_PAGER: 'cat',
          GIT_OPTIONAL_LOCKS: '0',
          // Paths are file names, never globs or pathspec magic.
          GIT_LITERAL_PATHSPECS: '1',
        },
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

/** Characters that move or recolor terminal text: C0, DEL, C1 and the bidi controls. */
// eslint-disable-next-line no-control-regex
const TERMINAL_CONTROL_RE = /[\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/g;

/** Remove the characters that could rewrite terminal output, from text Git or a file supplies. */
export function stripControlCharacters(text: string): string {
  return text.replaceAll(TERMINAL_CONTROL_RE, '');
}
