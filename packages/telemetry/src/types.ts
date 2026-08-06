export type TelemetryOutcome = 'success' | 'error' | 'cancelled';
export type SendResult = 'sent' | 'unknown' | 'retryable' | 'rejected';

export interface CommandTelemetryEvent {
  name: 'command';
  command: string;
  outcome: TelemetryOutcome;
  count: number;
  duration_ms_sum: number;
}

export interface FeatureTelemetryEvent {
  name: 'feature';
  feature: string;
  count: number;
}

export type TelemetryEvent = CommandTelemetryEvent | FeatureTelemetryEvent;

export interface RuntimeMetadata {
  app_version: string;
  runtime_version: string;
  os: 'darwin' | 'linux' | 'windows' | 'other';
  arch: 'arm64' | 'x86_64' | 'other';
}

export interface SpoolRecord extends RuntimeMetadata {
  event: TelemetryEvent;
}

export interface TelemetryPayload extends RuntimeMetadata {
  schema: 1;
  app: 'promptscript';
  event_schema: 1;
  runtime: 'node';
  events: TelemetryEvent[];
}

export interface TelemetryBatch {
  payload: TelemetryPayload;
  sourceIndexes: number[];
}

export interface TelemetryConfigInput {
  environment?: NodeJS.ProcessEnv;
  userEnabled?: boolean;
  projectEnabled?: boolean;
  configurationValid?: boolean;
  endpoint?: string;
  cacheDirectory?: string;
}

export interface ResolvedTelemetryConfig {
  enabled: boolean;
  endpoint: string;
  cacheDirectory: string;
  vetoes: string[];
}

export interface FlushState {
  lastAttempt?: string;
  lastSuccess?: string;
  lastError?: string;
}

export interface SpoolInfo {
  records: number;
  bytes: number;
}

export interface FlushResult {
  attempted: boolean;
  deliveredRecords: number;
  rejectedRecords: number;
  remainingRecords: number;
}
