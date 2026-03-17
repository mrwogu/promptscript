import { describe, it, expect } from 'vitest';
import { resolve } from 'path';
import { validateRoundtrip } from '../roundtrip.js';

const fixturesDir = resolve(__dirname, 'fixtures');

describe('validateRoundtrip', () => {
  it('roundtrips CLAUDE.md to valid PRS', async () => {
    const result = await validateRoundtrip(resolve(fixturesDir, 'sample-claude.md'));
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.sectionCount.imported).toBeGreaterThan(0);
    expect(result.sectionCount.parsed).toBeGreaterThan(0);
  });

  it('roundtrips .cursorrules to valid PRS', async () => {
    const result = await validateRoundtrip(resolve(fixturesDir, 'sample-cursorrules'));
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('roundtrips copilot-instructions.md to valid PRS', async () => {
    const result = await validateRoundtrip(resolve(fixturesDir, 'sample-copilot.md'));
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('preserves all sections (no content loss)', async () => {
    const result = await validateRoundtrip(resolve(fixturesDir, 'sample-claude.md'));
    expect(result.sectionCount.imported).toBeGreaterThanOrEqual(4);
    expect(result.sectionCount.parsed).toBeGreaterThan(0);
  });

  it('generates valid @meta block', async () => {
    const result = await validateRoundtrip(resolve(fixturesDir, 'sample-claude.md'));
    expect(result.valid).toBe(true);
    expect(result.hasMeta).toBe(true);
  });

  it('includes warnings for low-confidence sections', async () => {
    const result = await validateRoundtrip(resolve(fixturesDir, 'sample-claude.md'));
    // warnings may or may not exist depending on content
    expect(result.warnings).toBeDefined();
    expect(Array.isArray(result.warnings)).toBe(true);
  });
});
