import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { claudeParser } from '../../parsers/claude.js';
import { githubParser } from '../../parsers/github.js';
import { cursorParser } from '../../parsers/cursor.js';
import { genericParser } from '../../parsers/generic.js';

const fixturesDir = resolve(__dirname, '../fixtures');

describe('claudeParser', () => {
  it('can parse CLAUDE.md by filename', () => {
    expect(claudeParser.canParse('CLAUDE.md', '')).toBe(true);
    expect(claudeParser.canParse('claude.md', '')).toBe(true);
    expect(claudeParser.canParse('/path/to/CLAUDE.md', '')).toBe(true);
  });

  it('rejects non-CLAUDE files', () => {
    expect(claudeParser.canParse('README.md', '')).toBe(false);
    expect(claudeParser.canParse('.cursorrules', '')).toBe(false);
  });

  it('parses sample CLAUDE.md fixture', () => {
    const content = readFileSync(resolve(fixturesDir, 'sample-claude.md'), 'utf-8');
    const sections = claudeParser.parse(content);
    expect(sections.length).toBeGreaterThanOrEqual(4);

    const headings = sections.map((s) => s.heading);
    expect(headings).toContain('Code Style');
    expect(headings).toContain("Don'ts");
    expect(headings).toContain('Commands');
    expect(headings).toContain('Testing');
  });
});

describe('githubParser', () => {
  it('can parse copilot-instructions.md by filename', () => {
    expect(githubParser.canParse('copilot-instructions.md', '')).toBe(true);
    expect(githubParser.canParse('.github/copilot-instructions.md', '')).toBe(true);
  });

  it('rejects non-GitHub files', () => {
    expect(githubParser.canParse('CLAUDE.md', '')).toBe(false);
    expect(githubParser.canParse('README.md', '')).toBe(false);
  });

  it('parses sample copilot fixture', () => {
    const content = readFileSync(resolve(fixturesDir, 'sample-copilot.md'), 'utf-8');
    const sections = githubParser.parse(content);
    expect(sections.length).toBeGreaterThanOrEqual(1);
    const headings = sections.map((s) => s.heading);
    expect(headings).toContain('Guidelines');
  });
});

describe('cursorParser', () => {
  it('can parse .cursorrules by filename', () => {
    expect(cursorParser.canParse('.cursorrules', '')).toBe(true);
    expect(cursorParser.canParse('/project/.cursorrules', '')).toBe(true);
  });

  it('can parse .cursor/rules.md', () => {
    expect(cursorParser.canParse('.cursor/rules.md', '')).toBe(true);
  });

  it('rejects non-Cursor files', () => {
    expect(cursorParser.canParse('CLAUDE.md', '')).toBe(false);
  });

  it('parses sample cursorrules fixture', () => {
    const content = readFileSync(resolve(fixturesDir, 'sample-cursorrules'), 'utf-8');
    const sections = cursorParser.parse(content);
    expect(sections.length).toBeGreaterThanOrEqual(2);
    const headings = sections.map((s) => s.heading);
    expect(headings).toContain('Standards');
    expect(headings).toContain('Restrictions');
  });
});

describe('genericParser', () => {
  it('can parse any file', () => {
    expect(genericParser.canParse('anything.md', '')).toBe(true);
    expect(genericParser.canParse('random.txt', '')).toBe(true);
  });

  it('parses markdown content', () => {
    const sections = genericParser.parse('# Title\n\nContent');
    expect(sections).toHaveLength(1);
    expect(sections[0]!.heading).toBe('Title');
  });
});
