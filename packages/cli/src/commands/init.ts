import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { basename } from 'path';
import type { InitOptions } from '../types';
import { createSpinner, ConsoleOutput } from '../output/console';

/**
 * Initialize PromptScript in the current directory.
 * Creates configuration file and initial project structure.
 */
export async function initCommand(options: InitOptions): Promise<void> {
  const spinner = createSpinner('Initializing PromptScript...').start();

  try {
    // Check if already initialized
    if (existsSync('promptscript.config.yaml')) {
      spinner.warn('PromptScript already initialized');
      return;
    }

    // Create directories
    await mkdir('.promptscript', { recursive: true });

    // Create config
    const config = generateConfig(options);
    await writeFile('promptscript.config.yaml', config, 'utf-8');

    // Create project.prs
    const projectPs = generateProjectPs(options);
    await writeFile('.promptscript/project.prs', projectPs, 'utf-8');

    spinner.succeed('PromptScript initialized');
    ConsoleOutput.newline();
    console.log('Created:');
    ConsoleOutput.success('promptscript.config.yaml');
    ConsoleOutput.success('.promptscript/project.prs');
    ConsoleOutput.newline();
    console.log('Next steps:');
    ConsoleOutput.muted('1. Edit .promptscript/project.prs');
    ConsoleOutput.muted('2. Run: prs compile --all');
  } catch (error) {
    spinner.fail('Initialization failed');
    ConsoleOutput.error((error as Error).message);
    process.exit(1);
  }
}

/**
 * Generate the config file content.
 */
function generateConfig(options: InitOptions): string {
  const projectId = basename(process.cwd());
  const teamLine = options.team ? `  team: "${options.team}"` : '';
  const inheritLine = options.team
    ? `inherit: "@${options.team}/team"`
    : '# inherit: "@company/team"';

  return `version: "1"

project:
  id: "${projectId}"
${teamLine}

${inheritLine}

registry:
  path: "./registry"

targets:
  - github
  - claude
  - cursor

validation:
  rules:
    empty-block: warn
`;
}

/**
 * Generate the project.prs file content.
 */
function generateProjectPs(options: InitOptions): string {
  const projectId = basename(process.cwd());
  const inheritLine = options.team ? `@inherit @${options.team}/team` : '# @inherit @company/team';

  return `# Project Configuration
# Edit this file to customize AI instructions for your project

@meta {
  id: "${projectId}"
  version: "1.0.0"
}

${inheritLine}

@identity {
  """
  You are working on this project.
  
  [Describe your project here]
  """
}

@context {
  # project: "Project Name"
  # languages: [typescript]
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
