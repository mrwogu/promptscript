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
    "Use functional programming style"
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
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-hACaIAEAHRAkAngFoazAFYxGWYYNb9+cUewyEBwgIwUADAcWsAvkqUABXpywQso-sCUrFIYyoCazAK78M1GD9+HBgoNDBvKH4WHghWAHM-ODgIOCwMdn4wZmp+XFT+KVl5Cmd+ADFmRm84fjZo2Ay6fgCMHgwAI1ho5h4YUuUhN2GlM1ZLFnYiLEcy13d+ABUcAoKMJdE0GABlRmoINBmiuRmauMSSXphqZQ74I+oMeQhGeAGXEbdTc1YLNIz2tQeLUnIMYjABMgyh8AKpwQIRVjPNgYKJSeKPEgkc6qeywBYfAAiVW8JBshW8XRe-AAggAFACStQA7nYcPwAFLbYmMBYAXVGPz+OByWGqWBBcxAAHoQmFhNoQNsRcz+MycNh+KIfNEMsFQmg1WyFsJpQEAG4QGDMhVDABKMEt1p6fSyOX4AEdvKi7A5UnBvPATTKOGlbcIAOr7Dj8bysOx5e5wYwmEAmPkMGzUUT4Iikcj9Gj0EDm64pNj4HRpoA" target="_blank" rel="noopener noreferrer">
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

    `.cursorrules`

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
    output: .cursorrules
```

Then:

```bash
prs compile
```

## Next Steps

- Add more detailed [standards](../reference/language.md#standards)
- Add [restrictions](../reference/language.md#restrictions) for safety
- Consider [team setup](team-setup.md) for multiple projects
