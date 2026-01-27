---
title: Examples
description: PromptScript configuration examples
---

# Examples

Real-world PromptScript configuration examples.

<div class="feature-grid" markdown>

<div class="feature-card" markdown>
### :material-file-outline: Minimal
The simplest possible PromptScript configuration.

[Minimal Example →](minimal.md)

</div>

<div class="feature-card" markdown>
### :material-account-group: Team Setup
Multi-project setup with shared team configuration.

[Team Setup →](team-setup.md)

</div>

<div class="feature-card" markdown>
### :material-office-building: Enterprise
Full enterprise deployment with governance.

[Enterprise Example →](enterprise.md)

</div>

<div class="feature-card" markdown>
### :material-robot: Skills & Local
Advanced AI skills and private local memory.

[Skills & Local →](skills-and-local.md)

</div>

<div class="feature-card" markdown>
### :material-robot-outline: Claude Agents
Define specialized AI subagents for Claude Code.

[Agents Example →](agents.md)

</div>

<div class="feature-card" markdown>
### :material-git: Git Registry
Use Git repositories as shared registries with version control.

[Git Registry →](git-registry.md)

</div>

</div>

## Quick Examples

### Basic Project

```promptscript
@meta {
  id: "my-project"
  syntax: "1.0.0"
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

### React Project

```promptscript
@meta {
  id: "react-app"
  syntax: "1.0.0"
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
    "Use functional components with hooks"
    "React Query for server state, Zustand for client"
    "Use Tailwind utility classes for styling"
  ]
}

@shortcuts {
  "/component": "Create a new React component"
  "/hook": "Create a custom hook"
  "/test": "Write component tests"
}
```

### API Service

```promptscript
@meta {
  id: "api-service"
  syntax: "1.0.0"
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
    "Use URL path versioning"
    "Document with OpenAPI 3.0"
    "Use JWT for authentication"
  ]

  database: [
    "Use migrations for schema changes"
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

## Configuration Examples

### Basic Config

```yaml
# promptscript.yaml
input:
  entry: .promptscript/project.prs

targets:
  github:
    enabled: true
```

### Full Config (Local Registry)

```yaml
# promptscript.yaml
input:
  entry: .promptscript/project.prs
  include:
    - '.promptscript/**/*.prs'

registry:
  path: ./registry

targets:
  github:
    enabled: true
    output: .github/copilot-instructions.md
  claude:
    enabled: true
    output: CLAUDE.md
  cursor:
    enabled: true
    output: .cursorrules

validation:
  strict: true

watch:
  debounce: 300
```

### Full Config (Git Registry)

```yaml
# promptscript.yaml
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

validation:
  strict: true
```

## Browse All Examples

- [Minimal](minimal.md) - Single file, basic setup
- [Team Setup](team-setup.md) - Shared configuration across projects
- [Enterprise](enterprise.md) - Organization-wide deployment
- [Skills & Local](skills-and-local.md) - Advanced AI skills and private instructions
- [Git Registry](git-registry.md) - Version-controlled shared registries
