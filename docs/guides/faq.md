---
title: FAQ & Troubleshooting
description: 'Answers to common PromptScript questions: supported AI tools, AGENTS.md, migration, privacy, installation, inheritance, private registries, CI/CD, and common errors.'
---

# FAQ & Troubleshooting

## What is PromptScript?

PromptScript is an open-source compiler for AI coding agent configuration. You write
instructions, skills, agents, MCP servers, hooks, and plugins in `.prs` files, and it generates
the native files for 50 tools, such as `CLAUDE.md`, `.github/copilot-instructions.md`, and
Cursor rules. New to the terms? See the [Glossary](../glossary.md).

## How many AI tools are supported?

PromptScript currently compiles to **50 AI coding agent targets**. See the full list in
[Target Platforms](../features/target-platforms.md) or the
[formatter matrix](../reference/formatters/index.md).

## How is it different from a shared AGENTS.md file?

`AGENTS.md` is one file that some tools read. PromptScript is the source behind it. It adds
inheritance across repositories, parameters, skills, agents, MCP servers, validation, and a
security scan, and it writes `AGENTS.md` together with the formats of every other tool.

## Can I start from the instruction files I already have?

Yes. `prs import` converts an existing `CLAUDE.md`, Copilot, Cursor, or `AGENTS.md` file,
`prs migrate` imports a whole project, and the built-in `promptscript` skill lets your AI
agent do the migration for you. See [Import Existing Instructions](import.md) and the
[Migration Guide](migration.md).

## Does PromptScript send my prompts anywhere?

No. Compilation runs on your machine or in your CI. Anonymous usage telemetry is on by
default and never includes source, prompts, compiled output, file paths, or project names.
Turn it off with `prs telemetry disable` or `DO_NOT_TRACK=1`. See
[Telemetry](../reference/telemetry.md).

## Is PromptScript free?

Yes. PromptScript is open source under the MIT license. The CLI is published on npm as
`@promptscript/cli`.

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
prs registry add @company https://github.com/your-org/promptscript-registry.git
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

Check your CLI version first, then update through the same method you used to install:

```bash
prs --version
```

```bash
npm update -g @promptscript/cli      # npm global install
npx @promptscript/cli@latest compile # npx, no install step
docker pull ghcr.io/mrwogu/promptscript:latest  # Docker
```

Formatter behavior can change between versions, so teams that pin the CLI version in CI should
upgrade the pin deliberately.

## How do I contribute?

See [CONTRIBUTING.md](https://github.com/mrwogu/promptscript/blob/main/CONTRIBUTING.md) for guidelines. Ways to help:

1. Add support for new AI tools (formatters)
2. Report bugs and suggest features
3. Improve documentation
4. Share PromptScript with your team
