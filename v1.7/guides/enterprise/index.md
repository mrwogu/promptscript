# Enterprise Setup

Need help with enterprise deployment?

**Questions?** Open a [GitHub Issue](https://github.com/mrwogu/promptscript/issues) or start a conversation in [GitHub Discussions](https://github.com/mrwogu/promptscript/discussions). We're happy to help teams get set up.

This guide covers deploying PromptScript across an enterprise organization.

## Architecture Overview

```
flowchart TB
    subgraph Central["Central Registry"]
        org["@org/base<br/>Organization standards"]
        sec["@core/security<br/>Security policies"]
        comp["@core/compliance<br/>Compliance rules"]
    end

    subgraph Teams["Team Registries"]
        fe["@frontend/base"]
        be["@backend/base"]
        mobile["@mobile/base"]
    end

    subgraph Projects["Projects"]
        p1["web-app"]
        p2["api-service"]
        p3["mobile-app"]
    end

    org --> fe
    org --> be
    org --> mobile
    sec --> fe
    sec --> be
    sec --> mobile
    comp --> fe
    comp --> be
    comp --> mobile

    fe --> p1
    be --> p2
    mobile --> p3
```

## Central Registry Setup

### Create Your Registry

Use the CLI to scaffold your company registry:

```bash
prs registry init company-registry --name "ACME Registry" --namespaces @org @teams @fragments @templates
```

### Repository Structure

```text
promptscript-registry/
├── README.md
├── CHANGELOG.md
├── @org/
│   ├── base.prs              # Organization base
│   ├── security.prs          # Security standards
│   └── compliance.prs        # Compliance requirements
├── @teams/
│   ├── frontend.prs
│   ├── backend.prs
│   ├── mobile.prs
│   └── data.prs
├── @fragments/
│   ├── testing.prs
│   ├── documentation.prs
│   └── logging.prs
└── @templates/
    ├── web-app.prs
    ├── api-service.prs
    └── library.prs
```

### Organization Base Configuration

```
# @org/base.prs
@meta {
  id: "@org/base"
  syntax: "1.0.0"
  org: "ACME Corporation"
}

@identity {
  """
  You are an AI assistant at ACME Corporation.

  Core values:
  - Quality over speed
  - Security first
  - User-centric design
  - Collaborative development
  """
}

@standards {
  code: [
    "Code review required",
    "Documentation required",
    "Testing required"
  ]

  git: [
    "Use conventional commits format",
    "Branch naming: feature|bugfix|hotfix/TICKET-description",
    "Pull request required"
  ]
}

@restrictions {
  - "Never commit secrets or credentials"
  - "Never bypass security reviews"
  - "Always follow data protection policies"
  - "Never use deprecated dependencies with known vulnerabilities"
}

@shortcuts {
  "/security": "Review code for security vulnerabilities"
  "/docs": "Generate or update documentation"
}
```

### Security Configuration

```
# @org/security.prs
@meta {
  id: "@org/security"
  syntax: "1.0.0"
}

@identity {
  """
  Apply ACME security standards to all code.
  """
}

@standards {
  security: [
    "MFA required",
    "Session timeout: 3600 seconds",
    "RBAC with least privilege principle",
    "Encrypt with AES-256",
    "Mask PII in logs",
    "Weekly vulnerability scanning"
  ]
}

@restrictions {
  - "Never store passwords in plain text"
  - "Never log sensitive data"
  - "Never disable security features"
  - "Never use eval() or similar unsafe functions"
  - "Always validate and sanitize user input"
  - "Always use parameterized queries"
}

@knowledge {
  """
  ## Security Resources

  - Security guidelines: https://wiki.acme.com/security
  - Vulnerability reporting: security@acme.com
  - Security review checklist: https://wiki.acme.com/security-checklist
  """
}
```

## Team Configuration

### Frontend Team

```
# @teams/frontend.prs
@meta {
  id: "@teams/frontend"
  syntax: "1.0.0"
  team: "Frontend"
}

@inherit @org/base
@use @org/security

@identity {
  """
  You are a frontend development expert.

  Expertise:
  - React and TypeScript
  - Modern CSS and design systems
  - Performance optimization
  - Accessibility (WCAG 2.1 AA)
  """
}

@context {
  """
  ## Tech Stack

  - Framework: React 18+
  - Language: TypeScript 5+
  - Build: Vite
  - Styling: TailwindCSS
  - Testing: Vitest + Testing Library
  - State: React Query + Zustand

  ## Architecture

  - Component-driven development
  - Feature-based folder structure
  - Shared design system (@acme/ui)
  """
}

@standards {
  code: [
    "Use hooks, composition, and render props patterns",
    "Functional components only",
    "TypeScript interfaces for props"
  ]

  accessibility: [
    "WCAG 2.1 AA compliance",
    "Accessibility testing required"
  ]

  performance: [
    "Monitor bundle size",
    "Track Core Web Vitals"
  ]
}

@shortcuts {
  "/component": "Create a React component"
  "/hook": "Create a custom hook"
  "/test": "Write tests with Vitest"
  "/a11y": "Review accessibility"
}
```

### Backend Team

```
# @teams/backend.prs
@meta {
  id: "@teams/backend"
  syntax: "1.0.0"
  team: "Backend"
}

@inherit @org/base
@use @org/security

@identity {
  """
  You are a backend development expert.

  Expertise:
  - Node.js and TypeScript
  - RESTful and GraphQL APIs
  - Database design and optimization
  - Microservices architecture
  """
}

@context {
  """
  ## Tech Stack

  - Runtime: Node.js 20+
  - Language: TypeScript 5+
  - Framework: NestJS
  - Database: PostgreSQL + Redis
  - ORM: Prisma
  - Testing: Jest

  ## Architecture

  - Clean architecture
  - Domain-driven design
  - Event-driven microservices
  """
}

@standards {
  api: [
    "URL path versioning (/v1, /v2)",
    "Document with OpenAPI 3.0",
    "JWT + OAuth2 authentication"
  ]

  database: [
    "Use migrations for schema changes",
    "Review all indexes",
    "Query optimization required"
  ]
}

@shortcuts {
  "/api": "Design API endpoint"
  "/schema": "Design database schema"
  "/test": "Write tests with Jest"
  "/migrate": "Create database migration"
}
```

## Project Integration

### Project Configuration

```
# .promptscript/project.prs
@meta {
  id: "customer-portal"
  syntax: "1.0.0"
}

@inherit @teams/frontend

@context {
  project: "Customer Portal"
  repository: "github.com/acme/customer-portal"

  """
  ## Project Overview

  Self-service portal for ACME customers.

  Features:
  - Account management
  - Order history
  - Support tickets
  - Billing information

  ## Key Integrations

  - Auth: Okta SSO
  - Payments: Stripe
  - Analytics: Mixpanel
  """
}

@knowledge {
  """
  ## API Endpoints

  Base URL: https://api.acme.com/v1

  - GET /customers/:id - Get customer
  - GET /orders - List orders
  - POST /tickets - Create support ticket

  ## Design System

  Use @acme/ui components:
  - Button, Input, Select
  - Card, Modal, Drawer
  - DataTable, Pagination
  """
}
```

### Project Config File

```yaml
# promptscript.yaml
input:
  entry: .promptscript/project.prs

registry:
  git:
    url: https://github.com/acme/promptscript-registry.git
    ref: main
    auth:
      type: token
      tokenEnvVar: GITHUB_TOKEN
  cache:
    enabled: true
    ttl: 3600000

targets:
  github:
    enabled: true
    output: .github/copilot-instructions.md
  claude:
    enabled: true
    output: CLAUDE.md
  cursor:
    enabled: true
    output: .cursor/rules/project.mdc

validation:
  strict: true
```

Version Pinning with Git Tags

For production stability, pin to specific versions using Git tags:

````text
```yaml
registry:
  git:
    url: https://github.com/acme/promptscript-registry.git
    ref: v1.2.0  # Pin to specific release
````

Or pin individual imports in your `.prs` files:

```
@inherit @teams/frontend@2.0.0
```

````

## Developer Configuration

### User-Level Config

Each developer can set their default registry in `~/.promptscript/config.yaml`:

```yaml
version: '1'
registry:
  git:
    url: https://github.com/acme/promptscript-registry.git
    ref: main
    auth:
      type: token
      tokenEnvVar: GITHUB_TOKEN
defaults:
  team: frontend
  targets:
    - github
    - claude
````

This allows `prs init --yes` to automatically connect to the company registry without manual configuration. See [User-Level Configuration](https://getpromptscript.dev/v1.7/guides/user-config/index.md) for details.

### Environment Variables

For CI/CD and developer environments, use environment variables:

```bash
export PROMPTSCRIPT_REGISTRY_GIT_URL=https://github.com/acme/promptscript-registry.git
export PROMPTSCRIPT_REGISTRY_GIT_REF=main
```

## CI/CD Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/promptscript.yml
name: PromptScript CI

on:
  push:
    paths:
      - '.promptscript/**'
      - 'promptscript.yaml'
  pull_request:
    paths:
      - '.promptscript/**'
      - 'promptscript.yaml'

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install PromptScript
        run: npm install -g @promptscript/cli

      - name: Validate
        run: prs validate --strict
        env:
          GITHUB_TOKEN: ${{ secrets.REGISTRY_TOKEN }}

      - name: Check compiled files
        run: |
          prs compile
          git diff --exit-code || {
            echo "::error::Compiled files are out of date. Run 'prs compile' and commit."
            exit 1
          }
        env:
          GITHUB_TOKEN: ${{ secrets.REGISTRY_TOKEN }}
```

### Registry CI/CD

```yaml
# .github/workflows/registry.yml (in registry repo)
name: Registry CI

on:
  push:
    branches: [main]
  pull_request:

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install PromptScript
        run: npm install -g @promptscript/cli

      - name: Validate registry
        run: prs registry validate --strict
```

## Governance

### Versioning Strategy

Follow semantic versioning for registry files using Git tags:

- **Major** (v1.0.0 → v2.0.0): Breaking changes to block structure
- **Minor** (v1.0.0 → v1.1.0): New features, non-breaking additions
- **Patch** (v1.0.0 → v1.0.1): Bug fixes, documentation updates

Create releases with Git tags:

```bash
# Create release tag
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0

# Projects can then pin to this version
# In promptscript.yaml:
#   registry.git.ref: v1.0.0
# Or in .prs files:
#   @inherit @org/base@1.0.0
```

### Change Management

1. **Propose changes** via pull request to registry
1. **Review** by relevant stakeholders
1. **Test** with sample projects
1. **Communicate** changes to teams
1. **Deprecate** old versions with migration path

### Access Control

| Role      | Permissions            |
| --------- | ---------------------- |
| Admin     | Full registry access   |
| Team Lead | Team namespace write   |
| Developer | Read-only, PR creation |

## Rollout Strategy

### Phase 1: Pilot (2-4 weeks)

1. Select 2-3 pilot teams
1. Set up central registry
1. Migrate existing instructions
1. Gather feedback

### Phase 2: Team Rollout (4-8 weeks)

1. Create team configurations
1. Onboard remaining teams
1. Establish governance
1. Train developers

### Phase 3: Organization-Wide (Ongoing)

1. Mandate for new projects
1. Migration support for existing
1. Continuous improvement
1. Regular reviews

## Version Support Policy

### Supported Node.js Versions

PromptScript supports the following Node.js versions:

| Node.js Version | Support Status |
| --------------- | -------------- |
| 22.x (LTS)      | Full support   |
| 24.x            | Full support   |
| 25.x (Current)  | Full support   |
| < 22            | Not supported  |

We follow Node.js's [release schedule](https://nodejs.org/en/about/releases/) and support active LTS and current versions.

### PromptScript Version Support

| Version | Status | Support Window               |
| ------- | ------ | ---------------------------- |
| 1.x     | Active | Until 2.0 release + 6 months |

**Support includes:**

- Security patches
- Bug fixes
- Documentation updates
- Compatibility with new Node.js LTS versions

### Breaking Changes Policy

We follow [Semantic Versioning](https://semver.org/):

- **Major versions** (1.x → 2.x): May contain breaking changes
- **Minor versions** (1.0 → 1.1): New features, backwards compatible
- **Patch versions** (1.0.0 → 1.0.1): Bug fixes only

**Breaking changes will:**

1. Be announced at least 4 weeks in advance
1. Include migration guides in release notes
1. Provide deprecation warnings in the previous minor version
1. Be documented in CHANGELOG.md

### Deprecation Process

1. Feature marked as deprecated with console warning
1. Documented in release notes with migration path
1. Deprecated for at least one minor version
1. Removed in next major version

### Security Updates

Security vulnerabilities are handled according to our [Security Policy](https://github.com/mrwogu/promptscript/blob/main/SECURITY.md):

- **Critical**: Fix within 7 days
- **High**: Fix within 14 days
- **Medium**: Fix within 30 days
- **Low**: Fix in next scheduled release

## Enterprise Registry Resolver

### System-Level Configuration

IT or platform teams can provision organization-wide registry aliases before developers touch the tool. Place a config file at `/etc/promptscript/config.yaml` on all developer machines (via MDM, Ansible, or similar provisioning):

```yaml
# /etc/promptscript/config.yaml  — provisioned by IT
registries:
  '@company': github.com/acme/promptscript-base
  '@security': github.com/acme/security-standards

auth:
  github.com:
    type: token
    tokenEnvVar: GITHUB_TOKEN
```

Developers run `prs init` and the `@company` alias resolves automatically — no manual configuration required.

### Three-Level Config Precedence

Aliases merge from three levels, highest priority first:

| Priority | Location                                 | Who Controls It |
| -------- | ---------------------------------------- | --------------- |
| Highest  | `promptscript.yaml` (project)            | Project team    |
| Middle   | `~/.promptscript/config.yaml` (user)     | Developer       |
| Lowest   | `/etc/promptscript/config.yaml` (system) | IT / Platform   |

This model lets IT enforce company defaults while teams retain flexibility to override specific aliases per project.

### Private Git Registries with SSO

For enterprises using GitHub Enterprise Server, GitLab Self-Managed, or Azure DevOps:

```yaml
# promptscript.yaml
registries:
  '@company':
    url: github.your-company.com/acme/promptscript-base
    auth:
      type: token
      tokenEnvVar: GHE_TOKEN
```

For SSO-gated repositories, use a service account PAT or a deploy key stored in your secrets manager (Vault, AWS Secrets Manager, etc.) and surfaced as an environment variable.

### Vendor Mode for Air-Gapped Environments

In environments with no outbound internet access, use vendor mode to pre-download all dependencies and commit them to the repository:

```bash
# Run this once outside the air-gapped network
prs vendor sync

# Commit vendor directory
git add .promptscript/vendor promptscript.lock
git commit -m "chore: vendor PromptScript dependencies"
```

In air-gapped CI:

```yaml
# No network access required
- name: Validate
  run: prs vendor check && prs validate --strict

- name: Compile
  run: prs compile
```

The `prs vendor check` step fails the build if the vendor directory is out of sync with the lockfile, preventing accidental use of stale dependencies.

### Lockfile in Enterprise CI

Commit `promptscript.lock` to every repository that uses remote imports. This ensures:

- **Deterministic builds** — every CI run resolves the exact same commits
- **Change visibility** — lockfile diffs in PRs make dependency updates explicit
- **Security auditing** — commit hashes can be cross-referenced with supply-chain scanning

```yaml
# .github/workflows/promptscript.yml
- name: Check lockfile is up to date
  run: prs lock --dry-run | grep "No changes"

- name: Compile
  run: prs compile
  env:
    GITHUB_TOKEN: ${{ secrets.REGISTRY_TOKEN }}
```

## Best Practices

Registry Organization

Keep the registry organized with clear namespaces and documentation.

Version Pinning

Pin versions in production projects to avoid unexpected changes.

Change Communication

Notify teams before making registry changes.

Security Review

Review security-related changes carefully before merging.

Breaking Changes

Use major version bumps and provide migration guides for breaking changes.
