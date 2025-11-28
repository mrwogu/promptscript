import { resolve } from 'path';
import { existsSync } from 'fs';
import type { ValidateOptions } from '../types';
import type { CompileResult } from '@promptscript/compiler';
import { loadConfig } from '../config/loader';
import { createSpinner, ConsoleOutput } from '../output/console';
import { Compiler } from '@promptscript/compiler';

/**
 * Print validation errors.
 */
function printValidationErrors(errors: CompileResult['errors']): void {
  if (errors.length === 0) return;

  console.log(`Errors (${errors.length}):`);
  for (const err of errors) {
    ConsoleOutput.error(err.message);
    if (err.location) {
      ConsoleOutput.muted(`at ${err.location.file}:${err.location.line}:${err.location.column}`);
    }
  }
  ConsoleOutput.newline();
}

/**
 * Print validation warnings.
 */
function printValidationWarnings(warnings: CompileResult['warnings'], strict: boolean): void {
  if (warnings.length === 0) return;

  const warningLabel = strict ? 'Errors (--strict)' : 'Warnings';
  console.log(`${warningLabel} (${warnings.length}):`);

  for (const warn of warnings) {
    const printFn = strict ? ConsoleOutput.error : ConsoleOutput.warning;
    printFn(`${warn.ruleId}: ${warn.message}`);

    if (warn.location) {
      ConsoleOutput.muted(`at ${warn.location.file}:${warn.location.line}:${warn.location.column}`);
    }
    if (warn.suggestion) {
      ConsoleOutput.muted(`suggestion: ${warn.suggestion}`);
    }
  }
  ConsoleOutput.newline();
}

/**
 * Validate PromptScript files without generating output.
 */
export async function validateCommand(options: ValidateOptions): Promise<void> {
  const spinner = createSpinner('Loading configuration...').start();

  try {
    const config = await loadConfig();
    spinner.text = 'Validating...';

    const compiler = new Compiler({
      resolver: {
        registryPath: config.registry?.path ?? './registry',
        localPath: './.promptscript',
      },
      validator: config.validation,
      formatters: [], // No formatters needed for validation only
    });

    const entryPath = resolve('./.promptscript/project.prs');

    if (!existsSync(entryPath)) {
      spinner.fail('Entry file not found');
      ConsoleOutput.error(`File not found: ${entryPath}`);
      ConsoleOutput.muted('Run: prs init');
      process.exit(1);
    }

    const result = await compiler.compile(entryPath);

    // Check if we have errors
    const hasErrors = result.errors.length > 0;
    const hasWarnings = result.warnings.length > 0;
    const treatWarningsAsErrors = options.strict === true && hasWarnings;
    const failed = hasErrors || treatWarningsAsErrors;

    if (failed) {
      spinner.fail('Validation failed');
    } else {
      spinner.succeed('Validation successful');
    }

    ConsoleOutput.newline();

    printValidationErrors(result.errors);
    printValidationWarnings(result.warnings, options.strict === true);

    // Summary
    if (!hasErrors && !hasWarnings) {
      ConsoleOutput.success('No issues found');
    }

    if (failed) {
      process.exit(1);
    }
  } catch (error) {
    spinner.fail('Error');
    ConsoleOutput.error((error as Error).message);
    process.exit(1);
  }
}
