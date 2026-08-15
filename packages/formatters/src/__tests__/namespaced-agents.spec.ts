import { describe, expect, it } from 'vitest';
import type { Block, ObjectContent, Program, SourceLocation, Value } from '@promptscript/core';
import {
  ClaudeFormatter,
  CodexFormatter,
  CursorFormatter,
  FactoryFormatter,
  GitHubFormatter,
  OpenCodeFormatter,
} from '../index.js';

const loc: SourceLocation = { file: 'project.prs', line: 1, column: 1, offset: 0 };

function makeProgram(): Program {
  const agents: Record<string, Value> = {
    'team.reviewer': {
      description: 'Review team changes',
      content: 'Review the team changes.',
    },
  };
  const block: Block = {
    type: 'Block',
    name: 'agents',
    content: {
      type: 'ObjectContent',
      properties: agents,
      loc,
    } satisfies ObjectContent,
    loc,
  };
  return {
    type: 'Program',
    blocks: [block],
    uses: [],
    extends: [],
    loc,
  };
}

function additionalPaths(formatter: {
  format: (
    ast: Program,
    options?: { version?: string }
  ) => {
    additionalFiles?: Array<{ path: string }>;
  };
}): string[] {
  return (
    formatter
      .format(makeProgram(), { version: 'full' })
      .additionalFiles?.map((file) => file.path) ?? []
  );
}

describe('namespaced agent native output', () => {
  it.each([
    ['claude', new ClaudeFormatter(), '.claude/agents/team-reviewer.md'],
    ['github', new GitHubFormatter(), '.github/agents/team-reviewer.md'],
    ['cursor', new CursorFormatter(), '.cursor/agents/team-reviewer.md'],
    ['factory', new FactoryFormatter(), '.factory/droids/team-reviewer.md'],
    ['codex', new CodexFormatter(), '.codex/agents/team-reviewer.toml'],
    ['opencode', new OpenCodeFormatter(), '.opencode/agents/team-reviewer.md'],
  ])('maps %s qualified names to deterministic native names', (_name, formatter, expectedPath) => {
    expect(additionalPaths(formatter)).toContain(expectedPath);
  });
});
