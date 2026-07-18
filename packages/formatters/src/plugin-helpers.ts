import type { Program, Value, Block } from '@promptscript/core';

/**
 * A parsed plugin definition from the @plugins block.
 */
export interface PluginDefinition {
  /** Plugin name (key from @plugins block). */
  name: string;
  /** Plugin version (semver). */
  version?: string;
  /** Plugin source (npm, git, local, registry, etc.). */
  source?: string;
  /** Plugin URL (for git/http sources). */
  url?: string;
  /** Skills provided by this plugin. */
  skills?: string[];
  /** Hooks provided by this plugin. */
  hooks?: string[];
  /** MCP servers provided by this plugin. */
  mcpServers?: string[];
  /** References to other plugins (dependencies). */
  references?: string[];
  /** Plugin description. */
  description?: string;
}

/**
 * Find the @plugins block in an AST.
 */
export function findPluginsBlock(ast: Program): Block | undefined {
  return ast.blocks.find((b) => b.name === 'plugins');
}

/**
 * Extract plugin definitions from a parsed @plugins block.
 */
export function extractPlugins(pluginsBlock: {
  content: { type: string; properties?: Record<string, Value> };
}): PluginDefinition[] {
  if (pluginsBlock.content.type !== 'ObjectContent' || !pluginsBlock.content.properties) {
    return [];
  }

  const plugins: PluginDefinition[] = [];

  for (const [name, value] of Object.entries(pluginsBlock.content.properties)) {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) continue;
    const obj = value as Record<string, Value>;

    const plugin: PluginDefinition = { name };

    const version = obj['version'];
    if (typeof version === 'string') plugin.version = version;

    const source = obj['source'];
    if (typeof source === 'string') plugin.source = source;

    const url = obj['url'];
    if (typeof url === 'string') plugin.url = url;

    const description = obj['description'];
    if (typeof description === 'string') plugin.description = description;

    const skills = obj['skills'];
    if (Array.isArray(skills)) {
      plugin.skills = skills.filter((s): s is string => typeof s === 'string');
    }

    const hooks = obj['hooks'];
    if (Array.isArray(hooks)) {
      plugin.hooks = hooks.filter((h): h is string => typeof h === 'string');
    }

    const mcpServers = obj['mcpServers'];
    if (Array.isArray(mcpServers)) {
      plugin.mcpServers = mcpServers.filter((m): m is string => typeof m === 'string');
    }

    const references = obj['references'];
    if (Array.isArray(references)) {
      plugin.references = references.filter((r): r is string => typeof r === 'string');
    }

    plugins.push(plugin);
  }

  return plugins;
}

/**
 * Serialize plugins to a JSON config file format.
 * Used by Factory (.factory/plugins.json) and similar tools.
 */
export function serializePluginsToJson(plugins: PluginDefinition[]): string {
  const result: Record<string, Record<string, unknown>> = {};

  for (const plugin of plugins) {
    const entry: Record<string, unknown> = {};
    if (plugin.version) entry['version'] = plugin.version;
    if (plugin.source) entry['source'] = plugin.source;
    if (plugin.url) entry['url'] = plugin.url;
    if (plugin.description) entry['description'] = plugin.description;
    if (plugin.skills) entry['skills'] = plugin.skills;
    if (plugin.hooks) entry['hooks'] = plugin.hooks;
    if (plugin.mcpServers) entry['mcpServers'] = plugin.mcpServers;
    if (plugin.references) entry['references'] = plugin.references;
    result[plugin.name] = entry;
  }

  return JSON.stringify({ plugins: result }, null, 2) + '\n';
}

/**
 * Serialize plugin names to a YAML array string (for frontmatter).
 */
export function serializePluginNamesToYaml(plugins: PluginDefinition[]): string {
  const names = plugins.map((p) => p.name);
  if (names.length === 0) return '[]';
  return `[${names.map((n) => `"${n}"`).join(', ')}]`;
}

/**
 * Generate a FormatterOutput for a plugins config JSON file.
 */
export function generatePluginsJsonFile(
  plugins: PluginDefinition[],
  path: string
): { path: string; content: string } {
  return {
    path,
    content: serializePluginsToJson(plugins),
  };
}
