#!/usr/bin/env node
import { Command } from 'commander';
import { initCommand } from './commands/init';
import { compileCommand } from './commands/compile';
import { validateCommand } from './commands/validate';
import { pullCommand } from './commands/pull';
import { diffCommand } from './commands/diff';

const program = new Command();

program.name('prs').description('PromptScript CLI - Standardize AI instructions').version('0.1.0');

program
  .command('init')
  .description('Initialize PromptScript in current directory')
  .option('-t, --team <team>', 'Team namespace')
  .option('--template <template>', 'Project template')
  .action(initCommand);

program
  .command('compile')
  .description('Compile PromptScript to target formats')
  .option('-t, --target <target>', 'Specific target')
  .option('-a, --all', 'All configured targets', true)
  .option('-w, --watch', 'Watch mode')
  .option('-o, --output <dir>', 'Output directory')
  .option('--dry-run', 'Preview changes')
  .action(compileCommand);

program
  .command('validate')
  .description('Validate PromptScript files')
  .option('--strict', 'Treat warnings as errors')
  .option('--fix', 'Auto-fix issues')
  .action(validateCommand);

program
  .command('pull')
  .description('Pull updates from registry')
  .option('-f, --force', 'Force overwrite')
  .action(pullCommand);

program
  .command('diff')
  .description('Show diff for compiled output')
  .option('-t, --target <target>', 'Specific target')
  .action(diffCommand);

/**
 * Run the CLI.
 * @param args - Command line arguments (defaults to process.argv)
 */
export function run(args: string[] = process.argv): void {
  program.parse(args);
}

// Run if executed directly
run();
