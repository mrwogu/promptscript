import chalk from 'chalk';
import ora, { type Ora } from 'ora';

/**
 * Log level for controlling output verbosity.
 */
export enum LogLevel {
  /** Suppress all output except errors */
  Quiet = 0,
  /** Normal output (default) */
  Normal = 1,
  /** Verbose output with additional details */
  Verbose = 2,
}

/**
 * Global CLI context for sharing state across commands.
 */
export interface CLIContext {
  /** Current log level */
  logLevel: LogLevel;
  /** Whether colors are enabled */
  colors: boolean;
}

/**
 * Default CLI context.
 */
let globalContext: CLIContext = {
  logLevel: LogLevel.Normal,
  colors: !process.env['NO_COLOR'],
};

/**
 * Set the global CLI context.
 */
export function setContext(context: Partial<CLIContext>): void {
  globalContext = { ...globalContext, ...context };
}

/**
 * Get the current CLI context.
 */
export function getContext(): CLIContext {
  return globalContext;
}

/**
 * Check if verbose logging is enabled.
 */
export function isVerbose(): boolean {
  return globalContext.logLevel >= LogLevel.Verbose;
}

/**
 * Check if quiet mode is enabled.
 */
export function isQuiet(): boolean {
  return globalContext.logLevel <= LogLevel.Quiet;
}

/**
 * Creates a spinner for async operations.
 * Returns a no-op spinner in quiet mode.
 * @param text - Initial text to display.
 * @returns An ora spinner instance.
 */
export function createSpinner(text: string): Ora {
  if (isQuiet()) {
    // Return a minimal spinner that doesn't output anything
    const noopSpinner = ora({ isSilent: true });
    noopSpinner.start(text);
    return noopSpinner;
  }
  return ora(text);
}

/**
 * Console output utilities for formatted CLI output.
 * Respects the global log level settings.
 */
export const ConsoleOutput = {
  /**
   * Print a success message.
   */
  success(message: string): void {
    if (isQuiet()) return;
    console.log(chalk.green(`  ✓ ${message}`));
  },

  /**
   * Print an error message.
   * Always printed regardless of log level.
   */
  error(message: string): void {
    console.error(chalk.red(`  ✗ ${message}`));
  },

  /**
   * Print a warning message.
   */
  warning(message: string): void {
    if (isQuiet()) return;
    console.log(chalk.yellow(`  ⚠ ${message}`));
  },

  /**
   * Print a warning message (alias for warning).
   */
  warn(message: string): void {
    if (isQuiet()) return;
    console.log(chalk.yellow(`  ⚠ ${message}`));
  },

  /**
   * Print a skipped file message.
   */
  skipped(message: string): void {
    if (isQuiet()) return;
    console.log(chalk.yellow(`  ⊘ ${message}`));
  },

  /**
   * Print an info message.
   */
  info(message: string): void {
    if (isQuiet()) return;
    console.log(chalk.blue(`  ℹ ${message}`));
  },

  /**
   * Print a gray/muted message.
   */
  muted(message: string): void {
    if (isQuiet()) return;
    console.log(chalk.gray(`    ${message}`));
  },

  /**
   * Print a verbose message (only shown with --verbose).
   */
  verbose(message: string): void {
    if (!isVerbose()) return;
    console.log(chalk.gray(`  [verbose] ${message}`));
  },

  /**
   * Print a debug message (only shown with --verbose).
   */
  debug(message: string): void {
    if (!isVerbose()) return;
    console.log(chalk.dim(`  [debug] ${message}`));
  },

  /**
   * Print a dry-run indicator.
   */
  dryRun(message: string): void {
    if (isQuiet()) return;
    console.log(chalk.blue(`  [dry-run] ${message}`));
  },

  /**
   * Print a blank line.
   */
  newline(): void {
    if (isQuiet()) return;
    console.log();
  },

  /**
   * Print a header.
   */
  header(message: string): void {
    if (isQuiet()) return;
    console.log(chalk.bold(message));
  },

  /**
   * Print stats in gray.
   */
  stats(message: string): void {
    if (isQuiet()) return;
    console.log(chalk.gray(message));
  },

  /**
   * Format a file path for display.
   */
  formatPath(path: string): string {
    return chalk.cyan(path);
  },

  /**
   * Format a location string.
   */
  formatLocation(file: string, line?: number, column?: number): string {
    let location = file;
    if (line !== undefined) {
      location += `:${line}`;
      if (column !== undefined) {
        location += `:${column}`;
      }
    }
    return chalk.gray(`at ${location}`);
  },
};
