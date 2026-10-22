---
title: File Anatomy
description: Complete PromptScript file structure and recommended declaration order
---

# File Anatomy

A `.prs` file contains metadata, composition directives, content blocks, and
modification operations. Syntax `1.5.0` applies top-level declarations in
source order.

## Recommended Structure

```promptscript
@meta {
  id: "checkout-service"
  syntax: "1.5.0"
}

# 1. Establish base layers.
@inherit @company/service
@use @team/backend

# 2. Declare local content.
@identity {
  """
  You are working on the checkout service.
  """
}

@standards {
  @header "Engineering Standards"
  code: ["Use strict TypeScript"]
  testing: ["Use Vitest"]
}

@restrictions {
  - "Never expose payment data"
}

# 3. Modify values after composition.
@override standards.testing {
  ["Use Vitest", "Require integration tests"]
}

@extend standards {
  code: ["Use named exports"]
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAIkxYYABMAA6rQYIgATRIJFMcMRgGtmAVywBaODGoA3CIxjyxEuAE92GQrPkBGCgFYKABhOsAvmLEBiQQ8EAUTgBACMoCDgcQVCMHUEoDHNdOAoxbghWRWoILEFuFjIMVnMAeh19Q2NWbjV47g5SUtiVTilvVj8AJgpBABElROoYBOZGDChBFnZOLDSa6Vnc82FTORATDfFBAE11QQxhwQB3ZmplTIBzQTZBXBHGRRV1PIqDI3mJTfcvVnSQ4pSQ5SOCrbbcRQYKS6daBViXTIwXRXQQAZQErCB1BB7gkLGhsmQ8gAqvEQjlGHkACrmNAwVGMHJoLDyAC6aw4ISuhJJ8QAarl4CyQOzPB1uMNyYYsBA2KDRNtNOsAHIwPQwohoZjxTDmPjsQRAgQ-Dp+ADMvQAsswpBAwCs9BM1PADmAONQpswyNrcrLWPNuMx1dQctDBADMcDUpyZfCwRIiSBSSMBTH5HR1gAlGAARzUECOmQ4l2o2D9dyFcDZYl+6SIHEx4YxWJB8c9BMEieTglYpBgUkEmrOWCrIprIA8dHQ2DwiBABS9mBK5V07xgVFoIAY0wbWHwflRajQ5Ag-fDzDuikHxDIsEE1DUrFB2XXgmVzDymGoeWYYEvIykMY1H1AQZTYDNAR7D8DnvGAJkETAVAwS513SPgBDbaRbHnQolzKN4qlxcNLAEGx1gcAA2VwiJICBCEyWQsAfapfm4CMW3lNZ8RgHkQAABUSIwcGYKBoQ9djgWrbYY25Tt5AEjAhJEsSm0BSSxzFGpJSY6U-U4xV1gUpTRJhbSKTAv4tg8CcpxATBcB4RoSGaRTlDaDd6CYNhd33NEjxPM84Ave5r1IcgRgfJ9BBfXp30-Q4fz-ELAMYYDZjLcCDkbVhoKEYZ4MQ5RkNQmp0KEBUJCw9YGjg5yWjczEiIsKwyPsCgqLcLYJFo+jWEY5ia3+ZsozbbjeKMmBhJM8ThuxKSJBk+FxsEyblJhCS5o01izN0uU2yVeSVqmlSdspP0fgnVkGFmahzHwIgwsoGhPODOA-XwOwJyAA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

`@meta` should appear first. Imports normally come before local content.
`@extend` and `@override` should appear after targets they modify.

## Public Blocks

| Group              | Blocks                                                                         |
| ------------------ | ------------------------------------------------------------------------------ |
| Core instructions  | `@identity`, `@context`, `@standards`, `@restrictions`, `@knowledge`, `@local` |
| Interaction        | `@shortcuts`, `@guards`, `@params`, `@examples`                                |
| Agent platform     | `@skills`, `@agents`, `@workflows`, `@hooks`, `@mcpServers`, `@plugins`        |
| Prompt definitions | `@prompts`                                                                     |
| Composition        | `@inherit`, `@use`, `@extend`, `@override`                                     |
| Presentation       | Contextual `@header` entries inside supported owner blocks                     |

`@commands` remains a compatibility alias for `@shortcuts`. `@prompts` holds
prompt definitions with typed inputs. The validator checks it at syntax `1.6.0`.
Coding agent targets skip it, so it never changes their output, and the opt-in `bundle` and
`prompt-text` targets compile it. See [`@prompts` in the language reference](../language.md#prompts)
and [Application Prompts](../../guides/application-prompts.md).

## Related Reference

- [Values and Block Bodies](values-and-block-bodies.md)
- [Execution Order](execution-order.md)
- [Merge and Replacement](merge-and-replacement.md)
- [Complete Language Reference](../language.md)
