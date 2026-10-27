import { PromptLoadError } from './errors.js';
import { refuseUrl } from './internal/url-rules.js';
import { assertFilePath, decodeUtf8, DEFAULT_MAX_BYTES, wholeNumber } from './paths.js';
import type {
  HttpSourceOptions,
  PromptSource,
  RuntimeFetch,
  RuntimeResponse,
  SourceFile,
} from './types.js';

const DEFAULT_TIMEOUT_MS = 5_000;

interface HttpConfig {
  readonly base: URL;
  readonly name: string;
  readonly fetch: RuntimeFetch;
  readonly headers: Readonly<Record<string, string>>;
  readonly timeoutMs: number;
  readonly maxBytes: number;
}

type Reader = ReturnType<NonNullable<RuntimeResponse['body']>['getReader']>;

const hostOf = (host: string): string => {
  const name = new URL(`https://${host}/`).hostname;
  return name.endsWith('.') ? name.slice(0, -1) : name;
};

/** Read the stream chunk by chunk, counting bytes, and cancel it above the limit or on timeout. */
async function collect(
  reader: Reader,
  chunks: Uint8Array[],
  size: number,
  max: number,
  timeout: Promise<never>
): Promise<number> {
  let chunk: Awaited<ReturnType<Reader['read']>>;
  try {
    chunk = await Promise.race([reader.read(), timeout]);
  } catch (error) {
    reader.cancel().catch(() => undefined);
    throw error;
  }
  if (chunk.done) return size;
  const total = size + (chunk.value?.byteLength ?? 0);
  if (total > max) {
    reader.cancel().catch(() => undefined);
    return total;
  }
  if (chunk.value) chunks.push(chunk.value);
  return collect(reader, chunks, total, max, timeout);
}

/**
 * Cancel a body that is not read, so the connection is not held open. Never awaited, here
 * or for a reader: the cancel of a custom body can hang as well.
 */
const discard = (response: RuntimeResponse): void => {
  Promise.resolve()
    .then(() => response.body?.getReader().cancel())
    .catch(() => undefined);
};

async function readBody(
  response: RuntimeResponse,
  max: number,
  timeout: Promise<never>
): Promise<Uint8Array | undefined> {
  if (Number(response.headers.get('content-length')) > max) {
    discard(response);
    return undefined;
  }
  const reader = response.body?.getReader();
  if (!reader) return new Uint8Array(0);
  const chunks: Uint8Array[] = [];
  const size = await collect(reader, chunks, 0, max, timeout);
  if (size > max) return undefined;
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}

const isRedirect = (response: RuntimeResponse, url: string): boolean =>
  response.type === 'opaqueredirect' ||
  (response.status >= 300 && response.status < 400 && response.status !== 304) ||
  response.redirected === true ||
  (response.url !== undefined && response.url !== '' && response.url !== url);

async function readFile(
  config: HttpConfig,
  path: string,
  etag?: string
): Promise<SourceFile | 'not-modified'> {
  assertFilePath(path);
  const url = new URL(path, config.base).href;
  const where = `Prompt file ${path} from ${config.name}`;
  const fail = (
    code: 'source-error' | 'not-found' | 'redirect-refused' | 'too-large',
    why: string
  ) => new PromptLoadError(code, `${where} ${why}`, path);
  const signal = AbortSignal.timeout(config.timeoutMs);
  // A custom fetch can ignore the signal, so every wait races the timeout as well
  const timeout = new Promise<never>((_resolve, reject) => {
    signal.addEventListener('abort', () => reject(new Error('timeout')), { once: true });
  });
  // Handled here too: the timer also fires after a read that finished in time
  timeout.catch(() => undefined);
  try {
    const request = config.fetch(url, {
      method: 'GET',
      headers: {
        ...config.headers,
        Accept: 'application/json',
        ...(etag !== undefined && { 'If-None-Match': etag }),
      },
      redirect: 'manual',
      signal,
    });
    // A response that only comes after the timeout is cancelled too, so it frees its connection
    request.then(
      (late) => {
        if (signal.aborted) discard(late);
      },
      () => undefined
    );
    const response = await Promise.race([request, timeout]);
    const { status } = response;
    const redirect = isRedirect(response, url);
    if (redirect || status !== 200) discard(response);
    if (redirect) {
      throw fail(
        'redirect-refused',
        'answered with a redirect. Point the source at the final URL.'
      );
    }
    if (status === 304 && etag !== undefined) return 'not-modified';
    if (status === 404 || status === 410) throw fail('not-found', 'does not exist.');
    if (status !== 200) throw fail('source-error', `answered with status ${status}.`);
    const bytes = await readBody(response, config.maxBytes, timeout);
    if (!bytes) throw fail('too-large', `is larger than ${config.maxBytes} bytes.`);
    const tag = response.headers.get('etag');
    return { text: decodeUtf8(bytes, where, path), ...(tag ? { etag: tag } : undefined) };
  } catch (error) {
    if (error instanceof PromptLoadError) throw error;
    // The original error is left out: it can carry the request with its headers
    if (signal.aborted) {
      throw new PromptLoadError(
        'timeout',
        `${where} did not arrive within ${config.timeoutMs} ms.`,
        path
      );
    }
    throw fail('source-error', 'could not be fetched. Check the URL and the network.');
  }
}

/**
 * A source that reads prompt files over HTTPS, such as the raw file URL of a Git branch.
 *
 * The base URL must be `https`, without credentials, query or fragment, and its host must
 * not be loopback, link-local or a metadata endpoint. Private network hosts are allowed;
 * set `allowedHosts` to pin the host. Host names are not resolved, so a public name that
 * points at a local address is not caught; `allowedHosts` and egress rules cover that.
 * Redirects are refused. Every request has a timeout that covers the body, and files above
 * `maxBytes` are refused.
 *
 * @param baseUrl - URL of the directory that holds the prompt files
 * @param options - Headers, fetch, timeout, size limit and allowed hosts
 * @returns A source for `createPromptClient`
 * @throws {PromptLoadError} `url-refused` when the base URL breaks the rules
 * @throws {RangeError} when `timeoutMs` or `maxBytes` is not a whole number of 1 or more
 *
 * @example
 * const source = httpSource('https://raw.githubusercontent.com/acme/app/main/.promptscript/releases/', {
 *   headers: { Authorization: `Bearer ${token}` },
 * });
 */
export function httpSource(baseUrl: string, options: HttpSourceOptions = {}): PromptSource {
  const refused = refuseUrl(baseUrl, { allowPrivate: true });
  if (refused) {
    throw new PromptLoadError('url-refused', `Prompt source URL refused: ${refused}.`);
  }
  const base = new URL(baseUrl);
  if (!base.pathname.endsWith('/')) base.pathname += '/';
  if (options.allowedHosts) {
    let allowed: string[];
    try {
      allowed = options.allowedHosts.map(hostOf);
    } catch {
      throw new PromptLoadError('url-refused', 'An allowedHosts entry is not a host name.');
    }
    if (!allowed.includes(hostOf(base.hostname))) {
      throw new PromptLoadError(
        'url-refused',
        'Prompt source URL refused: host is not in allowedHosts.'
      );
    }
  }
  const config: HttpConfig = {
    base,
    name: `${base.origin}${base.pathname}`,
    // Called through globalThis: browsers and edge workers refuse fetch with another receiver
    fetch: options.fetch ?? ((url, init) => globalThis.fetch(url, init)),
    headers: options.headers ?? {},
    timeoutMs: wholeNumber('timeoutMs', options.timeoutMs ?? DEFAULT_TIMEOUT_MS, 1),
    maxBytes: wholeNumber('maxBytes', options.maxBytes ?? DEFAULT_MAX_BYTES, 1),
  };
  return { name: config.name, read: (path, etag) => readFile(config, path, etag) };
}
