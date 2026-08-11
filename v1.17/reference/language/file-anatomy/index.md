# File Anatomy

A `.prs` file contains metadata, composition directives, content blocks, and modification operations. Syntax `1.5.0` applies top-level declarations in source order.

## Recommended Structure

```
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

`@meta` should appear first. Imports normally come before local content. `@extend` and `@override` should appear after targets they modify.

## Public Blocks

| Group             | Blocks                                                                         |
| ----------------- | ------------------------------------------------------------------------------ |
| Core instructions | `@identity`, `@context`, `@standards`, `@restrictions`, `@knowledge`, `@local` |
| Interaction       | `@shortcuts`, `@guards`, `@params`, `@examples`                                |
| Agent platform    | `@skills`, `@agents`, `@workflows`, `@hooks`, `@mcpServers`, `@plugins`        |
| Composition       | `@inherit`, `@use`, `@extend`, `@override`                                     |
| Presentation      | Contextual `@header` entries inside supported owner blocks                     |

`@commands` remains a compatibility alias for `@shortcuts`. `@prompts` is reserved for internal compiler use.

## Related Reference

- [Values and Block Bodies](https://getpromptscript.dev/v1.17/reference/language/values-and-block-bodies/index.md)
- [Execution Order](https://getpromptscript.dev/v1.17/reference/language/execution-order/index.md)
- [Merge and Replacement](https://getpromptscript.dev/v1.17/reference/language/merge-and-replacement/index.md)
- [Complete Language Reference](https://getpromptscript.dev/v1.17/reference/language/index.md)
