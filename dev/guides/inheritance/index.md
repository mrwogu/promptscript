# Inheritance Guide

Learn how to build scalable, maintainable instruction hierarchies using PromptScript's inheritance system.

## Overview

PromptScript uses single inheritance to build hierarchical instruction sets:

```
flowchart TD
    A["@org/base<br/>Organization defaults"] --> B["@org/frontend<br/>Frontend team"]
    A --> C["@org/backend<br/>Backend team"]
    B --> D["project-web<br/>Web application"]
    B --> E["project-mobile<br/>Mobile app"]
    C --> F["project-api<br/>API service"]
```

## Basic Inheritance

Use `@inherit` to extend another PromptScript file:

```
@meta {
  id: "my-project"
  syntax: "1.0.0"
}

@inherit @company/frontend-team
```

The child inherits all blocks from the parent, which can then be extended.

## Registry Structure

Organize your registry with namespaces:

```text
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

```
# parent.prs
@meta {
  id: "parent"
  syntax: "1.0.0"
}

@identity {
  """
  You are a helpful assistant.
  """
}
```

```
# child.prs
@meta {
  id: "child"
  syntax: "1.0.0"
}

@inherit ./parent

@identity {
  """
  You specialize in React development.
  """
}
```

```markdown
## Identity

You are a helpful assistant.

You specialize in React development.
```

### Objects (Deep Merge)

`@standards` and object properties deep merge:

```
# parent.prs
@meta {
  id: "parent"
  syntax: "1.0.0"
}

@standards {
  code: ["Follow clean code principles", "Testing required"]
}
```

```
# child.prs
@meta {
  id: "child"
  syntax: "1.0.0"
}

@inherit ./parent

@standards {
  code: ["Use React framework", "80% test coverage required"]
}
```

```yaml
code:
  # Arrays are concatenated (parent first, then child)
  - Follow clean code principles
  - Testing required
  - Use React framework
  - 80% test coverage required
```

### Arrays (Concatenate)

`@restrictions` and array values concatenate:

```
# parent.prs
@meta {
  id: "parent"
  syntax: "1.0.0"
}

@restrictions {
  - "Never expose secrets"
}
```

```
# child.prs
@meta {
  id: "child"
  syntax: "1.0.0"
}

@inherit ./parent

@restrictions {
  - "Always use TypeScript"
}
```

```markdown
## Restrictions

- Never expose secrets
- Always use TypeScript
```

### Shortcuts (Override)

`@shortcuts` entries override by key:

```
# parent.prs
@meta {
  id: "parent"
  syntax: "1.0.0"
}

@shortcuts {
  "/test": "Write unit tests"
  "/docs": "Generate documentation"
}
```

```
# child.prs
@meta {
  id: "child"
  syntax: "1.0.0"
}

@inherit ./parent

@shortcuts {
  "/test": "Write tests with Vitest"
  "/lint": "Run ESLint"
}
```

```markdown
## Shortcuts

| Command | Description |
|---------|-------------|
| /test | Write tests with Vitest |
| /docs | Generate documentation |
| /lint | Run ESLint |
```

## Using [@extend](https://github.com/extend "GitHub User: extend")

The `@extend` block modifies specific paths:

### Extending Top-Level Blocks

```
@inherit @company/base

# Add to identity
@extend identity {
  """
  Additional identity context.
  """
}
```

### Extending Nested Paths

```
@inherit @company/base

# Modify nested structure
@extend standards.code.testing {
  e2e: required
  coverage: 90
}
```

### Multiple Extensions

```
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

### Skill-Specific Extend Semantics

When `@extend` targets a skill definition, individual skill properties follow dedicated merge strategies rather than the generic block merge rules:

| Strategy          | Properties                                                                                                         |
| ----------------- | ------------------------------------------------------------------------------------------------------------------ |
| **Replace**       | `content`, `description`, `trigger`, `userInvocable`, `allowedTools`, `disableModelInvocation`, `context`, `agent` |
| **Append**        | `references`, `examples`, `requires`                                                                               |
| **Shallow merge** | `params`, `inputs`, `outputs`                                                                                      |

Example — overlay content and add a reference file without replacing the base skill's references:

```
@use @company/skills as skills

@extend skills.code-review {
  content: """
  Enhanced review with stricter security checks.
  """
  references: [
    ./extra-context.md
  ]
}
```

The overlay's `references` list is appended to the base skill's list. The `content` field replaces the base skill's content entirely.

#### Reference Negation

Use the `!` prefix to remove entries added by a lower layer:

```
@use @company/skills as skills

@extend skills.code-review {
  references: [
    "!references/deprecated-patterns.md"
    "references/new-patterns.md"
  ]
  requires: [
    "!legacy-tool"
    "modern-tool"
  ]
}
```

Negation uses normalized path matching — `"!./references/foo.md"` matches `"references/foo.md"`. If a negation doesn't match any base entry, a warning is logged during compilation.

Negation applies to append-strategy properties only (`references`, `requires`). The `!` prefix is only meaningful in `@extend` blocks — using it in a base skill definition triggers a validator warning (PS028).

## Composition with [@use](https://github.com/use "GitHub User: use")

Use `@use` to import and merge fragments (like mixins):

```
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

### How [@use](https://github.com/use "GitHub User: use") Differs from [@inherit](https://github.com/inherit "GitHub User: inherit")

| Feature                                                                | `@inherit`                                    | `@use`                                                                    |
| ---------------------------------------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------- |
| **Quantity**                                                           | Single parent only                            | Multiple allowed                                                          |
| **Semantics**                                                          | "IS-A" (this project IS a TypeScript library) | "HAS-A" (this project HAS security standards)                             |
| **Purpose**                                                            | Define fundamental project type               | Add optional capabilities                                                 |
| **Merge precedence**                                                   | Child overrides parent                        | Later [@use](https://github.com/use "GitHub User: use") overrides earlier |
| **[@extend](https://github.com/extend "GitHub User: extend") support** | Always available                              | Only with alias                                                           |

### When to Use Which

**Use `@inherit` for:**

- Defining your project's fundamental type (library, backend, frontend)
- Building organizational hierarchies (base → team → project)
- When you want a single, clear inheritance chain

```
# This project IS a TypeScript library
@inherit @stacks/typescript-lib
```

**Use `@use` for:**

- Adding optional capabilities (security, testing, quality)
- Mixing in reusable fragments
- When you need multiple imports

```
# This project HAS these capabilities
@use @core/security
@use @core/quality
@use @fragments/testing
```

### Merge Precedence

When the same property exists in multiple sources:

```text
@inherit @stacks/typescript-lib    # Base values
@use @core/security                # Overrides @inherit for same keys
@use @core/quality                 # Overrides earlier @use for same keys
@standards { ... }                 # Local values override everything
```

**Rule:** Later sources override earlier sources for the same keys.

```
flowchart LR
    A["@inherit<br/>(base)"] --> B["@use #1"] --> C["@use #2"] --> D["Local<br/>(wins)"]
```

### Fragment Files

Create reusable fragments:

```
# @fragments/testing.prs
@meta {
  id: "@fragments/testing"
  syntax: "1.0.0"
}

@standards {
  testing: ["Use vitest as test framework", "Maintain 80% code coverage", "Write unit and integration tests"]
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

```
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

```
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

```
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

```
@inherit @company/frontend@1.0.0
```

### 5. Document Inheritance Chains

Include comments explaining the hierarchy:

```
# Inheritance chain:
# @company/base → @company/frontend → this file
@inherit @company/frontend
```

## Common Patterns

### Platform-Specific Configurations

```
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

```
# Use shared security, override team-specific
@inherit @company/frontend
@use @core/security
@use @core/compliance

@extend standards.security {
  additionalRules: ["CSP headers"]
}
```

### Environment-Specific Extensions

```
@inherit @company/frontend

@context {
  environment: production
}

@extend restrictions {
  - "No console.log statements"
  - "No debug code"
}
```

## Parameterized Inheritance (Templates)

PromptScript supports parameterized inheritance, allowing you to create reusable templates with configurable values. This is similar to generics in programming languages or Handlebars-like templates.

### Defining Parameters

Define parameters in the `@meta` block using the `params` field:

```
# @stacks/typescript-lib.prs
@meta {
  id: "@stacks/typescript-lib"
  syntax: "1.0.0"
  params: {
    projectName: string
    runtime: string = "node18"
    strict?: boolean
    testFramework: enum("vitest", "jest", "mocha") = "vitest"
  }
}

@project {
  name: {{projectName}}
  runtime: {{runtime}}
}

@standards {
  testing: ["Use {{testFramework}} for all tests"]
}
```

### Parameter Types

| Type      | Syntax                 | Description             |
| --------- | ---------------------- | ----------------------- |
| `string`  | `name: string`         | Text value              |
| `number`  | `count: number`        | Numeric value           |
| `boolean` | `enabled: boolean`     | True or false           |
| `enum`    | `mode: enum("a", "b")` | One of specified values |

### Parameter Modifiers

| Modifier | Syntax                   | Description                         |
| -------- | ------------------------ | ----------------------------------- |
| Required | `name: string`           | Must be provided                    |
| Optional | `name?: string`          | Can be omitted (value is undefined) |
| Default  | `name: string = "value"` | Uses default if not provided        |

### Passing Parameters

Pass parameters when using `@inherit` or `@use`:

```
# project.prs
@meta {
  id: "my-app"
  syntax: "1.0.0"
}

@inherit @stacks/typescript-lib(projectName: "my-app", runtime: "node20")
```

Or with `@use`:

```
@use ./fragments/testing(framework: "vitest", coverage: 90)
```

### Template Variables

Use `{{variable}}` syntax to reference parameters in content:

```
@meta {
  id: "template"
  syntax: "1.0.0"
  params: {
    projectName: string
    author: string = "Team"
  }
}

@identity {
  """
  You are working on {{projectName}}.
  This project is maintained by {{author}}.
  """
}

@project {
  name: {{projectName}}
  maintainer: {{author}}
}
```

### Complete Example

```
# @stacks/react-app.prs
@meta {
  id: "@stacks/react-app"
  syntax: "1.0.0"
  params: {
    projectName: string
    port: number = 3000
    strict: boolean = true
  }
}

@identity {
  """
  You are a React developer working on {{projectName}}.
  """
}

@context {
  project: {{projectName}}
  devServer: "http://localhost:{{port}}"
  strictMode: {{strict}}
}

@standards {
  code: ["TypeScript strict mode enabled"]
}
```

```
# project.prs
@meta {
  id: "checkout-app"
  syntax: "1.0.0"
}

@inherit @stacks/react-app(projectName: "Checkout App", port: 8080)

@identity {
  """
  You specialize in e-commerce checkout flows.
  """
}
```

```markdown
## Identity

You are a React developer working on Checkout App.

You specialize in e-commerce checkout flows.

## Context

- project: Checkout App
- devServer: http://localhost:8080
- strictMode: true

## Standards

### Code
- TypeScript strict mode enabled
```

### Template Variables vs Environment Variables

PromptScript has two interpolation mechanisms:

| Feature               | Syntax    | Resolved At  | Purpose                       |
| --------------------- | --------- | ------------ | ----------------------------- |
| Environment Variables | `${VAR}`  | Parse time   | System configuration, secrets |
| Template Variables    | `{{var}}` | Resolve time | Parameterized templates       |

```text
@context {
  # Environment variable - resolved during parsing
  apiKey: ${API_KEY}

  # Template variable - resolved during inheritance
  project: {{projectName}}
}
```

### Validation Errors

PromptScript validates parameters at compile time:

**Missing required parameter:**

```text
Error: Missing required parameter 'projectName' for template '@stacks/react-app'
```

**Unknown parameter:**

```text
Error: Unknown parameter 'unknownParam' for template '@stacks/react-app'.
Available parameters: projectName, port, strict
```

**Type mismatch:**

```text
Error: Type mismatch for parameter 'port': expected number, got string
```

**Invalid enum value:**

```text
Error: Type mismatch for parameter 'mode': expected enum("dev", "prod"), got "staging"
```

### Best Practices

1. **Use descriptive parameter names** - `projectName` instead of `name`
1. **Provide sensible defaults** - Reduce required parameters
1. **Document parameters** - Add comments explaining each parameter
1. **Validate with enums** - Use enums for constrained choices
1. **Keep templates focused** - One purpose per template

```
@meta {
  id: "@stacks/api-service"
  syntax: "1.0.0"
  params: {
    # Name of the API service
    serviceName: string

    # HTTP port for the service (default: 3000)
    port: number = 3000

    # Environment mode
    mode: enum("development", "staging", "production") = "development"
  }
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

```text
Error: Circular inheritance: a → b → a
```

Ensure no circular references in your inheritance chain.

**Parent not found:**

```text
Error: Cannot resolve @company/unknown
```

Check registry configuration and file paths.

**Version mismatch:**

```text
Warning: Requested @company/base@2.0.0, found 1.5.0
```

Update version constraints or registry.
