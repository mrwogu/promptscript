#!/usr/bin/env node
import { Command } from 'commander';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { getPackageVersion } from '@promptscript/core';
import { initCommand } from './commands/init.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import { compileCommand } from './commands/compile.js';
import { validateCommand } from './commands/validate.js';
import { pullCommand } from './commands/pull.js';
import { diffCommand } from './commands/diff.js';
import { checkCommand } from './commands/check.js';
import { updateCheckCommand } from './commands/update-check.js';
import { setContext, LogLevel } from './output/console.js';
import { checkForUpdates, printUpdateNotification } from './utils/version-check.js';

const program = new Command();

program
  .name('prs')
  .description('PromptScript CLI - Standardize AI instructions')
  .version(getPackageVersion(__dirname, '../package.json'))
  .option('--verbose', 'Enable verbose output')
  .option('--debug', 'Enable debug output (includes verbose)')
  .option('--quiet', 'Suppress non-error output')
  .hook('preAction', async (thisCommand, actionCommand) => {
    const opts = thisCommand.opts();
    // Set global context based on flags (debug > verbose > quiet)
    if (opts['quiet']) {
      setContext({ logLevel: LogLevel.Quiet });
    } else if (opts['debug']) {
      setContext({ logLevel: LogLevel.Debug });
    } else if (opts['verbose']) {
      setContext({ logLevel: LogLevel.Verbose });
    }
    // Also check environment variables (debug takes precedence)
    if (process.env['PROMPTSCRIPT_DEBUG'] === '1' || process.env['PROMPTSCRIPT_DEBUG'] === 'true') {
      setContext({ logLevel: LogLevel.Debug });
    } else if (
      process.env['PROMPTSCRIPT_VERBOSE'] === '1' ||
      process.env['PROMPTSCRIPT_VERBOSE'] === 'true'
    ) {
      setContext({ logLevel: LogLevel.Verbose });
    }

    // Skip version check for update-check command (it does its own check)
    if (actionCommand.name() === 'update-check') {
      return;
    }

    // Check for updates (non-blocking, respects cache and quiet mode)
    const currentVersion = getPackageVersion(__dirname, '../package.json');
    const updateInfo = await checkForUpdates(currentVersion);
    if (updateInfo) {
      printUpdateNotification(updateInfo);
    }
  });

program
  .command('init')
  .description('Initialize PromptScript in current directory')
  .option('-n, --name <name>', 'Project name (auto-detected from package.json, etc.)')
  .option('-t, --team <team>', 'Team namespace')
  .option('--inherit <path>', 'Inheritance path (e.g., @company/team)')
  .option('--registry <path>', 'Registry path')
  .option('--targets <targets...>', 'Target AI tools (github, claude, cursor)')
  .option('-i, --interactive', 'Force interactive mode')
  .option('-y, --yes', 'Skip prompts, use defaults')
  .option('-f, --force', 'Force reinitialize even if already initialized')
  .option('-m, --migrate', 'Install migration skill for AI-assisted migration')
  .action((opts) => initCommand(opts));

program
  .command('compile')
  .description('Compile PromptScript to target formats')
  .option('-t, --target <target>', 'Specific target (github, claude, cursor)')
  .option('-f, --format <format>', 'Output format (alias for --target)')
  .option('-a, --all', 'All configured targets', true)
  .option('-w, --watch', 'Watch mode')
  .option('-o, --output <dir>', 'Output directory')
  .option('--dry-run', 'Preview changes')
  .option('--registry <path>', 'Registry path (overrides config)')
  .option('-c, --config <path>', 'Path to custom config file')
  .option('--force', 'Force overwrite existing files without prompts')
  .action((opts) => compileCommand(opts));

program
  .command('validate')
  .description('Validate PromptScript files')
  .option('--strict', 'Treat warnings as errors')
  .option('--format <format>', 'Output format (text, json)', 'text')
  .action(validateCommand);

program
  .command('pull')
  .description('Pull updates from registry')
  .option('-f, --force', 'Force overwrite')
  .option('--dry-run', 'Preview changes without pulling')
  .option('-b, --branch <name>', 'Git branch to pull from')
  .option('--tag <name>', 'Git tag to pull from')
  .option('--commit <hash>', 'Git commit to pull from')
  .option('--refresh', 'Force re-fetch from remote (ignore cache)')
  .action(pullCommand);

program
  .command('diff')
  .description('Show diff for compiled output')
  .option('-t, --target <target>', 'Specific target')
  .option('-a, --all', 'Show diff for all targets at once')
  .option('--full', 'Show full diff without truncation')
  .option('--no-pager', 'Disable pager output')
  .option('--color', 'Force colored output')
  .option('--no-color', 'Disable colored output')
  .action(diffCommand);

program
  .command('check')
  .description('Check configuration and dependencies health')
  .option('--fix', 'Attempt to fix issues')
  .action(checkCommand);

program.command('update-check').description('Check for CLI updates').action(updateCheckCommand);

/**
 * Run the CLI.
 * @param args - Command line arguments (defaults to process.argv)
 */
export function run(args: string[] = process.argv): void {
  program.parse(args);
}

// Run if executed directly
run();
