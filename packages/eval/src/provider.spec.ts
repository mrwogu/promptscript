import { describe, expect, it } from 'vitest';
import { EvalProviderError } from './errors.js';
import { createMockProvider, type EvalRequest } from './provider.js';

const request: EvalRequest = {
  promptId: 'acme-support/refund-reply',
  provider: 'anthropic',
  apiId: 'claude-sonnet-5-5',
  modelRef: 'claude-sonnet-5-5',
  messages: [{ role: 'user', content: 'Where is my order?' }],
  params: {},
  maxOutputTokens: 1024,
};
const context = (caseId: string): { signal: AbortSignal; caseId: string } => ({
  signal: new AbortController().signal,
  caseId,
});

describe('createMockProvider', () => {
  it('answers from a table by case id with defaults for usage, latency and status', async () => {
    const provider = createMockProvider({ late: 'On its way.' });

    const response = await provider(request, context('late'));

    expect(response).toEqual({
      text: 'On its way.',
      usage: { inputTokens: 0, outputTokens: 0 },
      latencyMs: 0,
      status: 200,
    });
  });

  it('returns scripted usage, latency and stop reason', async () => {
    const provider = createMockProvider({
      late: {
        text: 'Hi',
        usage: { inputTokens: 12, outputTokens: 3 },
        latencyMs: 840,
        stopReason: 'end_turn',
      },
    });

    const response = await provider(request, context('late'));

    expect(response).toEqual({
      text: 'Hi',
      usage: { inputTokens: 12, outputTokens: 3 },
      latencyMs: 840,
      status: 200,
      stopReason: 'end_turn',
    });
  });

  it('answers from a function of the request and context', async () => {
    const provider = createMockProvider(
      (req, ctx) => `${ctx.caseId}: ${req.messages[0]?.content ?? ''}`
    );

    expect((await provider(request, context('late'))).text).toBe('late: Where is my order?');
  });

  it('records every call in order', async () => {
    const provider = createMockProvider({ a: 'A', b: 'B' });

    await provider(request, context('b'));
    await provider(request, context('a'));

    expect(provider.calls).toEqual([
      { caseId: 'b', request },
      { caseId: 'a', request },
    ]);
  });

  it('throws a provider error for a case without an answer, prototype names included', async () => {
    const provider = createMockProvider({ late: 'Hi' });

    await expect(provider(request, context('early'))).rejects.toBeInstanceOf(EvalProviderError);
    await expect(provider(request, context('toString'))).rejects.toMatchObject({ code: 'PS6300' });
  });

  it('refuses an aborted call', async () => {
    const provider = createMockProvider({ late: 'Hi' });
    const controller = new AbortController();
    controller.abort();

    await expect(
      provider(request, { signal: controller.signal, caseId: 'late' })
    ).rejects.toThrow();
    expect(provider.calls).toEqual([]);
  });
});
