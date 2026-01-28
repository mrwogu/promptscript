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
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAIkxYYABMAA6rQYIgATRIJEhuHUgHow1Nh1ZT5YiXACe7DIVnyAjBQAMVneMFKSpkADF17TtpBiAvmLHdpTiwILH1hXTkvKIiATWYAV0EMahgkwTUND0EpGAA3GChmNBhqQTZ7HFTXTK17GFIKWITBACN46ClBEmYc6lY6JMZGeDgIFthBAHcYFqS0cghGbAg2OEa7HWjWX1Z-FndCLHCN6K87AGJzwQAVGEYcQQBlAUYAaz87AFpBACV6xiOZgAHFMQg9rvpio9GNQIGgsBFvgA1EKpMDMUo5fKFNB8dhJWptDoQVgAc0RNww0EmJKkAGFHo90hjBHBQlASeSvr9-kcAIrxEphdGlOAlfKigQcCkojhswQAahu8GCZMEABkxtRksKWXKsHAPhJLoIAILUe6ogHxFJGwTfZz1LA2mCfFoYMWddFQXqsrDUeLW23cx44ZIwTosMhsIKCDktbXUMIACm4UcwrH0ynaAEoKaaAAoASUEjA5sdJnBKy3KGRIggA8sVWIWS3BioxDSdNj4Ptw2RgtMkpHBjhIWDlZMgIhJ5ABVMU3SEwaGw+HM0oYKBQUs9GC2CSzkAFlJgErpeKsAErVhbwQ0Zik7UkEicv36WAHw-zxdgS-Xtg73TGN2FHGlcEEHBmGYV5DTOQ9Ij+DAAUEAUhQ3VlxXPAcOAGAAteIB1qEVS3LfEcP3eDBAAXTtfVOSnGdIgXVJZRVJJR31dJnxgSYMXeKijwAWSpIwSUEIFLAAUl3HJdwlDBKy-I8AHVYQ4QRLxCAlOhJDgnxrcR9TgiJaN2OxkOGOBRhaaAQn0Ri7CPZxmG3ZhJkEFS6VNABxQQACYKDMM1TUEUl2hyDlWHgZTIlNIYRjGOzQjqNk3xSABHdoUk8Uze3M7gUjZWEANYUdRG5eQADk8nPQjUjLD1R2A6LQK-b5qtq0p6oJMJQmKUFcASI4ACtCOCSAlmCNh2riqBJgwfRRzDLQJkKDApDfQdOhKdRJWwGKqI6kAaolSDhwnVJW0EOcfnVEztj7OAoOoLBGHiA0x0iZQWqCeQnDpFIDrSaKPKQlDfvxcCHmMr95GUKCYP+yJAadVIhHetlmHrcGjkRgSInh-VkfkNTUVSz7CLfNj5W25U0rVTUEx1OGQGUDAzDMfQSZAP5cggXjZLRFlLMS2yOVCWxvBAbxqIYIIk3wIhSHIGAqFoEAGAlUY2HwMwZaAA" target="_blank" rel="noopener noreferrer">
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
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAIkxYYABMAA6rQYIgATRIJFMArnCzM+1ALRSMcHACNmGalPliJcAJ7sMhWfICMFAAxOTrAL5ixAYkEBJcUIkClBYEOqQsIJw-ApodILmzAqCAO5JUFKSrDgw1BBYgmDUqoIcpIjegtwQ2bn5VWUkAPRFbBysxqxi3CzsRAWi4oI0zABWMIxYtiAAwkoqaoIAItp6BkauEtQwaMxw+czU5tMA5vk4CroULM03mKzmTYzzqrmaq-qGxiCeQyY-PyGXh8AEF9AosL8JABlGBQMDqaLUABuEEYMEEWh0nyMhUOgmeyletFKzEEJAwrAwJwxuBgEGoggwjBYCnYcDopkEqJgKUEhykuQ5TI6pWozIA1lEcBA0Hx2RQoYJgYIANIwcyCABiMGwCm2cCV6kEIJZSXYUX4oVYJzgIsyNBgYFynHRhqGxoA8kZcoIZUSjvaxZKaicucbobFdtQCqFGBL+OTKdSYPLIR7BAA5ZihSCMbAQNjDbbO7asN1c-6uDxdVjcCWsZgpWBSGnCSsAzbK0EABV8ggAoh1djUsO6uQAhbQYgCqACUADKyHBYLBoOCIJpNDBoCDXVT3cz75rIuxK4Ggs1s9MSY0AcQHABVBNurxb74nmayLYKBNB3begg9jOz6vt+BTGjOaBaBwTJvumXIXoI3qCrQ4aCA+oECkKgjGguEDKPyPpoRmmEvthtBNIg0i4RhiYUZi-AYP+54qpGaDRjetFkU0cYJmOtH4YRfH8ABtE9p60KgSJAnGjM2zYLSaL8R2VbuL83A6IcWDPAJgwSPITQUfI0wABJwmgqTnERqHqNsUCKZkYBspMhZUlA+TmF2hlfuakJIHIIDmVAlkpNZvnXkmVI0mm1YgG4AC6DCcFgRz4EQpDkDAVC0CADDIkKbn4HY8VAA" target="_blank" rel="noopener noreferrer">
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
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAIkxYYABMAA6rQYIgATRIJEgMUkhFYBaNM2oCo8sRLgBPdhkKz5ARgoAGa7tYBfMWIDEggJLihJAK5QsEVUhYQTh+bzQ6QQNmb0EAdxioKUlWHBhqCCxBMGpmEkEOUkQXQW4VNIys7kKSAHoctg5WKSdWbhZ2IizRcUEaZgArGEYsMxAAQSUVQQAFTW07CWoYDThMzQMxgHNMnG8AIwoWOuPMVgNaxWU1DS0MHRBWiV1Hx97nV3H9mKwn907qKx7oIrtNbtpsppBCQMECdqwtoJGN44Fg8uk4JFNFIMXQ9CDmiEDKiYPkOpAtt5qNgIGwKH8PoIANIwAyCABiMGwVPgf1UggAwii0XxqNDYRgtqTOL9evyAPLUHFi-qMeBrBH4-kAZWJHDJbApVJpbC1gnGQKgBn8jDggikGDgOG+GCV+JedkcrDE3C6nGSqNhDqVdp6+mGVMym2E+IkGG8uBlEEYJtYY212vlgmWAEdvBBli03hI4wmcJoIAAvVNjABKzFgqn2jpgyQAFKDWJE4OFwZEAG4QGBxdIASkWJfjUkyABlmFt4VtZLn84X8V6vT7lqiMiNaaxQ2b5OMoHEMMSkWlGABrQQo9J9dLKOBrNh2-YwMCaGAgvdvif8vIc6IvcUAglMnh-gekJilOmSeq03BOvMyJYIevTyJcEHyGMAASMBQGg8S7OB1zZN4rBQfcUYTphyzgjhcggAA4pw6TYD+9HzHAnogPYAC6DAytQBj4EQpDkDAVC0CADD9hi+74OYfFAA" target="_blank" rel="noopener noreferrer">
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
