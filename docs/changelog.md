---
title: Changelog
description: PromptScript version history
---

# Changelog

All notable changes to PromptScript.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial documentation site with MkDocs Material
- Complete language reference
- CLI command reference
- API documentation for all packages
- Getting started guide and tutorial
- Inheritance and enterprise setup guides
- Example configurations

## [0.1.0] - 2026-01-19

### Added
- **@promptscript/core**: Core types, errors, and utilities
  - AST type definitions
  - Error classes (ParseError, ValidationError, ResolutionError)
  - Utility functions (deepMerge, parsePath, formatPath)
  
- **@promptscript/parser**: Chevrotain-based parser
  - Full PromptScript syntax support
  - Error recovery mode
  - Source location tracking
  
- **@promptscript/resolver**: Inheritance resolution
  - Single inheritance via `@inherit`
  - Composition via `@use`
  - File system and HTTP registries
  - Block merging strategies
  
- **@promptscript/validator**: AST validation
  - Required field validation
  - Semantic validation rules
  - Configurable rule severity
  - Auto-fix suggestions
  
- **@promptscript/compiler**: Pipeline orchestration
  - Full compilation pipeline
  - Watch mode support
  - Caching for performance
  
- **@promptscript/formatters**: Output formatters
  - GitHub Copilot formatter
  - Claude Code formatter
  - Cursor formatter
  
- **@promptscript/cli**: Command-line interface
  - `prs init` - Initialize project
  - `prs compile` - Compile to targets
  - `prs validate` - Validate files
  - `prs diff` - Show compilation diff

### Language Features
- `@meta` block with required id and version
- `@inherit` for single inheritance
- `@use` for composition
- `@identity` for persona definition
- `@context` for project context
- `@standards` for coding standards
- `@restrictions` for safety rules
- `@shortcuts` for custom commands
- `@params` for configurable parameters
- `@guards` for runtime validation
- `@knowledge` for reference documentation
- `@extend` for modifying inherited blocks

### Configuration
- YAML configuration file support
- Multi-target output
- Registry configuration
- Validation settings

---

## Version History

| Version | Date | Highlights |
|---------|------|------------|
| 0.1.0 | 2026-01-19 | Initial release |

---

## Migration Guides

### Migrating to 0.1.0

This is the initial release. See [Migration Guide](guides/migration.md) for migrating from existing AI instruction files.

---

## Deprecation Policy

- Deprecated features are announced at least one minor version before removal
- Deprecated features include migration guides
- Security fixes may require immediate breaking changes

---

## Release Schedule

PromptScript follows a regular release schedule:

- **Patch releases**: As needed for bug fixes
- **Minor releases**: Monthly for new features
- **Major releases**: As needed for breaking changes

---

## Links

- [GitHub Releases](https://github.com/mrwogu/promptscript/releases)
- [npm Packages](https://www.npmjs.com/org/promptscript)
- [Migration Guide](guides/migration.md)
