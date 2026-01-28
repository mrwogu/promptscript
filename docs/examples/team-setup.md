---
title: Team Setup Example
description: Multi-project setup with shared team configuration
---

# Team Setup Example

Configuration for multiple projects sharing a team base.

## Project Structure

```
workspace/
├── registry/
│   └── @team/
│       └── frontend.prs          # Shared team config
├── project-a/
│   ├── .promptscript/
│   │   └── project.prs
│   ├── promptscript.yaml
│   └── ...
├── project-b/
│   ├── .promptscript/
│   │   └── project.prs
│   ├── promptscript.yaml
│   └── ...
└── project-c/
    └── ...
```

## Shared Configuration

### registry/@team/frontend.prs

```promptscript
@meta {
  id: "@team/frontend"
  syntax: "1.0.0"
  team: "Frontend"
}

@identity {
  """
  You are a frontend developer on the Frontend team.
  You build modern, accessible web applications.
  """
}

@context {
  """
  ## Tech Stack

  - React 18 with TypeScript
  - Vite for development and building
  - TailwindCSS for styling
  - React Query for server state
  - Vitest + Testing Library for tests

  ## Architecture

  - Feature-based folder structure
  - Shared component library (@company/ui)
  - API client generation from OpenAPI specs
  """
}

@standards {
  code: [
    "Use TypeScript for all code"
    "Prefer functional programming style"
    "Use functional components with hooks"
    "React Query for server state, Zustand for client state"
  ]

  testing: [
    "Use Vitest as test framework"
    "Maintain 80% code coverage"
    "Write unit and integration tests"
  ]

  accessibility: [
    "Follow WCAG 2.1 AA guidelines"
    "Accessibility testing required"
  ]
}

@restrictions {
  - "Never use class components"
  - "Never use any type without justification"
  - "Always handle loading and error states"
  - "Never hardcode API URLs"
}

@shortcuts {
  "/component": "Create a new React component with tests"
  "/hook": "Create a custom React hook"
  "/test": "Write tests using Vitest and Testing Library"
  "/a11y": "Review code for accessibility"
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-hACaIAEAHRAABDqQD0Yamw6sewwa3784AT3YZCA4QEYKABkOLl-cSR0gAYjPacFIJQF8lSkb05YIWNf2BKVRUdHUwBNZgBXfgxqGGj+aVl7fh4YADcYKGY0GGp+NjMcOJsk+TMYUgoA-nCogCMI6B5+EmZU6lY6aMZGeDgIOth+AHcYOui0cghGbAg2OCrTIJMXVjcWO0IsP2rlkJUAYgP+ABUYRhx+AGUsDEYAa1dTAFp+ACUKxm3dAA4R70uJzUOSujGoEDQWGqrwAat44mBmHlUhksmgSJ5omUGk0IKwAObQ04YaDDPE8ADCVyuCSRqh8UDxhJe70+2wAihFcr5EXk4LkMnzbhwiXCOHBtgBqU7wLwE-gAGQG1BiPLp4qwcCeh2OAEFqBd4V8IrFtfxXlYKlgTTBnnUMPzmoioO16dQIsbTSyrjgYjBmiwyGxMYy6irqL4ABQiQOYVhqCSNACURN1AAUAJL8RiMzH4zi5WYFRIkfgAeRyrHTWbgOUYWqWwRWTxEEow8hiPDgO1MLFSAmQ1UCIAAqvzTsCYKDwZDaXkMFAoNm2jATCph2nYmBcgkIqwvnNWAv+DRmPiVSQSEz6WpYGv18Ixwi9we2MfY8H2N2ybh+DhmMw9xavsD4gB8dwclyEZzqoAo7m2HBdAAWhEbZlLy2a5uw9LYKuIEALpmhqTIDkOQijuOYqytE3YagkF4wMMSKPCBw4ALIkpoeL8D8BgAKTLqky6Chg+b3sOADq4IcPwe7eFizR4hw55FsoGrAdUhFrKYdy9HA-R1NA3hqKRpjDlYzCLswwz8BJFK6gA4vwABMFC6Pwuq6vw+KNKkjKsPA4nkbqPR9AMRk+OUErXrEACOjSxA4mnOC2sQSuCr6sN2-gssIABy6Q7qhcQ5g63YfgFX73q8+WFXkxVYr4Pg5P8uCRNsABWqFeJAMxeGw1XBVAwwYGo3a+vIQxZBgPDXu2zS5DIQq4RpuUgAVgp-p2fZxNW-Ajm8CqrasbhwP+1BYIwESaj2w4SBVnjCJYFKxLh8QBTZ4FfMuQaVdsP6XOp97CBI-6AU95EvVacQYNm3XMKWX3bGDLG7CAEgahDwhSfCUU3ah15URKCkytF8pKmGqrA+jGC6LoahY2B6QQIxgkInSulhYZjI+CsIBOPhDCeBG+BEKQ5AwFQtAgAwgr9Gw+C6PzQA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

## Project Configurations

### project-a/.promptscript/project.prs

```promptscript
@meta {
  id: "customer-dashboard"
  syntax: "1.0.0"
}

# In a multi-file setup, you would inherit from team:
# @inherit @team/frontend

@context {
  project: "Customer Dashboard"
  repository: "github.com/company/customer-dashboard"

  """
  ## About

  Self-service dashboard for customers to manage their accounts,
  view orders, and track shipments.

  ## Key Features

  - Account settings and preferences
  - Order history and tracking
  - Support ticket management
  - Notification preferences
  """
}

@knowledge {
  """
  ## API Endpoints

  Base URL: https://api.company.com/v1

  ### Account
  - GET /account - Get account details
  - PUT /account - Update account

  ### Orders
  - GET /orders - List orders
  - GET /orders/:id - Get order details

  ### Support
  - GET /tickets - List tickets
  - POST /tickets - Create ticket
  """
}

@shortcuts {
  "/order": "Help with order-related functionality"
  "/account": "Help with account management"
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-hACaIAEAHSYBXOFmYkY1ALQ8McHACNmGaj2GDW-fnACe7DIQHCAjBQAMlzawC+WrQGJ+ASW0Z+JEVCwQZkWF0YLBE0On49ZhF+AHcoqB5+CFYcaQgsfjBqSX4OUkQnfgABZNTqdOK8kgB6LLYOVg1WLSKWdiIM4C0dGmYAKxhGLBMQAGExCSlqfgARBWVVdRsdahg0Zjh05mo9EYBzdJwRJQoWGrPMVj1qxgnJaTl5lTUNEAdtITev7v5HZwBBFQiLDvHQAZRgUDAMjg0gAbhBGDB+PJFM91JltvxbuJ7rRcsxPBhWBg9sjcDAINMMIwWCJ2HA6D8ETAYvxtjxpIz+MTElhqDSANa6HAQNBSBkUUG-ZwAaRgen4ADEYNgRKs4NKZPx-rSouwglhfKw9nAeY1+DQYGBpJwkZqPtqAPLqaT8UW4nbmvkCxiC5J7H7asGhdbUDK+P3BIkkskSkGO-gAOWYvkgjGwEDYltWNtWrHtP003zs7yKgtYzBisB4ZP4XQ+xeWMp1AAUXPwAKKNdbJLAOn4AIQUyIAqgAlAAyAhwRrQcEQ1WqGDQEFOkkuenXNThpmlfwBevpCZ02oA4p2ACr8ZdHg3n6M0ukGzlYDDQB2n-it0fX2-PjJtVHNB5A4Hk7wTH4D34F1OVoIN+AvP8OS5fhtUnCBxHZV14MTJCbxQ2hqkQXg0MQ6NCJRYJ3ygAcPmgkM0DDE8yPw6pI0FYIzXQzCI0RTj+wQ1snTBP8OK4sjRlWbByX44Ii2+N5S2aVgikUbYsFuft6wU6pCOEEYAAlITQWJDmwuCZFWKAZMSMB6SGLMSSgdI9GbYR-31EEkE+YyoFMmJzKfLyY1JGB4xsWwQFsABdBhOH5PR8CIUhyBgKhaBABg4S5Jz8FMaKgA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

### project-a/promptscript.yaml

```yaml
input:
  entry: .promptscript/project.prs

registry:
  path: ../registry

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

### project-b/.promptscript/project.prs

```promptscript
@meta {
  id: "admin-portal"
  syntax: "1.0.0"
}

# In a multi-file setup, you would inherit from team:
# @inherit @team/frontend

@context {
  project: "Admin Portal"
  repository: "github.com/company/admin-portal"

  """
  ## About

  Internal admin portal for managing customers, orders,
  and system configuration.

  ## Key Features

  - Customer management
  - Order processing
  - System configuration
  - Analytics dashboard
  """
}

@extend standards {
  security: {
    authentication: "SSO required"
    authorization: "Role-based (admin, support, viewer)"
    auditLogging: required
  }
}

@restrictions {
  - "Always check user permissions before actions"
  - "Log all admin actions for audit"
}

@shortcuts {
  "/admin": "Help with admin functionality"
  "/report": "Generate reports"
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-hACaIAEAHRAYeJCKwC0aZtSwYowwa3784AT3YZCA4QEYKABiNLWAX2XKAxPwCSKjPxIBXKFgiTIsNTCzO0dPzqzM78AO4hUDz8Ejgw1BBY-GDUzCT8HKSI1vwAArHxiXmZJAD0KWwcrDyWrLks7ERJwMqqNMwAVjCMWLogAIJiEvwACrLyiiCt-NQwMnCJsup9AOaJOM4ARhQsZbuYrOqlouJSMnIKptNKU1Mq-FY2-ZshWLWq9hzUrAr8J8PnCbJWRODA-NasFb8RjOOBYNLxOCBWQ8RF0aZg6IaOEwdINSArZzUbAQNgUd4PGwAaRg6n4ADEYNgifAKZJ+ABhWHwkjxUHg3GcN73dkAeWoqOo-HajHgC0h03ZAGV1Di8WwCUSSWxFfx+j8oOp3Iw4PweBg4DgXhgJddbqYLKxlLkmpwsfJqjaeKaWvc4N0iYllvxfapVBhnLghRBGNrWH0lUrRTMYABHZwQWY1O5hv6RnCyCAALzjfQASsxYJJNhaYNEABT-ViBOD+QGBABuEBgYXiAEpTLmIzxEgAZZgrCErASzdOZuvTR2O52zOEJHqk1g+3XCfpQMIYVXQuKMADW-FhfLQ8XEcAWbFNmxgYFkMD+G4fg-47OE46hCigP4hgcD8t2BKVh0SB1alyS1xhhLBt3uYRjmA4Q+gACRgKA0HCdYgNOZJnFYUCFCDL8UNmQF0KEEAAHFOHibA3yo8Y4AdEAzAAXQYIVqHUfAiFIcgYCoWgQAYDtEU3fA9E4oA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

### project-b/promptscript.yaml

```yaml
input:
  entry: .promptscript/project.prs

registry:
  path: ../registry

targets:
  github:
    enabled: true
  claude:
    enabled: true
  cursor:
    enabled: true
```

## Inheritance Visualization

```mermaid
flowchart TD
    A["@team/frontend<br/>Team base configuration"] --> B["customer-dashboard<br/>Project A"]
    A --> C["admin-portal<br/>Project B"]
    A --> D["marketing-site<br/>Project C"]

    subgraph "Inherited"
        E["Identity<br/>Standards<br/>Restrictions<br/>Shortcuts"]
    end

    A --- E
```

## Usage

### Compile All Projects

From each project directory:

```bash
cd project-a && prs compile
cd ../project-b && prs compile
```

Or use a script:

```bash
#!/bin/bash
for dir in project-*/; do
  echo "Compiling $dir..."
  (cd "$dir" && prs compile)
done
```

### Validate

```bash
prs validate --strict
```

### Update Team Config

When you update `@team/frontend`:

1. Update version in `@meta`
2. Notify team members
3. Each project recompiles to get updates

## CI/CD Integration

### GitHub Actions

```yaml
# .github/workflows/promptscript.yml
name: PromptScript CI

on:
  push:
    paths:
      - '.promptscript/**'
      - 'promptscript.yaml'

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Checkout registry
        uses: actions/checkout@v4
        with:
          repository: company/promptscript-registry
          path: registry

      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install PromptScript
        run: npm install -g @promptscript/cli

      - name: Validate
        run: prs validate --strict

      - name: Check compiled files
        run: |
          prs compile
          git diff --exit-code
```

## Best Practices

### Team Config

1. Keep team config focused on shared patterns
2. Don't include project-specific details
3. Version and changelog team updates
4. Document breaking changes

### Project Config

1. Override only what's needed
2. Add project-specific context
3. Include relevant API documentation
4. Keep shortcuts relevant to the project

### Registry Management

1. Use a separate repository for the registry
2. Review changes before merging
3. Tag releases for version tracking
4. Communicate updates to team

## Next Steps

- [Enterprise Setup](enterprise.md) - Organization-wide deployment
- [Inheritance Guide](../guides/inheritance.md) - Advanced patterns
