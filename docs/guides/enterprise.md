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

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gMQAEAAs2oBzAPQAjDHBhVaAHVb8SMLBl7AFvXhAAmiXnJCCREqTEObecAJ7sMhfYYCMFAAxuLrLUOGOQAQQBhAFkAUV5AoTQhbAg2TwBfBQV+XU4sCCxrdUsLEE8tAE1mAFdeDGoYcq9-AElyuDgIOFV2cqxeILCIqJiMtgpkrx7K3gA3DCgS+ERLAFpeAEUSyczs5jGYais0GBgded4AZRhGEuo13khaLEOAVWlqOcZ0i8ZeHXgIYVZDyKgoBhxH0IJsPjBNlBmGhlOxcvkEQokr9FC0MKwdBUdHAcsMWJ99MhLFpDJFPrxKmMIDAAO4UmAARxKEEqBxAdGJBhAABFmGdYap+l5KkyWftDBzhiSQAAVeAZVjCemi1kFXgAXSGWmEmUJnMMDyqLFYm3YcVYk14LBIJEyOLAQhI2Al+pAACFqOjGDheBbbYr9GAYNhzjAAD7iErCSCEMM4ZhYGOiGW1QIAaVCMrmnzgjAuaCFLqlXIACiUAcrpi1K2K2ZZNaxkSlKi03kKcRphgtDAA5CFbK3MG2ZKynSpYHFCK2s9IQSZwNXdkB9zbbcTWTCNUdnC5ZelU2kL-Jdrn+KA0jDWe3MAHMOmY1S8GgJ05Cp83iCMalHw69-vbEppHBGhTmwfZgM4T5WC-eBeBpTIfQAa1YO8vDGctWC2IFoEyb9EiGfg4HjagsDOCdcWlURpB3NZDD8AAlCFqTpfEqgdbZqPOS50KgTDPXEHCMngNVDFEHQ+SPPwAHFOCwjheCnEo0AfKpxP5dJYniY8EhABJ1QYV5rHwIhSHIGQaHoEBVyaNh8CcXSgA" target="_blank" rel="noopener noreferrer">
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

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gMQAEAAs2oBzAPRwYjAK7UIWAJ5VaAHVb8SMLBl7BVvXhAAmiXspCCR4yTLnyze3nHnsMhE2YCMFAAw-7rAF9VVX4jTixbHQd7EH99AEE0cnleeIBhAFkAUUdrWQVHLVZDDGpDOF4sZl4MKCheFkMYCmjYttUg1hC4IpKyit1WfQlpfPkTZAd9MwyAMXjeahgARykIJcMzOinTEABleDgINkqIDWYpLBMAZgA2b29clmK4LZ2zACUAIXTeAHc5DheLAMD1eDQIAA3aAwYQwcGyViMCDkGBvIb6XZZJHUeRoLD-QGpLJ7AC0ACYAKy3dGY3YZUEAa14AAUAJJsgxDKDMYSvEDbDHTEAAdRgMEZUBSkKkUFYMGoGAARtBInBGBhWKwIKxhHFeABdDrBNRLHqyRgRNgDByk3YAORgkIVhSE8MwcDgfyE5S54KgGB1lSIWH1drMjud1GBvNyrCOEWdvBKWjDDqdLsMEDgytgTxsBTAMGwMngaYjGejUgkvCdtQAFABKXhCRxnaClXhSeMYIu8MDdy3HePlkDxKB-DDyCqQ2pGbDwzWGRyauQQABe8OrLp1aEuo-Hk+nXZrmEVGg4sk3y9WCogZdigRN-EZrGYf1ghjhUQxMX13D4A5RkiD54AuahGDLLoMTtICCxSYQ1iaKAdXgEwcCwLA0DgRBRFEAFGQgCgMEYDQKBYEgrGAhRbV4AA1WV5UVFUUIKJY0CECJdRMEZ4P4EiyIo2i4LGRYnXvP4GhwSRJWzK5eAwrCcLwgiiIE5oKKo+DSUYaTGFknpWj-QIQACA0GHCXF8CIUhUSUegQCjI42HwDxTKAA" target="_blank" rel="noopener noreferrer">
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

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gMQAEAAh1JwA9GGpsOrACZVaAHVb8SMLBl7BFvXhGmJe8kIJjCxE9p2mGtvOAE92GQvsMBGCgAZP11tqEkXEAAxcykrEEUAX0VFfghWHBhqCCwBZmoAcxEAIww4GFiAV3y0zJF8xkLkrDsYpV1OLBS7DRtrCIjfXgBNZkLeDGoYAd5xSUteaRgANxgoZjQVdl4iNCSsCjrtAFFCNeom-MQbAFpeACUTRlSMGV4AFTs1gGVGZLQsU94AWWYp6l8AGFns8BncpnAIBlfPY4BwSHAvgAFJJgdIkW6MYYLJokCAAL2wEDYXwAgowsXBIdloM1eAAKADqgNJAHFeAAmCiuXik0kASjaHR80VYsRYFkIqU0XXaPm03D49xgjBwvGeakYAGstrwziFSDAAO7pLX6S4Ya68VwADgA1F8ADK3DKFDAZGD6R4vN4QD68ACsDq6ZwAQoVoHpeAA1FIFEPqmpQeIZL0YaBG+LSYHPL7KuEp-Sxjhw3h2h7wJqsDK8R0QbLUQa1BMa7Cei5XVIARUKSRa5YAWsU1DJdYredRVXHrlV419AcwyGxGidpMlZr4prN5otGl8giYsLOTrl8tJRswoP9bFhqIUZ0Mvs8cIMYOeIVCYXY4TASAz+JaKgiBGgqysKnSirEcK3NIgzSHArRdCwUz6MgNjaIYACqJQ4MwzBanAdC8CwS6Qk0bBETBvBDDISS8DQCwIZgWAcACiIgHQ6EGMEhSsNcxKsBgUDEYuaDLuwCFsFAtQcVxhjejArzvKk8SsWAlrwBe1D0RIaDsTYAC6uqWpS1K0jUqFySAzJspy3K8qSIlkMmmIFLJXQYSA5KmfW5ktCWVY1kMACOEZDOEhm6vsaLUBifHtmhHncb8rApOkvDZLx0iwLYBJuZxSXyY22q8AuQy8IyMDZDGKRCfpXRGawkFKHAuEHJUWAITKnkiCRYmsHuSDcYCQxtiMFpWn14mfJ0PW4fhhiBCNh7DOolRwouvDzTqs3cSIAWLdxjLVMMAUIZmuA1Qdu2GCIGCuK4MmBJc0wQMaAwUvAZnJjUIogJEBkMI01B2PgRCkOQMByPQICzLQAn4K4-1AA" target="_blank" rel="noopener noreferrer">
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

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gMQAEAAh1JwA9ACMMjANacAJlVoAdVvxIwsGXsGW9eEWYl6KQgmMPGSZrWcZ284AT3YZCh4wEYKABm+3WuoRI3EAAhSzk-AF9lZX4IVhwYaggsAWZqAHMLOBhYgFcctMyRHMY85KwHGJV9TiwUhy07WxA-XQBNZjzeDGoYHt4JaTleWRgANxgoZjQ1dl4iNCSsCmrdAFFCJep6nMQ7AFpeADlmMYoAKzge614AFQclgGVGZLQsQ94AJXWnu7A8lAbrJeABxagYNA4ACKABleABBAAKAEk4J8ACLYDASQpjOAQDL+DC3Gb1EgQABe2AgbE+AFkIK9mDlqOMmfAetRGDgUjBGFhyrl-EZWmLlNFWLEWOwiKltCKWm1eNw+Hd+TheE8NNI1rwjl88uwIGpDKdzldeAAmLwAak+sJJGTyGAyMEMD2erwg714AFZ7SKjgAxCFqADu6SkZvgWAAUk9Mdjce7eEiWVgMn0nnDeLbvjBZBB0UHeAB5L70wxI5JwEgYT7quD1VgZQxx2N61WI7m8jgCoV6o4AYVgJK5PL5A76mOY9fiB1kyUm-nxhKlpfWK6wi+XnF4FOZrPZjHgzXFrVYktizZJsl6smuCt0kIghmQdl0xgAql94ZhcF4SZaFpVh4gyXgAAoRHGdw6F4GCrQASmMOhP1FDFmDKOZUnDFJNTLJZWGRFFeAAZl8EA0JFL8QDjAB1O483LBE8lwK0ejYxJjUYGk6UvXQAF09XvDQU3fdCf0KCksz41hrjAdJ7B5GB614HknTPKjJJAL4JggGBwx6KAgXiMZCC06jdFo6E8iSRoyRNKk5N4PoAEc8ggPobAE3hhKvap+DgHB0iwMosCfc8RFfYxggxeB10RVEFmsNBmHiD5fOMEoVPrWKMISolRmTDBCjgXKGyykARA4Zt8uMeiKn6WqIt4PDAI7OqqpEGSIQ4eqQGHPpsH6UScVK-perkqIQEiQSGDqagHHwIhSHIGAFHoEBgIJNh8HcWagA" target="_blank" rel="noopener noreferrer">
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
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gMQAEV1ZmSxxG1CGiwB6GswBWMRlgFwAOqwACJGFgy9g63rwgATRL1VMArnCxCY1ALRpm1XVEuHecAJ7sMhOaWAIwUAAzhnqwAvurqGhCsOA4QWLwaHKRwUmCC7JwmcZos+YRpBqxGsgpKQSAAwjZ22tS8AAqu7lFG1DAucKmuPnUA5qk4VgBGFCwkUhiM2lKMTfZOLm4YHiBFRp47O5W83HxtgjVpAPIAbg7XEDAA7ru8AMowUGCOcHcQjDC8DbuXhgVy8ACC9QAsgBRXgrWxrOAUF4AMRg2CsvTgiC8jghjBYVnYvBIGFYGBGMG07DxvEu1BMDl4OAgiOoPjprysaCBvCwfwA1jo1Ed8QAhaBQRIjYysUHUMkCtgvE68ADSMB8vAAkvkRtRsBA2KK6eCrLhzJdBbo3q9LnS2hgfDSROZXlhxGgYGaKVAfALGDjeFCIIRMKwPl59lFYqx4oLWMxHrATFT9NGDt1jnxwW0dbwYawTC5EiIXuKMD9eABVABKABlzDgsFg0DipPM0BAKAttDMhFJrsEXviAOIwgAqvGWqxa2UQpl44508LnDjpE+nUlcTNoy94DbZaV3DlFRnxbUur23geFIgP9V62ABcB5fLvOlVfAAIvAICMlSvD4tjUi8NbVhofYwFIVgQPCQguJG7A4nS4oWnYrB0LqrBoBa2HvLASh0vUGCMthULMCYWzYT+hqPBuYq8D+2AYJOGCTLA2FOmMFLKvGRwxoc0QgNEAC6DCcJ6Pj4EQpDkDAKggAwty0MarD4MEolAA" target="_blank" rel="noopener noreferrer">
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
