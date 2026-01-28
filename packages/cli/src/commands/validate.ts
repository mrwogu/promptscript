import { resolve } from 'path';
import { existsSync } from 'fs';
import type { ValidateOptions } from '../types.js';
import type { CompileResult } from '@promptscript/compiler';
import { loadConfig } from '../config/loader.js';
import { createSpinner, ConsoleOutput } from '../output/console.js';
import { Compiler } from '@promptscript/compiler';
import { resolveRegistryPath } from '../utils/registry-resolver.js';

/**
 * JSON output structure for validation results.
 */
interface ValidationJsonOutput {
  success: boolean;
  errors: Array<{
    message: string;
    location?: { file?: string; line?: number; column?: number };
  }>;
  warnings: Array<{
    ruleId: string;
    message: string;
    suggestion?: string;
    location?: { file?: string; line?: number; column?: number };
  }>;
  summary: {
    errorCount: number;
    warningCount: number;
  };
}

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
 * Handle entry file not found error.
 */
function handleEntryNotFound(
  entryPath: string,
  isJsonFormat: boolean,
  spinner: ReturnType<typeof createSpinner>
): never {
  if (isJsonFormat) {
    outputJsonResult({
      success: false,
      errors: [{ message: `File not found: ${entryPath}` }],
      warnings: [],
      summary: { errorCount: 1, warningCount: 0 },
    });
  } else {
    spinner.fail('Entry file not found');
    ConsoleOutput.error(`File not found: ${entryPath}`);
    ConsoleOutput.muted('Run: prs init');
  }
  process.exit(1);
}

/**
 * Output validation results in text format.
 */
function outputTextResult(
  result: CompileResult,
  failed: boolean,
  strict: boolean,
  spinner: ReturnType<typeof createSpinner>
): void {
  if (failed) {
    spinner.fail('Validation failed');
  } else {
    spinner.succeed('Validation successful');
  }

  ConsoleOutput.newline();

  printValidationErrors(result.errors);
  printValidationWarnings(result.warnings, strict);

  // Summary
  if (result.errors.length === 0 && result.warnings.length === 0) {
    ConsoleOutput.success('No issues found');
  }
}

/**
 * Convert compile result to JSON output format.
 */
function toJsonOutput(result: CompileResult, success: boolean): ValidationJsonOutput {
  return {
    success,
    errors: result.errors.map((e) => ({
      message: e.message,
      location: e.location,
    })),
    warnings: result.warnings.map((w) => ({
      ruleId: w.ruleId,
      message: w.message,
      suggestion: w.suggestion,
      location: w.location,
    })),
    summary: {
      errorCount: result.errors.length,
      warningCount: result.warnings.length,
    },
  };
}

/**
 * Validate PromptScript files without generating output.
 */
export async function validateCommand(options: ValidateOptions): Promise<void> {
  const isJsonFormat = options.format === 'json';
  const spinner = isJsonFormat
    ? createSpinner('').stop()
    : createSpinner('Loading configuration...').start();

  try {
    const config = await loadConfig();

    // Resolve registry path (handles git registries)
    if (!isJsonFormat) spinner.text = 'Resolving registry...';
    const registry = await resolveRegistryPath(config);

    if (!isJsonFormat) spinner.text = 'Validating...';

    const compiler = new Compiler({
      resolver: {
        registryPath: registry.path,
        localPath: './.promptscript',
      },
      validator: config.validation,
      formatters: [], // No formatters needed for validation only
    });

    const entryPath = resolve('./.promptscript/project.prs');

    if (!existsSync(entryPath)) {
      handleEntryNotFound(entryPath, isJsonFormat, spinner);
    }

    const result = await compiler.compile(entryPath);

    const hasErrors = result.errors.length > 0;
    const hasWarnings = result.warnings.length > 0;
    const treatWarningsAsErrors = options.strict === true && hasWarnings;
    const failed = hasErrors || treatWarningsAsErrors;

    if (isJsonFormat) {
      outputJsonResult(toJsonOutput(result, !failed));
    } else {
      outputTextResult(result, failed, options.strict === true, spinner);
    }

    if (failed) {
      process.exit(1);
    }
  } catch (error) {
    handleValidationError(error as Error, isJsonFormat, spinner);
  }
}

/**
 * Handle validation errors.
 */
function handleValidationError(
  error: Error,
  isJsonFormat: boolean,
  spinner: ReturnType<typeof createSpinner>
): never {
  if (isJsonFormat) {
    outputJsonResult({
      success: false,
      errors: [{ message: error.message }],
      warnings: [],
      summary: { errorCount: 1, warningCount: 0 },
    });
  } else {
    spinner.fail('Error');
    ConsoleOutput.error(error.message);
  }
  process.exit(1);
}

/**
 * Output validation result as JSON.
 */
function outputJsonResult(result: ValidationJsonOutput): void {
  console.log(JSON.stringify(result, null, 2));
}
