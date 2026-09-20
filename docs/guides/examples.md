---
title: Examples (Few-Shot Prompting)
description: Teach AI assistants with structured input/output examples using @examples
---

# Examples (Few-Shot Prompting)

The `@examples` block provides structured few-shot examples that teach AI assistants the exact transformation or behavior you expect. Unlike free-text instructions, examples give the model concrete input/output pairs to learn from.

## Overview

Few-shot prompting is one of the most effective ways to guide AI behavior. Instead of describing what you want in abstract terms, you show the model what "good" looks like:

```mermaid
flowchart LR
    A["@examples block"] --> B["Structured pairs"]
    B --> C["## Examples section\nin output files"]
```

## Basic Syntax

Define examples at the top level using `@examples`:

```promptscript
@meta {
  id: "my-project"
  syntax: "1.2.0"
}

@examples {
  rename-variable: {
    input: "const x = 1"
    output: "const itemCount = 1"
  }
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAIkxYYABMAA6rQYIgATRIJEgSATwC0NZgCsYjLPLES4i9hkKz5ARgoAmCgAZdrAL5ix3IqXLxhewdU6kYygBuGNQQGABGsLKi4hKSrGgArlimTGxwWIKEggC8gmb2cYLMyUkpcmmsGZIcJADCJey5+YWCTo4gDgC6DJxY1Ir4bmSUNPQggTC0EGz4Zp1AA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

Each entry is a named example with `input` and `output` fields (both required).

## Example Properties

| Property      | Required | Description                               |
| ------------- | -------- | ----------------------------------------- |
| `input`       | Yes      | The input the AI receives                 |
| `output`      | Yes      | The expected output the AI should produce |
| `description` | No       | Human-readable label for the example      |

## Adding a Description

Use the optional `description` field to label what the example demonstrates:

```promptscript
@meta {
  id: "commit-style"
  syntax: "1.2.0"
}

@examples {
  feat-commit: {
    description: "Feature commit with scope"
    input: "Added user authentication with JWT tokens"
    output: "feat(auth): add JWT-based user authentication"
  }

  fix-commit: {
    description: "Bug fix commit"
    input: "Fixed null pointer in payment service"
    output: "fix(payments): resolve null pointer in charge handler"
  }
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAIkxYYABMAA6rQYIgATRIJFNmJEhCwBaOFgCeseWIlxN7DIVnyAjBQBMFAAy7WAXzFjuRUuXjC9gsDGyqWJRVZUXEJQSl4RmoINCwINlMQADE-LABXahhBQOUsQQB3FRxBOBY0GHtwyVY0dKwkgEEpSKlBdLgYakEMepxOeMZsBPEi3EEAKQB1ABVBLGYAa044KvDmerqGuXA0gApe3ABKWQwWydnVACMMTraOrp6+gYgh+LY1p1ZvSEIAxTyIW8EkiZRicRGSQAQukAOY+CCEHIAlRrCQQWr1JLJREwNqsdJQKCCNDMDEcboYkkYTR8dilLoAN1elRAwMEGywWySvz2mFpAzgJ0EWTgzCgjOyBKJJLJ7EeVMYOAw1Fh2WVrCksGonzEDhADgAugwBtRNPg3GRKDR6CBJbQRvgzAagA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

## Multi-Line Content

Use triple-quoted strings (`"""`) for multi-line inputs and outputs:

```promptscript
@meta {
  id: "refactoring-examples"
  syntax: "1.2.0"
}

@examples {
  extract-function: {
    description: "Extract inline logic into a named function"
    input: """
      const result = users
        .filter(u => u.active && u.role === 'admin')
        .map(u => u.email);
    """
    output: """
      function getActiveAdminEmails(users: User[]): string[] {
        return users
          .filter(u => u.active && u.role === 'admin')
          .map(u => u.email);
      }
    """
  }
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAIkxYYABMAA6rQYIgATRIJEhqMMBkZZm1CKwDmAWiKly8eWIlwAnuwyFZ8gIwUATBQAMx1gF8xY7vrKw4wiaCRFjUKlg6YACurKoQbLKi4hKCUvCMGmhY8aw2IACihKHhkqxQmjCCUMxaEIylaoJCrKQwUoLRsdlsbimlaFFYecYgQX0srHBYgopwUVDTALyCUXAwtGN9ghSQC+sAFFGCiwB8KxThEABulQBkt+fUzLDHi8sA5BhSJJrvAJSbPoUEgYNCHY5nKIUGAg6B-ADcmxGvRSzEGAyGclG2MBHRicTYgi0-AAgnEbiTvpp8rCoHBDmtaLIAKqM5AAXT+simGm0HMCyS2M34UWo4lW6zguKBuw41HBp3Olxugnuj2elTeHy+P1Y-2lKWBoIVkOhtIRuM8gqxyOSVvcIHc7IYnFCZnwvkMVFoIAYN1oOXwtkdQA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

Multi-line strings preserve formatting and are ideal for code examples.

## Examples Inside @skills

You can attach examples directly to a skill definition. This keeps the examples co-located with the skill they demonstrate:

```promptscript
@meta {
  id: "project-skills"
  syntax: "1.2.0"
}

@skills {
  commit: {
    description: "Create git commits following conventional format"
    examples: {
      basic: {
        input: "Added dark mode toggle to settings page"
        output: "feat(settings): add dark mode toggle"
      }

      with-breaking-change: {
        description: "Breaking change in API"
        input: "Renamed /users endpoint to /accounts"
        output: "feat(api)!: rename /users endpoint to /accounts"
      }
    }
    content: """
      When creating commits:
      1. Use conventional commit format: type(scope): description
      2. Keep the subject line under 72 characters
      3. Use imperative mood: "add feature" not "added feature"
    """
  }
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAIkxYYABMAA6rQYIgATRIJEgazAFYxGWALRwA1tChx5YiXACe7DIVnyAjBQBMFAAwHWAXzFju23XGGHBLEhIILFlRcQlBKXhGagg0LAg2SxAAYWoYbBhBAHNg-2ZA4J8wZigoZgB3CFZs-NYAN04EtgwoQRLqEmxnCMEiUnJ4UL9egCMMOAhGYfDeiWq0AFcQuRAAQSkoqUiMai1BEmYowSxmbOzYE+ZBOH4Emp9MbJgeuYlmZaWV+TAMrAAKW5Ye7ZOAASlkGE2Oz2ByOWVO51gr16blYIwiVVw6lG6QwOhq6kYOAwNRgMzeEiicBicWarGSACE8QTasTSc9JOI1gAFACSKLmC2WyQASpxSDBtgB6Ra3Wh9VhSNDMapYK6CaUYRgsRbsfQgDG9D5YL7JX7Yf4YNAQMEAQlk6VYks1cpgCs4ytV7A1Wp1H31gokaNRGJY7CayQMhtmEQA6jhOP48SD8oUsHBEEbBDZBABVW51RrsRLOtoBILqjpdFZYYxoGCAlgNiGRaKxeKl7P2QQAaRgMDQJ0TN0WoxUakEUGqWT1UWoggA7LZ-CTqNqOLRswBmCj5wsQMju7AQRpwo7JKHbC1YRbpeSCVjMdXyK9S9p-O8vGO9aOvNEuCALgALoME01DGPg-RkJQND0CAjS0KW+BWEBQA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

Skill-level examples appear in the skill's output file alongside its instructions.

## Multiple Examples

You can define as many named examples as needed. Names must be unique within a block:

```promptscript
@meta {
  id: "code-review-examples"
  syntax: "1.2.0"
}

@examples {
  missing-error-handling: {
    description: "Always wrap async calls in try/catch"
    input: """
      async function fetchUser(id: string) {
        const res = await fetch(`/api/users/${id}`);
        return res.json();
      }
    """
    output: """
      async function fetchUser(id: string) {
        try {
          const res = await fetch(`/api/users/${id}`);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        } catch (err) {
          logger.error('fetchUser failed', { id, err });
          throw err;
        }
      }
    """
  }

  prefer-const: {
    description: "Use const for values that never change"
    input: "let MAX_RETRIES = 3"
    output: "const MAX_RETRIES = 3"
  }

  explicit-return-type: {
    description: "Add return types to public functions"
    input: "function add(a: number, b: number) { return a + b; }"
    output: "function add(a: number, b: number): number { return a + b; }"
  }
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAIkxYYABMAA6rQYIgATRIJFNmUmAFpqMAG4QYAd2VFS5ePLES4AT3YZCs+QEYKAJgoAGY6wC+Ysd31lYcYRNBEgg4OAhWAHM9ampmamUcDFYpKAjI2VFxCUElOEZqCDQsCDYbEABBKG0MMwDtagw0QQxzVkZBRgwoKACIwSxqMwB6LqxGHDccyVY0AFcscuMQIOnWiw6wOfaStkEwfgmAVTgYagAKaVk4QfSASkDs6YkWVhvBNQCAXhaaiCx9occOcAAbDJoQYZzU60YYAEmA0ncILuAG5Vs81Fg5tRxJ8KAArOBsc5ojESTxPOQrGkY5gLeaLanLcktNqbbaMXbiA7jHAnM6XGSCG6FKIPLLPHKDMyPKXTV7vT6CH4YP4A3kTUHgtCQ6FnODwxFSZFkqlSiBgQTnACE+OYAGsHrg4tpBKwdIIAKKxeKggASABVAwAFQQI-E3bDQ03o82Y-g4vHwQnE1ikuPywTuTrYCbWs7UCWs6ZQZiRSJnCiFv0Ack1-Jh+ww0BgUlrdGEkikncL2bNWYkLuYbsLmfllKlk5yLJW2UpQRoMAOCUVTMlOTyBSK3PKAs6bHeYHignU3Tm8AGSQBHvUZ06SSiMCmOQijPKsABAFkKgANAD6ABKXqBoBACSXoAMoqoIADML4SPSWDvtSa6CD+AHAaBEHQT88FzhSXjZEQ5AQIw-yqImuLKFgZhoDAmQYluhTFKUrDlBUUhSB8VHiLR9EBFgzCCPMABGaQcjsbFwAhMwofIWxSXsGBcecGCyKwcwkKJZydqJGlaTpRZdliSYtIIADUgiiai2ayUh8ngJy3ItKp6nuoZunWQZ2lnHcPlGSZvHmVZNl2QRdkeCA7gALoMJwMr4L4hhULQIAMHetBsfgtjRUAA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

## How It Compiles

The `@examples` block compiles to a dedicated **Examples** section in the output instruction file.

Given this source:

```promptscript
@meta {
  id: "naming-examples"
  syntax: "1.2.0"
}

@examples {
  camel-case: {
    description: "Variable naming convention"
    input: "const user_name = 'Alice'"
    output: "const userName = 'Alice'"
  }
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAIkxYYABMAA6rQYIgATRIJEhWpCKwDmAWiKly8eWIlwAnuwyFZ8gIwUATBQAMu1gF8xY7prKw4wvYMakYUGp+cDCyouISglLwjNQQaFgQbGYgAGoYcRgARrCCiiTKKr5sAG6ciWwOkZKsaACuWCksrHBYgnUh1AD6+TCCALyCAOQAglAQjDBDVZHMDfWNckxsre2dAHL+A8NjE1Mzzk4gjgC6DOXUBvju2lS0IAxltEms+ObHQA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

The compiled output includes:

````markdown
## Examples

### Example: camel-case

Variable naming convention

**Input:**

```
const user_name = 'Alice'
```

**Output:**

```
const userName = 'Alice'
```
````

## Syntax Version

`@examples` requires syntax version `1.2.0` or higher:

```promptscript
@meta {
  id: "my-project"
  syntax: "1.2.0"    # Required for @examples
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAIkxYYABMAA6rQYIgATRIJEgSATwC0NZgCsYjLPLES4i9hkKz5ARgoAmCgAZ5EiQGJBAJRgBHAK4RqMKYLBmakFuIlJyeDEAXxAogF0GTixqRXwwskoaehAANxhaCDZ8M1igA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

If your file uses `syntax: "1.0.0"` or `"1.1.0"`, run:

```bash
prs validate --fix    # Automatically upgrades syntax version
```

## Best Practices

1. **Use descriptive names** — example names appear as section headings in the output.
2. **Add descriptions** — short labels help the AI understand the intent of each example.
3. **Keep inputs realistic** — use actual code or content your project will encounter.
4. **Group related examples in skills** — use skill-level `examples` when the examples apply to a specific skill.
5. **Use multi-line strings for code** — `"""..."""` preserves formatting for code snippets.
