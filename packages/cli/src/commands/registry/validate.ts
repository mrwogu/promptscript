import { resolve } from 'path';
import type { RegistryValidateOptions } from '../../types.js';
import { type CliServices, createDefaultServices } from '../../services.js';
import { createSpinner, ConsoleOutput } from '../../output/console.js';
import { validateRegistry } from '../../utils/registry-validator.js';

/**
 * Validate a PromptScript registry.
 */
export async function registryValidateCommand(
  path: string | undefined,
  options: RegistryValidateOptions,
  services: CliServices = createDefaultServices()
): Promise<void> {
  const registryPath = resolve(path ?? '.');

  const spinner = createSpinner('Validating registry...').start();

  try {
    const result = await validateRegistry(registryPath, services);

    if (result.valid && result.issues.length === 0) {
      spinner.succeed('Registry is valid');
    } else if (result.valid) {
      spinner.warn('Registry is valid with warnings');
    } else {
      spinner.fail('Registry validation failed');
    }

    if (options.format === 'json') {
      console.log(JSON.stringify(result, null, 2));
      if (!result.valid || (options.strict && result.issues.length > 0)) {
        process.exit(1);
      }
      return;
    }

    // Text output
    ConsoleOutput.newline();

    // Show stats
    ConsoleOutput.muted(
      `Namespaces: ${result.stats.namespaces} | Catalog entries: ${result.stats.catalogEntries} | Files: ${result.stats.prsFiles}`
    );

    // Show issues
    if (result.issues.length > 0) {
      ConsoleOutput.newline();
      const errors = result.issues.filter((i) => i.severity === 'error');
      const warnings = result.issues.filter((i) => i.severity === 'warning');

      if (errors.length > 0) {
        console.log(`Errors (${errors.length}):`);
        for (const issue of errors) {
          ConsoleOutput.error(`  ${issue.message}`);
        }
      }

      if (warnings.length > 0) {
        console.log(`Warnings (${warnings.length}):`);
        for (const issue of warnings) {
          ConsoleOutput.warn(`  ${issue.message}`);
        }
      }
    }

    if (!result.valid || (options.strict && result.issues.length > 0)) {
      process.exit(1);
    }
  } catch (error) {
    spinner.fail('Validation failed');
    ConsoleOutput.error((error as Error).message);
    process.exit(1);
  }
}
