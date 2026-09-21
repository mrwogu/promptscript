/**
 * Resolves how this process can re-execute itself.
 *
 * Guarded filesystem operations (managed output cleanup) must run in a
 * child process pinned to the verified output directory. How that child is
 * spawned depends on the runtime:
 * - Node: `node <worker module> <hidden command> ...`
 * - Deno standalone binary: re-execute the binary itself with the hidden
 *   command (`process.execPath` is the compiled binary).
 * - `deno run`: `deno run <minimal flags> <worker module> <hidden command> ...`
 *
 * When no invocation can be resolved, callers must fail closed and leave
 * the guarded work undone.
 */
import { getRuntimeInfo } from './runtime-info.js';

/** How to spawn this program again: executable plus argv prefix. */
export interface SelfInvocation {
  /** Executable to spawn. */
  executable: string;
  /** Arguments placed before the hidden command and operation arguments. */
  prefixArgs: string[];
}

/** Options for resolving a self-invocation. */
export interface SelfInvocationOptions {
  /**
   * Absolute path of the managed output worker module (bundled .js in
   * published layouts, source .ts in development). Not needed when the
   * process is a Deno standalone binary, which re-executes itself instead.
   */
  workerPath: string | undefined;
}

/**
 * Flags for spawning the worker under `deno run`.
 *
 * Scoped to the spawned process cwd (the verified output directory): the
 * worker only inspects and modifies that directory. `--no-config` and
 * `--no-lock` keep the child from reading a user deno.json or writing a
 * lockfile into the output directory it runs in.
 */
const DENO_WORKER_FLAGS = [
  '--no-config',
  '--no-lock',
  '--allow-read=.',
  '--allow-write=.',
] as const;

const NODE_LOADER_FLAGS = new Set(['--import', '--loader', '--experimental-loader']);

function getNodeLoaderArgs(args: readonly string[]): string[] {
  const loaderArgs: string[] = [];
  for (let index = 0; index < args.length; index++) {
    const arg = args[index]!;
    if (NODE_LOADER_FLAGS.has(arg)) {
      const value = args[index + 1];
      if (value !== undefined) {
        loaderArgs.push(arg, value);
        index++;
      }
      continue;
    }
    if ([...NODE_LOADER_FLAGS].some((flag) => arg.startsWith(`${flag}=`))) {
      loaderArgs.push(arg);
    }
  }
  return loaderArgs;
}

/**
 * Resolve how to re-execute this program, or undefined when no safe
 * self-invocation exists (callers must then fail closed).
 */
export function resolveSelfInvocation(options: SelfInvocationOptions): SelfInvocation | undefined {
  const { runtime, standalone } = getRuntimeInfo();

  if (runtime === 'deno') {
    if (standalone) {
      // The compiled binary contains the worker dispatch; re-execute it.
      return { executable: process.execPath, prefixArgs: [] };
    }
    if (options.workerPath === undefined) return undefined;
    return {
      executable: process.execPath,
      prefixArgs: ['run', ...DENO_WORKER_FLAGS, options.workerPath],
    };
  }

  if (options.workerPath === undefined) return undefined;
  return {
    executable: process.execPath,
    prefixArgs: [...getNodeLoaderArgs(process.execArgv), options.workerPath],
  };
}
