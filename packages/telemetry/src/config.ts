import { homedir } from 'node:os';
import { join } from 'node:path';
import type { ResolvedTelemetryConfig, TelemetryConfigInput } from './types.js';

export const DEFAULT_TELEMETRY_ENDPOINT = 'https://telemetry.guziak.net/v1/events';

function isDisabled(value: string | undefined): boolean {
  if (value === undefined) {
    return false;
  }
  return ['0', 'false', 'no', 'off'].includes(value.trim().toLowerCase());
}

function isDoNotTrackEnabled(value: string | undefined): boolean {
  if (value === undefined) {
    return false;
  }
  const normalized = value.trim();
  return normalized !== '' && normalized !== '0';
}

function isSecureEndpoint(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.username === '' && url.password === '';
  } catch {
    return false;
  }
}

export function resolveTelemetryConfig(input: TelemetryConfigInput = {}): ResolvedTelemetryConfig {
  const environment = input.environment ?? process.env;
  const endpoint =
    input.endpoint ?? environment['PROMPTSCRIPT_TELEMETRY_ENDPOINT'] ?? DEFAULT_TELEMETRY_ENDPOINT;
  const vetoes: string[] = [];

  if (isDoNotTrackEnabled(environment['DO_NOT_TRACK'])) {
    vetoes.push('DO_NOT_TRACK');
  }
  if (isDisabled(environment['PROMPTSCRIPT_TELEMETRY'])) {
    vetoes.push('PROMPTSCRIPT_TELEMETRY');
  }
  if (input.userEnabled === false) {
    vetoes.push('user config');
  }
  if (input.projectEnabled === false) {
    vetoes.push('project config');
  }
  if (input.configurationValid === false) {
    vetoes.push('configuration unavailable');
  }
  if (!isSecureEndpoint(endpoint)) {
    vetoes.push('insecure endpoint');
  }

  return {
    enabled: vetoes.length === 0,
    endpoint,
    cacheDirectory: input.cacheDirectory ?? join(homedir(), '.promptscript', '.cache'),
    vetoes,
  };
}
