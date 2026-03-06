import type { Command } from 'commander';
import { registryInitCommand } from './init.js';
import { registryValidateCommand } from './validate.js';
import { registryPublishCommand } from './publish.js';

/**
 * Register registry subcommands on a Commander command group.
 */
export function registerRegistryCommands(registry: Command): void {
  registry
    .command('init [directory]')
    .description('Create a new PromptScript registry')
    .option('-n, --name <name>', 'Registry name')
    .option('-d, --description <desc>', 'Registry description')
    .option('--namespaces <ns...>', 'Namespace names (e.g., @core @stacks)')
    .option('-y, --yes', 'Non-interactive mode with defaults')
    .option('-o, --output <dir>', 'Output directory')
    .option('--no-seed', 'Skip seed configurations')
    .action((directory, opts) => registryInitCommand(directory, opts));

  registry
    .command('validate [path]')
    .description('Validate registry structure and manifest')
    .option('--strict', 'Treat warnings as errors')
    .option('--format <format>', 'Output format (text, json)', 'text')
    .action((path, opts) => registryValidateCommand(path, opts));

  registry
    .command('publish [path]')
    .description('Publish registry to remote')
    .option('--dry-run', 'Preview what would be published')
    .option('-f, --force', 'Skip validation')
    .option('-m, --message <msg>', 'Git commit message')
    .option('--tag <tag>', 'Git tag for release')
    .action((path, opts) => registryPublishCommand(path, opts));
}
