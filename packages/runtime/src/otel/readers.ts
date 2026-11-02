import { count, isObject, own } from './check.js';
import type { PromptCallResult } from './types.js';

const isString = (value: unknown): value is string => typeof value === 'string';

/** Members of a provider response that hold the same data in both shapes. */
function common(response: Record<string, unknown>): PromptCallResult {
  const model = own(response, 'model');
  const id = own(response, 'id');
  return {
    ...(isString(model) && { responseModel: model }),
    ...(isString(id) && { responseId: id }),
  };
}

const part = (value: unknown, key: string): unknown =>
  isObject(value) ? own(value, key) : undefined;

/**
 * Read the token counts, model, id and stop reason of an Anthropic Messages response. Cache
 * creation and cache read tokens count as input tokens. A member that is missing or wrong is
 * left out.
 *
 * @param response - The parsed JSON body of the response
 * @returns The result for `trace`, `{}` when the response is not an object
 *
 * @example
 * await telemetry.trace(rendered, (span) => callModel(body), anthropicResult);
 */
export function anthropicResult(response: unknown): PromptCallResult {
  if (!isObject(response)) return {};
  const usage = own(response, 'usage');
  const input = part(usage, 'input_tokens');
  const output = part(usage, 'output_tokens');
  const cache = ['cache_creation_input_tokens', 'cache_read_input_tokens']
    .map((key) => part(usage, key))
    .filter(count);
  const stop = own(response, 'stop_reason');
  return Object.freeze({
    ...(count(input) && { inputTokens: cache.reduce((sum, tokens) => sum + tokens, input) }),
    ...(count(output) && { outputTokens: output }),
    ...common(response),
    ...(isString(stop) && { finishReasons: [stop] }),
  });
}

/**
 * Read the token counts, model, id and finish reasons of an OpenAI chat completion response.
 * A member that is missing or wrong is left out.
 *
 * @param response - The parsed JSON body of the response
 * @returns The result for `trace`, `{}` when the response is not an object
 *
 * @example
 * await telemetry.trace(rendered, (span) => callModel(body), openAIChatResult);
 */
export function openAIChatResult(response: unknown): PromptCallResult {
  if (!isObject(response)) return {};
  const usage = own(response, 'usage');
  const input = part(usage, 'prompt_tokens');
  const output = part(usage, 'completion_tokens');
  const choices = own(response, 'choices');
  const reasons = Array.isArray(choices)
    ? choices.map((choice: unknown) => part(choice, 'finish_reason')).filter(isString)
    : [];
  return Object.freeze({
    ...(count(input) && { inputTokens: input }),
    ...(count(output) && { outputTokens: output }),
    ...common(response),
    ...(reasons.length > 0 && { finishReasons: reasons }),
  });
}
