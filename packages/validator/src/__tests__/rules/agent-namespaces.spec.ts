import { describe, expect, it } from 'vitest';
import type {
  AgentProvenance,
  Block,
  ObjectContent,
  Program,
  SourceLocation,
  Value,
} from '@promptscript/core';
import { agentNamespaces } from '../../rules/agent-namespaces.js';
import type { RuleContext, ValidationMessage } from '../../types.js';

const loc: SourceLocation = { file: 'project.prs', line: 1, column: 1, offset: 0 };

function validate(
  properties: Record<string, Value>,
  agentProvenance?: AgentProvenance[]
): ValidationMessage[] {
  const block: Block = {
    type: 'Block',
    name: 'agents',
    content: {
      type: 'ObjectContent',
      properties,
      loc,
    } satisfies ObjectContent,
    loc,
  };
  const ast: Program = {
    type: 'Program',
    blocks: [block],
    uses: [],
    extends: [],
    loc,
    ...(agentProvenance ? { agentProvenance } : {}),
  };
  const messages: ValidationMessage[] = [];
  const context: RuleContext = {
    ast,
    config: { strict: false } as unknown as RuleContext['config'],
    report: (message) => {
      messages.push({
        ...message,
        ruleId: 'PS039',
        ruleName: 'agent-namespaces',
        severity: message.severity ?? 'error',
        location: message.location ?? loc,
      } as ValidationMessage);
    },
  };

  agentNamespaces.validate(context);
  return messages;
}

describe('PS039: agent-namespaces', () => {
  it('accepts a qualified name with matching provenance', () => {
    const messages = validate({ 'team.reviewer': { description: 'Review code' } }, [
      {
        name: 'team.reviewer',
        source: 'team.prs',
        namespace: 'team',
        action: 'qualified',
      },
    ]);

    expect(messages).toHaveLength(0);
  });

  it('reports invalid namespace segments', () => {
    const messages = validate({ 'team.reviewer!': { description: 'Review code' } });

    expect(messages).toHaveLength(1);
    expect(messages[0]?.message).toContain('invalid namespace');
  });

  it('reports provenance namespace mismatches', () => {
    const messages = validate({ 'team.reviewer': { description: 'Review code' } }, [
      {
        name: 'team.reviewer',
        source: 'team.prs',
        namespace: 'other',
        action: 'qualified',
      },
    ]);

    expect(messages).toHaveLength(1);
    expect(messages[0]?.message).toContain('recorded namespace');
  });
});
