import { describe, it, expect } from 'vitest';
import { mapSections } from '../mapper.js';
import { ConfidenceLevel } from '../confidence.js';
import type { MarkdownSection } from '../parsers/markdown.js';

function section(overrides: Partial<MarkdownSection> = {}): MarkdownSection {
  return {
    heading: 'Test',
    level: 2,
    content: 'Some content',
    rawLines: ['Some content'],
    ...overrides,
  };
}

describe('mapSections', () => {
  it('maps "You are" pattern to @identity with HIGH confidence', () => {
    const sections = [
      section({ heading: 'About', content: 'You are an expert TypeScript developer.' }),
    ];
    const result = mapSections(sections);
    expect(result).toHaveLength(1);
    expect(result[0]!.targetBlock).toBe('identity');
    expect(result[0]!.level).toBe(ConfidenceLevel.HIGH);
  });

  it('maps "Never/Don\'t" lists to @restrictions with HIGH confidence', () => {
    const sections = [
      section({ heading: 'Rules', content: "- Never use any type\n- Don't skip error handling" }),
    ];
    const result = mapSections(sections);
    expect(result[0]!.targetBlock).toBe('restrictions');
    expect(result[0]!.level).toBe(ConfidenceLevel.HIGH);
  });

  it('maps "Always" lists to @restrictions with HIGH confidence', () => {
    const sections = [section({ heading: 'Rules', content: '- Always use strict mode' })];
    const result = mapSections(sections);
    expect(result[0]!.targetBlock).toBe('restrictions');
  });

  it('maps "Use/Prefer/Follow" lists to @standards with HIGH confidence', () => {
    const sections = [
      section({
        heading: 'Code Style',
        content: '- Use ESLint\n- Prefer interfaces over types\n- Follow naming conventions',
      }),
    ];
    const result = mapSections(sections);
    expect(result[0]!.targetBlock).toBe('standards');
    expect(result[0]!.level).toBe(ConfidenceLevel.HIGH);
  });

  it('maps Testing/Commands/CLI headings to @knowledge', () => {
    const sections = [section({ heading: 'Testing', content: '```bash\npnpm test\n```' })];
    const result = mapSections(sections);
    expect(result[0]!.targetBlock).toBe('knowledge');
  });

  it('maps Commands heading to @knowledge', () => {
    const sections = [section({ heading: 'Commands', content: '```bash\npnpm build\n```' })];
    const result = mapSections(sections);
    expect(result[0]!.targetBlock).toBe('knowledge');
  });

  it('maps unrecognized sections to @context with LOW confidence', () => {
    const sections = [
      section({ heading: 'Random Stuff', content: 'Some random text about nothing.' }),
    ];
    const result = mapSections(sections);
    expect(result[0]!.targetBlock).toBe('context');
    expect(result[0]!.level).toBe(ConfidenceLevel.LOW);
  });

  it('maps mixed content sections with MEDIUM confidence', () => {
    const sections = [
      section({
        heading: 'Guidelines',
        content: 'Some intro text.\n\n- Use TypeScript\n- Never use var\n\nMore text.',
      }),
    ];
    const result = mapSections(sections);
    expect(result[0]!.level).toBe(ConfidenceLevel.MEDIUM);
  });

  it('preserves heading in output', () => {
    const sections = [section({ heading: 'My Section', content: 'Content here.' })];
    const result = mapSections(sections);
    expect(result[0]!.heading).toBe('My Section');
  });

  it('preserves content in output', () => {
    const sections = [section({ heading: 'X', content: 'Preserved content.' })];
    const result = mapSections(sections);
    expect(result[0]!.content).toBe('Preserved content.');
  });

  it('handles empty sections array', () => {
    expect(mapSections([])).toEqual([]);
  });

  it('maps "Don\'ts" heading to @restrictions', () => {
    const sections = [section({ heading: "Don'ts", content: "- Don't use default exports" })];
    const result = mapSections(sections);
    expect(result[0]!.targetBlock).toBe('restrictions');
  });

  it('maps preamble (no heading) to @identity if "You are" pattern found', () => {
    const sections = [section({ heading: '', level: 0, content: 'You are a senior engineer.' })];
    const result = mapSections(sections);
    expect(result[0]!.targetBlock).toBe('identity');
  });

  it('maps preamble without identity pattern to @context', () => {
    const sections = [section({ heading: '', level: 0, content: 'This project does X.' })];
    const result = mapSections(sections);
    expect(result[0]!.targetBlock).toBe('context');
  });
});
