---
title: Build Your Registry - PromptScript
description: Learn how to create and manage PromptScript registries for your organization, with self-service registry commands and decentralized architecture.
---

# Build Your Registry

PromptScript supports registries - collections of reusable configurations that can be inherited across projects. Each organization creates and manages their own registry, giving full control over AI instruction standards.

## Quick Start

### 1. Create a Registry

```bash
prs registry init my-company-registry
```

This scaffolds a complete registry with starter configurations. See [Creating a Registry](#creating-a-registry) for details.

### 2. Configure Your Project

Add to your `promptscript.yaml`:

```yaml
registry:
  git:
    url: https://github.com/your-org/your-registry.git
    ref: main # Or pin to version: v1.0.0
```

### 2. Inherit Configurations

```promptscript
@meta {
  id: "my-project"
  syntax: "1.0.0"
}

@inherit @stacks/react
@use @fragments/testing
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAIkxYYABMAA6rQYIgATRIJEgSATwC0NZgCsYjLPLES4i9hkKz5ARgoAGK7tYBfMWIDEg7hFY4Y1CFldwBjADWcAD01DAY2hIuABThAOYQ-tSKgsqCUkkYAEawUoJgzNSC5BiK8dTMAK6sUgCUzq5VcDCuYNQY8XzsoRz+7vHRgnEwicmp6ZlwOXkFRSVQZRXVtXUgdgC6DJxYKfhEpOQwVLQgDABuXnAQbPhm60A" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

### 3. Compile

```bash
prs compile  # Automatically fetches registry and generates output
```

**Note:** When using a Git registry, the CLI automatically clones and caches the repository. You don't need to run `prs pull` separately - the `compile` and `validate` commands handle this automatically.

The registry is cached at `~/.promptscript/.cache/git/` with a default TTL of 1 hour. Use `prs pull --refresh` to force an update.

## Using `prs init`

The `prs init` command can connect to your registry and suggest configurations:

```bash
prs init
```

It will:

1. Detect your tech stack (React, Node, Python, etc.)
2. Offer to connect to a Git or local registry
3. Suggest relevant configurations from your registry's catalog
4. Generate your `promptscript.yaml` and `.promptscript/project.prs`

You can also set a default registry via [user-level config](./user-config.md) so `prs init --yes` automatically uses it.

## Usage Patterns

### Pattern 1: Inherit a Tech Stack

```promptscript
@meta { id: "react-app" syntax: "1.0.0" }

@inherit @stacks/react
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAIkxYYABMEEQAJokEAdENRgZGWALQY0aGYLgBPdhkKSZARgoAGUxoC+U1tYDEg7hFY4Y1CFgdwBjANZwA9HIKHoL2ABRyAOYQXtRagkqCYjEYAEawYoJgzNSC5BhakdTMAK6sYgCUIBYAugycWHH4RKTkMFS0IAwAbq5wEGz4htVAA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

### Pattern 2: Mix in Fragments

```promptscript
@meta { id: "secure-app" syntax: "1.0.0" }

@inherit @stacks/node
@use @fragments/testing
@use @fragments/security/owasp-security-review
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAIkxYYABMEEQAJokEAdEHBiMArtRgBaDGjQzBcAJ7sMhSTICMFAAzmtAXymtbAYkHcIrHDGoQsTuAMYBrOAB6VmYxGEFBRwAKZQBzCB9qHUEVQTEEjAAjWDFBMGZqQXIMHVjqZgVWMQBKBycFOScwagxYvnYgjh8XWIjouISsJJS0jOyYXPzC4tLyypq67gbw7mbW9qwguUUPLB1A5gB3DDg0FW2lTx0VZQA3CBhDvsEYmHjE5NT0uCycvIKilASmUKlVqiArABdBicIY6fBEUjkGBUWggBi3dxwCBsfDGCFAA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

### Pattern 3: Use Prompts Directly

```promptscript
@meta { id: "terminal" syntax: "1.0.0" }

@inherit @prompts/coding/linux-terminal
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAIkxYYABMEEQAJokEAdEB2okIrDFBmC4AT3YZCkmQEYKABiOqAvlNYWAxIO6KcMahCy2azMljgB6FmMUBzLyhFAFdCAFo5BSUoQUEbAApqGH8IOCxqdUFwwT84DAAjWDFBMGZqQXIMdX9qZhDWMQBKEFMAXQZODPV8IlJyGCpaEAYAN0c4CDZ8PVagA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

## How Git Registry Resolution Works

When you configure a Git registry, the CLI handles everything automatically:

1. **On first use:** The registry is cloned to `~/.promptscript/.cache/git/<hash>/`
2. **On subsequent uses:** The cached version is used if not stale (default: 1 hour TTL)
3. **On cache expiry:** The registry is updated with `git fetch`

```
prs init --yes
    ↓
Creates config with registry.git.url

prs compile
    ↓
resolveRegistryPath() → checks cache validity
    ↓
If stale/missing: GitRegistry.fetch() → clone/update
    ↓
Compiler uses cached registry path
```

### Cache Configuration

Control caching behavior in `promptscript.yaml`:

```yaml
registry:
  git:
    url: https://github.com/your-org/your-registry.git
    ref: main
  cache:
    enabled: true # Set to false to always fetch
    ttl: 3600000 # Cache TTL in ms (default: 1 hour)
```

### Force Refresh

```bash
prs pull --refresh  # Force re-clone the registry
```

## Version Pinning

Pin to a specific version for stability:

```yaml
registry:
  git:
    ref: v1.0.0
```

Or in `.prs` files:

```promptscript
@inherit @stacks/react@1.0.0
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gMQAEAAhFY4Y1CFgFwsGRgGs4AemowZWfgEYKABm29efABTKA5hCnUAnrwC0vACZmMAI1h3eYZtV7kMF49WYAV1Y7AEoQAF8AXQZOLEt8IlJyGCpaEAYAN1E4CDZ8dUigA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

---

## Creating a Registry

Use the `prs registry init` command to scaffold a new registry:

```bash
prs registry init my-registry
```

This creates the full directory structure, manifest, and optional seed configurations.

### Interactive Mode

```bash
prs registry init my-registry
# Prompts for: name, description, namespaces, seed configs
```

### Non-Interactive Mode

```bash
prs registry init my-registry --yes --name "My Company Registry" --namespaces @core @stacks @fragments
```

### Skip Seed Configs

```bash
prs registry init my-registry --no-seed
```

### Registry Structure

```
my-registry/
├── registry-manifest.yaml    # Catalog of all configurations
├── @core/
│   └── base.prs
├── @roles/
│   └── developer/
│       └── fullstack.prs
├── @stacks/
│   └── react.prs
└── @fragments/
    └── testing.prs
```

### Registry Manifest

The `registry-manifest.yaml` file catalogs all configurations and enables `prs init` suggestions:

```yaml
version: '1'

meta:
  name: 'My Company Registry'
  description: 'Internal AI instruction configurations'
  lastUpdated: '2025-01-28'

namespaces:
  '@core':
    description: 'Universal foundations'
    priority: 100
  '@roles':
    description: 'AI personas'
    priority: 90
  '@stacks':
    description: 'Tech stack configurations'
    priority: 80
  '@fragments':
    description: 'Reusable mixins'
    priority: 70

catalog:
  - id: '@core/base'
    path: '@core/base.prs'
    name: 'Base Foundation'
    description: 'Universal AI assistant foundation'
    tags: [core, foundation]
    targets: [github, claude, cursor]
    dependencies: []
    detectionHints:
      always: true

  - id: '@stacks/react'
    path: '@stacks/react.prs'
    name: 'React Stack'
    description: 'React + TypeScript configuration'
    tags: [react, typescript, frontend]
    targets: [github, claude, cursor]
    dependencies: ['@core/base']
    detectionHints:
      dependencies: ['react', 'react-dom']
      frameworks: ['react', 'nextjs']

suggestionRules:
  - condition: { always: true }
    suggest: { inherit: '@core/base' }
  - condition: { frameworks: ['react'] }
    suggest: { inherit: '@stacks/react', use: ['@fragments/testing'] }
```

### Manifest Fields

#### `catalog` Entry Fields

| Field            | Required | Description                              |
| ---------------- | -------- | ---------------------------------------- |
| `id`             | Yes      | Unique ID matching file path             |
| `path`           | Yes      | Path to the `.prs` file                  |
| `name`           | Yes      | Human-readable name                      |
| `description`    | Yes      | Brief description                        |
| `tags`           | Yes      | Searchable tags                          |
| `targets`        | No       | Supported targets (github, claude, etc.) |
| `dependencies`   | No       | Required configurations                  |
| `detectionHints` | No       | Auto-suggestion hints (see below)        |

#### `detectionHints` Fields

| Field          | Description                                    |
| -------------- | ---------------------------------------------- |
| `always`       | Always suggest this configuration              |
| `files`        | Suggest if these files exist                   |
| `dependencies` | Suggest if package.json has these dependencies |
| `languages`    | Suggest for these languages                    |
| `frameworks`   | Suggest for these frameworks                   |

### Using Your Registry

#### Git Registry

Host on GitHub, GitLab, or any Git provider:

```yaml
registry:
  git:
    url: https://github.com/your-org/your-registry.git
    ref: main
```

#### Local Registry

For development or air-gapped environments:

```yaml
registry:
  path: ./path/to/registry
```

### Validating a Registry

Use `prs registry validate` to check your registry structure:

```bash
prs registry validate ./my-registry
```

Validation checks:

- `registry-manifest.yaml` exists and parses correctly
- Manifest schema is valid (version, meta, namespaces, catalog)
- All catalog entry `.prs` files exist
- Catalog IDs match declared namespaces
- No circular dependencies
- Warns about orphaned `.prs` files not in catalog

Use `--strict` to treat warnings as errors:

```bash
prs registry validate ./my-registry --strict
```

Use `--format json` for machine-readable output:

```bash
prs registry validate ./my-registry --format json
```

### Publishing a Registry

Use `prs registry publish` to commit and push registry updates:

```bash
prs registry publish ./my-registry
```

This will:

1. Validate the registry (use `--force` to skip)
2. Update `meta.lastUpdated` in the manifest
3. Stage, commit, and push changes

Options:

```bash
prs registry publish ./my-registry --dry-run              # Preview without publishing
prs registry publish ./my-registry -m "Add React stack"    # Custom commit message
prs registry publish ./my-registry --tag v1.0.0            # Tag the release
prs registry publish ./my-registry --force                 # Skip validation
```

### CI/CD Integration

Add registry validation to your CI pipeline:

```yaml
# .github/workflows/registry.yml
name: Registry CI
on: [push, pull_request]
jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm install -g @promptscript/cli
      - run: prs registry validate --strict
```

---

## Next Steps

- [Enterprise Setup](enterprise.md) — Scale PromptScript across your organization
- [CI/CD Integration](ci.md) — Automate validation and compilation in your pipeline
