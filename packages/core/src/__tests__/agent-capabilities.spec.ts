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
  type AgentFieldStatusGroups,
  type CanonicalAgentField,
} from '../agent-capabilities.js';
import type { KnownTarget } from '../types/config.js';

/**
 * Build a matrix fixture where one target emits every field.
 *
 * The record is mutable so a test can drop single fields before validating.
 */
function matrixWithEmitted(
  targets: readonly KnownTarget[]
): Record<CanonicalAgentField, AgentFieldStatusGroups> {
  const groups = {} as Record<CanonicalAgentField, AgentFieldStatusGroups>;
  for (const field of CANONICAL_AGENT_FIELDS) {
    groups[field] = { emitted: [...targets] };
  }
  return groups;
}

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
    // One call exercising every path: canonical unsupported, canonical
    // supported, and non-canonical fields together.
    expect(listUnsupportedAgentFields('cursor', ['tools', 'model', 'bogus'])).toEqual(['tools']);
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

    // handoffs has no transformed group, exercising the empty fallback.
    const handoffs = listAgentFieldSupportTargets('handoffs');
    expect(handoffs.emitted).toEqual(['github']);
    expect(handoffs.transformed).toEqual([]);
  });

  it('passes matrix consistency validation', () => {
    expect(validateAgentFieldMatrix()).toEqual([]);
  });

  it('reports every inconsistency class from a broken matrix', () => {
    // claude emits everything; the second "native" target emits nothing and
    // is unknown to the catalog, so each validation branch fires once.
    const issues = validateAgentFieldMatrix(matrixWithEmitted(['claude']), ['claude', 'windsurf']);

    expect(issues).toContain('native agent target count is 2, matrix declares 9');
    expect(issues).toContain('matrix lists "github" but the catalog has no agents resource for it');
    expect(issues).toContain('native agent target "windsurf" emits no canonical fields');
    expect(issues).toContain(
      'native agent target "windsurf" must at least emit description and content'
    );
    // claude itself stays consistent in this fixture.
    expect(issues).not.toContain('native agent target "claude" emits no canonical fields');
  });

  it('reports a matrix that emits description without content', () => {
    const groups = matrixWithEmitted(['claude']);
    groups['content'] = {};
    const issues = validateAgentFieldMatrix(groups, ['claude']);

    expect(issues).toContain(
      'native agent target "claude" must at least emit description and content'
    );
    expect(issues).not.toContain('native agent target "claude" emits no canonical fields');
  });

  it('reports status groups naming targets without native agent output', () => {
    const issues = validateAgentFieldMatrix(matrixWithEmitted(['claude', 'windsurf']), ['claude']);

    expect(issues).toContain(
      'matrix lists "windsurf" as emitted for field "description" but it has no native agent output'
    );
  });

  it('emits description on every native agent target', () => {
    for (const target of listNativeAgentTargets()) {
      expect(getAgentFieldStatus(target, 'description')).toBe('emitted');
    }
  });
});
