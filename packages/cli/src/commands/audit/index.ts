import type { Command } from 'commander';
import { auditLogCommand } from './log.js';

/** Register `prs audit log`. */
export function registerAuditCommands(program: Command): void {
  const audit = program
    .command('audit')
    .description('Read the governance history of the project from Git');
  audit
    .command('log')
    .description(
      'List prompt changes, approvals, promotions, rollbacks, experiments and config changes, newest first'
    )
    .option('--prompt <id>', 'Only events of this prompt id')
    .option('--env <environment>', 'Only events of this environment')
    .option('--hash <prefix>', 'Only events whose content hash starts with these hex digits')
    .option('--since <date>', 'Only events committed at or after this ISO date')
    .option('--until <date>', 'Only events committed at or before this ISO date')
    .option('--limit <n>', 'Keep the newest n events, at most 100000')
    .option('--format <format>', 'Output format (text, json, cef)', 'text')
    .option('-c, --config <path>', 'Path to custom config file')
    .option('--cwd <dir>', 'Working directory (project root)')
    .action((opts) => auditLogCommand(opts));
}
