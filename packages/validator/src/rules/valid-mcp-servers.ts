import type { ValidationRule } from '../types.js';
import type { Value } from '@promptscript/core';

/** Valid transport types. */
const VALID_TRANSPORTS = new Set(['stdio', 'http', 'sse']);

/** Secret-bearing field names that must use env references, not plaintext. */
const SECRET_FIELD_PATTERNS = [
  /token/i,
  /secret/i,
  /password/i,
  /api[_-]?key/i,
  /credential/i,
  /private[_-]?key/i,
];

/**
 * PS035: Valid MCP server definitions.
 *
 * Validates the @mcpServers block:
 * - Server names must be stable (non-empty, alphanumeric+hyphen)
 * - `transport` must be stdio, http, or sse
 * - stdio: `command` must be a non-empty string array (no shell strings)
 * - http/sse: `url` must be a valid http(s) URL
 * - `env` values must use `fromEnv` references, not plaintext secrets
 * - Rejects plaintext values in secret-bearing fields
 */
export const validMcpServers: ValidationRule = {
  id: 'PS035',
  name: 'valid-mcp-servers',
  description: 'MCP server definitions must match the portable schema',
  defaultSeverity: 'warning',
  validate: (ctx) => {
    const mcpBlock = ctx.ast.blocks.find((b) => b.name === 'mcpServers');
    if (!mcpBlock || mcpBlock.content.type !== 'ObjectContent') return;

    for (const [serverName, serverValue] of Object.entries(mcpBlock.content.properties)) {
      if (!serverName || !/^[a-zA-Z0-9._-]+$/.test(serverName)) {
        ctx.report({
          message: `MCP server name "${serverName}" must be alphanumeric with hyphens/dots only`,
          location: mcpBlock.loc,
          severity: 'error',
        });
        continue;
      }

      if (typeof serverValue !== 'object' || serverValue === null || Array.isArray(serverValue)) {
        ctx.report({
          message: `MCP server "${serverName}" must be an object`,
          location: mcpBlock.loc,
          severity: 'error',
        });
        continue;
      }

      const server = serverValue as Record<string, Value>;

      // Validate transport (required)
      const transport = server['transport'];
      if (transport === undefined) {
        ctx.report({
          message: `MCP server "${serverName}": missing required field "transport"`,
          location: mcpBlock.loc,
          severity: 'error',
        });
      } else if (typeof transport !== 'string') {
        ctx.report({
          message: `MCP server "${serverName}": transport must be a string`,
          location: mcpBlock.loc,
          severity: 'error',
        });
      } else if (!VALID_TRANSPORTS.has(transport)) {
        ctx.report({
          message: `MCP server "${serverName}": invalid transport "${transport}"`,
          location: mcpBlock.loc,
          suggestion: `Valid transports: ${[...VALID_TRANSPORTS].join(', ')}`,
          severity: 'error',
        });
      }

      // Validate command for stdio transport
      if (transport === 'stdio') {
        const command = server['command'];
        if (command === undefined) {
          ctx.report({
            message: `MCP server "${serverName}": stdio transport requires "command" array`,
            location: mcpBlock.loc,
            severity: 'error',
          });
        } else if (typeof command === 'string') {
          ctx.report({
            message: `MCP server "${serverName}": command must be an array, not a shell string`,
            location: mcpBlock.loc,
            severity: 'error',
          });
        } else if (!Array.isArray(command) || command.length === 0) {
          ctx.report({
            message: `MCP server "${serverName}": command must be a non-empty array`,
            location: mcpBlock.loc,
            severity: 'error',
          });
        } else {
          for (const arg of command) {
            if (typeof arg !== 'string') {
              ctx.report({
                message: `MCP server "${serverName}": command arguments must be strings`,
                location: mcpBlock.loc,
                severity: 'error',
              });
              break;
            }
          }
        }
      }

      // Validate URL for http/sse transport
      if (transport === 'http' || transport === 'sse') {
        const url = server['url'];
        if (url === undefined) {
          ctx.report({
            message: `MCP server "${serverName}": ${transport} transport requires "url"`,
            location: mcpBlock.loc,
            severity: 'error',
          });
        } else if (typeof url !== 'string') {
          ctx.report({
            message: `MCP server "${serverName}": url must be a string`,
            location: mcpBlock.loc,
            severity: 'error',
          });
        } else if (!/^https?:\/\//.test(url)) {
          ctx.report({
            message: `MCP server "${serverName}": url must be http(s) scheme`,
            location: mcpBlock.loc,
            severity: 'error',
          });
        }
      }

      // Validate env values - reject plaintext secrets
      const env = server['env'];
      if (env !== null && typeof env === 'object' && !Array.isArray(env)) {
        const envObj = env as Record<string, Value>;
        for (const [envKey, envValue] of Object.entries(envObj)) {
          // Check if the key name looks like a secret
          const isSecretField = SECRET_FIELD_PATTERNS.some((p) => p.test(envKey));

          if (envValue !== null && typeof envValue === 'object' && !Array.isArray(envValue)) {
            // Object form - should have fromEnv
            const envRef = envValue as Record<string, Value>;
            if (envRef['fromEnv'] === undefined) {
              ctx.report({
                message: `MCP server "${serverName}": env "${envKey}" object must have "fromEnv" reference`,
                location: mcpBlock.loc,
                severity: 'error',
              });
            }
          } else if (typeof envValue === 'string' && isSecretField) {
            // Plaintext in a secret-bearing field
            ctx.report({
              message: `MCP server "${serverName}": env "${envKey}" appears to be a secret - use { fromEnv: "VAR_NAME" } instead`,
              location: mcpBlock.loc,
              severity: 'error',
            });
          }
        }
      }
    }
  },
};
