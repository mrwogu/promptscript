import * as otel from '@opentelemetry/api';
import { describe, expect, it } from 'vitest';
import { renderedFull } from '../__tests__/rendered.js';
import type { PromptRuntimeError } from '../errors.js';
import { createPromptTelemetry } from './telemetry.js';

// No SDK is registered in this file: the real API hands out no-op spans
describe('without an SDK', () => {
  it('returns the value, hands out the zero ref and records feedback as nothing', async () => {
    // Arrange
    const errors: PromptRuntimeError[] = [];
    const telemetry = createPromptTelemetry(otel, { onError: (error) => errors.push(error) });
    let ref: unknown;

    // Act
    const value = await telemetry.trace(renderedFull(), async (span) => {
      ref = span;
      return 'reply';
    });
    telemetry.feedback({
      span: ref as { traceId: string; spanId: string; traceFlags: number },
      name: 'user.thumbs',
      score: 1,
    });

    // Assert
    expect(value).toBe('reply');
    expect(ref).toEqual({ traceId: '0'.repeat(32), spanId: '0'.repeat(16), traceFlags: 0 });
    expect(errors).toEqual([]);
  });
});
