import { existsSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import {
  compareCodeUnits,
  isPlainObject,
  PSError,
  type PromptScriptConfig,
} from '@promptscript/core';
import { CONFIG_FILES, loadEffectiveConfig } from '../../config/loader.js';
import { ConsoleOutput } from '../../output/console.js';
import { createDefaultServices } from '../../services.js';
import { CODEOWNERS_LOCATIONS, checkGovernanceConfig } from '../../utils/governance-config.js';
import {
  GovernanceError,
  PS5101_GOVERNANCE_CONFIG,
  PS5106_CODEOWNERS_UNMANAGED,
  PS5107_CODEOWNERS_REFUSED,
} from '../../utils/governance-error.js';
import {
  resolveProjectConfigPath,
  resolveProjectRoot,
  type ProjectPathOptions,
} from '../../utils/project-config.js';
import { writeFileAtomic } from '../../utils/write-file-atomic.js';
import { assertSafeWritePath } from '../../utils/write-plan.js';
import { stripControlCharacters } from '../release/git.js';
import {
  codeownersMarker,
  mergedContent,
  overlapWarnings,
  readManaged,
  sameContent,
  type CodeownersHost,
} from './codeowners-file.js';
import {
  keepPaths,
  linkOnPath,
  readRepository,
  refuseLinks,
  repoPath,
  sortedUnique,
  type Findings,
  type OwnerLine,
  type Repository,
} from './codeowners-paths.js';
import { sourceLines } from './codeowners-sources.js';

export interface CodeownersOptions extends ProjectPathOptions {
  /** CODEOWNERS path relative to the repository root, one of {@link CODEOWNERS_LOCATIONS} */
  output?: string;
  /** Compare only, write nothing */
  check?: boolean;
  /** `text` (default) or `json` */
  format?: string;
}

export interface CodeownersDiagnostic {
  code?: string;
  message: string;
}

/** Report of `prs governance codeowners --format json`. */
export interface CodeownersReport {
  command: 'governance codeowners';
  success: boolean;
  check: boolean;
  /** CODEOWNERS path relative to the repository root */
  file?: string;
  /** `created`, `updated` or `unchanged`; with `--check`, `unchanged` or `outdated` */
  status?: 'created' | 'updated' | 'unchanged' | 'outdated';
  warnings: CodeownersDiagnostic[];
  errors: CodeownersDiagnostic[];
}

const GITLAB_SECTION = '[PromptScript]';
// Hosts differ on everything else, a space included: `\ ` may or may not escape it.
const SAFE_PATH_RE = /^[A-Za-z0-9._/@+-]+$/;
const GOVERNANCE_EXAMPLE =
  "governance:\n  admins: ['@acme/prompt-platform']\n  roles:\n    legal: ['@acme/legal']";

/**
 * CODEOWNERS files a host reads before the given one. GitHub reads `.github/`, the root,
 * then `docs/`; GitLab the root, `docs/`, then `.gitlab/`. Only the first file counts.
 */
const READ_BEFORE: Readonly<Record<string, readonly string[]>> = {
  '.github/CODEOWNERS': [],
  CODEOWNERS: ['.github/CODEOWNERS'],
  'docs/CODEOWNERS': ['.github/CODEOWNERS', 'CODEOWNERS'],
  '.gitlab/CODEOWNERS': ['CODEOWNERS', 'docs/CODEOWNERS'],
};

/** The governance section with admins, or PS5101 with every problem and an example. */
function requireGovernance(
  config: PromptScriptConfig,
  configPath: string
): Record<string, unknown> & { admins: string[] } {
  const governance: unknown = config.governance;
  const problems = checkGovernanceConfig(governance);
  if (!isPlainObject(governance)) {
    problems.push(`${configPath} has no governance section.`);
  } else if (!Array.isArray(governance['admins']) || governance['admins'].length === 0) {
    problems.push(
      'governance.admins is missing. CODEOWNERS needs owners for the config and the approvals root.'
    );
  }
  if (problems.length > 0 || !isPlainObject(governance)) {
    throw new GovernanceError(
      PS5101_GOVERNANCE_CONFIG,
      `${problems.join('\n')}\nFix the governance section of ${configPath}, for example:\n${GOVERNANCE_EXAMPLE}`,
      configPath
    );
  }
  return governance as Record<string, unknown> & { admins: string[] };
}

/**
 * Every config name the loader tries and the lockfile of the project, present or not,
 * and the config file and its `extends` chain inside the repository.
 */
async function configLines(
  repo: Repository,
  files: string[],
  admins: string[],
  findings: Findings
): Promise<OwnerLine[]> {
  const base = repo.project === '' ? '' : `${repo.project}/`;
  const chain = sortedUnique(
    files.flatMap((file) => {
      const path = repoPath(file, repo);
      return path === undefined ? [] : [path];
    })
  );
  const kept = await keepPaths(chain, repo, findings);
  return sortedUnique([
    ...[...CONFIG_FILES, 'promptscript.lock'].map((name) => `${base}${name}`),
    ...kept,
  ]).map((path) => ({ path: `/${path}`, owners: admins }));
}

/** A `governance.codeowners.protect` entry as a root-relative path, or undefined when refused. */
function protectPath(path: string): string | undefined {
  const segments = path.split('/').filter((segment) => segment !== '.');
  while (segments[0] === '') segments.shift();
  while (segments.at(-1) === '') segments.pop();
  if (segments.length === 0 || segments.some((segment) => segment === '' || segment === '..')) {
    return undefined;
  }
  return `/${segments.join('/')}`;
}

/** The `governance.codeowners.protect` lines; refused entries go to `refused`. */
function protectLines(protect: unknown, admins: string[], refused: string[]): OwnerLine[] {
  const paths: string[] = [];
  for (const entry of Array.isArray(protect) ? (protect as string[]) : []) {
    const path = protectPath(entry);
    if (path === undefined) {
      refused.push(
        `governance.codeowners.protect has ${JSON.stringify(entry)}, which is not a path inside the repository.`
      );
    } else {
      paths.push(path);
    }
  }
  // A protect path may be a file or a directory, so it counts as a directory where that matters.
  return sortedUnique(paths).map((path) => ({ path, owners: admins, directory: true }));
}

/** The text of the lines; on GitLab a directory gets a second line with a trailing `/`. */
function renderLines(lines: OwnerLine[], host: CodeownersHost): string[] {
  return lines.flatMap((line) => {
    const owners = line.owners.join(' ');
    // GitLab reads a pattern without a glob or a trailing slash as one exact file.
    return host === 'gitlab' && line.directory === true
      ? [`${line.path} ${owners}`, `${line.path}/ ${owners}`]
      : [`${line.path} ${owners}`];
  });
}

interface Section {
  marker: string;
  text: string;
  /** Root-relative paths of the prompt file lines */
  promptPaths: string[];
  /** Repository paths a line needs that Git does not track */
  unowned: string[];
  /** Root-relative `protect` paths */
  protect: string[];
}

/**
 * The generated section, from the marker line to the end of the file. CODEOWNERS uses the
 * last matching line, so the lines that pick the authority come last: prompt files, their
 * sources, `protect`, then approvals, roles, releases, vendor, config and CODEOWNERS files.
 */
async function buildSection(
  repo: Repository,
  host: CodeownersHost,
  config: PromptScriptConfig,
  configPath: string,
  files: string[],
  warn: (message: string) => void
): Promise<Section> {
  const governance = requireGovernance(config, configPath);
  const admins = sortedUnique(governance.admins);
  const codeowners = isPlainObject(governance['codeowners']) ? governance['codeowners'] : {};
  const roles = isPlainObject(governance['roles']) ? governance['roles'] : {};
  const base = repo.project === '' ? '' : `/${repo.project}`;
  const findings: Findings = { refused: [], unowned: [], warn };
  const { refused } = findings;

  const { prompts, sources } =
    codeowners['prompts'] === false
      ? { prompts: [], sources: [] }
      : await sourceLines(repo, config, configPath, admins, findings);
  const roleLines = Object.keys(roles)
    .sort(compareCodeUnits)
    .map((role) => ({
      // Role names are lowercase by the config check, the exact bytes the approvals use.
      path: `${base}/.promptscript/approvals/${role}`,
      owners: sortedUnique(roles[role] as string[]),
      directory: true,
    }));

  const protect = protectLines(codeowners['protect'], admins, refused);
  const fixed: OwnerLine[] = [
    { path: `${base}/.promptscript/approvals`, owners: admins, directory: true },
    ...roleLines,
    { path: `${base}/.promptscript/releases`, owners: admins, directory: true },
    { path: `${base}/.promptscript/vendor`, owners: admins, directory: true },
  ];
  const configs = await configLines(repo, files, admins, findings);
  // A link there would leave the path itself owned and its target not.
  await refuseLinks(
    [...fixed, ...configs].map((line) => line.path.slice(1)),
    repo,
    findings
  );
  const lines: OwnerLine[] = [
    ...prompts,
    ...sources,
    ...protect,
    ...fixed,
    ...configs,
    ...CODEOWNERS_LOCATIONS.map((location) => ({ path: `/${location}`, owners: admins })),
  ];
  for (const line of lines.filter((candidate) => !SAFE_PATH_RE.test(candidate.path))) {
    refused.push(
      `The path ${JSON.stringify(line.path)} has a character CODEOWNERS hosts read differently.`
    );
  }
  if (refused.length > 0) {
    throw new GovernanceError(
      PS5107_CODEOWNERS_REFUSED,
      `${sortedUnique(refused).join('\n')}\nNothing was written. Use @user, @org/team or email owners, and paths of letters, digits, ".", "_", "-", "/", "@" and "+" that Git has as they are.`,
      configPath
    );
  }

  const marker = codeownersMarker(repo.project === '' ? '.' : repo.project);
  const header = host === 'gitlab' ? [marker, GITLAB_SECTION] : [marker];
  return {
    marker,
    text: `${[...header, ...renderLines(lines, host)].join('\n')}\n`,
    promptPaths: prompts.map((line) => line.path),
    unowned: findings.unowned,
    protect: protect.map((line) => line.path),
  };
}

interface CodeownersResult {
  file: string;
  status: NonNullable<CodeownersReport['status']>;
  /** Why the file is outdated, with `--check` */
  problem?: string;
}

/** `--output`, else `governance.codeowners.output`, else `.github/CODEOWNERS`; PS5107 for others. */
function outputLocation(options: CodeownersOptions, config: PromptScriptConfig): string {
  const governance: unknown = config.governance;
  const configured =
    isPlainObject(governance) && isPlainObject(governance['codeowners'])
      ? governance['codeowners']['output']
      : undefined;
  const output =
    options.output ?? (typeof configured === 'string' ? configured : '.github/CODEOWNERS');
  if (!(CODEOWNERS_LOCATIONS as readonly string[]).includes(output)) {
    throw new GovernanceError(
      PS5107_CODEOWNERS_REFUSED,
      `${JSON.stringify(output)} is not a place a Git host reads CODEOWNERS from. Use one of: ${CODEOWNERS_LOCATIONS.join(', ')}.`
    );
  }
  return output;
}

/** Whether a `protect` path covers a repository path, as CODEOWNERS would match it. */
function isProtected(path: string, protect: string[]): boolean {
  return protect.some(
    (covering) => `/${path}` === covering || `/${path}`.startsWith(`${covering}/`)
  );
}

function checkResult(
  output: string,
  current: string | undefined,
  next: string,
  earlier: string[],
  section: Section
): CodeownersResult {
  const stale: string[] = [];
  if (current === undefined) stale.push(`${output} does not exist.`);
  else if (!sameContent(current, next)) stale.push(`${output} is out of date.`);
  for (const location of earlier) {
    stale.push(
      `${location} exists, and a host reads it before ${output}, so the generated lines do not apply.`
    );
  }
  const problems =
    stale.length > 0
      ? [`${stale.join(' ')} Run prs governance codeowners and commit the result.`]
      : [];
  for (const path of section.unowned.filter((unowned) => !isProtected(unowned, section.protect))) {
    problems.push(
      `Git does not track ${path} and no governance.codeowners.protect path covers it, so nobody has to review a change to it. Track it, or put its directory and the files that install it in protect.`
    );
  }
  if (problems.length === 0) return { file: output, status: 'unchanged' };
  return { file: output, status: 'outdated', problem: problems.join(' ') };
}

async function runCodeowners(
  options: CodeownersOptions,
  warn: (message: string) => void
): Promise<CodeownersResult> {
  const root = resolveProjectRoot(options);
  // Same discovery as the release commands: --config, then PROMPTSCRIPT_CONFIG, then the names.
  const configPath =
    resolveProjectConfigPath(root, { ...options, cwd: options.cwd ?? root }) ??
    resolve(root, 'promptscript.yaml');
  const files: string[] = [];
  const config = await loadEffectiveConfig(configPath, undefined, files);
  const repo = await readRepository(root);
  const output = outputLocation(options, config);
  const host: CodeownersHost = output === '.gitlab/CODEOWNERS' ? 'gitlab' : 'github';
  const link = await linkOnPath(repo.top, output);
  if (link !== undefined) {
    throw new GovernanceError(
      PS5107_CODEOWNERS_REFUSED,
      `${output} goes through the symbolic link ${link}, so the host reads another path than prs writes. Replace the link with a regular directory or file.`,
      output
    );
  }

  const section = await buildSection(repo, host, config, configPath, files, warn);
  const path = join(repo.top, output);
  const managed = await readManaged(path, output, section.marker, host);
  for (const message of overlapWarnings(managed?.above ?? [], section.promptPaths, output, host)) {
    warn(message);
  }
  const earlier = (READ_BEFORE[output] ?? []).filter((location) =>
    existsSync(join(repo.top, location))
  );
  const next = mergedContent(managed, section.text);
  if (options.check === true) {
    return checkResult(output, managed?.current, next, earlier, section);
  }

  for (const location of earlier) {
    warn(
      `${location} exists, and a host reads it before ${output}, so the generated lines do not apply. Remove ${location} or set governance.codeowners.output to it.`
    );
  }
  if (managed !== undefined && sameContent(managed.current, next)) {
    return { file: output, status: 'unchanged' };
  }
  await assertSafeWritePath(path, { ...createDefaultServices(), cwd: repo.top });
  await mkdir(dirname(path), { recursive: true });
  // latin1 maps each character back to the byte it was read from, so the lines above stay exact.
  writeFileAtomic(path, Buffer.from(next, 'latin1'), 0o644);
  return { file: output, status: managed === undefined ? 'created' : 'updated' };
}

function diagnostic(error: unknown): CodeownersDiagnostic {
  if (error instanceof PSError) return { code: error.code, message: error.message };
  return { message: error instanceof Error ? error.message : String(error) };
}

function printReport(report: CodeownersReport, json: boolean): void {
  if (json) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }
  for (const warning of report.warnings)
    ConsoleOutput.warn(stripControlCharacters(warning.message));
  for (const error of report.errors) {
    const text = error.message.split('\n').map(stripControlCharacters).join('\n');
    ConsoleOutput.error(error.code === undefined ? text : `${error.code}: ${text}`);
  }
  if (report.success) ConsoleOutput.success(`${report.file}: ${report.status}`);
}

/** Exit code 2 only for PS5106 outside `--check`, which tells CI apart from a real error. */
function exitCodeFor(error: unknown, check: boolean): number {
  return !check && error instanceof GovernanceError && error.code === PS5106_CODEOWNERS_UNMANAGED
    ? 2
    : 1;
}

/**
 * `prs governance codeowners`: write the CODEOWNERS lines that make the governance section
 * binding. Exit code 0 when written or current, 1 on an error or an outdated file with
 * `--check`, 2 when the file is not managed by prs (PS5106). With `--check` every failure,
 * PS5106 included, exits with 1.
 */
export async function governanceCodeownersCommand(options: CodeownersOptions): Promise<void> {
  if (options.format !== undefined && options.format !== 'text' && options.format !== 'json') {
    ConsoleOutput.error(
      `Invalid output format: ${stripControlCharacters(options.format)}. Expected text or json.`
    );
    process.exitCode = 1;
    return;
  }
  const check = options.check === true;
  const report: CodeownersReport = {
    command: 'governance codeowners',
    success: true,
    check,
    warnings: [],
    errors: [],
  };
  let exitCode = 0;
  try {
    const result = await runCodeowners(options, (message) => report.warnings.push({ message }));
    report.file = result.file;
    report.status = result.status;
    if (result.problem !== undefined) {
      report.success = false;
      report.errors.push({ message: result.problem });
      exitCode = 1;
    }
  } catch (error) {
    report.success = false;
    report.errors.push(diagnostic(error));
    exitCode = exitCodeFor(error, check);
  }
  printReport(report, options.format === 'json');
  process.exitCode = exitCode;
}
