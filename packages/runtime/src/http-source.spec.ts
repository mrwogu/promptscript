import { describe, expect, expectTypeOf, it, vi } from 'vitest';
import { PromptLoadError } from './errors.js';
import { httpSource } from './http-source.js';
import type { RuntimeFetch, RuntimeRequestInit, RuntimeResponse } from './types.js';

const BASE = 'https://raw.example.com/acme/app/main/releases';
const SECRET = 'Bearer secret-token';

function fetchReturning(response: RuntimeResponse | (() => RuntimeResponse)) {
  return vi.fn<RuntimeFetch>(async () => (typeof response === 'function' ? response() : response));
}

async function failure(promise: Promise<unknown>): Promise<PromptLoadError> {
  try {
    await promise;
  } catch (error) {
    if (error instanceof PromptLoadError) return error;
    throw error;
  }
  throw new Error('expected a failure');
}

describe('httpSource', () => {
  it('accepts the global fetch as its fetch option', () => {
    expectTypeOf(globalThis.fetch).toExtend<RuntimeFetch>();
  });

  it.each([
    ['http://raw.example.com/releases/', 'scheme is not https'],
    ['https://user:pass@raw.example.com/', 'URL carries credentials'],
    ['https://raw.example.com/?token=1', 'URL carries a query or fragment'],
    ['https://localhost/', 'host is local or a metadata endpoint'],
    ['https://169.254.169.254/latest/', 'host is local or a metadata endpoint'],
    ['https://[::ffff:7f00:1]/', 'host is local or a metadata endpoint'],
    ['https://metadata.google.internal./', 'host is local or a metadata endpoint'],
  ])('refuses %s', (url, reason) => {
    expect(() => httpSource(url)).toThrow(expect.objectContaining({ code: 'url-refused' }));
    expect(() => httpSource(url)).toThrow(reason);
  });

  it('never repeats the URL in the refusal', () => {
    expect(() => httpSource('https://user:hunter2@raw.example.com/')).not.toThrow(/hunter2/);
  });

  it('allows private network hosts', () => {
    expect(httpSource('https://10.0.0.5/releases').name).toBe('https://10.0.0.5/releases/');
    expect(httpSource('https://prompts.corp.internal/').name).toBe(
      'https://prompts.corp.internal/'
    );
  });

  it('checks allowedHosts case-insensitively', () => {
    const allowedHosts = ['RAW.Example.com.'];

    expect(httpSource(BASE, { allowedHosts }).name).toBe(`${BASE}/`);
    expect(() => httpSource('https://other.example.com/', { allowedHosts })).toThrow(
      'host is not in allowedHosts'
    );
    expect(() => httpSource(BASE, { allowedHosts: ['bad host'] })).toThrow(
      'An allowedHosts entry is not a host name'
    );
  });

  it('sends a GET with the caller headers, Accept, the ETag and no redirects', async () => {
    // Arrange
    const fetch = fetchReturning(new Response('{}', { headers: { ETag: '"v2"' } }));
    const source = httpSource(BASE, { fetch, headers: { Authorization: SECRET } });

    // Act
    const file = await source.read('prod.json', '"v1"');

    // Assert
    expect(file).toEqual({ text: '{}', etag: '"v2"' });
    const [url, init] = fetch.mock.calls[0] as [string, RuntimeRequestInit];
    expect(url).toBe(`${BASE}/prod.json`);
    expect(init).toMatchObject({
      method: 'GET',
      redirect: 'manual',
      headers: { Authorization: SECRET, Accept: 'application/json', 'If-None-Match': '"v1"' },
    });
    expect(init.signal.aborted).toBe(false);
    expect(Object.keys(init)).not.toContain('credentials');
  });

  it('calls the global fetch with the global scope as its receiver', async () => {
    // Arrange
    const receivers: unknown[] = [];
    vi.stubGlobal('fetch', function (this: unknown) {
      receivers.push(this);
      return Promise.resolve(new Response('{}'));
    });

    // Act
    try {
      await httpSource(BASE).read('prod.json');
    } finally {
      vi.unstubAllGlobals();
    }

    // Assert
    expect(receivers).toEqual([globalThis]);
  });

  it('reads a file under the base path', async () => {
    const fetch = fetchReturning(new Response('{"a":1}'));

    await httpSource(BASE, { fetch }).read('bundles/sha256-ab.json');

    expect(fetch.mock.calls[0]?.[0]).toBe(`${BASE}/bundles/sha256-ab.json`);
  });

  it.each(['../prod.json', '/prod.json', 'a/b/c.json', '.hidden.json', 'prod.txt', 'a\\b.json'])(
    'refuses the path %s',
    async (path) => {
      const fetch = fetchReturning(new Response('{}'));

      expect((await failure(httpSource(BASE, { fetch }).read(path))).code).toBe('invalid-index');
      expect(fetch).not.toHaveBeenCalled();
    }
  );

  it('answers not-modified to a 304 after an ETag', async () => {
    const fetch = fetchReturning(() => new Response(null, { status: 304 }));
    const source = httpSource(BASE, { fetch });

    expect(await source.read('prod.json', '"v1"')).toBe('not-modified');
    expect((await failure(source.read('prod.json'))).code).toBe('source-error');
  });

  it.each([
    [404, 'not-found'],
    [410, 'not-found'],
    [500, 'source-error'],
    [403, 'source-error'],
    [302, 'redirect-refused'],
    [307, 'redirect-refused'],
  ])('maps status %i to %s', async (status, code) => {
    const fetch = fetchReturning(new Response(null, { status }));

    expect((await failure(httpSource(BASE, { fetch }).read('prod.json'))).code).toBe(code);
  });

  it('refuses an opaque redirect, a followed redirect and a changed URL', async () => {
    const responses: RuntimeResponse[] = [
      { status: 0, type: 'opaqueredirect', headers: new Headers() },
      { status: 200, redirected: true, headers: new Headers() },
      { status: 200, url: 'https://elsewhere.example.com/prod.json', headers: new Headers() },
    ];
    for (const response of responses) {
      const source = httpSource(BASE, { fetch: fetchReturning(response) });

      expect((await failure(source.read('prod.json'))).code).toBe('redirect-refused');
    }
  });

  it('refuses a body above maxBytes by its length or while streaming', async () => {
    // Arrange
    const declared = new Response('x'.repeat(10), { headers: { 'Content-Length': '10' } });
    const cancel = vi.fn(async () => undefined);
    let sent = 0;
    const streamed: RuntimeResponse = {
      status: 200,
      headers: new Headers(),
      body: {
        getReader: () => ({
          read: async () => ({ done: sent++ > 5, value: new Uint8Array(4) }),
          cancel,
        }),
      },
    };

    // Act
    const byLength = await failure(
      httpSource(BASE, { fetch: fetchReturning(declared), maxBytes: 5 }).read('a.json')
    );
    const byStream = await failure(
      httpSource(BASE, { fetch: fetchReturning(streamed), maxBytes: 10 }).read('a.json')
    );

    // Assert
    expect(byLength.code).toBe('too-large');
    expect(byStream.code).toBe('too-large');
    expect(cancel).toHaveBeenCalled();
  });

  it('skips a chunk without bytes', async () => {
    // Arrange
    const chunks = [
      { done: false },
      { done: false, value: new TextEncoder().encode('{}') },
      { done: true },
    ];
    const fetch = fetchReturning({
      status: 200,
      headers: new Headers(),
      body: {
        getReader: () => ({ read: async () => chunks.shift()!, cancel: async () => undefined }),
      },
    });

    // Act and assert
    expect(await httpSource(BASE, { fetch }).read('a.json')).toEqual({ text: '{}' });
  });

  it('cancels a body it does not read', async () => {
    // Arrange
    const cancel = vi.fn(async () => undefined);
    const body = { getReader: () => ({ read: async () => ({ done: true }), cancel }) };
    const big = { status: 200, headers: new Headers({ 'Content-Length': '100' }), body };
    const missing = { status: 404, headers: new Headers(), body };

    // Act
    const tooLarge = await failure(
      httpSource(BASE, { fetch: fetchReturning(big), maxBytes: 5 }).read('a.json')
    );
    const notFound = await failure(
      httpSource(BASE, { fetch: fetchReturning(missing) }).read('a.json')
    );

    // Assert
    expect(tooLarge.code).toBe('too-large');
    expect(notFound.code).toBe('not-found');
    expect(cancel).toHaveBeenCalledTimes(2);
  });

  it('ignores a body that fails to cancel', async () => {
    const cancel = vi.fn(() => Promise.reject(new Error('stream broken')));
    const body = { getReader: () => ({ read: async () => ({ done: true }), cancel }) };
    const fetch = fetchReturning({ status: 500, headers: new Headers(), body });

    expect((await failure(httpSource(BASE, { fetch }).read('a.json'))).code).toBe('source-error');
  });

  it('reads an empty body as empty text', async () => {
    const fetch = fetchReturning({ status: 200, headers: new Headers(), body: null });

    expect(await httpSource(BASE, { fetch }).read('a.json')).toEqual({ text: '' });
  });

  it('refuses invalid UTF-8', async () => {
    const fetch = fetchReturning(new Response(new Uint8Array([0x7b, 0xff, 0x7d])));

    const error = await failure(httpSource(BASE, { fetch }).read('a.json'));

    expect(error.code).toBe('source-error');
    expect(error.message).toContain('not valid UTF-8');
  });

  it('times out while waiting for headers or inside the body', async () => {
    // Arrange
    const waitForAbort = (signal: RuntimeRequestInit['signal']): Promise<never> =>
      new Promise((_resolve, reject) => {
        signal.addEventListener('abort', () => reject(signal.reason));
      });
    const slowHeaders = vi.fn<RuntimeFetch>((_url, init) => waitForAbort(init.signal));
    const slowBody = vi.fn<RuntimeFetch>(async (_url, init) => ({
      status: 200,
      headers: new Headers(),
      body: {
        getReader: () => ({ read: () => waitForAbort(init.signal), cancel: async () => undefined }),
      },
    }));

    // Act
    const headers = await failure(
      httpSource(BASE, { fetch: slowHeaders, timeoutMs: 10 }).read('a.json')
    );
    const body = await failure(httpSource(BASE, { fetch: slowBody, timeoutMs: 10 }).read('a.json'));

    // Assert
    expect(headers.code).toBe('timeout');
    expect(body.code).toBe('timeout');
  });

  it('reports a network failure without the original error or any header', async () => {
    // Arrange
    const fetch = vi.fn<RuntimeFetch>(async () => {
      throw new TypeError(`fetch failed with ${SECRET}`);
    });

    // Act
    const error = await failure(
      httpSource(BASE, { fetch, headers: { Authorization: SECRET } }).read('a.json')
    );

    // Assert
    expect(error.code).toBe('source-error');
    expect(error.message).not.toContain('secret-token');
    expect(error.cause).toBeUndefined();
    expect(error.path).toBe('a.json');
  });
});
