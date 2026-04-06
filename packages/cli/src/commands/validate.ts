import { resolve, join } from 'path';
import { existsSync, readFileSync, writeFileSync, readdirSync } from 'fs';
import type { ValidateOptions } from '../types.js';
import type { CompileResult } from '@promptscript/compiler';
import { loadConfig } from '../config/loader.js';
import { createSpinner, ConsoleOutput } from '../output/console.js';
import { Compiler } from '@promptscript/compiler';
import { resolveRegistryPath } from '../utils/registry-resolver.js';
import { getMinimumVersionForBlock, compareVersions } from '@promptscript/core';
import { parse } from '@promptscript/parser';

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
): void {
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
  process.exitCode = 1;
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
 * Replace syntax version within the @meta block only.
 * Returns the modified content, or null if no change needed.
 */
export function fixSyntaxVersion(
  content: string,
  currentVersion: string,
  targetVersion: string
): string | null {
  if (compareVersions(targetVersion, currentVersion) <= 0) return null;

  const metaStart = content.indexOf('@meta');
  if (metaStart === -1) return null;

  const braceStart = content.indexOf('{', metaStart);
  if (braceStart === -1) return null;

  let depth = 1;
  let braceEnd = braceStart + 1;
  let inString = false;
  while (braceEnd < content.length && depth > 0) {
    const ch = content[braceEnd];
    if (ch === '"' && content[braceEnd - 1] !== '\\') {
      inString = !inString;
    } else if (!inString) {
      if (ch === '{') depth++;
      else if (ch === '}') depth--;
    }
    braceEnd++;
  }

  const before = content.slice(0, braceStart);
  const metaBody = content.slice(braceStart, braceEnd);
  const after = content.slice(braceEnd);

  const updatedMeta = metaBody.replace(/syntax:\s*"[^"]*"/, `syntax: "${targetVersion}"`);
  if (updatedMeta === metaBody) return null;

  return before + updatedMeta + after;
}

/**
 * Recursively discover all .prs files in a directory.
 */
export function discoverPrsFiles(dir: string): string[] {
  const results: string[] = [];
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        results.push(...discoverPrsFiles(fullPath));
      } else if (entry.name.endsWith('.prs')) {
        results.push(fullPath);
      }
    }
  } catch {
    // Directory doesn't exist
  }
  return results;
}

/**
 * Validate PromptScript files without generating output.
 */
export async function validateCommand(options: ValidateOptions): Promise<void> {
  if (options.fix && options.format === 'json') {
    throw new Error('--fix is incompatible with --format json');
  }

  if (options.fix) {
    await runFix();
    return;
  }

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
      validator: {
        ...config.validation,
        policies: options.skipPolicies ? undefined : config.policies,
        skipPolicies: options.skipPolicies,
        ignoreHashes: options.ignoreHashes,
      },
      formatters: [], // No formatters needed for validation only
    });

    const entryPath = resolve('./.promptscript/project.prs');

    if (!existsSync(entryPath)) {
      handleEntryNotFound(entryPath, isJsonFormat, spinner);
      return;
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
      process.exitCode = 1;
    }
  } catch (error) {
    handleValidationError(
      error instanceof Error ? error : new Error(String(error)),
      isJsonFormat,
      spinner
    );
  }
}

/**
 * Handle validation errors.
 */
function handleValidationError(
  error: Error,
  isJsonFormat: boolean,
  spinner: ReturnType<typeof createSpinner>
): void {
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
  process.exitCode = 1;
}

/**
 * Output validation result as JSON.
 */
function outputJsonResult(result: ValidationJsonOutput): void {
  console.log(JSON.stringify(result, null, 2));
}

/**
 * Auto-fix syntax version issues in .prs files.
 */
async function runFix(): Promise<void> {
  const files = discoverPrsFiles('.promptscript');
  let fixedCount = 0;

  for (const filePath of files) {
    const content = readFileSync(filePath, 'utf-8');
    const result = parse(content);
    if (!result.ast?.meta?.fields?.['syntax']) continue;

    const declaredVersion = result.ast.meta.fields['syntax'];
    if (typeof declaredVersion !== 'string') continue;

    let minRequired = '1.0.0';
    for (const block of result.ast.blocks) {
      const blockMin = getMinimumVersionForBlock(block.name);
      if (blockMin && compareVersions(blockMin, minRequired) > 0) {
        minRequired = blockMin;
      }
    }
    for (const ext of result.ast.extends) {
      const blockName = ext.targetPath.split('.')[0]!;
      const blockMin = getMinimumVersionForBlock(blockName);
      if (blockMin && compareVersions(blockMin, minRequired) > 0) {
        minRequired = blockMin;
      }
    }

    const fixed = fixSyntaxVersion(content, declaredVersion, minRequired);
    if (fixed) {
      writeFileSync(filePath, fixed, 'utf-8');
      console.log(`Fixed: ${filePath} syntax "${declaredVersion}" \u2192 "${minRequired}"`);
      fixedCount++;
    }
  }

  if (fixedCount === 0) {
    console.log('No syntax version fixes needed.');
  } else {
    console.log(`\n${fixedCount} file(s) fixed.`);
  }
}
