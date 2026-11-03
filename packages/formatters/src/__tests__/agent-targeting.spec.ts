import { describe, expect, it } from 'vitest';
import type {
  Block,
  ObjectContent,
  Program,
  SourceLocation,
  TargetConfig,
  Value,
} from '@promptscript/core';
import {
  applyAgentTargeting,
  getAgentSpawnToolWarnings,
  mapAgentToolNames,
  shouldIncludeAgent,
} from '../agent-targeting.js';
import {
  ClaudeFormatter,
  CodexFormatter,
  CursorFormatter,
  FactoryFormatter,
  GitHubFormatter,
  GrokFormatter,
  OpenCodeFormatter,
} from '../index.js';
import type { FormatterOutput } from '../types.js';

const loc: SourceLocation = { file: 'project.prs', line: 1, column: 1, offset: 0 };

function makeProgram(agents: Record<string, Value>): Program {
  const block: Block = {
    type: 'Block',
    name: 'agents',
    content: { type: 'ObjectContent', properties: agents, loc } satisfies ObjectContent,
    loc,
  };
  return { type: 'Program', blocks: [block], uses: [], extends: [], loc };
}

function agentProps(ast: Program): Record<string, Value> {
  const content = ast.blocks.find((block) => block.name === 'agents')!.content as ObjectContent;
  return content.properties;
}

function findFile(output: FormatterOutput, path: string): string | undefined {
  return output.additionalFiles?.find((file) => file.path === path)?.content;
}

const factoryStyleAgents: Record<string, Value> = {
  builder: {
    description: 'Build features',
    content: 'Build it.',
    tools: ['Read', 'LS', 'Grep', 'Glob', 'Create', 'Edit', 'ApplyPatch', 'Execute', 'FetchUrl'],
    model: 'opus',
  },
  orchestrator: {
    description: 'Fan out work',
    content: 'Split the work.',
    tools: ['Read', 'Task'],
  },
};

describe('mapAgentToolNames', () => {
  it('maps Factory tool names to Claude Code names and drops duplicates', () => {
    expect(
      mapAgentToolNames(['Read', 'LS', 'Glob', 'Create', 'ApplyPatch', 'Edit', 'Execute'], 'claude')
    ).toEqual(['Read', 'Glob', 'Write', 'Edit', 'Bash']);
    expect(mapAgentToolNames(['FetchUrl', 'WebSearch', 'TodoWrite'], 'claude')).toEqual([
      'WebFetch',
      'WebSearch',
      'TodoWrite',
    ]);
  });

  it('maps Claude Code tool names to Factory names', () => {
    expect(
      mapAgentToolNames(['Read', 'Write', 'MultiEdit', 'Edit', 'Bash', 'WebFetch'], 'factory')
    ).toEqual(['Read', 'Create', 'Edit', 'Execute', 'FetchUrl']);
  });

  it('maps for grok like for claude', () => {
    expect(mapAgentToolNames(['Execute'], 'grok')).toEqual(['Bash']);
  });

  it('leaves other targets and unknown names as written', () => {
    expect(mapAgentToolNames(['Create', 'mcp__x__y'], 'github')).toEqual(['Create', 'mcp__x__y']);
    expect(mapAgentToolNames(['mcp__x__y'], 'claude')).toEqual(['mcp__x__y']);
  });
});

describe('shouldIncludeAgent', () => {
  it('includes every agent by default', () => {
    expect(shouldIncludeAgent('a')).toBe(true);
    expect(shouldIncludeAgent('a', { includeAgents: true })).toBe(true);
  });

  it('includes nothing with includeAgents false', () => {
    expect(shouldIncludeAgent('a', { includeAgents: false })).toBe(false);
  });

  it('includes only listed agents', () => {
    const config: TargetConfig = { includeAgents: ['a', 'team-reviewer'] };
    expect(shouldIncludeAgent('a', config)).toBe(true);
    expect(shouldIncludeAgent('b', config)).toBe(false);
    expect(shouldIncludeAgent('team.reviewer', config)).toBe(true);
  });

  it('excludes listed agents after includeAgents', () => {
    expect(shouldIncludeAgent('a', { excludeAgents: ['a'] })).toBe(false);
    expect(shouldIncludeAgent('a', { includeAgents: ['a'], excludeAgents: ['a'] })).toBe(false);
    expect(shouldIncludeAgent('team.reviewer', { excludeAgents: ['team.reviewer'] })).toBe(false);
  });
});

describe('applyAgentTargeting', () => {
  it('merges the target override and drops targets', () => {
    const ast = makeProgram({
      a: {
        description: 'A',
        tools: ['Read', 'Execute'],
        model: 'gpt-5',
        targets: { claude: { tools: ['Read', 'Bash'], model: 'sonnet' }, factory: { model: 'x' } },
      },
    });
    const props = agentProps(applyAgentTargeting(ast, 'claude'));
    expect(props['a']).toEqual({ description: 'A', tools: ['Read', 'Bash'], model: 'sonnet' });
  });

  it('keeps shared fields when there is no override for the target', () => {
    const ast = makeProgram({
      a: { description: 'A', tools: ['Read'], targets: { factory: { tools: ['LS'] } } },
    });
    expect(agentProps(applyAgentTargeting(ast, 'claude'))['a']).toEqual({
      description: 'A',
      tools: ['Read'],
    });
  });

  it('removes excluded agents and does not change the input', () => {
    const ast = makeProgram({ a: { description: 'A' }, b: { description: 'B' } });
    const result = applyAgentTargeting(ast, 'claude', { excludeAgents: ['b'] });
    expect(Object.keys(agentProps(result))).toEqual(['a']);
    expect(Object.keys(agentProps(ast))).toEqual(['a', 'b']);
  });

  it('is idempotent', () => {
    const ast = makeProgram(factoryStyleAgents);
    const once = applyAgentTargeting(ast, 'claude');
    expect(applyAgentTargeting(once, 'claude')).toEqual(once);
  });

  it('returns the program unchanged without an agents block', () => {
    const ast: Program = { type: 'Program', blocks: [], uses: [], extends: [], loc };
    expect(applyAgentTargeting(ast, 'claude')).toBe(ast);
  });
});

describe('getAgentSpawnToolWarnings', () => {
  it('warns for Task and Agent in claude agents only', () => {
    const ast = makeProgram({
      a: { description: 'A', tools: ['Task'] },
      b: { description: 'B', tools: ['Agent', 'Read'] },
      c: { description: 'C', tools: ['Read'] },
    });
    const warnings = getAgentSpawnToolWarnings(ast, 'claude');
    expect(warnings.map((w) => w.message)).toEqual([
      'Agent "a": tool "Task" does nothing in a claude subagent, subagents can not spawn other subagents.',
      'Agent "b": tool "Agent" does nothing in a claude subagent, subagents can not spawn other subagents.',
    ]);
    expect(warnings.every((w) => w.code === 'PS4003')).toBe(true);
    expect(getAgentSpawnToolWarnings(ast, 'factory')).toEqual([]);
  });
});

describe('per-target agents in formatters', () => {
  it('writes Claude tool names in claude agent files', () => {
    const output = new ClaudeFormatter().format(makeProgram(factoryStyleAgents), {
      version: 'full',
    });
    const builder = findFile(output, '.claude/agents/builder.md');
    expect(builder).toContain(
      "tools: ['Read', 'Glob', 'Grep', 'Write', 'Edit', 'Bash', 'WebFetch']"
    );
  });

  it('keeps Factory tool names in factory droid files', () => {
    const output = new FactoryFormatter().format(makeProgram(factoryStyleAgents), {
      version: 'full',
    });
    const builder = findFile(output, '.factory/droids/builder.md');
    expect(builder).toContain(
      'tools: ["Read", "LS", "Grep", "Glob", "Create", "Edit", "ApplyPatch", "Execute", "FetchUrl"]'
    );
  });

  it('applies targets.claude tools and model only for claude', () => {
    const ast = makeProgram({
      reviewer: {
        description: 'Review',
        content: 'Review it.',
        tools: ['Read', 'Execute'],
        model: 'haiku',
        targets: { claude: { tools: ['Read', 'Grep'], model: 'opus' } },
      },
    });
    const claude = findFile(
      new ClaudeFormatter().format(ast, { version: 'full' }),
      '.claude/agents/reviewer.md'
    );
    expect(claude).toContain("tools: ['Read', 'Grep']");
    expect(claude).toContain('model: opus');
    expect(claude).not.toContain('targets');

    const factory = findFile(
      new FactoryFormatter().format(ast, { version: 'full' }),
      '.factory/droids/reviewer.md'
    );
    expect(factory).toContain('tools: ["Read", "Execute"]');
    expect(factory).not.toContain('Grep');
  });

  it('does not report targets as a dropped field', () => {
    const ast = makeProgram({
      reviewer: {
        description: 'Review',
        content: 'Review it.',
        targets: { claude: { model: 'opus' } },
      },
    });
    const output = new ClaudeFormatter().format(ast, { version: 'full' });
    expect((output.warnings ?? []).some((w) => w.message.includes('"targets"'))).toBe(false);
  });

  it('warns when a claude agent lists Task', () => {
    const output = new ClaudeFormatter().format(makeProgram(factoryStyleAgents), {
      version: 'full',
    });
    expect(output.warnings?.map((w) => w.message)).toContain(
      'Agent "orchestrator": tool "Task" does nothing in a claude subagent, subagents can not spawn other subagents.'
    );
  });

  it('does not warn about Task once the agent is excluded', () => {
    const output = new ClaudeFormatter().format(makeProgram(factoryStyleAgents), {
      version: 'full',
      targetConfig: { excludeAgents: ['orchestrator'] },
    });
    expect(findFile(output, '.claude/agents/orchestrator.md')).toBeUndefined();
    expect(findFile(output, '.claude/agents/builder.md')).toBeDefined();
    expect((output.warnings ?? []).some((w) => w.message.includes('"Task"'))).toBe(false);
  });

  it('warns for grok with its own target name', () => {
    const output = new GrokFormatter().format(makeProgram(factoryStyleAgents), {
      version: 'full',
    });
    expect(output.warnings?.map((w) => w.message)).toContain(
      'Agent "orchestrator": tool "Task" does nothing in a grok subagent, subagents can not spawn other subagents.'
    );
  });

  it.each([
    ['claude', new ClaudeFormatter(), '.claude/agents/'],
    ['github', new GitHubFormatter(), '.github/agents/'],
    ['cursor', new CursorFormatter(), '.cursor/agents/'],
    ['factory', new FactoryFormatter(), '.factory/droids/'],
    ['codex', new CodexFormatter(), '.codex/agents/'],
    ['opencode', new OpenCodeFormatter(), '.opencode/agents/'],
  ])('%s honors includeAgents and excludeAgents', (_name, formatter, prefix) => {
    const ast = makeProgram({
      a: { description: 'A', content: 'A.' },
      b: { description: 'B', content: 'B.' },
      c: { description: 'C', content: 'C.' },
    });
    const agentFiles = (targetConfig: TargetConfig): string[] =>
      (formatter.format(ast, { version: 'full', targetConfig }).additionalFiles ?? [])
        .map((file) => file.path)
        .filter((path) => path.startsWith(prefix))
        .sort();

    expect(agentFiles({})).toHaveLength(3);
    expect(agentFiles({ includeAgents: false })).toHaveLength(0);
    expect(agentFiles({ includeAgents: ['a', 'b'] })).toHaveLength(2);
    expect(agentFiles({ includeAgents: ['a', 'b'], excludeAgents: ['b'] })).toEqual([
      expect.stringContaining('/a.'),
    ]);
  });
});
