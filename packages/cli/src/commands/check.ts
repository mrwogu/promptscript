import { existsSync } from 'fs';
import { readFile } from 'fs/promises';
import { resolve } from 'path';
import { parse as parseYaml } from 'yaml';
import { Compiler } from '@promptscript/compiler';
import {
  isKnownSyntaxVersion,
  isKnownTarget,
  isValidLockfile,
  type Lockfile,
} from '@promptscript/core';
import type { CheckOptions } from '../types.js';
import { findConfigFile, loadEffectiveConfig, CONFIG_FILES } from '../config/loader.js';
import { createSpinner, ConsoleOutput, isVerbose } from '../output/console.js';
import { resolveRegistryPath } from '../utils/registry-resolver.js';

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
 * - Registry and lockfile are usable
 * - PromptScript syntax, imports, and inheritance resolve
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
      config = await loadEffectiveConfig(configFile);
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

    // Check 3: Project identifier
    const legacyProject =
      'project' in config && typeof config.project === 'object' && config.project !== null
        ? config.project
        : undefined;
    const projectId =
      typeof config.id === 'string' && config.id.trim()
        ? config.id
        : legacyProject &&
            'id' in legacyProject &&
            typeof legacyProject.id === 'string' &&
            legacyProject.id.trim()
          ? legacyProject.id
          : undefined;
    if (projectId) {
      results.push({
        name: 'Project identifier',
        status: 'ok',
        message: projectId,
      });
    } else {
      results.push({
        name: 'Project identifier',
        status: 'error',
        message: 'Missing non-empty "id" field',
      });
      hasErrors = true;
    }

    // Check 4: Syntax version field
    if (!config.syntax) {
      results.push({
        name: 'Syntax version',
        status: 'warning',
        message: 'Missing "syntax" field. Add syntax: "<version>" to config',
      });
      hasWarnings = true;
    } else if (!isKnownSyntaxVersion(config.syntax)) {
      results.push({
        name: 'Syntax version',
        status: 'error',
        message: `Unsupported version: ${config.syntax}`,
      });
      hasErrors = true;
    } else {
      results.push({
        name: 'Syntax version',
        status: 'ok',
        message: `v${config.syntax}`,
      });
    }

    // Check 5: Entry file exists
    const entryPath = resolve(config.input?.entry ?? '.promptscript/project.prs');
    if (existsSync(entryPath)) {
      results.push({
        name: 'Entry file',
        status: 'ok',
        message: config.input?.entry ?? '.promptscript/project.prs',
      });
    } else {
      results.push({
        name: 'Entry file',
        status: 'error',
        message: `Entry file not found: ${entryPath}`,
      });
      hasErrors = true;
    }

    // Check 6: Local registry path (if configured)
    if (config.registry?.url && !config.registry.git) {
      results.push({
        name: 'Registry URL',
        status: 'warning',
        message: 'HTTP registry verification is not supported',
      });
      hasWarnings = true;
    } else if (config.registry?.path && !config.registry.git) {
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
          status: 'error',
          message: `Registry path not found: ${config.registry.path}`,
        });
        hasErrors = true;
      }
    }

    // Check 7: Targets configured
    if (!config.targets || config.targets.length === 0) {
      results.push({
        name: 'Targets',
        status: 'warning',
        message: 'No targets configured',
      });
      hasWarnings = true;
    } else {
      const targetNames = config.targets.flatMap((target) => {
        if (typeof target === 'string') return [target];
        if (typeof target !== 'object' || target === null || Array.isArray(target)) {
          return ['<invalid>'];
        }
        return Object.keys(target);
      });
      const invalidTargets = targetNames.filter((target) => !isKnownTarget(target));
      if (invalidTargets.length > 0 || targetNames.length === 0) {
        results.push({
          name: 'Targets',
          status: 'error',
          message:
            invalidTargets.length > 0
              ? `Unknown target(s): ${invalidTargets.join(', ')}`
              : 'Target entries must not be empty',
        });
        hasErrors = true;
      } else {
        results.push({
          name: 'Targets',
          status: 'ok',
          message: `${targetNames.length} target(s) configured`,
        });
      }
    }

    // Check 8: Lockfile, registry, imports, inheritance, and validation
    if (existsSync(entryPath)) {
      try {
        const lockfilePath = resolve('promptscript.lock');
        let lockfile: Lockfile | undefined;
        if (existsSync(lockfilePath)) {
          const parsed: unknown = parseYaml(await readFile(lockfilePath, 'utf-8'), {
            maxAliasCount: 100,
          });
          if (!isValidLockfile(parsed)) {
            throw new Error(`Invalid lockfile: ${lockfilePath}`);
          }
          lockfile = parsed;
          results.push({
            name: 'Lockfile',
            status: 'ok',
            message: 'promptscript.lock',
          });
        }

        const vendorDir = resolve('.promptscript/vendor');
        const registry = await resolveRegistryPath(config, { vendorDir, lockfile });
        const compiler = new Compiler({
          resolver: {
            registryPath: resolve(registry.path),
            localPath: resolve('.promptscript'),
            vendorDir,
            referenceRoots:
              registry.repositoryUrl && registry.repositoryPath
                ? { [registry.repositoryUrl]: [registry.repositoryPath] }
                : undefined,
            lockfile,
            registries: config.registries,
          },
          validator: {
            ...config.validation,
            policies: config.policies,
          },
          formatters: [],
        });
        const result = await compiler.compile(entryPath);

        if (result.errors.length > 0) {
          results.push({
            name: 'Project resolution',
            status: 'error',
            message: result.errors.map((error) => error.message).join('; '),
          });
          hasErrors = true;
        } else if (result.warnings.length > 0) {
          results.push({
            name: 'Project resolution',
            status: 'warning',
            message: `${result.warnings.length} validation warning(s)`,
          });
          hasWarnings = true;
        } else {
          results.push({
            name: 'Project resolution',
            status: 'ok',
            message: 'Syntax, imports, and inheritance are valid',
          });
        }
      } catch (error) {
        results.push({
          name: 'Project resolution',
          status: 'error',
          message: error instanceof Error ? error.message : 'Unknown resolution error',
        });
        hasErrors = true;
      }
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
