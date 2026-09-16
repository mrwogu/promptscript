import { describe, expect, it } from 'vitest';
import {
  CANONICAL_AGENT_FIELDS,
  getAgentFieldStatus,
  getAgentFieldSupport,
  listNativeAgentTargets,
  listUnsupportedAgentFields,
  validateAgentFieldMatrix,
} from '../agent-capabilities.js';
import { KNOWN_TARGETS, type KnownTarget } from '../types/config.js';

describe('agent field capability matrix', () => {
  it('covers every canonical field for every native agent target', () => {
    for (const target of listNativeAgentTargets()) {
      const support = getAgentFieldSupport(target);
      for (const field of CANONICAL_AGENT_FIELDS) {
        expect(support[field], `${target}.${field}`).toBeDefined();
      }
    }
  });

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

  it('reports not-supported for targets without native agent output', () => {
    const support = getAgentFieldSupport('windsurf' as KnownTarget);
    for (const field of CANONICAL_AGENT_FIELDS) {
      expect(support[field]).toBe('not-supported');
    }
  });

  it('describes the Claude contract', () => {
    const support = getAgentFieldSupport('claude');
    expect(support['description']).toBe('emitted');
    expect(support['content']).toBe('emitted');
    expect(support['tools']).toBe('emitted');
    expect(support['disallowedTools']).toBe('emitted');
    expect(support['permissionMode']).toBe('emitted');
    expect(support['skills']).toBe('emitted');
    expect(support['maxTurns']).toBe('emitted');
    expect(support['memory']).toBe('emitted');
    expect(support['mcpServers']).toBe('emitted');
    expect(support['background']).toBe('emitted');
    expect(support['isolation']).toBe('emitted');
    expect(support['reasoningEffort']).toBe('not-supported');
    expect(support['sandboxMode']).toBe('not-supported');
    expect(support['nicknameCandidates']).toBe('not-supported');
    expect(support['handoffs']).toBe('not-supported');
  });

  it('describes the GitHub transformed contract', () => {
    const support = getAgentFieldSupport('github');
    expect(support['tools']).toBe('transformed');
    expect(support['model']).toBe('transformed');
    expect(support['specModel']).toBe('transformed');
    expect(support['handoffs']).toBe('emitted');
    expect(support['permissionMode']).toBe('not-supported');
    expect(support['disallowedTools']).toBe('not-supported');
  });

  it('describes the Cursor contract without tools', () => {
    const support = getAgentFieldSupport('cursor');
    expect(support['description']).toBe('emitted');
    expect(support['content']).toBe('emitted');
    expect(support['model']).toBe('emitted');
    expect(support['mcpServers']).toBe('emitted');
    expect(support['tools']).toBe('not-supported');
    expect(support['permissionMode']).toBe('not-supported');
  });

  it('describes the Factory contract', () => {
    const support = getAgentFieldSupport('factory');
    expect(support['reasoningEffort']).toBe('emitted');
    expect(support['specModel']).toBe('emitted');
    expect(support['specReasoningEffort']).toBe('emitted');
    expect(support['tools']).toBe('emitted');
    expect(support['sandboxMode']).toBe('not-supported');
  });

  it('describes the Codex transformed contract', () => {
    const support = getAgentFieldSupport('codex');
    expect(support['content']).toBe('transformed');
    expect(support['reasoningEffort']).toBe('transformed');
    expect(support['sandboxMode']).toBe('transformed');
    expect(support['nicknameCandidates']).toBe('transformed');
    expect(support['skills']).toBe('transformed');
    expect(support['permissionMode']).toBe('not-supported');
  });

  it('describes the shared Markdown agent contract', () => {
    for (const target of ['opencode', 'augment', 'amp'] as const) {
      const support = getAgentFieldSupport(target);
      expect(support['description']).toBe('emitted');
      expect(support['content']).toBe('emitted');
      expect(support['model']).toBe('not-supported');
      expect(support['tools']).toBe('not-supported');
      expect(support['permissionMode']).toBe('not-supported');
    }
  });

  it('shares the Claude contract with Grok', () => {
    for (const field of CANONICAL_AGENT_FIELDS) {
      expect(getAgentFieldStatus('grok', field)).toBe(getAgentFieldStatus('claude', field));
    }
  });

  it('lists unsupported canonical fields for a target', () => {
    const unsupported = listUnsupportedAgentFields('cursor', [
      'description',
      'content',
      'tools',
      'permissionMode',
      'sandboxMode',
    ]);
    expect(unsupported).toEqual(['tools', 'permissionMode', 'sandboxMode']);
  });

  it('ignores non-canonical fields when listing unsupported fields', () => {
    expect(listUnsupportedAgentFields('claude', ['hooks', 'customField'])).toEqual([]);
  });

  it('passes matrix consistency validation', () => {
    expect(validateAgentFieldMatrix()).toEqual([]);
  });

  it('keeps every native agent target inside the matrix groups', () => {
    // Every native target must emit description so the matrix describes it.
    for (const target of listNativeAgentTargets()) {
      expect(getAgentFieldStatus(target, 'description')).toBe('emitted');
    }
    void KNOWN_TARGETS;
  });
});
