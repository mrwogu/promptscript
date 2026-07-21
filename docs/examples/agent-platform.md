---
title: Agent Platform Examples
description: Runnable examples for agent integrations, automation, plugins, field replacement, portable skills, and monorepo builds.
---

# Agent Platform Examples

These examples cover the agent-platform capabilities added after PromptScript 1.13.2. Open the
[Playground](/playground/) and choose **Complete Agent Platform** or
**Regular Field Replacement** to compile the same examples in your browser.

## Complete Agent Platform

This syntax 1.4 example connects reusable skills, MCP tools, a specialist agent, lifecycle
automation, a release workflow, and a plugin bundle:

```promptscript
@meta {
  id: "checkout-agent-platform"
  syntax: "1.4.0"
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
    content: """
      Inspect authentication, authorization, secrets, and payment data handling.
      Report findings by severity and include concrete remediation steps.
    """
  }
}

@mcpServers {
  issue-tracker: {
    transport: "stdio"
    command: ["node", "./tools/issues.mjs"]
    timeoutMs: 30000
  }
}

@agents {
  reviewer: {
    description: "Review changes before merge"
    tools: ["Read", "Grep", "Glob", "Bash"]
    model: "sonnet"
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
    timeoutMs: 120000
    statusMessage: "Checking TypeScript"
  }
}

@workflows {
  release: {
    description: "Validate and prepare a release"
    content: """
      1. Review changes since the previous release
      2. Run formatting, linting, type checks, and tests
      3. Summarize changes and prepare release metadata
      4. Stop before publishing and request approval
    """
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
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAIkxYYABMAA6rQYIgATRIJFMcMRgGtmAVywBaDAHNOW8tjDNqJeWIlwAnuwyFZ8gIwUALBQAM58YIE64s5HlMKz52OHk6ORAsKzR4RmoINCx5AF0xAF8xMW5pfQgY4Qso8xBigE11QQxqGEEAdxNlCFYdQTZqwWDQrEE4GGoANwhGGApigAVa-qG6rGoMVjgMRiwIDpaOHUTCxalqtSkCjAAjaAKrce9SryzWHLgBVikaqTgi7xYpGAD5AFV+n15iNegAVWIwADKCSSKRAkXkAHUdnN4Fh3sZqIITmo4C14O9qGpYOEQOlWHcHs0oFB3qJvP1GGodlZNLVhjB6rJ6RIJN84DDkutWA4QAAlGAc+pdDAhfSCRg4RZ6DEmPpKZkXQSJODKUnFCQYGnMeowKSg5jMWm-cUwDBSCJRADitTQjvkACEMHAcGkDQq2Bx2KKbt5eYIAJJLOKrA64fKMbDCyIYDQ4EwQABeSbYkUZtXRKeeMrl7EELwEgiVzygLR0V3DEglaBMvUgzzr7xOVnVgwGWr2klYjCghzqLGHBbqtT4Rxz4keMDQcAbvJuZW8d0prF4jDQkIGfdoHwkEDgcDUME08xWygG3P9N+jrdFjyOzC84ZYJBIextrGYb53RACgAHosEtWlQLPC94AoEgACtSXJcM1j4dQsAAWX8QQAGZ3AIzxN0ybId10fQ6WKdkIE5e8T15flBTWNhRQlKUFWrFVsRgTE6j4ag9E-XkIKtHDAlte1gJdJcpKgZgTmAr0fT9MNBBIQCYCgV82FYfghMsalrUEcTGU1GI2UlGj6hU8MSD3A9ZloG0YMva8FhUAYbN5CcgywVjLM5DjlTNANvkiDhHjgIt9mYOIFmY1gjUkMgViwcYNwkLdSO4dNmD1ejBiNaRsCvRVgpwnleUlfRRRbR5r0gzRcRgfS1OwRU6PkABRI4sAAH2RAoWoy7zmB-P9jKCVg0DMeEoiJe45vkGIY0UFQvIkNCYAw7DZEcAAmQiiPDR5sFxTCCXI0UAGE1uaVpBHBOJoUSZIhKy+4d0aahlDAOT6ko7xalgb0fnovl4lehLRQANSKis6kHGglxqRHtU0u1+lanyapKMoRvDZxBDYqygtaeA+haUYfEULpqPUQkMdB-0JH2ihibUcRMV-LA1laSJa3YOtwohDilD1aKfDRcJVIkXD2chNRxsSTNx04imkddVH0ZBwE+AECsMBZwQ3EESEILQbjeK6NQTlrH062qYtagAR0vR5qjQGhmEKqB-XXYoPpycg1B0FpAYkbp9E0Tgw90-tWgfVTGKh4VRQmWUekEWP8QTtpE0wM5a0KHEa2G-0jzxFiomcdwPFa3VoCMkyNRZCypQ2qtLT1G1feKjhNDK8nkP9Oz90PAYxPkFyrxvDzqC8rcQAyVIGH0agrHwIhSHIMYaHoEBK+FfBHGXoA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

The references between blocks are validated before output is generated:

- The `reviewer` agent preloads `security-review` and receives access to `issue-tracker`.
- The plugin groups the skill, hook, and MCP server as one capability bundle.
- Rich target modes emit native agent, skill, MCP, hook, workflow, and plugin files where supported.

Use full target modes to generate native capability files:

```yaml
id: checkout-agent-platform
syntax: '1.4.0'

targets:
  - claude:
      version: full
  - cursor:
      version: full
  - factory:
      version: full
  - codex:
      version: full
```

## Regular Field Replacement

Syntax 1.3 introduced `field!: value` inside regular `@extend` blocks. Marked fields replace their
complete previous value, while unmarked fields retain normal merge behavior:

```promptscript
@meta {
  id: "field-replacement"
  syntax: "1.3.0"
}

@identity {
  """
  You are a TypeScript development assistant.
  """
}

@standards {
  testing: ["Use Jest", "Use integration tests"]
  linting: ["Use ESLint"]
  deployment: {
    platform: "Kubernetes"
    regions: ["us-east-1"]
  }
}

@extend standards {
  testing!: ["Use Vitest", "Follow the AAA pattern"]
  linting: ["Run lint checks before commits"]
  deployment!: {
    platform: "Cloud Run"
    regions: ["us-central1", "europe-west1"]
  }
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAIkxYYABMAA6rQYIgATRIJHgIMKFIC01GOQyMYfdvLES4AT3YZCs+QEYKAZgoAGfawC+Ysd2mcsELEeEG5EH0g8UEATWYAV0EMdRjBABUjNBgAZUZqCDQsQSkYADclZjRdHIw4OAg4AXYKAOCnV1Z3aoxWKVipOH9QjmqIVgBzWWR5AFU4GEEAKXgseTpAiamBjkHqbAg2QT6sOHkAXQCoVYHhwVGQZcEAUVSAGVXDgLzyZiNS2VFQiU0sMGY1BIFhAAGlIgAjGDUVj8eBOCQSdSDLasOAjeSROAqGDlLAqSzPUJNJruIgcdqCVrtTrdb4SXZnACEGKuk0EADUfHMFoEAGLMKBQZgAdx2OCmAEFpYJMFgODCiRITuwzqyAEqRcQqnKMCWMADW3ShALiLBIJB8+xAR1Cr2FHy8LJ6iNlUGwpuBgQAwsLIlJBJrmiFXcjUeiLpjsdp2BsoISQIt5DBItRijAVCK5gnbRISSBnAcGF5qEZ8ERSOQYFRaImQIVaKj8JYC0A" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

The resolved standards use only the new `testing` and `deployment` values. The `linting` array
contains both entries because it was not marked for replacement.

## Portable Skill Resources

Directory skills can bundle supporting references, scripts, assets, contracts, and licenses:

```text
.promptscript/skills/security-review/
|-- SKILL.md
|-- LICENSE
|-- references/
|   `-- threat-model.md
|-- scripts/
|   `-- scan.sh
`-- assets/
    `-- report-template.md
```

Declare the bundled files and typed contract in `SKILL.md`:

```yaml
---
name: security-review
description: Review code for application security risks
references:
  - references/threat-model.md
scripts:
  - scripts/scan.sh
inputs:
  path:
    type: string
    description: Path to review
outputs:
  report:
    type: string
    description: Review report
---
Review selected code and use bundled references when evaluating risk.
```

PromptScript preserves the directory structure when emitting native skill packages.

## Monorepo Build Profiles

Named builds compile scoped agent configuration for multiple packages from one repository:

```yaml
builds:
  api:
    entry: .promptscript/api.prs
    output: packages/api
    targets:
      - factory:
          version: full
      - codex:
          version: full
  web:
    entry: .promptscript/web.prs
    output: packages/web
    targets:
      - cursor:
          version: full
```

```bash
prs compile --build api
prs compile --all-builds
```

## Related Documentation

- [Agent Platform](../features/index.md)
- [Agents](../features/agents.md)
- [Skills and Resources](../features/skills.md)
- [MCP Servers and Plugins](../features/integrations.md)
- [Hooks and Workflows](../features/automation.md)
- [Configuration Reference](../reference/config.md#builds)
