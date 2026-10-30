import { describe, expect, it } from 'vitest';
import { anthropicResult, openAIChatResult } from './readers.js';

describe('anthropicResult', () => {
  it('reads a full response', () => {
    const response = {
      id: 'msg_1',
      model: 'claude-sonnet-5-5',
      stop_reason: 'end_turn',
      usage: { input_tokens: 10, output_tokens: 20 },
    };

    expect(anthropicResult(response)).toEqual({
      inputTokens: 10,
      outputTokens: 20,
      responseModel: 'claude-sonnet-5-5',
      responseId: 'msg_1',
      finishReasons: ['end_turn'],
    });
  });

  it('counts cache tokens as input tokens', () => {
    const usage = {
      input_tokens: 10,
      output_tokens: 1,
      cache_creation_input_tokens: 100,
      cache_read_input_tokens: 1000,
    };

    expect(anthropicResult({ usage }).inputTokens).toBe(1110);
  });

  it.each([-1, 1.5, '3', null])('ignores a cache field of %j', (bad) => {
    const usage = { input_tokens: 10, cache_read_input_tokens: bad };

    expect(anthropicResult({ usage }).inputTokens).toBe(10);
  });

  it('leaves out what is missing or wrong', () => {
    expect(anthropicResult({})).toEqual({});
    expect(anthropicResult({ usage: { input_tokens: '10', output_tokens: 5 } })).toEqual({
      outputTokens: 5,
    });
    expect(anthropicResult({ stop_reason: null, id: 7, model: {} })).toEqual({});
  });

  it('ignores an inherited usage', () => {
    const response = Object.create({ usage: { input_tokens: 10 } }) as unknown;

    expect(anthropicResult(response)).toEqual({});
  });

  it.each([null, 42, [], 'text', undefined])('returns {} for %j', (response) => {
    expect(anthropicResult(response)).toEqual({});
  });

  it('returns a frozen object', () => {
    expect(Object.isFrozen(anthropicResult({}))).toBe(true);
  });
});

describe('openAIChatResult', () => {
  it('reads a full response with two choices', () => {
    const response = {
      id: 'chatcmpl-1',
      model: 'gpt-5',
      usage: { prompt_tokens: 7, completion_tokens: 9 },
      choices: [{ finish_reason: 'stop' }, { finish_reason: 'length' }],
    };

    expect(openAIChatResult(response)).toEqual({
      inputTokens: 7,
      outputTokens: 9,
      responseModel: 'gpt-5',
      responseId: 'chatcmpl-1',
      finishReasons: ['stop', 'length'],
    });
  });

  it('leaves out a choice without a finish reason and a choices member that is no array', () => {
    expect(openAIChatResult({ choices: [{}, null, { finish_reason: 'stop' }] })).toEqual({
      finishReasons: ['stop'],
    });
    expect(openAIChatResult({ choices: 'stop' })).toEqual({});
  });

  it('returns every reason, the cap lives in the span attributes', () => {
    const choices = Array.from({ length: 9 }, () => ({ finish_reason: 'stop' }));

    expect(openAIChatResult({ choices }).finishReasons).toHaveLength(9);
  });

  it('ignores a negative token count', () => {
    expect(openAIChatResult({ usage: { prompt_tokens: -1, completion_tokens: 2 } })).toEqual({
      outputTokens: 2,
    });
  });

  it.each([null, 42, []])('returns {} for %j', (response) => {
    expect(openAIChatResult(response)).toEqual({});
  });
});
