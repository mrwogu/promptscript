# Agents Example

This example demonstrates how to define AI subagents using the `@agents` block in PromptScript. Both **GitHub Copilot** and **Claude Code** support custom agents.

## Overview

Custom agents are specialized AI assistants that handle specific types of tasks. Each agent runs with its own system prompt and specific tool access.

Benefits of using subagents:

- **Preserve context** - Keep exploration and implementation out of your main conversation
- **Enforce constraints** - Limit which tools a subagent can use
- **Specialize behavior** - Focused system prompts for specific domains
- **Control costs** - Route tasks to faster, cheaper models (Claude only)

## Complete Example

```promptscript
@meta { id: "my-project", syntax: "1.0.0" }

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
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAIQAmnLBCwBPAATAAOqzFjJIeYpliAmswCuYjNRhiA7s2oBrCKwDmYtlrEAVEWhgBlRtQhosYkhBfM4MagBu3vBiNMwAVjCMWBTSsooKCqwAvtLS3BhmgnAScWIsAgC0OkEwev6IucqyAnAubkJslfIAooQO1B4FuiUQZWJwDowQGFAQcDFiAArUzBjREAEwUOK9ZTndYmCGYgCO6qPCInQDUequoicYrHyeGKZY96wYAEbQR7FJsrJYzMxQcEqyHkACUYBg+PITvIAOI6NBQuQgGFQZgvRHyABCGDgOHkAF08rISMwBFBmiA4GxWDAsEpvvk2Bx2BSEkTvmpNNpdBhTqwIDtNmtytQxJw4OdTBYcBAzDgBo8bto+DlmGBGQI9gcxqItDdToxJaJYqx2bIAOo4ThiUwBZhGGB8RBmsQARgoYhB6hkZmEYj4EDA6t+px6UUE+Rw1yycBdACYPQAxZiG1UyEkByCOrbQeAugDMHsxMF9MmFNpIJEdIw4KzS1W+YNKekjUSMYwmzobskKYgAwqTdON8rBtHrbjoIa9YC7e4nvQs2DlrrcAtoRi9YMudPpllBCs8q5Du2JewA5Zj+9TkbzYbPdWfTWYdMXUWaiqM3MbmR8XsXtXxsz8FxaVVUUAEEpgASTEB0RFjE9eyg1g0HUDw1zGPhsAFGQIDIWAq3YR1HxhP5bg4CZGSWahMhgR8pn8bZqBIa5GF0FhWDgfh-GwpctD4PgdDgPxjxdGZmCCTUwBgR0XnmIxLGoMxrggAAvbMXnEGgBQuEQuwZHt+wuW8oBtYT1BCAAKEh1EoyBCAASkfc1tH5cwcks3ENCgW57KcxCxEcdQzBjRpOLESyOK4gRRTwsIgnMfyXWQxgoHUTVBiiQNvH-UhyBCNUxBwZgWxDeyzIleATQZNkvjEVJTWUAQXmCrJqEqKQG1qep3BwikABEYBakKpQGIYRg7DwmNfd84BOCipvuNKhKufVvSIIYOFuF4YCjIJDE+dlfn+QExGBEAwQhDEQBaAM6RAaEQGxXFrrhGAEQepEUTRAl2QzZYKVMK0Lnpb4Oi8YScIAWUHCl5jY9xbuEWM6tkDjmSwVlEhdTktB3a5-w6Dxmta-wxqyw5VNG0wxFmZgugwWyeWeFYuLgE0XUta1bXtR19IM91+wwdxzl0fx308eA4Fo8cFXksQsBotj4w9KCBHYQNVne2Y+HURcZAmd6EIMsRCzEKCqSgO8FatLYltFsRUUYXjGpNgAWVX8JgQiPC8fkWNM+yXQAVg9AA1fxNYGf40Jw-RDCMBCXUG4bSwsMI2OE-mGV7cCWZEdSZp2KthNo5d9VRMxjYM3s+ytRgFJ0Nj2A1djPxjR9k2Y2WFqK+x6atPxq5zsRwIEhUaI4X1GH9Ibgsd5gRp-ALkMy6IxDXVxp10CY7yTk8u7FeZ5XGSqTni7js++XsQT+BmmcJq3njCx8Wkkzg2IGa80EMIRzBt3QAZMisF8OMR8jhxqQBnpsIOAUbDwD-hYYWYRj70RKIIOOTdmCVk4FhMK+8TbJlTJYGQ9lRq4F0N6GKKxqbmRgCcEBHgKEDBEGQX4JB2bslqnkBqeQ8EYEKHUPoGtOxVAZN1VwvUmhIn6tgXk1xRjwWHBtfwU0diOAAIoABktSR3gCcTEsoNEWWoOIZgHQXZzVlvwm0nFZQ4CwJw1GCs-gAiBFiHEeJPqgnBJCbxIBzQXDoiAQkDZ-rkiRFSVgNJ7rsnRoILGoMGS425NYGxQiMGUTXhNNS1MZCaJ0SuMQhizDGP8OIBRrNxgcxPFzXCrA7QOidC6QWABVG4-hd76mYTYypSicg6H2BAHQPsVZiECcIMWQZvDCI8AU3Rrg8wnjNq0vwxSjEmPECwSsRTvy6GOgCCKLxdgOX0FaGQyDnxbw4C6D2o986FyKRKHZrhC5CXUFARxIcPQzHgBGSANwpQbFHNQOsrsDIAGkYBaSVkITOV9DITI4JYXqXh1K3HmfsPROQ9DCHlGEF8kBPmdMfKsnkaACXXJ5CFHQyl8Gy3CMwUww9r7m1YKldK7FsE+xyBtK2phRrbPyoQBe09O6GBYh4d5nycjTUnFhN4OoRBoIktxf0cjCiCUWNaLBOClT4PrIQnY4JGDyj6WzBFp4xBtHIE8ABCyKkUtmKggK-UUzqB9nqCp5k2E4RZYZAAEvYsYcoPBwRzIC9y4DSaURpIQDwhs0A5DkiJEh6rHiGoMuBKAegMDwTFJxB2WLFnbimVA2ZssWATEKDAIMUQhBLGqt8bhyheFNReMUXxFQxHfAkQ0PqSI2hnGRfKwobAVjpteDiXQxa+jszEGSs51o+lU3-jYnYWQaST1GvCX+TijquNOudZ6XjHqXT8aE8R4xRionKHwGwh73EBKCddJG91L3fHCRSKMEAjDqCSaEfwEMuJsBhgICkfAmTgTgEYAD8SWRIjZCeFJ+NJ0puZooyiuLcC018WO1gE74ZSw9EOw0yLHAtC0S0PsNgFlzpcXqOAIpdETD9VoF4GgmG234TUk2dStAwezCGFdgC5GWsFmrDBYBxB6BlKahW28NhMjtcwnQsA1wt34WMpFZaZkRgo1RmjdGQjYbNU68xVKczEtoAWH5QkIzSscSOcEoKZN4sZEReNmbkkaHyNcRhnhSRRx4+bdUOImkMagmeCjIIbAnFaVMfq4EbAtBOP1SjLQUsnGLkF6TAxTXewwCcPlKmoweBEL58d4g9phghFoRgmdOENhbbIBqyQQDJHxAwQQpj8BEDypQGg9AQDURA6wfAroOtAA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

## Configuration Options

### Required Fields

| Field         | Description                                    |
| ------------- | ---------------------------------------------- |
| `description` | When the agent should be invoked               |
| `content`     | System prompt that guides the agent's behavior |

### Optional Fields

| Field             | Type     | Platform | Description                                       |
| ----------------- | -------- | -------- | ------------------------------------------------- |
| `tools`           | string[] | Both     | Tools the agent can use (inherits all if omitted) |
| `model`           | string   | Both     | AI model to use (platform-specific values)        |
| `disallowedTools` | string[] | Claude   | Tools to deny, removed from inherited list        |
| `permissionMode`  | string   | Claude   | How to handle permission prompts                  |
| `skills`          | string[] | Claude   | Skills to preload into subagent context           |

### Model Options

**GitHub Copilot:** Any model available in your GitHub Copilot subscription (e.g., `gpt-4o`, `claude-sonnet-4`, `o1-mini`).

**Claude Code:**

| Model     | Use Case                               |
| --------- | -------------------------------------- |
| `sonnet`  | Default. Balanced capability and speed |
| `opus`    | Complex reasoning, highest capability  |
| `haiku`   | Fast, low-latency for simple tasks     |
| `inherit` | Use same model as main conversation    |

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
    model: Claude Sonnet 4.5
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
        | `sonnet` | `Claude Sonnet 4.5` |
        | `opus` | `Claude Opus 4.5` |
        | `haiku` | `Claude Haiku 4.5` |
        | `sonnet-4` | `Claude Sonnet 4` |
        | `inherit` | *(omitted)* |

        Claude-specific fields like `disallowedTools`, `permissionMode`, and `skills` are ignored for GitHub output.

=== "Claude Code"

    `.claude/agents/code-reviewer.md`

    ```markdown
    ---
    name: code-reviewer
    description: Expert code review specialist. Proactively reviews code for quality, security, and maintainability.
    tools: Read, Grep, Glob, Bash
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
    tools: Bash, Read
    disallowedTools: Write, Edit
    model: haiku
    permissionMode: dontAsk
    ---

    You are a database analyst with read-only access...
    ```

## Using with Skills (Claude only)

You can preload skills into subagents using the `skills` field:

```promptscript
@skills {
  error-handling: {
    description: "Error handling patterns"
    content: """
      Always use try-catch blocks...
    """
  }
}

@agents {
  debugger: {
    description: "Debug specialist"
    skills: ["error-handling"]
    content: "You are an expert debugger."
  }
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-jNdc9QFocGVgBMoEVgHNEAAmAAdVrJWzR8RtQhosENnIUgAor36zhYidNmYsHaqziGlq2S3acsBkM5-LXsgCCUADuGACecLIArnAwsljU4QKM2Iw4sgBGUMyMANZwFEUuqr7O-gC+SlWsSgACGFKeUYr+6pnRUk3Ucq2u6nCa2rr6soYAIjAdUrJwaDCMEBgScFjlrnB50FBwcsiGPHyCFuKSUoYAuiUq7hzs3gCazNGyGNTxIrJE89RYalOdboUdayGoVEAVC4MTxJbjEMiUGj0EAANx4cD0rHwAEYIUA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

The full content of each skill is injected into the subagent's context at startup.

## Configuration

Enable agents in your `promptscript.yaml`:

```yaml
targets:
  - github:
      version: full # Required for agents
  - claude:
      version: full # Required for agents
```

## Platform Comparison

| Feature           | GitHub Copilot      | Claude Code |
| ----------------- | ------------------- | ----------- |
| Custom agents     | ✅                  | ✅          |
| Agent `tools`     | ✅                  | ✅          |
| Model selection   | ✅                  | ✅          |
| `disallowedTools` | ❌                  | ✅          |
| Permission modes  | ❌                  | ✅          |
| Skills preload    | ❌                  | ✅          |
| MCP servers       | ✅ (org/enterprise) | ❌          |
| Lifecycle hooks   | ❌                  | 🔜 Planned  |

## Future: Hooks Support

Claude Code supports lifecycle hooks for subagents (`PreToolUse`, `PostToolUse`, `Stop`). This feature is planned but not yet implemented in PromptScript. See the [Roadmap](https://github.com/mrwogu/promptscript#roadmap) for updates.

## See Also

- [Language Reference - @agents](../reference/language.md#agents)
- [Skills & Local Example](skills-and-local.md)
- [GitHub Copilot Custom Agents Documentation](https://docs.github.com/en/copilot/concepts/agents/coding-agent/about-custom-agents)
- [Claude Code Subagents Documentation](https://code.claude.com/docs/en/sub-agents)
