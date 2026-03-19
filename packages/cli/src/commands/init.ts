import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { readFileSync, existsSync } from 'fs';
import { getPackageVersion, type RegistryManifest } from '@promptscript/core';
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

import type { InitOptions } from '../types.js';
import { createSpinner, ConsoleOutput } from '../output/console.js';
import { detectProject, type ProjectInfo } from '../utils/project-detector.js';
import {
  detectAITools,
  getAllTargets,
  getSuggestedTargets,
  formatDetectionResults,
  formatMigrationHint,
  hasMigrationCandidates,
  type AIToolTarget,
} from '../utils/ai-tools-detector.js';
import { FormatterRegistry } from '@promptscript/formatters';
import { findPrettierConfig } from '../prettier/loader.js';
import {
  loadManifest,
  loadManifestFromUrl,
  ManifestLoadError,
  isValidGitUrl,
  githubRepoToManifestUrl,
} from '../utils/manifest-loader.js';
import { loadUserConfig } from '../config/user-config.js';
import { loadEnvOverrides } from '../config/env-config.js';
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
  const { fs } = services;
  // Check if already initialized
  if (fs.existsSync('promptscript.yaml') && !options.force) {
    ConsoleOutput.warn('PromptScript already initialized');
    ConsoleOutput.muted('Use --force to reinitialize');
    return;
  }

  try {
    // Detect project info and AI tools
    const projectInfo = await detectProject(services);
    const aiToolsDetection = await detectAITools(services);

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

    // Create files
    const spinner = createSpinner('Creating PromptScript configuration...').start();

    await fs.mkdir('.promptscript', { recursive: true });

    const configContent = generateConfig(config);
    await fs.writeFile('promptscript.yaml', configContent, 'utf-8');

    const projectPsContent = generateProjectPs(config, projectInfo);
    await fs.writeFile('.promptscript/project.prs', projectPsContent, 'utf-8');

    // Install migration skill if requested
    // Copies bundled SKILL.md to both .promptscript/skills/ (source) AND
    // directly to each target's skill directory so AI tools can discover
    // the skill without running `prs compile` first (which would overwrite
    // existing instruction files before they can be migrated).
    const installedSkillPaths: string[] = [];
    if (options.migrate) {
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
          const yamlMarker = `# promptscript-generated: ${new Date().toISOString()}`;
          skillContent = `---\n${yamlMarker}${rawSkillContent.slice(3)}`;
        }

        // Install to .promptscript/skills/ (canonical source)
        const skillDest = `.promptscript/skills/${skillName}`;
        await fs.mkdir(skillDest, { recursive: true });
        await fs.writeFile(`${skillDest}/SKILL.md`, skillContent, 'utf-8');
        installedSkillPaths.push(`${skillDest}/SKILL.md`);

        // Install directly to each target's skill directory
        for (const target of config.targets) {
          const targetSkillDir = getTargetSkillDir(target, skillName);
          if (targetSkillDir) {
            await fs.mkdir(targetSkillDir.dir, { recursive: true });
            await fs.writeFile(targetSkillDir.path, skillContent, 'utf-8');
            installedSkillPaths.push(targetSkillDir.path);
          }
        }
      } catch {
        ConsoleOutput.warn(`Could not install migration skill from ${skillSource}`);
      }
    }

    spinner.succeed('PromptScript initialized');

    // Show summary
    ConsoleOutput.newline();
    console.log('Created:');
    ConsoleOutput.success('promptscript.yaml');
    ConsoleOutput.success('.promptscript/project.prs');
    for (const skillPath of installedSkillPaths) {
      ConsoleOutput.success(skillPath);
    }
    ConsoleOutput.newline();
    console.log('Configuration:');
    ConsoleOutput.muted(`  Project: ${config.projectId}`);
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
    console.log('Next steps:');

    // Show migration-specific instructions if --migrate was used
    if (options.migrate && installedSkillPaths.length > 0) {
      ConsoleOutput.muted('1. Use the migration skill in your AI tool:');
      const skillInvocations = getSkillInvocationHints(config.targets);
      for (const hint of skillInvocations) {
        ConsoleOutput.muted(`   ${hint}`);
      }
      ConsoleOutput.muted('2. Review generated .promptscript/project.prs');
      ConsoleOutput.muted('3. Run: prs compile');
    } else {
      ConsoleOutput.muted('1. Edit .promptscript/project.prs to customize your AI instructions');
      ConsoleOutput.muted('2. Run: prs compile');

      // Show migration hint if there are existing non-PromptScript instruction files
      if (hasMigrationCandidates(aiToolsDetection)) {
        const migrationHint = formatMigrationHint(aiToolsDetection);
        for (const line of migrationHint) {
          if (
            line.startsWith('📋') ||
            line.includes('migrated') ||
            line.includes('See:') ||
            line.includes('Or use')
          ) {
            ConsoleOutput.info(line.replace(/^\s+/, ''));
          } else if (line.trim().startsWith('•')) {
            ConsoleOutput.muted(line);
          } else if (line.trim()) {
            console.log(line);
          }
        }
      }
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
    if (activeManifest) {
      const context = await buildProjectContext(projectInfo, services);
      const suggestions = calculateSuggestions(activeManifest, context);
      if (!inherit && suggestions.inherit) {
        inherit = suggestions.inherit;
      }
      if (suggestions.use.length > 0) {
        use = suggestions.use;
      }
    }

    return {
      projectId: options.name ?? projectInfo.name,
      team: options.team ?? userConfig.defaults?.team,
      inherit,
      use,
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
  console.log('🚀 PromptScript Setup');
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

  if (activeManifest) {
    const context = await buildProjectContext(projectInfo, services);
    const suggestions = calculateSuggestions(activeManifest, context);

    // Show suggestions
    if (suggestions.inherit || suggestions.use.length > 0) {
      ConsoleOutput.newline();
      console.log('📦 Suggested configurations based on your project:');
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
  const suggestedTargets = getSuggestedTargets(aiToolsDetection);
  const allTargets = getAllTargets();

  const targets = await prompts.checkbox({
    message: 'Select target AI tools:',
    choices: allTargets.map((target) => ({
      name: formatTargetName(target),
      value: target,
      checked: suggestedTargets.includes(target),
    })),
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
    registry,
    targets,
    prettierConfigPath,
  };
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
  // Get PromptScript syntax version for the config
  const syntaxVersion = getPackageVersion(__dirname, './package.json');

  const lines: string[] = [`id: ${config.projectId}`, `syntax: "${syntaxVersion}"`];

  lines.push('');

  if (config.inherit) {
    lines.push(`inherit: '${config.inherit}'`);
  } else {
    lines.push("# inherit: '@stacks/react'");
  }

  lines.push('');

  // Add use array if configured
  if (config.use && config.use.length > 0) {
    lines.push('use:');
    for (const useItem of config.use) {
      lines.push(`  - '${useItem}'`);
    }
  } else {
    lines.push('# use:', "#   - '@fragments/testing'", "#   - '@fragments/typescript'");
  }

  lines.push('');

  if (config.registry) {
    if (config.registry.type === 'git') {
      lines.push('registry:', '  git:', `    url: '${config.registry.url}'`);
      if (config.registry.ref) {
        lines.push(`    ref: '${config.registry.ref}'`);
      }
    } else {
      lines.push('registry:', `  path: '${config.registry.path}'`);
    }
  } else {
    lines.push(
      '# registry:',
      '#   git:',
      "#     url: 'https://github.com/your-org/your-registry.git'",
      "#     ref: 'main'"
    );
  }

  lines.push('', 'targets:');
  for (const target of config.targets) {
    lines.push(`  - ${target}`);
  }

  lines.push('', 'validation:', '  rules:', '    empty-block: warning');

  // Add formatting configuration
  lines.push('');
  if (config.prettierConfigPath) {
    // Prettier config detected - enable auto-detection
    lines.push('formatting:', '  prettier: true  # Auto-detected from project');
  } else {
    // No Prettier config - add default options
    lines.push(
      'formatting:',
      '  tabWidth: 2',
      "  proseWrap: preserve  # 'always' | 'never' | 'preserve'"
    );
  }

  lines.push('');

  return lines.join('\n');
}

/**
 * Generate the project.prs file content.
 */
function generateProjectPs(config: ResolvedConfig, projectInfo: ProjectInfo): string {
  const inheritLine = config.inherit ? `@inherit ${config.inherit}` : '# @inherit @stacks/react';

  // Generate @use directives
  let useLines = '';
  if (config.use && config.use.length > 0) {
    useLines = config.use.map((u) => `@use ${u}`).join('\n');
  } else {
    useLines = '# @use @fragments/testing\n# @use @fragments/typescript';
  }

  const languagesLine =
    projectInfo.languages.length > 0
      ? `  languages: [${projectInfo.languages.join(', ')}]`
      : '  # languages: [typescript]';

  const frameworksLine =
    projectInfo.frameworks.length > 0
      ? `  frameworks: [${projectInfo.frameworks.join(', ')}]`
      : '  # frameworks: []';

  // Get PromptScript version for syntax field
  const syntaxVersion = getPackageVersion(__dirname, './package.json');

  return `# Project Configuration
# Edit this file to customize AI instructions for your project

@meta {
  id: "${config.projectId}"
  syntax: "${syntaxVersion}"
}

${inheritLine}
${useLines}

@identity {
  """
  You are working on the ${config.projectId} project.

  [Describe your project here]
  """
}

@context {
  project: "${config.projectId}"
${languagesLine}
${frameworksLine}
}

@standards {
  code: {
    # Add your coding standards here
  }
}

@restrictions {
  - "Follow security best practices"
}

@shortcuts {
  "/review": "Review this code for quality and best practices"
  "/test": "Write comprehensive unit tests"
}
`;
}
