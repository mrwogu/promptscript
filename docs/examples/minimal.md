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
  id: "minimal-example"
  syntax: "1.5.0"
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
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAIkxYYABMAA6rQYIgATRIJEgSEVhBIYoAWiKlyMeWIlwAnuwyFZ8gIwUAbBQAMe1gF8xY7tM5YIWQ8P1yQPUDxQQBNZgBXQQxqGGjBHBgoNDAIqEEWKSUAc2i4OAg4AXZBMGZqQVxCwRpmACsYRiwKfwAxZkYIuEE2DNgMVjpBWIwpDAAjWAzmKRgWkKDHF1Y3FnYiLD8FwJ3-ABUcauqhPcM0GABlRmoINE3ahqbBLpzBEhmYanFx+HvqDCaEEY8HmEkWwWWbiKAzG1Ck3VEIUyMFkyH8YJAAFU4HFUqxAWw1DVqMxsv8SIpWLkioZYPI6OiAgARDoRPglNARSZAwQAQQACgBJboAd28OEEACkLizGI4JABdMSQ1jcOA4cpYTpYBH+eQAekSyXk5hAFw1IsEIpw2EEhkiGQGCSSaCt4vlAX1sQAbhAYCKTQEAEowX3+6azUrlQQARwiam8vkKcAi8A9Bo4RUD8gA6jcOM9lJtMzqliAnAqGJ5qIZ8FoyJQaPQQN7PgU2PgLOWgA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

### promptscript.yaml

```yaml
id: minimal-example
syntax: '1.5.0'

input:
  entry: .promptscript/project.prs

targets:
  - github:
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

Current configuration emits GitHub output only:

`.github/copilot-instructions.md`:

<!-- output:github for="minimal-example" -->

```markdown
# GitHub Copilot Instructions

## project

You are a helpful coding assistant for this project.
Focus on clean, readable code.

## Context

This is a TypeScript project using modern best practices.

## code-standards

### code

- Use functional programming style
- Document public APIs with JSDoc

## shortcuts

- /help: Show what you can help with
- /review: Review code for quality issues
- /test: Write unit tests
```

<!-- /output -->

## Adding More Targets

To also generate for Claude and Cursor:

```yaml
# promptscript.yaml
id: minimal-example
syntax: '1.5.0'

input:
  entry: .promptscript/project.prs

targets:
  - github:
      output: .github/copilot-instructions.md
  - claude:
      output: CLAUDE.md
  - cursor:
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
