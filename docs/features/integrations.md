---
title: MCP Servers and Plugins
description: Configure project MCP servers and bundle reusable agent capabilities with PromptScript plugins.
---

# MCP Servers and Plugins

PromptScript treats tool integrations as source-controlled agent platform configuration.

- `@mcpServers` defines project tool servers once.
- `@agents.mcpServers` grants named agents access to selected servers on supporting targets.
- `@plugins` groups skills, hooks, and MCP servers into reusable capability bundles.

Both blocks require PromptScript syntax `1.4.0`.

## MCP Servers

Define local stdio servers:

```promptscript
@mcpServers {
  repository-tools: {
    transport: "stdio"
    command: ["node", "./tools/repository-mcp.mjs"]
    timeoutMs: 30000
  }
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAImNoBlGNQBuwuAAJgAHVYSJ1GGmZwIWZtQCeAWnXMocRFNnz5WahlZxl1LEekg4WACYRmDk6ZYkSl50eQHVmZnGAc6CQcKAHo9A2jFZVV1LW0+NAoSACs4BwBdTzMIEhhmAFcsAFlDCQBmAAZG+s8AX1kWkBa8hk5zTXwiUnIYKloQBjFaN1Z8AEZOoA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

Define remote HTTP or SSE servers:

```promptscript
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

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAImNoBlGNQBuwuAAJgAHVYSJAa1bMA7rAAmAcxgBaAEYY4MRFNnz5WahlZw0zalhPSQOLFjTOz5gK7UoTlzc0OEQAelC+NAoiUnIYChYSUIw0CE85cxwYDHVxExkM8wkADR0AYSgITkcJZxpmMiw4RmoINCx0ooBfLx7WLpAugF0GauoAT3wYskoaehAxWgg2fABGQaA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

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

Target formatters translate these properties into native MCP configuration. File paths and supported
fields vary by platform. See the [formatter capability matrix](../reference/formatters/index.md#mcp-hooks-plugins-support).

## Credential Handling

Do not store tokens in `.prs` files or generated MCP configuration. Provide credentials through the
target platform's runtime environment or native secret management. Generated MCP files are
platform-specific, so review output for every enabled target before enabling a server in production.

## Agent-Level Access

Agents reference top-level servers by name:

```promptscript
@agents {
  incident-responder: {
    description: "Investigate incidents using observability data"
    mcpServers: ["observability", "issue-tracker"]
    content: "Collect evidence, identify impact, and prepare remediation."
  }
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAIYDmnLHAAEwADqthwiK0YQAJoIC01eGjaLqiURKlTFcRtQhosENtrEgAkqwBu8M32wxpshYJEBXODL7DmACM4GGo7DEDoCCwAT2F5bAwrXT0SRjQAZVCHWm1kKyCQsIio2Ks6YSsIODgvGCUsagxGAGtQqwBdFKkWdkFLEABhZihYRixhGDsPWRgKmbMwOIgyZqwKjFZ5YRoYTFVhVRIYeQhsc1YKZMlhAF8JW5BbjoZBahj8IlJyGCpaEAYOV8bHwAEYnkA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

Platforms without agent-level MCP fields continue using project-level server configuration.

## Plugins

Plugins group related capabilities:

```promptscript
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

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gALkCuAcwis4AAmAAdVqNFwYjPtQhYAngFo4fZTETipMmQBN4jJWiwQ2uiSADK8xcpWjqMAG4QYAd1GMMmACNoZU84G30DNxhaS1ZrEABGCgAGFPDpAzgAa2goOF1kGzkFJVU1Vw9vGzpRG1xXbDUSZmMoGwBdCJkcZmYs-NFCkDcMKAhDbBg1AU5oycM1SFgwkE6MmRJGNHtqKNoCmzc+KFY5oLGyiawMAIw5DoiAXylHkEf2hk4sahV8IlJyDAqLQQAw9nBYvgEm8gA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

| Property      | Purpose                       |
| ------------- | ----------------------------- |
| `description` | Human-readable bundle purpose |
| `version`     | Semantic bundle version       |
| `skills`      | Referenced skill names        |
| `hooks`       | Referenced lifecycle hook IDs |
| `mcpServers`  | Referenced MCP server names   |

Current plugin output exists for Factory, Cursor, Codex, and Grok target families. Plugin contracts
are platform-specific, so target support must be checked before using a generated manifest.
Marketplace discovery, installation, and publishing remain outside compiler scope.

## Enterprise Policy

Recommended controls:

1. Keep MCP and plugin definitions in reviewed source.
2. Provide credentials through the target runtime rather than source files.
3. Restrict MCP domains and executable paths in organization policy.
4. Pin imported capability bundles through `promptscript.lock`.
5. Review generated configuration changes in pull requests.
6. Run strict validation and security scanning in CI.

## Related Documentation

- [Agents](agents.md)
- [Hooks and Workflows](automation.md)
- [Language Reference: `@mcpServers`](../reference/language.md#mcpservers)
- [Language Reference: `@plugins`](../reference/language.md#plugins)
- [Configuration Reference](../reference/config.md#mcp-hooks-plugins-support)
