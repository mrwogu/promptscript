import { existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import type { ResolveCommandOptions } from '../types.js';
import { loadConfig, findConfigFile } from '../config/loader.js';
import { loadUserConfig } from '../config/user-config.js';
import { ConsoleOutput } from '../output/console.js';
import { expandAlias, validateAlias } from '@promptscript/resolver';

/** Base directory for the PromptScript cache. */
const CACHE_BASE = join(homedir(), '.promptscript', 'cache', 'registries');

/**
 * Debug command: show the full resolution chain for an import path.
 *
 * Prints alias expansion, repo URL, version from lockfile, cache location,
 * and resolved file type without performing any network operations.
 */
export async function resolveCommand(
  importPath: string,
  _options: ResolveCommandOptions
): Promise<void> {
  try {
    const configFile = findConfigFile();
    if (!configFile) {
      ConsoleOutput.error('No project config found. Run: prs init');
      process.exitCode = 1;
      return;
    }

    const config = await loadConfig();
    const userConfig = await loadUserConfig();

    // Merge registries: project overrides user
    const registries = {
      ...(userConfig.registries ?? {}),
      ...(config.registries ?? {}),
    };

    // Check if this is an alias-based import
    const isAlias = importPath.startsWith('@');

    if (isAlias) {
      // Validate the import looks like a path (not just a bare alias)
      const aliasName = importPath.split('/')[0] ?? '';

      try {
        validateAlias(aliasName);
      } catch {
        ConsoleOutput.error(`Invalid alias format: "${aliasName}". Must match @[a-z0-9][a-z0-9-]*`);
        process.exitCode = 1;
        return;
      }

      if (Object.keys(registries).length === 0) {
        ConsoleOutput.error('No registries configured.');
        ConsoleOutput.muted('Add registries to promptscript.yaml: prs registry add @name <url>');
        process.exitCode = 1;
        return;
      }

      let expanded;
      try {
        expanded = expandAlias(importPath, registries);
      } catch (err) {
        ConsoleOutput.error(err instanceof Error ? err.message : String(err));
        ConsoleOutput.muted(`Known aliases: ${Object.keys(registries).join(', ') || '(none)'}`);
        process.exitCode = 1;
        return;
      }

      const { repoUrl, path, version } = expanded;

      // Try to locate in cache
      const cacheVersion = version ?? 'latest';
      const cacheDir = join(CACHE_BASE, repoUrl.replace(/[/:]/g, '_'), cacheVersion);
      const cacheExists = existsSync(cacheDir);

      // Determine file type
      const filePath = path.endsWith('.prs') ? path : `${path}.prs`;
      const cachedFile = join(cacheDir, filePath);
      const fileExists = cacheExists && existsSync(cachedFile);

      ConsoleOutput.newline();
      console.log(`  Alias:    ${aliasName} → ${repoUrl}`);
      console.log(`  Repo:     ${repoUrl}`);
      console.log(`  Path:     ${path || '(root)'}`);
      console.log(`  Version:  ${cacheVersion}${version ? '' : ' (unresolved — run: prs lock)'}`);
      console.log(`  Cache:    ${cacheDir}`);

      if (cacheExists) {
        console.log(`  File:     ${filePath}`);
        console.log(`  Type:     ${fileExists ? 'native .prs' : 'not found in cache'}`);
      } else {
        console.log(`  File:     (not cached — run: prs pull)`);
        console.log(`  Type:     unknown`);
      }

      ConsoleOutput.newline();
    } else {
      // Local file resolution
      const resolvedPath = importPath.endsWith('.prs') ? importPath : `${importPath}.prs`;
      const exists = existsSync(resolvedPath);

      ConsoleOutput.newline();
      console.log(`  Import:   ${importPath}`);
      console.log(`  Type:     local file`);
      console.log(`  Path:     ${resolvedPath}`);
      console.log(`  Exists:   ${exists ? 'yes' : 'no'}`);
      ConsoleOutput.newline();
    }
  } catch (error) {
    ConsoleOutput.error(
      `Resolution failed: ${error instanceof Error ? error.message : String(error)}`
    );
    process.exitCode = 1;
  }
}
