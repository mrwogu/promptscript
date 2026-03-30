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

```
@meta {
  id: "my-project"
  syntax: "1.0.0"
}

@inherit @stacks/react
@use @fragments/testing
```

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
1. Offer to connect to a Git or local registry
1. Suggest relevant configurations from your registry's catalog
1. Generate your `promptscript.yaml` and `.promptscript/project.prs`

You can also set a default registry via [user-level config](https://getpromptscript.dev/v1.10/guides/user-config/index.md) so `prs init --yes` automatically uses it.

## Usage Patterns

### Pattern 1: Inherit a Tech Stack

```
@meta { id: "react-app" syntax: "1.0.0" }

@inherit @stacks/react
```

### Pattern 2: Mix in Fragments

```
@meta { id: "secure-app" syntax: "1.0.0" }

@inherit @stacks/node
@use @fragments/testing
@use @fragments/security/owasp-security-review
```

### Pattern 3: Use Prompts Directly

```
@meta { id: "terminal" syntax: "1.0.0" }

@inherit @prompts/coding/linux-terminal
```

## How Git Registry Resolution Works

When you configure a Git registry, the CLI handles everything automatically:

1. **On first use:** The registry is cloned to `~/.promptscript/.cache/git/<hash>/`
1. **On subsequent uses:** The cached version is used if not stale (default: 1 hour TTL)
1. **On cache expiry:** The registry is updated with `git fetch`

```text
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

```
@inherit @stacks/react@1.0.0
```

______________________________________________________________________

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

```text
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
1. Update `meta.lastUpdated` in the manifest
1. Stage, commit, and push changes

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

______________________________________________________________________

## Next Steps

- [Enterprise Setup](https://getpromptscript.dev/v1.10/guides/enterprise/index.md) - Scale PromptScript across your organization
- [CI/CD Integration](https://getpromptscript.dev/v1.10/guides/ci/index.md) - Automate validation and compilation in your pipeline

______________________________________________________________________

## Registry Aliases

Registry aliases let you define short names for Git repository URLs so that imports stay readable and organization-wide base URLs are configured in one place.

### Configuring Aliases

Aliases are defined in the `registries` field of `promptscript.yaml` (project scope) or `~/.promptscript/config.yaml` (user scope):

```yaml
# promptscript.yaml
registries:
  '@company': github.com/acme/promptscript-base
  '@team': github.com/acme/team-frontend
```

Use any scoped name as the key. The value is a bare Git host path - no `https://` prefix required.

### Three-Level Merge

Aliases are merged from three sources in priority order (highest first):

1. **Project** - `promptscript.yaml` in the repo (team-specific overrides)
1. **User** - `~/.promptscript/config.yaml` (developer preferences)
1. **System** - `/etc/promptscript/config.yaml` (IT-provisioned defaults)

Project aliases win over user aliases, which win over system aliases. This lets IT provision company-wide aliases while still allowing projects to override specific ones.

### Using Aliases in .prs Files

Once configured, use the alias as the scope prefix in any import:

```
@meta { id: "my-project" syntax: "1.0.0" }

# Resolves to github.com/acme/promptscript-base/@org/base.prs
@inherit @company/@org/base

# Resolves to github.com/acme/team-frontend/@stacks/react.prs
@use @team/@stacks/react
```

______________________________________________________________________

## Go-Style URL Imports

Beyond registry aliases, PromptScript supports Go-module-style bare URL imports. You can reference any Git repository directly by its host path - no alias required.

### Basic URL Import

```
@meta { id: "my-project" syntax: "1.0.0" }

# Import directly from a public GitHub repo
@use github.com/acme/shared-standards/@fragments/security

# Import from any Git host
@use gitlab.com/myorg/prompts/@stacks/python
```

### Version Pinning in URL Imports

Append a version specifier with `@`:

```
# Pin to an exact tag
@use github.com/acme/shared-standards/@org/base@1.2.0

# Pin to a semver range (latest patch in 1.x)
@use github.com/acme/shared-standards/@org/base@^1.0.0

# Pin to a branch
@use github.com/acme/shared-standards/@org/base@main
```

| Specifier | Meaning                               |
| --------- | ------------------------------------- |
| `@1.2.0`  | Exact tag `v1.2.0` or `1.2.0`         |
| `@^1.0.0` | Latest tag matching `^1.0.0` (semver) |
| `@main`   | Tip of branch `main`                  |
| (none)    | Default branch as configured          |

### Alias vs URL Import

| Style         | Example                                | When to Use                        |
| ------------- | -------------------------------------- | ---------------------------------- |
| Alias         | `@use @company/security`               | Frequently-used internal packages  |
| Full URL      | `@use github.com/acme/security`        | One-off external imports           |
| Versioned URL | `@use github.com/acme/security@^1.0.0` | Reproducible external dependencies |

______________________________________________________________________

## Auto-Discovery

When you import a repository that does not contain `.prs` files, PromptScript looks for native AI plugin files and converts them automatically. This means you can `@use` any GitHub repository that contains `SKILL.md`, agent definitions, or command files - even if it was not authored with PromptScript.

### What Gets Auto-Discovered

| Source File Pattern                       | Imported As        |
| ----------------------------------------- | ------------------ |
| `SKILL.md` in root or `skills/` directory | `@skills` block    |
| `.claude/agents/*.md`                     | `@agents` block    |
| `.claude/commands/*.md`                   | `@shortcuts` block |
| `.github/skills/*/SKILL.md`               | `@skills` block    |

### Example: Importing an Open-Source Skill Library

```
@meta { id: "my-project" syntax: "1.0.0" }

# This repo has a SKILL.md but no .prs files - auto-discovered
@use github.com/some-org/claude-skills/skills/tdd-workflow
```

PromptScript fetches the repository, detects the `SKILL.md`, and synthesizes a virtual `.prs` fragment that you can merge into your project just like any other import.

Zero Config Required

Auto-discovery works without any setup in the remote repo. The remote maintainer does not need to know about PromptScript.

______________________________________________________________________

## Lockfile

PromptScript generates a `promptscript.lock` file to record the exact resolved commit for every remote import. This gives you reproducible builds - the same source always produces the same output, regardless of when you compile.

### Generating the Lockfile

```bash
prs lock            # Create or update promptscript.lock
prs lock --dry-run  # Show what would change without writing
```

The lockfile is also written automatically during `prs compile` when remote imports are present.

### Lockfile Format

```yaml
# promptscript.lock
version: 1
packages:
  github.com/acme/promptscript-base:
    url: https://github.com/acme/promptscript-base.git
    ref: main
    commit: a3f8c2d91b4e6f7890123456789abcdef0123456
    resolved: '2026-03-23T10:00:00Z'
  github.com/some-org/claude-skills:
    url: https://github.com/some-org/claude-skills.git
    ref: v1.2.0
    commit: deadbeef12345678901234567890abcdef012345
    resolved: '2026-03-22T08:30:00Z'
```

### Committing the Lockfile

Commit `promptscript.lock` to version control. This ensures:

- **Reproducible builds** - CI always compiles against the same commits
- **Auditable deps** - diffs show exactly when a dependency was updated
- **Offline support** - works with `prs vendor sync` (see below)

### Updating Dependencies

```bash
# Update a specific package to its latest allowed version
prs update github.com/acme/promptscript-base

# Update all packages
prs update

# Preview updates without writing
prs update --dry-run
```

______________________________________________________________________

## Vendor Mode

Vendor mode copies all remote dependencies into a local `.promptscript/vendor/` directory. This enables fully offline builds - useful in air-gapped CI environments or when you want to audit third-party content before it runs.

### Syncing the Vendor Directory

```bash
# Download all lockfile-resolved packages to vendor/
prs vendor sync

# Check that vendor/ is in sync with the lockfile
prs vendor check
```

After running `prs vendor sync`, compilation never performs network requests. The vendor directory is used as-is.

### Vendor Directory Structure

```text
.promptscript/
└── vendor/
    ├── github.com/
    │   ├── acme/
    │   │   └── promptscript-base/
    │   │       ├── @org/base.prs
    │   │       └── @org/security.prs
    │   └── some-org/
    │       └── claude-skills/
    │           └── skills/
    │               └── tdd-workflow/
    │                   └── SKILL.md
    └── .vendor-manifest.yaml
```

### CI Pipeline with Vendor

```yaml
# .github/workflows/promptscript.yml
- name: Sync vendor
  run: prs vendor sync

- name: Validate
  run: prs vendor check && prs validate --strict

- name: Compile
  run: prs compile
```

Commit the vendor directory to your repository if you want fully self-contained, network-free builds. Otherwise, regenerate it in CI from the lockfile.

______________________________________________________________________

## Private Repositories

### SSH Authentication

PromptScript uses your existing SSH keys automatically for `git@` URLs:

```yaml
registries:
  '@company': git@github.com:acme/promptscript-base
```

Or in URL imports:

```
@use git@github.com:acme/private-skills/@fragments/security
```

Ensure your SSH key is added to `ssh-agent` or configured in `~/.ssh/config`.

### Token Authentication (GITHUB_TOKEN)

For HTTPS URLs, configure a token in your registry entry:

```yaml
# promptscript.yaml
registry:
  git:
    url: https://github.com/acme/promptscript-base.git
    ref: main
    auth:
      type: token
      tokenEnvVar: GITHUB_TOKEN
```

The `tokenEnvVar` field names the environment variable that holds the token - it is never stored in plain text.

### User-Level Token Configuration

Set up credentials once in `~/.promptscript/config.yaml` and they apply to all projects:

```yaml
# ~/.promptscript/config.yaml
registries:
  '@company': github.com/acme/promptscript-base

auth:
  github.com:
    type: token
    tokenEnvVar: GITHUB_TOKEN
  gitlab.com:
    type: token
    tokenEnvVar: GITLAB_TOKEN
```

### CI Configuration

```yaml
# .github/workflows/promptscript.yml
- name: Compile
  run: prs compile
  env:
    GITHUB_TOKEN: ${{ secrets.REGISTRY_TOKEN }}
```
