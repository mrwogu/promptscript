import { describe, it, expect } from 'vitest';
import { parseMarkdownSections } from '../../parsers/markdown.js';

describe('parseMarkdownSections', () => {
  it('extracts H1 sections', () => {
    const content = '# Title\n\nSome content here.\n\n# Another\n\nMore content.';
    const sections = parseMarkdownSections(content);
    expect(sections).toHaveLength(2);
    expect(sections[0]!.heading).toBe('Title');
    expect(sections[0]!.level).toBe(1);
    expect(sections[0]!.content).toContain('Some content here.');
    expect(sections[1]!.heading).toBe('Another');
  });

  it('extracts H2 sections', () => {
    const content = '## Code Style\n\n- Use strict mode\n\n## Testing\n\n- Use Vitest';
    const sections = parseMarkdownSections(content);
    expect(sections).toHaveLength(2);
    expect(sections[0]!.heading).toBe('Code Style');
    expect(sections[0]!.level).toBe(2);
    expect(sections[1]!.heading).toBe('Testing');
    expect(sections[1]!.level).toBe(2);
  });

  it('extracts mixed H1 and H2 sections', () => {
    const content = '# Main\n\nIntro.\n\n## Sub1\n\nContent 1.\n\n## Sub2\n\nContent 2.';
    const sections = parseMarkdownSections(content);
    expect(sections).toHaveLength(3);
    expect(sections[0]!.level).toBe(1);
    expect(sections[1]!.level).toBe(2);
    expect(sections[2]!.level).toBe(2);
  });

  it('preserves code blocks within sections', () => {
    const content = '## Commands\n\n```bash\npnpm test\n```\n\nRun tests.';
    const sections = parseMarkdownSections(content);
    expect(sections).toHaveLength(1);
    expect(sections[0]!.content).toContain('```bash');
    expect(sections[0]!.content).toContain('pnpm test');
  });

  it('preserves tables within sections', () => {
    const content = '## Config\n\n| Key | Value |\n|-----|-------|\n| a   | 1     |';
    const sections = parseMarkdownSections(content);
    expect(sections).toHaveLength(1);
    expect(sections[0]!.content).toContain('| Key | Value |');
  });

  it('preserves lists within sections', () => {
    const content = '## Rules\n\n- Rule 1\n- Rule 2\n  - Sub rule\n- Rule 3';
    const sections = parseMarkdownSections(content);
    expect(sections).toHaveLength(1);
    expect(sections[0]!.content).toContain('- Rule 1');
    expect(sections[0]!.content).toContain('  - Sub rule');
  });

  it('returns empty array for empty content', () => {
    expect(parseMarkdownSections('')).toEqual([]);
  });

  it('returns empty array for whitespace-only content', () => {
    expect(parseMarkdownSections('   \n\n  ')).toEqual([]);
  });

  it('handles files with no headings as a single preamble section', () => {
    const content = 'Some text without any headings.\n\nAnother paragraph.';
    const sections = parseMarkdownSections(content);
    expect(sections).toHaveLength(1);
    expect(sections[0]!.heading).toBe('');
    expect(sections[0]!.level).toBe(0);
    expect(sections[0]!.content).toContain('Some text without any headings.');
  });

  it('handles files with only code blocks', () => {
    const content = '```typescript\nconst x = 1;\n```\n\n```bash\necho hi\n```';
    const sections = parseMarkdownSections(content);
    expect(sections).toHaveLength(1);
    expect(sections[0]!.heading).toBe('');
    expect(sections[0]!.content).toContain('const x = 1;');
  });

  it('does not treat # inside code blocks as headings', () => {
    const content = '## Real Heading\n\n```markdown\n# Not a heading\n```\n\nContent.';
    const sections = parseMarkdownSections(content);
    expect(sections).toHaveLength(1);
    expect(sections[0]!.heading).toBe('Real Heading');
    expect(sections[0]!.content).toContain('# Not a heading');
  });

  it('stores raw lines for each section', () => {
    const content = '## Section\n\nLine 1\nLine 2';
    const sections = parseMarkdownSections(content);
    expect(sections[0]!.rawLines).toEqual(['', 'Line 1', 'Line 2']);
  });

  it('handles content before the first heading', () => {
    const content = 'Preamble text.\n\n# First Heading\n\nContent.';
    const sections = parseMarkdownSections(content);
    expect(sections).toHaveLength(2);
    expect(sections[0]!.heading).toBe('');
    expect(sections[0]!.level).toBe(0);
    expect(sections[0]!.content).toContain('Preamble text.');
    expect(sections[1]!.heading).toBe('First Heading');
  });
});
