---
title: Multi-File Organization
description: How to organize PromptScript files for complex projects
---

# Multi-File Organization

Learn how to split PromptScript files across multiple files for better organization and maintainability.

## Overview

As projects grow, a single `.prs` file can become unwieldy. PromptScript supports splitting your configuration across multiple files using `@use` imports and a registry structure.

```mermaid
flowchart TB
    subgraph Project["Project Files"]
        main["project.prs<br/>Main entry point"]
    end

    subgraph Fragments["Fragments"]
        security["security.prs<br/>Security rules"]
        testing["testing.prs<br/>Testing standards"]
        docs["documentation.prs<br/>Doc guidelines"]
    end

    subgraph Registry["Registry"]
        base["@company/base<br/>Organization defaults"]
    end

    main --> security
    main --> testing
    main --> docs
    main --> base
```

## File Organization Patterns

### Pattern 1: Responsibility-Based Split

Split by type of concern:

```
.promptscript/
├── project.prs           # Main entry, imports fragments
├── fragments/
│   ├── security.prs      # Security restrictions
│   ├── testing.prs       # Testing standards
│   ├── documentation.prs # Doc guidelines
│   └── code-style.prs    # Coding conventions
└── skills/
    ├── review.prs        # Code review skill
    └── deploy.prs        # Deployment skill
```

**Main entry file:**

```promptscript
# .promptscript/project.prs
@meta {
  id: "my-project"
  syntax: "1.0.0"
}

@inherit @company/frontend

# Import responsibility fragments
@use ./fragments/security
@use ./fragments/testing
@use ./fragments/documentation
@use ./fragments/code-style

@identity {
  """
  You are a senior developer on the Customer Portal team.
  """
}

@context {
  project: "Customer Portal"
  repository: "github.com/company/customer-portal"
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAIkxYYABMAA6rQYIgATRIJEgSATwC0NZgCsYjLPLES4i9hkKz5ARgoAGK7tYBfMWO4RWOGNQhZB3FmQytFAHowajYOVilHVgBiQQBJMmZqL2p4NDY4CAAjaE9FQRCMAHM+djgnAFc4GEEKYOpi0qw4QOrGCo8sRUrq2vrGzmbAjjgsFyKemrrCksGWqWZ2puwINkm+maaWlikYZVHFWCjnXfY84T05EF1r8UEATWYKwQxUl8Fq1lXqQV2ANxgUGYaHcgjYglwNQAwlUsMw+D8AApJARQCEwUgUS43WwOVhOFjsIheUR3NSabSmEAw0bw0HI5IYKC2CSpdKZOHURRUoqeHAVLIUXyBXyYAIi2F06iqFFM3EgOwAXQYgy5+CIpHIMCotBADABtFWrHwZgVQA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

**Security fragment:**

```promptscript
# .promptscript/fragments/security.prs
@meta {
  id: "security-fragment"
  syntax: "1.0.0"
}

@restrictions {
  - "Never expose API keys or secrets in code"
  - "Never commit credentials to version control"
  - "Always validate and sanitize user input"
  - "Never disable security features"
  - "Use parameterized queries for database access"
}

@standards {
  security: [
    "Authentication required"
    "Use RBAC for authorization"
    "Input validation required"
    "Output encoding required"
  ]
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAIkxYYABMAA6rQYIgATRIJEg4MRgFdqELAE8AtGGoYA5n3byxEuBvYZCs+QEYKABkcnWAXzFju1eFjWMsEGxwwqaCWnIgAHIwAG4w1IJEaMyKggCCAAoAkoIA1jAawcwJiozeWMEQ4ixSMC4S4fLRcQksJCTqgmUwtewQGFDBWMyCLXCB1Wy+zFD1YRFpUADuGIWjA9LYMIIYrFKCcLvqEABe28qKCVVoylhzjVGx8YJSEIcARrAHSqrqGoJgGDYVTwe4RACqqUwej4HDUZ32AEdlPEIPAAcUXtgMO8MKkMIxGPA4C53KxPHABHsMNQpMFROJvio1JpZMhQhJ5GlbjhOAFGNgJoJvMiIN4pHNOSBIdsAEoAITSAGEMQkMDziqdBWxJREsqwblh1lBNgE2MKYKLxbr5AB5W6GxKsGpVfQWq09OYAXTErhAri9DD51A0+CIpHIMCotBADDGE3wtn9QA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

**Testing fragment:**

```promptscript
# .promptscript/fragments/testing.prs
@meta {
  id: "testing-fragment"
  syntax: "1.0.0"
}

@standards {
  testing: [
    "Use vitest as test framework"
    "Maintain 80% code coverage"
    "Write unit, integration, and e2e tests"
    "Use MSW for API mocking"
  ]
}

@shortcuts {
  "/test": """
    Write tests using:
    - Vitest as the test runner
    - Testing Library for DOM testing
    - MSW for API mocking
  """
  "/coverage": "Check test coverage and identify gaps"
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAIkxYYABMAA6rQYIgATRIJEgOcLBFYBzALRhqGVX3byxEuAE92GQrPkBGCgAY7B1gF8xY7koyspGalLjDDQUVlNVlkQIl5AFU4GEEANwhgwQx-ZK1SGAB3ZmoAa0cJSJAAWQwVARVBAA5bAFJBFik4lniYbVUYQqL5AHVqJLiAV1Ykukl2GFVtZTZxzylBGAAmOOC4buKYuJKAZV7BMFzBAEEABQBJQRJmRjyVVW6AXTEXVjc4HFysRiGsf1E4jkIAA9MF5JYQAYoUCJP1BkF4P9BEM4A9EBFBOpBAA1QZKFJpHBrJGCagjVjtTHYgAqSIeggAMhAAEbaajGQ7HAAiAHkSoilA9qYI9gcjtRTpdrrd7mpAtDuvIQa12joukhgQBhYl3QVYRrMNodOILSTNdgQMCc1QYNAbGFOEBOJ4MThYDn4IikcgwKi0EAMY1otj4KzOoA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

### Pattern 2: Feature-Based Split

For large projects, split by feature area:

```
.promptscript/
├── project.prs           # Main entry
├── features/
│   ├── auth.prs          # Authentication module
│   ├── payments.prs      # Payment processing
│   ├── notifications.prs # Notification system
│   └── analytics.prs     # Analytics features
└── shared/
    ├── api.prs           # API conventions
    └── database.prs      # Database patterns
```

**Auth feature:**

```promptscript
# .promptscript/features/auth.prs
@meta {
  id: "auth-feature"
  syntax: "1.0.0"
}

@context {
  """
  ## Authentication Module

  - OAuth 2.0 with PKCE
  - JWT tokens with refresh rotation
  - SSO via SAML 2.0
  """
}

@standards {
  auth: [
    "Store tokens in httpOnly cookies"
    "Session timeout: 3600 seconds"
    "Enable refresh token rotation"
  ]
}

@knowledge {
  """
  ## Auth API Endpoints

  - POST /auth/login - User login
  - POST /auth/logout - User logout
  - POST /auth/refresh - Refresh token
  - GET /auth/me - Current user info
  """
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAIkxYYABMAA6rQYIgATRIJEgMAV1wBaMDGyLqMeWIlwAnuwyFZ8gIwUADNd2sAvmLHcW7IlmF65IXT-GCAYgDBAEFlHE4sCEZsCDZBAFlmKUVYJ38VQQB5MNxBACZrQQB3CDyABQBpAGEAUS9MgCkAdQAVQSxmAGtOOBKynEFtMG04QepmASi2BsEAZTmswQA3CCE5kISAGQLbf187R1ZnOAFWKQxqKT7RfyVcWWQvCXk5zu0O7t7JcRwsLDQWVYUAMghY3Qg8DsEheIDm8DgcXEUT4zGUsgAzAA2KxWQRwGCua7QmHyWqsDAAI1gQxgI3gg06PXEEymSJJAF0xEdnF1WMxirApABzGCefY+SVeIKhcKhcoASUE5KkaGYEHYcHSEky5Syc3aAHp7jhDVBmMKNYJMgBVAnUQTmy3HDKCPUGwTG8Jmi1ojy2+2O33KWbuo0mw3DUaDTIAJTp0c+zNmAHFauHvXxrYJqlptOxBIpAxqwMwvAc-PYQPYOQxItQDPgiKRyDAqLQQAxljBaEj8OZq0A" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

### Pattern 3: Environment-Based Split

Different configurations for different environments:

```
.promptscript/
├── project.prs           # Main entry
├── environments/
│   ├── development.prs   # Dev-specific settings
│   ├── staging.prs       # Staging settings
│   └── production.prs    # Production settings
└── fragments/
    └── ...               # Shared fragments
```

**Development environment:**

```promptscript
# .promptscript/environments/development.prs
@meta {
  id: "dev-environment"
  syntax: "1.0.0"
}

@context {
  environment: development

  """
  ## Development Environment

  - Hot reloading enabled
  - Debug logging on
  - Mock services available
  """
}

@local {
  """
  Local development setup:
  - API: http://localhost:8080
  - Database: local PostgreSQL
  - Redis: local instance
  """
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAIkxYYABMAA6rQYIgATRIJEgpMAG4BaTkojU2fdvLES4AT3YZCs+QEYKABht7WAXzFjuLdkSzD9g9Zu2csWUUlGChmNB0sZ3E5ED04mIBiRMEAEWVQ8MjBAFFWDS1WSOiJFUEACWZPakyMKQhWAHMfVgwAI1gpbzL0toBXZrDGxobmtm7BAFlmRgBrQTgYag1GeEEMJQxodthvePsnVhcwxgwoLxj9hIkAGRmzwWDMiICF-j60RAmAQQAFAElZDgsFhPgB6MEnM44ZhwQIADmsiImqWw7Qwi1kUPOv1hWEaNQAygBFG4TABKMHqcCx93ODThGFYqz2cTZYgcIAcAF0GAFqIZ8ERSOQYFRaCAGCFaBA2PgLFygA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

## Using @use for Composition

The `@use` directive imports and merges content from other files - like CSS imports or mixins.

### Basic Import

```promptscript
# Import fragment - blocks are merged into your file
@use ./fragments/security

# Import from registry
@use @company/standards/testing

# Import with alias - for @extend access
@use @core/guards/security as sec
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAICucMAAQUA9GGoYA5iU5Y4IgY17UIWAJ4AdVloDEggJJlm1LIPHMSg6jEkQ4WaptZ8Bg7izIZWahVi8ATDGp-eQ57CFZJLV0DIxNBAHdVHEEMKAgMOEEAWjNjNyIOVn9UxkZ4OC0XIXdjGBFJXiCQhRglFXVUrMUQAF8AXQZZR3wiUnIYKloQBgA3GFoINnwARj6gA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

### How @use Merges Content

When you `@use` a file, all blocks from the source are merged into your file:

| Content Type   | Merge Behavior                                                 |
| -------------- | -------------------------------------------------------------- |
| Text content   | Concatenated (source + target), identical content deduplicated |
| Object content | Deep merged (target wins on key conflicts)                     |
| Array content  | Unique concatenation (preserves order, dedupes)                |
| Mixed content  | Text concatenated, properties deep merged                      |

**Example:**

```promptscript
# security.prs
@restrictions {
  - "Never expose API keys"
}

# project.prs
@use ./security

@restrictions {
  - "Follow OWASP guidelines"
}

# Result: @restrictions contains both items
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gALXxbUIjLBDZwABMAA6rceIC04qSAByMAG4xq4ommZwY4gIIAFAJLiA1jACecZTIC+MmQGJxNZgCsYwqrRluAFcDcQoAegNGIMEsGxdWXn5BYVFWCWlZBSUQADFmKChmAHdxAHkAdSMAZRNxAHMgiAATGCgIVngHVmdWN3EAJXggqCxEcSS4ASERMXEWdgwOiQAjZlxxCA4SBEcAXQZOARt8IlJyGH96EE1aNPwARhBHIA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

### Alias for Selective Extension

When you need to modify imported content rather than just merge it, use an alias:

```promptscript
@use @core/typescript as ts

# Extend specific imported blocks
@extend ts.standards {
  testing: { coverage: 95 }
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gMQAEAooQ6sAJrzhoYjCJEa8IZZtQ5iARlGaMA1nAA6rAAJFhYrHApwsGURmoi4vYPt68OliKwDmiR7xYA3GGoMTxgfAE4AVl4AX30YkBiAXQZOLGoAT3wiUnIYKloQBkDaCDZ8AEZEoA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

Without alias, blocks are simply merged. With alias, you get both:

- Blocks merged into your file
- Prefixed blocks available for `@extend` access

### Import Order Matters

Imports are processed in order. For same-name blocks, content is merged:

```promptscript
@use ./fragments/base         # @shortcuts has /test -> "Run unit tests"
@use ./fragments/advanced     # @shortcuts has /test -> "Run full suite"
# Result: /test -> "Run unit tests\n\nRun full suite" (concatenated)
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAICucMAAQUA9GGoYA5iU5Y4IjABMAbhlaMYiwdu0BiQdzg5m1LI15zBODHEEiOcLIIC0APkEAdEACVerQWC8UFCCcLwQHF4erPre8EFYiHYOTm6ePn6CfhGCKXAe0QWsvv6BwaHhkSCCABQs6ticjYoAlCAAvgC6DLLUAJ74RKTkMFS0IAzKMLQQbPgAjB1AA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

For object properties, later imports override:

```promptscript
@use ./base     # @standards.coverage = 80
@use ./strict   # @standards.coverage = 95
# Result: coverage = 95 (target wins)
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAICucMAAQUA9HCzUIjLINkBiQd3EZWAEwzVVcCiwBuMahgDmQgLyCAnAFYAOqwUAleLyhZEgvQeNnLVwQAosDRMZAHcIVjgAShAAXwBdBk4JAE98IlJyGCpaEAZ9Wgg2fABGOKA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

## Registry vs Local Fragments

### When to Use Registry

- **Shared across projects**: Company-wide standards
- **Versioned**: Need version pinning
- **Team-wide**: Team conventions
- **Reusable**: Generic patterns

```promptscript
@inherit @company/frontend@1.0.0
@use @core/security
@use @fragments/testing
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAICucMAATcW1GAHoBjXtQhYAngB1WfAcLDUMAcxKcsccRzhYIrLSAC+AXQZ7q8-EVLkYVWiAYA3GLQht8AIyWQA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

### When to Use Local Fragments

- **Project-specific**: Only relevant to this project
- **Frequently changing**: Rapid iteration needed
- **Experimental**: Testing new patterns

```promptscript
@use ./fragments/project-specific
@use ./features/checkout
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAICucMAAQUA9GBjZe1eCMY4YjANbNeWEAF8Aug05ZqAT3xFS5GFVogGANxi0IbfAEYNQA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

## Best Practices

### 1. Keep Fragments Focused

Each fragment should have a single responsibility:

```promptscript
# ✅ Good: Single responsibility
# security.prs - Only security rules
# testing.prs - Only testing standards

# ❌ Bad: Mixed concerns
# everything.prs - Security, testing, docs, etc.
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gMQAEcMRgFdqELAE8qtXgFpeAeVZRx-QSLErqQ2HAA6rPhzhYIrAOZS4shUpVGT5-lgysAJhmqu9rfX0Ay5LwAQhiuiLwAshCEMK68LKyMMNSs3nwwAG5J4rimFjRWcgDKaqISdLz2ueWuzIxw5TBYjBQgAL4AugycWNTi+ESk5DCWIAyZtBBs+ACMbUA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

### 2. Use Meaningful Names

```promptscript
# ✅ Good
@use ./fragments/api-conventions
@use ./fragments/error-handling

# ❌ Bad
@use ./fragments/stuff
@use ./fragments/misc
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAICucMAAQUA9GGoYA5iU5Y4IjGggBaFqwBusiGzgAdVnwHCxE6bPkxq1ZtWU4MrACZQIrSfv0BiQYBlyQQCEMR31DIVFxKRl2eTgsXjAwEP4wk0jzERIIOEYQAF8AXQZZagBPfCJSchgqWhAGTVptVnwARjygA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

### 3. Document Dependencies

Add comments explaining why fragments are needed:

```promptscript
# Security compliance required for all ACME projects
@use @core/security

# Frontend testing patterns from design system
@use @acme-ui/testing

# Project-specific payment integrations
@use ./features/stripe-integration
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAICucMAATcW1GAHoBjXtQhYAngB1WygMSCAYtTYdWAE0Ec4WCKwDmgzFg7VWcQWG0lBe+BDOtBcecZgllfALCGIwkMAC0vBDiRibmymqCAAraAFYwjFjhcGgZEJCMlhjyYeyCphxm1NgQbHAB-EIU4mAw2DLwkliyueEVMFU1bCAAvgC6DJzd8vhEpOQwVLQgDABuMLS1rPgAjKNAA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

### 4. Keep Import Lists Organized

```promptscript
# Organization/team base
@inherit @company/frontend

# Core standards (alphabetical)
@use @core/compliance
@use @core/security

# Team fragments
@use @frontend/accessibility
@use @frontend/performance

# Project fragments
@use ./fragments/api
@use ./fragments/testing
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAISs4xqELAAJuLMhlYBPAPRhqbDqwAmAHVYaAxCIDCzajBFwsUlRmoq4IgBQYoaHBgBGMLBEb2AlBu4BXOCNxAxhZCXIIKUYYXwCglkNZQMY-ISxpDW0RABUYUhEFDABzEk4sOFjAsQUlThVZDEZouDgIZ2hhDNZ-Ku4a9jrZNEEwAxIomM1WHQAFRQArGEZRQpKyiu64kQp5amLS9jgGtAhKox3Vg-LZDhM+IpAAXwBdBjLqaXwiUnIYKloQAwAG6CVpsfAARieQA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

### 5. Avoid Deep Nesting

```promptscript
# ✅ Good: Flat structure
@use ./fragments/security
@use ./fragments/testing

# ❌ Bad: Deep nesting
@use ./fragments/standards/code/security/v2/latest
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAICucMAAQUA9GGoYA5iU5Y4IgY17UIWAJ4AdVnwHCxE6bPkc4WCK0latAYkGAZckEAhDABNEggCIwYaQa3hmFlo6QqLiUjLs8qYYrC4Y1C7yLC4wCjBKKuoiAG4ATCJQ2AEgAL4Augyy1Gr4RKTkMFS0IAw5MLQQbPgAjGVAA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

## Example: Complete Multi-File Setup

### Directory Structure

```
my-project/
├── .promptscript/
│   ├── project.prs
│   └── fragments/
│       ├── security.prs
│       ├── testing.prs
│       ├── api-standards.prs
│       └── documentation.prs
├── registry/               # Local registry (optional)
│   └── @team/
│       └── base.prs
└── promptscript.yaml
```

### Main Entry (project.prs)

```promptscript
@meta {
  id: "my-project"
  syntax: "1.0.0"
}

# Inherit team base configuration
@inherit @team/base

# Import project fragments
@use ./fragments/security
@use ./fragments/testing
@use ./fragments/api-standards
@use ./fragments/documentation

@identity {
  """
  You are a senior full-stack developer working on My Project.
  You follow team conventions and project-specific patterns.
  """
}

@context {
  project: "My Project"
  team: "Platform"

  """
  A microservices-based platform for data processing.

  Tech Stack:
  - Backend: Node.js, TypeScript, NestJS
  - Frontend: React, TypeScript, Vite
  - Database: PostgreSQL, Redis
  - Infrastructure: Kubernetes, AWS
  """
}

@shortcuts {
  "/start": "Initialize development environment"
  "/deploy": "Deploy to staging environment"
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-hACaIAEAHRAkAngFoazAFYxGWYYNb9+cUewyEBwgIwUADAcWsAvkqUBifgElWOGNQhZ+HUvwBGGODH4tWkAHMAV2psCDYlAAEIOwcnfkjXEgB6T29zVitrMmZqZylZeX4wUICSTiw4KKDvfgpkkowyirhk70YQp1Fq2vrG5vZWjjgsGICenz7S8sHkjDQIcRGMVh4Mah4q1kiayYbpluSeZg6ZrDCI1ijeCq7+YCUVRRBjFQBNZiD+dZ8MVU5wtRikEoFAludGABrfg8GAANxgUGYaAc-AA7rlIWN+Gx+ABZUT8AAK1BkciwFEe-A+XzAzFBzDRLhgbj8CPY4VYcG+q34BXJSxRjAgkEYfOwHGoXMpyiEL3lSjMV22fg4hGcD1l-Pk2hABOJpMKChesqSuqJUGwdOoJGMVOer34AEF+CQIIxSd5qHD3fBxGkYDw+ZasNaSMVcjDsH8pIx4HAxjKqQAVOQ4fgAZQhkMQVPE-AAQhgoZw+PwAHLMWEUaRwOj8ZOiFEZj0QNBYevl+BYABSGbz-AAYqT2KWBAAlFnyeuN5ut9v1gBqThgA4AItGAwIicwRgFqDAMwBFAAy9cnPAgWxU+dsjRG1CC8hCMAEAGkgu4HKwYMN606AHV+1lB0TSVKI4BwXIsA6Sp7ntEA2nOPJhF1WwnAgDAoAgAAvHxYQRJE0DOfhOB9EczkdYQjhgchmG6JA5TXWikUJLBmFUc4AmxMiIAoipjBMEATAAXQYCpqFEfAiFIcgYCoWgQAYBFaE5fAdGEoA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

### Configuration (promptscript.yaml)

```yaml
version: '1'

project:
  id: my-project
  team: platform

input:
  entry: .promptscript/project.prs
  include:
    - '.promptscript/**/*.prs'

registry:
  path: ./registry

targets:
  - github
  - claude
  - cursor
```

## Compiled Output

When you run `prs compile`, all fragments are merged into a single output per target. The multi-file organization is a source-level concern only.

```bash
prs compile
# Output:
# ✓ .github/copilot-instructions.md
# ✓ CLAUDE.md
# ✓ .cursor/rules/project.mdc
```

## Debugging Multi-File Setup

### View Resolved Configuration

```bash
prs compile --dry-run --verbose
```

This shows how all fragments merge together.

### Validate All Files

```bash
prs validate
```

Validates main file and all imported fragments.

### Check Import Resolution

If imports fail:

1. Check file paths are correct
2. Verify registry path in `promptscript.yaml`
3. Ensure `@meta.id` matches expected paths

## Next Steps

- [Inheritance Guide](inheritance.md) - Deep dive into inheritance patterns
- [Enterprise Setup](enterprise.md) - Organization-wide registries
- [Configuration Reference](../reference/config.md) - Full config options
