import { resolve } from 'node:path';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import type { DiffOptions } from '../types.js';
import {
  isValidLockfile,
  type Lockfile,
  type Logger,
  type TargetEntry,
  type TargetConfig,
} from '@promptscript/core';
import type { FormatterOutput } from '@promptscript/compiler';
import { loadConfig } from '../config/loader.js';
import { createSpinner, ConsoleOutput, isVerbose, isDebug } from '../output/console.js';
import { createPager, Pager } from '../output/pager.js';
import { Compiler } from '@promptscript/compiler';
import { resolveRegistryPath } from '../utils/registry-resolver.js';
import { stripMarkers } from '../utils/markers.js';
import { postFormatWithPrettier } from '../prettier/post-format.js';
import { resolvePrettierOptions } from '../prettier/loader.js';
import { buildCompilationDiff, createCompilationDiffErrorReport } from '../utils/diff-report.js';
import { loadBundledSkillContent } from '../utils/bundled-skill.js';
import { applyConfiguredHeader } from '../utils/output-ownership.js';
import chalk from 'chalk';
import { parse as parseYaml } from 'yaml';

/**
 * Configure chalk color level based on options.
 */
function configureColors(options: DiffOptions): void {
  // --no-color takes precedence, then --color, then environment
  if (options.color === false) {
    chalk.level = 0;
  } else if (options.color === true) {
    chalk.level = 3; // Full color support
  }
  // Otherwise use chalk's auto-detection (respects NO_COLOR env var)
}

/**
 * Logger that surfaces post-format diagnostics only when --verbose/--debug is set.
 * Mirrors createCliLogger in compile.ts so diff and compile report Prettier
 * post-format warnings consistently.
 */
export function createDiffLogger(machineReadable = false): Logger {
  return {
    verbose: (message: string) => {
      if (machineReadable && (isVerbose() || isDebug())) {
        console.error(message);
      } else if (isVerbose() || isDebug()) {
        ConsoleOutput.verbose(message);
      }
    },
    debug: (message: string) => {
      if (machineReadable && isDebug()) {
        console.error(message);
      } else if (isDebug()) {
        ConsoleOutput.debug(message);
      }
    },
    warn: (message: string) => {
      if (machineReadable) {
        console.error(message);
      } else {
        ConsoleOutput.warn(message);
      }
    },
  };
}

/**
 * Parse target entries into compiler format.
 */
function parseTargets(targets: TargetEntry[]): { name: string; config?: TargetConfig }[] {
  return targets
    .map((entry) => {
      if (typeof entry === 'string') {
        return { name: entry };
      }
      // Object format: { github: { convention: 'xml' } }
      const entries = Object.entries(entry);
      if (entries.length === 0) {
        throw new Error('Empty target configuration');
      }
      const [name, config] = entries[0] as [string, TargetConfig | undefined];
      return { name, config };
    })
    .filter((target) => target.config?.enabled !== false);
}

/**
 * Resolve universalDir config to NativeSkillOptions.
 */
function resolveUniversalDir(
  universalDir: string | boolean | undefined
): { universalDir: string } | undefined {
  if (universalDir === false) return undefined;
  if (typeof universalDir === 'string') return { universalDir };
  return { universalDir: '.agents' };
}

async function loadDiffLockfile(projectRoot: string): Promise<Lockfile | undefined> {
  const lockfilePath = resolve(projectRoot, 'promptscript.lock');
  if (!existsSync(lockfilePath)) {
    return undefined;
  }
  const parsed: unknown = parseYaml(await readFile(lockfilePath, 'utf-8'), { maxAliasCount: 100 });
  if (!isValidLockfile(parsed)) {
    throw new Error(`Invalid lockfile: ${lockfilePath}`);
  }
  return parsed;
}

/**
 * Show preview of a new file's content.
 */
function printNewFilePreview(content: string, showFull: boolean, pager: Pager): void {
  const lines = content.split('\n');
  const maxLines = showFull ? lines.length : 10;
  const preview = lines.slice(0, maxLines);

  for (const line of preview) {
    pager.write(chalk.green(`  + ${line}`));
  }

  if (!showFull && lines.length > 10) {
    pager.write(chalk.gray(`  ... (${lines.length - 10} more lines)`));
  }
}

/**
 * Compare a single output file with existing content.
 */
async function compareOutput(
  _name: string,
  output: FormatterOutput,
  outputRoot: string,
  showFull: boolean,
  pager: Pager
): Promise<boolean> {
  const outputPath = resolve(outputRoot, output.path);
  const newContent = output.content;

  if (!existsSync(outputPath)) {
    // File doesn't exist - would be created
    pager.write(chalk.green(`+ ${outputPath} (new file)`));
    pager.write('');
    printNewFilePreview(newContent, showFull, pager);
    pager.write('');
    return true;
  }

  // File exists - compare content (strip markers to ignore timestamp-only changes)
  const existingContent = await readFile(outputPath, 'utf-8');
  const existingStripped = stripMarkers(existingContent);
  const newStripped = stripMarkers(newContent);

  if (existingStripped === newStripped) {
    pager.write(chalk.gray(`  ${outputPath} (no changes)`));
    return false;
  }

  pager.write(chalk.yellow(`~ ${outputPath} (modified)`));
  pager.write('');

  const existingLines = existingStripped.split('\n');
  const newLines = newStripped.split('\n');
  printSimpleDiff(existingLines, newLines, showFull, pager);
  pager.write('');

  return true;
}

/**
 * Show diff between current output files and what would be generated.
 */
export async function diffCommand(options: DiffOptions): Promise<void> {
  configureColors(options);

  if (options.format !== undefined && options.format !== 'text' && options.format !== 'json') {
    ConsoleOutput.error(`Invalid output format: ${options.format}. Expected text or json.`);
    process.exitCode = 1;
    return;
  }

  const isJsonFormat = options.format === 'json';
  const projectRoot = process.cwd();
  const spinner = isJsonFormat
    ? createSpinner('').stop()
    : createSpinner('Loading configuration...').start();

  try {
    const config = await loadConfig();
    const lockfile = await loadDiffLockfile(projectRoot);
    const vendorDir = resolve(projectRoot, '.promptscript/vendor');

    if (!isJsonFormat) spinner.text = 'Resolving registry...';
    const registry = await resolveRegistryPath(config, {
      vendorDir,
      lockfile,
      readOnly: true,
    });

    if (!isJsonFormat) spinner.text = 'Compiling...';

    const parsedTargets = parseTargets(config.targets);
    const targets = options.target
      ? [parsedTargets.find((target) => target.name === options.target) ?? { name: options.target }]
      : parsedTargets;
    const logger = createDiffLogger(isJsonFormat);
    const prettierOptions = await resolvePrettierOptions(config, projectRoot);
    const skillContent =
      config.includePromptScriptSkill === false ? undefined : await loadBundledSkillContent(logger);

    const compiler = new Compiler({
      resolver: {
        registryPath: registry.path,
        localPath: resolve(projectRoot, '.promptscript'),
        projectRoot,
        vendorDir,
        readOnly: true,
        referenceRoots:
          registry.repositoryUrl && registry.repositoryPath
            ? { [registry.repositoryUrl]: [registry.repositoryPath] }
            : undefined,
        lockfile,
        registries: config.registries,
        skills: resolveUniversalDir(config.universalDir),
        skillTargets: config.skillTargets,
      },
      validator: config.validation,
      formatters: targets,
      customConventions: config.customConventions,
      prettier: prettierOptions,
      logger,
      skillContent,
    });

    const entryPath = resolve(projectRoot, config.input?.entry ?? './.promptscript/project.prs');

    if (!existsSync(entryPath)) {
      const message = `File not found: ${entryPath}`;
      if (isJsonFormat) {
        console.log(
          JSON.stringify(
            createCompilationDiffErrorReport(
              [{ name: 'EntryError', code: 'DIFF0002', message }],
              [],
              projectRoot,
              options.includeContent
            ),
            null,
            2
          )
        );
      } else {
        spinner.fail('Entry file not found');
        ConsoleOutput.error(message);
        ConsoleOutput.muted('Run: prs init');
      }
      process.exitCode = 1;
      return;
    }

    const result = await compiler.compile(entryPath);

    if (!result.success) {
      if (isJsonFormat) {
        console.log(
          JSON.stringify(
            createCompilationDiffErrorReport(
              result.errors,
              result.warnings,
              projectRoot,
              options.includeContent
            ),
            null,
            2
          )
        );
      } else {
        spinner.fail('Compilation failed');
        ConsoleOutput.newline();

        for (const err of result.errors) {
          ConsoleOutput.error(err.message);
        }
      }

      process.exitCode = 1;
      return;
    }

    const outputRoot = resolve(projectRoot, config.output?.baseDir ?? '.');
    applyConfiguredHeader(result.outputs, config.output?.header);
    const postFormatWarnings =
      (await postFormatWithPrettier(result.outputs, projectRoot, createDiffLogger(isJsonFormat))) ??
      [];

    if (isJsonFormat) {
      const report = await buildCompilationDiff({
        projectRoot,
        outputRoot,
        entryPath,
        outputs: result.outputs,
        warnings: [
          ...result.warnings,
          ...postFormatWarnings.map((message) => ({
            ruleId: 'PRETTIER',
            ruleName: 'prettier-post-format',
            severity: 'warning' as const,
            message,
          })),
        ],
        includeContent: options.includeContent,
      });
      console.log(JSON.stringify(report, null, 2));
      return;
    }

    spinner.succeed('Diff computed');
    ConsoleOutput.newline();
    let hasDiff = false;
    const showFull = options.full ?? false;
    const usePager = options.noPager !== true;
    const pager = createPager(usePager);

    for (const [name, output] of result.outputs) {
      const hasChanges = await compareOutput(name, output, outputRoot, showFull, pager);
      if (hasChanges) {
        hasDiff = true;
      }
    }

    if (!hasDiff) {
      pager.write('');
      pager.write(chalk.green('  ✓ All files are up to date'));
    }

    // Flush output through pager
    await pager.flush();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (isJsonFormat) {
      console.log(
        JSON.stringify(
          createCompilationDiffErrorReport(
            [{ name: 'DiffError', code: 'DIFF0000', message }],
            [],
            projectRoot,
            options.includeContent
          ),
          null,
          2
        )
      );
    } else {
      spinner.fail('Error');
      ConsoleOutput.error(message);
    }
    process.exitCode = 1;
  }
}

/**
 * Print a simple diff between two sets of lines.
 * This is a basic implementation - could be enhanced with a proper diff algorithm.
 */
function printSimpleDiff(
  existingLines: string[],
  newLines: string[],
  showFull: boolean,
  pager: Pager
): void {
  const maxLines = Math.max(existingLines.length, newLines.length);
  let changesShown = 0;
  const maxChangesToShow = showFull ? Infinity : 20;

  for (let i = 0; i < maxLines && changesShown < maxChangesToShow; i++) {
    const existingLine = existingLines[i];
    const newLine = newLines[i];

    if (existingLine === newLine) {
      // Lines are the same - skip unless we're in context
      continue;
    }

    if (existingLine !== undefined && newLine === undefined) {
      // Line was removed
      pager.write(chalk.red(`  - ${existingLine}`));
      changesShown++;
    } else if (existingLine === undefined && newLine !== undefined) {
      // Line was added
      pager.write(chalk.green(`  + ${newLine}`));
      changesShown++;
    } else if (existingLine !== newLine) {
      // Line was modified
      pager.write(chalk.red(`  - ${existingLine}`));
      pager.write(chalk.green(`  + ${newLine}`));
      changesShown += 2;
    }
  }

  if (!showFull && changesShown >= maxChangesToShow) {
    pager.write(chalk.gray(`  ... (more changes not shown)`));
  }
}
