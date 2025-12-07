import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { input, confirm, checkbox } from '@inquirer/prompts';
import type { InitOptions } from '../types';
import { createSpinner, ConsoleOutput } from '../output/console';
import { detectProject, type ProjectInfo } from '../utils/project-detector';
import {
  detectAITools,
  getAllTargets,
  getSuggestedTargets,
  formatDetectionResults,
  type AIToolTarget,
} from '../utils/ai-tools-detector';

/**
 * Resolved configuration after prompts or CLI args.
 */
interface ResolvedConfig {
  projectId: string;
  team?: string;
  inherit?: string;
  registry?: string;
  targets: AIToolTarget[];
}

/**
 * Initialize PromptScript in the current directory.
 * Creates configuration file and initial project structure.
 */
export async function initCommand(options: InitOptions): Promise<void> {
  // Check if already initialized
  if (existsSync('promptscript.yaml') && !options.force) {
    ConsoleOutput.warn('PromptScript already initialized');
    ConsoleOutput.muted('Use --force to reinitialize');
    return;
  }

  try {
    // Detect project info and AI tools
    const projectInfo = await detectProject();
    const aiToolsDetection = await detectAITools();

    // Resolve configuration (interactive or from CLI args)
    const config = await resolveConfig(options, projectInfo, aiToolsDetection);

    // Create files
    const spinner = createSpinner('Creating PromptScript configuration...').start();

    await mkdir('.promptscript', { recursive: true });

    const configContent = generateConfig(config);
    await writeFile('promptscript.yaml', configContent, 'utf-8');

    const projectPsContent = generateProjectPs(config, projectInfo);
    await writeFile('.promptscript/project.prs', projectPsContent, 'utf-8');

    spinner.succeed('PromptScript initialized');

    // Show summary
    ConsoleOutput.newline();
    console.log('Created:');
    ConsoleOutput.success('promptscript.yaml');
    ConsoleOutput.success('.promptscript/project.prs');
    ConsoleOutput.newline();
    console.log('Configuration:');
    ConsoleOutput.muted(`  Project: ${config.projectId}`);
    ConsoleOutput.muted(`  Targets: ${config.targets.join(', ')}`);
    if (config.inherit) {
      ConsoleOutput.muted(`  Inherit: ${config.inherit}`);
    }
    if (config.registry) {
      ConsoleOutput.muted(`  Registry: ${config.registry}`);
    }
    ConsoleOutput.newline();
    console.log('Next steps:');
    ConsoleOutput.muted('1. Edit .promptscript/project.prs to customize your AI instructions');
    ConsoleOutput.muted('2. Run: prs compile --all');
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
  aiToolsDetection: Awaited<ReturnType<typeof detectAITools>>
): Promise<ResolvedConfig> {
  // If --yes flag, use all defaults
  if (options.yes) {
    return {
      projectId: options.name ?? projectInfo.name,
      team: options.team,
      inherit: options.inherit,
      registry: options.registry ?? './registry',
      targets: (options.targets as AIToolTarget[]) ?? getSuggestedTargets(aiToolsDetection),
    };
  }

  // If not interactive and all required options provided, use them
  if (!options.interactive && options.name && options.targets) {
    return {
      projectId: options.name,
      team: options.team,
      inherit: options.inherit,
      registry: options.registry,
      targets: options.targets as AIToolTarget[],
    };
  }

  // Interactive mode
  return await runInteractivePrompts(options, projectInfo, aiToolsDetection);
}

/**
 * Run interactive prompts to gather configuration.
 */
async function runInteractivePrompts(
  options: InitOptions,
  projectInfo: ProjectInfo,
  aiToolsDetection: Awaited<ReturnType<typeof detectAITools>>
): Promise<ResolvedConfig> {
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
  ConsoleOutput.newline();

  // 1. Project name
  const projectId = await input({
    message: 'Project name:',
    default: options.name ?? projectInfo.name,
  });

  // 2. Inheritance
  const wantsInherit = await confirm({
    message: 'Do you want to inherit from a parent configuration?',
    default: false,
  });

  let inherit: string | undefined;
  if (wantsInherit) {
    inherit = await input({
      message: 'Inheritance path (e.g., @company/team):',
      default: options.inherit ?? '@company/team',
      validate: (value) => {
        if (!value.startsWith('@')) {
          return 'Inheritance path should start with @';
        }
        return true;
      },
    });
  }

  // 3. Registry
  const wantsRegistry = await confirm({
    message: 'Do you want to configure a registry?',
    default: true,
  });

  let registry: string | undefined;
  if (wantsRegistry) {
    registry = await input({
      message: 'Registry path:',
      default: options.registry ?? './registry',
    });
  }

  // 4. Targets
  const suggestedTargets = getSuggestedTargets(aiToolsDetection);
  const allTargets = getAllTargets();

  const targets = await checkbox({
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

  // 5. Team (optional, derived from inherit or asked separately)
  let team: string | undefined = options.team;
  if (inherit && !team) {
    // Extract team from inherit path: @company/team -> company
    const match = inherit.match(/^@([^/]+)/);
    if (match) {
      team = match[1];
    }
  }

  return {
    projectId,
    team,
    inherit,
    registry,
    targets: targets as AIToolTarget[],
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
    lines.push("# inherit: '@company/team'");
  }

  lines.push('');

  if (config.registry) {
    lines.push('registry:', `  path: '${config.registry}'`);
  } else {
    lines.push('# registry:', "#   path: './registry'");
  }

  lines.push('', 'targets:');
  for (const target of config.targets) {
    lines.push(`  - ${target}`);
  }

  lines.push('', 'validation:', '  rules:', '    empty-block: warn', '');

  return lines.join('\n');
}

/**
 * Generate the project.prs file content.
 */
function generateProjectPs(config: ResolvedConfig, projectInfo: ProjectInfo): string {
  const inheritLine = config.inherit ? `@inherit ${config.inherit}` : '# @inherit @company/team';

  const languagesLine =
    projectInfo.languages.length > 0
      ? `  languages: [${projectInfo.languages.join(', ')}]`
      : '  # languages: [typescript]';

  const frameworksLine =
    projectInfo.frameworks.length > 0
      ? `  frameworks: [${projectInfo.frameworks.join(', ')}]`
      : '  # frameworks: []';

  return `# Project Configuration
# Edit this file to customize AI instructions for your project

@meta {
  id: "${config.projectId}"
  version: "1.0.0"
}

${inheritLine}

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
