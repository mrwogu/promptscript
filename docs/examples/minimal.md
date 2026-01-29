---
title: Minimal Example
description: The simplest PromptScript configuration
---

# Minimal Example

The simplest possible PromptScript setup for a single project.

## Project Structure

```
my-project/
├── .promptscript/
│   └── project.prs
├── promptscript.yaml
├── .github/
│   └── copilot-instructions.md  # Generated
└── ...
```

## Files

### .promptscript/project.prs

```promptscript
@meta {
  id: "my-project"
  syntax: "1.0.0"
}

@identity {
  """
  You are a helpful coding assistant for this project.
  Focus on clean, readable code.
  """
}

@context {
  """
  This is a TypeScript project using modern best practices.
  """
}

@standards {
  code: [
    "Use functional programming style",
    "Document public APIs with JSDoc"
  ]
}

@shortcuts {
  "/help": "Show what you can help with"
  "/review": "Review code for quality issues"
  "/test": "Write unit tests"
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAIkxYYABMAA6rQYIgATRIJEgSATwC0NZgCsYjLPLES4i9hkKz5ARgoAGK7tYBfMWO7TOWCFkXC9ckLt-jBAE1mAFdBDGoYcMEcGCg0MBCoQRYpCFYAc3C4OAg4AXZBMGZqQVw8wTVNbQpvADFmRhC4QTYU2AxWOkFIjCkMACNYFOYpGFqAv1sHVicWdiIsL0nfVe8AFRwKiqF1xTQYAGVGagg0JaqtJeb0rJJRmGpxAfgL6gxtCEZ4CYkp-xmTnynX61CkLVEAVSMFkyG8fxAAFU4FFEqxPmwMMk1Bl3iQSLdBPlFLB5HR4T4ACKNEJ8QpoEJDL6CACCAAUAJItADu7hwggAUodqYxbBIALpiQGsbhwHAlLBNLAQ7zyAD0sXi8lMIEO8u5gm5OGwgkUoRSnRicTQhr5Yp8asiADcIDBudqfAAlGAut0jMZFEqCACOISx7k8eTgIXg9vVHHyHvkAHVThxBCFWO4yq84NMQHZxQxXNRFPgiKRyOMaPQQE7Hrk2PgzAWgA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

### promptscript.yaml

```yaml
input:
  entry: .promptscript/project.prs

targets:
  github:
    enabled: true
    output: .github/copilot-instructions.md
```

## Usage

### Initialize

If starting from scratch:

```bash
prs init
```

### Compile

Generate the output file:

```bash
prs compile
```

### Validate

Check for issues:

```bash
prs validate
```

## Generated Output

=== "GitHub Copilot"

    `.github/copilot-instructions.md`

    ```markdown
    # AI Instructions

    ## Identity

    You are a helpful coding assistant for this project.
    Focus on clean, readable code.

    ## Context

    This is a TypeScript project using modern best practices.

    ## Standards

    - Code style: functional
    - Documentation: JSDoc for public APIs

    ## Shortcuts

    - `/help` - Show what you can help with
    - `/review` - Review code for quality issues
    - `/test` - Write unit tests
    ```

=== "Claude Code"

    `CLAUDE.md`

    ```markdown
    # AI Instructions

    ## Identity

    You are a helpful coding assistant for this project.
    Focus on clean, readable code.

    ## Context

    This is a TypeScript project using modern best practices.

    ## Standards

    - Code style: functional
    - Documentation: JSDoc for public APIs

    ## Shortcuts

    - `/help` - Show what you can help with
    - `/review` - Review code for quality issues
    - `/test` - Write unit tests
    ```

=== "Cursor"

    `.cursor/rules/project.mdc`

    ```text
    # AI Instructions

    ## Identity

    You are a helpful coding assistant for this project.
    Focus on clean, readable code.

    ## Context

    This is a TypeScript project using modern best practices.

    ## Standards

    - Code style: functional
    - Documentation: JSDoc for public APIs

    ## Shortcuts

    - /help - Show what you can help with
    - /review - Review code for quality issues
    - /test - Write unit tests
    ```

## Adding More Targets

To also generate for Claude and Cursor:

```yaml
# promptscript.yaml
input:
  entry: .promptscript/project.prs

targets:
  github:
    enabled: true
    output: .github/copilot-instructions.md

  claude:
    enabled: true
    output: CLAUDE.md

  cursor:
    enabled: true
    output: .cursor/rules/project.mdc
```

Then:

```bash
prs compile
```

## Next Steps

- Add more detailed [standards](../reference/language.md#standards)
- Add [restrictions](../reference/language.md#restrictions) for safety
- Consider [team setup](team-setup.md) for multiple projects
