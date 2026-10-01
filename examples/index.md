# Examples

Real-world PromptScript configuration examples.

## Choose by Goal

### Start Here

| Goal                          | Example                                                     |
| ----------------------------- | ----------------------------------------------------------- |
| Compile first project         | [Minimal](https://getpromptscript.dev/examples/minimal/index.md)                                       |
| Roll out a production service | [Real-Life Checkout Service](https://getpromptscript.dev/examples/real-life-checkout-service/index.md) |
| Adopt existing instructions   | [Migration Guide](https://getpromptscript.dev/guides/migration/index.md)                   |
| Upgrade PromptScript 1.15     | [Upgrade 1.15 to 1.16](https://getpromptscript.dev/guides/upgrade-1-15-to-1-16/index.md)   |

### Understand Language

| Goal                                     | Example                                             |
| ---------------------------------------- | --------------------------------------------------- |
| Resolve composition step by step         | [Composition and Order](https://getpromptscript.dev/examples/composition-and-order/index.md)   |
| Choose additive or replacement operation | [Merge vs Replace](https://getpromptscript.dev/examples/merge-vs-replace/index.md)             |
| Fix canonical block shape warnings       | [Fix Block Shape Warnings](https://getpromptscript.dev/examples/fix-block-shapes/index.md)     |
| Customize generated section titles       | [Custom Section Headers](https://getpromptscript.dev/examples/custom-section-headers/index.md) |

### Automate Agents

| Goal                                              | Example                                           |
| ------------------------------------------------- | ------------------------------------------------- |
| Define portable lifecycle policy                  | [Portable Hooks](https://getpromptscript.dev/examples/portable-hooks/index.md)               |
| Move legacy Factory hooks safely                  | [Migrate Factory Hooks](https://getpromptscript.dev/examples/migrate-factory-hooks/index.md) |
| Combine skills, agents, MCP, hooks, and workflows | [Agent Platform](https://getpromptscript.dev/examples/agent-platform/index.md)               |
| Define specialized workers                        | [Agents](https://getpromptscript.dev/examples/agents/index.md)                               |

### Scale Organization

| Goal                                   | Example                                        |
| -------------------------------------- | ---------------------------------------------- |
| Share team configuration               | [Team Setup](https://getpromptscript.dev/examples/team-setup/index.md)                    |
| Govern organization-wide configuration | [Enterprise](https://getpromptscript.dev/examples/enterprise/index.md)                    |
| Pin remote sources                     | [Git Registry](https://getpromptscript.dev/examples/git-registry/index.md)                |
| Package reusable capabilities          | [Skills and Local Memory](https://getpromptscript.dev/examples/skills-and-local/index.md) |

## Complete Examples

- [Real-Life Checkout Service](https://getpromptscript.dev/examples/real-life-checkout-service/index.md): End-to-end production rollout with composition, native agents, safe takeover, CI drift checks, and rollback.
- [Minimal](https://getpromptscript.dev/examples/minimal/index.md): The simplest possible PromptScript configuration - just the essentials.
- [Team Setup](https://getpromptscript.dev/examples/team-setup/index.md): Multi-project setup with shared team configuration and standards.
- [Enterprise](https://getpromptscript.dev/examples/enterprise/index.md): Full enterprise deployment with governance, private registries, and compliance.
- [Skills & Local](https://getpromptscript.dev/examples/skills-and-local/index.md): Advanced AI skills and private local memory for specialized workflows.
- [Agent Platform](https://getpromptscript.dev/examples/agent-platform/index.md): Runnable examples for MCP, hooks, workflows, plugins, field replacement, skills, and build profiles.
- [Agents](https://getpromptscript.dev/examples/agents/index.md): Define portable AI subagents with custom tools, models, skills, and MCP access.
- [Git Registry](https://getpromptscript.dev/examples/git-registry/index.md): Use Git repositories as shared registries with version control and authentication.

## Quick Examples

### Basic Project

```promptscript
@meta {
  id: "my-project"
  syntax: "1.5.0"
}

@identity {
  """
  You are a helpful coding assistant.
  """
}

@shortcuts {
  "/help": "Show available commands"
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAIkxYYABMAA6rQYIgATRIJEgSATwC0NZgCsYjLPLES4i9hkKz5ARgoBWCgAZdrAL5ix3aZywQsi4Xrkhd-uKCAJrMAK6CGNQwkYI4MFBoYGFQgixSEKwA5pFwcBBwAuwUvgH2TqwucDjM1FiMYVhwPkHyAPTxifKmIADKNQDukQBuGNAYAEawacwkJBisUnDlIA4Augzu1Ir4RKTkMFS0IAzDMLQQbPhmq0A" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

### React Project

```promptscript
@meta {
  id: "react-app"
  syntax: "1.5.0"
}

@identity {
  """
  You are a React expert specializing in modern TypeScript applications.
  """
}

@context {
  framework: "React 18"
  language: "TypeScript"
  styling: "TailwindCSS"
  testing: "Vitest + Testing Library"
}

@standards {
  code: [
    "Use functional components with hooks",
    "React Query for server state, Zustand for client",
    "Use Tailwind utility classes for styling"
  ]
}

@shortcuts {
  "/component": "Create a new React component"
  "/hook": "Create a custom hook"
  "/test": "Write component tests"
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAIkxYYABMAA6rQYIgATRIJEhqMDIywBaDGjTyxEuAE92GQrPkBGCgFYKABm2sAvmLHdpnLBCx7hOuSG1-xQQBNZgBXQQxFCMEAJSUVQSI0GGosQThkxggMKAgALwhWAHNJcRJmKRTxABU9ZIBlRmoINDSNcghGbAg2OAoffztHVmcWdiI00UCwalIYAHdmagBrExA45TTTAA47CSgMYtCMIpg12oamlqw99M9c4vOMaHnCqQBhevrbjjh3R98ADUPPA0gBqQTVUGFEoAGQgACNZtQ9EMnKxuH9DlJIlI4N5AixKrJkD4JPIAKpwGCCMChVgqHqsHKCFhkNhufGvXCCHDMZjLODyOhk3wbBIARVCKS8YCW6RSADcUndsDA6IIAFqhLGsKS0+WMXJuYWiynUyHPKCvPWCULuXKeVkHODU-Fy6h3PQPIq3AC6YmGzjgfNSjHt+Km5JAAHo2WgOex5Gt3oo1dFWAtYvE0vHEzcAtGY3yBcnfKmlBxouG-swSLz+ctbvIY78C2sAOrNKt5zPsQRtoUBewgex+hhuFH4IikcgwKi0EAMZW0Jn4UyjoA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

### API Service

```promptscript
@meta {
  id: "api-service"
  syntax: "1.5.0"
}

@identity {
  """
  You are a backend expert building RESTful APIs with Node.js.
  """
}

@context {
  runtime: "Node.js 20"
  framework: "Express"
  database: "PostgreSQL"
  orm: "Prisma"
}

@standards {
  api: [
    "Use URL path versioning",
    "Document with OpenAPI 3.0",
    "Use JWT for authentication"
  ]

  database: [
    "Use migrations for schema changes",
    "Use transactions for multi-step operations"
  ]
}

@restrictions {
  - "Never expose internal errors to clients"
  - "Always validate request body"
  - "Never store plain-text passwords"
}

@shortcuts {
  "/endpoint": "Design a new API endpoint"
  "/migration": "Create a database migration"
  "/test": "Write API tests"
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAIkxYYABMAA6rQYIgATRIJEgMaCAFo4MagDcIjGPLES4AT3YZCs+QEYKAVgoAGPawC+Ysd2mcsELIeH65IHqB4oIAmswAroIY1DDRggBGGIwA1pxSgkRo6liJEdBSEKwA5oIASgCiAMoAKmARUIIAggAKAJJwggDu3jiCAHLMUjAUAFZwFP5Bji6sbizsRLmiIdQR7BB85iCDw2OdAEwOwRJg1KQwXczUKdsVhDTwcI4SUtgYSWrbLcxwWMWxKoARQAMi9BNcSN9qBA4CQMDNXKxuH8MKw3tQpJ0VhJFBBZMh-BJ5ABVNSCEllEGCTC4QQadRwCBsIrFeR0IkBAAizEYET47G6vUEAHlsqxWm1BABmezszmk8kAKQA6jVBGBrtEIrhPNpsMy5idBABdJGvd6fGAEhUgMlxEgQAEGtidTXUQRwRg4GDwwTetHFeDykLEu3krDnVhwZJeV0arUkBpeVQcNAQ7LnOPR8Fm5xI7ixP4wxjZ7H+ZQBfowBkerK-OJFDjUVgYRrqajXTpYZj+qAQTzPY2V+RNKBdDCGToaNvSbBxWIARwi8FyCSGhnBI52NfUnp7sRpUAwRWUHEIuUwcDgV0xQ7EszccBw1ywfKw5ZC8gA9Ok0Mwm3kbYuXgJ1xCEVhLmadpMnRf9AONH9HWdbMgICABhWJ53iN4BCtQRkKzQ1wR-Dg-jQ+QVRhDhoKlMiPxmEAnBNBhPGoQx8CIUhyBGGh6BAWsmTYfALCYoA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

## Configuration Examples

### Basic Config

```yaml
# promptscript.yaml
id: basic-example
syntax: '1.5.0'

input:
  entry: .promptscript/project.prs

targets:
  - github
```

### Full Config (Local Registry)

```yaml
# promptscript.yaml
id: local-registry-example
syntax: '1.5.0'

input:
  entry: .promptscript/project.prs
  include:
    - '.promptscript/**/*.prs'

registry:
  path: ./registry

targets:
  - github:
      output: .github/copilot-instructions.md
  - claude:
      output: CLAUDE.md
  - cursor:
      output: .cursor/rules/project.mdc

watch:
  debounce: 300
```

### Full Config (Git Registry)

```yaml
# promptscript.yaml
id: git-registry-example
syntax: '1.5.0'

input:
  entry: .promptscript/project.prs

registry:
  git:
    url: https://github.com/your-org/promptscript-registry.git
    ref: v1.0.0
    auth:
      type: token
      tokenEnvVar: GITHUB_TOKEN
  cache:
    enabled: true
    ttl: 3600000

targets:
  - github
  - claude
  - cursor
```