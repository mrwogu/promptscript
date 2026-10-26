import { describe, expect, it } from 'vitest';
import { makeBundle, makeFullBundle } from './__tests__/fixture.js';
import { loadPrompt } from './load.js';
import { toAnthropicMessages, toOpenAIChat } from './providers.js';

// Anthropic shape checked on 2026-10-26 against
// https://platform.claude.com/docs/en/build-with-claude/structured-outputs (output_config.format)
// and https://platform.claude.com/docs/en/api/migration-2026-10-21 (API version 2026-10-21
// rejects temperature, top_p and top_k; the mapper still passes what the bundle sets).
// The OpenAI shape is best effort and only checked against this fixture, not a live API.

const OUTPUT = {
  type: 'object',
  properties: {
    reply: { type: 'string', description: 'Reply text' },
    tags: { type: 'array', items: { type: 'string', enum: ['refund', 'other'] } },
  },
  required: ['reply', 'tags'],
  additionalProperties: false,
};

const full = (provider: string) =>
  loadPrompt(makeFullBundle({ provider, apiId: `${provider}-model` })).render({ message: 'Hi' });
const plain = loadPrompt(makeBundle()).render({ message: 'Hi' });

describe('toAnthropicMessages', () => {
  it('maps every field the bundle sets', () => {
    expect(toAnthropicMessages(full('anthropic'))).toEqual({
      model: 'anthropic-model',
      max_tokens: 800,
      system: 'You help with refunds.',
      messages: [{ role: 'user', content: 'Customer wrote: Hi' }],
      temperature: 0.2,
      top_p: 0.9,
      top_k: 40,
      stop_sequences: ['END'],
      output_config: { format: { type: 'json_schema', schema: OUTPUT } },
    });
  });

  it('fills a missing model and limit from the options', () => {
    expect(toAnthropicMessages(plain, { model: 'claude-opus-5-5', maxTokens: 64 })).toEqual({
      model: 'claude-opus-5-5',
      max_tokens: 64,
      system: 'You help with refunds.',
      messages: [{ role: 'user', content: 'Customer wrote: Hi' }],
    });
  });

  it('never lets options override the bundle', () => {
    const request = toAnthropicMessages(full('anthropic'), { model: 'other', maxTokens: 1 });

    expect(request).toMatchObject({ model: 'anthropic-model', max_tokens: 800 });
  });

  it('gives no messages without a user message', () => {
    const rendered = loadPrompt(
      makeBundle({ messages: [{ role: 'system', content: 'Rules' }], inputs: {} })
    ).render();

    expect(toAnthropicMessages(rendered, { model: 'm', maxTokens: 1 })).toEqual({
      model: 'm',
      max_tokens: 1,
      system: 'Rules',
      messages: [],
    });
  });

  it('fails without a model, without max tokens and for another provider', () => {
    expect(() => toAnthropicMessages(plain, { maxTokens: 1 })).toThrow(
      expect.objectContaining({ code: 'missing-model' })
    );
    expect(() => toAnthropicMessages(plain, { model: 'm' })).toThrow(
      expect.objectContaining({ code: 'missing-max-tokens' })
    );
    expect(() => toAnthropicMessages(full('openai'))).toThrow(
      expect.objectContaining({ code: 'provider-mismatch' })
    );
  });

  it('returns new objects the caller may change', () => {
    // Arrange
    const rendered = full('anthropic');
    const request = toAnthropicMessages(rendered);

    // Act
    request.stop_sequences?.push('MORE');
    (request.output_config?.format.schema.required as string[]).push('x');

    // Assert
    expect(rendered.params.stop).toEqual(['END']);
    expect(rendered.output?.required).toEqual(['reply', 'tags']);
  });
});

describe('toOpenAIChat', () => {
  it('maps every field the bundle sets and drops topK', () => {
    expect(toOpenAIChat(full('openai'))).toEqual({
      model: 'openai-model',
      messages: [
        { role: 'system', content: 'You help with refunds.' },
        { role: 'user', content: 'Customer wrote: Hi' },
      ],
      max_completion_tokens: 800,
      temperature: 0.2,
      top_p: 0.9,
      seed: 7,
      stop: ['END'],
      response_format: {
        type: 'json_schema',
        json_schema: { name: 'refund-reply', schema: OUTPUT, strict: true },
      },
    });
  });

  it('fills a missing model and limit from the options', () => {
    expect(toOpenAIChat(plain, { model: 'gpt-5', maxTokens: 64 })).toEqual({
      model: 'gpt-5',
      messages: [
        { role: 'system', content: 'You help with refunds.' },
        { role: 'user', content: 'Customer wrote: Hi' },
      ],
      max_completion_tokens: 64,
    });
  });

  it('needs no token limit', () => {
    expect(toOpenAIChat(plain, { model: 'gpt-5' })).not.toHaveProperty('max_completion_tokens');
  });

  it('fails without a model and for another provider', () => {
    expect(() => toOpenAIChat(plain)).toThrow(expect.objectContaining({ code: 'missing-model' }));
    expect(() => toOpenAIChat(full('anthropic'))).toThrow(
      expect.objectContaining({ code: 'provider-mismatch' })
    );
  });
});
