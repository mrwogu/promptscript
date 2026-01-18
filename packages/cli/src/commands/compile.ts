import { resolve, dirname } from 'path';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import chokidar from 'chokidar';
import type { CompileOptions } from '../types';
import type { PromptScriptConfig, TargetEntry, TargetConfig } from '@promptscript/core';
import type { CompileResult, FormatterOutput } from '@promptscript/compiler';
import { loadConfig } from '../config/loader';
import { createSpinner, ConsoleOutput } from '../output/console';
import { Compiler } from '@promptscript/compiler';

/**
 * Parse target entries into compiler format.
 * Filters out targets with enabled: false.
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
  _config: PromptScriptConfig
): Promise<void> {
  for (const output of outputs.values()) {
    const outputPath = options.output ? resolve(options.output, output.path) : resolve(output.path);

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
    const config = await loadConfig(options.config);
    spinner.text = 'Compiling...';

    // --format is an alias for --target
    const selectedTarget = options.target ?? options.format;
    const targets = selectedTarget ? [{ name: selectedTarget }] : parseTargets(config.targets);

    // Use --registry flag if provided, otherwise fall back to config
    const registryPath = options.registry ?? config.registry?.path ?? './registry';

    const compiler = new Compiler({
      resolver: {
        registryPath,
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
 * Watch directory for changes using chokidar and trigger recompilation.
 *
 * Uses chokidar for better cross-platform support and reliability compared
 * to native fs.watch.
 */
function watchForChanges(dir: string, callback: () => void): void {
  let debounceTimer: NodeJS.Timeout | null = null;
  const debounceMs = 100;

  const watcher = chokidar.watch(`${dir}/**/*.prs`, {
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 50,
      pollInterval: 10,
    },
  });

  watcher.on('change', (filename) => {
    // Debounce rapid changes
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    debounceTimer = setTimeout(() => {
      ConsoleOutput.newline();
      ConsoleOutput.info(`File changed: ${filename}`);
      callback();
    }, debounceMs);
  });

  watcher.on('add', (filename) => {
    ConsoleOutput.info(`File added: ${filename}`);
    callback();
  });

  watcher.on('unlink', (filename) => {
    ConsoleOutput.info(`File removed: ${filename}`);
  });

  watcher.on('error', (error: unknown) => {
    const errorMessage = error instanceof Error ? error.message : String(error);
    ConsoleOutput.error(`Watcher error: ${errorMessage}`);
  });
}
