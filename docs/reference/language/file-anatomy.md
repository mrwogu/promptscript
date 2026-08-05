---
title: File Anatomy
description: Complete PromptScript 1.6 file structure and recommended declaration order
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
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAIkxYYABMAA6rQYIgATRIJFMcMRgGtmAVywBaODGoA3CIxjyxEuAE92GQrPkBGCgDYKABhOsAvmLEBiQQ8EAUTgBACMoCDgcQVCMHUEoDHNdOApfQW4IVkVqCCwMljIMVnMAeh19QxgJPwAKahgAc0isanNBTUEpSIxwmClBMGZqQXIkxup1VikASnTuNXjuDlJS2JVOAcE6huaQto6unr6BoZGx8wmp2fSAJgpBABElRIaE5kYMKEEWdk4sNKsTJSf55dqicRyEAmaGQgCa6kEGDeAHdhsoso1BGxBLhqoxFCp1PkKgYjICJDD3F5WGJuCFilJkVI4MJTBlFBgQSN5IFWM1WDBdJjBABlATTZlwdwSFgg2TIeQAVXi+0M+QAKuY0DBRYxcmgsPIALrsjghTEK5XxABqeXgRpAps83iBDTVjCwEDYrIhEk68gAcjA9LpBEQ0Mx4phzHx2F1sBhqa6-ABmB4AWWY3TA7T0XzU8CRYA4I0KkbgeW9rEB3GYoeouRBggZkuoLIo5q9-LZkMVIBV1TtXfkdChACUYABHNQQN5ZDgTbDV3EO6VOsQ0ulEDjTFsSpnt33suUwK0D+KsUj9cOESPULDr50eEAeY0Mf5tfBEUjkGBUWgQAYBtKzYfA7FfIA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

`@meta` should appear first. Imports normally come before local content.
`@extend` and `@override` should appear after targets they modify.

## Public Blocks

| Group             | Blocks                                                                         |
| ----------------- | ------------------------------------------------------------------------------ |
| Core instructions | `@identity`, `@context`, `@standards`, `@restrictions`, `@knowledge`, `@local` |
| Interaction       | `@shortcuts`, `@guards`, `@params`, `@examples`                                |
| Agent platform    | `@skills`, `@agents`, `@workflows`, `@hooks`, `@mcpServers`, `@plugins`        |
| Composition       | `@inherit`, `@use`, `@extend`, `@override`                                     |
| Presentation      | Contextual `@header` entries inside supported owner blocks                     |

`@commands` remains a compatibility alias for `@shortcuts`. `@prompts` is
reserved for internal compiler use.

## Related Reference

- [Values and Block Bodies](values-and-block-bodies.md)
- [Execution Order](execution-order.md)
- [Merge and Replacement](merge-and-replacement.md)
- [Complete Language Reference](../language.md)
