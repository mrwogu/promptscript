---
title: Agents Example - PromptScript
description: Learn how to define portable AI agents and compile them to native agent formats.
---

# Agents Example

This example demonstrates how to define AI subagents using the `@agents` block in PromptScript.
Rich target formatters compile them to platform-native agent files.

## Overview

Custom agents are specialized AI assistants that handle specific types of tasks. Each agent runs with its own system prompt and specific tool access.

Benefits of using subagents:

- **Preserve context** - Keep exploration and implementation out of your main conversation
- **Enforce constraints** - Limit which tools a subagent can use
- **Specialize behavior** - Focused system prompts for specific domains
- **Control costs** - Route tasks to faster, cheaper models on every target with a native `model` field

## Complete Example

```promptscript
@meta {
  id: "my-project"
  syntax: "1.4.0"
}

@identity {
  """
  You are working on a TypeScript microservices project.
  """
}

@agents {
  code-reviewer: {
    description: "Expert code review specialist. Proactively reviews code for quality, security, and maintainability."
    tools: ["Read", "Grep", "Glob", "Bash"]
    model: "sonnet"
    content: """
      You are a senior code reviewer ensuring high standards of code quality and security.

      When invoked:
      1. Run git diff to see recent changes
      2. Focus on modified files
      3. Begin review immediately

      Review checklist:
      - Code is clear and readable
      - Functions and variables are well-named
      - No duplicated code
      - Proper error handling
      - No exposed secrets or API keys
      - Input validation implemented
      - Good test coverage
      - Performance considerations addressed

      Provide feedback organized by priority:
      - Critical issues (must fix)
      - Warnings (should fix)
      - Suggestions (consider improving)

      Include specific examples of how to fix issues.
    """
  }

  debugger: {
    description: "Debugging specialist for errors, test failures, and unexpected behavior."
    tools: ["Read", "Edit", "Bash", "Grep", "Glob"]
    model: "inherit"
    permissionMode: "acceptEdits"
    content: """
      You are an expert debugger specializing in root cause analysis.

      When invoked:
      1. Capture error message and stack trace
      2. Identify reproduction steps
      3. Isolate the failure location
      4. Implement minimal fix
      5. Verify solution works

      Debugging process:
      - Analyze error messages and logs
      - Check recent code changes
      - Form and test hypotheses
      - Add strategic debug logging
      - Inspect variable states

      For each issue, provide:
      - Root cause explanation
      - Evidence supporting the diagnosis
      - Specific code fix
      - Testing approach
      - Prevention recommendations

      Focus on fixing the underlying issue, not the symptoms.
    """
  }

  data-scientist: {
    description: "Data analysis expert for SQL queries, BigQuery operations, and data insights."
    tools: ["Bash", "Read", "Write"]
    model: "sonnet"
    content: """
      You are a data scientist specializing in SQL and BigQuery analysis.

      When invoked:
      1. Understand the data analysis requirement
      2. Write efficient SQL queries
      3. Use BigQuery command line tools (bq) when appropriate
      4. Analyze and summarize results
      5. Present findings clearly

      Key practices:
      - Write optimized SQL queries with proper filters
      - Use appropriate aggregations and joins
      - Include comments explaining complex logic
      - Format results for readability
      - Provide data-driven recommendations

      For each analysis:
      - Explain the query approach
      - Document any assumptions
      - Highlight key findings
      - Suggest next steps based on data

      Always ensure queries are efficient and cost-effective.
    """
  }

  db-reader: {
    description: "Execute read-only database queries. Use when analyzing data or generating reports."
    tools: ["Bash", "Read"]
    disallowedTools: ["Write", "Edit"]
    model: "haiku"
    permissionMode: "dontAsk"
    content: """
      You are a database analyst with read-only access. Execute SELECT queries to answer questions about the data.

      When asked to analyze data:
      1. Identify which tables contain the relevant data
      2. Write efficient SELECT queries with appropriate filters
      3. Present results clearly with context

      You cannot modify data. If asked to INSERT, UPDATE, DELETE, or modify schema, explain that you only have read access.
    """
  }
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAIkxYYABMAA6rQYIgATRIJEgSATwC0NZgCsYjLPLES4i9hkKz5ARgoAWCgAZdrAL5ix3aZywQsi4Xrkhd-uKCAJrMAK6CGNQwggDuzNQA1hCsAOaCbJGCACqKaDAAyozUEGhYgiQQxcxwMNQAblXwgmqa2hS+AfZOrC4Yqe5wPkEsUjDK0Y0wsXWyokESY3DFpR5spiAAooT51OWjMZMQ04Jw+YwQGFAQcFgUggAK1MwY2hD1MFDeR9NDB4JgBKCACOYSunkUdFOWjCJS8UIwrCkFQwKQEKQwACNoBCOoEJBIsMxmFA4LJkPIAEowDBSeRQ+QAcWiaHpfkZUGYmLZ8gAQhg4Dh5ABdXwSEjMMZQDZwNisfj2AmCFjsdwbLoLAmhCJRGJCWqsCBA-4-GbUQScOCwlLpHAQVI4U4CJFRKRDZhgZWSmKg8FeSJI6GMa1eDq9TUSADqOE4klY9WYiRgMjFBIsgkpYXEqU8gikEDAnqJ0MOWncypwiIGcFTEgATPcAGLMYPu8QS-OQZMA6DwWuCADM915MBz4lNkhIfHz2E+imcEYzMCmsQrWkS11uiH7ykEAGFvZI-rAogHkdFaVjYDvBI2s282ENEcj6lFLpjYE-onFPlBlKxSGTG8ADlmDzMJyCqWdkQOG8nmYXYLWoZ5zUrJFrjSECwKINAam7Wpin4d1zQAQQeABJQQk0UGtF13cjWDQMJylfa4pGwI1xAgMhYD4VU6TowRGWJZEOFuL0PmofoYDgupAWoEhEUYGIVTgNwpLWVgnykKRojgWoBP7eDGjGAEYGTTFXkSDJqFSREIAAL27TFvBoI04UUbdBL3OEoKgI8rWaAAKEgwnEyBCAAShvSMokNNIhiCwVwigZEIuiwSCjCVJq00xLVPUyc1EaNIMv7BjGCgMJTLOLQCyqC1iB45oPUEHBmFXYsIoCsJ4DDJUunxQQel8MZMWygZqDmVMlhWMpOI2AARGBxpym1TnOS5N3KeSkJQuAoTEnbUSqvSEUDLMcK0DhkUxGBK0aBI8VTIkSTJQQKRAalaR5LZ8x0EAGRAflBV+5kYFZQH2U5bkQFFTUO0+DYUhjOFFQJXZKn0ziAFlvQ2V5lLKTZ-prIaJBVDh2HVfxya1cJIm-RFGt2coxomuoNrq8EHPWlJBGeZh9gwMK9QAr41LgMN+2jWMUgTJMU0XdM9wwMpYRiOoUIqeA4Gks8nSswQsCk5T+wbQRyLGdgC2+CHnikMIH3EW4IdopUJCHS3ZSgWdjZjAETo1wROUYDi2H7axLeavjykqQ1FP8iL+wAVnuAA1OpbdOElmM4uIEkSWj+2W1ax3SNRlP0ryPcEXcSPFxQnL2oE+H06Sn0DTlUndj3dz3GNGGs6JlPYL1TMYNDqxvZsFINo62ryIWY1qXulXrnSnQ00cGvZ9Ju-Lm8GNq7RBFfEorxiW5Z2LxdZ4tV5HRuQKoWKtwa77jNiWF0WWd9gDNI3k2CZTgylTgQVwnsdauAYgzlSKwGoNwbwFE2pARg48YjJ0EtkeAHg0iRDQGoR+cFJjuHziPZgU5ODsTyguWuzZWwZHEBFaBAcsxjGoF8Pm+lepQgQeUGBpxFBkCJCQKWqZBq+BGkEGhGBlDLGODbLcwwlSzRKPNdYfhFrYCEIiK4NEbgszqDtIEBQACKAAZEEvUSjwChLye0ZibHeAQnUcOWlzrIlkXGNSDosDiLpq9Uk5I+QCiFFDKkNI6QRJAJGOEMk4apkRtKPwspWDygBqmSmao-AalrtqRmeo8w6NOBcMh4kT5bUcnzcQ5irHPkEA41ITi6jeD0RLG40tFyyy4vGRMyYP5KnTAAVSRHUa+gZBHePaQYoY0RQQQGiLHc29w4meE1oWKoijyh1OsVnPsi4vbDNqI0xxzivRTgaRhGIQTEqYmBJFOIMZxBqzUG5Wckd7gN30c3BpVpLklGbnpMIUB-Gp3uE8eA5ZIBIhtMeGknD5zhlrgAaRgK5U2Hgq6DIJLuNZHAMjzUqE5ZEuzQT7KGLETwjo3mc0gKC8ZN5jl6kIc8d5BL+ipGiHZPKBt1DMBSGvXFltWCVWqipShschg4V9ikdaLBmqEBDswHMjAZ4JEUuUYFoKhi7QvOxbE1wvAkOYCA4pAhlC6XeLGChVCXS0ORR7e+NJJ4Bn0ZLHFEhdzbHIKicQgjyXUDaayl4k8byLRbGEWOAY2k8JEZxIVXrBAAAl7Q4GuH4qi6KeywoSsgjm4l5SEHKK7NAQxLIGSYeajAdCPYkSgLEDANELRaWDoG44X4NloO2QbFgtxlAwELNda1-UCSSKCNIxYmIJhRNmCogkajVgLT8NsGEBL9XKDYF8atFafQ2I7fcZlTzYwzN5vg7xQIBjyg0utFkCR-HPU1LckJwMwm-W+tE+GqibhXE5DMKQ2RiTBI+vIfFCSgYk08CKJJ3oUnyErBARIYR0YSExs-XG+M-BSDYFgEicBEgoa9KqamuTab9gKbqLIsjd1uoluUKluABZRM3awbdhNdb3FXcGAlBRNgWM2HubIezbFDGLIiOAZo9m3ATZETE4QBEB1kV02uPTIj4e7GJxuzdZGesEOmK2ZCwDeFiHaV1AgPzNEpn6-2pZYCvjHrIlZggwMWk2WUsevH+OCeEx2uI1KCFvIvgS+lHBaD9i9pCg0Wr4Agv8cqE8iK-OMeycW2tSoClh3SULCokps5Kctp6AUitjZgXIsBXjlJshQmGQ8RaJFsibChItPjmwGtQlbrlozpSYyKShDK6zuBsCCEUAzLd3gHqllpJERgVdxGanHRIHoDgQAOGFAwdwQb8BEFIOQGAVBaCAxAJJNSbB8BmBW0AA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

## Configuration Options

### Required Fields

| Field         | Description                      |
| ------------- | -------------------------------- |
| `description` | When the agent should be invoked |

### Optional Fields

| Field                 | Type     | Platform         | Description                                              |
| --------------------- | -------- | ---------------- | -------------------------------------------------------- |
| `content`             | string   | All              | Additional system prompt for the agent                   |
| `tools`               | string[] | Target-dependent | Tools the agent can use (inherits all if omitted)        |
| `model`               | string   | Target-dependent | AI model to use                                          |
| `reasoningEffort`     | string   | Factory, Codex   | Target-native reasoning level                            |
| `specModel`           | string   | GitHub, Factory  | Model for Specification/planning mode (mixed models)     |
| `specReasoningEffort` | string   | Factory          | Reasoning effort for spec mode (`low`, `medium`, `high`) |
| `disallowedTools`     | string[] | Claude           | Tools to deny, removed from inherited list               |
| `permissionMode`      | string   | Claude           | How to handle permission prompts                         |
| `skills`              | string[] | Claude           | Skills to preload into subagent context                  |
| `mcpServers`          | string[] | Target-dependent | Named top-level MCP servers available to the agent       |
| `sandboxMode`         | string   | Codex            | Target-native sandbox policy                             |
| `nicknameCandidates`  | string[] | Codex            | Display names for spawned agents                         |

### Model Options

Write one model value, and PromptScript maps it to the model name each target
expects through the [model catalog](../reference/models.md):

| Value                                | Meaning                                                       |
| ------------------------------------ | ------------------------------------------------------------- |
| `sonnet`, `opus`, `haiku`, `fable`   | Floating alias for the newest release of the Claude family    |
| `claude-opus-5-5`, `Claude Opus 5.5` | Pinned release, by profile id, alias, API id, or display name |
| `inherit`                            | Use same model as main conversation                           |
| Any other name                       | Written unchanged, unless the target has its own spelling     |

**GitHub Copilot:** Catalog models become Copilot model names, so
`claude-sonnet-4-5` becomes `Claude Sonnet 4.5` and `sonnet` becomes the
newest Sonnet release. `inherit` is omitted, and `auto` becomes `Auto`.
Other names pass through unchanged, so any name from your Copilot model
picker works.

**Claude Code:** Floating aliases and `inherit` stay as written. Pinned Claude
releases become API ids, such as `claude-sonnet-4-5-20250929`. Models from
other providers are omitted with a `PS4004` warning.

**Factory AI, Codex, and Cursor:** Catalog models become model ids. Codex runs
only OpenAI models, so it omits models from other providers with a `PS4004`
warning. Factory AI and Cursor write `inherit`, Codex omits it. The
[Model Catalog](../reference/models.md#target-model-names) shows what each
target writes.

### Permission Modes (Claude only)

| Mode                | Description                                    |
| ------------------- | ---------------------------------------------- |
| `default`           | Standard permission checking with prompts      |
| `acceptEdits`       | Auto-accept file edits                         |
| `dontAsk`           | Auto-deny permission prompts                   |
| `bypassPermissions` | Skip all permission checks (use with caution!) |
| `plan`              | Plan mode (read-only exploration)              |

## Compiled Output

With `version: full`, agents are generated as separate files:

=== "GitHub Copilot"

    `.github/agents/code-reviewer.md`

    ```markdown
    ---
    name: code-reviewer
    description: Expert code review specialist. Proactively reviews code for quality, security, and maintainability.
    tools: ['read', 'search', 'execute']
    model: Claude Sonnet 5
    ---

    You are a senior code reviewer ensuring high standards of code quality and security.

    When invoked:

    1. Run git diff to see recent changes
       ...
    ```

    !!! note "GitHub Copilot Mappings"
        PromptScript automatically maps tool and model names to GitHub Copilot's format:

        **Tools:**

        | PromptScript | GitHub Copilot |
        |--------------|----------------|
        | `Read` | `read` |
        | `Grep`, `Glob` | `search` |
        | `Bash` | `execute` |
        | `Edit`, `Write` | `edit` |
        | `WebFetch`, `WebSearch` | `web` |
        | `Task` | `agent` |
        | `TodoWrite` | `todo` |

        **Models:**

        | PromptScript | GitHub Copilot |
        |--------------|----------------|
        | `sonnet`, `opus`, `haiku`, `fable` | Display name of the newest release in the family |
        | `sonnet-4.5` | `Claude Sonnet 4.5` |
        | `gpt-5.3-codex` | `GPT-5.3-Codex` |
        | `inherit` | *(omitted)* |

        The [Model Catalog](../reference/models.md#floating-aliases) lists the
        current release behind each floating alias.

        Claude-specific fields like `disallowedTools`, `permissionMode`, and `skills` cannot be
        represented in GitHub output: each one is reported with a `PS4003` compatibility warning
        and omitted.

=== "Claude Code"

    `.claude/agents/code-reviewer.md`

    ```markdown
    ---
    name: code-reviewer
    description: Expert code review specialist. Proactively reviews code for quality, security, and maintainability.
    tools: ['Read', 'Grep', 'Glob', 'Bash']
    model: sonnet
    ---

    You are a senior code reviewer ensuring high standards of code quality and security.

    When invoked:

    1. Run git diff to see recent changes
       ...
    ```

    `.claude/agents/db-reader.md`

    ```markdown
    ---
    name: db-reader
    description: Execute read-only database queries. Use when analyzing data or generating reports.
    tools: ['Bash', 'Read']
    disallowedTools: ['Write', 'Edit']
    model: haiku
    permissionMode: dontAsk
    ---

    You are a database analyst with read-only access...
    ```

## Using with Skills and MCP Servers

Agents can reference reusable skills and project MCP servers:

```promptscript
@skills {
  error-handling: {
    description: "Error handling patterns"
    content: """
      Always use try-catch blocks...
    """
  }
}

@mcpServers {
  issue-tracker: {
    transport: "stdio"
    command: ["node", "./tools/issues.mjs"]
  }
}

@agents {
  debugger: {
    description: "Debug specialist"
    skills: ["error-handling"]
    mcpServers: ["issue-tracker"]
    content: "You are an expert debugger."
  }
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gMQAEAAiRhYMvDABNxMcbzjNeuCHF5hqGAOZD2vFmWjxebXhCzLmAd1bGruGL3IYAnuurMArq3EAdVoOGjgH15jcUReLwJiMlgIoNlHdgxCMIiARgoAVgoABljWAF8fH344AGtoKGVAq14YaldqAFocDE8oCFZ1MOrg4Kk4RmoINCwINhSQAFF65mpeFraO9XtsDmpWODzenTYOdgnYkDjtgEEocydlNzg7LGpHRsZsRhxeACMoZkZSuAo-4-CRyBcUKBSKvhIjDQAGU6gA3OpVOJKOBuGCNO4Yb51boAzEbNCzLATOBYcRjLa9XQkVqhXjICKsZhSCJ0QEUAD0WGYzEqHJRaN+JAAVpsQABdEE+UHFDScUy8Hq8KRvNzqdQ4xUA-qDYajcaAgAiMFVyzgaBgjAgGHapMpwTKFTgYQZBBmTQW4nanQikpqwUhMPhiJdEQF6Mx2OovoBLHY8omAE13GJqHZWrVCBbqFhlSa1RrqBRKaD8iB8uKGPL7vgiKRyDAqLQQAwEbQxqx8Kly0A" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

The full content of each skill is injected into the subagent's context at startup.

## Configuration

Enable agents in your `promptscript.yaml`:

```yaml
id: agents-example
syntax: '1.4.0'

targets:
  - github:
      version: full # Required for agents
  - claude:
      version: full # Required for agents
  - cursor:
      version: full
  - factory:
      version: full
  - codex:
      version: full
```

## Platform Comparison

| Target         | Native agent output          | Notable capabilities                                                 |
| -------------- | ---------------------------- | -------------------------------------------------------------------- |
| GitHub Copilot | `.github/agents/<name>.md`   | Tools and model mapping, specification model, handoffs, inline MCP   |
| Claude Code    | `.claude/agents/<name>.md`   | Tools, deny lists, permissions, skills, max turns, memory, MCP names |
| Cursor         | `.cursor/agents/<name>.md`   | Name, description, model, MCP references (no tools)                  |
| Factory AI     | `.factory/droids/<name>.md`  | Models, reasoning effort, spec models, tools, MCP references         |
| Codex          | `.codex/agents/<name>.toml`  | Reasoning effort, sandbox, nicknames, skills config, MCP tables      |
| OpenCode       | `.opencode/agents/<name>.md` | Description and content (automatic `mode: subagent`)                 |
| Augment        | `.augment/agents/<name>.md`  | Description and content                                              |
| Amp            | `.agents/agents/<name>.md`   | Description and content                                              |
| Grok Build     | `.claude/agents/<name>.md`   | Full Claude contract through delegation                              |

Fields a target cannot represent are reported with `PS4003` compatibility
warnings (agent name, field, target, and the targets that do support the
field) instead of being dropped silently. See the
[Field Support Matrix](../features/agents.md#field-support-matrix) for the
authoritative per-target statuses.

Project lifecycle hooks are defined separately through `@hooks`. Agents can reference shared
capabilities from `@skills` and `@mcpServers`.

## See Also

- [Language Reference - @agents](../reference/language.md#agents)
- [Agent Platform - Agents](../features/agents.md)
- [Model Catalog](../reference/models.md)
- [Skills & Local Example](skills-and-local.md)
- [GitHub Copilot Custom Agents Documentation](https://docs.github.com/en/copilot/concepts/agents/coding-agent/about-custom-agents)
- [Claude Code Subagents Documentation](https://code.claude.com/docs/en/sub-agents)
