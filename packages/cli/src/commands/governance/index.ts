import type { Command } from 'commander';
import { governanceCodeownersCommand } from './codeowners.js';

/** Register `prs governance codeowners`. */
export function registerGovernanceCommands(program: Command): void {
  const governance = program
    .command('governance')
    .description('Make the governance section of promptscript.yaml binding on the Git host');
  governance
    .command('codeowners')
    .description('Write the CODEOWNERS lines for prompts, approval roles and config files')
    .option('--output <path>', 'CODEOWNERS file relative to the repository root')
    .option('--check', 'Write nothing, exit 1 when the file is not up to date')
    .option('--format <format>', 'Output format (text, json)', 'text')
    .option('-c, --config <path>', 'Path to custom config file')
    .option('--cwd <dir>', 'Working directory (project root)')
    .action((opts) => governanceCodeownersCommand(opts));
}
