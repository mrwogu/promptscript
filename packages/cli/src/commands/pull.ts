import { mkdir, writeFile, readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { resolve, dirname } from 'path';
import type { PullOptions } from '../types';
import { loadConfig } from '../config/loader';
import { createSpinner, ConsoleOutput } from '../output/console';

/**
 * Pull updates from registry.
 * Currently supports local registry path only.
 * Remote registry support will be added in future versions.
 */
export async function pullCommand(options: PullOptions): Promise<void> {
  const spinner = createSpinner('Loading configuration...').start();

  try {
    const config = await loadConfig();

    // Check if registry URL is configured
    if (config.registry?.url) {
      spinner.fail('Remote registry not yet supported');
      ConsoleOutput.error('Remote registry support coming soon');
      ConsoleOutput.muted('For now, use a local registry path in your config.');
      process.exit(1);
    }

    // Check if inherit is configured
    if (!config.inherit) {
      spinner.warn('No inheritance configured');
      ConsoleOutput.muted('Add "inherit" to your config to pull from registry');
      return;
    }

    spinner.text = `Pulling ${config.inherit}...`;

    const registryPath = config.registry?.path ?? './registry';

    // Parse inherit path (e.g., "@team/project" -> "team/project.prs")
    const inheritPath = parseInheritPath(config.inherit);
    const sourcePath = resolve(registryPath, inheritPath);

    if (!existsSync(sourcePath)) {
      spinner.fail('Inheritance source not found');
      ConsoleOutput.error(`Not found: ${sourcePath}`);
      ConsoleOutput.muted('Make sure the registry path is correct and the file exists');
      process.exit(1);
    }

    // Read the source file
    const content = await readFile(sourcePath, 'utf-8');

    // Destination in local promptscript folder
    const destPath = resolve('./promptscript/.inherited', inheritPath);

    // Check if destination exists and force flag
    if (existsSync(destPath) && !options.force) {
      spinner.warn('File already exists (use --force to overwrite)');
      ConsoleOutput.muted(destPath);
      return;
    }

    // Create directory and write file
    await mkdir(dirname(destPath), { recursive: true });
    await writeFile(destPath, content, 'utf-8');

    spinner.succeed('Pulled from registry');
    ConsoleOutput.success(destPath);
  } catch (error) {
    spinner.fail('Error');
    ConsoleOutput.error((error as Error).message);
    process.exit(1);
  }
}

/**
 * Parse an inherit path to a file path.
 * @example "@team/project" -> "team/project.prs"
 * @example "@org/team/base" -> "org/team/base.prs"
 */
function parseInheritPath(inheritPath: string): string {
  // Remove leading @
  let path = inheritPath.startsWith('@') ? inheritPath.slice(1) : inheritPath;

  // Add .prs extension if not present
  if (!path.endsWith('.prs')) {
    path += '.prs';
  }

  return path;
}
