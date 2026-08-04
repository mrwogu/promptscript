# Agent Platform Examples

These examples cover core agent-platform capabilities. Open the [Playground](/playground/) and choose **Complete Agent Platform** or **Regular Field Replacement** to compile the same examples in your browser.

PromptScript 1.16 task examples:

| Task                            | Example                                                                                            |
| ------------------------------- | -------------------------------------------------------------------------------------------------- |
| Predict composition results     | [Composition and Order](https://getpromptscript.dev/dev/examples/composition-and-order/index.md)   |
| Choose merge or replacement     | [Merge vs Replace](https://getpromptscript.dev/dev/examples/merge-vs-replace/index.md)             |
| Fix PS038 shape warnings        | [Fix Block Shape Warnings](https://getpromptscript.dev/dev/examples/fix-block-shapes/index.md)     |
| Customize generated titles      | [Custom Section Headers](https://getpromptscript.dev/dev/examples/custom-section-headers/index.md) |
| Build portable lifecycle policy | [Portable Hooks](https://getpromptscript.dev/dev/examples/portable-hooks/index.md)                 |

## Complete Agent Platform

This syntax 1.6 example connects reusable skills, MCP tools, a specialist agent, lifecycle automation, a release workflow, and a plugin bundle:

```
@meta {
  id: "checkout-agent-platform"
  syntax: "1.6.0"
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

The references between blocks are validated before output is generated:

- The `reviewer` agent preloads `security-review` and receives access to `issue-tracker`.
- The plugin groups the skill, hook, and MCP server as one capability bundle.
- Rich target modes emit native agent, skill, MCP, hook, workflow, and plugin files where supported.

Use full target modes to generate native capability files:

```yaml
id: checkout-agent-platform
syntax: '1.6.0'

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

Syntax 1.3 introduced `field!: value` inside regular `@extend` blocks. Marked fields replace their complete previous value, while unmarked fields retain normal merge behavior:

For new syntax 1.6 projects, prefer `@override` when replacing a complete existing target. See [Merge vs Replace](https://getpromptscript.dev/dev/examples/merge-vs-replace/index.md).

```
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

The resolved standards use only the new `testing` and `deployment` values. The `linting` array contains both entries because it was not marked for replacement.

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

- [Agent Platform](https://getpromptscript.dev/dev/features/index.md)
- [Agents](https://getpromptscript.dev/dev/features/agents/index.md)
- [Skills and Resources](https://getpromptscript.dev/dev/features/skills/index.md)
- [MCP Servers and Plugins](https://getpromptscript.dev/dev/features/integrations/index.md)
- [Hooks and Workflows](https://getpromptscript.dev/dev/features/automation/index.md)
- [Configuration Reference](https://getpromptscript.dev/dev/reference/config/#builds)
