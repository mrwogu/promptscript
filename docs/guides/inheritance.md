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

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAIkxYYABMAA6rQYIgATRIJEgSATwC0NZgCsYjLPLES4i9hkKz5ARgoAGK7tYBfMWO4RWOGNQhZB3FmQytFAHowajYOVillDlIQOzp0bDxEEB9mPwDg0PZOSOiSKloQBhZsrmSAYkEAZQBXNHIIGClBOGZBXBhBIlJyTuoa1jhBN2oYCkEAOWYvTGovZjB2t0EpZkYaviMsCDY6QX9m1mn9wVGMKEFMRgBrDABzMac+AWE9SRk5FN9MDJCwnKiMFItn0hgEJk+FgArDYQG8SBBCC5ZFh+jAxA5WNw4AIIhhqFIhqJxIIWFIYLJkPIAApQDCMGA4ZhQcnUFq4qT4qTyAC6bw4OJcd0pNLpDKZLPc7IOXN5GKcoxxHm0O0GrxJyk+tPpjOZrNO8FREBVbFsdliPIYnFRinw3TIlBo9BAADd3HBVfgzLEgA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

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

=== "Parent File"

    ```promptscript
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

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gMQAEm1Tliq0AOqwACJGFgy9g43rwgATRL1EgBQzYt5wAnuwyF1mgIwUADNd2sAvuPETVQiFgPy9ukHaUBNZgBXXgxBUN4cGCg0MCCoULg4CDhZdgpvXyzxexB7AF0GIWoDfCJSchgRehAANxhaCDZ8czygA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

=== "Child File"

    ```promptscript
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

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gMQAEjOaABMqtADqsAAiRhYMvYBN68IQxLzFNBUIZqW84AT3YZC6zQEYKABht7WAXwkTJEVjhjUIWXhQD0mNScWM5SqsHehgr6eiD2ygCazACuBmgwjBAYUBAAXjAqrLwASjAYjD5CMABuMFDMaDLsFDFxbRIOIA506Nh4iCCBwaL0TGwcXAN8AMrJaOQQMEIGzLy4BUSk5AXUyaxwvB5BFLwAcsw+gT7MYGsevELMjMlNclgQbHS8GKzLrBffXhBbK8TCMADWGAA5jAWlIZHJokUVGoNIMMEF2PEDMY5GY0VYAKx2OLIkgQQhudRYXYwDouOByX4YoQHRTIlhVdTITQABSg5RgOGYOk8BiZQhZmgAuvoOIy3FDuXyBYwhSKqtRxT9JdRdCBZY4XEFGV4Kh99kjlABaNH8wXC0Vak00iDmtj2ToOaUMYLUQz4TZkSg0Ua1WgW-AWLpAA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

=== "Merged Output"

    ```markdown
    ## Identity

    You are a helpful assistant.

    You specialize in React development.
    ```

### Objects (Deep Merge)

`@standards` and object properties deep merge:

=== "Parent File"

    ```promptscript
    # parent.prs
    @meta {
      id: "parent"
      syntax: "1.0.0"
    }

    @standards {
      code: ["Follow clean code principles", "Testing required"]
    }
    ```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gMQAEm1Tliq0AOqwACJGFgy9g43rwgATRL1EgBQzYt5wAnuwyF1mgIwUADNd2sAvuPES4s1iozUVceXpYqYdWRNADFmKChmAHdeRlgMVljmAP5qCFZGCHJ4TToNEAAVeCx0gHNeQQBHAFcIQRVNAF1xexB7RoYhagN8IlJskXoQADcYWgg2fHM2oA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

=== "Child File"

    ```promptscript
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

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gMQAEjOaABMqtADqsAAiRhYMvYBN68IQxLzFNBUIZqW84AT3YZC6zQEYKABht7WAXwkTJEVjhjUIWXhQD0mNScWM5ScHKsQhjUQnAK+ixCMOrImgCqcDC8AEowGIw+YNSkMADuzNQA1pp0GiAAHNYApLwc4fzMAG6eGADmWUEAjgCuEEG6IAC6Eg4gDnTo2HiIIIHBovRMbBxcK3wAysNo5BAwQgbMrR68RKTkA8OscR5BFLwAcsw+gT7MYFdZITMRjDGQmLAQNi1DCRXisL68eRBDBQXiYRiVPowCguGRyeKsZSqcyraLBezKIwmMx1KwAVjsIH0JAghDc6iw1GGMBmLnCMKiMTiikJHSSKU0AAUoPkYDhmDpPAYIoKJtNRW0IaxehKQNLZfLFdRlQLomreVIguEvAVIU8CcoALR1fWMOUKpLGq2ciC2tj2WYOSYMYLUQz4W5kSg0TbdWh2-AWOZAA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

=== "Merged Output"

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

=== "Parent File"

    ```promptscript
    # parent.prs
    @meta {
      id: "parent"
      syntax: "1.0.0"
    }

    @restrictions {
      - "Never expose secrets"
    }
    ```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gMQAEm1Tliq0AOqwACJGFgy9g43rwgATRL1EgBQzYt5wAnuwyF1mgIwUADNd2sAvuPETBcLNQiMsENnHl6AWg0QADkYADcYal4iNGY4GH0YRkEsODt7EHsAXQYhagN8IlJyGBF6EEjaH1Z8cyygA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

=== "Child File"

    ```promptscript
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

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gMQAEjOaABMqtADqsAAiRhYMvYBN68IQxLzFNBUIZqW84AT3YZC6zQEYKABht7WAXwkTJEVjhjUIWXhQD0mNScWM5SQXBYXoxYEGxwCvoAtBogAIJQAO4YhvEArnAwvAAqhmgwAMqMXmghIBIOIA506Nh4iCCBwaL0TGwcXO185blo5BAwQgbMvLiFRKTkhdS5rPEeQRS8AHLMPoE+zGAzHrxCzIy5MiYxbHS8GKyTrLv3vEEYULyYjADWGADmMAoLhkcgSrGUqnMHQwQXY9mURhMZhSVgArHY6hDeCQIIQ3OpIrkYPUXBEHkJYUJ4opsSwhDB1MhNAAFKAYRgwHDMHSeAxyR5UzQAXX0HAibn+TNZ7M53N51H5FKFIFFjhc4UiEGisVW4OUyRlHK5PIZis1URurHsDQcwoYwWohnw8zIlBoPQAbp44Lr8BZGkA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

=== "Merged Output"

    ```markdown
    ## Restrictions

    - Never expose secrets
    - Always use TypeScript
    ```

### Shortcuts (Override)

`@shortcuts` entries override by key:

=== "Parent File"

    ```promptscript
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

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gMQAEm1Tliq0AOqwACJGFgy9g43rwgATRL1EgBQzYt5wAnuwyF1mgIwUADNd2sAvuPES4OZtSyMArljjy9mgD0HHBYmmYgAOrUEBy8XqyxvCG+dkpBKsyMcOEaIADinDDU2DC8md7SxlgQbHb2IPYAugxC1Ab4RKTkMCL0IABuxXC1rPjmjUA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

=== "Child File"

    ```promptscript
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

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gMQAEjOaABMqtADqsAAiRhYMvYBN68IQxLzFNBUIZqW84AT3YZC6zQEYKABht7WAXwkTJEVjhjUIWXhQD0mNScWM5ScDjM1FiMAK5YcAr6mn4ccCFIGiAA6l4cvKnxvADu3ji8AGre8OlJIH5QbunmIABKMay8AKIAygAyjfYOIA506Nh4iCCBwaL0TGwcXJN83TFo5BAwQgbM+R68RKTkMLzU7QkeQRS8AHLMPoE+zGB7J0LMsTImWBBsdLwYVjbVj3AGnGAYKC8TCMADWGAA5jAKC4ZHJEh0VGpMtN2PZlEYTGZMlYAKx2ED6EgQQhudRYM4wCROMJyIEYahCBKKTEsIQwdTITQABSgGEYMAiOk8BjZQg5uhAAF19AU3AjBSKxRKpfzqLLAfLOZoVY4XEE0l5GD82Nz9ABaTKi8WS5jS-UWhkQa2-ViDYZKhjBaiGfCHMiUGhzABunjgvvwFmGQA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

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

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gMQAEAAiRhYMvDABNxMcbzjNeuCHF5hqGAOZD2vFmWjxebXhCzLmAd1bGruGL3IYAnuurMArq3EAdVoOGjgH15jcUReLwJiMlgIoNlHdgxCMIiARgoAVgoABljWAF8fH34IVhwYahMBXUxWRwB6ACMMOBgi1j4AQUkFeQgpdhNHYqIOTxDOLCHeQKtwkFiFue7xEwg2DCgJwaxHHTYOQiwKOMW8-JB8unRsPEQQfhqMOqaWmCpaEAYWdkmeXgAym40OQINJZPJbLwiKRyHZqB5lOVqO9eAA5ZhYewYahY5hgBTlXjiZiMNxaERTNh0MTjViYsS8FGbbGMADWGnexSEIhmcX6KQeTxezVaeWCcASImS83SWVyS2CJAghFKYSwCLaBWKcBEnhx4mUs2CLCkYWQEQAClAMIwYDhmFApNRZHrxAaIgBdOIcXWldTmq02u0Op0VV3Pd3Ubwgb3a3wo3WVRhU1hGuIAWnm1tt9sdzqZ8A1EBT61Y50unoYk2ojnwMOi7xo9BAADcKnAy-hUpcgA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

### Extending Nested Paths

```promptscript
@inherit @company/base

# Modify nested structure
@extend standards.code.testing {
  e2e: required
  coverage: 90
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gMQAEAAiRhYMvDABNxMcbzjNeuCHF5hqGAOZD2vFmWjxebXhCzLmAd1bGruGL3IYAnuurMArq3EAdVoOGjgH15jcUReLwJiMlgIoNlHdgxCMIiARgoAVgoABljWAF8fH34IVhwYahMBXUxWRwB6ACMMOBgi1j4AWWZxCDBHXlZ4Dhk4LGo3Riw3ajbfIg5PWRFPDGpxOAoWKQoOMdL1XkCrXhgAJhgw2YBHNwhZ7xOWADcKjUveAE5cgpB8unQ2DwiBA-BqGDqTRaMCotBADBY7E4WB4vAAym40OQINJZPJbKcouQ7BNWMpyrMKLwAHLMLD2Nb05hgBTlXjiZiMNxaERYCBsOhiJasOliXizDBQBmMADW7woxSEIiOcQgoXCoPBkOarTywTgCREyQ16SyuRAcRIEEIpTC4zcc0KvjGEPEaw2KqePQ+yAiAAUoBhGDAcMwoFJqMtXe6IgBdOJ7PmsdRhX0gANBkNhiNR1brOM+J38WZjSpTflkz3BAC0GozwdD4Yq4uGZb5bDy+T+sYYyOojnwRFIxNh9BAr1oFfwqT+QA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

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

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gMQAEAAiRhYMvDABNxMcbzjNeuCHF5hqGAOZD2vFmWjxebXhCzLmAd1bGruGL3IYAnuurMArq3EAdVoOGjgH15jcUReLwJiMlgIoNlHdgxCMIiARgoAVgoABljWAF8fH34IVhwYahMBXUxWRwB6ACMMOBgi3yIOTxDOLBNHXkCrcJBY0eGATXcxajtRVTYumSI0CqwKOLG8wtZizs4ZOBFPDGpxOAoWKUG41VIYc2ZqAGsUkFmMRixt9v597tmR0qXwgbGUQ2CAFoRgBVVoqDwgtgYKA6ZhkNi9MysKCObYgfJ0dDYPCIED8GoYOpNFowKi0EAMFjsXo8XgAZTcaHIEGksnktl4RFI5Ds1A8ynKswovAAcswsPZTormGAFOVeOJmIw3FoRH02HQxN1WAqxLwPqjMIxnho6cUhCIbsMIKERhT0bUGs1WnlgnAEiJkiN0llcuNgiQIIRSmEsOK2gVikcqeJTudncErjAwsgIgAFKCfGA4ZhQKTUWTHNNnCIAXTiHCOpXUuYLRcYJbLFarqfT9Z8O34gPjECRrHBcWh7eLpfLFQt8FH4-x+TrDF61Ec+GF0TpNHoIAAbhU4KDWPhUgSgA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

### Skill-Specific Extend Semantics

When `@extend` targets a skill definition, individual skill properties follow dedicated merge
strategies rather than the generic block merge rules:

| Strategy          | Properties                                                                                                                    |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| **Replace**       | `content`, `description`, `trigger`, `userInvocable`, `allowedTools`, `disableModelInvocation`, `context`, `agent`, `license` |
| **Append**        | `references`, `examples`, `requires`                                                                                          |
| **Shallow merge** | `params`, `inputs`, `outputs`                                                                                                 |

Example — overlay content and add a reference file without replacing the base skill's references:

```promptscript
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

The overlay's `references` list is appended to the base skill's list. The `content` field replaces
the base skill's content entirely.

#### Reference Negation

Use the `!` prefix to remove entries added by a lower layer:

```promptscript
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

Negation uses normalized path matching — `"!./references/foo.md"` matches `"references/foo.md"`.
If a negation doesn't match any base entry, a warning is logged during compilation.

Negation applies to append-strategy properties only (`references`, `requires`). The `!` prefix
is only meaningful in `@extend` blocks — using it in a base skill definition triggers a
validator warning (PS028).

#### Sealed Properties

The `sealed` property prevents higher layers from replacing specified skill properties:

```promptscript
@skills {
  code-review: {
    content: """
      Critical review workflow.
    """
    sealed: ["content"]
  }
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gMQAEAAiRhYMvDABNxMcbzjNeuCHF5hqGAOZD2vFmWjxebXhCzLmAd1bGruGL3IYAnuurMArq3EAdVoOGjgH15jcUReLwJiMlgIoNlHdgxCMIiARgoAVgoABljWAF8fH344AGtoKGVAqx1mKQBaahgANwgYczDq4OCWdk4sFJBYoZru3gBhahMIRgwoXibW9t5zZmpSsCgLCjjg4byxuBg56TDkCN6OdgiAXTjCgpB8m4Z+6kd8IlJyGCpaEAYzRgtAgbHwqSeQA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

If an `@extend` block attempts to override a sealed property, compilation fails:

```
ResolveError: Cannot override sealed property 'content' on skill (sealed by base definition)
```

Use `sealed: true` to seal all replace-strategy properties at once. Only the base skill
author can set `sealed` — overlays cannot add or remove it. Append-strategy properties
(`references`, `requires`) remain extendable even when `sealed: true` is set.

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

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAIkxYYABMAA6rQYIgATRIJEgSATwC0NZgCsYjLPLES4i9hkKz5ARgoAGK7tYBfMWO4RWOGNQhZB3FmQytFAHowajYOVilHVgBiQQBJMmZqLxCMAHM+djhBZUEAIyhmRgBrbIxqGEE+ajSYKUl2ZkFFZgBXakFIWCdWuEqfJJhAvsZ2z0Uevu8WCsDfcgh-RhhJ-tSMziw4QI44LBc0qNiAdU8cQQwoRezcy7gmjAA3DGgMAsqwJO8icMjWbl6a2o6UyW0CGDQEGUe38UnKUjKZUhIDsdHQ2DwiBAAz8AWCoXYnCkVFoIAYLEJXCxsQAyq00As6oJ7oJcJUiKRyJVqK1WNk3BUKIIAHLMLyYZKCZhgVluQRSIqtUHYCBsOgXCKCVhii6CCqXQSYErpGAUJx8ATCPSSGRybHzfxBEJhIm2fSGAQmO0WACsNhA1pIEEILlkWB5K3sThhEXh2VE4kELCkMFkyHkAAUoBhljhmFAUx0Y3DqJEQABda27fasNJpzPZ3P5wvMgSx0vyStR-4VPYebSqvlWxO5Bs5mB5gvuPXwcMQAdsWx2FFokCYXA8GZDeZXJammj0JguqkgWn0xn1FlswQcsiwPW8-nuU0inUSrzS2WVBWjZX7NUavU2peEI+pQIaObFCaZr-BaQgJhI0imPagxzMwd6LKwyxusyHrGMhvr+oGwahqyEZiA4-zFnGw4SMmqaCOmIBZuOk4ttRHYVlWs4HPWzGNhOzbThxZZdpR3C9nOC5DghOR2ixTZTh0kn9v+rBLiu6Ibli3DrKC2zVgcJKHhS4RYPgZ4MlcTJXnKt5cg+Q4Ci+oriuUH4yteP5KpsKoAbCWo6qBMAGkaUG1DBvD8PB1pIXaunAhsWQ7DxtY4QYRheuYFB+pYOFBiGrBhuR3bcCJ8bWvRfEKYJSmtrC8Kdtxey8YxY6KexbYlqJFFOCp85qRVI7yQJbHTv10kaaiWmYtiembNsEJQuVxlkkelLmdSgh0lZEA2U0172fePJOc+QquRBkqfl5ip-oO6oBcBupgRBxoRea0W0TayEJSCC3gpC0JdXG6V4VlICEXlAaJgVpHhq0kbieVX1VW1-GsUJRbA5xXYSIZtbVaNmP1e2PWlRNg1faO6MdeNs6qYOU3lgwmzUIo+BHfupIMI87hwIO+BmCiQA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

### How @use Differs from @inherit

| Feature              | `@inherit`                                    | `@use`                                        |
| -------------------- | --------------------------------------------- | --------------------------------------------- |
| **Quantity**         | Single parent only                            | Multiple allowed                              |
| **Semantics**        | "IS-A" (this project IS a TypeScript library) | "HAS-A" (this project HAS security standards) |
| **Purpose**          | Define fundamental project type               | Add optional capabilities                     |
| **Merge precedence** | Child overrides parent                        | Later @use overrides earlier                  |
| **@extend support**  | Always available                              | Only with alias                               |

### When to Use Which

**Use `@inherit` for:**

- Defining your project's fundamental type (library, backend, frontend)
- Building organizational hierarchies (base → team → project)
- When you want a single, clear inheritance chain

```promptscript
# This project IS a TypeScript library
@inherit @stacks/typescript-lib
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gMQAEAAiRhYMvDABNxMcbzjNeuCHF5hqGAOZD2vFmWjxebXhCzLmAd1bGruGL3IYAnuurMArq3EAdVoOGjgH15jcUReLwJiMlgIoNlHdgxCMIiARgoAVgoABljWAF8fHz4AFRwle1cAKxhGLF4ASQBlMV4SxzQYJsZqCDR6qAgAIzVqRx9+CFYcGF76-jgRRgBrOAB6LA74Hr6sAFpBoZB8unRsPEQQBaXVja24Hf6D4apaEAYWdk4sHl4mtzQ5Ag0lk8lsvCIpHIdmoHmUM2oMAovAAcsx6phqPVmGAFDNeOJmIw3FoRFgIGw6GJPLxWOjWoiMFB7BgVhokRMhCJeIErCEUldFqzbptOg9ek9DnlgnAEiJkuEQOksrkQHESBBCFMwlhYTAfIVfELPBhqOJlLzgiwpGFkBEAApQVkwHDMKBSaiyEQms0RAC6cQ4iym6ltDqdjBdbo9XowPu8IADBQmiMWvTqFNYFrie0Vjudrvds14qd1EAzbDy+WOfoY3zG+Eh0SRNHoIAAbrM4Jn8KljkA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

**Use `@use` for:**

- Adding optional capabilities (security, testing, quality)
- Mixing in reusable fragments
- When you need multiple imports

```promptscript
# This project HAS these capabilities
@use @core/security
@use @core/quality
@use @fragments/testing
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gMQAEAAiRhYMvDABNxMcbzjNeuCHF5hqGAOZD2vFmWjxebXhCzLmAd1bGruGL3IYAnuurMArq3EAdVoOGjgH15jcUReLwJiMlgIoNlHdgxCMIiARgoAVgoABljWAF8fHz4AFRwle1cAKxhGLF4ACQBBAGUFHHg7RgxMACNoEwh4H343ODt+FmoYAHpxxjdqE0cRsYmp2YBHNwwoZdXxgVUNLVMZjjgsCFZ1EHy6dGw8RBB+Y81OM4urm6paEAYLHYnx4vBabjQ5CGMjk7TsRFI5Ds1A8yg60wovAAcsx6phqPVmGA4bxxMwFqdsBA2HQxJ5eKxcWJeNNdvYMIwANYaGAUEZCES8QJWEIpV7vU5wc7wH7qPLBOAJETJcIgdJZXIgOIkCCEa5hLAomA+Qq+S4YTwYajiZTC4IsKRhZARAAKUA5MBwzCgUmoshElutEQAunFvtd1E7Xe7GJ7vb7-RbxFbvCBQwURtNLks6tTWLa4gBaVVuj1en0wP1Zw0QXNsPL5O7BhifaiOfAI6K8mj0EAAN0rcDz+FSdyAA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

### Merge Precedence

PromptScript 1.6 applies declarations in source order. Import merge policy and
later operations are separate decisions:

```promptscript
@meta { id: "service" syntax: "1.5.0" }

@inherit @stacks/typescript-lib
@use @core/security
@use @core/quality

@standards {
  deployment: ["Require approval"]
}

@override standards.testing {
  ["Use Vitest"]
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAIkxYYABMEEQAJokEAdEHBjUAbhEYwZguAE92GQpJkBGCgFYKABjUBfKa2vcIrHPIhZB3OAMYBrOAHosGtHhGagg0LABaKAgAI1sAVzlXFmoYHzlGOJD-eMTuZNSARziMKOybVjcBVjEMajE4YWtBQTEYcmYNPnZJZBkAJRgiiBTBDDQaZgUSmQBdayty7kn5ENb1Kpq6uAoOd3sAc0bWZt6QAFVEgDVneCxZ+ZALOnRsPEQQSowvX39AuGDQhEotEqLQQAwWOxOFh8ABiQQAZTi4yiMDE6mYglwMEERFI5Bx1DirAajhSFEEADlmC5MNQXMwwFjHC1mBkugIsBA2HRRtVBKwaaNBCkSoJMF4MPsYBRbHwBEdmuI9B93F9vH4AkEQmFIjEZE11FoBLppCBDCZzCBDSQIIR7JIsETVKwFp9qrV6orBCxWj0ZAAFKBfGA4ZhQVrUdYYD11e7HLG3A7+kBBkNhiPyaOxsTxt0pdwhRhctgNYCG8JmtMqDORkW3IslmzW12PGYMaHUDT4PFkSg0eggBTyODc1j4fSPIA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

Use [Composition and Precedence](../reference/language/composition.md) as the
normative source for conflict rules, declaration order, and resolved examples.
This guide focuses on designing inheritance hierarchies rather than restating
that matrix.

### Fragment Files

Create reusable fragments:

```promptscript
# @fragments/testing.prs
@meta {
  id: "@fragments/testing"
  syntax: "1.5.0"
}

@standards {
  testing: ["Use vitest as test framework", "Maintain 80% code coverage", "Write unit and integration tests"]
}

@shortcuts {
  "/test": {
    description: "Write comprehensive tests"
    content: "Write unit and integration tests for the current change."
  }
  "/coverage": {
    description: "Check test coverage"
    content: "Run coverage and report untested behavior."
  }
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gMQAEAAmGoYA5iU5Y4Aeg5wsEViKq0AOq37isGXsDW9eEACaJeKkIOFiJ02fMVm9vOAE92GQibMBGCgFYKAAwOrAC+amr8chishhjUhnA6jrYKIibIZgCqcDC8AG4QtrwYiUVCpDAA7szUANZmdKYgALIYCloKvAAcAQCkvCyGuSx5MJYwDU0A6tSFuQCurIXFMQbsMCLC8my8tnBmALpqYawRcDg1WIzzkkms+mYy8FhmJrr3+rxDcIyzaNusTwgGZzAbMMjUGA4ThwCCjXbPfYgRz6FjrdhAkEcXiLZbRQxrDibbAQHZ7XhgGq7aEDebUSHsAY4aIiGAUYL6E4PEBSEZjUQTJB3T5feC-CD-UmApoAYWhjFqCLkYNG4w5nzRHAxTQASosVfzWSsCZC0Jcces5DACQAjKEYAo1dnIj4nEIgEIHBgSajOfBEUjkNk0eggVWwtj4LweoA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

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

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gMQAEAAizIZWATwD0AIwxwYVWgB1W-EjCwZewJb14QAJol4KQg5sLFSZMY9t5xR7DIUPGAjBQAMnm6wC+SpX59TiwILFFNWxsQHx0ATWYAV14MahgU1l4AQQBJFLg4CDh1dhSsbIBhAFkAUV4K5mo0ClsAMWYoKGYAd14hTDFeAHNE4KgIVngMvV5JeHKaDEZQxngWzKMYraV-VkC04uoIZYg2OEiNgFpNgDkYADcYal4iNGZZPrS9EIgMKDhYrxrsZ2p0erw9NgNDRmBwTmxeG9xowIPAfL4QL4ALoMELUUT4IikchyGj0ECPWinVj4VyYoA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

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

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gMQAEAAizIZWATwD0Yamw6sAJlVoAdVvxIwsGXsBW9eEOYl5KQg5sLGTp7TnJO7ecUewyEjJgIwUADD-usAXxUVfghWHBhqCCwBIUxLACMMOBhg1QNOLGjRbQd7EH89AE1mAFdHNBhGCAwoCAAvGH1WXikZW145GAA3GChmNHV2CjyCsZUg1hCWG0IYnRbjcYLFgBUqnEdNRgBrIwAlGAxGLDpeVdFKgGVGKLRT3gA1aNTF-P8AkAC6dGw8RFMcREEiSKUU9CY7S4AL4V1KaHIEBgckczF4uCaRFI5Ca1FKrDgvAi1BgFF4ADlmDFMNQYswwOiIp1mIxSkNNFk2GcRCjWFTeFoSbVeJhdhgAOakkLqTS5RYGdyA8zxEHJVIrPROFxuJZeACsfg1vBIEEIYSMWDxr0m-DgmnkGGockJCz0LC6RmQJgAClBjjAcMwoF1qFseY67CAALoODh2sLiz0+v2MANBkNhh1OkwxwIhEl2qInCBsF0OAC0S19-sDwcivALlogxbYHy+UYYmWoonwWLIlBoEN6tBLrHwHi+QA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

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

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gMQAENzAFYxGWKrQA6rAAIkYWDL2BTevCABNEvCUxwiA1swCuWALQY0aHSt5wAnuwyEtOgIwUADJ+usAvlKlpCFY9aggsXmkWMgxWOwB6MGo2DlZ1AJkWdiII5VZVAWFRFxAAYT1GQxNeAEFLKAhGbAg2HxtrEB9VAFFTaLlqRhheRgqqiLAoZgB3XmnwnF4AZSwwtGHgjgBzama2CnbOo6lfEF86dGw8RBAo5hi4xOTstPF6JhTOLB5lo3qIGDqWzMXi4YZEUjkYbUIysOC8UIwCi8AByzAimGoEWYYFBel46mYjCMckcWBarDovFiQNY6OpvGoMAwUH4GEqGC2SMCcgUShsGhKdweCSSnzSXVsDgUzm0IHcAFZvJ18rwSBBCMEtKsjDAToE4Ao0hhqOp4XlVCx1DAtMgdAAFKDsmA4ZhQa3UWxG9Qm9IgAC6Ng4huCW1tDqdQ1d7pgnsNNN9OkDfkCTMNYVEFPNNlMcsdzujHsZ8FWjXJrRVp18-oYX2odnwELIlBo7wAbrG4BT8K4zkA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

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

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gMQAEAAiRhYMvDABNxMcbzjNeuCHF5hqGAOZD2vFmWjxebXhCzLmAd1bGruGL3IYAnuurMArq3EAdVoOGjgH15jcUReLwJiMlgIoNlHdgxCMIiARgoAVgoABljWAF8fHz4ASVYcGGoTDFZGO0YcDAhWRGKBXUxWRwB6ACMMODtAJMJ25jIantU2Dk9eEcVlSBjfZoqqrFHxru6p9k5xEHy6dGw8RBB+Domd1z3PKloQBhY7rB5eAGU3NHIIaVl5LZeERSOQ7NQPMo1jAKLwAHLMDaYagbZhgBQVXjiZiMNxaERYCBsOhiWasRFiXjUGAYKD2DCMADWGhhPj8Il4gSsIRSFyu212M28IDicASImS4RA6SyuRF3JIEEIzTCWAhMB8hV8cBEngw1HEyi5wRYUjCyAiAAUoAyYDhmFApNRZLrxPrhQBdOIcHXNdTmq02ur2x2VF01N0GiJegps6k6qqMQlsI1xAC0UuttpDTqp8DVECTRNYeXyhw9DE4asc+BB0RhNHoIAAbpU4MX8KlDkA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

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

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gMQAEAAiRhYMvDABNxMcbzjNeuCHF5hqGAOZD2vFmWjxebXhCzLmAd1bGruGL3IYAnuurMArq3EAdVoOGjgH15jcUReLwJiMlgIoNlHdgxCMIiARgoAVgoABljWAF8fHz4AVTg7OBwMamlZGEY3ahNHOkMANxhqJqkFGFIAWjg0eohIRh9+CFYcTpMBXUxWRwB6VTYOTwm3cvnmGuXyhqasRy2d-hZ9hagIDFZGGCLfIg2ZOBFPavE4CkPG5t4gSsYkkJggbAwUAASm5YHAwsgIgBhADKAAVeDMJJ04BEALo+fIgfJ0dDYPCIEAXZhkO4rNbsTjiKi0EAMFiMriUvgotxocgQWpyBQzXhEUjkOzUDzKGY1Ci8AByzCw9mqquYYBFdnEzAaWhEWHBrFadxkrBVYl4NUhasYAGsNDAKBMhCJAXEIKFwlSFnTVq5Od4QHE4AkRMkfeksrkQ8CSBBCFMwlhpY8ChN3mavsogcEWFIERE0VAMA8cMwoFJqLIPuIvvi4hx3lN1EWQCWyzAK1XOrXs9RgwSM74au8mowjWxc3F+j7O+XK9XrfBUxBJ8a8kSSWTcPhqVcaQK7g8WfQmOtOFgeLxefybkL5LYxVFJdaZZjOs6lZbMNQNVqz66vqV7YMapqeLwFqqqINpQHajrqM6rr+B6wJeikvp7DAyzXLc9yPHGwRhokkZpJkOR5MECZJqwKZpoSmZ1jmaH5swha8IiHalouvY1lmnyDo2wLNkarBtpxxY8d2S59gJ9ZCSAw6FKOq4TlOrAzsCc5SV2PbLmOa4bmwW7EniDBXtQjj4OK0TOjQ54dLQxr4KkxJAA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

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

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gMQAEAAiRhYMvDABNxMcbzjNeuCHF5hqGAOZD2vFmWjxebXhCzLmAd1bGruGL3IYAnuurMArq3EAdVoOGjgH15jcUReLwJiMlgIoNlHdgxCMIiARgoAVgoABljWAF8fH34IVhwYahMBXUxWRwB6VTYOTyLfFnYiLF5Aq15OADcIV1YtLDCaZnE3RiwINh9C1mKuzhlqeCxK2fnWZV7ggFpwkAA5eQ65SihmdVkRDjG4PKOT894pACM3O5YpPPyIHydHQ2DwiBA-BqGDqjRGLXEVFoIAYHRaWB4vAAym40OQINJZPJbP0ouQ7NQPMpyhsKLxzt1MNRuswwApyh9mIw3GNsLs6GJPLxWMxuqINhgoPYMIwANYaGAUYpCEQ9OIQUInKHMMgwhpNTqtEBxOAJETJE7pLK5Y19EgQQilMJbNwwRbFOAiTwYajifZxP4wMLICIABSgMpgOGYUCk1HuMPEPu8IAAunEOJ7Supg2GI4wozG4wnvb6IumCsUNp7tnM2P6+sc85Ho7GKrxq1sIDsFrbAflUwxOFtHPgiKRyUj6CABhU4Lt8KkgUA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

## Parameterized Inheritance (Templates)

PromptScript supports parameterized inheritance, allowing you to create reusable templates with configurable values. This is similar to generics in programming languages or Handlebars-like templates.

### Defining Parameters

Define parameters in the `@meta` block using the `params` field:

```promptscript
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

```promptscript
# project.prs
@meta {
  id: "my-app"
  syntax: "1.0.0"
}

@inherit @stacks/typescript-lib(projectName: "my-app", runtime: "node20")
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gMQAENzAFYxGWKrQA6rAAIkYWDL2BTevCABNEvCSBIBPALQY0aHSt5w97DIS06AjBQAMzs6wC+UqdIiscMaggsXmk4BUYAazgAeiw9NHhGQLQsAygIACMACgFhUQA5Uhg7XUNjUxA6XmoAV3YIORLWZnUYACYnHQBKEHc6dGw8RBBQ8KjY+MTk1PSM8XomNg4uYb4AZRqTdJh1C2ZeXBheIlJyI9rWOF5-ahgKXnzmYMxqYOYwA-9edWZGGrlrFgIGwqhhWLtmsFFLcMFB+BhIhgAOZ3bxyBRKcwaEqjBHjOIJOBJCApNKZNyqSzWWzaECOACsrhA5hIEEIvi0WFqMHML1IcC0ylYqlUuREWEKcgA-FowoFWEjeABeWknMiwCkii5A6Wyrm+RUqnRqs6azwebxhMHqDDUdRXIWqFitLTIHQABSgCJgOGYUFa1AsCnBtvUOgAuuYOGEDa6PV7GD6-QGg9bQxGpObpLc5RBRMDLpjhbwDLTPd7ff6AtV4Pr82w3O5euGGJwuXp8CbKDQFgA3AJwAv4ey9IA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

Or with `@use`:

```promptscript
@use ./fragments/testing(framework: "vitest", coverage: 90)
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gMQAEAAiRhYMvDABNxMcbzjNeuCHF5hqGAOZD2vFmWjxebXhCzLmAd1bGruGL3IYAnuurMArq3EAdVoOGjgH15jcUReLwJiMlgIoNlHdgxCMIiARgoAVgoABljWAF8fH343ODsKAHpVDS1TCo44LAhWdQAKaqFzZmoAaxSQADcTeCwIuh1mAZg1dRgwgE5sgEoQfLp0bDxEcBnauHqR5vUqWhAGFnZOLB5eAGU3NHIIaVl5W14iUnI7ag9lHGmMAovAAcswsPYMNQIcwwAoAbxxMxGG5atgIGxxhhPLxWOCxLxqDAMFBIYwehogcUhCJeIErCF+tVNFd9g0mi08sE4AkRMlwiB0llciA4iQIIRmmEsL8YHFMGoSHAwvTgsEOjAur0APxhRrUI68AC8As+0TlooZwRYUxmMF1uNRACNpsbeLkGYUCsVGtjxFDxMpVRMpGFkBEAApQDCMGA4ZhQKTUWQiTwBiIAXTi7KOYcj0dj8cTrt9aeo3hAWe9viJ+ogjCabCDcQAtAKozG4wmk4SRgaGxjWHl8qsMwwrtRHPgzd8TvRBtM4IP8KlVkA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

### Template Variables

Use `{{variable}}` syntax to reference parameters in content:

```promptscript
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

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAIkxYYABMAA6rQYIgATRIJEgOZKNhjyxEuAE92GQrPkBGCgAYTa8YMzVScWaIsSazAFYxGWAHKkYsuFmoQrADm6hKCGACuuMzUvv6BQYIAvHIgACowpOYSAL5ieaxi3NKcWBBYmsKhaiDZggCazBHh1DCCAO4xANYJgmzCwE6u7l58OTkUoWk4EHCW1C5uWJJzJBiBAoEwUoIARpXAwJHR1OOTFjXmBUVDS1UWrN52gwvDnt7joWsb66wwsQNjjgYp9WDkQDkALoMUrUTT4IikcgwKi0EAMABu-zgEDY+AMEKAA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

### Complete Example

=== "Template (Parent)"

    ```promptscript
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

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gMQAEAAnCwZGAazgB6ajBFYAtBjRoqtADqt+JGMN7B1vXhAAmiXqpCDhYydNkKl5-bzgBPdhkKnzARgoAGf0dWA0xqUjhTPWCDXhpmACsYRiwAOVIYUyFqCFYAcycQ5mosU1YAVxIAIxhqXgBeXgBmPxaC5yxs5NNK5mZYDGCGjrKYJwBfdQnWdX5jTiwILBddJ0cQIIMATWYy3gxpPd4AJRlk3iMYADcYKGY0Gt4AdyLRHNzeNl1gOMTktK0xmMKKt1qDJuoZix2EQsCtoj8kiUvgi-ulAU4LpcAMo1a7ULwgHBYLBoRASCS3RgYKA4ZhCRDAb5FLDo9bRLIQZIAWWYF0iwA5yXRrCmMyEAyM+yMcDhBhYfN4yHMABUXPcsYxsmhYYLYSReTBeJwMJVYEZzABdSYgMYWhjzagufBEUjkGAqeggPFwCBsfDeG1AA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

=== "Project (Child)"

    ```promptscript
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

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gMQAENzAFYxGWKrQA6rAAIkYWDL2BTevCABNEvCUxwiA1swCuWALQY0aHSt5wAnuwyEtOgIwUADJ+usAvlKlpCFY9aggsXmk4BUZ9OAB6ahgMUXNLAAoBYVEAOVIYFxAAYT1Y4wiAQUsdOn5maiwtAA4PFoBKAJkNTixwuyUbaxAfVQBNY1s0EQgMKAgALxg1Vl4YUxYSOWpGJcZSwxNeMChmAHc4CkHh66lfEF86dGw8RBAomLjE5NSLNHF6JhsDhcV58ADKRkscxg6lszF4uCWRFI5CW1CMrDgvFCMAovByzAimAavGYYARel46mYjCMckcvTYtQwrFhrEJvEUSVm-BS+gwAHNcYE5AoBis1JptG9onyEtyftVhhL7I5nNL3ABWbzK1QkCCEYJaLDomA2YmkOBaZQS1RZERYPJyAD8WmiYVYAt4AF5pciyLARqo6g1XbxWHSAEYwag+3geGz+PyBWWsjDUdRYm2qFjqAq8ZA6AAKUBSMBwzCgedjqfU6fUOgAujYONFggKtIWQCWyxWqzHbAo0xmm7dAkl3RBRBA2FmbKZpT2dn3q7wJyap4zWD47r5GwwetQ7Ph-aj-iAGAA3GNwGesfCue5AA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

=== "Resolved Output"

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

```
Error: Missing required parameter 'projectName' for template '@stacks/react-app'
```

**Unknown parameter:**

```
Error: Unknown parameter 'unknownParam' for template '@stacks/react-app'.
Available parameters: projectName, port, strict
```

**Type mismatch:**

```
Error: Type mismatch for parameter 'port': expected number, got string
```

**Invalid enum value:**

```
Error: Type mismatch for parameter 'mode': expected enum("dev", "prod"), got "staging"
```

### Best Practices

1. **Use descriptive parameter names** - `projectName` instead of `name`
2. **Provide sensible defaults** - Reduce required parameters
3. **Document parameters** - Add comments explaining each parameter
4. **Validate with enums** - Use enums for constrained choices
5. **Keep templates focused** - One purpose per template

```promptscript
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

## Replacing Complete Values

Use `@extend` when inherited content should be merged. Use `@override` with
syntax `1.5.0` when the complete existing value should be replaced:

```text
@meta { id: "project" syntax: "1.5.0" }
@inherit @company/base

@override standards.testing {
  ["Use Vitest"]
}

@extend standards {
  testing: ["Require coverage"]
}
```

The target must exist after preceding declarations are applied. Replacement is
atomic, and later declarations operate on the replacement. `field!` remains
supported for replacing one direct regular field inside `@extend`, but new code
should use `@override` when complete replacement is the intended operation.
Sealed skill properties cannot be replaced or removed.
