import { spawn } from 'node:child_process';
import { performance } from 'node:perf_hooks';
import { appendSpoolRecords, getSpoolInfo, readFlushState } from './spool.js';
import { isExcludedCommand, sanitizeCommand, sanitizeFeature } from './schema.js';
import type {
  ResolvedTelemetryConfig,
  RuntimeMetadata,
  SpoolRecord,
  TelemetryOutcome,
} from './types.js';

const FLUSH_INTERVAL_MS = 4 * 60 * 60 * 1_000;
const FLUSH_RECORD_THRESHOLD = 50;

export interface TelemetrySessionOptions {
  config: ResolvedTelemetryConfig;
  metadata: RuntimeMetadata;
  command: string;
  features?: string[];
  startTime?: number;
}

export interface DetachedChild {
  unref(): void;
}

export type SpawnDetached = (
  command: string,
  args: string[],
  options: {
    detached: true;
    stdio: 'ignore';
    env: NodeJS.ProcessEnv;
  }
) => DetachedChild;

export class TelemetrySession {
  private readonly config: ResolvedTelemetryConfig;
  private readonly metadata: RuntimeMetadata;
  private readonly command: string;
  private readonly features: string[];
  private readonly startTime: number;
  private readonly excluded: boolean;
  private finished = false;

  public constructor(options: TelemetrySessionOptions) {
    this.config = options.config;
    this.metadata = options.metadata;
    this.excluded = isExcludedCommand(options.command);
    this.command = sanitizeCommand(options.command);
    this.features = (options.features ?? [])
      .map((feature) => sanitizeFeature(feature))
      .filter((feature): feature is string => feature !== null);
    this.startTime = options.startTime ?? performance.now();
  }

  public finish(outcome: TelemetryOutcome): void {
    if (this.finished || !this.config.enabled || this.excluded) {
      return;
    }
    this.finished = true;
    const duration = Math.max(0, Math.round(performance.now() - this.startTime));
    const records: SpoolRecord[] = [
      {
        ...this.metadata,
        event: {
          name: 'command',
          command: this.command,
          outcome,
          count: 1,
          duration_ms_sum: duration,
        },
      },
      ...this.features.map((feature): SpoolRecord => ({
        ...this.metadata,
        event: { name: 'feature', feature, count: 1 },
      })),
    ];
    appendSpoolRecords(this.config.cacheDirectory, records);
  }
}

function shouldFlush(config: ResolvedTelemetryConfig, now: number): boolean {
  const spool = getSpoolInfo(config.cacheDirectory);
  if (spool.records === 0) {
    return false;
  }
  if (spool.records >= FLUSH_RECORD_THRESHOLD) {
    return true;
  }
  const lastAttempt = readFlushState(config.cacheDirectory).lastAttempt;
  if (lastAttempt === undefined) {
    return true;
  }
  const timestamp = Date.parse(lastAttempt);
  return !Number.isFinite(timestamp) || now - timestamp >= FLUSH_INTERVAL_MS;
}

export function maybeSpawnFlush(
  config: ResolvedTelemetryConfig,
  options: {
    executable?: string;
    entrypoint?: string;
    environment?: NodeJS.ProcessEnv;
    now?: number;
    spawn?: SpawnDetached;
  } = {}
): boolean {
  const environment = options.environment ?? process.env;
  const entrypoint = options.entrypoint ?? process.argv[1];
  if (
    !config.enabled ||
    environment['PROMPTSCRIPT_TELEMETRY_FLUSH'] === '1' ||
    entrypoint === undefined ||
    !shouldFlush(config, options.now ?? Date.now())
  ) {
    return false;
  }
  try {
    const child = (options.spawn ?? spawn)(
      options.executable ?? process.execPath,
      [entrypoint, '__telemetry-flush'],
      {
        detached: true,
        stdio: 'ignore',
        env: {
          ...environment,
          PROMPTSCRIPT_TELEMETRY_FLUSH: '1',
          PROMPTSCRIPT_NO_UPDATE_CHECK: '1',
        },
      }
    );
    child.unref();
    return true;
  } catch {
    return false;
  }
}
