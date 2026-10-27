import type { Command } from 'commander';
import { approveCommand } from './approve.js';

/** Register `prs approve`. */
export function registerApproveCommand(program: Command): void {
  program
    .command('approve [reference]')
    .description('Record an approval of one prompt version, as <id>@<hash>, or list approvals')
    .option('--role <role>', 'Approval role from governance.roles')
    .option('--approver <handle>', 'Your Git host user handle, for example @jane')
    .option('--env <env>', 'The one environment the approval counts for')
    .option('--all-environments', 'Let the approval count for every environment')
    .option('--comment <text>', 'Note stored in the record, at most 2000 characters')
    .option('--list', 'List approval records with their scope and state, for one prompt id or all')
    .option('--format <format>', 'Output format (text, json)', 'text')
    .option('-c, --config <path>', 'Path to custom config file')
    .option('--cwd <dir>', 'Working directory (project root)')
    .action((reference, opts) => approveCommand(reference, opts));
}
