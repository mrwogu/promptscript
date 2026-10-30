import { mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cacheKey, inputsHash } from './cache.js';
import { obtain, type RunContext } from './calls.js';
import { createMockProvider, type MockProvider } from './provider.js';
import type { CallPlan } from './report.js';
import type { EvalProgress, RunEvalOptions } from './run.js';

const CACHE_REQUEST = {
  contentHash: `sha256-${'a'.repeat(64)}`,
  inputsHash: inputsHash({ message: 'hi' }),
  modelRef: 'test-model',
  provider: 'anthropic',
  apiId: 'test-model-api',
  params: { maxTokens: 10 },
  sample: 2,
};

function planOf(patch: Partial<CallPlan> = {}): CallPlan {
  return {
    model: {
      ref: 'test-model',
      provider: 'anthropic',
      apiId: 'test-model-api',
      params: { maxTokens: 10 },
      maxOutputTokens: 10,
    },
    request: {
      promptId: 'acme/p',
      provider: 'anthropic',
      apiId: 'test-model-api',
      modelRef: 'test-model',
      messages: [{ role: 'user', content: 'hi' }],
      params: { maxTokens: 10 },
      maxOutputTokens: 10,
    },
    cacheRequest: CACHE_REQUEST,
    key: cacheKey(CACHE_REQUEST),
    worstCaseUsd: 0,
    ...patch,
  };
}

describe('obtain', () => {
  let root: string;
  let events: EvalProgress[];
  let provider: MockProvider;
  let samples: Array<number | undefined>;

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'ps-calls-'));
    events = [];
    samples = [];
    provider = createMockProvider((_request, context) => {
      samples.push(context.sample);
      return 'answer';
    });
  });
  afterEach(() => rmSync(root, { recursive: true, force: true }));

  function contextOf(mode: RunContext['mode']): RunContext {
    return {
      options: { projectRoot: root } as RunEvalOptions,
      mode,
      cacheDir: join(root, 'cache'),
      providers: new Map([['anthropic', provider]]),
      answers: new Map(),
      notify: (event) => events.push(event),
    };
  }

  it('passes the sample of the call to the provider', async () => {
    const context = contextOf('record');

    await obtain(planOf(), 'row', context);

    expect(samples).toEqual([2]);
  });

  it('reads an entry of an earlier run lazily in record mode', async () => {
    const first = contextOf('record');
    await obtain(planOf(), 'row', first);
    const second = contextOf('record');

    const got = await obtain(planOf(), 'row', second);

    expect('live' in got && got.live).toBe(false);
    expect(provider.calls).toHaveLength(1);
  });

  it('warns and calls again when the entry on disk does not match its key', async () => {
    await obtain(planOf(), 'row', contextOf('record'));
    const key = cacheKey(CACHE_REQUEST);
    const file = join(root, 'cache', key.slice(0, 2), `${key}.json`);
    writeFileSync(file, '{}');

    const got = await obtain(planOf(), 'row', contextOf('record'));

    expect('live' in got && got.live).toBe(true);
    expect(events.map((event) => event.type)).toEqual(['warning']);
    expect(provider.calls).toHaveLength(2);
  });

  it('does not read the cache again for a call that was searched', async () => {
    await obtain(planOf(), 'row', contextOf('record'));

    const got = await obtain(planOf({ searched: true }), 'row', contextOf('record'));

    expect('live' in got && got.live).toBe(true);
    expect(provider.calls).toHaveLength(2);
  });

  it('reports a cache problem as a failure, not a throw', async () => {
    const context = contextOf('record');
    context.cacheDir = join(root, 'cache');
    writeFileSync(join(root, 'cache'), 'not a directory');

    const got = await obtain(planOf(), 'row', context);

    expect('code' in got).toBe(true);
    expect(readdirSync(root)).toEqual(['cache']);
  });

  it('counts only the first of two calls with one key as live', async () => {
    const context = contextOf('off');

    const [one, two] = await Promise.all([
      obtain(planOf(), 'row', context),
      obtain(planOf(), 'row', context),
    ]);

    expect([one, two].map((got) => 'live' in got && got.live).sort()).toEqual([false, true]);
    expect(provider.calls).toHaveLength(1);
  });

  it('fails a call whose provider is not set up', async () => {
    const context = contextOf('off');
    context.providers.clear();

    const got = await obtain(planOf(), 'row', context);

    expect(got).toMatchObject({ code: 'PS6301' });
  });

  it('turns a replay miss into a failure that marks a cache miss', async () => {
    const got = await obtain(planOf(), 'row', contextOf('replay'));

    expect(got).toMatchObject({ code: 'PS6402', flags: { cacheMiss: true } });
  });
});
