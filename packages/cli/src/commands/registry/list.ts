import { ConsoleOutput } from '../../output/console.js';
import { loadUserConfig, SYSTEM_CONFIG_PATH } from '../../config/user-config.js';
import { findConfigFile, loadConfig } from '../../config/loader.js';
import type { RegistriesConfig } from '@promptscript/core';
import type { RegistryListOptions } from '../../types.js';

type AliasSource = 'system' | 'global' | 'project';

function aliasUrls(registries: RegistriesConfig | undefined): Record<string, string> {
  const urls: Record<string, string> = {};
  for (const [alias, entry] of Object.entries(registries ?? {})) {
    urls[alias] = typeof entry === 'string' ? entry : entry.url;
  }
  return urls;
}

/**
 * Show merged registry alias mappings from all config levels.
 * Project config overrides user (global) config, which overrides system config.
 */
export async function registryListCommand(options: RegistryListOptions = {}): Promise<void> {
  try {
    const source = options.source ?? 'all';
    const format = options.format ?? 'text';
    if (!['all', 'global', 'project'].includes(source)) {
      ConsoleOutput.error(`Invalid source: ${source}. Expected all, global, or project.`);
      process.exitCode = 1;
      return;
    }
    if (!['text', 'json'].includes(format)) {
      ConsoleOutput.error(`Invalid format: ${format}. Expected text or json.`);
      process.exitCode = 1;
      return;
    }

    const systemAliases = aliasUrls((await loadUserConfig(SYSTEM_CONFIG_PATH)).registries);
    const userAliases = aliasUrls((await loadUserConfig()).registries);

    // Collect project-level aliases
    let projectAliases: Record<string, string> = {};
    const configFile = findConfigFile();
    if (configFile) {
      try {
        projectAliases = aliasUrls((await loadConfig(configFile)).registries);
      } catch {
        // Ignore parse errors — project config is optional
      }
    }

    // Merge: project overrides user, user overrides system
    const levels: Array<[AliasSource, Record<string, string>]> = [
      ['system', systemAliases],
      ['global', userAliases],
      ['project', projectAliases],
    ];
    const winners = new Map<string, { alias: string; url: string; source: AliasSource }>();
    for (const [level, aliases] of levels) {
      for (const [alias, url] of Object.entries(aliases)) {
        winners.delete(alias);
        winners.set(alias, { alias, url, source: level });
      }
    }
    const merged = [...winners.values()];

    const filtered =
      source === 'global'
        ? Object.entries(userAliases).map(([alias, url]) => ({
            alias,
            url,
            source: 'global' as const,
          }))
        : source === 'project'
          ? Object.entries(projectAliases).map(([alias, url]) => ({
              alias,
              url,
              source: 'project' as const,
            }))
          : merged;

    if (format === 'json') {
      console.log(JSON.stringify(filtered, null, 2));
      return;
    }

    if (filtered.length === 0) {
      ConsoleOutput.muted('No registry aliases configured.');
      ConsoleOutput.muted('Add one with: prs registry add @name <url>');
      return;
    }

    ConsoleOutput.newline();

    // Align columns: find longest alias for padding
    const maxAlias = Math.max(...filtered.map((e) => e.alias.length));

    for (const { alias, url, source: entrySource } of filtered) {
      const paddedAlias = alias.padEnd(maxAlias);
      console.log(`  ${paddedAlias}  →  ${url}  (${entrySource})`);
    }

    ConsoleOutput.newline();
  } catch (error) {
    ConsoleOutput.error(
      `Failed to list registries: ${error instanceof Error ? error.message : String(error)}`
    );
    process.exitCode = 1;
  }
}
