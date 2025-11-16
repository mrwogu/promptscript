import { resolve } from 'path';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import type { DiffOptions } from '../types';
import type { PromptScriptConfig } from '@promptscript/core';
import type { FormatterOutput } from '@promptscript/compiler';
import { loadConfig } from '../config/loader';
import { createSpinner, ConsoleOutput } from '../output/console';
import { Compiler } from '@promptscript/compiler';
import chalk from 'chalk';

/**
 * Show preview of a new file's content.
 */
function printNewFilePreview(content: string): void {
  const lines = content.split('\n');
  const preview = lines.slice(0, 10);

  for (const line of preview) {
    console.log(chalk.green(`  + ${line}`));
  }

  if (lines.length > 10) {
    console.log(chalk.gray(`  ... (${lines.length - 10} more lines)`));
  }
}

/**
 * Compare a single output file with existing content.
 */
async function compareOutput(
  name: string,
  output: FormatterOutput,
  config: PromptScriptConfig
): Promise<boolean> {
  const outputPath = resolve(config.output?.[name] ?? output.path);
  const newContent = output.content;

  if (!existsSync(outputPath)) {
    // File doesn't exist - would be created
    console.log(chalk.green(`+ ${outputPath} (new file)`));
    ConsoleOutput.newline();
    printNewFilePreview(newContent);
    ConsoleOutput.newline();
    return true;
  }

  // File exists - compare content
  const existingContent = await readFile(outputPath, 'utf-8');

  if (existingContent === newContent) {
    console.log(chalk.gray(`  ${outputPath} (no changes)`));
    return false;
  }

  console.log(chalk.yellow(`~ ${outputPath} (modified)`));
  ConsoleOutput.newline();

  const existingLines = existingContent.split('\n');
  const newLines = newContent.split('\n');
  printSimpleDiff(existingLines, newLines);
  ConsoleOutput.newline();

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

    const targets = options.target ? [options.target] : config.targets;

    const compiler = new Compiler({
      resolver: {
        registryPath: config.registry?.path ?? './registry',
        localPath: './promptscript',
      },
      validator: config.validation,
      formatters: targets,
    });

    const entryPath = resolve('./promptscript/project.prs');

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

    // Compare outputs with existing files
    for (const [name, output] of result.outputs) {
      const hasChanges = await compareOutput(name, output, config);
      if (hasChanges) {
        hasDiff = true;
      }
    }

    if (!hasDiff) {
      ConsoleOutput.newline();
      ConsoleOutput.success('All files are up to date');
    }
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
function printSimpleDiff(existingLines: string[], newLines: string[]): void {
  const maxLines = Math.max(existingLines.length, newLines.length);
  let changesShown = 0;
  const maxChangesToShow = 20;

  for (let i = 0; i < maxLines && changesShown < maxChangesToShow; i++) {
    const existingLine = existingLines[i];
    const newLine = newLines[i];

    if (existingLine === newLine) {
      // Lines are the same - skip unless we're in context
      continue;
    }

    if (existingLine !== undefined && newLine === undefined) {
      // Line was removed
      console.log(chalk.red(`  - ${existingLine}`));
      changesShown++;
    } else if (existingLine === undefined && newLine !== undefined) {
      // Line was added
      console.log(chalk.green(`  + ${newLine}`));
      changesShown++;
    } else if (existingLine !== newLine) {
      // Line was modified
      console.log(chalk.red(`  - ${existingLine}`));
      console.log(chalk.green(`  + ${newLine}`));
      changesShown += 2;
    }
  }

  if (changesShown >= maxChangesToShow) {
    console.log(chalk.gray(`  ... (more changes not shown)`));
  }
}
