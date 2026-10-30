import { PromptRuntimeError } from '../errors.js';
import { finite, isObject, own, text } from './check.js';
import type { PromptModelPrice, PromptPricingTable } from './types.js';

const SCHEMA = 'https://getpromptscript.dev/schema/prompt-release-pricing/v1.json';
const MAX_LENGTH = 262_144;
const MAX_MODELS = 512;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const NAMES = ['ref', 'apiId', 'provider'] as const;
const PRICES = ['inputUsdPerMillion', 'outputUsdPerMillion'] as const;

function refuse(what: string): never {
  throw new PromptRuntimeError('invalid-pricing', `pricing.json: ${what} is not valid.`);
}

const isPrice = (value: unknown): value is number => finite(value) && value >= 0;

function toPrice(model: unknown, path: string): PromptModelPrice {
  if (!isObject(model)) refuse(path);
  const names = NAMES.map((key) => {
    const value = own(model, key);
    return text(value, 128) ? value : refuse(`${path}.${key}`);
  });
  const prices = PRICES.map((key) => {
    const value = own(model, key);
    return isPrice(value) ? value : refuse(`${path}.${key}`);
  });
  const checkedOn = own(model, 'checkedOn');
  if (typeof checkedOn !== 'string' || !DATE.test(checkedOn)) {
    refuse(`${path}.checkedOn`);
  }
  const [ref, apiId, provider] = names as [string, string, string];
  const [inputUsdPerMillion, outputUsdPerMillion] = prices as [number, number];
  return { ref, provider, apiId, inputUsdPerMillion, outputUsdPerMillion, checkedOn };
}

/**
 * Read a release `pricing.json`. Prices go into a map, so no model id can reach an object
 * prototype. When two entries share a provider and an API id, the higher price of each side
 * is kept, which makes a cost an upper estimate.
 *
 * @param content - Content of `pricing.json`, at most 256 KiB
 * @returns A frozen table with `find(provider, apiId)`
 * @throws {PromptRuntimeError} `invalid-pricing` when the text is not a valid pricing file
 *
 * @example
 * const pricing = readPricing(await readFile('.promptscript/releases/pricing.json', 'utf8'));
 * pricing.find('anthropic', 'claude-sonnet-5-5')?.inputUsdPerMillion;
 */
export function readPricing(content: string): PromptPricingTable {
  if (typeof content !== 'string' || content.length > MAX_LENGTH) {
    refuse('the content');
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    refuse('the JSON');
  }
  const models =
    isObject(parsed) && own(parsed, '$schema') === SCHEMA ? own(parsed, 'models') : undefined;
  if (!Array.isArray(models) || models.length > MAX_MODELS) {
    refuse('$schema or models');
  }
  const prices = new Map<string, PromptModelPrice>();
  models.forEach((model: unknown, index) => {
    const price = toPrice(model, `models[${index}]`);
    const key = `${price.provider}\0${price.apiId}`;
    const seen = prices.get(key);
    prices.set(
      key,
      Object.freeze(
        seen
          ? {
              ...price,
              inputUsdPerMillion: Math.max(price.inputUsdPerMillion, seen.inputUsdPerMillion),
              outputUsdPerMillion: Math.max(price.outputUsdPerMillion, seen.outputUsdPerMillion),
            }
          : price
      )
    );
  });
  return Object.freeze({
    find: (provider: string, apiId: string) => prices.get(`${provider}\0${apiId}`),
  });
}

/**
 * Cost of a call in USD from its token counts and the model price.
 *
 * @param inputTokens - Input tokens
 * @param outputTokens - Output tokens
 * @param price - Price per million tokens
 * @returns Cost in USD, not rounded
 */
export function callCostUsd(
  inputTokens: number,
  outputTokens: number,
  price: PromptModelPrice
): number {
  return (
    (inputTokens * price.inputUsdPerMillion + outputTokens * price.outputUsdPerMillion) / 1_000_000
  );
}
