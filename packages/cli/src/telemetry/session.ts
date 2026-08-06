import type { Command } from 'commander';
import {
  getSpoolInfo,
  isExcludedCommand,
  maybeSpawnFlush,
  readFlushState,
  runFlush,
  runtimeMetadata,
  sanitizeFeature,
  TelemetrySession,
  type ResolvedTelemetryConfig,
  type TelemetryOutcome,
} from '@promptscript/telemetry';
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
  maybeSpawnFlush(config);
  activeSession = new TelemetrySession({
    config,
    metadata: runtimeMetadata(appVersion),
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
