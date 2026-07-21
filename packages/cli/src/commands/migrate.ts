import { dirname, relative, resolve } from 'path';
import { parse as parseYaml } from 'yaml';
import {
  getLatestSyntaxVersion,
  type PromptScriptConfig,
  type TargetEntry,
} from '@promptscript/core';
import { importMultipleFiles } from '@promptscript/importer';
import type { MigrateOptions } from '../types.js';
import { type CliServices, createDefaultServices } from '../services.js';
import { ConsoleOutput, createSpinner, getContext, setContext } from '../output/console.js';
import {
  detectAITools,
  type AIToolTarget,
  type MigrationCandidate,
} from '../utils/ai-tools-detector.js';
import { createBackup, isGitRepo } from '../utils/backup.js';
import { copyToClipboard } from '../utils/clipboard.js';
import { generateMigrationPrompt } from '../utils/migration-prompt.js';
import {
  assertSafeWritePath,
  executeWritePlan,
  type PlannedWrite,
  type WritePlanResult,
} from '../utils/write-plan.js';
import { getSkillWrites, initCommand, selectMigrationStrategy } from './init.js';
import { CONFIG_FILES, interpolateEnvVars } from '../config/loader.js';

export async function migrateCommand(
  options: MigrateOptions,
  services: CliServices = createDefaultServices()
): Promise<void> {
  const previousOutputStream = getContext().outputStream;
  setContext({ outputStream: 'stderr' });
  try {
    await runMigrateCommand(options, services);
  } finally {
    setContext({ outputStream: previousOutputStream });
  }
}

async function runMigrateCommand(options: MigrateOptions, services: CliServices): Promise<void> {
  try {
    validateOptions(options);

    const detection = await detectAITools(services);
    const candidates = selectRequestedCandidates(detection.migrationCandidates, options.files);
    if (candidates.length === 0) {
      ConsoleOutput.info('No migration candidates found. No files changed.');
      return;
    }

    const configPath = findProjectConfig(services);
    if (!configPath) {
      await initCommand(
        {
          _forceMigrate: true,
          _forceLlm: options.llm === true,
          _migrateFiles: candidates.map((candidate) => candidate.path),
          yes: options.static === true || options.llm === true,
          autoImport: options.static === true,
          targets: options.targets,
          backup: options.backup,
          force: options.force,
          dryRun: options.dryRun,
          hooks: false,
        },
        services
      );
      return;
    }

    const config = await readProjectConfig(configPath, services);
    if (options.targets) {
      throw new Error('--targets can only be used when migration initializes a project');
    }
    const targets = extractTargetNames(config.targets);
    const strategy = options.llm
      ? 'llm'
      : options.static
        ? 'static'
        : await selectMigrationStrategy(services);

    let selectedCandidates = candidates;
    if (strategy === 'static' && !options.static && !options.files) {
      const selectedPaths = await services.prompts.checkbox({
        message: 'Select files to import:',
        choices: candidates.map((candidate) => ({
          name: `${candidate.path} (${candidate.sizeHuman}, ${candidate.toolName})`,
          value: candidate.path,
          checked: true,
        })),
      });
      if (selectedPaths.length === 0) {
        ConsoleOutput.info('Migration cancelled. No files changed.');
        return;
      }
      selectedCandidates = candidates.filter((candidate) => selectedPaths.includes(candidate.path));
    }

    const writes =
      strategy === 'static'
        ? await createStaticMigrationWrites(selectedCandidates, config, services)
        : createLlmMigrationWrites(
            selectedCandidates,
            targets,
            validateProjectPath(config.input?.entry ?? '.promptscript/project.prs')
          );

    if (!isGitRepo(services)) {
      ConsoleOutput.warn('Not a git repository. Changes are not version-controlled.');
    }

    const existingPaths = writes
      .map((write) => write.path)
      .filter((path) => services.fs.existsSync(path));
    let shouldBackup = options.backup === true;
    if (
      !options.dryRun &&
      !shouldBackup &&
      !options.static &&
      !options.llm &&
      existingPaths.length > 0
    ) {
      shouldBackup = await services.prompts.confirm({
        message: 'Back up files that will be updated?',
        default: !isGitRepo(services),
      });
    }
    if (!options.dryRun && shouldBackup && existingPaths.length > 0) {
      for (const path of existingPaths) {
        await assertSafeWritePath(path, services);
      }
      const result = await createBackup(existingPaths, services);
      ConsoleOutput.info(`Backup created: ${result.dir}`);
    }

    const spinner = createSpinner(
      options.dryRun ? 'Planning migration...' : 'Applying migration...'
    ).start();
    const entryPath = validateProjectPath(config.input?.entry ?? '.promptscript/project.prs');
    const result = await executeWritePlan(writes, services, {
      dryRun: options.dryRun,
      force: options.force === true || shouldBackup,
      canOverwrite: (path) => strategy === 'static' && path === entryPath,
    });

    if (options.dryRun) {
      spinner.succeed('Migration plan ready');
      printWriteSummary(result, true);
      return;
    }

    spinner.succeed('Migration complete');
    printWriteSummary(result, false);

    if (strategy === 'llm') {
      const prompt = writes.find((write) => write.path === '.promptscript/migration-prompt.md');
      if (prompt) {
        const promptContent = prompt.content.replace(
          /^<!-- PromptScript migration prompt - do not edit -->\n\n/,
          ''
        );
        if (options.llm) {
          console.log(promptContent);
        } else if (copyToClipboard(promptContent)) {
          ConsoleOutput.success('Migration prompt copied to clipboard');
        }
      }
    }

    ConsoleOutput.newline();
    ConsoleOutput.muted('Run: prs validate --strict');
    ConsoleOutput.muted('Run: prs compile --dry-run');
  } catch (error) {
    if (error instanceof Error && error.name === 'ExitPromptError') {
      ConsoleOutput.info('Migration cancelled. No files changed.');
      return;
    }
    ConsoleOutput.error(
      `Migration failed: ${error instanceof Error ? error.message : String(error)}`
    );
    process.exitCode = 1;
  }
}

function validateOptions(options: MigrateOptions): void {
  if (options.static && options.llm) {
    throw new Error('--static and --llm cannot be used together');
  }
}

function findProjectConfig(services: CliServices): string | undefined {
  const envConfig = process.env['PROMPTSCRIPT_CONFIG'];
  if (envConfig && services.fs.existsSync(envConfig)) {
    return envConfig;
  }
  return CONFIG_FILES.find((path) => services.fs.existsSync(path));
}

function normalizeRequestedPath(path: string): string {
  return path.replace(/\\/g, '/').replace(/^\.\//, '');
}

function selectRequestedCandidates(
  candidates: MigrationCandidate[],
  requestedFiles: string[] | undefined
): MigrationCandidate[] {
  if (!requestedFiles || requestedFiles.length === 0) {
    return candidates;
  }

  const requested = requestedFiles.map(normalizeRequestedPath);
  const available = new Map(
    candidates.map((candidate) => [normalizeRequestedPath(candidate.path), candidate])
  );
  const missing = requested.filter((path) => !available.has(path));
  if (missing.length > 0) {
    throw new Error(`Requested migration files were not detected: ${missing.join(', ')}`);
  }

  return Array.from(new Set(requested)).map((path) => available.get(path) as MigrationCandidate);
}

async function readProjectConfig(
  configPath: string,
  services: CliServices
): Promise<PromptScriptConfig> {
  const content = interpolateEnvVars(await services.fs.readFile(configPath, 'utf-8'));
  const config = parseYaml(content) as PromptScriptConfig | null;
  if (
    !config ||
    typeof config !== 'object' ||
    typeof config.id !== 'string' ||
    config.id.trim().length === 0 ||
    typeof config.syntax !== 'string' ||
    config.syntax.trim().length === 0 ||
    !Array.isArray(config.targets) ||
    config.targets.length === 0 ||
    !config.targets.every(
      (target) =>
        (typeof target === 'string' && target.length > 0) ||
        (target !== null &&
          typeof target === 'object' &&
          !Array.isArray(target) &&
          Object.keys(target).length > 0)
    )
  ) {
    throw new Error(`${configPath} must contain id, syntax, and targets before migration`);
  }
  return config;
}

function extractTargetNames(targets: TargetEntry[]): AIToolTarget[] {
  const names: AIToolTarget[] = [];
  for (const target of targets) {
    if (typeof target === 'string') {
      names.push(target);
      continue;
    }
    for (const [name, config] of Object.entries(target)) {
      if (config?.enabled !== false) {
        names.push(name);
      }
    }
  }
  return Array.from(new Set(names));
}

async function createStaticMigrationWrites(
  candidates: MigrationCandidate[],
  config: PromptScriptConfig,
  services: CliServices
): Promise<PlannedWrite[]> {
  const result = await importMultipleFiles(
    candidates.map((candidate) => resolve(services.cwd, candidate.path)),
    {
      projectName: config.id,
      syntaxVersion: config.syntax || getLatestSyntaxVersion(),
    }
  );

  if (
    result.perFileReports.length !== candidates.length ||
    result.perFileReports.some((report) => report.sectionCount === 0)
  ) {
    const details = result.warnings.length > 0 ? ` ${result.warnings.join(' ')}` : '';
    throw new Error(`Not all selected instruction files could be imported.${details}`);
  }

  const entryPath = validateProjectPath(config.input?.entry ?? '.promptscript/project.prs');
  if (entryPath.startsWith('.promptscript/migrated/')) {
    throw new Error('Project entry cannot be inside the reserved migration output directory');
  }
  const writes: PlannedWrite[] = [];
  let importedProject: string | undefined;

  for (const [fileName, content] of result.files) {
    if (fileName === 'project.prs') {
      importedProject = content;
      continue;
    }
    if (fileName.includes('/') || fileName.includes('\\') || fileName.includes('..')) {
      throw new Error(`Importer returned unsafe output path: ${fileName}`);
    }
    writes.push({
      path: `.promptscript/migrated/${fileName}`,
      content: markMigrationOutput(content),
    });
  }

  if (!importedProject) {
    throw new Error('Importer did not produce a project entry file');
  }

  const migratedProjectPath = '.promptscript/migrated/project.prs';
  writes.push({ path: migratedProjectPath, content: markMigrationOutput(importedProject) });
  const useLine = `@use ${toUsePath(entryPath, migratedProjectPath)}`;

  if (services.fs.existsSync(entryPath)) {
    const existing = await services.fs.readFile(entryPath, 'utf-8');
    const hasUseLine = existing.split(/\r?\n/).some((line) => line.trim() === useLine);
    if (!hasUseLine) {
      writes.push({
        path: entryPath,
        content: `${existing.trimEnd()}\n\n${useLine}\n`,
      });
    }
  } else {
    writes.push({
      path: entryPath,
      content: [
        '# promptscript-generated: migration',
        '@meta {',
        `  id: ${JSON.stringify(config.id)}`,
        `  syntax: ${JSON.stringify(config.syntax)}`,
        '}',
        '',
        useLine,
        '',
      ].join('\n'),
    });
  }

  if (writes.length === 0) {
    throw new Error('Migration produced no new changes');
  }

  return deduplicateWrites(writes);
}

function createLlmMigrationWrites(
  candidates: MigrationCandidate[],
  targets: AIToolTarget[],
  entryPath: string
): PlannedWrite[] {
  const prompt = generateMigrationPrompt(
    candidates.map((candidate) => ({
      path: candidate.path,
      sizeHuman: candidate.sizeHuman,
      toolName: candidate.toolName,
    })),
    {
      outputDirectory: '.promptscript/migrated',
      existingEntry: entryPath,
    }
  );

  return deduplicateWrites([
    {
      path: '.promptscript/migration-prompt.md',
      content: `<!-- PromptScript migration prompt - do not edit -->\n\n${prompt}`,
    },
    ...getSkillWrites(targets),
  ]);
}

function markMigrationOutput(content: string): string {
  return `# promptscript-generated: migration\n${content}`;
}

function toUsePath(entryPath: string, targetPath: string): string {
  const withoutExtension = targetPath.replace(/\.prs$/, '');
  const path = relative(dirname(entryPath), withoutExtension).replace(/\\/g, '/');
  return path.startsWith('.') ? path : `./${path}`;
}

function validateProjectPath(path: string): string {
  const normalized = normalizeRequestedPath(path);
  if (
    normalized.length === 0 ||
    normalized.startsWith('/') ||
    normalized.startsWith('//') ||
    /^[A-Za-z]:/.test(normalized) ||
    normalized.split('/').includes('..') ||
    !normalized.endsWith('.prs')
  ) {
    throw new Error(`Project entry must be a .prs file inside the project: ${path}`);
  }
  return normalized;
}

function deduplicateWrites(writes: PlannedWrite[]): PlannedWrite[] {
  const byPath = new Map<string, PlannedWrite>();
  for (const write of writes) {
    byPath.set(write.path, write);
  }
  return Array.from(byPath.values());
}

function printWriteSummary(result: WritePlanResult, dryRun: boolean): void {
  ConsoleOutput.newline();
  ConsoleOutput.stats(dryRun ? 'Planned changes:' : 'Changed files:');
  for (const path of result.created) {
    if (dryRun) {
      ConsoleOutput.dryRun(`create ${path}`);
    } else {
      ConsoleOutput.success(path);
    }
  }
  for (const path of result.updated) {
    if (dryRun) {
      ConsoleOutput.dryRun(`update ${path}`);
    } else {
      ConsoleOutput.success(`${path} (updated)`);
    }
  }
  for (const path of result.unchanged) {
    ConsoleOutput.unchanged(path);
  }
}
