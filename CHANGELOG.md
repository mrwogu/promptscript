# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - UNRELEADED

🎉 **Initial Release** - A language for standardizing AI instructions across organizations.

### Language

- **PromptScript Syntax 1.0.0** - Initial language specification for `.prs` files
- **@meta block** - Metadata with `id` and `syntax` fields, optional `org`, `team`, `tags`
- **@inherit directive** - Single inheritance from registry namespaces or relative paths
- **@use directive** - Import fragments for composition with optional aliasing
- **@extend block** - Modify inherited blocks at any nesting level
- **Content blocks:**
  - `@identity` - AI persona definition
  - `@context` - Project context with key-value properties and text
  - `@standards` - Coding standards with nested objects (merged during inheritance)
  - `@restrictions` - Things AI should avoid (concatenated during inheritance)
  - `@shortcuts` - Custom commands (child overrides parent)
  - `@params` - Configurable parameters with types and defaults
  - `@guards` - Validation rules with `globs` for file targeting
  - `@skills` - Reusable AI workflows with tool permissions
  - `@local` - Private instructions (not committed to git)
  - `@knowledge` - Reference documentation
- **Value types:** Strings, numbers, booleans, null, arrays, objects, multi-line text (`"""`)
- **Type expressions:** `range(min..max)`, `enum("a", "b", "c")`

### Packages

#### @promptscript/core

- AST types and interfaces
- Error classes (`PSError`, `ParseError`, `ResolveError`, `ValidationError`)
- Utility functions for version comparison, paths, AST operations

#### @promptscript/parser

- Chevrotain-based lexer and parser
- CST to AST transformation
- `parse()` and `parseOrThrow()` API

#### @promptscript/resolver

- `@inherit`, `@use`, `@extend` resolution
- File loader with registry support

#### @promptscript/validator

- Required fields validation
- Semantic version format checking
- Custom rule support

#### @promptscript/compiler

- Resolve → Validate → Format pipeline
- Watch mode and dry-run support

#### @promptscript/formatters

- **GitHub Copilot** - `simple`, `multifile`, `full` versions
- **Claude Code** - `simple`, `multifile`, `full` versions
- **Cursor** - `modern`, `multifile`, `legacy` versions
- **Antigravity** - `simple`, `frontmatter` versions
- Output conventions: `markdown` or `xml`
- Base formatter class for custom implementations

#### @promptscript/cli

- `prs init` - Initialize project with auto-detection
- `prs compile` - Compile to target formats
- `prs validate` - Validate files
- `prs diff` - Show output diff
- `prs pull` - Pull registry updates
- `prs check` - Check configuration
- Shell completion for Bash, Zsh, Fish

### Configuration

- `promptscript.yaml` configuration file
- Input, registry, targets, validation, watch, output sections
- Environment variable support
- Plugin system

### Documentation

- Language reference
- CLI and configuration reference
- Getting started guide and tutorial
- API documentation for all packages

### Infrastructure

- Nx monorepo with pnpm workspaces
- TypeScript strict mode
- Vitest, ESLint, Prettier
- MkDocs documentation site
- GitHub Actions CI/CD

[1.0.0]: https://github.com/mrwogu/promptscript/releases/tag/v1.0.0
