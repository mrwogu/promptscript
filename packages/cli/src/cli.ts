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
import { registerRegistryCommands } from './commands/registry/index.js';
import { lockCommand } from './commands/lock.js';
import { updateCommand } from './commands/update.js';
import { vendorSyncCommand, vendorCheckCommand } from './commands/vendor.js';
import { resolveCommand } from './commands/resolve-cmd.js';
import { setContext, LogLevel, ConsoleOutput } from './output/console.js';
import { checkForUpdates, printUpdateNotification } from './utils/version-check.js';
import { importCommand } from './commands/import.js';
import { upgradeCommand } from './commands/upgrade.js';

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

    // Check for updates (fire-and-forget, respects cache and quiet mode)
    const currentVersion = getPackageVersion(__dirname, '../package.json');
    checkForUpdates(currentVersion).then((updateInfo) => {
      if (updateInfo) {
        printUpdateNotification(updateInfo);
      }
    });
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
  .option('--auto-import', 'Automatically import existing instruction files (static)')
  .option('--backup', 'Create .prs-backup/ before migration')
  .action((opts) => {
    if (opts.migrate) {
      ConsoleOutput.warn('--migrate is deprecated. The migration flow is now built into prs init.');
    }
    return initCommand(opts);
  });

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
  .option('--cwd <dir>', 'Working directory (project root)')
  .action((opts) => compileCommand(opts));

program
  .command('validate')
  .description('Validate PromptScript files')
  .option('--strict', 'Treat warnings as errors')
  .option('--format <format>', 'Output format (text, json)', 'text')
  .option('--fix', 'Auto-fix syntax version issues')
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
  .action(checkCommand);

program.command('update-check').description('Check for CLI updates').action(updateCheckCommand);

program
  .command('serve')
  .description('Start local development server for playground')
  .option('-p, --port <port>', 'Port to listen on', '3000')
  .option('--host <host>', 'Host to bind to', '127.0.0.1')
  .option('--read-only', 'Disable file modifications')
  .option('--cors-origin <origin>', 'Allowed CORS origin', 'https://getpromptscript.dev')
  .action(async (opts) => {
    const { serveCommand } = await import('./commands/serve.js');
    await serveCommand(opts);
  });

program
  .command('import <file>')
  .description('Import AI instruction file to PromptScript format')
  .option('-f, --format <format>', 'Source format (claude, github, cursor, generic)')
  .option('-o, --output <dir>', 'Output directory', '.promptscript')
  .option('--dry-run', 'Preview output without writing files')
  .option('--validate', 'Run roundtrip validation after import')
  .action(importCommand);

program
  .command('migrate')
  .description('Migrate existing AI instructions to PromptScript')
  .option('--static', 'Non-interactive static import of all detected files')
  .option('--llm', 'Generate AI-assisted migration prompt')
  .option('--files <files...>', 'Specific files to import')
  .action(async (opts) => {
    const { migrateCommand } = await import('./commands/migrate.js');
    await migrateCommand(opts);
  });

program
  .command('upgrade')
  .description('Upgrade .prs files to the latest syntax version')
  .option('--dry-run', 'Show what would be changed without writing')
  .action(upgradeCommand);

program
  .command('lock')
  .description('Generate or update promptscript.lock by resolving all remote imports')
  .option('--dry-run', 'Preview lockfile without writing')
  .action((opts) => lockCommand(opts));

program
  .command('update [package]')
  .description('Re-resolve versions and update promptscript.lock')
  .option('--dry-run', 'Preview changes without writing')
  .action((pkg, opts) => updateCommand(pkg, opts));

const vendor = program.command('vendor').description('Manage vendored dependencies');

vendor
  .command('sync')
  .description('Copy all cached dependencies to .promptscript/vendor/')
  .option('--dry-run', 'Preview without copying files')
  .action((opts) => vendorSyncCommand(opts));

vendor
  .command('check')
  .description('Verify vendor directory matches lockfile')
  .action((opts) => vendorCheckCommand(opts));

program
  .command('resolve <import>')
  .description('Show full resolution chain for an import path (debug)')
  .action((importPath, opts) => resolveCommand(importPath, opts));

const registry = program.command('registry').description('Manage PromptScript registries');
registerRegistryCommands(registry);

/**
 * Run the CLI.
 * @param args - Command line arguments (defaults to process.argv)
 */
export function run(args: string[] = process.argv): void {
  program.parse(args);
}

// Run if executed directly
run();
