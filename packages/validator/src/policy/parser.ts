import {
  findClosestMatch,
  getModelCatalog,
  PROMPT_SCALAR_TYPES,
  resolveModelSet,
  RISK_LEVELS,
  type ContentRuleCheck,
  type ContentRulesPolicy,
  type GovernanceMeta,
  type LayerBoundaryPolicy,
  type MaxExperimentWeightPolicy,
  type ModelAllowlistPolicy,
  type PolicyDefinition,
  type PolicyKind,
  type PolicySeverity,
  type PromptPolicyMatch,
  type PromptScalarType,
  type PropertyProtectionPolicy,
  type RegistryAllowlistPolicy,
  type RequiredApproval,
  type RequiredApprovalsPolicy,
  type RequiredEvalsPolicy,
  type RequiredMetadataPolicy,
  type RiskFloorPolicy,
  type RiskFloorRow,
  type RiskLevel,
} from '@promptscript/core';
import { CONTENT_CHECK_RULES, normalizeDenyText } from './content-rules.js';
import type { ParsedPolicies, PolicyContext } from './types.js';

const VALID_KINDS = [
  'layer-boundary',
  'property-protection',
  'registry-allowlist',
  'required-metadata',
  'risk-floor',
  'model-allowlist',
  'required-approvals',
  'required-evals',
  'content-rules',
  'max-experiment-weight',
] as const satisfies readonly PolicyKind[];

const VALID_SEVERITIES: readonly PolicySeverity[] = ['error', 'warning'];

const BASE_KEYS = ['name', 'description', 'kind', 'severity'];
const MATCH_KEYS = ['minRisk', 'domains', 'dataClasses'];
const FLOOR_KEYS = ['dataClasses', 'domains', 'inputTypes', 'minimum'];
const APPROVAL_KEYS = ['role', 'count'];
const GOVERNANCE_FIELDS: readonly (keyof GovernanceMeta)[] = [
  'risk',
  'owner',
  'domain',
  'dataClasses',
  'reviewers',
];

type Raw = Record<string, unknown>;

/** The fields every policy shares, read and checked once. */
interface PolicyBase {
  name: string;
  severity: PolicySeverity;
  description?: string;
}

/** Collects errors under one prefix, such as `Policy "x"`. */
type Errors = (message: string) => void;

function isRecord(value: unknown): value is Raw {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

// Inherited keys never count, so a crafted prototype cannot fill in a field.
function own(raw: Raw, key: string): unknown {
  return Object.hasOwn(raw, key) ? raw[key] : undefined;
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

function isRiskLevel(value: unknown): value is RiskLevel {
  return typeof value === 'string' && (RISK_LEVELS as readonly string[]).includes(value);
}

function closest(value: string, candidates: readonly string[]): string {
  const match = findClosestMatch(value, candidates);
  return match ? ` Did you mean "${match.match}"?` : ` Use one of: ${candidates.join(', ')}.`;
}

/** Report every key outside `allowed`, `__proto__` included. */
function checkKeys(raw: Raw, allowed: readonly string[], where: string, bad: Errors): void {
  for (const key of Object.keys(raw)) {
    if (!allowed.includes(key)) bad(`${where}unknown key "${key}".${closest(key, allowed)}`);
  }
}

/** An optional list of non-empty strings; a present but invalid value is an error. */
function readList(raw: Raw, key: string, where: string, bad: Errors): string[] | undefined {
  const value = own(raw, key);
  if (value === undefined) return undefined;
  if (!isStringArray(value) || value.length === 0 || value.some((item) => item.trim() === '')) {
    bad(`${where}"${key}" must be a non-empty list of non-empty strings`);
    return undefined;
  }
  return value;
}

/**
 * `governance.dataClasses`, lowercased, when the project sets it as a list of strings.
 * Own keys only, so a prototype cannot supply a vocabulary.
 */
export function dataClassVocabulary(governance: unknown): string[] | undefined {
  const value = isRecord(governance) ? own(governance, 'dataClasses') : undefined;
  return isStringArray(value) ? value.map((item) => item.toLowerCase()) : undefined;
}

// A typo in a selector or a floor would match nothing and fail open, so it is an error.
function checkDataClasses(
  values: readonly string[] | undefined,
  where: string,
  context: PolicyContext,
  bad: Errors
): void {
  const known = dataClassVocabulary(context.governance);
  if (known === undefined) return;
  for (const value of values ?? []) {
    const lower = value.toLowerCase();
    if (known.includes(lower)) continue;
    const close = findClosestMatch(lower, known);
    bad(
      `${where}data class "${value}" is not in governance.dataClasses.` +
        (close ? ` Did you mean "${close.match}"?` : ' Add it there or fix the name.')
    );
  }
}

function requireList(raw: Raw, key: string, kind: string, bad: Errors): string[] | undefined {
  const list = readList(raw, key, '', bad);
  if (list === undefined && own(raw, key) === undefined) bad(`${kind} requires a "${key}" list`);
  return list;
}

// ============================================================
// Skill kinds
// ============================================================

function validateLayerBoundary(
  raw: Raw,
  base: PolicyBase,
  bad: Errors
): LayerBoundaryPolicy | null {
  const layers = own(raw, 'layers');
  if (!isStringArray(layers) || layers.length < 2) {
    bad('layer-boundary requires a "layers" array with at least 2 entries');
    return null;
  }
  const maxDistance = own(raw, 'maxDistance');
  if (maxDistance !== undefined && (typeof maxDistance !== 'number' || maxDistance <= 0)) {
    bad('layer-boundary "maxDistance" must be a positive number');
    return null;
  }
  return {
    ...base,
    kind: 'layer-boundary',
    layers,
    maxDistance: typeof maxDistance === 'number' ? maxDistance : 1,
  };
}

function validatePropertyProtection(
  raw: Raw,
  base: PolicyBase,
  bad: Errors
): PropertyProtectionPolicy | null {
  const properties = own(raw, 'properties');
  if (!isStringArray(properties) || properties.length === 0) {
    bad('property-protection requires a non-empty "properties" string array');
    return null;
  }
  const policy: PropertyProtectionPolicy = { ...base, kind: 'property-protection', properties };
  const targetPattern = own(raw, 'targetPattern');
  if (typeof targetPattern === 'string') policy.targetPattern = targetPattern;
  return policy;
}

function validateRegistryAllowlist(
  raw: Raw,
  base: PolicyBase,
  bad: Errors
): RegistryAllowlistPolicy | null {
  const allowed = own(raw, 'allowed');
  if (!isStringArray(allowed) || allowed.length === 0) {
    bad('registry-allowlist requires a non-empty "allowed" string array');
    return null;
  }
  return { ...base, kind: 'registry-allowlist', allowed };
}

// ============================================================
// Prompt kinds
// ============================================================

function readMatch(raw: Raw, context: PolicyContext, bad: Errors): PromptPolicyMatch | undefined {
  const value = own(raw, 'match');
  if (value === undefined) return undefined;
  if (!isRecord(value)) {
    bad('"match" must be an object with minRisk, domains or dataClasses');
    return undefined;
  }
  checkKeys(value, MATCH_KEYS, 'match: ', bad);
  const match: PromptPolicyMatch = {};
  const minRisk = own(value, 'minRisk');
  if (isRiskLevel(minRisk)) match.minRisk = minRisk;
  else if (minRisk !== undefined) {
    bad(`match: "minRisk" must be one of: ${RISK_LEVELS.join(', ')}`);
  }
  const domains = readList(value, 'domains', 'match: ', bad);
  if (domains) match.domains = domains;
  const dataClasses = readList(value, 'dataClasses', 'match: ', bad);
  checkDataClasses(dataClasses, 'match: ', context, bad);
  if (dataClasses) match.dataClasses = dataClasses;
  return match;
}

/** Release environments, read from config that may come straight from YAML. */
function readEnvironments(raw: Raw, context: PolicyContext, bad: Errors): string[] | undefined {
  const environments = readList(raw, 'environments', '', bad);
  if (environments === undefined) return undefined;
  const releases: unknown = context.releases;
  const configured = isRecord(releases) ? own(releases, 'environments') : undefined;
  for (const environment of environments) {
    if (!Array.isArray(configured) || !configured.includes(environment)) {
      bad(
        `environment "${environment}" is not in releases.environments. Add it there or fix the name.`
      );
    }
  }
  return environments;
}

function validateRequiredMetadata(
  raw: Raw,
  base: PolicyBase,
  context: PolicyContext,
  bad: Errors
): RequiredMetadataPolicy | null {
  const match = readMatch(raw, context, bad);
  const fields = requireList(raw, 'fields', 'required-metadata', bad) ?? [];
  for (const field of fields) {
    if (!(GOVERNANCE_FIELDS as readonly string[]).includes(field)) {
      bad(`field "${field}" is not a governance field.${closest(field, GOVERNANCE_FIELDS)}`);
    }
  }
  return {
    ...base,
    kind: 'required-metadata',
    ...(match ? { match } : {}),
    fields: [...new Set(fields)] as RequiredMetadataPolicy['fields'],
  };
}

function readFloorRow(
  value: unknown,
  index: number,
  context: PolicyContext,
  bad: Errors
): RiskFloorRow | undefined {
  const where = `floors[${index}]: `;
  if (!isRecord(value)) {
    bad(`${where}each row must be an object with conditions and a "minimum"`);
    return undefined;
  }
  checkKeys(value, FLOOR_KEYS, where, bad);
  const minimum = own(value, 'minimum');
  if (!isRiskLevel(minimum)) {
    bad(`${where}"minimum" must be one of: ${RISK_LEVELS.join(', ')}`);
    return undefined;
  }
  const row: RiskFloorRow = { minimum };
  const dataClasses = readList(value, 'dataClasses', where, bad);
  checkDataClasses(dataClasses, where, context, bad);
  if (dataClasses) row.dataClasses = dataClasses;
  const domains = readList(value, 'domains', where, bad);
  if (domains) row.domains = domains;
  const inputTypes = readList(value, 'inputTypes', where, bad);
  for (const type of inputTypes ?? []) {
    if (!(PROMPT_SCALAR_TYPES as readonly string[]).includes(type)) {
      bad(
        `${where}input type "${type}" is not a prompt input type.${closest(type, PROMPT_SCALAR_TYPES)}`
      );
    }
  }
  if (inputTypes) row.inputTypes = inputTypes as PromptScalarType[];
  if (!row.dataClasses && !row.domains && !row.inputTypes) {
    bad(`${where}a row needs at least one of dataClasses, domains or inputTypes`);
  }
  return row;
}

function validateRiskFloor(
  raw: Raw,
  base: PolicyBase,
  context: PolicyContext,
  bad: Errors
): RiskFloorPolicy | null {
  const floors = own(raw, 'floors');
  if (!Array.isArray(floors) || floors.length === 0) {
    bad('risk-floor requires a non-empty "floors" list');
    return null;
  }
  const rows = floors.map((row, index) => readFloorRow(row, index, context, bad));
  return {
    ...base,
    kind: 'risk-floor',
    floors: rows.filter((row): row is RiskFloorRow => row !== undefined),
  };
}

function validateModelAllowlist(
  raw: Raw,
  base: PolicyBase,
  context: PolicyContext,
  bad: Errors
): ModelAllowlistPolicy | null {
  const match = readMatch(raw, context, bad);
  const models = requireList(raw, 'models', 'model-allowlist', bad);
  if (models === undefined) return null;
  const catalog = getModelCatalog(context.models);
  for (const model of models) {
    // The evaluator never lets a prompt on inherit pass, so listing it does nothing.
    if (catalog.resolve(model)?.kind === 'inherit') {
      bad(
        `"${model}" is not a model, a prompt on it always fails this policy. Remove it from models.`
      );
    }
  }
  const ids = catalog.profiles.map((profile) => profile.id);
  for (const model of resolveModelSet(models, catalog).unknown) {
    const close = findClosestMatch(model, ids);
    bad(
      `model "${model}" is not in the model catalog.` +
        (close
          ? ` Did you mean "${close.match}"?`
          : ' Use a catalog id or declare it under models.profiles.')
    );
  }
  return {
    ...base,
    kind: 'model-allowlist',
    ...(match ? { match } : {}),
    models,
  };
}

function readApproval(
  value: unknown,
  index: number,
  context: PolicyContext,
  bad: Errors
): RequiredApproval | undefined {
  const where = `approvals[${index}]: `;
  if (!isRecord(value)) {
    bad(`${where}each approval must be an object with a "role"`);
    return undefined;
  }
  checkKeys(value, APPROVAL_KEYS, where, bad);
  const role = own(value, 'role');
  if (typeof role !== 'string' || role === '') {
    bad(`${where}"role" must name a role from governance.roles`);
    return undefined;
  }
  const governance: unknown = context.governance;
  const roles = isRecord(governance) ? own(governance, 'roles') : undefined;
  if (!isRecord(roles) || !Object.hasOwn(roles, role)) {
    bad(
      `${where}role "${role}" is not in governance.roles. Add it there with the teams that review it.`
    );
  }
  const count = own(value, 'count');
  if (count === undefined) return { role };
  if (typeof count !== 'number' || !Number.isInteger(count) || count < 1) {
    bad(`${where}"count" must be 1`);
  } else if (count > 1) {
    bad(
      `${where}role "${role}" asks for ${count} approvals, but approval records are unsigned ` +
        'and cannot tell two approvers apart under one review. Use count: 1.'
    );
  }
  return { role, count: 1 };
}

function validateRequiredApprovals(
  raw: Raw,
  base: PolicyBase,
  context: PolicyContext,
  bad: Errors
): RequiredApprovalsPolicy | null {
  const match = readMatch(raw, context, bad);
  const environments = readEnvironments(raw, context, bad);
  const approvals = own(raw, 'approvals');
  if (!Array.isArray(approvals) || approvals.length === 0) {
    bad('required-approvals requires a non-empty "approvals" list');
    return null;
  }
  const rows = approvals.map((approval, index) => readApproval(approval, index, context, bad));
  return {
    ...base,
    kind: 'required-approvals',
    ...(match ? { match } : {}),
    ...(environments ? { environments } : {}),
    approvals: rows.filter((row): row is RequiredApproval => row !== undefined),
  };
}

function validateRequiredEvals(
  raw: Raw,
  base: PolicyBase,
  context: PolicyContext,
  bad: Errors
): RequiredEvalsPolicy {
  const match = readMatch(raw, context, bad);
  const environments = readEnvironments(raw, context, bad);
  return {
    ...base,
    kind: 'required-evals',
    ...(match ? { match } : {}),
    ...(environments ? { environments } : {}),
  };
}

function readChecks(raw: Raw, bad: Errors): ContentRuleCheck[] | undefined {
  const checks = readList(raw, 'checks', '', bad);
  const known = CONTENT_CHECK_RULES.flatMap((rule) => [rule.name, rule.id]);
  for (const check of checks ?? []) {
    if (check === 'path-traversal' || check === 'PS013') {
      bad(
        `check "${check}" looks at @inherit and @use paths, not prompt text. Remove it from checks.`
      );
    } else if (!known.includes(check)) {
      bad(`check "${check}" is not a content check.${closest(check, known)}`);
    }
  }
  return checks as ContentRuleCheck[] | undefined;
}

function validateContentRules(
  raw: Raw,
  base: PolicyBase,
  context: PolicyContext,
  bad: Errors
): ContentRulesPolicy | null {
  const match = readMatch(raw, context, bad);
  const checks = readChecks(raw, bad);
  const deny = readList(raw, 'deny', '', bad);
  for (const phrase of deny ?? []) {
    if (normalizeDenyText(phrase) === '') {
      bad(`deny phrase "${phrase}" is empty after normalization, so it would match every text`);
    }
  }
  const allow = readList(raw, 'allow', '', bad);
  if (own(raw, 'checks') === undefined && own(raw, 'deny') === undefined) {
    bad('content-rules requires a "checks" or a "deny" list');
    return null;
  }
  return {
    ...base,
    kind: 'content-rules',
    ...(match ? { match } : {}),
    ...(checks ? { checks } : {}),
    ...(deny ? { deny } : {}),
    ...(allow ? { allow } : {}),
  };
}

/**
 * A traffic percent with at most two decimals, in basis points, or undefined when the
 * value is not one. The tolerance absorbs binary float noise such as 0.07 * 100.
 *
 * @internal
 */
export function percentToBasisPoints(value: unknown): number | undefined {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 100) {
    return undefined;
  }
  const points = Math.round(value * 100);
  return Math.abs(value * 100 - points) < 1e-6 ? points : undefined;
}

/** A percent field as written and in basis points, which comparisons use. */
interface Percent {
  percent: number;
  points: number;
}

function readPercent(raw: Raw, key: string, bad: Errors): Percent | undefined {
  const value = own(raw, key);
  if (value === undefined) return undefined;
  const points = percentToBasisPoints(value);
  if (points === undefined) {
    bad(`"${key}" must be a percent from 0 to 100 with at most two decimals, such as 5 or 2.5`);
    return undefined;
  }
  return { percent: points / 100, points };
}

function validateMaxExperimentWeight(
  raw: Raw,
  base: PolicyBase,
  context: PolicyContext,
  bad: Errors
): MaxExperimentWeightPolicy | null {
  const match = readMatch(raw, context, bad);
  const environments = readEnvironments(raw, context, bad);
  const rawApprovals = own(raw, 'approvals');
  let approvals: RequiredApproval[] | undefined;
  if (rawApprovals !== undefined) {
    if (!Array.isArray(rawApprovals) || rawApprovals.length === 0) {
      bad('"approvals" must be a non-empty list of roles, or left out for a hard cap');
    } else {
      approvals = rawApprovals
        .map((approval, index) => readApproval(approval, index, context, bad))
        .filter((row): row is RequiredApproval => row !== undefined);
    }
  }
  if (own(raw, 'maxWeight') === undefined) {
    bad('max-experiment-weight requires "maxWeight", the percent an arm may get');
    return null;
  }
  const maxWeight = readPercent(raw, 'maxWeight', bad);
  const ceiling = readPercent(raw, 'ceiling', bad);
  if (maxWeight === undefined) return null;
  // Without approvals nothing can pass above maxWeight, so a ceiling would only mislead.
  if (own(raw, 'ceiling') !== undefined && rawApprovals === undefined) {
    bad(
      '"ceiling" needs "approvals": without them the cap is maxWeight. Add approvals or remove ceiling.'
    );
  }
  if (ceiling !== undefined && ceiling.points < maxWeight.points) {
    bad(
      `"ceiling" (${ceiling.percent}) is below "maxWeight" (${maxWeight.percent}). Set it to at least ${maxWeight.percent}.`
    );
  }
  return {
    ...base,
    kind: 'max-experiment-weight',
    ...(match ? { match } : {}),
    ...(environments ? { environments } : {}),
    maxWeight: maxWeight.percent,
    ...(approvals ? { approvals } : {}),
    ...(ceiling === undefined ? {} : { ceiling: ceiling.percent }),
  };
}

const PROMPT_KIND_KEYS: Readonly<Record<string, readonly string[]>> = {
  'required-metadata': ['match', 'fields'],
  'risk-floor': ['floors'],
  'model-allowlist': ['match', 'models'],
  'required-approvals': ['match', 'environments', 'approvals'],
  'required-evals': ['match', 'environments'],
  'content-rules': ['match', 'checks', 'deny', 'allow'],
  'max-experiment-weight': ['match', 'environments', 'maxWeight', 'approvals', 'ceiling'],
};

function validateKind(
  raw: Raw,
  kind: PolicyKind,
  base: PolicyBase,
  context: PolicyContext,
  bad: Errors
): PolicyDefinition | null {
  const promptKeys = PROMPT_KIND_KEYS[kind];
  // A typo in a prompt kind, such as minrisk, would quietly change what it selects.
  if (promptKeys) checkKeys(raw, [...BASE_KEYS, ...promptKeys], '', bad);
  switch (kind) {
    case 'layer-boundary':
      return validateLayerBoundary(raw, base, bad);
    case 'property-protection':
      return validatePropertyProtection(raw, base, bad);
    case 'registry-allowlist':
      return validateRegistryAllowlist(raw, base, bad);
    case 'required-metadata':
      return validateRequiredMetadata(raw, base, context, bad);
    case 'risk-floor':
      return validateRiskFloor(raw, base, context, bad);
    case 'model-allowlist':
      return validateModelAllowlist(raw, base, context, bad);
    case 'required-approvals':
      return validateRequiredApprovals(raw, base, context, bad);
    case 'required-evals':
      return validateRequiredEvals(raw, base, context, bad);
    case 'content-rules':
      return validateContentRules(raw, base, context, bad);
    case 'max-experiment-weight':
      return validateMaxExperimentWeight(raw, base, context, bad);
  }
}

function parseOnePolicy(
  raw: unknown,
  index: number,
  seenNames: Set<string>,
  context: PolicyContext
): { policy: PolicyDefinition | null; errors: string[] } {
  if (!isRecord(raw)) {
    return { policy: null, errors: [`Policy at index ${index}: must be an object`] };
  }

  const rawName = own(raw, 'name');
  if (typeof rawName !== 'string' || rawName.trim() === '') {
    return { policy: null, errors: [`Policy at index ${index}: missing required "name" field`] };
  }

  const name = rawName.trim();
  const errors: string[] = [];
  const bad: Errors = (message) => errors.push(`Policy "${name}": ${message}`);

  if (seenNames.has(name)) {
    bad('duplicate policy name');
    return { policy: null, errors };
  }
  seenNames.add(name);

  if (Object.hasOwn(raw, '__proto__')) {
    bad('the key "__proto__" is not allowed');
    return { policy: null, errors };
  }

  const kind = own(raw, 'kind');
  if (!isPolicyKind(kind)) {
    bad(`unknown kind "${String(kind)}". Must be one of: ${VALID_KINDS.join(', ')}`);
    return { policy: null, errors };
  }

  const severity = own(raw, 'severity');
  if (!isPolicySeverity(severity)) {
    bad(`invalid severity "${String(severity)}". Must be one of: ${VALID_SEVERITIES.join(', ')}`);
    return { policy: null, errors };
  }

  const description = own(raw, 'description');
  const base: PolicyBase = {
    name,
    severity,
    ...(typeof description === 'string' ? { description } : {}),
  };
  const policy = validateKind(raw, kind, base, context, bad);
  return { policy: errors.length === 0 ? policy : null, errors };
}

/**
 * Parse and validate policy definitions from config.
 *
 * Validates all policies and collects errors without stopping at the first
 * failure. Successfully validated policies are returned alongside any errors.
 * An unknown kind is an error, so a policy this version cannot evaluate never
 * passes silently. Prompt kinds also reject unknown keys, and check roles,
 * environments, models and, when `governance.dataClasses` is set, data classes
 * against `context`.
 *
 * @param input - Raw `policies` value from config: a list, or undefined or null for none
 * @param context - Governance, release and model settings of the project
 * @returns Parsed policies and any validation errors
 */
export function parsePolicies(input: unknown, context: PolicyContext = {}): ParsedPolicies {
  if (input === undefined || input === null || (Array.isArray(input) && input.length === 0)) {
    return { policies: [], errors: [] };
  }
  // A mapping written without "-" would otherwise drop every policy in silence.
  if (!Array.isArray(input)) {
    return {
      policies: [],
      errors: ['"policies" must be a list. Start each policy with "- name:".'],
    };
  }

  const policies: PolicyDefinition[] = [];
  const errors: string[] = [];
  const seenNames = new Set<string>();

  for (let i = 0; i < input.length; i++) {
    const result = parseOnePolicy(input[i], i, seenNames, context);
    errors.push(...result.errors);
    if (result.policy !== null) {
      policies.push(result.policy);
    }
  }

  return { policies, errors };
}
