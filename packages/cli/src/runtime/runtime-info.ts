/**
 * Runtime detection for the CLI.
 *
 * The CLI runs on Node.js and, since issue #486, on Deno - both through
 * `deno run npm:@promptscript/cli` and as a `deno compile` standalone binary.
 * Callers branch on this information to decide how to re-execute this
 * process (see self-invocation.ts) and which runtime to report in telemetry.
 */

/** JavaScript runtime hosting the current process. */
export type RuntimeKind = 'node' | 'deno';

/** Detected properties of the current runtime. */
export interface RuntimeInfo {
  /** Runtime hosting this process. */
  runtime: RuntimeKind;
  /**
   * True when running as a `deno compile` standalone binary. Compiled
   * binaries have no filesystem-backed module graph: `import.meta.url`
   * points at an embedded virtual path and there is no package directory.
   */
  standalone: boolean;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

interface DenoNamespace {
  build: Record<string, unknown>;
  version?: unknown;
}

/**
 * Type guard for the Deno namespace without depending on Deno type
 * definitions (the CLI bundles no @types/deno).
 */
function isDenoNamespace(value: unknown): value is DenoNamespace {
  return isRecord(value) && isRecord(value['build']);
}

function getDenoNamespace(): DenoNamespace | undefined {
  const denoCandidate: unknown =
    'Deno' in globalThis ? (globalThis as { Deno?: unknown }).Deno : undefined;
  return isDenoNamespace(denoCandidate) ? denoCandidate : undefined;
}

/**
 * Detect the current runtime and, under Deno, whether the process is a
 * compiled standalone binary (`Deno.build.standalone`).
 */
export function getRuntimeInfo(): RuntimeInfo {
  const denoNamespace = getDenoNamespace();
  if (denoNamespace !== undefined) {
    return { runtime: 'deno', standalone: denoNamespace.build['standalone'] === true };
  }
  return { runtime: 'node', standalone: false };
}

/** Report the full version of the runtime hosting this process. */
export function getRuntimeVersion(): string {
  const denoNamespace = getDenoNamespace();
  if (denoNamespace === undefined) {
    return process.versions.node;
  }
  return isRecord(denoNamespace.version) && typeof denoNamespace.version['deno'] === 'string'
    ? denoNamespace.version['deno']
    : '0';
}
