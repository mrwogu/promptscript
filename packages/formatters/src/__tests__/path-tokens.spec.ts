import { describe, expect, it } from 'vitest';
import type { Block, Program, SourceLocation, TargetConfig, Value } from '@promptscript/core';
import {
  AntigravityFormatter,
  ClaudeFormatter,
  CodexFormatter,
  CursorFormatter,
  FactoryFormatter,
  GitHubFormatter,
  formatProgram,
} from '../index.js';
import type { Formatter, FormatterOutput } from '../types.js';

const loc: SourceLocation = { file: 'project.prs', line: 1, column: 1, offset: 0 };

function objectBlock(name: string, properties: Record<string, Value>): Block {
  return { type: 'Block', name, content: { type: 'ObjectContent', properties, loc }, loc };
}

function makeProgram(): Program {
  return {
    type: 'Program',
    uses: [],
    extends: [],
    loc,
    blocks: [
      objectBlock('skills', {
        review: {
          description: 'Review code',
          content:
            'Run `python {{prs.skillDir}}/check.py`. Other skills are in {{prs.skillsDir}}.\n\n```mermaid\nflowchart TD\n  A{{"hexagon"}} --> B\n```',
        },
      }),
      objectBlock('agents', {
        reviewer: {
          description: 'Review',
          content: 'Use {{prs.skillsDir}}/review/check.py. Settings are in {{prs.dotDir}}.',
        },
      }),
    ],
  };
}

function allFiles(output: FormatterOutput): FormatterOutput[] {
  return [output, ...(output.additionalFiles ?? []).flatMap(allFiles)];
}

function fileContent(output: FormatterOutput, path: string): string {
  const file = allFiles(output).find((candidate) => candidate.path === path);
  if (!file) throw new Error(`missing ${path}`);
  return file.content;
}

describe('path tokens', () => {
  it.each<[string, Formatter, string, string, string]>([
    [
      'claude',
      new ClaudeFormatter(),
      '.claude/skills/review/SKILL.md',
      '.claude/agents/reviewer.md',
      '.claude',
    ],
    [
      'factory',
      new FactoryFormatter(),
      '.factory/skills/review/SKILL.md',
      '.factory/droids/reviewer.md',
      '.factory',
    ],
    [
      'github',
      new GitHubFormatter(),
      '.github/skills/review/SKILL.md',
      '.github/agents/reviewer.md',
      '.github',
    ],
  ])(
    '%s resolves tokens in skill and agent files',
    (_name, formatter, skillPath, agentPath, dot) => {
      const output = formatProgram(formatter, makeProgram(), { version: 'full' });
      const skillsDir = skillPath.replace('/review/SKILL.md', '');

      const skill = fileContent(output, skillPath);
      expect(skill).toContain(`python ${skillsDir}/review/check.py`);
      expect(skill).toContain(`Other skills are in ${skillsDir}.`);
      expect(skill).toContain('A{{"hexagon"}} --> B');

      const agent = fileContent(output, agentPath);
      expect(agent).toContain(`Use ${skillsDir}/review/check.py. Settings are in ${dot}.`);
      expect(allFiles(output).some((file) => file.content.includes('{{prs.'))).toBe(false);
    }
  );

  it('uses the configured skillBaseDir', () => {
    const targetConfig: TargetConfig = { skillBaseDir: 'tools/skills/' };
    const output = formatProgram(new ClaudeFormatter(), makeProgram(), {
      version: 'full',
      targetConfig,
    });
    const skill = fileContent(output, 'tools/skills/review/SKILL.md');
    expect(skill).toContain('python tools/skills/review/check.py');
    expect(fileContent(output, '.claude/agents/reviewer.md')).toContain(
      'Use tools/skills/review/check.py.'
    );
  });

  it('uses the target dot directory for cursor and codex', () => {
    expect(
      fileContent(
        formatProgram(new CursorFormatter(), makeProgram(), { version: 'full' }),
        '.cursor/agents/reviewer.md'
      )
    ).toContain('Settings are in .cursor.');
    expect(new CodexFormatter().getDotDir()).toBe('.codex');
    expect(new AntigravityFormatter().getDotDir()).toBe('.agent');
  });

  it('keeps tokens of a plain formatter without skill or dot directory', () => {
    const plain = {
      name: 'plain',
      outputPath: 'OUT.md',
      description: 'Plain',
      defaultConvention: 'markdown',
      format: (): FormatterOutput => ({ path: 'OUT.md', content: 'In {{prs.dotDir}}.' }),
    } as unknown as Formatter;
    const output = formatProgram(plain, makeProgram());

    expect(output.content).toBe('In {{prs.dotDir}}.');
    expect(output.warnings).toContainEqual(
      expect.objectContaining({
        code: 'PS4002',
        suggestion: 'Target "plain" has no such directory. Remove the token for this target.',
      })
    );
  });

  it('warns and keeps skillDir outside a skill directory', () => {
    const ast = makeProgram();
    const agents = ast.blocks[1]!;
    agents.content = {
      type: 'ObjectContent',
      properties: { reviewer: { description: 'Review', content: 'See {{prs.skillDir}}.' } },
      loc,
    };
    const output = formatProgram(new ClaudeFormatter(), ast, { version: 'full' });

    expect(fileContent(output, '.claude/agents/reviewer.md')).toContain('See {{prs.skillDir}}.');
    expect(output.warnings).toContainEqual(
      expect.objectContaining({
        code: 'PS4002',
        ruleName: 'path-token',
        message:
          '{{prs.skillDir}} in ".claude/agents/reviewer.md" has no value for target "claude" and is written as is.',
      })
    );
  });

  it('leaves output without tokens unchanged', () => {
    const ast: Program = {
      type: 'Program',
      uses: [],
      extends: [],
      loc,
      blocks: [objectBlock('agents', { a: { description: 'A', content: 'Plain {{"x"}}.' } })],
    };
    const output = formatProgram(new ClaudeFormatter(), ast, { version: 'full' });
    expect(fileContent(output, '.claude/agents/a.md')).toContain('Plain {{"x"}}.');
    expect(output.warnings?.some((w) => w.ruleName === 'path-token') ?? false).toBe(false);
  });
});
