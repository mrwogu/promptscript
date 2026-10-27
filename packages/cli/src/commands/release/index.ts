import type { Command } from 'commander';
import { releaseBuildCommand } from './build.js';
import { releasePromoteCommand } from './promote.js';
import { releaseRollbackCommand } from './rollback.js';
import { releaseStatusCommand } from './status.js';

function withProjectOptions(command: Command): Command {
  return command
    .option('--format <format>', 'Output format (text, json)', 'text')
    .option('-c, --config <path>', 'Path to custom config file')
    .option('--cwd <dir>', 'Working directory (project root)');
}

/**
 * Register `prs release build|promote|rollback|status`.
 *
 * None of them defines a way around the security rules, the hash check or the promotion
 * order; a release that needs one is not a release.
 */
export function registerReleaseCommands(release: Command): void {
  withProjectOptions(
    release
      .command('build')
      .description('Compile the prompts into content-hashed release bundles')
      .option('--dry-run', 'Show what the build would write without writing')
  ).action((opts) => releaseBuildCommand(opts));

  withProjectOptions(
    release
      .command('promote <prompt>')
      .description('Point an environment at a prompt bundle, as <id> or <id>@<hash>')
      .requiredOption('--to <env>', 'Environment to promote to')
      .option('--dry-run', 'Show the promotion without writing the label')
  ).action((prompt, opts) => releasePromoteCommand(prompt, opts));

  withProjectOptions(
    release
      .command('rollback <env>')
      .description('Restore the previous label of an environment from Git')
      .option('--dry-run', 'Show the rollback without writing the label')
  ).action((env, opts) => releaseRollbackCommand(env, opts));

  withProjectOptions(
    release
      .command('status')
      .description('List the released prompts of every environment')
      .option('--history <n>', 'Show the last n commits of each label')
  ).action((opts) => releaseStatusCommand(opts));
}
