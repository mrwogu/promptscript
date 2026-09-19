---
title: Tutorial
description: Enterprise tutorial for organization, team, and project layers
---

# Enterprise Tutorial: Building Layered AI Infrastructure

This tutorial starts after your first successful local compile. You will
build a layered configuration system for a software team: an organization
base, a team layer that inherits it, and a project that inherits both.

## Learning Objectives

By the end of this tutorial, you'll have:

- **Organization Registry:** A shared "base" configuration (`@acme/org`).
- **Team Inheritance:** A team layer that extends the base (`@acme/frontend`).
- **Project Implementation:** A specific project that inherits from both.
- **Native compilation:** Output for GitHub Copilot, Claude, and Cursor.

## Prerequisites

- Node.js 20+
- PromptScript CLI installed (`npm install -g @promptscript/cli`)
- A project that completed [Getting Started](getting-started.md)
- A successful `prs validate --strict` and `prs compile`

## Step 1: Create Organization Base

Start by creating a base configuration that applies to your entire organization.

Create `registry/@acme/org.prs`:

```promptscript
@meta {
  id: "@acme/org"
  syntax: "1.5.0"
  org: "ACME Corporation"
}

@identity {
  """
  You are an AI assistant working at ACME Corporation.
  Follow company coding standards and best practices.
  """
}

@standards {
  code: {
    principles: [
      "Follow clean code principles",
      "Document all public APIs",
      "Write tests for all code"
    ]
  }

  security: [
    "Validate all user input",
    "Never hardcode secrets"
  ]
}

@restrictions {
  - "Never expose API keys or secrets in code"
  - "Never commit sensitive data to version control"
  - "Always validate user input"
}

@shortcuts {
  "/security": "Review code for security vulnerabilities"
  "/docs": "Generate documentation for this code"
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAIkxYYABMAA6rQYIgATRIJEhuGRnwD0zagHN5YiXACe7DIVnyAjBQCsFAAzbxg9RpMgAggGEAsgFFBb9WnVsCDY7AF8xMW5pTiwILD1hHTkQbRT7AE1mAFdBDGoYXPEXAElcuDgIOAF2QQB3dQBrCFYNXKxBd29ff0DYtgokgDFmKChmWsEWMgxWBJYpZtaqmak8qThCqUEAI3h2miVYxngB+1SwiNZuZdZV6nXE+3mYWVF7CRpmxghyeFlkJISCTyYajcaTWAzSbMKQFT6sb6-ODyOiAoHyAAizEYWT4NQwo0EaCy2ygEEYHQACsVkSBUe90SAAOrUOIFDhVDZgdS5QnPOxAwQAXSS4VYSTgMBxrPi-zR8gAagTpNgCgSoIIspLqJJWMSsCj5SAAHIwABuMB1ODWz0EksY+SwtKSItYYsi+SqrMYfVYGzeEgAtMlTRadUQApKqaUGjA9BsefbHRtmtDYQLBMH5KHLdCSCQ4nbOBVYhbBKsBIIsMxBGGKmxoexqCMM1nXFBahh47XlRWClrc819RdxVc4Dh1FgcU7HsCQCp7VkZXp5M4AErmiAwCa27k6xfL2tZKCsS0YbbQOJb51nedSbG05wAcU4Z445exuJiQQbe6rOEqNMYDCEBQiFBgYmoPR8CIUhfioWg6RAOtglYfBTFAoA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

## Step 2: Create Team Configuration

Create a team-specific configuration that inherits from the org base.

Create `registry/@acme/frontend-team.prs`:

```promptscript
@meta {
  id: "@acme/frontend-team"
  syntax: "1.5.0"
  team: "Frontend"
}

# In a multi-file setup, you would inherit from organization:
@inherit @acme/org

@identity {
  """
  You are a frontend development expert.
  Specialize in React, TypeScript, and modern web technologies.
  """
}

@context {
  """
  The frontend team uses:
  - React 18 with TypeScript
  - Vite for bundling
  - TailwindCSS for styling
  - Vitest + Testing Library for tests
  - React Query for server state
  """
}

# Extend org standards with frontend-specific rules
@extend standards.code {
  frameworks: [react]
  patterns: [hooks, composition, "render props"]
  stateManagement: "React Query + Context"
}

@shortcuts {
  "/component": "Create a new React component"
  "/hook": "Create a custom React hook"
  "/test": "Write tests using Vitest and Testing Library"
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAIkxYYABMAA6rQYIgATRIJEhuGRnwD0Yamw6spAWg6l5YiXACe7DIVnyAjBQCsFAAyHxg-SSsgAYhvacpLgC+YmIAxIIAkuJCJACuUFgQOpCwgnD8sWh0gibMsYIA7nlQUpKsODDUEFiC6swkgszUAOYYrBAAXtgQbIhhgtwQ5ZXVA0qqTc0S4QAU1DDNEHBY1CaCOoJSSxgARrClYE2C5BgmzRqx2gCUYoNSnIlYa6KuhiAuEgCaeYIY87+1XxaUr3ABuMCgzDQfHYgiIaEqWAoRkEAGUEYwIBgoJ0YGVBAAlGBKLDZAAqJgRqMYVTQpN+2kEJGY92o4gKMB2bhgjBwrGYkMW8GRr3eYrEwVYtxYfkINReEjeH0EZIqgM0-m5pEEsXScD6rg2RJJgmsAA5CtUcCrKTBqbSsCiNgA1ap4w7UQQ7S5SHGsZpOlUYaAFIZSADCqNRtSOyxMfoDhsEro4y0EAGoVfBEv7BAAZCA7ah-NYe7nLOCB42MGoARVilVLscq4M9y2wMBRSverEl-QAonLNZM0gJtH8pHBLbh1X5tDo4BiIJBGIJqPF4LciMDR20pBO4BQWPdhCj1KQYEVqABrfWCZDzEkAXRRmCwHDZd+QOGYzFv2RYMhmDgaoelYbJ5HmbRKmODQ0ErEAX1cdsOAAWTaDBmhgGEsE8as6wbVYM0EcMNTlIIQlYbg4B-agsEYWIsCnBU5BAFRALQNgHnkTxw0fDgAVYS9CWJGtBA4rj2GVeQVB-P8eNYvjiQEoQGOWeoRJNOTr2ktjU0dJBWIAdSqAT9KnXUhimFNswZUoyWzKz80LYtViCEBAifBgHlWfAiFIcgYCoWgQAYVsQLYfBrA8oA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

## Step 3: Create Project Configuration

Now create a project-specific configuration.

Create `.promptscript/project.prs` in your project:

```promptscript
@meta {
  id: "checkout-app"
  syntax: "1.5.0"
}

# In a multi-file setup, you would inherit from frontend team:
@inherit @acme/frontend-team

@context {
  project: "Checkout Application"
  description: "E-commerce checkout flow"

  """
  This is the checkout application for ACME's e-commerce platform.
  Key features:
  - Multi-step checkout wizard
  - Payment processing with Stripe
  - Address validation
  - Order summary and confirmation
  """
}

# Project-specific standards
@extend standards {
  code: {
    testing: {
      coverage: 85
      e2e: required
    }
  }

  accessibility: {
    wcag: "2.1 AA"
    required: true
  }
}

@shortcuts {
  "/checkout": "Help with checkout flow logic"
  "/payment": "Help with Stripe payment integration"
  "/a11y": "Review code for accessibility issues"
}

@knowledge {
  """
  ## API Endpoints

  - POST /api/checkout/create - Create checkout session
  - PUT /api/checkout/:id - Update checkout
  - POST /api/checkout/:id/complete - Complete purchase

  ## Key Components

  - CheckoutWizard - Main wizard container
  - AddressForm - Shipping/billing address
  - PaymentForm - Stripe Elements integration
  - OrderSummary - Cart summary display
  """
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAIkxYYABMAA6rQYIgATRIJFMcMRgGtmAVywBaDGjTyxEuAE92GQrPkBGCgFYKABn2sAvmLEBiQQElxQkmqgsCE1IWEE4fjU0OkEjdUEAd3UoKUlWRWoILEEwamYSHLz2TlSOUkQPQW4IdJhM7O4MRj4Aely2DlYpTTKCwU8ACmoYAHMIOCxqI0FNQSlxjAAjWFSwZmpBcgwjEby1LoBKMW4WYsJs0XFNvIArJSwLEABhRRV1bIBBXSgIRmwINhOCRSeCMTJoIJsR4AUU0LBIfGojBggkYr1UGhyUGYCScBjkIH0hKuABUcONJHBBLgUWilBjsjpyL9-mwcutBB8ngBZaEAcipMDh+URyM2UGwa2oJAo+IA0jBpmAYNg1MM4BUrrNuQEgpoJjA0Kj0e9EhAAF4YahSfGzAAK2z47GuzGRcDgNRGZtwggAypMIGgYLbOVIpOqqQA3DA-KSs1ghgDy1rq4TUCKt0wwXVRbEg0vj+KJTlcCdYnjtt3u+qDjAgkEY4QEXStUjgxyInVSE2zcetVMuEhYINkg4k1PgQVYI1H+PHucjdQwIxgsgAHDY5+OYAAmVeCYYARzUEGGNquElLl7cVyabo9i2gWSMs4viT+M4JO4olk5HyB45HieZ6yJMajBlcpalsccA4OsWCMBoA5FiALR0m8GjyI8AASMBQEaCRZDgxr0qaYDYgkgjYmMjAAfILSYEYTpYFhBK4fh3rEf64IooxzFpBwuyFsSEj0RgliWEYrHyAASjAkYQDAlHDiiUqCHe8APk+WDTOMcDge2xLQaw3DKKwOIrCuwgocWVzuJ4Hx2l4gjQl0aDMDUWDtmWEj2omvokoILQ6BAaEmhoaHDNgKKzE8UUcCRGHZBE7oAj5MyCHaACqgXBWgoXoQyLSINIGVZWgcYJYV7whna-m5SFYWkRFJVSGh+TkPwMWCE8HWwAlaBqmiGARDeEj2YICrTL1ZBsJwXljRlLzNVgADqFqthl3IYDUZqWtauamDUdQhh8YYRgAYusBSzL65K6J6LSPlAPzTup52abVjrzVd0oZdxgYotCsDMVSnmjNQhZaoIyYgtQvrpiQmZLVayWI8j8xwFsUlXMWRkgM4AC6DDzVM+BEKQnVULQIAMIutBpfglgE0AA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

## Step 4: Configure the Project

Create `promptscript.yaml`:

```yaml
id: checkout-app
syntax: '1.5.0'

input:
  entry: .promptscript/project.prs

registry:
  path: ./registry

targets:
  - github:
      version: full
      output: .github/copilot-instructions.md
  - claude:
      version: full
      output: CLAUDE.md
  - cursor:
      version: full
      output: .cursor/rules/project.mdc
```

## Step 5: Add Agent Platform Capabilities

Add reusable capabilities to `.promptscript/project.prs`:

```promptscript
@skills {
  checkout-review: {
    description: "Review checkout changes"
    content: "Review payment safety, validation, tests, and user impact."
  }
}

@agents {
  checkout-reviewer: {
    description: "Review checkout pull requests"
    skills: ["checkout-review"]
    content: "Review changed checkout code against project standards."
  }
}

@hooks {
  validate-checkout: {
    event: "post-tool-use"
    matcher: "Edit|Write"
    command: ["pnpm", "test"]
    targets: {
      github: { enabled: false }
      cursor: { enabled: false }
    }
  }
}

@workflows {
  release: {
    description: "Prepare checkout release"
    content: "Run validation, summarize risk, and prepare release metadata."
  }
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAJwDW0KHAAEwADqthwxjhiM+zAK5YAtNRgA3CDADuiURKlSAJvEbUIaLBDb6xIAEqbtO6bPlKsbjKwDm8e0MjFnZOLDtHZ11hTABPEjDhOAwwGCxYumENDCgIY2wbVkyOOCw4TJ9jYUU4GGphCDIMRiwKQMlhAF8JbtYJbgx-dhFxDpk5BWU1KJ06-VGjYVM4c0trW2F7Jy1o8Y9lGMUoKGF1AEdFeDL2xf5BOH1kez3J1XUdnXsAXSCpEI52BFti5vH4YFUXp5pMxTMJBhgIKxSjFqMwAFZyLylSoYajGOBtEBBXq9fo4ZjMPgjILZXL5DgqSHKea-YSaMIRNDMUoqLAUqAqGowG5GEjYcbUCIAUWMECwAB8AOoWDgiv7MEhi1jGR72NCsNAkeyZewlLDfVlYXH+MosjqLXxynCKABG8zZrAwLtgOuEYBytS6rL+ilozElog9Xp9+n9QhgQftiakJIk-R04b4YCgzB01I66lgGFqdsWy1WVkKEQACupMOo3BMoYWYMXhUSk-8OZtHIpJLS8gU2Jk4IpNbiIAAvBMWfgVbUomD1mcwIuBhJW+kYQnEnogTpfBhhaixfBEUjkGBUWggBgaOpwQr4ACM+6AA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

See [Agent Platform](features/index.md) for MCP servers, plugins, and target-specific capabilities.

## Step 6: Validate and Compile

Validate your configuration first, so broken references and policy violations surface before
anything is written:

```bash
prs validate --strict
```

Then compile all targets:

```bash
prs compile
```

Preview what would change without writing files:

```bash
prs compile --dry-run
```

Inspect the generated diff before you commit:

```bash
prs diff --all
```

## Understanding Inheritance

The inheritance chain creates a layered configuration:

```mermaid
flowchart TD
    A["@acme/org<br/>Organization base"] --> B["@acme/frontend-team<br/>Team specifics"]
    B --> C["checkout-app<br/>Project specifics"]

    subgraph "Final Output"
        D["Merged Configuration"]
    end

    C --> D
```

**How merging works:**

| Block Type      | Merge Behavior                       |
| --------------- | ------------------------------------ |
| `@identity`     | Concatenates text                    |
| `@context`      | Concatenates text, merges properties |
| `@standards`    | Deep merges objects                  |
| `@restrictions` | Concatenates arrays                  |
| `@shortcuts`    | Merges, child overrides parent       |
| `@knowledge`    | Concatenates text                    |

## Step 7: Add to CI/CD

Add validation to your CI pipeline:

```yaml
# .github/workflows/promptscript.yml
name: Validate PromptScript

on: [push, pull_request]

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

      - name: Check compiled files are up to date
        run: |
          prs compile
          git diff --exit-code
```

## Your Daily Workflow

After the initial setup, everyday use is a short loop:

```bash
# 1. Edit the source
$EDITOR .promptscript/project.prs

# 2. Validate
prs validate --strict

# 3. Compile
prs compile

# 4. Review the generated diff, then commit
git status
git diff
git add .promptscript/project.prs CLAUDE.md .github .cursor
git commit -m "update agent instructions"
```

The generated files are committed next to the source, so reviewers see both in the pull request.
CI runs the same validation and fails when committed output no longer matches the source.

## Next Steps

You now have a complete PromptScript setup! Here's what to explore next:

- [Language Reference](reference/language.md) - Full syntax documentation
- [Agent Platform](features/index.md) - Agents, skills, integrations, and automation
- [Inheritance Guide](guides/inheritance.md) - Advanced inheritance patterns
- [Enterprise Setup](guides/enterprise.md) - Organization-wide deployment
- [CLI Reference](reference/cli.md) - All available commands
