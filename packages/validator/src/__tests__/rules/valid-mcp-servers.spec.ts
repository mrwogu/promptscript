import { describe, it, expect } from 'vitest';
import { validMcpServers } from '../../rules/valid-mcp-servers.js';
import type { RuleContext, ValidationMessage } from '../../types.js';
import type { Program, SourceLocation, Block, ObjectContent, Value } from '@promptscript/core';

const loc: SourceLocation = { file: 'test.prs', line: 1, column: 1, offset: 0 };

function makeMcpBlock(servers: Record<string, Record<string, Value>>): Block {
  return {
    type: 'Block',
    name: 'mcpServers',
    content: {
      type: 'ObjectContent',
      properties: servers,
      loc,
    } as ObjectContent,
    loc,
  };
}

function makeAst(servers: Record<string, Record<string, Value>>): Program {
  return {
    type: 'Program',
    blocks: [makeMcpBlock(servers)],
    uses: [],
    extends: [],
    loc,
  };
}

function validate(servers: Record<string, Record<string, Value>>): ValidationMessage[] {
  const ast = makeAst(servers);
  const messages: ValidationMessage[] = [];
  const ctx: RuleContext = {
    ast,
    config: { strict: false } as unknown as RuleContext['config'],
    report: (msg) => {
      messages.push({
        ...msg,
        ruleId: 'PS035',
        ruleName: 'valid-mcp-servers',
        severity: msg.severity ?? 'warning',
        location: msg.location ?? loc,
      } as ValidationMessage);
    },
  };
  validMcpServers.validate(ctx);
  return messages;
}

describe('PS035: valid-mcp-servers', () => {
  it('should accept a valid stdio server', () => {
    const messages = validate({
      'security-scanner': {
        transport: 'stdio',
        command: ['node', './tools/scanner.mjs'],
        env: {
          API_TOKEN: { fromEnv: 'SCANNER_TOKEN' },
        },
      },
    });
    expect(messages).toHaveLength(0);
  });

  it('should accept a valid http server', () => {
    const messages = validate({
      'remote-api': {
        transport: 'http',
        url: 'https://api.example.com/mcp',
      },
    });
    expect(messages).toHaveLength(0);
  });

  it('should accept a valid sse server', () => {
    const messages = validate({
      events: {
        transport: 'sse',
        url: 'https://events.example.com/sse',
      },
    });
    expect(messages).toHaveLength(0);
  });

  it('should reject invalid server name', () => {
    const messages = validate({
      'bad name!': { transport: 'stdio', command: ['node'] },
    });
    expect(messages.length).toBeGreaterThan(0);
    expect(messages[0]!.message).toContain('must be alphanumeric');
  });

  it('should reject non-object server value', () => {
    const messages = validate({
      bad: 'not-object' as unknown as Record<string, Value>,
    });
    expect(messages.length).toBeGreaterThan(0);
    expect(messages[0]!.message).toContain('must be an object');
  });

  it('should reject missing transport', () => {
    const messages = validate({
      bad: { command: ['node'] },
    });
    expect(messages.length).toBeGreaterThan(0);
    expect(messages[0]!.message).toContain('missing required field "transport"');
  });

  it('should reject invalid transport', () => {
    const messages = validate({
      bad: { transport: 'websocket', command: ['node'] },
    });
    expect(messages.length).toBeGreaterThan(0);
    expect(messages[0]!.message).toContain('invalid transport');
  });

  it('should reject stdio without command', () => {
    const messages = validate({
      bad: { transport: 'stdio' },
    });
    expect(messages.length).toBeGreaterThan(0);
    expect(messages[0]!.message).toContain('requires "command"');
  });

  it('should reject stdio with string command (shell string)', () => {
    const messages = validate({
      bad: { transport: 'stdio', command: 'node scanner.mjs' },
    });
    expect(messages.length).toBeGreaterThan(0);
    expect(messages[0]!.message).toContain('command must be an array');
  });

  it('should reject stdio with empty command array', () => {
    const messages = validate({
      bad: { transport: 'stdio', command: [] },
    });
    expect(messages.length).toBeGreaterThan(0);
    expect(messages[0]!.message).toContain('non-empty array');
  });

  it('should reject stdio with non-string command args', () => {
    const messages = validate({
      bad: { transport: 'stdio', command: ['node', 123] },
    });
    expect(messages.length).toBeGreaterThan(0);
    expect(messages[0]!.message).toContain('must be strings');
  });

  it('should reject http without url', () => {
    const messages = validate({
      bad: { transport: 'http' },
    });
    expect(messages.length).toBeGreaterThan(0);
    expect(messages[0]!.message).toContain('requires "url"');
  });

  it('should reject http with non-http url', () => {
    const messages = validate({
      bad: { transport: 'http', url: 'ftp://example.com' },
    });
    expect(messages.length).toBeGreaterThan(0);
    expect(messages[0]!.message).toContain('http(s) scheme');
  });

  it('should reject plaintext secret in env', () => {
    const messages = validate({
      bad: {
        transport: 'stdio',
        command: ['node'],
        env: {
          API_KEY: 'super-secret-value',
        },
      },
    });
    expect(messages.length).toBeGreaterThan(0);
    expect(messages[0]!.message).toContain('appears to be a secret');
  });

  it('should reject plaintext token in env', () => {
    const messages = validate({
      bad: {
        transport: 'stdio',
        command: ['node'],
        env: {
          authToken: 'abc123',
        },
      },
    });
    expect(messages.length).toBeGreaterThan(0);
    expect(messages[0]!.message).toContain('appears to be a secret');
  });

  it('should accept non-secret env as plaintext', () => {
    const messages = validate({
      good: {
        transport: 'stdio',
        command: ['node'],
        env: {
          NODE_ENV: 'production',
        },
      },
    });
    expect(messages).toHaveLength(0);
  });

  it('should reject env object without fromEnv', () => {
    const messages = validate({
      bad: {
        transport: 'stdio',
        command: ['node'],
        env: {
          TOKEN: { notFromEnv: 'value' },
        },
      },
    });
    expect(messages.length).toBeGreaterThan(0);
    expect(messages[0]!.message).toContain('must have "fromEnv"');
  });

  it('should return empty for non-ObjectContent block', () => {
    const ast: Program = {
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
    const messages: ValidationMessage[] = [];
    const ctx: RuleContext = {
      ast,
      config: { strict: false } as unknown as RuleContext['config'],
      report: (msg) =>
        messages.push({
          ...msg,
          ruleId: 'PS035',
          ruleName: 'valid-mcp-servers',
          severity: msg.severity ?? 'warning',
          location: msg.location ?? loc,
        } as ValidationMessage),
    };
    validMcpServers.validate(ctx);
    expect(messages).toHaveLength(0);
  });

  it('should return empty when no mcpServers block', () => {
    const ast: Program = {
      type: 'Program',
      blocks: [],
      uses: [],
      extends: [],
      loc,
    };
    const messages: ValidationMessage[] = [];
    const ctx: RuleContext = {
      ast,
      config: { strict: false } as unknown as RuleContext['config'],
      report: (msg) =>
        messages.push({
          ...msg,
          ruleId: 'PS035',
          ruleName: 'valid-mcp-servers',
          severity: msg.severity ?? 'warning',
          location: msg.location ?? loc,
        } as ValidationMessage),
    };
    validMcpServers.validate(ctx);
    expect(messages).toHaveLength(0);
  });

  it('should reject non-string transport', () => {
    const messages = validate({
      'bad-transport': {
        transport: 123 as unknown as string,
        command: ['node', 'server.mjs'],
      },
    });
    expect(messages.some((m) => m.message.includes('transport must be a string'))).toBe(true);
  });

  it('should reject non-string url', () => {
    const messages = validate({
      'bad-url': {
        transport: 'http',
        url: 456 as unknown as string,
      },
    });
    expect(messages.some((m) => m.message.includes('url must be a string'))).toBe(true);
  });
});
