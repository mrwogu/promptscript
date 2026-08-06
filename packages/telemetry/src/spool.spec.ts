import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  utimesSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  appendSpoolRecords,
  claimSpool,
  completeSpoolClaim,
  getSpoolInfo,
  prepareSpoolAttempt,
  readFlushState,
  writeFlushState,
} from './spool.js';
import type { SpoolRecord } from './types.js';

const directories: string[] = [];

function temporaryDirectory(): string {
  const directory = mkdtempSync(join(tmpdir(), 'promptscript-telemetry-'));
  directories.push(directory);
  return directory;
}

function record(version = '1.16.0'): SpoolRecord {
  return {
    app_version: version,
    runtime_version: '24',
    os: 'darwin',
    arch: 'arm64',
    event: { name: 'feature', feature: 'strict', count: 1 },
  };
}

afterEach(() => {
  for (const directory of directories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe('telemetry spool', () => {
  it('appends, claims, and completes records', () => {
    const directory = temporaryDirectory();
    appendSpoolRecords(directory, [record(), record('1.17.0')]);

    const claim = claimSpool(directory);

    expect(claim?.records).toHaveLength(2);
    expect(claim?.corruptLines).toBe(0);
    expect(getSpoolInfo(directory).records).toBe(2);
    expect(completeSpoolClaim(directory, [])).toBe(true);
    expect(getSpoolInfo(directory).records).toBe(0);
  });

  it('uses unique sidecars while a writer lock is held', () => {
    const directory = temporaryDirectory();
    mkdirSync(join(directory, 'telemetry.lock'), { recursive: true });

    appendSpoolRecords(directory, [record()]);
    appendSpoolRecords(directory, [record('1.17.0')]);
    rmSync(join(directory, 'telemetry.lock'), { recursive: true });

    const sidecars = getSpoolInfo(directory);
    expect(sidecars.records).toBe(2);
    expect(readdirSync(directory).some((name) => name.endsWith('.tmp'))).toBe(false);
    const claim = claimSpool(directory);
    expect(claim?.records.map((item) => item.app_version)).toEqual(['1.16.0', '1.17.0']);
  });

  it('recovers stale locks', () => {
    const directory = temporaryDirectory();
    const lockPath = join(directory, 'telemetry.lock');
    mkdirSync(lockPath, { recursive: true });
    const staleTime = new Date(Date.now() - 60_000);
    utimesSync(lockPath, staleTime, staleTime);

    appendSpoolRecords(directory, [record()]);

    expect(claimSpool(directory)?.records).toHaveLength(1);
  });

  it('recovers an existing inflight spool and skips corrupt records', () => {
    const directory = temporaryDirectory();
    writeFileSync(
      join(directory, 'telemetry.inflight.ndjson'),
      `${JSON.stringify(record())}\n{"event":"private path"}\n`,
      'utf8'
    );

    const claim = claimSpool(directory);

    expect(claim?.records).toEqual([record()]);
    expect(claim?.corruptLines).toBe(1);
  });

  it('removes an empty stale inflight file before claiming active records', () => {
    const directory = temporaryDirectory();
    writeFileSync(join(directory, 'telemetry.inflight.ndjson'), '');
    appendSpoolRecords(directory, [record()]);

    const claim = claimSpool(directory);

    expect(claim?.records).toEqual([record()]);
  });

  it('rebuilds claimed records from allowlisted fields only', () => {
    const directory = temporaryDirectory();
    writeFileSync(
      join(directory, 'telemetry.inflight.ndjson'),
      `${JSON.stringify({
        ...record(),
        project_path: '/private/project',
        event: {
          name: 'feature',
          feature: 'strict',
          count: 1,
          source_file: '/private/project/promptscript.yaml',
        },
      })}\n`,
      'utf8'
    );

    const claim = claimSpool(directory);

    expect(claim?.records).toEqual([record()]);
  });

  it('caps active spool at 200 records', () => {
    const directory = temporaryDirectory();

    appendSpoolRecords(
      directory,
      Array.from({ length: 210 }, (_value, index) =>
        record(`1.16.${String(index).padStart(3, '0')}`)
      )
    );

    expect(getSpoolInfo(directory).records).toBe(200);
    expect(claimSpool(directory)?.records[0]?.app_version).toBe('1.16.010');
  });

  it('quarantines collector-rejected records', () => {
    const directory = temporaryDirectory();
    appendSpoolRecords(directory, [record()]);
    const claim = claimSpool(directory);

    expect(completeSpoolClaim(directory, [], claim?.records ?? [])).toBe(true);

    const quarantinePath = join(directory, 'telemetry-quarantine.ndjson');
    expect(existsSync(quarantinePath)).toBe(true);
    expect(readFileSync(quarantinePath, 'utf8')).toContain('"app_version":"1.16.0"');
  });

  it('dequeues records durably before a delivery attempt', () => {
    const directory = temporaryDirectory();
    appendSpoolRecords(directory, [record()]);
    expect(claimSpool(directory)?.records).toHaveLength(1);

    expect(prepareSpoolAttempt(directory, [])).toBe(true);

    expect(claimSpool(directory)).toBeNull();
  });

  it('persists flush status atomically', () => {
    const directory = temporaryDirectory();

    writeFlushState(directory, {
      lastAttempt: '2026-08-06T12:00:00.000Z',
      lastSuccess: '2026-08-06T12:00:01.000Z',
    });

    expect(readFlushState(directory)).toEqual({
      lastAttempt: '2026-08-06T12:00:00.000Z',
      lastSuccess: '2026-08-06T12:00:01.000Z',
    });
  });
});
