import { resolve, join } from 'path';
import { existsSync, readFileSync, writeFileSync, readdirSync } from 'fs';
import type { ValidateOptions } from '../types.js';
import type { CompileResult } from '@promptscript/compiler';
import { findConfigFile, loadConfig } from '../config/loader.js';
import { createSpinner, ConsoleOutput } from '../output/console.js';
import { Compiler } from '@promptscript/compiler';
import { resolveRegistryPath } from '../utils/registry-resolver.js';
import {
  getMinimumVersionForBlock,
  getMinimumVersionForFeature,
  getSyntaxFeatureUsages,
  compareVersions,
  isValidLockfile,
  type Lockfile,
} from '@promptscript/core';
import { parse } from '@promptscript/parser';
import { Resolver } from '@promptscript/resolver';
import { parse as parseYaml } from 'yaml';

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

type ValidationResult = Pick<CompileResult, 'errors' | 'warnings'>;

function isEscaped(content: string, index: number): boolean {
  let backslashes = 0;
  for (let cursor = index - 1; cursor >= 0 && content[cursor] === '\\'; cursor--) {
    backslashes++;
  }
  return backslashes % 2 === 1;
}

function findMetaBrace(content: string, metaStart: number): number {
  let inComment = false;
  for (let index = metaStart + '@meta'.length; index < content.length; index++) {
    const ch = content[index];
    if (inComment) {
      if (ch === '\n' || ch === '\r') inComment = false;
      continue;
    }
    if (ch === '#') {
      inComment = true;
      continue;
    }
    if (ch === '{') return index;
  }
  return -1;
}

/**
 * Print validation errors.
 */
function printValidationErrors(errors: ValidationResult['errors']): void {
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
function printValidationWarnings(warnings: ValidationResult['warnings'], strict: boolean): void {
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
  result: ValidationResult,
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
function toJsonOutput(result: ValidationResult, success: boolean): ValidationJsonOutput {
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
  targetVersion: string,
  metaOffset?: number
): string | null {
  if (compareVersions(targetVersion, currentVersion) <= 0) return null;

  const metaStart = metaOffset ?? content.indexOf('@meta');
  if (metaStart < 0 || !content.startsWith('@meta', metaStart)) return null;

  const braceStart = findMetaBrace(content, metaStart);
  if (braceStart === -1) return null;

  let depth = 1;
  let inString = false;
  let inTextBlock = false;
  let inComment = false;

  for (let index = braceStart + 1; index < content.length && depth > 0; index++) {
    const ch = content[index];

    if (inComment) {
      if (ch === '\n' || ch === '\r') inComment = false;
      continue;
    }
    if (inTextBlock) {
      if (content.startsWith('"""', index)) {
        inTextBlock = false;
        index += 2;
      }
      continue;
    }
    if (inString) {
      if (ch === '"' && !isEscaped(content, index)) inString = false;
      continue;
    }
    if (ch === '#') {
      inComment = true;
      continue;
    }
    if (content.startsWith('"""', index)) {
      inTextBlock = true;
      index += 2;
      continue;
    }
    if (ch === '"') {
      inString = true;
      continue;
    }
    if (ch === '{') {
      depth++;
      continue;
    }
    if (ch === '}') {
      depth--;
      continue;
    }
    if (depth !== 1 || !content.startsWith('syntax', index)) continue;

    const previous = content[index - 1];
    const next = content[index + 'syntax'.length];
    if (
      (previous !== undefined && /[\w-]/.test(previous)) ||
      (next !== undefined && /[\w-]/.test(next))
    ) {
      continue;
    }

    let valueStart = index + 'syntax'.length;
    while (/\s/.test(content[valueStart] ?? '')) valueStart++;
    if (content[valueStart] !== ':') continue;
    valueStart++;
    while (/\s/.test(content[valueStart] ?? '')) valueStart++;
    if (content[valueStart] !== '"') continue;

    const valueEnd = content.indexOf('"', valueStart + 1);
    if (valueEnd === -1 || content.slice(valueStart + 1, valueEnd) !== currentVersion) {
      continue;
    }

    return content.slice(0, valueStart + 1) + targetVersion + content.slice(valueEnd);
  }

  return null;
}

/**
 * Recursively discover all .prs files in a directory.
 */
export function discoverPrsFiles(
  dir: string,
  strict: boolean = false,
  includeSymbolicLinks: boolean = false
): string[] {
  const results: string[] = [];
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        results.push(...discoverPrsFiles(fullPath, strict, includeSymbolicLinks));
      } else if (
        entry.name.endsWith('.prs') &&
        (entry.isFile() || (includeSymbolicLinks && entry.isSymbolicLink()))
      ) {
        results.push(fullPath);
      }
    }
  } catch (error) {
    const code = error instanceof Error ? (error as NodeJS.ErrnoException).code : undefined;
    if (strict && code !== 'ENOENT') throw error;
  }
  return results;
}

function loadValidationLockfile(): Lockfile | undefined {
  const lockfilePath = resolve('promptscript.lock');
  if (!existsSync(lockfilePath)) {
    return undefined;
  }
  const parsed: unknown = parseYaml(readFileSync(lockfilePath, 'utf-8'), { maxAliasCount: 100 });
  if (!isValidLockfile(parsed)) {
    throw new Error(`Invalid lockfile: ${lockfilePath}`);
  }
  return parsed;
}

/**
 * Validate PromptScript files without generating output.
 */
export async function validateCommand(options: ValidateOptions): Promise<void> {
  if (options.fix && options.format === 'json') {
    throw new Error('--fix is incompatible with --format json');
  }

  if (options.fix) {
    await runFix(options.files);
    return;
  }

  const isJsonFormat = options.format === 'json';
  const spinner = isJsonFormat
    ? createSpinner('').stop()
    : createSpinner('Loading configuration...').start();

  try {
    const config = await loadConfig();
    const lockfile = loadValidationLockfile();
    const vendorDir = resolve('.promptscript/vendor');

    // Resolve registry path (handles git registries)
    if (!isJsonFormat) spinner.text = 'Resolving registry...';
    const registry = await resolveRegistryPath(config, { vendorDir, lockfile });

    if (!isJsonFormat) spinner.text = 'Validating...';

    const compiler = new Compiler({
      resolver: {
        registryPath: registry.path,
        localPath: './.promptscript',
        vendorDir,
        lockfile,
        registries: config.registries,
      },
      validator: {
        ...config.validation,
        policies: options.skipPolicies ? undefined : config.policies,
        skipPolicies: options.skipPolicies,
      },
      ignoreHashes: options.ignoreHashes,
      formatters: [], // No formatters needed for validation only
    });

    const entryPaths =
      options.files && options.files.length > 0
        ? options.files.map((file) => resolve(file))
        : [resolve(config.input?.entry ?? './.promptscript/project.prs')];

    for (const entryPath of entryPaths) {
      if (!existsSync(entryPath)) {
        handleEntryNotFound(entryPath, isJsonFormat, spinner);
        return;
      }
    }

    const results: ValidationResult[] = [];
    for (const entryPath of entryPaths) {
      results.push(await compiler.compile(entryPath));
    }
    const result: ValidationResult = {
      errors: results.flatMap((entry) => entry.errors),
      warnings: results.flatMap((entry) => entry.warnings),
    };

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
async function runFix(requestedFiles?: string[]): Promise<void> {
  const files =
    requestedFiles && requestedFiles.length > 0
      ? requestedFiles.map((file) => resolve(file))
      : discoverPrsFiles('.promptscript');
  let fixedCount = 0;
  const configPath = findConfigFile();
  const config = configPath ? await loadConfig(configPath) : undefined;
  const lockfile = loadValidationLockfile();
  const vendorDir = resolve('.promptscript/vendor');
  const registryPath = config
    ? (await resolveRegistryPath(config, { vendorDir, lockfile })).path
    : resolve('./registry');
  const resolver = new Resolver({
    registryPath,
    localPath: resolve('./.promptscript'),
    vendorDir,
    lockfile,
    registries: config?.registries,
    cache: false,
  });

  for (const filePath of files) {
    const content = readFileSync(filePath, 'utf-8');
    const parseResult = parse(content);
    if (!parseResult.ast?.meta?.fields?.['syntax']) continue;

    const declaredVersion = parseResult.ast.meta.fields['syntax'];
    if (typeof declaredVersion !== 'string') continue;

    let ast = parseResult.ast;
    try {
      const resolved = await resolver.resolve(resolve(filePath));
      ast = resolved.ast ?? ast;
    } catch {
      // Preserve direct fixes when unrelated imports cannot be resolved.
    }

    let minRequired = '1.0.0';
    for (const block of ast.blocks) {
      const blockMin = getMinimumVersionForBlock(block.name);
      if (blockMin && compareVersions(blockMin, minRequired) > 0) {
        minRequired = blockMin;
      }
    }
    for (const ext of ast.extends) {
      const blockName = ext.targetPath.split('.')[0]!;
      const blockMin = getMinimumVersionForBlock(blockName);
      if (blockMin && compareVersions(blockMin, minRequired) > 0) {
        minRequired = blockMin;
      }
    }
    for (const usage of getSyntaxFeatureUsages(ast)) {
      const featureMin = getMinimumVersionForFeature(usage.feature);
      if (featureMin && compareVersions(featureMin, minRequired) > 0) {
        minRequired = featureMin;
      }
    }

    const fixed = fixSyntaxVersion(
      content,
      declaredVersion,
      minRequired,
      parseResult.ast.meta.loc.offset
    );
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
