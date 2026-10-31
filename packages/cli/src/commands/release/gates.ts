import {
  approvalRecordPath,
  compareCodeUnits,
  getModelCatalog,
  isPlainObject,
  RISK_LEVELS,
  type MaxExperimentWeightPolicy,
  type ModelProfile,
  type PolicyDefinition,
  type PolicySubject,
  type PromptBundleV1,
  type PromptPolicyMatch,
  type PromptScriptConfig,
  type RequiredApprovalsPolicy,
  type RiskLevel,
} from '@promptscript/core';
import {
  evaluatePromptPolicies,
  parsePolicies,
  promptPolicyMatches,
  promptPolicyRisk,
  type PolicyContext,
} from '@promptscript/validator';
import type {
  ReleaseDiagnostic,
  ReleaseGateApprovals,
  ReleaseGateCheck,
  ReleaseGateResult,
} from '../../utils/release-report.js';
import {
  approvalFilesOf,
  committedApprovalFiles,
  committedRecords,
  type CommittedApproval,
} from '../approve/records.js';
import { ReleaseError } from './errors.js';
import { stripControlCharacters } from './git.js';
import { checkBundleFields, percentText, readVerifiedBundle, shortHash } from './layout.js';
import {
  ReleaseCompileError,
  releaseValidatorConfig,
  type CompiledRelease,
  type ReleaseProject,
} from './project.js';
import { toDiagnostic } from './run.js';

/** Policy kinds a gate judges a prompt version by; the skill kinds run in the source build. */
const PROMPT_KINDS: ReadonlySet<PolicyDefinition['kind']> = new Set([
  'required-metadata',
  'risk-floor',
  'model-allowlist',
  'required-approvals',
  'required-evals',
  'content-rules',
  'max-experiment-weight',
]);

/** Code of a failed gate check: the gates are the policies, run on a prompt version. */
const POLICY_CODE = 'PS030';

/** The arm of a label experiment a prompt version serves, set for non-control arms only. */
export interface GateExposure {
  experiment: string;
  variant: string;
  /** Share of traffic in basis points, 0 to 10000 */
  weight: number;
}

/** A prompt version the gates judge. */
export interface GateEntry {
  id: string;
  contentHash: string;
  /** Absent for the entry hash and the control arm */
  exposure?: GateExposure;
}

/**
 * What promote and rollback are about to write, or the label entries status judges, for
 * the gates to judge.
 */
export interface PromotionGateContext {
  project: ReleaseProject;
  /**
   * The config whose policies, governance, releases, validation and models decide: the
   * checkout's, or the base's rules for `prs release status --base`
   */
  config: PromptScriptConfig;
  /** Where `config` comes from, the location of a policy that does not parse */
  configFile: string;
  environment: string;
  /** Entries the label holds after the command */
  prompts: GateEntry[];
  /** The fresh in-memory build of the source under `config`, shared by the caller */
  source: () => Promise<CompiledRelease>;
}

export interface PromotionGateResult {
  /** False when a check of severity error failed or is unavailable, or the gates could not run */
  passed: boolean;
  /** What fails the command: failed error checks and anything that kept the gates from running */
  findings: ReleaseDiagnostic[];
  /** Failed and unavailable checks of severity warning */
  warnings: ReleaseDiagnostic[];
  /** One result per prompt version a prompt policy exists for */
  gates: ReleaseGateResult[];
}

/** The settings policies are parsed and evaluated with, the same as a release build. */
function policyContext(config: PromptScriptConfig): PolicyContext {
  const validator = releaseValidatorConfig(config);
  return {
    governance: config.governance,
    releases: config.releases,
    models: config.models,
    blockedPatterns: validator.blockedPatterns,
    allowedPatterns: validator.allowedPatterns,
  };
}

function refused(findings: ReleaseDiagnostic[]): PromotionGateResult {
  return { passed: false, findings, warnings: [], gates: [] };
}

/** A bundle as policies see it: the governance, model, inputs and messages that ship. */
function subjectOf(bundle: PromptBundleV1, file: string): PolicySubject {
  const model = bundle.model;
  return {
    id: bundle.id,
    governance: bundle.governance,
    ...(isPlainObject(model) && typeof model.ref === 'string'
      ? {
          model: {
            ref: model.ref,
            ...(typeof model.profile === 'string' ? { profile: model.profile } : {}),
          },
        }
      : {}),
    inputs: Object.fromEntries(
      Object.entries(bundle.inputs).map(([name, input]) => [
        name,
        {
          type: input.type,
          ...(Array.isArray(input.options) ? { options: input.options } : {}),
        },
      ])
    ),
    texts: bundle.messages.map(({ role, content }) => ({ role, content })),
    loc: { file, line: 1, column: 1 },
  };
}

function higherRisk(a: RiskLevel, b: RiskLevel): RiskLevel {
  return RISK_LEVELS.indexOf(b) > RISK_LEVELS.indexOf(a) ? b : a;
}

/**
 * Selection on the union of the bundle and the source: the domain of either, every data
 * class of both. A bundle file verifies only against its own hash, so a bundle with
 * lowered governance values must not slip out of a policy the source falls under.
 */
function unionSelects(
  shipped: PolicySubject,
  fromSource: PolicySubject | undefined,
  risk: RiskLevel
): (match: PromptPolicyMatch | undefined) => boolean {
  const dataClasses = [
    ...new Set([
      ...(shipped.governance.dataClasses ?? []),
      ...(fromSource?.governance.dataClasses ?? []),
    ]),
  ];
  const candidates = [shipped, ...(fromSource === undefined ? [] : [fromSource])].map(
    (subject) => ({ ...subject, governance: { ...subject.governance, dataClasses } })
  );
  return (match) => candidates.some((subject) => promptPolicyMatches(match, subject, risk));
}

function appliesTo(environments: readonly string[] | undefined, environment: string): boolean {
  return environments === undefined || environments.includes(environment);
}

/**
 * The committed approvals of one role for one prompt version and environment (spec 3.4).
 * A record with `maxWeight` counts only for an arm at or under its ceiling: for the entry
 * hash, the control arm or any other item without exposure it is listed as capped and never
 * counts. A record without `maxWeight` counts everywhere, as a ceiling of 10000.
 */
function countApprovals(
  records: readonly CommittedApproval[],
  entry: GateEntry,
  role: string,
  required: number,
  environment: string,
  roles: ReadonlySet<string>
): ReleaseGateApprovals {
  const found = new Map<string, string>();
  const capped = new Map<string, string>();
  const stale = new Set<string>();
  for (const { path, record } of records) {
    // Invalid, of another prompt or role, at another path than its fields give (its
    // directory had other reviewers), of a role no longer configured, or for another
    // environment: never counted.
    if (record?.prompt !== entry.id || record.role !== role) continue;
    if (approvalRecordPath(record) !== path || !roles.has(role)) continue;
    if (record.environment !== undefined && record.environment !== environment) continue;
    const approver = record.approver.value;
    if (record.contentHash !== entry.contentHash) {
      stale.add(`${approver} for ${shortHash(record.contentHash)}`);
    } else if (
      record.maxWeight === undefined ||
      (entry.exposure !== undefined && record.maxWeight >= entry.exposure.weight)
    ) {
      found.set(approver.toLowerCase(), approver);
    } else {
      capped.set(approver.toLowerCase(), `${approver} up to ${percentText(record.maxWeight)}`);
    }
  }
  return {
    role,
    required,
    found: [...found.values()].sort(compareCodeUnits),
    stale: [...stale].sort(compareCodeUnits),
    ...(capped.size === 0 ? {} : { capped: [...capped.values()].sort(compareCodeUnits) }),
  };
}

function configuredRoles(config: PromptScriptConfig): Set<string> {
  const roles: unknown = config.governance?.roles;
  return new Set(isPlainObject(roles) ? Object.keys(roles) : []);
}

/**
 * Why the model a bundle ships is not the one its name stands for in the models of
 * `config`, or undefined when it is. An allowlist judges names, so a profile that a pull
 * request points at another provider or API id must not pass under the old name.
 */
function shippedModelProblem(
  bundle: PromptBundleV1,
  config: PromptScriptConfig
): string | undefined {
  const model = bundle.model;
  if (model === undefined) return undefined;
  const catalog = getModelCatalog(config.models);
  const name = model.profile ?? model.ref;
  let profile: ModelProfile | undefined;
  if (model.profile === undefined) {
    const resolution = catalog.resolve(model.ref);
    profile = resolution?.kind === 'inherit' ? undefined : resolution?.profile;
  } else {
    profile = catalog.getProfile(model.profile);
  }
  if (profile === undefined) {
    return model.profile === undefined
      ? undefined
      : `Prompt "${bundle.id}" ships the profile "${name}", which the models of this config do not know`;
  }
  if (profile.provider === model.provider && profile.apiId === model.apiId) return undefined;
  return `Prompt "${bundle.id}" ships ${model.provider}/${model.apiId} as "${name}", but "${name}" is ${profile.provider}/${profile.apiId} in the models of this config`;
}

/** Everything one prompt version is judged with. */
interface Judged {
  entry: GateEntry;
  bundle: PromptBundleV1;
  shipped: PolicySubject;
  risk: RiskLevel;
  selects: (match: PromptPolicyMatch | undefined) => boolean;
  /** The committed records of this prompt, read once and only when a policy needs them */
  approvals: () => Promise<CommittedApproval[]>;
}

/** `warm of <id>@<hash> at 30 %` for an arm, `<id>@<hash>` for an item without exposure. */
function judgedName(entry: GateEntry): string {
  const name = `${entry.id}@${shortHash(entry.contentHash)}`;
  const { exposure } = entry;
  return exposure === undefined
    ? name
    : `${exposure.variant} of ${name} at ${percentText(exposure.weight)}`;
}

/** The option that gives an arm the approval it needs: its own weight as the ceiling. */
function maxWeightOption(entry: GateEntry): string {
  return entry.exposure === undefined ? '' : ` --max-weight ${entry.exposure.weight / 100}`;
}

/** The ` (stale: ...)` and ` (capped: ...)` notes of a role, for the gate text. */
function approvalNotes(stale: readonly string[], capped: readonly string[] | undefined): string {
  const staleText = stale.length === 0 ? '' : ` (stale: ${stale.join(', ')})`;
  const cappedText = capped === undefined ? '' : ` (capped: ${capped.join(', ')})`;
  return `${staleText}${cappedText}`;
}

function approvalsCheck(
  policy: RequiredApprovalsPolicy,
  judged: Judged,
  records: readonly CommittedApproval[],
  context: PromotionGateContext
): ReleaseGateCheck {
  const { entry } = judged;
  const { environment } = context;
  const roles = configuredRoles(context.config);
  const approvals = policy.approvals.map(({ role, count }) =>
    countApprovals(records, entry, role, count ?? 1, environment, roles)
  );
  const missing = approvals.filter((approval) => approval.found.length < approval.required);
  const base = { policy: policy.name, kind: policy.kind, severity: policy.severity, approvals };
  const [first] = missing;
  if (first === undefined) return { ...base, status: 'passed' };
  const message = missing
    .map(({ role, required, found, stale, capped }) => {
      return `${judgedName(entry)} needs ${required} ${role} approval for ${environment}, found ${found.length}${approvalNotes(stale, capped)}`;
    })
    .join('; ');
  const commands = missing.map(
    ({ role }) =>
      `prs approve ${entry.id}@${entry.contentHash} --role ${role} --approver @<you> --env ${environment}${maxWeightOption(entry)}`
  );
  return { ...base, status: 'failed', message, suggestion: `Run: ${commands.join('; ')}` };
}

function toBasisPoints(percent: number): number {
  return Math.round(percent * 100);
}

/** The way out of a cap, for an arm that runs above what the policy allows. */
function lowerSuggestion(variant: string, allowed: number): string {
  return `Lower ${variant} to at most ${percentText(allowed)} with prs release split, or change the policy in a reviewed pull request.`;
}

/**
 * A max-experiment-weight policy on one arm, or undefined when it does not apply: no
 * exposure (the entry hash and control are promotions), weight 0, no match or another
 * environment. Up to `maxWeight` the arm passes. Above it the policy needs `approvals`
 * that count for the arm weight, and never above `ceiling`; without `approvals` the cap
 * is `maxWeight`.
 */
async function exposureCheck(
  policy: MaxExperimentWeightPolicy,
  judged: Judged,
  context: PromotionGateContext
): Promise<ReleaseGateCheck | undefined> {
  const { entry } = judged;
  const { exposure } = entry;
  if (exposure === undefined || exposure.weight === 0) return undefined;
  if (!judged.selects(policy.match) || !appliesTo(policy.environments, context.environment)) {
    return undefined;
  }
  const base = { policy: policy.name, kind: policy.kind, severity: policy.severity };
  const { weight } = exposure;
  // The parser allows at most two decimals, so the rounding only absorbs float noise.
  const cap = toBasisPoints(policy.maxWeight);
  if (weight <= cap) return { ...base, status: 'passed' };
  const { environment } = context;
  const runs = `${exposure.variant} of ${entry.id}@${shortHash(entry.contentHash)} runs ${percentText(weight)} in ${environment}`;
  const { approvals: wanted } = policy;
  if (wanted === undefined) {
    return {
      ...base,
      status: 'failed',
      message: `${runs}; ${policy.name} allows at most ${percentText(cap)}`,
      suggestion: lowerSuggestion(exposure.variant, cap),
    };
  }
  const ceiling = policy.ceiling === undefined ? undefined : toBasisPoints(policy.ceiling);
  if (ceiling !== undefined && weight > ceiling) {
    return {
      ...base,
      status: 'failed',
      message: `${runs}; ${policy.name} allows at most ${percentText(ceiling)}`,
      suggestion: lowerSuggestion(exposure.variant, ceiling),
    };
  }
  const records = await judged.approvals();
  const roles = configuredRoles(context.config);
  const approvals = wanted.map(({ role, count }) =>
    countApprovals(records, entry, role, count ?? 1, environment, roles)
  );
  const missing = approvals.filter((approval) => approval.found.length < approval.required);
  if (missing.length === 0) return { ...base, status: 'passed', approvals };
  const needs = missing
    .map(
      ({ role, found, stale, capped }) =>
        `a ${role} approval up to at least ${percentText(weight)}, found ${found.length}${approvalNotes(stale, capped)}`
    )
    .join(', ');
  const commands = missing.map(
    ({ role }) =>
      `prs approve ${entry.id}@${entry.contentHash} --role ${role} --approver @<you> --env ${environment}${maxWeightOption(entry)}`
  );
  return {
    ...base,
    status: 'failed',
    message: `${runs}; ${policy.name} needs ${needs}`,
    suggestion: `Run: ${commands.join('; ')}`,
    approvals,
  };
}

/** One policy as a check of one prompt version, or undefined when it does not apply. */
async function checkOf(
  policy: PolicyDefinition,
  judged: Judged,
  context: PromotionGateContext,
  evaluation: PolicyContext
): Promise<ReleaseGateCheck | undefined> {
  const base = { policy: policy.name, kind: policy.kind, severity: policy.severity };
  if (policy.kind === 'required-approvals') {
    if (!judged.selects(policy.match) || !appliesTo(policy.environments, context.environment)) {
      return undefined;
    }
    return approvalsCheck(policy, judged, await judged.approvals(), context);
  }
  if (policy.kind === 'required-evals') {
    if (!judged.selects(policy.match) || !appliesTo(policy.environments, context.environment)) {
      return undefined;
    }
    return {
      ...base,
      status: 'unavailable',
      message: `${judged.entry.id} needs passing evals for ${context.environment}, but release gates do not read eval results in this version of prs`,
      suggestion: 'Remove the policy or set severity: warning.',
    };
  }
  if (policy.kind === 'max-experiment-weight') return exposureCheck(policy, judged, context);
  // A risk floor applies to every prompt; the other kinds where their match selects, and
  // no match selects every prompt.
  const match = 'match' in policy ? policy.match : undefined;
  if (policy.kind !== 'risk-floor' && !judged.selects(match)) return undefined;
  const violations = evaluatePromptPolicies([policy], [judged.shipped], evaluation, {
    risk: judged.risk,
    selects: judged.selects,
  });
  const messages = violations.map((violation) => violation.message);
  const modelProblem =
    policy.kind === 'model-allowlist'
      ? shippedModelProblem(judged.bundle, context.config)
      : undefined;
  if (modelProblem !== undefined) messages.push(modelProblem);
  if (messages.length === 0) return { ...base, status: 'passed' };
  const suggestion =
    violations[0]?.suggestion ??
    'Build the bundle again with the models of this config, or fix models.profiles in a reviewed pull request.';
  return { ...base, status: 'failed', message: messages.join('; '), suggestion };
}

/** What every entry of one gate run shares. */
interface GateRun {
  policies: readonly PolicyDefinition[];
  evaluation: PolicyContext;
  source: CompiledRelease;
  /** Roles that `required-approvals` and `max-experiment-weight` policies ask for */
  roles: readonly string[];
  /**
   * The committed records of every entry of the run, listed and read once per run, with one
   * `git cat-file --batch`, and only when a policy needs them
   */
  records: () => Promise<CommittedApproval[]>;
}

/** The gates of one label entry. */
async function gateOf(
  context: PromotionGateContext,
  run: GateRun,
  entry: GateEntry
): Promise<ReleaseGateResult> {
  const { policies, evaluation, source } = run;
  const { paths } = context.project;
  const bundle = await readVerifiedBundle(paths, entry.contentHash, entry.id);
  checkBundleFields(bundle, paths.bundle(entry.contentHash));
  const shipped = subjectOf(bundle, paths.relative(paths.bundle(entry.contentHash)));
  const built = source.bundles.find((candidate) => candidate.id === entry.id);
  const fromSource = built === undefined ? undefined : subjectOf(built.bundle, source.source);
  const risk = higherRisk(
    promptPolicyRisk(shipped, policies),
    fromSource === undefined ? 'low' : promptPolicyRisk(fromSource, policies)
  );
  const judged: Judged = {
    entry,
    bundle,
    shipped,
    risk,
    selects: unionSelects(shipped, fromSource, risk),
    approvals: () =>
      run.records().then((records) => approvalFilesOf(records, [entry.id], run.roles)),
  };
  const checks = (
    await Promise.all(policies.map((policy) => checkOf(policy, judged, context, evaluation)))
  ).filter((check): check is ReleaseGateCheck => check !== undefined);
  return {
    prompt: entry.id,
    contentHash: entry.contentHash,
    environment: context.environment,
    policyRisk: risk,
    passed: !checks.some((check) => check.severity === 'error' && check.status !== 'passed'),
    checks,
  };
}

function checkDiagnostic(check: ReleaseGateCheck, file: string): ReleaseDiagnostic {
  const suggestion = check.suggestion === undefined ? '' : ` ${check.suggestion}`;
  const message = check.message ?? check.kind;
  return {
    code: POLICY_CODE,
    message: `[${check.policy}] ${message}.${suggestion}`,
    location: { file },
  };
}

/** The gates of every entry: a missing or broken bundle is a finding, it cannot pass. */
async function judgeEntries(
  context: PromotionGateContext,
  run: GateRun
): Promise<PromotionGateResult> {
  const findings: ReleaseDiagnostic[] = [];
  const warnings: ReleaseDiagnostic[] = [];
  const gates: ReleaseGateResult[] = [];
  const file = context.project.paths.relative(context.project.paths.label(context.environment));
  const judged = await Promise.all(
    context.prompts.map((entry) =>
      gateOf(context, run, entry).catch((error: unknown) => {
        if (!(error instanceof ReleaseError)) throw error;
        return toDiagnostic(error);
      })
    )
  );
  for (const gate of judged) {
    if (!('checks' in gate)) {
      findings.push(gate);
      continue;
    }
    gates.push(gate);
    for (const check of gate.checks.filter((entry) => entry.status !== 'passed')) {
      (check.severity === 'error' ? findings : warnings).push(checkDiagnostic(check, file));
    }
  }
  return { passed: findings.length === 0, findings, warnings, gates };
}

/**
 * The gates a prompt version must pass before a label holds it: every prompt policy,
 * evaluated directly, so `validation.disableRules`, `validation.rules` and skip flags do
 * not apply. Policies are parsed fresh, and a parse error fails the gates. Static kinds
 * judge the bundle that ships; policy risk and selection take the higher risk and the
 * union of domains and data classes of the bundle and the fresh source build. Approvals
 * are the records committed at HEAD. `required-evals` is `unavailable`, never a pass.
 *
 * Without a prompt policy the gates pass without building the source.
 */
export async function checkPromotionGates(
  context: PromotionGateContext
): Promise<PromotionGateResult> {
  const evaluation = policyContext(context.config);
  const parsed = parsePolicies(context.config.policies ?? undefined, evaluation);
  const location = { file: context.configFile };
  if (parsed.errors.length > 0) {
    return refused(
      parsed.errors.map((error) => ({
        code: POLICY_CODE,
        message: `The policies cannot be evaluated, so no gate passes: ${error.replace(/\.$/, '')}. Fix the policy definitions.`,
        location,
      }))
    );
  }
  const policies = parsed.policies.filter((policy) => PROMPT_KINDS.has(policy.kind));
  if (policies.length === 0 || context.prompts.length === 0) {
    return { passed: true, findings: [], warnings: [], gates: [] };
  }
  let source: CompiledRelease;
  try {
    source = await context.source();
  } catch (error) {
    if (!(error instanceof ReleaseCompileError)) throw error;
    return refused([
      {
        code: POLICY_CODE,
        message:
          'The source does not build, so the gates cannot compare it with the bundle. Fix the errors below, then run the command again.',
        location,
      },
      ...error.diagnostics,
    ]);
  }

  const { root } = context.project;
  const roles = [
    ...new Set(
      policies.flatMap((policy) =>
        policy.kind === 'required-approvals' || policy.kind === 'max-experiment-weight'
          ? (policy.approvals ?? []).map(({ role }) => role)
          : []
      )
    ),
  ];
  const prompts = context.prompts.map((entry) => entry.id);
  let records: Promise<CommittedApproval[]> | undefined;
  return judgeEntries(context, {
    policies,
    evaluation,
    source,
    roles,
    records: () =>
      (records ??= committedApprovalFiles(root).then((files) =>
        committedRecords(root, approvalFilesOf(files, prompts, roles))
      )),
  });
}

const STATUS_WIDTH = 'unavailable'.length;

/** One check as a line of text. */
function checkLine(check: ReleaseGateCheck): string {
  let detail: string = check.kind;
  if (check.status !== 'passed' && check.approvals !== undefined) {
    detail = check.approvals
      .filter((approval) => approval.found.length < approval.required)
      .map(
        ({ role, required, found, stale, capped }) =>
          `${role} ${found.length} of ${required}${approvalNotes(stale, capped)}`
      )
      .join(', ');
  } else if (check.status !== 'passed') {
    detail = check.message ?? check.kind;
  }
  const policy = stripControlCharacters(check.policy);
  return `  ${check.status.padEnd(STATUS_WIDTH)}  ${policy}  ${stripControlCharacters(detail)}`;
}

/** The gates of one prompt version as lines of text; none when no policy applies to it. */
export function gateLines(gate: ReleaseGateResult): string[] {
  if (gate.checks.length === 0) return [];
  return [
    `Gates for ${stripControlCharacters(gate.prompt)}@${shortHash(gate.contentHash)} to ${stripControlCharacters(gate.environment)} (policy risk: ${gate.policyRisk})`,
    ...gate.checks.map(checkLine),
  ];
}
