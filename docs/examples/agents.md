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
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAIkxYYABMEEQAJokEAdECQCeAWhrMAVjEZYZdQXDnsMhSTICMFAAzmZggL5TWd7uM5YIWOcLuDpIGb9ZeATWYAV0EMahhBAHdmagBrCFYAc0E2MMEAFTk0GABlRmoINCxBEggC5jgYagA3cvhBZTUNCk9vXx9WW3tWbgwk5zgPf0EWMRgFCLqYKOrJYDavcbgCopc2IxAAUUIc6hKxyKmIGZ0cxggMKAg4LApBAAVqZgwNCBqYKHdjmaHDwTAsUEAEdgldXHJtFVGMFCm5tBhWGJShhEgJEhgAEbQCGtTpeLxYZjMKBwSTIGQAJRgGDEWm8AHEImh6TIGVBmJjWSAAEIYOA4GQAXUWpWY4ygmzgbFY-D8BNGbA47E2HVFgRCYQi6SqrAgQP+P1m1EEnDgsMSKRwECSOB0AiR4TEQ2YYEV4xBYOubjCSJ06gtblaPQVXgA6jhOKJWDVmHEYBJ1YJTIJKcF-ElXIIxBAwG6if6jupnKMcIiBnAkwAme4AMWYMJd-hI4tzJ2RkFglZGCoAzPceTBM-4jaISHwc9hPnI7EnqdMoqX1HFrrdEEmFIIAMLiyI3UawcK+5ERWlY2AbwS19NvNhDRHImrhS6YrtayKzKBQBSsUgJy8AHLMNmwTkOUU7Iocl5PMweymtQzwmmWSLXMkgHAUQaCVAm-oFPwLomgAgg8ACSgjxnI3ahoIm4kawaDBCUT7XGI2D6v4EBkLAfDsP+PYEpuDLEsiHC3IqHzUP0MDQdUgLUCQiKMJELCsHATiSesqlhGIYgRHAVR0iGoYwXUHpgDACaYq8cSpNQSSIhAABeOGYu4ND6nCcjrvxXiblucLgVAoj6cEDQABQkMEYmQIQACUl5huEerJEMYUCiEUAdhAcWXrkwRJBWmmpSpanjCanHKHUyTxUZCp0YwUDBB6cDnG2jCmsQXENK6gg4Mwi4FjFwXmvAwYKmq+I2LOIzjJi+UDNQ8yissqzFOxmwACIwHNBWWmc6iXKuJRyfBiFwNoonHaijV6Qifrpph6gcMimIwGWdSxHiopEiSZKCBSIDUrS3JbDmmggNoMh8gK3JMjALIQ4yHJciAIr8S2EqbIkkZwvKBJ7GU+nsQAsrumyvEpxSg64laTV4KnKlgqo+HTBJBKE4SRIiHV7CUs3zdU+0XOCjl7YkgjPMwBwYFFXO-l8alwMGSYRlGiSxvGiY+cm9xbhgxSwpE1SIaU8BwFJx72tZghYJJSnVvcJHjOwubfPDzxiMEt7+Lc8NUaG-aCCR0pQFONuRgC12G4IHKMGxbBJgALI7XU8SUZR6gpQUxUmACs9wAGrVK7Ogkox7HRLEcTdkmW07cOKTKEp+nedRm6EfLcjOadQJ8PpUn3n6HJJP7Cp+ZGjA2RESnsO6ynIRWl71vJluXb12RS5GVSjwJgiETp9oaUO5TZtt+Ux8wu1odrtGqecTHPuekS3FONfa8vpqvHaNwjdolVOK3UMm5KTEmlrLHmodfyaUvFsUynAlI6FAlhfYe1cCREnEkVglQbi5VapAdq-wc430yPAFwyQwhoGUF-aCUxnAV2nswccnBWJFWmtResjZUj+BiqgiO6YypfDFiFGA2gsElDQToOQZAiQkCVqKCabRuhtBYRgBQKwTguzXMMBUK1ChrQ2N4Da2AhCIiuJRfcj19gAiBLkAAigAGU9MXeA2geQ2lsaFag7hYLVHjqpO6yIVHRjUraLAcjWY-VJOSKG-JBSIypDSOk8SQBhjhNJVGooMafClDKOUrMGbOGZnjBU7N3zpCCeouhYkWoHRFmLfwdjHEPkEG4pIHjqjuFMQrG4yttaqw4jGOMCZAEKhTAAVSRNUF+foJFBK6eYoYERQQQAiGnB2ghUmuCNnmcoGiSiNKcYUeASZA5jKqC09xnj3AsHHM01CkRImpUxMCWK0RIz+H1sodyU4k73A7mY7uzTzS3MKN3PSwQoBhLzvcJ48ASyQCRJaP4h5qBfDYaGAA0jANydsXDNxGbvTZHBUhrTKM5ZEBzQTOKGFEVwdovmC07BwWgl4zlc0oc8b5xL+hJAiPZIqlsVDMESDvXyQdWANSaspRhachiYVDokPaNzyBEAvpmRgS9YgKRKOCyFQwTqnlYtib0M5iEmScNmYxChdLvCjAwphjpWG1QJB-GkjA7TzMVgSsVOxyCon8BIqlXiKFUPdZeDaDZghp19J0kK0j2KipooIAAEjaHA1xQnkWxQCRIOYUq5QFmJWUhASi+zQEMKyBkuGWoEOihUhEoBRAwJRU0qlo5BpOPebUMAdkXBLM0lgtwFA9vMm8D4Y0CQKJGEomamJJiJLmNogkui1jrW8DsAMxLDUKDYF8GtWJ+SRA7aNQQbK3lRnmaLchQSgQDFlBpPazJYhhK+vxR50TeSxO5EDJJaMdE3CuByWYYgMjEiif9GQRL0mQ22GDYUmTdySm8GWCAcRgjFMaNUQmak2Ck3GJsMQSpCJwDiBhgpKp2gsyTKUzm5TjGVrlmYsStLcAS0STu1ge6KZm3uBumExLchbHsVsLcGRDmdptsBREcBjRONuAmsImIQjiIjio3p1F+lhBIzhAsl70HGO9TrIOzsXBgHcFEa07qbZPz+Eqf14ciywCfLPFR6yoOml7XswQgnhOifEw0FjHqOWwUKGHJlUyTkwr0iWXVYSDw0lReZulipeIlrrWzTUcdWBiLFDmMz+7HZun5JrSTQcAKCcpBkbQYyHgbUIhkLY2gNpCa2A17QvdWz5ZWJGBS2h5X2dwNgQQchNS7vcO9IstIwiMGbnI-iU6vDdGsCAawQoGDOC8fgIgpAVVUFoBDEAEkcOsHwMYFbQA" target="_blank" rel="noopener noreferrer">
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
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAJwDW0KHAAEwADqthwmNWrNqAWhwZWAEygRWAc0SiJUqaviNqENFghtdYkAFFZ84crUbtwzFg7VWcG-oMs7JxY1iB+YZIGUgCCUADuGACeIgCucDDCWNSJCozYjDjCAEZQzIx8cBRV-lLhfpEAvhJNrBLcGFrBIuKRRkUpWp3Uuj1RRnAmZhZWwjYAIjD9WsJwaDCMEBgacFj1UfyCcLrINjJyis7qmlo2ALo1woEc7KEAmswpwhjUGSrShGtqFhhH0BkMKHthC0GiAGrcGMFsvgiKRyDAqLQQAwAG4yOCWVj4ACMsKAA" target="_blank" rel="noopener noreferrer">
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
