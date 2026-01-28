import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { getPackageVersion, type RegistryManifest } from '@promptscript/core';
import { type CliServices, createDefaultServices } from '../services.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
import { findPrettierConfig } from '../prettier/loader.js';
import {
  MIGRATE_SKILL_CLAUDE,
  MIGRATE_SKILL_GITHUB,
  MIGRATE_SKILL_CURSOR,
  MIGRATE_SKILL_ANTIGRAVITY,
} from '../templates/migrate-skill.js';
import {
  loadManifest,
  loadManifestFromUrl,
  ManifestLoadError,
  OFFICIAL_REGISTRY,
} from '../utils/manifest-loader.js';
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
    const installedSkillPaths: string[] = [];
    if (options.migrate) {
      if (config.targets.includes('claude')) {
        await fs.mkdir('.claude/skills/migrate-to-promptscript', { recursive: true });
        await fs.writeFile(
          '.claude/skills/migrate-to-promptscript/SKILL.md',
          MIGRATE_SKILL_CLAUDE,
          'utf-8'
        );
        installedSkillPaths.push('.claude/skills/migrate-to-promptscript/SKILL.md');
      }
      if (config.targets.includes('github')) {
        await fs.mkdir('.github/skills/migrate-to-promptscript', { recursive: true });
        await fs.writeFile(
          '.github/skills/migrate-to-promptscript/SKILL.md',
          MIGRATE_SKILL_GITHUB,
          'utf-8'
        );
        installedSkillPaths.push('.github/skills/migrate-to-promptscript/SKILL.md');
      }
      if (config.targets.includes('cursor')) {
        await fs.mkdir('.cursor/commands', { recursive: true });
        await fs.writeFile('.cursor/commands/migrate.md', MIGRATE_SKILL_CURSOR, 'utf-8');
        installedSkillPaths.push('.cursor/commands/migrate.md');
      }
      if (config.targets.includes('antigravity')) {
        await fs.mkdir('.agent/rules', { recursive: true });
        await fs.writeFile('.agent/rules/migrate.md', MIGRATE_SKILL_ANTIGRAVITY, 'utf-8');
        installedSkillPaths.push('.agent/rules/migrate.md');
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
      ConsoleOutput.muted('1. Use the migration skill to convert existing instructions:');
      if (config.targets.includes('claude')) {
        ConsoleOutput.muted('   Claude Code: /migrate');
      }
      if (config.targets.includes('github')) {
        ConsoleOutput.muted('   GitHub Copilot: @workspace /migrate');
      }
      if (config.targets.includes('cursor')) {
        ConsoleOutput.muted('   Cursor: /migrate');
      }
      if (config.targets.includes('antigravity')) {
        ConsoleOutput.muted('   Antigravity: Ask to "migrate to PromptScript"');
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
    if ((error as Error).name === 'ExitPromptError') {
      // User cancelled with Ctrl+C
      ConsoleOutput.newline();
      ConsoleOutput.muted('Initialization cancelled');
      return;
    }
    ConsoleOutput.error(`Initialization failed: ${(error as Error).message}`);
    process.exit(1);
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
    let inherit = options.inherit;
    let use: string[] | undefined;
    let activeManifest = manifest;

    // Try to fetch official registry manifest if not already loaded
    if (!activeManifest) {
      try {
        const { manifest: remoteManifest } = await loadManifestFromUrl();
        activeManifest = remoteManifest;
      } catch {
        // Ignore - continue without manifest
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

    // Default to official registry in --yes mode
    const registry: RegistryConfig = options.registry
      ? { type: 'local', path: options.registry }
      : { type: 'git', url: OFFICIAL_REGISTRY.url, ref: OFFICIAL_REGISTRY.branch };

    return {
      projectId: options.name ?? projectInfo.name,
      team: options.team,
      inherit,
      use,
      registry,
      targets: (options.targets as AIToolTarget[]) ?? getSuggestedTargets(aiToolsDetection),
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
  let activeManifest = manifest;

  const registryChoice = await prompts.select({
    message: 'Registry configuration:',
    choices: [
      {
        name: `📦 Use official PromptScript Registry (${OFFICIAL_REGISTRY.url})`,
        value: 'official',
      },
      {
        name: '🔗 Connect to a custom Git registry',
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
    default: manifest ? 'official' : 'skip',
  });

  if (registryChoice === 'official') {
    registry = {
      type: 'git',
      url: OFFICIAL_REGISTRY.url,
      ref: OFFICIAL_REGISTRY.branch,
    };
    // Fetch manifest from official registry if not already loaded
    if (!activeManifest) {
      try {
        ConsoleOutput.muted('Fetching registry manifest...');
        const { manifest: remoteManifest } = await loadManifestFromUrl();
        activeManifest = remoteManifest;
        ConsoleOutput.success(
          `Loaded ${remoteManifest.catalog.length} configurations from official registry`
        );
      } catch {
        ConsoleOutput.warn('Could not fetch registry manifest - suggestions will be limited');
      }
    }
  } else if (registryChoice === 'custom-git') {
    const gitUrl = await prompts.input({
      message: 'Git repository URL:',
      default: 'https://github.com/your-org/your-registry.git',
      validate: (value) => {
        if (!value.includes('github.com') && !value.includes('gitlab.com')) {
          return 'Please enter a valid Git repository URL';
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
 * Format target name for display.
 */
function formatTargetName(target: AIToolTarget): string {
  const names: Record<AIToolTarget, string> = {
    github: 'GitHub Copilot',
    claude: 'Claude (Anthropic)',
    cursor: 'Cursor',
    antigravity: 'Antigravity (Google)',
  };
  return names[target] ?? target;
}

/**
 * Generate the config file content.
 */
function generateConfig(config: ResolvedConfig): string {
  const lines: string[] = ["version: '1'", '', 'project:', `  id: '${config.projectId}'`];

  if (config.team) {
    lines.push(`  team: '${config.team}'`);
  }

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
      "#     url: 'https://github.com/mrwogu/promptscript-registry.git'",
      "#     ref: 'main'"
    );
  }

  lines.push('', 'targets:');
  for (const target of config.targets) {
    lines.push(`  - ${target}`);
  }

  lines.push('', 'validation:', '  rules:', '    empty-block: warn');

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
