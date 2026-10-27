import type { EvalConfig } from '@promptscript/core';
import { describe, expect, it } from 'vitest';
import { createProviderFactory, type ProviderUse } from './provider-setup.js';

const KEY = 'sk-test-0123456789abcdef';
const ok = (): Response =>
  new Response(
    JSON.stringify({
      content: [{ type: 'text', text: 'Hi' }],
      usage: { input_tokens: 1, output_tokens: 1 },
    }),
    { status: 200 }
  );

describe('createProviderFactory', () => {
  it('creates the built-in providers once and announces where each key goes', async () => {
    const uses: ProviderUse[] = [];
    const urls: string[] = [];
    const providers = createProviderFactory({
      env: { ANTHROPIC_API_KEY: KEY, OPENAI_API_KEY: KEY },
      onUse: (use) => uses.push(use),
      fetch: (async (url: string | URL | Request) => {
        urls.push(String(url));
        return ok();
      }) as typeof fetch,
    });

    const anthropic = providers('anthropic');
    const again = providers('anthropic');
    providers('openai');

    expect(again).toBe(anthropic);
    expect(uses).toEqual([
      { provider: 'anthropic', keyVariable: 'ANTHROPIC_API_KEY', host: 'api.anthropic.com' },
      { provider: 'openai', keyVariable: 'OPENAI_API_KEY', host: 'api.openai.com' },
    ]);
    await anthropic(
      {
        promptId: 'a/b',
        provider: 'anthropic',
        apiId: 'claude-sonnet-5-5',
        modelRef: 'claude-sonnet-5-5',
        messages: [{ role: 'user', content: 'Hi' }],
        params: { maxTokens: 10 },
        maxOutputTokens: 10,
      },
      { signal: new AbortController().signal, caseId: 'a' }
    );
    expect(urls).toEqual(['https://api.anthropic.com/v1/messages']);
  });

  it('uses an eval.providers entry with its own URL and key variable', () => {
    const uses: ProviderUse[] = [];
    const config: EvalConfig = {
      providers: {
        corp: {
          kind: 'openai-compatible',
          baseUrl: 'https://llm.corp.example/v1',
          apiKeyEnvVar: 'CORP_KEY',
        },
      },
    };
    const providers = createProviderFactory({
      config,
      env: { CORP_KEY: KEY },
      allowedHosts: ['llm.corp.example'],
      onUse: (use) => uses.push(use),
    });

    providers('corp');

    expect(uses).toEqual([{ provider: 'corp', keyVariable: 'CORP_KEY', host: 'llm.corp.example' }]);
  });

  it.each([
    ['a provider without an entry', {}, 'google', 'PS6301', 'Provider google has no entry'],
    [
      'an entry without a base URL',
      { providers: { google: { kind: 'openai-compatible', apiKeyEnvVar: 'G_KEY' } } },
      'google',
      'PS6301',
      'eval.providers.google needs baseUrl and apiKeyEnvVar.',
    ],
    [
      'an apiKey in the config',
      { providers: { anthropic: { kind: 'anthropic', apiKey: 'x' } } },
      'anthropic',
      'PS6303',
      'eval.providers.anthropic.apiKey is not allowed',
    ],
    [
      'headers in the config',
      { providers: { anthropic: { kind: 'anthropic', headers: {} } } },
      'anthropic',
      'PS6303',
      'eval.providers.anthropic.headers is not allowed',
    ],
    [
      'an unknown kind',
      { providers: { corp: { kind: 'bedrock', baseUrl: 'https://x.example', apiKeyEnvVar: 'K' } } },
      'corp',
      'PS6303',
      'kind must be anthropic or openai-compatible',
    ],
    [
      'a key variable that is not a name',
      {
        providers: {
          corp: { kind: 'anthropic', baseUrl: 'https://x.example', apiKeyEnvVar: '${KEY}' },
        },
      },
      'corp',
      'PS6303',
      'apiKeyEnvVar must be a variable name',
    ],
    [
      'a host that is not allowed',
      {
        providers: {
          corp: {
            kind: 'anthropic',
            baseUrl: 'https://llm.corp.example',
            apiKeyEnvVar: 'ANTHROPIC_API_KEY',
          },
        },
      },
      'corp',
      'PS6302',
      'eval.providers.corp.baseUrl: host llm.corp.example is refused: host is not allowed',
    ],
    [
      'a base URL that does not parse',
      {
        providers: {
          corp: { kind: 'anthropic', baseUrl: 'nope', apiKeyEnvVar: 'ANTHROPIC_API_KEY' },
        },
      },
      'corp',
      'PS6302',
      'eval.providers.corp.baseUrl: host of the base URL is refused: not a valid URL.',
    ],
    [
      'a built-in name moved to another kind and host without its own key variable',
      {
        providers: {
          anthropic: { kind: 'openai-compatible', baseUrl: 'https://api.openai.com/v1' },
        },
      },
      'anthropic',
      'PS6303',
      'eval.providers.anthropic changes the kind or the host of a built-in provider',
    ],
    [
      'a provider entry that is not a mapping',
      { providers: { corp: 'https://x.example' } },
      'corp',
      'PS6303',
      'eval.providers.corp must be a mapping.',
    ],
  ])('refuses %s', (_name, config, name, code, message) => {
    const providers = createProviderFactory({
      config: config as EvalConfig,
      env: { ANTHROPIC_API_KEY: KEY },
    });

    let thrown: unknown;
    try {
      providers(name);
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toMatchObject({ code });
    expect((thrown as Error).message).toContain(message);
    expect((thrown as Error).message).not.toContain(KEY);
  });

  it('names only the variable when a key is missing', () => {
    const providers = createProviderFactory({ env: { ANTHROPIC_API_KEY: '' } });

    expect(() => providers('anthropic')).toThrow(
      'ANTHROPIC_API_KEY is not set; export it to call provider anthropic.'
    );
  });

  it('refuses the run when a key value appears in the config, as ${VAR} in baseUrl would put it', () => {
    const config: EvalConfig = {
      providers: {
        corp: { kind: 'anthropic', baseUrl: `https://x.example/${KEY}`, apiKeyEnvVar: 'CORP_KEY' },
      },
    };

    let thrown: unknown;
    try {
      createProviderFactory({ config, env: { CORP_KEY: KEY } });
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toMatchObject({ code: 'PS6307' });
    expect((thrown as Error).message).toBe(
      'The value of CORP_KEY appears in the eval config, ${VAR} in baseUrl included; keep secrets only in the environment.'
    );
  });

  it('sends a moved built-in provider the key its entry names', () => {
    const uses: ProviderUse[] = [];
    const providers = createProviderFactory({
      config: {
        providers: {
          anthropic: {
            kind: 'openai-compatible',
            baseUrl: 'https://api.openai.com/v1',
            apiKeyEnvVar: 'OPENAI_API_KEY',
          },
        },
      },
      env: { ANTHROPIC_API_KEY: KEY, OPENAI_API_KEY: 'sk-other-0123456789' },
      onUse: (use) => uses.push(use),
    });

    providers('anthropic');

    expect(uses).toEqual([
      { provider: 'anthropic', keyVariable: 'OPENAI_API_KEY', host: 'api.openai.com' },
    ]);
  });

  it('refuses the run when any secret-named variable appears in the config', () => {
    const token = 'ghp_FAKE0123456789';
    const config: EvalConfig = {
      providers: {
        corp: {
          kind: 'openai-compatible',
          baseUrl: `https://x.example/${token}`,
          apiKeyEnvVar: 'CORP_KEY',
        },
      },
    };

    expect(() =>
      createProviderFactory({ config, env: { CORP_KEY: KEY, GITHUB_TOKEN: token, HOME: token } })
    ).toThrow('The value of GITHUB_TOKEN appears in the eval config');
  });

  it('keeps every longer environment value out of an error echo', async () => {
    const webhook = 'https://hooks.slack.example/T0/B0/FAKEhook6666';
    const providers = createProviderFactory({
      config: {
        providers: {
          openai: { kind: 'openai-compatible', baseUrl: `https://api.openai.com/${webhook}` },
        },
      },
      env: { OPENAI_API_KEY: KEY, SLACK_WEBHOOK: webhook },
      fetch: (async (url: string | URL | Request) =>
        new Response(JSON.stringify({ error: { message: `Invalid URL ${String(url)}` } }), {
          status: 404,
        })) as typeof fetch,
    });

    const failure = await providers('openai')(
      {
        promptId: 'a/b',
        provider: 'openai',
        apiId: 'gpt-test',
        modelRef: 'gpt-test',
        messages: [{ role: 'user', content: 'Hi' }],
        params: {},
        maxOutputTokens: 10,
      },
      { signal: new AbortController().signal, caseId: 'a' }
    ).catch((error: unknown) => error);

    expect((failure as Error).message).toContain('[secret]');
    expect((failure as Error).message).not.toContain('FAKEhook6666');
  });

  it('tells the run which secret a text holds', () => {
    const providers = createProviderFactory({
      env: { GITHUB_TOKEN: 'ghp_FAKE0123456789', HOME: '/home/runner/work' },
    });

    expect(providers.secretIn?.('model ghp_FAKE0123456789')).toBe('GITHUB_TOKEN');
    expect(providers.secretIn?.('model /home/runner/work')).toBeUndefined();
  });

  it('ignores short values that would match config text by chance', () => {
    expect(() =>
      createProviderFactory({ config: { reportDir: 'abc' }, env: { ANTHROPIC_API_KEY: 'abc' } })
    ).not.toThrow();
  });
});
