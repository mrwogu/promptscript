import { initCommand } from './init.js';
import type { MigrateOptions } from '../types.js';
import { type CliServices, createDefaultServices } from '../services.js';

/**
 * prs migrate -- alias/shortcut to init migration path.
 * Delegates to initCommand with appropriate flags.
 *
 * When promptscript.yaml already exists, force: true allows
 * initCommand to re-enter and run migration-only flow.
 */
export async function migrateCommand(
  options: MigrateOptions,
  services: CliServices = createDefaultServices()
): Promise<void> {
  const initOptions = {
    _forceMigrate: true,
    _forceLlm: options.llm ?? false,
    _migrateFiles: options.files,
    yes: options.static ?? false,
    autoImport: options.static ?? false,
    force: true,
  };

  await initCommand(initOptions, services);
}
