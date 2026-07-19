# MCP Servers and Plugins

PromptScript treats tool integrations as source-controlled agent platform configuration.

- `@mcpServers` defines project tool servers once.
- `@agents.mcpServers` grants named agents access to selected servers on supporting targets.
- `@plugins` groups skills, hooks, and MCP servers into reusable capability bundles.

Both blocks require PromptScript syntax `1.4.0`.

## MCP Servers

Define local stdio servers:

```
@mcpServers {
  repository-tools: {
    transport: "stdio"
    command: ["node", "./tools/repository-mcp.mjs"]
    timeoutMs: 30000
  }
}
```

Define remote HTTP or SSE servers:

```
@mcpServers {
  knowledge-base: {
    transport: "http"
    url: "https://mcp.example.com/api"
    headers: {
      X-Client: "promptscript"
    }
  }
}
```

### MCP Properties

| Property        | Purpose                                          |
| --------------- | ------------------------------------------------ |
| `transport`     | `stdio`, `http`, or `sse`                        |
| `command`       | Executable and argument array for stdio servers  |
| `url`           | Endpoint for HTTP and SSE servers                |
| `env`           | Environment variables or environment references  |
| `headers`       | HTTP request headers                             |
| `disabled`      | Disable a server without removing its definition |
| `enabledTools`  | Restrict enabled tools                           |
| `disabledTools` | Disable selected tools                           |
| `timeoutMs`     | Configure startup or request timeout             |

Target formatters translate these properties into native MCP configuration. File paths and supported fields vary by platform. See the [formatter capability matrix](https://getpromptscript.dev/dev/reference/formatters/#mcp-hooks-plugins-support).

## Credential Handling

Do not store tokens in `.prs` files or generated MCP configuration. Provide credentials through the target platform's runtime environment or native secret management. Generated MCP files are platform-specific, so review output for every enabled target before enabling a server in production.

## Agent-Level Access

Agents reference top-level servers by name:

```
@agents {
  incident-responder: {
    description: "Investigate incidents using observability data"
    mcpServers: ["observability", "issue-tracker"]
    content: "Collect evidence, identify impact, and prepare remediation."
  }
}
```

Platforms without agent-level MCP fields continue using project-level server configuration.

## Plugins

Plugins group related capabilities:

```
@plugins {
  security-suite: {
    description: "Security review capabilities"
    version: "1.0.0"
    skills: ["security-review", "threat-model"]
    hooks: ["validate-generated-files"]
    mcpServers: ["vulnerability-database"]
  }
}
```

| Property      | Purpose                       |
| ------------- | ----------------------------- |
| `description` | Human-readable bundle purpose |
| `version`     | Semantic bundle version       |
| `skills`      | Referenced skill names        |
| `hooks`       | Referenced lifecycle hook IDs |
| `mcpServers`  | Referenced MCP server names   |

Current plugin output exists for Factory, Cursor, Codex, and Grok target families. Plugin contracts are platform-specific, so target support must be checked before using a generated manifest. Marketplace discovery, installation, and publishing remain outside compiler scope.

## Enterprise Policy

Recommended controls:

1. Keep MCP and plugin definitions in reviewed source.
1. Provide credentials through the target runtime rather than source files.
1. Restrict MCP domains and executable paths in organization policy.
1. Pin imported capability bundles through `promptscript.lock`.
1. Review generated configuration changes in pull requests.
1. Run strict validation and security scanning in CI.

## Related Documentation

- [Agents](https://getpromptscript.dev/dev/features/agents/index.md)
- [Hooks and Workflows](https://getpromptscript.dev/dev/features/automation/index.md)
- [Language Reference: `@mcpServers`](https://getpromptscript.dev/dev/reference/language/#mcpservers)
- [Language Reference: `@plugins`](https://getpromptscript.dev/dev/reference/language/#plugins)
- [Configuration Reference](https://getpromptscript.dev/dev/reference/config/#mcp-hooks-plugins-support)
