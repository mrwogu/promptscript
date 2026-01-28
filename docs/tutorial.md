---
title: Tutorial
description: Step-by-step tutorial for deploying PromptScript infrastructure
---

# Tutorial: Building Enterprise AI Infrastructure

In this tutorial, you will simulate a "PromptOps" deployment for a software team.
You won't just write a prompt—you will build a **hierarchical context system** that scales.

## Learning Objectives

By the end of this tutorial, you'll have:

- **Organization Registry:** A shared "base" configuration (`@acme/org`).
- **Team Inheritance:** A team layer that extends the base (`@acme/frontend`).
- **Project Implementation:** A specific project that inherits from both.
- **Native compilation:** Output for GitHub Copilot, Claude, and Cursor.

## Prerequisites

- Node.js 20+
- PromptScript CLI installed (`npm install -g @promptscript/cli`)
- A project to configure

## Step 1: Create Organization Base

Start by creating a base configuration that applies to your entire organization.

Create `registry/@acme/org.prs`:

```promptscript
@meta {
  id: "@acme/org"
  syntax: "1.0.0"
  org: "ACME Corporation"
}

@identity {
  """
  You are an AI assistant working at ACME Corporation.
  Follow company coding standards and best practices.
  """
}

@standards {
  code: [
    "Follow clean code principles"
    "Document all public APIs"
    "Write tests for all code"
  ]

  security: [
    "Validate all user input"
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
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-hACaIAEAHRAABDIxIwA9M2oBzYYNb9+cAJ7sMhAcICMFAAyHFy-rLk6QAQQDCAWQCi-G7LSzsENiYC+SpSN5OLAgsNX5gJRVFEBMVAE1mAFd+DGoYFOUrAEkUuDgIOCwMdn4Ad1kAawhWORSsfltHZ1d3YLYKSP4AMWYoKGZS-hYyYrCWHmrawuKeVJ44DJ5+ACN4eppxYMZ4DtNonz9WEWnWWep58M7xmAFkTqiQHr6BodhioeYedJpqxghyeCxFRCEAAEWYjESkhKGD6-DQiWWUAgjAaAAUsnAgQ8AOrUELpDiFBZgWQpOHXIEAXUOKjgMEh+NCt3uIIAarDeNh0rCoPxEvTqPxqgisNiQQA5GAANxgQpwc2uqgZaSwWJiphprF8rH8aUK+MYbVYCwipgAtJKZXL+EQ3PT0TkKjA1AsyfTGKqFtUPl8gZbhFLZULhiQQsqTSEILL+LMivwsMx+MH8mwPuxqL1-SCrFBShhXcnOXH0gKbSLEmKNTr-HAcLIsJC1Zc9iApB7Eky1MJLAAlGUQGCDJWkoUdrvJxJQVhyjDLaBRwEah5SHgQ9WWADinFnHFjEKhQQ8adHCZwBV9MB8IG8VIYQWoanwRFIAKotBADBTnlY+F0N6AA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

## Step 2: Create Team Configuration

Create a team-specific configuration that inherits from the org base.

Create `registry/@acme/frontend-team.prs`:

```promptscript
@meta {
  id: "@acme/frontend-team"
  syntax: "1.0.0"
  team: "Frontend"
}

# Inherit from organization
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
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-hACaIAEAHRAABDIxIwA9GGpsOrHgFoOpYYNb9+cAJ7sMhAcICMFAAzn1m-qpJGQAMTntOPKwF8NGgMT8Akqw4MNQQWPyyzCT8zNQA5hisEABe2BBsGiIQgcGh-GIS0jGxXqyZPJxYoTr8wBpa6iBWWgCazACu-BjUMJ3hzgo8-OUAbjBQzGiS7PxEaMFYFHX8AMpzjBAYUMk9WfwASjDiWHT8ACo6c8uMIWjHnYr8JMzl1JoA7jAARjYwjDiszHGsQg8EW1gaHhKIhYLkIYVq4MaSKWpyCfXkrh+pH4bTg8EQSyU+0OjDCxgAHPw3qEcGcLjArjcsIT+AA1UI9MAxfifNqKLasYrWImnDDQamKADCy2W4W5cCwOgFQq0RPZHAV-AA1Gd4JVBfwADIQT7ULrVLnUH4KuAsg5HfgARTawQt8uCoytCuwMCWEMarE8rB8-AAonDMUVtFgEjwujw4FSaeiXIolHA1hBIIx+NQ2rBbaUiANo7H43AKCxyjUlrJSDA3jEANZwATIbpHAC6S0wWA4r1b-GQOGYzBbJxYZGYcFCaVYJ2E3UUwX4NAmtpA3es3o4AFkEhhYjAplh7PbSU6XdRqjrJRi4ZDg6U4CPqFhGG0sImEfUQFJJ2gbAVMI9iSh2HC9KwDbEg6AFAewTRCH+I5jiBSFgYcEEYPwH4KpEMEXihTaIcIUgasySBIQA6iEEHkYmuJZLEbIcpqsa6gqTFGiaZrXh4IDuJ2DAVNe+BEKQ5AwFQtAgAwnozmw+DGAJQA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

## Step 3: Create Project Configuration

Now create a project-specific configuration.

Create `.promptscript/project.prs` in your project:

```promptscript
@meta {
  id: "checkout-app"
  syntax: "1.0.0"
}

# Inherit from frontend team (which inherits from org)
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
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-hACaIAEAHSY4YjANbMArlgC0GNGmGDW-fnACe7DIQHCAjBQAMx5awC+KlQGJ+ASVajqELPzDVmJNx-ace-DlJ+AAoAdxwIRhx+CEcYZyw4b09+ZmoAcwBKFQABWKcXfhyMRhIYAHp3Ng5WHllAkitWHJZfQldgFTUaZgArMSw9EABhUQlpVwBBRShI7Ag2MzUeeEZnNCwF1iGAUVkWEjLqRhh+KLFJGTcoZlCzLqEQZSfVfgAVCKSIJNxT8-GrgpyHNNmw3Gl+JNhgBZHYAciSMH2niOJ345GwYDSJAoDwA0jANG4YNgpNR4IgHrJ+NCpFBNrI4Bw0GcxpdXKEIAAvDDUHhU-gABQwGjK7HRHhOcDgsXS-E5uH4AGUsOsYALJjweOTpfwAG4YWY8eaLV7UgDyfPi6ikh15RIwtTObEg1BIJtYD2eZksntYtkFHn6jDkcDQYggkEY6iwjuNfLguSINX8TLjvJ4SU6rxYKwE2bUag4TNl+YehedeviGHSMAEAA4AKzlwswABMdf45IAjlIIOT+a81L7h001CUpTKAEbQFwaMtD+WMGtDNsUfSQyZLQs9vsDgSqqTq16+325OA4NJYRgyLNekDlf7s4RDAASMCgLIV0SfE2ut34G50kibdhHKTBRU4LAX0ed9P3lFxohVNV0RFMVXFiDh0moD1QIfDB9H0DQYOEAAlGA9QgGBQmdFZwWofgJ3gadZywIlvjgI9ExeM9mnEVhblgHha34AtHm9V5rFsSZBTsfgdlqNBmEwxM-TUalBXNJU3n4coFAgR82QmR9yWwU5qWGUyOFZC4-zgZitgFQUAFUdL0tADN-GRykQXh+GpZy0GNayvOgs0hS0tz9MM2zvN8nhH08cgYGsiyktgay0DJKIMHssd+Ck-gCSJYYkrYKDVIFUZYqwAB1bkM38mkMFiBCeT5Z1tFieINS1HU4AAMWxJqlQiRRZXKGcoFmVg5QwPrmKctCoKGt0RtVCBw3k2B0K+XxsNw8LLRWaglVtd1qCJCzeVcTi7Uu-geG+DFiNeb0eJAcwAF0GCgy78CIUhkqoWgQAYKtaC2fB9E+oA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

## Step 4: Configure the Project

Create `promptscript.yaml`:

```yaml
input:
  entry: .promptscript/project.prs

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
```

## Step 5: Compile and Verify

Compile all targets:

```bash
prs compile
```

Preview without writing files:

```bash
prs compile --dry-run
```

Validate your configuration:

```bash
prs validate
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

## Step 6: Add to CI/CD

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

## Next Steps

You now have a complete PromptScript setup! Here's what to explore next:

- [Language Reference](reference/language.md) - Full syntax documentation
- [Inheritance Guide](guides/inheritance.md) - Advanced inheritance patterns
- [Enterprise Setup](guides/enterprise.md) - Organization-wide deployment
- [CLI Reference](reference/cli.md) - All available commands
