import { describe, expect, it } from 'vitest';
import {
  CANONICAL_AGENT_FIELDS,
  getAgentFieldStatus,
  getAgentFieldSupport,
  listAgentFieldSupportTargets,
  listNativeAgentTargets,
  listUnsupportedAgentFields,
  validateAgentFieldMatrix,
  type AgentFieldStatus,
  type CanonicalAgentField,
} from '../agent-capabilities.js';
import type { KnownTarget } from '../types/config.js';

/**
 * Assert a complete per-target contract from a readable table.
 *
 * Each table line is `<field> <status>`; every canonical field missing from
 * the table must be not-supported, so one table pins the whole contract.
 */
function expectContract(target: KnownTarget, table: string): void {
  const declared = new Map<string, AgentFieldStatus>();
  for (const line of table.split('\n')) {
    const [field, status] = line.trim().split(/\s+/);
    if (!field || !status) continue;
    declared.set(field, status as AgentFieldStatus);
  }

  const support = getAgentFieldSupport(target);
  for (const field of CANONICAL_AGENT_FIELDS) {
    expect(support[field], `${target}.${field}`).toBe(declared.get(field) ?? 'not-supported');
  }
}

describe('agent field capability matrix', () => {
  it('matches the catalog native agent target list', () => {
    expect(listNativeAgentTargets().sort()).toEqual(
      [
        'amp',
        'augment',
        'claude',
        'codex',
        'cursor',
        'factory',
        'github',
        'grok',
        'opencode',
      ].sort()
    );
  });

  it('covers every canonical field for every native agent target', () => {
    for (const target of listNativeAgentTargets()) {
      const support = getAgentFieldSupport(target);
      for (const field of CANONICAL_AGENT_FIELDS) {
        expect(support[field], `${target}.${field}`).toBeDefined();
      }
    }
  });

  it('matches the Claude contract', () => {
    expectContract(
      'claude',
      `
        description emitted
        content emitted
        tools emitted
        disallowedTools emitted
        model emitted
        permissionMode emitted
        skills emitted
        maxTurns emitted
        memory emitted
        mcpServers emitted
        background emitted
        isolation emitted
      `
    );
  });

  it('matches the GitHub contract', () => {
    expectContract(
      'github',
      `
        description emitted
        content emitted
        tools transformed
        model transformed
        specModel transformed
        handoffs emitted
        mcpServers transformed
      `
    );
  });

  it('matches the Cursor contract', () => {
    expectContract(
      'cursor',
      `
        description emitted
        content emitted
        model emitted
        mcpServers emitted
      `
    );
  });

  it('matches the Factory contract', () => {
    expectContract(
      'factory',
      `
        description emitted
        content emitted
        model emitted
        reasoningEffort emitted
        specModel emitted
        specReasoningEffort emitted
        tools emitted
        mcpServers emitted
      `
    );
  });

  it('matches the Codex contract', () => {
    expectContract(
      'codex',
      `
        description emitted
        content transformed
        model emitted
        reasoningEffort transformed
        sandboxMode transformed
        nicknameCandidates transformed
        skills transformed
        mcpServers transformed
      `
    );
  });

  it('matches the shared Markdown agent contract', () => {
    const table = `
      description emitted
      content emitted
    `;
    for (const target of ['opencode', 'augment', 'amp'] as const) {
      expectContract(target, table);
    }
  });

  it('shares the Claude contract with Grok', () => {
    for (const field of CANONICAL_AGENT_FIELDS) {
      expect(getAgentFieldStatus('grok', field)).toBe(getAgentFieldStatus('claude', field));
    }
  });

  it('reports not-supported for targets without native agent output', () => {
    const support = getAgentFieldSupport('windsurf');
    for (const field of CANONICAL_AGENT_FIELDS) {
      expect(support[field]).toBe('not-supported');
    }
  });

  it('lists unsupported canonical fields for a target', () => {
    expect(
      listUnsupportedAgentFields('cursor', [
        'description',
        'content',
        'tools',
        'permissionMode',
        'sandboxMode',
      ])
    ).toEqual(['tools', 'permissionMode', 'sandboxMode']);
  });

  it('ignores non-canonical fields when listing unsupported fields', () => {
    expect(listUnsupportedAgentFields('claude', ['hooks', 'customField'])).toEqual([]);
  });

  it('lists the targets supporting one field', () => {
    const sandbox = listAgentFieldSupportTargets('sandboxMode');
    expect(sandbox.emitted).toEqual([]);
    expect(sandbox.transformed).toEqual(['codex']);

    const tools = listAgentFieldSupportTargets('tools');
    expect(tools.emitted).toEqual(['claude', 'grok', 'factory']);
    expect(tools.transformed).toEqual(['github']);
  });

  it('passes matrix consistency validation', () => {
    expect(validateAgentFieldMatrix()).toEqual([]);
  });

  it('emits description on every native agent target', () => {
    for (const target of listNativeAgentTargets()) {
      expect(getAgentFieldStatus(target, 'description' as CanonicalAgentField)).toBe('emitted');
    }
  });
});
