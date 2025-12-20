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
  code: {
    style: "functional"
    documentation: "JSDoc for public APIs"
  }
}

@shortcuts {
  "/help": "Show what you can help with"
  "/review": "Review code for quality issues"
  "/test": "Write unit tests"
}
```

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

### .github/copilot-instructions.md

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
