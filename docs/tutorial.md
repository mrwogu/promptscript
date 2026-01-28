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
    "Follow clean code principles",
    "Document all public APIs",
    "Write tests for all code"
  ]

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
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAIkxYYABMAA6rQYIgATRIJEhuGRnwD0zagHN5YiXACe7DIVnyAjBQAMl7eMHqNJkAEEAwgFkAooJfq067BBsNgC+YmLc0pxYEFh6wjpyINpJtgCazACughjUMNniTgCS2XBwEHAC7IIA7uoA1hCsGtlYgq6e3r7+0WwUCQBizFBQzNWCLGQYrHEsUo3NFVNSOVJw+VKCAEbwrTRK0YzwfbbJIWGs3Iusy9Sr8bazMLLICRLyg8Oj47BT48xSeRojUYEHI8HkdFeiQAIsxGBk+FUMMNBGgMpsoBBGG0AAqFOAQqHyADq1BieQ4FTWYHU2RRjxsEgAuuddDB4WTYs8iSAAGrI6TYPLIqCCDJwGDUSSsNFYQm2N4gAByMAAbpLBDgVo9BBLGLksASUsyxKFWOFchUyYweqw1qJbABaRIq9VSoh+CW44p1GB6Na0vUGtaNP4AxmCZ3yV0aiYkGK6zhlaLqwTLASCLDMQRuspsP7sahDCNR5xQaoYf05gXpvLijWNWVnc0XOA4dRYeGG+6KlR6jKcvTyRwAJTVEBgYx1NKl-cHOYyUFYkowm2gMQnRoS8hUUjhRscAHFOCuOGm4QiogF8zPMzhymGYCEQMEmQwotQ9PgiKQwVRaCADC5oErD4KYL5AA" target="_blank" rel="noopener noreferrer">
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
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAIkxYYABMAA6rQYIgATRIJEhuGRnwD0Yamw6spAWg6l5YiXACe7DIVnyAjBQAM9w+MH6SVkADEN7TlKcBfMTEAYkEASXEhEgBXKCwIHUhYQTh+aLQ6QRNmaMEAdxyoKUlWHBhqCCxBdWYSQWZqAHMMVggAL2wINkQQwW4IUvLKvqVVBsag1n6pTnisE2EjORBDFecATRzBDGoYbervLWKZgDcYKGY0PnZBIjRyrAolgGV7xggMKHa9gcEAJRgSiwmQAKiZ7s9GBU0MDttpBCRmDNqOI8jAAEYuGCMHCsZgXRoQeBPZyrAKTbgsHyEKqiUkrBlLEFlA6aXxY0iCaKpOA9Zw6f6AxhVawADnylRwgjBEKhEBhSwFADVKnswA1BOjotovqwJvzpRhoHkBlIAMLPZ7VDVwea6-USZWq22CADU0vg8T1ggAMhB0dQdgt1dQsba4IrBUDBABFaLlYM28pnUO27AwJZktaBVi9ACiNPZ4xSAm0OykcAluFZPm0OjgbwgkEYgmosXgYm4RCOJZaUnLcAoLBmi2c6lIMAK1AA1rzBMhdkCALpLTBYDgoufIHDMZizzIsMjMOCVLqsTLyXbacqCGiXCMgFfONMcACyLQwjRg1yw7gB0bjBM3UEM02RpclcymOAd2oLBGGiLBKzpCR5BUQ80DYWZ5HcM1Fw4fZWEnKNhUEdDMPYJwUJAFQdz3bDllwwF8KEeDbVqYiqlo6dKOWFQOFtej5AAdQqfD+MQrkT29FVxLhYoQU9AZGl9f1A2oEwAhAfwlwYWZ1PwIhSHIGAqFoEAGBTE82HwawtKAA" target="_blank" rel="noopener noreferrer">
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
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAIkxYYABMAA6rQYIgATRIJFMcMRgGtmAVywBaDGjTyxEuAE92GQrPkBGCgAZb+1gF8xYgMSCAkuKEk1ULBCakLCCcPxqaHSCRuqCAO7qUFKSrIrUEFiCYNTMJFk57JzJHKSIboLcEKkw6ZncGIx8APTZbBysUpolJC6s3CyFhJmi4oI0zABWSlgWIADCiirqmQCCulAQjNgQbA4SUvCM6WgBbLMAoposJHzUjDCCjIuqGllQzHEOBnIg+r+jABUcBA4JJQbgHk8lC9MjpyJttmwssxqIIVnMALLnADkoJgV1yt3uYyg2DAKJIFG+AGkYEYsjBsGpqPAyqNNIIMX4Apo4Bw0I9nst4hAAF4YahSb4cgAKGCMfHYYxy9zgcCqAHMRbhBABlLDHGDStFSKQstWCABuGA2UkRrGNAHlJTVQmobhL6RgOo82JBqCR7d8-g5nA7WO4ZTkpowtHA0EoIJBGKEBB0JVI4GJuER2sk+d67ZLQSMJCwDrJSxJBBw+ZrK99q77LTUMBqYLIABwAVkb1ZgACYO4IWQBHNQQFlS0YSMOz3oSBqq9UAI2gGSMDZn8S2GtmA4oljRKz21bHE6nsgNaiNozDYezcBwKKwjA0JeDICaUKWGnkswACRgKABTiDIcEFaFhTAd44kEd4NU2U95CaTAFU4LB-x+ICQO1CD9UNMZ5UVTIqg4DVqCDf4JBQjBLEsIwsPkAAlGBLQgGA4PLB5yVRJd4FXdcsHpEE4BvLN-gfPplFYD5YCkdthE-ENRlcdwVhlDxBHODo0GYMis3DCRZUdXUAUEJodAgb8hQ0b8WWwB4OTmByOEg39MjCNUdiMwRZQAVXMyy0Gsn8YSaRBpD8wR-LQO03LC5ZjRlUygqsmyoLsyKpG-XJyH4JzBDmPLYDctBmSeDAwgXQQ1MEWl6WKsg2AwwzjQWTKsAAdTFDNooxDAqhFcVJV9UwqhqY0VlNc04AAMQpaLdWBXRNSaNcoA2VgtQwGaBOS4iMIWgMloNCAE202ASNBMiYAooN2UEZ0DmoXV3UDah6WciVPPez1BCkEFyHlZTfkkkBHAAXQYDDPvwIhSHyqhaBABgW1oHz8EsCGgA" target="_blank" rel="noopener noreferrer">
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
