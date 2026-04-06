import type {
  PolicyDefinition,
  PolicyViolation,
  LayerBoundaryPolicy,
  PropertyProtectionPolicy,
  RegistryAllowlistPolicy,
  Program,
  ObjectContent,
} from '@promptscript/core';

// ============================================================
// Internal type guards
// ============================================================

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

// ============================================================
// Layer trace types
// ============================================================

interface LayerTraceEntry {
  property: string;
  source: string;
  strategy: string;
  action: string;
}

interface ComposedFromEntry {
  source: string;
  phase: string;
}

function isLayerTraceEntry(value: unknown): value is LayerTraceEntry {
  if (!isRecord(value)) return false;
  return (
    typeof value['property'] === 'string' &&
    typeof value['source'] === 'string' &&
    typeof value['strategy'] === 'string' &&
    typeof value['action'] === 'string'
  );
}

function isComposedFromEntry(value: unknown): value is ComposedFromEntry {
  if (!isRecord(value)) return false;
  return typeof value['source'] === 'string' && typeof value['phase'] === 'string';
}

function getLayerTrace(skill: Record<string, unknown>): LayerTraceEntry[] {
  const raw = skill['__layerTrace'];
  if (!Array.isArray(raw)) return [];
  return raw.filter(isLayerTraceEntry);
}

function getComposedFrom(skill: Record<string, unknown>): ComposedFromEntry[] {
  const raw = skill['__composedFrom'];
  if (!Array.isArray(raw)) return [];
  return raw.filter(isComposedFromEntry);
}

// ============================================================
// Helpers
// ============================================================

/**
 * Extracts the registry prefix (e.g. `@core`) from a source path like
 * `@core/skills.prs`. Returns null if the source does not start with `@`.
 */
export function extractRegistry(source: string): string | null {
  if (!source.startsWith('@')) return null;
  const slash = source.indexOf('/');
  if (slash === -1) return source;
  return source.slice(0, slash);
}

/**
 * Checks whether a skill's composedFrom entries match the given target pattern.
 * The pattern format is `@registry/*` — only the registry prefix is matched.
 */
function matchesTargetPattern(composedFrom: ComposedFromEntry[], targetPattern: string): boolean {
  const registry = extractRegistry(targetPattern);
  if (registry === null) return false;
  return composedFrom.some((entry) => entry.source.startsWith(registry + '/'));
}

// ============================================================
// Per-policy evaluators
// ============================================================

function evaluateLayerBoundary(
  policy: LayerBoundaryPolicy,
  skillName: string,
  skill: Record<string, unknown>,
  baseSource: string | null
): PolicyViolation[] {
  const violations: PolicyViolation[] = [];
  const trace = getLayerTrace(skill);
  if (trace.length === 0) return violations;

  const baseRegistry = baseSource !== null ? extractRegistry(baseSource) : null;

  const maxDistance = policy.maxDistance ?? 1;

  for (const entry of trace) {
    const sourceRegistry = extractRegistry(entry.source);
    if (sourceRegistry === null) continue;

    const targetRegistry = baseRegistry ?? sourceRegistry;

    const sourceIdx = policy.layers.indexOf(sourceRegistry);
    const targetIdx = policy.layers.indexOf(targetRegistry);

    if (sourceIdx === -1 || targetIdx === -1) continue;

    const distance = Math.abs(sourceIdx - targetIdx);
    if (distance > maxDistance) {
      violations.push({
        policyName: policy.name,
        kind: policy.kind,
        severity: policy.severity,
        message: `Skill '${skillName}' property '${entry.property}' was overridden by '${sourceRegistry}' which is ${distance} layer(s) away from '${targetRegistry}' (max allowed: ${maxDistance})`,
        suggestion: `Ensure overrides come from adjacent layers. Allowed distance is ${maxDistance}.`,
        source: entry.source,
      });
    }
  }

  return violations;
}

function evaluatePropertyProtection(
  policy: PropertyProtectionPolicy,
  skillName: string,
  skill: Record<string, unknown>
): PolicyViolation[] {
  const violations: PolicyViolation[] = [];
  const trace = getLayerTrace(skill);
  if (trace.length === 0) return violations;

  // If targetPattern is set, only check skills that match it
  if (policy.targetPattern !== undefined) {
    const composedFrom = getComposedFrom(skill);
    if (!matchesTargetPattern(composedFrom, policy.targetPattern)) {
      return violations;
    }
  }

  const protectedSet = new Set(policy.properties);

  for (const entry of trace) {
    if (protectedSet.has(entry.property)) {
      violations.push({
        policyName: policy.name,
        kind: policy.kind,
        severity: policy.severity,
        message: `Skill '${skillName}' has a protected property '${entry.property}' that was overridden by '${entry.source}'`,
        suggestion: `Property '${entry.property}' is protected and must not be overridden by downstream layers.`,
        source: entry.source,
      });
    }
  }

  return violations;
}

function evaluateRegistryAllowlist(
  policy: RegistryAllowlistPolicy,
  skillName: string,
  skill: Record<string, unknown>
): PolicyViolation[] {
  const violations: PolicyViolation[] = [];
  const trace = getLayerTrace(skill);
  if (trace.length === 0) return violations;

  const allowedSet = new Set(policy.allowed);

  for (const entry of trace) {
    const sourceRegistry = extractRegistry(entry.source);
    if (sourceRegistry === null) continue;
    if (!allowedSet.has(sourceRegistry)) {
      violations.push({
        policyName: policy.name,
        kind: policy.kind,
        severity: policy.severity,
        message: `Skill '${skillName}' was modified by registry '${sourceRegistry}' which is not in the allowed list`,
        suggestion: `Only these registries may contribute overrides: ${policy.allowed.join(', ')}.`,
        source: entry.source,
      });
    }
  }

  return violations;
}

// ============================================================
// Main evaluator
// ============================================================

/**
 * Evaluate a list of policy definitions against a resolved AST.
 *
 * Finds the `@skills` block, iterates each skill, and runs every policy
 * against the relevant metadata. Returns all violations collected across
 * all skills and all policies.
 *
 * @param policies - Parsed policy definitions
 * @param ast      - Resolved program AST
 * @returns Array of policy violations (empty when compliant)
 */
export function evaluatePolicies(policies: PolicyDefinition[], ast: Program): PolicyViolation[] {
  if (policies.length === 0) return [];

  const skillsBlock = ast.blocks.find((b) => b.name === 'skills');
  if (!skillsBlock || skillsBlock.content.type !== 'ObjectContent') return [];

  const content = skillsBlock.content as ObjectContent;
  const violations: PolicyViolation[] = [];

  for (const [skillName, skillValue] of Object.entries(content.properties)) {
    if (!isRecord(skillValue)) continue;

    const skill = skillValue as Record<string, unknown>;
    const baseSource = typeof skill['__baseSource'] === 'string' ? skill['__baseSource'] : null;

    for (const policy of policies) {
      switch (policy.kind) {
        case 'layer-boundary':
          violations.push(...evaluateLayerBoundary(policy, skillName, skill, baseSource));
          break;
        case 'property-protection':
          violations.push(...evaluatePropertyProtection(policy, skillName, skill));
          break;
        case 'registry-allowlist':
          violations.push(...evaluateRegistryAllowlist(policy, skillName, skill));
          break;
      }
    }
  }

  return violations;
}
