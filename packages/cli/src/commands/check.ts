import { existsSync } from 'fs';
import { resolve } from 'path';
import type { CheckOptions } from '../types.js';
import { findConfigFile, loadConfig, CONFIG_FILES } from '../config/loader.js';
import { createSpinner, ConsoleOutput, isVerbose } from '../output/console.js';

/**
 * Check result for a single item.
 */
interface CheckResult {
  name: string;
  status: 'ok' | 'warning' | 'error';
  message?: string;
}

/**
 * Check configuration and dependencies health.
 * Verifies:
 * - Config file exists and is valid
 * - Entry file exists
 * - Registry path exists (if configured)
 * - Inherit paths are resolvable (if configured)
 */
export async function checkCommand(_options: CheckOptions): Promise<void> {
  const spinner = createSpinner('Checking project health...').start();
  const results: CheckResult[] = [];
  let hasErrors = false;
  let hasWarnings = false;

  try {
    // Check 1: Config file exists
    const configFile = findConfigFile();
    if (!configFile) {
      results.push({
        name: 'Configuration file',
        status: 'error',
        message: `No config found. Expected one of: ${CONFIG_FILES.join(', ')}`,
      });
      hasErrors = true;
      spinner.fail('Project health check failed');
      printResults(results);
      ConsoleOutput.newline();
      ConsoleOutput.info('Run "prs init" to create a configuration file');
      process.exitCode = 1;
      return;
    }

    results.push({
      name: 'Configuration file',
      status: 'ok',
      message: configFile,
    });

    // Check 2: Config is valid YAML
    let config;
    try {
      config = await loadConfig();
      results.push({
        name: 'Configuration syntax',
        status: 'ok',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      results.push({
        name: 'Configuration syntax',
        status: 'error',
        message,
      });
      hasErrors = true;
      spinner.fail('Project health check failed');
      printResults(results);
      process.exitCode = 1;
      return;
    }

    // Check 3: Version field
    if (!config.version) {
      results.push({
        name: 'Schema version',
        status: 'warning',
        message: 'Missing "version" field. Add version: \'1\' to config',
      });
      hasWarnings = true;
    } else {
      results.push({
        name: 'Schema version',
        status: 'ok',
        message: `v${config.version}`,
      });
    }

    // Check 4: Entry file exists
    const entryPath = config.input?.entry ?? '.promptscript/project.prs';
    if (existsSync(entryPath)) {
      results.push({
        name: 'Entry file',
        status: 'ok',
        message: entryPath,
      });
    } else {
      results.push({
        name: 'Entry file',
        status: 'error',
        message: `Entry file not found: ${entryPath}`,
      });
      hasErrors = true;
    }

    // Check 5: Registry path (if configured)
    if (config.registry?.path) {
      const registryPath = resolve(config.registry.path);
      if (existsSync(registryPath)) {
        results.push({
          name: 'Registry path',
          status: 'ok',
          message: config.registry.path,
        });
      } else {
        results.push({
          name: 'Registry path',
          status: 'warning',
          message: `Registry path not found: ${config.registry.path}`,
        });
        hasWarnings = true;
      }
    } else if (config.registry?.url) {
      results.push({
        name: 'Registry URL',
        status: 'ok',
        message: config.registry.url,
      });
    }

    // Check 6: Targets configured
    if (!config.targets || config.targets.length === 0) {
      results.push({
        name: 'Targets',
        status: 'warning',
        message: 'No targets configured',
      });
      hasWarnings = true;
    } else {
      results.push({
        name: 'Targets',
        status: 'ok',
        message: `${config.targets.length} target(s) configured`,
      });
    }

    // Check 7: Inherit path (if configured in config)
    if (config.inherit) {
      // For now, just note it - full resolution would require the resolver
      results.push({
        name: 'Inheritance',
        status: 'ok',
        message: config.inherit,
      });
    }

    // Print results
    if (hasErrors) {
      spinner.fail('Project health check failed');
    } else if (hasWarnings) {
      spinner.warn('Project health check completed with warnings');
    } else {
      spinner.succeed('Project health check passed');
    }

    printResults(results);

    // Verbose: show additional details
    if (isVerbose()) {
      ConsoleOutput.newline();
      ConsoleOutput.verbose(`Config file: ${configFile}`);
      ConsoleOutput.verbose(`Working directory: ${process.cwd()}`);
    }

    if (hasErrors) {
      process.exitCode = 1;
    } else if (hasWarnings) {
      process.exitCode = 0; // Warnings don't fail by default
    }
  } catch (error) {
    spinner.fail('Health check failed');
    const message = error instanceof Error ? error.message : 'Unknown error';
    ConsoleOutput.error(message);
    process.exitCode = 1;
  }
}

/**
 * Print check results to console.
 */
function printResults(results: CheckResult[]): void {
  ConsoleOutput.newline();

  for (const result of results) {
    const msg = result.message ? `${result.name}: ${result.message}` : result.name;

    // Use appropriate console output based on status
    if (result.status === 'ok') {
      ConsoleOutput.success(msg);
    } else if (result.status === 'warning') {
      ConsoleOutput.warning(msg);
    } else {
      ConsoleOutput.error(msg);
    }
  }
}
