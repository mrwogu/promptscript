import { mkdir, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { resolve, dirname } from 'path';
import type { PullOptions } from '../types.js';
import { loadConfig } from '../config/loader.js';
import { createSpinner, ConsoleOutput } from '../output/console.js';
import {
  createFileSystemRegistry,
  createHttpRegistry,
  createGitRegistry,
  GitCloneError,
  GitAuthError,
  GitRefNotFoundError,
  type Registry,
} from '@promptscript/resolver';

/**
 * Pull updates from registry.
 * Supports local path, HTTP, and Git registries.
 */
export async function pullCommand(options: PullOptions): Promise<void> {
  const spinner = createSpinner('Loading configuration...').start();

  try {
    const config = await loadConfig();

    // Check if inherit is configured
    if (!config.inherit) {
      spinner.warn('No inheritance configured');
      ConsoleOutput.muted('Add "inherit" to your config to pull from registry');
      return;
    }

    spinner.text = `Pulling ${config.inherit}...`;

    // Determine which registry to use and create it
    const registry = await createRegistry(config, options, spinner);

    // Parse inherit path (e.g., "@team/project" -> "team/project.prs")
    const inheritPath = parseInheritPath(config.inherit);

    // Check if file exists in registry
    spinner.text = `Checking ${inheritPath}...`;
    const exists = await registry.exists(inheritPath);

    if (!exists) {
      spinner.fail('Inheritance source not found');
      ConsoleOutput.error(`Not found in registry: ${config.inherit}`);
      ConsoleOutput.muted('Make sure the registry is configured correctly and the file exists');
      process.exit(1);
    }

    // Fetch the file content
    spinner.text = `Fetching ${inheritPath}...`;
    const content = await registry.fetch(inheritPath);

    // Destination in local .promptscript folder
    const destPath = resolve('./.promptscript/.inherited', inheritPath);

    // Check if destination exists and force flag
    if (existsSync(destPath) && !options.force && !options.dryRun) {
      spinner.warn('File already exists (use --force to overwrite)');
      ConsoleOutput.muted(destPath);
      return;
    }

    // Dry run mode - just show what would happen
    if (options.dryRun) {
      spinner.succeed('Dry run completed');
      ConsoleOutput.newline();
      ConsoleOutput.dryRun(`Would fetch: ${config.inherit}`);
      ConsoleOutput.dryRun(`       to: ${destPath}`);
      if (existsSync(destPath)) {
        ConsoleOutput.dryRun('(would overwrite existing file)');
      }
      return;
    }

    // Create directory and write file
    await mkdir(dirname(destPath), { recursive: true });
    await writeFile(destPath, content, 'utf-8');

    spinner.succeed('Pulled from registry');
    ConsoleOutput.success(destPath);
  } catch (error) {
    handlePullError(error, spinner);
    process.exit(1);
  }
}

/**
 * Create the appropriate registry based on configuration and options.
 */
async function createRegistry(
  config: Awaited<ReturnType<typeof loadConfig>>,
  options: PullOptions,
  spinner: ReturnType<typeof createSpinner>
): Promise<Registry> {
  // Determine Git ref from CLI options (priority: commit > tag > branch > config)
  const gitRef = options.commit ?? options.tag ?? options.branch;

  // Priority 1: Git registry
  if (config.registry?.git) {
    const gitConfig = config.registry.git;
    spinner.text = `Connecting to Git registry: ${gitConfig.url}...`;

    return createGitRegistry({
      url: gitConfig.url,
      ref: gitRef ?? gitConfig.ref,
      path: gitConfig.path,
      auth: gitConfig.auth,
      cache: {
        enabled: !options.refresh && (config.registry.cache?.enabled ?? true),
        ttl: config.registry.cache?.ttl,
      },
    });
  }

  // Priority 2: HTTP registry
  if (config.registry?.url) {
    spinner.text = `Connecting to HTTP registry: ${config.registry.url}...`;

    const httpAuth = config.registry.auth;
    let token: string | undefined;

    if (httpAuth) {
      token =
        httpAuth.token ?? (httpAuth.tokenEnvVar ? process.env[httpAuth.tokenEnvVar] : undefined);
    }

    return createHttpRegistry({
      baseUrl: config.registry.url,
      auth: httpAuth && token ? { type: httpAuth.type, token } : undefined,
      cache: {
        enabled: config.registry.cache?.enabled ?? true,
        ttl: config.registry.cache?.ttl ?? 300000,
      },
    });
  }

  // Priority 3: Local filesystem registry
  const registryPath = config.registry?.path ?? './registry';
  spinner.text = `Using local registry: ${registryPath}...`;

  if (!existsSync(registryPath)) {
    throw new Error(`Local registry path not found: ${registryPath}`);
  }

  return createFileSystemRegistry(resolve(registryPath));
}

/**
 * Parse an inherit path to a file path.
 * @example "@team/project" -> "team/project.prs"
 * @example "@org/team/base" -> "org/team/base.prs"
 * @example "@company/base@v1.0.0" -> "company/base.prs" (version handled by registry)
 */
function parseInheritPath(inheritPath: string): string {
  // Remove version suffix if present (e.g., @company/base@v1.0.0 -> @company/base)
  const versionIndex = inheritPath.lastIndexOf('@');
  const atIndex = inheritPath.indexOf('@');

  // If there are two @ symbols, the second one is the version
  let pathWithoutVersion = inheritPath;
  if (versionIndex > atIndex && versionIndex !== atIndex) {
    pathWithoutVersion = inheritPath.slice(0, versionIndex);
  }

  // Remove leading @
  let path = pathWithoutVersion.startsWith('@') ? pathWithoutVersion.slice(1) : pathWithoutVersion;

  // Add .prs extension if not present
  if (!path.endsWith('.prs')) {
    path += '.prs';
  }

  return path;
}

/**
 * Handle pull errors with appropriate messages.
 */
function handlePullError(error: unknown, spinner: ReturnType<typeof createSpinner>): void {
  if (error instanceof GitAuthError) {
    spinner.fail('Git authentication failed');
    ConsoleOutput.error(error.message);
    ConsoleOutput.muted('Check your authentication configuration:');
    ConsoleOutput.muted('  - For token auth: ensure GITHUB_TOKEN or tokenEnvVar is set');
    ConsoleOutput.muted('  - For SSH auth: ensure SSH key is configured and accessible');
    return;
  }

  if (error instanceof GitRefNotFoundError) {
    spinner.fail('Git ref not found');
    ConsoleOutput.error(error.message);
    ConsoleOutput.muted('Available options:');
    ConsoleOutput.muted('  - Use --branch <name> to specify a branch');
    ConsoleOutput.muted('  - Use --tag <name> to specify a tag');
    ConsoleOutput.muted('  - Use --commit <hash> to specify a commit');
    return;
  }

  if (error instanceof GitCloneError) {
    spinner.fail('Git clone failed');
    ConsoleOutput.error(error.message);
    ConsoleOutput.muted('Possible causes:');
    ConsoleOutput.muted('  - Network connectivity issues');
    ConsoleOutput.muted('  - Invalid repository URL');
    ConsoleOutput.muted('  - Missing authentication for private repository');
    return;
  }

  // Generic error
  spinner.fail('Error');
  ConsoleOutput.error((error as Error).message);
}
