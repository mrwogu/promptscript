# Official Registry

The PromptScript Registry is the official collection of reusable configurations for AI assistants. It provides pre-built roles, tech stacks, and best practice fragments that you can inherit or import into your projects.

**Repository:** [github.com/mrwogu/promptscript-registry](https://github.com/mrwogu/promptscript-registry)

## Quick Start

### 1. Configure Registry

Add the registry to your `promptscript.yaml`:

```yaml
registry:
  git:
    url: https://github.com/mrwogu/promptscript-registry.git
    ref: v0.1.0 # Pin to specific version
```

### 2. Inherit Configurations

Use `@inherit` to extend registry configurations:

```promptscript
@meta {
  id: "my-project"
  syntax: "1.0.0"
}

@inherit @roles/developer/fullstack
```

### 3. Pull and Compile

```bash
prs pull     # Download registry files
prs compile  # Generate output
```

## Available Configurations

### Core (`@core/`)

Universal foundations that all other configurations build upon.

| File             | Description                       |
| ---------------- | --------------------------------- |
| `@core/base`     | Universal AI assistant foundation |
| `@core/security` | Security best practices           |
| `@core/quality`  | Code quality standards            |

### Roles (`@roles/`)

Pre-configured AI personas optimized for specific tasks.

#### Developer Roles

| File                         | Description                               |
| ---------------------------- | ----------------------------------------- |
| `@roles/developer/fullstack` | Full-stack developer                      |
| `@roles/developer/frontend`  | Frontend specialist                       |
| `@roles/developer/backend`   | Backend specialist                        |
| `@roles/developer/devops`    | DevOps engineer                           |
| `@roles/developer/dba`       | Database administrator                    |
| `@roles/developer/senior`    | Senior developer with architectural focus |
| `@roles/developer/qa`        | Quality assurance specialist              |

#### Creative Roles

| File                          | Description           |
| ----------------------------- | --------------------- |
| `@roles/creative/writer`      | Creative writer       |
| `@roles/creative/storyteller` | Narrative storyteller |
| `@roles/creative/copywriter`  | Marketing copywriter  |

#### Professional Roles

| File                              | Description           |
| --------------------------------- | --------------------- |
| `@roles/professional/consultant`  | Business consultant   |
| `@roles/professional/coach`       | Professional coach    |
| `@roles/professional/analyst`     | Data/business analyst |
| `@roles/professional/tech-writer` | Technical writer      |

#### Specialist Roles

| File                           | Description             |
| ------------------------------ | ----------------------- |
| `@roles/specialist/teacher`    | Educational instructor  |
| `@roles/specialist/translator` | Language translator     |
| `@roles/specialist/reviewer`   | Content reviewer        |
| `@roles/specialist/terminal`   | Linux terminal emulator |

### Tech Stacks (`@stacks/`)

Framework and language-specific configurations with best practices.

| File             | Description        |
| ---------------- | ------------------ |
| `@stacks/react`  | React + TypeScript |
| `@stacks/vue`    | Vue 3 + TypeScript |
| `@stacks/node`   | Node.js backend    |
| `@stacks/python` | Python development |
| `@stacks/rust`   | Rust development   |
| `@stacks/go`     | Go development     |

### Fragments (`@fragments/`)

Reusable configuration blocks that can be imported with `@use`.

| File                         | Description                    |
| ---------------------------- | ------------------------------ |
| `@fragments/testing`         | Testing standards and patterns |
| `@fragments/documentation`   | Documentation guidelines       |
| `@fragments/git-conventions` | Git workflow conventions       |
| `@fragments/code-review`     | Code review guidelines         |
| `@fragments/accessibility`   | Web accessibility (WCAG)       |

## Usage Patterns

### Inherit a Role

Best for adopting a complete persona:

```promptscript
@meta {
  id: "my-project"
  syntax: "1.0.0"
}

@inherit @roles/developer/fullstack

@context {
  # Add project-specific context
  project: "E-commerce Platform"
}
```

### Use a Tech Stack

Tech stacks inherit from roles and add framework specifics:

```promptscript
@meta {
  id: "react-app"
  syntax: "1.0.0"
}

@inherit @stacks/react
```

### Import Fragments

Use `@use` to merge fragment blocks directly into your file:

```promptscript
@meta {
  id: "my-project"
  syntax: "1.0.0"
}

@inherit @core/base
@use @fragments/testing        # Merges testing standards
@use @fragments/code-review    # Merges code review guidelines

@identity {
  """
  Custom identity for my project.
  """
}
```

Fragments are merged into your file - their `@standards`, `@restrictions`, etc. become part of your configuration.

### Combine Multiple Sources

```promptscript
@meta {
  id: "enterprise-app"
  syntax: "1.0.0"
}

@inherit @stacks/react
@use @fragments/accessibility
@use @fragments/git-conventions

@context {
  company: "Acme Corp"
  compliance: [soc2, gdpr]
}
```

## Version Pinning

Always pin to a specific version for stability:

```yaml
# promptscript.yaml
registry:
  git:
    url: https://github.com/mrwogu/promptscript-registry.git
    ref: v0.1.0 # Recommended: pin to version tag
```

Available refs:

- `v0.1.0`, `v0.2.0`, etc. - Stable releases (recommended)
- `main` - Latest development (may change)

## Contributing

Want to add configurations to the registry?

1. Fork [promptscript-registry](https://github.com/mrwogu/promptscript-registry)
2. Add your configuration in the appropriate namespace
3. Ensure `@meta.id` matches the file path
4. Submit a pull request

See the [registry README](https://github.com/mrwogu/promptscript-registry#contributing) for guidelines.
