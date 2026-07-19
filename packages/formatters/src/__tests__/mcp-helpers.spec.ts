import { describe, it, expect } from 'vitest';
import type { Program, Value } from '@promptscript/core';
import {
  extractMcpServers,
  serializeMcpServersToJson,
  serializeMcpServersToJsonString,
  serializeMcpServersToToml,
  serializeMcpServerNamesToYaml,
  serializeMcpServersToYamlInline,
  getMcpServerNames,
  findMcpServersBlock,
  generateMcpJsonFile,
  generateMcpTomlFile,
} from '../mcp-helpers.js';

const loc = { file: 'test.prs', line: 1, column: 0, offset: 0 };

function makeMcpBlock(servers: Record<string, Record<string, Value>>): Program {
  return {
    type: 'Program',
    blocks: [
      {
        type: 'Block',
        name: 'mcpServers',
        content: {
          type: 'ObjectContent',
          properties: servers,
          loc,
        },
        loc,
      },
    ],
    uses: [],
    extends: [],
    loc,
  };
}

describe('mcp-helpers', () => {
  describe('findMcpServersBlock', () => {
    it('should find mcpServers block', () => {
      const ast = makeMcpBlock({});
      expect(findMcpServersBlock(ast)).toBeDefined();
    });

    it('should return undefined when no mcpServers block', () => {
      const ast: Program = {
        type: 'Program',
        blocks: [],
        uses: [],
        extends: [],
        loc,
      };
      expect(findMcpServersBlock(ast)).toBeUndefined();
    });
  });

  describe('extractMcpServers', () => {
    it('should extract stdio server', () => {
      const block = makeMcpBlock({
        fs: {
          transport: 'stdio',
          command: ['node', 'fs.mjs'],
          env: { ROOT: '/data' },
        },
      });
      const servers = extractMcpServers(findMcpServersBlock(block)!);
      expect(servers).toHaveLength(1);
      expect(servers[0]!.name).toBe('fs');
      expect(servers[0]!.transport).toBe('stdio');
      expect(servers[0]!.command).toEqual(['node', 'fs.mjs']);
      expect(servers[0]!.env).toEqual({ ROOT: '/data' });
    });

    it('should extract http server', () => {
      const block = makeMcpBlock({
        api: {
          transport: 'http',
          url: 'https://api.example.com/mcp',
          headers: { Authorization: 'Bearer token' },
        },
      });
      const servers = extractMcpServers(findMcpServersBlock(block)!);
      expect(servers[0]!.transport).toBe('http');
      expect(servers[0]!.url).toBe('https://api.example.com/mcp');
      expect(servers[0]!.headers).toEqual({ Authorization: 'Bearer token' });
    });

    it('should infer stdio from command array', () => {
      const block = makeMcpBlock({
        tool: { command: ['npx', 'tool.mjs'] },
      });
      const servers = extractMcpServers(findMcpServersBlock(block)!);
      expect(servers[0]!.transport).toBe('stdio');
    });

    it('should infer http from url', () => {
      const block = makeMcpBlock({
        remote: { url: 'https://example.com/mcp' },
      });
      const servers = extractMcpServers(findMcpServersBlock(block)!);
      expect(servers[0]!.transport).toBe('http');
    });

    it('should skip entries without transport info', () => {
      const block = makeMcpBlock({
        bad: { description: 'no transport' } as Record<string, Value>,
      });
      const servers = extractMcpServers(findMcpServersBlock(block)!);
      expect(servers).toHaveLength(0);
    });

    it('should extract disabled, enabledTools, disabledTools, timeoutMs', () => {
      const block = makeMcpBlock({
        configured: {
          transport: 'stdio',
          command: ['run'],
          disabled: true,
          enabledTools: ['tool1'],
          disabledTools: ['tool2'],
          timeoutMs: 5000,
        },
      });
      const servers = extractMcpServers(findMcpServersBlock(block)!);
      expect(servers[0]!.disabled).toBe(true);
      expect(servers[0]!.enabledTools).toEqual(['tool1']);
      expect(servers[0]!.disabledTools).toEqual(['tool2']);
      expect(servers[0]!.timeoutMs).toBe(5000);
    });

    it('should return empty for non-ObjectContent', () => {
      const block: Program = {
        type: 'Program',
        blocks: [
          {
            type: 'Block',
            name: 'mcpServers',
            content: { type: 'TextContent', value: 'text', loc },
            loc,
          },
        ],
        uses: [],
        extends: [],
        loc,
      };
      expect(extractMcpServers(findMcpServersBlock(block)!)).toHaveLength(0);
    });
  });

  describe('serializeMcpServersToJson', () => {
    it('should serialize stdio server with command array', () => {
      const servers = extractMcpServers(
        findMcpServersBlock(makeMcpBlock({ fs: { command: ['node', 'fs.mjs'] } }))!
      );
      const json = serializeMcpServersToJson(servers);
      expect(json['fs']).toBeDefined();
      expect(json['fs']!['type']).toBe('stdio');
    });

    it('should use command+args when useArgs is true', () => {
      const servers = extractMcpServers(
        findMcpServersBlock(
          makeMcpBlock({ fs: { command: ['node', 'fs.mjs', '--port', '3000'] } })
        )!
      );
      const json = serializeMcpServersToJson(servers, { useArgs: true });
      expect(json['fs']!['command']).toBe('node');
      expect(json['fs']!['args']).toEqual(['fs.mjs', '--port', '3000']);
    });

    it('should use custom urlKey', () => {
      const servers = extractMcpServers(
        findMcpServersBlock(makeMcpBlock({ api: { url: 'https://example.com' } }))!
      );
      const json = serializeMcpServersToJson(servers, { urlKey: 'serverUrl' });
      expect(json['api']!['serverUrl']).toBe('https://example.com');
    });

    it('should omit type field when includeType is false', () => {
      const servers = extractMcpServers(
        findMcpServersBlock(makeMcpBlock({ fs: { command: ['run'] } }))!
      );
      const json = serializeMcpServersToJson(servers, { includeType: false });
      expect(json['fs']!['type']).toBeUndefined();
    });
  });

  describe('serializeMcpServersToJsonString', () => {
    it('should produce valid JSON with mcpServers wrapper', () => {
      const servers = extractMcpServers(
        findMcpServersBlock(makeMcpBlock({ fs: { command: ['run'] } }))!
      );
      const str = serializeMcpServersToJsonString(servers);
      const parsed = JSON.parse(str) as { mcpServers: Record<string, unknown> };
      expect(parsed.mcpServers).toBeDefined();
      expect(parsed.mcpServers['fs']).toBeDefined();
    });
  });

  describe('serializeMcpServersToToml', () => {
    it('should produce TOML with mcp_servers tables', () => {
      const servers = extractMcpServers(
        findMcpServersBlock(makeMcpBlock({ fs: { command: ['node', 'fs.mjs'] } }))!
      );
      const toml = serializeMcpServersToToml(servers);
      expect(toml).toContain('[mcp_servers.fs]');
      expect(toml).toContain('command = ["node", "fs.mjs"]');
    });

    it('should serialize http server with url, env, and headers', () => {
      const servers = extractMcpServers(
        findMcpServersBlock(
          makeMcpBlock({
            api: {
              url: 'https://example.com',
              env: { REGION: 'us-east-1' },
              headers: { Authorization: 'Bearer "token"' },
            },
          })
        )!
      );
      const toml = serializeMcpServersToToml(servers);
      expect(toml).toContain('[mcp_servers.api]');
      expect(toml).toContain('url = "https://example.com"');
      expect(toml).toContain('[mcp_servers.api.env]');
      expect(toml).toContain('REGION = "us-east-1"');
      expect(toml).toContain('[mcp_servers.api.headers]');
      expect(toml).toContain('Authorization = "Bearer \\"token\\""');
    });

    it('should wrap TOML content with the requested path and table prefix', () => {
      const servers = extractMcpServers(
        findMcpServersBlock(makeMcpBlock({ fs: { command: ['node', 'fs.mjs'] } }))!
      );
      const output = generateMcpTomlFile(servers, '.config/mcp.toml', {
        tablePrefix: 'servers',
      });

      expect(output.path).toBe('.config/mcp.toml');
      expect(output.content).toContain('[servers.fs]');
    });
  });

  describe('serializeMcpServerNamesToYaml', () => {
    it('should produce YAML array of names', () => {
      const servers = extractMcpServers(
        findMcpServersBlock(
          makeMcpBlock({
            fs: { command: ['run'] },
            api: { url: 'https://example.com' },
          })
        )!
      );
      const yaml = serializeMcpServerNamesToYaml(servers);
      expect(yaml).toBe('["fs", "api"]');
    });

    it('should return empty array for no servers', () => {
      expect(serializeMcpServerNamesToYaml([])).toBe('[]');
    });
  });

  describe('serializeMcpServersToYamlInline', () => {
    it('should produce inline YAML for GitHub frontmatter', () => {
      const servers = extractMcpServers(
        findMcpServersBlock(
          makeMcpBlock({
            custom: { command: ['some-command', '--arg1'] },
            remote: {
              transport: 'http',
              url: 'https://example.com/mcp',
              env: { API_KEY: 'secret' },
            },
          })
        )!
      );
      const yaml = serializeMcpServersToYamlInline(servers);
      expect(yaml).toContain('custom:');
      expect(yaml).toContain('type: local');
      expect(yaml).toContain('command: some-command');
      expect(yaml).toContain('- --arg1');
      expect(yaml).toContain('remote:');
      expect(yaml).toContain('type: http');
      expect(yaml).toContain('url: "https://example.com/mcp"');
      expect(yaml).toContain('env:');
      expect(yaml).toContain('API_KEY: secret');
    });

    it('should quote unsafe YAML scalar values', () => {
      const servers = extractMcpServers(
        findMcpServersBlock(
          makeMcpBlock({
            custom: {
              command: ['node', 'script name.js', 'value: #unsafe\nnext'],
              env: { TOKEN: 'value: #unsafe' },
            },
          })
        )!
      );

      const yaml = serializeMcpServersToYamlInline(servers);

      expect(yaml).toContain('- "script name.js"');
      expect(yaml).toContain('- "value: #unsafe\\nnext"');
      expect(yaml).toContain('TOKEN: "value: #unsafe"');
    });
  });

  describe('generateMcpJsonFile', () => {
    it('should wrap JSON content with the requested path and wrapper key', () => {
      const servers = extractMcpServers(
        findMcpServersBlock(makeMcpBlock({ fs: { command: ['node', 'fs.mjs'] } }))!
      );
      const output = generateMcpJsonFile(servers, '.config/mcp.json', {
        wrapperKey: 'servers',
      });
      const parsed = JSON.parse(output.content) as {
        servers: Record<string, Record<string, unknown>>;
      };

      expect(output.path).toBe('.config/mcp.json');
      expect(parsed.servers['fs']!['command']).toEqual(['node', 'fs.mjs']);
    });
  });

  describe('getMcpServerNames', () => {
    it('should return array of names', () => {
      const servers = extractMcpServers(
        findMcpServersBlock(
          makeMcpBlock({
            fs: { command: ['run'] },
            api: { url: 'https://example.com' },
          })
        )!
      );
      expect(getMcpServerNames(servers)).toEqual(['fs', 'api']);
    });
  });
});
