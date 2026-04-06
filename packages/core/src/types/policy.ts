/**
 * Severity for policy violations.
 */
export type PolicySeverity = 'error' | 'warning';

/**
 * Supported policy kinds.
 */
export type PolicyKind = 'layer-boundary' | 'property-protection' | 'registry-allowlist';

/**
 * Base policy definition shared by all kinds.
 */
export interface BasePolicyDefinition {
  /** Unique policy name within the config */
  name: string;
  /** Human-readable description */
  description?: string;
  /** Policy kind discriminator */
  kind: PolicyKind;
  /** Violation severity */
  severity: PolicySeverity;
}

/**
 * Layer-boundary policy: controls which layers can extend which.
 */
export interface LayerBoundaryPolicy extends BasePolicyDefinition {
  kind: 'layer-boundary';
  /** Ordered list of layers from base to leaf */
  layers: string[];
  /** Maximum allowed distance between source and target layers (default: 1) */
  maxDistance?: number;
}

/**
 * Property-protection policy: prevents overriding specific properties.
 */
export interface PropertyProtectionPolicy extends BasePolicyDefinition {
  kind: 'property-protection';
  /** Properties that cannot be overridden */
  properties: string[];
  /** Glob pattern for target skills (e.g., '@core/*'). If omitted, applies to all. */
  targetPattern?: string;
}

/**
 * Registry-allowlist policy: restricts which registries can provide extensions.
 */
export interface RegistryAllowlistPolicy extends BasePolicyDefinition {
  kind: 'registry-allowlist';
  /** List of allowed registry prefixes */
  allowed: string[];
}

/**
 * Union of all policy definition types.
 */
export type PolicyDefinition =
  | LayerBoundaryPolicy
  | PropertyProtectionPolicy
  | RegistryAllowlistPolicy;

/**
 * A single policy violation.
 */
export interface PolicyViolation {
  /** Name of the violated policy */
  policyName: string;
  /** Policy kind */
  kind: PolicyKind;
  /** Severity of the violation */
  severity: PolicySeverity;
  /** Human-readable violation message */
  message: string;
  /** Suggested remediation */
  suggestion?: string;
  /** Source file/skill where the violation occurred */
  source?: string;
}
