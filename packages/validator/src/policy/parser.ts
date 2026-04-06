import type {
  PolicyDefinition,
  PolicyKind,
  PolicySeverity,
  LayerBoundaryPolicy,
  PropertyProtectionPolicy,
  RegistryAllowlistPolicy,
} from '@promptscript/core';
import type { ParsedPolicies } from './types.js';

const VALID_KINDS: readonly PolicyKind[] = [
  'layer-boundary',
  'property-protection',
  'registry-allowlist',
];

const VALID_SEVERITIES: readonly PolicySeverity[] = ['error', 'warning'];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function isPolicyKind(value: unknown): value is PolicyKind {
  return typeof value === 'string' && (VALID_KINDS as readonly string[]).includes(value);
}

function isPolicySeverity(value: unknown): value is PolicySeverity {
  return typeof value === 'string' && (VALID_SEVERITIES as readonly string[]).includes(value);
}

function validateLayerBoundary(
  raw: Record<string, unknown>,
  name: string
): { policy: LayerBoundaryPolicy; errors: string[] } | { policy: null; errors: string[] } {
  const errors: string[] = [];

  if (!isStringArray(raw['layers']) || raw['layers'].length < 2) {
    errors.push(
      `Policy "${name}": layer-boundary requires a "layers" array with at least 2 entries`
    );
    return { policy: null, errors };
  }

  if (
    raw['maxDistance'] !== undefined &&
    (typeof raw['maxDistance'] !== 'number' || raw['maxDistance'] <= 0)
  ) {
    errors.push(`Policy "${name}": layer-boundary "maxDistance" must be a positive number`);
    return { policy: null, errors };
  }

  const policy: LayerBoundaryPolicy = {
    name,
    kind: 'layer-boundary',
    severity: raw['severity'] as PolicySeverity,
    layers: raw['layers'],
    maxDistance: typeof raw['maxDistance'] === 'number' ? raw['maxDistance'] : 1,
  };

  if (typeof raw['description'] === 'string') {
    policy.description = raw['description'];
  }

  return { policy, errors };
}

function validatePropertyProtection(
  raw: Record<string, unknown>,
  name: string
): { policy: PropertyProtectionPolicy; errors: string[] } | { policy: null; errors: string[] } {
  const errors: string[] = [];

  if (!isStringArray(raw['properties']) || raw['properties'].length === 0) {
    errors.push(
      `Policy "${name}": property-protection requires a non-empty "properties" string array`
    );
    return { policy: null, errors };
  }

  const policy: PropertyProtectionPolicy = {
    name,
    kind: 'property-protection',
    severity: raw['severity'] as PolicySeverity,
    properties: raw['properties'],
  };

  if (typeof raw['description'] === 'string') {
    policy.description = raw['description'];
  }

  if (typeof raw['targetPattern'] === 'string') {
    policy.targetPattern = raw['targetPattern'];
  }

  return { policy, errors };
}

function validateRegistryAllowlist(
  raw: Record<string, unknown>,
  name: string
): { policy: RegistryAllowlistPolicy; errors: string[] } | { policy: null; errors: string[] } {
  const errors: string[] = [];

  if (!isStringArray(raw['allowed']) || raw['allowed'].length === 0) {
    errors.push(`Policy "${name}": registry-allowlist requires a non-empty "allowed" string array`);
    return { policy: null, errors };
  }

  const policy: RegistryAllowlistPolicy = {
    name,
    kind: 'registry-allowlist',
    severity: raw['severity'] as PolicySeverity,
    allowed: raw['allowed'],
  };

  if (typeof raw['description'] === 'string') {
    policy.description = raw['description'];
  }

  return { policy, errors };
}

function parseOnePolicy(
  raw: unknown,
  index: number,
  seenNames: Set<string>
): { policy: PolicyDefinition | null; errors: string[] } {
  const errors: string[] = [];

  if (!isRecord(raw)) {
    errors.push(`Policy at index ${index}: must be an object`);
    return { policy: null, errors };
  }

  // Validate name
  if (typeof raw['name'] !== 'string' || raw['name'].trim() === '') {
    errors.push(`Policy at index ${index}: missing required "name" field`);
    return { policy: null, errors };
  }

  const name = raw['name'].trim();

  // Detect duplicate names
  if (seenNames.has(name)) {
    errors.push(`Policy "${name}": duplicate policy name`);
    return { policy: null, errors };
  }
  seenNames.add(name);

  // Validate kind
  if (!isPolicyKind(raw['kind'])) {
    errors.push(
      `Policy "${name}": unknown kind "${String(raw['kind'])}". Must be one of: ${VALID_KINDS.join(', ')}`
    );
    return { policy: null, errors };
  }

  // Validate severity
  if (!isPolicySeverity(raw['severity'])) {
    errors.push(
      `Policy "${name}": invalid severity "${String(raw['severity'])}". Must be one of: ${VALID_SEVERITIES.join(', ')}`
    );
    return { policy: null, errors };
  }

  // Kind-specific validation
  switch (raw['kind']) {
    case 'layer-boundary':
      return validateLayerBoundary(raw, name);

    case 'property-protection':
      return validatePropertyProtection(raw, name);

    case 'registry-allowlist':
      return validateRegistryAllowlist(raw, name);
  }
}

/**
 * Parse and validate policy definitions from config.
 *
 * Validates all policies and collects errors without stopping at the first
 * failure. Successfully validated policies are returned alongside any errors.
 *
 * @param input - Raw policy definitions from config, or undefined
 * @returns Parsed policies and any validation errors
 */
export function parsePolicies(input: PolicyDefinition[] | undefined): ParsedPolicies {
  if (input === undefined || input.length === 0) {
    return { policies: [], errors: [] };
  }

  const policies: PolicyDefinition[] = [];
  const errors: string[] = [];
  const seenNames = new Set<string>();

  for (let i = 0; i < input.length; i++) {
    const result = parseOnePolicy(input[i], i, seenNames);
    errors.push(...result.errors);
    if (result.policy !== null) {
      policies.push(result.policy);
    }
  }

  return { policies, errors };
}
