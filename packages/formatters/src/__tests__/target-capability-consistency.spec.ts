import { describe, expect, it } from 'vitest';
import { validateBuiltinFormatterCapabilities } from '../target-capability-consistency.js';

describe('built-in formatter capability metadata', () => {
  it('matches every registered formatter', () => {
    expect(validateBuiltinFormatterCapabilities()).toEqual([]);
  });
});
