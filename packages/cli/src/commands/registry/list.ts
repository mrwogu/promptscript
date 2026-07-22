import { ConsoleOutput } from '../../output/console.js';
import { loadUserConfig } from '../../config/user-config.js';
import { findConfigFile } from '../../config/loader.js';
import { readFile } from 'fs/promises';
import { parse as parseYaml } from 'yaml';
import type { PromptScriptConfig } from '@promptscript/core';
import type { RegistryListOptions } from '../../types.js';

/**
 * Show merged registry alias mappings from all config levels.
 * Project config overrides user (global) config — last write wins.
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

    const userConfig = await loadUserConfig();

    // Collect user-level aliases
    const userAliases: Record<string, string> = {};
    if (userConfig.registries) {
      for (const [alias, entry] of Object.entries(userConfig.registries)) {
        userAliases[alias] = typeof entry === 'string' ? entry : entry.url;
      }
    }

    // Collect project-level aliases
    const projectAliases: Record<string, string> = {};
    const configFile = findConfigFile();
    if (configFile) {
      try {
        const content = await readFile(configFile, 'utf-8');
        const projectConfig = parseYaml(content) as PromptScriptConfig;
        if (projectConfig?.registries) {
          for (const [alias, entry] of Object.entries(projectConfig.registries)) {
            projectAliases[alias] = typeof entry === 'string' ? entry : entry.url;
          }
        }
      } catch {
        // Ignore parse errors — project config is optional
      }
    }

    // Merge: project overrides user
    const merged: Array<{ alias: string; url: string; source: 'global' | 'project' }> = [];

    for (const [alias, url] of Object.entries(userAliases)) {
      if (!(alias in projectAliases)) {
        merged.push({ alias, url, source: 'global' });
      }
    }

    for (const [alias, url] of Object.entries(projectAliases)) {
      merged.push({ alias, url, source: 'project' });
    }

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
