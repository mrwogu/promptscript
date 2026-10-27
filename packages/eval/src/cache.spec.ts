import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Ajv } from 'ajv';
import type { EvalCacheEntryV1, EvalCacheRequestV1 } from '@promptscript/core';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  CACHE_ENTRY_SCHEMA,
  cacheKey,
  entryText,
  inputsHash,
  readCacheEntry,
  writeCacheEntry,
} from './cache.js';

const HASH = `sha256-${'a'.repeat(64)}`;
const request = (): EvalCacheRequestV1 => ({
  contentHash: HASH,
  inputsHash: HASH,
  modelRef: 'claude-sonnet-5-5',
  provider: 'anthropic',
  apiId: 'claude-sonnet-5-5',
  params: { maxTokens: 600, temperature: 0 },
  sample: 0,
});
const entry = (patch: Partial<EvalCacheRequestV1> = {}): EvalCacheEntryV1 => {
  const req = { ...request(), ...patch };
  return {
    $schema: CACHE_ENTRY_SCHEMA,
    key: cacheKey(req),
    request: req,
    response: {
      text: 'On its way.',
      usage: { inputTokens: 12, outputTokens: 4 },
      latencyMs: 840,
      status: 200,
      stopReason: 'end_turn',
    },
  };
};

describe('cacheKey', () => {
  it('does not depend on key order', () => {
    const base = request();
    const reordered = {
      sample: base.sample,
      params: { temperature: 0, maxTokens: 600 },
      apiId: base.apiId,
      provider: base.provider,
      modelRef: base.modelRef,
      inputsHash: base.inputsHash,
      contentHash: base.contentHash,
    };

    expect(cacheKey(reordered)).toBe(cacheKey(request()));
  });

  it.each([
    ['contentHash', { contentHash: `sha256-${'b'.repeat(64)}` }],
    ['inputsHash', { inputsHash: `sha256-${'b'.repeat(64)}` }],
    ['modelRef', { modelRef: 'claude-opus-5-5' }],
    ['provider', { provider: 'corp' }],
    ['apiId', { apiId: 'claude-sonnet-5-5-x' }],
    ['params', { params: { maxTokens: 601, temperature: 0 } }],
    ['sample', { sample: 1 }],
  ])('changes with %s', (_name, patch) => {
    expect(cacheKey({ ...request(), ...patch })).not.toBe(cacheKey(request()));
  });

  it('hashes inputs as canonical JSON and keeps ${VAR} literal', () => {
    expect(inputsHash({ b: 1, a: '${HOME}' })).toBe(inputsHash({ a: '${HOME}', b: 1 }));
    expect(inputsHash({ a: '${HOME}' })).not.toBe(inputsHash({ a: process.env['HOME'] ?? '' }));
  });
});

describe('cache entries', () => {
  let dir: string;

  beforeEach(() => {
    dir = realpathSync(mkdtempSync(join(tmpdir(), 'eval-cache-')));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  const fileOf = (key: string): string => join(dir, key.slice(0, 2), `${key}.json`);
  const plant = (key: string, text: string | Buffer): void => {
    mkdirSync(join(dir, key.slice(0, 2)), { recursive: true });
    writeFileSync(fileOf(key), text);
  };

  it('writes an entry atomically and reads it back with its bytes', async () => {
    const value = entry();

    const bytes = await writeCacheEntry(dir, value);
    const read = await readCacheEntry(dir, value.key);

    expect(read).toEqual({ found: true, entry: value, bytes });
    expect(readFileSync(fileOf(value.key), 'utf8')).toBe(entryText(value));
    expect(readdirSync(join(dir, value.key.slice(0, 2)))).toEqual([`${value.key}.json`]);
  });

  it('overwrites an entry on a second write', async () => {
    const value = entry();
    await writeCacheEntry(dir, value);

    await writeCacheEntry(dir, { ...value, response: { ...value.response, text: 'New.' } });

    expect(JSON.parse(readFileSync(fileOf(value.key), 'utf8')).response.text).toBe('New.');
  });

  it('misses a key without an entry', async () => {
    expect(await readCacheEntry(dir, entry().key)).toEqual({ found: false, invalid: false });
    mkdirSync(join(dir, entry().key.slice(0, 2)));
    expect(await readCacheEntry(dir, entry().key)).toEqual({ found: false, invalid: false });
  });

  it.each([
    ['broken JSON', () => '{"key": '],
    ['another schema', (key: string) => JSON.stringify({ ...entry(), $schema: 'x', key })],
    ['an extra field', (key: string) => JSON.stringify({ ...entry(), recordedAt: 'now', key })],
    ['a key that is not the file name', () => JSON.stringify(entry({ sample: 3 }))],
    [
      'a request that does not give the key',
      (key: string) => JSON.stringify({ ...entry(), key, request: { ...request(), sample: 9 } }),
    ],
    ['invalid UTF-8', () => Buffer.from([0x7b, 0xff, 0x7d])],
    [
      'a token count over the cap',
      (key: string) =>
        JSON.stringify({
          ...entry(),
          key,
          response: { ...entry().response, usage: { inputTokens: 1e10, outputTokens: 4 } },
        }),
    ],
  ])('treats %s as an invalid miss', async (_name, make) => {
    const { key } = entry();
    plant(key, make(key));

    expect(await readCacheEntry(dir, key)).toEqual({ found: false, invalid: true });
  });

  it('treats an entry over 1 MiB as an invalid miss', async () => {
    const value = entry();
    plant(value.key, `${entryText(value)}${' '.repeat(1024 * 1024)}`);

    expect(await readCacheEntry(dir, value.key)).toEqual({ found: false, invalid: true });
  });

  it('keeps the raw file bytes, a byte order mark included', async () => {
    const value = entry();
    const raw = Buffer.from(`\uFEFF${entryText(value)}`, 'utf8');
    plant(value.key, raw);

    expect(await readCacheEntry(dir, value.key)).toEqual({ found: true, entry: value, bytes: raw });
  });

  it('throws a read error instead of calling the entry invalid', async () => {
    const value = entry();
    plant(value.key, entryText(value));
    chmodSync(fileOf(value.key), 0o000);

    try {
      await expect(readCacheEntry(dir, value.key)).rejects.toMatchObject({ code: 'EACCES' });
    } finally {
      chmodSync(fileOf(value.key), 0o600);
    }
  });

  it('refuses to write an entry that replay could not read', async () => {
    const value = entry();
    const big = { ...value, response: { ...value.response, text: 'x'.repeat(1024 * 1024) } };

    await expect(writeCacheEntry(dir, big)).rejects.toMatchObject({ code: 'PS6405' });
    expect(existsSync(fileOf(value.key))).toBe(false);
  });

  it.each([
    [
      'a symlinked prefix directory',
      (key: string) => {
        mkdirSync(join(dir, 'elsewhere'));
        symlinkSync(join(dir, 'elsewhere'), join(dir, key.slice(0, 2)));
      },
    ],
    ['a prefix that is a file', (key: string) => writeFileSync(join(dir, key.slice(0, 2)), 'x')],
    [
      'a symlinked entry file',
      (key: string) => {
        writeFileSync(join(dir, 'target.json'), entryText(entry()));
        mkdirSync(join(dir, key.slice(0, 2)));
        symlinkSync(join(dir, 'target.json'), join(dir, key.slice(0, 2), `${key}.json`));
      },
    ],
    [
      'a directory in place of an entry',
      (key: string) => mkdirSync(join(dir, key.slice(0, 2), `${key}.json`), { recursive: true }),
    ],
  ])('refuses %s with PS6403', async (_name, plantTree) => {
    const { key } = entry();
    plantTree(key);

    await expect(readCacheEntry(dir, key)).rejects.toMatchObject({ code: 'PS6403' });
  });

  it('refuses to write through a symlinked prefix directory', async () => {
    const value = entry();
    mkdirSync(join(dir, 'elsewhere'));
    symlinkSync(join(dir, 'elsewhere'), join(dir, value.key.slice(0, 2)));

    await expect(writeCacheEntry(dir, value)).rejects.toMatchObject({ code: 'PS6403' });
    expect(existsSync(join(dir, 'elsewhere', `${value.key}.json`))).toBe(false);
  });

  describe('against the generated schema', () => {
    const schema = JSON.parse(
      readFileSync(new URL('../../../schema/eval-cache-entry-v1.json', import.meta.url), 'utf8')
    ) as object;
    const schemaAccepts = new Ajv({ strict: true, allowUnionTypes: true }).compile(schema);

    it.each([
      ['a full entry', entry()],
      [
        'an entry without a stop reason',
        { ...entry(), response: { ...entry().response, stopReason: undefined } },
      ],
      ['a negative sample', { ...entry(), request: { ...request(), sample: -1 } }],
      ['a fractional latency', { ...entry(), response: { ...entry().response, latencyMs: 1.5 } }],
      ['a status of 600', { ...entry(), response: { ...entry().response, status: 600 } }],
      ['an unknown param', { ...entry(), request: { ...request(), params: { top_p: 1 } } }],
      ['a short hash', { ...entry(), request: { ...request(), contentHash: 'sha256-abc' } }],
      ['an uppercase key', { ...entry(), key: entry().key.toUpperCase() }],
    ])('agrees on %s', async (_name, value) => {
      const clean = JSON.parse(JSON.stringify(value)) as EvalCacheEntryV1;
      const validKey = /^[0-9a-f]{64}$/.test(clean.key);
      // Keep the key in step with the request, so only the shape decides
      if (validKey) clean.key = cacheKey(clean.request);
      const fileKey = validKey ? clean.key : entry().key;
      plant(fileKey, JSON.stringify(clean));

      const read = await readCacheEntry(dir, fileKey);

      expect(read.found).toBe(schemaAccepts(clean));
    });
  });
});
