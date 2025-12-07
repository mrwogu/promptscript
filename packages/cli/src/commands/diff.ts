import { resolve } from 'path';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import type { DiffOptions } from '../types';
import type { PromptScriptConfig, TargetEntry, TargetConfig } from '@promptscript/core';
import type { FormatterOutput } from '@promptscript/compiler';
import { loadConfig } from '../config/loader';
import { createSpinner, ConsoleOutput } from '../output/console';
import { createPager, Pager } from '../output/pager';
import { Compiler } from '@promptscript/compiler';
import chalk from 'chalk';

/**
 * Parse target entries into compiler format.
 */
function parseTargets(targets: TargetEntry[]): { name: string; config?: TargetConfig }[] {
  return targets.map((entry) => {
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
  });
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
  _config: PromptScriptConfig,
  showFull: boolean,
  pager: Pager
): Promise<boolean> {
  const outputPath = resolve(output.path);
  const newContent = output.content;

  if (!existsSync(outputPath)) {
    // File doesn't exist - would be created
    pager.write(chalk.green(`+ ${outputPath} (new file)`));
    pager.write('');
    printNewFilePreview(newContent, showFull, pager);
    pager.write('');
    return true;
  }

  // File exists - compare content
  const existingContent = await readFile(outputPath, 'utf-8');

  if (existingContent === newContent) {
    pager.write(chalk.gray(`  ${outputPath} (no changes)`));
    return false;
  }

  pager.write(chalk.yellow(`~ ${outputPath} (modified)`));
  pager.write('');

  const existingLines = existingContent.split('\n');
  const newLines = newContent.split('\n');
  printSimpleDiff(existingLines, newLines, showFull, pager);
  pager.write('');

  return true;
}

/**
 * Show diff between current output files and what would be generated.
 */
export async function diffCommand(options: DiffOptions): Promise<void> {
  const spinner = createSpinner('Loading configuration...').start();

  try {
    const config = await loadConfig();
    spinner.text = 'Compiling...';

    const targets = options.target ? [{ name: options.target }] : parseTargets(config.targets);

    const compiler = new Compiler({
      resolver: {
        registryPath: config.registry?.path ?? './registry',
        localPath: './.promptscript',
      },
      validator: config.validation,
      formatters: targets,
      customConventions: config.customConventions,
    });

    const entryPath = resolve('./.promptscript/project.prs');

    if (!existsSync(entryPath)) {
      spinner.fail('Entry file not found');
      ConsoleOutput.error(`File not found: ${entryPath}`);
      ConsoleOutput.muted('Run: prs init');
      process.exit(1);
    }

    const result = await compiler.compile(entryPath);

    if (!result.success) {
      spinner.fail('Compilation failed');
      ConsoleOutput.newline();

      for (const err of result.errors) {
        ConsoleOutput.error(err.message);
      }

      process.exit(1);
    }

    spinner.succeed('Diff computed');
    ConsoleOutput.newline();

    let hasDiff = false;
    const showFull = options.full ?? false;
    const usePager = options.noPager !== true;
    const pager = createPager(usePager);

    // Compare outputs with existing files
    for (const [name, output] of result.outputs) {
      const hasChanges = await compareOutput(name, output, config, showFull, pager);
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
    spinner.fail('Error');
    ConsoleOutput.error((error as Error).message);
    process.exit(1);
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
