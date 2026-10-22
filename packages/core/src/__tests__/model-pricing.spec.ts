import { describe, expect, it } from 'vitest';
import { MODEL_PROFILES } from '../model-profiles.js';

const PRICED_PROVIDERS = ['anthropic', 'openai'];

describe('built-in model pricing', () => {
  const priced = MODEL_PROFILES.filter((profile) => profile.pricing !== undefined);

  it('prices every current Anthropic and OpenAI release', () => {
    const unpriced = MODEL_PROFILES.filter(
      (profile) =>
        PRICED_PROVIDERS.includes(profile.provider) &&
        profile.status === 'current' &&
        profile.pricing === undefined
    );

    expect(unpriced.map((profile) => profile.id)).toEqual([]);
  });

  it('prices only Anthropic and OpenAI releases', () => {
    expect(priced.every((profile) => PRICED_PROVIDERS.includes(profile.provider))).toBe(true);
  });

  it.each(priced.map((profile) => [profile.id, profile.pricing] as const))(
    'gives %s finite, non-negative prices checked on a YYYY-MM-DD date',
    (_id, pricing) => {
      expect(Number.isFinite(pricing?.inputUsdPerMillion)).toBe(true);
      expect(Number.isFinite(pricing?.outputUsdPerMillion)).toBe(true);
      expect(pricing?.inputUsdPerMillion).toBeGreaterThanOrEqual(0);
      expect(pricing?.outputUsdPerMillion).toBeGreaterThanOrEqual(0);
      expect(pricing?.checkedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  );
});
