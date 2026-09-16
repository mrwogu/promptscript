import { describe, expect, it } from 'vitest';
import type { Program, Value } from '@promptscript/core';
import { ClaudeFormatter } from '../formatters/claude.js';
import { CursorFormatter } from '../formatters/cursor.js';
import { GrokFormatter } from '../formatters/grok.js';
import {
  appendAgentCapabilityWarnings,
  getAgentCapabilityWarnings,
} from '../agent-capability-warnings.js';

function createLoc(line: number) {
  return { file: 'agents.prs', line, column: 1 };
}

function createAgentsProgram(fields: Record<string, Value>): Program {
  return {
    type: 'Program',
    blocks: [
      {
        type: 'Block',
        name: 'agents',
        content: {
          type: 'ObjectContent',
          properties: {
            reviewer: {
              description: 'Review changed code',
              content: 'Review correctness and security.',
              ...fields,
            } as Record<string, Value>,
          },
          loc: createLoc(3),
        },
        loc: createLoc(2),
      },
    ],
    uses: [],
    extends: [],
    loc: createLoc(1),
  };
}

function createEmptyProgram(): Program {
  return {
    type: 'Program',
    blocks: [
      {
        type: 'Block',
        name: 'identity',
        content: { type: 'TextContent', value: 'assistant', loc: createLoc(2) },
        loc: createLoc(1),
      },
    ],
    uses: [],
    extends: [],
    loc: createLoc(1),
  };
}

describe('agent capability warnings', () => {
  it('returns no warnings without an @agents block', () => {
    expect(getAgentCapabilityWarnings(createEmptyProgram(), 'claude', 'full')).toEqual([]);
  });

  it('warns for every field Claude cannot emit', () => {
    const ast = createAgentsProgram({
      sandboxMode: 'read-only',
      nicknameCandidates: ['reviewer'],
      handoffs: [{ label: 'hand off', agent: 'other' }],
      hooks: { pre: [] },
    });
    const warnings = getAgentCapabilityWarnings(ast, 'claude', 'full');
    expect(warnings.map((warning) => warning.message)).toEqual([
      'Agent "reviewer": field "sandboxMode" is not supported by target "claude" and will be omitted.',
      'Agent "reviewer": field "nicknameCandidates" is not supported by target "claude" and will be omitted.',
      'Agent "reviewer": field "handoffs" is not supported by target "claude" and will be omitted.',
      'Agent "reviewer": field "hooks" is not supported by target "claude" and will be omitted.',
    ]);
    for (const warning of warnings) {
      expect(warning.code).toBe('PS4003');
      expect(warning.ruleName).toBe('agent-compatibility');
      expect(warning.location).toEqual(createLoc(2));
    }
  });

  it('suggests supporting targets for canonical fields', () => {
    const warnings = getAgentCapabilityWarnings(
      createAgentsProgram({ sandboxMode: 'read-only' }),
      'claude',
      'full'
    );
    expect(warnings).toHaveLength(1);
    expect(warnings[0]!.suggestion).toContain('transformed by codex');
  });

  it('does not warn for fields GitHub transforms', () => {
    const ast = createAgentsProgram({
      tools: ['Read'],
      model: 'sonnet',
      specModel: 'gpt-4o',
      handoffs: [{ label: 'hand off', agent: 'other' }],
    });
    expect(getAgentCapabilityWarnings(ast, 'github', 'full')).toEqual([]);
  });

  it('warns for tools on Cursor', () => {
    const warnings = getAgentCapabilityWarnings(
      createAgentsProgram({ tools: ['Read'] }),
      'cursor',
      'full'
    );
    expect(warnings).toHaveLength(1);
    expect(warnings[0]!.message).toContain('field "tools"');
  });

  it('warns for model and tools on the shared Markdown agent contract', () => {
    const ast = createAgentsProgram({ model: 'sonnet', tools: ['Read'], permissionMode: 'plan' });
    expect(getAgentCapabilityWarnings(ast, 'opencode', 'full')).toHaveLength(3);
    expect(getAgentCapabilityWarnings(ast, 'augment', 'full')).toHaveLength(3);
    expect(getAgentCapabilityWarnings(ast, 'amp', 'full')).toHaveLength(3);
  });

  it('does not warn for the Grok delegation of the Claude contract', () => {
    const ast = createAgentsProgram({ permissionMode: 'plan', disallowedTools: ['Write'] });
    expect(getAgentCapabilityWarnings(ast, 'grok', 'full')).toEqual([]);
  });

  it('reports the whole block for targets without native agent output', () => {
    const warnings = getAgentCapabilityWarnings(createAgentsProgram({}), 'windsurf', 'full');
    expect(warnings).toHaveLength(1);
    expect(warnings[0]!.message).toBe(
      'Target "windsurf" has no native agent output and will omit @agents.'
    );
    expect(warnings[0]!.code).toBe('PS4003');
  });

  it('suppresses the block warning when unsupported-block diagnostics cover it', () => {
    expect(
      getAgentCapabilityWarnings(createAgentsProgram({}), 'hermes', 'simple', {
        blockWarningHandled: true,
      })
    ).toEqual([]);
  });

  it('reports the whole block for versions that cannot emit agents', () => {
    const warnings = getAgentCapabilityWarnings(createAgentsProgram({}), 'claude', 'simple');
    expect(warnings).toHaveLength(1);
    expect(warnings[0]!.message).toBe(
      'Target "claude" version "simple" cannot emit @agents and will omit it.'
    );
    expect(warnings[0]!.suggestion).toBe('Use a version that emits agents: full.');
  });

  it('reports the block for Codex simple mode', () => {
    const warnings = getAgentCapabilityWarnings(createAgentsProgram({}), 'codex', 'simple');
    expect(warnings).toHaveLength(1);
    expect(warnings[0]!.suggestion).toBe('Use a version that emits agents: multifile, full.');
  });

  it('ignores resolver-injected internals', () => {
    const ast = createAgentsProgram({});
    const agentsBlock = ast.blocks[0]!;
    agentsBlock.content = {
      type: 'ObjectContent',
      properties: {
        reviewer: {
          description: 'Review changed code',
          __outputDir: 'custom/dir',
        } as Record<string, Value>,
      },
      loc: createLoc(3),
    };
    expect(getAgentCapabilityWarnings(ast, 'claude', 'full')).toEqual([]);
  });

  it('appends warnings to an existing output', () => {
    const ast = createAgentsProgram({ tools: ['Read'] });
    const output = {
      path: '.cursor/rules/project.mdc',
      content: 'x',
      warnings: [{ code: 'PS4002', message: 'existing' }],
    };
    const appended = appendAgentCapabilityWarnings(output, ast, 'cursor', 'full');
    expect(appended.warnings).toHaveLength(2);
    expect(appended.warnings![1]!.code).toBe('PS4003');
  });
});

describe('agent capability warnings through formatters', () => {
  it('Claude full mode reports lossy fields', () => {
    const formatter = new ClaudeFormatter();
    const output = formatter.format(
      createAgentsProgram({ sandboxMode: 'read-only', permissionMode: 'plan' }),
      { version: 'full' }
    );
    const codes = (output.warnings ?? []).map((warning) => warning.code);
    expect(codes).toContain('PS4003');
    expect((output.warnings ?? []).find((warning) => warning.code === 'PS4003')!.message).toContain(
      'field "sandboxMode"'
    );
    // permissionMode is supported on claude and must not warn.
    expect(
      (output.warnings ?? []).filter((warning) => warning.message.includes('permissionMode'))
    ).toHaveLength(0);
  });

  it('Cursor full mode reports tools loss', () => {
    const formatter = new CursorFormatter();
    const output = formatter.format(createAgentsProgram({ tools: ['Read'] }), {
      version: 'full',
    });
    expect((output.warnings ?? []).map((warning) => warning.code)).toContain('PS4003');
  });

  it('Grok full mode mirrors the Claude contract', () => {
    const formatter = new GrokFormatter();
    const output = formatter.format(createAgentsProgram({ maxTurns: 10 }), {
      version: 'full',
    });
    expect(output.warnings ?? []).toEqual([]);
  });
});
