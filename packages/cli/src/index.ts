/**
 * Command-line interface for PromptScript.
 *
 * Compile, validate, and manage AI instructions at enterprise scale.
 * main entry point for the CLI application.
 *
 * @packageDocumentation
 */

// CLI exports
export { run } from './cli.js';

// Commands
export { initCommand } from './commands/init.js';
export { compileCommand } from './commands/compile.js';
export { validateCommand } from './commands/validate.js';
export { pullCommand } from './commands/pull.js';
export { diffCommand } from './commands/diff.js';
export { checkCommand } from './commands/check.js';

// Config
export { loadConfig, findConfigFile, CONFIG_FILES } from './config/loader.js';

// Output
export {
  ConsoleOutput,
  createSpinner,
  LogLevel,
  setContext,
  getContext,
  isVerbose,
  isQuiet,
} from './output/console.js';
export type { CLIContext } from './output/console.js';

// Types
export type {
  InitOptions,
  CompileOptions,
  ValidateOptions,
  PullOptions,
  DiffOptions,
  CheckOptions,
} from './types.js';
