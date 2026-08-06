import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import {
  isTelemetryOutcome,
  MAX_DURATION_SUM_MS,
  MAX_EVENT_COUNT,
  sanitizeCommand,
  sanitizeFeature,
} from './schema.js';
import type { FlushState, SpoolInfo, SpoolRecord, TelemetryEvent } from './types.js';

const ACTIVE_FILE = 'telemetry.ndjson';
const INFLIGHT_FILE = 'telemetry.inflight.ndjson';
const QUARANTINE_FILE = 'telemetry-quarantine.ndjson';
const STATE_FILE = 'telemetry-state.json';
const LOCK_DIRECTORY = 'telemetry.lock';
const FLUSH_LOCK_DIRECTORY = 'telemetry-flush.lock';
const SIDECAR_PATTERN = /^telemetry\.\d+\.\d+\.\d+\.ndjson$/;
const MAX_SPOOL_BYTES = 64 * 1024;
const MAX_SPOOL_RECORDS = 200;
const STALE_LOCK_MS = 30_000;
let sidecarSequence = 0;

export interface SpoolClaim {
  records: SpoolRecord[];
  corruptLines: number;
}

function pathFor(cacheDirectory: string, name: string): string {
  return join(cacheDirectory, name);
}

function isNodeError(error: unknown, code: string): boolean {
  return error instanceof Error && 'code' in error && error.code === code;
}

function removeStaleLock(lockPath: string): void {
  try {
    if (Date.now() - statSync(lockPath).mtimeMs > STALE_LOCK_MS) {
      rmSync(lockPath, { recursive: true });
    }
  } catch {
    // Another process may remove the lock between stat and cleanup.
  }
}

function acquireLock(cacheDirectory: string, lockDirectory: string = LOCK_DIRECTORY): boolean {
  mkdirSync(cacheDirectory, { recursive: true });
  const lockPath = pathFor(cacheDirectory, lockDirectory);
  try {
    mkdirSync(lockPath);
    return true;
  } catch (error) {
    if (!isNodeError(error, 'EEXIST')) {
      return false;
    }
    removeStaleLock(lockPath);
    try {
      mkdirSync(lockPath);
      return true;
    } catch {
      return false;
    }
  }
}

function releaseLock(cacheDirectory: string, lockDirectory: string = LOCK_DIRECTORY): void {
  try {
    rmSync(pathFor(cacheDirectory, lockDirectory), { recursive: true });
  } catch {
    // Best effort only. Stale-lock recovery handles interrupted cleanup.
  }
}

function compactLines(lines: string[]): string[] {
  const selected: string[] = [];
  let bytes = 0;
  for (let index = lines.length - 1; index >= 0; index -= 1) {
    const line = lines[index];
    if (line === undefined || line === '') {
      continue;
    }
    const lineBytes = Buffer.byteLength(`${line}\n`);
    if (selected.length >= MAX_SPOOL_RECORDS || bytes + lineBytes > MAX_SPOOL_BYTES) {
      break;
    }
    selected.push(line);
    bytes += lineBytes;
  }
  return selected.reverse();
}

function readLines(filePath: string): string[] {
  try {
    return readFileSync(filePath, 'utf8').split('\n').filter(Boolean);
  } catch {
    return [];
  }
}

function writeLines(filePath: string, lines: string[]): void {
  if (lines.length === 0) {
    try {
      unlinkSync(filePath);
    } catch (error) {
      if (!isNodeError(error, 'ENOENT')) {
        throw error;
      }
    }
    return;
  }
  const temporaryPath = `${filePath}.${process.pid}.tmp`;
  writeFileSync(temporaryPath, `${lines.join('\n')}\n`, { encoding: 'utf8', mode: 0o600 });
  renameSync(temporaryPath, filePath);
}

function compactFile(filePath: string): void {
  writeLines(filePath, compactLines(readLines(filePath)));
}

function parseTelemetryEvent(value: unknown): TelemetryEvent | null {
  if (typeof value !== 'object' || value === null || !('name' in value)) {
    return null;
  }
  const event = value as Record<string, unknown>;
  if (
    !Number.isSafeInteger(event['count']) ||
    Number(event['count']) < 1 ||
    Number(event['count']) > MAX_EVENT_COUNT
  ) {
    return null;
  }
  const count = Number(event['count']);
  if (event['name'] === 'command') {
    if (
      typeof event['command'] === 'string' &&
      sanitizeCommand(event['command']) === event['command'] &&
      typeof event['outcome'] === 'string' &&
      isTelemetryOutcome(event['outcome']) &&
      typeof event['duration_ms_sum'] === 'number' &&
      Number.isSafeInteger(event['duration_ms_sum']) &&
      event['duration_ms_sum'] >= 0 &&
      event['duration_ms_sum'] <= MAX_DURATION_SUM_MS
    ) {
      return {
        name: 'command',
        command: event['command'],
        outcome: event['outcome'],
        count,
        duration_ms_sum: event['duration_ms_sum'],
      };
    }
    return null;
  }
  if (event['name'] === 'feature' && typeof event['feature'] === 'string') {
    const feature = sanitizeFeature(event['feature']);
    return feature === null ? null : { name: 'feature', feature, count };
  }
  return null;
}

function parseRecord(line: string): SpoolRecord | null {
  try {
    const value: unknown = JSON.parse(line);
    if (typeof value !== 'object' || value === null || !('event' in value)) {
      return null;
    }
    const record = value as Record<string, unknown>;
    const event = parseTelemetryEvent(record['event']);
    if (
      typeof record['app_version'] !== 'string' ||
      !/^\d{1,5}\.\d{1,5}\.\d{1,5}(?:[-+][0-9A-Za-z.-]{1,32})?$/.test(record['app_version']) ||
      typeof record['runtime_version'] !== 'string' ||
      !/^\d{1,3}$/.test(record['runtime_version']) ||
      !['darwin', 'linux', 'windows', 'other'].includes(String(record['os'])) ||
      !['arm64', 'x86_64', 'other'].includes(String(record['arch'])) ||
      event === null
    ) {
      return null;
    }
    return {
      app_version: record['app_version'],
      runtime_version: record['runtime_version'],
      os: record['os'] as SpoolRecord['os'],
      arch: record['arch'] as SpoolRecord['arch'],
      event,
    };
  } catch {
    return null;
  }
}

function parseLines(lines: string[]): SpoolClaim {
  const records: SpoolRecord[] = [];
  let corruptLines = 0;
  for (const line of lines) {
    const record = parseRecord(line);
    if (record === null) {
      corruptLines += 1;
    } else {
      records.push(record);
    }
  }
  return { records, corruptLines };
}

function sidecarFiles(cacheDirectory: string): string[] {
  try {
    return readdirSync(cacheDirectory)
      .filter((name) => SIDECAR_PATTERN.test(name))
      .map((name) => pathFor(cacheDirectory, name));
  } catch {
    return [];
  }
}

function mergeSidecars(cacheDirectory: string): void {
  const activePath = pathFor(cacheDirectory, ACTIVE_FILE);
  for (const sidecarPath of sidecarFiles(cacheDirectory)) {
    for (const line of readLines(sidecarPath)) {
      appendFileSync(activePath, `${line}\n`, { encoding: 'utf8', mode: 0o600 });
    }
    try {
      unlinkSync(sidecarPath);
    } catch {
      // A writer may already have recovered its sidecar.
    }
  }
  compactFile(activePath);
}

export function appendSpoolRecords(cacheDirectory: string, records: SpoolRecord[]): void {
  if (records.length === 0) {
    return;
  }
  const lines = records.map((record) => JSON.stringify(record));
  try {
    if (acquireLock(cacheDirectory)) {
      try {
        const activePath = pathFor(cacheDirectory, ACTIVE_FILE);
        appendFileSync(activePath, `${lines.join('\n')}\n`, {
          encoding: 'utf8',
          mode: 0o600,
        });
        compactFile(activePath);
      } finally {
        releaseLock(cacheDirectory);
      }
      return;
    }
    mkdirSync(cacheDirectory, { recursive: true });
    sidecarSequence += 1;
    const sidecarPath = pathFor(
      cacheDirectory,
      `telemetry.${process.pid}.${Date.now()}.${sidecarSequence}.ndjson`
    );
    const temporaryPath = `${sidecarPath}.tmp`;
    writeFileSync(temporaryPath, `${lines.join('\n')}\n`, { encoding: 'utf8', mode: 0o600 });
    renameSync(temporaryPath, sidecarPath);
  } catch {
    // Telemetry must never affect command behavior.
  }
}

export function claimSpool(cacheDirectory: string): SpoolClaim | null {
  if (!acquireLock(cacheDirectory)) {
    return null;
  }
  try {
    const inflightPath = pathFor(cacheDirectory, INFLIGHT_FILE);
    if (existsSync(inflightPath) && readLines(inflightPath).length === 0) {
      try {
        unlinkSync(inflightPath);
      } catch {
        return null;
      }
    }
    if (!existsSync(inflightPath)) {
      mergeSidecars(cacheDirectory);
      const activePath = pathFor(cacheDirectory, ACTIVE_FILE);
      if (existsSync(activePath)) {
        renameSync(activePath, inflightPath);
      }
    }
    const lines = readLines(inflightPath);
    return lines.length === 0 ? null : parseLines(lines);
  } finally {
    releaseLock(cacheDirectory);
  }
}

export function completeSpoolClaim(
  cacheDirectory: string,
  remainingRecords: SpoolRecord[],
  rejectedRecords: SpoolRecord[] = []
): boolean {
  if (!acquireLock(cacheDirectory)) {
    return false;
  }
  try {
    try {
      writeLines(
        pathFor(cacheDirectory, INFLIGHT_FILE),
        remainingRecords.map((record) => JSON.stringify(record))
      );
      if (rejectedRecords.length > 0) {
        const quarantinePath = pathFor(cacheDirectory, QUARANTINE_FILE);
        for (const record of rejectedRecords) {
          appendFileSync(quarantinePath, `${JSON.stringify(record)}\n`, {
            encoding: 'utf8',
            mode: 0o600,
          });
        }
        compactFile(quarantinePath);
      }
      return true;
    } catch {
      return false;
    }
  } finally {
    releaseLock(cacheDirectory);
  }
}

export function prepareSpoolAttempt(
  cacheDirectory: string,
  remainingRecords: SpoolRecord[]
): boolean {
  if (!acquireLock(cacheDirectory)) {
    return false;
  }
  try {
    try {
      writeLines(
        pathFor(cacheDirectory, INFLIGHT_FILE),
        remainingRecords.map((record) => JSON.stringify(record))
      );
      return true;
    } catch {
      return false;
    }
  } finally {
    releaseLock(cacheDirectory);
  }
}

export function acquireFlushLease(cacheDirectory: string): boolean {
  return acquireLock(cacheDirectory, FLUSH_LOCK_DIRECTORY);
}

export function releaseFlushLease(cacheDirectory: string): void {
  releaseLock(cacheDirectory, FLUSH_LOCK_DIRECTORY);
}

export function getSpoolInfo(cacheDirectory: string): SpoolInfo {
  const files = [
    pathFor(cacheDirectory, ACTIVE_FILE),
    pathFor(cacheDirectory, INFLIGHT_FILE),
    ...sidecarFiles(cacheDirectory),
  ];
  let records = 0;
  let bytes = 0;
  for (const file of files) {
    const lines = readLines(file);
    records += lines.length;
    try {
      bytes += statSync(file).size;
    } catch {
      // A concurrent flusher may move the file after listing.
    }
  }
  return { records, bytes };
}

export function readFlushState(cacheDirectory: string): FlushState {
  try {
    const value: unknown = JSON.parse(readFileSync(pathFor(cacheDirectory, STATE_FILE), 'utf8'));
    return typeof value === 'object' && value !== null ? (value as FlushState) : {};
  } catch {
    return {};
  }
}

export function writeFlushState(cacheDirectory: string, state: FlushState): void {
  try {
    mkdirSync(cacheDirectory, { recursive: true });
    const statePath = pathFor(cacheDirectory, STATE_FILE);
    const temporaryPath = `${statePath}.${process.pid}.tmp`;
    writeFileSync(temporaryPath, `${JSON.stringify(state, null, 2)}\n`, {
      encoding: 'utf8',
      mode: 0o600,
    });
    renameSync(temporaryPath, statePath);
  } catch {
    // Status persistence is best effort only.
  }
}
