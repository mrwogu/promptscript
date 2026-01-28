# Registry

PromptScript supports registries - collections of reusable configurations that can be inherited across projects. The official registry contains 1,134 configurations, but you can also create your own.

## Official Registry

**Repository:** [github.com/mrwogu/promptscript-registry](https://github.com/mrwogu/promptscript-registry)

The official registry includes:

| Namespace     | Count | Description                                    |
| ------------- | ----- | ---------------------------------------------- |
| `@prompts/`   | 632   | General-purpose prompts (coding, writing, etc) |
| `@fragments/` | 441   | Reusable mixins (testing, security, agents)    |
| `@roles/`     | 18    | AI personas (developer, creative, specialist)  |
| `@skills/`    | 28    | Claude Code skills                             |
| `@stacks/`    | 7     | Framework configs (React, Vue, Node, Python)   |
| `@agents/`    | 5     | Specialized AI agents                          |
| `@core/`      | 3     | Universal foundations                          |

## Quick Start

### 1. Configure Registry

Add to your `promptscript.yaml`:

```yaml
registry:
  git:
    url: https://github.com/mrwogu/promptscript-registry.git
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
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAIkxYYABMAA6rQYIgATRIJEgSATwC0NZgCsYjLPLES4i9hkKz5ARgoAGK7tYBfMWO4RWOGNQhZB3OAMYBrOAB6ahgMbScAVzgYbzBqDABzPnZgjl8XRJA7AF0GTixqRXwiUnIYKloQBgA3dzgINnwzbKA" target="_blank" rel="noopener noreferrer">
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

The `prs init` command can automatically suggest configurations:

```bash
prs init
```

It will:

1. Detect your tech stack (React, Node, Python, etc.)
2. Offer to connect to the official registry
3. Suggest relevant configurations
4. Generate your `promptscript.yaml` and `.promptscript/project.prs`

## Available Configurations

### Tech Stacks (`@stacks/`)

| File                     | Description        |
| ------------------------ | ------------------ |
| `@stacks/react`          | React + TypeScript |
| `@stacks/vue`            | Vue 3 + TypeScript |
| `@stacks/node`           | Node.js backend    |
| `@stacks/python`         | Python development |
| `@stacks/rust`           | Rust development   |
| `@stacks/go`             | Go development     |
| `@stacks/typescript-lib` | TypeScript library |

### Roles (`@roles/`)

| Path                          | Description            |
| ----------------------------- | ---------------------- |
| `@roles/developer/fullstack`  | Full-stack developer   |
| `@roles/developer/frontend`   | Frontend specialist    |
| `@roles/developer/backend`    | Backend specialist     |
| `@roles/developer/devops`     | DevOps engineer        |
| `@roles/creative/writer`      | Creative writer        |
| `@roles/professional/analyst` | Data/business analyst  |
| `@roles/specialist/teacher`   | Educational instructor |

### Fragments (`@fragments/`)

Core mixins:

| File                       | Description               |
| -------------------------- | ------------------------- |
| `@fragments/testing`       | Testing standards         |
| `@fragments/typescript`    | TypeScript best practices |
| `@fragments/documentation` | Documentation guidelines  |
| `@fragments/code-review`   | Code review guidelines    |
| `@fragments/accessibility` | Web accessibility (WCAG)  |

Categorized fragments:

| Category         | Count | Examples                       |
| ---------------- | ----- | ------------------------------ |
| `testing/`       | 157   | TDD patterns, test generation  |
| `agents/`        | 139   | Agent guidelines, expert modes |
| `security/`      | 72    | OWASP, vulnerability scanning  |
| `documentation/` | 18    | Documentation generation       |

### Prompts (`@prompts/`)

632 general-purpose prompts organized by category:

| Category     | Count | Examples                         |
| ------------ | ----- | -------------------------------- |
| `coding/`    | 250   | code-reviewer, linux-terminal    |
| `general/`   | 241   | travel-guide, excel-sheet        |
| `business/`  | 58    | seo-specialist, accountant       |
| `education/` | 49    | math-teacher, philosophy-teacher |
| `writing/`   | 34    | novelist, poet, screenwriter     |

## Usage Patterns

### Pattern 1: Inherit a Tech Stack

```promptscript
@meta { id: "react-app", syntax: "1.0.0" }

@inherit @stacks/react
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAIkxYYABMEEQAJokEAdENRgZGWALQY0aGXUFwAnuwyFJMgIwUADGZmCAvlNa3uEVjhjUIWQdzgDGAazgB6OQUsECsAXQZOLGptfCJSchgqWhAGADcXOAg2fCNQoA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

### Pattern 2: Mix in Fragments

```promptscript
@meta { id: "secure-app", syntax: "1.0.0" }

@inherit @stacks/node
@use @fragments/testing
@use @fragments/security/owasp-security-review
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAIkxYYABMEEQAJokEAdEHBiMArtRgBaDGjQy6guAE92GQpJkBGCgAYLMwQF8pre9wiscMahCyDucAYwDWcAD0rMxiMI4Kcl5g1BgA5nzsQRw+znERUdwx8YlYQXKK7li6gcwA7hhwaCoFSh66KsoAbhAwZSA2ALoMnFjUuvhEpOQwVLQgDE1ucBBs+CYdQA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

### Pattern 3: Use Prompts Directly

```promptscript
@meta { id: "terminal", syntax: "1.0.0" }

@inherit @prompts/coding/linux-terminal
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAIkxYYABMEEQAJokEAdEB2okIrDFBl1BcAJ7sMhSTICMFAAzGZggL5TWV7opwxqELIO41mZLHAD0LMYoDmXlCKAK6EALRyCkpQIOYAugycWNQa+ESk5DBUtCAMAG4OcBBs+PpxQA" target="_blank" rel="noopener noreferrer">
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
    url: https://github.com/mrwogu/promptscript-registry.git
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
@inherit @stacks/react@v1.0.0
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAISs4xqELAAJucLBkYBrOAHpqMKVm4A3AIwUADNpABfALoNOWagE98RUuRhVaIBqsFwIbfOv1A" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

---

## Creating Custom Registries

You can create your own registry for your organization.

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

### Verification Scripts

Add these to your registry's `package.json`:

```json
{
  "scripts": {
    "verify": "node scripts/verify-manifest.js",
    "rebuild": "node scripts/rebuild-catalog.js"
  }
}
```

**verify-manifest.js** - Checks all `.prs` files are in the catalog:

```javascript
// Scan all .prs files and compare against catalog
// Exit with error if any files are missing
```

**rebuild-catalog.js** - Regenerates catalog from files:

```javascript
// Parse all .prs files and extract @meta information
// Update registry-manifest.yaml with new entries
```

See the [official registry scripts](https://github.com/mrwogu/promptscript-registry/tree/main/scripts) for reference implementations.

### CI/CD Integration

Add manifest verification to your CI pipeline:

```yaml
# .github/workflows/verify-manifest.yml
name: Verify Manifest
on: [push, pull_request]
jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run verify
```

## Contributing to Official Registry

1. Fork [promptscript-registry](https://github.com/mrwogu/promptscript-registry)
2. Add your `.prs` file in the appropriate namespace
3. Ensure `@meta.id` matches the file path
4. Run `npm run rebuild` to update the catalog
5. Submit a pull request

See the [contributing guide](https://github.com/mrwogu/promptscript-registry/blob/main/CONTRIBUTING.md) for details.
