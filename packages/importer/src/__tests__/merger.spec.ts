import { describe, it, expect } from 'vitest';
import { mergeSections, type SourcedSection } from '../merger.js';
import { classifyConfidence } from '../confidence.js';

function section(
  targetBlock: string,
  content: string,
  source: string,
  confidence = 0.85
): SourcedSection {
  return {
    heading: targetBlock,
    content,
    targetBlock,
    confidence,
    level: classifyConfidence(confidence),
    source,
  };
}

describe('mergeSections', () => {
  it('groups sections by targetBlock', () => {
    const sections = [
      section('identity', 'You are a TS expert', 'CLAUDE.md'),
      section('standards', 'Use strict mode', 'CLAUDE.md'),
      section('identity', 'You are helpful', '.cursorrules'),
    ];
    const result = mergeSections(sections);
    expect(result.merged.has('identity')).toBe(true);
    expect(result.merged.has('standards')).toBe(true);
  });

  it('picks longest identity by character count', () => {
    const sections = [
      section('identity', 'You are a TypeScript expert working on complex systems', 'CLAUDE.md'),
      section('identity', 'You are helpful', '.cursorrules'),
    ];
    const result = mergeSections(sections);
    const identity = result.merged.get('identity')!;
    expect(identity.content).toContain('TypeScript expert');
    expect(identity.reviewComments).toHaveLength(1);
    expect(identity.reviewComments[0]).toContain('.cursorrules');
  });

  it('unions restrictions from all sources', () => {
    const sections = [
      section('restrictions', '- "Never use any"', 'CLAUDE.md'),
      section('restrictions', '- "Never commit secrets"', '.cursorrules'),
    ];
    const result = mergeSections(sections);
    const restrictions = result.merged.get('restrictions')!;
    expect(restrictions.content).toContain('Never use any');
    expect(restrictions.content).toContain('Never commit secrets');
  });

  it('deduplicates exact-match lines after whitespace normalization', () => {
    const sections = [
      section('restrictions', '- "Never use any"', 'CLAUDE.md'),
      section('restrictions', '-  "Never use any"', '.cursorrules'),
      section('restrictions', '- "Never commit secrets"', '.cursorrules'),
    ];
    const result = mergeSections(sections);
    const restrictions = result.merged.get('restrictions')!;
    const lines = restrictions.content.split('\n').filter((l) => l.trim().length > 0);
    expect(lines).toHaveLength(2);
    expect(result.deduplicatedCount).toBeGreaterThan(0);
  });

  it('concatenates knowledge with source attribution', () => {
    const sections = [
      section('knowledge', 'API docs here', 'CLAUDE.md'),
      section('knowledge', 'CLI reference', '.cursorrules'),
    ];
    const result = mergeSections(sections);
    const knowledge = result.merged.get('knowledge')!;
    expect(knowledge.content).toContain('# Source: CLAUDE.md');
    expect(knowledge.content).toContain('# Source: .cursorrules');
  });

  it('merges standards by concatenating with dedup', () => {
    const sections = [
      section('standards', 'typescript: ["Strict mode"]', 'CLAUDE.md'),
      section('standards', 'naming: ["kebab-case"]', '.cursorrules'),
    ];
    const result = mergeSections(sections);
    const standards = result.merged.get('standards')!;
    expect(standards.content).toContain('Strict mode');
    expect(standards.content).toContain('kebab-case');
  });

  it('reports overall confidence', () => {
    const sections = [
      section('identity', 'You are expert', 'CLAUDE.md', 0.9),
      section('standards', 'Use strict', 'CLAUDE.md', 0.7),
    ];
    const result = mergeSections(sections);
    expect(result.overallConfidence).toBeCloseTo(0.8, 1);
  });

  it('returns overallConfidence 0 for empty sections array', () => {
    const result = mergeSections([]);
    expect(result.overallConfidence).toBe(0);
    expect(result.merged.size).toBe(0);
    expect(result.deduplicatedCount).toBe(0);
  });
});
