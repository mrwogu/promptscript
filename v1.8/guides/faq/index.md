# FAQ & Troubleshooting

## What is PromptScript?

PromptScript is a language and toolchain for standardizing AI coding instructions across enterprise organizations. You write `.prs` files once and compile them to native formats for 37 AI coding agents - GitHub Copilot, Claude Code, Cursor, Windsurf, Cline, and more.

## How many AI tools are supported?

PromptScript currently compiles to **37 AI coding agents**. See the full list in the [formatter architecture guide](https://getpromptscript.dev/v1.8/guides/formatter-architecture/index.md) or the [ROADMAP](https://github.com/mrwogu/promptscript/blob/main/ROADMAP.md).

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

See the [Getting Started guide](https://getpromptscript.dev/v1.8/getting-started/index.md) for details.

## How does inheritance work?

PromptScript supports hierarchical inheritance with `@inherit` and `@use` directives:

- `@inherit` - Extend a base configuration (single inheritance)
- `@use` - Import and merge additional rule sets (multiple imports)

Sources can be local files (`./base`) or registry packages (`@company/standards`). See the [Inheritance guide](https://getpromptscript.dev/v1.8/guides/inheritance/index.md).

## How do I set up a private registry?

A registry is just a Git repository with `.prs` files. Configure it in your project:

```bash
prs registry add company https://github.com/your-org/promptscript-registry.git
```

See the [Registry guide](https://getpromptscript.dev/v1.8/guides/registry/index.md) for full setup instructions.

## How do I integrate with CI/CD?

Add PromptScript to your pipeline:

```bash
prs compile --check   # Fail if outputs are out of date
prs validate --strict  # Fail on any validation warnings
```

See the [CI/CD guide](https://getpromptscript.dev/v1.8/guides/ci/index.md).

## Common Errors

### `PS1001: File not found`

The `@inherit` or `@use` target cannot be resolved. Check:

- The file path is correct relative to the current file
- The registry is configured if using `@scope/package` syntax
- Run `prs registry list` to verify configured registries

### `PS2001: Unknown directive`

You used a directive that PromptScript doesn't recognize. Check the [Language Reference](https://getpromptscript.dev/v1.8/reference/language/index.md) for valid directives.

### `PS3001: Validation error`

A validation rule failed. The error message includes details on what's wrong and how to fix it. Run with `--verbose` for more context.

### Compiled output doesn't match expected format

Ensure you're using the latest version of `@promptscript/cli`. Formatter behavior can change between versions. Run:

```bash
prs --version
npm update -g @promptscript/cli
```

## How do I contribute?

See [CONTRIBUTING.md](https://github.com/mrwogu/promptscript/blob/main/CONTRIBUTING.md) for guidelines. Ways to help:

1. Add support for new AI tools (formatters)
1. Report bugs and suggest features
1. Improve documentation
1. Share PromptScript with your team
