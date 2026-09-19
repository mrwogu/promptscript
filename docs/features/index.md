---
title: Agent Platform
description: Define instructions, skills, agents, tools, integrations, and automation once, then compile them to native AI coding agent formats.
---

# Agent Platform

PromptScript is an agent platform configuration language. A single `.prs` source defines the
instructions, capabilities, integrations, and automation used by AI coding agents across a
repository or organization.

The compiler translates that source into native files for 50 built-in targets. Each target receives
the formats and capabilities it supports, such as instruction files, native skills, custom agents,
MCP configuration, lifecycle hooks, workflows, and plugins.

## Platform Model

```mermaid
flowchart LR
  Source["PromptScript source"] --> Resolve["Resolve inheritance and imports"]
  Resolve --> Validate["Validate language and capabilities"]
  Validate --> Compile["Compile target-native output"]
  Compile --> Instructions["Instructions and policies"]
  Compile --> Skills["Skills and resources"]
  Compile --> Agents["Agents and tools"]
  Compile --> Integrations["MCP and plugins"]
  Compile --> Automation["Hooks and workflows"]
```

| Platform capability     | PromptScript source                                               | Result                                                   |
| ----------------------- | ----------------------------------------------------------------- | -------------------------------------------------------- |
| Instructions and policy | `@identity`, `@context`, `@standards`, `@restrictions`, `@guards` | Native instruction and scoped rule files                 |
| Reusable capabilities   | `@skills`                                                         | Native skills, bundled resources, scripts, and contracts |
| Delegated specialists   | `@agents`                                                         | Native subagent or custom-agent definitions              |
| User commands           | `@shortcuts`                                                      | Native prompts, commands, or documented shortcuts        |
| Tool integrations       | `@mcpServers`                                                     | Target-native MCP server configuration                   |
| Capability bundles      | `@plugins`                                                        | Target-native plugin manifests where supported           |
| Lifecycle automation    | `@hooks`                                                          | Target-native hook configuration                         |
| Repeatable procedures   | `@workflows`                                                      | Native workflow files where supported                    |
| Multi-package delivery  | `builds` in `promptscript.yaml`                                   | Scoped output for packages and applications              |

## Complete Platform Definition

```promptscript
@meta {
  id: "checkout-service"
  syntax: "1.5.0"
  tags: ["payments", "typescript"]
}

@identity {
  """
  You are working on a payment service.
  Preserve transaction integrity and auditability.
  """
}

@standards {
  code: ["Use strict TypeScript", "Write tests for business rules"]
}

@skills {
  security-review: {
    description: "Review payment changes for security risks"
    allowedTools: ["Read", "Grep", "Bash"]
    content: "Inspect authentication, authorization, secrets, and payment data handling."
  }
}

@mcpServers {
  issue-tracker: {
    transport: "stdio"
    command: ["node", "./tools/issues.mjs"]
  }
}

@agents {
  reviewer: {
    description: "Review changes before merge"
    tools: ["Read", "Grep", "Glob", "Bash"]
    skills: ["security-review"]
    mcpServers: ["issue-tracker"]
    content: "Review changed code, tests, and operational impact."
  }
}

@hooks {
  validate-changes: {
    event: "post-tool-use"
    matcher: "Edit|Write"
    command: ["pnpm", "run", "typecheck"]
  }
}

@workflows {
  release: {
    description: "Validate and prepare a release"
    content: "Run quality gates, summarize changes, and prepare release metadata."
  }
}

@plugins {
  payment-engineering: {
    description: "Payment engineering capability bundle"
    version: "1.0.0"
    skills: ["security-review"]
    hooks: ["validate-changes"]
    mcpServers: ["issue-tracker"]
  }
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAIkxYYABMAA6rQYIgATRIJFMcMRgGtmAVywBaODGoA3CIxjyxEuAE92GQrPkBGCgFYKABhPjBAgOZxZyeZjmfOxw8nRyIFjmaPCM1BBoWPIAumIAvmJi3NKcWBBRwqYRJiBFAJrqghjUMIIA7szUyhCsXoJsVYKBwViCOvqGMBRFAAo1-Xq1WNQYrHAYjHkdLRxe8QWzUlVqUvkYAEbQ+ebDHiXuGaxZcAKsUtVScIUeLFIwfvIAqjp904a9ABVojAAMpxBJJEDheQAdXWU3gWCeYEagn2ajgLXgT2oalgoRAqVYl2uzSgUCeog8OkYanW5k0NQMMDqsipEgkbzg4MSEDYthAACUYMy6l0MEFcoJGDhZl54IIUdQ+ko6cdBPE4MoCUUJBhycw6jApADmMwKR8hTAMFIwhEAOI1NB2+QAIQwcBwKV10rYHHYAoAknMYottrhcoZsHzWOEMBocI0IAAvaNscI0mpIuN3cWS9iCe4CQSyu5QFpeYalDyXEmsXiMNAg3STWjPCQQOBwNQwTTTBbKXRsn39kONLACm67ZjuDm+kgkTaW1jMN4ukAUAD0WDNFM3ne78AoJAAVgSiRJa5l6xh5SF2xqRRAWUOH5zYvFefyIsLRdLS-KTz7DASq1Hw1DyrOHI7uaviCP4Vo2uujowM6UIOlAzD7Ou7qet6HhmGSFrwfINJqlEjJPiy+FziQjbNvouhwQhB49n2MwqLoNEciw7C5AKv7PmKMpysavpvOEHA3HAOZbMwMQzEsrD6pIZALFgVZFFeVz1omzDag+ej6tI2C9iJrTwMOBGCCK-ERGgzA3H2u6aBixjVrR2Ayq+8gAKK7FgAA+cL5O5PosAuS4kSAaCsGgJDrriVzofIUShooKjcdpWQNE0YCYXUlJFDUsAeu8b6Fh+EIxgKABqxlFrUmxdE61RNY+pU6FBEi8f6E4-mo4gAI5qMZBReKZMl9GokXxMmtTmYBsktahbUddaPx8AIRYYJpNbpNe3DkGoXgtEVHjdLkmicKdrAwLoFZWXOXI8kpAojBKPQ2a0WIPa00oYJghzlgU6JlmF1mtpi372K4rjdX0RHMaRqr0pRorcRIenapaRnlo1miLfAmOCHRTYtkxlqsb2-acdQWXpCAaTJAwuTUOY+BEKQ5BDDQ9AgFDMb4HYTNAA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

Target support varies because each AI platform exposes a different native contract. PromptScript
preserves one source model while formatters map supported capabilities to target-native output.
Use the [target platform matrix](target-platforms.md) to choose versions and capabilities.

## Explore Features

- [Agents](agents.md) - specialized subagents, models, tools, skills, and MCP access
- [Skills and Resources](skills.md) - portable capability packages with references and scripts
- [MCP and Plugins](integrations.md) - tool servers and reusable capability bundles
- [Hooks and Workflows](automation.md) - lifecycle automation and repeatable procedures
- [Target Platforms](target-platforms.md) - 50 built-in targets and output families

## Compile One or Many Projects

Compile configured targets:

```bash
prs compile
```

Use named builds when one repository hosts several packages or apps and each needs its own agent
configuration. Every build has its own entry file, output directory, and target list, so
`packages/api` and `packages/web` each get files scoped to their subtree. Define them in
`promptscript.yaml` (see the [Configuration Reference](../reference/config.md)):

```yaml
builds:
  api:
    entry: .promptscript/packages/api.prs
    output: packages/api
    targets:
      - factory
      - codex
  web:
    entry: .promptscript/packages/web.prs
    output: packages/web
    targets:
      - cursor:
          version: full
```

```bash
prs compile --all-builds
```

## Enterprise Control Plane

PromptScript applies the same lifecycle to every agent capability:

1. Store source in Git.
2. Resolve organization, team, and project layers.
3. Validate syntax, references, policies, and target options.
4. Compile deterministic target-native output.
5. Review generated changes in pull requests.
6. Enforce `prs validate --strict` and compilation checks in CI.

See [Enterprise Setup](../guides/enterprise.md), [Security](../guides/security.md),
[Policy Engine](../guides/policy-engine.md), and [CI/CD Integration](../guides/ci.md) for the
pipeline that enforces it.
