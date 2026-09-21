import {
  MAX_DURATION_SUM_MS,
  MAX_EVENT_COUNT,
  MAX_EVENTS_PER_BATCH,
  TELEMETRY_EVENT_SCHEMA,
} from './schema.js';
import type {
  SpoolRecord,
  TelemetryBatch,
  TelemetryEvent,
  TelemetryPayload,
  TelemetryRuntime,
} from './types.js';

/** Metadata shared by spool records, aggregates, and batches. */
interface BatchMetadata {
  app_version: string;
  runtime_version: string;
  os: 'darwin' | 'linux' | 'windows' | 'other';
  arch: 'arm64' | 'x86_64' | 'other';
  runtime: TelemetryRuntime;
}

interface Aggregate {
  metadata: BatchMetadata;
  event: TelemetryEvent;
  sourceIndexes: number[];
}

interface BatchBuilder {
  metadata: BatchMetadata;
  events: TelemetryEvent[];
  eventKeys: Set<string>;
  sourceIndexes: Set<number>;
}

function metadataKey(record: BatchMetadata): string {
  return [record.app_version, record.runtime_version, record.os, record.arch, record.runtime].join(
    ':'
  );
}

function eventKey(event: TelemetryEvent): string {
  return event.name === 'command'
    ? `${event.name}:${event.command}:${event.outcome}`
    : `${event.name}:${event.feature}`;
}

function copyEvent(event: TelemetryEvent): TelemetryEvent {
  return event.name === 'command' ? { ...event } : { ...event };
}

function canAggregate(target: TelemetryEvent, source: TelemetryEvent): boolean {
  if (target.count + source.count > MAX_EVENT_COUNT) {
    return false;
  }
  if (target.name === 'command' && source.name === 'command') {
    return target.duration_ms_sum + source.duration_ms_sum <= MAX_DURATION_SUM_MS;
  }
  return true;
}

function addEvent(target: TelemetryEvent, source: TelemetryEvent): void {
  target.count += source.count;
  if (target.name === 'command' && source.name === 'command') {
    target.duration_ms_sum += source.duration_ms_sum;
  }
}

function aggregateRecords(records: SpoolRecord[]): Aggregate[] {
  const aggregates: Aggregate[] = [];
  records.forEach((record, index) => {
    const key = `${metadataKey(record)}:${eventKey(record.event)}`;
    const aggregate = aggregates.find(
      (candidate) =>
        `${metadataKey(candidate.metadata)}:${eventKey(candidate.event)}` === key &&
        canAggregate(candidate.event, record.event)
    );
    if (aggregate !== undefined) {
      addEvent(aggregate.event, record.event);
      aggregate.sourceIndexes.push(index);
      return;
    }
    aggregates.push({
      metadata: {
        app_version: record.app_version,
        runtime_version: record.runtime_version,
        os: record.os,
        arch: record.arch,
        runtime: record.runtime,
      },
      event: copyEvent(record.event),
      sourceIndexes: [index],
    });
  });
  return aggregates;
}

function toPayload(batch: BatchBuilder): TelemetryPayload {
  return {
    schema: 1,
    app: 'promptscript',
    event_schema: TELEMETRY_EVENT_SCHEMA,
    ...batch.metadata,
    events: batch.events,
  };
}

export function buildTelemetryBatches(records: SpoolRecord[]): TelemetryBatch[] {
  const builders: BatchBuilder[] = [];
  for (const aggregate of aggregateRecords(records)) {
    const key = eventKey(aggregate.event);
    let batch = builders.find(
      (candidate) =>
        metadataKey(candidate.metadata) === metadataKey(aggregate.metadata) &&
        candidate.events.length < MAX_EVENTS_PER_BATCH &&
        !candidate.eventKeys.has(key)
    );
    if (batch === undefined) {
      batch = {
        metadata: aggregate.metadata,
        events: [],
        eventKeys: new Set<string>(),
        sourceIndexes: new Set<number>(),
      };
      builders.push(batch);
    }
    batch.events.push(aggregate.event);
    batch.eventKeys.add(key);
    aggregate.sourceIndexes.forEach((index) => batch?.sourceIndexes.add(index));
  }
  return builders.map((batch) => ({
    payload: toPayload(batch),
    sourceIndexes: [...batch.sourceIndexes],
  }));
}
