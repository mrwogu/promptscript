---
title: Examples
description: PromptScript configuration examples
---

# Examples

Real-world PromptScript configuration examples.

## Choose by Goal

### Start Here

| Goal                          | Example                                                     |
| ----------------------------- | ----------------------------------------------------------- |
| Compile first project         | [Minimal](minimal.md)                                       |
| Roll out a production service | [Real-Life Checkout Service](real-life-checkout-service.md) |
| Adopt existing instructions   | [Migration Guide](../guides/migration.md)                   |
| Upgrade PromptScript 1.15     | [Upgrade 1.15 to 1.16](../guides/upgrade-1-15-to-1-16.md)   |

### Understand Language

| Goal                                     | Example                                             |
| ---------------------------------------- | --------------------------------------------------- |
| Resolve composition step by step         | [Composition and Order](composition-and-order.md)   |
| Choose additive or replacement operation | [Merge vs Replace](merge-vs-replace.md)             |
| Fix canonical block shape warnings       | [Fix Block Shape Warnings](fix-block-shapes.md)     |
| Customize generated section titles       | [Custom Section Headers](custom-section-headers.md) |

### Automate Agents

| Goal                                              | Example                                           |
| ------------------------------------------------- | ------------------------------------------------- |
| Define portable lifecycle policy                  | [Portable Hooks](portable-hooks.md)               |
| Move legacy Factory hooks safely                  | [Migrate Factory Hooks](migrate-factory-hooks.md) |
| Combine skills, agents, MCP, hooks, and workflows | [Agent Platform](agent-platform.md)               |
| Define specialized workers                        | [Agents](agents.md)                               |

### Scale Organization

| Goal                                   | Example                                        |
| -------------------------------------- | ---------------------------------------------- |
| Share team configuration               | [Team Setup](team-setup.md)                    |
| Govern organization-wide configuration | [Enterprise](enterprise.md)                    |
| Pin remote sources                     | [Git Registry](git-registry.md)                |
| Package reusable capabilities          | [Skills and Local Memory](skills-and-local.md) |

## Complete Examples

<div class="ref-list">

<a href="real-life-checkout-service/" class="ref-item">
  <div class="ref-item__icon ref-item__icon--green">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M7 4V2h10v2h3a1 1 0 0 1 1 1v4H3V5a1 1 0 0 1 1-1zm14 7v8a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-8h7v2h4v-2z"/></svg>
  </div>
  <div class="ref-item__content">
    <h3>Real-Life Checkout Service</h3>
    <p>End-to-end production rollout with composition, native agents, safe takeover, CI drift checks, and rollback.</p>
  </div>
  <div class="ref-item__arrow">→</div>
</a>

<a href="minimal/" class="ref-item">
  <div class="ref-item__icon ref-item__icon--green">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zm4 18H6V4h7v5h5z"/></svg>
  </div>
  <div class="ref-item__content">
    <h3>Minimal</h3>
    <p>The simplest possible PromptScript configuration - just the essentials.</p>
  </div>
  <div class="ref-item__arrow">→</div>
</a>

<a href="team-setup/" class="ref-item">
  <div class="ref-item__icon ref-item__icon--blue">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M16 17v2H2v-2s0-4 7-4s7 4 7 4m-3.5-9.5A3.5 3.5 0 1 0 9 11a3.5 3.5 0 0 0 3.5-3.5m3.44 5.5A5.32 5.32 0 0 1 18 17v2h4v-2s0-3.63-6.06-4M15 4a3.39 3.39 0 0 0-1.93.59a5 5 0 0 1 0 5.82A3.39 3.39 0 0 0 15 11a3.5 3.5 0 0 0 0-7z"/></svg>
  </div>
  <div class="ref-item__content">
    <h3>Team Setup</h3>
    <p>Multi-project setup with shared team configuration and standards.</p>
  </div>
  <div class="ref-item__arrow">→</div>
</a>

<a href="enterprise/" class="ref-item">
  <div class="ref-item__icon ref-item__icon--amber">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M18 15h-2v2h2m0-6h-2v2h2m2 6h-8v-2h2v-2h-2v-2h2v-2h-2V9h8M10 7H8V5h2m0 6H8V9h2m0 6H8v-2h2m0 6H8v-2h2M6 7H4V5h2m0 6H4V9h2m0 6H4v-2h2m0 6H4v-2h2m6-10V3H2v18h20V7z"/></svg>
  </div>
  <div class="ref-item__content">
    <h3>Enterprise</h3>
    <p>Full enterprise deployment with governance, private registries, and compliance.</p>
  </div>
  <div class="ref-item__arrow">→</div>
</a>

<a href="skills-and-local/" class="ref-item">
  <div class="ref-item__icon ref-item__icon--purple">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2M7.5 13A2.5 2.5 0 0 0 5 15.5A2.5 2.5 0 0 0 7.5 18a2.5 2.5 0 0 0 2.5-2.5A2.5 2.5 0 0 0 7.5 13m9 0a2.5 2.5 0 0 0-2.5 2.5a2.5 2.5 0 0 0 2.5 2.5a2.5 2.5 0 0 0 2.5-2.5a2.5 2.5 0 0 0-2.5-2.5z"/></svg>
  </div>
  <div class="ref-item__content">
    <h3>Skills & Local</h3>
    <p>Advanced AI skills and private local memory for specialized workflows.</p>
  </div>
  <div class="ref-item__arrow">→</div>
</a>

<a href="agent-platform/" class="ref-item">
  <div class="ref-item__icon ref-item__icon--green">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M4 4h6v6H4zm10 0h6v6h-6zM4 14h6v6H4zm10 0h6v6h-6zM10 6h4v2h-4zm-4 4h2v4H6zm10 0h2v4h-2zm-6 6h4v2h-4z"/></svg>
  </div>
  <div class="ref-item__content">
    <h3>Agent Platform</h3>
    <p>Runnable examples for MCP, hooks, workflows, plugins, field replacement, skills, and build profiles.</p>
  </div>
  <div class="ref-item__arrow">→</div>
</a>

<a href="agents/" class="ref-item">
  <div class="ref-item__icon ref-item__icon--cyan">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M17.753 14a2.25 2.25 0 0 1 2.25 2.25v.904A3.75 3.75 0 0 1 18.696 20c-1.565 1.344-3.806 2-6.696 2s-5.128-.656-6.69-2a3.75 3.75 0 0 1-1.306-2.843v-.907A2.25 2.25 0 0 1 6.254 14zM12 2a5 5 0 1 1 0 10a5 5 0 0 1 0-10z"/></svg>
  </div>
  <div class="ref-item__content">
    <h3>Agents</h3>
    <p>Define portable AI subagents with custom tools, models, skills, and MCP access.</p>
  </div>
  <div class="ref-item__arrow">→</div>
</a>

<a href="git-registry/" class="ref-item">
  <div class="ref-item__icon ref-item__icon--orange">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M2.6 10.59L8.38 4.8l1.69 1.7c-.24.85.15 1.78.93 2.23v5.54c-.6.34-1 .99-1 1.73a2 2 0 0 0 2 2a2 2 0 0 0 2-2c0-.74-.4-1.39-1-1.73V9.41l2.07 2.09c-.07.15-.07.32-.07.5a2 2 0 0 0 2 2a2 2 0 0 0 2-2a2 2 0 0 0-2-2c-.18 0-.35 0-.5.07L13.93 8.5a1.99 1.99 0 0 0-1.15-2.34c-.12-.05-.25-.08-.38-.12L11.03 4.8 11.35 4.47c.39-.39 1.02-.39 1.41 0l8.59 8.59c.39.39.39 1.02 0 1.41l-8.59 8.59c-.39.39-1.02.39-1.41 0l-8.59-8.59c-.39-.39-.39-1.02 0-1.41z"/></svg>
  </div>
  <div class="ref-item__content">
    <h3>Git Registry</h3>
    <p>Use Git repositories as shared registries with version control and authentication.</p>
  </div>
  <div class="ref-item__arrow">→</div>
</a>

</div>

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
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAIkxYYABMAA6rQYIgATRIJEgSATwC0NZgCsYjLPLES4i9hkKz5ARgoA2CgAZdrAL5ix3aZywQsi4Xrkhd-uKCAJrMAK6CGNQwkYI4MFBoYGFQgixSEKwA5pFwcBBwAuwUvgH2TqwucDjM1FiMYVhwPkHyAPTxifKmIADKNQDukQBuGNAYAEawacwkJBisUnDlIA4Augzu1Ir4RKTkMFS0IAzDMLQQbPhmq0A" target="_blank" rel="noopener noreferrer">
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
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAIkxYYABMAA6rQYIgATRIJEhqMDIywBaDGjTyxEuAE92GQrPkBGCgDYKABm2sAvmLHdpnLBCx7hOuSG1-xQQBNZgBXQQxFCMEAJSUVQSI0GGosQThkxggMKAgALwhWAHNJcRJmKRTxABU9ZIBlRmoINDSNcghGbAg2OAoffztHVmcWdiI00UCwalIYAHdmagBrExA45TTTAA47CSgMYtCMIpg12oamlqw99M9c4vOMaHnCqQBhevrbjjh3R98ADUPPA0gBqQTVUGFEoAGQgACNZtQ9EMnKxuH9DlJIlI4N5AixKrJkD4JPIAKpwGCCMChVgqHqsHKCFhkNhufGvXCCHDMZjLODyOhk3wbBIARVCKS8YCW6RSADcUndsDA6IIAFqhLGsKS0+WMXJuYWiynUyHPKCvPWCULuXKeVkHODU-Fy6h3PQPIq3AC6YmGzjgfNSjHt+Km5JAAHo2WgOex5Gt3oo1dFWAtYvE0vHEzcAtGY3yBcnfKmlBxouG-swSLz+ctbvIY78C2sAOrNKt5zPsQRtoUBewgex+hhuFH4IikcgwKi0EAMZW0Jn4UyjoA" target="_blank" rel="noopener noreferrer">
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
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAIkxYYABMAA6rQYIgATRIJEgMaCAFo4MagDcIjGPLES4AT3YZCs+QEYKANgoAGPawC+Ysd2mcsELIeH65IHqB4oIAmswAroIY1DDRggBGGIwA1pxSgkRo6liJEdBSEKwA5oIASgCiAMoAKmARUIIAggAKAJJwggDu3jiCAHLMUjAUAFZwFP5Bji6sbizsRLmiIdQR7BB85iCDw2OdAEwOwRJg1KQwXczUKdsVhDTwcI4SUtgYSWrbLcxwWMWxKoARQAMi9BNcSN9qBA4CQMDNXKxuH8MKw3tQpJ0VhJFBBZMh-BJ5ABVNSCEllEGCTC4QQadRwCBsIrFeR0IkBAAizEYET47G6vUEAHlsqxWm1BABmezszmk8kAKQA6jVBGBrtEIrhPNpsMy5idBABdJGvd6fGAEhUgMlxEgQAEGtidTXUQRwRg4GDwwTetHFeDykLEu3krDnVhwZJeV0arUkBpeVQcNAQ7LnOPR8Fm5xI7ixP4wxjZ7H+ZQBfowBkerK-OJFDjUVgYRrqajXTpYZj+qAQTzPY2V+RNKBdDCGToaNvSbBxWIARwi8FyCSGhnBI52NfUnp7sRpUAwRWUHEIuUwcDgV0xQ7EszccBw1ywfKw5ZC8gA9Ok0Mwm3kbYuXgJ1xCEVhLmadpMnRf9AONH9HWdbMgICABhWJ53iN4BCtQRkKzQ1wR-Dg-jQ+QVRhDhoKlMiPxmEAnBNBhPGoQx8CIUhyBGGh6BAWsmTYfALCYoA" target="_blank" rel="noopener noreferrer">
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
