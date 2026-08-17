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
import { getEffectiveEntryPaths } from '../utils/build-profile.js';
import { resolveRegistryPath } from '../utils/registry-resolver.js';
import { isTargetConfig } from '../utils/target-config.js';

/**
 * Check result for a single item.
 */
interface CheckResult {
  name: string;
  status: 'ok' | 'warning' | 'error';
  message?: string;
}

interface TargetEntryAnalysis {
  names: string[];
  errors: string[];
}

function isTargetDisabled(config: unknown): boolean {
  return (
    config !== null &&
    typeof config === 'object' &&
    !Array.isArray(config) &&
    (config as { enabled?: unknown }).enabled === false
  );
}

function analyzeTargetEntries(entries: readonly unknown[]): TargetEntryAnalysis {
  const names = new Set<string>();
  const errors: string[] = [];

  for (const entry of entries) {
    if (typeof entry === 'string') {
      if (isKnownTarget(entry)) {
        names.add(entry);
      } else {
        errors.push(`unknown target "${entry}"`);
      }
      continue;
    }

    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      errors.push('target entries must be names or configuration objects');
      continue;
    }

    const configuredTargets = Object.entries(entry);
    if (configuredTargets.length === 0) {
      errors.push('target entries must not be empty');
      continue;
    }

    for (const [name, targetConfig] of configuredTargets) {
      if (!isKnownTarget(name)) {
        errors.push(`unknown target "${name}"`);
      }
      if (!isTargetConfig(targetConfig)) {
        errors.push(`target "${name}" configuration must be an object`);
      } else if (isKnownTarget(name) && !isTargetDisabled(targetConfig)) {
        names.add(name);
      }
    }
  }

  return { names: [...names], errors };
}

/**
 * Check configuration and dependencies health.
 * Verifies:
 * - Config file exists and is valid
 * - Effective entry files exist
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

    // Check 5: Effective entry files exist
    const entryIssues: string[] = [];
    const inputValue: unknown = config.input;
    if (
      inputValue !== undefined &&
      (inputValue === null || typeof inputValue !== 'object' || Array.isArray(inputValue))
    ) {
      entryIssues.push('config.input must be an object');
    } else if (inputValue && typeof inputValue === 'object') {
      const configuredEntry = (inputValue as { entry?: unknown }).entry;
      if (
        configuredEntry !== undefined &&
        (typeof configuredEntry !== 'string' || configuredEntry.trim().length === 0)
      ) {
        entryIssues.push('config.input.entry must be a non-empty string');
      }
    }

    const entryBuildsValue: unknown = config.builds;
    if (
      entryBuildsValue &&
      typeof entryBuildsValue === 'object' &&
      !Array.isArray(entryBuildsValue)
    ) {
      for (const [buildName, profile] of Object.entries(
        entryBuildsValue as Record<string, unknown>
      )) {
        if (!profile || typeof profile !== 'object' || Array.isArray(profile)) continue;
        const configuredEntry = (profile as { entry?: unknown }).entry;
        if (
          configuredEntry !== undefined &&
          (typeof configuredEntry !== 'string' || configuredEntry.trim().length === 0)
        ) {
          entryIssues.push(`config.builds.${buildName}.entry must be a non-empty string`);
        }
      }
    }
    if (entryIssues.length > 0) {
      results.push({
        name: 'Entry configuration',
        status: 'error',
        message: entryIssues.join('; '),
      });
      hasErrors = true;
    }

    const effectiveEntries = getEffectiveEntryPaths(config);
    for (const entry of effectiveEntries) {
      const entryPath = resolve(entry);
      const name =
        entry === (config.input?.entry ?? '.promptscript/project.prs')
          ? 'Entry file'
          : `Entry file (${entry})`;
      if (existsSync(entryPath)) {
        results.push({
          name,
          status: 'ok',
          message: entry,
        });
      } else {
        results.push({
          name,
          status: 'error',
          message: `Entry file not found: ${entryPath}`,
        });
        hasErrors = true;
      }
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
    const targetIssues: string[] = [];
    const targetNames = new Set<string>();
    const rootTargetValue: unknown = config.targets;
    const rootTargets: readonly unknown[] = Array.isArray(rootTargetValue) ? rootTargetValue : [];
    const buildsValue: unknown = config.builds;
    const builds =
      buildsValue !== undefined &&
      buildsValue !== null &&
      typeof buildsValue === 'object' &&
      !Array.isArray(buildsValue)
        ? Object.entries(buildsValue as Record<string, unknown>)
        : [];

    const appendTargetAnalysis = (location: string, entries: readonly unknown[]): void => {
      const analysis = analyzeTargetEntries(entries);
      for (const name of analysis.names) {
        targetNames.add(name);
      }
      targetIssues.push(...analysis.errors.map((error) => `${location}: ${error}`));
      if (entries.length > 0 && analysis.names.length === 0 && analysis.errors.length === 0) {
        targetIssues.push(`${location}: no enabled targets`);
      }
    };

    if (rootTargetValue !== undefined && !Array.isArray(rootTargetValue)) {
      targetIssues.push('config.targets must be an array');
    } else if (rootTargets.length > 0) {
      appendTargetAnalysis('config.targets', rootTargets);
    }
    if (
      buildsValue !== undefined &&
      (buildsValue === null || typeof buildsValue !== 'object' || Array.isArray(buildsValue))
    ) {
      targetIssues.push('config.builds must be an object');
    }

    for (const [buildName, profile] of builds) {
      if (!profile || typeof profile !== 'object' || Array.isArray(profile)) {
        targetIssues.push(`config.builds.${buildName} must be an object`);
        continue;
      }

      const profileTargetValue: unknown = (profile as { targets?: unknown }).targets;
      if (profileTargetValue === undefined) {
        if (rootTargets.length === 0) {
          targetIssues.push(
            `config.builds.${buildName}.targets is missing and config.targets is empty`
          );
        }
        continue;
      }
      if (!Array.isArray(profileTargetValue)) {
        targetIssues.push(`config.builds.${buildName}.targets must be an array`);
        continue;
      }
      if (profileTargetValue.length === 0) {
        targetIssues.push(`config.builds.${buildName}.targets is empty`);
        continue;
      }
      appendTargetAnalysis(`config.builds.${buildName}.targets`, profileTargetValue);
    }

    if (targetIssues.length > 0) {
      results.push({
        name: 'Targets',
        status: 'error',
        message: targetIssues.join('; '),
      });
      hasErrors = true;
    } else if (rootTargets.length === 0 && builds.length === 0) {
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
        message:
          rootTargets.length === 0
            ? `${targetNames.size} target(s) configured in build profiles`
            : `${targetNames.size} target(s) configured`,
      });
    }

    // Check 8: Lockfile, registry, imports, inheritance, and validation
    const existingEntries = effectiveEntries.filter((entry) => existsSync(resolve(entry)));
    if (existingEntries.length > 0) {
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

        for (const entry of existingEntries) {
          const name =
            entry === (config.input?.entry ?? '.promptscript/project.prs')
              ? 'Project resolution'
              : `Project resolution (${entry})`;
          try {
            const result = await compiler.compile(resolve(entry));

            if (result.errors.length > 0) {
              results.push({
                name,
                status: 'error',
                message: result.errors.map((error) => error.message).join('; '),
              });
              hasErrors = true;
            } else if (result.warnings.length > 0) {
              results.push({
                name,
                status: 'warning',
                message: `${result.warnings.length} validation warning(s)`,
              });
              hasWarnings = true;
            } else {
              results.push({
                name,
                status: 'ok',
                message: 'Syntax, imports, and inheritance are valid',
              });
            }
          } catch (error) {
            results.push({
              name,
              status: 'error',
              message: error instanceof Error ? error.message : 'Unknown resolution error',
            });
            hasErrors = true;
          }
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
