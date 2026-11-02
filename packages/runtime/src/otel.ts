/**
 * OpenTelemetry spans for model calls and feedback on them.
 *
 * It imports nothing. The application passes its own `@opentelemetry/api` namespace (an
 * optional peer, version 1.9 or later 1.x) to `createPromptTelemetry`.
 *
 * @packageDocumentation
 */
export { createPromptTelemetry } from './otel/telemetry.js';
export { readPricing } from './otel/pricing.js';
export { anthropicResult, openAIChatResult } from './otel/readers.js';
export type * from './otel/types.js';
export type { PromptTelemetryErrorCode } from './errors.js';
