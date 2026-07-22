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
        process.exitCode = 1;
        return;
      }
      spinner.succeed(
        `Registry valid (${result.stats.catalogEntries} entries, ${result.stats.prsFiles} files)`
      );
    }

    // 2. Dry run check
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

    // 3. Git operations (using execFileSync to prevent shell injection)
    const spinner = createSpinner('Publishing registry...').start();

    const git = (...args: string[]): string => {
      return execFileSync('git', args, { cwd: registryPath, encoding: 'utf-8' }).trim();
    };

    // Check if git repo
    let gitRoot: string;
    try {
      git('rev-parse', '--is-inside-work-tree');
      gitRoot = resolve(git('rev-parse', '--show-toplevel'));
    } catch {
      spinner.fail('Not a git repository');
      ConsoleOutput.muted('Initialize with: git init');
      process.exitCode = 1;
      return;
    }
    if (gitRoot !== registryPath) {
      spinner.fail('Registry path is not the Git repository root');
      ConsoleOutput.muted(`Git root: ${gitRoot}`);
      process.exitCode = 1;
      return;
    }

    if (options.tag) {
      const tagRef = `refs/tags/${options.tag}`;
      try {
        git('check-ref-format', tagRef);
      } catch {
        spinner.fail(`Invalid tag name: ${options.tag}`);
        process.exitCode = 1;
        return;
      }
      try {
        git('show-ref', '--verify', '--quiet', tagRef);
        spinner.fail(`Tag already exists: ${options.tag}`);
        process.exitCode = 1;
        return;
      } catch {
        // A missing local tag is the expected result.
      }
      let remoteTag: string;
      try {
        remoteTag = git('ls-remote', '--tags', 'origin', tagRef);
      } catch {
        spinner.fail('Failed to check remote tags');
        process.exitCode = 1;
        return;
      }
      if (remoteTag) {
        spinner.fail(`Tag already exists on origin: ${options.tag}`);
        process.exitCode = 1;
        return;
      }
    }

    // 4. Update lastUpdated in manifest
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

    // 5. Stage, commit, push
    git('add', '-A', '--', '.');

    const commitMessage = options.message ?? 'chore: publish registry updates';
    const hasChanges = git('status', '--porcelain', '--', '.').length > 0;
    if (hasChanges) {
      git('commit', '-m', commitMessage);
    } else {
      spinner.warn('No changes to commit');
    }

    // Push
    try {
      git('push');
    } catch {
      spinner.fail('Push failed - check your remote configuration');
      process.exitCode = 1;
      return;
    }

    // Tag if requested
    if (options.tag) {
      const tagRef = `refs/tags/${options.tag}`;
      git('tag', '--', options.tag);
      try {
        git('push', 'origin', tagRef);
      } catch {
        try {
          git('tag', '-d', '--', options.tag);
        } catch {
          // Keep the remote push failure as the primary outcome.
        }
        spinner.fail('Tag push failed');
        process.exitCode = 1;
        return;
      }
    }

    spinner.succeed('Registry published');

    ConsoleOutput.newline();
    if (hasChanges) {
      ConsoleOutput.muted(`Commit: ${commitMessage}`);
    }
    if (options.tag) {
      ConsoleOutput.muted(`Tag: ${options.tag}`);
    }
  } catch (error) {
    ConsoleOutput.error(
      `Publish failed: ${error instanceof Error ? error.message : String(error)}`
    );
    process.exitCode = 1;
  }
}
