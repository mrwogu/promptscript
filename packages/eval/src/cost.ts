import { Buffer } from 'node:buffer';
import type {
  EvalTokenUsageV1,
  ModelPricing,
  PromptBundleMessage,
  PromptBundleOutput,
} from '@promptscript/core';

/**
 * Cost of a call in USD from its token counts and the model price.
 *
 * @param usage - Input and output tokens
 * @param pricing - Price per million tokens
 * @returns Cost in USD, not rounded
 */
export function callCost(usage: EvalTokenUsageV1, pricing: ModelPricing): number {
  return (
    (usage.inputTokens * pricing.inputUsdPerMillion +
      usage.outputTokens * pricing.outputUsdPerMillion) /
    1_000_000
  );
}

// Tokens a provider adds around each message for roles and separators
const MESSAGE_OVERHEAD_TOKENS = 16;

/**
 * Upper bound of a call's cost before it is made: every UTF-8 byte of the
 * messages and of the output schema, which both mappers send and providers
 * bill as input, counts as an input token, plus a few tokens per message,
 * and the output uses the whole cap.
 *
 * @param messages - Rendered messages
 * @param output - Output contract sent with the request
 * @param maxOutputTokens - Output token cap of the call
 * @param pricing - Price per million tokens
 * @returns Cost in USD, not rounded
 */
export function worstCaseCost(
  messages: readonly PromptBundleMessage[],
  output: PromptBundleOutput | undefined,
  maxOutputTokens: number,
  pricing: ModelPricing
): number {
  const schemaTokens = Buffer.byteLength(JSON.stringify(output ?? ''), 'utf8');
  const inputTokens = messages.reduce(
    (sum, message) => sum + Buffer.byteLength(message.content, 'utf8') + MESSAGE_OVERHEAD_TOKENS,
    schemaTokens
  );
  return callCost({ inputTokens, outputTokens: maxOutputTokens }, pricing);
}

/** Cost rounded to six decimals, the precision written to reports. */
export function roundUsd(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}

/**
 * Spending limit of a run. Every call reserves its worst case first; the
 * actual cost replaces the reservation after a success, a failure keeps it
 * as spent, and only a release gives it back.
 */
export class Budget {
  private spentUsd = 0;
  private reservedUsd = 0;

  constructor(readonly maxUsd: number) {}

  /** Amount spent so far, failed calls that keep their reservation included. */
  get spent(): number {
    return this.spentUsd;
  }

  /** Reserve `amount`; false when spent plus reserved would pass the limit, or for no number. */
  reserve(amount: number): boolean {
    if (!Number.isFinite(amount) || amount < 0) return false;
    if (this.spentUsd + this.reservedUsd + amount > this.maxUsd) return false;
    this.reservedUsd += amount;
    return true;
  }

  /** Replace a reservation with what the call cost. */
  settle(reserved: number, actual: number): void {
    this.reservedUsd -= reserved;
    this.spentUsd += actual;
  }

  /** Count a reservation as spent: the provider may have billed the call. */
  keep(reserved: number): void {
    this.settle(reserved, reserved);
  }

  /** Give a reservation back: the provider refused the call before billing. */
  release(reserved: number): void {
    this.reservedUsd -= reserved;
  }
}
