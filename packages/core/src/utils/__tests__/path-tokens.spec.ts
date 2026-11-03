import { describe, expect, it } from 'vitest';
import { isPathTokenName, replacePathTokens } from '../path-tokens.js';

describe('isPathTokenName', () => {
  it.each(['prs.dotDir', 'prs.skillsDir', 'prs.skillDir'])('accepts %s', (name) => {
    expect(isPathTokenName(name)).toBe(true);
  });

  it.each(['dotDir', 'prs.rootDir', 'input.dotDir', 'prs.dotDir.x'])('rejects %s', (name) => {
    expect(isPathTokenName(name)).toBe(false);
  });
});

describe('replacePathTokens', () => {
  const values = {
    dotDir: '.claude',
    skillsDir: '.claude/skills',
    skillDir: '.claude/skills/review',
  };

  it('replaces every token', () => {
    const result = replacePathTokens(
      'Run {{prs.skillDir}}/run.py, see {{prs.skillsDir}}/other and {{prs.dotDir}}/agents.',
      values
    );
    expect(result).toEqual({
      text: 'Run .claude/skills/review/run.py, see .claude/skills/other and .claude/agents.',
      unresolved: [],
    });
  });

  it('leaves tokens without a value and reports them once', () => {
    const result = replacePathTokens('{{prs.skillDir}} and {{prs.skillDir}}', { dotDir: '.x' });
    expect(result).toEqual({
      text: '{{prs.skillDir}} and {{prs.skillDir}}',
      unresolved: ['skillDir'],
    });
  });

  it('does not touch other double brace text', () => {
    const text =
      'flowchart TD\n  A{{"hexagon"}} --> B{{prs}}\n{{input.name}} {{prs.rootDir}} {{ prs.dotDir }}';
    expect(replacePathTokens(text, values)).toEqual({ text, unresolved: [] });
  });

  it('writes an escaped token without the backslash', () => {
    expect(replacePathTokens('Write \\{{prs.dotDir}} as is', values).text).toBe(
      'Write {{prs.dotDir}} as is'
    );
  });
});
