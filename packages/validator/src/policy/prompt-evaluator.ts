import {
  effectiveGovernance,
  extractPromptDefinitions,
  getModelCatalog,
  isInModelSet,
  readMetaGovernance,
  resolveModelSet,
  RISK_LEVELS,
  type ModelAllowlistPolicy,
  type ModelCatalog,
  type ModelResolution,
  type PolicyDefinition,
  type PolicySubject,
  type PolicyViolation,
  type ProgramInput,
  type PromptPolicyMatch,
  type RequiredMetadataPolicy,
  type RiskFloorPolicy,
  type RiskFloorRow,
  type RiskLevel,
  type Value,
} from '@promptscript/core';
import { runContentRules, type PolicyFinding } from './content-rules.js';
import type { PolicyContext } from './types.js';

// An unknown level counts as low, like an unset one.
function rank(risk: RiskLevel): number {
  return Math.max(0, RISK_LEVELS.indexOf(risk));
}

// Vocabulary values compare lowercased.
function lowered(values: readonly string[] | undefined): Set<string> {
  return new Set((values ?? []).map((value) => value.toLowerCase()));
}

function hasDomain(subject: PolicySubject, domains: readonly string[] | undefined): boolean {
  const domain = subject.governance.domain;
  return domain !== undefined && lowered(domains).has(domain.toLowerCase());
}

function findDataClass(
  subject: PolicySubject,
  classes: readonly string[] | undefined
): string | undefined {
  const wanted = lowered(classes);
  return subject.governance.dataClasses?.find((value) => wanted.has(value.toLowerCase()));
}

/** Why a floor row matches a prompt, or undefined when it does not. */
function rowReason(row: RiskFloorRow, subject: PolicySubject): string | undefined {
  const dataClass = findDataClass(subject, row.dataClasses);
  if (dataClass !== undefined) return `data class "${dataClass}"`;
  if (hasDomain(subject, row.domains)) return `domain "${subject.governance.domain}"`;
  const types: ReadonlySet<string> = new Set(row.inputTypes ?? []);
  const input = Object.entries(subject.inputs).find(([, value]) => types.has(value.type));
  return input ? `input "${input[0]}" of type ${input[1].type}` : undefined;
}

/** The highest matching row of a risk-floor policy. */
function floorOf(
  policy: RiskFloorPolicy,
  subject: PolicySubject
): { risk: RiskLevel; reason: string } | undefined {
  let floor: { risk: RiskLevel; reason: string } | undefined;
  for (const row of policy.floors) {
    const reason = rowReason(row, subject);
    if (reason !== undefined && (floor === undefined || rank(row.minimum) > rank(floor.risk))) {
      floor = { risk: row.minimum, reason };
    }
  }
  return floor;
}

/** The higher of the effective risk (unset counts as low) and every floor. */
function policyRisk(subject: PolicySubject, floors: readonly RiskFloorPolicy[]): RiskLevel {
  let risk: RiskLevel = subject.governance.risk ?? 'low';
  for (const policy of floors) {
    const floor = floorOf(policy, subject);
    if (floor !== undefined && rank(floor.risk) > rank(risk)) risk = floor.risk;
  }
  return risk;
}

function matches(
  match: PromptPolicyMatch | undefined,
  subject: PolicySubject,
  risk: RiskLevel
): boolean {
  if (match === undefined) return true;
  if (match.minRisk !== undefined && rank(risk) < rank(match.minRisk)) return false;
  if (match.domains !== undefined && !hasDomain(subject, match.domains)) return false;
  if (match.dataClasses !== undefined && findDataClass(subject, match.dataClasses) === undefined) {
    return false;
  }
  return true;
}

function isMissing(value: unknown): boolean {
  return value === undefined || value === '' || (Array.isArray(value) && value.length === 0);
}

function checkMetadata(
  policy: RequiredMetadataPolicy,
  subject: PolicySubject,
  risk: RiskLevel
): PolicyFinding[] {
  return policy.fields
    .filter((field) => isMissing(subject.governance[field]))
    .map((field) => ({
      message:
        field === 'risk'
          ? `Prompt "${subject.id}" has no risk`
          : `Prompt "${subject.id}" has risk "${risk}" but no ${field}`,
      suggestion: `Add ${field} to the entry or to @meta.`,
    }));
}

function checkFloor(policy: RiskFloorPolicy, subject: PolicySubject): PolicyFinding[] {
  const floor = floorOf(policy, subject);
  const authored = subject.governance.risk;
  if (floor === undefined || rank(authored ?? 'low') >= rank(floor.risk)) return [];
  const has =
    authored === undefined ? 'has no risk, which counts as "low",' : `has risk "${authored}",`;
  return [
    {
      message: `Prompt "${subject.id}" ${has} below "${floor.risk}" required for ${floor.reason}`,
      suggestion: `Set risk: "${floor.risk}" on the entry or in @meta.`,
    },
  ];
}

function resolveSubjectModel(
  model: NonNullable<PolicySubject['model']>,
  catalog: ModelCatalog
): ModelResolution | undefined {
  // A bundle names the profile it was built with; that is the model it runs on.
  if (model.profile === undefined) return catalog.resolve(model.ref);
  const profile = catalog.getProfile(model.profile);
  return profile === undefined ? undefined : { kind: 'profile', profile };
}

function checkModel(
  policy: ModelAllowlistPolicy,
  subject: PolicySubject,
  risk: RiskLevel,
  catalog: ModelCatalog
): PolicyFinding[] {
  const suggestion = `Use one of: ${policy.models.join(', ')}.`;
  const model = subject.model;
  if (model === undefined) {
    return [
      {
        message: `Prompt "${subject.id}" has no model, so the application picks one, which is not allowed at risk "${risk}"`,
        suggestion,
      },
    ];
  }
  // inherit leaves the choice to the application, so no model set allows it here.
  const resolution = resolveSubjectModel(model, catalog);
  if (
    resolution !== undefined &&
    resolution.kind !== 'inherit' &&
    isInModelSet(resolution, resolveModelSet(policy.models, catalog))
  ) {
    return [];
  }
  return [
    {
      message: `Prompt "${subject.id}" uses "${model.profile ?? model.ref}", which is not allowed at risk "${risk}"`,
      suggestion,
    },
  ];
}

function evaluateOne(
  policy: PolicyDefinition,
  subject: PolicySubject,
  scope: PromptPolicyScope,
  catalog: ModelCatalog,
  context: PolicyContext
): PolicyFinding[] {
  const { risk, selects } = scope;
  switch (policy.kind) {
    case 'required-metadata':
      return selects(policy.match) ? checkMetadata(policy, subject, risk) : [];
    case 'risk-floor':
      return checkFloor(policy, subject);
    case 'model-allowlist':
      return selects(policy.match) ? checkModel(policy, subject, risk, catalog) : [];
    case 'content-rules':
      return selects(policy.match) ? runContentRules(policy, subject, context) : [];
    default:
      // Skill kinds run in evaluatePolicies. required-approvals and required-evals
      // need approval records and eval results, which validation does not read.
      return [];
  }
}

/**
 * The policy risk of a prompt: the higher of its effective risk (unset counts as low)
 * and the floor of every risk-floor policy, whatever its severity.
 */
export function promptPolicyRisk(
  subject: PolicySubject,
  policies: readonly PolicyDefinition[]
): RiskLevel {
  return policyRisk(
    subject,
    policies.filter((policy): policy is RiskFloorPolicy => policy.kind === 'risk-floor')
  );
}

/** Whether a policy's `match` selects a prompt at the given policy risk. */
export function promptPolicyMatches(
  match: PromptPolicyMatch | undefined,
  subject: PolicySubject,
  risk: RiskLevel
): boolean {
  return matches(match, subject, risk);
}

/**
 * Policy risk and selection that replace the subject's own, for a caller that judges one
 * prompt by more than its own fields, such as a release gate that also reads the source.
 */
export interface PromptPolicyScope {
  /** Policy risk the checks and their messages use */
  risk: RiskLevel;
  /** Whether a policy's `match` selects the prompt */
  selects: (match: PromptPolicyMatch | undefined) => boolean;
}

/**
 * Evaluate the prompt policy kinds on prompts.
 *
 * Every policy matches on policy risk: the higher of the effective risk (unset
 * counts as low) and the floor of every risk-floor policy, whatever its
 * severity. `required-approvals` and `required-evals` are not evaluated here.
 *
 * @param policies - Parsed policy definitions
 * @param subjects - Prompts as policies see them
 * @param context - Model catalog settings and the blocked-pattern setup of PS005
 * @param scope - Risk and selection to use for every subject instead of its own
 * @returns Violations, each at the location of its prompt
 */
export function evaluatePromptPolicies(
  policies: readonly PolicyDefinition[],
  subjects: readonly PolicySubject[],
  context: PolicyContext = {},
  scope?: PromptPolicyScope
): PolicyViolation[] {
  const floors = policies.filter(
    (policy): policy is RiskFloorPolicy => policy.kind === 'risk-floor'
  );
  const catalog = getModelCatalog(context.models);
  const violations: PolicyViolation[] = [];
  for (const subject of subjects) {
    const risk = policyRisk(subject, floors);
    const subjectScope = scope ?? {
      risk,
      selects: (match: PromptPolicyMatch | undefined) => matches(match, subject, risk),
    };
    for (const policy of policies) {
      for (const finding of evaluateOne(policy, subject, subjectScope, catalog, context)) {
        violations.push({
          policyName: policy.name,
          kind: policy.kind,
          severity: policy.severity,
          ...finding,
          ...(subject.loc ? { location: subject.loc } : {}),
        });
      }
    }
  }
  return violations;
}

/**
 * The `@prompts` entries of a resolved program as policy subjects: effective
 * governance with the `@meta` defaults, and the entry's own `system` and `user`
 * texts. Composed blocks are left out, the content rules already scan them.
 *
 * @param program - A resolved program, canonical or legacy
 * @returns One subject per valid entry, located at the entry
 */
export function promptPolicySubjects(program: ProgramInput): PolicySubject[] {
  // The canonical meta is deeply readonly; readMetaGovernance only reads it.
  const fields = (program.meta?.fields ?? {}) as Record<string, Value>;
  const defaults = readMetaGovernance(fields);
  const metaId = fields['id'];
  return extractPromptDefinitions(program).prompts.map((prompt) => ({
    id: typeof metaId === 'string' && metaId !== '' ? `${metaId}/${prompt.name}` : prompt.name,
    governance: effectiveGovernance(prompt.governance, defaults),
    ...(prompt.model ? { model: { ref: prompt.model.ref } } : {}),
    inputs: prompt.inputs,
    texts: [
      ...(prompt.system === undefined ? [] : [{ role: 'system' as const, content: prompt.system }]),
      ...(prompt.user === undefined ? [] : [{ role: 'user' as const, content: prompt.user }]),
    ],
    loc: prompt.loc,
  }));
}
