import type { Program, Value, Block } from '@promptscript/core';

/**
 * MCP server transport type.
 */
export type McpTransport = 'stdio' | 'http' | 'sse';

/**
 * A parsed MCP server definition from the @mcpServers block.
 */
export interface McpServerDefinition {
  /** Server name (key from @mcpServers block). */
  name: string;
  /** Transport type. */
  transport: McpTransport;
  /** Command for stdio transport. */
  command?: string[];
  /** URL for http/sse transport. */
  url?: string;
  /** HTTP headers for http/sse transport. */
  headers?: Record<string, string>;
  /** Environment variables for stdio transport. */
  env?: Record<string, string>;
  /** Whether the server is disabled. */
  disabled?: boolean;
  /** Enabled tools allowlist. */
  enabledTools?: string[];
  /** Disabled tools blocklist. */
  disabledTools?: string[];
  /** Per-server timeout in milliseconds. */
  timeoutMs?: number;
}

/**
 * Find the @mcpServers block in an AST.
 */
export function findMcpServersBlock(ast: Program): Block | undefined {
  return ast.blocks.find((b) => b.name === 'mcpServers');
}

/**
 * Extract MCP server definitions from a parsed @mcpServers block.
 */
export function extractMcpServers(mcpServersBlock: {
  content: { type: string; properties?: Record<string, Value> };
}): McpServerDefinition[] {
  if (mcpServersBlock.content.type !== 'ObjectContent' || !mcpServersBlock.content.properties) {
    return [];
  }

  const servers: McpServerDefinition[] = [];

  for (const [name, value] of Object.entries(mcpServersBlock.content.properties)) {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) continue;
    const obj = value as Record<string, Value>;

    const transport = obj['transport'];
    const command = obj['command'];
    const url = obj['url'];

    // Determine transport: explicit, or infer from fields
    let inferredTransport: McpTransport;
    if (typeof transport === 'string') {
      inferredTransport = transport as McpTransport;
    } else if (Array.isArray(command)) {
      inferredTransport = 'stdio';
    } else if (typeof url === 'string') {
      inferredTransport = 'http';
    } else {
      continue; // Cannot determine transport
    }

    const server: McpServerDefinition = {
      name,
      transport: inferredTransport,
    };

    if (Array.isArray(command)) {
      server.command = command.filter((c): c is string => typeof c === 'string');
    }

    if (typeof url === 'string') {
      server.url = url;
    }

    const headers = obj['headers'];
    if (headers && typeof headers === 'object' && !Array.isArray(headers)) {
      server.headers = {};
      for (const [k, v] of Object.entries(headers as Record<string, Value>)) {
        if (typeof v === 'string') server.headers[k] = v;
      }
    }

    const env = obj['env'];
    if (env && typeof env === 'object' && !Array.isArray(env)) {
      server.env = {};
      for (const [k, v] of Object.entries(env as Record<string, Value>)) {
        if (typeof v === 'string') server.env[k] = v;
      }
    }

    const disabled = obj['disabled'];
    if (typeof disabled === 'boolean') server.disabled = disabled;

    const enabledTools = obj['enabledTools'];
    if (Array.isArray(enabledTools)) {
      server.enabledTools = enabledTools.filter((t): t is string => typeof t === 'string');
    }

    const disabledTools = obj['disabledTools'];
    if (Array.isArray(disabledTools)) {
      server.disabledTools = disabledTools.filter((t): t is string => typeof t === 'string');
    }

    const timeoutMs = obj['timeoutMs'];
    if (typeof timeoutMs === 'number') server.timeoutMs = timeoutMs;

    servers.push(server);
  }

  return servers;
}

/**
 * Get MCP server names as a string array (for agent-level mcpServers field).
 * Used by formatters that reference servers by name (e.g. Claude, Factory).
 */
export function getMcpServerNames(servers: McpServerDefinition[]): string[] {
  return servers.map((s) => s.name);
}

/**
 * Serialize MCP servers to standard JSON format (used by most tools).
 * Output: { "mcpServers": { "<name>": { ... } } }
 *
 * @param servers - MCP server definitions
 * @param options - Serialization options
 * @param options.omitDisabled - If true, skip disabled servers (default: false)
 * @param options.useArgs - If true, use "args" instead of "command" array for stdio (default: false, use command+args)
 * @param options.envKey - Key for environment variables ("env" default)
 * @param options.urlKey - Key for URL ("url" default, some tools use "serverUrl")
 * @param options.includeType - If true, include "type" field (default: true)
 */
export function serializeMcpServersToJson(
  servers: McpServerDefinition[],
  options?: {
    omitDisabled?: boolean;
    useArgs?: boolean;
    envKey?: string;
    urlKey?: string;
    headersKey?: string;
    includeType?: boolean;
  }
): Record<string, Record<string, unknown>> {
  const result: Record<string, Record<string, unknown>> = {};
  const includeType = options?.includeType ?? true;
  const envKey = options?.envKey ?? 'env';
  const urlKey = options?.urlKey ?? 'url';
  const headersKey = options?.headersKey ?? 'headers';

  for (const server of servers) {
    if (options?.omitDisabled && server.disabled) continue;

    const entry: Record<string, unknown> = {};

    if (includeType) {
      entry['type'] = server.transport;
    }

    if (server.transport === 'stdio') {
      if (server.command && server.command.length > 0) {
        if (options?.useArgs) {
          entry['command'] = server.command[0];
          entry['args'] = server.command.slice(1);
        } else {
          entry['command'] = server.command;
        }
      }
    } else {
      if (server.url) entry[urlKey] = server.url;
      if (server.headers) entry[headersKey] = server.headers;
    }

    if (server.env) entry[envKey] = server.env;
    if (server.disabled !== undefined) entry['disabled'] = server.disabled;
    if (server.enabledTools) entry['enabledTools'] = server.enabledTools;
    if (server.disabledTools) entry['disabledTools'] = server.disabledTools;
    if (server.timeoutMs) entry['timeoutMs'] = server.timeoutMs;

    result[server.name] = entry;
  }

  return result;
}

/**
 * Serialize MCP servers to JSON string (full config file format).
 * Output: '{"mcpServers": {...}}'
 */
export function serializeMcpServersToJsonString(
  servers: McpServerDefinition[],
  options?: {
    omitDisabled?: boolean;
    useArgs?: boolean;
    envKey?: string;
    urlKey?: string;
    headersKey?: string;
    includeType?: boolean;
    wrapperKey?: string;
  }
): string {
  const wrapperKey = options?.wrapperKey ?? 'mcpServers';
  const json = serializeMcpServersToJson(servers, options);
  return JSON.stringify({ [wrapperKey]: json }, null, 2) + '\n';
}

/**
 * Serialize MCP servers to TOML format (used by Codex, OpenHands, Crush).
 * Output: [mcp_servers.<name>] tables
 */
export function serializeMcpServersToToml(
  servers: McpServerDefinition[],
  options?: { omitDisabled?: boolean; tablePrefix?: string }
): string {
  const tablePrefix = options?.tablePrefix ?? 'mcp_servers';
  const lines: string[] = [];

  for (const server of servers) {
    if (options?.omitDisabled && server.disabled) continue;

    lines.push(`[${tablePrefix}.${server.name}]`);

    if (server.transport === 'stdio') {
      if (server.command && server.command.length > 0) {
        lines.push(
          `command = [${server.command.map((c) => `"${escapeTomlString(c)}"`).join(', ')}]`
        );
      }
    } else {
      if (server.url) lines.push(`url = "${escapeTomlString(server.url)}"`);
      if (server.transport) lines.push(`type = "${server.transport}"`);
    }

    if (server.env) {
      lines.push('[mcp_servers.' + server.name + '.env]');
      for (const [k, v] of Object.entries(server.env)) {
        lines.push(`${k} = "${escapeTomlString(v)}"`);
      }
    }

    if (server.headers) {
      lines.push('[mcp_servers.' + server.name + '.headers]');
      for (const [k, v] of Object.entries(server.headers)) {
        lines.push(`${k} = "${escapeTomlString(v)}"`);
      }
    }

    if (server.disabled !== undefined) lines.push(`disabled = ${server.disabled}`);
    if (server.timeoutMs) lines.push(`timeout_ms = ${server.timeoutMs}`);

    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Serialize MCP server names to a YAML array string (for frontmatter).
 * Output: ["server1", "server2"]
 */
export function serializeMcpServerNamesToYaml(servers: McpServerDefinition[]): string {
  const names = getMcpServerNames(servers);
  if (names.length === 0) return '[]';
  return `[${names.map((n) => `"${n}"`).join(', ')}]`;
}

function serializeYamlScalar(value: string): string {
  return /^[a-zA-Z0-9_./-]+$/.test(value) ? value : JSON.stringify(value);
}

/**
 * Serialize MCP servers inline for YAML frontmatter (used by GitHub Copilot).
 * Output: mcp-servers:\n  <name>:\n    type: ...\n    command: ...
 */
export function serializeMcpServersToYamlInline(
  servers: McpServerDefinition[],
  indent = '  '
): string {
  const lines: string[] = [];

  for (const server of servers) {
    lines.push(`${indent}${serializeYamlScalar(server.name)}:`);

    if (server.transport === 'stdio') {
      if (server.command && server.command.length > 0) {
        lines.push(`${indent}  type: local`);
        lines.push(`${indent}  command: ${serializeYamlScalar(server.command[0]!)}`);
        if (server.command.length > 1) {
          lines.push(`${indent}  args:`);
          for (const arg of server.command.slice(1)) {
            lines.push(`${indent}    - ${serializeYamlScalar(arg)}`);
          }
        }
      }
    } else {
      lines.push(`${indent}  type: ${server.transport}`);
      if (server.url) lines.push(`${indent}  url: ${serializeYamlScalar(server.url)}`);
    }

    if (server.env) {
      lines.push(`${indent}  env:`);
      for (const [k, v] of Object.entries(server.env)) {
        lines.push(`${indent}    ${serializeYamlScalar(k)}: ${serializeYamlScalar(v)}`);
      }
    }
  }

  return lines.join('\n');
}

/**
 * Escape a string for TOML double-quoted values.
 */
function escapeTomlString(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

/**
 * Generate a FormatterOutput for an MCP config JSON file.
 */
export function generateMcpJsonFile(
  servers: McpServerDefinition[],
  path: string,
  options?: {
    omitDisabled?: boolean;
    useArgs?: boolean;
    envKey?: string;
    urlKey?: string;
    headersKey?: string;
    includeType?: boolean;
    wrapperKey?: string;
  }
): { path: string; content: string } {
  return {
    path,
    content: serializeMcpServersToJsonString(servers, options),
  };
}

/**
 * Generate a FormatterOutput for an MCP config TOML file.
 */
export function generateMcpTomlFile(
  servers: McpServerDefinition[],
  path: string,
  options?: { omitDisabled?: boolean; tablePrefix?: string }
): { path: string; content: string } {
  return {
    path,
    content: serializeMcpServersToToml(servers, options),
  };
}
