import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { indexOf, labelOf, makeBundle, type Json } from './__tests__/fixture.js';
import { createPromptClient } from './client.js';
import { PromptLoadError, type PromptRuntimeError } from './errors.js';
import type { Prompt, PromptCacheStore, PromptClientOptions, PromptSource } from './types.js';

const ID = 'acme-support/refund-reply';
const v1 = makeBundle();
const v2 = makeBundle({ description: 'Second version' });
const other = makeBundle({ id: 'acme-support/other' });
const hashOf = (bundle: Json): string => bundle['contentHash'] as string;
const bundlePath = (bundle: Json): string => `bundles/${hashOf(bundle)}.json`;
const text = (bundle: Json): string => JSON.stringify(bundle, null, 2);

interface FakeSource extends PromptSource {
  readonly reads: string[];
  set(path: string, content: string): void;
  remove(path: string): void;
  down: boolean;
}

/** An in-memory source that answers with ETags, like a raw file host. */
function fakeSource(files: Record<string, string>): FakeSource {
  const contents = new Map(Object.entries(files));
  const versions = new Map<string, number>();
  const reads: string[] = [];
  const source: FakeSource = {
    name: 'https://raw.example.com/releases/',
    reads,
    down: false,
    set: (path, content) => {
      contents.set(path, content);
      versions.set(path, (versions.get(path) ?? 0) + 1);
    },
    remove: (path) => contents.delete(path),
    read: async (path, etag) => {
      reads.push(etag === undefined ? path : `${path} if-none-match`);
      if (source.down) throw new PromptLoadError('timeout', `${path} timed out`, path);
      const content = contents.get(path);
      if (content === undefined) throw new PromptLoadError('not-found', `${path} is missing`, path);
      const tag = `"${versions.get(path) ?? 0}"`;
      return etag === tag ? 'not-modified' : { text: content, etag: tag };
    },
  };
  return source;
}

const releases = (): FakeSource =>
  fakeSource({
    'prod.json': labelOf('prod', [v1, other]),
    [bundlePath(v1)]: text(v1),
    [bundlePath(other)]: text(other),
  });

const flush = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));
const later = (ms: number): void => {
  vi.setSystemTime(Date.now() + ms);
};

async function failure(promise: Promise<unknown>): Promise<PromptRuntimeError> {
  try {
    await promise;
  } catch (error) {
    if (error instanceof PromptLoadError) return error;
    throw error;
  }
  throw new Error('expected a failure');
}

function memoryStore(): PromptCacheStore & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    get: async (key) => data.get(key),
    set: async (key, value) => {
      data.set(key, value);
    },
  };
}

const client = (source: PromptSource, options: Partial<PromptClientOptions> = {}) =>
  createPromptClient({ source, label: 'prod', ...options });

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-10-26T10:00:00.000Z'));
});

afterEach(() => {
  vi.useRealTimers();
});

describe('createPromptClient', () => {
  it('resolves an id through a label and caches the pointer for the ttl', async () => {
    // Arrange
    const source = releases();
    const prompts = client(source);

    // Act
    const first = await prompts.get(ID);
    later(59_000);
    const second = await prompts.get(ID);

    // Assert
    expect(source.reads).toEqual(['prod.json', bundlePath(v1)]);
    expect(first.meta).toEqual({
      id: ID,
      contentHash: hashOf(v1),
      label: 'prod',
      source: source.name,
      loadedAt: '2026-10-26T10:00:00.000Z',
      stale: false,
    });
    expect(second.contentHash).toBe(hashOf(v1));
  });

  it('revalidates the pointer with its ETag after the ttl and keeps the bundle', async () => {
    // Arrange
    const source = releases();
    const prompts = client(source, { failMode: 'closed' });
    await prompts.get(ID);

    // Act
    later(60_000);
    const prompt = await prompts.get(ID);

    // Assert
    expect(source.reads).toEqual(['prod.json', bundlePath(v1), 'prod.json if-none-match']);
    expect(prompt.meta.loadedAt).toBe('2026-10-26T10:01:00.000Z');
  });

  it('loads the new bundle when the label moves', async () => {
    // Arrange
    const source = releases();
    source.set(bundlePath(v2), text(v2));
    const prompts = client(source, { failMode: 'closed' });
    await prompts.get(ID);

    // Act
    source.set('prod.json', labelOf('prod', [v2]));
    later(60_000);
    const prompt = await prompts.get(ID);

    // Assert
    expect(prompt.description).toBe('Second version');
    expect(source.reads.at(-1)).toBe(bundlePath(v2));
  });

  it('resolves an id through index.json without a label', async () => {
    // Arrange
    const source = fakeSource({ 'index.json': indexOf([v1]), 'refund-reply.json': text(v1) });
    const prompts = createPromptClient({ source });

    // Act
    const prompt = await prompts.get(ID);
    const pinned = await prompts.get(`${ID}@${hashOf(v1)}`);
    const wrong = await failure(prompts.get(`${ID}@${hashOf(v2)}`));

    // Assert
    expect(source.reads).toEqual(['index.json', 'refund-reply.json']);
    expect(prompt.meta).not.toHaveProperty('label');
    expect(pinned.contentHash).toBe(hashOf(v1));
    expect(wrong.code).toBe('not-found');
  });

  it('reads a pinned hash with a label straight from bundles/', async () => {
    // Arrange
    const source = releases();
    source.set(bundlePath(v2), text(v2));
    const prompts = client(source);

    // Act
    const prompt = await prompts.get(`${ID}@${hashOf(v2)}`);

    // Assert
    expect(source.reads).toEqual([bundlePath(v2)]);
    expect(prompt.description).toBe('Second version');
    expect(prompt.meta).not.toHaveProperty('label');
    expect(prompt.meta.stale).toBe(false);
  });

  it('shares one read between concurrent gets', async () => {
    const source = releases();
    const prompts = client(source);

    await Promise.all([prompts.get(ID), prompts.get(ID), prompts.get(ID)]);

    expect(source.reads).toEqual(['prod.json', bundlePath(v1)]);
  });

  it('refuses a label name that is not an environment name', () => {
    for (const label of [
      'Prod',
      'index',
      'manifest',
      'com0',
      'com1',
      'lpt0',
      'lpt9',
      '1prod',
      'a/b',
    ]) {
      expect(() => client(releases(), { label })).toThrow(
        expect.objectContaining({ code: 'invalid-index' })
      );
    }
  });

  it.each([
    ['invalid JSON', '{'],
    ['another environment', labelOf('staging', [v1])],
    ['an index instead of a label', indexOf([v1])],
    [
      'a bad hash',
      JSON.stringify({
        ...JSON.parse(labelOf('prod', [])),
        prompts: [{ id: ID, contentHash: 'x' }],
      }),
    ],
    ['a duplicate id', labelOf('prod', [v1, v2])],
    ['a list instead of an object', '[]'],
    [
      'an entry that is not an object',
      JSON.stringify({ ...JSON.parse(labelOf('prod', [])), prompts: [1] }),
    ],
  ])('rejects a label with %s', async (_name, label) => {
    const source = releases();
    source.set('prod.json', label);

    const error = await failure(client(source).get(ID));

    expect(error.code).toBe('invalid-index');
    expect(error.cause).toBeUndefined();
  });

  it('rejects an index file path that leaves the directory', async () => {
    const source = fakeSource({ 'index.json': indexOf([v1], ['../refund-reply.json']) });

    expect((await failure(createPromptClient({ source }).get(ID))).code).toBe('invalid-index');
  });

  it('rejects a bundle file that holds another prompt or a changed one', async () => {
    // Arrange
    const swapped = releases();
    swapped.set(bundlePath(v1), text(other));
    const changed = releases();
    changed.set(bundlePath(v1), text({ ...v1, description: 'Tampered' }));
    const broken = releases();
    broken.set(bundlePath(v1), '{');

    // Act and assert
    expect((await failure(client(swapped).get(ID))).code).toBe('index-mismatch');
    expect((await failure(client(changed).get(ID))).code).toBe('hash-mismatch');
    expect((await failure(client(broken).get(ID))).code).toBe('invalid-bundle');
  });

  it('serves the known prompt at once after the ttl and refreshes it in the background', async () => {
    // Arrange
    const source = releases();
    const onError = vi.fn();
    const prompts = client(source, { onError });
    await prompts.get(ID);
    source.down = true;
    later(60_000);

    // Act
    const atOnce = await prompts.get(ID);
    await flush();
    const afterFailure = await prompts.get(ID);
    const sameTtl = source.reads.length;
    await prompts.get(ID);

    // Assert
    expect(atOnce.meta.stale).toBe(false);
    expect(afterFailure.meta.stale).toBe(true);
    expect(afterFailure.contentHash).toBe(hashOf(v1));
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ code: 'timeout' }));
    expect(source.reads).toHaveLength(sameTtl);
  });

  it('clears the stale flag once a refresh works again', async () => {
    // Arrange
    const source = releases();
    const prompts = client(source);
    await prompts.get(ID);
    source.down = true;
    later(60_000);
    await prompts.get(ID);
    await flush();
    source.down = false;
    later(60_000);

    // Act
    await prompts.get(ID);
    await flush();
    const prompt = await prompts.get(ID);

    // Assert
    expect(prompt.meta.stale).toBe(false);
  });

  it('throws in closed mode when a refresh fails', async () => {
    const source = releases();
    const prompts = client(source, { failMode: 'closed' });
    await prompts.get(ID);
    source.down = true;
    later(60_000);

    expect((await failure(prompts.get(ID))).code).toBe('timeout');
  });

  it('throws in open mode when nothing verified is known yet', async () => {
    const source = releases();
    source.down = true;

    expect((await failure(client(source).get(ID))).code).toBe('timeout');
  });

  it('serves the last verified prompt when the new bundle cannot be read', async () => {
    // Arrange
    const source = releases();
    const onError = vi.fn();
    const prompts = client(source, { onError });
    await prompts.get(ID);
    source.set('prod.json', labelOf('prod', [v2]));
    later(60_000);
    await prompts.get(ID);
    await flush();

    // Act
    const prompt = await prompts.get(ID);
    const reads = source.reads.length;
    await prompts.get(ID);

    // Assert
    expect(prompt.contentHash).toBe(hashOf(v1));
    expect(prompt.meta.stale).toBe(true);
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ code: 'not-found' }));
    expect(source.reads).toHaveLength(reads);
  });

  it('treats a verified label without the id as final in both modes', async () => {
    for (const failMode of ['open', 'closed'] as const) {
      // Arrange
      const source = releases();
      const prompts = client(source, { failMode });
      await prompts.get(ID);
      source.set('prod.json', labelOf('prod', [other]));
      later(60_000);
      await prompts.get(ID).catch(() => undefined);
      await flush();

      // Act
      const error = await failure(prompts.get(ID));
      const reads = source.reads.length;
      const again = await failure(prompts.get(ID));

      // Assert
      expect(error.code).toBe('not-found');
      expect(error.message).toContain(`${ID} is not listed in Label prod`);
      expect(again).toBe(error);
      expect(source.reads).toHaveLength(reads);
    }
  });

  it('revalidates on every call with ttlMs 0', async () => {
    const source = releases();
    const prompts = client(source, { failMode: 'closed', cache: { ttlMs: 0 } });

    await prompts.get(ID);
    await prompts.get(ID);

    expect(source.reads).toEqual(['prod.json', bundlePath(v1), 'prod.json if-none-match']);
  });

  it('keeps at most maxPrompts bundles', async () => {
    // Arrange
    const source = releases();
    const prompts = client(source, { failMode: 'closed', cache: { maxPrompts: 1 } });

    // Act
    await prompts.get(ID);
    await prompts.get('acme-support/other');
    await prompts.get(ID);

    // Assert
    expect(source.reads.filter((path) => path === bundlePath(v1))).toHaveLength(2);
  });

  it('serves a verified copy from the store when the source is down', async () => {
    // Arrange
    const store = memoryStore();
    await client(releases(), { cache: { store } }).get(ID);
    await flush();
    const source = releases();
    source.down = true;
    const onError = vi.fn();

    // Act
    const prompt = await client(source, { cache: { store }, onError }).get(ID);

    // Assert
    expect([...store.data.keys()]).toEqual([
      `${source.name}|prod.json`,
      `${source.name}|${bundlePath(v1)}`,
    ]);
    expect(prompt.meta.stale).toBe(true);
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ code: 'timeout' }));
  });

  it('checks a stored copy again and never serves a changed one', async () => {
    // Arrange
    const store = memoryStore();
    await client(releases(), { cache: { store } }).get(ID);
    await flush();
    store.data.set(
      `https://raw.example.com/releases/|${bundlePath(v1)}`,
      text({ ...v1, description: 'Tampered' })
    );
    const source = releases();
    source.down = true;

    // Act and assert
    expect((await failure(client(source, { cache: { store } }).get(ID))).code).toBe(
      'hash-mismatch'
    );
  });

  it('uses no store in closed mode', async () => {
    const store = memoryStore();
    await client(releases(), { cache: { store } }).get(ID);
    await flush();
    const source = releases();
    source.down = true;

    expect(
      (await failure(client(source, { cache: { store }, failMode: 'closed' }).get(ID))).code
    ).toBe('timeout');
  });

  it('reports a failed store write', async () => {
    // Arrange
    const onError = vi.fn();
    const store: PromptCacheStore = {
      get: async () => undefined,
      set: async () => {
        throw new Error('disk full');
      },
    };

    // Act
    await client(releases(), { cache: { store }, onError }).get(ID);
    await flush();

    // Assert
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ code: 'source-error' }));
  });

  it('rejects an index that is not an index', async () => {
    const source = fakeSource({ 'index.json': labelOf('prod', [v1]) });

    const error = await failure(createPromptClient({ source }).get(ID));

    expect(error.code).toBe('invalid-index');
    expect(error.message).toContain('is not a valid prompt index v1');
  });

  it('serves the old prompt when another get refreshed the label and the new bundle is missing', async () => {
    // Arrange
    const source = releases();
    const prompts = client(source);
    await prompts.get(ID);
    await prompts.get('acme-support/other');
    source.set('prod.json', labelOf('prod', [v2, other]));
    later(60_000);
    await prompts.get('acme-support/other');
    await flush();

    // Act
    const prompt = await prompts.get(ID);

    // Assert
    expect(prompt.contentHash).toBe(hashOf(v1));
    expect(prompt.meta.stale).toBe(true);
  });

  it('throws the source failure when the stored label lacks the id', async () => {
    // Arrange
    const store = memoryStore();
    const source = releases();
    source.down = true;
    store.data.set(`${source.name}|prod.json`, labelOf('prod', [other]));

    // Act and assert
    expect((await failure(client(source, { cache: { store } }).get(ID))).code).toBe('timeout');
  });

  it('throws the source failure when the store cannot be read', async () => {
    const source = releases();
    source.down = true;
    const store: PromptCacheStore = {
      get: async () => {
        throw new Error('store down');
      },
      set: async () => undefined,
    };

    expect((await failure(client(source, { cache: { store } }).get(ID))).code).toBe('timeout');
  });

  it('refuses a not-modified answer to a plain read', async () => {
    const source: PromptSource = { name: 'odd', read: async () => 'not-modified' };

    const error = await failure(client(source).get(ID));
    const pinned = await failure(client(source).get(`${ID}@${hashOf(v1)}`));

    expect(error.code).toBe('source-error');
    expect(pinned.code).toBe('source-error');
  });

  it('reads a pinned bundle once whatever id comes with the hash', async () => {
    // Arrange
    const source = releases();
    const prompts = client(source);

    // Act
    const first = await failure(prompts.get(`junk1@${hashOf(v1)}`));
    const second = await failure(prompts.get(`junk2@${hashOf(v1)}`));
    const again = await failure(prompts.get(`junk1@${hashOf(v1)}`));
    const real = await prompts.get(`${ID}@${hashOf(v1)}`);

    // Assert
    expect(source.reads).toEqual([bundlePath(v1)]);
    expect(first.code).toBe('index-mismatch');
    expect(second.code).toBe('index-mismatch');
    expect(again).toBe(first);
    expect(real.id).toBe(ID);
  });

  it('serves the stale prompt when onError throws', async () => {
    // Arrange
    const source = releases();
    const onError = vi.fn(() => {
      throw new Error('logger broke');
    });
    const prompts = client(source, { onError });
    await prompts.get(ID);
    source.down = true;
    later(60_000);
    await prompts.get(ID);
    await flush();

    // Act
    const prompt = await prompts.get(ID);

    // Assert
    expect(prompt.meta.stale).toBe(true);
    expect(onError).toHaveBeenCalled();
  });

  it.each([
    [
      'throws',
      () => {
        throw new Error('logger broke');
      },
    ],
    [
      'rejects',
      async () => {
        throw new Error('logger broke');
      },
    ],
  ])('leaves no unhandled rejection when a store write fails and onError %s', async (_, fn) => {
    // Arrange
    const unhandled = vi.fn();
    let calls = 0;
    // Not a vi.fn: a spy handles the promise it returns, which hides the rejection
    const onError = (): unknown => {
      calls++;
      return fn();
    };
    const store: PromptCacheStore = {
      get: async () => undefined,
      set: async () => {
        throw new Error('disk full');
      },
    };
    process.on('unhandledRejection', unhandled);

    // Act
    let prompt: Prompt | undefined;
    try {
      prompt = await client(releases(), { cache: { store }, onError }).get(ID);
      await flush();
    } finally {
      process.off('unhandledRejection', unhandled);
    }

    // Assert
    expect(prompt?.contentHash).toBe(hashOf(v1));
    // The label and the bundle write both fail
    expect(calls).toBe(2);
    expect(unhandled).not.toHaveBeenCalled();
  });

  it('keeps the label the source gave over an older one in the store', async () => {
    // Arrange
    const source = releases();
    source.set(bundlePath(v2), text(v2));
    source.set('prod.json', labelOf('prod', [v2]));
    const store = memoryStore();
    const onError = vi.fn();
    const prompts = client(source, { cache: { store }, onError });
    await prompts.get(ID);
    await flush();
    // Another instance saved an older label, or the newer write failed
    store.data.set(`${source.name}|prod.json`, labelOf('prod', [v1]));
    store.data.set(`${source.name}|${bundlePath(v1)}`, text(v1));
    source.down = true;
    later(60_000);
    await prompts.get(ID);
    await flush();
    later(60_000);
    await prompts.get(ID);
    await flush();

    // Act
    const prompt = await prompts.get(ID);

    // Assert
    expect(prompt.contentHash).toBe(hashOf(v2));
    expect(prompt.meta.stale).toBe(true);
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ code: 'timeout' }));
  });

  it('refuses a not-modified answer to a pointer read sent without an ETag', async () => {
    // Arrange
    let pointerReads = 0;
    const source: PromptSource = {
      name: 'no-etag',
      read: async (path) => {
        if (path !== 'prod.json') return { text: text(v1) };
        pointerReads++;
        return pointerReads === 1 ? { text: labelOf('prod', [v1]) } : 'not-modified';
      },
    };
    const prompts = client(source, { failMode: 'closed' });
    await prompts.get(ID);
    later(60_000);

    // Act
    const error = await failure(prompts.get(ID));

    // Assert
    expect(error.code).toBe('source-error');
    expect(error.message).toContain('answered not modified to a plain read');
  });

  it('forgets a prompt evicted by maxPrompts, so it is not served stale', async () => {
    // Arrange
    const source = releases();
    const prompts = client(source, { cache: { maxPrompts: 1 } });
    await prompts.get(ID);
    await prompts.get('acme-support/other');
    source.down = true;
    later(60_000);

    // Act
    const error = await failure(prompts.get(ID));

    // Assert
    expect(error.code).toBe('timeout');
  });

  it.each([
    ['a reference above 512 characters', `acme-support/${'x'.repeat(500)}`],
    ['a line break', `${ID}\r\nX-Injected: yes`],
    ['a line separator', `${ID}\u2028X-Injected: yes`],
    ['a next line character', `${ID}\u0085X-Injected: yes`],
    ['a bidi override', `${ID}\u202Eyes`],
  ])('refuses %s without a read, an echo or a cached miss', async (_name, ref) => {
    // Arrange
    const source = releases();
    const prompts = client(source);

    // Act
    const first = await failure(prompts.get(ref));
    const second = await failure(prompts.get(ref));

    // Assert
    expect(first.code).toBe('not-found');
    expect(first.message).toBe('Prompt reference is not valid.');
    expect(second).not.toBe(first);
    expect(source.reads).toEqual([]);
  });

  it('retries an unpinned index-mismatch on the next get', async () => {
    // Arrange
    // A CDN that serves the new index before the new prompt file
    const source = fakeSource({ 'index.json': indexOf([v2]), 'refund-reply.json': text(v1) });
    const prompts = createPromptClient({ source });
    const error = await failure(prompts.get(ID));
    source.set('refund-reply.json', text(v2));

    // Act
    const prompt = await prompts.get(ID);

    // Assert
    expect(error.code).toBe('index-mismatch');
    expect(prompt.contentHash).toBe(hashOf(v2));
  });

  it.each([
    ['of 512 characters', `acme-support/${'x'.repeat(499)}`],
    ['with a plain space', 'acme-support/refund reply'],
  ])('still looks up a reference %s', async (_name, ref) => {
    const source = releases();

    const error = await failure(client(source).get(ref));

    expect(error.message).toContain('is not listed');
    expect(source.reads).toEqual(['prod.json']);
  });

  it.each([NaN, -1, Infinity, 1.5])('refuses %s as cache.ttlMs or cache.maxPrompts', (value) => {
    expect(() => client(releases(), { cache: { ttlMs: value } })).toThrow(
      expect.objectContaining({
        name: 'RangeError',
        message: 'cache.ttlMs must be a whole number of 0 or more.',
      })
    );
    expect(() => client(releases(), { cache: { maxPrompts: value } })).toThrow(
      expect.objectContaining({
        name: 'RangeError',
        message: 'cache.maxPrompts must be a whole number of 1 or more.',
      })
    );
  });

  it('wraps an error from a custom source', async () => {
    const source: PromptSource = {
      name: 'custom',
      read: async () => {
        throw new Error('token abc123 rejected');
      },
    };

    const error = await failure(client(source).get(ID));

    expect(error.code).toBe('source-error');
    expect(error.message).not.toContain('abc123');
  });
});
