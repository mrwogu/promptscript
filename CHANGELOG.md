# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Initial project setup
- Nx monorepo configuration with pnpm workspaces
- **@promptscript/core** - Core types, errors, and utilities
  - AST types (PromptScriptAST, Block, Meta, Guards)
  - Custom error classes (PSError, ParseError, ResolveError, ValidationError)
  - Utility functions (version comparison, path normalization, AST merge)
- **@promptscript/parser** - Chevrotain-based parser
  - Lexer with full token set
  - Grammar parser for PromptScript syntax
  - CST to AST visitor
  - `parse()` and `parseOrThrow()` functions
- **@promptscript/resolver** - Inheritance and import resolution
  - `@inherit` directive resolution
  - `@use` import resolution
  - `@extend` block extension
  - File loader with registry support
- **@promptscript/validator** - AST validation rules
  - Required meta fields (id, version)
  - Semantic version validation
  - Guard requirements
  - Blocked patterns
  - Path validation
  - Empty block detection
  - Custom rule support
- **@promptscript/compiler** - Pipeline orchestration
  - Resolve → Validate → Format pipeline
  - Formatter integration
  - Error aggregation and stats
- **@promptscript/formatters** - Output formatters (refactored)
  - GitHub Copilot formatter (.github/copilot-instructions.md)
  - Claude Code formatter (CLAUDE.md)
  - Cursor formatter (.cursor/rules/\*.mdc)
  - Base formatter class for custom implementations
  - Formatter registry for dynamic loading
- **@promptscript/cli** - Command-line interface
  - `prs init` - Initialize PromptScript project
  - `prs compile` - Compile to target formats
  - `prs validate` - Validate PromptScript files
  - `prs pull` - Pull updates from registry
  - `prs diff` - Show diff for compiled output

### Changed

### Deprecated

### Removed

### Fixed

### Security

## [0.1.0] - YYYY-MM-DD

### Added

- Initial release
- PromptScript parser
- Inheritance resolution
- Validation rules
- GitHub Copilot formatter
- Claude Code formatter
- Cursor formatter
- CLI tool

[Unreleased]: https://github.com/promptscript/promptscript/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/promptscript/promptscript/releases/tag/v0.1.0
