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

## Imported Agents and Namespaces

An aliased `@use` qualifies every imported agent with the alias. This lets multiple fragments define the same local agent name without overwriting one another:

```
@use ./frontend-team as frontend
@use ./backend-team as backend
```

If both fragments define `reviewer`, the resolved names are `frontend.reviewer` and `backend.reviewer`. An unaliased import keeps its original name when that name is unique:

```
@use ./shared-reviewer
```

The resulting agent remains `reviewer`. If an unaliased import conflicts with a local or another imported definition, compilation stops with a diagnostic that lists every source, import path, namespace, and the recommended alias or rename action. Definitions are never silently overwritten.

Inheritance applies the same rule: a child cannot redefine a parent agent with different content. Identical definitions are allowed.

Qualified names are mapped consistently for native output. Dots become hyphens, so `frontend.reviewer` becomes `frontend-reviewer` in filenames and native identifiers. If two qualified names map to the same native name, a deterministic numeric suffix keeps the output collision-free. Resolved programs expose this information through `agentProvenance`.

Nested aliases retain the full namespace. If `team.prs` imports `inner-team.prs` as `inner`, then an outer import as `frontend` resolves the inner team's `reviewer` agent to `frontend.inner.reviewer`:

```
# team.prs
@use ./inner-team as inner

# project.prs
@use ./team as frontend
```

Known agent references are rewritten with the same namespace. For example, an imported definition that contains `agent: "reviewer"` or a handoff entry targeting `"reviewer"` points to `frontend.inner.reviewer` after resolution. Native output then uses `frontend-inner-reviewer` consistently for both the agent file and handoff target.

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

## Field Support Matrix

Every canonical `@agents` field has an explicit status per native target. The matrix is machine-readable in `@promptscript/core` (`agent-capabilities.ts`) and drives the compiler diagnostics, so the table below cannot drift from what formatters actually emit:

- **emitted** - written to the native agent file under the same name
- **transformed** - written under a target-native name or representation
- **not supported** - the native agent format cannot represent it

| Field                 | GitHub      | Claude  | Cursor  | Factory | Codex       | OpenCode | Augment | Amp     | Grok    |
| --------------------- | ----------- | ------- | ------- | ------- | ----------- | -------- | ------- | ------- | ------- |
| `description`         | emitted     | emitted | emitted | emitted | emitted     | emitted  | emitted | emitted | emitted |
| `content`             | emitted     | emitted | emitted | emitted | transformed | emitted  | emitted | emitted | emitted |
| `tools`               | transformed | emitted | -       | emitted | -           | -        | -       | -       | emitted |
| `model`               | transformed | emitted | emitted | emitted | emitted     | -        | -       | -       | emitted |
| `reasoningEffort`     | -           | -       | -       | emitted | transformed | -        | -       | -       | -       |
| `specModel`           | transformed | -       | -       | emitted | -           | -        | -       | -       | -       |
| `specReasoningEffort` | -           | -       | -       | emitted | -           | -        | -       | -       | -       |
| `disallowedTools`     | -           | emitted | -       | -       | -           | -        | -       | -       | emitted |
| `permissionMode`      | -           | emitted | -       | -       | -           | -        | -       | -       | emitted |
| `skills`              | -           | emitted | -       | -       | transformed | -        | -       | -       | emitted |
| `mcpServers`          | transformed | emitted | emitted | emitted | transformed | -        | -       | -       | emitted |
| `sandboxMode`         | -           | -       | -       | -       | transformed | -        | -       | -       | -       |
| `nicknameCandidates`  | -           | -       | -       | -       | transformed | -        | -       | -       | -       |
| `handoffs`            | emitted     | -       | -       | -       | -           | -        | -       | -       | -       |
| `maxTurns`            | -           | emitted | -       | -       | -           | -        | -       | -       | emitted |
| `memory`              | -           | emitted | -       | -       | -           | -        | -       | -       | emitted |
| `background`          | -           | emitted | -       | -       | -           | -        | -       | -       | emitted |
| `isolation`           | -           | emitted | -       | -       | -           | -        | -       | -       | emitted |

GitHub transformation examples: `tools` maps PromptScript and Claude Code tool names to Copilot aliases (`Grep` and `Glob` both become `search`), and `model` maps common Claude and OpenAI aliases (`sonnet` becomes `Claude Sonnet 4.5`). Codex transformation examples: `content` becomes `developer_instructions`, `reasoningEffort` becomes `model_reasoning_effort`, and `skills` becomes the `skills.config` array.

Every other target has no native agent output: the whole `@agents` block is omitted and reported with a `PS4003` warning instead of being dropped silently. The same diagnostic fires per field when a native target cannot represent authored data (for example `tools` on Cursor, or `skills` on GitHub), naming the agent, the field, the target, and which targets do support the field.

## Native Output

Targets with native agent systems receive dedicated files. Common examples:

| Target         | Native output                                                  |
| -------------- | -------------------------------------------------------------- |
| Claude Code    | `.claude/agents/<name>.md`                                     |
| GitHub Copilot | `.github/agents/<name>.md`                                     |
| Cursor         | `.cursor/agents/<name>.md`                                     |
| Factory AI     | `.factory/droids/<name>.md`                                    |
| Codex          | `.codex/agents/<name>.toml`                                    |
| OpenCode       | `.opencode/agents/<name>.md`                                   |
| Augment        | `.augment/agents/<name>.md`                                    |
| Amp            | `.agents/agents/<name>.md`                                     |
| Grok Build     | `.claude/agents/<name>.md` (delegated to the Claude formatter) |

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

Codex also emits agent TOML files in `multifile` mode. Compiling a version that cannot emit agents reports `PS4003` for the whole block instead of dropping it silently.

## Global Installs

`output.baseDir` (or `prs compile --output`) can point at a global root such as `${HOME}`. To install only generated resources without unrelated root instruction files, select resource kinds:

```bash
prs compile --output "$HOME" --resources agents,skills
```

Valid kinds are `agents`, `skills`, `commands`, `mcp`, `hooks`, `plugins`, and `main`. Without `main`, root instruction files such as `CLAUDE.md` or `AGENTS.md` are omitted, so a global compile produces only directories like `.claude/skills/`, `.claude/agents/`, or `.factory/droids/`. The same selection can be pinned in config with `output.resources`.

Global output is guarded: compiling into the home directory without a resource selection prints a warning first, and protected personal override files (`~/.factory/AGENTS.md` today) are refused outright. Resource-only runs skip managed cleanup so unselected files are never treated as obsolete and deleted; run a full compile to prune stale generated files.

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
