import { describe, it, expect } from 'vitest';
import { validAgentConfig } from '../../rules/valid-agent-config.js';
import type { RuleContext, ValidationMessage } from '../../types.js';
import type { Program, SourceLocation, Block, ObjectContent, Value } from '@promptscript/core';

const loc: SourceLocation = { file: 'test.prs', line: 1, column: 1, offset: 0 };

function makeAgentsBlock(agents: Record<string, Record<string, Value>>): Block {
  return {
    type: 'Block',
    name: 'agents',
    content: {
      type: 'ObjectContent',
      properties: agents,
      loc,
    } as ObjectContent,
    loc,
  };
}

function makeAst(agents: Record<string, Record<string, Value>>): Program {
  return {
    type: 'Program',
    blocks: [makeAgentsBlock(agents)],
    uses: [],
    extends: [],
    loc,
  };
}

function validate(agents: Record<string, Record<string, Value>>): ValidationMessage[] {
  const ast = makeAst(agents);
  const messages: ValidationMessage[] = [];
  const ctx: RuleContext = {
    ast,
    config: { strict: false } as unknown as RuleContext['config'],
    report: (msg) => {
      messages.push({
        ...msg,
        ruleId: 'PS033',
        ruleName: 'valid-agent-config',
        severity: msg.severity ?? 'warning',
        location: msg.location ?? loc,
      } as ValidationMessage);
    },
  };
  validAgentConfig.validate(ctx);
  return messages;
}

describe('PS033: valid-agent-config', () => {
  it('should accept valid agent with all fields', () => {
    const messages = validate({
      reviewer: {
        description: 'Review changed code',
        content: 'Review correctness and security.',
        reasoningEffort: 'high',
        sandboxMode: 'read-only',
        nicknameCandidates: ['reviewer', 'auditor'],
      },
    });
    expect(messages).toHaveLength(0);
  });

  it('should accept agent with only description', () => {
    const messages = validate({
      simple: { description: 'Simple agent' },
    });
    expect(messages).toHaveLength(0);
  });

  it('should reject non-string reasoningEffort', () => {
    const messages = validate({
      bad: { reasoningEffort: 123 },
    });
    expect(messages.length).toBeGreaterThan(0);
    expect(messages[0]!.message).toContain('reasoningEffort must be a string');
  });

  it('should reject invalid reasoningEffort value', () => {
    const messages = validate({
      bad: { reasoningEffort: 'ultra' },
    });
    expect(messages.length).toBeGreaterThan(0);
    expect(messages[0]!.message).toContain('invalid reasoningEffort');
  });

  it('should accept all valid reasoningEffort values', () => {
    for (const effort of ['low', 'medium', 'high']) {
      const messages = validate({ test: { reasoningEffort: effort } });
      expect(messages).toHaveLength(0);
    }
  });

  it('should reject non-string sandboxMode', () => {
    const messages = validate({
      bad: { sandboxMode: true },
    });
    expect(messages.length).toBeGreaterThan(0);
    expect(messages[0]!.message).toContain('sandboxMode must be a string');
  });

  it('should reject invalid sandboxMode value', () => {
    const messages = validate({
      bad: { sandboxMode: 'unrestricted' },
    });
    expect(messages.length).toBeGreaterThan(0);
    expect(messages[0]!.message).toContain('invalid sandboxMode');
  });

  it('should accept all valid sandboxMode values', () => {
    for (const mode of ['read-only', 'workspace-write', 'danger-full-access']) {
      const messages = validate({ test: { sandboxMode: mode } });
      expect(messages).toHaveLength(0);
    }
  });

  it('should reject non-array nicknameCandidates', () => {
    const messages = validate({
      bad: { nicknameCandidates: 'reviewer' },
    });
    expect(messages.length).toBeGreaterThan(0);
    expect(messages[0]!.message).toContain('must be an array');
  });

  it('should reject empty nicknameCandidates', () => {
    const messages = validate({
      bad: { nicknameCandidates: [] },
    });
    expect(messages.length).toBeGreaterThan(0);
    expect(messages[0]!.message).toContain('must not be empty');
  });

  it('should reject non-string in nicknameCandidates', () => {
    const messages = validate({
      bad: { nicknameCandidates: ['valid', 123] },
    });
    expect(messages.length).toBeGreaterThan(0);
    expect(messages[0]!.message).toContain('must contain only strings');
  });

  it('should reject duplicate nicknameCandidates', () => {
    const messages = validate({
      bad: { nicknameCandidates: ['dup', 'dup'] },
    });
    expect(messages.length).toBeGreaterThan(0);
    expect(messages[0]!.message).toContain('duplicate');
  });

  it('should reject modelReasoningEffort', () => {
    const messages = validate({
      bad: { modelReasoningEffort: 'high' },
    });
    expect(messages.length).toBeGreaterThan(0);
    expect(messages[0]!.message).toContain('modelReasoningEffort');
  });

  it('should reject developerInstructions', () => {
    const messages = validate({
      bad: { developerInstructions: 'some text' },
    });
    expect(messages.length).toBeGreaterThan(0);
    expect(messages[0]!.message).toContain('developerInstructions');
  });

  it('should reject generic mode', () => {
    const messages = validate({
      bad: { mode: 'autonomous' },
    });
    expect(messages.length).toBeGreaterThan(0);
    expect(messages[0]!.message).toContain('generic agent mode');
  });

  it('should skip non-object agent value', () => {
    const messages = validate({
      bad: 'not-an-object' as unknown as Record<string, Value>,
    });
    expect(messages).toHaveLength(0);
  });

  it('should return empty for non-ObjectContent block', () => {
    const ast: Program = {
      type: 'Program',
      blocks: [
        {
          type: 'Block',
          name: 'agents',
          content: { type: 'TextContent', value: 'text', loc },
          loc,
        },
      ],
      uses: [],
      extends: [],
      loc,
    };
    const messages: ValidationMessage[] = [];
    const ctx: RuleContext = {
      ast,
      config: { strict: false } as unknown as RuleContext['config'],
      report: (msg) =>
        messages.push({
          ...msg,
          ruleId: 'PS033',
          ruleName: 'valid-agent-config',
          severity: msg.severity ?? 'warning',
          location: msg.location ?? loc,
        } as ValidationMessage),
    };
    validAgentConfig.validate(ctx);
    expect(messages).toHaveLength(0);
  });

  it('should return empty when no agents block', () => {
    const ast: Program = {
      type: 'Program',
      blocks: [],
      uses: [],
      extends: [],
      loc,
    };
    const messages: ValidationMessage[] = [];
    const ctx: RuleContext = {
      ast,
      config: { strict: false } as unknown as RuleContext['config'],
      report: (msg) =>
        messages.push({
          ...msg,
          ruleId: 'PS033',
          ruleName: 'valid-agent-config',
          severity: msg.severity ?? 'warning',
          location: msg.location ?? loc,
        } as ValidationMessage),
    };
    validAgentConfig.validate(ctx);
    expect(messages).toHaveLength(0);
  });
});
