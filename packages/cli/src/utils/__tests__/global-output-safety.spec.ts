import { describe, expect, it } from 'vitest';
import { homedir } from 'node:os';
import { resolve } from 'node:path';
import { describeProtectedUserFile } from '../global-output-safety.js';

describe('describeProtectedUserFile', () => {
  it('flags the Factory personal override in the home directory', () => {
    const hit = describeProtectedUserFile(resolve(homedir(), '.factory/AGENTS.md'));
    expect(hit).toBeDefined();
    expect(hit?.displayPath).toBe('~/.factory/AGENTS.md');
    expect(hit?.reason).toContain('personal override');
  });

  it('accepts project-level factory outputs', () => {
    expect(describeProtectedUserFile('/mock/project/.factory/AGENTS.md')).toBeUndefined();
    expect(describeProtectedUserFile('/mock/project/.factory/droids/reviewer.md')).toBeUndefined();
  });

  it('accepts unrelated home files', () => {
    expect(describeProtectedUserFile(resolve(homedir(), 'AGENTS.md'))).toBeUndefined();
    expect(
      describeProtectedUserFile(resolve(homedir(), '.claude/agents/reviewer.md'))
    ).toBeUndefined();
  });
});
