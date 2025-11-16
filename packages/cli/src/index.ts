// CLI exports
export { run } from './cli';

// Commands
export { initCommand } from './commands/init';
export { compileCommand } from './commands/compile';
export { validateCommand } from './commands/validate';
export { pullCommand } from './commands/pull';
export { diffCommand } from './commands/diff';

// Config
export { loadConfig, findConfigFile, CONFIG_FILES } from './config/loader';

// Output
export { ConsoleOutput, createSpinner } from './output/console';

// Types
export type {
  InitOptions,
  CompileOptions,
  ValidateOptions,
  PullOptions,
  DiffOptions,
} from './types';
