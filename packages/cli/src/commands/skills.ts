import { writeFile, readFile, readdir } from 'fs/promises';
import { resolve } from 'path';
import { existsSync } from 'fs';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';
import type { SkillsAddOptions, SkillsRemoveOptions, SkillsUpdateOptions } from '../types.js';
import { loadConfig, findConfigFile } from '../config/loader.js';
import { createSpinner, ConsoleOutput } from '../output/console.js';
import type { Lockfile, LockfileDependency } from '@promptscript/core';
import { LOCKFILE_VERSION, isValidLockfile } from '@promptscript/core';
import { LOCKFILE_PATH } from './lock.js';
import { validateRemoteAccess } from '@promptscript/resolver';

/**
 * Pattern to match remote source strings.
 * Accepts `github.com/owner/repo` or `github.com/owner/repo/path/to/SKILL.md`.
 * Rejects local paths starting with `./` or `../`.
 */
const REMOTE_SOURCE_PATTERN = /^[a-zA-Z0-9][\w.-]*\.[a-zA-Z]{2,}\/.+/;

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
export async function skillsAddCommand(source: string, options: SkillsAddOptions): Promise<void> {
  const spinner = createSpinner('Adding skill...').start();

  try {
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

    // Find insertion point and insert
    const insertionPoint = findInsertionPoint(lines);
    const newLine = `@use ${source}`;
    lines.splice(insertionPoint, 0, newLine);
    const updatedContent = lines.join('\n');

    // Load and update lockfile
    const lockfile = await loadLockfile();
    const lockEntry: LockfileDependency = {
      version: 'latest',
      commit: validation.headCommit ?? '0000000000000000000000000000000000000000',
      integrity: 'sha256-pending',
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

    // Reset pins to trigger re-resolution
    for (const [key] of toUpdate) {
      lockfile.dependencies[key] = {
        version: 'latest',
        commit: '0000000000000000000000000000000000000000',
        integrity: 'sha256-pending',
        source: 'md',
      };
    }

    if (options.dryRun) {
      spinner.succeed('Dry run — lockfile not written');
      ConsoleOutput.newline();
      for (const [key] of toUpdate) {
        ConsoleOutput.dryRun(`Would update: ${key}`);
      }
      return;
    }

    await saveLockfile(lockfile);

    spinner.succeed(`Updated ${toUpdate.length} skill(s)`);
    ConsoleOutput.newline();
    for (const [key] of toUpdate) {
      ConsoleOutput.success(key);
    }
  } catch (error) {
    spinner.fail('Failed to update skills');
    ConsoleOutput.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
