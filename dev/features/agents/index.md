# Agents

The `@agents` block defines specialized AI workers as a core part of project configuration. Each agent can own a role, prompt, model, tool policy, skill set, and MCP access.

```
@meta {
  id: "agent-team"
  syntax: "1.4.0"
}

@agents {
  code-reviewer: {
    description: "Review changed code before merge"
    tools: ["Read", "Grep", "Glob", "Bash"]
    model: "sonnet"
    skills: ["security-review"]
    mcpServers: ["issue-tracker"]
    content: """
      Review the current diff.
      Report correctness, security, and contract issues with file references.
    """
  }

  debugger: {
    description: "Investigate failing tests and runtime errors"
    tools: ["Read", "Edit", "Bash", "Grep"]
    permissionMode: "acceptEdits"
    content: "Find root cause, implement the smallest fix, and run focused validation."
  }
}
```

## Agent Properties

| Property              | Required | Purpose                                               |
| --------------------- | -------- | ----------------------------------------------------- |
| `description`         | Yes      | Explains when the platform should invoke the agent    |
| `content`             | No       | Defines additional agent instructions                 |
| `tools`               | No       | Allows platform tools or tool categories              |
| `disallowedTools`     | No       | Denies tools on platforms that support deny lists     |
| `model`               | No       | Selects a platform model or inherits the parent model |
| `reasoningEffort`     | No       | Selects supported reasoning level                     |
| `specModel`           | No       | Selects a separate model for specification work       |
| `specReasoningEffort` | No       | Selects reasoning level for specification work        |
| `permissionMode`      | No       | Selects target-native permission behavior             |
| `skills`              | No       | Preloads or references named `@skills`                |
| `mcpServers`          | No       | Grants access to named top-level `@mcpServers`        |
| `sandboxMode`         | No       | Selects target-native sandbox policy                  |
| `nicknameCandidates`  | No       | Provides target-native display names                  |

Validators check supported enum values and forbidden fields before formatters generate output. Target-specific fields are emitted only where the native agent format supports them.

## Native Output

Targets with native agent systems receive dedicated files. Common examples:

| Target         | Native output                |
| -------------- | ---------------------------- |
| Claude Code    | `.claude/agents/<name>.md`   |
| GitHub Copilot | `.github/agents/<name>.md`   |
| Cursor         | `.cursor/agents/<name>.md`   |
| Factory AI     | `.factory/droids/<name>.md`  |
| Codex          | `.codex/agents/<name>.toml`  |
| OpenCode       | `.opencode/agents/<name>.md` |

Targets without a native agent contract still receive project instructions through their primary output. Check [Target Platforms](https://getpromptscript.dev/dev/features/target-platforms/index.md) before depending on target-specific fields.

## Agents and Skills

Agents reference reusable skills by name:

```
@skills {
  database-safety: {
    description: "Database change safety checks"
    content: "Review migrations, rollback behavior, locking, and data preservation."
  }
}

@agents {
  migration-reviewer: {
    description: "Review database migrations"
    skills: ["database-safety"]
    content: "Review proposed migrations before deployment."
  }
}
```

This separates reusable knowledge from agent orchestration. Multiple agents can use the same skill, and formatters choose the target-native representation.

## Agents and MCP Servers

Define project MCP servers once, then reference them from agents:

```
@mcpServers {
  issue-tracker: {
    transport: "stdio"
    command: ["node", "./tools/issues.mjs"]
  }
}

@agents {
  product-owner: {
    description: "Validate work against product requirements"
    mcpServers: ["issue-tracker"]
    content: "Read active requirements and verify acceptance criteria."
  }
}
```

Agent-level MCP references only apply to targets whose native agent format supports them. Other targets continue using project-level MCP configuration.

## Target Versions

Native agent files normally require a target's richest output mode:

```yaml
id: native-agents-project
syntax: '1.4.0'

targets:
  - github:
      version: full
  - claude:
      version: full
  - cursor:
      version: full
  - factory:
      version: full
  - codex:
      version: full
```

## Design Guidelines

- Give every agent one clear responsibility.
- Keep reusable domain instructions in `@skills`.
- Grant only required tools and MCP servers.
- Use `disallowedTools`, sandbox options, and permission modes where supported.
- Keep agent content platform-neutral unless the role is intentionally target-specific.
- Validate compiled output for every target used in CI.

## Related Documentation

- [Language Reference: `@agents`](https://getpromptscript.dev/dev/reference/language/#agents)
- [Agents Example](https://getpromptscript.dev/dev/examples/agents/index.md)
- [Skills and Resources](https://getpromptscript.dev/dev/features/skills/index.md)
- [MCP and Plugins](https://getpromptscript.dev/dev/features/integrations/index.md)
- [Supported Formatters](https://getpromptscript.dev/dev/reference/formatters/index.md)
