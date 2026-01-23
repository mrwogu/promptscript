# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0-alpha.1](https://github.com/mrwogu/promptscript/compare/v1.0.0-alpha.1...v1.0.0-alpha.1) (2026-01-23)


### ⚠ BREAKING CHANGES

* All packages now use ES Modules. Consumers must use ESM imports.
* All packages now use ES Modules. Consumers must use ESM imports.

### Features

* cli ([d6cfb7c](https://github.com/mrwogu/promptscript/commit/d6cfb7c5ee7262fcfb63f3ee79333fadfb39ee34))
* **cli/diff:** support pager ([c5133f7](https://github.com/mrwogu/promptscript/commit/c5133f7a58f0f03323c8fa925387178e823d9415))
* **cli:** add Antigravity to AI tool detection ([809d055](https://github.com/mrwogu/promptscript/commit/809d055d9b9308059306c6dd8d5893ecdfe8f3b5))
* **cli:** add chokidar watch mode and --registry flag ([afe30a9](https://github.com/mrwogu/promptscript/commit/afe30a93171ae2f08ea3d022b30a1356deca0627))
* **cli:** add Codecov bundle analysis ([b93568f](https://github.com/mrwogu/promptscript/commit/b93568f81835dd62517ff5f290687dd5ef9cb4da))
* **cli:** force init ([5275c14](https://github.com/mrwogu/promptscript/commit/5275c14b9559f16cbc1b4aecf2f8edcf520e51ff))
* **core:** config schema ([2692b4d](https://github.com/mrwogu/promptscript/commit/2692b4d51e1fb20c4df35b5ce6b8264369910bcb))
* **formatters:** copilot agents support ([886f6fc](https://github.com/mrwogu/promptscript/commit/886f6fca9d0a7cd276997a31e62618ef0153322f))
* interactive cli init ([3f77d28](https://github.com/mrwogu/promptscript/commit/3f77d28c1f7644cb9c0620ab4b9f94c01d1ea243))
* **resolver:** add Git registry support for remote configuration sharing ([555e488](https://github.com/mrwogu/promptscript/commit/555e4883c26b45661965d5994cbaf7f43b928d26))
* support conventions ([3ccea55](https://github.com/mrwogu/promptscript/commit/3ccea55eb92e3374a2613bbf975c7b4cae80fcf5))


### Bug Fixes

* **cli:** change registry configuration default to No ([0927050](https://github.com/mrwogu/promptscript/commit/0927050523df7a659ea5eff47c11ae11dba976a6))


### Miscellaneous Chores

* prepare alpha.1 release ([01bb952](https://github.com/mrwogu/promptscript/commit/01bb952a967566c0dcd61b80eec2119c06966167))


### Code Refactoring

* migrate to pure ESM ([72d0333](https://github.com/mrwogu/promptscript/commit/72d0333580c688c617831885c13a270619817d5b))
* migrate to pure ESM ([8a59387](https://github.com/mrwogu/promptscript/commit/8a59387d6f81ee9db33c46db8e737fe52e705c2e))

## [1.0.0-alpha.1](https://github.com/mrwogu/promptscript/compare/v1.0.0-alpha.0...v1.0.0-alpha.1) (2026-01-23)


### Features

* **cli:** add Antigravity to AI tool detection ([809d055](https://github.com/mrwogu/promptscript/commit/809d055d9b9308059306c6dd8d5893ecdfe8f3b5))
* **resolver:** add Git registry support for remote configuration sharing ([555e488](https://github.com/mrwogu/promptscript/commit/555e4883c26b45661965d5994cbaf7f43b928d26))


### Bug Fixes

* **cli:** change registry configuration default to No ([0927050](https://github.com/mrwogu/promptscript/commit/0927050523df7a659ea5eff47c11ae11dba976a6))


### Miscellaneous Chores

* prepare alpha.1 release ([01bb952](https://github.com/mrwogu/promptscript/commit/01bb952a967566c0dcd61b80eec2119c06966167))

## [1.0.0-alpha.0] - 2026-01-22

### Added

🎉 **PromptScript Language Implementation** - A language for standardizing AI instructions across organizations.

#### Language Features

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

#### Formatters

- **GitHub Copilot** - `simple`, `multifile`, `full` versions with agents support (`.github/copilot-instructions.md`, `.github/agents/`, `.github/skills/`)
- **Claude Code** - `simple`, `multifile`, `full` versions with local memory support (`CLAUDE.md`, `.claude/agents/`, `.claude/skills/`, `CLAUDE.local.md`)
- **Cursor** - `modern`, `multifile`, `legacy` versions (`.cursor/rules/project.mdc`, `.cursorrules`)
- **Google Antigravity** - `simple`, `frontmatter` versions (`.agent/rules/project.md`)
- Output conventions: `markdown` (default) and `xml`
- Path-specific rule generation with glob patterns

#### Internal Packages (bundled into CLI)

- `core` - AST types, error classes, utility functions
- `parser` - PromptScript parser with recovery support
- `resolver` - Resolution for `@inherit`, `@use`, `@extend` with registry support
- `validator` - Semantic validation with custom rule support
- `compiler` - Compilation pipeline with watch mode
- `formatters` - Multiple formatter implementations

#### CLI Features

- `prs init` - Project initialization with auto-detection
  - Tech stack detection (TypeScript, JavaScript, Python, Rust, Go, Java, Ruby, PHP, C#)
  - Framework detection (React, Vue, Angular, Next.js, Django, FastAPI, Express, NestJS, etc.)
  - Existing AI tools detection (GitHub Copilot, Claude Code, Cursor)
  - Interactive configuration wizard
- `prs compile` - Multi-file compilation with watch mode and dry-run support
- `prs validate` - File validation with detailed error reporting
- `prs diff` - Show compilation diff
- `prs pull` - Registry updates

#### Configuration

- `promptscript.yaml` - Project configuration
- Registry configuration with authentication support
- Target configuration for multiple AI platforms
- Validation rules configuration

#### Documentation

- Complete language reference
- API documentation for all 6 packages
- CLI reference guide
- Getting started guide and tutorial
- Multiple examples (minimal, enterprise, skills & local, team setup)
- Package READMEs with ecosystem diagrams

#### Infrastructure

- Nx monorepo with pnpm workspaces
- TypeScript strict mode with 100% type coverage
- Pure ESM packages with NodeNext module resolution
- Comprehensive test suite (Vitest)
- ESLint and Prettier
- Husky pre-commit hooks (format, lint, schema validation)
- TypeDoc for automated API documentation
- MkDocs documentation site with versioning support (mike)
- GitHub Actions CI/CD pipeline
- Code coverage tracking

### Internal Architecture

> All packages below are internal and bundled into `@promptscript/cli`. They are not published separately.

#### core

- AST types and interfaces
- Error classes (`PSError`, `ParseError`, `ResolveError`, `ValidationError`)
- Utility functions for version comparison, paths, AST operations
- Config types: `input`, `watch`, `output`, `registry` with auth support
- Utility exports: `formatPath()`, `diagnostics`, constants

#### parser

- Chevrotain-based lexer and parser
- CST to AST transformation
- `parse()` and `parseOrThrow()` API
- `parseFile()` function with recovery option
- Error recovery for better diagnostics

#### resolver

- `@inherit`, `@use`, `@extend` resolution
- File loader with registry support
- `RegistryInterface` for custom registry implementations
- Standalone `resolve()` function for programmatic use

#### validator

- Required fields validation
- Semantic version format checking
- Custom rule support
- Standalone `validate()` function
- `removeRule()` API for dynamic rule management
- `formatters` export for formatting validation results

#### compiler

- Resolve → Validate → Format pipeline
- Watch mode with chokidar for file monitoring
- Dry-run support
- Standalone `compile()` function

#### formatters

- **GitHub Copilot** - `simple`, `multifile`, `full` versions with agents support
- **Claude Code** - `simple`, `multifile`, `full` versions
- **Cursor** - `modern`, `multifile`, `legacy` versions
- **Antigravity** - `simple`, `frontmatter` versions
- Output conventions: `markdown` or `xml`
- Base formatter class for custom implementations
- Standalone `format()` functions for each formatter

#### cli (published)

- `prs init` - Initialize project with auto-detection
  - Tech stack detection (TypeScript, JavaScript, Python, Rust, Go, Java, Ruby, PHP, C#)
  - Framework detection (React, Vue, Angular, Next.js, Django, FastAPI, etc.)
  - Existing AI tools detection (GitHub, Claude, Cursor)
- `prs compile` - Compile to target formats with watch mode support
- `prs validate` - Validate files
- `prs diff` - Show output diff
- `prs pull` - Pull registry updates with `--registry` flag

### Configuration

- `promptscript.yaml` configuration file
- Registry and targets configuration with authentication
- Validation rules configuration
- Support for multiple output formats per target

### Documentation

- Complete language reference
- CLI and configuration reference
- Getting started guide and tutorial
- API documentation for all 6 packages
- Multiple examples and best practices

### Infrastructure

- Nx monorepo with pnpm workspaces
- TypeScript strict mode
- Pure ESM packages with NodeNext module resolution
- Comprehensive test suite with Vitest
- ESLint and Prettier for code quality
- Husky pre-commit hooks
- TypeDoc for automated API documentation
- MkDocs documentation site with versioning (mike)
- GitHub Actions CI/CD pipeline
