import { describe, it, expect } from 'vitest';
import { emitPrs } from '../emitter.js';
import { ConfidenceLevel } from '../confidence.js';
import type { ScoredSection } from '../confidence.js';

function scored(overrides: Partial<ScoredSection> = {}): ScoredSection {
  return {
    heading: 'Test',
    content: 'Test content',
    targetBlock: 'context',
    confidence: 0.9,
    level: ConfidenceLevel.HIGH,
    ...overrides,
  };
}

describe('emitPrs', () => {
  it('emits @meta block with id and syntax', () => {
    const result = emitPrs([], { projectName: 'my-project' });
    expect(result).toContain('@meta {');
    expect(result).toContain('id: "my-project"');
    expect(result).toContain('syntax: "1.0.0"');
  });

  it('emits @identity with text content', () => {
    const sections = [scored({ targetBlock: 'identity', content: 'You are an expert developer.' })];
    const result = emitPrs(sections, { projectName: 'test' });
    expect(result).toContain('@identity {');
    expect(result).toContain('You are an expert developer.');
  });

  it('emits @standards with list content', () => {
    const sections = [
      scored({
        targetBlock: 'standards',
        content: '- Use TypeScript\n- Prefer interfaces',
      }),
    ];
    const result = emitPrs(sections, { projectName: 'test' });
    expect(result).toContain('@standards {');
  });

  it('emits @restrictions with list content', () => {
    const sections = [
      scored({ targetBlock: 'restrictions', content: "- Never use any\n- Don't skip tests" }),
    ];
    const result = emitPrs(sections, { projectName: 'test' });
    expect(result).toContain('@restrictions {');
  });

  it('emits @context with text content', () => {
    const sections = [scored({ targetBlock: 'context', content: 'This is a Node.js project.' })];
    const result = emitPrs(sections, { projectName: 'test' });
    expect(result).toContain('@context {');
  });

  it('emits @knowledge with text content', () => {
    const sections = [scored({ targetBlock: 'knowledge', content: '```bash\npnpm test\n```' })];
    const result = emitPrs(sections, { projectName: 'test' });
    expect(result).toContain('@knowledge {');
  });

  it('adds REVIEW comment for MEDIUM confidence sections', () => {
    const sections = [
      scored({
        targetBlock: 'standards',
        heading: 'Guidelines',
        confidence: 0.6,
        level: ConfidenceLevel.MEDIUM,
      }),
    ];
    const result = emitPrs(sections, { projectName: 'test' });
    expect(result).toContain('# REVIEW');
    expect(result).toContain('Guidelines');
  });

  it('adds REVIEW comment for LOW confidence sections', () => {
    const sections = [
      scored({
        targetBlock: 'context',
        heading: 'Random',
        confidence: 0.3,
        level: ConfidenceLevel.LOW,
      }),
    ];
    const result = emitPrs(sections, { projectName: 'test' });
    expect(result).toContain('# REVIEW');
  });

  it('does not add REVIEW comment for HIGH confidence sections', () => {
    const sections = [scored({ confidence: 0.9, level: ConfidenceLevel.HIGH })];
    const result = emitPrs(sections, { projectName: 'test' });
    expect(result).not.toContain('# REVIEW');
  });

  it('emits full file with multiple blocks', () => {
    const sections = [
      scored({ targetBlock: 'identity', content: 'You are an expert.' }),
      scored({ targetBlock: 'standards', content: '- Use TypeScript' }),
      scored({ targetBlock: 'restrictions', content: '- Never use any' }),
    ];
    const result = emitPrs(sections, { projectName: 'full-test' });
    expect(result).toContain('@meta {');
    expect(result).toContain('@identity {');
    expect(result).toContain('@standards {');
    expect(result).toContain('@restrictions {');
  });

  it('merges multiple sections with the same target block', () => {
    const sections = [
      scored({ targetBlock: 'standards', content: '- Rule 1' }),
      scored({ targetBlock: 'standards', content: '- Rule 2' }),
    ];
    const result = emitPrs(sections, { projectName: 'test' });
    // Should have one @standards block with both rules
    const matches = result.match(/@standards \{/g);
    expect(matches).toHaveLength(1);
    expect(result).toContain('Rule 1');
    expect(result).toContain('Rule 2');
  });

  it('handles empty sections array (meta-only output)', () => {
    const result = emitPrs([], { projectName: 'empty' });
    expect(result).toContain('@meta {');
    expect(result).not.toContain('@identity');
    expect(result).not.toContain('@standards');
  });
});
