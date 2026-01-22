---
title: Inheritance Guide
description: Building scalable instruction hierarchies with PromptScript
---

# Inheritance Guide

Learn how to build scalable, maintainable instruction hierarchies using PromptScript's inheritance system.

## Overview

PromptScript uses single inheritance to build hierarchical instruction sets:

```mermaid
flowchart TD
    A["@org/base<br/>Organization defaults"] --> B["@org/frontend<br/>Frontend team"]
    A --> C["@org/backend<br/>Backend team"]
    B --> D["project-web<br/>Web application"]
    B --> E["project-mobile<br/>Mobile app"]
    C --> F["project-api<br/>API service"]
```

## Basic Inheritance

Use `@inherit` to extend another PromptScript file:

```promptscript
@meta {
  id: "my-project"
  syntax: "1.0.0"
}

@inherit @company/frontend-team
```

The child inherits all blocks from the parent, which can then be extended.

## Registry Structure

Organize your registry with namespaces:

```
registry/
├── @company/
│   ├── base.prs           # Organization base
│   ├── frontend.prs       # Frontend team
│   ├── backend.prs        # Backend team
│   └── mobile.prs         # Mobile team
├── @core/
│   ├── security.prs       # Security standards
│   └── compliance.prs     # Compliance rules
└── @fragments/
    ├── testing.prs        # Testing patterns
    └── logging.prs        # Logging standards
```

## Merge Behavior

Different blocks merge differently during inheritance:

### Text Blocks (Concatenate)

`@identity`, `@knowledge`, and text content in other blocks concatenate:

=== "Source"

    ```promptscript
    # Parent
    @identity {
      """
      You are a helpful assistant.
      """
    }

    # Child
    @inherit ./parent

    @identity {
      """
      You specialize in React development.
      """
    }
    ```

=== "Merged Output"

    ```markdown
    ## Identity

    You are a helpful assistant.

    You specialize in React development.
    ```

### Objects (Deep Merge)

`@standards` and object properties deep merge:

=== "Source"

    ```promptscript
    # Parent
    @standards {
      code: {
        style: "clean"
        testing: required
      }
    }

    # Child
    @inherit ./parent

    @standards {
      code: {
        frameworks: [react]  # Added
        testing: {           # Overrides primitive with object
          required: true
          coverage: 80
        }
      }
    }
    ```

=== "Merged Output"

    ```yaml
    code:
      style: "clean"         # From parent
      frameworks: [react]    # From child
      testing:               # Child object replaces parent primitive
        required: true
        coverage: 80
    ```

### Arrays (Concatenate)

`@restrictions` and array values concatenate:

=== "Source"

    ```promptscript
    # Parent
    @restrictions {
      - "Never expose secrets"
    }

    # Child
    @inherit ./parent

    @restrictions {
      - "Always use TypeScript"
    }
    ```

=== "Merged Output"

    ```markdown
    ## Restrictions

    - Never expose secrets
    - Always use TypeScript
    ```

### Shortcuts (Override)

`@shortcuts` entries override by key:

=== "Source"

    ```promptscript
    # Parent
    @shortcuts {
      "/test": "Write unit tests"
      "/docs": "Generate documentation"
    }

    # Child
    @inherit ./parent

    @shortcuts {
      "/test": "Write tests with Vitest"  # Overrides
      "/lint": "Run ESLint"               # Added
    }
    ```

=== "Merged Output"

    ```markdown
    ## Shortcuts

    | Command | Description |
    |---------|-------------|
    | /test | Write tests with Vitest |
    | /docs | Generate documentation |
    | /lint | Run ESLint |
    ```

## Using @extend

The `@extend` block modifies specific paths:

### Extending Top-Level Blocks

```promptscript
@inherit @company/base

# Add to identity
@extend identity {
  """
  Additional identity context.
  """
}
```

### Extending Nested Paths

```promptscript
@inherit @company/base

# Modify nested structure
@extend standards.code.testing {
  e2e: required
  coverage: 90
}
```

### Multiple Extensions

```promptscript
@inherit @company/base

@extend identity {
  """
  You are a frontend expert.
  """
}

@extend standards.code {
  framework: "react"
}

@extend restrictions {
  - "Use functional components only"
}
```

## Composition with @use

Use `@use` to import and merge fragments (like mixins):

```promptscript
@meta {
  id: "my-project"
  syntax: "1.0.0"
}

@inherit @company/frontend

# Import fragments - blocks are merged into your file
@use @core/security
@use @core/compliance
@use @fragments/testing

# With alias - also available for @extend
@use @fragments/api-standards as api
```

### How @use Differs from @inherit

| Feature         | `@inherit`                     | `@use`              |
| --------------- | ------------------------------ | ------------------- |
| Quantity        | Single parent only             | Multiple fragments  |
| Purpose         | Full configuration inheritance | Modular composition |
| Block merging   | All blocks merged              | All blocks merged   |
| @extend support | Always available               | Only with alias     |

### Fragment Files

Create reusable fragments:

```promptscript
# @fragments/testing.prs
@meta {
  id: "@fragments/testing"
  syntax: "1.0.0"
}

@standards {
  testing: {
    framework: "vitest"
    coverage: 80
    patterns: ["unit", "integration"]
  }
}

@shortcuts {
  "/test": "Write comprehensive tests"
  "/coverage": "Check test coverage"
}
```

When imported with `@use @fragments/testing`, these blocks are merged directly into your file.

## Best Practices

### 1. Keep Base Configurations Minimal

Organization base should include only universal standards:

```promptscript
# @company/base.prs
@meta {
  id: "@company/base"
  syntax: "1.0.0"
}

@identity {
  """
  You are an AI assistant at ACME Corp.
  Follow company guidelines and best practices.
  """
}

@restrictions {
  - "Never expose credentials"
  - "Follow data protection policies"
}
```

### 2. Use Team Configurations for Specialization

```promptscript
# @company/frontend.prs
@meta {
  id: "@company/frontend"
  syntax: "1.0.0"
}

@inherit @company/base

@identity {
  """
  You specialize in frontend development.
  """
}

@context {
  """
  Tech stack: React, TypeScript, Vite
  """
}
```

### 3. Project Configurations for Specifics

```promptscript
# project.prs
@meta {
  id: "checkout-app"
  syntax: "1.0.0"
}

@inherit @company/frontend

@context {
  project: "Checkout Application"

  """
  E-commerce checkout flow with Stripe integration.
  """
}
```

### 4. Version Your Registry

Use semantic versioning for registry files:

```promptscript
@inherit @company/frontend@1.0.0
```

### 5. Document Inheritance Chains

Include comments explaining the hierarchy:

```promptscript
# Inheritance chain:
# @company/base → @company/frontend → this file
@inherit @company/frontend
```

## Common Patterns

### Platform-Specific Configurations

```mermaid
flowchart TD
    A["@company/base"] --> B["@company/web"]
    A --> C["@company/mobile"]
    A --> D["@company/backend"]

    B --> E["@company/web-react"]
    B --> F["@company/web-vue"]

    C --> G["@company/mobile-ios"]
    C --> H["@company/mobile-android"]
```

### Shared Standards with Team Overrides

```promptscript
# Use shared security, override team-specific
@inherit @company/frontend
@use @core/security
@use @core/compliance

@extend standards.security {
  additionalRules: ["CSP headers"]
}
```

### Environment-Specific Extensions

```promptscript
@inherit @company/frontend

@context {
  environment: production
}

@extend restrictions {
  - "No console.log statements"
  - "No debug code"
}
```

## Debugging Inheritance

### View Resolved Configuration

```bash
prs compile --dry-run --verbose
```

### Validate Inheritance Chain

```bash
prs validate --verbose
```

### Common Issues

**Circular inheritance detected:**

```
Error: Circular inheritance: a → b → a
```

Ensure no circular references in your inheritance chain.

**Parent not found:**

```
Error: Cannot resolve @company/unknown
```

Check registry configuration and file paths.

**Version mismatch:**

```
Warning: Requested @company/base@2.0.0, found 1.5.0
```

Update version constraints or registry.
