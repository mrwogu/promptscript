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
import { createRequire } from 'node:module';
import { isAbsolute, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
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

const NODE_LOADER_FLAGS = ['--import', '--loader', '--experimental-loader'] as const;

const PATH_LIKE_SPECIFIER = /^\.{1,2}[/\\]/;
const URL_SPECIFIER = /^[a-z][a-z\d+\-.]*:/i;

/**
 * Pin a loader specifier to an absolute URL the child can resolve.
 *
 * The worker child runs with its cwd set to the verified output directory, and
 * Node resolves both bare and relative loader specifiers from the cwd. Passing
 * the parent's value through unchanged therefore fails with
 * ERR_MODULE_NOT_FOUND in every output directory that has no node_modules
 * chain reaching the loader, which silently turns guarded rewrites, creates,
 * and mkdirs into no-ops. Resolving here keeps the child on the same loader
 * the parent is running.
 */
function resolveLoaderValue(value: string): string {
  if (URL_SPECIFIER.test(value)) return value;
  if (isAbsolute(value)) return pathToFileURL(value).href;
  if (PATH_LIKE_SPECIFIER.test(value)) return pathToFileURL(resolve(process.cwd(), value)).href;
  // Not resolvable from this installation (a virtual specifier, or a loader
  // only the parent cwd can see): forwarding the original value is still
  // better than dropping the loader.
  return resolveBareLoaderSpecifier(value) ?? value;
}

interface ImportMetaResolver {
  resolve?: (specifier: string) => string;
}

/**
 * Resolve a bare loader specifier to a URL, or undefined when it cannot be
 * resolved from this installation.
 *
 * `import.meta.resolve` honors the import condition, which loader entry points
 * usually rely on: `@swc-node/register/esm-register`, for one, exports only an
 * `import` condition and is invisible to the CommonJS resolver. That resolver
 * still covers the older runtimes where `import.meta.resolve` is absent.
 */
function resolveBareLoaderSpecifier(value: string): string | undefined {
  const resolveFromModule = (import.meta as ImportMetaResolver).resolve;
  if (resolveFromModule !== undefined) {
    try {
      return resolveFromModule(value);
    } catch {
      // Fall through to the CommonJS resolver.
    }
  }
  try {
    return pathToFileURL(createRequire(import.meta.url).resolve(value)).href;
  } catch {
    return undefined;
  }
}

function getNodeLoaderArgs(args: readonly string[]): string[] {
  const loaderArgs: string[] = [];
  for (let index = 0; index < args.length; index++) {
    const arg = args[index]!;
    if ((NODE_LOADER_FLAGS as readonly string[]).includes(arg)) {
      const value = args[index + 1];
      if (value !== undefined) {
        loaderArgs.push(arg, resolveLoaderValue(value));
        index++;
      }
      continue;
    }
    const inlineFlag = NODE_LOADER_FLAGS.find((flag) => arg.startsWith(`${flag}=`));
    if (inlineFlag !== undefined) {
      loaderArgs.push(`${inlineFlag}=${resolveLoaderValue(arg.slice(inlineFlag.length + 1))}`);
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
