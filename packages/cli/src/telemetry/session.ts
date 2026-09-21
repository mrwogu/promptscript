import type { Command } from 'commander';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  getSpoolInfo,
  isExcludedCommand,
  maybeSpawnFlush,
  readFlushState,
  runFlush,
  runtimeMetadata,
  sanitizeFeature,
  TelemetrySession,
  type FlushSelfInvocation,
  type ResolvedTelemetryConfig,
  type TelemetryOutcome,
} from '@promptscript/telemetry';
import { getRuntimeInfo, getRuntimeVersion } from '../runtime/runtime-info.js';
import { CLI_VERSION } from '../cli-version.js';
import { USER_CONFIG_PATH } from '../config/user-config.js';
import { resolveCliTelemetryConfig } from './config.js';

let activeSession: TelemetrySession | null = null;
let exitHandlerInstalled = false;

export function normalizedCommandName(command: Command): string {
  const name = command.name();
  const parentName = command.parent?.name();
  if (parentName === 'vendor' || parentName === 'skills') {
    return `${parentName}-${name}`;
  }
  if (parentName === 'registry') {
    return 'registry';
  }
  return name;
}

function stringValues(value: unknown): string[] {
  if (typeof value === 'string') {
    return [value];
  }
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string');
  }
  return [];
}

export function commandFeatures(command: Command): string[] {
  const options = command.opts<Record<string, unknown>>();
  const features = new Set<string>();
  const targetValues = [...stringValues(options['target']), ...stringValues(options['targets'])];
  for (const target of targetValues) {
    const feature = sanitizeFeature(`target:${target}`);
    if (feature !== null) {
      features.add(feature);
    }
  }
  if (options['dryRun'] === true) {
    features.add('dry_run');
  }
  if (options['watch'] === true) {
    features.add('watch');
  }
  if (options['strict'] === true) {
    features.add('strict');
  }
  if (options['build'] !== undefined || command.name() === 'build') {
    features.add('build_profile');
  }
  if (process.env['CI'] !== undefined) {
    features.add('ci');
  }
  return [...features];
}

export function exitOutcome(code: number): TelemetryOutcome {
  if (code === 130 || code === 143) {
    return 'cancelled';
  }
  return code === 0 ? 'success' : 'error';
}

function installExitHandler(): void {
  if (exitHandlerInstalled) {
    return;
  }
  process.on('exit', (code) => {
    finishCliTelemetry(exitOutcome(code));
  });
  for (const [signal, fallbackCode] of [
    ['SIGINT', 130],
    ['SIGTERM', 143],
  ] as const) {
    process.once(signal, () => {
      finishCliTelemetry('cancelled');
      if (process.listenerCount(signal) > 0) {
        return;
      }
      try {
        process.kill(process.pid, signal);
      } catch {
        process.exit(fallbackCode);
      }
    });
  }
  exitHandlerInstalled = true;
}

/**
 * Resolve how this process re-executes itself for a background flush.
 *
 * Node spawns its entrypoint as before. A deno compile binary re-executes
 * itself with the hidden flush command. Under `deno run` the published npm
 * package is re-run with scoped permissions: env and sys for the CLI, net
 * only for the collector host, reads on the directories the flush child
 * inspects, and writes only on the telemetry spool.
 */
export function resolveFlushSelfInvocation(
  config: ResolvedTelemetryConfig
): FlushSelfInvocation | undefined {
  const { runtime, standalone } = getRuntimeInfo();
  if (runtime === 'deno') {
    if (standalone) {
      return { executable: process.execPath, prefixArgs: [] };
    }
    const endpointHost = endpointHostOf(config.endpoint);
    if (endpointHost === undefined) return undefined;
    // After bundling, this module lives next to index.js in the package.
    const cliDirectory = dirname(fileURLToPath(import.meta.url));
    const readScopes = [
      process.cwd(),
      dirname(USER_CONFIG_PATH),
      config.cacheDirectory,
      cliDirectory,
    ].join(',');
    return {
      executable: process.execPath,
      prefixArgs: [
        'run',
        '--allow-env',
        '--allow-sys',
        `--allow-net=${endpointHost}`,
        `--allow-read=${readScopes}`,
        `--allow-write=${config.cacheDirectory}`,
        `npm:@promptscript/cli@${CLI_VERSION}`,
      ],
    };
  }
  const entrypoint = process.argv[1];
  if (entrypoint === undefined) return undefined;
  return { executable: process.execPath, prefixArgs: [entrypoint] };
}

function endpointHostOf(endpoint: string): string | undefined {
  try {
    return new URL(endpoint).host;
  } catch {
    return undefined;
  }
}

export async function prepareCliTelemetry(command: Command, appVersion: string): Promise<void> {
  const name = normalizedCommandName(command);
  if (isExcludedCommand(name) || process.env['PROMPTSCRIPT_TELEMETRY_FLUSH'] === '1') {
    return;
  }
  const options = command.opts<Record<string, unknown>>();
  const config = await resolveCliTelemetryConfig({
    ...(typeof options['cwd'] === 'string' ? { cwd: options['cwd'] } : {}),
    ...(typeof options['config'] === 'string' ? { config: options['config'] } : {}),
  });
  maybeSpawnFlush(config, { selfInvocation: resolveFlushSelfInvocation(config) });
  const runtimeInfo = getRuntimeInfo();
  activeSession = new TelemetrySession({
    config,
    metadata: runtimeMetadata(appVersion, { runtimeVersion: getRuntimeVersion() }),
    runtime: runtimeInfo.runtime,
    command: name,
    features: commandFeatures(command),
  });
  installExitHandler();
}

export function finishCliTelemetry(outcome?: TelemetryOutcome): void {
  const session = activeSession;
  activeSession = null;
  session?.finish(
    outcome ?? (process.exitCode === undefined || process.exitCode === 0 ? 'success' : 'error')
  );
}

export async function flushCliTelemetry(): Promise<void> {
  const config = await resolveCliTelemetryConfig();
  await runFlush(config);
}

export async function telemetryStatus(): Promise<{
  config: ResolvedTelemetryConfig;
  spool: ReturnType<typeof getSpoolInfo>;
  state: ReturnType<typeof readFlushState>;
}> {
  const config = await resolveCliTelemetryConfig();
  return {
    config,
    spool: getSpoolInfo(config.cacheDirectory),
    state: readFlushState(config.cacheDirectory),
  };
}
