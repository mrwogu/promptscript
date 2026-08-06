import { buildTelemetryBatches } from './payload.js';
import {
  acquireFlushLease,
  claimSpool,
  completeSpoolClaim,
  prepareSpoolAttempt,
  readFlushState,
  releaseFlushLease,
  writeFlushState,
} from './spool.js';
import { postTelemetry, type TelemetryFetch } from './transport.js';
import type { FlushResult, ResolvedTelemetryConfig, SpoolRecord } from './types.js';

const FLUSH_BUDGET_MS = 5_000;
const MAX_BATCHES_PER_FLUSH = 3;
const COMPLETION_RETRIES = 20;

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function persistCompletion(
  cacheDirectory: string,
  remainingRecords: SpoolRecord[],
  rejectedRecords: SpoolRecord[]
): Promise<boolean> {
  for (let attempt = 0; attempt < COMPLETION_RETRIES; attempt += 1) {
    if (completeSpoolClaim(cacheDirectory, remainingRecords, rejectedRecords)) {
      return true;
    }
    await delay(10);
  }
  return false;
}

async function persistAttempt(
  cacheDirectory: string,
  remainingRecords: SpoolRecord[]
): Promise<boolean> {
  for (let attempt = 0; attempt < COMPLETION_RETRIES; attempt += 1) {
    if (prepareSpoolAttempt(cacheDirectory, remainingRecords)) {
      return true;
    }
    await delay(10);
  }
  return false;
}

export async function runFlush(
  config: ResolvedTelemetryConfig,
  fetchImplementation: TelemetryFetch = fetch
): Promise<FlushResult> {
  const emptyResult: FlushResult = {
    attempted: false,
    deliveredRecords: 0,
    rejectedRecords: 0,
    remainingRecords: 0,
  };
  if (!config.enabled || !acquireFlushLease(config.cacheDirectory)) {
    return emptyResult;
  }

  try {
    const claim = claimSpool(config.cacheDirectory);
    if (claim === null) {
      return emptyResult;
    }
    const state = readFlushState(config.cacheDirectory);
    const startedAt = Date.now();
    writeFlushState(config.cacheDirectory, {
      ...state,
      lastAttempt: new Date(startedAt).toISOString(),
      ...(claim.corruptLines > 0
        ? { lastError: `Skipped ${claim.corruptLines} corrupt spool record(s)` }
        : {}),
    });

    const remainingIndexes = new Set(claim.records.map((_record, index) => index));
    const rejectedIndexes = new Set<number>();
    const batches = buildTelemetryBatches(claim.records).slice(0, MAX_BATCHES_PER_FLUSH);
    let deliveredRecords = 0;
    let stoppedForRetry = false;

    for (const batch of batches) {
      let remainingBudget = FLUSH_BUDGET_MS - (Date.now() - startedAt);
      if (remainingBudget <= 0) {
        stoppedForRetry = true;
        break;
      }
      const pendingRecords = claim.records.filter(
        (_record, index) => remainingIndexes.has(index) && !batch.sourceIndexes.includes(index)
      );
      if (!(await persistAttempt(config.cacheDirectory, pendingRecords))) {
        stoppedForRetry = true;
        break;
      }
      for (const index of batch.sourceIndexes) {
        remainingIndexes.delete(index);
      }
      remainingBudget = FLUSH_BUDGET_MS - (Date.now() - startedAt);
      if (remainingBudget <= 0) {
        for (const index of batch.sourceIndexes) {
          remainingIndexes.add(index);
        }
        stoppedForRetry = true;
        break;
      }
      const result = await postTelemetry(
        config.endpoint,
        batch.payload,
        remainingBudget,
        fetchImplementation
      );
      if (result === 'sent' || result === 'unknown') {
        deliveredRecords += batch.sourceIndexes.length;
        if (result === 'unknown') {
          break;
        }
        continue;
      }
      if (result === 'rejected') {
        for (const index of batch.sourceIndexes) {
          rejectedIndexes.add(index);
        }
        continue;
      }
      for (const index of batch.sourceIndexes) {
        remainingIndexes.add(index);
      }
      stoppedForRetry = true;
      break;
    }

    const remainingRecords = claim.records.filter((_record, index) => remainingIndexes.has(index));
    const rejectedRecords = claim.records.filter((_record, index) => rejectedIndexes.has(index));
    const persisted = await persistCompletion(
      config.cacheDirectory,
      remainingRecords,
      rejectedRecords
    );
    const finishedAt = new Date().toISOString();
    const lastError = stoppedForRetry
      ? 'Delivery deferred after retryable failure'
      : rejectedRecords.length > 0
        ? `Collector rejected ${rejectedRecords.length} record(s)`
        : !persisted
          ? 'Could not finalize telemetry spool'
          : claim.corruptLines > 0
            ? `Skipped ${claim.corruptLines} corrupt spool record(s)`
            : undefined;
    writeFlushState(config.cacheDirectory, {
      ...readFlushState(config.cacheDirectory),
      ...(remainingRecords.length === 0 && persisted ? { lastSuccess: finishedAt } : {}),
      lastError,
    });

    return {
      attempted: batches.length > 0,
      deliveredRecords,
      rejectedRecords: rejectedRecords.length,
      remainingRecords: remainingRecords.length,
    };
  } finally {
    releaseFlushLease(config.cacheDirectory);
  }
}
