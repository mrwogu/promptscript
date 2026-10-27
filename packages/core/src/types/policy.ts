import type { GovernanceRoleName, ReleaseEnvironmentName } from './config.js';
import type { GovernanceMeta, PromptScalarType, RiskLevel } from './prompts.js';
import type { SourceLocation } from './source.js';

/**
 * Severity for policy violations.
 */
export type PolicySeverity = 'error' | 'warning';

/**
 * Supported policy kinds.
 */
export type PolicyKind =
  | 'layer-boundary'
  | 'property-protection'
  | 'registry-allowlist'
  | 'required-metadata'
  | 'risk-floor'
  | 'model-allowlist'
  | 'required-approvals'
  | 'required-evals'
  | 'content-rules';

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
 * Selects the prompts a policy applies to. Keys combine with AND; no `match`
 * selects every prompt.
 */
export interface PromptPolicyMatch {
  /** Policy risk is at or above this level */
  minRisk?: RiskLevel;
  /**
   * Effective domain is one of these
   * @minItems 1
   */
  domains?: string[];
  /**
   * Any effective data class is one of these
   * @minItems 1
   */
  dataClasses?: string[];
}

/**
 * Required-metadata policy: matched prompts must set governance fields.
 */
export interface RequiredMetadataPolicy extends BasePolicyDefinition {
  kind: 'required-metadata';
  /** Prompts the policy applies to */
  match?: PromptPolicyMatch;
  /**
   * Governance fields every matched prompt must have
   * @minItems 1
   * @uniqueItems true
   */
  fields: Array<keyof GovernanceMeta>;
}

/**
 * One row of a risk floor. The row matches when any of its conditions matches.
 * @minProperties 2
 */
export interface RiskFloorRow {
  /**
   * Any effective data class is one of these
   * @minItems 1
   */
  dataClasses?: string[];
  /**
   * Effective domain is one of these
   * @minItems 1
   */
  domains?: string[];
  /**
   * Any input has one of these types
   * @minItems 1
   */
  inputTypes?: PromptScalarType[];
  /** Lowest policy risk of a matching prompt */
  minimum: RiskLevel;
}

/**
 * Risk-floor policy: derives a minimum risk from data classes, domains and input
 * types. Every other policy matches on the higher of authored risk and this floor.
 */
export interface RiskFloorPolicy extends BasePolicyDefinition {
  kind: 'risk-floor';
  /**
   * Rows; the floor is the highest `minimum` of the matching rows
   * @minItems 1
   */
  floors: RiskFloorRow[];
}

/**
 * Model-allowlist policy: matched prompts must use one of the listed models.
 */
export interface ModelAllowlistPolicy extends BasePolicyDefinition {
  kind: 'model-allowlist';
  /** Prompts the policy applies to */
  match?: PromptPolicyMatch;
  /**
   * Model catalog ids or aliases
   * @minItems 1
   */
  models: string[];
}

/** Approvals one role must give. */
export interface RequiredApproval {
  /** Role from `governance.roles` */
  role: GovernanceRoleName;
  /**
   * Distinct approvers needed. Only 1 is accepted while approval records are
   * unsigned, since unsigned records cannot tell two approvers apart under one review.
   * @asType integer
   * @minimum 1
   * @maximum 1
   * @default 1
   */
  count?: number;
}

/**
 * Required-approvals policy: matched prompts need approvals before promotion.
 */
export interface RequiredApprovalsPolicy extends BasePolicyDefinition {
  kind: 'required-approvals';
  /** Prompts the policy applies to */
  match?: PromptPolicyMatch;
  /**
   * Environments from `releases.environments` the policy applies to. Absent means all.
   * @minItems 1
   */
  environments?: ReleaseEnvironmentName[];
  /**
   * Approvals per role
   * @minItems 1
   */
  approvals: RequiredApproval[];
}

/**
 * Required-evals policy: matched prompts need passing evals before promotion.
 */
export interface RequiredEvalsPolicy extends BasePolicyDefinition {
  kind: 'required-evals';
  /** Prompts the policy applies to */
  match?: PromptPolicyMatch;
  /**
   * Environments from `releases.environments` the policy applies to. Absent means all.
   * @minItems 1
   */
  environments?: ReleaseEnvironmentName[];
}

/** Content check of a content-rules policy, by rule name or id. */
export type ContentRuleCheck =
  | 'blocked-patterns'
  | 'suspicious-urls'
  | 'authority-injection'
  | 'obfuscated-content'
  | 'unicode-security'
  | 'PS005'
  | 'PS010'
  | 'PS011'
  | 'PS012'
  | 'PS014';

/**
 * Content-rules policy: runs content checks and denied phrases on matched prompts.
 */
export interface ContentRulesPolicy extends BasePolicyDefinition {
  kind: 'content-rules';
  /** Prompts the policy applies to */
  match?: PromptPolicyMatch;
  /** Validation rules to run on the prompt text */
  checks?: ContentRuleCheck[];
  /** Literal phrases the prompt text must not contain */
  deny?: string[];
  /** Blocked-pattern sources exempt for matched prompts, as exact source text */
  allow?: string[];
}

/**
 * Union of all policy definition types.
 */
export type PolicyDefinition =
  | LayerBoundaryPolicy
  | PropertyProtectionPolicy
  | RegistryAllowlistPolicy
  | RequiredMetadataPolicy
  | RiskFloorPolicy
  | ModelAllowlistPolicy
  | RequiredApprovalsPolicy
  | RequiredEvalsPolicy
  | ContentRulesPolicy;

/**
 * A prompt as prompt policies see it, built from source or from a release bundle.
 */
export interface PolicySubject {
  /** Prompt id, `<@meta.id>/<key>` */
  id: string;
  /** Effective governance */
  governance: GovernanceMeta;
  /** Model reference and the catalog profile it resolved to */
  model?: { ref: string; profile?: string };
  /** Inputs by name */
  inputs: Record<string, { type: PromptScalarType; options?: string[] }>;
  /** Message texts the content checks scan */
  texts: Array<{ role: 'system' | 'user'; content: string }>;
  /** The entry, or the bundle file */
  loc?: SourceLocation;
}

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
