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

# In a multi-file setup, you would inherit from organization:
# @inherit @acme/org

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
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-hACaIAEAHRAABDIxIwA9GGpsOrHgFoOpYYNb9+cAJ7sMhAcICMFAAzn1m-qpJGQAMTntOPKwF8NGgMT8AkpoY-CQArlBYEEqQsNowWCFodPw6zCH8AO6pUDz8EKw4MNQQWPyyzCT8zNQA5hisEABe2BBsiD78InkFRSViEtJV1V6snTycEVg6-MAaWuogVloAmqn8GNQwa6XOCjljAG4wUMxokuz8RGiFWBSz-ADKV4wQGFCNm3n8AEow4lhJABUdFd7owimh-mtFMFmGNqJp0jAAEY2GCMHCsZjHaoQeC3azzDzDEQsFyEEozAkLal3AEFbbyVyo0j8EJweBtaxKb6-RglYwADgyxRw-CBILBEAhd25ADVipswFV+EiQoo3qwhlyxRhoOk8jwAML3e6lZVwSYarVaOUKi38ADUYvgEU1-AAMhAkdR1lMldRURa4DKeX9+ABFEKFP3mwqHAMW7AwO6EhasTysdoAUXJTMG2iwdR46x4cGFuAZLkUSjgTwgkEY-GoYXgGhERF2BaLJbgFBYY2md1kpBgmWoAGs4AJkBs-gBdO6YLAceFT-jIHDMZiTpIsMjMODFFqsJLCDaKQr8GgnYMgBfWRMcACydQw1RgZyw9h+Ycj0cd-CGoy5JEpmIxwJu1BYIwIRYGWlJzCAUh7mgbDjMI9iGrOHBbKwo6hny-AoWh7CLEISGbtuGHkVhvw4UEMEWuUBElJR45kcIUgcBa1HCAA6j0mzcXBrKHm68rCVCOQAi6eTVB6Xo+tQOgeCA7hzgw4zKfgRCkOQMBULQIAMPGh5sPgxhqUAA" target="_blank" rel="noopener noreferrer">
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

# In a multi-file setup, you would inherit from frontend team:
# @inherit @acme/frontend-team

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
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-hACaIAEAHSY4YjANbMArlgC0GNGmGDW-fnACe7DIQHCAjBQAMx5awC+KlQGJ+ASVUZ+JKVCwRZkWOphYpaOn4NaX4Ad2koHn4IVlFqCCx+MGpmEiSU9k4ojlJEG34AARi4hMKMRhIYAHpktg5WHlkckitWApZMwkTgFTUaZgArMSw9EABhUQlpRIBBRSgIRmwINjM1HnhGeLR3NlGAUVkWEkrqRhh+RknJGSSoZlCzXqEQZVfVfgAVHAg4aL-cBcrmIbokFORFss2ElmNR+DMxgBZfYAcj+MCOqVO5345GwYFhJAozwA0jANEkYNgpNR4HkPrJ+IjXO5ZHAOGhLtdpmEIAAvDDUHjPRkABQwGkq7FxKXOcDgMQA5rzcPwAMpYbYwEXwng8Wny-gANwwCx4UNYOoA8kKYHC4FIToKKRgGpc2JBqCQLc83mZLJbWLZRSkhow5HA0GIIJBGOosK7zUK4CoCkR6lF2YnBTw-j0PiwNgJ82o1Bx2Uri89S+6jXaMIqYAIABwAVmrpZgACYm-xaQBHKQQWnCj5qAPj1pqcpyhUAI2gCQ0VbHYSWitGXYo+nhMzWpYHQ5HAk1Um1HwDAdTcBwsKwjBked9ICqwKmMmEowAEjAoJzQgkOBciCPJgPcoT8PciqLPuwhVJgkqcFgn4vD+f4qkBGpariEpSokMQcIq1A+u8ahwRg+j6BoKHCAASjARoQDAEGFhcBJwjO8DzouWAUr8DrwP6rQFOIrAPLAPCNvwJYvH6HzWLYMyinY-D7A0aDMARKaBmoYpWmqnz8FUCgQK+3IyK+tLYBcjJjFZHDAe+iRwFxKw6fwYoAKqGcZaCmW+oJVIgvAefwnloOaDkBdMOqivpPkmWZIEWcFPCvqk5C+DZ-BjBlsAOWgNJXBgLlTvwCn8GSFK5WQbBIdpOoTMlWAAOr8jmoWIhgMS8gKQrutoMR2jqMx6gacAAGKEqFao-IoSpVAuUALKwyoYGNXGxbhSFTV6M2ahAUaqbAeF-ARMBET6DL8DaGzUGqjretQFK2YKzmPc6-A8L8eLUR8frvOYIDmAAugwSHPfgRCkJlVC0CADB1rQbn4PowNAA" target="_blank" rel="noopener noreferrer">
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
