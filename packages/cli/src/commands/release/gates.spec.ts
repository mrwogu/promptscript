import { describe, expect, it } from 'vitest';
import { checkPromotionGates } from './gates.js';

describe('checkPromotionGates', () => {
  it('has no gate yet, so every promotion passes', () => {
    const result = checkPromotionGates({
      command: 'promote',
      projectRoot: '/repo',
      environment: 'prod',
      prompts: [{ id: 'acme/refund', contentHash: `sha256-${'0'.repeat(64)}` }],
    });

    expect(result).toEqual({ passed: true, findings: [] });
  });
});
