import { existsSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import {
  compareCodeUnits,
  isPlainObject,
  PROMPT_BUNDLE_INDEX_SCHEMA_URL,
  PROMPT_BUNDLE_SCHEMA_URL,
  type PromptBundleV1,
  type PromptScriptConfig,
} from '@promptscript/core';
import { Compiler, type CompileError } from '@promptscript/compiler';
import type { ValidatorConfig } from '@promptscript/validator';
import { parsePolicies } from '@promptscript/validator';
import { loadEffectiveConfig } from '../../config/loader.js';
import { resolveRegistryPath } from '../../utils/registry-resolver.js';
import { hasPromptBundleSchemaLine } from '../../utils/prompt-bundle-ownership.js';
import {
  findConfigInDir,
  loadProjectLockfile,
  registryReferenceRoots,
  resolveProjectConfigPath,
  resolveProjectPath,
  resolveProjectRoot,
  resolveUniversalDir,
  type ProjectPathOptions,
} from '../../utils/project-config.js';
import { toReleaseLocation, type ReleaseDiagnostic } from '../../utils/release-report.js';
import { buildValidatorConfig } from '../../utils/validator-config.js';
import { createDiffLogger } from '../diff.js';
import { PS5001_RELEASE_CONFIG, PS5002_UNKNOWN_ENVIRONMENT, ReleaseError } from './errors.js';
import {
  RESERVED_RELEASE_NAMES,
  assertExactCase,
  assertReleaseDirectories,
  releasePaths,
  type ReleasePaths,
} from './layout.js';

/** Windows device names, which no file system there can hold as `<name>.json`. */
export const WINDOWS_DEVICE_NAME_RE = /^(con|prn|aux|nul|com\d|lpt\d)$/;
const ENVIRONMENT_NAME_RE = /^[a-z][a-z0-9-]{0,31}$/;
const MAX_ENVIRONMENTS = 16;

const CONFIG_EXAMPLE = 'releases:\n  environments: [staging, prod]';

/**
 * Security rules that a release always runs as errors, whatever `validation.rules` says,
 * because a release ships text to a model. Keyed by rule id, valued by rule name.
 */
export const FORCED_RELEASE_RULES: Readonly<Record<string, string>> = {
  PS005: 'blocked-patterns',
  PS010: 'suspicious-urls',
  PS011: 'authority-injection',
  PS012: 'obfuscated-content',
  PS013: 'path-traversal',
  PS014: 'unicode-security',
};

/** The policy rule is switched on; each policy keeps its own severity. */
const POLICY_RULE_ID = 'PS030';
const POLICY_RULE_NAME = 'policy-compliance';

/** A project with releases configured. */
export interface ReleaseProject {
  root: string;
  /** Config file the error locations point at */
  configPath: string;
  config: PromptScriptConfig;
  /** Promotion order, first to last */
  environments: string[];
  paths: ReleasePaths;
}

function configError(message: string, configPath: string): ReleaseError {
  return new ReleaseError(PS5001_RELEASE_CONFIG, message, configPath);
}

function checkEnvironments(value: unknown, configPath: string): string[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw configError(
      `releases.environments must list at least one environment name in promotion order. Example:\n${CONFIG_EXAMPLE}`,
      configPath
    );
  }
  if (value.length > MAX_ENVIRONMENTS) {
    throw configError(
      `releases.environments lists ${value.length} environments; the limit is ${MAX_ENVIRONMENTS}. Remove the ones you do not promote to.`,
      configPath
    );
  }
  const names: string[] = [];
  for (const entry of value) {
    if (typeof entry !== 'string' || !ENVIRONMENT_NAME_RE.test(entry)) {
      throw configError(
        `releases.environments entry ${JSON.stringify(entry)} is not a valid environment name. Use lowercase letters, digits and hyphens, starting with a letter, at most 32 characters.`,
        configPath
      );
    }
    if (entry === 'pricing') {
      throw configError(
        'releases.environments entry "pricing" is reserved for the pricing file. Rename the environment and move .promptscript/releases/pricing.json to the new name.',
        configPath
      );
    }
    if (RESERVED_RELEASE_NAMES.has(entry) || WINDOWS_DEVICE_NAME_RE.test(entry)) {
      throw configError(
        `releases.environments entry "${entry}" is reserved as a file name. Choose another environment name.`,
        configPath
      );
    }
    if (names.includes(entry)) {
      throw configError(
        `releases.environments lists "${entry}" twice. Each environment appears once, in promotion order.`,
        configPath
      );
    }
    names.push(entry);
  }
  return names;
}

/**
 * Check `releases` and `policies` of a loaded config. `policies` are always parsed, so a
 * policy with an unknown kind fails every release command closed instead of being skipped.
 * @returns The environments in promotion order
 */
export function checkReleaseConfig(config: PromptScriptConfig, configPath: string): string[] {
  if (config.releases === undefined || config.releases === null) {
    throw configError(
      `Releases are not configured. Add the environments in promotion order to ${configPath}:\n${CONFIG_EXAMPLE}`,
      configPath
    );
  }
  const environments = checkEnvironments(config.releases.environments, configPath);
  const policies: unknown = config.policies ?? undefined;
  if (policies !== undefined && !Array.isArray(policies)) {
    throw configError(
      `policies in ${configPath} is not a list, so no release can run. List the policies or remove the key.`,
      configPath
    );
  }
  // Same settings as validate, so a role, environment or custom model parses the same way.
  const parsed = parsePolicies(policies, {
    governance: config.governance,
    releases: config.releases,
    models: config.models,
  });
  if (parsed.errors.length > 0) {
    throw configError(
      `policies in ${configPath} cannot be evaluated, so no release can run: ${parsed.errors.join('; ')}. Fix the policy definitions.`,
      configPath
    );
  }
  return environments;
}

/** The config file of the project root by name, ignoring `-c` and PROMPTSCRIPT_CONFIG. */
function discoveredConfigPath(root: string): string {
  const found = findConfigInDir(root);
  if (found === undefined) {
    throw configError(
      `No PromptScript configuration found in ${root}. Run prs init, or run the command in the project root.`,
      resolve(root, 'promptscript.yaml')
    );
  }
  return found;
}

/**
 * Load the project configuration and check it with {@link checkReleaseConfig}.
 * With `discover`, `-c` and PROMPTSCRIPT_CONFIG are ignored and the config file is found
 * by name in the project root, so nothing outside the repository picks the policies.
 */
export async function loadReleaseProject(
  options: ProjectPathOptions,
  { discover = false }: { discover?: boolean } = {}
): Promise<ReleaseProject> {
  const root = resolveProjectRoot(options);
  const found = discover
    ? discoveredConfigPath(root)
    : resolveProjectConfigPath(root, { ...options, cwd: options.cwd ?? root });
  const configPath = found ?? resolve(root, 'promptscript.yaml');
  const config = await loadEffectiveConfig(configPath);
  const environments = checkReleaseConfig(config, configPath);
  const paths = releasePaths(root);
  // Reads follow the same rule as writes: no release file is read through a link.
  await assertReleaseDirectories(paths);
  await assertExactCase(paths, environments);
  return { root, configPath, config, environments, paths };
}

/** Position of an environment in the promotion order, or PS5002. */
export function environmentIndex(project: ReleaseProject, environment: string): number {
  const index = project.environments.indexOf(environment);
  if (index < 0) {
    throw new ReleaseError(
      PS5002_UNKNOWN_ENVIRONMENT,
      `"${environment}" is not a release environment. Configured: ${project.environments.join(', ')}. Add it to releases.environments in ${project.configPath} or use one of those.`,
      project.configPath
    );
  }
  return index;
}

/**
 * Import excludes without the forced rules. An exclude is bound to a pinned import, but
 * a release ships the imported text too, so the forced rules scan it like any other.
 * The YAML is not schema-checked, so every level is guarded.
 */
function excludesWithoutForcedRules(excludes: unknown, forced: Set<string>): unknown {
  if (!Array.isArray(excludes)) return excludes;
  return excludes.map((entry: unknown) => {
    if (!isPlainObject(entry) || !Array.isArray(entry['rules'])) return entry;
    const rules: unknown[] = entry['rules'];
    return {
      ...entry,
      rules: rules.filter((rule) => typeof rule !== 'string' || !forced.has(rule)),
    };
  });
}

/**
 * Validator settings of a release: project settings, policies on, security rules forced.
 * `skipPolicies` and `ignoreHashes` are set after the spread, so no YAML key turns
 * PS030 or the reference hash checks off. Import excludes lose the forced rules and the
 * heuristics scan imported text too; `allowedPatterns` is the one exemption that stays.
 */
export function releaseValidatorConfig(config: PromptScriptConfig): ValidatorConfig {
  const base = buildValidatorConfig(config);
  const forced = new Set([
    ...Object.keys(FORCED_RELEASE_RULES),
    ...Object.values(FORCED_RELEASE_RULES),
    POLICY_RULE_ID,
    POLICY_RULE_NAME,
  ]);
  const rules: Record<string, 'error' | 'warning' | 'info' | 'off'> = { ...base.rules };
  for (const name of Object.values(FORCED_RELEASE_RULES)) {
    rules[name] = 'error';
  }
  if (rules[POLICY_RULE_NAME] === 'off') {
    delete rules[POLICY_RULE_NAME];
  }
  return {
    ...base,
    rules,
    disableRules: (base.disableRules ?? []).filter((rule) => !forced.has(rule)),
    excludes: excludesWithoutForcedRules(base.excludes, forced) as ValidatorConfig['excludes'],
    scanExternalContent: true,
    skipPolicies: false,
    ignoreHashes: false,
  };
}

/** Rule names that config turns off or downgrades, named in the error that forces them. */
function switchedOffRules(config: PromptScriptConfig): Set<string> {
  const names = new Set<string>();
  const validation: { rules?: Record<string, string>; disableRules?: string[] } =
    config.validation ?? {};
  for (const [id, name] of Object.entries(FORCED_RELEASE_RULES)) {
    const configured = validation.rules?.[name];
    const disabled = validation.disableRules?.some((rule) => rule === name || rule === id);
    if ((configured !== undefined && configured !== 'error') || disabled) {
      names.add(name);
    }
  }
  return names;
}

/** One bundle of a fresh compile, with the exact bytes the bundle target writes. */
export interface CompiledBundle {
  id: string;
  contentHash: string;
  description: string;
  text: string;
  bundle: PromptBundleV1;
}

export interface CompiledRelease {
  /** Entry file of the compilation, as the bundle index records it */
  source: string;
  /** Bundles sorted by id */
  bundles: CompiledBundle[];
  warnings: ReleaseDiagnostic[];
}

/** Thrown when the compile fails; the diagnostics go into the report. */
export class ReleaseCompileError extends Error {
  constructor(readonly diagnostics: ReleaseDiagnostic[]) {
    super('The source does not compile, so there is nothing to release.');
    this.name = 'ReleaseCompileError';
  }
}

function toDiagnostic(
  error: CompileError,
  switchedOff: Set<string>,
  configPath: string
): ReleaseDiagnostic {
  const forcedName = FORCED_RELEASE_RULES[error.code];
  const note =
    forcedName !== undefined && switchedOff.has(forcedName)
      ? ` (${basename(configPath)} switches ${forcedName} off or down; a release always runs it as an error)`
      : '';
  return {
    code: error.code,
    message: `${error.message}${note}`,
    ...toReleaseLocation(error.location),
  };
}

/**
 * Compile the project in memory with the bundle target, policies and the forced security
 * rules. The compiled `prompts/` directory is never read: the release set equals the source.
 */
export async function compileRelease(
  project: ReleaseProject,
  machineReadable: boolean
): Promise<CompiledRelease> {
  const { root, config } = project;
  const entryPath = resolve(root, config.input?.entry ?? './.promptscript/project.prs');
  if (!existsSync(entryPath)) {
    throw new ReleaseError(
      PS5001_RELEASE_CONFIG,
      `Entry file not found: ${entryPath}. Set input.entry in ${project.configPath} or run prs init.`,
      project.configPath
    );
  }
  const lockfile = await loadProjectLockfile(root);
  const vendorDir = resolve(root, '.promptscript/vendor');
  const registry = await resolveRegistryPath(config, { vendorDir, lockfile, readOnly: true });
  const compiler = new Compiler({
    resolver: {
      registryPath: resolveProjectPath(root, registry.path),
      localPath: resolve(root, '.promptscript'),
      projectRoot: root,
      vendorDir,
      readOnly: true,
      referenceRoots: registryReferenceRoots(registry),
      lockfile,
      registries: config.registries,
      skillTargets: config.skillTargets,
      skills: resolveUniversalDir(config.universalDir),
    },
    validator: releaseValidatorConfig(config),
    formatters: [{ name: 'bundle' }],
    customConventions: config.customConventions,
    models: config.models,
    logger: createDiffLogger(machineReadable),
  });

  const result = await compiler.compile(entryPath);
  if (!result.success) {
    const switchedOff = switchedOffRules(config);
    throw new ReleaseCompileError(
      result.errors.map((error) => toDiagnostic(error, switchedOff, project.configPath))
    );
  }

  // Without prompts the bundle target writes no index, so the entry file stands in.
  let source = project.paths.relative(entryPath);
  const bundles: CompiledBundle[] = [];
  for (const output of result.outputs.values()) {
    if (!hasPromptBundleSchemaLine(output.content)) continue;
    const parsed = JSON.parse(output.content) as Record<string, unknown>;
    if (parsed['$schema'] === PROMPT_BUNDLE_INDEX_SCHEMA_URL) {
      if (typeof parsed['source'] === 'string') source = parsed['source'];
    } else if (parsed['$schema'] === PROMPT_BUNDLE_SCHEMA_URL) {
      const bundle = parsed as unknown as PromptBundleV1;
      bundles.push({
        id: bundle.id,
        contentHash: bundle.contentHash,
        description: bundle.description,
        text: output.content,
        bundle,
      });
    }
  }
  bundles.sort((a, b) => compareCodeUnits(a.id, b.id));
  return {
    source,
    bundles,
    warnings: result.warnings.map((warning) => ({
      code: warning.ruleId,
      message: warning.message,
      ...toReleaseLocation(warning.location),
    })),
  };
}
