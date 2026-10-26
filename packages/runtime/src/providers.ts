import { PromptRuntimeError } from './errors.js';
import type {
  AnthropicMessagesRequest,
  OpenAIChatRequest,
  ProviderMapOptions,
  RenderedPrompt,
} from './types.js';

function modelFor(rendered: RenderedPrompt, provider: string, options: ProviderMapOptions): string {
  const { model, meta } = rendered;
  if (model) {
    if (model.provider !== provider) {
      throw new PromptRuntimeError(
        'provider-mismatch',
        `Prompt ${meta.id} is built for provider ${model.provider}, not ${provider}. Use the mapper of that provider.`
      );
    }
    return model.apiId;
  }
  if (options.model === undefined) {
    throw new PromptRuntimeError(
      'missing-model',
      `Prompt ${meta.id} declares no model. Pass options.model to name one.`
    );
  }
  return options.model;
}

function content(rendered: RenderedPrompt, role: 'system' | 'user'): string | undefined {
  return rendered.messages.find((message) => message.role === role)?.content;
}

/**
 * Build an Anthropic Messages API request body from a rendered prompt.
 *
 * The bundle's model and limits win; options only fill what the bundle leaves out. Sampling
 * parameters are passed as the bundle sets them, though newer models and API versions
 * reject `temperature`, `top_p` and `top_k`. A prompt without a user message gives
 * `messages: []`, so the application adds its own user turn.
 *
 * @param rendered - The result of `prompt.render()`
 * @param options - Model and token limit to use when the bundle declares none
 * @returns A new plain object to send as the request body
 * @throws {PromptRuntimeError} `provider-mismatch`, `missing-model` or `missing-max-tokens`
 *
 * @example
 * const body = toAnthropicMessages(prompt.render({ message }), { maxTokens: 1024 });
 */
export function toAnthropicMessages(
  rendered: RenderedPrompt,
  options: ProviderMapOptions = {}
): AnthropicMessagesRequest {
  const model = modelFor(rendered, 'anthropic', options);
  const { params, output } = rendered;
  const maxTokens = params.maxTokens ?? options.maxTokens;
  if (maxTokens === undefined) {
    throw new PromptRuntimeError(
      'missing-max-tokens',
      `Prompt ${rendered.meta.id} sets no maxTokens and Anthropic requires max_tokens. Pass options.maxTokens.`
    );
  }
  const system = content(rendered, 'system');
  const user = content(rendered, 'user');
  return {
    model,
    max_tokens: maxTokens,
    ...(system !== undefined && { system }),
    messages: user === undefined ? [] : [{ role: 'user', content: user }],
    ...(params.temperature !== undefined && { temperature: params.temperature }),
    ...(params.topP !== undefined && { top_p: params.topP }),
    ...(params.topK !== undefined && { top_k: params.topK }),
    ...(params.stop && { stop_sequences: [...params.stop] }),
    // A copy of the schema, so a caller that changes the request cannot change the prompt
    ...(output && {
      output_config: { format: { type: 'json_schema', schema: structuredClone(output) } },
    }),
  };
}

/**
 * Build an OpenAI Chat Completions request body from a rendered prompt.
 *
 * Best effort from the public API documentation. `topK` has no OpenAI field and is
 * dropped; `stop` is passed as is, and the API takes at most four. The structured output
 * name is the last segment of the prompt id.
 *
 * @param rendered - The result of `prompt.render()`
 * @param options - Model and token limit to use when the bundle declares none
 * @returns A new plain object to send as the request body
 * @throws {PromptRuntimeError} `provider-mismatch` or `missing-model`
 *
 * @example
 * const body = toOpenAIChat(prompt.render({ message }), { model: 'gpt-5' });
 */
export function toOpenAIChat(
  rendered: RenderedPrompt,
  options: ProviderMapOptions = {}
): OpenAIChatRequest {
  const model = modelFor(rendered, 'openai', options);
  const { params, output, meta } = rendered;
  const maxTokens = params.maxTokens ?? options.maxTokens;
  return {
    model,
    messages: rendered.messages.map(({ role, content: text }) => ({ role, content: text })),
    ...(maxTokens !== undefined && { max_completion_tokens: maxTokens }),
    ...(params.temperature !== undefined && { temperature: params.temperature }),
    ...(params.topP !== undefined && { top_p: params.topP }),
    ...(params.seed !== undefined && { seed: params.seed }),
    ...(params.stop && { stop: [...params.stop] }),
    ...(output && {
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: meta.id.slice(meta.id.lastIndexOf('/') + 1),
          schema: structuredClone(output),
          strict: true,
        },
      },
    }),
  };
}
