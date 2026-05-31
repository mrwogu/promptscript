import { writeFile, readFile, readdir, mkdtemp, rm } from 'fs/promises';
import { resolve, join, basename, dirname } from 'path';
import { existsSync } from 'fs';
import { tmpdir } from 'os';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';
import type { SkillsAddOptions, SkillsRemoveOptions, SkillsUpdateOptions } from '../types.js';
import { loadConfig, findConfigFile } from '../config/loader.js';
import { createSpinner, ConsoleOutput } from '../output/console.js';
import type { Lockfile, LockfileDependency } from '@promptscript/core';
import { LOCKFILE_VERSION, isValidLockfile } from '@promptscript/core';
import { LOCKFILE_PATH } from './lock.js';
import {
  validateRemoteAccess,
  validateSkillFrontmatter,
  formatSkillValidationIssues,
  hashContent,
  createGitRegistry,
  type SkillValidationIssue,
} from '@promptscript/resolver';

/**
 * Pattern to match remote source strings.
 * Accepts `github.com/owner/repo` or `github.com/owner/repo/path/to/SKILL.md`.
 * Rejects local paths starting with `./` or `../`.
 */
const REMOTE_SOURCE_PATTERN = /^[a-zA-Z0-9][\w.-]*\.[a-zA-Z]{2,}\/.+/;

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

  source = source.replace(/\.git(?=\/|$)/i, '');
  while (source.endsWith('/')) {
    source = source.slice(0, -1);
  }
  return source;
}

/**
 * Extract the sub-path inside the repo from a normalized source.
 * `github.com/owner/repo/foo/bar/SKILL.md` -> `foo/bar/SKILL.md`
 * `github.com/owner/repo` -> ''
 */
function extractSubPath(source: string): string {
  const parts = source.replace(/^https?:\/\//, '').split('/');
  return parts.length > 3 ? parts.slice(3).join('/') : '';
}

/**
 * Derive the on-disk skill folder name from a source path. Skills are written
 * to `<format-dir>/skills/<name>/SKILL.md` where `<name>` is the basename of
 * the SKILL.md's parent directory (matching the Agent Skills spec — the
 * frontmatter `name` MUST match this directory).
 *
 * Returns `undefined` for sources without a clear single-file target (e.g.
 * directory imports), which auto-discover names at compile time.
 */
function deriveSkillFolderName(source: string): string | undefined {
  const subPath = extractSubPath(source);
  if (!subPath) return undefined;
  if (!subPath.toLowerCase().endsWith('.md')) return undefined;
  const parent = dirname(subPath);
  if (parent === '.' || parent === '') return undefined;
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
    if (dep.source !== 'md') continue;
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
 * Returns `undefined` when the source does not target a single `.md` file
 * (directory imports auto-discover at compile time and cannot be validated
 * up-front against a single file).
 */
async function fetchAndValidateRemoteSkill(
  source: string,
  options: { existingNames: ReadonlySet<string>; version: string }
): Promise<FetchedSkill | undefined> {
  const subPath = extractSubPath(source);
  if (!subPath || !subPath.toLowerCase().endsWith('.md')) {
    return undefined;
  }

  const repoUrl = extractRepoUrl(source);
  const tmp = await mkdtemp(join(tmpdir(), 'prs-skill-validate-'));
  try {
    const gitRegistry = createGitRegistry({ url: repoUrl });
    await gitRegistry.cloneAtTag(repoUrl, options.version, tmp);

    const filePath = join(tmp, subPath);
    if (!existsSync(filePath)) {
      return {
        content: '',
        integrity: '',
        valid: false,
        issues: [
          {
            severity: 'error',
            code: 'SK000',
            message: `File '${subPath}' does not exist in ${repoUrl} at ${options.version}.`,
          },
        ],
      };
    }

    const content = await readFile(filePath, 'utf-8');
    const integrity = hashContent(Buffer.from(content, 'utf-8'));
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
  const parts = source.replace(/^https?:\/\//, '').split('/');
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
  let inMetaBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i]!.trim();

    if (trimmed.startsWith('@meta ') || trimmed === '@meta{' || trimmed === '@meta {') {
      inMetaBlock = true;
      lastDirectiveLine = i;
      continue;
    }

    if (inMetaBlock) {
      if (trimmed === '}') {
        inMetaBlock = false;
        lastDirectiveLine = i;
      }
      continue;
    }

    for (const directive of HEADER_DIRECTIVES) {
      if (trimmed.startsWith(directive)) {
        lastDirectiveLine = i;
        break;
      }
    }
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

/**
 * Load the lockfile from disk.
 */
async function loadLockfile(): Promise<Lockfile> {
  const defaultLockfile: Lockfile = { version: LOCKFILE_VERSION, dependencies: {} };
  if (!existsSync(LOCKFILE_PATH)) {
    return defaultLockfile;
  }
  try {
    const raw = await readFile(LOCKFILE_PATH, 'utf-8');
    const parsed: unknown = parseYaml(raw, { maxAliasCount: 100 });
    if (isValidLockfile(parsed)) {
      return parsed;
    }
  } catch {
    // Malformed lockfile — start fresh
  }
  return defaultLockfile;
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

    // Validate remote repository is accessible
    spinner.text = 'Validating remote repository...';
    const repoUrl = extractRepoUrl(source);
    const validation = await validateRemoteAccess(repoUrl);

    if (!validation.accessible) {
      spinner.fail('Cannot reach remote repository');
      ConsoleOutput.error(validation.error ?? `Failed to connect to ${repoUrl}`);
      process.exitCode = 1;
      return;
    }

    // Load lockfile early — we need it for collision detection AND to write
    // the new entry below.
    const lockfile = await loadLockfile();

    // Fetch the actual SKILL.md and validate its frontmatter (Agent Skills
    // spec compliance + collision check). Only runs for single-file imports.
    let integrity = 'sha256-pending';
    let validationFailed = false;
    if (!options.skipValidation) {
      spinner.text = 'Validating SKILL.md frontmatter...';
      try {
        const fetched = await fetchAndValidateRemoteSkill(source, {
          existingNames: collectExistingSkillNames(lockfile),
          version: 'main',
        });
        if (fetched) {
          integrity = fetched.integrity || integrity;
          const hasErrors = !fetched.valid;
          const hasWarnings = fetched.issues.some((i) => i.severity === 'warning');
          if (hasErrors || (options.strict && hasWarnings)) {
            spinner.fail('SKILL.md failed validation');
            printValidationIssues(fetched.issues);
            ConsoleOutput.newline();
            ConsoleOutput.muted(
              'Re-run with --skip-validation to bypass (not recommended) or fix the upstream SKILL.md.'
            );
            process.exitCode = 1;
            validationFailed = true;
          } else if (fetched.issues.length > 0) {
            // Warnings only — surface them but continue
            spinner.warn('SKILL.md has validation warnings');
            printValidationIssues(fetched.issues);
            spinner.start('Adding skill...');
          }
        }
      } catch (err) {
        // Don't block on fetch failures — log and continue with placeholder
        // integrity so the user can still install. Compile will redo the work.
        spinner.warn('Could not validate SKILL.md ahead of time');
        ConsoleOutput.muted(
          `Reason: ${err instanceof Error ? err.message : String(err)}. Proceeding without frontmatter check.`
        );
        spinner.start('Adding skill...');
      }
    }

    if (validationFailed) return;

    // Find insertion point and insert
    const insertionPoint = findInsertionPoint(lines);
    const newLine = `@use ${source}`;
    lines.splice(insertionPoint, 0, newLine);
    const updatedContent = lines.join('\n');

    // Build lock entry
    const lockEntry: LockfileDependency = {
      version: 'latest',
      commit: validation.headCommit ?? '0000000000000000000000000000000000000000',
      integrity,
      source: 'md',
    };
    lockfile.dependencies[source] = lockEntry;

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

    // Find the @use line matching the name
    const lineIndex = lines.findIndex((line) => {
      const usePath = extractUsePath(line);
      return usePath !== undefined && (usePath === name || usePath.includes(name));
    });

    if (lineIndex === -1) {
      spinner.fail(`Skill not found: ${name}`);
      ConsoleOutput.muted('Use "prs skills list" to see available skills');
      process.exitCode = 1;
      return;
    }

    const removedLine = lines[lineIndex]!.trim();
    const removedPath = extractUsePath(removedLine)!;

    if (options.dryRun) {
      spinner.succeed('Dry run — no files modified');
      ConsoleOutput.newline();
      ConsoleOutput.dryRun(`Would remove from ${entryFile}:`);
      ConsoleOutput.dryRun(`  ${removedLine}`);
      ConsoleOutput.dryRun(`Would update ${LOCKFILE_PATH}`);
      return;
    }

    // Remove the line
    lines.splice(lineIndex, 1);
    await writeFile(entryFile, lines.join('\n'), 'utf-8');

    // Update lockfile — remove the matching entry
    const lockfile = await loadLockfile();
    if (removedPath in lockfile.dependencies) {
      delete lockfile.dependencies[removedPath];
      await saveLockfile(lockfile);
    }

    spinner.succeed('Skill removed');
    ConsoleOutput.newline();
    ConsoleOutput.success(`Removed: ${removedLine}`);
    ConsoleOutput.muted(`Lockfile updated: ${LOCKFILE_PATH}`);
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
    const mdEntries = Object.entries(lockfile.dependencies).filter(
      ([, dep]) => dep.source === 'md'
    );

    if (mdEntries.length === 0) {
      spinner.warn('No markdown-sourced skills found in lockfile');
      ConsoleOutput.muted('Use "prs skills add <source>" to add a skill first');
      return;
    }

    // Filter by name if provided
    const toUpdate = name ? mdEntries.filter(([key]) => key.includes(name)) : mdEntries;

    if (name && toUpdate.length === 0) {
      spinner.fail(`No skill matched: ${name}`);
      ConsoleOutput.muted('Available: ' + mdEntries.map(([key]) => key).join(', '));
      process.exitCode = 1;
      return;
    }

    // Fetch the latest HEAD commit for each entry by reaching out to the
    // remote with validateRemoteAccess. When validation is enabled we also
    // re-clone the SKILL.md to recompute integrity and re-check the spec.
    const fetchedAt = new Date().toISOString();
    const updated: string[] = [];
    const skipped: Array<{ key: string; reason: string }> = [];

    for (const [key, dep] of toUpdate) {
      const repoUrl = extractRepoUrl(key);
      try {
        const validation = await validateRemoteAccess(repoUrl);
        if (!validation.accessible || !validation.headCommit) {
          skipped.push({
            key,
            reason: validation.error ?? 'remote unreachable',
          });
          continue;
        }

        let integrity = dep.integrity ?? 'sha256-pending';

        if (!options.skipValidation) {
          try {
            const fetched = await fetchAndValidateRemoteSkill(key, {
              existingNames: collectExistingSkillNames(lockfile, key),
              version: dep.version === 'latest' ? 'main' : dep.version,
            });
            if (fetched) {
              integrity = fetched.integrity || integrity;
              const hasErrors = !fetched.valid;
              const hasWarnings = fetched.issues.some((i) => i.severity === 'warning');
              if (hasErrors || (options.strict && hasWarnings)) {
                skipped.push({
                  key,
                  reason: 'SKILL.md failed validation after update',
                });
                printValidationIssues(fetched.issues);
                continue;
              } else if (hasWarnings) {
                ConsoleOutput.warn(`${key}: validation warnings`);
                printValidationIssues(fetched.issues);
              }
            }
          } catch (err) {
            ConsoleOutput.warn(
              `${key}: could not re-validate (${err instanceof Error ? err.message : String(err)})`
            );
          }
        }

        lockfile.dependencies[key] = {
          version: dep.version ?? 'latest',
          commit: validation.headCommit,
          integrity,
          source: 'md',
          fetchedAt,
        };
        updated.push(key);
      } catch (err) {
        skipped.push({
          key,
          reason: err instanceof Error ? err.message : String(err),
        });
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
  } catch (error) {
    spinner.fail('Failed to update skills');
    ConsoleOutput.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
