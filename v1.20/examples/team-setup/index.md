# Team Setup Example

Configuration for multiple projects sharing a team base.

## Project Structure

```text
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
└── project-c/            # Not yet initialized - no promptscript.yaml
    └── ...
```

## Shared Configuration

### registry/[team/frontend.prs](https://github.com/team/frontend.prs "GitHub Repository: team/frontend.prs")

```
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
    "Use TypeScript for all code",
    "Prefer functional programming style",
    "Use functional components with hooks",
    "React Query for server state, Zustand for client state"
  ]

  testing: [
    "Use Vitest as test framework",
    "Maintain 80% code coverage",
    "Write unit and integration tests"
  ]

  accessibility: [
    "Follow WCAG 2.1 AA guidelines",
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

## Project Configurations

### project-a/.promptscript/project.prs

```
@meta {
  id: "customer-dashboard"
  syntax: "1.5.0"
}

# In a multi-file setup, you would inherit from team:
@inherit @team/frontend

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

### project-a/promptscript.yaml

```yaml
id: customer-dashboard
syntax: '1.5.0'

input:
  entry: .promptscript/project.prs

registry:
  path: ../registry

targets:
  - github:
      output: .github/copilot-instructions.md
  - claude:
      output: CLAUDE.md
  - cursor:
      output: .cursor/rules/project.mdc
```

### project-b/.promptscript/project.prs

```
@meta {
  id: "admin-portal"
  syntax: "1.5.0"
}

# In a multi-file setup, you would inherit from team:
@inherit @team/frontend

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

### project-b/promptscript.yaml

```yaml
id: admin-portal
syntax: '1.5.0'

input:
  entry: .promptscript/project.prs

registry:
  path: ../registry

targets:
  - github
  - claude
  - cursor
```

## Inheritance Visualization

```
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

Or use a script. It skips directories that are not yet initialized, so a new `project-c/` without a `promptscript.yaml` does not break the loop:

```bash
#!/bin/bash
for dir in project-*/; do
  if [ ! -f "$dir/promptscript.yaml" ]; then
    echo "Skipping $dir (no promptscript.yaml)"
    continue
  fi
  echo "Validating and compiling $dir..."
  (cd "$dir" && prs validate --strict && prs compile)
done
```

### Validate

Validation runs per project, because each project owns its own `promptscript.yaml` and `promptscript.lock`:

```bash
cd project-a && prs validate --strict
cd ../project-b && prs validate --strict
```

### Update Team Config

When you update `@team/frontend`:

1. Tag the registry change (for example `v1.2.0`) and review it like any other code
1. Notify team members
1. Each project recompiles to get updates

## CI/CD Integration

### GitHub Actions

Each project owns its own `promptscript.yaml`, so CI runs per project. Path filters keep jobs scoped, and `working-directory` points each job at its project:

```yaml
# .github/workflows/promptscript.yml
name: PromptScript CI

on:
  push:
    paths:
      - 'project-*/.promptscript/**'
      - 'project-*/promptscript.yaml'
      - 'project-*/promptscript.lock'
      - 'registry/**'

jobs:
  validate:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        project: [project-a, project-b]
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
        working-directory: ${{ matrix.project }}
        run: prs validate --strict

      - name: Check compiled files
        working-directory: ${{ matrix.project }}
        run: |
          prs compile
          git diff --exit-code
```

## Best Practices

### Team Config

1. Keep team config focused on shared patterns
1. Don't include project-specific details
1. Version and changelog team updates
1. Document breaking changes

### Project Config

1. Override only what's needed
1. Add project-specific context
1. Include relevant API documentation
1. Keep shortcuts relevant to the project

### Registry Management

1. Use a separate repository for the registry
1. Review changes before merging
1. Tag releases for version tracking
1. Communicate updates to team

## Next Steps

- [Enterprise Setup](https://getpromptscript.dev/v1.20/examples/enterprise/index.md) - Organization-wide deployment
- [Inheritance Guide](https://getpromptscript.dev/v1.20/guides/inheritance/index.md) - Advanced patterns
