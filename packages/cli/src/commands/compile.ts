import { resolve, dirname } from 'path';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync, watch } from 'fs';
import type { CompileOptions } from '../types';
import type { PromptScriptConfig } from '@promptscript/core';
import type { CompileResult, FormatterOutput } from '@promptscript/compiler';
import { loadConfig } from '../config/loader';
import { createSpinner, ConsoleOutput } from '../output/console';
import { Compiler } from '@promptscript/compiler';

/**
 * Print compilation errors to console.
 */
function printErrors(errors: CompileResult['errors']): void {
  for (const err of errors) {
    ConsoleOutput.error(err.message);
    if (err.location) {
      ConsoleOutput.muted(`at ${err.location.file}:${err.location.line}:${err.location.column}`);
    }
  }
}

/**
 * Write output files to disk or show dry-run preview.
 */
async function writeOutputs(
  outputs: Map<string, FormatterOutput>,
  options: CompileOptions,
  config: PromptScriptConfig
): Promise<void> {
  for (const [name, output] of outputs) {
    const outputPath = options.output
      ? resolve(options.output, output.path)
      : resolve(config.output?.[name] ?? output.path);

    if (options.dryRun) {
      ConsoleOutput.dryRun(`Would write: ${outputPath}`);
    } else {
      await mkdir(dirname(outputPath), { recursive: true });
      await writeFile(outputPath, output.content, 'utf-8');
      ConsoleOutput.success(outputPath);
    }
  }
}

/**
 * Print compilation stats.
 */
function printStats(stats: CompileResult['stats']): void {
  ConsoleOutput.newline();
  ConsoleOutput.stats(
    `Stats: ${stats.totalTime}ms ` +
      `(resolve: ${stats.resolveTime}ms, ` +
      `validate: ${stats.validateTime}ms, ` +
      `format: ${stats.formatTime}ms)`
  );
}

/**
 * Print compilation warnings.
 */
function printWarnings(warnings: CompileResult['warnings']): void {
  if (warnings.length > 0) {
    ConsoleOutput.newline();
    console.log(`Warnings (${warnings.length}):`);
    for (const warn of warnings) {
      ConsoleOutput.warning(`${warn.ruleId}: ${warn.message}`);
    }
  }
}

/**
 * Compile PromptScript files to target formats.
 */
export async function compileCommand(options: CompileOptions): Promise<void> {
  const spinner = createSpinner('Loading configuration...').start();

  try {
    const config = await loadConfig();
    spinner.text = 'Compiling...';

    const targets = options.target ? [options.target] : config.targets;

    const compiler = new Compiler({
      resolver: {
        registryPath: config.registry?.path ?? './registry',
        localPath: './.promptscript',
      },
      validator: config.validation,
      formatters: targets,
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
      printErrors(result.errors);
      process.exit(1);
    }

    spinner.succeed('Compilation successful');
    ConsoleOutput.newline();

    await writeOutputs(result.outputs, options, config);
    printStats(result.stats);
    printWarnings(result.warnings);

    // Watch mode
    if (options.watch) {
      ConsoleOutput.newline();
      ConsoleOutput.info('Watching for changes... (Ctrl+C to stop)');
      watchForChanges('./.promptscript', () => compileCommand({ ...options, watch: false }));
    }
  } catch (error) {
    spinner.fail('Error');
    ConsoleOutput.error((error as Error).message);
    process.exit(1);
  }
}

/**
 * Watch directory for changes and trigger recompilation.
 */
function watchForChanges(dir: string, callback: () => void): void {
  let debounceTimer: NodeJS.Timeout | null = null;

  watch(dir, { recursive: true }, (_eventType, filename) => {
    if (!filename?.endsWith('.prs')) return;

    // Debounce rapid changes
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    debounceTimer = setTimeout(() => {
      ConsoleOutput.newline();
      ConsoleOutput.info(`File changed: ${filename}`);
      callback();
    }, 100);
  });
}
