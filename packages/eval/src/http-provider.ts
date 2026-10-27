import { Buffer } from 'node:buffer';
import { refuseUrl } from '@promptscript/core';
import {
  toAnthropicMessages,
  toOpenAIChat,
  type PromptModelParams,
  type RenderedPrompt,
} from '@promptscript/runtime';
import { MAX_TOKENS } from './cache.js';
import { EVAL_CODES, EvalProviderError, type EvalCode } from './errors.js';
import type { EvalProvider, EvalProviderContext, EvalRequest, EvalResponse } from './provider.js';
import { isRecord } from './shape.js';

/** Settings of one HTTP provider. */
export interface ProviderConfig {
  /** Name of the provider entry, such as `anthropic`; messages name it */
  name: string;
  /** API base URL */
  baseUrl: string;
  /** Returns the API key; read at call time and never stored */
  apiKey: () => string;
  /** Other values to keep out of error echoes, such as every environment value */
  secrets?: () => readonly string[];
  /** Hosts allowed besides the built-in defaults, from `--allow-host` */
  allowedHosts?: readonly string[];
  /** Allow loopback hosts, and plain http for them, from `--allow-local` */
  allowLocal?: boolean;
  /** Time limit of one call in milliseconds, response body included; default 60000 */
  timeoutMs?: number;
}

/** What a provider needs from its host. */
export interface ProviderDeps {
  /** Fetch to use instead of the global one */
  fetch?: typeof globalThis.fetch;
}

/** Hosts a provider may call without `--allow-host`. */
export const DEFAULT_PROVIDER_HOSTS: readonly string[] = ['api.anthropic.com', 'api.openai.com'];

const MAX_BODY_BYTES = 4 * 1024 * 1024;
const MAX_ECHO = 200;
const DEFAULT_TIMEOUT_MS = 60_000;

function hostOf(hostname: string): string {
  const host = hostname.toLowerCase();
  return host.endsWith('.') ? host.slice(0, -1) : host;
}

function isLoopback(host: string): boolean {
  return (
    host === 'localhost' ||
    host.endsWith('.localhost') ||
    host === '[::1]' ||
    /^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host)
  );
}

/**
 * Check a provider URL. The host must be a built-in default or in
 * `allowedHosts`, and pass the core URL rules without private addresses.
 * With `allowLocal`, loopback hosts pass too, over http or https.
 *
 * @param url - Provider URL
 * @param options - Allowed hosts and the loopback switch
 * @returns The reason the URL is refused, or undefined when it passes
 */
export function refuseProviderUrl(
  url: string,
  options: Pick<ProviderConfig, 'allowedHosts' | 'allowLocal'>
): string | undefined {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return 'not a valid URL';
  }
  const host = hostOf(parsed.hostname);
  // The core rules refuse http and every loopback host, so the opt-in comes first
  if (options.allowLocal === true && isLoopback(host)) {
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return 'scheme is not http';
    if (parsed.username || parsed.password) return 'URL carries credentials';
    if (parsed.search || parsed.hash) return 'URL carries a query or fragment';
    return undefined;
  }
  const refused = refuseUrl(parsed, { allowPrivate: false });
  if (refused !== undefined) return refused;
  const allowed = [...DEFAULT_PROVIDER_HOSTS, ...(options.allowedHosts ?? []).map(hostOf)];
  return allowed.includes(host) ? undefined : 'host is not allowed; pass --allow-host to allow it';
}

function isHidden(code: number): boolean {
  return (
    code < 0x20 ||
    (code >= 0x7f && code <= 0x9f) ||
    code === 0x200e ||
    code === 0x200f ||
    (code >= 0x202a && code <= 0x202e) ||
    (code >= 0x2066 && code <= 0x2069)
  );
}

// Provider text in a message: no key, no bearer token, one line, no control
// or bidi characters, at most 200 characters.
function withoutKey(text: string, key: string): string {
  return key.length > 0 ? text.split(key).join('[key]') : text;
}

function echo(text: string, config: ProviderConfig): string {
  // Hidden characters go first, so they cannot split a key past the scrub and come back out
  const visible = [...text.replaceAll(/[\r\n\t]+/g, ' ')]
    .filter((char) => !isHidden(char.codePointAt(0) ?? 0))
    .join('');
  // Longest first, so a value that holds the key and more is scrubbed whole
  const key = config.apiKey();
  const values = [key, ...(config.secrets?.() ?? [])]
    .filter((value) => value.length > 0)
    .sort((a, b) => b.length - a.length);
  let clean = visible;
  for (const value of values) clean = clean.split(value).join(value === key ? '[key]' : '[secret]');
  return clean.replaceAll(/Bearer\s+[^\s"']+/gi, 'Bearer [token]').slice(0, MAX_ECHO);
}

// The message of a JSON error body, else the whole body. JSON goes through
// JSON.stringify, so an escaped key such as `a\/b` is plain again before the scrub.
function errorText(body: string): string {
  let parsed: unknown;
  try {
    parsed = JSON.parse(body);
  } catch {
    return body;
  }
  const error = isRecord(parsed) ? parsed['error'] : undefined;
  if (isRecord(error) && typeof error['message'] === 'string') return error['message'];
  if (typeof error === 'string') return error;
  return JSON.stringify(parsed);
}

function retryAfter(header: string | null): number | undefined {
  if (header === null || !/^\d+$/.test(header.trim())) return undefined;
  return Number(header.trim()) * 1000;
}

async function readBody(response: Response, name: string): Promise<string> {
  if (response.body === null) return '';
  const chunks: Uint8Array[] = [];
  let size = 0;
  // Leaving the loop early cancels the stream
  for await (const chunk of response.body) {
    size += chunk.byteLength;
    if (size > MAX_BODY_BYTES) {
      throw new EvalProviderError(
        `${name} answered with a body over ${MAX_BODY_BYTES} bytes.`,
        EVAL_CODES.RESPONSE_TOO_LARGE
      );
    }
    chunks.push(chunk);
  }
  return new TextDecoder().decode(Buffer.concat(chunks));
}

interface Transport {
  config: ProviderConfig;
  fetch: typeof globalThis.fetch;
  url: string;
  host: string;
}

function failure(message: string, code: EvalCode, status?: number): EvalProviderError {
  return new EvalProviderError(message, code, status === undefined ? {} : { status });
}

// Fetch and read the body under the time limit; every failure is a provider error.
async function exchange(
  transport: Transport,
  init: { headers: Record<string, string>; body: string },
  context: EvalProviderContext
): Promise<{ response: Response; text: string; latencyMs: number }> {
  const { config, url, host } = transport;
  const timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const signal = AbortSignal.any([context.signal, AbortSignal.timeout(timeoutMs)]);
  const started = Date.now();
  try {
    const response = await transport.fetch(url, {
      method: 'POST',
      ...init,
      redirect: 'manual',
      signal,
    });
    const text = await readBody(response, config.name);
    return { response, text, latencyMs: Date.now() - started };
  } catch (error) {
    if (error instanceof EvalProviderError) throw error;
    if (context.signal.aborted) {
      throw failure(`${config.name}: the run stopped during the call.`, EVAL_CODES.RUN_STOPPED);
    }
    const problem = signal.aborted ? `no answer within ${timeoutMs} ms` : `could not reach ${host}`;
    throw failure(`${config.name}: ${problem}.`, EVAL_CODES.PROVIDER_FAILED);
  }
}

function statusError(transport: Transport, response: Response, text: string): EvalProviderError {
  const { config, host } = transport;
  const { status } = response;
  if (status >= 300 && status < 400) {
    return failure(
      `${config.name}: ${host} answered with a redirect, which is not followed.`,
      EVAL_CODES.URL_REFUSED,
      status
    );
  }
  const details = { status, ...withRetryAfter(response) };
  if (status >= 400 && status < 500) {
    const said = echo(errorText(text), config);
    return new EvalProviderError(
      `${config.name} refused the request with status ${status}: ${said}`,
      EVAL_CODES.PROVIDER_REJECTED,
      details
    );
  }
  return new EvalProviderError(
    `${config.name} failed with status ${status}.`,
    EVAL_CODES.PROVIDER_FAILED,
    details
  );
}

// One POST with the fixed headers of the adapter, a time limit over the whole
// exchange, no redirects and a capped body. Returns the parsed JSON of a 200.
async function post(
  transport: Transport,
  headers: Record<string, string>,
  body: unknown,
  context: EvalProviderContext
): Promise<{ json: unknown; latencyMs: number }> {
  const { config, url, host } = transport;
  const refused = refuseProviderUrl(url, config);
  if (refused !== undefined) {
    throw failure(`${config.name}: host ${host} is refused: ${refused}.`, EVAL_CODES.URL_REFUSED);
  }
  const { response, text, latencyMs } = await exchange(
    transport,
    { headers, body: JSON.stringify(body) },
    context
  );
  if (response.status !== 200) throw statusError(transport, response, text);
  try {
    return { json: JSON.parse(text) as unknown, latencyMs };
  } catch {
    throw failure(
      `${config.name} answered with a body that is not JSON.`,
      EVAL_CODES.PROVIDER_FAILED,
      200
    );
  }
}

function withRetryAfter(response: Response): { retryAfterMs?: number } {
  const delay = retryAfter(response.headers.get('retry-after'));
  return delay === undefined ? {} : { retryAfterMs: delay };
}

function count(value: unknown): number | undefined {
  const valid = typeof value === 'number' && Number.isInteger(value) && value >= 0;
  return valid && value <= MAX_TOKENS ? value : undefined;
}

// A provider that echoes the key must not put it into a committed cache entry
function answerOf(
  config: ProviderConfig,
  text: string,
  stopReason: unknown,
  usage: EvalResponse['usage'],
  latencyMs: number
): EvalResponse {
  const key = config.apiKey();
  return {
    text: withoutKey(text, key),
    usage,
    latencyMs,
    status: 200,
    ...(typeof stopReason === 'string' ? { stopReason: withoutKey(stopReason, key) } : {}),
  };
}

function usageOf(
  usage: unknown,
  inputKey: string,
  outputKey: string,
  name: string
): EvalResponse['usage'] {
  const input = isRecord(usage) ? count(usage[inputKey]) : undefined;
  const output = isRecord(usage) ? count(usage[outputKey]) : undefined;
  if (input === undefined || output === undefined) {
    throw new EvalProviderError(
      `${name} answered without valid token counts in usage.${inputKey} and usage.${outputKey}, whole numbers up to ${MAX_TOKENS}.`,
      EVAL_CODES.USAGE_INVALID,
      { status: 200 }
    );
  }
  return { inputTokens: input, outputTokens: output };
}

// A plain copy of the rendered prompt for the mapper of `provider`: the model
// and params of the request replace the bundle's, which is never edited.
function renderedFor(request: EvalRequest, provider: 'anthropic' | 'openai'): RenderedPrompt {
  const params = request.params as PromptModelParams;
  return {
    messages: request.messages,
    model: { ref: request.modelRef, provider, apiId: request.apiId, params },
    params,
    ...(request.output === undefined ? {} : { output: request.output }),
    meta: {
      id: request.promptId,
      contentHash: '',
      source: 'eval',
      loadedAt: '',
      stale: false,
      warnings: [],
    },
  };
}

function transportOf(config: ProviderConfig, path: string, deps: ProviderDeps): Transport {
  let base = config.baseUrl;
  while (base.endsWith('/')) base = base.slice(0, -1);
  const url = `${base}${path}`;
  let host = '';
  try {
    host = hostOf(new URL(url).hostname);
  } catch {
    // refuseProviderUrl names the bad URL below
  }
  const refused = refuseProviderUrl(url, config);
  if (refused !== undefined) {
    throw failure(
      `${config.name}: host ${host || 'of the base URL'} is refused: ${refused}.`,
      EVAL_CODES.URL_REFUSED
    );
  }
  return { config, fetch: deps.fetch ?? globalThis.fetch, url, host };
}

/**
 * Create a provider for the Anthropic Messages API. The body comes from the
 * runtime mapper; this adds the URL, the fixed headers and the transport
 * rules: an allowed host, no redirects, a time limit and a 4 MiB body cap.
 *
 * @param config - Name, base URL, key and transport limits
 * @param deps - Fetch to use instead of the global one
 * @returns The provider
 * @throws EvalProviderError `PS6302` when the base URL is refused
 */
export function createAnthropicProvider(
  config: ProviderConfig,
  deps: ProviderDeps = {}
): EvalProvider {
  const transport = transportOf(config, '/v1/messages', deps);
  return async (request, context) => {
    const body = toAnthropicMessages(renderedFor(request, 'anthropic'), {
      maxTokens: request.maxOutputTokens,
    });
    const headers = {
      'content-type': 'application/json',
      'anthropic-version': '2023-06-01',
      'x-api-key': config.apiKey(),
    };
    const { json, latencyMs } = await post(transport, headers, body, context);
    const record = isRecord(json) ? json : {};
    const blocks = Array.isArray(record['content']) ? record['content'] : [];
    const text = blocks
      .filter(
        (block): block is Record<string, unknown> => isRecord(block) && block['type'] === 'text'
      )
      .map((block) => (typeof block['text'] === 'string' ? block['text'] : ''))
      .join('');
    const usage = usageOf(record['usage'], 'input_tokens', 'output_tokens', config.name);
    return answerOf(config, text, record['stop_reason'], usage, latencyMs);
  };
}

/**
 * Create a provider for an OpenAI-compatible Chat Completions API, with the
 * same transport rules as {@link createAnthropicProvider}. The request body
 * follows the public OpenAI documentation, so gateways may differ.
 *
 * @param config - Name, base URL, key and transport limits
 * @param deps - Fetch to use instead of the global one
 * @returns The provider
 * @throws EvalProviderError `PS6302` when the base URL is refused
 */
export function createOpenAICompatibleProvider(
  config: ProviderConfig,
  deps: ProviderDeps = {}
): EvalProvider {
  const transport = transportOf(config, '/chat/completions', deps);
  return async (request, context) => {
    const body = toOpenAIChat(renderedFor(request, 'openai'), {
      maxTokens: request.maxOutputTokens,
    });
    const headers = {
      'content-type': 'application/json',
      authorization: `Bearer ${config.apiKey()}`,
    };
    const { json, latencyMs } = await post(transport, headers, body, context);
    const record = isRecord(json) ? json : {};
    const choices = Array.isArray(record['choices']) ? record['choices'] : [];
    const first: unknown = choices[0];
    const message = isRecord(first) ? first['message'] : undefined;
    const content = isRecord(message) ? message['content'] : undefined;
    const finish = isRecord(first) ? first['finish_reason'] : undefined;
    const usage = usageOf(record['usage'], 'prompt_tokens', 'completion_tokens', config.name);
    return answerOf(config, typeof content === 'string' ? content : '', finish, usage, latencyMs);
  };
}
