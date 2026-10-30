import { mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cacheKey, inputsHash } from './cache.js';
import { fileProblem, messageOf, obtain, type RunContext } from './calls.js';
import { Budget } from './cost.js';
import { EvalError, EvalProviderError } from './errors.js';
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

  it('keeps the text of a provider that throws something that is not an Error', async () => {
    provider = createMockProvider(() => {
      throw 'plain text failure';
    });

    const got = await obtain(planOf(), 'row', contextOf('off'));

    expect(got).toMatchObject({ code: 'PS6300', message: 'plain text failure' });
  });

  it('waits for the retry-after of the provider, then calls again', async () => {
    let attempts = 0;
    provider = createMockProvider(() => {
      attempts += 1;
      if (attempts === 1) {
        throw new EvalProviderError('Busy.', 'PS6300', { status: 429, retryAfterMs: 1 });
      }
      return 'answer';
    });

    const got = await obtain(planOf(), 'row', contextOf('off'));

    expect('live' in got && got.live).toBe(true);
    expect(attempts).toBe(2);
  });

  it('backs off from a base of half a second when the options set none', async () => {
    let attempts = 0;
    provider = createMockProvider(() => {
      attempts += 1;
      if (attempts === 1) throw new EvalProviderError('Down.', 'PS6300', { status: 503 });
      return 'answer';
    });

    const got = await obtain(planOf(), 'row', contextOf('off'));

    expect('live' in got && got.live).toBe(true);
    expect(attempts).toBe(2);
  });

  it('settles a priced run for a call whose model has no price', async () => {
    const context = contextOf('off');
    context.budget = new Budget(1);

    const got = await obtain(planOf(), 'row', context);

    expect('live' in got).toBe(true);
    expect(context.budget.spent).toBe(0);
  });
});

describe('messageOf and fileProblem', () => {
  it('turns anything into text', () => {
    expect(messageOf(new Error('boom'))).toBe('boom');
    expect(messageOf('boom')).toBe('boom');
  });

  it('keeps an eval error as it is', () => {
    const error = new EvalError('Tree is bad.', 'PS6403');

    expect(fileProblem(error)).toEqual({ code: 'PS6403', message: 'Tree is bad.' });
  });

  it('keeps only the errno of a file system error, never a path', () => {
    const error = Object.assign(new Error('EACCES: /secret/path'), { code: 'EACCES' });

    const problem = fileProblem(error);

    expect(problem.code).toBe('PS6404');
    expect(problem.message).toContain('EACCES');
    expect(problem.message).not.toContain('/secret');
  });

  it('names an unknown error when there is no errno or no error', () => {
    expect(fileProblem(new Error('x')).message).toContain('an unknown error');
    expect(fileProblem(undefined).message).toContain('an unknown error');
  });
});
