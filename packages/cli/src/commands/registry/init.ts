import { basename, resolve } from 'path';
import type { RegistryInitOptions } from '../../types.js';
import { type CliServices, createDefaultServices } from '../../services.js';
import { createSpinner, ConsoleOutput } from '../../output/console.js';
import { scaffoldRegistry } from '../../utils/registry-scaffolder.js';

const DEFAULT_NAMESPACES = ['@core', '@stacks', '@fragments'];

/**
 * Initialize a new PromptScript registry.
 */
export async function registryInitCommand(
  directory: string | undefined,
  options: RegistryInitOptions,
  services: CliServices = createDefaultServices()
): Promise<void> {
  const targetDir = resolve(directory ?? options.output ?? '.');
  const dirName = basename(targetDir);

  try {
    let name: string;
    let description: string;
    let namespaces: string[];
    let seed: boolean;

    if (options.yes) {
      // Non-interactive mode
      name = options.name ?? `${dirName}-registry`;
      description = options.description ?? `PromptScript registry for ${dirName}`;
      namespaces = options.namespaces ?? DEFAULT_NAMESPACES;
      seed = options.seed !== false;
    } else {
      // Interactive mode
      const { prompts } = services;

      ConsoleOutput.newline();
      console.log('Create a new PromptScript registry');
      ConsoleOutput.newline();

      name = await prompts.input({
        message: 'Registry name:',
        default: options.name ?? `${dirName}-registry`,
      });

      description = await prompts.input({
        message: 'Description:',
        default: options.description ?? `PromptScript registry for ${dirName}`,
      });

      const selectedNamespaces = await prompts.checkbox({
        message: 'Select namespaces:',
        choices: [
          { name: '@core - Foundation configurations', value: '@core', checked: true },
          { name: '@stacks - Technology stack configs', value: '@stacks', checked: true },
          { name: '@fragments - Reusable fragments', value: '@fragments', checked: true },
          { name: '@roles - Role-based configs', value: '@roles', checked: false },
          { name: '@skills - Skill definitions', value: '@skills', checked: false },
        ],
      });

      namespaces = selectedNamespaces.length > 0 ? selectedNamespaces : DEFAULT_NAMESPACES;

      seed =
        options.seed !== false
          ? await prompts.confirm({
              message: 'Seed with starter configurations?',
              default: true,
            })
          : false;
    }

    const spinner = createSpinner('Creating registry...').start();

    const createdFiles = await scaffoldRegistry(
      { directory: targetDir, name, description, namespaces, seed },
      services
    );

    spinner.succeed('Registry created');

    // Show summary
    ConsoleOutput.newline();
    console.log('Created:');
    for (const file of createdFiles) {
      ConsoleOutput.success(file);
    }

    ConsoleOutput.newline();
    console.log('Next steps:');
    ConsoleOutput.muted('1. Review and customize the generated configurations');
    ConsoleOutput.muted('2. Validate: prs registry validate');
    ConsoleOutput.muted('3. Initialize git: git init && git add . && git commit');
    ConsoleOutput.muted('4. Push to your git host and configure in promptscript.yaml');
  } catch (error) {
    if (error instanceof Error && error.name === 'ExitPromptError') {
      ConsoleOutput.newline();
      ConsoleOutput.muted('Registry creation cancelled');
      return;
    }
    ConsoleOutput.error(
      `Registry creation failed: ${error instanceof Error ? error.message : String(error)}`
    );
    process.exitCode = 1;
  }
}
