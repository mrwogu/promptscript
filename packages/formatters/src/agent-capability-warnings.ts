import {
  CANONICAL_AGENT_FIELDS,
  getAgentFieldStatus,
  isKnownTarget,
  listAgentFieldSupportTargets,
  TARGET_CAPABILITIES,
  type CanonicalAgentField,
  type KnownTarget,
  type Program,
  type SourceLocation,
  type TargetResourceCapability,
  type Value,
} from '@promptscript/core';
import type { FormatterOutput, FormatterWarning } from './types.js';

/**
 * Stable diagnostic code for `@agents` compatibility warnings.
 *
 * PS4002 is the hook compatibility code; agent field loss gets its own code
 * so CI can tell the two surfaces apart.
 */
const AGENT_COMPATIBILITY_CODE = 'PS4003';

export interface AgentCapabilityWarningOptions {
  /**
   * Suppress the block-level omission warning when the target already
   * reports the `@agents` block through its unsupported-block diagnostics.
   */
  readonly blockWarningHandled?: boolean;
}

interface AgentBlockEntry {
  readonly name: string;
  readonly fields: Readonly<Record<string, Value>>;
}

function collectAgentEntries(ast: Program): {
  readonly location: SourceLocation;
  readonly entries: readonly AgentBlockEntry[];
} | null {
  const agentsBlock = ast.blocks.find((block) => block.name === 'agents');
  if (!agentsBlock) return null;

  const entries: AgentBlockEntry[] = [];
  if (agentsBlock.content.type === 'ObjectContent' || agentsBlock.content.type === 'MixedContent') {
    for (const [name, value] of Object.entries(agentsBlock.content.properties)) {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        // Skip resolver-injected internals such as __outputDir.
        const fields = Object.fromEntries(
          Object.entries(value as Record<string, Value>).filter(([key]) => !key.startsWith('__'))
        );
        entries.push({ name, fields });
      }
    }
  }
  return { location: agentsBlock.loc, entries };
}

function describeFieldSupport(field: CanonicalAgentField): string {
  const support = listAgentFieldSupportTargets(field);
  const parts: string[] = [];
  if (support.emitted.length > 0) {
    parts.push(`emitted by ${support.emitted.join(', ')}`);
  }
  if (support.transformed.length > 0) {
    parts.push(`transformed by ${support.transformed.join(', ')}`);
  }
  return parts.length > 0 ? `Field support: ${parts.join('; ')}.` : '';
}

/**
 * Block-level omission warning for a target without native agent output, or
 * for a version that does not emit agent files.
 */
function describeBlockOmission(
  agentsResource: TargetResourceCapability | undefined,
  target: string,
  version: string,
  location: SourceLocation,
  options: AgentCapabilityWarningOptions | undefined
): FormatterWarning[] {
  if (!agentsResource) {
    if (options?.blockWarningHandled) return [];
    return [
      {
        code: AGENT_COMPATIBILITY_CODE,
        ruleName: 'agent-compatibility',
        message: `Target "${target}" has no native agent output and will omit @agents.`,
        suggestion:
          'Compile a target with agent support or move agent guidance into instruction blocks.',
        location,
      },
    ];
  }

  return [
    {
      code: AGENT_COMPATIBILITY_CODE,
      ruleName: 'agent-compatibility',
      message: `Target "${target}" version "${version}" cannot emit @agents and will omit it.`,
      suggestion: `Use a version that emits agents: ${agentsResource.versions.join(', ')}.`,
      location,
    },
  ];
}

/**
 * Field-loss warning for one authored field, or undefined when the target
 * can represent it.
 */
function describeFieldLoss(
  agentName: string,
  field: string,
  target: KnownTarget,
  location: SourceLocation
): FormatterWarning | undefined {
  // description and content are portable on every native target.
  if (field === 'description' || field === 'content') return undefined;

  const isCanonical = CANONICAL_AGENT_FIELDS.includes(field as CanonicalAgentField);
  const status = isCanonical
    ? getAgentFieldStatus(target, field as CanonicalAgentField)
    : 'not-supported';
  if (status !== 'not-supported') return undefined;

  return {
    code: AGENT_COMPATIBILITY_CODE,
    ruleName: 'agent-compatibility',
    message: `Agent "${agentName}": field "${field}" is not supported by target "${target}" and will be omitted.`,
    suggestion: isCanonical
      ? describeFieldSupport(field as CanonicalAgentField)
      : 'Not a canonical @agents field; remove it or model it through a supported block.',
    location,
  };
}

function collectEntryFieldWarnings(
  entry: AgentBlockEntry,
  target: KnownTarget,
  location: SourceLocation
): FormatterWarning[] {
  const warnings: FormatterWarning[] = [];
  for (const field of Object.keys(entry.fields)) {
    const warning = describeFieldLoss(entry.name, field, target, location);
    if (warning) warnings.push(warning);
  }
  return warnings;
}

/**
 * Report `@agents` data a target cannot represent.
 *
 * A target without native agent output, or a version that does not emit
 * agent files, reports the whole block. Native targets report every
 * authored field the target drops, canonical or not, so no loss stays
 * silent.
 */
export function getAgentCapabilityWarnings(
  ast: Program,
  target: string,
  version: string,
  options?: AgentCapabilityWarningOptions
): FormatterWarning[] {
  const agentsBlock = collectAgentEntries(ast);
  if (!agentsBlock || !isKnownTarget(target)) return [];

  const agentsResource = TARGET_CAPABILITIES[target].resources.find(
    (resource) => resource.kind === 'agents'
  );
  // Undefined resource (no native agents) and a version outside the
  // resource's emission list both report the whole block.
  if (!agentsResource?.versions.includes(version)) {
    return describeBlockOmission(agentsResource, target, version, agentsBlock.location, options);
  }

  return agentsBlock.entries.flatMap((entry) =>
    collectEntryFieldWarnings(entry, target, agentsBlock.location)
  );
}

/**
 * Append agent compatibility warnings to a formatter output.
 */
export function appendAgentCapabilityWarnings(
  output: FormatterOutput,
  ast: Program,
  target: string,
  version: string,
  options?: AgentCapabilityWarningOptions
): FormatterOutput {
  const warnings = getAgentCapabilityWarnings(ast, target, version, options);
  if (warnings.length === 0) return output;
  return {
    ...output,
    warnings: [...(output.warnings ?? []), ...warnings],
  };
}
