import * as otel from '@opentelemetry/api';
import { describe, expect, expectTypeOf, it } from 'vitest';
import { createPromptTelemetry } from './telemetry.js';
import type { RenderedPrompt } from '../types.js';
import type { OtelApiLike, PromptFeedback, PromptTelemetry } from './types.js';

describe('types', () => {
  it('accepts the real OpenTelemetry API namespace without a cast', () => {
    const api: OtelApiLike = otel;

    expectTypeOf(otel).toExtend<OtelApiLike>();
    expect(createPromptTelemetry(api)).toBeDefined();
  });

  it('returns a PromptTelemetry', () => {
    expectTypeOf(createPromptTelemetry).returns.toEqualTypeOf<PromptTelemetry>();
  });

  it('has no free text field in a feedback', () => {
    expectTypeOf<keyof PromptFeedback>().toEqualTypeOf<
      'span' | 'name' | 'score' | 'label' | 'prompt'
    >();
  });

  it('allows in a feedback prompt exactly the keys of a rendered prompt meta', () => {
    // The feedback check names these keys, so a new meta field needs a decision there
    expectTypeOf<keyof RenderedPrompt['meta']>().toEqualTypeOf<
      | 'id'
      | 'contentHash'
      | 'label'
      | 'experiment'
      | 'variant'
      | 'source'
      | 'loadedAt'
      | 'stale'
      | 'warnings'
    >();
  });
});
