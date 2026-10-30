import type { Command } from 'commander';
import type { EvalCompareOptions, EvalImportOptions, EvalRunOptions } from './options.js';

function collect(value: string, previous: string[] = []): string[] {
  return [...previous, value];
}

/**
 * Register `prs eval run|compare|import`. Each action loads the command on first use, so the
 * eval engine is not read for any other command.
 *
 * Live modes, the budget and extra provider hosts have flags only; no config key turns
 * them on.
 */
export function registerEvalCommands(evalCommand: Command): void {
  evalCommand
    .command('run [suite...]')
    .description('Run eval suites against the prompts of the project; no names means all suites')
    .option('--format <format>', 'Output format (text, json, markdown, junit)', 'text')
    .option('--out <file>', 'Also write the formatted report to a file')
    .option('--report-dir <dir>', 'Write <dir>/<suite>.<hash12>.json for each suite')
    .option('--baseline <report.json>', 'Compare with an earlier report')
    .option('--fail-on-regression', 'Exit 1 when the baseline shows a regression')
    .option('--max-cost <usd>', 'Spending limit in USD; every mode that calls a provider needs it')
    .option('--max-cases <n>', 'Largest number of dataset rows a suite runs')
    .option('--concurrency <n>', 'Calls in flight at once, at most 16')
    .option('--cache <mode>', 'Cache mode (replay, record, refresh, off)', 'replay')
    .option('--model <ref>', 'Run every suite against this model only')
    .option('--label <env>', 'Run the prompts a release environment serves, not a fresh compile')
    .option('--variant <name>', 'With --label, run this experiment arm instead of the entry hash')
    .option('--allow-host <host>', 'Allow a provider host besides the built-in ones', collect)
    .option('--allow-local', 'Allow loopback hosts, over http too')
    .option('--dry-run', 'Show the plan, cache hits and worst-case cost; no calls')
    .option('--strict', 'Exit 2 when the run passed with warnings')
    .option('-c, --config <path>', 'Path to custom config file')
    .option('--cwd <dir>', 'Working directory (project root)')
    .action(async (suites: string[], opts: EvalRunOptions) => {
      const { evalRunCommand } = await import('./run.js');
      await evalRunCommand(suites, opts);
    });

  evalCommand
    .command('compare <baseline> <candidate>')
    .description('Compare two eval reports offline')
    .option('--format <format>', 'Output format (text, json, markdown)', 'text')
    .option('--fail-on-regression', 'Exit 1 when the candidate regressed')
    .option('--tolerance <n>', 'Pass-rate drop that counts as a regression, 0 to 1', '0')
    .option('--cwd <dir>', 'Directory the report paths are relative to')
    .action(async (baseline: string, candidate: string, opts: EvalCompareOptions) => {
      const { evalCompareCommand } = await import('./compare.js');
      await evalCompareCommand(baseline, candidate, opts);
    });

  evalCommand
    .command('import <samples>')
    .description('Turn production samples (JSONL) into a scrubbed dataset for a suite')
    .option('--suite <name>', 'Suite the dataset is for (required)')
    .option(
      '--out <file>',
      'New dataset file (.jsonl) inside the project, never replaced (required)'
    )
    .option('--max-rows <n>', 'Most rows to keep, at most 1000', '200')
    .option('--seed <n>', 'Seed of the row sampling', '1')
    .option('--max-score <n>', 'Keep only samples with a feedback score at or below n')
    .option('--label <label>', 'Keep only samples with this feedback label', collect)
    .option('--redact-input <name>', 'Replace a string input with [redacted]', collect)
    .option('--expected-from-output', 'Copy the scrubbed output as the expected value')
    .option('--format <format>', 'Output format (text, json)', 'text')
    .option('--dry-run', 'Print the counts and write nothing')
    .option('-c, --config <path>', 'Path to custom config file')
    .option('--cwd <dir>', 'Working directory (project root)')
    .action(async (samples: string, opts: EvalImportOptions) => {
      const { evalImportCommand } = await import('./import.js');
      await evalImportCommand(samples, opts);
    });
}
