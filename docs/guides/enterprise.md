---
title: Enterprise Setup
description: Deploying PromptScript across your organization
---

# Enterprise Setup

This guide covers deploying PromptScript across an enterprise organization.

## Architecture Overview

```mermaid
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

### Repository Structure

Create a central registry repository:

```
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

```promptscript
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
    "Code review required"
    "Documentation required"
    "Testing required"
  ]

  git: [
    "Use conventional commits format"
    "Branch naming: feature|bugfix|hotfix/TICKET-description"
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

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAIkxYYABMAA6rQYIgATRIJEhuzagHMA9ACMMcGPLES4AT3YZCs+QEYKABmu7xgpcrMgAggGEAsgFFBbpWiVsCDY7AF8xMW5pTiwILANhPTkQXRT7AE1mAFdBDGoYXPEXAElcuDgIOAF2XKxBd29ff0DYtgoI+z98wQA3DCgs+EQkgFpBAEUs-riE5h6YakE4NBgYKVHBAGUYRizqGcFIWiwNgFVtahHGGP3GQSl4CGVWDb8oKAx1Foh5+5h5qDMNB8dhJVJhDrcKoYVhSPJSOCJewsB6yZBJCTyPwPQT5HoQGAAd1xMAAjlkIPl1mkJJiQAARZi7EECVrifLkylrOy05IAFXgsVYyhJnKpPMEAF0OhJlHE0RjkucCixWPN2MFWP1BCwSCQ4oiwEoSNgJXSAELUGGMHCCLX64WyMAwbB7GAAH3UWWUkEI7pwzCwvtUfOKbgA0l4+SMHnBGPs0GyzckAApZd6iwZVTNc6lJaWscIvVjcfJVW5sxGiexjeQAOX+Cx1zD1cSWO3yWERSh1VJiEH6cAltZADfmi3UBkw5Xbu328RJ+KJQ5pghHLighIwBkNzHezGJcIEghogZ2bJPe4gjAJK429cbiyy2j+NB22DWr84D1YN-ggkJOJbQAa1YA9xB6dNWAWT5oDiW8IWLKEA2oLBdi7JE6VUbQ5xmeRnAAJX+AliRRAojUWHC9gOSCoGgq11Dg2J4AleRVCkJkV2cABxTgYI4BwnzQI8Cg45kYiCEI0lCEBQklBgbgMfAiFIcgYCoWgQAYccKjYfBzFkoA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

### Security Configuration

```promptscript
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
    "MFA required"
    "Session timeout: 3600 seconds"
    "RBAC with least privilege principle"
    "Encrypt with AES-256"
    "Mask PII in logs"
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

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAIkxYYABMAA6rQYIgATRIJEhuzagHMA9HBiMArtQhYAnvLES4+9hkKz5ARgoAGe0dYBfMWO7TOWPfuHG5IEaB4oIAgmjkvqEAwgCyAKKCGtq6BkkCrFIY1FJwgljMghhQUIIsUjAU-kFOrqzucBlZOXmiIck6PrLI-hLysQBioYLUMACOWhCjUk4SfSAAyvBwEGz5EHzMWliyAMwAbHZ2SZpsubNz8gBKAEIxggDuejiCsBiNgjQQAG7QMMowT66ViMCDkGAXebxEHUfRoLCPZ5heILAC0ACYAKz7SEBWLvADWggACgBJUmScRQZjKOC4+QAdRgMAJUF83y0UFYMGoGAARtAfElGBhWKwIKxlBcALpiOruUaNXSMbxsVr+VEBAByMG+PPSSkBmDgcAeSlylM+UAwEvyRCwF018h1euorxpJ1YK28esEWQEju1uv1UggcH5sBOKSFYBg2B08EDzuDbq0GkEuuKAAoAJSCJRJDbQbKCLRejCxwRgMsq1ZepMgUJQB4YfR5b7FaTYQGiqRJUV6CAAL0Baf1ErQ2wbTZbbdL6cwvL4HF0I77Ex5EETwXlrG4BNYzAesCkAL8IRqwQkAGJr4IltG0ld4FtqIxE-UQpqH500spJhUUASvAsg4FgWBoHAiCqKoTwEhAFAYIwfAUCwJDqJov6GF+ggAGqctyvICkBaSjGgSjeJKsgdKk+jcEhKFoRq96YbRIy6luDxlDgmismGOyCGBEFQTBcEIQxlRoRhj76KijA8YwfGNNUgSqXKIDONKDBeLC+BEKQ4JULQIAMK6KxsPg1gaUAA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

## Team Configuration

### Frontend Team

```promptscript
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
    "Use hooks, composition, and render props patterns"
    "Functional components only"
    "TypeScript interfaces for props"
  ]

  accessibility: [
    "WCAG 2.1 AA compliance"
    "Accessibility testing required"
  ]

  performance: [
    "Monitor bundle size"
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

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAIkxYYABMAA6rQYIgATRIJEhuHUnAD0Yamw6sp8sRLgBPdhkKz5ARgoAGa7vGClJMyABiG9px0gxAXzFjuCFYcGGoILEFuZmoAcxUAIww4GACAV2TI6LjkxlSwrAN-VkCpTixwg2E9OW9a6oBNZlTBDGoYFsF1TU9BUoA3GChmND52QSI0UKwKIokAUUJJ6nLkxGqAWkEAJRgMRgiMbUEAFQNJgGVGMLQsDcEAWWZS6nEAYXPzlqPSuAgY8UMcA4JDgdwACqEwNESIdGO1huUSBAAF7YCBsO4AQUYcLgv3i0AqggAFAB1V6YgDiggATBRzIJMZiAJTVXR1Vh+VgBFgeQgRUT2dl2CQAYlFJxgjBwgnOAkYAGtZoJNm5SDAAO7RBWyHZ7CLmAAcAGo7gAZQ4xVIYGIwWSnC5XCA3QQAVlN9k2ACFUtAZIIAGrhFKe2UFKBBGL2jDQDVBKTvc53Y7wcqsKOB4NAwTGyVAyOCM0QeLUVqFUNy7B27a7faCACKqVClVzAC10gJtMrxYzqNLg-s8iG7q9mGQ2GV1lIwgNxP1BsNRrdQy5dlgh+tEskpJ1mFBnoIgdRUoO2ndzjhWjAdz8-gCDECYCQSdw9nwVL7WUK6t5OUVuEChxSK0UhwFU9gsKUsjINUEjyAAqhkODMMwCpwHQggsOOvzlGwGFAYIbTaKEgg0MMYGYFgHAvKCv4SHBripKw+zoqwGBQJhY5oBO7BgWwUCFHR9HyA6MCXNcERBNRYB7PAu7UKRGhoLR1QALrKnsuL4oSBTQbBNTklStL0oymKcWQEawikQkMdiWnFjplQcPm6aETAACOvptF4anKksULUDCzHVjB9gMY8rDhNEgjxExUiwIeKLWfpImloqgijm0gikjA8SZgIUAqfY6l-tyxRwMhyy5FgYGCgxKhYdxrBlPIzivG0VYdHqdaNTxtxCfIKjIahrU1O1a7tEIuRAmOgjDUqA0gCozn9c4pL5O0K1gXGuD5amIo1CoGDmOYgnODsfQQJqLQ4vA2kRgUdg+CAPiqQwZTUAY+BEKQ5AwFQtAgAwAy0Kx+DmC9QA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

### Backend Team

```promptscript
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
    "URL path versioning (/v1, /v2)"
    "Document with OpenAPI 3.0"
    "JWT + OAuth2 authentication"
  ]

  database: [
    "Use migrations for schema changes"
    "Review all indexes"
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

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAIkxYYABMAA6rQYIgATRIJEhuHUnAD0AIwyMA1pynyxEuAE92GQrPkBGCgAZb+8YKUkLIAEKadrPSDEBfMTFuCFYcGGoILEFuZmoAc3UMOBgggFdk6NiE5MZUiKwjQNZgqU4sSKNhAzlfWuqATWZUwQxqGBbBDW1dQVKANxgoZjQ+dkEiNHCsCiKJAFFCSepy5MRqgFpBADlmUooAKzgW70EAFSNJgGVGCLQsDcEAJTnL07BUqGOpQQBxagw0DgAIoAGUEAEEAAoASTgDwAItgMBoMqU4BA4uIMCdhuUSBAAF7YCBsB4AWQgN2YyWofUp8Ba1EYOEiMEYWDyKUc+jqrACrCCLHYRCiom5dV8jgAxFKzmycIJLgJtLNBJtHql2BA+LIdntDoIAEw2ADUDxB2LiqQwcRgsnOVxuEDuggArGbHJsAGL-PgAd1iWl18CwAClLgikSi7YJIdSsHE2pdQYITU8YFIIHDPYIAPKPMmySEROAkDAPU4hkJxWShkOqmUQpksjjszmqzYAYVg2MZzNZbbaCOYZZC6ykEQG4jRGIFObmU6w48nnEE+KpNLpjHg1R5Dn5QTgAm8rSkRzFEgBEFkyGqEnkAFVHmDMLhBANaCTWNXBAAKFR9JYdCCABhoAJQOBI94gPCzC5KMUR+pECq5pMrBQtCggAMz2JKUE1KGADqpypnm4KpLghotBRYRaowxKknhggALqqlIUZJDGt6ONBD4ZPiiYMawRxgLEghwMyMBloIzKWjuTHQY8MB0jAfotFAnwhKUhDyXeNRAqk4SVLi2qEkJghtAAjqkEBtD41SsXyRTcHAOCxFguRYOeu4gCoV7yK48LwLOEIwuM3hoMwIT3Ex8gqBJYRlgFNRBeimK9BxGQJVJ5axb5HBHsl8iEfk7QFV5ghIW+daFXlKgCf8HBFSAnZtNg7TsQI0ZrhijVfvuIB+MxDBlNQRj4EQpDkDAVC0CADAfuibD4JYg1AA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

## Project Integration

### Project Configuration

```promptscript
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

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAIkxYYABMAA6rQYIgATRIJFMArnCzM+1ALRpm1AVHliJcAJ7sMhWfICMFAAy39rAL5ix3CKxwxqELIO4dSOAB6MGo2DlYpF1ZuFnYiX1FxQRpmACsYRiwLEABhJRU1QQAFbV0HCWoYLTgfbSMcgHMfHAUAIwoWEiCMRj4gxgLVL00yjD0QaIl9ScnkgGJ5krCMrMEAeQA3L02IGAB3KcEAZRgoMHU4HYhGGBSxqEEwbUEAQVyAWQBRQUHlYdoFCOADEYNgFFU4IgDIJ1G9GCwFOxBCQMKwMI0YHx2DC4etqFIvIIcBB-tQjLiTgo0FodIIsDcANb8OCUgBC0Cg7kaklYz2oqIZbCOi0EAGkYEZBABJeKNajYCBsVmsSmvBS4WTrRkCE7HdaU4oYIzYrBQk5YbxoGBq9FQIwMxjmj4QQiYVhnGEzBzOVUxRmsZj7WBSTHCL2zCqCUWvYrSwRfSJadxmo5sjBXQQAVQASgAZWQ4LBYNBQoI9NAQCi9PidVRBTaWI5wgDiXwAKoIBkM1MFENJYYIW-xfj2vJS252gtpCbRB3nSb4Z14VRI4cV1scp47mWbB7kqtg7nBqbTfDv+CKlgAReAQRriY5GZRYo5ZzPcGswIIKCC-VRaB67BQuyGoqKwdAyqwaAapBpywFklK5BgBKQR8zBSOMkHXgq+zjskcLXtgGDthgbSwJBRrNOiQp+tMkZzI4ICOAAugwnCWkY+BEKQ5AwFQtAgAw2y0EqrD4JYzFAA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

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
    output: .cursorrules

validation:
  strict: true
```

!!! tip "Version Pinning with Git Tags"
For production stability, pin to specific versions using Git tags:

    ```yaml
    registry:
      git:
        url: https://github.com/acme/promptscript-registry.git
        ref: v1.2.0  # Pin to specific release
    ```

    Or pin individual imports in your `.prs` files:

    ```
    @inherit @teams/frontend@v2.0.0
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

      - name: Validate all files
        run: |
          find . -name "*.prs" -exec prs validate {} \;

      - name: Check for breaking changes
        if: github.event_name == 'pull_request'
        run: |
          # Custom script to detect breaking changes
          ./scripts/check-breaking-changes.sh
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
#   @inherit @org/base@v1.0.0
```

### Change Management

1. **Propose changes** via pull request to registry
2. **Review** by relevant stakeholders
3. **Test** with sample projects
4. **Communicate** changes to teams
5. **Deprecate** old versions with migration path

### Access Control

| Role      | Permissions            |
| --------- | ---------------------- |
| Admin     | Full registry access   |
| Team Lead | Team namespace write   |
| Developer | Read-only, PR creation |

## Rollout Strategy

### Phase 1: Pilot (2-4 weeks)

1. Select 2-3 pilot teams
2. Set up central registry
3. Migrate existing instructions
4. Gather feedback

### Phase 2: Team Rollout (4-8 weeks)

1. Create team configurations
2. Onboard remaining teams
3. Establish governance
4. Train developers

### Phase 3: Organization-Wide (Ongoing)

1. Mandate for new projects
2. Migration support for existing
3. Continuous improvement
4. Regular reviews

## Best Practices

!!! tip "Registry Organization"
Keep the registry organized with clear namespaces and documentation.

!!! tip "Version Pinning"
Pin versions in production projects to avoid unexpected changes.

!!! tip "Change Communication"
Notify teams before making registry changes.

!!! warning "Security Review"
Review security-related changes carefully before merging.

!!! warning "Breaking Changes"
Use major version bumps and provide migration guides for breaking changes.
