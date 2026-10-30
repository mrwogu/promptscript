import { ENVIRONMENT, EXPERIMENT_NAME, VARIANT_NAME } from '../client.js';
import { PromptRuntimeError } from '../errors.js';
import { HASH_PATTERN } from '../load.js';
import type { RenderedPrompt } from '../types.js';
import { count, finite, isObject, matches, promptId, text } from './check.js';
import type { PromptAttributeValue, PromptCallResult, PromptPricingTable } from './types.js';
import { callCostUsd } from './pricing.js';

// Attribute names are spelled out where they are set. The gen_ai ones follow a draft
// convention, so a change of the convention shows up in the attribute spec.
const ID = 'promptscript.prompt.id';
const HASH = 'promptscript.prompt.content_hash';
const REQUEST_PARAMS = [
  ['gen_ai.request.max_tokens', 'maxTokens'],
  ['gen_ai.request.temperature', 'temperature'],
  ['gen_ai.request.top_p', 'topP'],
  ['gen_ai.request.top_k', 'topK'],
] as const;
const ERROR_NAME = /^[A-Za-z\d_.:-]{1,64}$/;
const MAX_VALUE = 128;
const MAX_FINISH_REASONS = 8;

type Out = Record<string, PromptAttributeValue>;

/** What the attributes depend on, after the options are checked. */
export interface AttributeSettings {
  readonly operation: string;
  readonly provider?: string;
  readonly genAi: boolean;
  readonly pricing?: PromptPricingTable;
}

/** The fields of a prompt meta that become attributes. Anything else is ignored. */
export interface MetaFields {
  readonly id?: unknown;
  readonly contentHash?: unknown;
  readonly label?: unknown;
  readonly experiment?: unknown;
  readonly variant?: unknown;
  readonly stale?: unknown;
}

/**
 * The `promptscript.*` attributes of a prompt meta. A value that fails its check is left out:
 * it did not come from a verified bundle.
 */
export function metaAttributes(meta: MetaFields): Out {
  const out: Out = {};
  if (promptId(meta.id)) out[ID] = meta.id;
  if (matches(meta.contentHash, HASH_PATTERN)) out[HASH] = meta.contentHash;
  if (matches(meta.label, ENVIRONMENT)) out['promptscript.prompt.label'] = meta.label;
  if (meta.stale === true) out['promptscript.prompt.stale'] = true;
  if (matches(meta.experiment, EXPERIMENT_NAME) && matches(meta.variant, VARIANT_NAME)) {
    out['promptscript.experiment.name'] = meta.experiment;
    out['promptscript.experiment.variant'] = meta.variant;
  }
  return out;
}

function requestAttributes(rendered: RenderedPrompt, settings: AttributeSettings): Out {
  const { model, params } = rendered;
  const out: Out = { 'gen_ai.operation.name': settings.operation };
  const provider = model?.provider ?? settings.provider;
  if (text(provider, MAX_VALUE)) out['gen_ai.provider.name'] = provider;
  if (text(model?.apiId, MAX_VALUE)) out['gen_ai.request.model'] = model.apiId;
  for (const [name, key] of REQUEST_PARAMS) {
    const value = params[key];
    if (finite(value)) out[name] = value;
  }
  if (rendered.output) out['gen_ai.output.type'] = 'json';
  return out;
}

/** The attributes known when a span starts, from the rendered prompt only. */
export function promptAttributes(rendered: RenderedPrompt, settings: AttributeSettings): Out {
  const out = metaAttributes(rendered.meta);
  if (!settings.genAi) return out;
  const { [ID]: id, [HASH]: hash } = out;
  if (id !== undefined) out['gen_ai.prompt.name'] = id;
  if (hash !== undefined) out['gen_ai.prompt.version'] = hash;
  return Object.assign(out, requestAttributes(rendered, settings));
}

/** A string from a provider: cut to 128 characters, or dropped when it holds unsafe ones. */
const cut = (value: unknown): string | undefined => {
  const head = typeof value === 'string' ? value.slice(0, MAX_VALUE) : undefined;
  // A cut can split a surrogate pair, and text() refuses the lone half
  return text(head, MAX_VALUE) ? head : undefined;
};

function usageAttributes(result: PromptCallResult): Out {
  const out: Out = {};
  if (count(result.inputTokens)) out['gen_ai.usage.input_tokens'] = result.inputTokens;
  if (count(result.outputTokens)) out['gen_ai.usage.output_tokens'] = result.outputTokens;
  const model = cut(result.responseModel);
  if (model !== undefined) out['gen_ai.response.model'] = model;
  const id = cut(result.responseId);
  if (id !== undefined) out['gen_ai.response.id'] = id;
  const reasons = Array.isArray(result.finishReasons)
    ? result.finishReasons
        .map(cut)
        .filter((reason): reason is string => reason !== undefined)
        .slice(0, MAX_FINISH_REASONS)
    : [];
  if (reasons.length > 0) out['gen_ai.response.finish_reasons'] = reasons;
  return out;
}

/** The cost estimate: only when the model is priced and both token counts are valid. */
function costAttributes(
  result: PromptCallResult,
  rendered: RenderedPrompt,
  pricing: PromptPricingTable | undefined
): Out {
  const { model } = rendered;
  const price = model && pricing?.find(model.provider, model.apiId);
  if (!price || !count(result.inputTokens) || !count(result.outputTokens)) return {};
  const cost = callCostUsd(result.inputTokens, result.outputTokens, price);
  return finite(cost) && cost >= 0 ? { 'promptscript.usage.cost_usd': cost } : {};
}

/** The attributes known when the call returned, from what `read` returned. */
export function resultAttributes(
  result: PromptCallResult,
  rendered: RenderedPrompt,
  settings: AttributeSettings
): Out {
  if (!isObject(result)) return {};
  return {
    ...(settings.genAi && usageAttributes(result)),
    ...costAttributes(result, rendered, settings.pricing),
  };
}

/**
 * The `error.type` of a failed call: the code of a runtime error, else the error name when it
 * is a short plain token, else `_OTHER`. Never a message.
 */
export function errorType(error: unknown): string {
  try {
    // instanceof can run a Proxy trap and a name can be a getter: both may throw
    const code = error instanceof PromptRuntimeError ? error.code : undefined;
    if (matches(code, ERROR_NAME)) return code;
    const { name } = error as { name?: unknown };
    if (matches(name, ERROR_NAME)) return name;
  } catch {
    // A trap or getter that throws, or null: fall through to the generic type
  }
  return '_OTHER';
}
