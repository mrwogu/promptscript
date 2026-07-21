---
title: FAQ & Troubleshooting
description: Frequently asked questions about PromptScript
---

# FAQ & Troubleshooting

## What is PromptScript?

PromptScript is an agent platform configuration language and toolchain. You define instructions,
skills, agents, integrations, automation, and policy once, then compile native output for 48 AI
coding agent targets.

## How many AI tools are supported?

PromptScript currently compiles to **48 AI coding agent targets**. See the full list in
[Target Platforms](../features/target-platforms.md) or the
[formatter matrix](../reference/formatters/index.md).

## How do I install PromptScript?

```bash
npm install -g @promptscript/cli
```

Or use npx without installing:

```bash
npx @promptscript/cli compile
```

Or use Docker:

```bash
docker run --rm -v $(pwd):/workspace ghcr.io/mrwogu/promptscript compile
```

See the [Getting Started guide](../getting-started.md) for details.

## How does inheritance work?

PromptScript supports hierarchical inheritance with `@inherit` and `@use` directives:

- `@inherit` - Extend a base configuration (single inheritance)
- `@use` - Import and merge additional rule sets (multiple imports)

Sources can be local files (`./base`) or registry packages (`@company/standards`). See the [Inheritance guide](inheritance.md).

## How do I set up a private registry?

A registry is just a Git repository with `.prs` files. Configure it in your project:

```bash
prs registry add company https://github.com/your-org/promptscript-registry.git
```

See the [Registry guide](registry.md) for full setup instructions.

## How do I integrate with CI/CD?

Add PromptScript to your pipeline:

```bash
prs validate --strict  # Fail on any validation warnings
prs compile --strict   # Compile configured targets and fail on output conflicts
```

See the [CI/CD guide](ci.md).

## Common Errors

### `PS2001: File not found`

The `@inherit` or `@use` target cannot be resolved. Check:

- The file path is correct relative to the current file
- The registry is configured if using `@scope/package` syntax
- Run `prs registry list` to verify configured registries

### `PS1001: Unexpected token`

The parser encountered invalid syntax, such as an unknown directive or misplaced token. Check the
reported location and compare it with the [Language Reference](../reference/language.md).

### `PS3001: Required field`

A required field is missing. The error message identifies the block and field to add. Other
validation failures use `PS3000` or a more specific `PS300x` code.

### Compiled output doesn't match expected format

Ensure you're using the latest version of `@promptscript/cli`. Formatter behavior can change between versions. Run:

```bash
prs --version
npm update -g @promptscript/cli
```

## How do I contribute?

See [CONTRIBUTING.md](https://github.com/mrwogu/promptscript/blob/main/CONTRIBUTING.md) for guidelines. Ways to help:

1. Add support for new AI tools (formatters)
2. Report bugs and suggest features
3. Improve documentation
4. Share PromptScript with your team
