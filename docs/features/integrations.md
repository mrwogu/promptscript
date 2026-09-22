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
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gMQAEAAiRhYMvDABNxMcbzjNeuCHF5hqGAOZD2vFmWjxebXhCzLmAd1bGruGL3IYAnuurMArq3EAdVoOGjgH15jcUReLwJiMlgIoNlHdgxCMIiARgoAVgoABljWAF8fH0FGNABlGGoAN0rlQKteahg0ZjgTZmpHAFosZmYoODD64OCsNVY4FuosFJA4LHEIZjyRnWYSEgxPMOQI1mYpCLpwkAoAel7+uDOmlrbezq6SUooSACs4CIBdONGIIXcWAAsoNeABmbKQ3INQoFED5L4MThjRz4IikcgwKi0EAMGq0JasfCpeFAA" target="_blank" rel="noopener noreferrer">
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
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gMQAEAAiRhYMvDABNxMcbzjNeuCHF5hqGAOZD2vFmWjxebXhCzLmAd1bGruGL3IYAnuurMArq3EAdVoOGjgH15jcUReLwJiMlgIoNlHdgxCMIiARgoAVgoABljWAF8fH0FGNABlGGoAN0rlQKteAGtWC1hxdRgAWgAjDDgYMPrg4Kw1Vjg0ZmosFJAcLCw0POHeN2ooWfnFuEQAel2SUooiUnIYCl1djDQIZeGcGAlawbiVgA1OgGEoCE4Z8JANGYZFMjGoEDQWDuwUKDVh+RA+QAugw-tRHPgTtFzjR6CAarQIGx8KlEUA" target="_blank" rel="noopener noreferrer">
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
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gMQAEAAiRhYMvDABNxMcbzjNeuCHF5hqGAOZD2vFmWjxebXhCzLmAd1bGruGL3IYAnuurMArq3EAdVoOGjgH15jcUReLwJiMlgIoNlHdgxCMIiARgoAVgoABljWAF8fH34NTlNeQKtrRggpdgBaang0NilqMMrg4Kk4RmoINCwINhSQAElWADd4IfVsOwhWGrrytzhF9UMAIzgYakmMLegTR15xbAw8rt4SRjQAZT3p2jDkCOYdp8PjrEcIunCICUcDcMHqWDUjAA1nsIgBdOLBFjsMqjADCzCgsEYWF4MEmtU4jBgAMJ7AgYFOEDIGBxAIwnnsTUwTV4TSE4gg2GGrAoV14hQKIHycIYZWojnwRFI5BgVFoIAYz3WbHwqWFQA" target="_blank" rel="noopener noreferrer">
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
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gMQAEAAiRhYMvDABNxMcbzjNeuCHF5hqGAOZD2vFmWjxebXhCzLmAd1bGruGL3IYAnuurMArq3EAdVoOGjgH15jcUReLwJiMlgIoNlHdgxCMIiARgoAVgoABljWAF8fH35yN3UIVmVAq1kYRjdqE0cAWjg3Exgw6uDgqThGRrQsCDYUkABlOoam3moYADcIGHMdDEwAI2gTJbg8nt55mFoR1jH07Jy9nrgAa2goODDkCLgpxqwWucXliLpwkFwc2wzRIzCkUAiAF04sEcMxmDdHrxniB5hgoBBxNgYM11JwjtjxM1ILBdiBoTVgiRGGhJtRDrQnhF5m4oKwCZsMR9mliROsMK8oXFCgUQPlIQxOFhqI58ERSOQYFRaCAGAy4Cd8KkxUA" target="_blank" rel="noopener noreferrer">
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
