import { describe, expect, it } from 'vitest';
import {
  createAnthropicProvider,
  createOpenAICompatibleProvider,
  refuseProviderUrl,
  type ProviderConfig,
} from './http-provider.js';
import type { EvalRequest } from './provider.js';

const SECRET = 'sk-test-0123456789abcdef';

const request = (patch: Partial<EvalRequest> = {}): EvalRequest => ({
  promptId: 'acme-support/refund-reply',
  provider: 'anthropic',
  apiId: 'claude-sonnet-5-5',
  modelRef: 'claude-sonnet-5-5',
  messages: [
    { role: 'system', content: 'You help with refunds.' },
    { role: 'user', content: 'Customer wrote: Where is ${HOME}?' },
  ],
  params: { maxTokens: 600, temperature: 0 },
  output: {
    type: 'object',
    properties: { reply: { type: 'string' } },
    required: ['reply'],
    additionalProperties: false,
  },
  maxOutputTokens: 600,
  ...patch,
});

const context = (): { signal: AbortSignal; caseId: string } => ({
  signal: new AbortController().signal,
  caseId: 'late',
});

interface Sent {
  url: string;
  init: RequestInit;
}

function fakeFetch(answer: () => Response | Promise<Response>): {
  fetch: typeof fetch;
  sent: Sent[];
} {
  const sent: Sent[] = [];
  const fetch = (async (url: string | URL | Request, init?: RequestInit) => {
    sent.push({ url: String(url), init: init ?? {} });
    return answer();
  }) as typeof globalThis.fetch;
  return { fetch, sent };
}

const json = (body: unknown, status = 200, headers: Record<string, string> = {}): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...headers },
  });

const config = (patch: Partial<ProviderConfig> = {}): ProviderConfig => ({
  name: 'anthropic',
  baseUrl: 'https://api.anthropic.com',
  apiKey: () => SECRET,
  ...patch,
});

const ANTHROPIC_OK = {
  content: [
    { type: 'text', text: '{"reply":' },
    { type: 'tool_use', id: 'x' },
    { type: 'text', text: '"Soon"}' },
  ],
  usage: { input_tokens: 41, output_tokens: 7 },
  stop_reason: 'end_turn',
};

describe('refuseProviderUrl', () => {
  it.each([
    ['the Anthropic default', 'https://api.anthropic.com/v1/messages', {}, undefined],
    ['the OpenAI default', 'https://api.openai.com/v1/chat/completions', {}, undefined],
    ['a default with a trailing dot and capitals', 'https://API.OpenAI.com./v1', {}, undefined],
    [
      'an allowed host',
      'https://llm.corp.example/v1',
      { allowedHosts: ['LLM.corp.example.'] },
      undefined,
    ],
    [
      'a host that is not allowed',
      'https://llm.corp.example/v1',
      {},
      'host is not allowed; pass --allow-host to allow it',
    ],
    ['plain http', 'http://api.openai.com/v1', {}, 'scheme is not https'],
    [
      'a private address, even when listed',
      'https://10.0.0.8/v1',
      { allowedHosts: ['10.0.0.8'] },
      'host is private',
    ],
    [
      'a metadata endpoint',
      'https://169.254.169.254/latest',
      { allowedHosts: ['169.254.169.254'] },
      'host is local or a metadata endpoint',
    ],
    [
      'metadata.goog',
      'https://metadata.goog/v1',
      { allowedHosts: ['metadata.goog'] },
      'host is local or a metadata endpoint',
    ],
    ['loopback without --allow-local', 'http://127.0.0.1:8080/v1', {}, 'scheme is not https'],
    [
      'loopback over https without --allow-local',
      'https://localhost/v1',
      {},
      'host is local or a metadata endpoint',
    ],
    [
      'loopback over http with --allow-local',
      'http://127.0.0.1:8080/v1',
      { allowLocal: true },
      undefined,
    ],
    ['::1 with --allow-local', 'http://[::1]:11434/v1', { allowLocal: true }, undefined],
    [
      'a .localhost name with --allow-local',
      'http://ollama.localhost/v1',
      { allowLocal: true },
      undefined,
    ],
    [
      'a private address with --allow-local',
      'http://192.168.1.4/v1',
      { allowLocal: true },
      'scheme is not https',
    ],
    [
      'an IPv4-mapped loopback with --allow-local',
      'http://[::ffff:127.0.0.1]/v1',
      { allowLocal: true },
      'scheme is not https',
    ],
    [
      'another scheme on loopback with --allow-local',
      'ftp://localhost/v1',
      { allowLocal: true },
      'scheme is not http',
    ],
    [
      'a query on loopback with --allow-local',
      'http://localhost/v1?x=1',
      { allowLocal: true },
      'URL carries a query or fragment',
    ],
    [
      'credentials with --allow-local',
      'http://user:pw@localhost/v1',
      { allowLocal: true },
      'URL carries credentials',
    ],
    ['a query', 'https://api.openai.com/v1?x=1', {}, 'URL carries a query or fragment'],
    ['not a URL', 'api.openai.com', {}, 'not a valid URL'],
  ])('handles %s', (_name, url, options, reason) => {
    expect(refuseProviderUrl(url, options)).toBe(reason);
  });
});

describe('createAnthropicProvider', () => {
  it('posts the mapped body with the fixed headers and reads the answer', async () => {
    const { fetch, sent } = fakeFetch(() => json(ANTHROPIC_OK));
    const provider = createAnthropicProvider(config(), { fetch });

    const response = await provider(request(), context());

    expect(response).toMatchObject({
      text: '{"reply":"Soon"}',
      usage: { inputTokens: 41, outputTokens: 7 },
      status: 200,
      stopReason: 'end_turn',
    });
    expect(sent).toHaveLength(1);
    expect(sent[0]?.url).toBe('https://api.anthropic.com/v1/messages');
    expect(sent[0]?.init).toMatchObject({
      method: 'POST',
      redirect: 'manual',
      headers: {
        'content-type': 'application/json',
        'anthropic-version': '2023-06-01',
        'x-api-key': SECRET,
      },
    });
    expect(JSON.parse(String(sent[0]?.init.body))).toEqual({
      model: 'claude-sonnet-5-5',
      max_tokens: 600,
      system: 'You help with refunds.',
      messages: [{ role: 'user', content: 'Customer wrote: Where is ${HOME}?' }],
      temperature: 0,
      output_config: { format: { type: 'json_schema', schema: request().output } },
    });
  });

  it('maps a request of another provider without a provider mismatch', async () => {
    const { fetch, sent } = fakeFetch(() => json(ANTHROPIC_OK));
    const provider = createAnthropicProvider(
      config({
        name: 'corp',
        baseUrl: 'https://llm.corp.example/anthropic/',
        allowedHosts: ['llm.corp.example'],
      }),
      { fetch }
    );

    await provider(request({ provider: 'corp', apiId: 'corp-claude' }), context());

    expect(sent[0]?.url).toBe('https://llm.corp.example/anthropic/v1/messages');
    expect(JSON.parse(String(sent[0]?.init.body)).model).toBe('corp-claude');
  });

  it.each([
    ['missing usage', { ...ANTHROPIC_OK, usage: undefined }],
    ['a negative count', { ...ANTHROPIC_OK, usage: { input_tokens: -1, output_tokens: 3 } }],
    ['a fractional count', { ...ANTHROPIC_OK, usage: { input_tokens: 1.5, output_tokens: 3 } }],
    ['a count over the cap', { ...ANTHROPIC_OK, usage: { input_tokens: 1e10, output_tokens: 3 } }],
  ])('refuses %s with PS6502', async (_name, body) => {
    const provider = createAnthropicProvider(
      config(),
      fakeFetch(() => json(body))
    );

    await expect(provider(request(), context())).rejects.toMatchObject({
      code: 'PS6502',
      status: 200,
    });
  });

  it('echoes at most 200 characters of a 4xx message, without the key, tokens or control characters', async () => {
    const said = `Bad key ${SECRET}\nBearer abc.def ok\u202Eevil\u0007 ${'x'.repeat(400)}`;
    const provider = createAnthropicProvider(
      config(),
      fakeFetch(() => json({ error: { message: said } }, 401))
    );

    const failure = await provider(request(), context()).catch((error: unknown) => error);

    expect(failure).toMatchObject({ code: 'PS6304', status: 401 });
    const message = (failure as Error).message;
    expect(message).toContain(
      'anthropic refused the request with status 401: Bad key [key] Bearer [token] okevil x'
    );
    expect(message).not.toContain(SECRET);
    for (const hidden of ['\n', '\u202E', '\u0007']) expect(message).not.toContain(hidden);
    expect(message.length).toBeLessThan(260);
  });

  it('echoes a JSON body without the key, even when the body escapes it', async () => {
    const provider = createAnthropicProvider(
      config({ apiKey: () => 'gw-FAKE/slash/key' }),
      fakeFetch(
        () => new Response(String.raw`{"detail":"bad key gw-FAKE\/slash\/key"}`, { status: 400 })
      )
    );

    const failure = await provider(request(), context()).catch((error: unknown) => error);

    expect((failure as Error).message).toContain('{"detail":"bad key [key]"}');
    expect((failure as Error).message).not.toContain('slash');
  });

  it('echoes no other secret of the environment either', async () => {
    const database = 'postgres://app:FAKEdbPassword4444@db/app';
    const provider = createAnthropicProvider(
      config({ secrets: () => [database, 'short'] }),
      fakeFetch(() => json({ error: { message: `Invalid URL (POST /v1/${database})` } }, 404))
    );

    const failure = await provider(request(), context()).catch((error: unknown) => error);

    expect((failure as Error).message).toContain('Invalid URL (POST /v1/[secret])');
    expect((failure as Error).message).not.toContain('FAKEdbPassword4444');
  });

  it('scrubs a key or a bearer token split by hidden characters', async () => {
    const zwsp = `${SECRET.slice(0, 5)}\u200E${SECRET.slice(5)}`;
    const bell = `${SECRET.slice(0, 5)}\u0007${SECRET.slice(5)}`;
    const provider = createAnthropicProvider(
      config(),
      fakeFetch(() => json({ error: { message: `a ${zwsp} b ${bell} Bea\u200Erer abc.def` } }, 401))
    );

    const failure = await provider(request(), context()).catch((error: unknown) => error);

    expect((failure as Error).message).toContain('status 401: a [key] b [key] Bearer [token]');
    expect((failure as Error).message).not.toContain(SECRET.slice(5));
  });

  it('scrubs a secret that holds the key and more as a whole', async () => {
    const longer = `token=${SECRET};region=eu`;
    const provider = createAnthropicProvider(
      config({ secrets: () => [longer] }),
      fakeFetch(() => json({ error: { message: `bad ${longer} and ${SECRET}` } }, 400))
    );

    const failure = await provider(request(), context()).catch((error: unknown) => error);

    expect((failure as Error).message).toContain('bad [secret] and [key]');
    expect((failure as Error).message).not.toContain('region=eu');
  });

  it('keeps the key out of the text and stop reason of an answer', async () => {
    const provider = createAnthropicProvider(
      config(),
      fakeFetch(() =>
        json({
          ...ANTHROPIC_OK,
          content: [{ type: 'text', text: `echo ${SECRET}` }],
          stop_reason: `stop ${SECRET}`,
        })
      )
    );

    const answer = await provider(request(), context());

    expect(answer).toMatchObject({ text: 'echo [key]', stopReason: 'stop [key]' });
  });

  it('echoes an error given as a plain string', async () => {
    const provider = createAnthropicProvider(
      config(),
      fakeFetch(() => json({ error: 'quota' }, 403))
    );

    await expect(provider(request(), context())).rejects.toThrow('status 403: quota');
  });

  it('echoes a plain-text 4xx body', async () => {
    const provider = createAnthropicProvider(
      config(),
      fakeFetch(() => new Response('nope', { status: 400 }))
    );

    await expect(provider(request(), context())).rejects.toThrow('status 400: nope');
  });

  it('keeps the status and retry-after of a 429 and a 5xx', async () => {
    const tooMany = createAnthropicProvider(
      config(),
      fakeFetch(() => json({}, 429, { 'retry-after': '3' }))
    );
    const overloaded = createAnthropicProvider(
      config(),
      fakeFetch(() => json({}, 529))
    );

    await expect(tooMany(request(), context())).rejects.toMatchObject({
      code: 'PS6304',
      status: 429,
      retryAfterMs: 3000,
    });
    await expect(overloaded(request(), context())).rejects.toMatchObject({
      code: 'PS6300',
      status: 529,
    });
  });

  it('refuses a redirect', async () => {
    const provider = createAnthropicProvider(
      config(),
      fakeFetch(
        () => new Response(null, { status: 307, headers: { location: 'https://evil.example/' } })
      )
    );

    await expect(provider(request(), context())).rejects.toMatchObject({
      code: 'PS6302',
      status: 307,
    });
  });

  it('refuses a body over 4 MiB', async () => {
    const provider = createAnthropicProvider(
      config(),
      fakeFetch(() => new Response('x'.repeat(4 * 1024 * 1024 + 1)))
    );

    await expect(provider(request(), context())).rejects.toMatchObject({ code: 'PS6305' });
  });

  it('fails a 200 that is not JSON', async () => {
    const provider = createAnthropicProvider(
      config(),
      fakeFetch(() => new Response('<html>'))
    );

    await expect(provider(request(), context())).rejects.toMatchObject({ code: 'PS6300' });
  });

  it('times out a call that does not answer', async () => {
    const hang = ((_url: string, init?: RequestInit) =>
      new Promise((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () =>
          reject(new DOMException('aborted', 'AbortError'))
        );
      })) as typeof globalThis.fetch;
    const provider = createAnthropicProvider(config({ timeoutMs: 20 }), { fetch: hang });

    await expect(provider(request(), context())).rejects.toThrow(
      'anthropic: no answer within 20 ms.'
    );
  });

  it('reports a stopped run and an unreachable host', async () => {
    const controller = new AbortController();
    controller.abort();
    const aborted = createAnthropicProvider(config(), {
      fetch: ((_url: string, init?: RequestInit) =>
        Promise.reject(init?.signal?.reason ?? new Error('x'))) as typeof globalThis.fetch,
    });
    const down = createAnthropicProvider(config(), {
      fetch: (() => Promise.reject(new TypeError('fetch failed'))) as typeof globalThis.fetch,
    });

    await expect(
      aborted(request(), { signal: controller.signal, caseId: 'late' })
    ).rejects.toMatchObject({ code: 'PS6308' });
    await expect(down(request(), context())).rejects.toThrow(
      'anthropic: could not reach api.anthropic.com.'
    );
  });

  it('checks the host again on every call', async () => {
    const settings = config({
      name: 'corp',
      baseUrl: 'https://llm.corp.example',
      allowedHosts: ['llm.corp.example'],
    });
    const provider = createAnthropicProvider(
      settings,
      fakeFetch(() => json(ANTHROPIC_OK))
    );
    settings.allowedHosts = [];

    await expect(provider(request(), context())).rejects.toMatchObject({ code: 'PS6302' });
  });

  it('refuses a base URL that does not parse', () => {
    expect(() => createAnthropicProvider(config({ baseUrl: 'not a url' }))).toThrow(
      'anthropic: host of the base URL is refused: not a valid URL.'
    );
  });

  it('refuses a base URL that is not allowed when it is created', () => {
    expect(() => createAnthropicProvider(config({ baseUrl: 'https://10.1.1.1' }))).toThrow(
      'anthropic: host 10.1.1.1 is refused: host is private.'
    );
  });
});

describe('createOpenAICompatibleProvider', () => {
  const OPENAI_OK = {
    choices: [{ message: { role: 'assistant', content: 'Soon.' }, finish_reason: 'stop' }],
    usage: { prompt_tokens: 30, completion_tokens: 2 },
  };

  it('posts the chat body with a bearer key and reads the answer', async () => {
    const { fetch, sent } = fakeFetch(() => json(OPENAI_OK));
    const provider = createOpenAICompatibleProvider(
      config({ name: 'openai', baseUrl: 'https://api.openai.com/v1' }),
      { fetch }
    );

    const response = await provider(
      request({ provider: 'openai', apiId: 'gpt-5.1', modelRef: 'gpt-5.1' }),
      context()
    );

    expect(response).toMatchObject({
      text: 'Soon.',
      usage: { inputTokens: 30, outputTokens: 2 },
      stopReason: 'stop',
    });
    expect(sent[0]?.url).toBe('https://api.openai.com/v1/chat/completions');
    expect(sent[0]?.init.headers).toEqual({
      'content-type': 'application/json',
      authorization: `Bearer ${SECRET}`,
    });
    const body = JSON.parse(String(sent[0]?.init.body));
    expect(body).toMatchObject({ model: 'gpt-5.1', max_completion_tokens: 600, temperature: 0 });
    expect(body.response_format.json_schema.name).toBe('refund-reply');
    expect(body.messages).toHaveLength(2);
  });

  it('reads an empty text when the choice has no content', async () => {
    const provider = createOpenAICompatibleProvider(
      config({ name: 'openai', baseUrl: 'https://api.openai.com/v1' }),
      fakeFetch(() => json({ choices: [], usage: { prompt_tokens: 1, completion_tokens: 0 } }))
    );

    expect((await provider(request({ provider: 'openai' }), context())).text).toBe('');
  });
});
