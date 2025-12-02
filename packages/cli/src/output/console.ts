import chalk from 'chalk';
import ora, { type Ora } from 'ora';

/**
 * Creates a spinner for async operations.
 * @param text - Initial text to display.
 * @returns An ora spinner instance.
 */
export function createSpinner(text: string): Ora {
  return ora(text);
}

/**
 * Console output utilities for formatted CLI output.
 */
export const ConsoleOutput = {
  /**
   * Print a success message.
   */
  success(message: string): void {
    console.log(chalk.green(`  ✓ ${message}`));
  },

  /**
   * Print an error message.
   */
  error(message: string): void {
    console.log(chalk.red(`  ✗ ${message}`));
  },

  /**
   * Print a warning message.
   */
  warning(message: string): void {
    console.log(chalk.yellow(`  ⚠ ${message}`));
  },

  /**
   * Print a warning message (alias for warning).
   */
  warn(message: string): void {
    console.log(chalk.yellow(`  ⚠ ${message}`));
  },

  /**
   * Print an info message.
   */
  info(message: string): void {
    console.log(chalk.blue(`  ℹ ${message}`));
  },

  /**
   * Print a gray/muted message.
   */
  muted(message: string): void {
    console.log(chalk.gray(`    ${message}`));
  },

  /**
   * Print a dry-run indicator.
   */
  dryRun(message: string): void {
    console.log(chalk.blue(`  [dry-run] ${message}`));
  },

  /**
   * Print a blank line.
   */
  newline(): void {
    console.log();
  },

  /**
   * Print a header.
   */
  header(message: string): void {
    console.log(chalk.bold(message));
  },

  /**
   * Print stats in gray.
   */
  stats(message: string): void {
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
