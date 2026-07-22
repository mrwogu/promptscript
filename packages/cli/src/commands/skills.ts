import { writeFile, readFile, readdir, mkdtemp, rm } from 'fs/promises';
import { resolve, join, basename, dirname } from 'path';
import { existsSync } from 'fs';
import { tmpdir } from 'os';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';
import { parse } from '@promptscript/parser';
import type { SkillsAddOptions, SkillsRemoveOptions, SkillsUpdateOptions } from '../types.js';
import { loadConfig, findConfigFile } from '../config/loader.js';
import { createSpinner, ConsoleOutput } from '../output/console.js';
import type { Lockfile, LockfileDependency } from '@promptscript/core';
import { LOCKFILE_VERSION, isValidLockfile } from '@promptscript/core';
import { LOCKFILE_PATH, resolveRemoteDependency } from './lock.js';
import { collectRemoteImports, type RemoteImport } from './lock-scanner.js';
import {
  validateSkillFrontmatter,
  formatSkillValidationIssues,
  hashContent,
  createGitRegistry,
  normalizeGitUrl,
  type SkillValidationIssue,
} from '@promptscript/resolver';

/**
 * Pattern to match remote source strings.
 * Accepts `github.com/owner/repo` or `github.com/owner/repo/path/to/SKILL.md`.
 * Rejects local paths starting with `./` or `../`.
 */
const REMOTE_SOURCE_PATTERN = /^[a-zA-Z0-9][\w.-]*\.[a-zA-Z]{2,}\/.+/;

interface ParsedSkillSource {
  path: string;
  version: string;
}

function parseSkillSource(source: string): ParsedSkillSource {
  const versionSeparator = source.lastIndexOf('@');
  if (versionSeparator === -1) {
    return { path: source, version: 'latest' };
  }

  const version = source.slice(versionSeparator + 1);
  if (version.length === 0) {
    throw new Error(`Invalid source: "${source}". Version after @ cannot be empty.`);
  }
  return { path: source.slice(0, versionSeparator), version };
}

function toDependencyPin(dependency: LockfileDependency): LockfileDependency {
  return {
    version: dependency.version,
    commit: dependency.commit,
    integrity: dependency.integrity,
  };
}

function resolveSkillDependency(
  repoUrl: string,
  requestedVersions: string[],
  existing: LockfileDependency | undefined,
  forceUpdate: boolean,
  gitUrl: string | undefined
): Promise<LockfileDependency> {
  return gitUrl
    ? resolveRemoteDependency(repoUrl, requestedVersions, existing, forceUpdate, gitUrl)
    : resolveRemoteDependency(repoUrl, requestedVersions, existing, forceUpdate);
}

function isSkillMetadataEntry(key: string, dependency: LockfileDependency): boolean {
  return dependency.source === 'md' && !key.includes('://');
}

function canonicalRepoUrl(repoUrl: string): string {
  const withProtocol =
    /^[a-z][a-z\d+.-]*:\/\//i.test(repoUrl) || repoUrl.startsWith('git@')
      ? repoUrl
      : `https://${repoUrl}`;
  return normalizeGitUrl(withProtocol).replace(/\.git$/i, '');
}

function findSkillOwnerEntry(
  lockfile: Lockfile,
  repoUrl: string
): [string, LockfileDependency] | undefined {
  return Object.entries(lockfile.dependencies).find(
    ([key, dependency]) =>
      dependency.skills !== undefined && canonicalRepoUrl(key) === canonicalRepoUrl(repoUrl)
  );
}

function findRepoEntry(
  lockfile: Lockfile,
  repoUrl: string
): [string, LockfileDependency] | undefined {
  return Object.entries(lockfile.dependencies).find(
    ([key]) => canonicalRepoUrl(key) === canonicalRepoUrl(repoUrl)
  );
}

async function collectProjectRemoteImports(entryFile?: string): Promise<RemoteImport[]> {
  const configFile = findConfigFile();
  const config = configFile ? await loadConfig() : undefined;
  const projectRoot = process.cwd();
  const entryFiles = new Set<string>();
  if (entryFile) {
    entryFiles.add(resolve(entryFile));
  }
  if (config) {
    if (config.input?.entry) {
      entryFiles.add(resolve(projectRoot, config.input.entry));
    }
    for (const build of Object.values(config.builds ?? {})) {
      if (build.entry) {
        entryFiles.add(resolve(projectRoot, build.entry));
      }
    }
    const defaultEntry = resolve(projectRoot, '.promptscript/project.prs');
    if (!config.input?.entry && (existsSync(defaultEntry) || entryFiles.size === 0)) {
      entryFiles.add(defaultEntry);
    }
  } else if (!entryFile) {
    const defaultEntry = resolve(projectRoot, '.promptscript/project.prs');
    if (existsSync(defaultEntry)) {
      entryFiles.add(defaultEntry);
    } else {
      const promptscriptDir = resolve(projectRoot, '.promptscript');
      if (existsSync(promptscriptDir)) {
        const entries = await readdir(promptscriptDir);
        const prsFiles = entries.filter((entry) => entry.endsWith('.prs'));
        if (prsFiles.length === 1) {
          entryFiles.add(resolve(promptscriptDir, prsFiles[0]!));
        }
      }
    }
  }

  const imports: RemoteImport[] = [];
  for (const projectEntry of entryFiles) {
    imports.push(
      ...(await collectRemoteImports(projectEntry, {
        localPath: resolve(projectRoot, '.promptscript'),
        registries: config?.registries,
        strict: true,
        deduplicate: false,
        includeLocations: true,
      }))
    );
  }

  return imports.filter(
    (remoteImport, index) =>
      imports.findIndex(
        (candidate) =>
          candidate.repoUrl === remoteImport.repoUrl &&
          candidate.path === remoteImport.path &&
          candidate.version === remoteImport.version &&
          candidate.rawSource === remoteImport.rawSource &&
          candidate.sourceFile === remoteImport.sourceFile &&
          candidate.sourceLine === remoteImport.sourceLine
      ) === index
  );
}

/**
 * Normalize a user-provided skill source so the internal representation is
 * canonical (no scheme, no `.git` suffix, no SSH form, no trailing slash).
 *
 * Accepts:
 *   - `https://github.com/owner/repo/path`
 *   - `http://github.com/owner/repo/path`
 *   - `git@github.com:owner/repo.git`
 *   - `github.com/owner/repo/path`
 *
 * Returns the trimmed value when nothing matches, so downstream validation
 * still produces a deterministic error.
 */
export function normalizeSkillSource(input: string): string {
  let source = input.trim();
  if (source.length === 0) return source;

  // SSH form: git@host:owner/repo[.git]
  const sshMatch = source.match(/^git@([^:]+):(.+)$/);
  if (sshMatch) {
    source = `${sshMatch[1]}/${sshMatch[2]}`;
  } else {
    source = source.replace(/^https?:\/\//i, '');
  }

  source = source.replace(/\.git(?=\/|@|$)/i, '');
  while (source.endsWith('/')) {
    source = source.slice(0, -1);
  }
  return source;
}

function extractSshCloneUrl(input: string): string | undefined {
  const match = input.trim().match(/^git@([^:]+):([^/]+)\/([^/@]+)/);
  if (!match) {
    return undefined;
  }
  const repo = match[3]!.replace(/\.git$/i, '');
  return `git@${match[1]}:${match[2]}/${repo}.git`;
}

/**
 * Extract the sub-path inside the repo from a normalized source.
 * `github.com/owner/repo/foo/bar/SKILL.md` -> `foo/bar/SKILL.md`
 * `github.com/owner/repo` -> ''
 */
function extractSubPath(source: string): string {
  const parts = parseSkillSource(source)
    .path.replace(/^https?:\/\//, '')
    .split('/');
  return parts.length > 3 ? parts.slice(3).join('/') : '';
}

function extractSkillFilePath(source: string): string | undefined {
  const subPath = extractSubPath(source);
  if (!subPath) return 'SKILL.md';
  return subPath.toLowerCase().endsWith('.md') ? subPath : `${subPath}/SKILL.md`;
}

/**
 * Derive the on-disk skill folder name from a source path. Skills are written
 * to `<format-dir>/skills/<name>/SKILL.md` where `<name>` is the basename of
 * the SKILL.md's parent directory (matching the Agent Skills spec - the
 * frontmatter `name` MUST match this directory).
 *
 * Returns `undefined` for imports that target the repository root.
 */
function deriveSkillFolderName(source: string): string | undefined {
  const subPath = extractSubPath(source);
  if (!subPath) return basename(parseSkillSource(source).path);
  if (!subPath.toLowerCase().endsWith('.md')) return basename(subPath);
  const parent = dirname(subPath);
  if (parent === '.' || parent === '') return basename(parseSkillSource(source).path);
  return basename(parent);
}

/**
 * Collect skill folder names already in use by other md-sourced entries in
 * the lockfile. Used to detect collisions (two skills resolving to the same
 * `<format>/skills/<name>/` directory).
 */
function collectExistingSkillNames(lockfile: Lockfile, exclude?: string): Set<string> {
  const names = new Set<string>();
  for (const [key, dep] of Object.entries(lockfile.dependencies)) {
    if (!isSkillMetadataEntry(key, dep)) continue;
    if (exclude && key === exclude) continue;
    const name = deriveSkillFolderName(key);
    if (name) names.add(name);
  }
  return names;
}

/**
 * Result of fetching and validating a remote SKILL.md.
 */
interface FetchedSkill {
  /** Raw file content as read from the cloned repo */
  content: string;
  /** SRI integrity hash (`sha256-<hex>`) of the content */
  integrity: string;
  /** Frontmatter validation issues (errors + warnings) */
  issues: SkillValidationIssue[];
  /** True when no errors were reported */
  valid: boolean;
}

/**
 * Fetch a single SKILL.md from a remote source by performing a shallow clone
 * into an OS tmp directory, then validate its frontmatter and compute the
 * content integrity hash. Always cleans up the temp clone, even on error.
 *
 * Repository-root imports validate `<repo>/SKILL.md`.
 */
async function fetchAndValidateRemoteSkill(
  source: string,
  options: {
    commit: string;
    existingNames: ReadonlySet<string>;
    gitUrl?: string;
    validateFrontmatter: boolean;
    version: string;
  }
): Promise<FetchedSkill | undefined> {
  const skillFilePath = extractSkillFilePath(source);
  if (!skillFilePath || !deriveSkillFolderName(source)) {
    return undefined;
  }

  const repoUrl = options.gitUrl ?? extractRepoUrl(source);
  const tmp = await mkdtemp(join(tmpdir(), 'prs-skill-validate-'));
  const repoName = basename(parseSkillSource(source).path.split('/')[2]!);
  const cloneDir = !skillFilePath.includes('/') ? join(tmp, repoName) : tmp;
  try {
    const gitRegistry = createGitRegistry({ url: repoUrl });
    const cloneRef =
      options.version === 'latest' || /^[0-9a-f]{40}$/i.test(options.version)
        ? undefined
        : options.version;
    await gitRegistry.cloneAtTag(repoUrl, cloneRef, cloneDir);
    await gitRegistry.checkoutCommit(cloneDir, options.commit);

    const subPath = extractSubPath(source);
    if (!subPath.toLowerCase().endsWith('.md') && existsSync(join(cloneDir, `${subPath}.prs`))) {
      return {
        content: '',
        integrity: '',
        valid: false,
        issues: [
          {
            severity: 'error',
            code: 'SK000',
            message: `Path '${subPath}' resolves to PromptScript source '${subPath}.prs', not a SKILL.md directory.`,
          },
        ],
      };
    }

    const filePath = join(cloneDir, skillFilePath);
    let content: string;
    try {
      content = await readFile(filePath, 'utf-8');
    } catch {
      return {
        content: '',
        integrity: '',
        valid: false,
        issues: [
          {
            severity: 'error',
            code: 'SK000',
            message: `File '${skillFilePath}' does not exist in ${repoUrl} at ${options.version}.`,
          },
        ],
      };
    }
    const integrity = hashContent(Buffer.from(content, 'utf-8'));
    if (!options.validateFrontmatter) {
      return { content, integrity, valid: true, issues: [] };
    }
    const result = validateSkillFrontmatter(content, {
      filePath,
      existingNames: options.existingNames,
    });
    return { content, integrity, valid: result.valid, issues: result.issues };
  } finally {
    await rm(tmp, { recursive: true, force: true }).catch(() => {
      // best-effort cleanup
    });
  }
}

/**
 * Print validation issues to the console, grouped by severity.
 */
function printValidationIssues(issues: readonly SkillValidationIssue[]): void {
  if (issues.length === 0) return;
  ConsoleOutput.newline();
  const formatted = formatSkillValidationIssues(issues);
  for (const line of formatted.split('\n')) {
    if (line.includes('✗')) {
      ConsoleOutput.error(line);
    } else {
      ConsoleOutput.warn(line);
    }
  }
}

/**
 * Directives that appear in the header section of a `.prs` file.
 * The `@use` insertion point is calculated as the line after the last
 * occurrence of any of these directives.
 */
const HEADER_DIRECTIVES = ['@use ', '@inherit ', '@meta '];

/**
 * Extract the base repository URL from a skill source path.
 * Takes the first 3 path segments (host/owner/repo) and prefixes with https://.
 *
 * Examples:
 *   `github.com/owner/repo/skills/name` → `https://github.com/owner/repo`
 *   `github.com/owner/repo/path/to/skill` → `https://github.com/owner/repo`
 */
function extractRepoUrl(source: string): string {
  const parts = parseSkillSource(source)
    .path.replace(/^https?:\/\//, '')
    .split('/');
  if (parts.length >= 3) {
    return `https://${parts[0]}/${parts[1]}/${parts[2]}`;
  }
  return `https://${source}`;
}

/**
 * Validate that a source string is a remote reference (not a local path).
 * Returns an error message string on failure, or `undefined` on success.
 */
function validateRemoteSource(source: string): string | undefined {
  if (source.startsWith('./') || source.startsWith('../')) {
    return 'Local paths are not supported. Use a remote source (e.g., github.com/owner/repo/path/SKILL.md)';
  }
  if (!REMOTE_SOURCE_PATTERN.test(source)) {
    return `Invalid source: "${source}". Expected a remote path (e.g., github.com/owner/repo/path/SKILL.md)`;
  }
  const sourcePath = parseSkillSource(source).path;
  if (sourcePath.split('/').length < 4) {
    return `Invalid source: "${source}". Include the path to a skill file or directory inside the repository.`;
  }
  const pathSegments = sourcePath.replace(/\\/g, '/').split('/').slice(1);
  if (pathSegments.some((segment) => segment === '.' || segment === '..')) {
    return `Invalid source: "${source}". Path traversal segments are not allowed.`;
  }

  // Reject GitHub-style web URLs that include a tree/<ref> or blob/<ref>
  // segment immediately after host/owner/repo. These come from copying
  // a URL out of a browser and they are not valid repository paths.
  const parts = source.split('/');
  if (parts.length > 4 && (parts[3] === 'tree' || parts[3] === 'blob')) {
    const kind = parts[3];
    const ref = parts[4] ?? '<ref>';
    const stripped = [...parts.slice(0, 3), ...parts.slice(5)].join('/').replace(/\/$/, '');
    const example = stripped.length > 0 ? stripped : parts.slice(0, 3).join('/');
    return `Invalid source: "${source}". Drop the "${kind}/${ref}" segment copied from the GitHub web UI (use "${example}" instead).`;
  }

  return undefined;
}

/**
 * Resolve the target `.prs` file to modify.
 *
 * Priority:
 * 1. `--file` flag
 * 2. `input.entry` from config
 * 3. Single `.prs` file in `.promptscript/`
 */
async function resolveEntryFile(fileFlag?: string): Promise<string> {
  // 1. Explicit flag
  if (fileFlag) {
    const resolved = resolve(fileFlag);
    if (!existsSync(resolved)) {
      throw new Error(`File not found: ${resolved}`);
    }
    return resolved;
  }

  // 2. Config entry
  const configFile = findConfigFile();
  if (configFile) {
    try {
      const config = await loadConfig();
      if (config.input?.entry) {
        const entryPath = resolve(config.input.entry);
        if (existsSync(entryPath)) {
          return entryPath;
        }
      }
    } catch {
      // Config failed to load — fall through to directory scan
    }
  }

  // 3. Scan .promptscript/ for a single .prs file
  const promptscriptDir = resolve('.promptscript');
  if (existsSync(promptscriptDir)) {
    const entries = await readdir(promptscriptDir);
    const prsFiles = entries.filter((f) => f.endsWith('.prs'));
    if (prsFiles.length === 1) {
      return resolve(promptscriptDir, prsFiles[0]!);
    }
    if (prsFiles.length > 1) {
      // Check for project.prs as default
      if (prsFiles.includes('project.prs')) {
        return resolve(promptscriptDir, 'project.prs');
      }
      throw new Error(
        `Multiple .prs files found in .promptscript/. Use --file to specify which one.`
      );
    }
  }

  throw new Error('No .prs file found. Use --file to specify the target file, or run: prs init');
}

/**
 * Find the insertion point for a new `@use` directive.
 * Returns the line index (0-based) where the new line should be inserted.
 *
 * Strategy: Find the last line that starts with a header directive
 * (`@use`, `@inherit`, `@meta {`, or the closing `}` of a `@meta` block),
 * and insert after it.
 */
function findInsertionPoint(lines: string[]): number {
  let lastDirectiveLine = -1;
  let metaBraceDepth = 0;
  let inString = false;
  let inTripleString = false;

  const braceDelta = (line: string): number => {
    let depth = 0;
    for (let index = 0; index < line.length; index++) {
      if (!inString && line.slice(index, index + 3) === '"""') {
        inTripleString = !inTripleString;
        index += 2;
        continue;
      }
      if (inTripleString) {
        continue;
      }
      if (line[index] === '"' && line[index - 1] !== '\\') {
        inString = !inString;
        continue;
      }
      if (!inString) {
        if (line[index] === '#' || line.slice(index, index + 2) === '//') {
          break;
        }
        if (line[index] === '{') depth++;
        if (line[index] === '}') depth--;
      }
    }
    return depth;
  };

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i]!.trim();
    if (trimmed === '' || trimmed.startsWith('#') || trimmed.startsWith('//')) {
      continue;
    }

    if (trimmed.startsWith('@meta ') || trimmed === '@meta{' || trimmed === '@meta {') {
      lastDirectiveLine = i;
      metaBraceDepth = braceDelta(trimmed);
      continue;
    }

    if (metaBraceDepth > 0) {
      metaBraceDepth += braceDelta(trimmed);
      lastDirectiveLine = i;
      continue;
    }

    if (HEADER_DIRECTIVES.some((directive) => trimmed.startsWith(directive))) {
      lastDirectiveLine = i;
      continue;
    }

    break;
  }

  // Insert after the last directive line.
  // If no directives found, insert at line 0.
  return lastDirectiveLine + 1;
}

/**
 * Extract the skill name from a `@use` line.
 * `@use github.com/foo/bar/SKILL.md` -> `github.com/foo/bar/SKILL.md`
 * `@use github.com/foo/bar/SKILL.md as myskill` -> `github.com/foo/bar/SKILL.md`
 */
function extractUsePath(line: string): string | undefined {
  const trimmed = line.trim();
  if (!trimmed.startsWith('@use ')) return undefined;
  const rest = trimmed.slice(5).trim();
  // Strip alias: `path as alias` -> `path`
  const parts = rest.split(/\s+as\s+/);
  return parts[0]?.trim();
}

function findUseEndLine(lines: string[], startLine: number): number {
  let depth = 0;
  let foundParams = false;
  let inString = false;

  for (let lineIndex = startLine; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex]!;
    for (let index = 0; index < line.length; index++) {
      if (line[index] === '"' && line[index - 1] !== '\\') {
        inString = !inString;
        continue;
      }
      if (inString) {
        continue;
      }
      if (line[index] === '#' || line.slice(index, index + 2) === '//') {
        break;
      }
      if (line[index] === '(') {
        foundParams = true;
        depth++;
      } else if (line[index] === ')') {
        depth--;
      }
    }
    if (!foundParams || depth === 0) {
      return lineIndex;
    }
  }

  return startLine;
}

/**
 * Load the lockfile from disk.
 */
async function loadLockfile(): Promise<Lockfile> {
  const defaultLockfile: Lockfile = { version: LOCKFILE_VERSION, dependencies: {} };
  if (!existsSync(LOCKFILE_PATH)) {
    return defaultLockfile;
  }
  let parsed: unknown;
  try {
    const raw = await readFile(LOCKFILE_PATH, 'utf-8');
    parsed = parseYaml(raw, { maxAliasCount: 100 });
  } catch (error) {
    throw new Error(
      `Cannot read ${LOCKFILE_PATH}: ${error instanceof Error ? error.message : String(error)}`,
      { cause: error }
    );
  }
  if (!isValidLockfile(parsed)) {
    throw new Error(`Invalid ${LOCKFILE_PATH}. Run "prs lock" to regenerate it.`);
  }
  return parsed;
}

/**
 * Save the lockfile to disk.
 */
async function saveLockfile(lockfile: Lockfile): Promise<void> {
  await writeFile(LOCKFILE_PATH, stringifyYaml(lockfile), 'utf-8');
}

/**
 * Add a remote skill to the project.
 *
 * 1. Validates source is a remote path
 * 2. Resolves target .prs file
 * 3. Inserts `@use <source>` directive
 * 4. Updates promptscript.lock with `source: 'md'` entry
 */
export async function skillsAddCommand(
  rawSource: string,
  options: SkillsAddOptions
): Promise<void> {
  const spinner = createSpinner('Adding skill...').start();

  try {
    // Reject plain HTTP early (security): git over plaintext exposes the
    // repo to MITM. Always require HTTPS or SSH.
    if (/^http:\/\//i.test(rawSource.trim())) {
      spinner.fail('Plain HTTP sources are not allowed (security)');
      ConsoleOutput.error(
        'Use https:// or git@host:owner/repo. Cleartext git transport is rejected to prevent man-in-the-middle attacks.'
      );
      process.exitCode = 1;
      return;
    }

    // Normalize the user-provided source before validating so we treat
    // `https://github.com/foo/bar`, `git@github.com:foo/bar.git`, and
    // `github.com/foo/bar` as the same logical identifier.
    const sshCloneUrl = extractSshCloneUrl(rawSource);
    const source = normalizeSkillSource(rawSource);

    // Validate source
    const sourceError = validateRemoteSource(source);
    if (sourceError) {
      spinner.fail(sourceError);
      process.exitCode = 1;
      return;
    }

    // Resolve target file
    spinner.text = 'Resolving entry file...';
    const entryFile = await resolveEntryFile(options.file);

    // Read the file
    const content = await readFile(entryFile, 'utf-8');
    const lines = content.split('\n');

    // Check if the skill is already imported
    const alreadyImported = lines.some((line) => {
      const usePath = extractUsePath(line);
      return usePath === source;
    });

    if (alreadyImported) {
      spinner.warn(`Skill already imported: ${source}`);
      return;
    }

    // Load lockfile early — we need it for collision detection AND to write
    // the new entry below.
    const lockfile = await loadLockfile();
    const parsedSource = parseSkillSource(source);
    const repoUrl = extractRepoUrl(source);
    const ownerEntry = findSkillOwnerEntry(lockfile, repoUrl);
    const existingRepoEntry = findRepoEntry(lockfile, repoUrl);
    const gitUrl = sshCloneUrl ?? ownerEntry?.[1].gitUrl ?? existingRepoEntry?.[1].gitUrl;
    const requestedVersions = [parsedSource.version];
    const repoSkills: string[] = [];
    for (const [key, dependency] of Object.entries(lockfile.dependencies)) {
      if (
        isSkillMetadataEntry(key, dependency) &&
        key !== source &&
        canonicalRepoUrl(extractRepoUrl(key)) === canonicalRepoUrl(repoUrl)
      ) {
        repoSkills.push(key);
        requestedVersions.push(parseSkillSource(key).version);
      }
    }
    const projectImports = await collectProjectRemoteImports(entryFile);
    for (const remoteImport of projectImports) {
      if (canonicalRepoUrl(remoteImport.repoUrl) === canonicalRepoUrl(repoUrl)) {
        requestedVersions.push(remoteImport.version || 'latest');
      }
    }

    spinner.text = 'Resolving remote version...';
    const resolvedDependency = await resolveSkillDependency(
      repoUrl,
      requestedVersions,
      ownerEntry?.[1] ?? existingRepoEntry?.[1],
      false,
      gitUrl
    );
    const resolvedPin = toDependencyPin(resolvedDependency);

    spinner.text = options.skipValidation
      ? 'Fetching SKILL.md...'
      : 'Validating SKILL.md frontmatter...';
    const fetchedSkills = new Map<string, FetchedSkill>();
    for (const skillSource of [...repoSkills, source]) {
      let fetched: FetchedSkill | undefined;
      try {
        fetched = await fetchAndValidateRemoteSkill(skillSource, {
          commit: resolvedPin.commit,
          existingNames: collectExistingSkillNames(lockfile, skillSource),
          ...(gitUrl ? { gitUrl } : {}),
          validateFrontmatter: !options.skipValidation,
          version: resolvedPin.version,
        });
      } catch (err) {
        throw new Error(
          `Could not fetch SKILL.md for ${skillSource}: ${
            err instanceof Error ? err.message : String(err)
          }`,
          { cause: err }
        );
      }

      if (!fetched) {
        throw new Error(`Cannot locate a SKILL.md for ${skillSource}`);
      }
      const hasErrors = !fetched.valid;
      const hasWarnings = fetched.issues.some((issue) => issue.severity === 'warning');
      if (hasErrors || (options.strict && hasWarnings)) {
        spinner.fail('SKILL.md failed validation');
        ConsoleOutput.error(skillSource);
        printValidationIssues(fetched.issues);
        process.exitCode = 1;
        return;
      }
      if (hasWarnings) {
        spinner.warn(
          skillSource === source
            ? 'SKILL.md has validation warnings'
            : `${skillSource}: SKILL.md has validation warnings`
        );
        printValidationIssues(fetched.issues);
        spinner.start('Adding skill...');
      }
      fetchedSkills.set(skillSource, fetched);
    }
    const fetched = fetchedSkills.get(source)!;

    // Find insertion point and insert
    const insertionPoint = findInsertionPoint(lines);
    const newLine = `@use ${source}`;
    lines.splice(insertionPoint, 0, newLine);
    const updatedContent = lines.join('\n');

    // Build lock entry
    const lockEntry: LockfileDependency = {
      ...resolvedPin,
      integrity: fetched.integrity,
      source: 'md',
    };
    const fetchedAt = new Date().toISOString();
    for (const skillSource of repoSkills) {
      lockfile.dependencies[skillSource] = {
        ...resolvedPin,
        integrity: fetchedSkills.get(skillSource)!.integrity,
        source: 'md',
        fetchedAt,
      };
    }
    lockfile.dependencies[source] = { ...lockEntry, fetchedAt };
    if (ownerEntry && ownerEntry[0] !== repoUrl) {
      delete lockfile.dependencies[ownerEntry[0]];
    }
    lockfile.dependencies[repoUrl] = {
      ...resolvedPin,
      source: 'md',
      skills: [...repoSkills, source],
      ...(gitUrl ? { gitUrl } : {}),
    };

    if (options.dryRun) {
      spinner.succeed('Dry run — no files modified');
      ConsoleOutput.newline();
      ConsoleOutput.dryRun(`Would add to ${entryFile}:`);
      ConsoleOutput.dryRun(`  ${newLine}`);
      ConsoleOutput.dryRun(`Would update ${LOCKFILE_PATH}`);
      return;
    }

    // Write the modified .prs file
    await writeFile(entryFile, updatedContent, 'utf-8');

    // Write lockfile
    await saveLockfile(lockfile);

    spinner.succeed('Skill added');
    ConsoleOutput.newline();
    ConsoleOutput.success(`${newLine}  →  ${entryFile}`);
    ConsoleOutput.muted(`Lockfile updated: ${LOCKFILE_PATH}`);
  } catch (error) {
    spinner.fail('Failed to add skill');
    ConsoleOutput.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

/**
 * Remove a skill from the project.
 *
 * 1. Finds and removes the `@use` line matching the skill name
 * 2. Removes the corresponding lock entry
 */
export async function skillsRemoveCommand(
  name: string,
  options: SkillsRemoveOptions
): Promise<void> {
  const spinner = createSpinner('Removing skill...').start();

  try {
    // Resolve target file
    const entryFile = await resolveEntryFile();

    // Read the file
    const content = await readFile(entryFile, 'utf-8');
    const lines = content.split('\n');
    const parsed = parse(content, { filename: entryFile, tolerant: true });
    if (!parsed.ast || parsed.errors.length > 0) {
      throw new Error(`Cannot remove a skill from invalid PromptScript: ${entryFile}`);
    }
    const matches = parsed.ast.uses
      .map((use) => ({
        index: use.path.loc.line - 1,
        endIndex: findUseEndLine(lines, use.path.loc.line - 1),
        path: normalizeSkillSource(use.path.raw),
      }))
      .filter((candidate) => candidate.path.includes(name));
    const exactMatches = matches.filter((candidate) => candidate.path === name);
    const uniquePartialMatches = [
      ...new Map(matches.map((candidate) => [candidate.path, candidate])).values(),
    ];
    const candidates = exactMatches.length > 0 ? [exactMatches[0]!] : uniquePartialMatches;

    if (candidates.length === 0) {
      spinner.fail(`Skill not found: ${name}`);
      ConsoleOutput.muted('Use "prs skills list" to see available skills');
      process.exitCode = 1;
      return;
    }
    if (candidates.length > 1) {
      spinner.fail(`Multiple skills matched: ${name}`);
      for (const candidate of candidates) {
        ConsoleOutput.muted(candidate.path);
      }
      process.exitCode = 1;
      return;
    }

    const candidate = candidates[0]!;
    const lineIndex = candidate.index;
    const removedLine = lines
      .slice(lineIndex, candidate.endIndex + 1)
      .join('\n')
      .trim();
    const removedPath = candidate.path;
    const lockfile = await loadLockfile();
    const projectImports = await collectProjectRemoteImports(entryFile);
    let lockfileChanged = false;
    let removedRepoUrl: string | undefined;
    let remainingRepoSkills: string[] | undefined;
    let hasOtherRepoImports = false;
    let hasSameImportRemaining = false;
    let ownerEntry: [string, LockfileDependency] | undefined;
    if (REMOTE_SOURCE_PATTERN.test(removedPath)) {
      removedRepoUrl = extractRepoUrl(removedPath);
      let ignoredRemovedOccurrence = false;
      for (const remoteImport of projectImports) {
        if (canonicalRepoUrl(remoteImport.repoUrl) !== canonicalRepoUrl(removedRepoUrl!)) {
          continue;
        }
        const matchesRemovedImport =
          remoteImport.rawSource !== undefined &&
          normalizeSkillSource(remoteImport.rawSource) === removedPath;
        if (matchesRemovedImport && !ignoredRemovedOccurrence) {
          ignoredRemovedOccurrence = true;
          continue;
        }
        if (matchesRemovedImport) {
          hasSameImportRemaining = true;
        }
        hasOtherRepoImports = true;
      }
      ownerEntry = findSkillOwnerEntry(lockfile, removedRepoUrl);
      const repoDependency = ownerEntry?.[1];
      remainingRepoSkills = hasSameImportRemaining
        ? repoDependency?.skills
        : repoDependency?.skills?.filter((skill) => skill !== removedPath);
      if (
        repoDependency &&
        (!hasOtherRepoImports ||
          (repoDependency.skills !== undefined &&
            remainingRepoSkills?.length !== repoDependency.skills.length))
      ) {
        lockfileChanged = true;
      }
    }
    if (removedPath in lockfile.dependencies && !hasSameImportRemaining) {
      lockfileChanged = true;
    }

    if (options.dryRun) {
      spinner.succeed('Dry run — no files modified');
      ConsoleOutput.newline();
      ConsoleOutput.dryRun(`Would remove from ${entryFile}:`);
      ConsoleOutput.dryRun(`  ${removedLine}`);
      if (lockfileChanged) {
        ConsoleOutput.dryRun(`Would update ${LOCKFILE_PATH}`);
      }
      return;
    }

    lines.splice(lineIndex, candidate.endIndex - lineIndex + 1);
    await writeFile(entryFile, lines.join('\n'), 'utf-8');

    // Update lockfile - remove the matching entry
    if (removedPath in lockfile.dependencies && !hasSameImportRemaining) {
      delete lockfile.dependencies[removedPath];
    }
    if (removedRepoUrl) {
      const repoDependency = ownerEntry?.[1];
      if (repoDependency) {
        if (!hasOtherRepoImports) {
          delete lockfile.dependencies[ownerEntry![0]];
        } else if (remainingRepoSkills?.length) {
          repoDependency.skills = remainingRepoSkills;
        } else {
          delete repoDependency.skills;
          delete repoDependency.source;
        }
      }
    }
    if (lockfileChanged) {
      await saveLockfile(lockfile);
    }

    spinner.succeed('Skill removed');
    ConsoleOutput.newline();
    ConsoleOutput.success(`Removed: ${removedLine}`);
    if (lockfileChanged) {
      ConsoleOutput.muted(`Lockfile updated: ${LOCKFILE_PATH}`);
    }
  } catch (error) {
    spinner.fail('Failed to remove skill');
    ConsoleOutput.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

/**
 * List skills imported in the current project.
 *
 * Reads the entry `.prs` file and shows all `@use` directives.
 */
export async function skillsListCommand(): Promise<void> {
  const spinner = createSpinner('Loading skills...').start();

  try {
    const entryFile = await resolveEntryFile();
    const content = await readFile(entryFile, 'utf-8');
    const lines = content.split('\n');

    const skills: string[] = [];
    for (const line of lines) {
      const usePath = extractUsePath(line);
      if (usePath) {
        skills.push(usePath);
      }
    }

    spinner.succeed(`Found ${skills.length} skill(s)`);

    if (skills.length === 0) {
      ConsoleOutput.muted('No skills imported. Use "prs skills add <source>" to add one.');
      return;
    }

    ConsoleOutput.newline();
    for (const skill of skills) {
      ConsoleOutput.info(skill);
    }
  } catch (error) {
    spinner.fail('Failed to list skills');
    ConsoleOutput.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

/**
 * Update lock entries for markdown-sourced skills.
 *
 * Refreshes the lock pins for all dependencies with `source: 'md'`.
 * When a name argument is given, only matching entries are updated.
 */
export async function skillsUpdateCommand(
  name: string | undefined,
  options: SkillsUpdateOptions
): Promise<void> {
  const spinner = createSpinner('Updating skills...').start();

  try {
    const lockfile = await loadLockfile();

    // Filter to md-sourced entries
    const mdEntries = Object.entries(lockfile.dependencies).filter(([key, dep]) =>
      isSkillMetadataEntry(key, dep)
    );

    if (mdEntries.length === 0) {
      spinner.warn('No markdown-sourced skills found in lockfile');
      ConsoleOutput.muted('Use "prs skills add <source>" to add a skill first');
      return;
    }

    const partialMatches = name ? mdEntries.filter(([key]) => key.includes(name)) : mdEntries;
    const exactMatches = name ? partialMatches.filter(([key]) => key === name) : [];
    const toUpdate = exactMatches.length > 0 ? exactMatches : partialMatches;

    if (name && toUpdate.length === 0) {
      spinner.fail(`No skill matched: ${name}`);
      ConsoleOutput.muted('Available: ' + mdEntries.map(([key]) => key).join(', '));
      process.exitCode = 1;
      return;
    }
    if (name && toUpdate.length > 1) {
      spinner.fail(`Multiple skills matched: ${name}`);
      for (const [key] of toUpdate) {
        ConsoleOutput.muted(key);
      }
      process.exitCode = 1;
      return;
    }

    const fetchedAt = new Date().toISOString();
    const updated: string[] = [];
    const skipped: Array<{ key: string; reason: string }> = [];
    const repoUrls = new Set(toUpdate.map(([key]) => extractRepoUrl(key)));
    const projectImports = await collectProjectRemoteImports();

    for (const repoUrl of repoUrls) {
      const repoEntries = mdEntries.filter(([key]) => extractRepoUrl(key) === repoUrl);
      try {
        const ownerEntry = findSkillOwnerEntry(lockfile, repoUrl);
        const existingRepoEntry = findRepoEntry(lockfile, repoUrl);
        const gitUrl = ownerEntry?.[1].gitUrl ?? existingRepoEntry?.[1].gitUrl;
        const requestedVersions = repoEntries.map(([key]) => parseSkillSource(key).version);
        for (const remoteImport of projectImports) {
          if (canonicalRepoUrl(remoteImport.repoUrl) === canonicalRepoUrl(repoUrl)) {
            requestedVersions.push(remoteImport.version || 'latest');
          }
        }
        const resolvedDependency = await resolveSkillDependency(
          repoUrl,
          requestedVersions,
          ownerEntry?.[1] ?? existingRepoEntry?.[1],
          true,
          gitUrl
        );
        const resolvedPin = toDependencyPin(resolvedDependency);
        const stagedEntries: Array<[string, LockfileDependency]> = [];

        for (const [key] of repoEntries) {
          const fetched = await fetchAndValidateRemoteSkill(key, {
            commit: resolvedPin.commit,
            existingNames: collectExistingSkillNames(lockfile, key),
            ...(gitUrl ? { gitUrl } : {}),
            validateFrontmatter: !options.skipValidation,
            version: resolvedPin.version,
          });
          if (!fetched) {
            throw new Error(`Cannot locate a SKILL.md for ${key}`);
          }

          const hasErrors = !fetched.valid;
          const hasWarnings = fetched.issues.some((issue) => issue.severity === 'warning');
          if (hasErrors || (options.strict && hasWarnings)) {
            printValidationIssues(fetched.issues);
            throw new Error(`${key}: SKILL.md failed validation after update`);
          }
          if (hasWarnings) {
            ConsoleOutput.warn(`${key}: validation warnings`);
            printValidationIssues(fetched.issues);
          }

          stagedEntries.push([
            key,
            {
              ...resolvedPin,
              integrity: fetched.integrity,
              source: 'md',
              fetchedAt,
            },
          ]);
        }

        for (const [key, dependency] of stagedEntries) {
          lockfile.dependencies[key] = dependency;
          updated.push(key);
        }
        if (ownerEntry && ownerEntry[0] !== repoUrl) {
          delete lockfile.dependencies[ownerEntry[0]];
        }
        lockfile.dependencies[repoUrl] = {
          ...resolvedPin,
          source: 'md',
          skills: repoEntries.map(([key]) => key),
          ...(gitUrl ? { gitUrl } : {}),
        };
      } catch (err) {
        const reason = err instanceof Error ? err.message : String(err);
        for (const [key] of repoEntries) {
          skipped.push({ key, reason });
        }
      }
    }

    if (options.dryRun) {
      spinner.succeed('Dry run — lockfile not written');
      ConsoleOutput.newline();
      for (const key of updated) {
        ConsoleOutput.dryRun(`Would update: ${key}`);
      }
      for (const { key, reason } of skipped) {
        ConsoleOutput.warn(`Would skip ${key}: ${reason}`);
      }
      if (skipped.length > 0) {
        process.exitCode = 1;
      }
      return;
    }

    if (updated.length > 0) {
      await saveLockfile(lockfile);
    }

    if (updated.length > 0) {
      spinner.succeed(`Updated ${updated.length} skill(s)`);
      ConsoleOutput.newline();
      for (const key of updated) {
        ConsoleOutput.success(key);
      }
    } else {
      spinner.warn('No skills were updated');
    }

    for (const { key, reason } of skipped) {
      ConsoleOutput.warn(`Skipped ${key}: ${reason}`);
    }
    if (skipped.length > 0) {
      process.exitCode = 1;
    }
  } catch (error) {
    spinner.fail('Failed to update skills');
    ConsoleOutput.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
