import { describe, it, expect } from 'vitest';
import { detectFormat, getParser } from '../detector.js';

describe('detectFormat', () => {
  it('detects CLAUDE.md by filename', () => {
    expect(detectFormat('CLAUDE.md')).toBe('claude');
    expect(detectFormat('/path/to/CLAUDE.md')).toBe('claude');
    expect(detectFormat('claude.md')).toBe('claude');
  });

  it('detects copilot-instructions.md by path', () => {
    expect(detectFormat('.github/copilot-instructions.md')).toBe('github');
    expect(detectFormat('copilot-instructions.md')).toBe('github');
  });

  it('detects .cursorrules by filename', () => {
    expect(detectFormat('.cursorrules')).toBe('cursor');
    expect(detectFormat('/project/.cursorrules')).toBe('cursor');
  });

  it('detects .cursor/rules.md', () => {
    expect(detectFormat('.cursor/rules.md')).toBe('cursor');
  });

  it('detects AGENTS.md by filename', () => {
    expect(detectFormat('AGENTS.md')).toBe('generic');
    expect(detectFormat('/path/AGENTS.md')).toBe('generic');
  });

  it('falls back to generic for unknown files', () => {
    expect(detectFormat('README.md')).toBe('generic');
    expect(detectFormat('unknown.txt')).toBe('generic');
  });

  it('detects .github/instructions/ files as github format', () => {
    const result = detectFormat('.github/instructions/angular.instructions.md');
    expect(result).toBe('github');
  });
});

describe('github parser canParse', () => {
  it('detects applyTo frontmatter in content', () => {
    const parser = getParser('github');
    const content = '---\napplyTo:\n  - "src/**/*.ts"\n---\n# Rules';
    expect(parser.canParse('some/random/file.md', content)).toBe(true);
  });

  it('returns false for empty content on unknown path', () => {
    const parser = getParser('github');
    expect(parser.canParse('some/random/file.md', '')).toBe(false);
  });
});

describe('getParser', () => {
  it('returns claude parser for claude format', () => {
    const parser = getParser('claude');
    expect(parser.name).toBe('claude');
  });

  it('returns github parser for github format', () => {
    const parser = getParser('github');
    expect(parser.name).toBe('github');
  });

  it('returns cursor parser for cursor format', () => {
    const parser = getParser('cursor');
    expect(parser.name).toBe('cursor');
  });

  it('returns generic parser for generic format', () => {
    const parser = getParser('generic');
    expect(parser.name).toBe('generic');
  });

  it('returns generic parser for unknown format', () => {
    const parser = getParser('unknown-format');
    expect(parser.name).toBe('generic');
  });
});
