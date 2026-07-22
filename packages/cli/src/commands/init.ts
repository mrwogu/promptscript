import { fileURLToPath } from 'url';
import { basename, dirname, resolve } from 'path';
import { readFileSync, existsSync } from 'fs';
import {
  getLatestSyntaxVersion,
  type PromptScriptConfig,
  type RegistryManifest,
} from '@promptscript/core';
import { stringify as stringifyYaml } from 'yaml';
import { type CliServices, createDefaultServices } from '../services.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Directory containing bundled SKILL.md files shipped with the CLI package.
 * In bundled mode (dist/packages/cli/index.js): skills/ is a sibling directory.
 * In dev mode (packages/cli/src/commands/init.ts): skills/ is two levels up.
 */
function findSkillsDir(): string {
  const candidates = [resolve(__dirname, 'skills'), resolve(__dirname, '..', '..', 'skills')];
  for (const dir of candidates) {
    if (existsSync(dir)) return dir;
  }
  return candidates[0] as string;
}
const BUNDLED_SKILLS_DIR = findSkillsDir();

import { importMultipleFiles } from '@promptscript/importer';
import type { InitOptions } from '../types.js';
import { createSpinner, ConsoleOutput, getContext, setContext } from '../output/console.js';
import { detectProject, type ProjectInfo } from '../utils/project-detector.js';
import {
  detectAITools,
  getAllTargets,
  getSuggestedTargets,
  formatDetectionResults,
  formatMigrationHint,
  hasMigrationCandidates,
  type AIToolTarget,
  type MigrationCandidate,
} from '../utils/ai-tools-detector.js';
import { copyToClipboard } from '../utils/clipboard.js';
import { isGitRepo, createBackup } from '../utils/backup.js';
import { generateMigrationPrompt } from '../utils/migration-prompt.js';
import {
  assertSafeWritePath,
  executeWritePlan,
  type PlannedWrite,
  type WritePlanResult,
} from '../utils/write-plan.js';
import { FormatterRegistry } from '@promptscript/formatters';
import { findPrettierConfig } from '../prettier/loader.js';
import { hooksCommand } from './hooks.js';
import { getToolConfig } from '../hooks/tool-configs/index.js';

/**
 * Map AI tool target identifiers to hook tool-config names.
 * Most names match directly; this only lists targets whose hook
 * config name differs from the formatter target name.
 */
const TARGET_TO_HOOK_NAME: Record<string, string> = {
  github: 'copilot',
};
import {
  loadManifest,
  loadManifestFromUrl,
  ManifestLoadError,
  isValidGitUrl,
  githubRepoToManifestUrl,
} from '../utils/manifest-loader.js';
import { loadUserConfig } from '../config/user-config.js';
import { loadEnvOverrides } from '../config/env-config.js';
import { CONFIG_FILES } from '../config/loader.js';
import {
  buildProjectContext,
  calculateSuggestions,
  createSuggestionChoices,
  parseSelectedChoices,
  formatSuggestionResult,
} from '../utils/suggestion-engine.js';

/**
 * Registry configuration - either local path or remote git.
 */
interface RegistryConfig {
  type: 'local' | 'git';
  /** Local path (for type: 'local') */
  path?: string;
  /** Git URL (for type: 'git') */
  url?: string;
  /** Git branch/ref (for type: 'git') */
  ref?: string;
}

/**
 * Resolved configuration after prompts or CLI args.
 */
interface ResolvedConfig {
  projectId: string;
  team?: string;
  inherit?: string;
  use?: string[];
  skills?: string[];
  registry?: RegistryConfig;
  targets: AIToolTarget[];
  /** Path to detected Prettier config, or null if not found */
  prettierConfigPath: string | null;
}

/**
 * Initialize PromptScript in the current directory.
 * Creates configuration file and initial project structure.
 */
export async function initCommand(
  options: InitOptions,
  services: CliServices = createDefaultServices()
): Promise<void> {
  const previousOutputStream = getContext().outputStream;
  setContext({ outputStream: 'stderr' });
  try {
    await runInitCommand(options, services);
  } finally {
    setContext({ outputStream: previousOutputStream });
  }
}

async function runInitCommand(options: InitOptions, services: CliServices): Promise<void> {
  const { fs } = services;
  if (options.interactive && options.yes) {
    ConsoleOutput.error('Cannot use --interactive with --yes');
    process.exitCode = 1;
    return;
  }

  const envConfigPath = process.env['PROMPTSCRIPT_CONFIG'];
  const existingConfigPath =
    envConfigPath && fs.existsSync(envConfigPath)
      ? envConfigPath
      : CONFIG_FILES.find((path) => fs.existsSync(path));
  if (existingConfigPath && !options.force && !options.backup) {
    ConsoleOutput.warn('PromptScript already initialized');
    ConsoleOutput.muted(`Found: ${existingConfigPath}`);
    ConsoleOutput.muted('Use --force or --backup to reinitialize');
    process.exitCode = 2;
    return;
  }

  try {
    // Detect project info and AI tools
    const projectInfo = await detectProject(services);
    const aiToolsDetection = await detectAITools(services);

    let migrationMode: 'static' | 'llm' | 'skip' | 'none' = 'none';

    if (hasMigrationCandidates(aiToolsDetection)) {
      if (options._forceMigrate) {
        if (options._forceLlm) {
          migrationMode = 'llm';
        } else if (options.yes) {
          migrationMode = 'static';
        } else {
          migrationMode = await selectMigrationStrategy(services);
        }
      } else if (options.autoImport) {
        migrationMode = 'static';
      } else if (options.yes) {
        migrationMode = 'skip';
      } else {
        migrationMode = await showGatewayPrompt(aiToolsDetection, services);
      }
    }
    if ((migrationMode === 'static' || migrationMode === 'llm') && !isGitRepo(services)) {
      ConsoleOutput.warn('Not a git repository. Changes are not version-controlled.');
    }

    // Detect Prettier configuration
    const prettierConfigPath = findPrettierConfig(process.cwd());

    // Try to load manifest for suggestions (optional - don't fail if not found)
    let manifest: RegistryManifest | undefined;
    try {
      const registryPath = options.registry ?? './registry';
      const { manifest: loadedManifest } = await loadManifest({ registryPath }, services);
      manifest = loadedManifest;
    } catch (error) {
      // Manifest loading is optional - continue without it
      if (!(error instanceof ManifestLoadError)) {
        throw error;
      }
    }

    // Resolve configuration (interactive or from CLI args)
    const config = await resolveConfig(
      options,
      projectInfo,
      aiToolsDetection,
      prettierConfigPath,
      manifest,
      services
    );
    config.targets = Array.from(new Set(config.targets));
    validateTargets(config.targets);
    validateProjectMetadata(config);
    validateDirectives(config);

    const writes: PlannedWrite[] = [
      { path: existingConfigPath ?? 'promptscript.yaml', content: generateConfig(config) },
    ];
    let importedFiles: Map<string, string> | undefined;
    if (migrationMode === 'static') {
      importedFiles = await handleStaticMigration(
        aiToolsDetection.migrationCandidates,
        config,
        options,
        services
      );
      for (const [fileName, content] of importedFiles) {
        if (
          fileName.includes('/') ||
          fileName.includes('\\') ||
          fileName.includes('..') ||
          fileName.length === 0
        ) {
          throw new Error(`Importer returned unsafe output path: ${fileName}`);
        }
        writes.push({ path: `.promptscript/${fileName}`, content });
      }
    } else {
      writes.push({
        path: '.promptscript/project.prs',
        content: generateProjectPs(config, projectInfo),
      });
    }

    let migrationPrompt: string | undefined;
    if (migrationMode === 'llm') {
      migrationPrompt = prepareLlmMigration(aiToolsDetection.migrationCandidates, options);
      writes.push({ path: '.promptscript/migration-prompt.md', content: migrationPrompt });
    }

    const skillWrites = getSkillWrites(config.targets);
    writes.push(...skillWrites);

    const existingPaths = writes.map((write) => write.path).filter((path) => fs.existsSync(path));
    let shouldBackup = options.backup === true;
    if (
      !options.dryRun &&
      !shouldBackup &&
      !options.yes &&
      existingPaths.length > 0 &&
      (migrationMode === 'static' || migrationMode === 'llm')
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
      const backupResult = await createBackup(existingPaths, services);
      ConsoleOutput.info(`Backup created: ${backupResult.dir}`);
    }

    const spinner = createSpinner(
      options.dryRun
        ? 'Planning PromptScript configuration...'
        : 'Creating PromptScript configuration...'
    ).start();
    const writeResult = await executeWritePlan(writes, services, {
      dryRun: options.dryRun,
      force: options.force === true || shouldBackup,
    });

    if (options.dryRun) {
      spinner.succeed('PromptScript initialization plan ready');
      showWritePlan(writeResult);
      return;
    }

    if (migrationPrompt) {
      deliverMigrationPrompt(migrationPrompt);
    }

    // Install auto-compile hooks for the selected targets unless --no-hooks.
    // commander maps `--no-hooks` to options.hooks === false, so any other value
    // (undefined, true) keeps the default behaviour of installing hooks.
    const installedHookTargets: AIToolTarget[] = [];
    if (options.hooks !== false) {
      for (const target of config.targets) {
        const hookName = TARGET_TO_HOOK_NAME[target] ?? target;
        if (!getToolConfig(hookName)) {
          // No hook config registered for this target — silently skip
          continue;
        }
        const previousExitCode = process.exitCode;
        process.exitCode = undefined;
        try {
          await hooksCommand('install', hookName);
          if (process.exitCode === undefined || process.exitCode === 0) {
            installedHookTargets.push(target);
          } else {
            ConsoleOutput.warn(`Failed to install ${target} hooks`);
          }
        } catch (error) {
          ConsoleOutput.warn(
            `Failed to install ${target} hooks: ${
              error instanceof Error ? error.message : String(error)
            }`
          );
        } finally {
          process.exitCode = previousExitCode;
        }
      }
    }

    spinner.succeed('PromptScript initialized');

    // Show summary
    ConsoleOutput.newline();
    ConsoleOutput.stats('Created:');
    for (const path of writeResult.created) {
      ConsoleOutput.success(path);
    }
    for (const path of writeResult.updated) {
      ConsoleOutput.success(`${path} (updated)`);
    }
    ConsoleOutput.newline();
    ConsoleOutput.stats('Configuration:');
    ConsoleOutput.muted(`  Project: ${config.projectId}`);
    if (config.team) {
      ConsoleOutput.muted(`  Team: ${config.team}`);
    }
    ConsoleOutput.muted(`  Targets: ${config.targets.join(', ')}`);
    if (config.inherit) {
      ConsoleOutput.muted(`  Inherit: ${config.inherit}`);
    }
    if (config.registry) {
      if (config.registry.type === 'git') {
        ConsoleOutput.muted(`  Registry: ${config.registry.url} (${config.registry.ref})`);
      } else {
        ConsoleOutput.muted(`  Registry: ${config.registry.path} (local)`);
      }
    }
    if (config.use && config.use.length > 0) {
      ConsoleOutput.muted(`  Use: ${config.use.join(', ')}`);
    }

    // Show Prettier detection status
    ConsoleOutput.newline();
    if (config.prettierConfigPath) {
      ConsoleOutput.info(`Prettier config detected: ${config.prettierConfigPath}`);
      ConsoleOutput.muted('  Output formatting will respect your Prettier settings');
    } else {
      ConsoleOutput.muted('No Prettier config found');
      ConsoleOutput.muted('  Default formatting options added to config (tabWidth: 2)');
    }

    ConsoleOutput.newline();
    ConsoleOutput.stats('Next steps:');

    if (migrationMode === 'llm') {
      ConsoleOutput.muted('1. Use the migration skill in your AI tool:');
      const skillInvocations = getSkillInvocationHints(config.targets);
      for (const hint of skillInvocations) {
        ConsoleOutput.muted(`   ${hint}`);
      }
      ConsoleOutput.muted('2. Review generated .promptscript/project.prs');
      ConsoleOutput.muted('3. Run: prs compile');
    } else if (migrationMode === 'static') {
      ConsoleOutput.muted('1. Review imported .promptscript/ files');
      ConsoleOutput.muted('2. Run: prs validate --strict');
      ConsoleOutput.muted('3. Run: prs compile');
    } else {
      ConsoleOutput.muted('1. Edit .promptscript/project.prs to customize your AI instructions');
      ConsoleOutput.muted('2. Run: prs compile');

      // Show migration hint if there are existing non-PromptScript instruction files
      if (hasMigrationCandidates(aiToolsDetection)) {
        const migrationHint = formatMigrationHint(aiToolsDetection);
        for (const line of migrationHint) {
          if (
            line.includes('Existing instruction files') ||
            line.includes('migrated') ||
            line.includes('See:')
          ) {
            ConsoleOutput.info(line.replace(/^\s+/, ''));
          } else if (line.trim().startsWith('-')) {
            ConsoleOutput.muted(line);
          } else if (line.trim()) {
            ConsoleOutput.stats(line);
          }
        }
      }
    }

    ConsoleOutput.newline();
    if (installedHookTargets.length > 0) {
      ConsoleOutput.info(`Auto-compile hooks installed for: ${installedHookTargets.join(', ')}`);
    } else if (options.hooks === false) {
      ConsoleOutput.muted(
        'Hooks skipped (--no-hooks). Run "prs hooks install" later to enable auto-compilation.'
      );
    } else {
      ConsoleOutput.muted(
        'Tip: Run prs hooks install to set up auto-compilation hooks for your AI tools.'
      );
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'ExitPromptError') {
      // User cancelled with Ctrl+C
      ConsoleOutput.newline();
      ConsoleOutput.muted('Initialization cancelled');
      return;
    }
    ConsoleOutput.error(
      `Initialization failed: ${error instanceof Error ? error.message : String(error)}`
    );
    process.exitCode = 1;
  }
}

/**
 * Show the gateway prompt asking the user how to handle existing instruction files.
 */
async function showGatewayPrompt(
  detection: Awaited<ReturnType<typeof detectAITools>>,
  services: CliServices
): Promise<'static' | 'llm' | 'skip'> {
  ConsoleOutput.newline();
  ConsoleOutput.stats('Found existing instruction files:');
  for (const c of detection.migrationCandidates) {
    ConsoleOutput.muted(`  ${c.path} (${c.sizeHuman}, ${c.toolName})`);
  }
  ConsoleOutput.newline();

  const gateway = await services.prompts.select({
    message: 'How would you like to start?',
    choices: [
      { name: 'Migrate existing instructions to PromptScript', value: 'migrate' },
      { name: 'Fresh start (ignore existing files)', value: 'fresh-start' },
    ],
  });

  if (gateway === 'fresh-start') return 'skip';

  return selectMigrationStrategy(services);
}

export async function selectMigrationStrategy(services: CliServices): Promise<'static' | 'llm'> {
  const strategy = await services.prompts.select({
    message: 'How do you want to migrate?',
    choices: [
      { name: 'Static import (fast, deterministic)', value: 'static' },
      { name: 'AI-assisted migration (installs skill + generates prompt)', value: 'llm' },
    ],
  });

  return strategy as 'static' | 'llm';
}

/**
 * Handle static (deterministic) migration of instruction files.
 */
async function handleStaticMigration(
  candidates: MigrationCandidate[],
  config: ResolvedConfig,
  options: InitOptions,
  services: CliServices
): Promise<Map<string, string>> {
  // If specific files were requested (prs migrate --files), filter candidates
  const effectiveCandidates =
    options._migrateFiles && options._migrateFiles.length > 0
      ? candidates.filter((c) => options._migrateFiles!.includes(c.path))
      : candidates;

  let selectedPaths = effectiveCandidates.map((c) => c.path);
  if (!options.yes && (!options._migrateFiles || options._migrateFiles.length === 0)) {
    selectedPaths = await services.prompts.checkbox({
      message: 'Select files to import:',
      choices: effectiveCandidates.map((c) => ({
        name: `${c.path} (${c.sizeHuman}, ${c.toolName})`,
        value: c.path,
        checked: true,
      })),
    });
  }
  if (selectedPaths.length === 0) {
    throw new Error('No instruction files selected for migration');
  }

  const spinner = createSpinner('Importing instruction files...').start();

  let result: Awaited<ReturnType<typeof importMultipleFiles>>;
  try {
    result = await importMultipleFiles(
      selectedPaths.map((f) => resolve(services.cwd, f)),
      {
        projectName: config.projectId,
        syntaxVersion: getLatestSyntaxVersion(),
      }
    );

    if (
      result.perFileReports.length !== selectedPaths.length ||
      result.perFileReports.some((report) => report.sectionCount === 0)
    ) {
      const details = result.warnings.length > 0 ? ` ${result.warnings.join(' ')}` : '';
      throw new Error(`Not all selected instruction files could be imported.${details}`);
    }
  } catch (error) {
    spinner.fail?.('Instruction import failed');
    throw error;
  }

  spinner.succeed(`Imported ${result.perFileReports.length} files`);

  ConsoleOutput.newline();
  ConsoleOutput.stats('Import Summary:');
  for (const report of result.perFileReports) {
    const pct = Math.round(report.confidence * 100);
    ConsoleOutput.muted(`  ${basename(report.file)} -> ${report.sectionCount} sections (${pct}%)`);
  }
  ConsoleOutput.muted(`  Overall confidence: ${Math.round(result.overallConfidence * 100)}%`);
  if (result.deduplicatedCount > 0) {
    ConsoleOutput.muted(`  Deduplicated: ${result.deduplicatedCount} lines`);
  }
  for (const w of result.warnings) {
    ConsoleOutput.warn(w);
  }

  return result.files;
}

function prepareLlmMigration(candidates: MigrationCandidate[], options: InitOptions): string {
  const effectiveCandidates =
    options._migrateFiles && options._migrateFiles.length > 0
      ? candidates.filter((candidate) => options._migrateFiles?.includes(candidate.path))
      : candidates;

  return generateMigrationPrompt(
    effectiveCandidates.map((candidate) => ({
      path: candidate.path,
      sizeHuman: candidate.sizeHuman,
      toolName: candidate.toolName,
    }))
  );
}

function deliverMigrationPrompt(prompt: string): void {
  const copied = copyToClipboard(prompt);
  if (copied) {
    ConsoleOutput.success('Migration prompt copied to clipboard!');
  } else {
    console.log(prompt);
  }
  ConsoleOutput.info('Saved to .promptscript/migration-prompt.md');
}

export function getSkillWrites(targets: AIToolTarget[]): PlannedWrite[] {
  const writes: PlannedWrite[] = [];
  const skillName = 'promptscript';
  const skillSource = resolve(BUNDLED_SKILLS_DIR, skillName, 'SKILL.md');
  try {
    const rawSkillContent = readFileSync(skillSource, 'utf-8');
    // Add PromptScript marker so `prs compile` can safely overwrite these files.
    // Use YAML comment inside frontmatter to avoid breaking tools like Factory AI
    // that cannot parse HTML comments between frontmatter and content body.
    let skillContent = rawSkillContent;
    const hasMarker =
      rawSkillContent.includes('<!-- PromptScript') ||
      rawSkillContent.includes('# promptscript-generated:');
    if (!hasMarker && rawSkillContent.startsWith('---')) {
      const yamlMarker = '# promptscript-generated: true';
      skillContent = `---\n${yamlMarker}${rawSkillContent.slice(3)}`;
    }

    writes.push({
      path: `.promptscript/skills/${skillName}/SKILL.md`,
      content: skillContent,
    });

    for (const target of targets) {
      const targetSkillDir = getTargetSkillDir(target, skillName);
      if (targetSkillDir && !writes.some((write) => write.path === targetSkillDir.path)) {
        writes.push({ path: targetSkillDir.path, content: skillContent });
      }
    }
  } catch {
    ConsoleOutput.warn(`Could not install migration skill from ${skillSource}`);
  }

  return writes;
}

/**
 * Resolve configuration from CLI args or interactive prompts.
 */
async function resolveConfig(
  options: InitOptions,
  projectInfo: ProjectInfo,
  aiToolsDetection: Awaited<ReturnType<typeof detectAITools>>,
  prettierConfigPath: string | null,
  manifest: RegistryManifest | undefined,
  services: CliServices
): Promise<ResolvedConfig> {
  // If --yes flag, use all defaults (including manifest suggestions)
  if (options.yes) {
    const userConfig = await loadUserConfig();
    const envOverrides = loadEnvOverrides();
    let inherit = options.inherit;
    let use: string[] | undefined;
    let activeManifest = manifest;

    // Determine registry from CLI flag, env vars, user config, or skip
    // Priority: CLI flags > env vars > user config
    const envGitUrl = envOverrides.registry?.git?.url;
    const envGitRef = envOverrides.registry?.git?.ref;
    const userGitUrl = userConfig.registry?.git?.url;
    const userGitRef = userConfig.registry?.git?.ref;
    const effectiveGitUrl = envGitUrl || userGitUrl;
    const effectiveGitRef = envGitRef ?? userGitRef;

    let registry: RegistryConfig | undefined;
    if (options.registry) {
      registry = { type: 'local', path: options.registry };
    } else if (effectiveGitUrl) {
      registry = {
        type: 'git',
        url: effectiveGitUrl,
        ref: effectiveGitRef ?? 'main',
      };
      // Try to fetch manifest from configured registry
      if (!activeManifest) {
        try {
          const manifestUrl = githubRepoToManifestUrl(effectiveGitUrl, effectiveGitRef);
          const { manifest: remoteManifest } = await loadManifestFromUrl(manifestUrl);
          activeManifest = remoteManifest;
        } catch {
          // Ignore - continue without manifest
        }
      }
    }

    // Apply manifest suggestions if available
    let skills: string[] | undefined;
    if (activeManifest) {
      const context = await buildProjectContext(projectInfo, services);
      const suggestions = calculateSuggestions(activeManifest, context);
      if (!inherit && suggestions.inherit) {
        inherit = suggestions.inherit;
      }
      if (suggestions.use.length > 0) {
        use = suggestions.use;
      }
      if (suggestions.skills.length > 0) {
        skills = suggestions.skills;
      }
    }

    return {
      projectId: options.name ?? projectInfo.name,
      team: options.team ?? userConfig.defaults?.team,
      inherit,
      use,
      skills,
      registry,
      targets:
        (options.targets as AIToolTarget[]) ??
        (userConfig.defaults?.targets as AIToolTarget[]) ??
        getSuggestedTargets(aiToolsDetection),
      prettierConfigPath,
    };
  }

  // If not interactive and all required options provided, use them
  if (!options.interactive && options.name && options.targets) {
    const registry: RegistryConfig | undefined = options.registry
      ? { type: 'local', path: options.registry }
      : undefined;

    return {
      projectId: options.name,
      team: options.team,
      inherit: options.inherit,
      registry,
      targets: options.targets as AIToolTarget[],
      prettierConfigPath,
    };
  }

  // Interactive mode
  return await runInteractivePrompts(
    options,
    projectInfo,
    aiToolsDetection,
    prettierConfigPath,
    manifest,
    services
  );
}

/**
 * Run interactive prompts to gather configuration.
 */
async function runInteractivePrompts(
  options: InitOptions,
  projectInfo: ProjectInfo,
  aiToolsDetection: Awaited<ReturnType<typeof detectAITools>>,
  prettierConfigPath: string | null,
  manifest: RegistryManifest | undefined,
  services: CliServices
): Promise<ResolvedConfig> {
  const { prompts } = services;
  ConsoleOutput.newline();
  ConsoleOutput.stats('PromptScript Setup');
  ConsoleOutput.newline();

  // Show detected info
  if (projectInfo.source !== 'directory') {
    ConsoleOutput.muted(`Detected project from ${projectInfo.source}`);
  }
  if (projectInfo.languages.length > 0) {
    ConsoleOutput.muted(`Languages: ${projectInfo.languages.join(', ')}`);
  }
  if (projectInfo.frameworks.length > 0) {
    ConsoleOutput.muted(`Frameworks: ${projectInfo.frameworks.join(', ')}`);
  }

  // Show AI tools detection
  const detectionLines = formatDetectionResults(aiToolsDetection);
  for (const line of detectionLines) {
    ConsoleOutput.muted(line);
  }

  // Show Prettier detection
  if (prettierConfigPath) {
    ConsoleOutput.muted(`Prettier: ${prettierConfigPath}`);
  }
  ConsoleOutput.newline();

  // 1. Project name
  const projectId = await prompts.input({
    message: 'Project name:',
    default: options.name ?? projectInfo.name,
  });

  // 2. Registry configuration
  let registry: RegistryConfig | undefined;
  const activeManifest = manifest;

  const registryChoice = await prompts.select({
    message: 'Registry configuration:',
    choices: [
      {
        name: '🔗 Connect to a Git registry',
        value: 'custom-git',
      },
      {
        name: '📁 Use a local registry directory',
        value: 'local',
      },
      {
        name: '⏭️  Skip registry (configure later)',
        value: 'skip',
      },
    ],
    default: 'skip',
  });

  if (registryChoice === 'custom-git') {
    const gitUrl = await prompts.input({
      message: 'Git repository URL:',
      default: 'https://github.com/your-org/your-registry.git',
      validate: (value) => {
        if (!isValidGitUrl(value)) {
          return 'Please enter a valid Git repository URL (https:// or git@)';
        }
        return true;
      },
    });
    const gitRef = await prompts.input({
      message: 'Branch or tag:',
      default: 'main',
    });
    registry = {
      type: 'git',
      url: gitUrl,
      ref: gitRef,
    };
  } else if (registryChoice === 'local') {
    const localPath = await prompts.input({
      message: 'Local registry path:',
      default: options.registry ?? './registry',
    });
    registry = {
      type: 'local',
      path: localPath,
    };
  }

  // 3. Manifest-based suggestions (if available)
  let inherit: string | undefined = options.inherit;
  let use: string[] | undefined;
  let skills: string[] | undefined;

  if (activeManifest) {
    const context = await buildProjectContext(projectInfo, services);
    const suggestions = calculateSuggestions(activeManifest, context);

    // Show suggestions
    if (suggestions.inherit || suggestions.use.length > 0 || suggestions.skills.length > 0) {
      ConsoleOutput.newline();
      ConsoleOutput.stats('Suggested configurations based on your project:');
      const suggestionLines = formatSuggestionResult(suggestions);
      for (const line of suggestionLines) {
        ConsoleOutput.muted(`  ${line}`);
      }
      ConsoleOutput.newline();

      // Create choices for selection
      const choices = createSuggestionChoices(activeManifest, suggestions);

      if (choices.length > 0) {
        const selected = await prompts.checkbox({
          message: 'Select configurations to use:',
          choices: choices.map((c) => ({
            name: c.description ? `${c.name} - ${c.description}` : c.name,
            value: c.value,
            checked: c.checked,
          })),
        });

        const parsed = parseSelectedChoices(selected);
        inherit = parsed.inherit;
        use = parsed.use.length > 0 ? parsed.use : undefined;
        skills = parsed.skills.length > 0 ? parsed.skills : undefined;
      }
    }
  }

  // 4. Manual inheritance (if no manifest or user skipped suggestions)
  if (!inherit) {
    const wantsInherit = await prompts.confirm({
      message: 'Do you want to inherit from a parent configuration?',
      default: false,
    });

    if (wantsInherit) {
      inherit = await prompts.input({
        message: 'Inheritance path (e.g., @stacks/react):',
        default: options.inherit ?? '@stacks/react',
        validate: (value) => {
          if (!value.startsWith('@')) {
            return 'Inheritance path should start with @';
          }
          return true;
        },
      });
    }
  }

  // 5. Targets
  const userConfig = await loadUserConfig();
  const configuredTargets =
    (options.targets as AIToolTarget[] | undefined) ??
    (userConfig.defaults?.targets as AIToolTarget[] | undefined) ??
    [];
  if (configuredTargets.length > 0) {
    validateTargets(configuredTargets);
  }
  const detectedTargets = getSuggestedTargets(aiToolsDetection);
  const suggestedTargets = Array.from(new Set([...configuredTargets, ...detectedTargets]));
  const allTargets = getAllTargets();

  const targets = await prompts.checkbox({
    message:
      suggestedTargets.length > 0
        ? 'Select target AI tools (detected and configured tools preselected):'
        : 'Select target AI tools (none detected):',
    choices: allTargets.map((target) => {
      const suffix = detectedTargets.includes(target)
        ? ' (detected)'
        : configuredTargets.includes(target)
          ? ' (configured)'
          : '';
      return {
        name: `${formatTargetName(target)}${suffix}`,
        value: target,
        checked: suggestedTargets.includes(target),
      };
    }),
    validate: (value) => {
      if (value.length === 0) {
        return 'Please select at least one target';
      }
      return true;
    },
  });

  // 6. Team (optional, derived from inherit or asked separately)
  let team: string | undefined = options.team;
  if (inherit && !team) {
    // Extract team from inherit path: @company/team -> company
    const match = /^@([^/]+)/.exec(inherit);
    if (match) {
      team = match[1];
    }
  }

  return {
    projectId,
    team,
    inherit,
    use,
    skills,
    registry,
    targets,
    prettierConfigPath,
  };
}

function validateTargets(targets: AIToolTarget[]): void {
  if (targets.length === 0) {
    throw new Error(
      'No AI tools detected. Pass --targets <target...> or configure defaults in ~/.promptscript/config.yaml.'
    );
  }

  const available = new Set(getAllTargets());
  const unknown = targets.filter((target) => !available.has(target));
  if (unknown.length > 0) {
    throw new Error(
      `Unknown target${unknown.length === 1 ? '' : 's'}: ${unknown.join(', ')}. Available: ${Array.from(available).join(', ')}`
    );
  }
}

function validateProjectMetadata(config: ResolvedConfig): void {
  if (config.projectId.trim().length === 0 || /[\r\n]/.test(config.projectId)) {
    throw new Error('Project name must be a non-empty single line');
  }
  if (
    config.team !== undefined &&
    (config.team.trim().length === 0 || /[\r\n]/.test(config.team))
  ) {
    throw new Error('Team namespace must be a non-empty single line');
  }
}

function validateDirectives(config: ResolvedConfig): void {
  const directives = [
    ...(config.inherit ? [['inherit', config.inherit] as const] : []),
    ...(config.use ?? []).map((value) => ['use', value] as const),
    ...(config.skills ?? []).map((value) => ['skill', value] as const),
  ];

  for (const [name, value] of directives) {
    if (value.length === 0 || /[\r\n]/.test(value)) {
      throw new Error(`Invalid ${name} directive: values must be non-empty single lines`);
    }
  }
}

function showWritePlan(result: WritePlanResult): void {
  ConsoleOutput.newline();
  ConsoleOutput.stats('Planned changes:');
  for (const path of result.created) {
    ConsoleOutput.dryRun(`create ${path}`);
  }
  for (const path of result.updated) {
    ConsoleOutput.dryRun(`update ${path}`);
  }
  for (const path of result.unchanged) {
    ConsoleOutput.unchanged(path);
  }
}

/**
 * Format target name for display using the formatter's description.
 */
export function formatTargetName(target: AIToolTarget): string {
  const formatter = FormatterRegistry.get(target);
  if (formatter) {
    return formatter.description;
  }
  return target;
}

/**
 * Get the skill directory path for a target.
 * Uses the formatter's getSkillBasePath() and getSkillFileName() methods.
 * Returns null if the target doesn't support skills.
 */
function getTargetSkillDir(
  target: AIToolTarget,
  skillName: string
): { dir: string; path: string } | null {
  const formatter = FormatterRegistry.get(target);
  if (!formatter) return null;

  const basePath = formatter.getSkillBasePath();
  const fileName = formatter.getSkillFileName();
  if (!basePath || !fileName) return null;

  const dir = `${basePath}/${skillName}`;
  return { dir, path: `${dir}/${fileName}` };
}

/**
 * Get skill invocation hints for the selected targets.
 * Only shows tools that support skills (SKILL.md discovery).
 */
function getSkillInvocationHints(targets: AIToolTarget[]): string[] {
  const hints: string[] = [];

  for (const target of targets) {
    const formatter = FormatterRegistry.get(target);
    if (formatter && formatter.getSkillBasePath()) {
      hints.push(`${formatter.description}: /promptscript`);
    }
  }

  return hints;
}

/**
 * Generate the config file content.
 */
function generateConfig(config: ResolvedConfig): string {
  const syntaxVersion = getLatestSyntaxVersion();
  const output: PromptScriptConfig = {
    id: config.projectId,
    syntax: syntaxVersion,
    targets: config.targets,
    validation: {
      rules: {
        'empty-block': 'warning',
      },
    },
  };

  if (config.inherit) {
    output.inherit = config.inherit;
  }
  if (config.registry) {
    if (config.registry.type === 'git') {
      output.registry = {
        git: {
          url: config.registry.url ?? '',
          ref: config.registry.ref,
        },
      };
    } else {
      output.registry = { path: config.registry.path };
    }
  }

  if (config.prettierConfigPath) {
    output.formatting = { prettier: true };
  } else {
    output.formatting = {
      tabWidth: 2,
      proseWrap: 'preserve',
    };
  }

  return stringifyYaml(output, { lineWidth: 0 });
}

/**
 * Generate the project.prs file content.
 */
function generateProjectPs(config: ResolvedConfig, projectInfo: ProjectInfo): string {
  const useEntries: string[] = [];
  if (config.use && config.use.length > 0) {
    useEntries.push(...config.use.map((u) => `@use ${u}`));
  }
  if (config.skills && config.skills.length > 0) {
    useEntries.push(...config.skills.map((s) => `@use ${s}`));
  }
  const syntaxVersion = getLatestSyntaxVersion();
  const directives = [
    config.inherit ? `@inherit ${config.inherit}` : undefined,
    ...useEntries,
  ].filter((line): line is string => line !== undefined);
  const contextLines = [`  project: ${JSON.stringify(config.projectId)}`];
  if (projectInfo.languages.length > 0) {
    contextLines.push(`  languages: ${JSON.stringify(projectInfo.languages)}`);
  }
  if (projectInfo.frameworks.length > 0) {
    contextLines.push(`  frameworks: ${JSON.stringify(projectInfo.frameworks)}`);
  }

  const metadataLines = [
    `  id: ${JSON.stringify(config.projectId)}`,
    `  syntax: ${JSON.stringify(syntaxVersion)}`,
    ...(config.team ? [`  team: ${JSON.stringify(config.team)}`] : []),
  ];

  return `@meta {
${metadataLines.join('\n')}
}
${directives.length > 0 ? `\n${directives.join('\n')}\n` : ''}
@identity {
  """
  You are working in this project. Follow its documented architecture and conventions.
  """
}

@context {
${contextLines.join('\n')}
}

@restrictions {
  - "Follow security best practices"
}
`;
}
