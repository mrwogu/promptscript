import { resolve, join } from 'path';
import { execFileSync } from 'child_process';
import type { RegistryPublishOptions } from '../../types.js';
import { type CliServices, createDefaultServices } from '../../services.js';
import { createSpinner, ConsoleOutput } from '../../output/console.js';
import { validateRegistry } from '../../utils/registry-validator.js';

/**
 * Publish a PromptScript registry to its remote.
 */
export async function registryPublishCommand(
  path: string | undefined,
  options: RegistryPublishOptions,
  services: CliServices = createDefaultServices()
): Promise<void> {
  const registryPath = resolve(path ?? '.');

  try {
    // 1. Validate unless --force
    if (!options.force) {
      const spinner = createSpinner('Validating registry...').start();
      const result = await validateRegistry(registryPath, services);

      if (!result.valid) {
        spinner.fail('Registry validation failed');
        ConsoleOutput.newline();
        for (const issue of result.issues.filter((i) => i.severity === 'error')) {
          ConsoleOutput.error(`  ${issue.message}`);
        }
        ConsoleOutput.newline();
        ConsoleOutput.muted('Use --force to skip validation');
        process.exit(1);
        return;
      }
      spinner.succeed(
        `Registry valid (${result.stats.catalogEntries} entries, ${result.stats.prsFiles} files)`
      );
    }

    // 2. Update lastUpdated in manifest
    const manifestPath = join(registryPath, 'registry-manifest.yaml');
    if (services.fs.existsSync(manifestPath)) {
      const content = await services.fs.readFile(manifestPath, 'utf-8');
      const today = new Date().toISOString().split('T')[0];
      const updated = content.replace(
        /lastUpdated:\s*['"]?[^'"\n]+['"]?/,
        `lastUpdated: '${today}'`
      );
      if (updated !== content) {
        await services.fs.writeFile(manifestPath, updated, 'utf-8');
      }
    }

    // 3. Dry run check
    if (options.dryRun) {
      ConsoleOutput.newline();
      console.log('Dry run - would perform:');
      ConsoleOutput.muted('  1. Stage all changes');
      ConsoleOutput.muted(`  2. Commit: ${options.message ?? 'chore: publish registry updates'}`);
      ConsoleOutput.muted('  3. Push to remote');
      if (options.tag) {
        ConsoleOutput.muted(`  4. Tag: ${options.tag}`);
      }
      return;
    }

    // 4. Git operations (using execFileSync to prevent shell injection)
    const spinner = createSpinner('Publishing registry...').start();

    const git = (...args: string[]): string => {
      return execFileSync('git', args, { cwd: registryPath, encoding: 'utf-8' }).trim();
    };

    // Check if git repo
    try {
      git('rev-parse', '--is-inside-work-tree');
    } catch {
      spinner.fail('Not a git repository');
      ConsoleOutput.muted('Initialize with: git init');
      process.exit(1);
      return;
    }

    // Stage, commit, push
    git('add', '-A');

    const commitMessage = options.message ?? 'chore: publish registry updates';
    try {
      git('commit', '-m', commitMessage);
    } catch {
      spinner.warn('No changes to commit');
      return;
    }

    // Push
    try {
      git('push');
    } catch {
      spinner.fail('Push failed - check your remote configuration');
      process.exit(1);
      return;
    }

    // Tag if requested
    if (options.tag) {
      git('tag', options.tag);
      git('push', 'origin', options.tag);
    }

    spinner.succeed('Registry published');

    ConsoleOutput.newline();
    ConsoleOutput.muted(`Commit: ${commitMessage}`);
    if (options.tag) {
      ConsoleOutput.muted(`Tag: ${options.tag}`);
    }
  } catch (error) {
    ConsoleOutput.error(`Publish failed: ${(error as Error).message}`);
    process.exit(1);
  }
}
