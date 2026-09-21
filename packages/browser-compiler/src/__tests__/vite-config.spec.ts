import { describe, expect, it } from 'vitest';
import { BROWSER_NODE_ALIASES } from '../../vite.config.js';

describe('browser compiler Vite aliases', () => {
  it('aliases bare and node-prefixed path imports', () => {
    expect(BROWSER_NODE_ALIASES['node:path']).toBe(BROWSER_NODE_ALIASES.path);
  });
});
