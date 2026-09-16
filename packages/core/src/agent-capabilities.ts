/**
 * Machine-readable `@agents` field capability matrix.
 *
 * One authoritative source describing which canonical agent fields every
 * native agent target emits, transforms, or cannot represent. Formatters,
 * docs, and diagnostics read this matrix so authored data is never dropped
 * silently: a field that a target cannot represent produces a compatibility
 * diagnostic instead of an undocumented loss.
 */

import type { KnownTarget } from './types/config.js';
import { TARGET_CAPABILITIES } from './target-catalog.js';

/**
 * Canonical, portable `@agents` fields understood by the toolchain.
 */
export const CANONICAL_AGENT_FIELDS = [
  'description',
  'content',
  'tools',
  'model',
  'reasoningEffort',
  'specModel',
  'specReasoningEffort',
  'disallowedTools',
  'permissionMode',
  'skills',
  'mcpServers',
  'sandboxMode',
  'nicknameCandidates',
  'handoffs',
  'maxTurns',
  'memory',
  'background',
  'isolation',
] as const;

export type CanonicalAgentField = (typeof CANONICAL_AGENT_FIELDS)[number];

/**
 * How a target handles a canonical agent field:
 * - `emitted`: written to the native agent file under the same name
 * - `transformed`: written under a target-native name or representation
 * - `not-supported`: the native agent format cannot represent it
 */
export type AgentFieldStatus = 'emitted' | 'transformed' | 'not-supported';

interface AgentFieldStatusGroups {
  readonly emitted?: readonly KnownTarget[];
  readonly transformed?: readonly KnownTarget[];
}

// Targets whose native agent files exist (catalog `hasAgents` targets).
// Grok delegates agent emission to the Claude formatter and therefore
// shares Claude's field contract.
const ALL_NATIVE_AGENT_TARGETS: readonly KnownTarget[] = [
  'github',
  'claude',
  'cursor',
  'factory',
  'codex',
  'opencode',
  'augment',
  'amp',
  'grok',
];

// Claude and its Grok delegation share one field contract.
const CLAUDE_CONTRACT_TARGETS: readonly KnownTarget[] = ['claude', 'grok'];

// OpenCode, Augment, and Amp share the Markdown agent contract:
// description plus content, with an automatic `mode: subagent` marker.
const MARKDOWN_CONTRACT_TARGETS: readonly KnownTarget[] = ['opencode', 'augment', 'amp'];

/**
 * Field-level status groups. Mirrors the FEATURE_STATUS_GROUPS convention so
 * the matrix stays a flat, shape-diverse record instead of per-target clones.
 */
const AGENT_FIELD_STATUS_GROUPS: Readonly<Record<CanonicalAgentField, AgentFieldStatusGroups>> = {
  description: { emitted: ALL_NATIVE_AGENT_TARGETS },
  content: {
    emitted: [...MARKDOWN_CONTRACT_TARGETS, 'github', 'claude', 'cursor', 'factory', 'grok'],
    transformed: ['codex'],
  },
  tools: { emitted: [...CLAUDE_CONTRACT_TARGETS, 'factory'], transformed: ['github'] },
  model: {
    emitted: [...CLAUDE_CONTRACT_TARGETS, 'cursor', 'factory', 'codex'],
    transformed: ['github'],
  },
  reasoningEffort: { emitted: ['factory'], transformed: ['codex'] },
  specModel: { emitted: ['factory'], transformed: ['github'] },
  specReasoningEffort: { emitted: ['factory'] },
  disallowedTools: { emitted: CLAUDE_CONTRACT_TARGETS },
  permissionMode: { emitted: CLAUDE_CONTRACT_TARGETS },
  skills: { emitted: CLAUDE_CONTRACT_TARGETS, transformed: ['codex'] },
  mcpServers: {
    emitted: [...CLAUDE_CONTRACT_TARGETS, 'cursor', 'factory'],
    transformed: ['github', 'codex'],
  },
  sandboxMode: { transformed: ['codex'] },
  nicknameCandidates: { transformed: ['codex'] },
  handoffs: { emitted: ['github'] },
  maxTurns: { emitted: CLAUDE_CONTRACT_TARGETS },
  memory: { emitted: CLAUDE_CONTRACT_TARGETS },
  background: { emitted: CLAUDE_CONTRACT_TARGETS },
  isolation: { emitted: CLAUDE_CONTRACT_TARGETS },
};

/**
 * Return the capability status of one canonical agent field on a target.
 *
 * Targets without native agent output report `not-supported` for every field.
 */
export function getAgentFieldStatus(
  target: KnownTarget,
  field: CanonicalAgentField
): AgentFieldStatus {
  const groups = AGENT_FIELD_STATUS_GROUPS[field];
  if (groups.emitted?.includes(target)) return 'emitted';
  if (groups.transformed?.includes(target)) return 'transformed';
  return 'not-supported';
}

/**
 * Return every canonical field status for one target.
 *
 * Targets without native agent output still report a full `not-supported`
 * record so consumers can render complete matrices.
 */
export function getAgentFieldSupport(
  target: KnownTarget
): Readonly<Record<CanonicalAgentField, AgentFieldStatus>> {
  return Object.fromEntries(
    CANONICAL_AGENT_FIELDS.map((field) => [field, getAgentFieldStatus(target, field)])
  ) as Readonly<Record<CanonicalAgentField, AgentFieldStatus>>;
}

/**
 * Targets that support one canonical field, grouped by status.
 */
export interface AgentFieldTargetSupport {
  readonly emitted: readonly KnownTarget[];
  readonly transformed: readonly KnownTarget[];
}

/**
 * List native targets that can represent one canonical agent field.
 */
export function listAgentFieldSupportTargets(field: CanonicalAgentField): AgentFieldTargetSupport {
  const groups = AGENT_FIELD_STATUS_GROUPS[field];
  return { emitted: groups.emitted ?? [], transformed: groups.transformed ?? [] };
}

/**
 * List canonical fields a target cannot represent.
 *
 * Non-canonical authored fields are always unsupported; callers detect them
 * by checking membership in {@link CANONICAL_AGENT_FIELDS} first.
 */
export function listUnsupportedAgentFields(
  target: KnownTarget,
  fields: readonly string[]
): CanonicalAgentField[] {
  return fields.filter(
    (field): field is CanonicalAgentField =>
      CANONICAL_AGENT_FIELDS.includes(field as CanonicalAgentField) &&
      getAgentFieldStatus(target, field as CanonicalAgentField) === 'not-supported'
  );
}

/**
 * Targets with a native `@agents` output contract, derived from the catalog.
 */
export function listNativeAgentTargets(): KnownTarget[] {
  return (Object.keys(TARGET_CAPABILITIES) as KnownTarget[]).filter((target) =>
    TARGET_CAPABILITIES[target].resources.some((resource) => resource.kind === 'agents')
  );
}

/**
 * Consistency issues in the agent field matrix.
 *
 * Every catalog target with an `agents` resource must have at least one
 * emitted field, and every matrix status group must only name targets that
 * actually have native agent output.
 */
export function validateAgentFieldMatrix(): string[] {
  const issues: string[] = [];
  const nativeTargets = listNativeAgentTargets();
  const nativeSet = new Set<string>(nativeTargets);

  if (nativeTargets.length !== ALL_NATIVE_AGENT_TARGETS.length) {
    issues.push(
      `native agent target count is ${nativeTargets.length}, matrix declares ${ALL_NATIVE_AGENT_TARGETS.length}`
    );
  }
  for (const target of ALL_NATIVE_AGENT_TARGETS) {
    if (!nativeSet.has(target)) {
      issues.push(`matrix lists "${target}" but the catalog has no agents resource for it`);
    }
  }

  for (const target of nativeTargets) {
    const support = getAgentFieldSupport(target);
    const emitted = CANONICAL_AGENT_FIELDS.filter((field) => support[field] === 'emitted');
    if (emitted.length === 0) {
      issues.push(`native agent target "${target}" emits no canonical fields`);
    }
    if (support['description'] !== 'emitted' || support['content'] === 'not-supported') {
      issues.push(`native agent target "${target}" must at least emit description and content`);
    }
  }

  return issues;
}
